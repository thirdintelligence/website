/**
 * build-search-index.mjs
 *
 * Builds content/clients/<tenant>/search-index.json from the sanitized v2 page
 * manifests. The index contains only client-safe text already present in those
 * manifests — no raw memory filenames, prompts, or local paths.
 *
 * Usage: node scripts/portal/build-search-index.mjs [tenant]   (default bkwatch)
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const TENANT = process.argv[2] || "bkwatch";
const DIR = resolve(ROOT, "content", "clients", TENANT);
const readJSON = async (name) => JSON.parse(await readFile(resolve(DIR, name), "utf8"));

const [portal, projects, library, ai] = await Promise.all([
  readJSON("portal.json"), readJSON("projects.json"), readJSON("library.json"), readJSON("ai-roadmap.json")
]);

const base = portal.client.route; // e.g. /bkwatch
const entries = [];
const push = (e) => entries.push(e);
const clip = (s, n = 180) => (s ? String(s).slice(0, n) : undefined);

for (const p of projects.projects) {
  push({ id: p.id, type: "project", title: p.title, excerpt: clip(p.valueStatement), project: p.title, status: p.statusLabel || p.status, format: "project", date: projects.asOf, route: `${base}/projects/${p.slug}` });
  if (p.film) {
    for (const idea of p.film.ideas) {
      const isSelected = (p.productionLifecycle?.selectedIdeaIds || []).includes(idea.slug) || idea.recommended;
      const ideaRoute = isSelected ? `${base}/projects/${p.slug}#selected-demo` : `${base}/projects/${p.slug}/ideas/${idea.slug}`;
      push({ id: `${p.id}:${idea.slug}`, type: "film-idea", title: idea.title, excerpt: clip(idea.concept), project: p.title, status: idea.status, format: "film knowledge", route: ideaRoute });
      for (const s of idea.scenes) {
        const sceneRoute = isSelected ? `${base}/projects/${p.slug}#${s.id}` : `${ideaRoute}#${s.id}`;
        push({ id: `${p.id}:${idea.slug}:${s.id}`, type: "scene", title: `${s.id} · ${s.title}`, excerpt: clip(s.description || s.script), project: p.title, status: s.status, format: "scene", route: sceneRoute });
      }
    }
  }
}

for (const r of library.records) {
  push({ id: r.id, type: "library", title: r.title, excerpt: clip(r.summary), category: r.category, status: r.status, format: r.format, date: r.eventDate || r.lastReviewedAt, route: `${base}/library/${r.category}/${r.id}` });
}

for (const c of ai.capabilities) {
  push({ id: c.id, type: "ai-capability", title: c.name, excerpt: clip(c.outcome), category: c.category, status: c.status, format: "ai capability", date: c.researchAsOf, route: `${base}/ai-roadmap#${c.id}` });
}

const index = { schemaVersion: "2.0.0", tenant: TENANT, clientSafe: true, asOf: portal.asOf, entries };
await writeFile(resolve(DIR, "search-index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(`Built search-index.json for ${TENANT}: ${entries.length} entries`);
