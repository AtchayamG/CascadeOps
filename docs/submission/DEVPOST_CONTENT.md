# CascadeOps - Policy Change Compiler

## Tagline

One policy change. Every operation aligned.

## Short description

CascadeOps turns an approved policy revision into source-cited, human-reviewed candidate updates across dependent SOPs, forms, templates, checklists, and training material.

## Category

Work & Productivity

## Technologies used

Next.js, React, TypeScript, Zod, OpenAI Responses API with GPT-5.6, Vitest, Playwright, axe-core, GitHub Actions

## Submission links

- Deployed demo: `[DEPLOYED_DEMO_URL]`
- Public MIT repository: `https://github.com/AtchayamG/CascadeOps`
- Public demo video: `[YOUTUBE_URL]`
- Required Codex `/feedback` session ID: `[FEEDBACK_SESSION_ID]`

## Inspiration

A policy rarely lives in one place. Once a clause is approved, the same rule may appear in a support SOP, a request form, a customer-response template, a QA checklist, and a training guide. Manually finding, reviewing, and proving every follow-on update is slow and difficult to audit.

CascadeOps borrows the mental model of a compiler: treat the approved policy as source, trace its bounded dependencies, propose exact target edits, require human decisions, compile isolated candidates, and verify them before producing evidence.

## What it does

The focused P0 scenario changes a refund window from 30 days to 14 days. CascadeOps:

1. Compares the original and revised `clause.refund-window` text.
2. Maps that change through a curated five-artifact dependency fixture.
3. Produces five source-cited patch proposals, each tied to an exact artifact anchor.
4. Requires an explicit approve or reject decision for every proposal.
5. Blocks candidate compilation if any proposal is pending or rejected; the reviewer may change a decision before compilation.
6. Compiles all five approved patches atomically into isolated in-memory candidate copies.
7. Runs a separate deterministic verification step for stale-value absence, new-value presence, anchor integrity, and untouched-block equality.
8. Exports a JSON compilation receipt containing the decision and assertion evidence plus an SHA-256 content checksum.

Candidate compilation and verification are intentionally separate. CascadeOps never labels a candidate verified until deterministic assertions pass.

## How it works

CascadeOps has two explicit provider modes:

- **Simulated Replay**, the default public judging path, is deterministic and fixture-backed. It needs no credentials and is visibly labelled as simulated.
- **Live GPT-5.6** uses the OpenAI Responses API with Structured Outputs and `store: false`, which disables request storage for those calls. Live responses must satisfy strict Zod schemas and citation/grounding validation. Provider or validation errors fail closed, with no silent Replay fallback.

The model is bounded to impact analysis and patch proposal generation. Deterministic TypeScript owns known-ID validation, citation checks, approval enforcement, atomic candidate compilation, verification, and receipt construction.

P0 operates only on in-memory fixture artifacts. It does not ingest arbitrary company documents, write external enterprise systems, or provide legal or compliance certification.

## How we built it

Codex acted as principal engineer and product integrator. It reconciled the master blueprint, froze the typed contracts and truth boundaries, coordinated Claude and agy workers in isolated worktrees, implemented and integrated the compiler/API/UI, reproduced every test gate, ran the bounded live proof, and audited the public evidence.

GPT-5.6 powers the optional live impact and patch proposal stages via Responses Structured Outputs. It never approves a patch, writes an external system, or decides whether verification passed.

The product is a strict Next.js and TypeScript application with Zod contracts. Vitest covers contracts, compiler behavior, API state transitions, and the deterministic demo. Playwright exercises the complete Replay path on desktop and mobile, with axe accessibility checks. GitHub Actions reproduces lint, typecheck, tests, production build, and browser smoke flows from a clean checkout.

## Challenges

### Grounding model output

The main risk was allowing a model to invent a location or edit outside the approved clause. Every impact and proposal is therefore checked against known artifact IDs, exact anchors, the changed clause, and the source `beforeText`. Invalid payloads stop with typed errors.

### Preserving human authority

Approval could not be a decorative button. The state machine permits re-decisions before compilation, but any pending or rejected proposal blocks compilation, verification, receipt generation, and export.

### Separating compilation from proof

An early UI state used verification language too soon. Manual browser QA caught it. We separated candidate compilation and deterministic verification in both the server contract and visible states, then added a browser regression assertion.

### Honest public delivery

The public experience must work without exposing a key. Replay is therefore the credential-free golden path. The optional live implementation was proven separately with one bounded local GPT-5.6 smoke run whose evidence contains no secret or raw payload.

## Accomplishments

- A complete five-artifact golden path with exact source and target citations.
- A genuine fail-closed human approval gate and atomic candidate compiler.
- A separate deterministic verifier producing 20 fixture assertions.
- A bounded live GPT-5.6 proof using Structured Outputs, `store: false`, and no silent fallback.
- 22 passing unit/domain/route/demo tests plus passing desktop and mobile Playwright/axe flows.
- A public MIT repository with a successful clean GitHub Actions run and zero dependency vulnerabilities at publication time.

## What we learned

LLMs are useful for bounded structured analysis, but authorization and proof should be deterministic. Strict schemas help, yet schemas alone are insufficient: IDs, citations, source text, state transitions, and unchanged content also need application-level validation.

We also learned that copy is part of the safety system. "Proposed," "candidate compiled," and "verified" are different states, and the interface must preserve those distinctions.

## What's next

- User-supplied Markdown and DOCX ingestion with explicit trust and size boundaries.
- Configurable artifact schemas and verification rules.
- Review queues, decision history, and signed-in team workspaces.
- Optional connectors that remain preview-first and require an additional explicit authorization gate before any external write.

## Setup and judging notes

1. Open the deployed app; Simulated Replay is selected by default.
2. Click **Compile Policy Change**.
3. Review and approve all five proposals. A pending or rejected proposal demonstrates the fail-closed gate.
4. Click **Compile Approved Candidates**.
5. Click **Run Verification Check**.
6. Open and download the compilation receipt.

For local development, use Node.js 22.13+, run `npm ci`, copy `.env.example` to `.env.local`, and run `npm run dev`. Replay requires no key. Optional Live mode requires a server-side `OPENAI_API_KEY`.
