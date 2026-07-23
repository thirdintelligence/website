/* Tenant-only global search over the sanitized search index (plan 02).
   Attaches to the desktop utility-bar input and the mobile full-width sheet. */
import { esc, fmtDate } from "./util.js";
import { icon } from "./icons.js";
import { href } from "./router.js";

export function initSearch(data) {
  const entries = () => [
    ...(data.search.entries || []),
    ...(data.live?.projectRequests || []).map((request) => ({ id: request.id, type: "project request", title: request.name, excerpt: request.description, status: request.status, route: `${data.cfg.routeBase}/projects/requests/${request.id}` })),
    ...(data.live?.comments || []).map((comment) => ({ id: comment.id, type: comment.blocker ? "blocker comment" : "comment", title: comment.title, excerpt: comment.description || "", project: comment.projectId, status: comment.status, date: comment.createdAt, route: comment.context?.route || `${data.cfg.routeBase}/communications/comments` }))
  ];
  const shortName = data.portal.client.shortName;

  // Desktop utility-bar search.
  const input = document.getElementById("global-search");
  if (input) {
    const util = input.closest(".search-utility");
    util.style.position = "relative";
    const panel = makePanel();
    Object.assign(panel.style, { position: "absolute", top: "48px", right: "0", width: "min(480px, 92vw)" });
    util.appendChild(panel);
    attach(input, panel, entries, shortName, () => { input.value = ""; });
    document.addEventListener("click", (e) => { if (!util.contains(e.target)) panel.hidden = true; });
  }

  // Mobile full-width search sheet.
  const trigger = document.getElementById("mobile-search-trigger");
  const sheet = document.getElementById("search-sheet");
  if (trigger && sheet) {
    const minput = sheet.querySelector("#global-search-mobile");
    const mpanel = sheet.querySelector("#search-sheet-results");
    const open = () => { sheet.dataset.open = "true"; minput.focus(); };
    const close = () => { sheet.dataset.open = "false"; minput.value = ""; mpanel.innerHTML = ""; };
    trigger.addEventListener("click", open);
    sheet.querySelector("#search-sheet-close")?.addEventListener("click", close);
    attach(minput, mpanel, entries, shortName, close);
    minput.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
}

function makePanel() {
  const panel = document.createElement("div");
  panel.className = "search-results";
  panel.hidden = true;
  Object.assign(panel.style, { maxHeight: "70vh", overflow: "auto", background: "var(--bg-elevated)", border: "1px solid var(--line-strong)", borderRadius: "14px", boxShadow: "var(--shadow-lg)", padding: "8px", zIndex: "80" });
  return panel;
}

function attach(input, panel, entries, shortName, onNavigate) {
  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { panel.hidden = true; panel.innerHTML = ""; return; }
    const results = entries().filter((e) =>
      (e.title + " " + (e.excerpt || "") + " " + (e.keywords || "") + " " + (e.category || "") + " " + (e.project || "")).toLowerCase().includes(q)
    ).slice(0, 12);
    panel.innerHTML = results.length
      ? results.map((r) => `<a class="record-row card-link" href="${href(r.route)}" style="margin-bottom:6px">
          <span><span class="rr-title">${esc(r.title)}</span>
            <span class="rr-summary">${esc(r.excerpt || "")}</span>
            <span class="feed-date">${esc(r.type)}${r.project ? " · " + esc(r.project) : ""}${r.category ? " · " + esc(r.category) : ""}${r.date ? " · " + fmtDate(r.date) : ""}</span></span>
          <span class="card-action"><span class="control-content">View result${icon("arrowRight")}</span></span></a>`).join("")
      : `<div class="empty-state" style="padding:24px">${icon("search")}<p>No matches in ${esc(shortName)}.</p></div>`;
    panel.hidden = false;
  };
  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 120); });
  input.addEventListener("focus", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const a = panel.querySelector("a"); if (a) { location.hash = a.getAttribute("href").slice(1); panel.hidden = true; onNavigate?.(); } }
  });
  panel.addEventListener("click", (e) => { if (e.target.closest("a")) { panel.hidden = true; onNavigate?.(); } });
}
