/* portal-media-policy.mjs — media limits + allowed types (plan 06/18).
   Bytes never pass through the function; this validates the declared intent.
   Unscanned client uploads stay "pending" until owner approval, so they are
   never auto-served. */

export const MAX_BYTES = Number(process.env.PORTAL_MEDIA_MAX_BYTES) || 2 * 1024 * 1024 * 1024; // 2 GiB
export const CLIENT_UPLOAD_MAX_BYTES = Number(process.env.PORTAL_MEDIA_CLIENT_UPLOAD_MAX_BYTES) || 512 * 1024 * 1024;
export const PART_BYTES = Number(process.env.PORTAL_MEDIA_PART_BYTES) || 64 * 1024 * 1024; // 64 MiB
export const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MiB
export const DOWNLOAD_TTL = Number(process.env.PORTAL_MEDIA_DOWNLOAD_TTL_SECONDS) || 14400;
export const PART_TTL = Number(process.env.PORTAL_MEDIA_PART_TTL_SECONDS) || 3600;

// mime → allowed extensions
const ALLOWED = {
  "video/mp4": ["mp4", "m4v"], "video/webm": ["webm"], "video/quicktime": ["mov"],
  "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"], "image/gif": ["gif"],
  "application/pdf": ["pdf"],
  "text/plain": ["txt"], "text/markdown": ["md"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"]
};
const EXT_TO_MIME = Object.fromEntries(Object.entries(ALLOWED).flatMap(([mime, exts]) => exts.map((e) => [e, mime])));
// Never allow active/inline-executable content, even if uploaded.
const FORBIDDEN_EXT = ["html", "htm", "svg", "js", "mjs", "xml", "xhtml"];

const extOf = (filename) => String(filename || "").toLowerCase().split(".").pop();

export function validateIntent({ filename, sizeBytes, contentType, isClientUpload = false }) {
  const ext = extOf(filename);
  if (!ext || FORBIDDEN_EXT.includes(ext)) return { ok: false, error: "type_not_allowed" };
  const mime = EXT_TO_MIME[ext];
  if (!mime) return { ok: false, error: "type_not_allowed" };
  if (contentType && contentType !== mime) return { ok: false, error: "type_mismatch" };
  const size = Number(sizeBytes);
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: "invalid_size" };
  const limit = isClientUpload ? CLIENT_UPLOAD_MAX_BYTES : MAX_BYTES;
  if (size > limit) return { ok: false, error: "too_large" };
  return { ok: true, ext, mime, multipart: size > MULTIPART_THRESHOLD };
}
