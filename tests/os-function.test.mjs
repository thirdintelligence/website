import assert from "node:assert/strict";
import test from "node:test";
import { createPasswordHash, credentialVersion, encryptSession } from "../lib/portal-auth.mjs";

const password = "short";
const passwordHash = await createPasswordHash(password, Buffer.alloc(16, 11), { minimumLength: 5 });
const secret = Buffer.alloc(32, 13).toString("base64url");

globalThis.Netlify = {
  env: {
    get(name) {
      if (name === "OS_PORTAL_PASSWORD_HASH") return passwordHash;
      if (name === "PORTAL_SESSION_SECRET") return secret;
      return undefined;
    },
  },
};

const { default: handler } = await import(`../netlify/functions/os-portal.mjs?test=${Date.now()}`);

async function formRequest(fields, origin = "https://thirdi.net") {
  const loginPage = await handler(new Request("https://thirdi.net/os"));
  const csrfCookie = loginPage.headers.get("set-cookie").split(";")[0];
  const csrfBody = await loginPage.text();
  const csrf = csrfBody.match(/name="csrf" value="([A-Za-z0-9_-]+)"/)?.[1];
  assert.ok(csrf);
  return new Request("https://thirdi.net/os", {
    method: "POST",
    headers: { origin, cookie: csrfCookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrf, ...fields }),
  });
}

test("anonymous OS requests receive only the owner login page", async () => {
  const response = await handler(new Request("https://thirdi.net/os"));
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /Open Third i OS/);
  assert.doesNotMatch(body, /EXEC SYSTEM/);
  assert.match(response.headers.get("set-cookie"), /thirdi_os_csrf=/);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
});

test("valid OS password creates an encrypted owner session", async () => {
  const response = await handler(await formRequest({ password }));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/os");
  assert.match(response.headers.get("set-cookie"), /thirdi_os_session=/);
  assert.match(response.headers.get("set-cookie"), /Max-Age=31536000/);
  assert.doesNotMatch(response.headers.get("set-cookie"), new RegExp(password));
});

test("valid owner session returns OS content without the legacy browser gate", async () => {
  const token = encryptSession({
    tenant: "thirdi-os",
    expiresAt: Date.now() + 60_000,
    credentialVersion: credentialVersion(passwordHash),
  }, secret);
  const response = await handler(new Request("https://thirdi.net/os", {
    headers: { cookie: `thirdi_os_session=${token}` },
  }));
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /Third i OS/);
  assert.match(body, /Log out/);
  assert.doesNotMatch(body, /id="passGate"/);
  assert.doesNotMatch(body, /PASS_HASH/);
  assert.match(response.headers.get("content-security-policy"), /nonce-/);
  assert.match(response.headers.get("set-cookie"), /thirdi_os_session=/);
  assert.match(response.headers.get("set-cookie"), /Max-Age=31536000/);
});

test("a client-portal session cannot enter the owner OS", async () => {
  const otherToken = encryptSession({
    tenant: "bkwatch",
    expiresAt: Date.now() + 60_000,
    credentialVersion: credentialVersion(passwordHash),
  }, secret);
  const response = await handler(new Request("https://thirdi.net/os", {
    headers: { cookie: `thirdi_os_session=${otherToken}` },
  }));
  const body = await response.text();
  assert.match(body, /Open Third i OS/);
  assert.doesNotMatch(body, /EXEC SYSTEM/);
});

test("changing the owner password hash invalidates existing owner sessions", async () => {
  const staleToken = encryptSession({
    tenant: "thirdi-os",
    expiresAt: Date.now() + 60_000,
    credentialVersion: credentialVersion("scrypt$old$hash"),
  }, secret);
  const response = await handler(new Request("https://thirdi.net/os", {
    headers: { cookie: `thirdi_os_session=${staleToken}` },
  }));
  assert.match(await response.text(), /Open Third i OS/);
});
