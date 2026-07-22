/* /bkwatch/api/comments — tenant-scoped comment CRUD.
   GET list · POST create · PATCH edit · DELETE soft-delete. Tenant from session. */
import { authenticate, verifyMutation } from "../../lib/portal-request-auth.mjs";
import { getStore, key } from "../../lib/portal-store.mjs";
import { buildComment, applyCommentEdit } from "../../lib/portal-validation.mjs";
import { writeEvent } from "../../lib/portal-audit.mjs";
import { createFromComment } from "../../lib/portal-actions.mjs";
import { queueNotification, buildCommentEmail } from "../../lib/portal-notify.mjs";
import { json, apiError, readJson, tenantFromPath, idFromPath, tenantLabel } from "../../lib/portal-api-util.mjs";
import { nowIso } from "../../lib/portal-ids.mjs";
import { verifyAttachmentRefs } from "../../lib/portal-attachment-refs.mjs";

export default async (request) => {
  const tenant = tenantFromPath(request);
  const auth = authenticate(request, tenant);
  if (!auth.ok) return apiError(auth.status, auth.error);
  const store = await getStore();

  if (request.method === "GET") {
    const keys = await store.list(key(tenant, "comments") + "/");
    const comments = (await Promise.all(keys.map((k) => store.get(k))))
      .filter((c) => c && !c.deleted)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return json({ comments });
  }

  // All mutations require same-origin + CSRF.
  if (!verifyMutation(request, tenant)) return apiError(403, "csrf_failed");

  if (request.method === "POST") {
    const body = await readJson(request);
    const attachments = await verifyAttachmentRefs(store, tenant, body.attachments);
    if (!attachments.ok) return apiError(422, attachments.error);
    body.attachments = attachments.attachments;
    const built = await buildComment(body, { tenant, attribution: `${tenantLabel(tenant)} commented` });
    if (!built.ok) return apiError(422, "invalid_comment", built.errors);
    const rec = built.record;
    await store.set(key(tenant, "comments", rec.id), rec);
    const ev = await writeEvent(store, { tenant, type: "comment.created", subjectId: rec.id, actor: "client", revision: 1 });
    await createFromComment(store, tenant, rec, ev.id);
    const email = buildCommentEmail(tenant, rec, `/os#action-${rec.id}`);
    await queueNotification(store, tenant, { subjectId: rec.id, sourceEventId: ev.id, ...email });
    return json({ comment: rec }, 201);
  }

  const id = idFromPath(request);
  if (!id) return apiError(400, "missing_id");
  const ck = key(tenant, "comments", id);
  const existing = await store.get(ck);

  if (request.method === "PATCH") {
    if (!existing || existing.deleted) return apiError(404, "not_found");
    const edited = await applyCommentEdit(existing, await readJson(request));
    if (!edited.ok) return apiError(422, "invalid_comment", edited.errors);
    await store.set(ck, edited.record);
    await writeEvent(store, { tenant, type: "comment.edited", subjectId: id, actor: "client", revision: edited.record.revision });
    return json({ comment: edited.record });
  }

  if (request.method === "DELETE") {
    if (!existing) return apiError(404, "not_found");
    existing.deleted = true; existing.updatedAt = nowIso(); existing.revision = (existing.revision || 1) + 1;
    await store.set(ck, existing); // soft-delete: audit + record retained internally
    await writeEvent(store, { tenant, type: "comment.deleted", subjectId: id, actor: "client", revision: existing.revision });
    return json({ ok: true });
  }

  return apiError(405, "method_not_allowed");
};
