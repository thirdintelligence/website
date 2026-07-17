/* portal-reconcile — scheduled safety net. Sends any pending owner notifications
   that a prior synchronous attempt did not deliver. Idempotent per notification
   id, so double-runs never send twice. Not required for the comment write to
   succeed; comments are durable regardless of email state. */
import { getStore } from "../../lib/portal-store.mjs";
import { processPending } from "../../lib/portal-notify.mjs";

const KNOWN_TENANTS = ["bkwatch"];

export default async () => {
  const store = await getStore();
  const results = {};
  for (const t of KNOWN_TENANTS) results[t] = await processPending(store, t);
  return new Response(JSON.stringify({ ok: true, results }), { headers: { "content-type": "application/json" } });
};

export const config = { schedule: "*/10 * * * *" };
