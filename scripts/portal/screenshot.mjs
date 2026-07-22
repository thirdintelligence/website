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
  ["brainstorm-presentation", "/projects/film1-shaw-bkwatch/ideas/one-desk-no-detours"],
  ["library", "/library"],
  ["library-branding", "/library/branding"],
  ["library-record", "/library/branding/brand-mission"],
  ["library-communication", "/library/communication"],
  ["value-results", "/value-results"],
  ["ai-roadmap", "/ai-roadmap"]
];
/* [name, theme, viewport] capture matrix. */
const SHOTS = [
  ...ROUTES.map(([n, r]) => [n, r, "dark", { width: 1440, height: 900 }]),
  ["home", "/", "light", { width: 1440, height: 900 }],
  ["project-detail", "/projects/film1-shaw-bkwatch", "light", { width: 1440, height: 900 }],
  ["value-results", "/value-results", "light", { width: 1440, height: 900 }],
  ["ai-roadmap", "/ai-roadmap", "light", { width: 1440, height: 900 }],
  ["shaw-value-results", "/value-results", "dark", { width: 1440, height: 900 }],
  ["home", "/", "dark", { width: 390, height: 844 }, "mobile"],
  ["projects", "/projects", "dark", { width: 390, height: 844 }, "mobile"]
];
const ACTIVE_SHOTS = process.env.SHOT ? SHOTS.filter(([name]) => name === process.env.SHOT) : SHOTS;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const errors = [];

async function productionFrameMetrics(frameLocator) {
  return frameLocator.evaluateAll((frames) => frames.map((frame) => {
    const bounds = frame.getBoundingClientRect();
    const image = frame.querySelector(".ip-figure");
    const svg = image?.querySelector("svg");
    if (!image || !svg) return { offset: Number.POSITIVE_INFINITY, caption: "", badgeFontSize: 0 };
    // Measure every instance at the same SMIL frame. Internal working motion is
    // allowed, but the removed whole-composition bounce and optical centering
    // must be assessed against a deterministic frame rather than wall time.
    svg.pauseAnimations?.();
    svg.setCurrentTime?.(0);
    const figure = svg.getBoundingClientRect();
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const element of svg.querySelectorAll("path,rect,circle,ellipse,polygon,polyline,line,image,text")) {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) <= 0.01 || rect.width <= 0.1 || rect.height <= 0.1) continue;
      const top = Math.max(figure.top, rect.top);
      const bottom = Math.min(figure.bottom, rect.bottom);
      if (bottom <= top) continue;
      minY = Math.min(minY, top);
      maxY = Math.max(maxY, bottom);
    }
    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return { offset: Number.POSITIVE_INFINITY, caption: "", badgeFontSize: 0 };
    const visibleCenter = (minY + maxY) / 2;
    const badge = frame.querySelector(".ip-badge");
    const signedOffset = (bounds.top + bounds.height / 2) - visibleCenter;
    return {
      offset: Math.abs(signedOffset),
      signedOffset,
      caption: frame.querySelector(".ip-cap")?.innerText.trim() || "",
      badgeFontSize: badge ? parseFloat(getComputedStyle(badge).fontSize) : 0
    };
  }));
}

for (const [name, route, theme, viewport, tag] of ACTIVE_SHOTS) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await ctx.addInitScript((t) => { try { localStorage.setItem("thirdi-portal-theme", t); } catch {} }, theme);
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}/${theme}] console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`[${name}/${theme}] pageerror: ${e.message}`));

  await page.goto(BASE + "#" + route, { waitUntil: "networkidle" });
  await page.waitForSelector(".portal-app .page", { timeout: 8000 }).catch(() => errors.push(`[${name}/${theme}] page did not render`));
  if (name === "shaw-value-results") {
    await page.evaluate(async () => {
      const [invoicing, pageModule] = await Promise.all([
        fetch("/content/clients/shaw/invoicing.json").then((response) => response.json()),
        import("/public/portal/pages/value-results.js")
      ]);
      const view = pageModule.render({ invoicing, portal: { client: { name: "Shaw Systems", shortName: "Shaw" } }, aiRoadmap: null });
      document.querySelector("#main").innerHTML = view.html;
    });
  }
  await page.waitForTimeout(900); // let staggered reveal + fonts settle

  const brokenImages = await page.locator("img").evaluateAll((imgs) => imgs
    .filter((img) => !img.complete || img.naturalWidth === 0)
    .map((img) => img.getAttribute("src")));
  if (brokenImages.length) errors.push(`[${name}/${theme}] broken images: ${brokenImages.join(", ")}`);

  // Compact communication rows sit beneath a section-level “View all” action;
  // all other clickable destinations retain an explicit action inside the card.
  const destinationCards = page.locator(".card-link:not(.comm-prev-item):not(.comm-preview-row)");
  if (await destinationCards.count()) {
    const missingActions = await destinationCards.evaluateAll((cards) => cards.filter((card) => !card.querySelector(".card-action")).length);
    if (missingActions) errors.push(`[${name}/${theme}] ${missingActions} clickable card/row destination(s) have no explicit action button`);
    await destinationCards.first().hover();
    const hoverDecoration = await destinationCards.first().evaluate((card) => getComputedStyle(card).textDecorationLine);
    if (hoverDecoration !== "none") errors.push(`[${name}/${theme}] clickable card text is underlined on hover`);
    await page.mouse.move(0, 0);
  }

  const productionFrames = page.locator(".in-production");
  if (await productionFrames.count()) {
    const frameMetrics = await productionFrameMetrics(productionFrames);
    const offCenterFrames = frameMetrics.filter((frame) => frame.offset > 2);
    if (offCenterFrames.length) errors.push(`[${name}/${theme}] ${offCenterFrames.length} in-production designer artwork frame(s) are more than 2px off vertical center (${frameMetrics.map((frame) => frame.signedOffset.toFixed(2)).join(", ")}px signed)`);
    const secondaryCaptions = frameMetrics.map((frame) => frame.caption).filter((caption) => !["In production", "Demo in production"].includes(caption));
    if (secondaryCaptions.length) errors.push(`[${name}/${theme}] in-production previews still contain secondary text: ${secondaryCaptions.join(" | ")}`);
    if (await page.locator(".in-production .ip-next").count()) errors.push(`[${name}/${theme}] legacy in-production secondary text remains in the DOM`);
  }

  if (name === "home" || name === "projects") {
    const projectBadgeAlignment = await page.locator(".project-card-badges > .status, .project-card-badges > .chip").evaluateAll((badges) => badges.map((badge) => {
      const box = badge.getBoundingClientRect();
      const content = badge.querySelector(".control-content")?.getBoundingClientRect();
      const style = getComputedStyle(badge);
      const contentStyle = badge.querySelector(".control-content") ? getComputedStyle(badge.querySelector(".control-content")) : null;
      return {
        offset: content ? (box.top + box.height / 2) - (content.top + content.height / 2) : Number.POSITIVE_INFINITY,
        height: box.height,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
        transform: contentStyle?.transform || ""
      };
    }));
    if (!projectBadgeAlignment.length || projectBadgeAlignment.some((badge) => Math.abs(badge.offset - 1) > .1 || badge.height !== 28 || badge.alignItems !== "center" || badge.justifyContent !== "center" || !/matrix\(1, 0, 0, 1, 0, -1\)/.test(badge.transform))) errors.push(`[${name}/${theme}] project-card status/type contents are not optically centered 1px upward`);
  }

  if (name === "projects") {
    const layout = await page.locator(".project-card").first().evaluate((card) => getComputedStyle(card).gridTemplateColumns);
    if (viewport.width > 680 && layout.split(" ").length < 2) errors.push(`[${name}/${theme}] project card is not horizontal`);
    const projectCardBadgeFontSizes = await page.locator(".project-card .ip-badge").evaluateAll((badges) => badges.map((badge) => parseFloat(getComputedStyle(badge).fontSize)));
    if (!projectCardBadgeFontSizes.length || projectCardBadgeFontSizes.some((size) => size > 13)) errors.push(`[${name}/${theme}] project thumbnail In production labels no longer use the standard preview size`);
    const createButtonAlignment = await page.locator("#new-project-btn").evaluate((button) => {
      const box = button.getBoundingClientRect();
      const head = button.closest(".page-head-row").getBoundingClientRect();
      const action = button.closest(".new-project-action");
      const actionBox = action.getBoundingClientRect();
      const content = button.querySelector(".control-content").getBoundingClientRect();
      const actionStyle = getComputedStyle(action);
      const style = getComputedStyle(button.querySelector(".control-content"));
      return {
        offset: (box.top + box.height / 2) - (content.top + content.height / 2),
        topOffset: box.top - head.top,
        outerTop: box.top - actionBox.top,
        outerBottom: actionBox.bottom - box.bottom,
        actionMarginTop: parseFloat(actionStyle.marginTop),
        transform: style.transform
      };
    });
    if (createButtonAlignment.actionMarginTop !== -20 || Math.abs(createButtonAlignment.outerTop - 4) > .1 || Math.abs(createButtonAlignment.outerBottom - 4) > .1 || (viewport.width > 680 && Math.abs(createButtonAlignment.topOffset + 16) > .1)) errors.push(`[${name}/${theme}] Create Project button does not retain its raised position with 4px outer padding`);
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
    if (Math.abs(heroBadgeFontSize - 16) > .1) errors.push(`[${name}/${theme}] project hero In production label is not the hero-only 16px size`);
    const projectHierarchy = await page.locator(".page").evaluate((root) => {
      const blocks = [...root.querySelectorAll(":scope > .detail-block")];
      const script = blocks.find((block) => block.querySelector(":scope > .section-head h2")?.textContent.trim() === "Script");
      const scope = blocks.find((block) => block.querySelector("h3")?.textContent.trim() === "Scope & investment");
      const demo = blocks.find((block) => block.id === "selected-demo");
      const creative = blocks.find((block) => block.querySelector(":scope > .section-head h2")?.textContent.trim() === "Creative directions");
      if (!script || !scope || !demo || !creative) return { missing: { script: !script, scope: !scope, demo: !demo, creative: !creative }, blocks: blocks.map((block) => ({ id: block.id, heading: block.querySelector(":scope > .section-head h2")?.textContent.trim() || block.querySelector(":scope > h2")?.textContent.trim() || "" })) };
      return { directlyAfterScript: scope.previousElementSibling === script, demoBeforeCreative: demo.nextElementSibling === creative };
    });
    if (!projectHierarchy?.directlyAfterScript || !projectHierarchy?.demoBeforeCreative) errors.push(`[${name}/${theme}] Scope & investment is not directly under Script or the selected demo is not directly above Creative directions: ${JSON.stringify(projectHierarchy)}`);
    if (await page.locator('.creative-direction-card-locked a[href*="%anchor%selected-demo"]').count() !== 1) errors.push(`[${name}/${theme}] locked HYBRID card does not point to the embedded demo workspace`);
    if (await page.locator('a[href*="/ideas/final-demo"]').count()) errors.push(`[${name}/${theme}] locked demo still links to a separate direction page`);
    const sceneBadgeFontSizes = await page.locator(".selected-demo-workspace .scene-media .ip-badge").evaluateAll((badges) => badges.map((badge) => parseFloat(getComputedStyle(badge).fontSize)));
    if (sceneBadgeFontSizes.length !== 6 || sceneBadgeFontSizes.some((size) => size > 13)) errors.push(`[${name}/${theme}] embedded demo scene previews are missing or no longer use the standard label size`);
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
    const valueMetrics = await page.locator(".project-value-strip .ai-value-stat").evaluateAll((stats) => stats.map((stat) => ({
      value: stat.querySelector(".ai-value-num")?.textContent.trim(),
      label: stat.querySelector(".ai-value-label")?.textContent.trim()
    })));
    const expectedMetrics = [
      { value: "20", label: "hours" },
      { value: "3", label: "weeks active" },
      { value: "4/8", label: "deliverables ready" },
      { value: "6", label: "selected demo scenes" }
    ];
    if (JSON.stringify(valueMetrics) !== JSON.stringify(expectedMetrics)) errors.push(`[${name}/${theme}] Effort & value banner metrics are incomplete or out of order: ${JSON.stringify(valueMetrics)}`);
    if (await page.locator(".project-value-strip .ai-value-actions .btn").count() !== 1) errors.push(`[${name}/${theme}] Effort & value banner is missing its destination button`);
    if (await page.locator(".comment.is-blocker").count() < 2) errors.push(`[${name}/${theme}] curated blockers are not presented in the comment thread`);
    const standaloneBlockers = await page.getByRole("heading", { name: "Open blockers", exact: true }).count();
    if (standaloneBlockers) errors.push(`[${name}/${theme}] blockers still render as a separate non-comment section`);
    await page.evaluate(() => { location.hash = "#/projects/film1-shaw-bkwatch/ideas/final-demo"; });
    await page.waitForFunction(() => location.hash.includes("%anchor%selected-demo"), null, { timeout: 3000 }).catch(() => {});
    if (!page.url().includes("#/projects/film1-shaw-bkwatch%anchor%selected-demo")) errors.push(`[${name}/${theme}] stale locked-demo route did not redirect to the embedded project workspace`);
  }
  if (name === "brainstorm-presentation") {
    if (await page.locator(".scene-media").count()) errors.push(`[${name}/${theme}] brainstorm direction still renders media placeholders`);
    if (await page.locator(".scene-block-text-only").count() !== 3) errors.push(`[${name}/${theme}] brainstorm storyboard/script scenes are missing`);
  }
  if (name === "value-results") {
    const readiness = page.locator(".efficiency-readiness");
    if (await readiness.count() !== 1 || await page.locator(".efficiency-chart").count()) errors.push(`[${name}/${theme}] bkWatch must show the gated efficiency readiness state, not a live graph`);
    const gate = await readiness.evaluate((el) => ({ completed: el.dataset.completedProjects, required: el.dataset.requiredProjects }));
    if (gate.completed !== "0" || gate.required !== "2") errors.push(`[${name}/${theme}] efficiency gate is not set to 0 of 2 completed projects`);
    const momentumLabels = await page.locator(".metric-descriptor").allTextContents();
    if (!momentumLabels.includes("deliverables") || !momentumLabels.includes("hours") || !momentumLabels.includes("capabilities") || momentumLabels.some((label) => /invested|delivered/i.test(label))) errors.push(`[${name}/${theme}] momentum labels were not normalized`);
    if (await page.locator(".future-value-item").count() !== 6) errors.push(`[${name}/${theme}] future value record does not include all six placeholder sections`);
    if (await page.locator(".financial-metric, .outcome-list").count()) errors.push(`[${name}/${theme}] removed financial summary or outcomes content is still rendered`);
    if (await page.getByRole("heading", { name: /Financial summary|Outcomes|Future value record/i }).count()) errors.push(`[${name}/${theme}] removed Value & Results section title is still rendered`);
    if (await page.locator(".momentum-section .future-value-grid").count() !== 1) errors.push(`[${name}/${theme}] future metric placeholders are not inside Momentum`);
    if (await page.getByText("Monthly Video Series", { exact: true }).count()) errors.push(`[${name}/${theme}] monthly film series remains a separate capability`);
    const filmCapability = page.locator(".cap-row").filter({ hasText: "AI Film Production" });
    if (await filmCapability.count() !== 1 || !/ongoing monthly film series/i.test(await filmCapability.innerText())) errors.push(`[${name}/${theme}] monthly film series was not merged into AI Film Production`);
    const privacyText = await page.locator(".learning-privacy").innerText();
    if (!/stays private/i.test(privacyText) || /Shaw Systems|Amplify|614 hours|250 hours/i.test(privacyText)) errors.push(`[${name}/${theme}] learning proof is missing its privacy boundary or exposes cross-client details`);
  }
  if (name === "shaw-value-results") {
    if (await page.locator(".efficiency-chart").count() !== 1 || await page.locator(".efficiency-readiness").count()) errors.push(`[${name}/${theme}] Shaw must activate the live graph after two completed projects`);
    const labels = await page.locator(".actual-point text").allTextContents();
    if (labels.join("|") !== "150 h/min|120 h/min") errors.push(`[${name}/${theme}] Shaw graph includes unapproved or missing actual efficiency values: ${labels.join("|")}`);
    const trajectories = await page.locator(".eff-line").evaluateAll((lines) => Object.fromEntries(lines.map((line) => [line.classList.contains("actual") ? "actual" : "expected", line.getAttribute("points").split(" ").map((point) => point.split(",").map(Number))])));
    if (!(trajectories.actual[1][1] < trajectories.actual[0][1] && trajectories.expected[1][1] < trajectories.expected[0][1] && trajectories.expected[0][1] > trajectories.actual[0][1])) errors.push(`[${name}/${theme}] expected and actual Shaw trajectories do not show compounding efficiency`);
  }
  if (name === "projects" || name === "library") {
    const filterSpacing = await page.locator(".filter-page").evaluate((root) => {
      const filters = root.querySelector(".filters").getBoundingClientRect();
      const preceding = root.querySelector(".filters").previousElementSibling.getBoundingClientRect();
      const section = root.querySelector(".filters + .section").getBoundingClientRect();
      return { above: filters.top - preceding.bottom, below: section.top - filters.bottom };
    });
    const expectedAbove = name === "projects" ? 0 : 8;
    if (Math.abs(filterSpacing.above - expectedAbove) > .1 || Math.abs(filterSpacing.below - 8) > .1) errors.push(`[${name}/${theme}] filter row spacing is not compact around the controls`);
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
    const sharedBounce = await designer.evaluate((frame) => [...frame.querySelectorAll('animateTransform[type="translate"]')].some((animation) => {
      const values = animation.getAttribute("values") || "";
      return values.startsWith("567.071 665.431") && values.includes("567.071 669.431");
    }));
    if (sharedBounce) errors.push(`[${name}/${theme}] designer SVG still contains its whole-composition vertical bounce`);
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
console.log(`\nAll ${ACTIVE_SHOTS.length} screenshots captured with no console/page errors → ${OUT}`);
