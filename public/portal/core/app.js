/* Portal bootstrap: load sanitized data, render the shell, wire router/search/
   composer/theme, and render the four pages + nested views. */
import { loadPortalData } from "./data.js";
import { initTheme, toggleTheme, syncToggle } from "./theme.js";
import { renderShell, setContext, setActiveNav } from "./shell.js";
import { currentLocation, match, onRouteChange } from "./router.js";
import { initSearch } from "./search.js";
import { initComposer } from "./composer.js";

import * as home from "../pages/home.js";
import * as projects from "../pages/projects.js";
import * as projectDetail from "../pages/project-detail.js";
import * as filmPresentation from "../pages/film-presentation.js";
import * as library from "../pages/library.js";
import * as libraryRecord from "../pages/library-record.js";
import * as aiRoadmap from "../pages/ai-roadmap.js";
import * as valueResults from "../pages/value-results.js";

const PAGES = {
  home, projects, project: projectDetail, idea: filmPresentation,
  library, libraryCategory: library, libraryRecord, aiRoadmap, valueResults
};

let DATA = null;
let contentEl = null;

async function boot() {
  const root = document.getElementById("app");
  initTheme();
  try {
    DATA = await loadPortalData();
  } catch (err) {
    root.innerHTML = `<div style="max-width:520px;margin:15vh auto;text-align:center;font-family:system-ui;color:#a8bac8">
      <h1 style="font-size:1.2rem">Workspace unavailable</h1>
      <p>The portal content could not be loaded.</p><pre style="opacity:.6;font-size:.8rem">${String(err.message || err)}</pre></div>`;
    return;
  }

  const refs = renderShell(root, DATA);
  contentEl = refs.content;

  initSearch(DATA);
  initComposer(DATA, { rerender: renderRoute });

  document.addEventListener("click", (e) => {
    if (e.target.closest("#theme-toggle")) { toggleTheme(); syncToggle(); }
  });

  onRouteChange(renderRoute);
  renderRoute();
}

function renderRoute() {
  const loc = currentLocation();
  const m = match(loc.path);
  const mod = PAGES[m.name];

  let view;
  if (!mod) {
    view = { crumb: DATA.portal.client.shortName, title: "Not found", html: `<div class="page"><div class="empty-state">Page not found. <a href="#/">Go home</a></div></div>` };
  } else {
    view = mod.render(DATA, m.params);
  }

  contentEl.innerHTML = view.html;
  setContext({ crumb: view.crumb || "", title: view.title || "", action: view.action || "" });
  setActiveNav(m.name);
  document.title = `${view.title || "Home"} · ${DATA.portal.client.shortName} · Third i`;

  // Anchor scroll (e.g., a scene) or reset to top; move focus for a11y.
  if (loc.anchor) {
    const el = document.getElementById(loc.anchor);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.classList.add("ts-active"); setTimeout(() => el.classList.remove("ts-active"), 1000); }
  } else {
    contentEl.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  }
  contentEl.focus({ preventScroll: true });

  view.onMount && view.onMount();
}

boot();
