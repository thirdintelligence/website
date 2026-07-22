/* Resolve client-supplied attachment references against tenant-owned media.
   A comment/request may reference only a completed upload from its own tenant. */
import { key } from "./portal-store.mjs";

const SAFE_STATES = new Set(["pending", "uploaded", "approved"]);
const clamp = (value, max) => String(value || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);

export async function verifyAttachmentRefs(store, tenant, attachments) {
  if (!attachments) return { ok: true, attachments: [] };
  if (!Array.isArray(attachments) || attachments.length > 10) return { ok: false, error: "invalid_attachments" };
  const verified = [];
  for (const item of attachments) {
    const id = clamp(item?.id, 200);
    const media = id && await store.get(key(tenant, "media", id));
    if (!media || media.tenant !== tenant || !SAFE_STATES.has(media.status)) return { ok: false, error: "invalid_attachment" };
    verified.push({
      id: media.id,
      kind: clamp(media.kind || "file", 40),
      name: clamp(item?.name || media.downloadName || "attachment", 200),
      ...(item?.sizeLabel ? { sizeLabel: clamp(item.sizeLabel, 40) } : {})
    });
  }
  return { ok: true, attachments: verified };
}
