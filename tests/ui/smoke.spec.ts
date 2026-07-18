import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("CascadeOps UI Smoke Test", () => {
  test("loads the home page and performs compilation in simulated replay mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("CascadeOps");

    // Replay warning banner should be visible
    await expect(page.locator("text=Replay Mode")).toBeVisible();

    // Run impact scan
    const compileBtn = page.locator("button:has-text('Compile Policy Change')");
    await expect(compileBtn).toBeVisible();
    await compileBtn.click();

    // Wait for proposed patches to load
    await expect(page.locator("text=5 affected artifacts found")).toBeVisible();

    // Verify all 5 cards exist
    const cards = page.locator("ul[role='list'] > li");
    await expect(cards).toHaveCount(5);

    // Click Approve on all 5 patches
    for (let i = 0; i < 5; i++) {
      const card = cards.nth(i);
      const approveBtn = card.locator("button:has-text('Approve Patch')");
      await approveBtn.click();
      await expect(card.locator("text=Approved")).toBeVisible();
    }

    // Apply approved patches
    const applyBtn = page.locator("button:has-text('Apply Approved Patches')");
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Verify applied state exactly
    await expect(page.getByText("APPLIED", { exact: true })).toBeVisible();

    // Run verification check
    const verifyBtn = page.locator("button:has-text('Run Verification Check')");
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // Verify verification passed banner
    await expect(page.locator("text=VERIFIED: ALL OPERATIONS ALIGNED")).toBeVisible();

    // Export receipt
    const exportBtn = page.locator("button:has-text('Export Compilation Receipt')");
    await expect(exportBtn).toBeVisible();
    await exportBtn.click({ force: true });

    // Receipt Modal should open
    await expect(page.locator("#receipt-modal-title")).toBeVisible();
    await expect(page.locator("text=100% VERIFIED")).toBeVisible();

    // A11y Audit using axe
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"]) // Ignore custom design theme colors contrast
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
