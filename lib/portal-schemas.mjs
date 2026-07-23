/**
 * Portal schema registry.
 *
 * Loads every JSON Schema in schemas/portal/, registers them with Ajv (draft
 * 2020-12) so cross-file $refs resolve, and exposes compiled validators keyed by
 * both content-file name and schema $id. Shared by the content validator script
 * and the portal content tests so there is a single source of validation truth.
 */
import { readdir, readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

// Resolve the schema dir robustly: import.meta.dirname works in the repo/tests,
// but esbuild inlines this lib into the function, moving import.meta to
// netlify/functions/. On Netlify the schemas ship via included_files at
// <cwd>/schemas/portal, so fall back to a cwd-relative path.
const SCHEMA_DIR_CANDIDATES = [
  resolve(import.meta.dirname, "..", "schemas", "portal"),
  resolve(process.cwd(), "schemas", "portal")
];
async function resolveSchemaDir() {
  for (const dir of SCHEMA_DIR_CANDIDATES) {
    try { await access(dir); return dir; } catch { /* try next */ }
  }
  return SCHEMA_DIR_CANDIDATES[0];
}
const SCHEMA_BASE = "https://thirdi.net/schemas/portal/";

/* Maps a sanitized content file to the root schema that validates it. */
export const CONTENT_FILE_SCHEMA = {
  "portal.json": SCHEMA_BASE + "portal.schema.json",
  "home.json": SCHEMA_BASE + "home.schema.json",
  "projects.json": SCHEMA_BASE + "project.schema.json",
  "library.json": SCHEMA_BASE + "library-record.schema.json",
  "ai-roadmap.json": SCHEMA_BASE + "ai-capability.schema.json",
  "roadmap.json": SCHEMA_BASE + "roadmap.schema.json",
  "invoicing.json": SCHEMA_BASE + "invoicing.schema.json",
  "communications.json": SCHEMA_BASE + "communications.schema.json",
  "search-index.json": SCHEMA_BASE + "search-index.schema.json"
};

/** Build an Ajv instance with every portal schema registered. */
export async function createSchemaRegistry() {
  const dir = await resolveSchemaDir();
  const files = (await readdir(dir)).filter((f) => f.endsWith(".schema.json"));
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  for (const file of files) {
    const schema = JSON.parse(await readFile(resolve(dir, file), "utf8"));
    ajv.addSchema(schema);
  }
  return ajv;
}

/** Return a compiled validate() for a content file name (e.g. "home.json"). */
export function getContentValidator(ajv, fileName) {
  const id = CONTENT_FILE_SCHEMA[fileName];
  if (!id) throw new Error(`No schema mapped for content file: ${fileName}`);
  const validate = ajv.getSchema(id);
  if (!validate) throw new Error(`Schema not registered: ${id}`);
  return validate;
}

/** Return a compiled validate() for any schema $id or bare basename. */
export function getSchemaValidator(ajv, idOrName) {
  const id = idOrName.startsWith("http") ? idOrName : SCHEMA_BASE + idOrName;
  const validate = ajv.getSchema(id);
  if (!validate) throw new Error(`Schema not registered: ${id}`);
  return validate;
}

/** Format Ajv errors into short, readable lines. */
export function formatErrors(errors) {
  if (!errors) return [];
  return errors.map((e) => `  ${e.instancePath || "(root)"} ${e.message}${e.params && Object.keys(e.params).length ? " " + JSON.stringify(e.params) : ""}`);
}
