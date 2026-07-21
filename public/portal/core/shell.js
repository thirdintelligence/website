/* App shell: collapsible flat sidebar (4 links, no nested items), meaningful top
   utility bar (context · Add Comment · search · theme), footer session/logout. */
import { icon } from "./icons.js";
import { themeToggleButton } from "./theme.js";

const SIDEBAR_KEY = "thirdi-portal-sidebar";
const NAV = [
  { name: "home", label: "Home", icon: "home", path: "/" },
  { name: "projects", label: "Projects", icon: "projects", path: "/projects" },
  { name: "valueResults", label: "Value & Results", icon: "chart", path: "/value-results" },
  { name: "aiRoadmap", label: "AI Roadmap", icon: "ai", path: "/ai-roadmap" },
  { name: "library", label: "Library", icon: "library", path: "/library" }
];
/* Route-name → active nav-name mapping (detail routes light up their parent). */
const ACTIVE = { home: "home", projects: "projects", project: "projects", idea: "projects", library: "library", libraryCategory: "library", libraryComms: "library", libraryRecord: "library", aiRoadmap: "aiRoadmap", valueResults: "valueResults" };

export function renderShell(root, data) {
  const { portal } = data;
  const collapsed = localStorage.getItem(SIDEBAR_KEY) === "collapsed";
  const c = portal.client;
  const foot = portal.footer || {};

  root.innerHTML = `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="portal-app" data-tenant="${portal.tenant}" data-sidebar="${collapsed ? "collapsed" : "expanded"}">
    <aside class="portal-sidebar" aria-label="Portal navigation">
      <div class="sidebar-brand">
        <img class="brand-logo brand-logo-light" src="${portal.client.logo || "/public/portal/bkwatch-logo.png"}" alt="${c.name} logo" />
        ${portal.client.logoDark ? `<img class="brand-logo brand-logo-dark" src="${portal.client.logoDark}" alt="${c.name} logo" />` : ""}
        <span class="brand-text"><span class="brand-name">${c.shortName}</span><span class="brand-sub">Client workspace</span></span>
      </div>
      <nav class="sidebar-nav" aria-label="Primary">
        ${NAV.map((n) => `<a class="nav-item" href="#${n.path}" data-nav="${n.name}" title="${n.label}">${icon(n.icon)}<span class="nav-label">${n.label}</span></a>`).join("")}
      </nav>
      <div class="sidebar-spacer"></div>
      <button class="sidebar-collapse" id="sidebar-collapse" type="button" aria-label="Collapse sidebar">${icon("chevronLeft")}<span>Collapse</span></button>
      <div class="sidebar-foot">
        <button class="btn logout-btn" id="logout-btn" type="button">${icon("logout")}<span>Log out</span></button>
        <div class="session-indicator"><span class="session-dot"></span><span>${c.shortName} session · secure</span></div>
        <div class="powered-by"><img src="${foot.poweredByFavicon || "/public/images/favicon.png"}" alt="Third i" /><span>${foot.poweredBy || "Powered by Third i"}</span></div>
      </div>
    </aside>

    <div class="portal-main">
      <header class="topbar">
        <button class="btn btn-icon btn-ghost menu-trigger" id="menu-trigger" type="button" aria-label="Open navigation">${icon("menu")}</button>
        <div class="topbar-context">
          <span class="topbar-crumb" id="topbar-crumb"></span>
          <span class="topbar-title" id="topbar-title"></span>
        </div>
        <div class="topbar-utilities">
          <span class="topbar-action" id="topbar-action"></span>
          <button class="btn btn-primary" id="add-comment-btn" type="button">${icon("comment")}<span>Add Comment</span></button>
          <button class="btn btn-icon btn-ghost mobile-search-trigger" id="mobile-search-trigger" type="button" aria-label="Search">${icon("search")}</button>
          <div class="search-utility">
            ${icon("search")}
            <input class="search-input" id="global-search" type="search" placeholder="Search ${c.shortName}…" aria-label="Search this workspace" autocomplete="off" />
          </div>
          ${themeToggleButton()}
        </div>
      </header>
      <div class="search-sheet" id="search-sheet" data-open="false">
        <div class="search-sheet-bar">
          ${icon("search")}
          <input id="global-search-mobile" type="search" placeholder="Search ${c.shortName}…" aria-label="Search this workspace" autocomplete="off" />
          <button class="btn btn-sm btn-ghost" id="search-sheet-close" type="button">Cancel</button>
        </div>
        <div class="search-sheet-results" id="search-sheet-results"></div>
      </div>
      <main class="portal-content" id="main" tabindex="-1"></main>
    </div>
  </div>
  <div class="scrim" id="scrim"></div>
  <div class="draft-dock" id="draft-dock"></div>`;

  wireShell();
  return {
    app: root.querySelector(".portal-app"),
    content: root.querySelector("#main")
  };
}

function wireShell() {
  const app = document.querySelector(".portal-app");

  const collapse = document.getElementById("sidebar-collapse");
  collapse?.addEventListener("click", () => {
    const next = app.dataset.sidebar === "collapsed" ? "expanded" : "collapsed";
    app.dataset.sidebar = next;
    try { localStorage.setItem(SIDEBAR_KEY, next); } catch { /* ignore */ }
    collapse.setAttribute("aria-label", next === "collapsed" ? "Expand sidebar" : "Collapse sidebar");
  });

  const menu = document.getElementById("menu-trigger");
  const scrim = document.getElementById("scrim");
  menu?.addEventListener("click", () => { app.dataset.drawer = "open"; scrim.classList.add("open"); });
  scrim?.addEventListener("click", () => { app.dataset.drawer = "closed"; scrim.classList.remove("open"); });

  const logout = document.getElementById("logout-btn");
  logout?.addEventListener("click", () => {
    const cfg = data.cfg || {};
    if (cfg.mode === "live") {
      // Real server-side logout: POST clears the HttpOnly session cookie.
      const form = document.createElement("form");
      form.method = "post";
      form.action = cfg.routeBase || "/bkwatch";
      form.innerHTML = `<input type="hidden" name="action" value="logout"><input type="hidden" name="csrf" value="${cfg.csrfToken || ""}">`;
      document.body.appendChild(form);
      form.submit();
      return;
    }
    // Preview: logout is server-side in production. Show a non-blocking note.
    logout.innerHTML = `${icon("check")}<span>Server-side in production</span>`;
    setTimeout(() => (logout.innerHTML = `${icon("logout")}<span>Log out</span>`), 1800);
  });

  // Close the mobile drawer whenever a nav link is used.
  document.querySelector(".sidebar-nav")?.addEventListener("click", (e) => {
    if (e.target.closest(".nav-item")) { app.dataset.drawer = "closed"; document.getElementById("scrim")?.classList.remove("open"); }
  });
}

export function setActiveNav(routeName) {
  const active = ACTIVE[routeName];
  document.querySelectorAll(".nav-item").forEach((el) => {
    if (el.dataset.nav === active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
}

export function setContext({ crumb = "", title = "", action = "" } = {}) {
  const c = document.getElementById("topbar-crumb");
  const t = document.getElementById("topbar-title");
  const a = document.getElementById("topbar-action");
  if (c) c.textContent = crumb;
  if (t) t.textContent = title;
  if (a) a.innerHTML = action;
}
