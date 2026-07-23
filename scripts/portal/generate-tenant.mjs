/**
 * Reusable client-portal tenant generator.
 *
 * Inputs are non-secret tenant namespaces, design/logo authorities, feature
 * gates, and sanitized structured manifest sources. Outputs are configuration,
 * manifests, an isolation fixture, and an immutable release record only.
 * It never copies HTML, creates a Netlify function, enables routes, or promotes
 * a release pointer.
 *
 * Usage:
 *   node scripts/portal/generate-tenant.mjs --config config/portal-generator/shaw.json
 *   node scripts/portal/generate-tenant.mjs --config ... --check
 *   node scripts/portal/generate-tenant.mjs --config ... --output /tmp/release
 */
import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PORTAL_TENANTS } from "../../config/portal-tenants.mjs";
import {
  createSchemaRegistry,
  formatErrors,
  getContentValidator,
  getSchemaValidator
} from "../../lib/portal-schemas.mjs";
import {
  communicationSafetyIssues,
  genericContentSafetyIssues
} from "../../lib/portal-content-safety.mjs";
import { buildPortalSearchIndex } from "../../lib/portal-search-index.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");
const SOURCE_FILES = Object.freeze([
  "portal.json",
  "home.json",
  "projects.json",
  "library.json",
  "ai-roadmap.json",
  "roadmap.json",
  "invoicing.json",
  "communications.json"
]);
const OUTPUT_FILES = Object.freeze([...SOURCE_FILES, "search-index.json"]);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

const digest = (value) => createHash("sha256").update(
  typeof value === "string" ? value : JSON.stringify(canonical(value))
).digest("hex");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function assertNoNamespaceCollision(input) {
  const candidate = {
    route: input.tenant.route,
    passwordHashEnv: input.auth.passwordHashEnv,
    sessionCookie: input.auth.sessionCookie,
    csrfCookie: input.auth.csrfCookie,
    cookiePath: input.auth.cookiePath,
    searchIndex: input.storage.searchIndex
  };
  for (const [key, tenant] of Object.entries(PORTAL_TENANTS)) {
    if (key === input.tenant.key) continue;
    for (const [field, value] of Object.entries(candidate)) {
      if (tenant[field] === value) throw new Error(`${field} collides with tenant ${key}`);
    }
    for (const environment of ["preview", "production"]) {
      const proposed = input.storage[environment];
      const existing = tenant.environments?.[environment];
      if (existing?.operationalPrefix === proposed.operationalPrefix) {
        throw new Error(`${environment} operationalPrefix collides with tenant ${key}`);
      }
      if (existing?.mediaPrefix === proposed.mediaPrefix) {
        throw new Error(`${environment} mediaPrefix collides with tenant ${key}`);
      }
    }
  }
}

function assertRegistryContract(input) {
  const registered = PORTAL_TENANTS[input.tenant.key];
  if (!registered) return;
  const expected = {
    route: input.tenant.route,
    passwordHashEnv: input.auth.passwordHashEnv,
    sessionCookie: input.auth.sessionCookie,
    csrfCookie: input.auth.csrfCookie,
    cookiePath: input.auth.cookiePath,
    searchIndex: input.storage.searchIndex
  };
  for (const [field, value] of Object.entries(expected)) {
    if (registered[field] !== value) {
      throw new Error(`Generator input ${field} does not match the registered ${input.tenant.key} tenant`);
    }
  }
}

function releaseConfig(input) {
  return {
    schemaVersion: "1.0.0",
    tenant: input.tenant,
    design: input.design,
    auth: input.auth,
    storage: input.storage,
    features: input.features
  };
}

export async function generateTenant({ configPath, output, check = false } = {}) {
  if (!configPath) throw new Error("A generator --config path is required");
  const absoluteConfig = resolve(ROOT, configPath);
  const input = JSON.parse(await readFile(absoluteConfig, "utf8"));
  const ajv = await createSchemaRegistry();
  const validateInput = getSchemaValidator(ajv, "tenant-generator.schema.json");
  if (!validateInput(input)) {
    throw new Error(`Generator input is invalid:\n${formatErrors(validateInput.errors).join("\n")}`);
  }

  assertNoNamespaceCollision(input);
  assertRegistryContract(input);

  if (input.tenant.status === "active" && !input.release.publicationApproved) {
    throw new Error("An active tenant generator input requires publicationApproved=true");
  }
  if (input.features.ownerActions || input.features.notifications || input.features.media) {
    if (!input.release.publicationApproved) {
      throw new Error("Runtime features cannot be enabled before publication approval");
    }
  }

  const manifests = {};
  for (const file of SOURCE_FILES) {
    const sourcePath = resolve(ROOT, input.recordSources[file]);
    const raw = await readFile(sourcePath, "utf8");
    const manifest = JSON.parse(raw);
    const validate = getContentValidator(ajv, file);
    if (!validate(manifest)) {
      throw new Error(`${file} is schema-invalid:\n${formatErrors(validate.errors).join("\n")}`);
    }
    if (manifest.tenant !== input.tenant.key) throw new Error(`${file} belongs to another tenant`);
    if (manifest.clientSafe !== true) throw new Error(`${file} must be explicitly clientSafe`);
    for (const issue of genericContentSafetyIssues(raw)) throw new Error(`${file}: ${issue}`);
    if (file === "communications.json") {
      for (const issue of communicationSafetyIssues(manifest, input.tenant.key)) {
        throw new Error(`${file}: ${issue}`);
      }
    }
    manifests[file] = manifest;
  }

  if (manifests["portal.json"].client.route !== input.tenant.route) {
    throw new Error("portal.json route does not match generator tenant route");
  }

  const searchIndex = buildPortalSearchIndex({
    portal: manifests["portal.json"],
    projects: manifests["projects.json"],
    library: manifests["library.json"],
    aiRoadmap: manifests["ai-roadmap.json"],
    communications: manifests["communications.json"]
  });
  const validateSearch = getContentValidator(ajv, "search-index.json");
  if (!validateSearch(searchIndex)) {
    throw new Error(`Generated search-index.json is invalid:\n${formatErrors(validateSearch.errors).join("\n")}`);
  }
  manifests["search-index.json"] = searchIndex;

  const config = releaseConfig(input);
  const inputHash = digest({ config, manifests });
  const releaseId = `${input.tenant.key}-${manifests["portal.json"].asOf}-${inputHash.slice(0, 12)}`;
  const outputRoot = output
    ? resolve(output)
    : resolve(ROOT, input.release.outputRoot || "portal-releases", releaseId);
  const manifestHashes = Object.fromEntries(
    OUTPUT_FILES.map((file) => [file, digest(manifests[file])])
  );
  const release = {
    schemaVersion: "1.0.0",
    releaseId,
    tenant: input.tenant.key,
    channel: input.release.channel,
    inputHash,
    manifestHashes,
    approvals: {
      content: input.release.contentApproved,
      design: input.release.designApproved,
      publication: input.release.publicationApproved
    },
    activation: {
      routeCreated: false,
      authConfigured: false,
      operationalWritesEnabled: false,
      mediaEnabled: false,
      ownerAggregationEnabled: false,
      notificationsEnabled: false
    },
    immutable: true,
    promoted: false
  };
  const fixture = {
    tenant: input.tenant.key,
    wrongTenant: Object.keys(PORTAL_TENANTS).find((key) => key !== input.tenant.key) || "wrong-tenant",
    route: input.tenant.route,
    sessionCookie: input.auth.sessionCookie,
    csrfCookie: input.auth.csrfCookie,
    previewOperationalPrefix: input.storage.preview.operationalPrefix,
    productionOperationalPrefix: input.storage.production.operationalPrefix,
    previewMediaPrefix: input.storage.preview.mediaPrefix,
    productionMediaPrefix: input.storage.production.mediaPrefix,
    expectedManifestCount: OUTPUT_FILES.length,
    mustNotEmit: ["html", "netlify-function", "redirect", "credential"]
  };

  if (!check) {
    const releasePath = resolve(outputRoot, "release.json");
    if (await exists(releasePath)) {
      const existing = JSON.parse(await readFile(releasePath, "utf8"));
      if (existing.inputHash !== inputHash) {
        throw new Error(`Refusing to overwrite immutable release directory: ${outputRoot}`);
      }
    } else {
      if (await exists(outputRoot)) {
        const entries = await readdir(outputRoot);
        if (entries.length) throw new Error(`Refusing to write into a non-empty directory: ${outputRoot}`);
      }
      await mkdir(resolve(outputRoot, "manifests"), { recursive: true });
      for (const file of OUTPUT_FILES) {
        await writeFile(
          resolve(outputRoot, "manifests", file),
          `${JSON.stringify(manifests[file], null, 2)}\n`,
          "utf8"
        );
      }
      await writeFile(resolve(outputRoot, "tenant-config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");
      await writeFile(resolve(outputRoot, "test-fixture.json"), `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
      await writeFile(resolve(outputRoot, "release.json"), `${JSON.stringify(release, null, 2)}\n`, "utf8");
    }
  }

  return {
    releaseId,
    tenant: input.tenant.key,
    inputHash,
    outputRoot,
    checkedOnly: check,
    manifests: OUTPUT_FILES,
    sourceConfig: basename(absoluteConfig)
  };
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") values.check = true;
    else if (arg === "--config" || arg === "--output") {
      const key = arg === "--config" ? "configPath" : "output";
      values[key] = argv[++index];
    }
    else if (arg.startsWith("--config=") || arg.startsWith("--output=")) {
      const [key, ...rest] = arg.slice(2).split("=");
      values[key === "config" ? "configPath" : key] = rest.join("=");
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return values;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await generateTenant(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}

export const GENERATED_MANIFEST_FILES = OUTPUT_FILES;
