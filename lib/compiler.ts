import { createHash, randomUUID } from "node:crypto";
import type { z } from "zod";
import {
  type ApprovalDecision,
  type ClauseChange,
  type CompilationReceipt,
  type ImpactFinding,
  type OperationalArtifact,
  type PatchProposal,
  type PolicyDocument,
  type ProviderMode,
  type VerificationAssertion,
  LIVE_MODEL,
  fail,
} from "./contracts";

// Compiler core (blueprint §6, §9, §10). Fail closed: every violation throws
// a typed CompilerFailure; partial payloads are never merged.

// --- Clause diff (deterministic, never a model) ---------------------------

export function diffPolicies(from: PolicyDocument, to: PolicyDocument): ClauseChange[] {
  const changes: ClauseChange[] = [];
  const toById = new Map(to.clauses.map((c) => [c.id, c]));
  for (const before of from.clauses) {
    const after = toById.get(before.id);
    if (!after) {
      changes.push(change(before.id, "removed", before.text, null));
    } else if (after.text !== before.text) {
      changes.push(change(before.id, "modified", before.text, after.text));
    }
  }
  const fromIds = new Set(from.clauses.map((c) => c.id));
  for (const added of to.clauses) {
    if (!fromIds.has(added.id)) changes.push(change(added.id, "added", null, added.text));
  }
  return changes;
}

function change(
  clauseId: string,
  changeType: ClauseChange["changeType"],
  beforeText: string | null,
  afterText: string | null,
): ClauseChange {
  return { id: clauseId.replace(/^clause\./, "change."), clauseId, changeType, beforeText, afterText };
}

// --- Envelope + payload validation (§9) -----------------------------------

export interface ValidationContext {
  changes: ClauseChange[];
  artifacts: OperationalArtifact[];
}

export function parseStrict<S extends z.ZodType>(schema: S, raw: unknown): z.infer<S> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    fail("CO-VAL-009", `Payload failed schema validation: ${issue ? `${issue.path.join(".")} ${issue.message}` : "invalid"}`);
  }
  return parsed.data;
}

function findBlock(ctx: ValidationContext, artifactId: string, anchorId: string) {
  const artifact = ctx.artifacts.find((a) => a.id === artifactId);
  if (!artifact) fail("CO-VAL-002", `Unknown artifact ID '${artifactId}'.`, artifactId);
  const block = artifact.blocks.find((b) => b.anchorId === anchorId);
  if (!block) fail("CO-VAL-003", `Unknown location anchor '${anchorId}' in '${artifactId}'.`, anchorId);
  return block;
}

function requireCitation(ctx: ValidationContext, changeId: string, subjectId: string): ClauseChange {
  const cited = ctx.changes.find((c) => c.id === changeId);
  if (!cited) fail("CO-VAL-001", `Unknown clause change ID '${changeId}'.`, subjectId);
  return cited;
}

export function validateImpacts(findings: ImpactFinding[], ctx: ValidationContext): ImpactFinding[] {
  const targets = new Set<string>();
  for (const f of findings) {
    const cited = requireCitation(ctx, f.changeId, f.id);
    if (f.clauseId !== cited.clauseId) {
      fail("CO-VAL-005", `Impact '${f.id}' cites clause '${f.clauseId}', which is not the changed clause of '${f.changeId}'.`, f.id);
    }
    const block = findBlock(ctx, f.location.artifactId, f.location.anchorId);
    if (f.location.excerpt !== block.text) {
      fail("CO-VAL-006", `Impact '${f.id}' excerpt does not match '${f.location.anchorId}'.`, f.id);
    }
    const target = `${f.location.artifactId}#${f.location.anchorId}`;
    if (targets.has(target)) fail("CO-VAL-007", `Duplicate impact target '${target}'.`, f.id);
    targets.add(target);
  }
  return findings;
}

export function validatePatches(
  patches: PatchProposal[],
  ctx: ValidationContext & { findings: ImpactFinding[] },
): PatchProposal[] {
  const byAnchor = new Map<string, PatchProposal>();
  for (const p of patches) {
    requireCitation(ctx, p.changeId, p.id);
    const finding = ctx.findings.find((f) => f.id === p.impactId);
    if (!finding) fail("CO-VAL-004", `Patch '${p.id}' does not cite a validated Impact Finding ('${p.impactId}').`, p.id);
    if (finding.changeId !== p.changeId) {
      fail("CO-VAL-004", `Patch '${p.id}' cites change '${p.changeId}' but its impact cites '${finding.changeId}'.`, p.id);
    }
    if (finding.location.artifactId !== p.location.artifactId || finding.location.anchorId !== p.location.anchorId) {
      fail("CO-VAL-004", `Patch '${p.id}' targets a different location than its cited impact.`, p.id);
    }
    const block = findBlock(ctx, p.location.artifactId, p.location.anchorId);
    if (p.beforeText !== block.text) {
      fail("CO-VAL-006", `Patch '${p.id}' beforeText does not match the current text of '${p.location.anchorId}'.`, p.id);
    }
    const expectedAfter = p.beforeText.replaceAll("30 days", "14 days").replaceAll("30-day", "14-day");
    if (p.afterText !== expectedAfter || p.afterText === p.beforeText) {
      fail("CO-VAL-008", `Patch '${p.id}' is not the bounded refund-window replacement.`, p.id);
    }
    const anchorKey = `${p.location.artifactId}#${p.location.anchorId}`;
    const existing = byAnchor.get(anchorKey);
    if (existing) {
      const identical = existing.beforeText === p.beforeText && existing.afterText === p.afterText;
      fail(
        identical ? "CO-VAL-007" : "CO-VAL-008",
        identical
          ? `Duplicate patch target '${anchorKey}'.`
          : `Conflicting patches target '${anchorKey}'.`,
        p.id,
      );
    }
    byAnchor.set(anchorKey, p);
  }
  return patches;
}

// --- Approval decisions + apply (§6.1) ------------------------------------

// Latest human decision per patch wins (decisions are in submission order).
export function effectiveDecisions(
  decisions: ApprovalDecision[],
  patches: PatchProposal[],
): Map<string, "approve" | "reject"> {
  const patchIds = new Set(patches.map((p) => p.id));
  const latest = new Map<string, "approve" | "reject">();
  for (const d of decisions) {
    if (!patchIds.has(d.patchId)) {
      fail("CO-STATE-001", `Approval decision targets unknown patch '${d.patchId}'.`, d.patchId);
    }
    latest.set(d.patchId, d.decision);
  }
  return latest;
}

export interface ApplyResult {
  candidates: OperationalArtifact[];
  patches: PatchProposal[]; // status "applied"
}

// Applies approved patches to deep-copied candidates; originals never mutate.
export function applyPatches(
  artifacts: OperationalArtifact[],
  patches: PatchProposal[],
  decisions: ApprovalDecision[],
): ApplyResult {
  if (patches.length === 0) fail("CO-STATE-002", "No patches to apply.");
  const latest = effectiveDecisions(decisions, patches);
  for (const p of patches) {
    const decision = latest.get(p.id);
    if (decision === "reject") {
      fail("CO-STATE-002", `Apply blocked: patch '${p.id}' is rejected; every targeted patch must be approved.`, p.id);
    }
    if (decision !== "approve") {
      fail("CO-STATE-002", `Apply blocked: patch '${p.id}' has no explicit approval decision.`, p.id);
    }
    if (p.status !== "proposed" && p.status !== "approved") {
      fail("CO-STATE-001", `Patch '${p.id}' is in state '${p.status}' and cannot be applied.`, p.id);
    }
  }
  const candidates: OperationalArtifact[] = structuredClone(artifacts);
  for (const p of patches) {
    const artifact = candidates.find((a) => a.id === p.location.artifactId);
    const block = artifact?.blocks.find((b) => b.anchorId === p.location.anchorId);
    if (!block) fail("CO-VAL-003", `Unknown location anchor '${p.location.anchorId}'.`, p.id);
    if (block.text !== p.beforeText) {
      fail("CO-VAL-006", `Patch '${p.id}' beforeText does not match the current text of '${p.location.anchorId}'.`, p.id);
    }
    block.text = p.afterText;
  }
  return {
    candidates,
    patches: patches.map((p) => ({ ...p, status: "applied" as const })),
  };
}

// --- Deterministic verification (§10, no model) ---------------------------

export interface VerificationValues {
  staleValues: string[];
  newValues: string[];
}

export function verifyCandidates(
  originals: OperationalArtifact[],
  candidates: OperationalArtifact[],
  appliedPatches: PatchProposal[],
  values: VerificationValues,
): VerificationAssertion[] {
  const assertions: VerificationAssertion[] = [];
  let n = 0;
  const push = (a: Omit<VerificationAssertion, "id">) => assertions.push({ id: `assert.${++n}`, ...a });

  const candidateBlock = (artifactId: string, anchorId: string) =>
    candidates.find((a) => a.id === artifactId)?.blocks.find((b) => b.anchorId === anchorId);

  for (const p of appliedPatches) {
    const { artifactId, anchorId } = p.location;
    const text = candidateBlock(artifactId, anchorId)?.text ?? "";
    const stale = values.staleValues.filter((v) => text.includes(v));
    push({
      kind: "stale-value-absent",
      artifactId,
      anchorId,
      expected: `No stale value (${values.staleValues.join(", ")}) remains at '${anchorId}'.`,
      passed: stale.length === 0,
      detail: stale.length === 0 ? `No stale value found in: "${text}"` : `Stale value '${stale[0]}' still present in: "${text}"`,
    });
    const hasNew = values.newValues.some((v) => text.includes(v));
    push({
      kind: "new-value-present",
      artifactId,
      anchorId,
      expected: `New value (${values.newValues.join(", ")}) present at '${anchorId}'.`,
      passed: hasNew,
      detail: hasNew ? `New value found in: "${text}"` : `No new value found in: "${text}"`,
    });
  }

  const appliedAnchors = new Set(appliedPatches.map((p) => `${p.location.artifactId}#${p.location.anchorId}`));
  for (const original of originals) {
    const candidate = candidates.find((a) => a.id === original.id);
    const originalAnchors = original.blocks.map((b) => b.anchorId);
    const candidateAnchors = candidate?.blocks.map((b) => b.anchorId) ?? [];
    const intact =
      candidateAnchors.length === originalAnchors.length &&
      originalAnchors.every((id) => candidateAnchors.filter((c) => c === id).length === 1);
    push({
      kind: "anchor-intact",
      artifactId: original.id,
      expected: `All ${originalAnchors.length} anchors of '${original.id}' exist exactly once.`,
      passed: intact,
      detail: intact ? `Anchors intact: ${originalAnchors.join(", ")}` : `Anchor set changed: expected [${originalAnchors.join(", ")}], got [${candidateAnchors.join(", ")}]`,
    });
    const untouched = original.blocks.filter((b) => !appliedAnchors.has(`${original.id}#${b.anchorId}`));
    const mutated = untouched.filter(
      (b) => candidate?.blocks.find((cb) => cb.anchorId === b.anchorId)?.text !== b.text,
    );
    push({
      kind: "untouched-unchanged",
      artifactId: original.id,
      expected: `All ${untouched.length} non-applied blocks of '${original.id}' are byte-identical to the original.`,
      passed: mutated.length === 0,
      detail:
        mutated.length === 0
          ? `Unchanged blocks verified: ${untouched.map((b) => b.anchorId).join(", ") || "none"}`
          : `Unexpected mutation at '${mutated[0]?.anchorId}'.`,
    });
  }
  return assertions;
}

// --- Receipt (§10, §11) ---------------------------------------------------

export function contentChecksum(candidates: OperationalArtifact[]): string {
  return createHash("sha256").update(JSON.stringify(candidates), "utf8").digest("hex");
}

export function buildReceipt(args: {
  mode: ProviderMode;
  policy: { policyId: string; fromVersion: string; toVersion: string };
  changes: ClauseChange[];
  patches: PatchProposal[]; // applied patches
  decisions: ApprovalDecision[];
  assertions: VerificationAssertion[];
  candidates: OperationalArtifact[];
}): CompilationReceipt {
  const failed = args.assertions.filter((a) => !a.passed);
  if (failed.length > 0) {
    const staleFailed = failed.some((a) => a.kind === "stale-value-absent");
    fail(
      staleFailed ? "CO-VER-002" : "CO-VER-001",
      `Export blocked (CO-EXP-001): ${failed.length} verification assertion(s) failed.`,
      failed[0]?.artifactId,
    );
  }
  const latest = effectiveDecisions(args.decisions, args.patches);
  const approved = args.patches.filter((p) => latest.get(p.id) === "approve").length;
  const rejected = args.patches.filter((p) => latest.get(p.id) === "reject").length;
  if (rejected > 0 || approved !== args.patches.length) {
    fail("CO-STATE-003", "A rejected or undecided patch cannot appear in a receipt.");
  }
  return {
    runId: `run.${randomUUID()}`,
    mode: args.mode,
    simulated: args.mode === "replay",
    model: args.mode === "live" ? LIVE_MODEL : null,
    policyId: args.policy.policyId,
    fromVersion: args.policy.fromVersion,
    toVersion: args.policy.toVersion,
    changeIds: args.changes.map((c) => c.id),
    patchSummary: {
      proposed: args.patches.length,
      approved,
      rejected,
      applied: args.patches.length,
      verified: args.patches.length,
    },
    assertions: args.assertions,
    residualRisks: [],
    createdAt: new Date().toISOString(),
    contentHash: contentChecksum(args.candidates),
  };
}
