/* Shared helpers for operational API functions: JSON responses (always no-store),
   body parsing, and tenant/id extraction from the tenant-scoped path. */
import { isActivePortalTenant } from "../config/portal-tenants.mjs";

const NO_STORE = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...NO_STORE, ...extraHeaders } });
}
export function apiError(status, code, details) {
  return json({ error: code, ...(details ? { details } : {}) }, status);
}
export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

/** First path segment is the tenant route (…/bkwatch/api/…). */
export function tenantFromPath(request) {
  const seg = new URL(request.url).pathname.split("/").filter(Boolean);
  const tenant = seg[0] || "";
  return isActivePortalTenant(tenant) ? tenant : "";
}
/** Trailing id after the resource, e.g. /bkwatch/api/comments/<id>. */
export function idFromPath(request) {
  const seg = new URL(request.url).pathname.split("/").filter(Boolean);
  return seg.length > 3 ? decodeURIComponent(seg[3]) : "";
}
/** Sub-path after /api/, e.g. /bkwatch/api/media/upload/initiate → ["media","upload","initiate"]. */
export function subPath(request) {
  const seg = new URL(request.url).pathname.split("/").filter(Boolean);
  return seg.slice(2);
}

const LABELS = { bkwatch: "bkWatch", shaw: "Shaw" };
export const tenantLabel = (t) => LABELS[t] || t;
