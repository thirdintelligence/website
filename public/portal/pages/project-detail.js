/* Project detail (plan 05): full hierarchy for creative + delivery work. */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { mediaFrame, draftNotice, versionHistory } from "../components/media.js";
import { statusLabel, chip, motif, sourceNote, cardAction } from "../components/cards.js";
import { commentThread, commentsWithProjectBlockers, addCommentButton } from "../components/feed.js";

export function render(data, params) {
  const { projects, portal, live, invoicing } = data;
  const p = projects.projects.find((x) => x.slug === params.slug);
  if (!p) return { crumb: "Projects", title: "Not found", html: notFound() };

  const ctx = { scope: "project", projectId: p.id, label: p.title, route: `/bkwatch/projects/${p.slug}` };
  const film = p.film;
  const projectComments = commentsWithProjectBlockers(live.comments, [p]);

  const selectedIds = new Set(p.productionLifecycle?.selectedIdeaIds || []);
  const isSelectedIdea = (idea) => selectedIds.has(idea.slug) || idea.recommended;
  const ideaCards = film ? film.ideas.map((idea) => isSelectedIdea(idea) ? `
    <article class="card card-feature creative-direction-card creative-direction-card-locked">
      ${motif("grid")}
      <div class="pc-meta creative-direction-badges">${statusLabel("Locked", "ok", true)}<span class="chip"><span class="control-content">${esc(idea.number)}</span></span></div>
      <h3 class="pc-title">${esc(idea.title)}</h3>
      <p class="pc-value">${esc(idea.concept)}</p>
      <div class="pc-meta muted">${icon("film")} ${idea.sceneCount} scenes · ${esc(idea.runtime || "")}</div>
    </article>` : `
    <a class="card card-feature card-link creative-direction-card" href="#/projects/${p.slug}/ideas/${idea.slug}">
      ${motif("grid")}
      <div class="pc-meta creative-direction-badges">${statusLabel(idea.status, undefined, true)}<span class="chip"><span class="control-content">${esc(idea.number)}</span></span></div>
      <h3 class="pc-title">${esc(idea.title)}</h3>
      <p class="pc-value">${esc(idea.concept)}</p>
      <div class="pc-meta muted">${icon("film")} ${idea.sceneCount} scenes · ${esc(idea.runtime || "")}</div>
      ${cardAction("Open direction")}
    </a>`).join("") : "";

  const comparisonCriteria = film ? film.comparisonCriteria.filter((criterion) => !/recommendation/i.test(criterion)) : [];
  const comparison = film ? `
    <div class="detail-block">
      <h2>Compare directions</h2>
      <p class="reading muted comparison-criteria">Criteria: ${comparisonCriteria.map((c) => chip(c)).join(" ")}</p>
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
          ${p.creativeVision ? `<dt>Creative vision</dt><dd>${esc(p.creativeVision)}</dd>` : ""}
          ${p.audience ? `<dt>Audience</dt><dd>${esc(p.audience)}</dd>` : ""}
          ${(p.keyMessaging && p.keyMessaging.length) ? `<dt>Key messaging</dt><dd><ul class="kv-list">${p.keyMessaging.map((m) => `<li><strong>${esc(m.title)}</strong><span class="reading">${esc(m.detail)}</span></li>`).join("")}</ul></dd>` : ""}
          ${p.phase ? `<dt>Phase</dt><dd>${esc(p.phase)}</dd>` : ""}
          ${p.nextMilestone ? `<dt>Next milestone</dt><dd>${esc(p.nextMilestone)}</dd>` : ""}
        </dl>
        <div class="hero-metaline">
          ${addCommentButton(ctx, "Add Comment", "btn-sm btn-primary add-comment")}
          <button class="btn btn-sm btn-outline" type="button" data-project-pdf="${esc(p.id)}">${icon("download")} Download PDF</button>
          ${film && film.ideas.some(isSelectedIdea) ? `<button class="btn btn-sm btn-ghost" type="button" data-presentation-fullscreen aria-pressed="false">${icon("maximize")} Full screen</button>` : ""}
        </div>
      </div>
    </section>

    ${(invoicing && p.status === "active") ? renderProjectValue(p, invoicing, projects.asOf) : ""}

    ${p.draft ? `<div class="section">${draftNotice()}</div>` : ""}

    <section class="detail-block">
      <div class="section-head"><h2>Comments</h2>${addCommentButton(ctx)}</div>
      ${commentThread(projectComments, { projectId: p.id }) || `<div class="empty-state">${icon("comment")}<p>No open comments on this project. Use Add Comment to leave feedback anywhere.</p></div>`}
    </section>

    ${p.script ? `<section class="detail-block">
      <div class="section-head"><h2>Script</h2>${addCommentButton({ ...ctx, scope: "script", label: "Script" }, "Comment on script")}</div>
      <div class="scene-script"><span class="lbl">Locked voiceover</span><p>${esc(p.script)}</p></div>
      ${sourceNote(p.storyboardNote)}
    </section>` : ""}

    ${scope}

    ${(p.timeline && p.timeline.length) ? `<section class="detail-block">
      <h2>Timeline, deliverables &amp; milestones</h2>${renderTimelineWithDeliverables(p)}
    </section>` : ""}

    ${renderSelectedDemo(p, film)}

    ${film ? `<section class="detail-block">
      <div class="section-head"><h2>Creative directions</h2><span class="muted">${film.ideas.length} directions</span></div>
      <p class="reading muted">Brainstorm directions retain their own storyboard and script pages without media placeholders. The locked HYBRID remains here as the decision record; its complete demo workspace now lives directly above.</p>
      <div class="grid grid-2" style="margin-top:16px">${ideaCards}</div>
    </section>` : ""}

    ${comparison}

    ${(p.reports && p.reports.length) ? `<section class="detail-block"><h2>Reports &amp; outcomes</h2>${p.reports.map((r) => `<div class="card"><h3 class="pc-title">${esc(r.title)}</h3><p class="reading">${esc(r.body)}</p>${sourceNote(r.source)}</div>`).join("")}</section>` : ""}

    ${sourceNote(p.source)}
  </div>`;

  const hasDemo = film && film.ideas.some(isSelectedIdea);
  return { crumb: "Projects", title: p.title, fullscreen: hasDemo, commentContext: { scope: "project", projectId: p.id, label: p.title, route: `/bkwatch/projects/${p.slug}` }, html };
}

function renderProjectValue(p, invoicing, asOf) {
  const activeProjects = invoicing.metrics?.projectsActive?.count || 0;
  const hours = p.hoursInvested ?? (activeProjects === 1 ? invoicing.metrics?.hoursInvested?.hours : null);
  const start = p.startedAt ? Date.parse(`${p.startedAt}T00:00:00Z`) : NaN;
  const end = Date.parse(`${invoicing.asOf || asOf}T00:00:00Z`);
  const weeks = Number.isFinite(start) && Number.isFinite(end) ? Math.max(1, Math.ceil((end - start + 86400000) / 604800000)) : null;
  const deliverables = p.deliverables || [];
  const ready = deliverables.filter((d) => /done|complete|ready|approved/i.test(d.state)).length;
  const selectedIdea = p.film?.ideas?.find((idea) => idea.recommended) || p.film?.ideas?.[0];
  const metrics = [
    hours != null ? { value: hours, label: "hours" } : null,
    weeks != null ? { value: weeks, label: "weeks active" } : null,
    deliverables.length ? { value: `${ready}/${deliverables.length}`, label: "deliverables ready" } : null,
    selectedIdea?.sceneCount ? { value: selectedIdea.sceneCount, label: "selected demo scenes" } : null
  ].filter(Boolean);
  return `<section class="detail-block"><div class="value-panel">
    <h3>Effort &amp; value</h3>
    <div class="ai-value-strip project-value-strip">
      ${metrics.map((m) => `<div class="ai-value-stat"><span class="ai-value-num">${esc(m.value)}</span><span class="ai-value-label">${esc(m.label)}</span></div>`).join("")}
      <div class="ai-value-actions"><a class="btn btn-sm btn-outline" href="#/value-results">View Value &amp; Results ${icon("arrowRight")}</a></div>
    </div>
  </div></section>`;
}

/** A locked demo stops being a separate presentation and becomes the working
 * production record on the project page. Approval later advances this same
 * stable scene/history/comment record into full-film production. */
function renderSelectedDemo(p, film) {
  if (!film) return "";
  const selectedIds = p.productionLifecycle?.selectedIdeaIds || [];
  const idea = film.ideas.find((item) => selectedIds.includes(item.slug)) || film.ideas.find((item) => item.recommended);
  if (!idea) return "";
  const scenes = idea.scenes.map((scene) => {
    const histories = (p.assets || []).filter((asset) => (scene.assetIds || []).includes(asset.id));
    const commentRoute = `/bkwatch/projects/${p.slug}#${scene.id}`;
    return `<article class="scene-block selected-demo-scene" id="${esc(scene.id)}">
      <div class="scene-media">${mediaFrame({ mediaState: scene.mediaState, label: idea.lifecycleState === "demo-production" ? "Demo in production" : undefined, ratio: "16 / 9" })}${histories.map(versionHistory).join("")}
        <div class="pc-meta scene-comment-action">${addCommentButton({ scope: "scene", projectId: p.id, sceneId: scene.id, label: `Scene ${scene.id}`, route: commentRoute }, "Comment on scene")}</div>
      </div>
      <div class="scene-copy"><div class="scene-id">${esc(scene.id)} · ${esc(scene.time || "")}</div><h3 class="scene-title">${esc(scene.title)}</h3>
        ${scene.description ? `<p class="reading">${esc(scene.description)}</p>` : ""}
        ${scene.script ? `<div class="scene-script"><span class="lbl">Script</span><p>${esc(scene.script)}</p></div>` : ""}
        <dl class="scene-dl">
          ${scene.direction ? `<dt>Direction</dt><dd>${esc(scene.direction)}</dd>` : ""}
          ${scene.transition ? `<dt>Transition</dt><dd>${esc(scene.transition)}</dd>` : ""}
          ${scene.purpose ? `<dt>Purpose</dt><dd>${esc(scene.purpose)}</dd>` : ""}
          ${scene.duration ? `<dt>Duration</dt><dd>${esc(scene.duration)}</dd>` : ""}
        </dl>
      </div>
    </article>`;
  }).join("");
  const lifecycleLabel = p.productionLifecycle?.demoPhase === "building" ? "Demo in production" : idea.status;
  return `<section class="detail-block selected-demo-workspace" id="selected-demo">
    <div class="section-head"><div><span class="eyebrow">Locked demo · project workspace</span><h2>${esc(idea.title)}</h2></div>${statusLabel(lifecycleLabel, "warn")}</div>
    <p class="reading">${esc(idea.concept)}</p>
    <p class="reading muted selected-demo-policy">This locked HYBRID no longer has a separate direction page. Its storyboard, script, scene comments, preview placeholders, and every future still/video version live together here. Demo approval will advance this same record into full-film production without copying or losing its history.</p>
    <div class="hero-metaline">${chip(`${idea.sceneCount} scenes`, "film")}${idea.runtime ? chip(idea.runtime, "clock") : ""}${idea.demoState ? chip(idea.demoState) : ""}</div>
    <div class="section-head selected-demo-storyboard-head"><h3>Storyboard &amp; script</h3></div>
    <div class="scene-list">${scenes}</div>
  </section>`;
}

function renderScope(s) {
  if (s.ownerApproved) {
    return `<section class="detail-block"><div class="value-panel"><h3>Scope &amp; investment</h3>
      <dl class="kv"><dt>Model</dt><dd>${esc(s.model)}</dd>
      ${s.effortRange ? `<dt>Effort</dt><dd>${esc(s.effortRange)}</dd>` : ""}
      ${s.priceStatement ? `<dt>Investment</dt><dd>${esc(s.priceStatement)}</dd>` : ""}</dl>
      ${sourceNote(s.source)}</div></section>`;
  }
  return `<section class="detail-block"><div class="value-panel">
    <h3>Scope &amp; investment</h3>
    <p class="reading">${esc(s.note)}</p>
    ${(s.assumptions && s.assumptions.length) ? `<p class="muted" style="margin-top:8px">Assumptions: ${s.assumptions.map((a) => chip(a)).join(" ")}</p>` : ""}
    <p style="margin-top:12px"><span class="scope-required">${icon("clock")} Scope required</span> — Third i presents the confirmed effort range and pricing model before production begins.</p>
    ${sourceNote(s.source)}
  </div></section>`;
}

/** Timeline with deliverables integrated. Each deliverable is shown as a
 * sub-row under the timeline phase it belongs to, based on its state. */
function renderTimelineWithDeliverables(p) {
  const timeline = p.timeline || [];
  const deliverables = p.deliverables || [];
  if (!timeline.length) return "";

  // Map deliverable states to timeline phases
  const deliverablePhaseMap = {
    "done": "done",
    "in-progress": "current",
    "not-started": "pending"
  };

  // Group deliverables by their corresponding timeline phase
  const doneDeliverables = deliverables.filter((d) => d.state === "done");
  const inProgressDeliverables = deliverables.filter((d) => d.state === "in-progress");
  const notStartedDeliverables = deliverables.filter((d) => d.state === "not-started");

  return `<div class="ptimeline">
    ${timeline.map((t) => {
      // Attach deliverables to the appropriate phase
      let phaseDeliverables = [];
      if (t.state === "done" && t.title.includes("Phase 1")) {
        phaseDeliverables = doneDeliverables.filter((d) => d.title === "Brainstorm ideas");
      } else if (t.state === "done" && t.title.includes("Phase 3")) {
        phaseDeliverables = doneDeliverables.filter((d) => d.title === "Storyboard + script" || d.title === "Voiceover");
      } else if (t.state === "done" && t.title.includes("Phase 4")) {
        phaseDeliverables = doneDeliverables.filter((d) => d.title === "Prompts");
      } else if (t.state === "current" && t.title.includes("Phase 5")) {
        phaseDeliverables = [...inProgressDeliverables, ...notStartedDeliverables.filter((d) => d.title === "Videos")];
      } else if (t.state === "pending" && t.title.includes("Phase 6")) {
        phaseDeliverables = notStartedDeliverables.filter((d) => d.title === "Final versions");
      }

      const deliverableRows = phaseDeliverables.map((d) =>
        `<div class="ptl-deliverable"><span class="ptl-deliverable-state ${esc(d.state)}">${statusLabel(d.state)}</span><span class="ptl-deliverable-title">${esc(d.title)}</span>${d.detail ? `<span class="ptl-deliverable-detail reading">${esc(d.detail)}</span>` : ""}</div>`
      ).join("");

      return `<div class="ptl-row ${esc(t.state)}">
        <span class="ptl-dot" aria-hidden="true"></span>
        <div><strong>${esc(t.title)}</strong>${t.detail ? `<div class="feed-detail">${esc(t.detail)}</div>` : ""}
          <span class="visually-hidden">status: ${esc(t.state)}</span>
          ${deliverableRows ? `<div class="ptl-deliverables">${deliverableRows}</div>` : ""}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function notFound() {
  return `<div class="page"><div class="empty-state">${icon("alert")}<p>That project was not found.</p><a class="btn btn-outline" href="#/projects">Back to Projects</a></div></div>`;
}
