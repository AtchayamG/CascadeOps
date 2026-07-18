# CascadeOps Video Demo Script

- **Target Duration**: 2:30 (150 seconds)
- **Voiceover Character**: Sarah Vance (Operations Lead)
- **Core Focus**: Walkthrough of CascadeOps compiling a policy change (30-to-14-day refund window) across 5 operational documents.

---

## Detailed Storyboard & Narration

### [0:00 – 0:12] Introduction
- **Visual**: A title card showing "CascadeOps — Policy Change Compiler". Camera cuts to a clean web browser showing the CascadeOps dashboard. A persistent banner at the top reads: "Replay Mode — simulated data, no live model". The mouse hovers over this badge.
- **Action**: Hover over the "Simulated Replay" mode badge.
- **Voiceover**: "Hi, I'm Sarah, an operations lead. When an organization changes a policy, downstream materials like SOPs and checklists silently rot. Today, I'll demonstrate how CascadeOps solves this by compiling a policy change across operational artifacts."

### [0:12 – 0:27] Policy Clause Comparison
- **Visual**: Zoom in on the left side of the dashboard, showing the policy comparison view. The screen displays the text of `policy.refund-policy` versions 1 and 2. The clause `clause.refund-window` is highlighted: "30 days" is marked red (deleted) and "14 days" is marked green (added).
- **Action**: Scroll down slightly to show that other clauses are unchanged, producing no diff.
- **Voiceover**: "Here is our source policy. The refund window changed from 30 days to 14 days, recorded as a single clause modification. Other clauses remain untouched, ensuring we isolate only relevant changes."

### [0:27 – 0:42] Impact Scanning Trigger
- **Visual**: Cursor moves to the right panel and hovers over the button: "Compile Policy Change". The cursor clicks it. A status indicator shows the progress: compare clauses, map dependencies, and validate anchors.
- **Action**: Click "Compile Policy Change".
- **Voiceover**: "Let's compile this change. CascadeOps traces the revised clause through a curated set of dependencies. In Live mode, this uses GPT-5.6 with Structured Outputs and `store: false` to protect data privacy, proven in our local smoke test."

### [0:42 – 1:07] Impact Cascade & Accessibility
- **Visual**: The UI displays five document nodes representing the affected files. The cursor moves to a toggle switch labeled "Table View". The user clicks the toggle, and the visual graph is replaced by a clean, semantic HTML data table.
- **Action**: Toggle from the visual graph to the keyboard-friendly table view.
- **Voiceover**: "The compiler identifies exactly five affected artifacts. For accessibility, I can toggle from this visual graph to a semantic, keyboard-friendly data table. The graph is hidden from screen readers, focusing purely on screen-readable data."

### [1:07 – 1:37] Patch Proposals & Approval Gate
- **Visual**: Scroll through the list of 5 Patch Proposals. Each shows a side-by-side diff of the target location. The presenter clicks "Approve" on the first four patches. On the fifth patch, they click "Approve" as well.
- **Action**: Click "Approve" individually on all 5 patches, changing their status from `PROPOSED` to `APPROVED`.
- **Voiceover**: "Here are the five proposed patches, each citing the exact target anchor and policy clause change. We must approve each patch individually. Rejections block candidate compilation, preventing any unchecked changes from being applied."

### [1:37 – 2:02] Candidate Compilation & Verification
- **Visual**: Click the button "Compile Approved Candidates". The UI transitions to the "Candidates Applied" state. Then, click "Run Verification Check". A loading spinner runs for a moment, then reveals a green banner: "VERIFIED: ALL CANDIDATE ARTIFACT ASSERTIONS PASSED".
- **Action**: Click "Compile Approved Candidates", then click "Run Verification Check".
- **Voiceover**: "Now we compile the approved changes into isolated candidate copies, then execute our deterministic verification check. This model-free step asserts that no stale 30-day references remain and all other content is unchanged."

### [2:02 – 2:17] Receipt Export
- **Visual**: Click "Export Compilation Receipt". A modal pops up showing the run details. Click "Download JSON Receipt".
- **Action**: Click "Export Compilation Receipt", then click "Download JSON Receipt" to trigger the file download.
- **Voiceover**: "With verification passed, we export our compilation receipt. This JSON file records every decision and verification assertion. Its SHA-256 checksum verifies content integrity only, without acting as a digital signature."

### [2:17 – 2:30] Repository & Outro
- **Visual**: A split screen showing VS Code containing the Next.js project structure. Point out the compiler logic and testing directories. Title card reappears.
- **Action**: Highlight the clean Next.js file layout.
- **Voiceover**: "Our clean repository and rigorous test gates were built by Codex, with GPT-5.6 handling live structured inference. CascadeOps keeps operations aligned. One policy change, every operation aligned. Thank you."
