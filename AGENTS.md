# Repository Instructions

Source of truth: `docs/blueprint/CASCADEOPS_MASTER_BLUEPRINT_v1.md`.

- Complete P0 milestones in order. Optional breadth must not delay the golden policy-compilation loop.
- Keep the repository root clean. Root Markdown is limited to `AGENTS.md` and `README.md`.
- Store all durable documentation under the existing purpose-based `docs/` folders.
- Use strict TypeScript contracts and deterministic fixtures at every model boundary.
- Use OpenAI Responses API Structured Outputs with `store: false`; keep secrets server-only.
- Label Replay outputs as simulated. Never present fixture evidence as a live GPT-5.6 result.
- Every impact and patch must cite a source clause and an exact target artifact location.
- Require explicit human approval before applying or exporting patches. P0 never writes to external enterprise systems.
- Treat CascadeOps as an operations alignment aid, not legal or compliance certification.
- Keep P0 dependency-light: one Next.js application, no database, authentication, vector store, queues, or OAuth connectors.
- Run lint, typecheck, unit/contract tests, build, browser smoke, accessibility, and secret checks before calling a milestone complete.
- Keep `docs/project/taskstatus.md`, `docs/project/handover.md`, `docs/project/BUILD_STATUS.json`, and `docs/project/CODEX_RESULT.md` accurate.

## External-agent routing

- Use `orchestrate-external-coding-agents` for delegated work.
- Route architecture, backend contracts, reasoning, and complex tests to Claude Fable 5 first; use Opus 4.8 only after Fable is unavailable.
- Route UI/UX, frontend integration, responsiveness, and visual QA to Antigravity (`agy`) using Gemini 3.5 Flash High when available.
- Use Hermes for bounded tests, documentation, repair, or fallback when authenticated.
- Give every writable worker a clean non-main worktree with non-overlapping file ownership.
- Require worker handoffs under `docs/project/worker-handoffs/` using DONE / BLOCKED / RISK / NEXT.
- Codex owns architecture decisions, integration, verification, secrets review, commits, deployment, and submission truthfulness.

## Product identity

- Name: CascadeOps
- Full title: CascadeOps — Policy Change Compiler
- Tagline: One policy change. Every operation aligned.
- Pitch: CascadeOps turns an approved policy change into a traceable, reviewable and verified patch set across every affected operational artifact.
- Category: Work & Productivity

