/* portal-download-name.mjs — client-readable download filenames (plan 05).
   Pattern: act{act}.scene{scene}.vers{version}[-two-to-five-word-slug].ext
   Never exposes storage keys, UUIDs, hashes, timestamps, prompts, or local paths. */

const cleanExt = (ext) => String(ext || "").replace(/^\./, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";

function slug(desc, maxWords = 5) {
  return String(desc || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean).slice(0, maxWords).join("-");
}

/** From numeric act/scene/version. */
export function sceneDownloadName({ act, scene, version, description, ext }) {
  const base = `act${Number(act) || 0}.scene${Number(scene) || 0}.vers${Number(version) || 0}`;
  const s = description ? "-" + slug(description) : "";
  return `${base}${s}.${cleanExt(ext)}`.replace(/-\./, ".");
}

/** From a "1.2.3" reference. */
export function fromSceneRef(ref, { description, ext } = {}) {
  const [act, scene, version] = String(ref).split(".").map((n) => parseInt(n, 10));
  return sceneDownloadName({ act, scene, version, description, ext });
}

/** Non-scene assets: film1.final.vers2.mp4 / film1.storyboard.current.pdf */
export function assetDownloadName({ parts, version, ext }) {
  const stem = (Array.isArray(parts) ? parts : [parts])
    .map((p) => String(p).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")).filter(Boolean).join(".");
  const v = version ? `.vers${version}` : "";
  return `${stem}${v}.${cleanExt(ext)}`;
}

/** Defensive guard: reject anything that leaks internal identifiers. */
export function isSafeDownloadName(name) {
  if (typeof name !== "string" || !name) return false;
  if (/[\/\\]/.test(name)) return false;                       // no paths
  if (/[0-9a-f]{16,}/i.test(name)) return false;               // no long hashes/uuids
  if (/\b\d{10,}\b/.test(name)) return false;                  // no raw timestamps
  return /^[a-z0-9][a-z0-9.\-]*\.[a-z0-9]{1,8}$/.test(name);   // lowercase, dots + hyphens, real ext
}
