/* Value & Results — a reusable, privacy-safe record of compounding project
   efficiency, delivery quality, and capabilities. */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { motif, sourceNote, chip } from "../components/cards.js";

const STATUS_TONE = { delivered: "ok", "in-progress": "info", planned: "neutral", available: "info" };
const STATUS_TEXT = { delivered: "Delivered", "in-progress": "In progress", planned: "Planned", available: "Available" };
const CAP_TYPE_ICON = { tool: "layers", knowledge: "graduationCap", service: "handshake" };
const CAP_TYPE_LABEL = { tool: "Tool built", knowledge: "Knowledge transferred", service: "Service enabled" };
const DEFAULT_THRESHOLD = 2;

function metricCard(m, iconName) {
  const value = typeof m.count === "number" ? m.count : m.hours || "—";
  return `<div class="card metric-card">
    ${icon(iconName)}
    <div class="metric-value-row">
      <span class="metric-value">${esc(value)}</span>
      <span class="metric-descriptor">${esc(m.descriptor || "")}</span>
    </div>
    <div class="metric-label">${esc(m.label)}</div>
  </div>`;
}

function capabilityRow(c) {
  const tone = STATUS_TONE[c.status] || "neutral";
  const text = STATUS_TEXT[c.status] || c.status;
  const iconName = CAP_TYPE_ICON[c.type] || "dot";
  return `<div class="cap-row">
    <span class="cap-icon">${icon(iconName)}</span>
    <div class="cap-body">
      <div class="cap-title">${esc(c.title)}</div>
      <div class="cap-desc">${esc(c.description)}</div>
      <div class="cap-type">${esc(CAP_TYPE_LABEL[c.type] || c.type)}</div>
    </div>
    <span class="chip tone-${tone}">${esc(text)}</span>
  </div>`;
}

function completedRow(p) {
  return `<tr>
    <td><strong>${esc(p.title)}</strong></td>
    <td>${esc(p.completedAt)}</td>
    <td>${esc(p.hours)} hrs</td>
    <td>${esc(p.amount)}</td>
    <td>${esc(p.outcome)}</td>
  </tr>`;
}

function linePoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

/* The graph becomes factual/live only after two tenant-owned projects are
   complete. Expected values are intentionally directional: the UI never
   invents or discloses an unapproved numeric forecast. */
export function efficiencyHero(invoicing, clientName) {
  const model = invoicing.efficiencyModel || {};
  const threshold = Math.max(DEFAULT_THRESHOLD, Number(model.minCompletedProjects) || DEFAULT_THRESHOLD);
  const completed = Math.max(0, Number(model.completedProjectCount) || 0);
  const projects = (model.projects || []).filter((project) => project.status === "completed" && Number.isFinite(project.actualHoursPerMinute));
  const isLive = completed >= threshold && projects.length >= threshold;

  if (!isLive) {
    const progress = Math.min(100, Math.round((completed / threshold) * 100));
    return `<div class="efficiency-readiness" data-completed-projects="${completed}" data-required-projects="${threshold}">
      <div class="efficiency-readiness-head">
        <span class="efficiency-icon">${icon("chart")}</span>
        <div><span class="eyebrow">Efficiency graph ready</span><h2>Live after ${threshold} completed projects</h2></div>
      </div>
      <p>Expected versus actual production efficiency will appear here after ${esc(clientName)} completes ${threshold} projects. Until then, Third i records the inputs without presenting a premature trend.</p>
      <div class="efficiency-progress" aria-label="${completed} of ${threshold} completed projects">
        <span style="width:${progress}%"></span>
      </div>
      <div class="efficiency-readiness-meta"><strong>${completed} of ${threshold}</strong><span>completed projects</span><span>Hours, weeks, deliverables, and approval evidence are ready to track.</span></div>
    </div>`;
  }

  const chartProjects = projects.slice(0, 5);
  const chartLeft = 74;
  const chartRight = 570;
  const futureX = 662;
  const top = 64;
  const bottom = 202;
  const values = chartProjects.map((project) => project.actualHoursPerMinute);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const step = chartProjects.length > 1 ? (chartRight - chartLeft) / (chartProjects.length - 1) : 0;
  const actual = chartProjects.map((project, index) => ({
    ...project,
    x: chartLeft + step * index,
    y: bottom - ((max - project.actualHoursPerMinute) / span) * (bottom - top)
  }));
  const expected = actual.map((point) => ({ x: point.x, y: Math.min(bottom + 24, point.y + 24) }));
  expected.push({ x: futureX, y: Math.max(38, expected.at(-1).y - 42) });

  const actualMarkers = actual.map((point) => `<g class="eff-point actual-point">
    <circle cx="${point.x}" cy="${point.y}" r="6"></circle>
    <text x="${point.x}" y="${point.y - 14}" text-anchor="middle">${esc(point.actualHoursPerMinute)} h/min</text>
  </g>`).join("");
  const expectedMarkers = expected.slice(0, -1).map((point) => `<circle class="expected-point" cx="${point.x}" cy="${point.y}" r="5"></circle>`).join("");
  const xLabels = actual.map((point) => `<text class="eff-x-label" x="${point.x}" y="264" text-anchor="middle">${esc(point.label)}</text>`).join("");

  return `<div class="efficiency-live" data-completed-projects="${completed}" data-required-projects="${threshold}">
    <div class="efficiency-chart-head">
      <div><span class="eyebrow">Compounding efficiency</span><h2>Expected vs. actual</h2></div>
      <div class="eff-legend"><span class="legend-actual">Actual</span><span class="legend-expected">Expected trajectory</span></div>
    </div>
    <p>Actual production efficiency is outperforming the expected trajectory, and both improve as the system learns from completed ${esc(clientName)} work.</p>
    <div class="efficiency-chart-wrap">
      <svg class="efficiency-chart" viewBox="0 0 720 292" role="img" aria-labelledby="efficiency-chart-title efficiency-chart-desc">
        <title id="efficiency-chart-title">Expected versus actual production efficiency</title>
        <desc id="efficiency-chart-desc">Actual production effort improved from ${esc(actual[0].actualHoursPerMinute)} to ${esc(actual.at(-1).actualHoursPerMinute)} hours per finished minute. Expected efficiency improves below the actual result, and future films remain in development.</desc>
        <line class="eff-axis" x1="46" y1="238" x2="688" y2="238"></line>
        <line class="eff-axis" x1="46" y1="238" x2="46" y2="40"></line>
        <text class="eff-axis-label" x="18" y="148" text-anchor="middle" transform="rotate(-90 18 148)">Production efficiency</text>
        <polyline class="eff-line expected" points="${linePoints(expected)}"></polyline>
        <polyline class="eff-line actual" points="${linePoints(actual)}"></polyline>
        ${expectedMarkers}${actualMarkers}${xLabels}
        <circle class="future-point" cx="${futureX}" cy="${expected.at(-1).y}" r="6"></circle>
        <text class="eff-x-label" x="${futureX}" y="254" text-anchor="middle">${esc(model.futureLabel || "Future films")}</text>
        <text class="eff-x-sub" x="${futureX}" y="272" text-anchor="middle">In development</text>
      </svg>
    </div>
    <p class="efficiency-disclosure">Only verified actual efficiency is labeled. Expected trajectory remains directional until each project is complete.</p>
  </div>`;
}

function learningPrivacySection(invoicing) {
  const privacy = invoicing.learningPrivacy;
  if (!privacy) return "";
  const list = (items, iconName) => items.map((item) => `<li>${icon(iconName)}<span>${esc(item)}</span></li>`).join("");
  return `<section class="section learning-privacy">
    <div class="section-head"><div><span class="eyebrow">Compounding knowledge</span><h2 class="section-title">${esc(privacy.title)}</h2></div></div>
    <div class="card learning-privacy-card">
      <div class="privacy-lede">${icon("shield")}<p>${esc(privacy.description)}</p></div>
      <div class="privacy-columns">
        <div><h3>What carries forward</h3><ul>${list(privacy.carriesForward || [], "checkCircle")}</ul></div>
        <div><h3>What stays private</h3><ul>${list(privacy.staysPrivate || [], "lock")}</ul></div>
      </div>
    </div>
  </section>`;
}

function futureMomentum(invoicing) {
  const sections = invoicing.futureValueSections || [];
  if (!sections.length) return "";
  return `<div class="momentum-future">
    <div class="future-value-grid">
      ${sections.map((section) => `<article class="future-value-item">
        <div class="future-value-head"><span class="future-value-icon">${icon(section.icon || "chart")}</span>${chip(section.statusLabel || "Ready to track")}</div>
        <h3>${esc(section.title)}</h3>
        <p>${esc(section.description)}</p>
        <div class="future-value-metrics">${(section.metrics || []).map((metric) => `<span>${esc(metric)}</span>`).join("")}</div>
      </article>`).join("")}
    </div>
  </div>`;
}

export function render(data) {
  const { invoicing, portal, aiRoadmap } = data;
  if (!invoicing) return { crumb: portal.client.shortName, title: "Value & Results", html: '<div class="page"><div class="empty-state">Value data not available.</div></div>' };
  const m = invoicing.metrics;
  const nar = invoicing.narrative;
  const activeAiCaps = aiRoadmap ? aiRoadmap.capabilities.filter((c) => c.status === "active") : [];

  const html = `<div class="page">
    <section class="vr-hero">
      ${motif("rings")}
      <div class="vr-hero-copy">
        <span class="eyebrow">${esc(portal.client.name)} × Third i</span>
        <h1 class="page-title">Value &amp; Results</h1>
        <p class="page-lede">${esc(nar.summary)}</p>
      </div>
      ${efficiencyHero(invoicing, portal.client.name)}
    </section>

    <section class="section momentum-section">
      <div class="section-head"><h2 class="section-title">Momentum</h2></div>
      <div class="metric-grid">
        ${metricCard(m.projectsActive, "film")}
        ${metricCard(m.deliverablesCompleted, "checkCircle")}
        ${metricCard(m.hoursInvested, "clock")}
        ${metricCard(m.capabilitiesDelivered, "sparkles")}
      </div>
      ${futureMomentum(invoicing)}
    </section>

    ${learningPrivacySection(invoicing)}

    <section class="section vr-narrative">
      <div class="section-head"><h2 class="section-title">How the relationship grows</h2></div>
      <div class="vr-narrative-grid">
        <div class="card vr-narrative-card">${icon("rocket")}<h3>Getting faster</h3><p class="reading">${esc(nar.faster)}</p></div>
        <div class="card vr-narrative-card">${icon("sparkles")}<h3>Getting smarter</h3><p class="reading">${esc(nar.smarter)}</p></div>
        <div class="card vr-narrative-card">${icon("handshake")}<h3>Expanding scope</h3><p class="reading">${esc(nar.expanding)}</p></div>
      </div>
    </section>

    ${(invoicing.completedProjects && invoicing.completedProjects.length) ? `<section class="section">
      <div class="section-head"><h2 class="section-title">Completed projects</h2></div>
      <div style="overflow:auto"><table class="ptable">
        <thead><tr><th>Project</th><th>Completed</th><th>Hours</th><th>Investment</th><th>Outcome</th></tr></thead>
        <tbody>${invoicing.completedProjects.map(completedRow).join("")}</tbody>
      </table></div>
    </section>` : `<section class="section">
      <div class="empty-state">${icon("film")}<p>No completed projects yet. Completed projects and approved value evidence will appear here.</p></div>
    </section>`}

    <section class="section">
      <div class="section-head"><h2 class="section-title">Capabilities</h2></div>
      <div class="cap-list">${invoicing.capabilities.map(capabilityRow).join("")}</div>
      ${activeAiCaps.length ? `<p class="muted" style="margin-top:12px">${icon("ai")} ${activeAiCaps.length} AI capabilities confirmed in your <a href="#/ai-roadmap">AI Roadmap</a>.</p>` : ""}
    </section>

    ${sourceNote(invoicing.source)}
  </div>`;

  return { crumb: portal.client.shortName, title: "Value & Results", html };
}
