/* Value & Results (plan: invoicing page) — shows the Third i-client
   relationship compounding value over time: momentum metrics, outcomes,
   capabilities delivered, and the value narrative (faster + smarter +
   expanding). Pulls from invoicing.json + surfaces AI Roadmap capabilities. */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { motif, sourceNote } from "../components/cards.js";

const STATUS_TONE = { delivered: "ok", "in-progress": "info", planned: "neutral", available: "info" };
const STATUS_TEXT = { delivered: "Delivered", "in-progress": "In progress", planned: "Planned", available: "Available" };
const CAP_TYPE_ICON = { tool: "layers", knowledge: "graduationCap", service: "handshake" };
const CAP_TYPE_LABEL = { tool: "Tool built", knowledge: "Knowledge transferred", service: "Service enabled" };

function metricCard(m, iconName) {
  return `<div class="card metric-card">
    ${icon(iconName)}
    <div class="metric-value">${typeof m.count === "number" ? m.count : m.hours || "—"}</div>
    <div class="metric-label">${esc(m.label)}</div>
  </div>`;
}

function outcomeRow(o) {
  const tone = STATUS_TONE[o.status] || "neutral";
  const text = STATUS_TEXT[o.status] || o.status;
  return `<div class="outcome-row">
    <span class="outcome-rail ${tone}"></span>
    <div class="outcome-body">
      <div class="outcome-title">${esc(o.title)}</div>
      <div class="outcome-desc">${esc(o.description)}</div>
    </div>
    <span class="chip tone-${tone}">${esc(text)}</span>
  </div>`;
}

function capabilityRow(c) {
  const tone = STATUS_TONE[c.status] || "neutral";
  const text = STATUS_TEXT[c.status] || c.status;
  const iconName = CAP_TYPE_ICON[c.type] || "dot";
  const typeLabel = CAP_TYPE_LABEL[c.type] || c.type;
  return `<div class="cap-row">
    <span class="cap-icon">${icon(iconName)}</span>
    <div class="cap-body">
      <div class="cap-title">${esc(c.title)}</div>
      <div class="cap-desc">${esc(c.description)}</div>
      <div class="cap-type">${esc(typeLabel)}</div>
    </div>
    <span class="chip tone-${tone}">${esc(text)}</span>
  </div>`;
}

function completedRow(p) {
  return `<tr>
    <td><strong>${esc(p.title)}</strong></td>
    <td>${esc(p.completedAt)}</td>
    <td>${p.hours} hrs</td>
    <td>${esc(p.amount)}</td>
    <td>${esc(p.outcome)}</td>
  </tr>`;
}

export function render(data) {
  const { invoicing, portal, aiRoadmap } = data;
  if (!invoicing) return { crumb: portal.client.shortName, title: "Value & Results", html: '<div class="page"><div class="empty-state">Value data not available.</div></div>' };
  const m = invoicing.metrics;
  const nar = invoicing.narrative;

  // Pull active capabilities from AI Roadmap as a cross-reference.
  const activeAiCaps = aiRoadmap ? aiRoadmap.capabilities.filter((c) => c.status === "active") : [];

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

    <section class="section">
      <div class="section-head"><h2 class="section-title">Outcomes</h2></div>
      <div class="outcome-list">
        ${invoicing.outcomes.map(outcomeRow).join("")}
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">Capabilities delivered</h2></div>
      <div class="cap-list">
        ${invoicing.capabilities.map(capabilityRow).join("")}
      </div>
      ${activeAiCaps.length ? `<p class="muted" style="margin-top:12px">${icon("ai")} ${activeAiCaps.length} AI capabilities confirmed in your <a href="#/ai-roadmap">AI Roadmap</a>.</p>` : ""}
    </section>

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

    ${(invoicing.completedProjects && invoicing.completedProjects.length) ? `<section class="section">
      <div class="section-head"><h2 class="section-title">Completed projects</h2></div>
      <div style="overflow:auto"><table class="ptable">
        <thead><tr><th>Project</th><th>Completed</th><th>Hours</th><th>Investment</th><th>Outcome</th></tr></thead>
        <tbody>${invoicing.completedProjects.map(completedRow).join("")}</tbody>
      </table></div>
    </section>` : `<section class="section">
      <div class="empty-state">${icon("film")}<p>No completed projects yet — Film 1 is in production. Completed projects with investment details will appear here.</p></div>
    </section>`}

    ${sourceNote(invoicing.source)}
  </div>`;

  return { crumb: portal.client.shortName, title: "Value & Results", html };
}
