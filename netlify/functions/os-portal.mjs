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

  // Client-portal DASHBOARD section (owner cockpit): an honest live-connection
  // strip plus the prioritized client action queue with directly-executable
  // owner controls — Complete, Reopen, and Reprioritize. Injected at the top of
  // the OS so it survives the 5-minute os.html auto-sync; same-origin fetch +
  // nonce'd inline script satisfy the OS CSP. csrf matches the cookie set below.
  const dash = `<section id="tp-dash" aria-label="Client portal action queue">
    <div class="tp-bar">
      <div class="tp-lead"><span class="tp-eyebrow">Client portal</span><span class="tp-h2">Open comments</span></div>
      <div class="tp-strip"><span class="tp-chip on">Sheets</span><span class="tp-chip on">Gmail</span><span class="tp-chip on">Calendar</span><span class="tp-chip pending" id="tp-portals">Portals · checking</span></div>
    </div>
    <div id="tp-list" class="tp-list"><p class="tp-empty">Loading client activity…</p></div>
  </section>`;

  const script = `<script nonce="${nonce}">(function(){var token=${JSON.stringify(csrfToken)};var listEl;
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function kindLabel(t){return t==="blocker"?"Blocker":t==="project-request"?"Project request":t==="library-correction"?"Library":"Comment";}
function row(a,sorted){var when=a.createdAt?new Date(a.createdAt).toLocaleString():"";var ctrls="";
 if(a.status==="archived"){ctrls='<button class="tp-btn ghost" data-op="unarchive" data-id="'+esc(a.id)+'" data-t="'+esc(a._t)+'">Unarchive</button>';}
 else if(a.status==="completed"){ctrls='<button class="tp-btn ghost" data-op="reopen" data-id="'+esc(a.id)+'" data-t="'+esc(a._t)+'">Reopen</button><button class="tp-btn ghost" data-op="archive" data-id="'+esc(a.id)+'" data-t="'+esc(a._t)+'">Archive</button>';}
 else{var done=a.executable?'<button class="tp-btn" data-op="complete" data-id="'+esc(a.id)+'" data-t="'+esc(a._t)+'">Complete</button>':'<span class="tp-note">Create a new project to resolve</span>';
  var idx=sorted.indexOf(a);var upId=idx>0?sorted[idx-1].id:"";var dnId=idx<sorted.length-1?sorted[idx+1].id:"";
  ctrls=done+'<span class="tp-prio"><button class="tp-btn icon" title="Higher priority" data-op="up" data-id="'+esc(a.id)+'" data-t="'+esc(a._t)+'" data-swap="'+esc(upId)+'"'+(upId?'':' disabled')+'>\u25B2</button><button class="tp-btn icon" title="Lower priority" data-op="down" data-id="'+esc(a.id)+'" data-t="'+esc(a._t)+'" data-swap="'+esc(dnId)+'"'+(dnId?'':' disabled')+'>\u25BC</button></span><button class="tp-btn ghost" data-op="archive" data-id="'+esc(a.id)+'" data-t="'+esc(a._t)+'">Archive</button>';}
 return '<div class="tp-item'+(a.status==="completed"?" done":"")+(a.status==="archived"?" arch":"")+'"><div class="tp-kind '+(a.type==="blocker"?"blk":"")+'">'+esc(kindLabel(a.type))+" · "+esc(a._t)+(a.status==="completed"?" · completed":a.status==="archived"?" · archived":"")+'</div><div class="tp-title">'+esc(a.title)+'</div>'+(a.detail?'<div class="tp-detail">'+esc(a.detail)+'</div>':'')+'<div class="tp-meta">'+esc(a.projectId||"general")+" · "+esc(a.context||"")+" · "+esc(when)+'</div><div class="tp-ctrls">'+ctrls+'</div></div>';}
function load(){fetch("/os/api/portal-events",{credentials:"same-origin",headers:{accept:"application/json"}}).then(function(r){return r.ok?r.json():null;}).then(function(d){var p=document.getElementById("tp-portals");
 if(!d){listEl.innerHTML='<p class="tp-empty">Could not load client activity.</p>';if(p){p.textContent="Portals · error";p.className="tp-chip err";}return;}
 var all=[],failed=0;Object.keys(d.tenants||{}).forEach(function(t){(d.tenants[t].actions||[]).forEach(function(a){if(a.status!=="hidden"){a._t=t;all.push(a);}});failed+=((d.tenants[t].notifications||[]).filter(function(n){return n.status==="failed";})).length;});
 var open=all.filter(function(a){return a.status!=="completed"&&a.status!=="archived";});open.sort(function(a,b){return (a.priority||0)-(b.priority||0)||String(b.createdAt).localeCompare(String(a.createdAt));});
 var done=all.filter(function(a){return a.status==="completed";}).slice(0,5);
 var arch=all.filter(function(a){return a.status==="archived";}).sort(function(a,b){return String(b.createdAt).localeCompare(String(a.createdAt));});
 var okp=d.connection&&d.connection.portals==="ok"&&failed===0;if(p){p.textContent="Portals · "+(okp?"healthy":"attention")+" ("+open.length+" open)";p.className="tp-chip "+(okp?"on":"warn");}
 var html="";if(!open.length){html+='<p class="tp-empty">No open client items. You are all caught up.</p>';}else{html+=open.map(function(a){return row(a,open);}).join("");}
 if(done.length){html+='<div class="tp-divider">Recently completed</div>'+done.map(function(a){return row(a,done);}).join("");}
 if(arch.length){html+='<div class="tp-divider">Archived ('+arch.length+')</div>'+arch.map(function(a){return row(a,arch);}).join("");}
 listEl.innerHTML=html;}).catch(function(){listEl.innerHTML='<p class="tp-empty">Could not load client activity.</p>';});}
function send(b,body){b.disabled=true;var prev=b.textContent;b.textContent="…";fetch("/os/api/actions/"+encodeURIComponent(b.getAttribute("data-id")),{method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json","x-csrf-token":token},body:JSON.stringify(body)}).then(function(r){if(r.ok){load();}else{b.disabled=false;b.textContent=r.status===403?"Reload":prev;}}).catch(function(){b.disabled=false;b.textContent=prev;});}
document.addEventListener("DOMContentLoaded",function(){listEl=document.getElementById("tp-list");
 listEl.addEventListener("click",function(e){var b=e.target.closest("[data-op]");if(!b||b.disabled)return;var op=b.getAttribute("data-op"),t=b.getAttribute("data-t");
  if(op==="complete")send(b,{tenant:t,op:"complete"});else if(op==="reopen")send(b,{tenant:t,op:"reopen"});
  else if(op==="archive")send(b,{tenant:t,op:"archive"});else if(op==="unarchive")send(b,{tenant:t,op:"unarchive"});
  else if(op==="up")send(b,{tenant:t,op:"swap",swapId:b.getAttribute("data-swap")});else if(op==="down")send(b,{tenant:t,op:"swap",swapId:b.getAttribute("data-swap")});});
 load();setInterval(load,60000);buildPages();});
var PAGE_OF={"Action Items":"home","Automations":"home","Live Email Feed":"home","Upcoming Meetings":"home","Add New Client":"home","Agent Command Center":"agent","Business Health":"departments","Client Portfolio":"departments","Q3 2026 OKRs":"departments","Departments":"departments","Active Priorities":"departments","Source of Truth":"departments","Archived":"archives"};
var PAGES=[["home","Home"],["departments","Departments"],["agent","Agent Command Center"],["archives","Archives"]];
function setPage(p){try{localStorage.setItem("os.page",p);}catch(e){}var os=document.querySelector(".os");if(!os)return;Array.prototype.forEach.call(os.querySelectorAll("[data-ospage]"),function(n){n.style.display=(n.getAttribute("data-ospage")==="all"||n.getAttribute("data-ospage")===p)?"":"none";});var d=document.getElementById("tp-dash");if(d)d.style.display=(p==="home")?"":"none";Array.prototype.forEach.call(document.querySelectorAll(".os-nav-btn"),function(b){b.classList.toggle("active",b.getAttribute("data-page")===p);});window.scrollTo(0,0);}
function buildPages(){var os=document.querySelector(".os");if(!os||os.__paged)return;os.__paged=1;var assign="home";Array.prototype.slice.call(os.children).forEach(function(node){if(node.tagName==="HEADER"){node.setAttribute("data-ospage","all");return;}if(node.matches&&node.matches("h2.section-label")){assign=PAGE_OF[(node.textContent||"").trim()]||"home";}node.setAttribute("data-ospage",assign);});var dash=document.getElementById("tp-dash");var aH2=Array.prototype.filter.call(os.querySelectorAll("h2.section-label"),function(h){return (h.textContent||"").trim()==="Action Items";})[0];if(dash){dash.setAttribute("data-ospage","home");if(aH2)os.insertBefore(dash,aH2);}var nav=document.createElement("nav");nav.id="os-nav";nav.setAttribute("data-ospage","all");nav.innerHTML=PAGES.map(function(p){return '<button class="os-nav-btn" type="button" data-page="'+p[0]+'">'+p[1]+'</button>';}).join("");var header=os.querySelector("header.header");if(header){header.insertAdjacentElement("afterend",nav);}else{os.insertBefore(nav,os.firstChild);}nav.addEventListener("click",function(e){var b=e.target.closest(".os-nav-btn");if(b)setPage(b.getAttribute("data-page"));});var saved="home";try{saved=localStorage.getItem("os.page")||"home";}catch(e){}if(!PAGES.some(function(p){return p[0]===saved;}))saved="home";setPage(saved);}
})();</script>`;

  const css = `<style nonce="${nonce}">.os-owner-logout{position:fixed;z-index:99998;right:18px;bottom:18px;margin:0}.os-owner-logout button{border:1px solid rgba(255,255,255,.2);border-radius:999px;background:#1a1a1a;color:#fff;padding:9px 14px;font:600 12px/1 Inter,sans-serif;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.25)}.os-owner-logout button:hover{border-color:#fff}
#tp-dash{max-width:1180px;margin:16px auto 0;padding:18px 22px;background:#0d1218;border:1px solid rgba(121,196,245,.18);border-radius:16px;font-family:Inter,ui-sans-serif,-apple-system,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.tp-bar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:14px}
.tp-eyebrow{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#79c4f5;font-weight:700}
.tp-h2{font-size:1.25rem;font-weight:700;color:#fff}
.tp-strip{display:flex;gap:8px;flex-wrap:wrap}
.tp-chip{font-size:11px;font-weight:600;color:#c7d3dc;background:#141b23;border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:4px 11px}
.tp-chip.on{color:#8fe0b4;border-color:rgba(87,201,138,.4)}
.tp-chip.on::before,.tp-chip.warn::before,.tp-chip.err::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:middle;background:#57c98a}
.tp-chip.warn{color:#ffd08a;border-color:rgba(255,183,77,.4)}.tp-chip.warn::before{background:#ffb74d}
.tp-chip.err{color:#ff9a8b;border-color:rgba(229,107,99,.4)}.tp-chip.err::before{background:#e56b63}
.tp-chip.pending{color:#9fb0bd}
.tp-list{display:grid;gap:10px}
.tp-item{background:#111820;border:1px solid rgba(255,255,255,.08);border-left:3px solid #2b66ae;border-radius:12px;padding:12px 14px}
.tp-item.done{opacity:.66;border-left-color:#57c98a}
.tp-item.arch{opacity:.5;border-left-color:#6b7785}
.tp-kind{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#79c4f5}
.tp-kind.blk{color:#ff9a8b}
.tp-title{color:#fff;font-weight:600;margin:3px 0}
.tp-detail{color:#c7d3dc;font-size:13px;line-height:1.5;margin-bottom:4px}
.tp-meta{color:#8397a5;font-size:11px;margin-bottom:10px}
.tp-ctrls{display:flex;align-items:center;gap:8px}
.tp-btn{background:#79c4f5;color:#000;border:0;border-radius:8px;padding:6px 13px;cursor:pointer;font-weight:600;font-size:12px}
.tp-btn:hover{background:#0e141c;color:#fff}.tp-btn:disabled{opacity:.6;cursor:default}
.tp-btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.22);color:#c7d3dc}.tp-btn.ghost:hover{border-color:#fff;background:transparent}
.tp-btn.icon{padding:5px 9px;background:#1a232c}.tp-btn.icon:hover{background:#243140}
.tp-prio{display:inline-flex;gap:4px;margin-left:auto}
.tp-note{color:#9fb0bd;font-size:12px}
.tp-divider{color:#8397a5;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin:8px 2px 2px;font-weight:700}
.tp-empty{color:#9fb0bd;margin:6px 0}
#os-nav{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 22px;padding:0}
.os-nav-btn{background:#141b23;color:#c7d3dc;border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:9px 17px;cursor:pointer;font:600 13px/1 Inter,ui-sans-serif,sans-serif}
.os-nav-btn:hover{border-color:rgba(121,196,245,.5);color:#fff}
.os-nav-btn.active{background:#79c4f5;border-color:#79c4f5;color:#000}.os-nav-btn.active:hover{background:#0e141c;border-color:#79c4f5;color:#fff}</style>`;

  const html = source
    .replace(/<div id="passGate"[\s\S]*?<\/script>/, "")
    .replaceAll("<script>", `<script nonce="${nonce}">`)
    .replace("</head>", `${css}</head>`)
    .replace("<body>", `<body>${logout}${dash}`)
    .replace("</body>", `${script}</body>`);
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
