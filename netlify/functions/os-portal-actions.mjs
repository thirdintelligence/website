/* /os/api/* — OWNER-ONLY action feed + completion round-trip.
 *
 * The owner session (tenant "thirdi-os") is legitimately authorized across all
 * CLIENT tenants, so — unlike client endpoints — the target client tenant may be
 * named in the request. It is still validated against the known-tenant list; a
 * client session can never reach these routes (separate cookie + tenant check).
 */
import { authenticate, verifyMutation } from "../../lib/portal-request-auth.mjs";
import { getStore } from "../../lib/portal-store.mjs";
import { listActions, patchAction } from "../../lib/portal-actions.mjs";
import { listNotifications } from "../../lib/portal-notify.mjs";
import { json, apiError, readJson, idFromPath } from "../../lib/portal-api-util.mjs";

const KNOWN_TENANTS = ["bkwatch"]; // shaw added after bkWatch acceptance

export default async (request) => {
  const auth = authenticate(request, "thirdi-os");
  if (!auth.ok) return apiError(auth.status, auth.error);
  const store = await getStore();
  const path = new URL(request.url).pathname;

  if (request.method === "GET") { // /os/api/portal-events
    const perTenant = {};
    for (const t of KNOWN_TENANTS) {
      perTenant[t] = { actions: await listActions(store, t), notifications: await listNotifications(store, t) };
    }
    const failedNotifications = KNOWN_TENANTS.reduce((n, t) => n + perTenant[t].notifications.filter((x) => x.status === "failed").length, 0);
    return json({ tenants: perTenant, connection: { portals: failedNotifications === 0 ? "ok" : "degraded", checkedAt: new Date().toISOString() } });
  }

  if (request.method === "PATCH") { // /os/api/actions/<id>
    if (!verifyMutation(request, "thirdi-os")) return apiError(403, "csrf_failed");
    const id = idFromPath(request);
    const body = await readJson(request);
    const clientTenant = String(body.tenant || "");
    if (!KNOWN_TENANTS.includes(clientTenant)) return apiError(400, "unknown_tenant");
    const res = await patchAction(store, clientTenant, id, { op: body.op, note: body.note, priority: body.priority });
    if (!res.ok) return apiError(res.status, res.error);
    return json({ action: res.action });
  }

  return apiError(405, "method_not_allowed");
};
