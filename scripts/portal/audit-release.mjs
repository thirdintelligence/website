/**
 * Store formal axe and Lighthouse evidence for a portal release.
 *
 * The audited URL must be a sanitized local/preview portal. Reports are written
 * to release-evidence/<tenant>/<releaseId>/ and are intended to be committed
 * with the release record.
 *
 * Usage:
 *   node scripts/portal/audit-release.mjs \
 *     --tenant bkwatch --release <release-id> --base http://localhost:4599/
 */
import AxeBuilder from "@axe-core/playwright";
import { launch as launchChrome } from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const ROUTES = [
  ["home", "/"],
  ["projects", "/projects"],
  ["project-detail", "/projects/film1-shaw-bkwatch"],
  ["creative-direction", "/projects/film1-shaw-bkwatch/ideas/one-desk-no-detours"],
  ["value-results", "/value-results"],
  ["ai-roadmap", "/ai-roadmap"],
  ["communications", "/communications"],
  ["library", "/library"],
  ["library-record", "/library/branding/brand-mission"]
];

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!["--tenant", "--release", "--base"].includes(arg)) throw new Error(`Unknown argument: ${arg}`);
    parsed[arg.slice(2)] = argv[++index];
  }
  if (!parsed.tenant || !parsed.release) throw new Error("--tenant and --release are required");
  parsed.base ||= "http://localhost:4599/";
  return parsed;
}

const args = parseArgs(process.argv.slice(2));
const outputDir = resolve(ROOT, "release-evidence", args.tenant, args.release);
await mkdir(outputDir, { recursive: true });
let accessibilityBaseline = { accepted: [] };
try {
  accessibilityBaseline = JSON.parse(await readFile(
    resolve(ROOT, "tests", "portal", "fixtures", `${args.tenant}-axe-baseline.json`),
    "utf8"
  ));
} catch {
  // A tenant with no accepted baseline must pass with no serious/critical issues.
}
const acceptedAccessibilityIssues = new Set(
  accessibilityBaseline.accepted.map((issue) => `${issue.route}|${issue.id}`)
);

const browser = await chromium.launch();
const axeRoutes = [];
for (const [name, route] of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${args.base}#${route}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".portal-app .page", { timeout: 8000 });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  axeRoutes.push({
    name,
    route,
    passes: result.passes.length,
    incomplete: result.incomplete,
    violations: result.violations
  });
  await context.close();
}
await browser.close();

const allSeriousOrCritical = axeRoutes.flatMap((route) => route.violations
  .filter((violation) => ["serious", "critical"].includes(violation.impact))
  .map((violation) => ({ route: route.route, id: violation.id, impact: violation.impact })));
const newSeriousOrCritical = allSeriousOrCritical.filter(
  (issue) => !acceptedAccessibilityIssues.has(`${issue.route}|${issue.id}`)
);
const acceptedSeriousOrCritical = allSeriousOrCritical.filter(
  (issue) => acceptedAccessibilityIssues.has(`${issue.route}|${issue.id}`)
);
const axeSummary = {
  schemaVersion: "1.0.0",
  tenant: args.tenant,
  releaseId: args.release,
  auditedUrl: args.base,
  routeCount: axeRoutes.length,
  violationCount: axeRoutes.reduce((sum, route) => sum + route.violations.length, 0),
  seriousOrCritical: allSeriousOrCritical,
  acceptedBaseline: acceptedSeriousOrCritical,
  newSeriousOrCritical,
  baseline: accessibilityBaseline,
  routes: axeRoutes
};
await writeFile(resolve(outputDir, "axe.json"), `${JSON.stringify(axeSummary, null, 2)}\n`, "utf8");

const chrome = await launchChrome({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"]
});
let lighthouseResult;
try {
  lighthouseResult = await lighthouse(args.base, {
    port: chrome.port,
    output: ["json", "html"],
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices"],
    formFactor: "desktop",
    screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
    throttlingMethod: "provided"
  });
} finally {
  await chrome.kill();
}

const [lighthouseJson, lighthouseHtml] = lighthouseResult.report;
await writeFile(resolve(outputDir, "lighthouse.json"), lighthouseJson, "utf8");
await writeFile(resolve(outputDir, "lighthouse.html"), lighthouseHtml, "utf8");
const scores = Object.fromEntries(
  Object.entries(lighthouseResult.lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)])
);
const summary = {
  schemaVersion: "1.0.0",
  tenant: args.tenant,
  releaseId: args.release,
  auditedUrl: args.base,
  axe: {
    routeCount: axeSummary.routeCount,
    violationCount: axeSummary.violationCount,
    seriousOrCritical: axeSummary.seriousOrCritical.length,
    acceptedBaseline: axeSummary.acceptedBaseline.length,
    newSeriousOrCritical: axeSummary.newSeriousOrCritical.length
  },
  lighthouse: scores,
  thresholds: {
    performance: 90,
    accessibility: 90,
    "best-practices": 90
  },
  passed: axeSummary.newSeriousOrCritical.length === 0
    && scores.performance >= 90
    && scores.accessibility >= 90
    && scores["best-practices"] >= 90
};
await writeFile(resolve(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));
if (!summary.passed) process.exit(1);
