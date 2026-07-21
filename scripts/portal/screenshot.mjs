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

async function productionFrameMetrics(frameLocator) {
  return frameLocator.evaluateAll((frames) => frames.map((frame) => {
    const bounds = frame.getBoundingClientRect();
    const image = frame.querySelector(".ip-figure");
    if (!image || !image.complete || !image.naturalWidth) return { offset: Number.POSITIVE_INFINITY, caption: "", badgeFontSize: 0 };
    const figure = image.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minY = canvas.height;
    let maxY = -1;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 8) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxY < 0) return { offset: Number.POSITIVE_INFINITY, caption: "", badgeFontSize: 0 };
    const visibleCenter = figure.top + (((minY + maxY) / 2) / canvas.height) * figure.height;
    const badge = frame.querySelector(".ip-badge");
    return {
      offset: Math.abs((bounds.top + bounds.height / 2) - visibleCenter),
      caption: frame.querySelector(".ip-cap")?.innerText.trim() || "",
      badgeFontSize: badge ? parseFloat(getComputedStyle(badge).fontSize) : 0
    };
  }));
}

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

  const productionFrames = page.locator(".in-production");
  if (await productionFrames.count()) {
    const frameMetrics = await productionFrameMetrics(productionFrames);
    const offCenterFrames = frameMetrics.filter((frame) => frame.offset > 2);
    if (offCenterFrames.length) errors.push(`[${name}/${theme}] ${offCenterFrames.length} in-production designer artwork frame(s) are more than 2px off vertical center`);
    const secondaryCaptions = frameMetrics.map((frame) => frame.caption).filter((caption) => caption !== "In production");
    if (secondaryCaptions.length) errors.push(`[${name}/${theme}] in-production previews still contain secondary text: ${secondaryCaptions.join(" | ")}`);
    if (await page.locator(".in-production .ip-next").count()) errors.push(`[${name}/${theme}] legacy in-production secondary text remains in the DOM`);
  }

  if (name === "projects") {
    const layout = await page.locator(".project-card").first().evaluate((card) => getComputedStyle(card).gridTemplateColumns);
    if (viewport.width > 680 && layout.split(" ").length < 2) errors.push(`[${name}/${theme}] project card is not horizontal`);
    const createButtonAlignment = await page.locator("#new-project-btn").evaluate((button) => {
      const box = button.getBoundingClientRect();
      const head = button.closest(".page-head-row").getBoundingClientRect();
      const content = button.querySelector(".control-content").getBoundingClientRect();
      const buttonStyle = getComputedStyle(button);
      const style = getComputedStyle(button.querySelector(".control-content"));
      return {
        offset: (box.top + box.height / 2) - (content.top + content.height / 2),
        topOffset: box.top - head.top,
        position: buttonStyle.position,
        top: parseFloat(buttonStyle.top),
        transform: style.transform
      };
    });
    if (createButtonAlignment.position !== "relative" || createButtonAlignment.top !== -8 || (viewport.width > 680 && Math.abs(createButtonAlignment.topOffset + 8) > .1)) errors.push(`[${name}/${theme}] Create Project button is not positioned 8px above the Projects header line`);
    if (Math.abs(createButtonAlignment.offset - 2) > .1 || !/matrix\(1, 0, 0, 1, 0, -2\)/.test(createButtonAlignment.transform)) errors.push(`[${name}/${theme}] Create Project button contents are not optically centered 2px upward`);
  }
  if (name === "project-detail") {
    const hero = await page.locator(".project-hero").evaluate((el) => {
      const preview = el.querySelector(".project-preview").getBoundingClientRect();
      const facts = el.querySelector(".hero-facts").getBoundingClientRect();
      return { direction: getComputedStyle(el).flexDirection, previewWidth: preview.width, heroWidth: el.getBoundingClientRect().width, previewBottom: preview.bottom, factsTop: facts.top };
    });
    if (hero.direction !== "column" || hero.previewWidth < hero.heroWidth - 2 || hero.factsTop < hero.previewBottom) errors.push(`[${name}/${theme}] project preview/info are not a full-width single column`);
    const heroBadgeFontSize = await page.locator(".project-preview .ip-badge").evaluate((badge) => parseFloat(getComputedStyle(badge).fontSize));
    if (heroBadgeFontSize < 13.5) errors.push(`[${name}/${theme}] project hero In production label is not larger than the standard preview label`);
    const projectHierarchy = await page.locator(".page").evaluate((root) => {
      const blocks = [...root.querySelectorAll(":scope > .detail-block")];
      const script = blocks.find((block) => block.querySelector(":scope > .section-head h2")?.textContent.trim() === "Script");
      const scope = blocks.find((block) => block.querySelector(":scope > .scope-panel"));
      const creative = blocks.find((block) => block.querySelector(":scope > .section-head h2")?.textContent.trim() === "Creative directions");
      if (!script || !scope || !creative) return null;
      return { directlyAfterScript: scope.previousElementSibling === script, directlyBeforeCreative: scope.nextElementSibling === creative };
    });
    if (!projectHierarchy?.directlyAfterScript || !projectHierarchy?.directlyBeforeCreative) errors.push(`[${name}/${theme}] Scope & investment is not directly between Script and Creative directions`);
    const criteriaPadding = await page.locator(".comparison-criteria").evaluate((row) => {
      const style = getComputedStyle(row);
      return { top: parseFloat(style.paddingTop), bottom: parseFloat(style.paddingBottom) };
    });
    if (criteriaPadding.top < 8 || criteriaPadding.bottom < 8) errors.push(`[${name}/${theme}] Creative Directions criteria row needs at least 8px vertical padding`);
    const badgeRows = await page.locator(".creative-direction-card").evaluateAll((cards) => cards.map((card) => {
      const row = card.querySelector(".creative-direction-badges");
      const cardBox = card.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const cardStyle = getComputedStyle(card);
      const rowStyle = getComputedStyle(row);
      const expectedTop = cardBox.top + parseFloat(cardStyle.borderTopWidth) + parseFloat(cardStyle.paddingTop);
      return { offset: rowBox.top - expectedTop, marginTop: parseFloat(rowStyle.marginTop), transform: rowStyle.transform };
    }));
    if (!badgeRows.length || badgeRows.some((row) => Math.abs(row.offset + 8) > .1 || row.marginTop !== 0 || !/matrix\(1, 0, 0, 1, 0, -8\)/.test(row.transform))) errors.push(`[${name}/${theme}] Creative Direction badge rows are not raised 8px into their title space`);
    const badgeAlignment = await page.locator(".creative-direction-badges > .status, .creative-direction-badges > .chip").evaluateAll((badges) => badges.map((badge) => {
      const box = badge.getBoundingClientRect();
      const content = badge.querySelector(".control-content").getBoundingClientRect();
      const style = getComputedStyle(badge);
      const contentStyle = getComputedStyle(badge.querySelector(".control-content"));
      return {
        offset: (box.top + box.height / 2) - (content.top + content.height / 2),
        height: box.height,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
        transform: contentStyle.transform
      };
    }));
    if (!badgeAlignment.length || badgeAlignment.some((badge) => Math.abs(badge.offset - 1) > .1 || badge.height !== 24 || badge.alignItems !== "center" || badge.justifyContent !== "center" || !/matrix\(1, 0, 0, 1, 0, -1\)/.test(badge.transform))) errors.push(`[${name}/${theme}] Creative Direction status/number contents are not optically centered 1px upward`);
    const comparisonHeaders = await page.locator(".ptable th").allTextContents();
    const comparisonCellCounts = await page.locator(".ptable tbody tr").evaluateAll((rows) => rows.map((row) => row.querySelectorAll("td").length));
    if (comparisonHeaders.some((header) => /recommendation/i.test(header)) || comparisonHeaders.length !== 4 || comparisonCellCounts.some((count) => count !== 4)) errors.push(`[${name}/${theme}] Compare Directions still contains a recommendation field`);
  }
  if (name === "film-presentation") {
    const sceneBadgeFontSizes = await page.locator(".scene-media .ip-badge").evaluateAll((badges) => badges.map((badge) => parseFloat(getComputedStyle(badge).fontSize)));
    if (!sceneBadgeFontSizes.length || sceneBadgeFontSizes.some((size) => size > 13)) errors.push(`[${name}/${theme}] scene In production labels no longer use the standard preview size`);
    if (await page.locator(".scene-media > .pc-meta .status").count()) errors.push(`[${name}/${theme}] scene preview areas still contain secondary status text`);
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
  const coloredButton = page.locator(".btn-primary").first();
  if (await coloredButton.count()) {
    const restingColor = await coloredButton.evaluate((button) => getComputedStyle(button).color);
    if (restingColor !== "rgb(0, 0, 0)") errors.push(`[${name}/${theme}] colored button resting text is ${restingColor}, not black`);
    await coloredButton.hover();
    await page.waitForTimeout(300);
    const hoverColor = await coloredButton.evaluate((button) => getComputedStyle(button).color);
    if (hoverColor !== "rgb(255, 255, 255)") errors.push(`[${name}/${theme}] colored button hover text is ${hoverColor}, not white`);
    await page.mouse.move(0, 0);
  }

  const label = `${name}-${theme}${tag ? "-" + tag : ""}`;
  await page.screenshot({ path: resolve(OUT, label + ".png"), fullPage: true });
  console.log("shot:", label);
  await ctx.close();
}

await browser.close();
if (errors.length) { console.error("\nRUNTIME ERRORS:\n" + errors.join("\n")); process.exit(1); }
console.log(`\nAll ${SHOTS.length} screenshots captured with no console/page errors → ${OUT}`);
