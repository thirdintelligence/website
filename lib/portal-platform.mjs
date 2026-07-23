/**
 * Shared authenticated client-portal renderer and session handler.
 *
 * Tenant functions are intentionally thin wrappers around this module. Tenant
 * configuration controls content, presentation metadata, auth cookies, and
 * namespaces; HTML is never copied into a permanent tenant fork.
 */
import { access, readFile } from "node:fs/promises";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import {
  credentialVersion,
  decryptSession,
  encryptSession,
  isSameOrigin,
  readCookie,
  verifyPassword,
} from "./portal-auth.mjs";
import { getPortalTenant, isActivePortalTenant } from "../config/portal-tenants.mjs";

export const SESSION_SECONDS = 60 * 60 * 24 * 30;

// v2 tenant manifests → the keys expected by public/portal/core/data.js.
export const MANIFEST_FILES = Object.freeze({
  portal: "portal.json",
  home: "home.json",
  projects: "projects.json",
  library: "library.json",
  aiRoadmap: "ai-roadmap.json",
  roadmap: "roadmap.json",
  invoicing: "invoicing.json",
  communications: "communications.json",
  search: "search-index.json"
});

// Large media are browser↔R2 transfers. The shell only allows R2 origins for
// fetch/image/media and keeps scripts locked to same-origin files.
export const PORTAL_CSP = "default-src 'self'; base-uri 'none'; connect-src 'self' https://*.r2.cloudflarestorage.com; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https://*.r2.cloudflarestorage.com; media-src 'self' https://*.r2.cloudflarestorage.com; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'";

export const PORTAL_SECURITY_HEADERS = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy": "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; media-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
});

const embed = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

async function firstExistingDir(candidates) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Netlify bundles this module from a different import.meta.dirname.
    }
  }
  return candidates[0];
}

async function readManifests(tenant) {
  const dir = await firstExistingDir([
    resolve(import.meta.dirname, "..", tenant.contentDir),
    resolve(process.cwd(), tenant.contentDir)
  ]);
  const names = Object.keys(MANIFEST_FILES);
  const files = await Promise.all(
    names.map((name) => readFile(resolve(dir, MANIFEST_FILES[name]), "utf8"))
  );
  return Object.fromEntries(names.map((name, index) => [name, JSON.parse(files[index])]));
}

function html(body, status = 200, extraHeaders = {}) {
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", ...PORTAL_SECURITY_HEADERS });
  for (const [name, value] of Object.entries(extraHeaders)) {
    if (name.toLowerCase() === "set-cookie" && Array.isArray(value)) {
      value.forEach((cookie) => headers.append("Set-Cookie", cookie));
    } else {
      headers.set(name, value);
    }
  }
  return new Response(body, { status, headers });
}

function redirect(location, cookie) {
  const headers = { Location: location, ...PORTAL_SECURITY_HEADERS };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 303, headers });
}

function requireRuntimeTenant(tenantKey, { allowPlanned = false } = {}) {
  const tenant = getPortalTenant(tenantKey);
  if (!tenant) throw new Error(`Unknown portal tenant: ${tenantKey}`);
  if (!allowPlanned && !isActivePortalTenant(tenantKey)) {
    throw new Error(`Portal tenant is not active: ${tenantKey}`);
  }
  if (!tenant.shell) throw new Error(`Portal tenant has no approved shell configuration: ${tenantKey}`);
  return tenant;
}

export function createPortalPlatform(tenantKey, options = {}) {
  const tenant = requireRuntimeTenant(tenantKey, options);
  const shell = tenant.shell;
  const assetRelease = options.assetRelease || shell.assetRelease;

  function loginPage(error = false, csrfToken = "") {
    const errorMarkup = error
      ? '<p class="login-error" role="alert">The password was not accepted. Check it and try again.</p>'
      : "";
    const loginStyles = shell.loginStyles
      .map((href) => `<link rel="stylesheet" href="${href}">`)
      .join("");
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>${shell.loginTitle}</title>
<link rel="icon" href="${shell.favicon}"><script src="${shell.themeInit}"></script>${loginStyles}</head>
<body><main class="login-shell"><section class="login-card" aria-labelledby="login-title">
<img src="${shell.logo}" width="${shell.logoWidth}" height="${shell.logoHeight}" alt="${shell.logoAlt}">
<p class="eyebrow">Private client workspace</p><h1 id="login-title">Enter your portal password</h1>
<p class="login-copy">This workspace contains client review material. Your secure session renews when you return and expires after 30 days of inactivity or when you log out.</p>
${errorMarkup}<form method="post" action="${tenant.route}" class="login-form"><input type="hidden" name="csrf" value="${csrfToken}">
<label for="password">Portal password</label><input id="password" name="password" type="password" autocomplete="current-password" minlength="8" maxlength="128" required autofocus>
<button type="submit">Open workspace <span aria-hidden="true">→</span></button></form>
<p class="privacy-note"><span aria-hidden="true">●</span> Password verification happens on the server. No password is stored in this browser.</p>
</section><p class="partner-note">Workspace prepared by Third i</p></main></body></html>`;
  }

  async function portalShell(csrfToken) {
    const data = await readManifests(tenant);
    const config = { tenant: tenant.key, routeBase: tenant.route, mode: "live", csrfToken };
    const styles = shell.styles
      .map((style) => `<link rel="stylesheet" href="/public/portal/styles/${style}?v=${assetRelease}">`)
      .join("");
    return `<!doctype html>
<html lang="en" data-tenant="${tenant.key}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow, noarchive">
<title>${shell.documentTitle}</title><link rel="icon" href="${shell.favicon}">
${styles}<link rel="stylesheet" href="/public/portal/styles/portal-print.css?v=${assetRelease}" media="print"></head>
<body>
<script id="portal-config" type="application/json">${embed(config)}</script>
<script id="portal-data" type="application/json">${embed(data)}</script>
<div id="app"></div>
<script type="module" src="/public/portal/core/app.js?v=${assetRelease}"></script>
</body></html>`;
  }

  function cookieFor(token, maxAge = SESSION_SECONDS) {
    return `${tenant.sessionCookie}=${token}; Path=${tenant.cookiePath}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
  }

  function csrfCookie(token) {
    return `${tenant.csrfCookie}=${token}; Path=${tenant.cookiePath}; Max-Age=600; HttpOnly; Secure; SameSite=Strict`;
  }

  function newCsrfToken() {
    return randomBytes(24).toString("base64url");
  }

  function validCsrf(request, form) {
    const submitted = String(form.get("csrf") || "");
    const cookie = readCookie(request.headers.get("cookie"), tenant.csrfCookie) || "";
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

  async function handler(request) {
    if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD, POST", ...PORTAL_SECURITY_HEADERS }
      });
    }

    const passwordHash = Netlify.env.get(tenant.passwordHashEnv);
    const sessionSecret = Netlify.env.get("PORTAL_SESSION_SECRET");
    if (!passwordHash || !sessionSecret) {
      const csrfToken = newCsrfToken();
      return html(
        loginPage(false, csrfToken).replace(
          "</section>",
          '<p class="login-error" role="alert">The portal is temporarily unavailable.</p></section>'
        ),
        503,
        { "Set-Cookie": csrfCookie(csrfToken) }
      );
    }

    if (request.method === "POST") {
      const form = await request.formData();
      if (!validPostOrigin(request) || !validCsrf(request, form)) return loginResponse(true, 403);
      if (form.get("action") === "logout") return redirect(tenant.route, cookieFor("deleted", 0));
      const ok = await verifyPassword(String(form.get("password") || ""), passwordHash);
      if (!ok) return loginResponse(true, 401);
      const token = encryptSession({
        tenant: tenant.key,
        expiresAt: Date.now() + SESSION_SECONDS * 1000,
        credentialVersion: credentialVersion(passwordHash),
      }, sessionSecret);
      return redirect(tenant.route, cookieFor(token));
    }

    const token = readCookie(request.headers.get("cookie"), tenant.sessionCookie);
    const session = decryptSession(token, sessionSecret);
    if (!session || session.tenant !== tenant.key || session.cv !== credentialVersion(passwordHash)) {
      return loginResponse(false);
    }
    const csrfToken = newCsrfToken();
    const refreshedToken = encryptSession({
      tenant: tenant.key,
      expiresAt: Date.now() + SESSION_SECONDS * 1000,
      credentialVersion: credentialVersion(passwordHash),
    }, sessionSecret);
    const portal = await portalShell(csrfToken);
    return html(request.method === "HEAD" ? "" : portal, 200, {
      "Content-Security-Policy": PORTAL_CSP,
      "Set-Cookie": [csrfCookie(csrfToken), cookieFor(refreshedToken)],
    });
  }

  return Object.freeze({
    tenant,
    loginPage,
    portalShell,
    handler
  });
}

export const portalFunctionConfig = Object.freeze({
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
});
