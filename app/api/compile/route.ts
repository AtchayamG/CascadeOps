import { NextResponse } from "next/server";
import { z } from "zod";
import { ApprovalDecisionSchema, ImpactFindingSchema, PatchProposalSchema, CompilerFailure } from "@/lib/contracts";
import { LiveProvider, getOpenAIClient } from "@/lib/live-provider";
import { ReplayProvider } from "@/lib/replay-provider";
import { analyzePolicy, completeCompilation } from "@/lib/workflow";

export const runtime = "nodejs";

const RequestSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("analyze"), mode: z.enum(["replay", "live"]) }),
  z.strictObject({
    action: z.literal("complete"),
    mode: z.enum(["replay", "live"]),
    impacts: z.array(ImpactFindingSchema),
    patches: z.array(PatchProposalSchema),
    decisions: z.array(ApprovalDecisionSchema),
  }),
]);

export async function POST(request: Request) {
  try {
    const body = RequestSchema.parse(await request.json());
    if (body.action === "analyze") {
      const provider = body.mode === "replay" ? new ReplayProvider() : new LiveProvider(getOpenAIClient());
      return NextResponse.json({ ok: true, data: await analyzePolicy(provider) });
    }
    return NextResponse.json({ ok: true, data: completeCompilation(body) });
  } catch (error) {
    if (error instanceof CompilerFailure) {
      return NextResponse.json({ ok: false, error: error.error }, { status: 422 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: "CO-VAL-009", message: "Request failed schema validation.", fatal: true } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "CO-STATE-001", message: "Compilation failed closed.", fatal: true } },
      { status: 500 },
    );
  }
}
