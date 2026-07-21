/* AI Roadmap — redesigned as a visual partnership roadmap with a 12-month
   infographic at the top, a value summary strip, and the simplified capability
   list below. The infographic shows the ongoing Third i-client relationship:
   monthly deliverables, milestone expansions, and long-term value. */
import { esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statusLabel, band, chip, motif, sourceNote } from "../components/cards.js";
import { addCommentButton } from "../components/feed.js";

const STATUS_TONE = { active: "ok", partial: "warn", "not-in-use": "neutral", "needs-confirmation": "warn", "recommended-experiment": "info" };
const STATUS_TEXT = { active: "Active / confirmed", partial: "Partial / in progress", "not-in-use": "Not in use", "needs-confirmation": "Needs confirmation", "recommended-experiment": "Recommended experiment" };

/* Illustrated SVG scene for each month card in the infographic. Each type gets
   a custom mini-illustration (not a generic icon) to make the roadmap visually
   beautiful and immediately readable. */
const SCENE_SVG = {
  film: (label) => `<svg class="roadmap-scene" viewBox="0 0 120 80" fill="none" aria-hidden="true">
    <rect x="10" y="12" width="100" height="56" rx="4" stroke="var(--accent)" stroke-width="1.5" opacity="0.4"/>
    <rect x="10" y="12" width="100" height="56" rx="4" fill="var(--accent)" opacity="0.06"/>
    <circle cx="60" cy="40" r="14" stroke="var(--accent)" stroke-width="1.5"/>
    <path d="M56 35v10l8-5Z" fill="var(--accent)" opacity="0.7"/>
    <rect x="14" y="16" width="4" height="4" rx="1" fill="var(--accent)" opacity="0.4"/>
    <rect x="102" y="16" width="4" height="4" rx="1" fill="var(--accent)" opacity="0.4"/>
    <rect x="14" y="60" width="4" height="4" rx="1" fill="var(--accent)" opacity="0.4"/>
    <rect x="102" y="60" width="4" height="4" rx="1" fill="var(--accent)" opacity="0.4"/>
    <text x="60" y="76" text-anchor="middle" font-size="7" fill="var(--text-muted)" font-family="system-ui">${esc(label || "")}</text>
  </svg>`,
  "ai-workflows": () => `<svg class="roadmap-scene" viewBox="0 0 120 80" fill="none" aria-hidden="true">
    <circle cx="40" cy="30" r="12" stroke="var(--accent)" stroke-width="1.5"/>
    <circle cx="80" cy="30" r="12" stroke="var(--accent)" stroke-width="1.5"/>
    <circle cx="60" cy="55" r="12" stroke="var(--accent)" stroke-width="1.5"/>
    <path d="M40 30 60 55M80 30 60 55M40 30 80 30" stroke="var(--accent)" stroke-width="1" opacity="0.5" stroke-dasharray="2 2"/>
    <circle cx="40" cy="30" r="3" fill="var(--accent)" opacity="0.6"/>
    <circle cx="80" cy="30" r="3" fill="var(--accent)" opacity="0.6"/>
    <circle cx="60" cy="55" r="3" fill="var(--accent)" opacity="0.6"/>
    <path d="M30 15l3 3 3-3M74 15l3 3 3-3" stroke="var(--accent)" stroke-width="1" opacity="0.4"/>
  </svg>`,
  "value-audit": () => `<svg class="roadmap-scene" viewBox="0 0 120 80" fill="none" aria-hidden="true">
    <path d="M15 65V45M35 65V25M55 65V35M75 65V15M95 65V30" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
    <path d="M15 45 35 25 55 35 75 15 95 30" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" opacity="0.5" stroke-dasharray="3 2"/>
    <circle cx="15" cy="45" r="2.5" fill="var(--accent)"/>
    <circle cx="35" cy="25" r="2.5" fill="var(--accent)"/>
    <circle cx="55" cy="35" r="2.5" fill="var(--accent)"/>
    <circle cx="75" cy="15" r="2.5" fill="var(--accent)"/>
    <circle cx="95" cy="30" r="2.5" fill="var(--accent)"/>
    <path d="M10 68h100" stroke="var(--text-muted)" stroke-width="0.5" opacity="0.3"/>
  </svg>`,
  expansion: () => `<svg class="roadmap-scene" viewBox="0 0 120 80" fill="none" aria-hidden="true">
    <circle cx="60" cy="40" r="22" stroke="var(--accent)" stroke-width="1.5" opacity="0.3"/>
    <circle cx="60" cy="40" r="14" stroke="var(--accent)" stroke-width="1.5" opacity="0.5"/>
    <circle cx="60" cy="40" r="7" fill="var(--accent)" opacity="0.15" stroke="var(--accent)" stroke-width="1.5"/>
    <path d="M60 18v6M60 56v6M38 40h6M78 40h6M44 24l4 4M72 52l4 4M76 24l-4 4M48 52l-4 4" stroke="var(--accent)" stroke-width="1" opacity="0.4"/>
    <path d="M52 36h16M52 40h16M52 44h12" stroke="var(--accent)" stroke-width="1" opacity="0.5"/>
  </svg>`,
  partnership: () => `<svg class="roadmap-scene" viewBox="0 0 120 80" fill="none" aria-hidden="true">
    <rect x="25" y="15" width="70" height="50" rx="3" stroke="var(--accent)" stroke-width="1.5"/>
    <rect x="25" y="15" width="70" height="50" rx="3" fill="var(--accent)" opacity="0.06"/>
    <path d="M35 28h30M35 35h40M35 42h35M35 49h25" stroke="var(--accent)" stroke-width="1" opacity="0.5"/>
    <path d="M70 58l3 3 6-6" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="70" cy="58" r="8" fill="var(--accent)" opacity="0.1" stroke="var(--accent)" stroke-width="1"/>
  </svg>`,
  other: () => `<svg class="roadmap-scene" viewBox="0 0 120 80" fill="none" aria-hidden="true">
    <circle cx="60" cy="40" r="18" stroke="var(--accent)" stroke-width="1.5" opacity="0.4"/>
    <circle cx="60" cy="40" r="3" fill="var(--accent)" opacity="0.6"/>
  </svg>`
};

function monthCard(month, cadence) {
  const statusClass = month.status === "done" ? "done" : month.status === "current" ? "current" : "upcoming";
  const items = month.items.map((item) => {
    const svg = (SCENE_SVG[item.type] || SCENE_SVG.other)(item.type === "film" ? cadence.amount : "");
    return `<div class="roadmap-item ${item.milestone ? "milestone" : ""} ${statusClass}">
      ${svg}
      <div class="roadmap-item-title">${esc(item.title)}</div>
      <div class="roadmap-item-desc">${esc(item.description)}</div>
      ${item.milestone ? '<span class="roadmap-milestone-badge">Milestone</span>' : ""}
    </div>`;
  }).join("");
  return `<div class="roadmap-month ${statusClass}" data-month="${month.month}">
    <div class="roadmap-month-label">${esc(month.label)}</div>
    <div class="roadmap-month-items">${items}</div>
  </div>`;
}

function milestoneCallout(ms) {
  const iconName = ms.icon || "dot";
  const freeBadge = ms.free ? '<span class="milestone-free">Free</span>' : "";
  return `<div class="milestone-callout">
    <span class="milestone-icon">${icon(iconName)}</span>
    <span class="milestone-month">Month ${ms.month}</span>
    <div class="milestone-content">
      <div class="milestone-title">${esc(ms.title)} ${freeBadge}</div>
      <div class="milestone-desc">${esc(ms.description)}</div>
    </div>
  </div>`;
}

function cap(c) {
  return `<article class="card cap" id="${esc(c.id)}">
    ${motif("glow")}
    <div class="cap-head">
      <div><div class="cap-name">${esc(c.name)}</div></div>
      ${statusLabel(STATUS_TEXT[c.status] || c.status, STATUS_TONE[c.status])}
    </div>
    <p class="reading">${esc(c.outcome)}</p>
    <div class="cap-bands">${band("Value", c.value)}${band("Effort", c.effort)}<span class="band">Evidence <b>${esc(c.evidence)}</b></span></div>
    <p class="cap-rec"><b>Recommendation:</b> ${esc(c.recommendation)}</p>
    ${c.service && c.service.investment ? `<p class="muted">${icon("clock")} ${esc(c.service.investment)}</p>` : ""}
    <div class="pc-meta">${addCommentButton({ scope: "ai-roadmap", recordId: c.id, label: c.name, route: "/bkwatch/ai-roadmap" })}</div>
    ${sourceNote(c.source)}
  </article>`;
}

export function render(data) {
  const { aiRoadmap: ai, portal, roadmap } = data;
  const ex = ai.executiveSummary;
  const byCat = (id) => ai.capabilities.filter((c) => c.category === id);

  // Value summary strip — reframes the page from technical assessment → value showcase.
  const activeCount = ai.capabilities.filter((c) => c.status === "active").length;
  const notInUseCount = ai.capabilities.filter((c) => c.status === "not-in-use").length;
  const highValueCount = ai.capabilities.filter((c) => c.value === "High").length;

  const roadmapHtml = roadmap ? `<section class="section roadmap-section">
    <div class="section-head">
      <h2 class="section-title">Partnership roadmap</h2>
      <span class="muted">12-month plan · ${esc(roadmap.cadence.deliverable)} per month</span>
    </div>
    <p class="reading" style="margin-bottom:20px">This is Third i's plan for ${esc(portal.client.name)} over the next year — not just one project, but an ongoing partnership that grows in value each month.</p>

    ${(roadmap.milestones && roadmap.milestones.length) ? `<div class="milestone-callouts">${roadmap.milestones.map(milestoneCallout).join("")}</div>` : ""}

    <div class="roadmap-timeline">
      ${roadmap.months.map((m) => monthCard(m, roadmap.cadence)).join("")}
    </div>
  </section>` : "";

  const html = `<div class="page">
    <h1 class="page-title">AI Roadmap</h1>
    <p class="page-lede">Practical, research-backed AI guidance for ${esc(portal.client.name)}. Third i evaluates the workflow first and the tool second.</p>

    <section class="section">
      <div class="ai-value-strip">
        <div class="ai-value-stat"><span class="ai-value-num">${ai.capabilities.length}</span><span class="ai-value-label">capabilities assessed</span></div>
        <div class="ai-value-stat"><span class="ai-value-num">${activeCount}</span><span class="ai-value-label">active today</span></div>
        <div class="ai-value-stat"><span class="ai-value-num">${highValueCount}</span><span class="ai-value-label">high-value opportunities</span></div>
        <div class="ai-value-stat"><span class="ai-value-num">${notInUseCount}</span><span class="ai-value-label">ready to explore</span></div>
      </div>
    </section>

    ${roadmapHtml}

    <section class="section">
      <div class="ai-exec">
        <div class="card">
          ${motif("rings")}
          <span class="eyebrow">Executive summary</span>
          <h2 class="section-title" style="margin:8px 0 12px">Where ${esc(portal.client.shortName)} is today</h2>
          <p class="reading">${esc(ex.currentState)}</p>
          <dl class="kv" style="margin-top:16px">
            <dt>Top improvement</dt><dd>${esc(ex.topImprovement)}</dd>
            ${ex.risks ? `<dt>Risks</dt><dd>${esc(ex.risks)}</dd>` : ""}
            <dt>Recommendation</dt><dd>${esc(ex.recommendation)}</dd>
          </dl>
          ${sourceNote(ex.source)}
        </div>
        <div class="card">
          <span class="eyebrow">Positioning</span>
          <p class="reading" style="margin-top:8px">${esc(ex.positioning)}</p>
          <p class="muted" style="margin-top:12px">${icon("clock")} Research as of ${fmtDate(ai.researchAsOf)}. Rankings reviewed at least monthly while a recommendation is active.</p>
          <div class="source-legend">${ai.sources.map((s) => `<span>${icon("external")} ${esc(s.name)}</span>`).join("")}</div>
        </div>
      </div>
    </section>

    ${ai.categories.map((cat) => {
      const caps = byCat(cat.id);
      if (!caps.length) return "";
      return `<section class="ai-cat">
        <div class="ai-cat-head"><h2 class="section-title">${esc(cat.title)}</h2><span class="muted">${caps.length} capabilities</span></div>
        <div class="cap-grid">${caps.map(cap).join("")}</div>
      </section>`;
    }).join("")}
  </div>`;

  return { crumb: portal.client.shortName, title: "AI Roadmap", html };
}
