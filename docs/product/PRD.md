# Product Requirements Document (PRD) — CascadeOps

## 1. Product Identity and Vision

* **Product Name**: CascadeOps
* **Full Title**: CascadeOps — Policy Change Compiler
* **Tagline**: One policy change. Every operation aligned.
* **One-Line Pitch**: CascadeOps turns an approved policy change into a traceable, reviewable, and verified patch set across every affected operational artifact.
* **Category**: Work & Productivity
* **Core Value Proposition**: In enterprise operations, a single corporate policy change (such as a shortened refund window) requires updating dozens of manuals, forms, templates, checklists, and guides. Doing this manually is slow, error-prone, and lacks traceability. CascadeOps automates the compile-time analysis, tracing exact policy clauses to their corresponding locations in downstream operational artifacts, proposing explicit patches, and verifying alignment before export.
* **Disclaimer**: CascadeOps is an operational alignment aid, not legal advice or compliance certification.

---

## 2. User Persona and Role

### Primary Persona: Sarah Vance (Operations Change Owner)
* **Title**: Operations Change Lead / Quality Assurance Manager
* **Responsibilities**:
  * Implementing approved policy revisions across the customer service, training, and QA divisions.
  * Ensuring zero discrepancies between official policy and live support documentation.
  * Verifying operational readiness before changes are disseminated.
* **Pain Points**:
  * Tracking down every document that references a revised policy clause.
  * Explaining the source of a policy update to skeptical regional team leads.
  * Verifying that all changed documents are internally consistent.
* **Objective for Golden Path**: Safely compile the transition of a refund window from 30 days to 14 days, review and approve proposed patches across 5 operational documents, run deterministic verification, and obtain a sealed compilation receipt.

---

## 3. P0 Scope & Golden Path Scenario

To maintain a dependency-light, single-application footprint (Next.js, client-side Reactivity, no database, no authentication), the P0 release is bounded to a single, high-fidelity refund-policy change cascade.

### The Policy Revision
* **Original Policy**: "Customers may request a full refund within thirty (30) days of purchase." (Clause `REFUND-01`)
* **Revised Policy**: "Customers may request a full refund within fourteen (14) days of purchase." (Clause `REFUND-01-REV`)

### The 5 Curated Operational Artifacts (Dependent Corpus)
1. **Support SOP (Standard Operating Procedure)**:
   * *Target Location*: Section 3.2 (Escalation Path for Standard Refund Requests)
   * *Target Snippet*: "...verify that the order timestamp is within the 30-day window..."
2. **Refund Request Form**:
   * *Target Location*: Field Description (Footer disclaimer note)
   * *Target Snippet*: "Refunds must be requested within 30 days of the purchase date."
3. **Customer-Response Template**:
   * *Target Location*: Paragraph 2 (Polite denial macro)
   * *Target Snippet*: "Because your request falls outside our 30-day refund window..."
4. **QA Checklist**:
   * *Target Location*: Step 4.a (Auditing agent adherence)
   * *Target Snippet*: "Confirm request date is ≤ 30 days from purchase date."
5. **Training Guide**:
   * *Target Location*: Page 12 (Core Customer Service Rules)
   * *Target Snippet*: "We maintain a 30-day refund window for standard customers."

---

## 4. Functional Requirements

### 4.1. Policy Document Comparator
* **Requirement**: Display side-by-side (or unified diff-style) comparison of the old policy vs. the new policy.
* **P0 Golden Path**: Highlight the exact change from `thirty (30) days` to `fourteen (14) days` in Clause `REFUND-01`.
* **Traceability**: The UI must display the clause identifier (`REFUND-01`) clearly.

### 4.2. Provider Mode Selector
* **Requirement**: Explicitly toggle between "Simulated Replay" and "Live GPT-5.6" provider modes.
* **Safety Cue**:
  * When in **Simulated Replay** mode, the UI must display a clear, permanent "Simulated" badge to show that the output uses pre-compiled deterministic fixtures.
  * When in **Live GPT-5.6** mode, the UI must indicate it uses the OpenAI Responses API with `store: false` to process the change dynamically without storing corporate policy data.

### 4.3. Impact Cascade Viewer
* **Requirement**: Show a list of all affected downstream files, indicating how and where they depend on the updated clause.
* **Accessibility**: Graph-like representations must be accompanied by (or toggleable to) a structured list/table format to ensure compatibility with screen readers.
* **Metadata**: For each of the 5 operational artifacts, show:
  * File Name and Type
  * Location within the file (e.g., Line 45, Section 3.2)
  * Dependency status (e.g., Unresolved, Patched, Verified)

### 4.4. Source-Linked Patch Inspector
* **Requirement**: Present detailed patch cards showing the exact replacement to be applied.
* **Traceability Rules**: Each patch must explicitly display:
  * The source policy clause code (`REFUND-01`)
  * The target file path and location (`docs/operations/sop.md#L45`)
  * A side-by-side diff showing the old text (red background, strike-out) vs. the proposed text (green background).

### 4.5. Human Approval Gate
* **Requirement**: Provide explicit buttons to "Approve" or "Reject" each patch individually.
* **State Machine Rules**:
  * Patches start in `Pending Review` (amber status indicators).
  * A patch can be changed to `Approved` or `Rejected`.
  * The global verification step is locked until all 5 patches have an explicit human decision.
  * Rejected patches cannot be compiled or exported.

### 4.6. Deterministic Verification Engine
* **Requirement**: Run a verification check to ensure in-memory compliance across all approved patches.
* **Feedback States**:
  * **Verified (Green)**: All 5 patches approved and internally consistent (e.g., all referencing 14 days).
  * **Unverified (Amber/Gray)**: Verification has not yet been executed, or patches are pending.
  * **Failed (Red)**: One or more patches were rejected, or a discrepancy exists (e.g., one document was missed or left at 30 days).

### 4.7. Compilation Receipt & Export
* **Requirement**: Once verified, allow the operations lead to export a compilation receipt.
* **Receipt Metadata**:
  * Compilation Timestamp (ISO 8601)
  * Policy Source Version Hash
  * Approved Patches count (5/5)
  * Verification status: `SUCCESSFUL`
  * Cryptographic signature preview (simulated SHA-256 digest)
  * Download button for the receipt JSON/PDF.

---

## 5. Non-Functional & Safety Requirements

### 5.1. Safety & Grounding Boundaries
* **Legal/Compliance Claims**: The app must not make any legal, compliance, or regulatory certification claims. A persistent footer notice must state: *"CascadeOps is a management and documentation alignment aid. It does not provide legal or compliance certification."*
* **Connector Restraints**: No external enterprise write actions (no direct commits to GitHub, no Slack alerts, no database storage, no Confluence writes). The output is strictly exported locally to a receipt or downloaded diff.
* **Data Privacy**: Live GPT-5.6 prompts must use `store: false` to comply with standard enterprise data privacy expectations.

### 5.2. Visual System and Accessibility
* **Color System**: Strictly adhere to a calm, graphite, warm-neutral palette. No fluorescent neon agency dashboards. Colors must serve an operational purpose (Green = Verified, Amber = Review/Pending, Red = Failed Verification, Blue/Teal = Traceability).
* **WCAG Compliance**: Contrast ratios must meet WCAG 2.2 AA (minimum 4.5:1 for text, 3:1 for graphical objects/state indicators).
* **Responsive Layouts**: Design must adapt gracefully from a single-column mobile view (360px) to wide-screen desktop panels (1440px).

---

## 6. Out of Scope (P0 Exclusions)
* Multi-user authentication, roles, and authorization policies.
* Live connectors to Jira, Confluence, SharePoint, or production Git repos.
* Storage databases (all state is client-side in-memory or sessionStorage).
* Support for arbitrary policy documents or multi-clause revisions in M0 Replay (only the single 30-day to 14-day refund window change).
