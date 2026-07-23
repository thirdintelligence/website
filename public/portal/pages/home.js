/* Home / Today — the relationship control surface (plan 04). */
import { h, esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statStrip, actionItem, projectCard, band, motif, sourceNote, cardAction } from "../components/cards.js";
import { activityFeed, commentThread } from "../components/feed.js";

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
  const valueStrip = invoicing ? `<section class="section value-strip-section">
    <div class="ai-value-strip">
      <div class="ai-value-stat"><span class="ai-value-num">${invoicing.metrics.projectsActive.count}</span><span class="ai-value-label">${esc(invoicing.metrics.projectsActive.descriptor)}</span></div>
      <div class="ai-value-stat"><span class="ai-value-num">${invoicing.metrics.hoursInvested.hours}</span><span class="ai-value-label">hours</span></div>
      <div class="ai-value-stat"><span class="ai-value-num">${invoicing.metrics.deliverablesCompleted.count}/10</span><span class="ai-value-label">deliverables</span></div>
      <div class="ai-value-stat"><span class="ai-value-num">${invoicing.metrics.capabilitiesDelivered.count}</span><span class="ai-value-label">capabilities</span></div>
      <div class="ai-value-actions">
        <a class="btn btn-sm btn-outline" href="#/value-results">View results ${icon("arrowRight")}</a>
        <a class="btn btn-sm btn-outline" href="#/ai-roadmap">View roadmap ${icon("arrowRight")}</a>
      </div>
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

    ${communicationsPreview(communications, live)}

    ${roadmapPreview(roadmap)}

    <section class="section">
      <div class="section-head"><h2 class="section-title">Recently completed</h2></div>
      ${completed.length
        ? commentThread(completed, null, projects?.projects || [])
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

/* Communications preview — shows recent comments + emails + meetings on the
   home page. Clicking any item navigates to the full page. */
function communicationsPreview(communications, live) {
  if (!communications) return "";
  const comments = (live?.comments || []).slice(0, 3);
  const emails = (communications.emails || []).slice(0, 3);
  const meetings = (communications.meetings || []).slice(0, 3);
  if (!comments.length && !emails.length && !meetings.length) return "";

  const commentItems = comments.map((c) => `<a class="comm-prev-item card-link" href="#/communications/comments">
    ${icon("comment")}
    <div class="comm-prev-body">
      <div class="comm-prev-title">${esc(c.title || c.text?.substring(0, 60) || "Comment")}</div>
      <div class="comm-prev-meta">${esc(c.attribution || "Client commented")} · ${esc(c.createdAt?.split("T")[0] || "")}</div>
    </div>
  </a>`).join("");

  const emailItems = emails.map((e) => `<a class="comm-prev-item card-link" href="#/communications/emails">
    ${icon("mail")}
    <div class="comm-prev-body">
      <div class="comm-prev-title">${esc(e.subject)}</div>
      <div class="comm-prev-meta">${esc(e.from?.replace(/<.*>/, "").trim() || "")} · ${esc(e.dateLabel || "")}</div>
    </div>
  </a>`).join("");

  const meetingItems = meetings.map((m) => `<a class="comm-prev-item card-link" href="#/communications/meetings">
    ${icon("users")}
    <div class="comm-prev-body">
      <div class="comm-prev-title">${esc(m.summary)}</div>
      <div class="comm-prev-meta">${esc(m.startLabel || "")} ${m.upcoming ? "· Upcoming" : ""}</div>
    </div>
  </a>`).join("");

  return `<section class="section">
    <div class="section-head"><h2 class="section-title">Recent communications</h2>
      <a class="btn btn-sm btn-ghost" href="#/communications">View all ${icon("arrowRight")}</a></div>
    <div class="comm-prev-grid">
      ${comments.length ? `<div class="comm-prev-col"><div class="comm-prev-col-head">${icon("comment")} Comments (${live.comments.length})</div>${commentItems}</div>` : ""}
      ${emails.length ? `<div class="comm-prev-col"><div class="comm-prev-col-head">${icon("mail")} Emails (${communications.emails.length})</div>${emailItems}</div>` : ""}
      ${meetings.length ? `<div class="comm-prev-col"><div class="comm-prev-col-head">${icon("users")} Meetings (${communications.meetings.length})</div>${meetingItems}</div>` : ""}
    </div>
  </section>`;
}

/* Roadmap preview — condensed 12-month infographic on the home page, clickable
   to the full AI Roadmap page. Shows the partnership plan at a glance.

   Each month is a circle with a film icon. Milestone months (2, 4, 6, 8, 10,
   12) have a second circle connected below with the milestone's icon. Rings
   are color-coded: blue = current, purple = AI implementation, yellow = value
   audit, green = extend partnership, grey = film production. */
const MILESTONE_META = {
  "AI Implementation": { icon: "worktree", ring: "ai" },
  "Value Audit": { icon: "graph", ring: "audit" },
  "Extend Partnership": { icon: "contract", ring: "extend" },
};

function roadmapPreview(roadmap) {
  if (!roadmap || !roadmap.months) return "";
  const allMonths = roadmap.months;
  /* Map month number → milestone metadata for quick lookup. */
  const msByMonth = {};
  (roadmap.milestones || []).forEach((ms) => { msByMonth[ms.month] = ms; });

  /* Build each month node: a column with month label, film circle, and
     optionally a milestone circle connected below. */
  const monthNodes = allMonths.map((m) => {
    const statusClass = m.status === "done" ? "done" : m.status === "current" ? "current" : "upcoming";
    const abbr = m.label.split(" ")[0].slice(0, 3).toUpperCase();
    const ms = msByMonth[m.month];
    const msMeta = ms ? MILESTONE_META[ms.title] : null;

    return `<div class="rmonth ${statusClass}">
      <span class="rmonth-abbr">${esc(abbr)}</span>
      <div class="rcircle rc-film ${statusClass === "current" ? "ring-current" : "ring-film"}" title="${esc(m.label)} — Film production">
        ${icon("film", "rc-icon")}
      </div>
      ${ms && msMeta ? `<div class="rc-connector"></div>
        <div class="rcircle rc-ms ring-${msMeta.ring}" title="${esc(ms.title)} (M${ms.month})">
          ${icon(msMeta.icon, "rc-icon")}
        </div>` : `<div class="rc-spacer"></div>`}
    </div>`;
  }).join("");

  /* Legend: film production + each milestone type. */
  const legend = `<div class="rlegend">
    <span class="rlegend-item"><span class="rcircle rc-film ring-current rc-sm">${icon("film", "rc-icon")}</span>Film production</span>
    <span class="rlegend-item"><span class="rcircle rc-ms ring-ai rc-sm">${icon("worktree", "rc-icon")}</span>AI implementation</span>
    <span class="rlegend-item"><span class="rcircle rc-ms ring-audit rc-sm">${icon("graph", "rc-icon")}</span>Value audit</span>
    <span class="rlegend-item"><span class="rcircle rc-ms ring-extend rc-sm">${icon("contract", "rc-icon")}</span>Extend partnership</span>
  </div>`;

  return `<section class="section">
    <div class="section-head"><h2 class="section-title">Partnership roadmap</h2>
      <a class="btn btn-sm btn-ghost" href="#/ai-roadmap">Full roadmap ${icon("arrowRight")}</a></div>
    <a class="card roadmap-prev-card card-link" href="#/ai-roadmap">
      ${motif("rings")}
      <div class="roadmap-prev-lede">${esc(roadmap.cadence.deliverable)} per month · 12-month partnership plan</div>
      <div class="roadmap-prev-timeline">${monthNodes}</div>
      ${legend}
    </a>
  </section>`;
}
