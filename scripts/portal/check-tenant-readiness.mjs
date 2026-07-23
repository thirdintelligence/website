/**
 * Report whether a tenant has the files and namespaces required for activation.
 *
 * This is intentionally read-only. It does not generate client copy, create
 * credentials, enable routes, or add the tenant to owner aggregation.
 *
 * Usage:
 *   node scripts/portal/check-tenant-readiness.mjs shaw
 *   node scripts/portal/check-tenant-readiness.mjs bkwatch --require-ready
 */
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { PORTAL_TENANTS, REQUIRED_TENANT_MANIFESTS } from "../../config/portal-tenants.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");
const tenantKey = process.argv.slice(2).find((arg) => !arg.startsWith("--")) || "shaw";
const requireReady = process.argv.includes("--require-ready");
const tenant = PORTAL_TENANTS[tenantKey];

if (!tenant) {
  console.error(`Unknown portal tenant: ${tenantKey}`);
  process.exit(1);
}

async function exists(relativePath) {
  try {
    await access(resolve(ROOT, relativePath));
    return true;
  } catch {
    return false;
  }
}

const manifestChecks = await Promise.all(
  REQUIRED_TENANT_MANIFESTS.map(async (file) => ({
    file,
    present: await exists(`${tenant.contentDir}/${file}`)
  }))
);
const designPresent = await exists(tenant.designAuthority);
const missingManifests = manifestChecks.filter((check) => !check.present).map((check) => check.file);
const contentPackageComplete = missingManifests.length === 0;
const activationReady = tenant.status === "active" && contentPackageComplete && designPresent;

const report = {
  tenant: tenant.key,
  displayName: tenant.displayName,
  status: tenant.status,
  designAuthority: { path: tenant.designAuthority, present: designPresent },
  manifests: {
    required: REQUIRED_TENANT_MANIFESTS,
    present: manifestChecks.filter((check) => check.present).map((check) => check.file),
    missing: missingManifests
  },
  namespaces: {
    passwordHashEnv: tenant.passwordHashEnv,
    sessionCookie: tenant.sessionCookie,
    csrfCookie: tenant.csrfCookie,
    cookiePath: tenant.cookiePath,
    operationalPrefix: tenant.operationalPrefix,
    mediaPrefix: tenant.mediaPrefix,
    searchIndex: tenant.searchIndex
  },
  runtime: {
    ownerActionsEnabled: tenant.ownerActionsEnabled,
    notificationsEnabled: tenant.notificationsEnabled
  },
  gates: [
    "client-safe content and design approval",
    "distinct password hash and tenant session verification",
    "preview operational and media verification",
    "wrong-tenant, browser, accessibility, and performance checks",
    "production approval"
  ],
  activationReady
};

console.log(JSON.stringify(report, null, 2));
if (requireReady && !activationReady) process.exit(1);
