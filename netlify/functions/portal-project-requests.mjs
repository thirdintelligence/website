/* /bkwatch/api/project-requests — client-proposed projects (plan 05).
   Creates a live record + OS action + owner notification. No static file is
   mutated; no strategy/milestone/budget is invented. */
import { authenticate, verifyMutation } from "../../lib/portal-request-auth.mjs";
import { getStore, key } from "../../lib/portal-store.mjs";
import { buildProjectRequest } from "../../lib/portal-validation.mjs";
import { writeEvent } from "../../lib/portal-audit.mjs";
import { createFromRequest } from "../../lib/portal-actions.mjs";
import { queueNotification } from "../../lib/portal-notify.mjs";
import { json, apiError, readJson, tenantFromPath, tenantLabel } from "../../lib/portal-api-util.mjs";
import { verifyAttachmentRefs } from "../../lib/portal-attachment-refs.mjs";

export default async (request) => {
  const tenant = tenantFromPath(request);
  if (!tenant) return apiError(404, "unknown_tenant");
  const auth = authenticate(request, tenant);
  if (!auth.ok) return apiError(auth.status, auth.error);
  if (request.method !== "POST") return apiError(405, "method_not_allowed");
  if (!verifyMutation(request, tenant)) return apiError(403, "csrf_failed");

  const store = await getStore();
  const body = await readJson(request);
  const attachments = await verifyAttachmentRefs(store, tenant, body.attachments);
  if (!attachments.ok) return apiError(422, attachments.error);
  body.attachments = attachments.attachments;
  const built = await buildProjectRequest(body, { tenant });
  if (!built.ok) return apiError(422, "invalid_request", built.errors);
  const rec = built.record;

  await store.set(key(tenant, "project-requests", rec.id), rec);
  const ev = await writeEvent(store, { tenant, type: "project-request.created", subjectId: rec.id, actor: "client", revision: 1 });
  await createFromRequest(store, tenant, rec, ev.id);
  await queueNotification(store, tenant, {
    subjectId: rec.id, sourceEventId: ev.id,
    subject: `[Portal · ${tenantLabel(tenant)} · New project] ${rec.name}`,
    text: `New project request from ${tenantLabel(tenant)}\n\nName: ${rec.name}\nDescription: ${rec.description}\nCreated: ${rec.createdAt}`
  });
  return json({ request: rec }, 201);
};
