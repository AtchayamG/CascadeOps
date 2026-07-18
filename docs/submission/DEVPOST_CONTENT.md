# CascadeOps — Policy Change Compiler

## Tagline
One policy change. Every operation aligned.

## Short Description
CascadeOps aligns downstream operational documents (SOPs, forms, response templates, QA checklists, and training guides) with revised corporate policies by compiling source-linked patches, enforcing human approval gates, and executing deterministic verification.

## Category
Work & Productivity

## Technologies Used
Next.js, React, TypeScript, Zod, OpenAI API (GPT-5.6), Vitest, Playwright, Axe-core, CSS

## Submission Links & Session Details
- **Deployed Demo URL**: `[DEPLOYED_DEMO_URL_PLACEHOLDER]`
- **GitHub Repository**: `[GITHUB_REPOSITORY_URL_PLACEHOLDER]`
- **Demo Video URL**: `[DEMO_VIDEO_URL_PLACEHOLDER]`
- **Primary Codex Task / Feedback ID**: `[FEEDBACK_ID_PLACEHOLDER]`

---

## Full Story

### Inspiration
When an organization changes a policy, the source policy document is updated, but downstream operational materials (such as training guides, SOPs, customer service templates, and forms) silently rot. Important QA checklists and training materials continue teaching old rules, leading to operational drift and inconsistency. 

Traditional approaches rely on manual, error-prone text searches, or complex, opaque workflows. CascadeOps was inspired by software compilers: treating a policy update like a source code modification. It compares policy versions, identifies the exact affected location anchors in downstream operational files, proposes precise changes, mandates human approval, and verifies correctness before exporting the final candidates.

### What It Does
CascadeOps is an operations alignment aid designed to compile a single policy change across dependent artifacts. In its canonical P0 scenario, the refund window clause is updated from **30 days** to **14 days**. CascadeOps:
1. **Compares Policy Versions**: Detects the modified refund window clause (`clause.refund-window`) between Policy Version 1 and Version 2.
2. **Scans Dependencies**: Maps the change to exactly five affected operational artifacts at specific location anchors.
3. **Generates Patches**: Proposes precise text replacements (e.g., replacing "30 days" with "14 days") citing the exact policy change and target anchor.
4. **Enforces Human Approvals**: Requires explicit approve/reject decisions on each of the five patches. Rejections freeze the process, preventing compilation and verification.
5. **Compiles & Verifies Candidates**: Applies approved patches to in-memory candidate copies and executes a separate suite of deterministic, model-free assertions to verify that no stale references remain.
6. **Exports Receipt**: Generates a downloadable Compilation Receipt with a SHA-256 checksum for content-integrity check, along with the patched files.

### How It Works
CascadeOps operates strictly on in-memory candidate copies of the documents and does not write to external enterprise systems or databases:
- **Policy Comparison**: Compares structural clauses in the policy document to identify the exact changed text.
- **Provider Layer**: CascadeOps has two provider modes:
  - **Replay Mode (Default)**: A deterministic, local fixture-backed provider that processes mock data locally without network requests, clearly badged as "Simulated" in the UI.
  - **Live Mode**: An OpenAI API integration utilizing `gpt-5.6` with Structured Outputs. It parses the inputs and returns structured payloads conforming to strict Zod schemas. It uses `store: false` to ensure zero data retention, keeping corporate text private.
- **Fail-Closed Validation**: Every payload from the provider is verified server-side against schema structures, known IDs, valid citations, and exact grounding checks (verifying the "before" text matches the source target). Any failure halts execution with a typed error code.
- **Human Approval State Machine**: Patches must be individually approved. Re-decisions are permitted before compilation. If even one patch is rejected, candidate compilation is blocked.
- **Deterministic Verification**: Once applied, a separate step runs model-free validations: checking that all stale value references are absent, the new value is present, anchors are intact, and untouched blocks are byte-identical.
- **Receipt Generation**: Outputs a JSON receipt summarizing the run details, timestamps, and a SHA-256 content checksum.

### How We Built It
We built CascadeOps using Next.js, React, and TypeScript with a strict focus on validation, security, and accessibility. The development roles were partitioned as follows:
- **Codex Role**: Initialized the Next.js pre-production layout, created the core compiler logic, set up Zod validation schemas, implemented the deterministic verification engine, and built the local testing suites (Vitest unit tests, Playwright end-to-end flows, and Axe accessibility checks).
- **GPT-5.6 Role**: Powered the Live Mode provider, analyzing policy changes and generating proposed patches through structured API outputs with strict schema matching and `store: false`.

### Challenges We Ran Into
- **Strict Grounding Enforcement**: Ensuring that LLM proposals could not hallucinate locations or generate arbitrary edits. We solved this by implementing strict server-side validation that rejects any proposed patch where the `beforeText` does not match the target anchor's original text byte-for-byte.
- **Fail-Closed Security**: Preventing silent degradation of state or model fallbacks. We structured the API so that any invalid model output or network failure instantly triggers a visible typed error (e.g., `CO-VAL-*` or `CO-PROV-*`) and halts the run.
- **Accessibility Integration**: Creating a responsive, accessible interface. We built a toggle that lets users switch from the visual document dependency graph (hidden from screen readers via `aria-hidden="true"`) to a semantic HTML table that supports complete keyboard navigation.

### Accomplishments That We're Proud Of
- **Zero-Dependency Core Validation**: Writing robust, deterministic validation logic that guarantees compliance with the strict data contracts without requiring external state management or heavy libraries.
- **100% Local Smoke Test Verification**: Proving that the Live Mode system runs correctly using the local GPT-5.6 Responses API, and ensuring that Replay mode remains entirely separate and deterministic.
- **Lighthouse/Axe Accessibility Compliance**: Ensuring a 95+ accessibility score, enabling the application to be fully navigated by keyboard and screen readers.

### What We Learned
- **Deterministic Bounds for LLMs**: Large Language Models are highly effective at structured extraction when combined with schema enforcement, but critical operations like verification must be entirely model-free and deterministic.
- **State Invariants**: Structuring the compilation as a series of frozen state transitions (from `IDLE` through `VERIFIED`) ensures that incomplete or rejected operations can never leak into exported assets.

### What's Next for CascadeOps
- **Extending Document Formats**: Parsing and compiling changes across a wider array of document types, including PDF, Markdown, and Word documents.
- **Dry-Run Policy Generators**: Enabling interactive simulations of proposed policy updates to assess downstream operational impact before finalizing changes.
- **Enhanced Local Verification Rules**: Supporting custom, regular expression-based assertion rules that operations teams can configure per location anchor.

---

## Setup & Judging Notes
CascadeOps has been designed for credential-free, zero-config judging out of the box:
1. **Replay Mode (Default)**: The app runs entirely in Replay Mode by default. It features a persistent banner indicating simulated data. You can click through the entire Golden Path (compare clauses, view 5 findings, approve 5 proposals, compile, run verification, and download the receipt) without supplying any API keys.
2. **Live Mode Proof**: Live Mode is supported via the OpenAI Responses API. To protect keys, the public deployment is locked to Replay. However, the system's Live capability is fully proven by the documented local smoke test in `docs/testing/LIVE_GPT_5_6_SMOKE.md` using `gpt-5.6` with `store: false` and strict Structured Outputs.
3. **Local Testing & Verification**:
   - Run unit and contract tests: `npm run test`
   - Run verification assertions test: `npm run demo-assert`
   - Run end-to-end smoke tests (with accessibility checks): `npx playwright test`
   - Run production build: `npm run build`
