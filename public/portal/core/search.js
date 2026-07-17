/* Tenant-only global search over the sanitized search index (plan 02). */
import { esc, fmtDate } from "./util.js";
import { icon } from "./icons.js";

export function initSearch(data) {
  const input = document.getElementById("global-search");
  if (!input) return;
  const util = input.closest(".search-utility");
  const panel = document.createElement("div");
  panel.className = "search-results";
  panel.hidden = true;
  Object.assign(panel.style, { position: "absolute", top: "48px", right: "0", width: "min(480px, 92vw)", maxHeight: "70vh", overflow: "auto", background: "var(--bg-elevated)", border: "1px solid var(--line-strong)", borderRadius: "14px", boxShadow: "var(--shadow-lg)", padding: "8px", zIndex: "80" });
  util.style.position = "relative";
  util.appendChild(panel);

  const entries = data.search.entries || [];

  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { panel.hidden = true; panel.innerHTML = ""; return; }
    const results = entries.filter((e) =>
      (e.title + " " + (e.excerpt || "") + " " + (e.keywords || "") + " " + (e.category || "") + " " + (e.project || "")).toLowerCase().includes(q)
    ).slice(0, 12);

    panel.innerHTML = results.length
      ? results.map((r) => `<a class="record-row" href="${toHash(r.route)}" style="margin-bottom:6px">
          <span><span class="rr-title">${esc(r.title)}</span>
            <span class="rr-summary">${esc(r.excerpt || "")}</span>
            <span class="feed-date">${esc(r.type)}${r.project ? " · " + esc(r.project) : ""}${r.category ? " · " + esc(r.category) : ""}${r.date ? " · " + fmtDate(r.date) : ""}</span></span>
          <span>${icon("arrowRight")}</span>
        </a>`).join("")
      : `<div class="empty-state" style="padding:24px">${icon("search")}<p>No matches in ${esc(data.portal.client.shortName)}.</p></div>`;
    panel.hidden = false;
  };

  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 120); });
  input.addEventListener("focus", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { panel.hidden = true; input.blur(); }
    if (e.key === "Enter") { const a = panel.querySelector("a"); if (a) { location.hash = a.getAttribute("href").slice(1); panel.hidden = true; } }
  });
  document.addEventListener("click", (e) => { if (!util.contains(e.target)) panel.hidden = true; });
  panel.addEventListener("click", () => { panel.hidden = true; input.value = ""; });
}

function toHash(route) {
  let p = String(route).replace(/^\/bkwatch/, "");
  if (!p.startsWith("/")) p = "/" + p;
  return "#" + p.replace("#", "%anchor%");
}
