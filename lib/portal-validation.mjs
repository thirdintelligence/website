/**
 * portal-validation.mjs — construct and validate operational records.
 *
 * The client sends only intent (title, blocker, project, description, context).
 * The SERVER builds the authoritative record (id, tenant, status, attribution,
 * timestamps, revision) and validates it against the frozen schema. Client input
 * never sets tenant, status, attribution, id, or revision.
 */
import { createSchemaRegistry, getSchemaValidator, formatErrors } from "./portal-schemas.mjs";
import { newId, nowIso } from "./portal-ids.mjs";

let _ajv = null;
async function ajv() { if (!_ajv) _ajv = await createSchemaRegistry(); return _ajv; }

const clamp = (s, max) => (s == null ? "" : String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max));

const CTX_KEYS = ["scope", "route", "projectId", "recordId", "sceneId", "assetId", "versionId", "category", "label"];
function cleanContext(ctx) {
  const out = {};
  if (ctx && typeof ctx === "object") for (const k of CTX_KEYS) if (typeof ctx[k] === "string" && ctx[k]) out[k] = clamp(ctx[k], 200);
  return out;
}
function cleanAttachments(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 10).map((a) => ({ id: clamp(a.id || newId("att"), 200), kind: clamp(a.kind || "file", 40), name: clamp(a.name || "attachment", 200), ...(a.sizeLabel ? { sizeLabel: clamp(a.sizeLabel, 40) } : {}) }));
}

export async function buildComment(input, { tenant, attribution }) {
  const ctx = cleanContext(input.context);
  const rec = {
    id: newId("cmt"), tenant, kind: "comment",
    title: clamp(input.title, 300),
    blocker: !!input.blocker,
    projectId: clamp(input.projectId || ctx.projectId || "general", 200) || "general",
    ...(input.description ? { description: clamp(input.description, 4000) } : {}),
    ...(input.attachments ? { attachments: cleanAttachments(input.attachments) } : {}),
    ...(Object.keys(ctx).length ? { context: ctx } : {}),
    ...(Number.isFinite(input.timestampMs) ? { timestampMs: Math.max(0, Math.floor(input.timestampMs)) } : {}),
    ...(Number.isFinite(input.rangeMs) ? { rangeMs: Math.max(0, Math.floor(input.rangeMs)) } : {}),
    status: "open", attribution, createdAt: nowIso(), revision: 1
  };
  if (!rec.title) return { ok: false, errors: ["title is required"] };
  return validate("comment.schema.json", rec);
}

export async function buildProjectRequest(input, { tenant }) {
  const rec = {
    id: newId("req"), tenant, kind: "client_project_request",
    name: clamp(input.name, 200), description: clamp(input.description, 4000),
    ...(input.attachments ? { attachments: cleanAttachments(input.attachments) } : {}),
    status: "Client proposed — awaiting Third i review", createdAt: nowIso(), revision: 1
  };
  if (!rec.name || !rec.description) return { ok: false, errors: ["name and description are required"] };
  return validate("project-request.schema.json", rec);
}

/** Client edit of an existing comment (content only; bumps revision). */
export async function applyCommentEdit(existing, patch) {
  const ctx = cleanContext(patch.context);
  const next = {
    ...existing,
    ...(patch.title != null ? { title: clamp(patch.title, 300) } : {}),
    ...(patch.description != null ? { description: clamp(patch.description, 4000) } : {}),
    ...(patch.blocker != null ? { blocker: !!patch.blocker } : {}),
    ...(patch.projectId != null ? { projectId: clamp(patch.projectId, 200) || "general" } : {}),
    ...(Object.keys(ctx).length ? { context: ctx } : {}),
    updatedAt: nowIso(), revision: (existing.revision || 1) + 1
  };
  if (!next.title) return { ok: false, errors: ["title is required"] };
  return validate("comment.schema.json", next);
}

async function validate(schemaName, rec) {
  const v = getSchemaValidator(await ajv(), schemaName);
  if (!v(rec)) return { ok: false, errors: formatErrors(v.errors) };
  return { ok: true, record: rec };
}
