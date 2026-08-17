/* Media components: honest thumbnails, in-production placeholder (grid +
   animated designer.svg), draft disclosure, and asset/version views. */
import { h, esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { canonicalMediaLabel, canonicalVersionLabel } from "../core/naming.js";

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

/** Production placeholder — only for a selected demo or an approved storyboard
 * that has actually entered production. The caller supplies the precise phase
 * label so demo production is never confused with full-film production. */
export function inProduction({ ratio = "16 / 9", label = "In production" } = {}) {
  return `<div class="thumb in-production" style="aspect-ratio:${ratio}">
    <div class="ip-grid" aria-hidden="true"></div>
    <span class="ip-figure" data-designer-svg="${DESIGNER_SVG}" aria-hidden="true"></span>
    <div class="ip-cap">
      <span class="ip-badge">${icon("clock")} ${esc(label)}</span>
    </div>
  </div>`;
}

/** Neutral ungenerated thumbnail: grid + play button (not the designer.svg). */
export function ungeneratedThumb({ label = "Not Yet Generated", ratio = "16 / 9" } = {}) {
  return `<div class="thumb thumb-grid" style="aspect-ratio:${ratio}">
    <span class="thumb-play" aria-hidden="true">${icon("play")}</span>
    <span class="thumb-label"><span class="status status-neutral">${icon("film")} ${esc(label)}</span></span>
  </div>`;
}

/**
 * Render a media frame from an asset-like descriptor.
 * mediaState drives the honest presentation; no media is invented.
 */
export function mediaFrame({ mediaState = "ungenerated", label, ratio = "16 / 9", draft = false, assetId = null, kind = "video" } = {}) {
  if (mediaState === "in-production") return inProduction({ ratio, label });
  if (mediaState === "approved" && assetId) {
    /* Stills render as preview-only thumbnails — no play button, since
       playback/authorize rejects non-video/non-audio kinds. Videos keep
       the play button for secure review playback. */
    if (kind === "image") {
      return `<div class="thumb media-approved" style="aspect-ratio:${ratio}">
        <span class="media-playback-poster" data-media-preview="${esc(assetId)}" data-media-kind="${esc(kind)}" aria-hidden="true">
          <span class="media-thumbnail-loading">${icon("image")}</span>
        </span>
      </div>`;
    }
    return `<div class="thumb media-approved" style="aspect-ratio:${ratio}">
      <span class="media-playback-poster" data-media-preview="${esc(assetId)}" data-media-kind="${esc(kind)}" aria-hidden="true">
        <span class="media-thumbnail-loading">${icon("film")}</span>
      </span>
      <button class="media-play" type="button" data-media-playback="${esc(assetId)}">
        <span class="media-play-icon" aria-hidden="true">${icon("play")}</span>
        <span><strong>${esc(canonicalMediaLabel(label || "Approved video"))}</strong><small>Play secure review copy</small></span>
      </button>
    </div>`;
  }
  if (mediaState === "approved") {
    return ungeneratedThumb({
      label: label
        ? `${label} · secure playback transfer pending`
        : "Approved master · secure playback transfer pending",
      ratio
    });
  }
  // Draft assets render through their authorized asset record when available;
  // absent media remains a neutral, explicitly unfinished frame.
  const frame = ungeneratedThumb({ label: label || (mediaState === "prompts-ready" ? "Prompts ready · media not generated" : "Not Yet Generated"), ratio });
  return draft ? frame.replace('<span class="thumb-label">', `<span class="thumb-label" data-draft="1">${draftTag()} `) : frame;
}

/** Authenticated card/request thumbnail. The signed preview URL is authorized
 * after render; no storage URL or object key is emitted into shipped HTML. */
export function secureThumbnail({ assetId, kind = "video", label = "Project media", ratio = "16 / 9" } = {}) {
  if (!assetId) return "";
  return `<div class="thumb media-thumbnail" style="aspect-ratio:${ratio}" data-media-preview="${esc(assetId)}" data-media-kind="${esc(kind)}" aria-label="${esc(label)}">
    <span class="media-thumbnail-loading" aria-hidden="true">${icon(kind === "video" ? "film" : "image")}</span>
  </div>`;
}

export function assetPreviewDescriptor(project, { firstUpload = false } = {}) {
  const approved = (project?.assets || []).filter((asset) =>
    asset.mediaState === "approved"
    && ["video", "still", "poster"].includes(asset.kind)
    && (asset.versions || []).some((version) => version.mediaId)
  );
  if (!approved.length) return null;
  const explicit = approved.find((asset) => asset.id === project?.thumbnail?.assetId);
  const asset = firstUpload ? approved[0] : (explicit || approved[0]);
  const versions = asset.versions || [];
  const version = firstUpload
    ? versions[0]
    : (versions.find((item) => item.id === asset.currentVersionId)
      || versions.find((item) => item.current)
      || versions[0]);
  if (!version?.mediaId) return null;
  const versionLabel = canonicalVersionLabel(version.label);
  const assetTitle = canonicalMediaLabel(asset.title || "");
  return {
    assetId: version.mediaId,
    kind: asset.kind === "video" ? "video" : "image",
    label: assetTitle && versionLabel && assetTitle.includes(versionLabel)
      ? assetTitle
      : [assetTitle, versionLabel].filter(Boolean).join(" · ")
  };
}

/** Shared honest media-state rule. Entering demo selection/build starts the
 * in-production presentation; approved uploads always supersede it. */
export function projectThumbnailState(project) {
  const explicit = project?.thumbnail || {};
  const demoPhase = String(project?.productionLifecycle?.demoPhase || "").toLowerCase();
  const projectPhase = String(project?.productionLifecycle?.projectPhase || project?.phase || "").toLowerCase();
  const demoStarted = ["selecting", "building", "in-production", "started"].includes(demoPhase);
  const directionStarted = /(?:direction|concept|creative)[ -](?:selection|development|production)/.test(projectPhase);
  if (project?.type === "film" && (demoStarted || directionStarted) && explicit.mediaState !== "approved") {
    return { mediaState: "in-production", label: "Demo in production" };
  }
  return {
    mediaState: explicit.mediaState || "ungenerated",
    label: explicit.label
  };
}

/** Version-aware project hero. Versions are ordered oldest → newest, while the
 * current approved version opens by default. Navigation never removes the
 * underlying version record, download action, or secure playback boundary. */
export function versionedMediaHero({ versions = [], currentVersionId, label, ratio = "16 / 9" } = {}) {
  if (!versions.length) return mediaFrame({ mediaState: "approved", label, ratio });
  const requestedIndex = versions.findIndex((version) =>
    version.id === currentVersionId || version.current
  );
  const activeIndex = requestedIndex >= 0 ? requestedIndex : versions.length - 1;
  const slides = versions.map((version, index) => {
    const versionLabel = canonicalVersionLabel(version.label) || canonicalMediaLabel(version.label) || `V${index + 1}`;
    const assetTitle = canonicalMediaLabel(version.assetTitle || "");
    const title = (assetTitle && assetTitle.includes(versionLabel))
      ? assetTitle
      : [assetTitle, versionLabel].filter(Boolean).join(" · ") || label;
    return `<div class="media-version-slide" data-media-version-slide="${index}" data-version-label="${esc(versionLabel)}" ${index === activeIndex ? "" : "hidden"} aria-hidden="${index === activeIndex ? "false" : "true"}">
      ${mediaFrame({
        mediaState: "approved",
        label: title,
        ratio,
        assetId: version.mediaId || null,
        kind: "video"
      })}
    </div>`;
  }).join("");
  const navigation = versions.length > 1 ? `
    <button class="media-version-arrow media-version-prev" type="button" data-media-version-prev aria-label="Show previous final version" ${activeIndex === 0 ? "hidden" : ""}>${icon("chevronLeft")}</button>
    <button class="media-version-arrow media-version-next" type="button" data-media-version-next aria-label="Show newer final version" ${activeIndex === versions.length - 1 ? "hidden" : ""}>${icon("chevronRight")}</button>
    <div class="media-version-position" aria-live="polite">
      <strong data-media-version-label>${esc(canonicalVersionLabel(versions[activeIndex].label) || canonicalMediaLabel(versions[activeIndex].label) || `V${activeIndex + 1}`)}</strong>
      <span data-media-version-count>${activeIndex + 1} of ${versions.length}</span>
    </div>` : "";
  return `<div class="media-version-carousel" data-media-version-carousel data-current-index="${activeIndex}" role="group" aria-roledescription="carousel" aria-label="${esc(label || "Final video versions")}">
    <div class="media-version-slides">${slides}</div>
    ${navigation}
  </div>`;
}

/** Shared project/idea hero. The latest approved version opens by default while
 * every approved final stays available through the same carousel and history. */
export function projectHeroPreview(project, { includeHistory = false } = {}) {
  const approvedAssets = (project?.assets || []).filter((asset) => asset.mediaState === "approved");
  const heroAsset = approvedAssets.find((asset) => asset.id === project?.thumbnail?.assetId) || approvedAssets[0];
  const heroVersion = heroAsset?.versions?.find((version) => version.id === heroAsset.currentVersionId)
    || heroAsset?.versions?.find((version) => version.current)
    || heroAsset?.versions?.[0];
  const heroVersions = approvedAssets
    .filter((asset) => asset.kind === "video")
    .flatMap((asset, assetIndex) => (asset.versions || []).map((version, versionIndex) => ({
      ...version,
      assetTitle: asset.title,
      order: assetIndex * 100 + versionIndex
    })))
    .sort((a, b) => {
      const byDate = String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      return byDate || a.order - b.order;
    });
  /* The hero owns only the video versions. Still and voiceover downloads live
     in their dedicated sections below, so they must not repeat under the hero. */
  const historyAssets = approvedAssets.filter((asset) => asset.kind === "video");
  const thumbnailState = projectThumbnailState(project);

  return `<div class="project-preview scene-media">
    ${heroVersions.length ? versionedMediaHero({
      versions: heroVersions,
      currentVersionId: heroVersion?.id,
      label: project?.thumbnail?.label,
      ratio: "16 / 9"
    }) : mediaFrame({
      mediaState: thumbnailState.mediaState,
      label: thumbnailState.label,
      ratio: "16 / 9",
      assetId: heroVersion?.mediaId || null,
      kind: heroAsset?.kind === "video" ? "video" : "image"
    })}
    ${includeHistory && historyAssets.length ? `<div class="project-version-grid">${historyAssets.map(versionHistory).join("")}</div>` : ""}
  </div>`;
}

/** Single voiceover frame: label + play button. Playback is authorized after
 * click, so no storage URL is ever emitted into shipped HTML. */
function voiceoverFrame({ mediaId, title, note }) {
  if (!mediaId) {
    return `<div class="media-audio media-audio-pending">
      <span class="media-audio-icon" aria-hidden="true">${icon("clock")}</span>
      <div class="media-audio-text"><strong>${esc(title)}</strong><small>Secure transfer pending</small></div>
    </div>`;
  }
  return `<div class="media-audio">
    <div data-media-audio-slot>
      <button class="media-audio-play" type="button" data-media-playback="${esc(mediaId)}" data-media-kind="audio">
        <span class="media-audio-icon" aria-hidden="true">${icon("play")}</span>
        <span class="media-audio-text"><strong>${esc(title)}</strong><small>${esc(note || "Play secure review copy")}</small></span>
      </button>
    </div>
  </div>`;
}

/**
 * Voiceover player. The newest version opens by default; a left arrow steps
 * back through older versions. Reuses the shared version-carousel wiring, so
 * switching versions pauses the audio that was playing.
 */
export function voiceoverPlayer(asset) {
  if (!asset || !(asset.versions || []).length) return "";
  /* Oldest → newest so the left arrow always means "older". */
  const versions = [...asset.versions].sort((a, b) => {
    const byDate = String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    return byDate || String(a.label).localeCompare(String(b.label));
  });
  const requested = versions.findIndex((v) => v.id === asset.currentVersionId || v.current);
  const activeIndex = requested >= 0 ? requested : versions.length - 1;

  const slides = versions.map((version, index) => {
    const versionLabel = canonicalVersionLabel(version.label) || `V${index + 1}`;
    return `<div class="media-version-slide" data-media-version-slide="${index}" data-version-label="${esc(versionLabel)}" ${index === activeIndex ? "" : "hidden"} aria-hidden="${index === activeIndex ? "false" : "true"}">
      ${voiceoverFrame({
        mediaId: version.mediaId,
        title: `${canonicalMediaLabel(asset.title || "Voiceover")} · ${versionLabel}`,
        note: version.note || (index === versions.length - 1 ? "Newest recording · play secure review copy" : "Earlier recording · play secure review copy")
      })}
    </div>`;
  }).join("");

  const navigation = versions.length > 1 ? `
    <button class="media-version-arrow media-version-prev" type="button" data-media-version-prev aria-label="Show older voiceover version" ${activeIndex === 0 ? "hidden" : ""}>${icon("chevronLeft")}</button>
    <button class="media-version-arrow media-version-next" type="button" data-media-version-next aria-label="Show newer voiceover version" ${activeIndex === versions.length - 1 ? "hidden" : ""}>${icon("chevronRight")}</button>
    <div class="media-version-position" aria-live="polite">
      <strong data-media-version-label>${esc(canonicalVersionLabel(versions[activeIndex].label) || `V${activeIndex + 1}`)}</strong>
      <span data-media-version-count>${activeIndex + 1} of ${versions.length}</span>
    </div>` : "";

  return `<div class="voiceover-player" data-media-version-carousel data-current-index="${activeIndex}">
    <div class="media-version-slides">${slides}</div>
    ${navigation}
  </div>`;
}

/** Version history list (stills/video only), with authorized direct downloads. */
export function versionHistory(asset, { showTitle = true } = {}) {
  if (!asset || !asset.versions || asset.versions.length === 0) return "";
  return `<div class="version-history">
    ${showTitle ? `<h4>${esc(asset.title || "Versions")}</h4>` : ""}
    <ul class="record-list">
      ${asset.versions.map((v) => `<li class="record-row">
        <span><span class="rr-title">${esc(canonicalVersionLabel(v.label) || canonicalMediaLabel(v.label))}</span>
          <span class="rr-summary">${esc(v.state)}${v.createdAt ? " · " + fmtDate(v.createdAt) : ""}${v.current ? " · current" : ""}</span></span>
        <span>${v.downloadName && v.mediaId
          ? `<button class="btn btn-sm btn-outline" type="button" data-media-download="${esc(v.mediaId)}">${icon("download")} ${esc(v.sizeLabel || "Download")}</button>`
          : v.downloadName ? `<span class="media-transfer-pending">${icon("clock")} Secure transfer pending</span>` : ""}</span>
      </li>`).join("")}
    </ul>
  </div>`;
}
