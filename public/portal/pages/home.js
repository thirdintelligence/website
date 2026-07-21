/* Home / Today — the relationship control surface (plan 04). */
import { h, esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statStrip, actionItem, projectCard, band, motif, sourceNote } from "../components/cards.js";
import { activityFeed, commentThread, addCommentButton } from "../components/feed.js";

export function render(data, _params) {
  const { home, portal, projects, live, invoicing, communications, roadmap } = data;
  const rel = portal.relationship;
  const completed = (live.comments || []).filter((c) => c.status === "completed");

  const opp = (o) => `<article class="card">
    ${motif("glow")}
    <div class="pc-meta"><span class="eyebrow">Opportunity</span></div>
    <h3 class="pc-title">${esc(o.title)}</h3>
    <p class="reading">${esc(o.outcome)}</p>
    <p class="reading muted">${esc(o.why)}</p>
    <div class="cap-bands">${band("Value", o.value)}${band("Effort", o.effort)}${o.evidence ? `<span class="band">Evidence <b>${esc(o.evidence)}</b></span>` : ""}</div>
    <p class="cap-rec"><b>Third i recommends:</b> ${esc(o.recommendation)}</p>
    <div class="pc-meta">${o.link ? `<a class="btn btn-sm btn-outline" href="#${o.link.replace(/^\/bkwatch/, "")}">Explore ${icon("arrowRight")}</a>` : ""}</div>
    ${sourceNote(o.source)}
  </article>`;

  // Value summary strip — shows momentum at a glance.
  const valueStrip = invoicing ? `<section class="section">
    <div class="ai-value-strip">
      <a class="ai-value-stat" href="#/value-results"><span class="ai-value-num">${invoicing.metrics.projectsActive.count}</span><span class="ai-value-label">${esc(invoicing.metrics.projectsActive.descriptor)}</span></a>
      <a class="ai-value-stat" href="#/value-results"><span class="ai-value-num">${invoicing.metrics.hoursInvested.hours}</span><span class="ai-value-label">hours invested</span></a>
      <a class="ai-value-stat" href="#/value-results"><span class="ai-value-num">${invoicing.metrics.capabilitiesDelivered.count}</span><span class="ai-value-label">capabilities delivered</span></a>
      <a class="ai-value-stat" href="#/ai-roadmap"><span class="ai-value-num">12-month</span><span class="ai-value-label">partnership plan</span></a>
    </div>
  </section>` : "";

  const html = `<div class="page stagger">
    <section class="relationship">
      ${motif("rings")}
      <span class="eyebrow">${esc(portal.client.name)} × ${esc(portal.client.partner)}</span>
      <h1 class="r-mission">${esc(rel.mission)}</h1>
      <p class="r-summary">${esc(rel.summary)}</p>
      <div class="r-meta">
        <span><span class="k">Phase:</span> ${esc(rel.phase)}</span>
        ${addCommentButton({ scope: "home", label: "General comment" }, "Add Comment", "btn-sm btn-outline add-comment")}
      </div>
    </section>

    ${valueStrip}

    <section class="section">
      <div class="section-head"><h2 class="section-title">Needs your attention</h2></div>
      ${home.needsAttention.length
        ? `<div>${home.needsAttention.map(actionItem).join("")}</div>`
        : `<div class="empty-state">${icon("checkCircle")}<p>Nothing needs your attention right now.</p></div>`}
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">Active work</h2>
        <a class="btn btn-sm btn-ghost" href="#/projects">All projects ${icon("arrowRight")}</a></div>
      <div class="project-list">
        ${projects.projects.filter((p) => p.status === "active").map((p) => projectCard(p, `#/projects/${p.slug}`)).join("")}
      </div>
    </section>

    ${communicationsPreview(communications)}

    ${roadmapPreview(roadmap)}

    <section class="section">
      <div class="section-head"><h2 class="section-title">Recently completed</h2></div>
      ${completed.length
        ? commentThread(completed)
        : `<div class="empty-state">${icon("check")}<p>Completed actions will appear here once Third i marks a comment complete.</p></div>`}
    </section>

    <section class="section cols-2">
      <div>
        <div class="section-head"><h2 class="section-title">Relationship activity</h2></div>
        ${activityFeed(home.activity)}
      </div>
      <div>
        <div class="section-head"><h2 class="section-title">Next opportunities</h2></div>
        <div class="grid">${home.opportunities.map(opp).join("")}</div>
      </div>
    </section>
  </div>`;

  return { crumb: portal.client.shortName, title: "Home", html };
}

/* Communications preview — shows recent emails + meetings on the home page,
   separate from comments. Clicking any item navigates to the full page. */
function communicationsPreview(communications) {
  if (!communications) return "";
  const emails = (communications.emails || []).slice(0, 3);
  const meetings = (communications.meetings || []).slice(0, 3);
  if (!emails.length && !meetings.length) return "";

  const emailItems = emails.map((e) => `<a class="comm-prev-item" href="#/library/communication/emails">
    ${icon("mail")}
    <div class="comm-prev-body">
      <div class="comm-prev-title">${esc(e.subject)}</div>
      <div class="comm-prev-meta">${esc(e.from?.replace(/<.*>/, "").trim() || "")} · ${esc(e.dateLabel || "")}</div>
    </div>
  </a>`).join("");

  const meetingItems = meetings.map((m) => `<a class="comm-prev-item" href="#/library/communication/meetings">
    ${icon("users")}
    <div class="comm-prev-body">
      <div class="comm-prev-title">${esc(m.summary)}</div>
      <div class="comm-prev-meta">${esc(m.startLabel || "")} ${m.upcoming ? "· Upcoming" : ""}</div>
    </div>
  </a>`).join("");

  return `<section class="section">
    <div class="section-head"><h2 class="section-title">Recent communications</h2>
      <a class="btn btn-sm btn-ghost" href="#/library/communication">View all ${icon("arrowRight")}</a></div>
    <div class="comm-prev-grid">
      ${emails.length ? `<div class="comm-prev-col"><div class="comm-prev-col-head">${icon("mail")} Emails (${communications.emails.length})</div>${emailItems}</div>` : ""}
      ${meetings.length ? `<div class="comm-prev-col"><div class="comm-prev-col-head">${icon("users")} Meetings (${communications.meetings.length})</div>${meetingItems}</div>` : ""}
    </div>
  </section>`;
}

/* Roadmap preview — condensed 12-month infographic on the home page, clickable
   to the full AI Roadmap page. Shows the partnership plan at a glance. */
function roadmapPreview(roadmap) {
  if (!roadmap || !roadmap.months) return "";
  const months = roadmap.months.slice(0, 6); // Show first 6 months as preview
  const milestoneMonths = roadmap.months.filter((m) => m.items.some((i) => i.milestone)).map((m) => m.month);

  const monthDots = months.map((m) => {
    const hasMilestone = m.items.some((i) => i.milestone);
    const statusClass = m.status === "done" ? "done" : m.status === "current" ? "current" : "upcoming";
    return `<div class="rdot ${statusClass} ${hasMilestone ? "milestone" : ""}" title="${esc(m.label)}">
      <span class="rdot-label">${esc(m.label.split(" ")[0])}</span>
    </div>`;
  }).join("");

  const milestones = (roadmap.milestones || []).slice(0, 3).map((ms) => 
    `<div class="rmilestone"><span class="rmilestone-month">M${ms.month}</span><span class="rmilestone-title">${esc(ms.title)}</span></div>`
  ).join("");

  return `<section class="section">
    <div class="section-head"><h2 class="section-title">Partnership roadmap</h2>
      <a class="btn btn-sm btn-ghost" href="#/ai-roadmap">Full roadmap ${icon("arrowRight")}</a></div>
    <a class="card roadmap-prev-card" href="#/ai-roadmap">
      ${motif("rings")}
      <div class="roadmap-prev-lede">${esc(roadmap.cadence.deliverable)} per month · 12-month partnership plan</div>
      <div class="roadmap-prev-timeline">${monthDots}<span class="rdot more"><span class="rdot-label">+6</span></span></div>
      ${milestones ? `<div class="roadmap-prev-milestones">${milestones}</div>` : ""}
    </a>
  </section>`;
}
