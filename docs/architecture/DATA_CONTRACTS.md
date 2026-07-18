# CascadeOps Data Contracts

Normative field-by-field contracts for every canonical object in blueprint §7. The blueprint is authoritative; this document elaborates it and must not diverge. These shapes become strict TypeScript types + runtime schemas in M2; every model boundary and provider (Replay and Live) validates against them, unknown fields rejected, fail closed.

## Conventions

- All IDs are lowercase dot-separated strings with a type prefix: `policy.*`, `clause.*`, `change.*`, `artifact.*`, `impact.*`, `patch.*`, `run.*`. Anchor IDs are artifact-scoped, e.g. `sop.step-2.eligibility`.
- All timestamps are ISO 8601 UTC strings.
- All text fields are plain UTF-8; no HTML is trusted from any payload.
- `null` is used only where explicitly typed; optional fields are marked `?`.

## Core objects

### ProviderMode

```ts
type ProviderMode = "replay" | "live";
```

### PolicyDocument

```ts
interface PolicyDocument {
  id: string;            // "policy.refund-policy"
  title: string;         // display title
  version: string;       // "v1" | "v2" for the P0 fixture
  clauses: PolicyClause[]; // ≥ 1; clause IDs unique within document
}
```

### PolicyClause

```ts
interface PolicyClause {
  id: string;            // "clause.refund-window"
  heading: string;
  text: string;          // full clause text, the citation target
}
```

### ClauseChange

Computed deterministically by the core diff (never by a model) from two versions of the same PolicyDocument.

```ts
interface ClauseChange {
  id: string;                      // "change.refund-window"
  clauseId: string;                // must exist in at least one compared version
  changeType: "modified" | "added" | "removed";
  beforeText: string | null;       // null iff changeType === "added"
  afterText: string | null;        // null iff changeType === "removed"
}
```

### OperationalArtifact / ArtifactBlock

Artifacts are ordered lists of anchored blocks. Anchors are the only addressable patch targets.

```ts
interface OperationalArtifact {
  id: string;      // "artifact.support-sop"
  title: string;
  kind: "sop" | "form" | "template" | "checklist" | "guide";
  blocks: ArtifactBlock[];   // anchorIds unique within artifact
}

interface ArtifactBlock {
  anchorId: string;          // "sop.step-2.eligibility"
  text: string;              // exact current text; grounding target for beforeText
}
```

### ArtifactLocation

```ts
interface ArtifactLocation {
  artifactId: string;   // must reference a loaded artifact          (else CO-VAL-002)
  anchorId: string;     // must reference a block in that artifact   (else CO-VAL-003)
  excerpt: string;      // exact current block text at time of citation
}
```

### ArtifactDependency

Fixture-declared prior knowledge: which artifacts depend on which clauses. Input to `proposeImpacts`; a hint, not a constraint — findings are validated by grounding, not by dependency membership.

```ts
interface ArtifactDependency {
  artifactId: string;
  clauseId: string;
  rationale: string;   // one sentence, human-readable
}
```

### ImpactFinding

```ts
interface ImpactFinding {
  id: string;                 // "impact.1" … unique within run
  changeId: string;           // must cite a computed ClauseChange     (else CO-VAL-001/004/005)
  clauseId: string;           // must equal the cited change's clauseId
  location: ArtifactLocation; // exact target
  severity: "must-update" | "review-recommended";
  explanation: string;        // why this location is affected
}
```

### PatchProposal

```ts
interface PatchProposal {
  id: string;                 // "patch.1" … unique within run
  impactId: string;           // must cite a validated ImpactFinding
  changeId: string;           // must equal the finding's changeId
  location: ArtifactLocation; // must equal the finding's location
  beforeText: string;         // must EXACTLY equal current block text (else CO-VAL-006)
  afterText: string;          // proposed replacement, non-empty, ≠ beforeText
  status: PatchStatus;        // providers must emit "proposed"; core owns transitions
}

type PatchStatus = "proposed" | "approved" | "rejected"
                 | "applied" | "verified" | "verification_failed";
```

Duplicate targets (two patches, same anchorId) → CO-VAL-007. Conflicting edits (overlapping replacements at one anchor) → CO-VAL-008. Whole payload rejected, never partially merged.

### ApprovalDecision

```ts
interface ApprovalDecision {
  patchId: string;
  decision: "approve" | "reject";
  decidedAt: string;    // ISO 8601
  note?: string;
}
```

Human-originated only; drives the only legal PROPOSED exits and the APPROVED ↔ REJECTED re-decisions (blueprint §6.1). Until apply executes, the latest decision per patch wins; once apply executes, decisions are frozen and any further ApprovalDecision is `CO-STATE-001`.

### VerificationAssertion

```ts
interface VerificationAssertion {
  id: string;
  kind: "stale-value-absent" | "new-value-present" | "anchor-intact" | "untouched-unchanged";
  artifactId: string;
  anchorId?: string;    // absent for artifact-level assertions (anchor-intact)
  expected: string;     // human-readable expectation
  passed: boolean;
  detail: string;       // evidence string, e.g. matched/failing text
}
```

### CompilationReceipt

```ts
interface CompilationReceipt {
  runId: string;                 // "run.<uuid>"
  mode: ProviderMode;
  simulated: boolean;            // true iff mode === "replay"
  model: string | null;          // "gpt-5.6" iff live, else null
  policyId: string;
  fromVersion: string;
  toVersion: string;
  changeIds: string[];
  patchSummary: { proposed: number; approved: number; rejected: number;
                  applied: number; verified: number };
  assertions: VerificationAssertion[];
  residualRisks: string[];       // empty for the P0 successful all-five compilation
  createdAt: string;
  contentHash: string;           // SHA-256 content checksum over exported artifact contents —
                                 // integrity comparison only, never a signature or seal
}
```

Invariants: `applied === approved === verified === proposed` for a successful P0 run, `rejected === 0`, and `residualRisks` is empty. Golden path: `{proposed: 5, approved: 5, rejected: 0, applied: 5, verified: 5}`. A rejection blocks apply, verification, export, and receipt generation.

## Envelopes and errors

### ProviderEnvelope

Every provider response, both modes, is wrapped:

```ts
interface ProviderEnvelope<T> {
  mode: ProviderMode;
  simulated: boolean;      // must equal (mode === "replay")   — cross-field validated
  model: string | null;    // "gpt-5.6" iff live, null iff replay
  generatedAt: string;
  payload: T;              // schema-validated before use
}
```

### CompilerError

```ts
interface CompilerError {
  code: string;        // one of blueprint §15 CO-* codes
  message: string;     // plain language, no secrets, no raw prompts
  subjectId?: string;  // offending id (patchId, anchorId, …)
  fatal: boolean;      // fatal aborts the step/run
}
```

## Validation matrix

| Rule | Applies to | Error |
|---|---|---|
| Strict schema, unknown fields rejected | every envelope payload | CO-VAL-009 |
| changeId/clauseId known and changed | ImpactFinding, PatchProposal | CO-VAL-001 / 004 / 005 |
| artifactId known | ArtifactLocation | CO-VAL-002 |
| anchorId exists in artifact | ArtifactLocation | CO-VAL-003 |
| beforeText === current block text | PatchProposal | CO-VAL-006 |
| unique anchor target per payload | PatchProposal[] | CO-VAL-007 |
| non-conflicting edits | PatchProposal[] | CO-VAL-008 |
| legal state transitions only | ApprovalDecision, apply, export | CO-STATE-001/002/003 |
| verification passed before export | CompilationReceipt | CO-VER-*, CO-EXP-001 |

## Canonical fixture IDs (P0)

Policy: `policy.refund-policy` (v1, v2) · change: `change.refund-window` · clause: `clause.refund-window`.

Artifacts and affected anchors — exactly one per artifact (must match blueprint §4.2 exactly):

- `artifact.support-sop`: `sop.step-2.eligibility`
- `artifact.refund-request-form`: `form.field.purchase-date.help`
- `artifact.customer-response-template`: `template.body.window-sentence`
- `artifact.qa-checklist`: `qa.item-4.window-check`
- `artifact.training-guide`: `guide.section-2.policy-summary`

Negative expectation: any finding or patch targeting an anchor outside these five is a grading failure (each artifact also contains unrelated blocks).
