# UX Specification — CascadeOps

This document defines the layout, visual design system, interaction states, responsive behaviors, and semantic markup specifications for CascadeOps, optimizing the interface for high-density professional operations and accessibility.

---

## 1. Visual Design System

### 1.1. Core Palette (Neutral Warm Operational theme)
The design prioritizes calm, high-contrast readability over decorative highlights.

| Token | CSS Hex | Purpose / Application | Contrast Ratio |
|---|---|---|---|
| `--bg-canvas` | `#FBFBFA` | Main page canvas background | — |
| `--bg-surface` | `#F2F1ED` | Panels, card containers, inputs background | — |
| `--border-neutral` | `#E4E2DC` | Default card borders, dividers, subtle grids | — |
| `--text-primary` | `#1C1C1A` | Primary ink text (headings, body, active states) | 14.2:1 (on canvas) |
| `--text-secondary` | `#595752` | Secondary graphite text (metadata, labels, descriptions) | 5.8:1 (on canvas) |
| `--trace-blue` | `#1D5C96` | Cobalt blue for active selections and traceability links | 5.2:1 (on canvas) |
| `--state-amber` | `#965600` | Warm amber for items pending review/approval | 4.8:1 (on surface) |
| `--state-red` | `#B91C1C` | Crimson red for failed verification and critical errors | 5.6:1 (on surface) |
| `--state-green` | `#15803D` | Dark forest green for successfully verified operational states | 4.9:1 (on surface) |

### 1.2. Typography
* **Primary Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif.
* **Monospace Font (for diffs, locations, and codes)**: `JetBrains Mono`, `SFMono-Regular`, `Consolas`, monospace.
* **Sizing Rules**:
  * Large Title (`H1`): `1.75rem` / `28px` (Semi-bold, letter-spacing `-0.02em`)
  * Section Title (`H2`): `1.25rem` / `20px` (Semi-bold)
  * Card Header (`H3`): `1rem` / `16px` (Medium)
  * Body Text: `0.875rem` / `14px` (Regular)
  * Metadata/Captions: `0.75rem` / `12px` (Medium)

---

## 2. Layout & Information Architecture

The interface uses a clean, two-column split-panel layout on desktop screens to allow side-by-side context inspection.

```
+-----------------------------------------------------------------------------------+
|  [Logo] CascadeOps (Title)       [Mode: Simulated Replay (Simulated)]   [Receipt] |
+-----------------------------------------------------------------------------------+
|  COLUMN 1: POLICY COMPARATOR      |  COLUMN 2: COMPILATION WORKSPACE              |
|                                   |                                               |
|  Original Policy (Clause REFUND-01)|  [Primary Action: Compile Policy Change]      |
|  "Customers may request refunds   |                                               |
|  within thirty (30) days..."      |  Impact Cascade (5 Dependent Files Found)      |
|                                   |  +-----------------------------------------+  |
|  Revised Policy (REFUND-01-REV)   |  | sop.md#L45                  [PENDING]   |  |
|  "Customers may request refunds   |  | [- thirty (30) -] [+ fourteen (14) +]    |  |
|  within fourteen (14) days..."    |  | [Approve]  [Reject]                      |  |
|                                   |  +-----------------------------------------+  |
|                                   |                                               |
|                                   |  [Verify Operations] [Export Receipt (Disabled)]|
+-----------------------------------------------------------------------------------+
|  Disclaimer: Management and documentation alignment aid. Not legal certification. |
+-----------------------------------------------------------------------------------+
```

### 2.1. Global Shell
* **Header**:
  * Left: App Brand (`CascadeOps`) and Subtitle (`Policy Change Compiler`).
  * Center: Provider Toggle Switch with distinct labels: `Simulated Replay (Simulated)` vs. `Live GPT-5.6`.
  * Right: Workspace context indicator: `"Project: Refund Revision"` and a secondary receipt icon button.
* **Footer**:
  * Non-compliance legal warning: *"CascadeOps is a management and documentation alignment aid. It does not provide legal or compliance certification."*
  * Build mode and verification status indicator.

### 2.2. Column 1: Policy Comparator (Left Panel)
* Displays the source document revision side-by-side or top-to-bottom.
* Clearly highlights the change clause (`REFUND-01`) using diff styling (red deletion, green insertion).
* Left panel remains locked/read-only during compilation, serving as the source of truth.

### 2.3. Column 2: Compilation Workspace (Right Panel)
* Contains the active compilation actions.
* Layout transitions through three distinct phases:
  1. **Pre-compile**: Prompt to click `"Compile Policy Change"`. Impact list is empty/hidden.
  2. **Active Review**: Displays the 5 proposed patch cards. A progress counter shows `X / 5 Approved`.
  3. **Verification**: After reviews, displays the `"Run Verification Check"` button. If successful, transitions to the green verified banner and unlocks `"Export Compilation Receipt"`.

---

## 3. Responsive Layout Specifications

### 3.1. Mobile Screen (360px Width)
* **Layout**: Single vertical flow.
* **Component Adjustments**:
  * Column 1 (Policy) and Column 2 (Workspace) collapse into a tabbed view: `[1. Source Policy]` and `[2. Proposed Patches (5)]`.
  * Patch diffs display inline with reduced horizontal padding.
  * The primary action buttons (`Approve` / `Reject`) span full width, stacked vertically.

### 3.2. Tablet Screen (768px Width)
* **Layout**: Stacked. Policy Comparator is displayed as a full-width header panel on top; Compilation Workspace is displayed below it.
* **Component Adjustments**:
  * Diffs display side-by-side.
  * Workspace cards display in a 1-column layout.

### 3.3. Standard Desktop (1280px Width)
* **Layout**: Side-by-side split panels (Left 45% width, Right 55% width).
* **Component Adjustments**:
  * Policy pane stays sticky on the left.
  * Workspace patch cards display as a vertical list.

### 3.4. Wide Desktop (1440px Width)
* **Layout**: Split panels with maximum main container width capped at `1400px` for optimal eye-span.
* **Component Adjustments**:
  * Left: Policy Pane (40% width).
  * Right: Workspace Pane (60% width) displaying one stable vertical patch list. Do not create uneven multi-column card rows.

---

## 4. Component States

### 4.1. Buttons (Standard Primary/Secondary)
* **Default**: Light beige background (`#F2F1ED`) with thin border (`#E4E2DC`). Ink text (`#1C1C1A`).
* **Hover**: Background transitions to a slightly darker gray (`#E4E2DC`), cursor pointer.
* **Focus**: Keyboard focus reveals a `2px solid #1D5C96` focus outline with `2px` offset.
* **Active**: Minor scale down (`98%`) to give tactile feedback.
* **Disabled**: Opacity `50%`, cursor `not-allowed`, background `#F6F6F4`.

### 4.2. Proposed Patch Cards
* **State 1: Pending (Amber)**:
  * Border: `1px solid #E4E2DC` with a left indicator strip of `#965600`.
  * Label: `[!] Pending Approval` in amber text.
* **State 2: Approved (Dark Gray)**:
  * Border: `1px solid #1C1C1A`.
  * Label: `[✓] Approved` in graphite text.
  * Actions: `Approve` button is highlighted; `Reject` button is secondary.
* **State 3: Rejected (Light Red)**:
  * Border: `1px solid #B91C1C`.
  * Label: `[✗] Rejected` in red text.
* **State 4: Verified (Green)**:
  * Border: `1px solid #15803D`.
  * Label: `[✓] Verified Alignment` in green text.

### 4.3. Simulation/Replay Banner
* **Simulated Replay (Active)**:
  * A clear banner on top: `"Simulated Replay: Using a deterministic local fixture. No model call was made."`
  * Text is colored `#1C1C1A` on `#F2F1ED` with a blue info icon.

---

## 5. Interaction States & Transitions

### 5.1. Loading State (Compile Analysis)
* Triggered by clicking `"Compile Policy Change"`.
* Visual: A calm progress indicator reports only work that actually occurs:
  * Phase 1: `"Comparing policy clauses..."`
  * Phase 2: `"Tracing curated dependencies..."`
  * Phase 3: `"Validating proposed patches..."`
* Transitions to the Impact Cascade list with a smooth fade-in animation (`duration: 200ms`).

### 5.2. Verification Sequence
* Triggered by clicking `"Run Verification Check"`.
* Visual: A linear progress bar fills from left to right over 800ms.
* Output transitions:
  * If successful: Transforms into a green success banner with a tick mark. The receipt download button becomes available without sound or attention-grabbing motion.
  * If failed (e.g. some patches rejected): Banner turns red, listing the outstanding conflicts.

---

## 6. Keyboard Order and Navigation Map

To ensure standard-compliant keyboard navigation:

1. **Header Toggle**: Focuses the Mode Switcher (`Simulated Replay` vs. `Live`).
2. **Left Panel: Policy Clause**: Tab focus highlights the interactive Clause link `REFUND-01` to show metadata.
3. **Primary Action**: Tab focus highlights `"Compile Policy Change"` button.
4. **Patch Review (Loop)**:
   * First patch card: Focuses card link.
   * First patch: Focuses `"Approve"` button.
   * First patch: Focuses `"Reject"` button.
   * (Repeated for patches 2, 3, 4, and 5).
5. **Verification Action**: Focuses `"Run Verification Check"` button.
6. **Export Action**: Focuses `"Export Compilation Receipt"` button.
7. **Footer**: Focuses disclaimer links.
