/* Library (plan 07): client-facing knowledge database with real memory mapping.
   Communication category now shows real emails + meetings pulled from the OS
   snapshot, with Comments, Emails, and Meetings as separate sub-pages. */
import { esc, fmtDate } from "../core/util.js";
import { icon } from "../core/icons.js";
import { statusLabel, chip, motif, cardAction } from "../components/cards.js";

const CAT_ICON = { branding: "bookmark", products: "layers", features: "puzzle", "integrations-partners": "users", "film-knowledge": "film", communication: "comment", "other-knowledge": "bookOpen" };

export function render(data, params) {
  // Communication sub-page route — redirect to the standalone communications page
  if (params && params.subpage) return { redirect: `#/communications/${params.subpage}` };
  if (params && params.category === "communication") return { redirect: "#/communications" };
  if (params && params.category) return renderCategory(data, params);

  const { library, portal, live, communications } = data;

  const counts = {};
  for (const r of library.records) counts[r.category] = (counts[r.category] || 0) + 1;
  // Add communication counts from real data
  if (communications) {
    counts.communication = (communications.emails?.length || 0) + (communications.meetings?.length || 0) + (live.comments?.length || 0);
  }

  const formats = [...new Set(library.records.map((r) => r.format))];
  const statuses = [...new Set(library.records.map((r) => r.status))];
  const projectIds = [...new Set(library.records.map((r) => r.projectId || "general"))];
  const years = [...new Set(library.records.map(recordYear).filter(Boolean))].sort().reverse();

  const dir = library.categories.map((c) => {
    const count = counts[c.id] || 0;
    const countLabel = c.id === "communication" ? `${count} items` : `${count} records`;
    const href = c.id === "communication" ? "#/communications" : `#/library/${c.id}`;
    return `<a class="card card-feature lib-cat card-link" href="${href}">
      ${motif("grid")}
      <div class="pc-meta">${icon(CAT_ICON[c.id] || "library")}<span class="lc-count">${countLabel}</span></div>
      <h3 class="pc-title">${esc(c.title)}</h3>
      <p class="pc-value">${esc(c.description || "")}</p>
      ${c.subcategories && c.subcategories.length ? `<div class="lc-subs">${c.subcategories.map((s) => chip(s.title)).join("")}</div>` : ""}
      ${cardAction(c.id === "communication" ? "Open communications" : "Open category")}
    </a>`;
  }).join("");

  // Quicklinks — direct links to research tools, not a library category
  const quicklinksHtml = `<div class="card quicklinks-card">
    <div class="section-head"><h2 class="section-title">${icon("external")} Quicklinks</h2></div>
    <p class="muted" style="margin-bottom:var(--space-4)">Research tools Third i uses when evaluating AI tools and models.</p>
    <div class="quicklinks-list">
      <a class="quicklink-item" href="https://artificialanalysis.ai/methodology" target="_blank" rel="noopener">
        <span class="quicklink-item-title">Artificial Analysis</span>
        <span class="quicklink-item-desc">Independently measured model intelligence, performance, and cost.</span>
      </a>
      <a class="quicklink-item" href="https://help.arena.ai/articles/7011479247-how-to-see-ai-rankings-in-arena-leaderboards-2-0-wip" target="_blank" rel="noopener">
        <span class="quicklink-item-title">Arena Leaderboard</span>
        <span class="quicklink-item-desc">Human-preference rankings — real people vote on which AI model produces better output.</span>
      </a>
      <a class="quicklink-item" href="https://futuretools.io/" target="_blank" rel="noopener">
        <span class="quicklink-item-title">FutureTools</span>
        <span class="quicklink-item-desc">Directory of AI tools organized by category — for discovery, not final selection.</span>
      </a>
    </div>
  </div>`;

  const html = `<div class="page filter-page">
    <h1 class="page-title">Library</h1>
    <p class="page-lede">Everything Third i has learned and built for ${esc(portal.client.name)} — brand, products, features, integrations, film knowledge, and communication. Each record keeps its source.</p>

    <div class="filters" role="group" aria-label="Filter library">
      ${icon("filter")}
      <label class="visually-hidden" for="lf-search">Search library records</label>
      <input class="filter-search" id="lf-search" type="search" placeholder="Search records" autocomplete="off" />
      <select class="filter-select" id="lf-format" aria-label="Format"><option value="">All formats</option>${formats.map((f) => `<option>${esc(f)}</option>`).join("")}</select>
      <select class="filter-select" id="lf-cat" aria-label="Category"><option value="">All categories</option>${library.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join("")}</select>
      <select class="filter-select" id="lf-status" aria-label="Status"><option value="">All statuses</option>${statuses.map((status) => `<option value="${esc(status)}">${esc(status)}</option>`).join("")}</select>
      <select class="filter-select" id="lf-project" aria-label="Project"><option value="">All projects</option>${projectIds.map((id) => `<option value="${esc(id)}">${esc(projectLabel(data, id))}</option>`).join("")}</select>
      ${years.length ? `<select class="filter-select" id="lf-year" aria-label="Reviewed year"><option value="">All dates</option>${years.map((year) => `<option value="${year}">${year}</option>`).join("")}</select>` : ""}
      <button class="btn btn-sm btn-ghost" id="lf-clear" type="button">Clear</button>
    </div>

    <section class="section"><div class="lib-dir">${dir}</div></section>

    <section class="section">${quicklinksHtml}</section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">All records</h2></div>
      <div class="record-list" id="lib-records">
        ${library.records.map((r) => recordRow(r)).join("")}
      </div>
      <div class="empty-state" id="lib-no-results" hidden>${icon("search")}<p>No records match these filters.</p></div>
    </section>
  </div>`;

  function onMount() {
    const fmt = document.getElementById("lf-format");
    const cat = document.getElementById("lf-cat");
    const status = document.getElementById("lf-status");
    const project = document.getElementById("lf-project");
    const year = document.getElementById("lf-year");
    const search = document.getElementById("lf-search");
    const apply = () => {
      let visible = 0;
      const q = (search?.value || "").trim().toLowerCase();
      document.querySelectorAll("#lib-records .record-row").forEach((el) => {
        const okF = !fmt.value || el.dataset.format === fmt.value;
        const okC = !cat.value || el.dataset.cat === cat.value;
        const okS = !status.value || el.dataset.status === status.value;
        const okP = !project.value || el.dataset.project === project.value;
        const okY = !year?.value || el.dataset.year === year.value;
        const okQ = !q || (el.dataset.search || "").includes(q);
        const show = okF && okC && okS && okP && okY && okQ;
        el.style.display = show ? "" : "none";
        if (show) visible += 1;
      });
      const empty = document.getElementById("lib-no-results");
      if (empty) empty.hidden = visible !== 0;
    };
    fmt?.addEventListener("change", apply);
    cat?.addEventListener("change", apply);
    status?.addEventListener("change", apply);
    project?.addEventListener("change", apply);
    year?.addEventListener("change", apply);
    search?.addEventListener("input", apply);
    document.getElementById("lf-clear")?.addEventListener("click", () => {
      [fmt, cat, status, project, year].filter(Boolean).forEach((control) => { control.value = ""; });
      if (search) search.value = "";
      apply();
    });
  }

  return { crumb: portal.client.shortName, title: "Library", html, onMount };
}

function recordRow(r) {
  return `<a class="record-row card-link" href="#/library/${r.category}/${r.id}" data-format="${esc(r.format)}" data-cat="${esc(r.category)}" data-status="${esc(r.status)}" data-project="${esc(r.projectId || "general")}" data-year="${esc(recordYear(r))}" data-search="${esc([r.title, r.summary, r.body, r.status, r.format].filter(Boolean).join(" ").toLowerCase())}">
    <span><span class="rr-title">${esc(r.title)}</span><span class="rr-summary">${esc(r.summary)}</span></span>
    <span class="record-row-actions">${statusLabel(r.status)}${cardAction("View record")}</span>
  </a>`;
}

function recordYear(record) {
  const value = record.lastReviewedAt || record.eventDate || "";
  return /^\d{4}/.test(value) ? value.slice(0, 4) : "";
}

function projectLabel(data, id) {
  if (id === "general") return "General";
  return data.projects?.projects?.find((project) => project.id === id)?.title || id;
}

/* Category detail page. Communication category redirects to /communications. */
function renderCategory(data, params) {
  const { library } = data;
  const cat = library.categories.find((c) => c.id === params.category);
  if (!cat) return { crumb: "Library", title: "Not found", html: `<div class="page"><div class="empty-state">${icon("alert")}<p>Category not found.</p><a class="btn btn-outline" href="#/library">Back to Library</a></div></div>` };

  const records = library.records.filter((r) => r.category === cat.id);
  const body = `<div class="record-list">${records.length ? records.map((r) => recordRow(r)).join("") : `<div class="empty-state">${icon("bookOpen")}<p>No records in this category yet.</p></div>`}</div>`;

  const html = `<div class="page">
    <a class="btn btn-sm btn-ghost" href="#/library">${icon("chevronLeft")} Library</a>
    <h1 class="page-title" style="margin-top:12px">${esc(cat.title)}</h1>
    <p class="page-lede">${esc(cat.description || "")}</p>
    <section class="section">${body}</section>
  </div>`;

  return { crumb: "Library", title: cat.title, html };
}

