import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSchemaRegistry, getContentValidator } from "../../lib/portal-schemas.mjs";
import { REQUIRED_TENANT_MANIFESTS } from "../../config/portal-tenants.mjs";
import { mediaFrame, versionHistory } from "../../public/portal/components/media.js";
import { render as renderProjectDetail } from "../../public/portal/pages/project-detail.js";

const ROOT = resolve(import.meta.dirname, "..", "..");
const CONTENT = resolve(ROOT, "content", "clients", "shaw");
const read = async (file) => JSON.parse(await readFile(resolve(CONTENT, file), "utf8"));

test("every promoted Shaw manifest validates, is client-safe, and stays in its tenant", async () => {
  const ajv = await createSchemaRegistry();
  for (const file of REQUIRED_TENANT_MANIFESTS) {
    const manifest = await read(file);
    const validate = getContentValidator(ajv, file);
    assert.ok(validate(manifest), `${file}: ${JSON.stringify(validate.errors)}`);
    assert.equal(manifest.tenant, "shaw", file);
    assert.equal(manifest.clientSafe, true, file);
    const raw = JSON.stringify(manifest);
    assert.doesNotMatch(raw, /\/Users\/|file:\/\/|memory\/SHAW|Film[1234]_Agent|BankruptcyWatch|"tenant":"bkwatch"/i, file);
  }
});

test("Shaw projects preserve completed work, honest gates, scenes, and version history", async () => {
  const { projects } = await read("projects.json");
  assert.equal(projects.length, 4);

  const film1 = projects.find((project) => project.id === "shaw-film1-conference");
  const film2 = projects.find((project) => project.id === "shaw-film2-amplify");
  const film3 = projects.find((project) => project.id === "shaw-film3-ai-advisor");
  const film4 = projects.find((project) => project.id === "shaw-film4-insight");

  assert.equal(film1.status, "completed");
  assert.equal(film1.title, "Film 1 — 2026 Conference Video");
  assert.equal(film1.slug, "film1-conference");
  assert.equal(film1.hoursInvested, 365);
  assert.equal(film1.runtime, "202 seconds");
  assert.equal(film1.sceneMediaPolicy, "hero-only");
  assert.equal(film1.film.ideas[0].scenes.length, 18);
  assert.equal(film1.productionLifecycle.projectPhase, "delivered");
  assert.equal(film1.assets[0].versions[0].downloadName, "film1.final.mov");

  assert.equal(film2.status, "completed");
  assert.equal(film2.hoursInvested, 237);
  assert.match(film2.runtime, /160 seconds/);
  assert.equal(film2.sceneMediaPolicy, "hero-only");
  assert.equal(film2.film.ideas.length, 2);
  assert.equal(film2.film.ideas.find((idea) => idea.versionLabel === "V1").title, "V1 - Accident+Disasters");
  assert.equal(film2.film.ideas.find((idea) => idea.versionLabel === "V1").scenes.length, 9);
  assert.equal(film2.film.ideas.find((idea) => idea.versionLabel === "V2").scenes.length, 9);
  assert.deepEqual(
    film2.assets.flatMap((asset) => asset.versions.map((version) => version.downloadName)),
    ["film2.final.V1.mov", "film2.final.V2.mov"]
  );

  assert.equal(film3.status, "active");
  assert.equal(film3.productionLifecycle.selectedIdeaIds.length, 1);
  assert.equal(film3.film.ideas.length, 4);
  const brainstormIdeas = film3.film.ideas.filter((idea) => idea.lifecycleState === "brainstorm");
  assert.equal(brainstormIdeas.length, 3);
  assert.ok(brainstormIdeas.every((idea) => idea.mediaPolicy === "none"));
  const productionIdea = film3.film.ideas.find((idea) => idea.slug === "two-weeks-early");
  assert.ok(productionIdea, "production lane should exist");
  assert.equal(productionIdea.lifecycleState, "demo-production");
  assert.equal(productionIdea.mediaPolicy, "real-media");
  assert.equal(productionIdea.recommended, true);
  assert.match(film3.phase, /demo production/i);
  assert.deepEqual(film3.blockers, []);
  assert.equal(film3.sceneMediaPolicy, "scene-previews");
  assert.equal(film3.startedAt, "2026-07-14");
  assert.ok(film3.hoursInvested >= 95, "film3 should track invested hours from accounting");
  assert.equal(film3.comment?.openBlockers, 0, "openBlockers should match actual blocker count");
  assert.ok(film3.assets && film3.assets.length >= 9, "film3 should have 9 assets (8 stills + 1 VO)");
  assert.ok(!film3.assets.some((a) => a.kind === "video"), "film3 should have no video assets until motion is produced");
  const scenesWithMedia = productionIdea.scenes.filter((s) => s.assetIds && s.assetIds.length > 0);
  assert.equal(scenesWithMedia.length, 8, "8 scenes should have approved stills");

  assert.equal(film4.status, "proposed");
  assert.equal(film4.film, undefined);
  assert.match(film4.statusLabel, /scope not approved/i);
});

test("Shaw Films 1 and 2 show final media once in the hero without repeated scene previews", async () => {
  const projects = await read("projects.json");
  const data = {
    cfg: { routeBase: "/shaw" },
    projects,
    portal: {},
    live: { comments: [] },
    invoicing: null
  };

  for (const slug of ["film1-conference", "film2-amplify"]) {
    const project = projects.projects.find((item) => item.slug === slug);
    const selectedIds = new Set(project.productionLifecycle.selectedIdeaIds);
    const selectedIdea = project.film.ideas.find((idea) => selectedIds.has(idea.slug) || idea.recommended);
    const page = renderProjectDetail(data, { slug });
    const repeatedSceneMediaCount = (page.html.match(/class="scene-media"/g) || []).length;
    const textOnlySceneCount = (page.html.match(/selected-demo-scene scene-block-text-only/g) || []).length;

    assert.match(page.html, /class="project-preview scene-media"/);
    assert.equal(repeatedSceneMediaCount, 0, `${slug} should not repeat media inside scene records`);
    assert.equal(textOnlySceneCount, selectedIdea.scenes.length);
    assert.match(page.html, /latest final media is presented once in the project hero/i);
    assert.match(page.html, /Storyboard &amp; script/);
    const selectedTitle = page.html.indexOf(`<h2>${selectedIdea.title}</h2>`);
    const selectedMeta = page.html.indexOf('class="hero-metaline selected-demo-meta"');
    const selectedPolicy = page.html.indexOf('class="reading muted selected-demo-policy"');
    const storyboard = page.html.indexOf("Storyboard &amp; script");
    assert.ok(
      selectedTitle >= 0
        && selectedTitle < selectedMeta
        && selectedMeta < selectedPolicy
        && selectedPolicy < storyboard,
      `${slug} should group scene/runtime/delivery metadata directly beneath the selected title`
    );
    if (slug === "film2-amplify") {
      assert.match(page.html, /Amplify — delivered cut V2/);
      assert.match(page.html, /Amplify — delivered cut V1/);
      assert.match(page.html, /data-media-version-carousel data-current-index="1"/);
      assert.match(page.html, /data-media-version-prev/);
      assert.match(page.html, /data-media-version-next[^>]*hidden/);
      assert.match(page.html, /data-media-version-count>2 of 2/);
    }
  }
});

test("Shaw homepage attention is reserved for exceptional Third i flags and recommendations", async () => {
  const home = await read("home.json");
  assert.deepEqual(home.needsAttention, []);
});

test("approved Shaw editorial versions expose only their registered secure playback and download controls", async () => {
  const { projects } = await read("projects.json");
  const film1 = projects.find((project) => project.id === "shaw-film1-conference");
  const film2 = projects.find((project) => project.id === "shaw-film2-amplify");
  const finalAsset = film1.assets[0];
  const finalVersion = finalAsset.versions[0];

  assert.match(finalVersion.mediaId, /^ast_/);
  assert.deepEqual(
    film2.assets.flatMap((asset) => asset.versions.map((version) => version.mediaId)),
    ["ast_ms5dz0qodc6705c6832f", "ast_ms5dz77090b8a1c7f9d0"]
  );

  const frame = mediaFrame({
    mediaState: film1.thumbnail.mediaState,
    label: film1.thumbnail.label,
    assetId: finalVersion.mediaId
  });
  const versions = versionHistory(finalAsset);

  assert.doesNotMatch(frame, /secure playback transfer pending/i);
  assert.match(frame, new RegExp(`data-media-playback="${finalVersion.mediaId}"`));
  assert.doesNotMatch(versions, /Secure transfer pending/);
  assert.match(versions, new RegExp(`data-media-download="${finalVersion.mediaId}"`));
});

test("project ownership comes from the tenant record, never company words in a title", async () => {
  const shaw = await read("projects.json");
  const bkwatch = JSON.parse(await readFile(
    resolve(ROOT, "content", "clients", "bkwatch", "projects.json"),
    "utf8"
  ));
  const shawFilm1 = shaw.projects.find((project) => project.id === "shaw-film1-conference");
  const bkwatchFilm1 = bkwatch.projects.find((project) => project.id === "film1-shaw-bkwatch");

  assert.equal(shaw.tenant, "shaw");
  assert.match(shawFilm1.title, /Conference Video/);
  assert.doesNotMatch(shawFilm1.title, /Integration/);

  assert.equal(bkwatch.tenant, "bkwatch");
  assert.match(bkwatchFilm1.title, /shaw/i);
  assert.equal(bkwatchFilm1.projectType, "shaw-bkWatch");
  assert.notEqual(bkwatchFilm1.id, shawFilm1.id);
});

test("Shaw Library and AI Roadmap are substantial and preserve unknown states", async () => {
  const library = await read("library.json");
  const ai = await read("ai-roadmap.json");
  assert.equal(library.categories.length, 6);
  assert.ok(library.records.length >= 20);
  assert.ok(library.records.every((record) => record.sourceRefs.length > 0));
  assert.ok(library.categories.find((category) => category.id === "communication")
    .subcategories.some((subcategory) => subcategory.id === "meetings"));

  assert.equal(ai.categories.length, 10);
  assert.ok(ai.capabilities.length >= 20);
  assert.ok(ai.capabilities.every((capability) => capability.source && capability.recommendation));
  assert.ok(ai.capabilities.some((capability) => capability.status === "needs-confirmation"));
  assert.ok(ai.capabilities.some((capability) => capability.status === "recommended-experiment"));
  assert.ok(ai.capabilities.some((capability) => capability.status === "active"));
  assert.equal(
    ai.capabilities.find((capability) => capability.id === "shaw-new-hire-assist").status,
    "recommended-experiment"
  );
  const teamTraining = ai.capabilities.find((capability) => capability.id === "shaw-ai-marketing-training");
  assert.equal(teamTraining.status, "needs-confirmation");
  assert.match(teamTraining.detail, /required Shaw training completed by Third i/i);
  assert.match(teamTraining.detail, /not training delivered to Shaw employees/i);

  const requiredTraining = library.records.find((record) => record.id === "shaw-engagement-training");
  assert.equal(requiredTraining.title, "Required Shaw training");
  assert.match(requiredTraining.summary, /not training delivered to Shaw's team/i);
});

test("Shaw uses the shared partnership roadmap from April 2026 through April 2027", async () => {
  const shaw = await read("roadmap.json");
  const bkwatch = JSON.parse(await readFile(
    resolve(ROOT, "content", "clients", "bkwatch", "roadmap.json"),
    "utf8"
  ));
  assert.equal(shaw.templateId, "client-partnership-v1");
  assert.equal(shaw.startMonth, "2026-04");
  assert.equal(shaw.endMonth, "2027-04");
  assert.equal(shaw.months.length, 12);
  assert.equal(shaw.months[0].label, "April 2026");
  assert.equal(shaw.months.at(-1).label, "March 2027");
  assert.deepEqual(
    shaw.milestones.map(({ month, title }) => ({ month, title })),
    bkwatch.milestones.map(({ month, title }) => ({ month, title }))
  );
});

test("Shaw chrome identifies the client portal and the metric counts total films", async () => {
  const portal = await read("portal.json");
  const home = await read("home.json");
  const invoicing = await read("invoicing.json");
  const shell = await readFile(resolve(ROOT, "public", "portal", "core", "shell.js"), "utf8");
  const shawStyles = await readFile(
    resolve(ROOT, "public", "portal", "styles", "tenants", "shaw.css"),
    "utf8"
  );
  const shellStyles = await readFile(
    resolve(ROOT, "public", "portal", "styles", "portal-shell.css"),
    "utf8"
  );
  const componentStyles = await readFile(
    resolve(ROOT, "public", "portal", "styles", "portal-components.css"),
    "utf8"
  );
  const pageStyles = await readFile(
    resolve(ROOT, "public", "portal", "styles", "portal-pages.css"),
    "utf8"
  );
  assert.equal(portal.client.name, "Shaw Systems");
  assert.equal(invoicing.metrics.filmsTotal.count, 3);
  assert.equal(invoicing.metrics.finishedSeconds.count, 362);
  assert.equal(invoicing.metrics.hoursInvested.hours, 662);
  assert.equal(home.stats.find((metric) => metric.label === "Total relationship effort").value, 662);
  assert.match(invoicing.metrics.filmsTotal.label, /Amplify versions and loop assets are not separate films/i);
  assert.match(shell, /brand-name.*\$\{c\.shortName \|\| c\.name\}/s);
  assert.match(shell, /Client portal/);
  assert.equal(portal.client.logoShape, "square");
  assert.match(shell, /data-logo-shape="\$\{c\.logoShape \|\| "rect"\}"/);
  assert.doesNotMatch(shawStyles, /\.brand-text\s*\{\s*display:\s*none/);
  assert.doesNotMatch(shawStyles, /\.project-hero::after/);
  assert.match(shellStyles, /\[data-logo-shape="square"\] \.sidebar-brand\s*\{[^}]*gap:\s*8px/);
  assert.match(shellStyles, /\[data-logo-shape="square"\] \.sidebar-brand\s*\{[^}]*height:\s*var\(--topbar-h\)[^}]*min-height:\s*var\(--topbar-h\)/);
  assert.match(shellStyles, /\[data-logo-shape="square"\] \.sidebar-brand \.brand-logo-light,[\s\S]*?width:\s*78px[\s\S]*?height:\s*78px/);
  assert.match(shellStyles, /\.sidebar-brand\s*\{[^}]*padding:\s*0 var\(--space-2\)/);
  assert.match(componentStyles, /\.motif-rings\s*\{[^}]*opacity:\s*\.1;\s*filter:\s*blur\(10px\)/);
  assert.match(componentStyles, /\.project-version-grid \.version-history > h4\s*\{\s*margin-bottom:\s*var\(--space-2\)/);
  assert.match(pageStyles, /\.selected-demo-workspace > \.selected-demo-meta\s*\{\s*margin:\s*0 0 var\(--space-4\)/);
  assert.match(pageStyles, /\.selected-demo-workspace > \.selected-demo-storyboard-head\s*\{[^}]*margin-top:\s*var\(--space-6\)[^}]*border-top:\s*1px solid var\(--line-plain\)/);
});

test("Shaw inherits the shared Services & Capabilities catalog used by bkWatch", async () => {
  const shaw = await read("invoicing.json");
  const bkwatch = JSON.parse(await readFile(
    resolve(ROOT, "content", "clients", "bkwatch", "invoicing.json"),
    "utf8"
  ));
  const normalize = (catalog) => JSON.parse(
    JSON.stringify(catalog)
      .replaceAll("Shaw Systems", "{{clientName}}")
      .replaceAll("Shaw's", "{{clientPossessive}}")
      .replaceAll("bkWatch's", "{{clientPossessive}}")
      .replaceAll("bkWatch", "{{clientName}}")
  );
  assert.deepEqual(normalize(shaw.serviceCatalog), normalize(bkwatch.serviceCatalog));
  assert.deepEqual(
    shaw.futureValueSections.map(({ title, icon }) => ({ title, icon })),
    [
      { title: "Delivery speed", icon: "zap" },
      { title: "Deliverable quality", icon: "sparkles" },
      { title: "Output volume", icon: "layers" },
      { title: "Financial return", icon: "dollar" },
      { title: "Compounding capability", icon: "muscle" },
      { title: "Project confidence", icon: "graph" }
    ]
  );
});

test("Shaw communications exclude raw signatures, addresses, links, and personal contact details", async () => {
  const communications = await read("communications.json");
  const raw = JSON.stringify(communications);
  assert.doesNotMatch(raw, /@gmail\.com|@shawsystems\.com|\b281[-.) ]|Richmond Ave|https?:\/\/|REGISTER NOW|\[cid:/i);
  assert.ok(communications.emails.every((email) => email.snippet.length <= 300 && email.preview.length <= 600));
  assert.ok(communications.meetings.every((meeting) => meeting.attendees.every((attendee) => !attendee.includes("@"))));
});
