/* Render each portal route headlessly, fail on console/page errors, and save
   full-page screenshots for the design/content HITL gate. Local preview only. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const OUT = resolve(ROOT, "artifacts", "portal-preview");
const BASE = process.env.BASE || "http://localhost:4599/";

const ROUTES = [
  ["home", "/"],
  ["projects", "/projects"],
  ["project-detail", "/projects/film1-shaw-bkwatch"],
  ["film-presentation", "/projects/film1-shaw-bkwatch/ideas/final-demo"],
  ["library", "/library"],
  ["library-branding", "/library/branding"],
  ["library-communication", "/library/communication"],
  ["ai-roadmap", "/ai-roadmap"]
];
/* [name, theme, viewport] capture matrix. */
const SHOTS = [
  ...ROUTES.map(([n, r]) => [n, r, "dark", { width: 1440, height: 900 }]),
  ["home", "/", "light", { width: 1440, height: 900 }],
  ["project-detail", "/projects/film1-shaw-bkwatch", "light", { width: 1440, height: 900 }],
  ["ai-roadmap", "/ai-roadmap", "light", { width: 1440, height: 900 }],
  ["home", "/", "dark", { width: 390, height: 844 }, "mobile"],
  ["projects", "/projects", "dark", { width: 390, height: 844 }, "mobile"]
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const errors = [];

for (const [name, route, theme, viewport, tag] of SHOTS) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await ctx.addInitScript((t) => { try { localStorage.setItem("thirdi-portal-theme", t); } catch {} }, theme);
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}/${theme}] console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`[${name}/${theme}] pageerror: ${e.message}`));

  await page.goto(BASE + "#" + route, { waitUntil: "networkidle" });
  await page.waitForSelector(".portal-app .page", { timeout: 8000 }).catch(() => errors.push(`[${name}/${theme}] page did not render`));
  await page.waitForTimeout(900); // let staggered reveal + fonts settle

  const label = `${name}-${theme}${tag ? "-" + tag : ""}`;
  await page.screenshot({ path: resolve(OUT, label + ".png"), fullPage: true });
  console.log("shot:", label);
  await ctx.close();
}

await browser.close();
if (errors.length) { console.error("\nRUNTIME ERRORS:\n" + errors.join("\n")); process.exit(1); }
console.log(`\nAll ${SHOTS.length} screenshots captured with no console/page errors → ${OUT}`);
