/* Value & Results — shows the Third i-client relationship compounding value
   over time: momentum metrics, real financial data, efficiency trends, and a
   structured service catalog organized into 4 categories:
   A. AI Agents & Workflows (billable)
   B. Value Audit (free/unbillable)
   C. Partnership Extension Plans (free/unbillable)
   D. If We Don't Renew (last-resort options) */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { motif, sourceNote } from "../components/cards.js";

/* ─── Momentum cards ─────────────────────────────────────────────────────── */
function metricCard(m, iconName) {
  const value = typeof m.count === "number" ? m.count : m.hours || "—";
  const descriptor = m.descriptor || "";
  return `<div class="card metric-card">
    ${icon(iconName)}
    <div class="metric-value-row">
      <span class="metric-value">${value}</span>
      <span class="metric-descriptor">${esc(descriptor)}</span>
    </div>
    <div class="metric-label">${esc(m.label)}</div>
  </div>`;
}

/* ─── Efficiency trend bars ───────────────────────────────────────────────── */
function efficiencyBar(item, maxHours) {
  const pct = maxHours > 0 ? Math.round((item.hours / maxHours) * 100) : 0;
  return `<div class="eff-bar-row">
    <div class="eff-bar-label">${esc(item.project)}</div>
    <div class="eff-bar-track">
      <div class="eff-bar-fill" style="width:${pct}%"></div>
      <span class="eff-bar-hours">${item.hours} hrs</span>
    </div>
    ${item.note ? `<div class="eff-bar-note">${esc(item.note)}</div>` : ""}
  </div>`;
}

function crossClientSection(data) {
  const cc = data.invoicing.crossClientTraining;
  if (!cc) return "";
  return `<section class="section">
    <div class="section-head"><h2 class="section-title">Trained on prior work</h2></div>
    <div class="card" style="padding:var(--space-5) var(--space-6)">
      <p class="reading" style="margin-bottom:var(--space-4)">${esc(cc.description)}</p>
      <div class="cross-client-stats">
        <div class="cross-client-stat"><span class="cross-client-num">${cc.hoursLearnedFrom}</span><span class="cross-client-label">hours of accumulated learning</span></div>
        <div class="cross-client-stat"><span class="cross-client-num">${cc.filmsLearnedFrom}</span><span class="cross-client-label">completed films trained on</span></div>
      </div>
      <div class="eff-trend" style="margin-top:var(--space-5)">
        ${cc.trend.map((item) => efficiencyBar(item, 250)).join("")}
      </div>
      <p class="muted" style="margin-top:var(--space-4)">Each film builds on the last. The workflow learns the visual system, brand guidelines, and production techniques — so ${esc(data.portal.client.name)}'s films start from a higher baseline, not from zero.</p>
    </div>
  </section>`;
}

function financialSection(data) {
  const fin = data.invoicing.financialSummary;
  if (!fin) return "";
  const note = fin.note ? `<p class="muted" style="margin-top:var(--space-3)">${esc(fin.note)}</p>` : "";
  return `<section class="section">
    <div class="section-head"><h2 class="section-title">Financial summary</h2></div>
    <div class="ai-value-strip">
      <div class="ai-value-stat"><span class="ai-value-num">${esc(fin.formattedBilled)}</span><span class="ai-value-label">total billed</span></div>
      <div class="ai-value-stat"><span class="ai-value-num">${esc(fin.formattedPaid)}</span><span class="ai-value-label">total paid</span></div>
      ${fin.outstanding > 0 ? `<div class="ai-value-stat"><span class="ai-value-num">${esc(fin.formattedOutstanding)}</span><span class="ai-value-label">outstanding</span></div>` : ""}
      <div class="ai-value-stat"><span class="ai-value-num">${fin.totalHours}</span><span class="ai-value-label">total hours</span></div>
      ${fin.effectiveRate > 0 ? `<div class="ai-value-stat"><span class="ai-value-num">$${fin.effectiveRate}</span><span class="ai-value-label">effective rate/hr</span></div>` : ""}
    </div>
    ${note}
  </section>`;
}

/* ─── Service catalog sections ────────────────────────────────────────────── */

/* Billing badge shown next to a category title. */
function billingBadge(billing) {
  if (billing === "free") return '<span class="sc-billing free">Free · unbillable</span>';
  if (billing === "fallback") return '<span class="sc-billing fallback">Fallback option</span>';
  if (billing === "billable") return '<span class="sc-billing billable">Billable</span>';
  return "";
}

/* A single clean service row — title + description, no box. Rows are separated
   by hairline dividers inside a multi-column list, avoiding "card soup". */
function serviceRow(item) {
  return `<div class="sc-row">
    <span class="sc-row-title">${esc(item.title)}</span>
    <span class="sc-row-desc">${esc(item.description)}</span>
  </div>`;
}

/* Category header — icon, title + billing badge, description. */
function catHeader(cat) {
  return `<div class="sc-head">
    <span class="sc-icon">${icon(cat.icon || "dot")}</span>
    <div class="sc-head-text">
      <div class="sc-head-top"><h2 class="section-title">${esc(cat.title)}</h2>${billingBadge(cat.billing)}</div>
      <p class="sc-desc">${esc(cat.description)}</p>
    </div>
  </div>`;
}

/* Category A/B: header + one clean divider list of services. */
function serviceListSection(cat, catKey) {
  return `<section class="section sc-section" data-cat="${catKey}">
    ${catHeader(cat)}
    <div class="sc-list">${(cat.items || []).map(serviceRow).join("")}</div>
  </section>`;
}

/* Category C: header + labeled subcategory groups, each a clean divider list. */
function partnershipExtensionSection(cat) {
  const subcats = (cat.subcategories || []).map((sub) => `<div class="sc-subcat">
    <h3 class="sc-subcat-title">${esc(sub.title)}</h3>
    <div class="sc-list">${(sub.items || []).map(serviceRow).join("")}</div>
  </div>`).join("");
  return `<section class="section sc-section" data-cat="partnershipExtension">
    ${catHeader(cat)}
    ${subcats}
  </section>`;
}

/* Category D: last-resort options, muted and set apart at the bottom. */
function lastResortSection(cat) {
  return `<section class="section sc-section sc-lastresort" data-cat="lastResort">
    ${catHeader(cat)}
    <div class="sc-list">${(cat.items || []).map(serviceRow).join("")}</div>
  </section>`;
}

export function render(data) {
  const { invoicing, portal } = data;
  if (!invoicing) return { crumb: portal.client.shortName, title: "Value & Results", html: '<div class="page"><div class="empty-state">Value data not available.</div></div>' };
  const m = invoicing.metrics;
  const nar = invoicing.narrative;
  const sc = invoicing.serviceCatalog;

  const html = `<div class="page">
    <section class="vr-hero">
      ${motif("rings")}
      <span class="eyebrow">${esc(portal.client.name)} × Third i</span>
      <h1 class="page-title">Value &amp; Results</h1>
      <p class="page-lede">${esc(nar.summary)}</p>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">Momentum</h2></div>
      <div class="metric-grid">
        ${metricCard(m.projectsActive, "film")}
        ${metricCard(m.deliverablesCompleted, "checkCircle")}
        ${metricCard(m.hoursInvested, "clock")}
        ${metricCard(m.capabilitiesDelivered, "sparkles")}
      </div>
    </section>

    ${financialSection(data)}

    ${crossClientSection(data)}

    <section class="section vr-narrative">
      <div class="section-head"><h2 class="section-title">How the relationship grows</h2></div>
      <div class="vr-narrative-grid">
        <div class="card vr-narrative-card">
          ${icon("rocket")}
          <h3>Getting faster</h3>
          <p class="reading">${esc(nar.faster)}</p>
        </div>
        <div class="card vr-narrative-card">
          ${icon("sparkles")}
          <h3>Getting smarter</h3>
          <p class="reading">${esc(nar.smarter)}</p>
        </div>
        <div class="card vr-narrative-card">
          ${icon("handshake")}
          <h3>Expanding scope</h3>
          <p class="reading">${esc(nar.expanding)}</p>
        </div>
      </div>
    </section>

    ${sc ? `<section class="section sc-intro">
      <div class="section-head"><h2 class="section-title">Services &amp; capabilities</h2></div>
      <p class="reading">Everything Third i can do for ${esc(portal.client.name)} — organized by how it fits the partnership. Billable services you can add to daily work, free value audits Third i invests in the relationship, and extension plans for the road ahead.</p>
    </section>` : ""}

    ${sc ? serviceListSection(sc.aiAgentsWorkflows, "aiAgentsWorkflows") : ""}
    ${sc ? serviceListSection(sc.valueAudit, "valueAudit") : ""}
    ${sc ? partnershipExtensionSection(sc.partnershipExtension) : ""}
    ${sc ? lastResortSection(sc.lastResort) : ""}

    ${sourceNote(invoicing.source)}
  </div>`;

  return { crumb: portal.client.shortName, title: "Value & Results", html };
}
