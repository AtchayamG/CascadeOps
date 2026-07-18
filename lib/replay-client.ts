import type {
  ApprovalDecision,
  CompilationReceipt,
  OperationalArtifact,
  PatchProposal,
  VerificationAssertion,
} from "./contracts";
import { ARTIFACTS, CHANGE_ID, NEW_VALUES, POLICY_V1, POLICY_V2, STALE_VALUES } from "./fixtures";

function latestDecisions(decisions: ApprovalDecision[]): Map<string, "approve" | "reject"> {
  return new Map(decisions.map((decision) => [decision.patchId, decision.decision]));
}

export function compileReplayCandidates(
  patches: PatchProposal[],
  decisions: ApprovalDecision[],
): OperationalArtifact[] {
  const latest = latestDecisions(decisions);
  for (const patch of patches) {
    if (latest.get(patch.id) !== "approve") {
      throw new Error(`Candidate compilation blocked: '${patch.id}' lacks explicit approval.`);
    }
  }
  const candidates = structuredClone(ARTIFACTS);
  for (const patch of patches) {
    const block = candidates
      .find((artifact) => artifact.id === patch.location.artifactId)
      ?.blocks.find((candidateBlock) => candidateBlock.anchorId === patch.location.anchorId);
    if (!block || block.text !== patch.beforeText) {
      throw new Error(`Candidate compilation blocked at '${patch.location.anchorId}'.`);
    }
    block.text = patch.afterText;
  }
  return candidates;
}

export function verifyReplayCandidates(
  candidates: OperationalArtifact[],
  patches: PatchProposal[],
): VerificationAssertion[] {
  const assertions: VerificationAssertion[] = [];
  let assertionNumber = 0;
  const push = (assertion: Omit<VerificationAssertion, "id">) => {
    assertionNumber += 1;
    assertions.push({ id: `assert.${assertionNumber}`, ...assertion });
  };

  for (const patch of patches) {
    const text =
      candidates
        .find((artifact) => artifact.id === patch.location.artifactId)
        ?.blocks.find((block) => block.anchorId === patch.location.anchorId)?.text ?? "";
    const stale = STALE_VALUES.filter((value) => text.includes(value));
    push({
      kind: "stale-value-absent",
      artifactId: patch.location.artifactId,
      anchorId: patch.location.anchorId,
      expected: `No stale value (${STALE_VALUES.join(", ")}) remains at '${patch.location.anchorId}'.`,
      passed: stale.length === 0,
      detail:
        stale.length === 0
          ? `No stale value found in: "${text}"`
          : `Stale value '${stale[0]}' still present in: "${text}"`,
    });
    const hasNewValue = NEW_VALUES.some((value) => text.includes(value));
    push({
      kind: "new-value-present",
      artifactId: patch.location.artifactId,
      anchorId: patch.location.anchorId,
      expected: `New value (${NEW_VALUES.join(", ")}) present at '${patch.location.anchorId}'.`,
      passed: hasNewValue,
      detail: hasNewValue ? `New value found in: "${text}"` : `No new value found in: "${text}"`,
    });
  }

  const changedAnchors = new Set(
    patches.map((patch) => `${patch.location.artifactId}#${patch.location.anchorId}`),
  );
  for (const original of ARTIFACTS) {
    const candidate = candidates.find((artifact) => artifact.id === original.id);
    const originalAnchors = original.blocks.map((block) => block.anchorId);
    const candidateAnchors = candidate?.blocks.map((block) => block.anchorId) ?? [];
    const anchorsIntact =
      candidateAnchors.length === originalAnchors.length &&
      originalAnchors.every(
        (anchorId) => candidateAnchors.filter((candidateAnchor) => candidateAnchor === anchorId).length === 1,
      );
    push({
      kind: "anchor-intact",
      artifactId: original.id,
      expected: `All ${originalAnchors.length} anchors of '${original.id}' exist exactly once.`,
      passed: anchorsIntact,
      detail: anchorsIntact
        ? `Anchors intact: ${originalAnchors.join(", ")}`
        : `Anchor set changed: expected [${originalAnchors.join(", ")}], got [${candidateAnchors.join(", ")}]`,
    });
    const untouched = original.blocks.filter(
      (block) => !changedAnchors.has(`${original.id}#${block.anchorId}`),
    );
    const mutated = untouched.filter(
      (block) => candidate?.blocks.find((candidateBlock) => candidateBlock.anchorId === block.anchorId)?.text !== block.text,
    );
    push({
      kind: "untouched-unchanged",
      artifactId: original.id,
      expected: `All ${untouched.length} non-applied blocks of '${original.id}' are byte-identical to the original.`,
      passed: mutated.length === 0,
      detail:
        mutated.length === 0
          ? `Unchanged blocks verified: ${untouched.map((block) => block.anchorId).join(", ") || "none"}`
          : `Unexpected mutation at '${mutated[0]?.anchorId}'.`,
    });
  }
  return assertions;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildReplayReceipt(
  candidates: OperationalArtifact[],
  patches: PatchProposal[],
  decisions: ApprovalDecision[],
  assertions: VerificationAssertion[],
): Promise<CompilationReceipt> {
  if (assertions.some((assertion) => !assertion.passed)) {
    throw new Error("Receipt blocked: deterministic verification failed.");
  }
  const latest = latestDecisions(decisions);
  const approved = patches.filter((patch) => latest.get(patch.id) === "approve").length;
  const rejected = patches.filter((patch) => latest.get(patch.id) === "reject").length;
  if (approved !== patches.length || rejected > 0) {
    throw new Error("Receipt blocked: every target requires explicit approval.");
  }
  return {
    runId: `run.${crypto.randomUUID()}`,
    mode: "replay",
    simulated: true,
    model: null,
    policyId: POLICY_V1.id,
    fromVersion: POLICY_V1.version,
    toVersion: POLICY_V2.version,
    changeIds: [CHANGE_ID],
    patchSummary: {
      proposed: patches.length,
      approved,
      rejected,
      applied: patches.length,
      verified: patches.length,
    },
    assertions,
    residualRisks: [],
    createdAt: new Date().toISOString(),
    contentHash: await sha256(JSON.stringify(candidates)),
  };
}
