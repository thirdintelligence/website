/**
 * build-client-manifest.mjs
 *
 * Deterministic migration from the v1 single-file client manifest
 * (content/clients/<tenant>.json) into the sanitized v2 page manifests
 * (content/clients/<tenant>/{portal,home,projects,library,ai-roadmap}.json).
 *
 * Principles:
 *  - Parity first: every v1 fact is carried into v2; nothing client-facing is
 *    dropped and no media/approval/progress is invented.
 *  - Honesty: missing values stay explicit; opportunities never become adoption.
 *  - Reviewable content: authored enrichment (bands, recommendations, brand
 *    records) lives in clearly-labeled constants so CONTENT-01/AI-01 can review it.
 *
 * Usage: node scripts/portal/build-client-manifest.mjs [tenant]   (default bkwatch)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const TENANT = process.argv[2] || "bkwatch";
const SRC = resolve(ROOT, "content", "clients", `${TENANT}.json`);
const OUT_DIR = resolve(ROOT, "content", "clients", TENANT);
const V2 = "2.0.0";

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const readJSON = async (p) => JSON.parse(await readFile(p, "utf8"));
const writeJSON = async (name, data) => {
  await writeFile(resolve(OUT_DIR, name), JSON.stringify(data, null, 2) + "\n", "utf8");
  return name;
};

/* ── bkWatch theme profile (source: memory/BKWATCH/DESIGN.md, 2026-07-14) ───── */
const THEME = {
  bkwatch: {
    profile: "bkwatch",
    canonicalColor: "#2B66AE",
    gradient: { from: "#79C4F5", to: "#2B66AE" },
    defaultMode: "dark"
  }
};

const FOOTER = { poweredBy: "Powered by Third i", poweredByFavicon: "/public/images/favicon.png" };

/* ── Authored enrichment (grounded in v1 source; reviewed at CONTENT-01/AI-01) ─ */

// Home opportunities: three real, project-connected recommendations.
const HOME_OPPORTUNITIES = [
  {
    title: "Approved in-product Spectrum walkthrough",
    outcome: "A sanctioned demo that shows the native bankruptcy workflow inside Spectrum without switching tools.",
    why: "Directly resolves the switching objection shaw-bkWatch is built to answer, using proof existing Spectrum users trust.",
    value: "High",
    effort: "Medium",
    evidence: "Internal-confirmed",
    recommendation: "Lock live/showable functions and sanitized Spectrum assets, then produce a short role-specific walkthrough.",
    link: "/bkwatch/projects/film1-shaw-bkwatch",
    source: "BankruptcyWatch factual canon — Shaw Systems & BankruptcyWatch Dynamic; shaw-bkWatch Working Memory"
  },
  {
    title: "Exception triage copilot for monitoring",
    outcome: "Human-reviewed AI assist that prioritizes filings the current rules-based pipeline flags as exceptions.",
    why: "Monitoring is confirmed as rules-based today; targeted AI reduces manual review effort without replacing controls.",
    value: "High",
    effort: "Medium",
    evidence: "Curated-discovery",
    recommendation: "Run a bounded pilot on a sample exception queue with clear human validation and success criteria.",
    link: "/bkwatch/ai-roadmap",
    source: "BankruptcyWatch factual canon — Comprehensive Bankruptcy Monitoring and AI Use Audit"
  },
  {
    title: "Role-specific integration one-pager",
    outcome: "Concise enablement piece tailored to servicing, compliance, and recovery leaders evaluating the integration.",
    why: "Supports acquisition and retention conversations once claim/asset language is approved for publication.",
    value: "Medium",
    effort: "Low",
    evidence: "Internal-confirmed",
    recommendation: "Draft after shaw-bkWatch claim lock so wording matches approved public language.",
    link: "/bkwatch/library/products",
    source: "BankruptcyWatch factual canon — Shaw Systems & BankruptcyWatch Dynamic"
  }
];

// AI Roadmap category titles keyed by v1 category name.
const AI_CATEGORY_TITLES = {
  "Operations": "Operations & monitoring",
  "Marketing": "Marketing",
  "Acquisition": "Acquisition & growth",
  "Service": "Service & support",
  "Analytics": "Analytics & reporting",
  "Compliance": "Compliance & risk support",
  "Film": "Film & creative production",
  "Web": "Website design & development",
  "Communications": "Communications",
  "Product / workflow": "Product & workflow automation"
};

// Deterministic, honest defaults derived from confirmed status.
const AI_STATUS_MAP = {
  active: { status: "active", value: "Medium", effort: "Low", evidence: "Internal-confirmed", rec: "Maintain and measure this working baseline; do not present it as generative AI." },
  partial: { status: "partial", value: "High", effort: "Medium", evidence: "Internal-confirmed", rec: "Complete rollout behind explicit human review before expanding scope." },
  not: { status: "not-in-use", value: "High", effort: "Medium", evidence: "Curated-discovery", rec: "Run a small bounded pilot with success criteria and privacy boundaries before adoption." },
  unknown: { status: "needs-confirmation", value: "Unknown", effort: "Unknown", evidence: "Needs-confirmation", rec: "Confirm current usage and data boundaries before recommending a change." }
};

const AI_SOURCES = [
  { tier: 1, name: "Official vendor documentation and release notes", use: "Product capabilities, limits, pricing, and security." },
  { tier: 2, name: "Artificial Analysis (independent benchmarking)", url: "https://artificialanalysis.ai/methodology", use: "Independently measured model intelligence, performance, and cost." },
  { tier: 2, name: "Arena leaderboard", url: "https://help.arena.ai/articles/7011479247-how-to-see-ai-rankings-in-arena-leaderboards-2-0-wip", use: "Human-preference rankings with confidence intervals." },
  { tier: 3, name: "Peer-reviewed / institutional research", use: "Adoption, risk, and impact evidence." },
  { tier: 4, name: "FutureTools", url: "https://futuretools.io/", use: "Discovery and category scanning; popularity is not proof of suitability." }
];

/* ── Builders ───────────────────────────────────────────────────────────────── */

function buildPortal(v1) {
  return {
    schemaVersion: V2,
    tenant: TENANT,
    clientSafe: true,
    asOf: v1.client.asOf,
    client: {
      key: v1.client.key,
      name: v1.client.name,
      shortName: v1.client.shortName,
      route: v1.client.route,
      partner: v1.client.partner,
      logo: "/public/portal/bkwatch-logo-black.png",
      logoDark: "/public/portal/bkwatch-logo-white.png"
    },
    brand: {
      mission: v1.brand.mission,
      audience: v1.brand.audience,
      voice: v1.brand.voice,
      tagline: v1.brand.tagline,
      differentiators: v1.brand.differentiators,
      communication: v1.brand.communication,
      source: v1.brand.source
    },
    theme: THEME[TENANT] || THEME.bkwatch,
    relationship: {
      mission: v1.brand.mission,
      summary: v1.currentWork.summary,
      phase: v1.film.phase,
      lastUpdate: v1.client.asOf,
      source: v1.currentWork.source
    },
    footer: FOOTER
  };
}

function buildHome(v1, projects) {
  const film = projects[0];
  const openBlockers = (v1.currentWork.blockers || []).length;

  const stats = [
    { label: "Active projects", value: projects.filter((p) => p.status === "active").length, source: "Derived from client-safe project manifest" },
    { label: "Open blocker comments", value: openBlockers, source: v1.currentWork.source },
    { label: "Deliverables ready for review", value: (v1.currentWork.deliverables || []).length, source: v1.currentWork.source },
    { label: "Approved generated media", value: v1.film.approvedMedia, unit: "stills or clips", state: "not-started", source: "shaw-bkWatch Working Memory — media generation has not started" },
    { label: "Next milestone", value: "Complete selected demo for review", source: v1.currentWork.source }
  ];

  // Blockers may be plain strings (legacy) or { title, detail } objects. The
  // detail carries the real reasoning so blockers are never bare placeholders.
  const needsAttention = (v1.currentWork.blockers || []).map((b, i) => {
    const title = typeof b === "string" ? b : b.title;
    const detail = typeof b === "object" ? b.detail : undefined;
    return {
      id: `na-blocker-${i + 1}`,
      kind: "comment",
      blocker: true,
      title,
      ...(detail ? { detail } : {}),
      projectId: film.id,
      projectLabel: film.title,
      status: "Awaiting your approval",
      route: `/bkwatch/projects/${film.slug}`,
      source: v1.currentWork.source
    };
  });

  const activeWork = [{
    projectId: film.id,
    name: film.title,
    purpose: film.valueStatement,
    phase: film.phase,
    nextMilestone: film.nextMilestone,
    openCount: openBlockers,
    latestUpdate: "The selected demo is being built. Full-film production begins only after client approval.",
    thumbnailState: film.thumbnail.mediaState,
    route: `/bkwatch/projects/${film.slug}`
  }];

  // Relationship activity from confirmed film timeline + deliverables (real events).
  const activity = [];
  for (const t of v1.film.timeline.filter((x) => x.state === "done")) {
    activity.push({ type: "project-update", title: t.title, detail: t.detail, date: v1.client.asOf, projectId: film.id, route: `/bkwatch/projects/${film.slug}` });
  }
  for (const d of (v1.currentWork.deliverables || []).slice(0, 4)) {
    activity.push({ type: "new-deliverable", title: d, date: v1.client.asOf, projectId: film.id, route: `/bkwatch/projects/${film.slug}` });
  }

  return { schemaVersion: V2, tenant: TENANT, clientSafe: true, asOf: v1.client.asOf, stats, needsAttention, activeWork, activity, opportunities: HOME_OPPORTUNITIES };
}

function buildProjects(v1) {
  const f = v1.film;
  const finalIdeaSlug = "final-demo";

  const ideas = f.ideas.map((idea) => ({
    number: idea.number,
    slug: idea.slug,
    title: idea.title,
    concept: idea.concept,
    status: idea.status,
    recommended: idea.slug === finalIdeaSlug,
    lifecycleState: idea.slug === finalIdeaSlug ? "demo-production" : "brainstorm",
    mediaPolicy: idea.slug === finalIdeaSlug ? "demo-placeholders" : "none",
    ...(idea.slug === finalIdeaSlug ? { sourceIdeaIds: f.ideas.filter((source) => source.slug !== finalIdeaSlug && !/derivative/i.test(source.status)).map((source) => source.slug) } : {}),
    runtime: idea.runtime,
    sceneCount: idea.sceneCount,
    demoState: idea.demoState,
    approval: idea.approval,
    strength: idea.strength,
    complexity: idea.complexity,
    distinctiveness: idea.distinctiveness,
    recommendation: idea.recommendation,
    scenes: idea.scenes.map((s) => ({
      id: s.id,
      title: s.title,
      time: s.time,
      duration: s.duration,
      description: s.description,
      direction: s.direction,
      transition: s.transition,
      purpose: s.purpose,
      status: s.status,
      script: s.script,
      // Only the selected demo gets production placeholders. Brainstorm ideas
      // retain storyboard/script data but their presentation omits media slots.
      mediaState: idea.slug === finalIdeaSlug ? "in-production" : "ungenerated",
      assetIds: [],
      comment: { context: { scope: "scene", projectId: "film1-shaw-bkwatch", sceneId: s.id, route: idea.slug === finalIdeaSlug ? "/bkwatch/projects/film1-shaw-bkwatch" : `/bkwatch/projects/film1-shaw-bkwatch/ideas/${idea.slug}` }, count: 0 }
    }))
  }));

  const project = {
    id: "film1-shaw-bkwatch",
    slug: "film1-shaw-bkwatch",
    type: "film",
    title: f.displayName,
    displayName: f.name,
    status: "active",
    statusLabel: "Active — Demo in production",
    // Confirmed relationship metrics: invoicing summary as of 2026-07-21 and
    // first shaw-bkWatch activity recorded on 2026-07-01.
    startedAt: "2026-07-01",
    hoursInvested: 20,
    projectType: "Integration film · Shaw × bkWatch",
    valueStatement: f.coreMessage,
    objective: f.objective,
    audience: f.audience,
    coreValue: f.coreMessage,
    phase: f.phase,
    nextMilestone: v1.currentWork.milestone,
    runtime: f.runtime,
    // In-production projects use the designer.svg + grid treatment on their
    // thumbnail (per HITL direction 2026-07-17); not-yet-started projects would
    // use a neutral grid instead.
    thumbnail: { mediaState: "in-production", label: "Demo in production" },
    productionLifecycle: {
      projectPhase: "demo-production",
      demoPhase: "building",
      fullFilmPhase: "not-started",
      selectedIdeaIds: [finalIdeaSlug],
      canonicalIdeaId: finalIdeaSlug,
      promotionState: "embedded"
    },
    draft: false,
    messaging: [f.creativeThesis, f.coreMessage],
    theme: f.creativeThesis,
    vision: f.objective,
    script: f.script,
    storyboardNote: f.scriptSource,
    deliverables: (v1.currentWork.deliverables || []).map((d) => ({ title: d, state: "In progress" })),
    assets: [],
    timeline: f.timeline,
    blockers: (v1.currentWork.blockers || []).map((b) => ({
      kind: "comment",
      blocker: true,
      title: typeof b === "string" ? b : b.title,
      ...((typeof b === "object" && (b.description || b.detail)) ? { description: b.description || b.detail } : {})
    })),
    related: ["spectrum-integration", "monitoring"],
    scope: {
      ownerApproved: false,
      model: "Outcome + effort range",
      demoEffort: "Confirmed hours pending",
      effortRange: "Scope required",
      priceStatement: "Scope required",
      assumptions: ["Selected demo direction locked", "Sanitized Spectrum assets supplied", "Live/showable functions confirmed"],
      note: "The selected demo is being built inside the project page to prove the visual system and direction. Full-film production begins only after client approval advances the same embedded storyboard, media history, script, and comments record.",
      source: "Third i pricing approach — outcome/scope-led; currency shown only when confirmed"
    },
    film: {
      coreMessage: f.coreMessage,
      creativeThesis: f.creativeThesis,
      script: f.script,
      scriptSource: f.scriptSource,
      comparisonCriteria: f.comparisonCriteria,
      recommendation: f.recommendation,
      approvals: f.approvals,
      ideas
    },
    comment: { context: { scope: "project", projectId: "film1-shaw-bkwatch", route: "/bkwatch/projects/film1-shaw-bkwatch" }, count: 0 },
    source: f.source
  };

  return { schemaVersion: V2, tenant: TENANT, clientSafe: true, asOf: v1.client.asOf, projects: [project] };
}

function buildLibrary(v1) {
  const categories = [
    { id: "branding", title: "Branding", description: "Mission, positioning, audience, voice, identity, and messaging.", subcategories: [
      { id: "mission-positioning", title: "Mission & positioning" }, { id: "audience", title: "Audience" },
      { id: "voice-communication", title: "Voice & communication" }, { id: "visual-identity", title: "Visual identity" },
      { id: "differentiators", title: "Differentiators" } ] },
    { id: "products", title: "Products", description: "Product families, value, audiences, and confirmed capabilities.", subcategories: [] },
    { id: "features", title: "Features", description: "Confirmed capabilities tied to a parent product.", subcategories: [] },
    { id: "integrations-partners", title: "Integrations & partners", description: "Relationships and confirmed interplay.", subcategories: [] },
    { id: "film-knowledge", title: "Film knowledge", description: "Approved creative directions, decisions, and learned preferences.", subcategories: [
      { id: "creative-directions", title: "Creative directions" }, { id: "production-decisions", title: "Production decisions" },
      { id: "learned-preferences", title: "Learned preferences" }, { id: "messaging-preferences", title: "Messaging preferences" } ] },
    { id: "communication", title: "Communication", description: "Client-visible comments, emails, and meetings.", subcategories: [
      { id: "comments", title: "Comments" }, { id: "emails", title: "Emails" }, { id: "meetings", title: "Meetings" } ] },
    { id: "other-knowledge", title: "Other knowledge", description: "Confirmed coverage, scale, and reliability facts.", subcategories: [
      { id: "coverage-scale", title: "Coverage & scale" }, { id: "reliability", title: "Reliability" } ] }
  ];

  const records = [];
  const rec = (r) => records.push({ tenant: TENANT, clientSafe: true, ...r });

  // Branding records
  rec({ id: "brand-mission", type: "brand", category: "branding", subcategory: "mission-positioning", title: "Mission & positioning", summary: v1.brand.mission, body: v1.brand.tagline, status: "Confirmed", format: "branding", projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: [v1.brand.source], comment: { context: { scope: "library", recordId: "brand-mission", category: "branding", route: "/bkwatch/library/branding/brand-mission" }, count: 0 } });
  rec({ id: "brand-audience", type: "brand", category: "branding", subcategory: "audience", title: "Audience", summary: v1.brand.audience, status: "Confirmed", format: "branding", projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: [v1.brand.source] });
  rec({ id: "brand-voice", type: "brand", category: "branding", subcategory: "voice-communication", title: "Voice & communication", summary: v1.brand.voice, body: v1.brand.communication?.confirmed, status: "Confirmed", format: "branding", projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: [v1.brand.source] });
  rec({ id: "brand-identity", type: "brand", category: "branding", subcategory: "visual-identity", title: "Visual identity", summary: "Primary blue #2B66AE, primary black #1A1A1A, primary white. Blue is used selectively for brand recognition, active paths, and confirmed states.", facts: ["Primary Blue #2B66AE (corrected 2026-07-14)", "Primary Black #1A1A1A", "Primary White #FFFFFF", "Portal dark mode workspace #080D14"], status: "Confirmed", format: "branding", projectId: "general", lastReviewedAt: "2026-07-14", sourceRefs: ["bkWatch Design System — Brand Foundation"] });
  rec({ id: "brand-differentiators", type: "brand", category: "branding", subcategory: "differentiators", title: "Differentiators", summary: "What sets BankruptcyWatch apart.", facts: v1.brand.differentiators, status: "Confirmed", format: "branding", projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: [v1.brand.source] });

  // Products + Integrations/partners + Features (derived from confirmed product facts)
  for (const p of v1.products) {
    const isIntegration = p.category === "Integration";
    rec({
      id: `product-${p.slug}`, type: "product",
      category: isIntegration ? "integrations-partners" : "products",
      title: p.name, summary: p.mission, body: p.businessValue,
      facts: p.facts, status: p.status, format: isIntegration ? "integration" : "product",
      projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: [p.source],
      relatedIds: p.slug === "spectrum-integration" ? ["film1-shaw-bkwatch"] : [],
      comment: { context: { scope: "library", recordId: `product-${p.slug}`, category: isIntegration ? "integrations-partners" : "products", route: `/bkwatch/library/${isIntegration ? "integrations-partners" : "products"}/product-${p.slug}` }, count: 0 }
    });
  }
  // Confirmed feature records (real capabilities, cited to their product)
  rec({ id: "feature-poc", type: "feature", category: "features", title: "Proof of Claim preparation", summary: "Prepare Proof of Claim documents as part of the automated response workflow.", status: "Confirmed capability", format: "feature", projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: ["BankruptcyWatch factual canon — Automated Bankruptcy Response"], relatedIds: ["product-response"] });
  rec({ id: "feature-efiling", type: "feature", category: "features", title: "Direct eFiling", summary: "Direct electronic filing as part of the response workflow.", status: "Confirmed capability", format: "feature", projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: ["BankruptcyWatch factual canon — Automated Bankruptcy Response"], relatedIds: ["product-response"] });
  rec({ id: "feature-docket", type: "feature", category: "features", title: "Docket event detection & logging", summary: "Detect, import, parse, and log docket-level case events for review and action.", status: "Confirmed capability", format: "feature", projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: ["BankruptcyWatch factual canon — Advanced Bankruptcy Research"], relatedIds: ["product-research"] });

  // Film knowledge (from confirmed film memory)
  rec({ id: "film-direction-final", type: "film-knowledge", category: "film-knowledge", subcategory: "creative-directions", title: "Selected creative direction — Final Demo", summary: v1.film.recommendation, status: "Selected", format: "film-knowledge", projectId: "film1-shaw-bkwatch", lastReviewedAt: v1.client.asOf, sourceRefs: [v1.film.source], relatedIds: ["film1-shaw-bkwatch"] });
  rec({ id: "film-script-lock", type: "film-knowledge", category: "film-knowledge", subcategory: "production-decisions", title: "Locked integration script", summary: "Original 45-word integration script preserved at 122.7 WPM across 22 seconds.", body: v1.film.script, status: "Locked", format: "film-knowledge", projectId: "film1-shaw-bkwatch", lastReviewedAt: v1.client.asOf, sourceRefs: [v1.film.scriptSource], relatedIds: ["film1-shaw-bkwatch"] });
  rec({ id: "film-thesis", type: "film-knowledge", category: "film-knowledge", subcategory: "learned-preferences", title: "Creative thesis", summary: v1.film.creativeThesis, status: "Confirmed", format: "film-knowledge", projectId: "film1-shaw-bkwatch", lastReviewedAt: v1.client.asOf, sourceRefs: [v1.film.source], relatedIds: ["film1-shaw-bkwatch"] });
  rec({ id: "film-messaging", type: "film-knowledge", category: "film-knowledge", subcategory: "messaging-preferences", title: "Messaging preferences", summary: v1.brand.communication?.confirmed || v1.brand.voice, status: "Confirmed", format: "film-knowledge", projectId: "film1-shaw-bkwatch", lastReviewedAt: v1.client.asOf, sourceRefs: [v1.brand.source], relatedIds: ["film1-shaw-bkwatch"] });

  // Other knowledge (confirmed coverage/scale/reliability facts from metrics)
  rec({ id: "fact-court-coverage", type: "fact", category: "other-knowledge", subcategory: "coverage-scale", title: "Court coverage", summary: "Coverage across all 94 U.S. Bankruptcy Courts.", status: "Confirmed", format: "fact", projectId: "general", eventDate: "2026-07-13", lastReviewedAt: "2026-07-13", sourceRefs: ["BankruptcyWatch factual canon — Key Integration Features"] });
  rec({ id: "fact-chapters", type: "fact", category: "other-knowledge", subcategory: "coverage-scale", title: "Chapters monitored", summary: "Monitoring covers Chapters 7, 11, and 13.", status: "Confirmed", format: "fact", projectId: "general", eventDate: "2026-07-13", lastReviewedAt: "2026-07-13", sourceRefs: ["BankruptcyWatch factual canon — Comprehensive Bankruptcy Monitoring"] });
  rec({ id: "fact-pacer", type: "fact", category: "other-knowledge", subcategory: "reliability", title: "PACER uptime support", summary: "BankruptcyWatch operates PacerUptime.com, tracking availability across all 94 federal bankruptcy courts.", status: "Confirmed", format: "fact", projectId: "general", lastReviewedAt: v1.client.asOf, sourceRefs: ["BankruptcyWatch factual canon — PACER Uptime Support"] });

  return { schemaVersion: V2, tenant: TENANT, clientSafe: true, asOf: v1.client.asOf, categories, records };
}

function buildAiRoadmap(v1) {
  const catOrder = [];
  const seen = new Set();
  for (const c of v1.aiCapabilities) if (!seen.has(c.category)) { seen.add(c.category); catOrder.push(c.category); }

  const categories = catOrder.map((name) => ({ id: slugify(name), title: AI_CATEGORY_TITLES[name] || name }));

  const capabilities = v1.aiCapabilities.map((c, i) => {
    const m = AI_STATUS_MAP[c.status] || AI_STATUS_MAP.unknown;
    return {
      id: `ai-${slugify(c.category)}-${i + 1}`,
      category: slugify(c.category),
      name: c.name,
      status: m.status,
      outcome: c.detail,
      detail: c.detail,
      value: m.value,
      effort: m.effort,
      evidence: m.evidence,
      recommendation: m.rec,
      service: { offered: false, investment: "Scope required" },
      source: c.source,
      researchAsOf: "2026-07-16",
      comment: { context: { scope: "ai-roadmap", recordId: `ai-${slugify(c.category)}-${i + 1}`, route: "/bkwatch/ai-roadmap" }, count: 0 }
    };
  });

  const executiveSummary = {
    currentState: "Current automation is primarily rules-based: API calls, predefined rules, custom scrapers, and regex parsing. Little to no generative or agentic AI is in production today.",
    topImprovement: "Add human-reviewed AI assistance to bankruptcy monitoring exception handling, where the confirmed rules-based pipeline already produces reviewable exceptions.",
    risks: "Product-accuracy, compliance review, and data-privacy boundaries must gate any generative step; no capability is presented as adopted before it is confirmed.",
    recommendation: "Third i evaluates the workflow first and the tool second. Begin with one bounded, high-value pilot with explicit human review and success criteria.",
    positioning: "Rankings and new releases help identify candidates, but the recommendation is based on bkWatch's work, risk, cost, and adoption path.",
    source: "BankruptcyWatch factual canon — AI Use Audit"
  };

  return { schemaVersion: V2, tenant: TENANT, clientSafe: true, asOf: v1.client.asOf, researchAsOf: "2026-07-16", executiveSummary, categories, capabilities, sources: AI_SOURCES };
}

/* ── Run ────────────────────────────────────────────────────────────────────── */
const v1 = await readJSON(SRC);
await mkdir(OUT_DIR, { recursive: true });

const portal = buildPortal(v1);
const projects = buildProjects(v1);
const home = buildHome(v1, projects.projects);
const library = buildLibrary(v1);
const aiRoadmap = buildAiRoadmap(v1);

const written = [];
written.push(await writeJSON("portal.json", portal));
written.push(await writeJSON("home.json", home));
written.push(await writeJSON("projects.json", projects));
written.push(await writeJSON("library.json", library));
written.push(await writeJSON("ai-roadmap.json", aiRoadmap));

/* Parity report */
const totalScenesV1 = v1.film.ideas.reduce((n, i) => n + i.scenes.length, 0);
const totalScenesV2 = projects.projects[0].film.ideas.reduce((n, i) => n + i.scenes.length, 0);
console.log(`Migrated ${TENANT} → v2 (${written.join(", ")})`);
console.log("Parity:");
console.log(`  products v1=${v1.products.length} → library product/integration records`);
console.log(`  film ideas v1=${v1.film.ideas.length} → v2=${projects.projects[0].film.ideas.length}`);
console.log(`  film scenes v1=${totalScenesV1} → v2=${totalScenesV2}`);
console.log(`  aiCapabilities v1=${v1.aiCapabilities.length} → v2=${aiRoadmap.capabilities.length}`);
console.log(`  metrics v1=${v1.metrics.length} → home stats + other-knowledge facts`);
console.log(`  library records total=${library.records.length}`);
