/* Portal bootstrap: load sanitized data, render the shell, and wire every
   top-level workspace plus its nested project and library views. */
import { loadPortalData } from "./data.js";
import { initTheme, toggleTheme, syncToggle } from "./theme.js";
import { renderShell, setContext, setActiveNav } from "./shell.js";
import { currentLocation, match, onRouteChange } from "./router.js";
import { initSearch } from "./search.js";
import { initComposer } from "./composer.js";

import * as home from "../pages/home.js";
import * as projects from "../pages/projects.js";
import * as projectDetail from "../pages/project-detail.js";
import * as projectRequest from "../pages/project-request.js";
import * as filmPresentation from "../pages/film-presentation.js";
import * as library from "../pages/library.js";
import * as libraryRecord from "../pages/library-record.js";
import * as communications from "../pages/communications.js";
import * as aiRoadmap from "../pages/ai-roadmap.js";
import * as valueResults from "../pages/value-results.js";

const PAGES = {
  home, projects, project: projectDetail, projectRequest, idea: filmPresentation,
  library, libraryCategory: library, libraryComms: library, libraryQuicklinks: library, libraryRecord,
  communications, communicationsSub: communications,
  aiRoadmap, valueResults
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
    const download = e.target.closest("[data-media-download]");
    const timestamp = e.target.closest("[data-comment-timestamp]");
    const printProject = e.target.closest("[data-project-pdf]");
    const fullscreen = e.target.closest("[data-presentation-fullscreen]");
    if (download) { e.preventDefault(); authorizeDownload(download); }
    else if (timestamp) { e.preventDefault(); seekComment(timestamp); }
    else if (printProject) { e.preventDefault(); window.print(); }
    else if (fullscreen) { e.preventDefault(); togglePresentation(fullscreen); }
  });

  document.addEventListener("fullscreenchange", () => syncPresentationState(true));
  document.addEventListener("keydown", (event) => {
    const app = document.querySelector(".portal-app");
    if (event.key === "Escape" && app?.dataset.fullscreen === "true" && !document.fullscreenElement) {
      app.dataset.fullscreen = "false";
      syncPresentationState(false);
    }
  });

  onRouteChange(renderRoute);
  renderRoute();
}

async function authorizeDownload(button) {
  if (button.disabled) return;
  button.disabled = true;
  const id = button.getAttribute("data-media-download");
  try {
    const response = await fetch(DATA.cfg.routeBase + "/api/media/download/authorize", {
      method: "POST", credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": DATA.cfg.csrfToken || "" },
      body: JSON.stringify({ assetId: id })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `http_${response.status}`);
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = result.name || "download";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } catch (error) {
    appToast(error.message === "not_client_visible" ? "This upload is awaiting Third i review before it can be downloaded." : "The download could not be authorized. Try again.");
  } finally { button.disabled = false; }
}

function seekComment(button) {
  const video = document.querySelector("video");
  if (!video) { appToast("The video preview is not available yet. This timestamp will become playable when approved media is added."); return; }
  video.currentTime = Number(button.getAttribute("data-comment-timestamp")) / 1000;
  video.play().catch(() => {});
  video.focus();
}

async function togglePresentation(button) {
  const app = document.querySelector(".portal-app");
  const active = app?.dataset.fullscreen === "true";
  if (!app) return;
  app.dataset.fullscreen = active ? "false" : "true";
  if (!active && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen().catch(() => {});
  else if (active && document.fullscreenElement) await document.exitFullscreen().catch(() => {});
  syncPresentationState(false);
}

function syncPresentationState(fromFullscreenEvent = false) {
  const app = document.querySelector(".portal-app");
  if (!app) return;
  if (fromFullscreenEvent && !document.fullscreenElement && app.dataset.fullscreen === "true") app.dataset.fullscreen = "false";
  document.querySelectorAll("[data-presentation-fullscreen]").forEach((button) => button.setAttribute("aria-pressed", app.dataset.fullscreen === "true" ? "true" : "false"));
}

function appToast(message) {
  const toast = document.createElement("div");
  toast.className = "portal-toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
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

  // Locked demos live on their project page. Replace stale/deep links to the
  // former presentation route without leaving a duplicate demo page behind.
  if (view.redirect) {
    location.replace(view.redirect);
    return;
  }

  contentEl.innerHTML = view.html;
  hydrateDesignerFrames();
  setContext({ crumb: view.crumb || "", title: view.title || "", action: view.action || "", fullscreen: view.fullscreen || false, commentContext: view.commentContext || null });
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

let designerSvgPromise = null;
function designerSvg() {
  if (!designerSvgPromise) {
    designerSvgPromise = fetch("/assets/designer.svg", { credentials: "same-origin" })
      .then((response) => { if (!response.ok) throw new Error("designer_unavailable"); return response.text(); })
      .then((source) => new DOMParser().parseFromString(source, "image/svg+xml").documentElement);
  }
  return designerSvgPromise;
}

function hydrateDesignerFrames() {
  document.querySelectorAll("[data-designer-svg]:empty").forEach(async (frame) => {
    try {
      const template = await designerSvg();
      if (!frame.isConnected) return;
      const svg = template.cloneNode(true);
      // The source illustration repeats one identical whole-composition 4px
      // vertical loop around its animated parts. Remove only that shared bounce;
      // retain the internal working/gear motion inside the designer artwork.
      svg.querySelectorAll('animateTransform[type="translate"]').forEach((animation) => {
        const values = animation.getAttribute("values") || "";
        if (values.startsWith("567.071 665.431") && values.includes("567.071 669.431")) animation.remove();
      });
      svg.setAttribute("focusable", "false");
      svg.setAttribute("aria-hidden", "true");
      frame.appendChild(svg);
    } catch {
      frame.classList.add("designer-unavailable");
      frame.innerHTML = iconFallback();
    }
  });
}

function iconFallback() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 16l8-8 2 2-8 8H6v-2Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
}

boot();
