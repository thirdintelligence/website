/* extract-communications.mjs — publish sanitized, tenant-routed communication
   summaries from the owner-only OS snapshot.

   Participant domains are authoritative when present. A client name mentioned
   in a subject, body, description, or agenda never assigns that record to the
   mentioned client's portal. Joint records are published only to tenants that
   have an actual participant. Meeting links, access codes, calendar links, and
   phone numbers are removed from the client manifest.

   Usage: node scripts/portal/extract-communications.mjs
   Outputs: content/clients/<tenant>/communications.json */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const osPath = join(root, "os.html");
const contentDir = join(root, "content", "clients");

const TENANTS = {
  bkwatch: {
    clientMatch: ["bkWatch", "bkwatch", "BankruptcyWatch"],
    domains: ["bankruptcywatch.com"],
    contactLabel: "Jessica Krobot + Dylan",
  },
  shaw: {
    clientMatch: ["Shaw Systems", "Shaw", "shaw"],
    domains: ["shawsystems.com"],
    contactLabel: "Shaw team",
  },
};

function extractSnapshot(html) {
  const match = html.match(/window\.__SNAPSHOT__\s*=\s*(\{[\s\S]*?\});/);
  if (!match) throw new Error("No window.__SNAPSHOT__ found in os.html");
  return JSON.parse(match[1]);
}

function isClientMatch(routeClient, matches) {
  if (!routeClient) return false;
  const value = String(routeClient).toLowerCase();
  return matches.some((match) => value === match.toLowerCase());
}

function participants(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return values.map((item) => String(item).trim()).filter(Boolean);
}

function participantText(item, kind) {
  const fields = kind === "meeting"
    ? [item.attendees]
    : [item.from, item.to, item.cc];
  return fields.flatMap(participants).join(" ").toLowerCase();
}

function participantTenants(item, kind) {
  const text = participantText(item, kind);
  return Object.entries(TENANTS)
    .filter(([, config]) => config.domains.some((domain) => text.includes(`@${domain}`)))
    .map(([tenant]) => tenant);
}

function belongsToTenant(item, kind, tenant, config) {
  const explicitTenants = participantTenants(item, kind);
  if (explicitTenants.length) return explicitTenants.includes(tenant);
  return isClientMatch(item.route?.client, config.clientMatch);
}

function safeDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function sanitizeSummary(value, maxLength) {
  return String(value || "")
    .replace(/https?:\/\/[^\s<]+/gi, "[link removed]")
    .replace(/\b(?:Meeting ID|Passcode|PIN|Phone conference ID)\s*:\s*[A-Za-z0-9 #*-]+/gi, "[meeting access removed]")
    .replace(/\+?1[\s().-]*\d{3}[\s().-]*\d{3}[\s.-]*\d{4}(?:,,\d+#)?/g, "[phone removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function routeContactLabel(item, tenant, config) {
  return isClientMatch(item.route?.client, config.clientMatch)
    ? String(item.route?.contactLabel || config.contactLabel)
    : config.contactLabel;
}

function extractForTenant(snapshot, tenant, config) {
  const emailById = new Map();
  for (const summary of snapshot.gmail?.summaries || []) {
    for (const message of summary.messages || []) {
      if (!belongsToTenant(message, "email", tenant, config)) continue;
      emailById.set(message.id, {
        id: String(message.id),
        from: String(message.from || ""),
        to: String(message.to || ""),
        subject: sanitizeSummary(message.subject, 300),
        date: String(message.date || ""),
        timestamp: Number(message.timestamp || 0) || null,
        dateLabel: safeDateLabel(message.date || message.timestamp),
        snippet: sanitizeSummary(message.snippet, 300),
        preview: sanitizeSummary(message.preview, 600),
        contactLabel: routeContactLabel(message, tenant, config),
      });
    }
  }
  const emails = [...emailById.values()].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const meetingById = new Map();
  const upcomingIds = new Set((snapshot.calendar?.events || []).map((event) => event.id));
  const allEvents = [...(snapshot.calendar?.events || []), ...(snapshot.calendar?.archive || [])];
  for (const event of allEvents) {
    if (!belongsToTenant(event, "meeting", tenant, config)) continue;
    meetingById.set(event.id, {
      id: String(event.id),
      summary: sanitizeSummary(event.summary, 300),
      start: String(event.start || ""),
      end: String(event.end || ""),
      startLabel: String(event.startLabel || ""),
      endLabel: String(event.endLabel || ""),
      location: sanitizeSummary(event.location, 200),
      attendees: participants(event.attendees),
      upcoming: upcomingIds.has(event.id),
      contactLabel: routeContactLabel(event, tenant, config),
    });
  }
  const meetings = [...meetingById.values()].sort((a, b) => {
    if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
    return String(b.start).localeCompare(String(a.start));
  });

  return { emails, meetings };
}

async function main() {
  const snapshot = extractSnapshot(await readFile(osPath, "utf8"));
  const asOf = String(snapshot.generatedAt || new Date().toISOString()).slice(0, 10);

  for (const [tenant, config] of Object.entries(TENANTS)) {
    const { emails, meetings } = extractForTenant(snapshot, tenant, config);
    const data = {
      schemaVersion: "2.0.0",
      tenant,
      clientSafe: true,
      asOf,
      emails,
      meetings,
      source: "Sanitized Gmail and Google Calendar summaries from the owner OS snapshot",
    };
    const dir = join(contentDir, tenant);
    await mkdir(dir, { recursive: true });
    const outPath = join(dir, "communications.json");
    await writeFile(outPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`${tenant}: ${emails.length} emails, ${meetings.length} meetings → ${outPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
