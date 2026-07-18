# CascadeOps Handover

## Current state

M0-M4 are complete. The working product passes unit/domain/route/demo tests, lint, strict typecheck, production build, and responsive Playwright/axe checks. Publication, submission media, and Devpost are next.

## Canonical product

- Name: CascadeOps
- Full title: CascadeOps - Policy Change Compiler
- Tagline: One policy change. Every operation aligned.
- Category: Work & Productivity
- P0 fixture: refund window changes from 30 days to 14 days across exactly five dependent operational artifacts.

## Non-negotiable invariants

- Exactly five impacts and five patches, one per artifact.
- Every impact and patch cites the changed policy clause and exact target location.
- Unknown IDs, invalid citations, unsupported replacements, and incomplete verification fail closed.
- Replay is deterministic and visibly simulated; Live is explicitly GPT-5.6-backed and never silently falls back.
- Every patch needs an explicit human decision. Any rejection blocks candidate compilation, verification, export, and receipt until changed before compilation.
- Compiled candidates are not called verified until the separate deterministic verification action passes.
- A successful P0 receipt reports all five candidates verified with zero stale fixture references and an SHA-256 content checksum, not a signature.
- No external enterprise writes, compliance certification, database, auth, vector store, or OAuth in P0.

## Integration policy

Claude owns complex architecture/backend work when available; agy owns suitable UI/media work. Codex integrates, reproduces all gates, and owns publication and submission truthfulness.
