import { z } from "zod";

// Canonical contracts for blueprint §7. Single definition point: UI, core,
// providers and tests all import from here. Strict schemas — unknown fields
// are rejected (CO-VAL-009).

export const ProviderModeSchema = z.enum(["replay", "live"]);
export type ProviderMode = z.infer<typeof ProviderModeSchema>;

export const LIVE_MODEL = "gpt-5.6";

export const PolicyClauseSchema = z.strictObject({
  id: z.string().min(1),
  heading: z.string().min(1),
  text: z.string().min(1),
});
export type PolicyClause = z.infer<typeof PolicyClauseSchema>;

export const PolicyDocumentSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
  clauses: z.array(PolicyClauseSchema).min(1),
});
export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;

export const ClauseChangeSchema = z
  .strictObject({
    id: z.string().min(1),
    clauseId: z.string().min(1),
    changeType: z.enum(["modified", "added", "removed"]),
    beforeText: z.string().nullable(),
    afterText: z.string().nullable(),
  })
  .superRefine((c, ctx) => {
    if ((c.beforeText === null) !== (c.changeType === "added")) {
      ctx.addIssue({ code: "custom", message: "beforeText must be null iff changeType is 'added'" });
    }
    if ((c.afterText === null) !== (c.changeType === "removed")) {
      ctx.addIssue({ code: "custom", message: "afterText must be null iff changeType is 'removed'" });
    }
  });
export type ClauseChange = z.infer<typeof ClauseChangeSchema>;

export const ArtifactBlockSchema = z.strictObject({
  anchorId: z.string().min(1),
  text: z.string().min(1),
});
export type ArtifactBlock = z.infer<typeof ArtifactBlockSchema>;

export const OperationalArtifactSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(["sop", "form", "template", "checklist", "guide"]),
  blocks: z.array(ArtifactBlockSchema).min(1),
});
export type OperationalArtifact = z.infer<typeof OperationalArtifactSchema>;

export const ArtifactLocationSchema = z.strictObject({
  artifactId: z.string().min(1),
  anchorId: z.string().min(1),
  excerpt: z.string().min(1),
});
export type ArtifactLocation = z.infer<typeof ArtifactLocationSchema>;

export const ArtifactDependencySchema = z.strictObject({
  artifactId: z.string().min(1),
  clauseId: z.string().min(1),
  rationale: z.string().min(1),
});
export type ArtifactDependency = z.infer<typeof ArtifactDependencySchema>;

export const ImpactFindingSchema = z.strictObject({
  id: z.string().min(1),
  changeId: z.string().min(1),
  clauseId: z.string().min(1),
  location: ArtifactLocationSchema,
  severity: z.enum(["must-update", "review-recommended"]),
  explanation: z.string().min(1),
});
export type ImpactFinding = z.infer<typeof ImpactFindingSchema>;

export const PatchStatusSchema = z.enum([
  "proposed",
  "approved",
  "rejected",
  "applied",
  "verified",
  "verification_failed",
]);
export type PatchStatus = z.infer<typeof PatchStatusSchema>;

export const PatchProposalSchema = z
  .strictObject({
    id: z.string().min(1),
    impactId: z.string().min(1),
    changeId: z.string().min(1),
    location: ArtifactLocationSchema,
    beforeText: z.string().min(1),
    afterText: z.string().min(1),
    status: PatchStatusSchema,
  })
  .superRefine((p, ctx) => {
    if (p.afterText === p.beforeText) {
      ctx.addIssue({ code: "custom", message: "afterText must differ from beforeText" });
    }
  });
export type PatchProposal = z.infer<typeof PatchProposalSchema>;

export const ApprovalDecisionSchema = z.strictObject({
  patchId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  decidedAt: z.string().min(1),
  note: z.string().optional(),
});
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;

export const VerificationAssertionSchema = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(["stale-value-absent", "new-value-present", "anchor-intact", "untouched-unchanged"]),
  artifactId: z.string().min(1),
  anchorId: z.string().optional(),
  expected: z.string().min(1),
  passed: z.boolean(),
  detail: z.string().min(1),
});
export type VerificationAssertion = z.infer<typeof VerificationAssertionSchema>;

export const CompilationReceiptSchema = z.strictObject({
  runId: z.string().min(1),
  mode: ProviderModeSchema,
  simulated: z.boolean(),
  model: z.string().nullable(),
  policyId: z.string().min(1),
  fromVersion: z.string().min(1),
  toVersion: z.string().min(1),
  changeIds: z.array(z.string().min(1)),
  patchSummary: z.strictObject({
    proposed: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    applied: z.number().int().nonnegative(),
    verified: z.number().int().nonnegative(),
  }),
  assertions: z.array(VerificationAssertionSchema),
  residualRisks: z.array(z.string()),
  createdAt: z.string().min(1),
  contentHash: z.string().min(1),
});
export type CompilationReceipt = z.infer<typeof CompilationReceiptSchema>;

// Every provider response, both modes, is wrapped and cross-field validated:
// simulated === (mode === "replay"); model === "gpt-5.6" iff live, else null.
export function providerEnvelopeSchema<T extends z.ZodType>(payload: T) {
  return z
    .strictObject({
      mode: ProviderModeSchema,
      simulated: z.boolean(),
      model: z.string().nullable(),
      generatedAt: z.string().min(1),
      payload,
    })
    .superRefine((env, ctx) => {
      if (env.simulated !== (env.mode === "replay")) {
        ctx.addIssue({ code: "custom", message: "simulated must equal (mode === 'replay')" });
      }
      const expectedModel = env.mode === "live" ? LIVE_MODEL : null;
      if (env.model !== expectedModel) {
        ctx.addIssue({ code: "custom", message: `model must be ${JSON.stringify(expectedModel)} for mode '${env.mode}'` });
      }
    });
}

export interface ProviderEnvelope<T> {
  mode: ProviderMode;
  simulated: boolean;
  model: string | null;
  generatedAt: string;
  payload: T;
}

export const ImpactFindingsEnvelopeSchema = providerEnvelopeSchema(z.array(ImpactFindingSchema));
export const PatchProposalsEnvelopeSchema = providerEnvelopeSchema(z.array(PatchProposalSchema));

export interface CompilerProvider {
  readonly mode: ProviderMode;
  proposeImpacts(req: {
    change: ClauseChange;
    artifacts: OperationalArtifact[];
    dependencies: ArtifactDependency[];
  }): Promise<ProviderEnvelope<ImpactFinding[]>>;
  proposePatches(req: {
    findings: ImpactFinding[];
    artifacts: OperationalArtifact[];
  }): Promise<ProviderEnvelope<PatchProposal[]>>;
}

// Typed errors (blueprint §15). Fail closed: any violation throws CompilerFailure.
export interface CompilerError {
  code: string;
  message: string;
  subjectId?: string;
  fatal: boolean;
}

export class CompilerFailure extends Error {
  readonly error: CompilerError;
  constructor(code: string, message: string, subjectId?: string) {
    super(`${code}: ${message}`);
    this.name = "CompilerFailure";
    this.error = { code, message, ...(subjectId !== undefined ? { subjectId } : {}), fatal: true };
  }
}

export function fail(code: string, message: string, subjectId?: string): never {
  throw new CompilerFailure(code, message, subjectId);
}
