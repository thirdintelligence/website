/* Library (plan 07): client-facing knowledge database with real memory mapping. */
import { esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statusLabel, chip, motif, sourceNote } from "../components/cards.js";
import { commentThread, addCommentButton } from "../components/feed.js";

const CAT_ICON = { branding: "bookmark", products: "layers", features: "target", "integrations-partners": "users", "film-knowledge": "film", communication: "comment", "other-knowledge": "library" };

export function render(data, params) {
  const { library, portal, live } = data;
  if (params && params.category) return renderCategory(data, params);

  const counts = {};
  for (const r of library.records) counts[r.category] = (counts[r.category] || 0) + 1;

  const formats = [...new Set(library.records.map((r) => r.format))];

  const dir = library.categories.map((c) => `
    <a class="card card-feature lib-cat card-link" href="#/library/${c.id}">
      ${motif("grid")}
      <div class="pc-meta">${icon(CAT_ICON[c.id] || "library")}<span class="lc-count">${counts[c.id] || 0} records</span></div>
      <h3 class="pc-title">${esc(c.title)}</h3>
      <p class="pc-value">${esc(c.description || "")}</p>
      ${c.subcategories && c.subcategories.length ? `<div class="lc-subs">${c.subcategories.map((s) => chip(s.title)).join("")}</div>` : ""}
    </a>`).join("");

  const html = `<div class="page">
    <h1 class="page-title">Library</h1>
    <p class="page-lede">Everything Third i has learned and built for ${esc(portal.client.name)} — brand, products, features, integrations, film knowledge, and communication. Each record keeps its source.</p>

    <div class="filters" role="group" aria-label="Filter library">
      ${icon("filter")}
      <select class="filter-select" id="lf-format" aria-label="Format"><option value="">All formats</option>${formats.map((f) => `<option>${esc(f)}</option>`).join("")}</select>
      <select class="filter-select" id="lf-cat" aria-label="Category"><option value="">All categories</option>${library.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join("")}</select>
      <button class="btn btn-sm btn-ghost" id="lf-clear" type="button">Clear</button>
    </div>

    <section class="section"><div class="lib-dir">${dir}</div></section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">All records</h2></div>
      <div class="record-list" id="lib-records">
        ${library.records.map((r) => recordRow(r)).join("")}
      </div>
    </section>
  </div>`;

  function onMount() {
    const fmt = document.getElementById("lf-format");
    const cat = document.getElementById("lf-cat");
    const apply = () => {
      document.querySelectorAll("#lib-records .record-row").forEach((el) => {
        const okF = !fmt.value || el.dataset.format === fmt.value;
        const okC = !cat.value || el.dataset.cat === cat.value;
        el.style.display = okF && okC ? "" : "none";
      });
    };
    fmt?.addEventListener("change", apply);
    cat?.addEventListener("change", apply);
    document.getElementById("lf-clear")?.addEventListener("click", () => { fmt.value = ""; cat.value = ""; apply(); });
  }

  return { crumb: portal.client.shortName, title: "Library", html, onMount };
}

function recordRow(r) {
  return `<a class="record-row" href="#/library/${r.category}/${r.id}" data-format="${esc(r.format)}" data-cat="${esc(r.category)}">
    <span><span class="rr-title">${esc(r.title)}</span><span class="rr-summary">${esc(r.summary)}</span></span>
    <span>${statusLabel(r.status)}</span>
  </a>`;
}

function renderCategory(data, params) {
  const { library, portal, live } = data;
  const cat = library.categories.find((c) => c.id === params.category);
  if (!cat) return { crumb: "Library", title: "Not found", html: `<div class="page"><div class="empty-state">${icon("alert")}<p>Category not found.</p><a class="btn btn-outline" href="#/library">Back to Library</a></div></div>` };
  const records = library.records.filter((r) => r.category === cat.id);

  // Communication is a special, chronology-oriented category.
  const isComms = cat.id === "communication";
  let body;
  if (isComms) {
    const commentCtx = { scope: "library", category: "communication" };
    body = `
      <div class="detail-block"><h2>Comments</h2>
        ${commentThread(live.comments) || `<div class="empty-state">${icon("comment")}<p>Client-visible comments will appear here as a chronology.</p></div>`}
      </div>
      <div class="detail-block"><h2>Emails</h2>
        <div class="empty-state">${icon("mail")}<p>No client-visible email summaries yet. Approved summaries (participants, date, decisions, actions) will appear here — raw email bodies require explicit approval.</p></div>
      </div>
      <div class="detail-block"><h2>Meetings</h2>
        <div class="empty-state">${icon("users")}<p>No client-visible meeting summaries yet. Approved summaries (attendees, decisions, actions) will appear here; private notes stay internal.</p></div>
      </div>`;
  } else {
    body = `<div class="record-list">${records.length ? records.map((r) => recordRow(r)).join("") : `<div class="empty-state">${icon("library")}<p>No records in this category yet.</p></div>`}</div>`;
  }

  const html = `<div class="page">
    <a class="btn btn-sm btn-ghost" href="#/library">${icon("chevronLeft")} Library</a>
    <h1 class="page-title" style="margin-top:12px">${esc(cat.title)}</h1>
    <p class="page-lede">${esc(cat.description || "")}</p>
    ${cat.subcategories && cat.subcategories.length ? `<div class="lc-subs" style="margin-bottom:24px">${cat.subcategories.map((s) => chip(s.title)).join("")}</div>` : ""}
    <section class="section">${body}</section>
  </div>`;

  return { crumb: "Library", title: cat.title, html };
}
