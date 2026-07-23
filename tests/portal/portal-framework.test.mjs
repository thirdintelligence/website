import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ACTIVE_PORTAL_TENANTS,
  NOTIFICATION_TENANTS,
  OWNER_ACTION_TENANTS,
  PORTAL_TENANTS,
  REQUIRED_TENANT_MANIFESTS
} from "../../config/portal-tenants.mjs";
import { communicationSafetyIssues } from "../../lib/portal-content-safety.mjs";
import { tenantFromPath } from "../../lib/portal-api-util.mjs";
import inactiveTenant from "../../netlify/functions/portal-inactive.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");

test("shared shell exposes the approved six top-level workspaces", async () => {
  const shell = await readFile(resolve(ROOT, "public/portal/core/shell.js"), "utf8");
  const nav = [...shell.matchAll(/label: "([^"]+)", icon: "[^"]+", path: "([^"]+)"/g)]
    .map((match) => ({ label: match[1], path: match[2] }));
  assert.deepEqual(nav, [
    { label: "Home", path: "/" },
    { label: "Projects", path: "/projects" },
    { label: "Value & Results", path: "/value-results" },
    { label: "AI Roadmap", path: "/ai-roadmap" },
    { label: "Communications", path: "/communications" },
    { label: "Library", path: "/library" }
  ]);
});

test("tenant namespaces are unique and Shaw remains planned until its gates pass", () => {
  const tenants = Object.values(PORTAL_TENANTS);
  for (const field of ["route", "passwordHashEnv", "sessionCookie", "csrfCookie", "cookiePath", "operationalPrefix", "mediaPrefix", "searchIndex"]) {
    const values = tenants.map((tenant) => tenant[field]);
    assert.equal(new Set(values).size, values.length, `${field} must be tenant-unique`);
  }
  assert.deepEqual(ACTIVE_PORTAL_TENANTS, ["bkwatch"]);
  assert.deepEqual(OWNER_ACTION_TENANTS, ["bkwatch"]);
  assert.deepEqual(NOTIFICATION_TENANTS, ["bkwatch"]);
  assert.equal(PORTAL_TENANTS.shaw.status, "planned");
  assert.equal(PORTAL_TENANTS.shaw.ownerActionsEnabled, false);
  assert.equal(PORTAL_TENANTS.shaw.notificationsEnabled, false);
  assert.equal(REQUIRED_TENANT_MANIFESTS.length, 9);
});

test("operational APIs accept only active tenant-prefixed routes", () => {
  assert.equal(tenantFromPath(new Request("https://thirdi.net/bkwatch/api/live")), "bkwatch");
  assert.equal(tenantFromPath(new Request("https://thirdi.net/shaw/api/live")), "");
  assert.equal(tenantFromPath(new Request("https://thirdi.net/api/portal/live")), "");
});

test("deployed Shaw API paths are explicitly denied before the placeholder catch-all", async () => {
  const config = await readFile(resolve(ROOT, "netlify.toml"), "utf8");
  const denial = config.indexOf('from = "/shaw/api/*"');
  const catchAll = config.indexOf('from = "/shaw/*"');
  assert.ok(denial >= 0 && catchAll >= 0 && denial < catchAll);
  assert.match(config.slice(denial, catchAll), /portal-inactive/);
  const response = await inactiveTenant();
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "inactive_tenant" });
});

test("communication safety rejects wrong-tenant participant routing", () => {
  const fixture = {
    emails: [],
    meetings: [{
      id: "wrong-tenant",
      attendees: ["thirdi@example.com", "jgann@shawsystems.com"]
    }]
  };
  assert.match(communicationSafetyIssues(fixture, "bkwatch").join("\n"), /no bkwatch participant/);
  assert.deepEqual(communicationSafetyIssues(fixture, "shaw"), []);
});
