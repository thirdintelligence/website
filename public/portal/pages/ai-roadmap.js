/* AI Roadmap (plan 08): research-backed adoption guidance. Value/effort/evidence
   and recommendation are woven into each record; opportunities are never adoption. */
import { esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statusLabel, band, chip, motif, sourceNote } from "../components/cards.js";
import { addCommentButton } from "../components/feed.js";

const STATUS_TONE = { active: "ok", partial: "warn", "not-in-use": "neutral", "needs-confirmation": "warn", "recommended-experiment": "info" };
const STATUS_TEXT = { active: "Active / confirmed", partial: "Partial / in progress", "not-in-use": "Not in use", "needs-confirmation": "Needs confirmation", "recommended-experiment": "Recommended experiment" };

export function render(data) {
  const { aiRoadmap: ai, portal } = data;
  const ex = ai.executiveSummary;

  const cap = (c) => `<article class="card cap" id="${esc(c.id)}">
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

  const byCat = (id) => ai.capabilities.filter((c) => c.category === id);

  const html = `<div class="page">
    <h1 class="page-title">AI Roadmap</h1>
    <p class="page-lede">Practical, research-backed AI guidance for ${esc(portal.client.name)}. Third i evaluates the workflow first and the tool second.</p>

    <section class="section">
      <div class="ai-exec">
        <div class="card">
          ${motif("rings")}
          <span class="eyebrow">Executive summary</span>
          <h2 class="section-title" style="margin:8px 0 12px">Where bkWatch is today</h2>
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
