/**
 * sync-portal-events.mjs — live → memory mirror (DRY-RUN ONLY).
 *
 * Reads operational comment/completion events and reports exactly which
 * deterministic Markdown files it WOULD write into the client communications
 * memory folders. It NEVER writes: MEM-01 approval is required first, and the
 * target folders do not yet exist. Run this to review the migration before
 * granting MEM-01.
 *
 * Usage: node scripts/portal/sync-portal-events.mjs [tenant]   (default bkwatch)
 */
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { getStore } from "../../lib/portal-store.mjs";
import { listEvents } from "../../lib/portal-audit.mjs";
import { key } from "../../lib/portal-store.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");
const TENANT = process.argv[2] || "bkwatch";
const CLIENT = TENANT.toUpperCase();
const COMMS_DIR = resolve(ROOT, "memory", CLIENT, `${CLIENT}_COMMS`, "comments");
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

const store = await getStore();
const events = await listEvents(store, TENANT);
const commentEvents = events.filter((e) => String(e.type).startsWith("comment."));

console.log(`── Memory mirror DRY-RUN for ${TENANT} ──`);
console.log(`Target folder: ${COMMS_DIR}`);
console.log(`Folder exists: ${await exists(COMMS_DIR) ? "yes" : "NO (created only after MEM-01)"}`);
console.log(`Comment events found: ${commentEvents.length}\n`);

for (const e of commentEvents) {
  const comment = await store.get(key(TENANT, "comments", e.subjectId));
  const date = String(e.at).slice(0, 10);
  const file = `${date}-${e.id}.md`;
  console.log(`WOULD WRITE  ${CLIENT}_COMMS/comments/${file}`);
  console.log(`   event=${e.type} actor=${e.actor} rev=${e.revision ?? "-"}`);
  if (comment) console.log(`   title="${comment.title}" status=${comment.status} project=${comment.projectId}`);
}

console.log(`\nDRY-RUN complete. No files written. Grant MEM-01 to enable deterministic writes.`);
