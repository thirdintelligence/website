/* Projects index (plan 05). */
import { esc } from "../core/util.js";
import { icon } from "../core/icons.js";
import { projectCard, cardAction, motif, statusLabel } from "../components/cards.js";

export function render(data) {
  const { projects, portal } = data;
  const all = projects.projects;
  const requests = liveRequests(data);
  const statuses = [...new Set([...all.map((p) => p.status), ...(requests.length ? ["client-proposed"] : [])])];

  const filters = `<div class="filters" role="group" aria-label="Filter projects">
    ${icon("filter")}
    <label class="visually-hidden" for="f-search">Search projects</label>
    <input class="filter-search" id="f-search" type="search" placeholder="Search projects" autocomplete="off" />
    <select class="filter-select" id="f-status" aria-label="Status">
      <option value="">All statuses</option>
      ${statuses.map((s) => `<option value="${esc(s)}">${esc(s[0].toUpperCase() + s.slice(1))}</option>`).join("")}
    </select>
    <button class="btn btn-sm btn-ghost filter-clear" id="f-clear" type="button">Clear</button>
  </div>`;

  const html = `<div class="page filter-page">
    <div>
      <h1 class="page-title">Projects</h1>
      <p class="page-lede">Active, completed, paused, and archived work for ${esc(portal.client.name)}. Open a project for its creative presentation, assets, and outcomes.</p>
    </div>
    <div class="new-project-action"><button class="btn btn-primary" id="new-project-btn" type="button" data-new-project="1"><span class="control-content">${icon("plus")}<span>Create a New Project</span></span></button></div>

    ${filters}

    ${requests.length ? `<section class="section" id="projects-proposed">
      <div class="section-head"><h2 class="section-title">Client-proposed projects</h2><span class="muted">${requests.length} awaiting review</span></div>
      <div class="project-list">${requests.map(requestCard).join("")}</div>
    </section>` : ""}

    <section class="section" id="projects-all">
      <div class="project-list">
        ${all.length ? all.map((p) => `<div class="proj-item" data-status="${esc(p.status)}" data-search="${esc(projectSearchText(p))}">${projectCard(p, `#/projects/${p.slug}`)}</div>`).join("") : `<div class="empty-state">${icon("projects")}<p>No projects yet.</p></div>`}
      </div>
    </section>
  </div>`;

  function onMount() {
    const sel = document.getElementById("f-status");
    const search = document.getElementById("f-search");
    const apply = () => {
      const v = sel.value;
      const q = (search?.value || "").trim().toLowerCase();
      document.querySelectorAll(".proj-item").forEach((el) => {
        const statusMatch = !v || el.dataset.status === v;
        const searchMatch = !q || (el.dataset.search || "").includes(q);
        el.style.display = statusMatch && searchMatch ? "" : "none";
      });
    };
    sel?.addEventListener("change", apply);
    search?.addEventListener("input", apply);
    document.getElementById("f-clear")?.addEventListener("click", () => { if (sel) sel.value = ""; if (search) search.value = ""; apply(); });
  }

  return { crumb: portal.client.shortName, title: "Projects", html, onMount };
}

function liveRequests(data) {
  return (data.live?.projectRequests || []).filter(Boolean);
}

function projectSearchText(project) {
  return [project.title, project.projectType, project.status, project.statusLabel, project.valueStatement, project.objective].filter(Boolean).join(" ").toLowerCase();
}

function requestCard(request) {
  return `<div class="proj-item" data-status="client-proposed" data-search="${esc([request.name, request.description, request.status].join(" ").toLowerCase())}">
    <a class="card card-feature project-card project-request-card card-link" href="#/projects/requests/${esc(request.id)}">
      ${motif("grid")}
      <div class="pc-body">
        <div class="pc-meta project-card-badges">${statusLabel("Client proposed", "warn", true)}</div>
        <h3 class="pc-title">${esc(request.name)}</h3>
        <p class="pc-value">${esc(request.description)}</p>
        ${cardAction("Open request")}
      </div>
    </a>
  </div>`;
}
