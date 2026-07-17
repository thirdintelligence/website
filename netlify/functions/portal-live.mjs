/* /bkwatch/api/live — aggregated tenant operational state for the portal
   (comments + derived counts). Also rotates the CSRF token so a long-open SPA
   keeps a valid double-submit token for mutations. */
import { randomBytes } from "node:crypto";
import { authenticate } from "../../lib/portal-request-auth.mjs";
import { getStore, key } from "../../lib/portal-store.mjs";
import { json, apiError, tenantFromPath } from "../../lib/portal-api-util.mjs";

const csrfCookie = (t, token) => `thirdi_${t}_csrf=${token}; Path=/${t}; Max-Age=1800; HttpOnly; Secure; SameSite=Strict`;

export default async (request) => {
  const tenant = tenantFromPath(request);
  const auth = authenticate(request, tenant);
  if (!auth.ok) return apiError(auth.status, auth.error);
  if (request.method !== "GET") return apiError(405, "method_not_allowed");

  const store = await getStore();
  const keys = await store.list(key(tenant, "comments") + "/");
  const comments = (await Promise.all(keys.map((k) => store.get(k)))).filter((c) => c && !c.deleted);

  const openBlockers = comments.filter((c) => c.blocker && c.status === "open").length;
  const completed = comments.filter((c) => c.status === "completed");

  const csrfToken = randomBytes(18).toString("base64url");
  return json({
    comments: comments.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    counts: { comments: comments.length, openBlockers, completed: completed.length },
    csrfToken,
    asOf: new Date().toISOString()
  }, 200, { "set-cookie": csrfCookie(tenant, csrfToken) });
};
