/* /bkwatch/api/media/* — tenant-authorized R2 upload/download signing.
   The function validates + signs only; file bytes never traverse it. Client
   uploads land as "pending" (owner approval gates client visibility). */
import { authenticate, verifyMutation } from "../../lib/portal-request-auth.mjs";
import { getStore, key } from "../../lib/portal-store.mjs";
import { validateIntent, PART_BYTES } from "../../lib/portal-media-policy.mjs";
import * as r2 from "../../lib/portal-media-store.mjs";
import { fromSceneRef, assetDownloadName, isSafeDownloadName } from "../../lib/portal-download-name.mjs";
import { json, apiError, readJson, tenantFromPath, subPath } from "../../lib/portal-api-util.mjs";
import { newId, nowIso } from "../../lib/portal-ids.mjs";
import { writeEvent } from "../../lib/portal-audit.mjs";

const sanitize = (m) => m && ({ id: m.id, kind: m.kind, mime: m.mime, sizeBytes: m.sizeBytes, status: m.status, downloadName: m.downloadName, versionId: m.versionId, createdAt: m.createdAt });

export default async (request) => {
  const tenant = tenantFromPath(request);
  const auth = authenticate(request, tenant);
  if (!auth.ok) return apiError(auth.status, auth.error);
  const store = await getStore();
  const seg = subPath(request); // e.g. ["media","upload","initiate"]  or ["media","<id>","metadata"]
  const action = seg.slice(1).join("/");

  if (request.method === "GET" && seg[2] === "metadata") {
    const meta = await store.get(key(tenant, "media", seg[1]));
    if (!meta || meta.tenant !== tenant) return apiError(404, "not_found");
    return json({ media: sanitize(meta) });
  }

  if (request.method !== "POST") return apiError(405, "method_not_allowed");
  if (!verifyMutation(request, tenant)) return apiError(403, "csrf_failed");
  const body = await readJson(request);

  if (action === "upload/initiate") {
    const v = validateIntent({ filename: body.filename, sizeBytes: body.sizeBytes, contentType: body.contentType, isClientUpload: body.isClientUpload !== false });
    if (!v.ok) return apiError(422, v.error);
    const assetId = newId("ast"), versionId = newId("ver");
    const storageKey = key(tenant, "media", assetId, versionId);
    const downloadName = body.sceneRef
      ? fromSceneRef(body.sceneRef, { description: body.description, ext: v.ext })
      : assetDownloadName({ parts: (body.filename || "file").replace(/\.[^.]+$/, ""), ext: v.ext });
    if (!isSafeDownloadName(downloadName)) return apiError(422, "unsafe_filename");

    let uploadId, url;
    if (v.multipart) {
      const r = await r2.createMultipart(storageKey, v.mime);
      if (!r.ok) return apiError(503, r.error);
      uploadId = r.uploadId;
    } else {
      const r = await r2.signSinglePut(storageKey, v.mime);
      if (!r.ok) return apiError(503, r.error);
      url = r.url;
    }
    const meta = { id: assetId, tenant, kind: v.mime.split("/")[0], mime: v.mime, ext: v.ext, sizeBytes: Number(body.sizeBytes), storageKey, versionId, uploadId, status: "uploading", isClientUpload: body.isClientUpload !== false, downloadName, createdAt: nowIso() };
    await store.set(key(tenant, "media", assetId), meta);
    await writeEvent(store, { tenant, type: "media.upload.initiated", subjectId: assetId, actor: "client", revision: 1 });
    return json({ assetId, versionId, multipart: !!v.multipart, uploadId, partSize: PART_BYTES, url }, 201);
  }

  // Remaining actions operate on an existing metadata record (tenant-checked).
  const meta = await store.get(key(tenant, "media", body.assetId || ""));
  if (!meta || meta.tenant !== tenant) return apiError(404, "not_found");

  if (action === "upload/part") {
    const partNumber = Number(body.partNumber);
    if (!meta.uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) return apiError(422, "invalid_part");
    const r = await r2.signPart(meta.storageKey, meta.uploadId, partNumber);
    return r.ok ? json({ url: r.url }) : apiError(503, r.error);
  }
  if (action === "upload/complete") {
    let r;
    if (meta.uploadId) {
      const parts = Array.isArray(body.parts) ? body.parts : [];
      const validParts = parts.length > 0 && parts.every((part, index) => Number.isInteger(part.partNumber) && part.partNumber === index + 1 && typeof part.etag === "string" && part.etag.length > 0);
      if (!validParts) return apiError(422, "invalid_parts");
      r = await r2.completeMultipart(meta.storageKey, meta.uploadId, parts);
    } else {
      r = await r2.verifyObject(meta.storageKey, { sizeBytes: meta.sizeBytes, contentType: meta.mime });
    }
    if (!r.ok) return apiError(503, r.error);
    meta.status = meta.isClientUpload ? "pending" : "uploaded"; meta.updatedAt = nowIso(); await store.set(key(tenant, "media", meta.id), meta);
    await writeEvent(store, { tenant, type: "media.upload.completed", subjectId: meta.id, actor: "client", revision: 1 });
    return json({ ok: true, assetId: meta.id });
  }
  if (action === "upload/abort") {
    if (meta.uploadId) await r2.abortMultipart(meta.storageKey, meta.uploadId);
    else await r2.deleteObject(meta.storageKey);
    meta.status = "aborted"; meta.updatedAt = nowIso(); await store.set(key(tenant, "media", meta.id), meta);
    await writeEvent(store, { tenant, type: "media.upload.aborted", subjectId: meta.id, actor: "client", revision: 1 });
    return json({ ok: true });
  }
  if (action === "download/authorize") {
    if (meta.status !== "approved") return apiError(403, "not_client_visible"); // only owner-approved media is downloadable
    const r = await r2.signDownload(meta.storageKey, { filename: meta.downloadName });
    if (r.ok) await writeEvent(store, { tenant, type: "media.download.authorized", subjectId: meta.id, actor: "client", revision: 1 });
    return r.ok ? json({ url: r.url, name: meta.downloadName, sizeBytes: meta.sizeBytes }) : apiError(503, r.error);
  }
  if (action === "playback/authorize") {
    if (meta.status !== "approved" || meta.kind !== "video") return apiError(403, "not_client_visible");
    const r = await r2.signPlayback(meta.storageKey, { contentType: meta.mime });
    if (r.ok) await writeEvent(store, { tenant, type: "media.playback.authorized", subjectId: meta.id, actor: "client", revision: 1 });
    return r.ok ? json({ url: r.url, mime: meta.mime, sizeBytes: meta.sizeBytes }) : apiError(503, r.error);
  }

  return apiError(404, "unknown_action");
};
