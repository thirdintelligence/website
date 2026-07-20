/* Card + label components. */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { mediaFrame } from "./media.js";

/** Pick an honest tone (color + icon) from a status string. Color is never the
    only signal — text and icon always accompany it. */
export function toneFor(text = "") {
  const t = String(text).toLowerCase();
  if (/block|reject|risk|fail/.test(t)) return { cls: "status-risk", icon: "alert" };
  if (/await|pending|partial|needs|progress|proposed|review|gate/.test(t)) return { cls: "status-warn", icon: "clock" };
  if (/confirm|active|done|complete|lock|selected|ready|passed|approved/.test(t)) return { cls: "status-ok", icon: "check" };
  return { cls: "status-neutral", icon: "dot" };
}

export function statusLabel(text, tone) {
  const t = tone ? { cls: `status-${tone}`, icon: tone === "ok" ? "check" : tone === "risk" ? "alert" : tone === "warn" ? "clock" : "dot" } : toneFor(text);
  return `<span class="status ${t.cls}">${icon(t.icon)}${esc(text)}</span>`;
}

export const chip = (text, ic) => `<span class="chip">${ic ? icon(ic) : ""}${esc(text)}</span>`;
export const sourceNote = (src) => src ? `<p class="source-note">Source: ${esc(src)}</p>` : "";

export function motif(kind = "grid") {
  return `<div class="motif motif-${kind}" aria-hidden="true"></div>`;
}

/** Value/effort/evidence band with a small meter (Unknown renders empty). */
export function band(label, level) {
  const pct = { Low: 34, Medium: 67, High: 100, Unknown: 0 }[level] ?? 0;
  return `<span class="band">${esc(label)} <b>${esc(level)}</b><span class="band-meter" aria-hidden="true"><i style="width:${pct}%"></i></span></span>`;
}

export function statStrip(stats) {
  return `<div class="stat-strip">
    ${stats.map((s) => `<div class="stat">
      <div class="stat-value ${typeof s.value === "number" ? "accent" : "text"}">${esc(s.value)}</div>
      <div class="stat-label">${esc(s.label)}${s.unit ? ` <span class="stat-unit">· ${esc(s.unit)}</span>` : ""}</div>
    </div>`).join("")}
  </div>`;
}

export function projectCard(p, hrefStr) {
  const count = p.comment?.count || 0;
  return `<a class="card card-feature project-card card-link" href="${hrefStr}">
    ${motif("grid")}
    ${mediaFrame({ mediaState: p.thumbnail?.mediaState || "ungenerated", label: p.thumbnail?.label, draft: p.draft })}
    <div class="pc-body">
      <div class="pc-meta">${statusLabel(p.statusLabel || p.status)}${chip(p.projectType)}</div>
      <h3 class="pc-title">${esc(p.title)}</h3>
      <p class="pc-value">${esc(p.valueStatement)}</p>
      <div class="pc-meta">
        ${p.nextMilestone ? `<span class="muted">${icon("arrowRight")} ${esc(p.nextMilestone)}</span>` : ""}
        ${count ? `<span class="muted">${icon("comment")} ${count}</span>` : ""}
      </div>
    </div>
  </a>`;
}

export function actionItem(item) {
  const tone = toneFor(item.kind === "blocker" ? "blocker" : item.status);
  return `<div class="action-item">
    <span class="action-rail ${item.kind === "blocker" ? "blocker" : ""}"></span>
    <div class="action-body">
      <div class="action-title">${esc(item.title)}</div>
      ${item.detail ? `<div class="action-detail">${esc(item.detail)}</div>` : ""}
      <div class="action-meta">
        ${statusLabel(item.kind === "blocker" ? "Blocker" : (item.status || "Open"), item.kind === "blocker" ? "risk" : undefined)}
        ${item.projectLabel ? `<span>${esc(item.projectLabel)}</span>` : ""}
        ${item.route ? `<a href="${item.route.startsWith("#") ? item.route : "#" + item.route.replace(/^\/bkwatch/, "")}">Open ${icon("arrowRight")}</a>` : ""}
      </div>
    </div>
  </div>`;
}
