import { readFile } from "node:fs/promises";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  credentialVersion,
  decryptSession,
  encryptSession,
  isSameOrigin,
  readCookie,
  verifyPassword,
} from "../../lib/portal-auth.mjs";

const TENANT = "bkwatch";
const COOKIE_NAME = "thirdi_bkwatch_session";
const CSRF_COOKIE_NAME = "thirdi_bkwatch_csrf";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const ASSET_RELEASE = "20260722-12";
const manifestDir = fileURLToPath(new URL("../../content/clients/bkwatch/", import.meta.url));
// v2 tenant manifests → the keys the frontend expects (see core/data.js).
const MANIFEST_FILES = { portal: "portal.json", home: "home.json", projects: "projects.json", library: "library.json", aiRoadmap: "ai-roadmap.json", roadmap: "roadmap.json", invoicing: "invoicing.json", communications: "communications.json", search: "search-index.json" };

// The redesigned portal uses inline style attributes (layout helpers) and talks
// directly to R2 for large media, so the shell relaxes style-src to 'unsafe-inline'
// and allows the R2 origin for connect/img/media. Script stays locked to 'self'.
const PORTAL_CSP = "default-src 'self'; base-uri 'none'; connect-src 'self' https://*.r2.cloudflarestorage.com; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https://*.r2.cloudflarestorage.com; media-src 'self' https://*.r2.cloudflarestorage.com; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'";

const securityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy": "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; media-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function html(body, status = 200, extraHeaders = {}) {
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", ...securityHeaders });
  for (const [name, value] of Object.entries(extraHeaders)) {
    if (name.toLowerCase() === "set-cookie" && Array.isArray(value)) {
      value.forEach((cookie) => headers.append("Set-Cookie", cookie));
    } else {
      headers.set(name, value);
    }
  }
  return new Response(body, {
    status,
    headers,
  });
}

function redirect(location, cookie) {
  const headers = { Location: location, ...securityHeaders };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 303, headers });
}

function loginPage(error = false, csrfToken = "") {
  const errorMarkup = error
    ? '<p class="login-error" role="alert">The password was not accepted. Check it and try again.</p>'
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>bkWatch Client Portal</title>
<link rel="icon" href="/public/images/favicon.png"><script src="/public/portal/bkwatch-theme-init.js?v=20260714-11"></script><link rel="stylesheet" href="/public/portal/bkwatch-login.css?v=20260714-11"><link rel="stylesheet" href="/public/portal/bkwatch-login-professional-light-20260714.css?v=20260714-11"><link rel="stylesheet" href="/public/portal/bkwatch-logo-white-frame-20260714.css"><link rel="stylesheet" href="/public/portal/bkwatch-login-dark-mode-20260714.css?v=20260714-11"></head>
<body><main class="login-shell"><section class="login-card" aria-labelledby="login-title">
<img src="/public/portal/bkwatch-logo.png?v=white-frame-20260714" width="432" height="114" alt="BankruptcyWatch">
<p class="eyebrow">Private client workspace</p><h1 id="login-title">Enter your portal password</h1>
<p class="login-copy">This workspace contains client review material. Your secure session renews when you return and expires after 30 days of inactivity or when you log out.</p>
${errorMarkup}<form method="post" action="/bkwatch" class="login-form"><input type="hidden" name="csrf" value="${csrfToken}">
<label for="password">Portal password</label><input id="password" name="password" type="password" autocomplete="current-password" minlength="8" maxlength="128" required autofocus>
<button type="submit">Open workspace <span aria-hidden="true">→</span></button></form>
<p class="privacy-note"><span aria-hidden="true">●</span> Password verification happens on the server. No password is stored in this browser.</p>
</section><p class="partner-note">Workspace prepared by Third i</p></main></body></html>`;
}

/* Read the sanitized v2 manifests (bundled with the function via included_files). */
async function readManifests() {
  const names = Object.keys(MANIFEST_FILES);
  const files = await Promise.all(names.map((n) => readFile(manifestDir + MANIFEST_FILES[n], "utf8")));
  return Object.fromEntries(names.map((n, i) => [n, JSON.parse(files[i])]));
}

/* Escape "<" so embedded JSON cannot break out of the <script> element. */
const embed = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

/* Serve the redesigned portal shell. Manifests are embedded (client-confidential,
   never public static files); config + CSRF are injected as CSP-safe JSON blocks. */
export async function portalShell(csrfToken) {
  const data = await readManifests();
  const v = ASSET_RELEASE;
  const config = { tenant: "bkwatch", routeBase: "/bkwatch", mode: "live", csrfToken };
  const styles = ["portal-tokens.css", "tenants/bkwatch.css", "portal-shell.css", "portal-components.css", "portal-pages.css", "portal-motion.css"]
    .map((s) => `<link rel="stylesheet" href="/public/portal/styles/${s}?v=${v}">`).join("");
  return `<!doctype html>
<html lang="en" data-tenant="bkwatch"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow, noarchive">
<title>bkWatch · Client workspace</title><link rel="icon" href="/public/images/favicon.png">
${styles}<link rel="stylesheet" href="/public/portal/styles/portal-print.css?v=${v}" media="print"></head>
<body>
<script id="portal-config" type="application/json">${embed(config)}</script>
<script id="portal-data" type="application/json">${embed(data)}</script>
<div id="app"></div>
<script type="module" src="/public/portal/core/app.js?v=${v}"></script>
</body></html>`;
}

function cookieFor(token, maxAge = SESSION_SECONDS) {
  return `${COOKIE_NAME}=${token}; Path=/bkwatch; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

function csrfCookie(token) {
  return `${CSRF_COOKIE_NAME}=${token}; Path=/bkwatch; Max-Age=600; HttpOnly; Secure; SameSite=Strict`;
}

function newCsrfToken() {
  return randomBytes(24).toString("base64url");
}

function validCsrf(request, form) {
  const submitted = String(form.get("csrf") || "");
  const cookie = readCookie(request.headers.get("cookie"), CSRF_COOKIE_NAME) || "";
  if (!submitted || submitted.length !== cookie.length) return false;
  return timingSafeEqual(Buffer.from(submitted), Buffer.from(cookie));
}

function validPostOrigin(request) {
  return request.headers.get("origin") === "null" || isSameOrigin(request);
}

function loginResponse(error = false, status = 200) {
  const csrfToken = newCsrfToken();
  return html(loginPage(error, csrfToken), status, { "Set-Cookie": csrfCookie(csrfToken) });
}

export default async function handler(request) {
  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD, POST", ...securityHeaders } });
  }

  const passwordHash = Netlify.env.get("BKWATCH_PORTAL_PASSWORD_HASH");
  const sessionSecret = Netlify.env.get("PORTAL_SESSION_SECRET");
  if (!passwordHash || !sessionSecret) {
    const csrfToken = newCsrfToken();
    return html(loginPage(false, csrfToken).replace("</section>", '<p class="login-error" role="alert">The portal is temporarily unavailable.</p></section>'), 503, { "Set-Cookie": csrfCookie(csrfToken) });
  }

  if (request.method === "POST") {
    const form = await request.formData();
    if (!validPostOrigin(request) || !validCsrf(request, form)) return loginResponse(true, 403);
    if (form.get("action") === "logout") return redirect("/bkwatch", cookieFor("deleted", 0));
    const ok = await verifyPassword(String(form.get("password") || ""), passwordHash);
    if (!ok) return loginResponse(true, 401);
    const token = encryptSession({
      tenant: TENANT,
      expiresAt: Date.now() + SESSION_SECONDS * 1000,
      credentialVersion: credentialVersion(passwordHash),
    }, sessionSecret);
    return redirect("/bkwatch", cookieFor(token));
  }

  const token = readCookie(request.headers.get("cookie"), COOKIE_NAME);
  const session = decryptSession(token, sessionSecret);
  if (!session || session.tenant !== TENANT || session.cv !== credentialVersion(passwordHash)) return loginResponse(false);
  const csrfToken = newCsrfToken();
  const refreshedToken = encryptSession({
    tenant: TENANT,
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
    credentialVersion: credentialVersion(passwordHash),
  }, sessionSecret);
  const portal = await portalShell(csrfToken);
  return html(request.method === "HEAD" ? "" : portal, 200, {
    "Content-Security-Policy": PORTAL_CSP,
    "Set-Cookie": [csrfCookie(csrfToken), cookieFor(refreshedToken)],
  });
}

export const config = {
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
