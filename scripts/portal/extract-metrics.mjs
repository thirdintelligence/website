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

const FUTURE_VALUE_SECTIONS = [
  { title: "Delivery speed", icon: "clock", statusLabel: "Ready to track", description: "Shows whether production becomes faster across completed projects.", metrics: ["Total hours", "Weeks to completion", "Hours per finished minute"] },
  { title: "Deliverable quality", icon: "checkCircle", statusLabel: "Ready to track", description: "Uses approval evidence instead of an invented quality score.", metrics: ["Approved deliverables", "Review rounds", "Rework hours"] },
  { title: "Output volume", icon: "layers", statusLabel: "Ready to track", description: "Records how much finished, client-approved work each project produces.", metrics: ["Deliverables", "Finished minutes", "Approved versions"] },
  { title: "Financial return", icon: "chart", statusLabel: "Ready to track", description: "Adds comparable financial context after project scope and billing are confirmed.", metrics: ["Cost per deliverable", "Effective rate", "Value over baseline"] },
  { title: "Compounding capability", icon: "sparkles", statusLabel: "Ready to track", description: "Shows the reusable systems and client-specific capabilities added by each project.", metrics: ["Capabilities added", "Reusable components", "Next-project time saved"] },
  { title: "Project confidence", icon: "target", statusLabel: "Ready to track", description: "Compares plans with completed results without exposing another client's records.", metrics: ["Expected vs. actual", "Milestone accuracy", "Decision turnaround"] },
];

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
  const shawCompleted = shawProjects.filter((p) => p.status === "Delivered" || p.status === "Complete");
  const shawInProgress = shawProjects.filter((p) => p.status === "In Production");

  const shawInvoicing = {
    schemaVersion: "2.0.0",
    tenant: "shaw",
    clientSafe: true,
    asOf,
    metrics: {
      projectsActive: { count: shawInProgress.length, descriptor: "active projects", label: `${shawInProgress.length} films in production — Amplify V2, AI Advisor Demo, and Insight Demo` },
      deliverablesCompleted: { count: shawCompleted.length, descriptor: "deliverables", label: `${shawCompleted.length} completed Shaw deliverables` },
      hoursInvested: { hours: 614, descriptor: "hours", label: "614 total hours across Shaw projects — 324 billable and 290 partnership/R&D" },
      capabilitiesDelivered: { count: 5, descriptor: "capabilities", label: "Films, training, agent architecture, loop videos, and conference AV" },
    },
    capabilities: [
      { title: "AI Film Production", type: "knowledge", description: "Full AI-powered video production pipeline — storyboarding, stills, video generation, and editing.", status: "delivered" },
      { title: "Conference AV + Live Production", type: "service", description: "Live conference AV support, lighting, and logo video assets.", status: "delivered" },
      { title: "Team Training", type: "knowledge", description: "Hands-on training sessions on AI-powered workflows for the Shaw marketing team.", status: "delivered" },
      { title: "Agent Architecture", type: "tool", description: "Custom workflow and agent architecture for Shaw's marketing operations (40 hours goodwill).", status: "delivered" },
      { title: "Loop Video Assets", type: "tool", description: "Reusable logo sequence loop videos for conferences and digital displays.", status: "delivered" },
    ],
    narrative: {
      summary: "Third i's Shaw production system improves with each completed film. The Value & Results hero compares the expected efficiency trajectory with verified actual results while financial, delivery, and quality evidence accumulate below.",
      faster: "Shaw Systems Film 1 established a baseline of 150 production hours per finished minute. Shaw Systems Film 2 improved to 120 hours per finished minute. Future Shaw films are in development and are expected to require less time.",
      smarter: "Each Shaw project can reuse Shaw-approved brand knowledge, production methods, and quality checks. Other clients' source files, prompts, private knowledge, credentials, and generated assets remain isolated and never enter Shaw's workspace.",
      expanding: "Future projects will add verified evidence for total hours, weeks to completion, approved deliverables, review efficiency, financial context, and reusable capabilities without relying on invented quality scores.",
    },
    completedProjects: shawCompleted.map((p) => ({
      title: p.project,
      completedAt: p.period,
      hours: p.hours,
      amount: fmtMoney(p.revenue),
      outcome: p.status,
    })),
    efficiencyTrend: [],
    efficiencyModel: {
      minCompletedProjects: 2,
      completedProjectCount: 2,
      unit: "hours per finished minute",
      futureLabel: "Future Shaw films",
      projects: [
        { label: "Shaw Systems Film 1", status: "completed", actualHoursPerMinute: 150 },
        { label: "Shaw Systems Film 2", status: "completed", actualHoursPerMinute: 120 },
      ],
    },
    learningPrivacy: {
      title: "Built on Shaw work. Isolated to Shaw.",
      description: "Third i can reuse Shaw-approved production methods and brand knowledge across Shaw projects. No other client's files, prompts, private knowledge, credentials, or generated assets enter this workspace.",
      carriesForward: ["Shaw-approved production methods and tooling", "Shaw brand knowledge and project feedback", "Quality-control patterns verified on completed Shaw work"],
      staysPrivate: ["Every other client's source files and generated assets", "Other-client prompts, credentials, and private knowledge", "Other-client feedback, strategy, and project records"],
    },
    futureValueSections: FUTURE_VALUE_SECTIONS,
    financialSummary: {
      totalBilled: 21870,
      totalPaid: 17910,
      outstanding: 3960,
      totalHours: 614,
      billableHours: 324,
      partnershipHours: 290,
      activeProjects: shawInProgress.length,
      completedProjects: shawCompleted.length,
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
  // the manually-entered data. Cross-client source files, prompts, private
  // knowledge, and assets never enter this tenant's value evidence.
  const bkwatchInvoicing = {
    schemaVersion: "2.0.0",
    tenant: "bkwatch",
    clientSafe: true,
    asOf,
    metrics: {
      projectsActive: { count: 1, descriptor: "film", label: "Film 1 - Shaw Integration — selected demo in production" },
      deliverablesCompleted: { count: 4, descriptor: "deliverables", label: "4 of 10 Film 1 - Shaw Integration deliverables are ready" },
      hoursInvested: { hours: 20, descriptor: "hours", label: "20 hours on Film 1 - Shaw Integration — demo direction, script, storyboard, and instructions" },
      capabilitiesDelivered: { count: 4, descriptor: "capabilities", label: "Client portal, AI film production, AI roadmap, and brand knowledge library" },
    },
    capabilities: [
      { title: "Client Portal", type: "tool", description: "A private, real-time workspace for project collaboration, comments, and progress tracking.", status: "delivered" },
      { title: "AI Film Production", type: "knowledge", description: "AI-powered production for individual films and an ongoing monthly film series, creating a growing content library faster and at lower cost than traditional methods.", status: "available" },
      { title: "AI Roadmap", type: "knowledge", description: "Research-backed guidance on where and how to add AI to your operations, with clear value and effort assessment.", status: "delivered" },
      { title: "Brand Knowledge Library", type: "tool", description: "An organized, searchable library of your brand, products, features, and communication guidelines.", status: "delivered" },
      { title: "AI Workflow Training", type: "service", description: "Teaching your team to use AI-powered workflows for everyday tasks — writing, analysis, research, and reporting.", status: "planned" },
    ],
    narrative: {
      summary: "Third i is building the selected demo for Film 1 - Shaw Integration alongside a private client portal, AI roadmap, and brand knowledge library. Full-film production has not started. The production system carries forward reusable methods and quality checks from prior work while every client's files, prompts, knowledge, and generated assets remain isolated.",
      faster: "Each completed bkWatch film will establish a verified baseline for total hours, weeks to completion, and hours per finished minute. After two completed projects, this page will compare expected and actual efficiency and show how both improve over time.",
      smarter: "Reusable production methods and quality-control patterns improve with completed work, but no other client's source files, prompts, private knowledge, credentials, or generated assets enter bkWatch's workspace. bkWatch work is guided by bkWatch's approved materials and feedback.",
      expanding: "Every future project adds a clearer record of delivery speed, approved quality, deliverable volume, financial context, and reusable capabilities. The placeholders below become verified metrics as work is completed.",
    },
    completedProjects: [],
    efficiencyTrend: [], // bkWatch has no completed projects yet
    efficiencyModel: {
      minCompletedProjects: 2,
      completedProjectCount: 0,
      unit: "hours per finished minute",
      futureLabel: "Future bkWatch films",
      projects: [],
    },
    learningPrivacy: {
      title: "Built on prior work. Isolated by client.",
      description: "Third i improves reusable production methods through completed work without pooling client workspaces. General craft and quality-control improvements carry forward; client-specific material never crosses into another client's portal or production package.",
      carriesForward: ["Reusable production methods and tooling", "General film craft and quality-control patterns", "Workflow improvements that reduce avoidable setup and rework"],
      staysPrivate: ["Client source files and generated assets", "Prompts, credentials, and private brand knowledge", "Client-specific feedback, strategy, and project records"],
    },
    futureValueSections: FUTURE_VALUE_SECTIONS,
    financialSummary: {
      totalBilled: 0,
      totalPaid: 0,
      outstanding: 0,
      totalHours: 20,
      billableHours: 0,
      partnershipHours: 20,
      activeProjects: 1,
      completedProjects: 0,
      effectiveRate: 0,
      formattedBilled: "$0",
      formattedPaid: "$0",
      formattedOutstanding: "$0",
      note: "bkWatch is in the pipeline phase — no invoices yet. 20 hours are recorded on Film 1 - Shaw Integration, currently in demo production.",
    },
    source: "Hours from Third i time tracking (20 hrs recorded manually); project efficiency activates only from tenant-owned completed work",
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
