/* Client-proposed project detail. Requests appear immediately after submission
   without inventing scope, schedule, or investment before Third i reviews it. */
import { esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statusLabel } from "../components/cards.js";
import { addCommentButton, commentThread } from "../components/feed.js";

export function render(data, params) {
  const request = (data.live?.projectRequests || []).find((item) => item.id === params.requestId);
  if (!request) return {
    crumb: "Projects",
    title: "Request not found",
    html: `<div class="page"><div class="empty-state">${icon("alert")}<p>That project request was not found.</p><a class="btn btn-outline" href="#/projects">Back to Projects</a></div></div>`
  };

  const ctx = {
    scope: "project-request",
    projectId: request.id,
    label: request.name,
    route: `/bkwatch/projects/requests/${request.id}`
  };
  const comments = (data.live?.comments || []).filter((comment) => comment.projectId === request.id);
  const attachments = (request.attachments || []).map((attachment) => `<button type="button" class="comment-attach" data-media-download="${esc(attachment.id)}">${icon("paperclip")} ${esc(attachment.name)}${attachment.sizeLabel ? ` · ${esc(attachment.sizeLabel)}` : ""}${icon("download")}</button>`).join("");

  return {
    crumb: "Projects",
    title: request.name,
    html: `<div class="page">
      <a class="btn btn-sm btn-ghost" href="#/projects">${icon("chevronLeft")} Projects</a>
      <section class="detail-block request-detail">
        <div class="hero-metaline">${statusLabel(request.status, "warn")}</div>
        <h1 class="page-title">${esc(request.name)}</h1>
        <p class="page-lede">${esc(request.description)}</p>
        <dl class="kv"><dt>Submitted</dt><dd>${fmtDate(request.createdAt)}</dd><dt>Next step</dt><dd>Third i reviews the request, then confirms scope, timing, and investment before work begins.</dd></dl>
        ${attachments ? `<div class="request-attachments">${attachments}</div>` : ""}
      </section>
      <section class="detail-block">
        <div class="section-head"><h2>Comments</h2>${addCommentButton(ctx)}</div>
        ${commentThread(comments, null, data.projects?.projects || []) || `<div class="empty-state">${icon("comment")}<p>No comments on this request yet.</p></div>`}
      </section>
    </div>`
  };
}
