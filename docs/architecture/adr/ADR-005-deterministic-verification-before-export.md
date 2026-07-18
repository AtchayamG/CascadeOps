# ADR-005: Deterministic verification before export

Status: Accepted (M0)

## Context

Approved patches could still leave artifacts wrong: a stale "30 days" surviving, an anchor destroyed by a bad replacement, or an untouched block accidentally mutated. Asking a model to verify model output would be circular and non-deterministic. The export step is the product's final claim ("verified operations"), so it must rest on checks a judge can re-run and get identical results.

## Decision

Verification (blueprint §10) is pure deterministic code running over the in-memory candidate artifacts after apply — no model call in the verification path, either mode. Assertions:

- `stale-value-absent` and `new-value-present` on every applied anchor;
- `anchor-intact` on every artifact (all anchors exist exactly once);
- `untouched-unchanged` — every non-applied block byte-identical to the original, protecting all unaffected content;
- receipt consistency (`verified == applied == approved == proposed`, `rejected == 0`).

Any failed assertion sets VERIFICATION_FAILED and blocks export (`CO-EXP-001`). In the golden path all five patches apply and `residualRisks` is empty. A rejection blocks apply before verification and therefore produces no receipt. The Compilation Receipt embeds all assertions and a SHA-256 `contentHash` of the exported artifact set — a content checksum for integrity comparison only, not a signature or seal.

## Consequences

- "Verified" in CascadeOps has an exact, re-runnable meaning; the repeated-demo gate (byte-identical Replay receipts modulo runId/timestamps) is achievable.
- Verification cost is milliseconds and works identically offline, keeping the credential-free judge path intact.
- Cost: assertions are value-based for the P0 fixture (30/14 days), so new scenarios need their own expected values — acceptable, since P0 is a single curated fixture and breadth is explicitly excluded (blueprint §19).
