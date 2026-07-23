/* portal-actions.mjs — OS action records derived from portal events, plus the
   owner-only completion round-trip. Only owner sessions may mutate actions. */
import { key } from "./portal-store.mjs";
import { newId, nowIso } from "./portal-ids.mjs";
import { writeEvent } from "./portal-audit.mjs";

function actionType(comment) {
  if (comment.context?.scope === "library") return "library-correction";
  return comment.blocker ? "blocker" : "comment";
}

export async function createFromComment(store, tenant, comment, sourceEventId) {
  const action = {
    id: newId("act"), tenant, type: actionType(comment), projectId: comment.projectId || "general",
    title: comment.title, context: comment.context?.label || comment.context?.scope || "General",
    priority: 0, status: "open", sourceEventId, subjectId: comment.id,
    executable: true, superpromptId: "comment-analysis@v1", assignedAgent: "ThirdI_WEB",
    createdAt: nowIso()
  };
  await store.set(key(tenant, "actions", action.id), action);
  return action;
}

/** Update the action linked to a comment when the comment is edited.
    Keeps the OS action feed in sync with portal edits. */
export async function updateFromComment(store, tenant, commentId, edited) {
  const actionKeys = await store.list(key(tenant, "actions") + "/");
  for (const ak of actionKeys) {
    const action = await store.get(ak);
    if (action && action.subjectId === commentId) {
      action.title = edited.title;
      action.type = actionType(edited);
      action.projectId = edited.projectId || "general";
      action.context = edited.context?.label || edited.context?.scope || "General";
      action.updatedAt = nowIso();
      await store.set(ak, action);
      return action;
    }
  }
  /* If no action exists yet (e.g. merged blocker that was POSTed as new),
     create one now so it appears in the OS. */
  return createFromComment(store, tenant, { ...edited, id: commentId }, null);
}

export async function createFromRequest(store, tenant, req, sourceEventId) {
  const action = {
    id: newId("act"), tenant, type: "project-request", projectId: "general",
    title: `New project request: ${req.name}`, context: "Create a New Project",
    priority: 0, status: "open", sourceEventId, subjectId: req.id,
    executable: false, superpromptId: "project-intake@v1", assignedAgent: "ThirdI_WEB",
    createdAt: nowIso()
  };
  await store.set(key(tenant, "actions", action.id), action);
  return action;
}

export async function listActions(store, tenant) {
  const keys = await store.list(key(tenant, "actions") + "/");
  const actions = (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean);
  return actions.sort((a, b) => (a.priority - b.priority) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function getAction(store, tenant, id) { return store.get(key(tenant, "actions", id)); }

/**
 * Owner completes/reopens/reprioritizes an action. Completion also flips the
 * linked comment to Completed and writes a completion event → the client Home
 * and the record view reflect it immediately (no redeploy).
 */
export async function patchAction(store, tenant, id, patch) {
  const action = await getAction(store, tenant, id);
  if (!action) return { ok: false, status: 404, error: "not_found" };
  if (patch.priority != null) action.priority = Number(patch.priority) | 0;

  if (patch.op === "complete" && action.executable) {
    action.status = "completed"; action.updatedAt = nowIso();
    if (action.subjectId) {
      const ck = key(tenant, "comments", action.subjectId);
      const comment = await store.get(ck);
      if (comment) {
        comment.status = "completed"; comment.updatedAt = nowIso();
        comment.revision = (comment.revision || 1) + 1;
        if (patch.note) comment.completionNote = String(patch.note).slice(0, 1000);
        comment.completedAt = nowIso();
        await store.set(ck, comment);
        await writeEvent(store, { tenant, type: "comment.completed", subjectId: comment.id, actor: "owner", revision: comment.revision, note: patch.note });
      }
    }
  } else if (patch.op === "reopen") {
    action.status = "open"; action.updatedAt = nowIso();
    if (action.subjectId) {
      const ck = key(tenant, "comments", action.subjectId);
      const comment = await store.get(ck);
      if (comment) { comment.status = "open"; comment.revision = (comment.revision || 1) + 1; comment.updatedAt = nowIso(); await store.set(ck, comment); }
    }
  } else if (patch.op === "hide") {
    action.status = "hidden"; action.updatedAt = nowIso();
  } else if (patch.op === "archive") {
    action.status = "archived"; action.updatedAt = nowIso();
  } else if (patch.op === "unarchive") {
    action.status = "open"; action.updatedAt = nowIso();
  }
  await store.set(key(tenant, "actions", id), action);
  return { ok: true, action };
}
