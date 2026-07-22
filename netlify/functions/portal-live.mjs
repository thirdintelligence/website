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
  const [commentKeys, requestKeys] = await Promise.all([
    store.list(key(tenant, "comments") + "/"),
    store.list(key(tenant, "project-requests") + "/")
  ]);
  const [comments, projectRequests] = await Promise.all([
    Promise.all(commentKeys.map((k) => store.get(k))),
    Promise.all(requestKeys.map((k) => store.get(k)))
  ]);
  const visibleComments = comments.filter((c) => c && !c.deleted);
  const visibleRequests = projectRequests.filter(Boolean);

  const openBlockers = visibleComments.filter((c) => c.blocker && c.status === "open").length;
  const completed = visibleComments.filter((c) => c.status === "completed");

  const csrfToken = randomBytes(18).toString("base64url");
  return json({
    comments: visibleComments.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    projectRequests: visibleRequests.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    counts: { comments: visibleComments.length, openBlockers, completed: completed.length, projectRequests: visibleRequests.length },
    csrfToken,
    asOf: new Date().toISOString()
  }, 200, { "set-cookie": csrfCookie(tenant, csrfToken) });
};
