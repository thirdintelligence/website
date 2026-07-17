/* Small DOM + formatting helpers shared across the portal. No dependencies. */

/** Escape untrusted text for safe HTML interpolation. */
export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** Tagged template that escapes ${...} interpolations; use h.raw(x) to opt out. */
export function h(strings, ...values) {
  let out = "";
  strings.forEach((s, i) => {
    out += s;
    if (i < values.length) {
      const v = values[i];
      if (v && typeof v === "object" && v.__raw !== undefined) out += v.__raw;
      else if (Array.isArray(v)) out += v.join("");
      else out += esc(v);
    }
  });
  return out;
}
h.raw = (str) => ({ __raw: str == null ? "" : String(str) });

/** Build an element from an HTML string (first root node). */
export function fromHTML(str) {
  const t = document.createElement("template");
  t.innerHTML = str.trim();
  return t.content.firstElementChild;
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Format an ISO date (YYYY-MM-DD or datetime) to a short readable label. */
export function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? value + "T00:00:00" : value);
  if (isNaN(d)) return String(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Human byte-size label. */
export function fmtBytes(n) {
  if (!Number.isFinite(n)) return "";
  const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 2)} ${u[i]}`;
}

/** mm:ss from milliseconds. */
export function fmtTimestamp(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
