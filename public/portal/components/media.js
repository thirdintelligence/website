/* Media components: honest thumbnails, in-production placeholder (grid +
   animated designer.svg), draft disclosure, and asset/version views. */
import { h, esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";

const DESIGNER_SVG = "/assets/designer.svg";

/** The AI-assisted draft disclaimer (plan 05/11). Prominent but respectful. */
export function draftNotice() {
  return `<aside class="draft-notice" role="note">
    ${icon("alert")}
    <div>
      <strong>AI-assisted production draft — not final.</strong>
      <p>The storyboard and script describe the intended result. Current media is an exploration used to identify major visual, motion, and product-accuracy issues before refinement. Please evaluate each draft against that target; details already specified in the storyboard remain planned for the final work.</p>
    </div>
  </aside>`;
}

export const draftTag = () => `<span class="draft-tag">${icon("alert")} Draft</span>`;

/** In-production placeholder — only for finalized-idea scenes awaiting generation. */
export function inProduction({ next = "", ratio = "16 / 9" } = {}) {
  return `<div class="thumb in-production" style="aspect-ratio:${ratio}">
    <div class="ip-grid" aria-hidden="true"></div>
    <img class="ip-figure" src="${DESIGNER_SVG}" alt="" aria-hidden="true" />
    <div class="ip-cap">
      <span class="ip-badge">${icon("clock")} In production</span>
      ${next ? `<span class="ip-next">${esc(next)}</span>` : ""}
    </div>
  </div>`;
}

/** Neutral ungenerated thumbnail: grid + play button (not the designer.svg). */
export function ungeneratedThumb({ label = "No media generated yet", ratio = "16 / 9" } = {}) {
  return `<div class="thumb thumb-grid" style="aspect-ratio:${ratio}">
    <span class="thumb-play" aria-hidden="true">${icon("play")}</span>
    <span class="thumb-label"><span class="status status-neutral">${icon("film")} ${esc(label)}</span></span>
  </div>`;
}

/**
 * Render a media frame from an asset-like descriptor.
 * mediaState drives the honest presentation; no media is invented.
 */
export function mediaFrame({ mediaState = "ungenerated", label, next, ratio = "16 / 9", draft = false } = {}) {
  if (mediaState === "in-production") return inProduction({ next, ratio });
  // approved/draft real media would render here once assets exist; until then the
  // neutral grid is the truthful state.
  const frame = ungeneratedThumb({ label: label || (mediaState === "prompts-ready" ? "Prompts ready · media not generated" : "No media generated yet"), ratio });
  return draft ? frame.replace('<span class="thumb-label">', `<span class="thumb-label" data-draft="1">${draftTag()} `) : frame;
}

/** Version history list (stills/video only). Presentational until assets exist. */
export function versionHistory(asset) {
  if (!asset || !asset.versions || asset.versions.length === 0) return "";
  return `<div class="version-history">
    <h4>Versions</h4>
    <ul class="record-list">
      ${asset.versions.map((v) => `<li class="record-row">
        <span><span class="rr-title">${esc(v.label)}</span>
          <span class="rr-summary">${esc(v.state)}${v.createdAt ? " · " + fmtDate(v.createdAt) : ""}${v.current ? " · current" : ""}</span></span>
        <span>${v.downloadName ? `<a class="btn btn-sm btn-outline" href="#" aria-disabled="true">${icon("download")} ${esc(v.sizeLabel || "Download")}</a>` : ""}</span>
      </li>`).join("")}
    </ul>
  </div>`;
}
