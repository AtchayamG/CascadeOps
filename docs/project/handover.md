# CascadeOps Handover

## Current state

M0 is complete and reconciled. The shared Next.js foundation passes lint, strict typecheck, and production build. Domain/compiler and UI implementation are next.

## Canonical product

- Name: CascadeOps
- Full title: CascadeOps — Policy Change Compiler
- Tagline: One policy change. Every operation aligned.
- Category: Work & Productivity
- P0 fixture: refund window changes from 30 days to 14 days across exactly five dependent operational artifacts.

## Non-negotiable invariants

- Exactly five impacts and five patches, one per artifact.
- Every impact and patch cites the changed policy clause and exact target location.
- Unknown IDs, invalid citations, unsupported replacements, and incomplete verification fail closed.
- Replay is deterministic and visibly simulated; Live is explicitly GPT-5.6-backed and never silently falls back.
- Every patch needs an explicit human decision. Any rejection blocks apply, verification, export, and receipt until changed before apply.
- Successful P0 receipt is all-five verified with zero stale target references and an SHA-256 content checksum, not a signature.
- No external enterprise writes, compliance certification, database, auth, vector store, or OAuth in P0.

## Integration policy

Claude owns contracts/compiler/API/domain tests; agy owns UI/CSS/browser tests. Codex integrates, resolves contracts, reproduces gates, and owns commits/publication.
