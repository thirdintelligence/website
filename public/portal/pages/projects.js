/* Projects index (plan 05). */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { projectCard } from "../components/cards.js";

export function render(data) {
  const { projects, portal } = data;
  const all = projects.projects;
  const statuses = [...new Set(all.map((p) => p.status))];
  const active = all.filter((p) => p.status === "active");
  const history = all.filter((p) => p.status !== "active");

  const filters = `<div class="filters" role="group" aria-label="Filter projects">
    ${icon("filter")}
    <select class="filter-select" id="f-status" aria-label="Status">
      <option value="">All statuses</option>
      ${statuses.map((s) => `<option value="${esc(s)}">${esc(s[0].toUpperCase() + s.slice(1))}</option>`).join("")}
    </select>
    <button class="btn btn-sm btn-ghost filter-clear" id="f-clear" type="button">Clear</button>
  </div>`;

  const html = `<div class="page">
    <div class="page-head-row">
      <div>
        <h1 class="page-title">Projects</h1>
        <p class="page-lede">Active, completed, paused, and archived work for ${esc(portal.client.name)}. Open a project for its creative presentation, assets, and outcomes.</p>
      </div>
      <button class="btn btn-primary" id="new-project-btn" type="button" data-new-project="1">${icon("plus")} Create a New Project</button>
    </div>

    ${filters}

    <section class="section" id="projects-active">
      <div class="section-head"><h2 class="section-title">Featured active work</h2></div>
      <div class="grid grid-2">
        ${active.length ? active.map((p) => `<div class="proj-item" data-status="${esc(p.status)}">${projectCard(p, `#/projects/${p.slug}`)}</div>`).join("") : `<div class="empty-state">${icon("projects")}<p>No active projects. The next agreed relationship milestone will appear here.</p></div>`}
      </div>
    </section>

    ${history.length ? `<section class="section" id="projects-history">
      <div class="section-head"><h2 class="section-title">Completed &amp; archived</h2></div>
      <div class="grid grid-2">${history.map((p) => `<div class="proj-item" data-status="${esc(p.status)}">${projectCard(p, `#/projects/${p.slug}`)}</div>`).join("")}</div>
    </section>` : ""}
  </div>`;

  function onMount() {
    const sel = document.getElementById("f-status");
    const apply = () => {
      const v = sel.value;
      document.querySelectorAll(".proj-item").forEach((el) => {
        el.style.display = !v || el.dataset.status === v ? "" : "none";
      });
    };
    sel?.addEventListener("change", apply);
    document.getElementById("f-clear")?.addEventListener("click", () => { if (sel) sel.value = ""; apply(); });
  }

  return { crumb: portal.client.shortName, title: "Projects", html, onMount };
}
