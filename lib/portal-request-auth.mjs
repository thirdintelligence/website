/**
 * portal-request-auth.mjs — derive authorization for operational APIs.
 *
 * The tenant is ALWAYS taken from the encrypted session cookie, never from the
 * request path or body. A path/body tenant that disagrees with the session is
 * rejected. CSRF uses a same-origin check plus a double-submit token (JS sends
 * the injected token as x-csrf-token; it must equal the HttpOnly csrf cookie).
 */
import { timingSafeEqual } from "node:crypto";
import { readCookie, decryptSession, credentialVersion, isSameOrigin } from "./portal-auth.mjs";
import { getPortalTenant } from "../config/portal-tenants.mjs";

const sessionCookieName = (t) => t === "thirdi-os" ? "thirdi_os_session" : (getPortalTenant(t)?.sessionCookie || `thirdi_${t}_session`);
const csrfCookieName = (t) => t === "thirdi-os" ? "thirdi_os_csrf" : (getPortalTenant(t)?.csrfCookie || `thirdi_${t}_csrf`);
const hashEnvName = (t) => t === "thirdi-os" ? "OS_PORTAL_PASSWORD_HASH" : (getPortalTenant(t)?.passwordHashEnv || `${t.toUpperCase().replace(/-/g, "_")}_PORTAL_PASSWORD_HASH`);

/** Authenticate a request for an expected tenant. Returns {ok, tenant} or {ok:false,status,error}. */
export function authenticate(request, expectedTenant) {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret) return deny(500, "server_not_configured");

  const token = readCookie(request.headers.get("cookie"), sessionCookieName(expectedTenant));
  const session = decryptSession(token, secret);
  if (!session) return deny(401, "not_authenticated");

  const hash = process.env[hashEnvName(expectedTenant)];
  if (!hash || session.cv !== credentialVersion(hash)) return deny(401, "session_invalid");
  if (session.tenant !== expectedTenant) return deny(403, "tenant_mismatch");

  return { ok: true, tenant: expectedTenant, session };
}

/** CSRF + same-origin check for any mutating request. */
export function verifyMutation(request, tenant) {
  if (!isSameOrigin(request)) return false;
  const submitted = request.headers.get("x-csrf-token") || "";
  const cookie = readCookie(request.headers.get("cookie"), csrfCookieName(tenant)) || "";
  if (!submitted || submitted.length !== cookie.length || cookie.length === 0) return false;
  try { return timingSafeEqual(Buffer.from(submitted), Buffer.from(cookie)); }
  catch { return false; }
}

/** Reject any attempt to select a tenant via the request body/path. */
export function assertNoTenantOverride(bodyOrPathTenant, sessionTenant) {
  if (bodyOrPathTenant && bodyOrPathTenant !== sessionTenant) {
    const err = new Error("tenant_override_rejected");
    err.status = 403;
    throw err;
  }
}

function deny(status, error) { return { ok: false, status, error }; }

export const _internal = { sessionCookieName, csrfCookieName, hashEnvName };
