import {
  ImpactFindingsEnvelopeSchema,
  PatchProposalsEnvelopeSchema,
  type ApprovalDecision,
  type CompilerProvider,
  type ImpactFinding,
  type PatchProposal,
  type ProviderMode,
  fail,
} from "./contracts";
import {
  applyPatches,
  buildReceipt,
  diffPolicies,
  parseStrict,
  validateImpacts,
  validatePatches,
  verifyCandidates,
} from "./compiler";
import {
  AFFECTED_ANCHORS,
  ARTIFACTS,
  DEPENDENCIES,
  NEW_VALUES,
  POLICY_V1,
  POLICY_V2,
  STALE_VALUES,
} from "./fixtures";

export async function analyzePolicy(provider: CompilerProvider) {
  const changes = diffPolicies(POLICY_V1, POLICY_V2);
  if (changes.length !== 1) fail("CO-VAL-009", "Fixture must produce exactly one clause change.");
  const change = changes[0];
  if (!change) fail("CO-VAL-009", "Fixture clause change is missing.");

  const rawImpacts = await provider.proposeImpacts({ change, artifacts: ARTIFACTS, dependencies: DEPENDENCIES });
  const impactEnvelope = parseStrict(ImpactFindingsEnvelopeSchema, rawImpacts);
  const impacts = validateImpacts(impactEnvelope.payload, { changes, artifacts: ARTIFACTS });

  const rawPatches = await provider.proposePatches({ findings: impacts, artifacts: ARTIFACTS });
  const patchEnvelope = parseStrict(PatchProposalsEnvelopeSchema, rawPatches);
  const patches = validatePatches(patchEnvelope.payload, { changes, artifacts: ARTIFACTS, findings: impacts });
  requireCanonicalCoverage(impacts, patches);

  return { changes, impactEnvelope: { ...impactEnvelope, payload: impacts }, patchEnvelope: { ...patchEnvelope, payload: patches } };
}

function requireCanonicalCoverage(impacts: ImpactFinding[], patches: PatchProposal[]) {
  const expected = new Set(AFFECTED_ANCHORS.map((x) => `${x.artifactId}#${x.anchorId}`));
  const impactTargets = new Set(impacts.map((x) => `${x.location.artifactId}#${x.location.anchorId}`));
  const patchTargets = new Set(patches.map((x) => `${x.location.artifactId}#${x.location.anchorId}`));
  if (impacts.length !== 5 || patches.length !== 5 || expected.size !== impactTargets.size || expected.size !== patchTargets.size) {
    fail("CO-VAL-009", "Provider must return exactly the five canonical targets.");
  }
  for (const target of expected) {
    if (!impactTargets.has(target) || !patchTargets.has(target)) fail("CO-VAL-003", `Missing canonical target '${target}'.`, target);
  }
}

export interface CompilationInput {
  mode: ProviderMode;
  impacts: ImpactFinding[];
  patches: PatchProposal[];
  decisions: ApprovalDecision[];
}

export function compileCandidates(args: CompilationInput) {
  const changes = diffPolicies(POLICY_V1, POLICY_V2);
  const impacts = validateImpacts(args.impacts, { changes, artifacts: ARTIFACTS });
  const patches = validatePatches(args.patches, { changes, artifacts: ARTIFACTS, findings: impacts });
  requireCanonicalCoverage(impacts, patches);
  return applyPatches(ARTIFACTS, patches, args.decisions);
}

export function completeCompilation(args: CompilationInput) {
  const changes = diffPolicies(POLICY_V1, POLICY_V2);
  const applied = compileCandidates(args);
  const assertions = verifyCandidates(ARTIFACTS, applied.candidates, applied.patches, {
    staleValues: STALE_VALUES,
    newValues: NEW_VALUES,
  });
  const receipt = buildReceipt({
    mode: args.mode,
    policy: { policyId: POLICY_V1.id, fromVersion: POLICY_V1.version, toVersion: POLICY_V2.version },
    changes,
    patches: applied.patches,
    decisions: args.decisions,
    assertions,
    candidates: applied.candidates,
  });
  return { candidates: applied.candidates, patches: applied.patches.map((p) => ({ ...p, status: "verified" as const })), assertions, receipt };
}
