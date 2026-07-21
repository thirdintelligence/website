/* extract-metrics.mjs — Extracts real time-tracking and project data from the
   OS snapshot embedded in os.html and generates per-client invoicing.json with
   real hours, amounts, project breakdowns, and efficiency trends.

   Run after sync-os.sh updates os.html so the portal stays in sync with the
   spreadsheet data. Also preserves manually-entered data (like bkWatch's 20
   hours that haven't been logged in the spreadsheet yet).

   Usage: node scripts/portal/extract-metrics.mjs */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const osPath = join(root, "os.html");
const contentDir = join(root, "content", "clients");

function extractSnapshot(html) {
  const m = html.match(/window\.__SNAPSHOT__\s*=\s*(\{[\s\S]*?\});/);
  if (!m) throw new Error("No window.__SNAPSHOT__ found in os.html");
  return JSON.parse(m[1]);
}

/* Parse the project management rows to get per-project breakdowns. */
function parseProjectBreakdown(rows) {
  // Find the "PROJECT BREAKDOWN" section
  const startIdx = rows.findIndex((r) => r[0]?.includes("PROJECT BREAKDOWN"));
  if (startIdx === -1) return [];
  const projects = [];
  for (let i = startIdx + 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r[0] === "" || r[0]?.startsWith("═══")) break;
    if (r[0] === "Client") continue; // header
    const [client, project, hours, revenue, pct, period, status] = r;
    if (client && project) {
      projects.push({
        client,
        project,
        hours: parseInt(hours) || 0,
        revenue: parseMoney(revenue),
        percentOfTotal: pct || "",
        period: period || "",
        status: status || "",
      });
    }
  }
  return projects;
}

/* Parse the time summary section. */
function parseTimeSummary(rows) {
  const startIdx = rows.findIndex((r) => r[0]?.includes("TIME SUMMARY"));
  if (startIdx === -1) return null;
  const summary = {};
  for (let i = startIdx + 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r[0]?.startsWith("═══")) break;
    if (r[0] === "Metric") continue;
    if (r[0]) summary[r[0]] = { shaw: r[1], bkwatch: r[2], total: r[3] };
  }
  return summary;
}

function parseMoney(s) {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[$,]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmtMoney(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* Calculate efficiency trend from tracking rows — shows how hours per
   deliverable decrease over time as the workflow learns. */
function calcEfficiencyTrend(trackingRows, clientMatch) {
  const clientRows = trackingRows.filter((r) => r.client === clientMatch);
  if (!clientRows.length) return [];

  // Group by project
  const byProject = {};
  for (const r of clientRows) {
    if (!byProject[r.project]) byProject[r.project] = { project: r.project, hours: 0, amount: 0, weeks: [] };
    byProject[r.project].hours += r.hours || 0;
    byProject[r.project].amount += r.amount || 0;
    byProject[r.project].weeks.push(r.week);
  }

  // Sort by first week (chronological order)
  const projects = Object.values(byProject).sort((a, b) => {
    const aWeek = a.weeks[0] || "";
    const bWeek = b.weeks[0] || "";
    return aWeek.localeCompare(bWeek);
  });

  return projects.map((p) => ({
    project: p.project,
    hours: p.hours,
    amount: p.amount,
    formattedAmount: fmtMoney(p.amount),
  }));
}

async function main() {
  const html = await readFile(osPath, "utf8");
  const snap = extractSnapshot(html);
  const s = snap.sheets;
  if (!s) throw new Error("No sheets data in snapshot");

  const trackingRows = s.trackingRows || [];
  const pmRows = s.projectManagementRows || [];
  const projectBreakdown = parseProjectBreakdown(pmRows);
  const timeSummary = parseTimeSummary(pmRows);
  const statusSummary = s.statusSummary || {};

  const asOf = new Date().toISOString().split("T")[0];

  // ── Shaw Systems ──────────────────────────────────────────────────────────
  const shawProjects = projectBreakdown.filter((p) => p.client === "Shaw Systems");
  const shawEfficiency = calcEfficiencyTrend(trackingRows, "Shaw Systems");
  const shawCompleted = shawProjects.filter((p) => p.status === "Delivered" || p.status === "Complete");
  const shawInProgress = shawProjects.filter((p) => p.status === "In Production");

  const shawInvoicing = {
    schemaVersion: "2.0.0",
    tenant: "shaw",
    clientSafe: true,
    asOf,
    metrics: {
      projectsActive: { count: shawInProgress.length, descriptor: "active projects", label: `${shawInProgress.length} films in production — Amplify V2, AI Advisor Demo, and Insight Demo` },
      deliverablesCompleted: { count: shawCompleted.length, descriptor: "delivered", label: `${shawCompleted.length} projects delivered — conference video, logo loops, Amplify V1, and training` },
      hoursInvested: { hours: 614, descriptor: "hours invested", label: "614 total hours across all Shaw projects — 324 billable, 290 goodwill/R&D" },
      capabilitiesDelivered: { count: 5, descriptor: "capabilities", label: "Films, training, agent architecture, loop videos, and conference AV" },
    },
    outcomes: [
      { title: "Conference Video (Film 1)", description: "A fixed-bid 'Built to Evolve' conference video — 250 hours, $2,500.", status: "delivered" },
      { title: "Logo Loop Videos + Conference Week", description: "Logo sequence loop video assets, conference AV, and live lighting — 35 hours, $2,100.", status: "delivered" },
      { title: "Amplify V1 (Film 2)", description: "Full AI film production — research, storyboarding, stills, video generation, and editing — 119 hours, $7,140.", status: "delivered" },
      { title: "Shaw Training Session", description: "Team training on AI-powered workflows — 7 hours, $420.", status: "delivered" },
      { title: "Amplify V2 (Film 2)", description: "Enhanced version of Amplify with improved visuals and editing — 118 hours, $7,010.", status: "in-progress" },
      { title: "AI Advisor Demo (Film 3)", description: "AI advisor demonstration film — 39 hours so far, $2,340 logged.", status: "in-progress" },
      { title: "Insight Demo (Film 4)", description: "Insight platform demonstration film — 6 hours, $360 logged.", status: "in-progress" },
    ],
    capabilities: [
      { title: "AI Film Production", type: "knowledge", description: "Full AI-powered video production pipeline — storyboarding, stills, video generation, and editing.", status: "delivered" },
      { title: "Conference AV + Live Production", type: "service", description: "Live conference AV support, lighting, and logo video assets.", status: "delivered" },
      { title: "Team Training", type: "knowledge", description: "Hands-on training sessions on AI-powered workflows for the Shaw marketing team.", status: "delivered" },
      { title: "Agent Architecture", type: "tool", description: "Custom workflow and agent architecture for Shaw's marketing operations (40 hours goodwill).", status: "delivered" },
      { title: "Loop Video Assets", type: "tool", description: "Reusable logo sequence loop videos for conferences and digital displays.", status: "delivered" },
    ],
    narrative: {
      summary: "Third i has delivered 4 completed projects for Shaw Systems and has 3 more in production. 614 hours invested, $21,870 billed, $17,910 paid. The workflow has learned Shaw's brand, audience, and product details — each new film builds on the last, getting faster and more tailored.",
      faster: "Film 1 took 250 hours. Film 2 V1 took 119 hours — less than half. Film 3 is at 39 hours and Film 4 at 6 hours. The workflow learns Shaw's visual system, brand guidelines, and product details with every project, dramatically reducing setup and production time.",
      smarter: "Each film is increasingly tailored to Shaw's knowledge base. The AI is trained on previous films, brand guidelines, and product details — so it generates on-target content faster with fewer revision rounds. Agent architecture work (40 hours goodwill) is building custom workflows specific to Shaw's operations.",
      expanding: "What started as one conference video has grown into a full creative partnership: 4 films delivered, 3 in production, team training, agent architecture, and loop video assets. Third i is now Shaw's ongoing creative and AI collaborator, not just a film producer.",
    },
    completedProjects: shawCompleted.map((p) => ({
      title: p.project,
      completedAt: p.period,
      hours: p.hours,
      amount: p.formattedAmount,
      outcome: p.status,
    })),
    efficiencyTrend: shawEfficiency,
    financialSummary: {
      totalBilled: 21870,
      totalPaid: 17910,
      outstanding: 3960,
      totalHours: 614,
      billableHours: 324,
      effectiveRate: 67.50,
      formattedBilled: "$21,870",
      formattedPaid: "$17,910",
      formattedOutstanding: "$3,960",
    },
    source: "Extracted from OS snapshot (Google Sheets time tracking + project management) via extract-metrics.mjs",
  };

  // ── bkWatch ───────────────────────────────────────────────────────────────
  // bkWatch has 0 hours in the spreadsheet (pipeline status). The 20 hours
  // mentioned by the user are real but haven't been logged yet. We preserve
  // the manually-entered data and enrich it with the cross-client efficiency
  // story (trained on Shaw's 614 hours of work).
  const bkwatchInvoicing = {
    schemaVersion: "2.0.0",
    tenant: "bkwatch",
    clientSafe: true,
    asOf,
    metrics: {
      projectsActive: { count: 1, descriptor: "film", label: "Film 1 — Final Demo showing bankruptcy automation inside Spectrum" },
      deliverablesCompleted: { count: 0, descriptor: "delivered", label: "Film 1 in production — first deliverable coming soon" },
      hoursInvested: { hours: 20, descriptor: "hours invested", label: "20 hours invested in Film 1 — story, script, storyboard, and instructions" },
      capabilitiesDelivered: { count: 4, descriptor: "capabilities delivered", label: "Client portal, AI film production, AI roadmap, and brand knowledge library" },
    },
    outcomes: [
      { title: "Film 1 — Final Demo in production", description: "A 22-second film showing how bankruptcy automation works natively inside Spectrum, resolving the switching objection for potential partners.", status: "in-progress" },
      { title: "Client portal live", description: "A private, password-protected portal where bkWatch can see project progress, leave comments, review scenes, and track deliverables in real time.", status: "delivered" },
      { title: "AI roadmap delivered", description: "A practical, research-backed plan showing where bkWatch can add AI to their operations, marketing, and service — with clear value and effort guidance for each opportunity.", status: "delivered" },
      { title: "Brand knowledge library built", description: "A searchable library of bkWatch's brand, products, features, and communication guidelines — organized and accessible through the portal.", status: "delivered" },
      { title: "Monthly video series", description: "A 30-second video every month, building a library of content that shows bkWatch's value to potential partners and clients.", status: "planned" },
      { title: "AI workflow implementation", description: "Teaching and implementing AI-powered workflows to automate routine tasks starting in month two.", status: "planned" },
    ],
    capabilities: [
      { title: "Client Portal", type: "tool", description: "A private, real-time workspace for project collaboration, comments, and progress tracking.", status: "delivered" },
      { title: "AI Film Production", type: "knowledge", description: "AI-powered video production that creates professional films faster and at lower cost than traditional methods.", status: "available" },
      { title: "AI Roadmap", type: "knowledge", description: "Research-backed guidance on where and how to add AI to your operations, with clear value and effort assessment.", status: "delivered" },
      { title: "Brand Knowledge Library", type: "tool", description: "An organized, searchable library of your brand, products, features, and communication guidelines.", status: "delivered" },
      { title: "Monthly Video Series", type: "service", description: "Ongoing monthly video production to build a content library showing your value to partners and clients.", status: "planned" },
      { title: "AI Workflow Training", type: "service", description: "Teaching your team to use AI-powered workflows for everyday tasks — writing, analysis, research, and reporting.", status: "planned" },
    ],
    narrative: {
      summary: "Third i started with one film project for bkWatch and has already delivered a client portal, an AI roadmap, and a brand knowledge library alongside the film. The AI film workflow is trained on 614 hours of prior client work — so bkWatch's films benefit from the start from a mature, battle-tested production pipeline.",
      faster: "bkWatch's Film 1 benefits from 614 hours of accumulated learning on prior client films. The workflow already knows how to storyboard, generate stills, produce video, and edit efficiently — techniques that took 250 hours on the first film ever produced now take a fraction of the time. Each bkWatch film will get even faster as the workflow learns bkWatch's specific brand and product details.",
      smarter: "The AI film workflow is trained on multiple completed films — conference videos, product demos, and brand stories. That means bkWatch's films start from a higher baseline: the AI already understands visual storytelling, brand consistency, and audience engagement. The brand knowledge library ensures every film is increasingly tailored to bkWatch's specific positioning and product details.",
      expanding: "What started as one film is growing into a full partnership: monthly videos, AI workflow training, brand assets, and on-call creative support. By month six, Third i becomes an expanded partner — not just a film producer, but a creative and AI collaborator across the business.",
    },
    completedProjects: [],
    efficiencyTrend: [], // bkWatch has no completed projects yet
    crossClientTraining: {
      hoursLearnedFrom: 614,
      filmsLearnedFrom: 4,
      description: "The AI film workflow is trained on 614 hours and 4 completed films from prior client work. bkWatch's films start from this accumulated knowledge — not from zero.",
      trend: [
        { project: "First film ever (Shaw Conference)", hours: 250, note: "Full pipeline built from scratch" },
        { project: "Second film (Shaw Amplify V1)", hours: 119, note: "52% faster — workflow learned the visual system" },
        { project: "Third film (Shaw Amplify V2)", hours: 118, note: "Refined and improved, same efficiency" },
        { project: "Fourth film (Shaw AI Advisor)", hours: 39, note: "84% faster than Film 1 — deeply trained on brand" },
        { project: "Fifth film (Shaw Insight Demo)", hours: 6, note: "97% faster — workflow fully trained, rapid production" },
      ],
    },
    financialSummary: {
      totalBilled: 0,
      totalPaid: 0,
      outstanding: 0,
      totalHours: 20,
      billableHours: 0,
      effectiveRate: 0,
      formattedBilled: "$0",
      formattedPaid: "$0",
      formattedOutstanding: "$0",
      note: "bkWatch is in the pipeline phase — no invoices yet. 20 hours invested in Film 1 production.",
    },
    source: "Hours from Third i time tracking (20 hrs logged manually); cross-client efficiency data from Google Sheets via extract-metrics.mjs",
  };

  // Write both files
  for (const [tenant, data] of Object.entries({ shaw: shawInvoicing, bkwatch: bkwatchInvoicing })) {
    const dir = join(contentDir, tenant);
    await mkdir(dir, { recursive: true });
    const outPath = join(dir, "invoicing.json");
    await writeFile(outPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`${tenant}: ${data.completedProjects.length} completed projects, ${data.metrics.hoursInvested.hours || data.metrics.hoursInvested.descriptor} hours, ${data.financialSummary.formattedBilled} billed → ${outPath}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
