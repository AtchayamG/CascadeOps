import { describe, it, expect } from "vitest";
import {
  diffPolicies,
  validateImpacts,
  validatePatches,
  verifyCandidates,
} from "../../lib/compiler";
import {
  POLICY_V1,
  POLICY_V2,
  ARTIFACTS,
  EXPECTED_IMPACTS,
  EXPECTED_PATCHES,
  STALE_VALUES,
  NEW_VALUES,
} from "../../lib/fixtures";
import type {
  ImpactFinding,
  PatchProposal,
  OperationalArtifact,
  ClauseChange,
  PolicyDocument,
  CompilerError,
} from "../../lib/contracts";
import { CompilerFailure } from "../../lib/contracts";

function computePolicyDiff(v1: PolicyDocument, v2: PolicyDocument): ClauseChange[] {
  return diffPolicies(v1, v2);
}

function validateImpactFindings(
  findings: ImpactFinding[],
  changes: ClauseChange[],
  artifacts: OperationalArtifact[],
): CompilerError[] {
  try {
    validateImpacts(findings, { changes, artifacts });
    return [];
  } catch (error) {
    if (error instanceof CompilerFailure) {
      return [error.error];
    }
    throw error;
  }
}

function validatePatchProposals(
  patches: PatchProposal[],
  findings: ImpactFinding[],
  artifacts: OperationalArtifact[],
): CompilerError[] {
  try {
    const changes = diffPolicies(POLICY_V1, POLICY_V2);
    validatePatches(patches, { changes, artifacts, findings });
    return [];
  } catch (error) {
    if (error instanceof CompilerFailure) {
      return [error.error];
    }
    throw error;
  }
}

function runVerification(
  originals: OperationalArtifact[],
  candidates: OperationalArtifact[],
  appliedPatches: PatchProposal[],
) {
  const assertions = verifyCandidates(
    originals,
    candidates,
    appliedPatches.map((p) => ({ ...p, status: "applied" })),
    { staleValues: STALE_VALUES, newValues: NEW_VALUES }
  );
  return { assertions, passed: assertions.every((a) => a.passed) };
}

const FIXTURE_POLICY_V1 = POLICY_V1;
const FIXTURE_POLICY_V2 = POLICY_V2;
const FIXTURE_ARTIFACTS = ARTIFACTS;
const REPLAY_IMPACT_FINDINGS = EXPECTED_IMPACTS;
const REPLAY_PATCH_PROPOSALS = EXPECTED_PATCHES;

describe("CascadeOps Compiler Core", () => {
  describe("Policy Diff", () => {
    it("computes exactly one Clause Change for refund window", () => {
      const changes = computePolicyDiff(FIXTURE_POLICY_V1, FIXTURE_POLICY_V2);
      expect(changes).toHaveLength(1);
      expect(changes[0].clauseId).toBe("clause.refund-window");
      expect(changes[0].changeType).toBe("modified");
      expect(changes[0].beforeText).toContain("30 days");
      expect(changes[0].afterText).toContain("14 days");
    });
  });

  describe("Impact Findings Validation", () => {
    it("passes for correct golden path findings", () => {
      const changes = computePolicyDiff(FIXTURE_POLICY_V1, FIXTURE_POLICY_V2);
      const errors = validateImpactFindings(REPLAY_IMPACT_FINDINGS, changes, FIXTURE_ARTIFACTS);
      expect(errors).toHaveLength(0);
    });

    it("fails with CO-VAL-001 for unknown changeId", () => {
      const changes = computePolicyDiff(FIXTURE_POLICY_V1, FIXTURE_POLICY_V2);
      const badFindings: ImpactFinding[] = [
        {
          ...REPLAY_IMPACT_FINDINGS[0],
          changeId: "change.non-existent",
        },
      ];
      const errors = validateImpactFindings(badFindings, changes, FIXTURE_ARTIFACTS);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("CO-VAL-001");
    });

    it("fails with CO-VAL-002 for unknown artifactId", () => {
      const changes = computePolicyDiff(FIXTURE_POLICY_V1, FIXTURE_POLICY_V2);
      const badFindings: ImpactFinding[] = [
        {
          ...REPLAY_IMPACT_FINDINGS[0],
          location: {
            ...REPLAY_IMPACT_FINDINGS[0].location,
            artifactId: "artifact.non-existent",
          },
        },
      ];
      const errors = validateImpactFindings(badFindings, changes, FIXTURE_ARTIFACTS);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("CO-VAL-002");
    });

    it("fails with CO-VAL-003 for unknown anchorId", () => {
      const changes = computePolicyDiff(FIXTURE_POLICY_V1, FIXTURE_POLICY_V2);
      const badFindings: ImpactFinding[] = [
        {
          ...REPLAY_IMPACT_FINDINGS[0],
          location: {
            ...REPLAY_IMPACT_FINDINGS[0].location,
            anchorId: "sop.step-non-existent",
          },
        },
      ];
      const errors = validateImpactFindings(badFindings, changes, FIXTURE_ARTIFACTS);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("CO-VAL-003");
    });
  });

  describe("Patch Proposals Validation", () => {
    it("passes for correct golden path patches", () => {
      const errors = validatePatchProposals(REPLAY_PATCH_PROPOSALS, REPLAY_IMPACT_FINDINGS, FIXTURE_ARTIFACTS);
      expect(errors).toHaveLength(0);
    });

    it("fails with CO-VAL-006 for beforeText mismatch", () => {
      const badPatches: PatchProposal[] = [
        {
          ...REPLAY_PATCH_PROPOSALS[0],
          beforeText: "- Verify that the order timestamp is within the 100-day window.",
        },
      ];
      const errors = validatePatchProposals(badPatches, REPLAY_IMPACT_FINDINGS, FIXTURE_ARTIFACTS);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("CO-VAL-006");
    });

    it("fails with CO-VAL-007 for duplicate patch target", () => {
      const badPatches: PatchProposal[] = [
        REPLAY_PATCH_PROPOSALS[0],
        {
          ...REPLAY_PATCH_PROPOSALS[0],
          id: "patch.duplicate-target",
        },
      ];
      const errors = validatePatchProposals(badPatches, REPLAY_IMPACT_FINDINGS, FIXTURE_ARTIFACTS);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("CO-VAL-007");
    });
  });

  describe("Deterministic Verification Engine", () => {
    it("passes for correctly applied candidate artifacts", () => {
      // Setup candidate updates
      const updatedCandidates = FIXTURE_ARTIFACTS.map((art) => {
        const artPatches = REPLAY_PATCH_PROPOSALS.filter((p) => p.location.artifactId === art.id);
        if (artPatches.length === 0) return art;
        const newBlocks = art.blocks.map((block) => {
          const patch = artPatches.find((p) => p.location.anchorId === block.anchorId);
          if (patch) return { ...block, text: patch.afterText };
          return block;
        });
        return { ...art, blocks: newBlocks };
      });

      const result = runVerification(FIXTURE_ARTIFACTS, updatedCandidates, REPLAY_PATCH_PROPOSALS);
      expect(result.passed).toBe(true);
      expect(result.assertions.filter((a) => a.passed)).toHaveLength(result.assertions.length);
    });

    it("fails verification if stale value is still present", () => {
      // Mutate a block in candidates to still contain "30 days"
      const badCandidates = JSON.parse(JSON.stringify(FIXTURE_ARTIFACTS)) as OperationalArtifact[];
      const step2Block = badCandidates[0].blocks.find((b) => b.anchorId === "sop.step-2.eligibility");
      if (step2Block) {
        step2Block.text = "Step 2: Confirm the purchase was made within the last 30 days before approving the refund."; // Unmodified
      }

      const result = runVerification(FIXTURE_ARTIFACTS, badCandidates, REPLAY_PATCH_PROPOSALS);
      expect(result.passed).toBe(false);
      const staleAbsentAsserts = result.assertions.filter((a) => a.kind === "stale-value-absent");
      expect(staleAbsentAsserts.some((a) => !a.passed)).toBe(true);
    });

    it("fails verification if untouched block is modified", () => {
      const updatedCandidates = JSON.parse(JSON.stringify(FIXTURE_ARTIFACTS)) as OperationalArtifact[];
      // Mutate step-1 which should not be touched
      updatedCandidates[0].blocks[0].text = "Modified untouched content.";

      const result = runVerification(FIXTURE_ARTIFACTS, updatedCandidates, REPLAY_PATCH_PROPOSALS);
      expect(result.passed).toBe(false);
      const untouchedAsserts = result.assertions.filter((a) => a.kind === "untouched-unchanged");
      expect(untouchedAsserts.some((a) => !a.passed)).toBe(true);
    });
  });
});
