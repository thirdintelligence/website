/* Library record detail (plan 07). Any record accepts comments (Q12). */
import { esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statusLabel, chip, cardAction } from "../components/cards.js";
import { commentThread, addCommentButton } from "../components/feed.js";

export function render(data, params) {
  const { library, live } = data;
  const r = library.records.find((x) => x.id === params.recordId && x.category === params.category);
  if (!r) return { crumb: "Library", title: "Not found", html: `<div class="page"><div class="empty-state">${icon("alert")}<p>Record not found.</p><a class="btn btn-outline" href="#/library">Back to Library</a></div></div>` };

  const cat = library.categories.find((c) => c.id === r.category);
  const sub = cat && cat.subcategories && cat.subcategories.find((s) => s.id === r.subcategory);
  const related = (r.relatedIds || []).map((id) => library.records.find((x) => x.id === id)).filter(Boolean);
  const ctx = { scope: "library", recordId: r.id, category: r.category, label: r.title, route: `/bkwatch/library/${r.category}/${r.id}` };

  const html = `<div class="page">
    <a class="btn btn-sm btn-ghost" href="#/library/${r.category}">${icon("chevronLeft")} ${esc(cat ? cat.title : "Library")}</a>
    <div class="page-head-row" style="margin-top:12px">
      <div>
        <div class="hero-metaline">${statusLabel(r.status)}${chip(r.format)}${sub ? chip(sub.title) : ""}</div>
        <h1 class="page-title" style="margin-top:8px">${esc(r.title)}</h1>
      </div>
      ${addCommentButton(ctx, "Add Comment", "btn-sm btn-primary add-comment")}
    </div>

    <p class="page-lede">${esc(r.summary)}</p>
    ${r.body ? `<div class="reading" style="margin-bottom:24px"><p>${esc(r.body)}</p></div>` : ""}
    ${(r.facts && r.facts.length) ? `<ul class="record-facts">${r.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}

    <dl class="kv" style="margin-top:24px">
      <dt>Category</dt><dd>${esc(cat ? cat.title : r.category)}</dd>
      ${r.projectId && r.projectId !== "general" ? `<dt>Project</dt><dd><a class="btn btn-sm btn-outline" href="#/projects/${esc(r.projectId)}">Open project ${icon("arrowRight")}</a></dd>` : `<dt>Scope</dt><dd>General</dd>`}
      ${r.lastReviewedAt ? `<dt>Last reviewed</dt><dd>${fmtDate(r.lastReviewedAt)}</dd>` : ""}
      <dt>Sources</dt><dd>${r.sourceRefs.map((s) => esc(s)).join("<br>")}</dd>
    </dl>

    ${related.length ? `<section class="detail-block"><h2>Related</h2><div class="record-list">${related.map((x) => `<a class="record-row card-link" href="#/library/${x.category}/${x.id}"><span><span class="rr-title">${esc(x.title)}</span><span class="rr-summary">${esc(x.summary)}</span></span><span class="record-row-actions">${statusLabel(x.status)}${cardAction("View record")}</span></a>`).join("")}</div></section>` : ""}

    <section class="detail-block">
      <div class="section-head"><h2>Comments</h2>${addCommentButton(ctx)}</div>
      ${commentThread(live.comments, { recordId: r.id }) || `<div class="empty-state">${icon("comment")}<p>Submit a correction or question on this record — it becomes an action for Third i to review.</p></div>`}
    </section>
  </div>`;

  return { crumb: cat ? cat.title : "Library", title: r.title, html };
}
