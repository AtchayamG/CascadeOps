import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = process.env.DEMO_OUTPUT_DIR;

if (!outputDir) {
  throw new Error("DEMO_OUTPUT_DIR is required");
}

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outputDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const video = page.video();

const waitUntil = async (startedAt, seconds) => {
  const remaining = startedAt + seconds * 1000 - Date.now();
  if (remaining > 0) await page.waitForTimeout(remaining);
};

await page.goto(baseURL, { waitUntil: "networkidle" });
await page.locator("h1").waitFor();
const startedAt = Date.now();

// Global 0:10-0:27: source change and honest Replay Mode label.
await waitUntil(startedAt, 8);
await page.getByText("30 days", { exact: false }).first().scrollIntoViewIfNeeded();
await waitUntil(startedAt, 17);

// Global 0:27-0:47: trace the five impacted artifacts.
await page.getByRole("button", { name: "Compile Policy Change" }).click();
await page.getByText("5 affected artifacts found").waitFor();
const cards = page.locator("ul[role='list'] > li");
await cards.first().scrollIntoViewIfNeeded();
await waitUntil(startedAt, 29);
await cards.nth(1).scrollIntoViewIfNeeded();
await waitUntil(startedAt, 37);

// Global 0:47-1:06: demonstrate explicit rejection and fail-closed compilation.
await cards.first().scrollIntoViewIfNeeded();
for (let index = 1; index < 5; index += 1) {
  await cards.nth(index).getByRole("button", { name: "Approve Patch" }).click();
}
await cards.first().getByRole("button", { name: "Reject Patch" }).click();
await waitUntil(startedAt, 41);
await page.getByRole("button", { name: "Compile Approved Candidates" }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Compile Approved Candidates" }).click();
await page.locator('[role="alert"]:has-text("CO-STATE-002")').waitFor();
await waitUntil(startedAt, 46);
await cards.first().getByRole("button", { name: "Approve Patch" }).click();
await page.getByText("5 / 5 Approved", { exact: true }).scrollIntoViewIfNeeded();
await waitUntil(startedAt, 56);

// Global 1:06-1:22: compile isolated candidate copies.
await page.getByRole("button", { name: "Compile Approved Candidates" }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Compile Approved Candidates" }).click();
await page.getByText("Candidate Compiled", { exact: false }).first().waitFor();
await cards.first().scrollIntoViewIfNeeded();
await waitUntil(startedAt, 72);

// Global 1:22-1:41: run separate deterministic verification.
await page.getByRole("button", { name: "Run Verification Check" }).scrollIntoViewIfNeeded();
await waitUntil(startedAt, 77);
await page.getByRole("button", { name: "Run Verification Check" }).click();
await page.getByText("VERIFIED: ALL CANDIDATE ASSERTIONS PASSED").waitFor();
await page.getByText("VERIFIED: ALL CANDIDATE ASSERTIONS PASSED").scrollIntoViewIfNeeded();
await waitUntil(startedAt, 91);

// Global 1:41-2:05: open and inspect the JSON compilation receipt.
await page.getByRole("button", { name: "Export Compilation Receipt" }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Export Compilation Receipt" }).click({ force: true });
await page.locator("#receipt-modal-title").waitFor();
await waitUntil(startedAt, 106.3);

await page.close();
await context.close();
await browser.close();

const videoPath = await video.path();
const finalPath = path.join(outputDir, "cascadeops-app.webm");
await fs.copyFile(videoPath, finalPath);
console.log(finalPath);
