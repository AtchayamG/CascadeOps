# Accessibility Specification (WCAG 2.2 AA) — CascadeOps

CascadeOps is designed as an inclusive enterprise operations tool. This specification details the semantic structure, keyboard interaction patterns, and sensory guidelines required to meet **WCAG 2.2 AA** conformance.

---

## 1. Keyboard Navigation and Focus Management

### 1.1. Focus Outline System
* **Rule**: Default browser focus outlines are overridden with a high-contrast focus ring.
* **Styling**: `outline: 2px solid var(--trace-blue); outline-offset: 2px;`
* **Color**: `#1D5C96` (providing at least 4.5:1 contrast against both canvas `#FBFBFA` and surface `#F2F1ED`).
* **Hover + Focus**: Focus state must remain visible even if hover styles are active.

### 1.2. Focus Trapping (Modal Compilation Receipt)
When the user clicks `"Export Compilation Receipt"`, a modal/drawer opens displaying the receipt details.
* **Focus Transition**: Focus is programmatically shifted to the modal header (`H2`) with `tabindex="-1"`.
* **Trap Mechanism**: Keyboard navigation (`Tab` and `Shift + Tab`) is restricted within the boundary of the modal.
* **Escape Hatch**: Pressing the `Escape` key closes the modal and returns focus to the `"Export Compilation Receipt"` trigger button.
* **Close Button**: A clearly visible, keyboard-accessible close button `[X]` must be the first or last interactive element in the trap loop.

---

## 2. Screen Reader Semantics and ARIA Attributes

### 2.1. Dynamic Banners & Status Changes
Since CascadeOps updates state dynamically (compiling, approving, verifying), assistive technologies must be notified immediately.

* **Mode Toggle**:
  * The Replay/Live switch uses a semantic checkbox pattern:
    ```html
    <button role="switch" aria-checked="false" aria-label="Toggle between Replay and Live GPT-5.6 mode">
      Simulated Replay
    </button>
    ```
* **Compilation Status (Loading State)**:
  * During compilation, a container with `aria-live="polite"` and `role="status"` announces:
    * `"Analyzing operational documents, please wait..."`
    * Upon completion: `"Compilation complete. 5 proposed patches are ready for review."`
* **Verification Outcome**:
  * Successful verification uses `role="status"` and `aria-live="assertive"` to announce:
    * `"Verification successful. All operational artifacts are aligned to the 14-day refund window."`
  * Failed verification announces:
    * `"Verification failed. One or more patches have been rejected."`

### 2.2. The Impact Cascade: Accessible List Alternative
While visual users may see a graph layout of dependencies, screen reader users require a structured, linear layout.
* **Visual Graph ARIA**: The graphical SVG canvas is marked `aria-hidden="true"` to prevent screen reader confusion.
* **HTML Table Alternative**: A semantic data table is provided directly next to or as a replacement toggle:
  ```html
  <table aria-label="Impact Cascade: Affected Operational Artifacts">
    <thead>
      <tr>
        <th scope="col">Operational Artifact</th>
        <th scope="col">Affected Location</th>
        <th scope="col">Current Review Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Support SOP (sop.md)</th>
        <td><code>sop.step-2.eligibility</code></td>
        <td><span aria-label="Status: Pending Review">Pending Review</span></td>
      </tr>
      <!-- Additional rows for the other 4 artifacts -->
    </tbody>
  </table>
  ```

---

## 3. Non-Color Status Cues

Color is never used as the sole indicator of state, status, or progress.

* **Pending / Review Needed (Amber)**:
  * *Color*: `#965600`
  * *Companion Cue*: Prepended text tag and icon: `[!] Pending Review` or `(Amber Indicator) Alert Symbol`.
* **Verified / Safe (Green)**:
  * *Color*: `#15803D`
  * *Companion Cue*: Checkmark icon and text tag: `[✓] Verified`.
* **Rejected / Failed (Red)**:
  * *Color*: `#B91C1C`
  * *Companion Cue*: Bold crossmark icon and text tag: `[✗] Rejected` or `[X] Discrepancy Found`.

---

## 4. Reduced Motion & Responsive Accessibility

### 4.1. Motion Control
* **Styling Rule**: Use the CSS media query `prefers-reduced-motion` to disable or simplify visual transitions.
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
* **Application**: The loading spinner during compile changes to a static text indicator (`"Loading..."`), and the slide-out drawers snap instantly into place instead of sliding.

### 4.2. Target Size & Spacing
* **Touch Targets**: All interactive elements (mode selectors, approval buttons, tabs) have a minimum size of `44 x 44 pixels` (or `48 x 48 pixels` on mobile) to assist users with motor impairments.
* **Text Resizing**: The application interface layout allows the viewport to be zoomed up to `200%` without text overlapping or horizontal scroll bars appearing on desktop.
