/* portal-audit.mjs — immutable operational event log. Event IDs are stable so
   retries and the memory mirror are idempotent. */
import { key } from "./portal-store.mjs";
import { newId, nowIso, ymSegments } from "./portal-ids.mjs";

export async function writeEvent(store, { tenant, type, subjectId, actor, revision, note, id }) {
  const at = nowIso();
  const { y, m } = ymSegments(at);
  const event = {
    id: id || newId("evt"), tenant, type, subjectId, actor, at,
    ...(revision != null ? { revision } : {}),
    ...(note ? { note } : {})
  };
  await store.set(key(tenant, "events", y, m, event.id), event);
  return event;
}

export async function listEvents(store, tenant) {
  const keys = await store.list(key(tenant, "events") + "/");
  const events = await Promise.all(keys.map((k) => store.get(k)));
  return events.filter(Boolean).sort((a, b) => String(a.at).localeCompare(String(b.at)));
}
