/**
 * Portal v2 content + schema contract tests.
 * Enforces schema validity, migration parity, tenant isolation, client-safety,
 * no leaked local paths, and the frozen operational schema contracts.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSchemaRegistry, getContentValidator, getSchemaValidator, CONTENT_FILE_SCHEMA } from "../../lib/portal-schemas.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");
const DIR = resolve(ROOT, "content", "clients", "bkwatch");
const read = async (name) => JSON.parse(await readFile(resolve(DIR, name), "utf8"));

const ajv = await createSchemaRegistry();

test("every bkWatch v2 manifest validates against its schema", async () => {
  for (const file of Object.keys(CONTENT_FILE_SCHEMA)) {
    const data = await read(file);
    const validate = getContentValidator(ajv, file);
    assert.ok(validate(data), `${file}: ${JSON.stringify(validate.errors)}`);
  }
});

test("all manifests are tenant-scoped to bkwatch and client-safe", async () => {
  for (const file of Object.keys(CONTENT_FILE_SCHEMA)) {
    const data = await read(file);
    assert.equal(data.tenant, "bkwatch", `${file} tenant`);
    assert.equal(data.clientSafe, true, `${file} clientSafe`);
  }
});

test("no manifest leaks local filesystem paths or secrets", async () => {
  // Note: client-safe prompt COUNTS (e.g. "122-prompt inventory") are permitted
  // deliverable descriptions from the approved v1 canon; only prompt CONTENT and
  // local paths/secrets are forbidden, and content manifests never carry either.
  for (const file of Object.keys(CONTENT_FILE_SCHEMA)) {
    const raw = await readFile(resolve(DIR, file), "utf8");
    assert.doesNotMatch(raw, /\/Users\/|\/home\//, `${file} local path`);
    assert.doesNotMatch(raw, /PORTAL_SESSION_SECRET|PASSWORD_HASH|scrypt\$/, `${file} secret`);
  }
});

test("migration preserves film parity (9 ideas, 30 scenes)", async () => {
  const projects = await read("projects.json");
  const film = projects.projects.find((p) => p.type === "film");
  assert.ok(film, "film project present");
  assert.equal(film.film.ideas.length, 9);
  const scenes = film.film.ideas.reduce((n, i) => n + i.scenes.length, 0);
  assert.equal(scenes, 30);
});

test("project blockers are comment records and effort/value metrics are confirmed", async () => {
  const projects = await read("projects.json");
  const film = projects.projects.find((p) => p.type === "film");
  assert.equal(film.startedAt, "2026-07-01");
  assert.equal(film.hoursInvested, 20);
  assert.equal(film.deliverables.length, 8);
  assert.equal(film.deliverables.filter((d) => d.state === "done").length, 4);
  for (const blocker of film.blockers) {
    assert.equal(blocker.kind, "comment");
    assert.equal(blocker.blocker, true);
    assert.ok(blocker.title);
  }

  const home = await read("home.json");
  const blockers = home.needsAttention.filter((item) => item.blocker);
  assert.equal(blockers.length, 2);
  for (const blocker of blockers) assert.equal(blocker.kind, "comment");
  assert.equal(home.stats.find((stat) => stat.label === "Open blocker comments").value, 2);
});

test("Value & Results uses privacy-safe tenant evidence and future metric placeholders", async () => {
  const invoicing = await read("invoicing.json");
  assert.equal(invoicing.efficiencyModel.minCompletedProjects, 2);
  assert.equal(invoicing.efficiencyModel.completedProjectCount, 0);
  assert.deepEqual(invoicing.efficiencyModel.projects, []);
  assert.equal(invoicing.futureValueSections.length, 6);
  assert.equal(invoicing.financialSummary.partnershipHours, 20);
  assert.equal(invoicing.financialSummary.activeProjects, 1);
  assert.equal(invoicing.financialSummary.completedProjects, 0);
  assert.equal(invoicing.outcomes, undefined);
  assert.equal(invoicing.capabilities.length, 18);
  // All former "delivered"/"available" statuses changed to "active"
  assert.equal(invoicing.capabilities.some((c) => c.status === "delivered"), false);
  assert.equal(invoicing.capabilities.some((c) => c.status === "available"), false);
  // Active capabilities (green)
  assert.ok(invoicing.capabilities.some((c) => c.title === "Client Portal" && c.status === "active"));
  // Planned capabilities from the service catalog (yellow)
  assert.ok(invoicing.capabilities.some((c) => c.title === "Website Design & Development" && c.status === "planned"));
  assert.ok(invoicing.capabilities.some((c) => c.title === "Social Media Asset Generation" && c.status === "planned"));
  // AI integration items removed (inferred by all others)
  assert.equal(invoicing.capabilities.some((c) => c.title === "GenAI Integrations"), false);
  assert.equal(invoicing.capabilities.some((c) => c.title === "AI Tool Integration"), false);
  assert.equal(invoicing.capabilities.some((capability) => capability.title === "Monthly Video Series"), false);
  assert.match(invoicing.capabilities.find((capability) => capability.title === "AI Film Production").description, /ongoing monthly film series/i);
  assert.doesNotMatch(JSON.stringify(invoicing), /Shaw Systems|Amplify|614 hours|250 hours/i);
});

test("film lifecycle separates brainstorm directions, demo production, and full-film production", async () => {
  const projects = await read("projects.json");
  const film = projects.projects.find((p) => p.type === "film");
  assert.equal(film.title, "Film 1 - Shaw Integration");
  assert.equal(film.productionLifecycle.projectPhase, "demo-production");
  assert.equal(film.productionLifecycle.demoPhase, "building");
  assert.equal(film.productionLifecycle.fullFilmPhase, "not-started");
  assert.equal(film.productionLifecycle.promotionState, "embedded");
  for (const idea of film.film.ideas) {
    const expected = idea.slug === "final-demo" ? "in-production" : "ungenerated";
    for (const s of idea.scenes) assert.equal(s.mediaState, expected, `${idea.slug}/${s.id}`);
    assert.equal(idea.mediaPolicy, idea.slug === "final-demo" ? "demo-placeholders" : "none");
    assert.equal(idea.lifecycleState, idea.slug === "final-demo" ? "demo-production" : "brainstorm");
  }
});

test("AI Roadmap carries all 30 capabilities and never shows an opportunity as active", async () => {
  const ai = await read("ai-roadmap.json");
  assert.equal(ai.capabilities.length, 30);
  for (const c of ai.capabilities) {
    assert.ok(["active", "partial", "not-in-use", "needs-confirmation", "recommended-experiment"].includes(c.status));
    if (c.status !== "active") assert.notEqual(c.evidence, "Internal-confirmed-adoption");
  }
});

test("Library uses distinct communication subcategories and no 'past activity'", async () => {
  const lib = await read("library.json");
  const comms = lib.categories.find((c) => c.id === "communication");
  const subs = comms.subcategories.map((s) => s.id);
  assert.deepEqual(subs, ["comments", "emails", "meetings"]);
  const raw = JSON.stringify(lib).toLowerCase();
  assert.doesNotMatch(raw, /past activity/);
});

test("every Library record keeps at least one source reference", async () => {
  const lib = await read("library.json");
  for (const r of lib.records) assert.ok(r.sourceRefs.length >= 1, r.id);
});

test("search index is tenant-only and free of local paths", async () => {
  const idx = await read("search-index.json");
  assert.equal(idx.tenant, "bkwatch");
  assert.ok(idx.entries.length > 0);
  for (const e of idx.entries) assert.match(e.route, /^\/bkwatch(\/|#|$)/, e.id);
});

/* ── Frozen operational contracts ────────────────────────────────────────────── */

test("comment schema accepts a valid record and rejects a missing tenant", () => {
  const v = getSchemaValidator(ajv, "comment.schema.json");
  const good = { id: "c1", tenant: "bkwatch", kind: "comment", title: "Please review scene F03", blocker: false, projectId: "film1-shaw-bkwatch", status: "open", attribution: "bkWatch commented", createdAt: "2026-07-17T00:00:00Z", revision: 1 };
  assert.ok(v(good), JSON.stringify(v.errors));
  const bad = { ...good }; delete bad.tenant;
  assert.equal(v(bad), false);
});

test("action, project-request, and audit-event schemas accept valid fixtures", () => {
  const action = getSchemaValidator(ajv, "action.schema.json");
  assert.ok(action({ id: "a1", tenant: "bkwatch", type: "comment", projectId: "general", title: "New comment", priority: 0, status: "open", sourceEventId: "e1", executable: true, createdAt: "2026-07-17T00:00:00Z" }), JSON.stringify(action.errors));

  const req = getSchemaValidator(ajv, "project-request.schema.json");
  assert.ok(req({ id: "r1", tenant: "bkwatch", kind: "client_project_request", name: "Explainer film", description: "A short explainer for compliance leaders.", status: "Client proposed — awaiting Third i review", createdAt: "2026-07-17T00:00:00Z", revision: 1 }), JSON.stringify(req.errors));

  const ev = getSchemaValidator(ajv, "audit-event.schema.json");
  assert.ok(ev({ id: "e1", tenant: "bkwatch", type: "comment.created", subjectId: "c1", actor: "client", at: "2026-07-17T00:00:00Z" }), JSON.stringify(ev.errors));
});
