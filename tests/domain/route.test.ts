import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/compile/route";
import { EXPECTED_IMPACTS, EXPECTED_PATCHES } from "@/lib/fixtures";

describe("compile route", () => {
  const approvals = EXPECTED_PATCHES.map((patch) => ({
    patchId: patch.id,
    decision: "approve" as const,
    decidedAt: "2026-07-18T00:00:00.000Z",
  }));

  it("serves credential-free Replay analysis", async () => {
    const response = await POST(
      new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "analyze", mode: "replay" }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, data: { impactEnvelope: { simulated: true } } });
  });

  it("keeps candidate compilation and deterministic verification as separate actions", async () => {
    const base = { mode: "replay", impacts: EXPECTED_IMPACTS, patches: EXPECTED_PATCHES, decisions: approvals };
    const appliedResponse = await POST(
      new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "apply", ...base }),
      }),
    );
    const applied = await appliedResponse.json();
    expect(appliedResponse.status).toBe(200);
    expect(applied.data.patches.every((patch: { status: string }) => patch.status === "applied")).toBe(true);
    expect(applied.data.receipt).toBeUndefined();

    const verifiedResponse = await POST(
      new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "verify", ...base }),
      }),
    );
    const verified = await verifiedResponse.json();
    expect(verifiedResponse.status).toBe(200);
    expect(verified.data.receipt.patchSummary.verified).toBe(5);
  });

  it("returns a typed failure instead of partially applying a rejection", async () => {
    const decisions = EXPECTED_PATCHES.map((patch, index) => ({
      patchId: patch.id,
      decision: index === 4 ? "reject" : "approve",
      decidedAt: "2026-07-18T00:00:00.000Z",
    }));
    const response = await POST(
      new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "complete", mode: "replay", impacts: EXPECTED_IMPACTS, patches: EXPECTED_PATCHES, decisions }),
      }),
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "CO-STATE-002" } });
  });
});
