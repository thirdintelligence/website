/**
 * Build content/clients/<tenant>/search-index.json from sanitized manifests.
 *
 * Usage: node scripts/portal/build-search-index.mjs [tenant] (default bkwatch)
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildPortalSearchIndex } from "../../lib/portal-search-index.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");
const TENANT = process.argv[2] || "bkwatch";
const DIR = resolve(ROOT, "content", "clients", TENANT);
const readJSON = async (name) => JSON.parse(await readFile(resolve(DIR, name), "utf8"));

const [portal, projects, library, aiRoadmap, communications] = await Promise.all([
  readJSON("portal.json"),
  readJSON("projects.json"),
  readJSON("library.json"),
  readJSON("ai-roadmap.json"),
  readJSON("communications.json")
]);

const index = buildPortalSearchIndex({ portal, projects, library, aiRoadmap, communications });
await writeFile(resolve(DIR, "search-index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`Built search-index.json for ${TENANT}: ${index.entries.length} entries`);
