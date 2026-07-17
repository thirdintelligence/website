import assert from "node:assert/strict";
import test from "node:test";
import { createPasswordHash, credentialVersion, encryptSession } from "../lib/portal-auth.mjs";
import handler from "../netlify/functions/bkwatch-portal.mjs";

const password = "test-portal-88";
const passwordHash = await createPasswordHash(password, Buffer.alloc(16, 3));
const secret = Buffer.alloc(32, 5).toString("base64url");

globalThis.Netlify = {
  env: {
    get(name) {
      if (name === "BKWATCH_PORTAL_PASSWORD_HASH") return passwordHash;
      if (name === "PORTAL_SESSION_SECRET") return secret;
      return undefined;
    },
  },
};

async function formRequest(fields, origin = "https://thirdi.net") {
  const loginPage = await handler(new Request("https://thirdi.net/bkwatch"));
  const csrfCookie = loginPage.headers.get("set-cookie").split(";")[0];
  const csrfBody = await loginPage.text();
  const csrf = csrfBody.match(/name="csrf" value="([A-Za-z0-9_-]+)"/)?.[1];
  assert.ok(csrf);
  return new Request("https://thirdi.net/bkwatch", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin, cookie: csrfCookie },
    body: new URLSearchParams({ csrf, ...fields }),
  });
}

test("anonymous requests receive only the password page", async () => {
  const response = await handler(new Request("https://thirdi.net/bkwatch"));
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /Enter your portal password/);
  assert.doesNotMatch(body, /122 visual prompts/);
  assert.doesNotMatch(body, /Final Demo/);
  assert.doesNotMatch(body, /Built Beneath the Surface/);
});

test("invalid password is generic and does not set a session", async () => {
  const response = await handler(await formRequest({ password: "wrong-value" }));
  assert.equal(response.status, 401);
  assert.doesNotMatch(response.headers.get("set-cookie") || "", /thirdi_bkwatch_session=/);
  assert.match(await response.text(), /password was not accepted/i);
});

test("valid password creates an encrypted persistent secure cookie", async () => {
  const response = await handler(await formRequest({ password }));
  const cookie = response.headers.get("set-cookie");
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/bkwatch");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Max-Age=2592000/);
  assert.equal(cookie.includes(password), false);
});

test("valid bkWatch session returns the redesigned portal shell in live mode", async () => {
  const login = await handler(await formRequest({ password }));
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const response = await handler(new Request("https://thirdi.net/bkwatch/projects/film1-shaw-bkwatch", { headers: { cookie } }));
  const body = await response.text();
  assert.equal(response.status, 200);
  // Redesigned shell: embedded (private) manifests + live config, script locked to self.
  assert.match(body, /id="portal-data" type="application\/json"/);
  assert.match(body, /id="portal-config"[^>]*>[^<]*"mode":"live"/);
  assert.match(body, /\/public\/portal\/core\/app\.js/);
  assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
  // No unresolved placeholders and no leaked internals.
  assert.doesNotMatch(body, /__PORTAL_DATA__|__CSRF_TOKEN__|__ASSET_RELEASE__/);
  assert.doesNotMatch(body, /\/Users\/justinbrannon/);
  assert.doesNotMatch(body, /memory\/BKWATCH/);
  assert.match(response.headers.get("set-cookie"), /thirdi_bkwatch_session=/);
  assert.match(response.headers.get("set-cookie"), /Max-Age=2592000/);
});

test("a valid session for another tenant cannot enter bkWatch", async () => {
  const otherToken = encryptSession({
    tenant: "shaw",
    expiresAt: Date.now() + 60_000,
    credentialVersion: credentialVersion(passwordHash),
  }, secret);
  const response = await handler(new Request("https://thirdi.net/bkwatch", { headers: { cookie: `thirdi_bkwatch_session=${otherToken}` } }));
  const body = await response.text();
  assert.match(body, /Enter your portal password/);
  assert.doesNotMatch(body, /Built Beneath the Surface/);
});

test("changing the client password hash invalidates existing client sessions", async () => {
  const staleToken = encryptSession({
    tenant: "bkwatch",
    expiresAt: Date.now() + 60_000,
    credentialVersion: credentialVersion("scrypt$old$hash"),
  }, secret);
  const response = await handler(new Request("https://thirdi.net/bkwatch", {
    headers: { cookie: `thirdi_bkwatch_session=${staleToken}` },
  }));
  assert.match(await response.text(), /Enter your portal password/);
});

test("cross-origin login posts are rejected", async () => {
  const response = await handler(new Request("https://thirdi.net/bkwatch", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: "https://attacker.example" },
    body: `password=${encodeURIComponent(password)}`,
  }));
  assert.equal(response.status, 403);
  assert.doesNotMatch(response.headers.get("set-cookie") || "", /thirdi_bkwatch_session=/);
});

test("opaque-origin app browsers require the one-time same-site CSRF token", async () => {
  const loginPage = await handler(new Request("https://thirdi.net/bkwatch"));
  const csrfCookie = loginPage.headers.get("set-cookie").split(";")[0];
  const csrfBody = await loginPage.text();
  const csrfToken = csrfBody.match(/name="csrf" value="([A-Za-z0-9_-]+)"/)?.[1];
  assert.ok(csrfToken);

  const accepted = await handler(new Request("https://thirdi.net/bkwatch", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: "null", cookie: csrfCookie },
    body: `csrf=${encodeURIComponent(csrfToken)}&password=${encodeURIComponent(password)}`,
  }));
  assert.equal(accepted.status, 303);

  const rejected = await handler(new Request("https://thirdi.net/bkwatch", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: "null" },
    body: `password=${encodeURIComponent(password)}`,
  }));
  assert.equal(rejected.status, 403);
});
