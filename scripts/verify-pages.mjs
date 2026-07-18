import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const baseURL = process.env.PAGES_URL;
if (!baseURL) throw new Error("PAGES_URL is required");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

try {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "CascadeOps" }).waitFor();
  const liveButton = page.getByRole("button", { name: "Live GPT-5.6" });
  if (await liveButton.isEnabled()) throw new Error("Static deployment must disable Live GPT-5.6.");

  await page.getByRole("button", { name: "Compile Policy Change" }).click();
  await page.getByText("5 affected artifacts found").waitFor();
  const cards = page.locator("ul[role='list'] > li");
  if ((await cards.count()) !== 5) throw new Error("Expected exactly five patch cards.");
  for (let index = 0; index < 5; index += 1) {
    await cards.nth(index).getByRole("button", { name: "Approve Patch" }).click();
  }
  await page.getByRole("button", { name: "Compile Approved Candidates" }).click();
  await page.getByText("Candidate Compiled", { exact: false }).first().waitFor();
  await page.getByRole("button", { name: "Run Verification Check" }).click();
  await page.getByText("VERIFIED: ALL CANDIDATE ASSERTIONS PASSED").waitFor();
  await page.getByRole("button", { name: "Export Compilation Receipt" }).click({ force: true });
  await page.locator("#receipt-modal-title").waitFor();
  await page.getByText("5 / 5 VERIFIED").waitFor();

  const accessibility = await new AxeBuilder({ page }).analyze();
  if (accessibility.violations.length > 0) {
    throw new Error(`Accessibility violations: ${JSON.stringify(accessibility.violations)}`);
  }
  console.log("GitHub Pages replay flow verified.");
} finally {
  await context.close();
  await browser.close();
}
