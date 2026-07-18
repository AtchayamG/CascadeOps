# ADR-004: Human-approved patch state machine

Status: Accepted (M0)

## Context

CascadeOps proposes edits to operational documents that real teams would act on. An "autonomous" flow that applies model-proposed patches without review would be both unsafe and off-brand (voice: evidence, impact, review, verification — never autonomous or magical). The product promise is reviewed patches, so approval must be an enforced mechanism, not a UI convention that code paths can bypass.

## Decision

Patch lifecycle is the fixed state machine of blueprint §6.1:

`PROPOSED → APPROVED | REJECTED` (human ApprovalDecision only) · `APPROVED ↔ REJECTED` re-decision, human-only, legal only before apply executes (latest decision wins) · `APPROVED → APPLIED` · `APPLIED → VERIFIED | VERIFICATION_FAILED`. Once apply executes, decisions are frozen; a patch REJECTED at that point is terminal for the run.

Enforcement lives in the compiler core, not the UI: the UI can only request transitions, and the core rejects anything illegal with `CO-STATE-001` (including any ApprovalDecision after apply). Apply requires every targeted patch to be APPROVED (`CO-STATE-002`); applying or exporting a rejected patch is impossible (`CO-STATE-003`). There is no bulk auto-approve and no default decision; every patch requires an explicit per-patch human choice. A run containing a rejection produces no Compilation Receipt.

## Consequences

- Approval bypass becomes a testable property: adversarial tests drive illegal transitions and expect exact `CO-STATE-*` codes.
- The rejection gate is proven by a dedicated negative/alternate-run test (blueprint §5.1, TEST_STRATEGY gate 7), not by the golden path: rejecting one patch blocks apply, verification, and export until the human changes that decision. The golden path approves all five explicitly and exports with zero residual risks.
- Cost: the demo requires five explicit decisions instead of one click. Accepted — that friction is the product's integrity claim.
