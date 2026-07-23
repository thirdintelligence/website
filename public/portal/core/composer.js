/* Persistent, non-modal comment + new-project composer (plan 06). Live drafts
 * persist server-side by device; comments, requests, and attachments use the
 * tenant-authorized APIs. Preview mode simulates the same interaction locally. */
import { esc } from "./util.js";
import { icon } from "./icons.js";
import { apiSend, fetchLive, mergeBlockerComments } from "./data.js";
import { navigate } from "./router.js";

let dataRef = null;
let rerender = () => {};
let host = null;
let dock = null;
const emptyState = () => ({ open: false, minimized: false, mode: "comment", context: null, pos: null, fields: {}, files: [], editingId: null, submitting: false });
let state = emptyState();
let draftTimer = null;

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
    const edit = e.target.closest("[data-comment-edit]");
    const del = e.target.closest("[data-comment-delete]");
    if (edit) { e.preventDefault(); openEdit(edit.getAttribute("data-comment-edit")); }
    else if (del) { e.preventDefault(); deleteComment(del.getAttribute("data-comment-delete")); }
    else if (np) { e.preventDefault(); openProject(); }
    else if (cc) { e.preventDefault(); openComment(JSON.parse(cc.getAttribute("data-comment-context") || "{}")); }
    else if (addBtn) {
      e.preventDefault();
      const app = document.querySelector(".portal-app");
      const ctx = app?.dataset.pageCommentContext ? JSON.parse(app.dataset.pageCommentContext) : null;
      openComment(ctx || { scope: "home", label: "General comment" });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.open && !state.minimized) minimize();
  });

  restoreServerDraft();
}

function openComment(context) { open("comment", context); }
function openProject() { open("project", { scope: "new-project", label: "New project" }); }

function open(mode, context) {
  if (state.open && !state.editingId && hasDraftContent()) {
    restore();
    toast("Your current draft is open. Post it or delete it before starting another.");
    return;
  }
  state.open = true; state.minimized = false; state.mode = mode; state.context = context || {};
  state.editingId = null;
  state.files = [];
  state.fields = {};
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

async function deleteDraft() {
  if (state.editingId) {
    resetComposer();
    return;
  }
  if (!confirm("Delete this draft? This is the only way to discard it.")) return;
  clearTimeout(draftTimer);
  if (dataRef.cfg.mode === "live") await apiSend(dataRef.cfg, "/api/drafts", "DELETE");
  state = emptyState();
  host.hidden = true;
  renderDock();
}

function saveFields() {
  state.fields = {
    title: host.querySelector("#cmp-title")?.value || "",
    blocker: host.querySelector("#cmp-blocker")?.checked || false,
    project: host.querySelector("#cmp-project")?.value || "general",
    scene: host.querySelector("#cmp-scene")?.value || "",
    name: host.querySelector("#cmp-name")?.value || "",
    description: host.querySelector("#cmp-desc")?.value || ""
  };
}

function hasDraftContent() {
  const f = state.fields || {};
  return !!(f.title || f.name || f.description || state.files?.length);
}

function queueDraftSave() {
  if (state.editingId || state.submitting) return;
  saveFields();
  clearTimeout(draftTimer);
  draftTimer = setTimeout(persistDraft, 650);
}

async function persistDraft() {
  if (dataRef.cfg.mode !== "live" || !state.open || state.editingId || !hasDraftContent()) return;
  await apiSend(dataRef.cfg, "/api/drafts", "POST", { mode: state.mode, fields: state.fields, context: state.context || {} });
}

async function restoreServerDraft() {
  if (dataRef.cfg.mode !== "live") return;
  try {
    const res = await fetch(dataRef.cfg.routeBase + "/api/drafts", { credentials: "include", headers: { accept: "application/json" } });
    if (!res.ok) return;
    const { draft } = await res.json();
    if (!draft) return;
    state = { ...emptyState(), open: true, minimized: true, mode: draft.mode || "comment", context: draft.context || {}, fields: draft.fields || {} };
    renderDock();
  } catch { /* the portal remains usable when draft restore is temporarily unavailable */ }
}

function openEdit(id) {
  const comment = (dataRef.live?.comments || []).find((item) => item.id === id);
  if (!comment) return;
  state = {
    ...emptyState(), open: true, mode: "comment", editingId: id,
    context: comment.context || {},
    fields: { title: comment.title || "", description: comment.description || "", blocker: !!comment.blocker, project: comment.projectId || "general", scene: comment.context?.sceneId || "" }
  };
  host.hidden = false;
  render();
  position();
  host.querySelector("#cmp-title")?.focus();
}

async function deleteComment(id) {
  const comment = (dataRef.live?.comments || []).find((item) => item.id === id);
  if (!comment || !confirm(`Delete “${comment.title}”? This removes it from the client workspace but preserves the audit record.`)) return;
  if (dataRef.cfg.mode === "live") {
    const response = await apiSend(dataRef.cfg, `/api/comments/${encodeURIComponent(id)}`, "DELETE");
    if (!response.ok) { toast("Could not delete the comment. Try again."); return; }
    await refreshLive();
  } else {
    dataRef.live.comments = dataRef.live.comments.filter((item) => item.id !== id);
  }
  rerender();
  toast("Comment deleted.");
}

async function submit() {
  saveFields();
  const f = state.fields;
  const live = dataRef.cfg.mode === "live";
  clearValidation();

  if (state.mode === "comment" && !f.title.trim()) return validationError("cmp-title", "Add a short comment before posting.");
  if (state.mode === "project" && !f.name.trim()) return validationError("cmp-name", "Add a project name.");
  if (state.mode === "project" && !f.description.trim()) return validationError("cmp-desc", "Describe the project before submitting.");

  state.submitting = true;
  setSubmitState(true, state.files.length ? "Uploading attachments…" : "Saving…");
  let attachments = [];
  try {
    attachments = live ? await uploadFiles(state.files || []) : (state.files || []).map((file, index) => ({ id: `preview-attachment-${Date.now()}-${index}`, kind: file.type?.split("/")[0] || "file", name: file.name, sizeLabel: formatBytes(file.size) }));
  } catch (error) {
    state.submitting = false;
    setSubmitState(false, "");
    toast(`Attachment upload failed (${error.message || "network"}). Your draft is kept.`);
    return;
  }

  if (state.mode === "comment") {
    const projectId = state.context.projectId || (f.project === "general" ? "general" : f.project);
    /* Build context from the composer's project + scene selection, falling
       back to the original context for scene/timestamp comments opened inline. */
    const project = (dataRef.projects?.projects || []).find((p) => p.id === projectId);
    const sceneId = f.scene || state.context?.sceneId || undefined;
    /* Look up the scene title for a readable context label. */
    let sceneLabel = undefined;
    if (sceneId && project?.film) {
      const selectedIds = new Set(project.productionLifecycle?.selectedIdeaIds || []);
      const idea = project.film.ideas?.find((i) => selectedIds.has(i.slug) || i.recommended);
      const scene = idea?.scenes?.find((s) => s.id === sceneId);
      sceneLabel = scene?.title;
    }
    const ctx = {
      ...state.context,
      scope: sceneId ? "scene" : (projectId === "general" ? "home" : "project"),
      projectId,
      ...(sceneId ? { sceneId } : {}),
      label: sceneLabel || (sceneId ? `Scene ${sceneId}` : (project?.title || state.context?.label || "General comment")),
      ...(project ? { route: `/bkwatch/projects/${project.slug}` } : {})
    };
    if (live) {
      const payload = { title: f.title, blocker: f.blocker, projectId, description: f.description, attachments, context: ctx,
        ...(Number.isFinite(state.context.timestampMs) ? { timestampMs: state.context.timestampMs, rangeMs: state.context.rangeMs || 5000 } : {}) };
      /* Merged blocker comments (from projects.json) don't exist in the API
         store yet. When editing one, POST it as a new comment instead of
         PATCHing the non-existent record. */
      const isMergedBlocker = state.editingId && state.editingId.startsWith("blocker-");
      const path = state.editingId && !isMergedBlocker ? `/api/comments/${encodeURIComponent(state.editingId)}` : "/api/comments";
      const method = state.editingId && !isMergedBlocker ? "PATCH" : "POST";
      const r = await apiSend(dataRef.cfg, path, method, payload);
      if (!r.ok) { state.submitting = false; setSubmitState(false, ""); toast("Could not save comment (" + r.error + "). Your draft is kept."); return; }
      /* When editing a merged blocker, also update the local comment in-place
         so the page reflects the change immediately (the POST creates a new
         API record, but the original blocker lives in projects.json and would
         re-merge with the old scene if refreshLive has any issue). */
      if (isMergedBlocker) {
        const item = dataRef.live.comments.find((c) => c.id === state.editingId);
        if (item) Object.assign(item, { title: f.title, blocker: f.blocker, projectId, description: f.description, context: ctx });
      }
      await refreshLive();
      toast(state.editingId ? "Comment updated." : "Comment posted. Third i has been notified and will respond within 1-2 business days.");
    } else {
      if (state.editingId) {
        const item = dataRef.live.comments.find((comment) => comment.id === state.editingId);
        Object.assign(item || {}, { title: f.title, blocker: f.blocker, projectId, description: f.description, context: ctx });
      } else {
        dataRef.live.comments = dataRef.live.comments || [];
        dataRef.live.comments.unshift({ id: "preview-" + Date.now(), tenant: dataRef.cfg.tenant, kind: "comment", title: f.title, blocker: f.blocker, projectId, description: f.description, attachments, context: ctx, status: "open", attribution: `${dataRef.portal.client.shortName} commented`, createdAt: new Date().toISOString(), revision: 1 });
      }
      toast(state.editingId ? "Comment updated (preview)." : "Comment posted (preview). Production sends the owner notification.");
    }
  } else {
    if (live) {
      const r = await apiSend(dataRef.cfg, "/api/project-requests", "POST", { name: f.name, description: f.description, attachments });
      if (!r.ok) { state.submitting = false; setSubmitState(false, ""); toast("Could not submit request (" + r.error + "). Your draft is kept."); return; }
      dataRef.live.projectRequests = [r.data.request, ...(dataRef.live.projectRequests || []).filter((item) => item.id !== r.data.request.id)];
      toast("Project request submitted. Third i has been notified and will respond within 1-2 business days.");
      await clearServerDraft();
      const route = `/projects/requests/${r.data.request.id}`;
      resetComposer();
      rerender();
      navigate(route);
      return;
    } else {
      const request = { id: "preview-request-" + Date.now(), name: f.name, description: f.description, attachments, status: "Client proposed — awaiting Third i review", createdAt: new Date().toISOString() };
      dataRef.live.projectRequests = [request, ...(dataRef.live.projectRequests || [])];
      toast("Project request submitted (preview). Production creates the project and owner action.");
      await clearServerDraft();
      resetComposer();
      rerender();
      navigate(`/projects/requests/${request.id}`);
      return;
    }
  }

  await clearServerDraft();
  resetComposer();
  rerender();
}

async function refreshLive() {
  const l = await fetchLive(dataRef.cfg);
  if (l) {
    dataRef.live.comments = mergeBlockerComments(l.comments || [], dataRef.projects);
    dataRef.live.projectRequests = l.projectRequests || [];
    dataRef.cfg.csrfToken = l.csrfToken;
  }
}

async function clearServerDraft() {
  clearTimeout(draftTimer);
  if (dataRef.cfg.mode === "live" && !state.editingId) await apiSend(dataRef.cfg, "/api/drafts", "DELETE");
}

function resetComposer() {
  state = emptyState();
  host.hidden = true;
  renderDock();
}

/** Scene dropdown — shown when the selected project is a film with scenes. */
function renderSceneDropdown(projects) {
  const selectedProjectId = state.fields.project || state.context?.projectId || "general";
  if (selectedProjectId === "general") return "";
  const project = projects.find((p) => p.id === selectedProjectId);
  if (!project || project.type !== "film" || !project.film) return "";
  const selectedIds = new Set(project.productionLifecycle?.selectedIdeaIds || []);
  const idea = project.film.ideas?.find((i) => selectedIds.has(i.slug) || i.recommended);
  const scenes = idea?.scenes || [];
  if (!scenes.length) return "";
  const currentScene = state.fields.scene || state.context?.sceneId || "";
  return `<div class="field"><label for="cmp-scene">Scene</label>
    <select id="cmp-scene">
      <option value="" ${!currentScene ? "selected" : ""}>General (no specific scene)</option>
      ${scenes.map((s) => `<option value="${esc(s.id)}" ${currentScene === s.id ? "selected" : ""}>${esc(s.title)}</option>`).join("")}
    </select>
  </div>`;
}

function render() {
  const isProject = state.mode === "project";
  const isEditing = !!state.editingId;
  const projects = (dataRef.projects?.projects || []);
  const ctxLabel = state.context?.label || state.context?.scope;
  host.innerHTML = `
    <div class="composer-head" id="cmp-head">
      ${icon("grip", "drag")}
      <span class="composer-title">${isProject ? "Create a new project" : isEditing ? "Edit comment" : "Add a comment"}</span>
      <button class="btn btn-icon btn-sm composer-min" id="cmp-min" type="button" aria-label="Minimize">${icon("minus")}</button>
    </div>
    <div class="composer-body">
      ${ctxLabel && !isProject ? `<span class="ctx-chip">${icon("bookmark")} ${esc(ctxLabel)}</span>` : ""}
      ${isProject ? `
        <div class="field"><label for="cmp-name">Project name</label><input id="cmp-name" type="text" value="${esc(state.fields.name || "")}" placeholder="e.g. Compliance explainer film" aria-describedby="cmp-name-error" /><span class="field-error" id="cmp-name-error"></span></div>
      ` : `
        <div class="field"><label for="cmp-title">Comment</label><input id="cmp-title" type="text" value="${esc(state.fields.title || "")}" placeholder="What should we look at?" aria-describedby="cmp-title-error" /><span class="field-error" id="cmp-title-error"></span></div>
        <label class="toggle"><input id="cmp-blocker" type="checkbox" ${state.fields.blocker ? "checked" : ""}/><span class="track"></span><span>Mark as blocker</span></label>
        <div class="field"><label for="cmp-project">Project</label>
          <select id="cmp-project">
            <option value="general" ${(state.fields.project || state.context?.projectId || "general") === "general" ? "selected" : ""}>General</option>
            ${projects.map((p) => `<option value="${esc(p.id)}" ${(state.fields.project || state.context?.projectId) === p.id ? "selected" : ""}>${esc(p.title)}</option>`).join("")}
          </select>
        </div>
        ${renderSceneDropdown(projects)}
      `}
      <div class="field"><label for="cmp-desc">${isProject ? "Description / details" : "More details (optional)"}</label><textarea id="cmp-desc" placeholder="${isProject ? "Describe the idea, goals, and any assets." : "Add context…"}" aria-describedby="cmp-desc-error">${esc(state.fields.description || "")}</textarea><span class="field-error" id="cmp-desc-error"></span></div>
      ${isEditing ? "" : `<input id="cmp-file" class="visually-hidden" type="file" multiple accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
      <button class="btn btn-sm btn-outline" type="button" id="cmp-attach">${icon("paperclip")} Add attachment</button>
      <p class="composer-file-help">Up to 10 files. Client uploads remain private and await Third i review.</p>
      ${renderPendingFiles()}`}
      <p class="composer-status" id="cmp-status" role="status" aria-live="polite"></p>
    </div>
    <div class="composer-foot">
      <button class="btn btn-sm ${isEditing ? "btn-ghost" : "btn-danger"}" id="cmp-delete" type="button">${icon(isEditing ? "x" : "trash")} ${isEditing ? "Cancel" : "Delete draft"}</button>
      <span class="spacer"></span>
      <button class="btn btn-primary btn-sm" id="cmp-submit" type="button">${icon("arrowRight")} ${isProject ? "Submit request" : isEditing ? "Save changes" : "Post comment"}</button>
    </div>`;

  host.querySelector("#cmp-min").addEventListener("click", () => { saveFields(); minimize(); });
  host.querySelector("#cmp-delete").addEventListener("click", deleteDraft);
  host.querySelector("#cmp-submit").addEventListener("click", submit);
  host.querySelector("#cmp-attach")?.addEventListener("click", () => host.querySelector("#cmp-file")?.click());
  host.querySelector("#cmp-file")?.addEventListener("change", (event) => {
    const next = [...(state.files || []), ...Array.from(event.target.files || [])].slice(0, 10);
    state.files = next;
    saveFields();
    render();
  });
  host.querySelectorAll("[data-remove-file]").forEach((button) => button.addEventListener("click", () => {
    state.files.splice(Number(button.getAttribute("data-remove-file")), 1);
    saveFields();
    render();
  }));
  host.querySelectorAll("input:not([type=file]), textarea, select").forEach((control) => {
    control.addEventListener("input", queueDraftSave);
    control.addEventListener("change", queueDraftSave);
  });
  /* Re-render when project changes so the scene dropdown appears/disappears. */
  host.querySelector("#cmp-project")?.addEventListener("change", () => { saveFields(); render(); });
  enableDrag(host.querySelector("#cmp-head"));
}

function renderPendingFiles() {
  if (!state.files?.length) return "";
  return `<div class="composer-files" aria-label="Selected attachments">${state.files.map((file, index) => `<div class="composer-file"><span>${icon("paperclip")}<span><strong>${esc(file.name)}</strong><small>${formatBytes(file.size)}</small></span></span><button type="button" class="btn btn-icon btn-sm btn-ghost" data-remove-file="${index}" aria-label="Remove ${esc(file.name)}">${icon("x")}</button></div>`).join("")}</div>`;
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

function validationError(id, message) {
  const input = host.querySelector(`#${id}`);
  const error = host.querySelector(`#${id}-error`);
  input?.setAttribute("aria-invalid", "true");
  if (error) error.textContent = message;
  input?.focus();
}

function clearValidation() {
  host.querySelectorAll("[aria-invalid]").forEach((input) => input.removeAttribute("aria-invalid"));
  host.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
}

function setSubmitState(busy, message) {
  const submitButton = host.querySelector("#cmp-submit");
  if (submitButton) submitButton.disabled = busy;
  const status = host.querySelector("#cmp-status");
  if (status) status.textContent = message;
}

async function uploadFiles(files) {
  const attachments = [];
  for (let index = 0; index < files.length; index += 1) {
    setSubmitState(true, `Uploading ${index + 1} of ${files.length}: ${files[index].name}`);
    attachments.push(await uploadFile(files[index]));
  }
  return attachments;
}

async function uploadFile(file) {
  const initiated = await apiSend(dataRef.cfg, "/api/media/upload/initiate", "POST", {
    filename: file.name,
    sizeBytes: file.size,
    contentType: file.type || undefined,
    isClientUpload: true
  });
  if (!initiated.ok) throw new Error(initiated.error);
  const upload = initiated.data;
  try {
    if (upload.multipart) {
      const parts = [];
      const partSize = Number(upload.partSize);
      const partCount = Math.ceil(file.size / partSize);
      for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
        setSubmitState(true, `Uploading ${file.name} · part ${partNumber} of ${partCount}`);
        const signed = await apiSend(dataRef.cfg, "/api/media/upload/part", "POST", { assetId: upload.assetId, partNumber });
        if (!signed.ok) throw new Error(signed.error);
        const part = file.slice((partNumber - 1) * partSize, Math.min(file.size, partNumber * partSize));
        const result = await fetch(signed.data.url, { method: "PUT", body: part });
        if (!result.ok) throw new Error(`upload_${result.status}`);
        const etag = result.headers.get("etag");
        if (!etag) throw new Error("missing_upload_etag");
        parts.push({ partNumber, etag });
      }
      const completed = await apiSend(dataRef.cfg, "/api/media/upload/complete", "POST", { assetId: upload.assetId, parts });
      if (!completed.ok) throw new Error(completed.error);
    } else {
      const result = await fetch(upload.url, { method: "PUT", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
      if (!result.ok) throw new Error(`upload_${result.status}`);
      const completed = await apiSend(dataRef.cfg, "/api/media/upload/complete", "POST", { assetId: upload.assetId });
      if (!completed.ok) throw new Error(completed.error);
    }
  } catch (error) {
    await apiSend(dataRef.cfg, "/api/media/upload/abort", "POST", { assetId: upload.assetId });
    throw error;
  }
  return { id: upload.assetId, kind: file.type?.split("/")[0] || "file", name: file.name, sizeLabel: formatBytes(file.size) };
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
