/* Feeds: activity timeline, project timeline, posted comment thread, and the
   contextual Add Comment affordance (opens the shared composer). */
import { esc, fmtDate, fmtTimestamp } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statusLabel } from "./cards.js";

const TYPE_ICON = { "project-update": "dot", "completed-action": "checkCircle", "new-deliverable": "layers", communication: "comment", meeting: "users", email: "mail", comment: "comment" };
const TYPE_LABEL = { "project-update": "Project update", "completed-action": "Completed", "new-deliverable": "Deliverable", communication: "Communication", meeting: "Meeting", email: "Email", comment: "Comment" };

export function activityFeed(items) {
  if (!items || !items.length) return `<div class="empty-state">${icon("clock")}<p>No recent activity to show yet.</p></div>`;
  return `<div class="feed">
    ${items.map((it) => `<div class="feed-item ${it.type === "completed-action" ? "done" : ""}">
      <span class="feed-node" aria-hidden="true"></span>
      <div class="feed-type">${esc(TYPE_LABEL[it.type] || it.type)}</div>
      <div class="feed-title">${esc(it.title)}</div>
      ${it.detail ? `<div class="feed-detail">${esc(it.detail)}</div>` : ""}
      <div class="feed-date">${fmtDate(it.date)}</div>
    </div>`).join("")}
  </div>`;
}

export function projectTimeline(items) {
  if (!items || !items.length) return "";
  return `<div class="ptimeline">
    ${items.map((t) => `<div class="ptl-row ${esc(t.state)}">
      <span class="ptl-dot" aria-hidden="true"></span>
      <div><strong>${esc(t.title)}</strong>${t.detail ? `<div class="feed-detail">${esc(t.detail)}</div>` : ""}
        <span class="visually-hidden">status: ${esc(t.state)}</span></div>
    </div>`).join("")}
  </div>`;
}

/** Contextual Add Comment button. The context object is attached to the composer. */
export function addCommentButton(context, label = "Add Comment", variant = "btn-sm btn-ghost add-comment") {
  return `<button type="button" class="btn ${variant}" data-comment-context='${esc(JSON.stringify(context || {}))}'>${icon("comment")} ${esc(label)}</button>`;
}

/** Posted comments rendered as brand chat bubbles. */
export function commentThread(comments, context) {
  const scoped = filterByContext(comments, context);
  if (!scoped.length) return "";
  return `<div class="comment-thread">
    ${scoped.map(renderComment).join("")}
  </div>`;
}

function renderComment(c) {
  const completed = c.status === "completed";
  const tsLabel = Number.isFinite(c.timestampMs) ? `${icon("clock")} ${fmtTimestamp(c.timestampMs)}${c.rangeMs ? "–" + fmtTimestamp(c.timestampMs + c.rangeMs) : ""}` : "";
  const ctx = c.context || {};
  const ctxLabel = ctx.label || (ctx.sceneId ? "Scene " + ctx.sceneId : ctx.scope);
  return `<article class="comment ${c.blocker ? "is-blocker" : ""} ${completed ? "is-completed" : ""}">
    <div class="comment-actions">
      <button class="btn btn-icon btn-sm comment-edit" title="Edit" aria-label="Edit comment">${icon("pencil")}</button>
      <button class="btn btn-icon btn-sm comment-del" title="Delete" aria-label="Delete comment">${icon("trash")}</button>
    </div>
    <div class="comment-head">
      <span class="comment-attr">${esc(c.attribution || "bkWatch commented")}</span>
      ${c.createdAt ? `· <span>${fmtDate(c.createdAt)}</span>` : ""}
      · ${statusLabel(completed ? "Completed" : "Open", completed ? "ok" : "warn")}
      ${c.blocker ? "· " + statusLabel("Blocker", "risk") : ""}
    </div>
    <div class="comment-title">${esc(c.title)}</div>
    ${c.description ? `<div class="comment-body">${esc(c.description)}</div>` : ""}
    ${(tsLabel || ctxLabel) ? `<span class="comment-ctx">${tsLabel || ""}${tsLabel && ctxLabel ? " · " : ""}${ctxLabel ? esc(ctxLabel) : ""}</span>` : ""}
    ${(c.attachments || []).map((a) => `<span class="comment-attach">${icon("paperclip")} ${esc(a.name)}${a.sizeLabel ? " · " + esc(a.sizeLabel) : ""}</span>`).join("")}
    ${completed && c.completionNote ? `<div class="comment-body">${icon("checkCircle")} ${esc(c.completionNote)}</div>` : ""}
  </article>`;
}

function filterByContext(comments, context) {
  if (!comments) return [];
  if (!context) return comments;
  return comments.filter((c) => {
    const cc = c.context || {};
    if (context.projectId && cc.projectId !== context.projectId) return false;
    if (context.sceneId && cc.sceneId !== context.sceneId) return false;
    if (context.recordId && cc.recordId !== context.recordId) return false;
    if (context.scope && cc.scope !== context.scope) return false;
    return true;
  });
}
