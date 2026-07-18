# ADR-002: Strict policy compilation contract, fail closed

Status: Accepted (M0)

## Context

CascadeOps' credibility rests on traceability: every Impact Finding and Patch Proposal must cite a real changed clause and an exact existing target location. Model output (Live) and even fixture data (Replay) can contain fabricated IDs, citations of unchanged clauses, replacements that don't match the current artifact text, or duplicate/conflicting patches. Silently accepting any of these would produce untrustworthy patches and untruthful demo evidence.

## Decision

Define the canonical typed objects of blueprint §7 in a single `contracts` module with strict runtime schemas (unknown fields rejected). Every provider payload — Replay and Live identically — is validated before touching application state, enforcing blueprint §9: known IDs only, mandatory citation of a computed ClauseChange, `beforeText` exactly equal to the current anchor text, no duplicate or conflicting patch targets, and legal state transitions only. Any violation aborts the step with a typed `CO-*` error (blueprint §15); partial payloads are never merged. Nothing fails open.

## Consequences

- Grounding is a mechanical guarantee, not a prompt-quality hope; prompt injection or model hallucination cannot smuggle an ungrounded patch into state.
- Replay and Live share one validation pipeline, so provider parity is testable and Live cannot get a looser path.
- Adversarial fixtures (unknown IDs, fake citations, ungrounded replacements, duplicates) become straightforward contract tests with exact expected error codes.
- Cost: strict schemas make Live integration less forgiving — a schema-valid-but-wrong model response fails the run visibly (CO-PROV-002/CO-VAL-*). That is the intended behaviour.
