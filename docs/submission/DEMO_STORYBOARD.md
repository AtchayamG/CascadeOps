# Demo Storyboard — CascadeOps

This storyboard outlines the visual framing, voiceover script, and technical execution for the official 90-second judge golden path demo video. The total runtime is **2 minutes and 45 seconds**, safely below the 3-minute hackathon limit.

---

## Storyboard Overview

* **Video Title**: CascadeOps — One Policy Change. Every Operation Aligned.
* **Narrator / Presenter**: Sarah Vance (Operations Change Owner)
* **Goal**: Demonstrate how CascadeOps compiles a corporate refund window change (30 days to 14 days) across 5 separate documents, reviews and approves patches, runs verification, and generates a sealed receipt.
* **Key Visuals**: Calm neutral warm UI, clear diff panels, loading sequences, verification transition, and terminal code verification.

---

## Detailed Timeline & Script

| Timestamp | Visual Scene | Voiceover Narration | Technical / Agent Context |
|---|---|---|---|
| **0:00 – 0:15** | **Title Card & Console Interface**<br>- Title card displays: *CascadeOps — Policy Change Compiler*.<br>- Camera cuts to a clean web browser showing the neutral warm dashboard.<br>- Hover over the `Simulated Replay` mode badge. | "Hi, I'm Sarah, an operations lead. Implementing a single corporate policy change across an enterprise is painful. Today, I'll show you how CascadeOps turns one revised policy clause into verified operational alignment." | **Codex Context**: Codex initialized the pre-production layout with clean, dependency-free CSS rules. |
| **0:15 – 0:35** | **Left Panel: Policy Clause Comparison**<br>- Zoom in on the Left Column showing Clause `REFUND-01`. <br>- Highlights show `thirty (30) days` in red strike-through, and `fourteen (14) days` in green. | "Here is our source policy panel. Executive management has shortened our refund window from 30 days to 14 days. You can see the old and new text highlighted side-by-side. The changes are tracked under Clause Code `REFUND-01`." | **Data Contract**: The comparative view consumes `PolicyDocument` and `ClauseChange` contract objects. |
| **0:35 – 0:50** | **Right Panel: Compilation Trigger**<br>- Cursor clicks the large, neutral-warm button: `"Compile Policy Change"`. <br>- A subtle spinner appears: `"Scanning operational documents..."` for 1.5 seconds. | "Let's run the compiler. CascadeOps scans our operational repository, looking for files containing sections that depend on this refund policy clause." | **GPT-5.6 Context**: Under Live mode, this executes a structured prompt using OpenAI's Responses API with `store: false`. |
| **0:50 – 1:15** | **Impact Cascade Display**<br>- The screen reveals 5 document nodes. <br>- The presenter toggles to the accessible table view to show WCAG compliance. <br>- Displays: SOP, Request Form, Template, QA Checklist, and Training Guide. | "The compiler identified five affected files in our training, customer service, and QA folders. For accessibility, I can toggle from this visual structure directly to a keyboard-friendly data table." | **Accessibility**: Visual graph is marked `aria-hidden="true"`; screen reader focus moves to the semantic HTML table. |
| **1:15 – 1:45** | **Patch Review & Human Approval Gate**<br>- Hovering and clicking on each of the 5 patch cards one-by-one. <br>- Each click of `"Approve"` transitions the card from an Amber `PENDING` state to a neutral gray `APPROVED` state. | "Let's review the proposed patches. Each patch is source-linked: it cites the exact target file location, like our Support SOP line 45, and the original clause. I'll inspect and approve all five patches." | **State Machine**: State transitions: `Pending` → `Approved`. Rejecting any patch blocks verification. |
| **1:45 – 2:10** | **Operations Verification Engine**<br>- Presentation highlights that the global status is `UNVERIFIED` (Amber).<br>- Presenter clicks `"Run Verification Check"`. <br>- A progress bar runs for 800ms.<br>- UI bursts into a clean green success banner: `[✓] VERIFIED: ALL OPERATIONS ALIGNED`. | "With all patches approved, we run our verification check. The engine scans the draft files in-memory to ensure zero operational drift. Within seconds, our operations are verified as fully aligned." | **Verification**: Deterministic checker scans files in-memory for residual `30-day` occurrences. |
| **2:10 – 2:30** | **Receipt Export & sealed receipt**<br>- Presenter clicks `"Export Compilation Receipt"`. <br>- A modal slide-out reveals the receipt containing hashes, timestamps, and signatures. <br>- Presenter clicks `"Download JSON Receipt"`. | "Finally, I compile our sealed receipt. It contains cryptographic signatures and hashes, proving our files are aligned to this policy. Drift risk is eliminated, and I can download this receipt for audits." | **Receipt Contract**: Outputs a signed `CompilationReceipt` JSON payload with a preview SHA-256 digest. |
| **2:30 – 2:45** | **Outro & Code Validation**<br>- Cut back to presenter.<br>- Show a quick window split of the clean Next.js file structure in VS Code. | "CascadeOps proves that operational alignment doesn't require manual document hunts. One change, every operation aligned. Thank you." | **Repository Proof**: Demonstrates a clean, dependency-light Next.js single-page repository. |

---

## Production / Narration Guidelines

1. **Pacing**: Speak at a steady, calm, operational pace. Avoid "hype-talk" or hurried transitions.
2. **Visual Focus**: Ensure the mouse cursor is steady, using a visible highlight ring on clicks.
3. **Sound**: Keep background music extremely soft, using a neutral corporate ambient track.
4. **Captions**: Include hardcoded, high-contrast captions on the video to meet WCAG accessibility standards for video submissions.
