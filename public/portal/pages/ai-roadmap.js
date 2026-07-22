/* AI Roadmap — redesigned as a visual partnership roadmap with a 12-month
   infographic at the top, a value summary strip, and the simplified capability
   list below. The infographic shows the ongoing Third i-client relationship:
   monthly deliverables, milestone expansions, and long-term value. */
import { esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { motif, sourceNote } from "../components/cards.js";

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
    <div class="milestone-body">
      <div class="milestone-top">
        <span class="milestone-title">${esc(ms.title)}</span>
        ${freeBadge}
      </div>
      <span class="milestone-month">Month ${ms.month}</span>
      <div class="milestone-desc">${esc(ms.description)}</div>
    </div>
  </div>`;
}

/* ─── Service catalog (planned AI roadmap of services) — clean divider lists ── */

function scBillingBadge(billing) {
  if (billing === "free") return '<span class="sc-billing free">Free · unbillable</span>';
  return "";
}

/* Sort items: planned first, then recommended, then the rest. */
function sortItems(items) {
  const rank = (i) => i.status === "planned" ? 0 : i.status === "recommended" ? 1 : 2;
  return [...items].sort((a, b) => rank(a) - rank(b));
}

/* A single clean service row — title + description, no per-item box. Highest-ROI
   services are outlined: green = planned, yellow = recommended for the client. */
function scRow(item) {
  const statusClass = item.status === "planned" ? "sc-planned" : item.status === "recommended" ? "sc-recommended" : "";
  const tag = item.status === "planned" ? '<span class="sc-tag planned">Planned</span>'
    : item.status === "recommended" ? '<span class="sc-tag recommended">Recommended</span>' : "";
  return `<div class="sc-row ${statusClass}">
    <span class="sc-row-title">${esc(item.title)}${tag}</span>
    <span class="sc-row-desc">${esc(item.description)}</span>
  </div>`;
}

/* Category header — icon, title + billing badge, description. */
function scHeader(catData) {
  return `<div class="sc-head">
    <span class="sc-icon">${icon(catData.icon || "dot")}</span>
    <div class="sc-head-text">
      <div class="sc-head-top"><h3 class="section-title">${esc(catData.title)}</h3>${scBillingBadge(catData.billing)}</div>
      <p class="sc-desc">${esc(catData.description)}</p>
    </div>
  </div>`;
}

/* Flat category: header + one clean divider list of services (sorted). */
function scListSection(catData, catKey) {
  return `<section class="section sc-section" data-cat="${catKey}">
    ${scHeader(catData)}
    <div class="sc-list">${sortItems(catData.items || []).map(scRow).join("")}</div>
  </section>`;
}

/* Subcategorized category (AI Implementation): header + labeled groups, each a
   clean divider list with an optional group description. Items sorted by status. */
function scSubcatSection(catData, catKey) {
  const subcats = (catData.subcategories || []).map((sub) => `<div class="sc-subcat">
    <h4 class="sc-subcat-title">${esc(sub.title)}</h4>
    ${sub.description ? `<p class="sc-subcat-desc">${esc(sub.description)}</p>` : ""}
    <div class="sc-list">${sortItems(sub.items || []).map(scRow).join("")}</div>
  </div>`).join("");
  return `<section class="section sc-section" data-cat="${catKey}">
    ${scHeader(catData)}
    ${subcats}
  </section>`;
}

export function render(data) {
  const { aiRoadmap: ai, portal, roadmap, invoicing } = data;
  const ex = ai.executiveSummary;
  const sc = invoicing && invoicing.serviceCatalog;

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

  // Service catalog — the planned roadmap of services Third i can work into the
  // partnership. Highest-ROI services are outlined: green = planned, yellow =
  // recommended for the client.
  const catalogHtml = sc ? `<section class="section sc-intro">
    <div class="section-head"><h2 class="section-title">Services &amp; capabilities</h2></div>
    <p class="reading">A planned roadmap of everything Third i can work into the ${esc(portal.client.name)} partnership for longer-lasting, more valuable collaboration. Highlighted services are the highest-ROI opportunities.</p>
    <div class="sc-legend">
      <span class="sc-legend-item"><span class="sc-legend-swatch planned"></span>Planned — services Third i is planning to add</span>
      <span class="sc-legend-item"><span class="sc-legend-swatch recommended"></span>Recommended — high-ROI services worth considering</span>
    </div>
  </section>
  ${scSubcatSection(sc.aiImplementation, "aiImplementation")}
  ${scListSection(sc.valueAudit, "valueAudit")}
  ${scListSection(sc.partnershipExtension, "partnershipExtension")}` : "";

  const html = `<div class="page">
    <h1 class="page-title">AI Roadmap</h1>
    <p class="page-lede">A planned and recommended AI roadmap for ${esc(portal.client.name)} — backed by real results, independent research, and an ongoing partnership that gets smarter every month. Not just films, but AI worked into daily operations, marketing, and automation across the whole business.</p>

    <section class="section">
      <div class="ai-hero-summary">
        <div class="card ai-hero-card">
          ${motif("rings")}
          <span class="eyebrow">Planned AI roadmap</span>
          <h2 class="section-title" style="margin:8px 0 14px">Where ${esc(portal.client.shortName)} stands today</h2>
          <p class="reading">${esc(ex.currentState)}</p>
          <div class="ai-hero-points">
            <div class="ai-hero-point">
              <span class="ai-hero-point-icon">${icon("target")}</span>
              <div><span class="ai-hero-point-label">Top improvement</span><p class="reading">${esc(ex.topImprovement)}</p></div>
            </div>
            <div class="ai-hero-point">
              <span class="ai-hero-point-icon">${icon("lightbulb")}</span>
              <div><span class="ai-hero-point-label">Recommendation</span><p class="reading">${esc(ex.recommendation)}</p></div>
            </div>
            ${ex.risks ? `<div class="ai-hero-point">
              <span class="ai-hero-point-icon">${icon("alert")}</span>
              <div><span class="ai-hero-point-label">Risk checkpoints</span><p class="reading">${esc(ex.risks)}</p></div>
            </div>` : ""}
          </div>
        </div>
        <div class="card ai-hero-side">
          <span class="eyebrow">Backed by</span>
          <div class="ai-backed-stats">
            <div class="ai-backed-stat"><span class="ai-backed-num">4</span><span class="ai-backed-label">films completed by Third i</span></div>
            <div class="ai-backed-stat"><span class="ai-backed-num">614</span><span class="ai-backed-label">hours across all clients</span></div>
            <div class="ai-backed-stat"><span class="ai-backed-num">1000s</span><span class="ai-backed-label">of sources researched and interpreted by R&amp;D agents</span></div>
          </div>
          <p class="reading" style="margin-top:12px">${esc(ex.positioning)}</p>
          <p class="muted" style="margin-top:10px">${icon("clock")} Research as of ${fmtDate(ai.researchAsOf)}. Reviewed at least monthly while a recommendation is active.</p>
        </div>
      </div>
    </section>

    ${roadmapHtml}

    ${catalogHtml}
  </div>`;

  return { crumb: portal.client.shortName, title: "AI Roadmap", html };
}
