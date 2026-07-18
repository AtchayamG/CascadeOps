# CascadeOps Evaluation Plan

Evaluates whether CascadeOps does what the blueprint claims — on the P0 fixture, with measurable, honest numbers. All metrics below are fixture-scoped demo measurements; none are production claims, and no fabricated usage, customer or scale numbers may appear anywhere in submission material.

## 1. Exact fixture expectations (hard graders)

Ground truth = blueprint §4. A run fails evaluation if any row deviates.

| ID | Expectation | Pass condition |
|---|---|---|
| E1 | Clause diff | Exactly 1 ClauseChange: `change.refund-window`, modified, 30 → 14 days; `clause.refund-method` and `clause.exclusions` unchanged |
| E2 | Impact count | Exactly 5 Impact Findings |
| E3 | Impact targets | Anchor set exactly: `sop.step-2.eligibility`, `form.field.purchase-date.help`, `template.body.window-sentence`, `qa.item-4.window-check`, `guide.section-2.policy-summary` — one per artifact |
| E4 | No out-of-set targets | Zero findings/patches target any anchor outside the E3 set (each artifact contains unrelated blocks) |
| E5 | Citation coverage | 5/5 findings and 5/5 patches cite `change.refund-window` + exact anchor |
| E6 | Grounding | 5/5 patches have `beforeText` exactly equal to current anchor text |
| E7 | Approval gate | Golden path: all 5 explicitly approved per patch, no bulk control. Rejection alternate run: 4 approved, 1 rejected; apply/verify/export blocked, zero candidate changes, no receipt |
| E8 | Verification | Golden path: all assertions pass on the 5 applied anchors, zero stale refund-window references, `untouched-unchanged` holds for all unaffected blocks, `residualRisks` empty |
| E9 | Receipt | Golden path `patchSummary = {proposed:5, approved:5, rejected:0, applied:5, verified:5}`; mode/simulated/model consistent; contentHash stable (SHA-256 content checksum only, not a signature). Rejection run produces no receipt |
| E10 | Determinism | 20 Replay runs → byte-identical receipts modulo runId/timestamps |

Hard graders E1–E10 are automated (they reuse the test-strategy gates); all must pass before M5 exit.

## 2. Before/after metrics (measured in-demo)

Baseline = the fixture set as shipped (policy updated to v2, artifacts still stale) — the realistic "policy changed, nobody updated operations" state. After = post-export artifact set from a golden-path run.

| Metric | Before | After (target) | How measured |
|---|---|---|---|
| Stale refund-window references across 5 artifacts | 5 | 0 | Deterministic scan for "30 days"/"30-day" over anchor set |
| Artifacts fully aligned to v2 | 0 / 5 | 5 / 5 | Per-artifact stale scan |
| Proposed changes with verifiable source citation | n/a | 5 / 5 (100%) | Receipt inspection |
| Changes applied without human decision | n/a | 0 | State machine log |
| Unintended text modifications | n/a | 0 | `untouched-unchanged` assertions |
| False-positive impacts (out-of-set anchors) | n/a | 0 | E4 grader |

The rejection alternate run (blueprint §5.1) is measured separately as negative-path evidence, never as part of the successful demo: 4 approved / 1 rejected, apply blocked, zero candidate mutations, verification/export unavailable, and no receipt. The demo narrates only the all-approved golden path.

## 3. Live-mode evaluation (M4)

One bounded GPT-5.6 run, `store:false`, ≤ 2 calls. Graded with the same E1–E9 criteria, with tolerance defined honestly:

- Hard: schema validity, citation coverage, grounding, out-of-set-anchor exclusion, state machine, verification (E4–E9 equivalents) — must pass; failures are typed CO-* and reported as-is.
- Soft (reported, not gated): whether Live reproduces exactly the 5-anchor set (E2/E3). Live may legitimately mark severity differently or phrase `afterText` differently; deviations are recorded in the archived live receipt and described truthfully in submission material. Replay remains the deterministic evidence path.

Cost/latency recorded per run against blueprint §14 budgets (≤ 2 calls, ≤ 60 s, ≤ $0.50 est.).

## 4. Qualitative rubric (judge-perspective dry run)

Scored 1–5 by a fresh-eyes run before M7; ≥ 4 required on each:

1. Can a first-time user complete the golden path unaided in < 5 minutes?
2. Is every screen's provenance (Simulated vs Live) unmistakable?
3. Is each patch's "why" (cited clause) and "where" (anchor) legible without explanation?
4. Does the receipt read as trustworthy evidence (honest counts, zero residual risks in the golden path, checksum presented as checksum only)?
5. Keyboard-only and mobile-layout completion without dead ends?

## 5. Anti-fabrication rules

- No metric may be published that the repo cannot reproduce mechanically at the referenced commit.
- Replay numbers are always labelled simulated/fixture-scoped; the live receipt is the only artifact ever described as GPT-5.6 output.
- "Before/after" always means the fixture baseline defined in §2, never implied customer data.
- If a grader fails at submission time, the submission describes the actual state; numbers are never rounded up to targets.
