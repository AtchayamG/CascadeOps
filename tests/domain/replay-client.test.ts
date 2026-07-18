import { describe, expect, it } from "vitest";
import { EXPECTED_PATCHES } from "../../lib/fixtures";
import {
  buildReplayReceipt,
  compileReplayCandidates,
  verifyReplayCandidates,
} from "../../lib/replay-client";

describe("browser-native replay compiler", () => {
  it("matches the verified five-patch and twenty-assertion contract", async () => {
    const decisions = EXPECTED_PATCHES.map((patch) => ({
      patchId: patch.id,
      decision: "approve" as const,
      decidedAt: "2026-07-19T00:00:00.000Z",
    }));
    const candidates = compileReplayCandidates(EXPECTED_PATCHES, decisions);
    const assertions = verifyReplayCandidates(candidates, EXPECTED_PATCHES);
    const receipt = await buildReplayReceipt(candidates, EXPECTED_PATCHES, decisions, assertions);

    expect(assertions).toHaveLength(20);
    expect(assertions.every((assertion) => assertion.passed)).toBe(true);
    expect(receipt.patchSummary).toEqual({ proposed: 5, approved: 5, rejected: 0, applied: 5, verified: 5 });
    expect(receipt.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.simulated).toBe(true);
    expect(receipt.model).toBeNull();
  });

  it("fails closed when any patch lacks explicit approval", () => {
    const decisions = EXPECTED_PATCHES.slice(0, 4).map((patch) => ({
      patchId: patch.id,
      decision: "approve" as const,
      decidedAt: "2026-07-19T00:00:00.000Z",
    }));
    expect(() => compileReplayCandidates(EXPECTED_PATCHES, decisions)).toThrow("lacks explicit approval");
  });
});
