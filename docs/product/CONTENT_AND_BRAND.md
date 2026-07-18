# Content and Brand Foundation — CascadeOps

This document establishes the product identity, tone of voice guidelines, prohibited terminology, and the exact interface copy required for the CascadeOps policy compilation workflow.

---

## 1. Brand and Product Identity

* **Product Name**: CascadeOps
* **Full Title**: CascadeOps — Policy Change Compiler
* **Tagline**: One policy change. Every operation aligned.
* **Core Pitch**: CascadeOps turns an approved policy change into a traceable, reviewable, and verified patch set across every affected operational artifact.
* **Category**: Work & Productivity

---

## 2. Tone of Voice Guidelines

The CascadeOps brand voice is **precise, calm, and operational**.
| Tone Dimension | Target Style | What to Avoid |
|---|---|---|
| **Credibility** | Descriptive and evidence-backed. Explain *how* patches are mapped and verified. | Magical, instantaneous, or autonomous claims (e.g., "automatically updates everything!"). |
| **Authority** | Centered on operational alignment and tracing. | Legal, compliance, or regulatory certification claims (e.g., "compliance guaranteed"). |
| **Clarity** | Ink-on-paper style. Uses exact locations, file paths, and diffs. | Vague progress bars, hidden hashes, or "black box" agent decisions. |

---

## 3. Prohibited & Approved Terminology

To preserve truthfulness and maintain the product boundary, the following vocabulary rules must be strictly enforced:

* **Prohibited Words**:
  * *Legally compliant*, *Compliance certification*, *Legally binding*, *Guaranteed compliance* (CascadeOps is an alignment aid, not a law firm).
  * *Auto-commit*, *Auto-write*, *Production sync* (P0 is read-only and requires human review).
  * *Autonomous agent*, *Self-healing documentation* (avoid hype; use "compiler" and "patch proposed").
  * *Live* (when referring to simulated replay fixtures).

* **Approved Words**:
  * *Alignment aid*, *Operational traceability*, *Policy compilation*, *Verification engine*.
  * *Simulated Replay* (for demo fixtures), *Live GPT-5.6* (for Responses API execution).
  * *Proposed patches*, *Human review gate*, *Deterministic verification check*.
  * *Compilation receipt*, *Content digest*.

---

## 4. Exact Golden Path Interface Copy

This section contains the exact string constants to be rendered in the user interface during the 30-day to 14-day refund window demo.

### 4.1. Core Headers and Shell
* **Application Title**: `CascadeOps — Policy Change Compiler`
* **Footer Disclaimer**: `"CascadeOps is a management and documentation alignment aid. It does not provide legal or compliance certification."`
* **Replay Toggle Text**:
  * Active (Left): `Simulated Replay`
  * Inactive (Right): `Live GPT-5.6`
  * Safety Badge: `Simulated` (rendered in high-contrast neutral badge next to the toggle in Replay mode)

### 4.2. Policy Change Panel (Left Column)
* **Title**: `Source Policy Revision`
* **Active Project Label**: `Refund Policy Amendment (M0 Golden Path)`
* **Original Policy Card Header**: `Original Clause (REFUND-01)`
* **Original Text**: `"Customers may request a full refund within thirty (30) days of purchase."`
* **Revised Policy Card Header**: `Revised Clause (REFUND-01-REV)`
* **Revised Text**: `"Customers may request a full refund within fourteen (14) days of purchase."`

### 4.3. Compilation Workspace (Right Column)
* **Primary Compile Button (Idle)**: `Compile Policy Change`
* **Primary Compile Button (Loading)**: `Compiling alignments...`
* **Impact Cascade Subheader**: `Impact Cascade (5 affected artifacts found)`

### 4.4. The 5 Curated Operational Patches (Before Approval)

#### Patch 1: Support SOP
* **Location Reference**: `docs/operations/sop.md#L45`
* **Source Link**: `Linked to Clause REFUND-01-REV`
* **Old Text**: `"- Verify that the order timestamp is within the 30-day window."`
* **New Text**: `"- Verify that the order timestamp is within the 14-day window."`
* **Actions**: `[ Approve Patch ]` `[ Reject Patch ]`

#### Patch 2: Refund Request Form
* **Location Reference**: `docs/templates/refund_form.json#L12`
* **Source Link**: `Linked to Clause REFUND-01-REV`
* **Old Text**: `"description": "Refunds must be requested within 30 days of the purchase date."`
* **New Text**: `"description": "Refunds must be requested within 14 days of the purchase date."`
* **Actions**: `[ Approve Patch ]` `[ Reject Patch ]`

#### Patch 3: Customer-Response Template
* **Location Reference**: `docs/macros/customer_decline_response.txt#L8`
* **Source Link**: `Linked to Clause REFUND-01-REV`
* **Old Text**: `"Because your request falls outside our 30-day refund window..."`
* **New Text**: `"Because your request falls outside our 14-day refund window..."`
* **Actions**: `[ Approve Patch ]` `[ Reject Patch ]`

#### Patch 4: QA Checklist
* **Location Reference**: `docs/qa/checklist.md#L22`
* **Source Link**: `Linked to Clause REFUND-01-REV`
* **Old Text**: `"* Confirm request date is <= 30 days from purchase date."`
* **New Text**: `"* Confirm request date is <= 14 days from purchase date."`
* **Actions**: `[ Approve Patch ]` `[ Reject Patch ]`

#### Patch 5: Training Guide
* **Location Reference**: `docs/training/onboarding_guide.md#L88`
* **Source Link**: `Linked to Clause REFUND-01-REV`
* **Old Text**: `"We maintain a 30-day refund window for standard customers."`
* **New Text**: `"We maintain a 14-day refund window for standard customers."`
* **Actions**: `[ Approve Patch ]` `[ Reject Patch ]`

### 4.5. Verification Panel
* **Verify Button (Idle)**: `Run Verification Check`
* **Verify Button (Running)**: `Verifying candidate artifacts...`
* **Success Banner Header**: `[✓] VERIFIED: ALL OPERATIONS ALIGNED`
* **Success Banner Subtext**: `"0 instances of drift detected. All 5 operational files are fully aligned with Clause REFUND-01-REV (14 days)."`
* **Failure Banner Header**: `[✗] DISCREPANCY DETECTED`
* **Failure Banner Subtext**: `"Verification failed. One or more patches have been rejected or remain pending. Operational drift risk: High."`

### 4.6. Compilation Receipt (Modal Dialog)
* **Modal Header**: `Compilation Receipt`
* **Receipt ID**: `COMP-REC-2026-07-18-001`
* **Source Version**: `REFUND-01-REV (SHA-256: 7a8b...3c9d)`
* **Alignment Status**: `100% VERIFIED`
* **Files Compiled**: `5 / 5`
* **Integrity Block**:
  * `Compiler: CascadeOps v0.1 — Simulated Replay`
  * `Receipt digest: SHA-256 content checksum (not a digital signature)`
* **Primary Export Button**: `Download JSON Receipt`
* **Dismiss Button**: `Close Receipt`
