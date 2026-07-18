import { expect, it } from "vitest";
import { ReplayProvider } from "@/lib/replay-provider";
import { analyzePolicy, completeCompilation } from "@/lib/workflow";

it("demo assertion: five cited patches end in a verified zero-stale receipt", async () => {
  const analysis = await analyzePolicy(new ReplayProvider());
  const decisions = analysis.patchEnvelope.payload.map((patch) => ({
    patchId: patch.id,
    decision: "approve" as const,
    decidedAt: "2026-07-18T00:00:00.000Z",
  }));
  const result = completeCompilation({
    mode: "replay",
    impacts: analysis.impactEnvelope.payload,
    patches: analysis.patchEnvelope.payload,
    decisions,
  });
  expect(result.receipt.patchSummary).toEqual({ proposed: 5, approved: 5, rejected: 0, applied: 5, verified: 5 });
  expect(result.assertions.filter((item) => item.kind === "stale-value-absent").every((item) => item.passed)).toBe(true);
  expect(result.receipt.residualRisks).toHaveLength(0);
});
