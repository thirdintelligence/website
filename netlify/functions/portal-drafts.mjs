/* /bkwatch/api/drafts — server-side composer drafts, keyed by tenant + an opaque
   per-browser device id (HttpOnly cookie). Draft content never lives in
   localStorage or URLs and can't be read before tenant authentication. */
import { authenticate, verifyMutation } from "../../lib/portal-request-auth.mjs";
import { readCookie } from "../../lib/portal-auth.mjs";
import { getStore, key } from "../../lib/portal-store.mjs";
import { json, apiError, readJson, tenantFromPath } from "../../lib/portal-api-util.mjs";
import { newDeviceId, nowIso } from "../../lib/portal-ids.mjs";

const deviceCookieName = (t) => `thirdi_${t}_device`;
const deviceCookie = (t, id) => `${deviceCookieName(t)}=${id}; Path=/${t}; Max-Age=${60 * 60 * 24 * 365}; HttpOnly; Secure; SameSite=Strict`;

export default async (request) => {
  const tenant = tenantFromPath(request);
  const auth = authenticate(request, tenant);
  if (!auth.ok) return apiError(auth.status, auth.error);
  const store = await getStore();

  let device = readCookie(request.headers.get("cookie"), deviceCookieName(tenant));
  const draftKey = (d) => key(tenant, "drafts", d, "current");

  if (request.method === "GET") {
    if (!device) return json({ draft: null });
    return json({ draft: (await store.get(draftKey(device))) || null });
  }

  if (!verifyMutation(request, tenant)) return apiError(403, "csrf_failed");
  let setCookie;
  if (!device) { device = newDeviceId(); setCookie = deviceCookie(tenant, device); }

  if (request.method === "POST") {
    const body = await readJson(request);
    const draft = { tenant, deviceId: device, mode: body.mode === "project" ? "project" : "comment", fields: body.fields || {}, context: body.context || {}, updatedAt: nowIso() };
    await store.set(draftKey(device), draft);
    return json({ draft }, 200, setCookie ? { "set-cookie": setCookie } : {});
  }

  if (request.method === "DELETE") {
    if (device) await store.delete(draftKey(device));
    return json({ ok: true }, 200, setCookie ? { "set-cookie": setCookie } : {});
  }

  return apiError(405, "method_not_allowed");
};
