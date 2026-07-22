import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordHash,
  credentialVersion,
  decryptSession,
  encryptSession,
  isSameOrigin,
  readCookie,
  verifyPassword,
} from "../lib/portal-auth.mjs";

const secret = Buffer.alloc(32, 7).toString("base64url");

test("password hashes are salted and verify without storing plaintext", async () => {
  const first = await createPasswordHash("test-animal-42");
  const second = await createPasswordHash("test-animal-42");
  assert.notEqual(first, second);
  assert.equal(first.includes("test-animal-42"), false);
  assert.equal(await verifyPassword("test-animal-42", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
});

test("short password hashing requires an explicit owner-only exception", async () => {
  await assert.rejects(() => createPasswordHash("short"), /between 8 and 128/);
  const ownerHash = await createPasswordHash("short", Buffer.alloc(16, 9), { minimumLength: 5 });
  assert.equal(await verifyPassword("short", ownerHash), true);
});

test("encrypted sessions are tenant-bound, expire, and reject tampering", () => {
  const now = Date.now();
  const token = encryptSession({
    tenant: "bkwatch",
    expiresAt: now + 10_000,
    credentialVersion: credentialVersion("scrypt$example$hash"),
  }, secret);
  assert.equal(token.includes("bkwatch"), false);
  assert.equal(decryptSession(token, secret, now).tenant, "bkwatch");
  assert.equal(decryptSession(token, secret, now).cv, credentialVersion("scrypt$example$hash"));
  assert.equal(decryptSession(`${token}x`, secret, now), null);
  assert.equal(decryptSession(token, secret, now + 20_000), null);
});

test("cookie parser isolates the requested tenant cookie", () => {
  assert.equal(readCookie("other=one; thirdi_bkwatch_session=token-value; x=two", "thirdi_bkwatch_session"), "token-value");
  assert.equal(readCookie("shaw=private", "thirdi_bkwatch_session"), null);
});

test("POST origin must match the request origin", () => {
  assert.equal(isSameOrigin(new Request("https://thirdi.net/bkwatch", { method: "POST", headers: { origin: "https://thirdi.net" } })), true);
  assert.equal(isSameOrigin(new Request("http://127.0.0.1:3999/.netlify/functions/bkwatch-portal", { method: "POST", headers: { origin: "http://localhost:8888", "x-forwarded-host": "localhost:8888", "x-forwarded-proto": "http" } })), true);
  assert.equal(isSameOrigin(new Request("http://localhost:8888/bkwatch", { method: "POST", headers: { origin: "null" } })), true);
  assert.equal(isSameOrigin(new Request("https://thirdi.net/bkwatch", { method: "POST", headers: { origin: "null" } })), false);
  assert.equal(isSameOrigin(new Request("https://thirdi.net/bkwatch", { method: "POST", headers: { origin: "https://example.com" } })), false);
  assert.equal(isSameOrigin(new Request("https://thirdi.net/bkwatch", { method: "POST" })), false);
});
