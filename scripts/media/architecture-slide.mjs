import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const outputPath = process.env.ARCHITECTURE_SLIDE_OUTPUT;
if (!outputPath) throw new Error("ARCHITECTURE_SLIDE_OUTPUT is required");
await fs.mkdir(path.dirname(outputPath), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html>
<html><head><style>
*{box-sizing:border-box}body{margin:0;width:1280px;height:720px;background:#07141a;color:#eaf4f5;font-family:Inter,Segoe UI,Arial,sans-serif;padding:58px 72px;overflow:hidden}
.eyebrow{color:#65d8c5;letter-spacing:.18em;font-size:16px;font-weight:700}.title{font-size:48px;font-weight:800;margin:16px 0 8px}.sub{color:#a9bac0;font-size:20px;margin-bottom:38px}.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:28px}.panel{border:1px solid #28424b;background:#0d2028;border-radius:16px;padding:26px}.flow{display:flex;align-items:center;gap:10px;margin:18px 0 30px}.node{padding:13px 15px;background:#12313a;border:1px solid #3f6d76;border-radius:10px;font-weight:700;font-size:14px}.arrow{color:#dc8d63;font-weight:900}.fact{display:flex;gap:14px;margin:18px 0;line-height:1.35}.check{color:#65d8c5;font-weight:900}.label{font-weight:800}.detail{color:#a9bac0;font-size:14px;margin-top:4px}.proof{font-size:30px;font-weight:800;color:#65d8c5}.proofline{border-top:1px solid #28424b;margin:20px 0}.footer{position:absolute;left:72px;bottom:46px;color:#7f979e;font-family:Consolas,monospace;font-size:13px}
</style></head><body>
<div class="eyebrow">CODEX + GPT-5.6</div>
<div class="title">Bounded AI. Deterministic authority.</div>
<div class="sub">A transparent compiler pipeline for operational policy changes</div>
<div class="grid"><div class="panel">
<div class="flow"><div class="node">GPT-5.6<br>Structured Outputs</div><div class="arrow">→</div><div class="node">Zod contracts</div><div class="arrow">→</div><div class="node">Human decisions</div></div>
<div class="flow"><div class="node">Atomic candidate compile</div><div class="arrow">→</div><div class="node">Deterministic verify</div><div class="arrow">→</div><div class="node">JSON receipt</div></div>
<div class="fact"><div class="check">✓</div><div><div class="label">No silent live-to-replay fallback</div><div class="detail">Replay is visibly simulated; Live Mode fails closed.</div></div></div>
<div class="fact"><div class="check">✓</div><div><div class="label">No enterprise writes</div><div class="detail">Candidate copies remain isolated and in memory.</div></div></div>
</div><div class="panel">
<div class="proof">22 deterministic tests</div><div class="detail">Contracts, compiler, routes, workflow, receipt</div>
<div class="proofline"></div><div class="proof">2 browser flows + axe</div><div class="detail">Desktop and mobile end-to-end accessibility checks</div>
<div class="proofline"></div><div class="proof">1 bounded live smoke</div><div class="detail">GPT-5.6 Responses API, strict schema, store: false</div>
</div></div>
<div class="footer">github.com/AtchayamG/CascadeOps · MIT · Work &amp; Productivity</div>
</body></html>`);
await page.screenshot({ path: outputPath });
await browser.close();
