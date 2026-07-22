/* Shared setup for operational-API tests: env, a fresh isolated store dir, and
   authenticated Request builders (valid session cookie + CSRF + same-origin). */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPasswordHash, credentialVersion, encryptSession } from "../../lib/portal-auth.mjs";
import { _resetStore } from "../../lib/portal-store.mjs";

export const SECRET = Buffer.alloc(32, 7).toString("base64url");
const ORIGIN = "http://localhost:8888";
let HASHES = null;

export async function setupEnv() {
  if (!HASHES) {
    HASHES = {
      bkwatch: await createPasswordHash("animal12", Buffer.alloc(16, 3)),
      shaw: await createPasswordHash("shawpass1", Buffer.alloc(16, 4)),
      "thirdi-os": await createPasswordHash("ownerpass1", Buffer.alloc(16, 5))
    };
  }
  process.env.PORTAL_SESSION_SECRET = SECRET;
  process.env.BKWATCH_PORTAL_PASSWORD_HASH = HASHES.bkwatch;
  process.env.SHAW_PORTAL_PASSWORD_HASH = HASHES.shaw;
  process.env.OS_PORTAL_PASSWORD_HASH = HASHES["thirdi-os"];
  process.env.PORTAL_MAIL_PROVIDER = "log";
  process.env.PORTAL_OWNER_EMAIL = "ceo@thirdi.net";
  return HASHES;
}

/** Point the store at a fresh temp dir and clear the module cache. */
export async function freshStore() {
  const dir = await mkdtemp(join(tmpdir(), "portal-store-"));
  process.env.PORTAL_STORE_DIR = dir;
  _resetStore();
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

const cookieName = (t) => (t === "thirdi-os" ? "thirdi_os_session" : `thirdi_${t}_session`);
const csrfName = (t) => (t === "thirdi-os" ? "thirdi_os_csrf" : `thirdi_${t}_csrf`);

export function sessionToken(tenant) {
  return encryptSession({ tenant, expiresAt: Date.now() + 3600e3, credentialVersion: credentialVersion(HASHES[tenant]) }, SECRET);
}

/** Build an authenticated Request. Pass {anon:true} for no session, {csrf:false} to omit CSRF. */
export function authedReq(url, method = "GET", { tenant = "bkwatch", body, anon = false, csrf = true, origin = ORIGIN } = {}) {
  const headers = { "content-type": "application/json" };
  if (origin) headers.origin = origin;
  const csrfVal = "csrftok0123456789";
  const cookies = [];
  if (!anon) cookies.push(`${cookieName(tenant)}=${sessionToken(tenant)}`);
  if (!anon && csrf) { cookies.push(`${csrfName(tenant)}=${csrfVal}`); headers["x-csrf-token"] = csrfVal; }
  if (cookies.length) headers.cookie = cookies.join("; ");
  return new Request(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
}
