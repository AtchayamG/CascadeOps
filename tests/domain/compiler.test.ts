import { describe, expect, it } from "vitest";
import { CompilerFailure, type ApprovalDecision } from "@/lib/contracts";
import { ARTIFACTS, EXPECTED_IMPACTS, EXPECTED_PATCHES } from "@/lib/fixtures";
import { ReplayProvider } from "@/lib/replay-provider";
import { analyzePolicy, completeCompilation } from "@/lib/workflow";
import { contentChecksum, validateImpacts, validatePatches, diffPolicies } from "@/lib/compiler";
import { POLICY_V1, POLICY_V2 } from "@/lib/fixtures";

function approvals(): ApprovalDecision[] {
  return EXPECTED_PATCHES.map((patch, index) => ({
    patchId: patch.id,
    decision: "approve",
    decidedAt: `2026-07-18T00:00:0${index}.000Z`,
  }));
}

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    if (error instanceof CompilerFailure) return error.error.code;
    throw error;
  }
}

describe("CascadeOps compiler", () => {
  it("produces exactly five deterministic, visibly simulated Replay proposals", async () => {
    const first = await analyzePolicy(new ReplayProvider());
    const second = await analyzePolicy(new ReplayProvider());
    expect(first.changes).toHaveLength(1);
    expect(first.impactEnvelope).toMatchObject({ mode: "replay", simulated: true, model: null });
    expect(first.impactEnvelope.payload).toHaveLength(5);
    expect(first.patchEnvelope.payload).toHaveLength(5);
    expect(second).toEqual(first);
  });

  it("approves, applies, verifies, and receipts all five candidate artifacts", () => {
    const result = completeCompilation({
      mode: "replay",
      impacts: structuredClone(EXPECTED_IMPACTS),
      patches: structuredClone(EXPECTED_PATCHES),
      decisions: approvals(),
    });
    expect(result.candidates).toHaveLength(5);
    expect(result.patches.every((patch) => patch.status === "verified")).toBe(true);
    expect(result.assertions.every((assertion) => assertion.passed)).toBe(true);
    expect(result.receipt.patchSummary).toEqual({ proposed: 5, approved: 5, rejected: 0, applied: 5, verified: 5 });
    expect(result.receipt.residualRisks).toEqual([]);
    expect(result.receipt.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(ARTIFACTS[0]?.blocks[1]?.text).toContain("30 days");
  });

  it("blocks the entire candidate compilation when one patch is rejected", () => {
    const decisions = approvals();
    decisions[4] = { ...decisions[4]!, decision: "reject" };
    expect(
      codeOf(() =>
        completeCompilation({
          mode: "replay",
          impacts: structuredClone(EXPECTED_IMPACTS),
          patches: structuredClone(EXPECTED_PATCHES),
          decisions,
        }),
      ),
    ).toBe("CO-STATE-002");
    expect(ARTIFACTS[4]?.blocks[1]?.text).toContain("30-day");
  });

  it("allows a rejected decision to be replaced by approval before apply", () => {
    const decisions = approvals();
    decisions.push({ patchId: "patch.5", decision: "reject", decidedAt: "2026-07-18T00:01:00.000Z" });
    decisions.push({ patchId: "patch.5", decision: "approve", decidedAt: "2026-07-18T00:02:00.000Z" });
    expect(
      completeCompilation({ mode: "replay", impacts: EXPECTED_IMPACTS, patches: EXPECTED_PATCHES, decisions }).receipt
        .patchSummary.verified,
    ).toBe(5);
  });

  it("fails closed on fabricated anchors, ungrounded excerpts, and destructive replacements", () => {
    const changes = diffPolicies(POLICY_V1, POLICY_V2);
    const fabricated = structuredClone(EXPECTED_IMPACTS);
    fabricated[0]!.location.anchorId = "sop.fabricated";
    expect(codeOf(() => validateImpacts(fabricated, { changes, artifacts: ARTIFACTS }))).toBe("CO-VAL-003");

    const ungrounded = structuredClone(EXPECTED_IMPACTS);
    ungrounded[0]!.location.excerpt = "invented";
    expect(codeOf(() => validateImpacts(ungrounded, { changes, artifacts: ARTIFACTS }))).toBe("CO-VAL-006");

    const destructive = structuredClone(EXPECTED_PATCHES);
    destructive[0]!.afterText = "Delete the whole SOP";
    expect(
      codeOf(() => validatePatches(destructive, { changes, artifacts: ARTIFACTS, findings: EXPECTED_IMPACTS })),
    ).toBe("CO-VAL-008");
  });

  it("uses a stable content checksum for the same candidate set", () => {
    expect(contentChecksum(ARTIFACTS)).toBe(contentChecksum(structuredClone(ARTIFACTS)));
  });
});
