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

const TENANT = "thirdi-os";
const COOKIE_NAME = "thirdi_os_session";
const CSRF_COOKIE_NAME = "thirdi_os_csrf";
const OWNER_SESSION_SECONDS = 60 * 60 * 24 * 365;
const osPath = fileURLToPath(new URL("../../os.html", import.meta.url));

const baseSecurityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function responseHtml(body, status = 200, extraHeaders = {}) {
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", ...baseSecurityHeaders });
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
  const headers = { Location: location, ...baseSecurityHeaders };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 303, headers });
}

function loginPage(error = false, unavailable = false, csrfToken = "") {
  const errorMarkup = error
    ? '<p class="login-error" role="alert">The password was not accepted. Check it and try again.</p>'
    : unavailable
      ? '<p class="login-error" role="alert">Owner access is not configured yet.</p>'
      : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>Third i OS</title>
<link rel="icon" href="/public/images/favicon.png"><link rel="stylesheet" href="/public/portal/os-login.css"></head>
<body><main class="login-shell"><section class="login-card" aria-labelledby="login-title">
<img src="/public/images/logo.png" width="180" height="150" alt="Third i">
<p class="eyebrow">Private owner workspace</p><h1 id="login-title">Open Third i OS</h1>
<p class="login-copy">This operating system contains internal client, finance, communication, and project data. Access is restricted to the owner. Your password stays the same until you choose to change it.</p>
${errorMarkup}<form method="post" action="/os" class="login-form"><input type="hidden" name="csrf" value="${csrfToken}">
<label for="password">OS password</label><input id="password" name="password" type="password" autocomplete="current-password" minlength="5" maxlength="128" required autofocus>
<button type="submit">Open OS <span aria-hidden="true">→</span></button></form>
<p class="privacy-note"><span aria-hidden="true">●</span> Password verification is server-side. The browser receives only an encrypted HttpOnly session cookie.</p>
</section></main></body></html>`;
}

async function osPage(csrfToken) {
  const source = await readFile(osPath, "utf8");
  const nonce = randomBytes(18).toString("base64url");
  const logout = `<form method="post" action="/os" class="os-owner-logout"><input type="hidden" name="csrf" value="${csrfToken}"><input type="hidden" name="action" value="logout"><button type="submit">Log out</button></form>`;

  // Client-portal activity widget: surfaces open client comments/requests from
  // the live operational store and lets the owner mark them complete (which flips
  // the client's comment to Completed). Same-origin fetch + nonce'd inline script
  // satisfy the OS CSP. csrf token matches the thirdi_os_csrf cookie set below.
  const widget = `<div id="tp-widget"><button id="tp-toggle" type="button">Client portal <span id="tp-badge">0</span></button><div id="tp-panel"><div class="tp-head">Client portal activity</div><div id="tp-list"><p class="tp-empty">Loading…</p></div></div></div>`;
  const widgetScript = `<script nonce="${nonce}">(function(){var token=${JSON.stringify(csrfToken)};var list,badge;function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function load(){fetch("/os/api/portal-events",{credentials:"same-origin",headers:{accept:"application/json"}}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(!d){list.innerHTML='<p class="tp-empty">Could not load.</p>';return;}var items=[];Object.keys(d.tenants||{}).forEach(function(t){(d.tenants[t].actions||[]).forEach(function(a){if(a.status==="open"){a._t=t;items.push(a);}});});badge.textContent=items.length;badge.style.display=items.length?"inline-block":"none";if(!items.length){list.innerHTML='<p class="tp-empty">No open client items.</p>';return;}list.innerHTML=items.map(function(a){var k=a.type==="blocker"?"Blocker":a.type==="project-request"?"Project request":a.type==="library-correction"?"Library":"Comment";var when=a.createdAt?new Date(a.createdAt).toLocaleString():"";var btn=a.executable?'<button class="tp-done" data-id="'+esc(a.id)+'" data-t="'+esc(a._t)+'">Mark complete</button>':'<span class="tp-note">Create a new project to resolve</span>';return '<div class="tp-item"><div class="tp-kind '+(a.type==="blocker"?"blk":"")+'">'+esc(k)+" · "+esc(a._t)+'</div><div class="tp-title">'+esc(a.title)+'</div><div class="tp-meta">'+esc(a.projectId)+" · "+esc(a.context)+" · "+esc(when)+"</div>"+btn+"</div>";}).join("");}).catch(function(){list.innerHTML='<p class="tp-empty">Could not load.</p>';});}
document.addEventListener("DOMContentLoaded",function(){list=document.getElementById("tp-list");badge=document.getElementById("tp-badge");document.getElementById("tp-toggle").addEventListener("click",function(){document.getElementById("tp-panel").classList.toggle("open");});list.addEventListener("click",function(e){var b=e.target.closest(".tp-done");if(!b)return;b.disabled=true;b.textContent="Completing…";fetch("/os/api/actions/"+encodeURIComponent(b.getAttribute("data-id")),{method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json","x-csrf-token":token},body:JSON.stringify({tenant:b.getAttribute("data-t"),op:"complete"})}).then(function(r){if(r.ok){load();}else{b.disabled=false;b.textContent=r.status===403?"Reload page":"Retry";}}).catch(function(){b.disabled=false;b.textContent="Retry";});});load();setInterval(load,60000);});})();</script>`;

  const css = `<style nonce="${nonce}">.os-owner-logout{position:fixed;z-index:99998;right:18px;bottom:18px;margin:0}.os-owner-logout button{border:1px solid rgba(255,255,255,.2);border-radius:999px;background:#1a1a1a;color:#fff;padding:9px 14px;font:600 12px/1 Inter,sans-serif;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.25)}.os-owner-logout button:hover{border-color:#fff}
#tp-widget{position:fixed;z-index:99998;left:18px;bottom:18px;font:500 13px/1.4 Inter,sans-serif}
#tp-toggle{border:1px solid rgba(255,255,255,.2);border-radius:999px;background:#1a1a1a;color:#fff;padding:9px 14px;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.25)}
#tp-toggle:hover{border-color:#fff}
#tp-badge{display:none;margin-left:6px;background:#2b66ae;color:#fff;border-radius:999px;padding:1px 7px;font-size:11px;font-weight:700}
#tp-panel{display:none;margin-top:10px;width:340px;max-height:62vh;overflow:auto;background:#101418;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:12px 14px;box-shadow:0 20px 60px rgba(0,0,0,.45)}
#tp-panel.open{display:block}
.tp-head{color:#fff;font-weight:700;margin-bottom:6px}
.tp-item{border-top:1px solid rgba(255,255,255,.1);padding:10px 0}
.tp-item:first-of-type{border-top:0}
.tp-kind{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#79c4f5}
.tp-kind.blk{color:#ff9a8b}
.tp-title{color:#fff;font-weight:600;margin:3px 0}
.tp-meta{color:#9fb0bd;font-size:11px;margin-bottom:8px}
.tp-done{background:#2b66ae;color:#fff;border:0;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:600}
.tp-done:hover{background:#214f88}.tp-done:disabled{opacity:.6;cursor:default}
.tp-note{color:#9fb0bd;font-size:11px}.tp-empty{color:#9fb0bd;margin:6px 0}</style>`;

  const html = source
    .replace(/<div id="passGate"[\s\S]*?<\/script>/, "")
    .replaceAll("<script>", `<script nonce="${nonce}">`)
    .replace("</head>", `${css}</head>`)
    .replace("<body>", `<body>${logout}${widget}`)
    .replace("</body>", `${widgetScript}</body>`);
  const csp = `default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self' https://fonts.gstatic.com; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; media-src 'self'; object-src 'none'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`;
  return { html, csp };
}

function cookieFor(token, maxAge = OWNER_SESSION_SECONDS) {
  return `${COOKIE_NAME}=${token}; Path=/os; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

function csrfCookie(token) {
  // 1 hour: the owner dashboard stays open; the double-submit token must remain
  // valid long enough for the "Mark complete" action in the client-portal widget.
  return `${CSRF_COOKIE_NAME}=${token}; Path=/os; Max-Age=3600; HttpOnly; Secure; SameSite=Strict`;
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

function loginResponse(error = false, status = 200, unavailable = false) {
  const csrfToken = newCsrfToken();
  const csp = "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self'; media-src 'self'; object-src 'none'; script-src 'none'; style-src 'self'";
  return responseHtml(loginPage(error, unavailable, csrfToken), status, {
    "Content-Security-Policy": csp,
    "Set-Cookie": csrfCookie(csrfToken),
  });
}

export default async function handler(request) {
  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD, POST", ...baseSecurityHeaders } });
  }

  const passwordHash = Netlify.env.get("OS_PORTAL_PASSWORD_HASH");
  const sessionSecret = Netlify.env.get("PORTAL_SESSION_SECRET");
  if (!passwordHash || !sessionSecret) return loginResponse(false, 503, true);

  if (request.method === "POST") {
    const form = await request.formData();
    if (!validPostOrigin(request) || !validCsrf(request, form)) return loginResponse(true, 403);
    if (form.get("action") === "logout") return redirect("/os", cookieFor("deleted", 0));
    const ok = await verifyPassword(String(form.get("password") || ""), passwordHash);
    if (!ok) return loginResponse(true, 401);
    const token = encryptSession({
      tenant: TENANT,
      expiresAt: Date.now() + OWNER_SESSION_SECONDS * 1000,
      credentialVersion: credentialVersion(passwordHash),
    }, sessionSecret);
    return redirect("/os", cookieFor(token));
  }

  const token = readCookie(request.headers.get("cookie"), COOKIE_NAME);
  const session = decryptSession(token, sessionSecret);
  if (!session || session.tenant !== TENANT || session.cv !== credentialVersion(passwordHash)) return loginResponse(false);
  const csrfToken = newCsrfToken();
  const refreshedToken = encryptSession({
    tenant: TENANT,
    expiresAt: Date.now() + OWNER_SESSION_SECONDS * 1000,
    credentialVersion: credentialVersion(passwordHash),
  }, sessionSecret);
  const portal = await osPage(csrfToken);
  return responseHtml(request.method === "HEAD" ? "" : portal.html, 200, {
    "Content-Security-Policy": portal.csp,
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
