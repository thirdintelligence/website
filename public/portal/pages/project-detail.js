/* Project detail (plan 05): full hierarchy for creative + delivery work. */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { mediaFrame, draftNotice, versionHistory } from "../components/media.js";
import { statusLabel, chip, motif, sourceNote } from "../components/cards.js";
import { commentThread, addCommentButton, projectTimeline } from "../components/feed.js";

export function render(data, params) {
  const { projects, portal, live } = data;
  const p = projects.projects.find((x) => x.slug === params.slug);
  if (!p) return { crumb: "Projects", title: "Not found", html: notFound() };

  const ctx = { scope: "project", projectId: p.id, label: p.title, route: `/bkwatch/projects/${p.slug}` };
  const film = p.film;

  const ideaCards = film ? film.ideas.map((idea) => `
    <a class="card card-feature card-link creative-direction-card" href="#/projects/${p.slug}/ideas/${idea.slug}">
      ${motif("grid")}
      <div class="pc-meta creative-direction-badges">${idea.recommended ? statusLabel("Recommended", "ok", true) : statusLabel(idea.status, undefined, true)}<span class="chip"><span class="control-content">${esc(idea.number)}</span></span></div>
      <h3 class="pc-title">${esc(idea.title)}</h3>
      <p class="pc-value">${esc(idea.concept)}</p>
      <div class="pc-meta muted">${icon("film")} ${idea.sceneCount} scenes · ${esc(idea.runtime || "")}</div>
    </a>`).join("") : "";

  const comparisonCriteria = film ? film.comparisonCriteria.filter((criterion) => !/recommendation/i.test(criterion)) : [];
  const comparison = film ? `
    <div class="detail-block">
      <h2>Compare directions</h2>
      <p class="reading muted">Criteria: ${comparisonCriteria.map((c) => chip(c)).join(" ")}</p>
      <div style="overflow:auto"><table class="ptable">
        <thead><tr><th>Direction</th><th>Strength</th><th>Complexity</th><th>Distinctiveness</th></tr></thead>
        <tbody>
          ${film.ideas.map((i) => `<tr>
            <td><strong>${esc(i.title)}</strong></td><td>${esc(i.strength || "—")}</td>
            <td>${esc(i.complexity || "—")}</td><td>${esc(i.distinctiveness || "—")}</td></tr>`).join("")}
        </tbody>
      </table></div>
    </div>` : "";

  const scope = p.scope ? renderScope(p.scope) : "";

  const html = `<div class="page">
    <section class="project-hero">
      <div class="project-preview scene-media">${mediaFrame({ mediaState: p.thumbnail?.mediaState || "ungenerated", label: p.thumbnail?.label, ratio: "16 / 9" })}</div>
      <div class="hero-facts">
        <div class="hero-metaline">${statusLabel(p.statusLabel || p.status)}${chip(p.projectType)}${p.runtime ? chip(p.runtime, "clock") : ""}</div>
        <h1>${esc(p.title)}</h1>
        <p class="reading">${esc(p.objective || p.valueStatement)}</p>
        <dl class="kv">
          ${p.audience ? `<dt>Audience</dt><dd>${esc(p.audience)}</dd>` : ""}
          ${p.coreValue ? `<dt>Core value</dt><dd>${esc(p.coreValue)}</dd>` : ""}
          ${p.phase ? `<dt>Phase</dt><dd>${esc(p.phase)}</dd>` : ""}
          ${p.nextMilestone ? `<dt>Next milestone</dt><dd>${esc(p.nextMilestone)}</dd>` : ""}
        </dl>
        <div class="hero-metaline">
          ${addCommentButton(ctx, "Add Comment", "btn-sm btn-primary add-comment")}
          <button class="btn btn-sm btn-outline" type="button">${icon("download")} Download PDF</button>
          <a class="btn btn-sm btn-ghost" href="#/projects/${p.slug}/ideas/${film ? film.ideas.find((i) => i.recommended)?.slug || film.ideas[0].slug : ""}">${icon("maximize")} Presentation</a>
        </div>
      </div>
    </section>

    ${p.draft ? `<div class="section">${draftNotice()}</div>` : ""}

    <section class="detail-block">
      <div class="section-head"><h2>Current actions &amp; comments</h2>${addCommentButton(ctx)}</div>
      ${commentThread(live.comments, { projectId: p.id }) || `<div class="empty-state">${icon("comment")}<p>No open comments on this project. Use Add Comment to leave feedback anywhere.</p></div>`}
    </section>

    ${(p.messaging && p.messaging.length) ? `<section class="detail-block">
      <h2>Key messaging, theme &amp; creative vision</h2>
      <div class="reading">${p.messaging.map((m) => `<p style="margin-bottom:12px">${esc(m)}</p>`).join("")}</div>
    </section>` : ""}

    ${p.script ? `<section class="detail-block">
      <div class="section-head"><h2>Script</h2>${addCommentButton({ ...ctx, scope: "script", label: "Script" }, "Comment on script")}</div>
      <div class="scene-script"><span class="lbl">Locked voiceover</span><p>${esc(p.script)}</p></div>
      ${sourceNote(p.storyboardNote)}
    </section>` : ""}

    ${film ? `<section class="detail-block">
      <div class="section-head"><h2>Creative directions</h2><span class="muted">${film.ideas.length} directions</span></div>
      <p class="reading muted">Each direction is a complete proposed film. Open one for its full scene-by-scene storyboard and script.</p>
      <div class="grid grid-2" style="margin-top:16px">${ideaCards}</div>
    </section>` : ""}

    ${comparison}

    <section class="detail-block">
      <h2>Deliverables &amp; assets</h2>
      ${(p.deliverables && p.deliverables.length) ? `<dl class="kv">${p.deliverables.map((d) => `<dt>${statusLabel(d.state)}</dt><dd>${esc(d.title)}</dd>`).join("")}</dl>` : ""}
      ${(p.assets && p.assets.length) ? p.assets.map((a) => versionHistory(a)).join("") : `<div class="empty-state" style="margin-top:16px">${icon("layers")}<p>No client-visible assets yet. Approved stills and video will appear here with direct downloads and version history.</p></div>`}
    </section>

    ${(p.timeline && p.timeline.length) ? `<section class="detail-block">
      <h2>Timeline &amp; milestones</h2>${projectTimeline(p.timeline)}
    </section>` : ""}

    ${(p.blockers && p.blockers.length) ? `<section class="detail-block">
      <h2>Open blockers</h2>
      <div>${p.blockers.map((b) => `<div class="action-item"><span class="action-rail blocker"></span><div class="action-body"><div class="action-title">${esc(b)}</div><div class="action-meta">${statusLabel("Awaiting input", "warn")}</div></div></div>`).join("")}</div>
    </section>` : ""}

    ${(p.reports && p.reports.length) ? `<section class="detail-block"><h2>Reports &amp; outcomes</h2>${p.reports.map((r) => `<div class="card"><h3 class="pc-title">${esc(r.title)}</h3><p class="reading">${esc(r.body)}</p>${sourceNote(r.source)}</div>`).join("")}</section>` : ""}

    ${scope}

    ${sourceNote(p.source)}
  </div>`;

  return { crumb: "Projects", title: p.title, action: `<button class="btn btn-sm btn-ghost" type="button">${icon("maximize")} Presentation</button>`, html };
}

function renderScope(s) {
  if (s.ownerApproved) {
    return `<section class="detail-block"><div class="scope-panel"><h3>Scope &amp; investment</h3>
      <dl class="kv"><dt>Model</dt><dd>${esc(s.model)}</dd>
      ${s.effortRange ? `<dt>Effort</dt><dd>${esc(s.effortRange)}</dd>` : ""}
      ${s.priceStatement ? `<dt>Investment</dt><dd>${esc(s.priceStatement)}</dd>` : ""}</dl>
      ${sourceNote(s.source)}</div></section>`;
  }
  return `<section class="detail-block"><div class="scope-panel">
    <h3>Scope &amp; investment</h3>
    <p class="reading">${esc(s.note)}</p>
    ${(s.assumptions && s.assumptions.length) ? `<p class="muted" style="margin-top:8px">Assumptions: ${s.assumptions.map((a) => chip(a)).join(" ")}</p>` : ""}
    <p style="margin-top:12px"><span class="scope-required">${icon("clock")} Scope required</span> — Third i presents the confirmed effort range and pricing model before production begins.</p>
    ${sourceNote(s.source)}
  </div></section>`;
}

function notFound() {
  return `<div class="page"><div class="empty-state">${icon("alert")}<p>That project was not found.</p><a class="btn btn-outline" href="#/projects">Back to Projects</a></div></div>`;
}
