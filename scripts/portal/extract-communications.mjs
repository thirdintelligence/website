/* extract-communications.mjs — Extracts client-specific emails and meetings
   from the OS snapshot embedded in os.html and writes them to per-client
   communications.json files. Run after sync-os.sh updates os.html so the
   portal stays in sync with the OS communication data.

   Usage: node scripts/portal/extract-communications.mjs
   Outputs: content/clients/<tenant>/communications.json for each tenant. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const osPath = join(root, "os.html");
const contentDir = join(root, "content", "clients");

// Tenant → client name matching in the snapshot routes
const TENANTS = {
  bkwatch: { clientMatch: ["bkWatch", "bkwatch"], name: "BankruptcyWatch" },
  shaw: { clientMatch: ["Shaw Systems", "Shaw", "shaw"], name: "Shaw Systems" },
};

function extractSnapshot(html) {
  const m = html.match(/window\.__SNAPSHOT__\s*=\s*(\{[\s\S]*?\});/);
  if (!m) throw new Error("No window.__SNAPSHOT__ found in os.html");
  return JSON.parse(m[1]);
}

function isClientMatch(routeClient, matches) {
  if (!routeClient) return false;
  const lc = routeClient.toLowerCase();
  return matches.some((m) => lc === m.toLowerCase());
}

function fmtDate(ts) {
  if (!ts) return null;
  try { return new Date(ts).toISOString().split("T")[0]; } catch { return null; }
}

function extractForTenant(snap, tenantCfg) {
  const emails = [];
  (snap.gmail?.summaries || []).forEach((s) => {
    (s.messages || []).forEach((msg) => {
      if (isClientMatch(msg.route?.client, tenantCfg.clientMatch)) {
        emails.push({
          id: msg.id,
          from: msg.from || "",
          to: msg.to || "",
          subject: msg.subject || "",
          date: msg.date || "",
          timestamp: msg.timestamp || null,
          dateLabel: msg.date ? new Date(msg.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "",
          snippet: (msg.snippet || "").substring(0, 300),
          preview: (msg.preview || "").substring(0, 1000),
          contactLabel: msg.route?.contactLabel || "",
        });
      }
    });
  });
  // Sort by timestamp descending
  emails.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const meetings = [];
  const allEvents = [...(snap.calendar?.events || []), ...(snap.calendar?.archive || [])];
  allEvents.forEach((e) => {
    if (isClientMatch(e.route?.client, tenantCfg.clientMatch)) {
      const isUpcoming = snap.calendar?.events?.some((ue) => ue.id === e.id);
      meetings.push({
        id: e.id,
        summary: e.summary || "",
        start: e.start || "",
        end: e.end || "",
        startLabel: e.startLabel || "",
        endLabel: e.endLabel || "",
        location: e.location || "",
        attendees: e.attendees || "",
        htmlLink: e.htmlLink || "",
        upcoming: !!isUpcoming,
        contactLabel: e.route?.contactLabel || "",
      });
    }
  });
  // Sort: upcoming first, then by start date descending
  meetings.sort((a, b) => {
    if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
    return b.start?.localeCompare(a.start || "") || 0;
  });

  return { emails, meetings };
}

async function main() {
  const html = await readFile(osPath, "utf8");
  const snap = extractSnapshot(html);
  const asOf = new Date().toISOString().split("T")[0];

  for (const [tenant, cfg] of Object.entries(TENANTS)) {
    const { emails, meetings } = extractForTenant(snap, cfg);
    const data = {
      schemaVersion: "2.0.0",
      tenant,
      clientSafe: true,
      asOf,
      emails,
      meetings,
      source: "Extracted from OS snapshot (Gmail + Google Calendar) via extract-communications.mjs",
    };
    const dir = join(contentDir, tenant);
    await mkdir(dir, { recursive: true });
    const outPath = join(dir, "communications.json");
    await writeFile(outPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`${tenant}: ${emails.length} emails, ${meetings.length} meetings → ${outPath}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
