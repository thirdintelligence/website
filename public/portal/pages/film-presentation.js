/* Film idea presentation (plan 05): every scene in order, with storyboard +
   exact script directly beneath its media. Controls never hide the evidence. */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { mediaFrame } from "../components/media.js";
import { statusLabel, chip } from "../components/cards.js";
import { addCommentButton } from "../components/feed.js";

export function render(data, params) {
  const { projects } = data;
  const p = projects.projects.find((x) => x.slug === params.slug);
  const film = p && p.film;
  const idea = film && film.ideas.find((i) => i.slug === params.ideaSlug);
  if (!p || !idea) return { crumb: "Projects", title: "Not found", html: `<div class="page"><div class="empty-state">${icon("alert")}<p>That direction was not found.</p><a class="btn btn-outline" href="#/projects/${params.slug || ""}">Back to project</a></div></div>` };

  const ideas = film.ideas;
  const idx = ideas.findIndex((i) => i.slug === idea.slug);
  const prev = ideas[idx - 1];
  const next = ideas[idx + 1];
  const isFinal = idea.slug === "final-demo";

  const sceneBlock = (s) => `<div class="scene-block" id="${esc(s.id)}">
    <div class="scene-media">
      ${mediaFrame({ mediaState: s.mediaState, next: s.status, ratio: "16 / 9" })}
      <div class="pc-meta" style="margin-top:10px">${statusLabel(s.status)}${addCommentButton({ scope: "scene", projectId: p.id, sceneId: s.id, label: "Scene " + s.id, route: `/bkwatch/projects/${p.slug}/ideas/${idea.slug}` }, "Comment on scene")}</div>
    </div>
    <div class="scene-copy">
      <div class="scene-id">${esc(s.id)} · ${esc(s.time || "")}</div>
      <h3 class="scene-title">${esc(s.title)}</h3>
      ${s.description ? `<p class="reading">${esc(s.description)}</p>` : ""}
      ${s.script ? `<div class="scene-script"><span class="lbl">Script</span><p>${esc(s.script)}</p></div>` : ""}
      <dl class="scene-dl">
        ${s.direction ? `<dt>Direction</dt><dd>${esc(s.direction)}</dd>` : ""}
        ${s.transition ? `<dt>Transition</dt><dd>${esc(s.transition)}</dd>` : ""}
        ${s.purpose ? `<dt>Purpose</dt><dd>${esc(s.purpose)}</dd>` : ""}
        ${s.duration ? `<dt>Duration</dt><dd>${esc(s.duration)}</dd>` : ""}
      </dl>
    </div>
  </div>`;

  const html = `<div class="page">
    <a class="btn btn-sm btn-ghost" href="#/projects/${p.slug}">${icon("chevronLeft")} ${esc(p.title)}</a>

    <section class="section" style="margin-top:16px">
      <div class="page-head-row">
        <div>
          <div class="hero-metaline">${idea.recommended ? statusLabel("Recommended direction", "ok") : statusLabel(idea.status)}<span class="chip">${esc(idea.number)}</span></div>
          <h1 class="page-title" style="margin-top:8px">${esc(idea.title)}</h1>
        </div>
        <button class="btn btn-sm btn-outline" type="button">${icon("maximize")} Full screen</button>
      </div>
      <p class="page-lede">${esc(idea.concept)}</p>
      <div class="hero-metaline">${chip(`${idea.sceneCount} scenes`, "film")}${idea.runtime ? chip(idea.runtime, "clock") : ""}${idea.demoState ? chip(idea.demoState) : ""}</div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">Storyboard &amp; script</h2></div>
      <div class="scene-list">${idea.scenes.map(sceneBlock).join("")}</div>
    </section>

    <nav class="idea-nav" aria-label="Direction navigation">
      ${prev ? `<a class="btn btn-outline" href="#/projects/${p.slug}/ideas/${prev.slug}">${icon("chevronLeft")} ${esc(prev.title)}</a>` : "<span></span>"}
      ${next ? `<a class="btn btn-outline" href="#/projects/${p.slug}/ideas/${next.slug}">${esc(next.title)} ${icon("chevronRight")}</a>` : "<span></span>"}
    </nav>

    <section class="section">
      <div class="section-head"><h2 class="section-title">All directions</h2></div>
      <div class="idea-index">
        ${ideas.map((i) => `<a class="idea-pill ${i.recommended ? "is-recommended" : ""} ${i.slug === idea.slug ? "" : ""}" href="#/projects/${p.slug}/ideas/${i.slug}">${i.recommended ? icon("check") : ""}${esc(i.title)}</a>`).join("")}
      </div>
    </section>
  </div>`;

  return { crumb: p.title, title: idea.title, html };
}
