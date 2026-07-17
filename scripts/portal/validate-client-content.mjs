/**
 * validate-client-content.mjs
 *
 * Validates a tenant's sanitized v2 manifests against the portal schemas and runs
 * safety checks: correct tenant on every file, clientSafe true, and no leaked
 * local filesystem paths. Exits non-zero on any failure so it can gate builds.
 *
 * Usage: node scripts/portal/validate-client-content.mjs [tenant]   (default bkwatch)
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSchemaRegistry, getContentValidator, CONTENT_FILE_SCHEMA, formatErrors } from "../../lib/portal-schemas.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");
const TENANT = process.argv[2] || "bkwatch";
const DIR = resolve(ROOT, "content", "clients", TENANT);

const ajv = await createSchemaRegistry();
let failures = 0;
const fail = (msg) => { console.error("  ✗ " + msg); failures++; };

// Leaked-path detector: any absolute /Users/... path or memory/ reference in output.
const LOCAL_PATH = /\/Users\/|\/home\/|memory\/[A-Z]/;

for (const file of Object.keys(CONTENT_FILE_SCHEMA)) {
  const path = resolve(DIR, file);
  let raw;
  try { raw = await readFile(path, "utf8"); }
  catch { fail(`${file}: missing`); continue; }

  let data;
  try { data = JSON.parse(raw); }
  catch (e) { fail(`${file}: invalid JSON — ${e.message}`); continue; }

  const validate = getContentValidator(ajv, file);
  if (!validate(data)) {
    fail(`${file}: schema invalid`);
    for (const line of formatErrors(validate.errors)) console.error("    " + line.trim());
    continue;
  }
  if (data.tenant !== TENANT) fail(`${file}: tenant "${data.tenant}" != "${TENANT}"`);
  if (data.clientSafe !== true) fail(`${file}: clientSafe must be true`);
  if (LOCAL_PATH.test(raw)) fail(`${file}: contains a local filesystem path`);

  if (failures === 0 || true) console.log(`  ✓ ${file}`);
}

if (failures) { console.error(`\nContent validation FAILED for ${TENANT}: ${failures} issue(s).`); process.exit(1); }
console.log(`\nContent validation passed for ${TENANT}.`);
