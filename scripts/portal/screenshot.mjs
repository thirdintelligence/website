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
  ["library-record", "/library/branding/brand-mission"],
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

  const brokenImages = await page.locator("img").evaluateAll((imgs) => imgs
    .filter((img) => !img.complete || img.naturalWidth === 0)
    .map((img) => img.getAttribute("src")));
  if (brokenImages.length) errors.push(`[${name}/${theme}] broken images: ${brokenImages.join(", ")}`);

  if (name === "projects") {
    const layout = await page.locator(".project-card").first().evaluate((card) => getComputedStyle(card).gridTemplateColumns);
    if (viewport.width > 680 && layout.split(" ").length < 2) errors.push(`[${name}/${theme}] project card is not horizontal`);
  }
  if (name === "project-detail") {
    const hero = await page.locator(".project-hero").evaluate((el) => {
      const preview = el.querySelector(".project-preview").getBoundingClientRect();
      const facts = el.querySelector(".hero-facts").getBoundingClientRect();
      return { direction: getComputedStyle(el).flexDirection, previewWidth: preview.width, heroWidth: el.getBoundingClientRect().width, previewBottom: preview.bottom, factsTop: facts.top };
    });
    if (hero.direction !== "column" || hero.previewWidth < hero.heroWidth - 2 || hero.factsTop < hero.previewBottom) errors.push(`[${name}/${theme}] project preview/info are not a full-width single column`);
  }
  if (name === "library-branding") {
    const entry = await page.locator(".record-row").first().evaluate((row) => {
      const title = getComputedStyle(row.querySelector(".rr-title"));
      const summary = getComputedStyle(row.querySelector(".rr-summary"));
      return { titleDisplay: title.display, summaryDisplay: summary.display, summaryMargin: parseFloat(summary.marginTop) };
    });
    if (entry.titleDisplay !== "block" || entry.summaryDisplay !== "block" || entry.summaryMargin < 4) errors.push(`[${name}/${theme}] Library title/content spacing is missing`);
  }
  const designer = page.locator(".ip-figure").first();
  if (await designer.count()) {
    const animationName = await designer.evaluate((img) => getComputedStyle(img).animationName);
    if (animationName !== "none") errors.push(`[${name}/${theme}] designer artwork still has wrapper bounce animation: ${animationName}`);
  }

  const label = `${name}-${theme}${tag ? "-" + tag : ""}`;
  await page.screenshot({ path: resolve(OUT, label + ".png"), fullPage: true });
  console.log("shot:", label);
  await ctx.close();
}

await browser.close();
if (errors.length) { console.error("\nRUNTIME ERRORS:\n" + errors.join("\n")); process.exit(1); }
console.log(`\nAll ${SHOTS.length} screenshots captured with no console/page errors → ${OUT}`);
