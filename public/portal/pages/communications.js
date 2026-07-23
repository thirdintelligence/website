/* Communications page — standalone page for all comments, emails, meetings,
   and archived communications. Also accessible from the Library. */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { commentThread, addCommentButton } from "../components/feed.js";
import { sourceNote } from "../components/cards.js";

export function render(data, params) {
  const { portal, live, communications } = data;
  const sub = params?.subpage;

  if (sub) return renderSubPage(data, sub);

  const emailCount = communications?.emails?.length || 0;
  const meetingCount = communications?.meetings?.length || 0;
  const commentCount = live?.comments?.length || 0;

  // Active comments (not completed/deleted)
  const activeComments = (live?.comments || []).filter((c) => c.status !== "completed" && c.status !== "deleted");
  const recentComments = activeComments.slice(0, 5);
  const commentPreview = recentComments.length ? recentComments.map((c) => `<a class="comm-preview-row card-link" href="#/communications/comments"><span class="comm-rail"></span><div><div class="comm-title">${esc(c.title || c.text?.substring(0, 60) || "Comment")}</div><div class="comm-meta">${esc(c.attribution || "Client commented")} · ${esc(c.createdAt?.split("T")[0] || "")}</div></div></a>`).join("") : `<div class="empty-state compact">${icon("comment")}<p>No active comments.</p></div>`;

  // Recent emails
  const recentEmails = (communications?.emails || []).slice(0, 5);
  const emailPreview = recentEmails.length ? recentEmails.map(emailPreviewRow).join("") : `<div class="empty-state compact">${icon("mail")}<p>No emails yet.</p></div>`;

  // Recent meetings
  const recentMeetings = (communications?.meetings || []).slice(0, 5);
  const meetingPreview = recentMeetings.length ? recentMeetings.map(meetingPreviewRow).join("") : `<div class="empty-state compact">${icon("users")}<p>No meetings yet.</p></div>`;

  // Archived: completed comments, deleted comments, past meetings
  const archivedComments = (live?.comments || []).filter((c) => c.status === "completed" || c.status === "deleted");
  const pastMeetings = (communications?.meetings || []).filter((m) => !m.upcoming);
  const archivedCount = archivedComments.length + pastMeetings.length;

  const html = `<div class="page">
    <h1 class="page-title">Communications</h1>
    <p class="page-lede">All comments, emails, and meetings for ${esc(portal.client.name)} in one place.</p>

    <div class="comms-sections">
      <div class="card comms-section-card">
        <div class="section-head">
          <h2 class="section-title">${icon("comment")} Comments (${commentCount})</h2>
          <a class="btn btn-sm btn-ghost" href="#/communications/comments">View all ${icon("arrowRight")}</a>
        </div>
        ${commentPreview}
      </div>
      <div class="card comms-section-card">
        <div class="section-head">
          <h2 class="section-title">${icon("mail")} Emails (${emailCount})</h2>
          <a class="btn btn-sm btn-ghost" href="#/communications/emails">View all ${icon("arrowRight")}</a>
        </div>
        ${emailPreview}
      </div>
      <div class="card comms-section-card">
        <div class="section-head">
          <h2 class="section-title">${icon("users")} Meetings (${meetingCount})</h2>
          <a class="btn btn-sm btn-ghost" href="#/communications/meetings">View all ${icon("arrowRight")}</a>
        </div>
        ${meetingPreview}
      </div>
    </div>

    ${archivedCount ? `<section class="section">
      <div class="section-head"><h2 class="section-title">${icon("archive")} Archived &amp; completed (${archivedCount})</h2></div>
      <div class="comms-sections">
        ${archivedComments.length ? `<div class="card comms-section-card">
          <div class="section-head"><h2 class="section-title">${icon("checkCircle")} Completed comments (${archivedComments.length})</h2></div>
          ${commentThread(archivedComments, null, data.projects?.projects || []) || `<div class="empty-state compact"><p>None.</p></div>`}
        </div>` : ""}
        ${pastMeetings.length ? `<div class="card comms-section-card">
          <div class="section-head"><h2 class="section-title">${icon("clock")} Past meetings (${pastMeetings.length})</h2></div>
          ${pastMeetings.map(meetingPreviewRow).join("")}
        </div>` : ""}
      </div>
    </section>` : ""}

    ${communications ? sourceNote(communications.source) : ""}
  </div>`;

  return { crumb: portal.client.shortName, title: "Communications", html };
}

/* Communication sub-page: Comments, Emails, or Meetings full list. */
function renderSubPage(data, sub) {
  const { portal, live, communications } = data;
  const titles = { comments: "Comments", emails: "Emails", meetings: "Meetings" };
  const title = titles[sub] || "Communication";

  let body = "";

  if (sub === "comments") {
    body = commentThread(live?.comments || [], null, data.projects?.projects || []) || `<div class="empty-state">${icon("comment")}<p>No comments yet. Comments left on projects, scenes, and library records will appear here.</p></div>`;
  } else if (sub === "emails") {
    const emails = communications?.emails || [];
    body = emails.length ? `<div class="email-list">${emails.map(emailFullRow).join("")}</div>` : `<div class="empty-state">${icon("mail")}<p>No emails yet. Emails related to ${esc(portal.client.name)} will appear here, synced from Gmail.</p></div>`;
  } else if (sub === "meetings") {
    const meetings = communications?.meetings || [];
    const upcoming = meetings.filter((m) => m.upcoming);
    const past = meetings.filter((m) => !m.upcoming);
    body = `
      ${upcoming.length ? `<div class="detail-block"><h2>Upcoming</h2><div class="meeting-list">${upcoming.map(meetingFullRow).join("")}</div></div>` : ""}
      ${past.length ? `<div class="detail-block"><h2>Past meetings</h2><div class="meeting-list">${past.map(meetingFullRow).join("")}</div></div>` : ""}
      ${!meetings.length ? `<div class="empty-state">${icon("users")}<p>No meetings yet. Meetings related to ${esc(portal.client.name)} will appear here, synced from Google Calendar.</p></div>` : ""}`;
  }

  const html = `<div class="page">
    <a class="btn btn-sm btn-ghost" href="#/communications">${icon("chevronLeft")} Communications</a>
    <h1 class="page-title" style="margin-top:12px">${esc(title)}</h1>
    <p class="page-lede">${sub === "emails" ? "Emails related to " + esc(portal.client.name) + ", synced from Gmail." : sub === "meetings" ? "Meetings related to " + esc(portal.client.name) + ", synced from Google Calendar." : "All comments left on projects, scenes, and library records."}</p>
    <section class="section">${body}</section>
    ${communications ? sourceNote(communications.source) : ""}
  </div>`;

  return { crumb: "Communications", title, html };
}

/* Email rendering — preview (compact) and full (expandable). */
function emailPreviewRow(e) {
  return `<a class="comm-preview-row card-link" href="#/communications/emails">
    ${icon("mail")}
    <div>
      <div class="comm-title">${esc(e.subject)}</div>
      <div class="comm-meta">${esc(e.from?.replace(/<.*>/, "").trim() || "")} · ${esc(e.dateLabel || "")}</div>
    </div>
  </a>`;
}

function emailFullRow(e) {
  return `<details class="email-row">
    <summary>
      ${icon("mail")}
      <div class="email-summary">
        <div class="email-subject">${esc(e.subject)}</div>
        <div class="email-meta">${esc(e.from?.replace(/<.*>/, "").trim() || "")} · ${esc(e.dateLabel || "")}</div>
      </div>
    </summary>
    <div class="email-body">${esc(e.body || e.snippet || "Email body not available in preview.")}</div>
  </details>`;
}

function meetingPreviewRow(m) {
  return `<a class="comm-preview-row card-link" href="#/communications/meetings">
    ${icon("users")}
    <div>
      <div class="comm-title">${esc(m.summary)}</div>
      <div class="comm-meta">${esc(m.startLabel || "")} ${m.upcoming ? "· Upcoming" : ""}</div>
    </div>
  </a>`;
}

function meetingFullRow(m) {
  return `<div class="meeting-row">
    <div class="meeting-icon">${icon("users")}</div>
    <div class="meeting-body">
      <div class="meeting-title">${esc(m.summary)}</div>
      <div class="meeting-meta">${esc(m.startLabel || "")} ${m.upcoming ? "· Upcoming" : "· Past"}</div>
      ${m.attendees?.length ? `<div class="meeting-attendees">${m.attendees.map((a) => esc(a)).join(", ")}</div>` : ""}
    </div>
  </div>`;
}
