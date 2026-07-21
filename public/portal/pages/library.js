/* Library (plan 07): client-facing knowledge database with real memory mapping.
   Communication category now shows real emails + meetings pulled from the OS
   snapshot, with Comments, Emails, and Meetings as separate sub-pages. */
import { esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statusLabel, chip, motif, sourceNote, cardAction } from "../components/cards.js";
import { commentThread, commentsWithProjectBlockers, addCommentButton } from "../components/feed.js";

const CAT_ICON = { branding: "bookmark", products: "layers", features: "target", "integrations-partners": "users", "film-knowledge": "film", communication: "comment", "other-knowledge": "library" };

export function render(data, params) {
  // Quicklinks page route
  if (params && params.quicklinks) return renderQuicklinks(data);
  // Communication sub-page route (comments / emails / meetings)
  if (params && params.subpage) return renderCommsSubPage(data, params);
  if (params && params.category) return renderCategory(data, params);

  const { library, portal, live, communications, quicklinks } = data;

  const counts = {};
  for (const r of library.records) counts[r.category] = (counts[r.category] || 0) + 1;
  // Add communication counts from real data
  if (communications) {
    counts.communication = (communications.emails?.length || 0) + (communications.meetings?.length || 0) + (live.comments?.length || 0);
  }

  const formats = [...new Set(library.records.map((r) => r.format))];

  const dir = library.categories.map((c) => {
    const count = counts[c.id] || 0;
    const countLabel = c.id === "communication" ? `${count} items` : `${count} records`;
    return `<a class="card card-feature lib-cat card-link" href="#/library/${c.id}">
      ${motif("grid")}
      <div class="pc-meta">${icon(CAT_ICON[c.id] || "library")}<span class="lc-count">${countLabel}</span></div>
      <h3 class="pc-title">${esc(c.title)}</h3>
      <p class="pc-value">${esc(c.description || "")}</p>
      ${c.subcategories && c.subcategories.length ? `<div class="lc-subs">${c.subcategories.map((s) => chip(s.title)).join("")}</div>` : ""}
      ${cardAction("Open category")}
    </a>`;
  }).join("");

  // Quicklinks card — links to the dedicated quicklinks page
  const quicklinksCount = quicklinks?.links?.length || 0;
  const quicklinksCard = `<a class="card card-feature lib-cat card-link" href="#/library/quicklinks">
    ${motif("grid")}
    <div class="pc-meta">${icon("external")}<span class="lc-count">${quicklinksCount} links</span></div>
    <h3 class="pc-title">Research Quicklinks</h3>
    <p class="pc-value">Living links to the independent research sources behind Third i's AI roadmaps — what each source is and when to use it.</p>
    ${cardAction("View quicklinks")}
  </a>`;

  const html = `<div class="page filter-page">
    <h1 class="page-title">Library</h1>
    <p class="page-lede">Everything Third i has learned and built for ${esc(portal.client.name)} — brand, products, features, integrations, film knowledge, and communication. Each record keeps its source.</p>

    <div class="filters" role="group" aria-label="Filter library">
      ${icon("filter")}
      <select class="filter-select" id="lf-format" aria-label="Format"><option value="">All formats</option>${formats.map((f) => `<option>${esc(f)}</option>`).join("")}</select>
      <select class="filter-select" id="lf-cat" aria-label="Category"><option value="">All categories</option>${library.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join("")}</select>
      <button class="btn btn-sm btn-ghost" id="lf-clear" type="button">Clear</button>
    </div>

    <section class="section"><div class="lib-dir">${dir}${quicklinksCard}</div></section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">All records</h2></div>
      <div class="record-list" id="lib-records">
        ${library.records.map((r) => recordRow(r)).join("")}
      </div>
    </section>
  </div>`;

  function onMount() {
    const fmt = document.getElementById("lf-format");
    const cat = document.getElementById("lf-cat");
    const apply = () => {
      document.querySelectorAll("#lib-records .record-row").forEach((el) => {
        const okF = !fmt.value || el.dataset.format === fmt.value;
        const okC = !cat.value || el.dataset.cat === cat.value;
        el.style.display = okF && okC ? "" : "none";
      });
    };
    fmt?.addEventListener("change", apply);
    cat?.addEventListener("change", apply);
    document.getElementById("lf-clear")?.addEventListener("click", () => { fmt.value = ""; cat.value = ""; apply(); });
  }

  return { crumb: portal.client.shortName, title: "Library", html, onMount };
}

function recordRow(r) {
  return `<a class="record-row card-link" href="#/library/${r.category}/${r.id}" data-format="${esc(r.format)}" data-cat="${esc(r.category)}">
    <span><span class="rr-title">${esc(r.title)}</span><span class="rr-summary">${esc(r.summary)}</span></span>
    <span class="record-row-actions">${statusLabel(r.status)}${cardAction("View record")}</span>
  </a>`;
}

/* Communication category overview — shows links to Comments, Emails, Meetings
   sub-pages with counts and recent previews. */
function renderCategory(data, params) {
  const { library, portal, live, communications } = data;
  const cat = library.categories.find((c) => c.id === params.category);
  if (!cat) return { crumb: "Library", title: "Not found", html: `<div class="page"><div class="empty-state">${icon("alert")}<p>Category not found.</p><a class="btn btn-outline" href="#/library">Back to Library</a></div></div>` };

  const isComms = cat.id === "communication";
  let body;

  if (isComms) {
    const emailCount = communications?.emails?.length || 0;
    const meetingCount = communications?.meetings?.length || 0;
    const commentCount = live?.comments?.length || 0;

    // Preview: 5 most recent emails
    const recentEmails = (communications?.emails || []).slice(0, 5);
    const emailPreview = recentEmails.length ? recentEmails.map(emailPreviewRow).join("") : `<div class="empty-state compact">${icon("mail")}<p>No emails yet.</p></div>`;

    // Preview: 5 most recent meetings
    const recentMeetings = (communications?.meetings || []).slice(0, 5);
    const meetingPreview = recentMeetings.length ? recentMeetings.map(meetingPreviewRow).join("") : `<div class="empty-state compact">${icon("users")}<p>No meetings yet.</p></div>`;

    // Preview: 5 most recent comments
    const recentComments = (live?.comments || []).slice(0, 5);
    const commentPreview = recentComments.length ? recentComments.map((c) => `<div class="comm-preview-row"><span class="comm-rail"></span><div><div class="comm-title">${esc(c.title || c.text?.substring(0, 60) || "Comment")}</div><div class="comm-meta">${esc(c.author || "Client")} · ${esc(c.createdAt?.split("T")[0] || "")}</div></div></div>`).join("") : `<div class="empty-state compact">${icon("comment")}<p>No comments yet.</p></div>`;

    body = `
      <div class="comms-sections">
        <div class="card comms-section-card">
          <div class="section-head">
            <h2 class="section-title">${icon("comment")} Comments (${commentCount})</h2>
            <a class="btn btn-sm btn-ghost" href="#/library/communication/comments">View all ${icon("arrowRight")}</a>
          </div>
          ${commentPreview}
        </div>
        <div class="card comms-section-card">
          <div class="section-head">
            <h2 class="section-title">${icon("mail")} Emails (${emailCount})</h2>
            <a class="btn btn-sm btn-ghost" href="#/library/communication/emails">View all ${icon("arrowRight")}</a>
          </div>
          ${emailPreview}
        </div>
        <div class="card comms-section-card">
          <div class="section-head">
            <h2 class="section-title">${icon("users")} Meetings (${meetingCount})</h2>
            <a class="btn btn-sm btn-ghost" href="#/library/communication/meetings">View all ${icon("arrowRight")}</a>
          </div>
          ${meetingPreview}
        </div>
      </div>`;
  } else {
    const records = library.records.filter((r) => r.category === cat.id);
    body = `<div class="record-list">${records.length ? records.map((r) => recordRow(r)).join("") : `<div class="empty-state">${icon("library")}<p>No records in this category yet.</p></div>`}</div>`;
  }

  const html = `<div class="page">
    <a class="btn btn-sm btn-ghost" href="#/library">${icon("chevronLeft")} Library</a>
    <h1 class="page-title" style="margin-top:12px">${esc(cat.title)}</h1>
    <p class="page-lede">${esc(cat.description || "")}</p>
    ${cat.subcategories && cat.subcategories.length ? `<div class="lc-subs" style="margin-bottom:24px">${cat.subcategories.map((s) => `<a class="btn btn-sm btn-outline" href="#/library/communication/${s.id}">${esc(s.title)} ${icon("arrowRight")}</a>`).join("")}</div>` : ""}
    <section class="section">${body}</section>
  </div>`;

  return { crumb: "Library", title: cat.title, html };
}

/* Communication sub-page: Comments, Emails, or Meetings full list. */
function renderCommsSubPage(data, params) {
  const { portal, live, communications } = data;
  const sub = params.subpage;
  const titles = { comments: "Comments", emails: "Emails", meetings: "Meetings" };
  const title = titles[sub] || "Communication";

  let body = "";

  if (sub === "comments") {
    body = commentThread(commentsWithProjectBlockers(live?.comments || [], data.projects?.projects || [])) || `<div class="empty-state">${icon("comment")}<p>No comments yet. Comments left on projects, scenes, and library records will appear here.</p></div>`;
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
    <a class="btn btn-sm btn-ghost" href="#/library/communication">${icon("chevronLeft")} Communication</a>
    <h1 class="page-title" style="margin-top:12px">${esc(title)}</h1>
    <p class="page-lede">${sub === "emails" ? "Emails related to " + esc(portal.client.name) + ", synced from Gmail." : sub === "meetings" ? "Meetings related to " + esc(portal.client.name) + ", synced from Google Calendar." : "All comments left on projects, scenes, and library records."}</p>
    <section class="section">${body}</section>
    ${communications ? sourceNote(communications.source) : ""}
  </div>`;

  return { crumb: "Library · Communication", title, html };
}

/* Email rendering — preview (compact) and full (expandable). */
function emailPreviewRow(e) {
  return `<a class="comm-preview-row card-link" href="#/library/communication/emails">
    ${icon("mail")}
    <div>
      <div class="comm-title">${esc(e.subject)}</div>
      <div class="comm-meta">${esc(e.from?.replace(/<.*>/, "").trim() || "")} · ${esc(e.dateLabel || "")}</div>
    </div>
    ${cardAction("View emails")}
  </a>`;
}

function emailFullRow(e) {
  const fromName = e.from?.replace(/<.*>/, "").trim() || e.from || "";
  const toShort = (e.to || "").split(",").map((s) => s.replace(/<.*>/, "").trim()).join(", ");
  return `<details class="email-card">
    <summary class="email-summary">
      <div class="email-head">
        <span class="email-from">${esc(fromName)}</span>
        <span class="email-date">${esc(e.dateLabel || "")}</span>
      </div>
      <div class="email-subject">${esc(e.subject)}</div>
      <div class="email-snippet">${esc(e.snippet)}</div>
    </summary>
    <div class="email-body">
      <dl class="kv">
        <dt>From</dt><dd>${esc(e.from || "")}</dd>
        <dt>To</dt><dd>${esc(toShort)}</dd>
        <dt>Date</dt><dd>${esc(e.date || "")}</dd>
      </dl>
      <div class="email-preview-text">${esc(e.preview)}</div>
    </div>
  </details>`;
}

/* Meeting rendering — preview (compact) and full. */
function meetingPreviewRow(m) {
  return `<a class="comm-preview-row card-link" href="#/library/communication/meetings">
    ${icon("users")}
    <div>
      <div class="comm-title">${esc(m.summary)}</div>
      <div class="comm-meta">${esc(m.startLabel || "")} ${m.upcoming ? "· Upcoming" : ""}</div>
    </div>
    ${cardAction("View meetings")}
  </a>`;
}

function meetingFullRow(m) {
  const attendees = (m.attendees || "").split(",").map((s) => s.trim()).filter(Boolean);
  return `<div class="meeting-card${m.upcoming ? " upcoming" : ""}">
    <div class="meeting-head">
      <div class="meeting-title">${esc(m.summary)}</div>
      ${m.upcoming ? '<span class="chip tone-info">Upcoming</span>' : ""}
    </div>
    <div class="meeting-time">${esc(m.startLabel || "")} — ${esc(m.endLabel || "")}</div>
    ${attendees.length ? `<div class="meeting-attendees">${icon("users")} ${attendees.map((a) => esc(a)).join(", ")}</div>` : ""}
    ${m.location ? `<div class="meeting-location">${icon("external")} ${esc(m.location)}</div>` : ""}
    ${m.htmlLink ? `<a class="btn btn-sm btn-outline" href="${esc(m.htmlLink)}" target="_blank" rel="noopener">${icon("external")} Google Calendar</a>` : ""}
  </div>`;
}

/* Quicklinks page — living research links with explanations. */
function renderQuicklinks(data) {
  const { quicklinks, portal } = data;
  if (!quicklinks) return { crumb: "Library", title: "Research Quicklinks", html: `<div class="page"><div class="empty-state">${icon("external")}<p>Quicklinks not available.</p><a class="btn btn-outline" href="#/library">Back to Library</a></div></div>` };

  const tierLabel = (t) => t === 1 ? "Primary source" : t === 2 ? "Independent benchmark" : t === 3 ? "Academic research" : "Discovery tool";
  const tierTone = (t) => t === 1 ? "tone-ok" : t === 2 ? "tone-info" : t === 3 ? "tone-neutral" : "tone-warn";

  const links = quicklinks.links.map((l) => `<div class="card quicklink-card">
    <div class="quicklink-head">
      <h3 class="quicklink-title">${esc(l.title)}</h3>
      ${chip(tierLabel(l.tier))}
    </div>
    <span class="quicklink-category">${esc(l.category)}</span>
    <p class="reading">${esc(l.description)}</p>
    <div class="quicklink-when">
      <span class="muted">${icon("target")} When to use</span>
      <p class="reading">${esc(l.whenToUse)}</p>
    </div>
    ${l.url ? `<a class="btn btn-sm btn-outline" href="${esc(l.url)}" target="_blank" rel="noopener">${icon("external")} Visit source</a>` : `<span class="muted">${icon("book")} Referenced directly from vendor publications</span>`}
  </div>`).join("");

  const html = `<div class="page">
    <a class="btn btn-sm btn-ghost" href="#/library">${icon("chevronLeft")} Library</a>
    <h1 class="page-title" style="margin-top:12px">${esc(quicklinks.title)}</h1>
    <p class="page-lede">${esc(quicklinks.description)}</p>
    <section class="section"><div class="quicklink-grid">${links}</div></section>
    ${sourceNote(quicklinks.source)}
  </div>`;

  return { crumb: "Library", title: quicklinks.title, html };
}
