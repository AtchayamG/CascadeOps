# Demo Storyboard — CascadeOps

This storyboard outlines the visual framing, voiceover script, and technical execution for the judge golden-path video. The target runtime is **2 minutes and 45 seconds**, safely below the 3-minute limit.

---

## Storyboard Overview

* **Video Title**: CascadeOps — One Policy Change. Every Operation Aligned.
* **Narrator / Presenter**: Sarah Vance (Operations Change Owner)
* **Goal**: Demonstrate how CascadeOps compiles a corporate refund window change (30 days to 14 days) across 5 separate documents, reviews and approves patches, runs verification, and generates a compilation receipt.
* **Key Visuals**: Calm neutral warm UI, clear diff panels, loading sequences, verification transition, and terminal code verification.

---

## Detailed Timeline & Script

| Timestamp | Visual Scene | Voiceover Narration | Technical / Agent Context |
|---|---|---|---|
| **0:00 – 0:15** | **Title Card & Console Interface**<br>- Title card displays: *CascadeOps — Policy Change Compiler*.<br>- Camera cuts to a clean web browser showing the neutral warm dashboard.<br>- Hover over the `Simulated Replay` mode badge. | "Hi, I'm Sarah, an operations lead. Implementing a single corporate policy change across an enterprise is painful. Today, I'll show you how CascadeOps turns one revised policy clause into verified operational alignment." | **Codex Context**: Codex initialized the pre-production layout with clean, dependency-free CSS rules. |
| **0:15 – 0:35** | **Policy Clause Comparison**<br>- Zoom in on `clause.refund-window`.<br>- Highlight `30 days` as removed and `14 days` as added. | "Here is our source policy. The refund window changed from 30 days to 14 days, recorded as change.refund-window." | **Data Contract**: The comparative view consumes `PolicyDocument` and `ClauseChange` objects. |
| **0:35 – 0:50** | **Right Panel: Compilation Trigger**<br>- Cursor clicks the large, neutral-warm button: `"Compile Policy Change"`. <br>- A restrained status sequence shows clause comparison, curated dependency tracing and patch validation. | "Let's run the compiler. CascadeOps traces the revised clause through a curated set of dependent operational artifacts and proposes source-linked patches." | **GPT-5.6 Context**: Under Live mode, this executes a bounded structured request using OpenAI's Responses API with `store: false`. |
| **0:50 – 1:15** | **Impact Cascade Display**<br>- The screen reveals 5 document nodes. <br>- The presenter toggles to the accessible table alternative. <br>- Displays: SOP, Request Form, Template, QA Checklist, and Training Guide. | "The compiler identified five affected artifacts in our curated training, customer service, and QA fixture. For accessibility, I can toggle from this visual structure directly to a keyboard-friendly data table." | **Accessibility**: Visual graph is marked `aria-hidden="true"`; screen reader focus moves to the semantic HTML table. |
| **1:15 – 1:45** | **Patch Review & Human Approval Gate**<br>- Review each of the 5 patches in the stable vertical list.<br>- Each `Approve` changes `PROPOSED` to `APPROVED`. | "Each patch cites the exact source change and target anchor, such as sop.step-2.eligibility. I'll inspect and approve all five." | **State Machine**: `PROPOSED` → `APPROVED`. Any rejection blocks apply and verification. |
| **1:45 – 2:10** | **Candidate Compile & Verification**<br>- Presenter clicks `Compile Approved Candidates`, then `Run Verification Check`.<br>- UI reports `VERIFIED: ALL CANDIDATE ARTIFACT ASSERTIONS PASSED`. | "With all patches approved, CascadeOps updates isolated candidate copies, then checks every target for stale 30-day references. All five pass." | **Verification**: Deterministic, model-free assertions over the curated candidate fixture. |
| **1:41 – 1:56** | **Receipt Export**<br>- Presenter clicks `"Export Compilation Receipt"`. <br>- A modal reveals source version, decision totals, verification assertions, timestamp and content digest. | "Finally, CascadeOps exports a compilation receipt containing decision totals and verification results. Its SHA-256 content checksum detects later changes; it is not a digital signature or compliance certificate." | **Receipt Contract**: Outputs a validated `CompilationReceipt` JSON payload with a deterministic content digest. |
| **2:30 – 2:45** | **Outro & Code Validation**<br>- Cut back to presenter.<br>- Show a quick window split of the clean Next.js file structure in VS Code. | "CascadeOps proves that operational alignment doesn't require manual document hunts. One change, every operation aligned. Thank you." | **Repository Proof**: Demonstrates a clean, dependency-light Next.js single-page repository. |

---

## Production / Narration Guidelines

1. **Pacing**: Speak at a steady, calm, operational pace. Avoid "hype-talk" or hurried transitions.
2. **Visual Focus**: Ensure the mouse cursor is steady, using a visible highlight ring on clicks.
3. **Sound**: Use clean narration without background music, avoiding copyright and intelligibility risks.
4. **Captions**: Produce an accurate English `.srt` file and publish it as creator captions on YouTube. Do not obscure the application with hardcoded caption overlays.
