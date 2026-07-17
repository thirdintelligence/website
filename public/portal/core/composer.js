/* Persistent, non-modal comment + new-project composer (plan 06).
 *
 * PREVIEW SCOPE: drafts persist in memory across client-side route changes and
 * posting is simulated locally so the design is reviewable. Production (Phase 3,
 * gated by DATA-01) replaces this with the server-side draft store, the
 * operational comment write, and the ceo@thirdi.net notification — NOT localStorage.
 */
import { esc } from "./util.js";
import { icon } from "./icons.js";
import { apiSend, fetchLive } from "./data.js";

let dataRef = null;
let rerender = () => {};
let host = null;
let dock = null;
let state = { open: false, minimized: false, mode: "comment", context: null, pos: null, fields: {} };

export function initComposer(data, hooks = {}) {
  dataRef = data;
  rerender = hooks.rerender || (() => {});
  dock = document.getElementById("draft-dock");
  host = document.createElement("div");
  host.className = "composer";
  host.hidden = true;
  host.setAttribute("role", "dialog");
  host.setAttribute("aria-label", "Comment composer");
  document.body.appendChild(host);

  // Delegated triggers anywhere in the app.
  document.addEventListener("click", (e) => {
    const cc = e.target.closest("[data-comment-context]");
    const np = e.target.closest("[data-new-project]");
    const addBtn = e.target.closest("#add-comment-btn");
    if (np) { e.preventDefault(); openProject(); }
    else if (cc) { e.preventDefault(); openComment(JSON.parse(cc.getAttribute("data-comment-context") || "{}")); }
    else if (addBtn) { e.preventDefault(); openComment({ scope: "home", label: "General comment" }); }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.open && !state.minimized) minimize();
  });
}

function openComment(context) { open("comment", context); }
function openProject() { open("project", { scope: "new-project", label: "New project" }); }

function open(mode, context) {
  state.open = true; state.minimized = false; state.mode = mode; state.context = context || {};
  host.hidden = false;
  render();
  position();
  const first = host.querySelector("input, textarea, select");
  first && first.focus();
}

function minimize() {
  state.minimized = true;
  host.hidden = true;
  renderDock();
}

function restore() {
  state.minimized = false;
  host.hidden = false;
  renderDock();
  render();
}

function deleteDraft() {
  if (!confirm("Delete this draft? This is the only way to discard it.")) return;
  state = { open: false, minimized: false, mode: "comment", context: null, pos: null, fields: {} };
  host.hidden = true;
  renderDock();
}

function saveFields() {
  state.fields = {
    title: host.querySelector("#cmp-title")?.value || "",
    blocker: host.querySelector("#cmp-blocker")?.checked || false,
    project: host.querySelector("#cmp-project")?.value || "general",
    name: host.querySelector("#cmp-name")?.value || "",
    description: host.querySelector("#cmp-desc")?.value || ""
  };
}

async function submit() {
  saveFields();
  const f = state.fields;
  const live = dataRef.cfg.mode === "live";

  if (state.mode === "comment") {
    if (!f.title.trim()) { host.querySelector("#cmp-title")?.focus(); return; }
    const projectId = state.context.projectId || (f.project === "general" ? "general" : f.project);
    if (live) {
      const payload = { title: f.title, blocker: f.blocker, projectId, description: f.description, context: { ...state.context },
        ...(Number.isFinite(state.context.timestampMs) ? { timestampMs: state.context.timestampMs, rangeMs: state.context.rangeMs || 5000 } : {}) };
      const r = await apiSend(dataRef.cfg, "/api/comments", "POST", payload);
      if (!r.ok) { toast("Could not post comment (" + r.error + "). Your draft is kept."); return; }
      await refreshLive();
      toast("Comment posted. Third i has been notified at portal@thirdi.net.");
    } else {
      dataRef.live.comments = dataRef.live.comments || [];
      dataRef.live.comments.unshift({ id: "preview-" + Date.now(), tenant: dataRef.cfg.tenant, kind: "comment", title: f.title, blocker: f.blocker, projectId, description: f.description, context: { ...state.context }, status: "open", attribution: `${dataRef.portal.client.shortName} commented`, createdAt: new Date().toISOString(), revision: 1 });
      toast("Comment posted (preview). In production this writes to the store and emails portal@thirdi.net.");
    }
  } else {
    if (!f.name.trim() || !f.description.trim()) return;
    if (live) {
      const r = await apiSend(dataRef.cfg, "/api/project-requests", "POST", { name: f.name, description: f.description });
      if (!r.ok) { toast("Could not submit request (" + r.error + "). Your draft is kept."); return; }
      toast("Project request submitted. Third i has been notified at portal@thirdi.net.");
    } else {
      toast("Project request drafted (preview). In production this creates a client-proposed project + OS action.");
    }
  }

  state = { open: false, minimized: false, mode: "comment", context: null, pos: null, fields: {} };
  host.hidden = true;
  renderDock();
  rerender();
}

async function refreshLive() {
  const l = await fetchLive(dataRef.cfg);
  if (l) { dataRef.live.comments = l.comments || []; dataRef.cfg.csrfToken = l.csrfToken; }
}

function render() {
  const isProject = state.mode === "project";
  const projects = (dataRef.projects?.projects || []);
  const ctxLabel = state.context?.label || state.context?.scope;
  host.innerHTML = `
    <div class="composer-head" id="cmp-head">
      ${icon("grip", "drag")}
      <span class="composer-title">${isProject ? "Create a new project" : "Add a comment"}</span>
      <button class="btn btn-icon btn-sm composer-min" id="cmp-min" type="button" aria-label="Minimize">${icon("minus")}</button>
    </div>
    <div class="composer-body">
      ${ctxLabel && !isProject ? `<span class="ctx-chip">${icon("bookmark")} ${esc(ctxLabel)}</span>` : ""}
      ${isProject ? `
        <div class="field"><label for="cmp-name">Project name</label><input id="cmp-name" type="text" value="${esc(state.fields.name || "")}" placeholder="e.g. Compliance explainer film" /></div>
      ` : `
        <div class="field"><label for="cmp-title">Comment</label><input id="cmp-title" type="text" value="${esc(state.fields.title || "")}" placeholder="What should we look at?" /></div>
        <label class="toggle"><input id="cmp-blocker" type="checkbox" ${state.fields.blocker ? "checked" : ""}/><span class="track"></span><span>Mark as blocker</span></label>
        <div class="field"><label for="cmp-project">Project</label>
          <select id="cmp-project">
            <option value="general">General</option>
            ${projects.map((p) => `<option value="${esc(p.id)}" ${state.context?.projectId === p.id ? "selected" : ""}>${esc(p.title)}</option>`).join("")}
          </select>
        </div>
      `}
      <div class="field"><label for="cmp-desc">${isProject ? "Description / details" : "More details (optional)"}</label><textarea id="cmp-desc" placeholder="${isProject ? "Describe the idea, goals, and any assets." : "Add context…"}">${esc(state.fields.description || "")}</textarea></div>
      <button class="btn btn-sm btn-outline" type="button" id="cmp-attach">${icon("paperclip")} Add attachment</button>
    </div>
    <div class="composer-foot">
      <button class="btn btn-sm btn-danger" id="cmp-delete" type="button">${icon("trash")} Delete draft</button>
      <span class="spacer"></span>
      <button class="btn btn-primary btn-sm" id="cmp-submit" type="button">${icon("arrowRight")} ${isProject ? "Submit request" : "Post comment"}</button>
    </div>`;

  host.querySelector("#cmp-min").addEventListener("click", () => { saveFields(); minimize(); });
  host.querySelector("#cmp-delete").addEventListener("click", deleteDraft);
  host.querySelector("#cmp-submit").addEventListener("click", submit);
  host.querySelector("#cmp-attach").addEventListener("click", () => toast("Attachments upload via a tenant-authorized direct transfer (gated DATA-02)."));
  enableDrag(host.querySelector("#cmp-head"));
}

function renderDock() {
  if (!dock) return;
  if (state.open && state.minimized) {
    const label = state.mode === "project" ? "New project draft" : (state.fields.title || "Comment draft");
    dock.innerHTML = `<button class="btn btn-outline" id="dock-restore" type="button">${icon("comment")} ${esc(label)}</button>`;
    dock.querySelector("#dock-restore").addEventListener("click", restore);
  } else {
    dock.innerHTML = "";
  }
}

function position() {
  if (state.pos) { host.style.left = state.pos.x + "px"; host.style.top = state.pos.y + "px"; host.style.right = "auto"; host.style.bottom = "auto"; return; }
  host.style.right = "24px"; host.style.bottom = "24px"; host.style.left = "auto"; host.style.top = "auto";
}

function enableDrag(handle) {
  if (!handle) return;
  let sx, sy, ox, oy, dragging = false;
  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    dragging = true; handle.setPointerCapture(e.pointerId);
    const r = host.getBoundingClientRect(); ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
    host.style.left = ox + "px"; host.style.top = oy + "px"; host.style.right = "auto"; host.style.bottom = "auto";
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const x = Math.max(8, Math.min(window.innerWidth - host.offsetWidth - 8, ox + e.clientX - sx));
    const y = Math.max(8, Math.min(window.innerHeight - 60, oy + e.clientY - sy));
    host.style.left = x + "px"; host.style.top = y + "px"; state.pos = { x, y };
  });
  handle.addEventListener("pointerup", () => { dragging = false; });
}

function toast(msg) {
  let t = document.createElement("div");
  t.className = "portal-toast";
  t.textContent = msg;
  Object.assign(t.style, { position: "fixed", left: "50%", bottom: "24px", transform: "translateX(-50%)", zIndex: 90, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--line-strong)", borderRadius: "12px", padding: "12px 16px", boxShadow: "var(--shadow-lg)", maxWidth: "min(560px, 92vw)", fontSize: "0.875rem" });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}
