import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SESSION_VERSION = 1;

function fromBase64Url(value) {
  return Buffer.from(value, "base64url");
}

export async function verifyPassword(password, encodedHash) {
  if (typeof password !== "string" || password.length < 1 || password.length > 128) return false;
  if (typeof encodedHash !== "string") return false;

  const [scheme, saltEncoded, hashEncoded] = encodedHash.split("$");
  if (scheme !== "scrypt" || !saltEncoded || !hashEncoded) return false;

  try {
    const salt = fromBase64Url(saltEncoded);
    const expected = fromBase64Url(hashEncoded);
    if (salt.length < 16 || expected.length !== 64) return false;
    const actual = await scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 });
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createPasswordHash(password, salt = randomBytes(16), options = {}) {
  const minimumLength = options.minimumLength ?? 8;
  if (typeof password !== "string" || password.length < minimumLength || password.length > 128) {
    throw new Error(`Password must be between ${minimumLength} and 128 characters.`);
  }
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

function sessionKey(secret) {
  const key = fromBase64Url(secret || "");
  if (key.length !== 32) throw new Error("PORTAL_SESSION_SECRET must be a base64url-encoded 32-byte key.");
  return key;
}

export function credentialVersion(encodedHash) {
  return createHash("sha256").update(String(encodedHash || ""), "utf8").digest("base64url").slice(0, 22);
}

export function encryptSession({ tenant, expiresAt, credentialVersion: version }, secret) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sessionKey(secret), nonce);
  const payload = Buffer.from(JSON.stringify({ v: SESSION_VERSION, tenant, exp: expiresAt, cv: version }), "utf8");
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [nonce, encrypted, tag].map((part) => part.toString("base64url")).join(".");
}

export function decryptSession(token, secret, now = Date.now()) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const [nonce, encrypted, tag] = parts.map(fromBase64Url);
    if (nonce.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", sessionKey(secret), nonce);
    decipher.setAuthTag(tag);
    const payload = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(payload.toString("utf8"));
    if (parsed.v !== SESSION_VERSION || typeof parsed.tenant !== "string") return null;
    if (!Number.isFinite(parsed.exp) || parsed.exp <= now) return null;
    if (parsed.cv !== undefined && typeof parsed.cv !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readCookie(header, name) {
  if (!header) return null;
  for (const pair of header.split(";")) {
    const index = pair.indexOf("=");
    if (index < 0) continue;
    const key = pair.slice(0, index).trim();
    if (key === name) return pair.slice(index + 1).trim();
  }
  return null;
}

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const requestUrl = new URL(request.url);
    if (origin === "null") return requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
    const supplied = new URL(origin).origin;
    const candidates = new Set([requestUrl.origin]);
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost || request.headers.get("host");
    if (host) {
      const forwardedProtocol = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");
      candidates.add(`${forwardedProtocol}://${host}`);
    }
    return candidates.has(supplied);
  } catch {
    return false;
  }
}
