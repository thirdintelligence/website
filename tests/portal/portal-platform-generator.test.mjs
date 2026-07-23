import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { portalShell } from "../../netlify/functions/bkwatch-portal.mjs";
import { generateTenant, GENERATED_MANIFEST_FILES } from "../../scripts/portal/generate-tenant.mjs";
import { PORTAL_TENANTS } from "../../config/portal-tenants.mjs";
import { assertPortalStoreIsolation, portalStoreVersion } from "../../lib/portal-store.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const visualLock = JSON.parse(await readFile(
  resolve(import.meta.dirname, "fixtures", "bkwatch-visual-lock.json"),
  "utf8"
));

test("bkWatch migration preserves the exact accepted shell and every visual source", async () => {
  const shell = await portalShell(visualLock.shell.csrfFixture);
  assert.equal(Buffer.byteLength(shell), visualLock.shell.bytes);
  assert.equal(sha(shell), visualLock.shell.sha256);
  for (const [relativePath, expected] of Object.entries(visualLock.sources)) {
    assert.equal(sha(await readFile(resolve(ROOT, relativePath))), expected, relativePath);
  }
});

test("shared renderer is the only authenticated tenant HTML implementation", async () => {
  const wrapper = await readFile(resolve(ROOT, "netlify/functions/bkwatch-portal.mjs"), "utf8");
  const platform = await readFile(resolve(ROOT, "lib/portal-platform.mjs"), "utf8");
  assert.match(wrapper, /createPortalPlatform\("bkwatch"\)/);
  assert.doesNotMatch(wrapper, /<!doctype html>|login-shell|portal-data/);
  assert.match(platform, /id="portal-data"/);
  assert.equal(PORTAL_TENANTS.shaw.shell, null);
});

test("generator emits config, manifests, fixture, and release only", async () => {
  const output = await mkdtemp(resolve(tmpdir(), "portal-generator-"));
  try {
    const result = await generateTenant({
      configPath: "config/portal-generator/shaw.json",
      output
    });
    assert.equal(result.tenant, "shaw");
    assert.deepEqual(result.manifests, GENERATED_MANIFEST_FILES);
    assert.deepEqual((await readdir(output)).sort(), [
      "manifests",
      "release.json",
      "tenant-config.json",
      "test-fixture.json"
    ]);
    assert.deepEqual((await readdir(resolve(output, "manifests"))).sort(), [...GENERATED_MANIFEST_FILES].sort());
    const allNames = [
      ...(await readdir(output)),
      ...(await readdir(resolve(output, "manifests")))
    ];
    assert.equal(allNames.some((name) => /\.html?$|\.mjs$/.test(name)), false);
    const release = JSON.parse(await readFile(resolve(output, "release.json"), "utf8"));
    assert.equal(release.approvals.publication, false);
    assert.equal(release.promoted, false);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("Shaw generated draft is isolated and remains non-routable", async () => {
  const generated = await generateTenant({
    configPath: "config/portal-generator/shaw.json",
    check: true
  });
  const fixture = JSON.parse(await readFile(
    resolve(generated.outputRoot, "test-fixture.json"),
    "utf8"
  ));
  const release = JSON.parse(await readFile(
    resolve(generated.outputRoot, "release.json"),
    "utf8"
  ));
  assert.equal(fixture.sessionCookie, "thirdi_shaw_session");
  assert.equal(fixture.wrongTenant, "bkwatch");
  assert.notEqual(fixture.previewOperationalPrefix, PORTAL_TENANTS.bkwatch.environments.preview.operationalPrefix);
  assert.notEqual(fixture.productionOperationalPrefix, PORTAL_TENANTS.bkwatch.environments.production.operationalPrefix);
  assert.notEqual(fixture.previewMediaPrefix, PORTAL_TENANTS.bkwatch.environments.preview.mediaPrefix);
  assert.equal(release.channel, "draft");
  assert.deepEqual(release.approvals, { content: false, design: false, publication: false });
  assert.equal(PORTAL_TENANTS.shaw.status, "planned");
  assert.equal(PORTAL_TENANTS.shaw.ownerActionsEnabled, false);
  assert.equal(PORTAL_TENANTS.shaw.notificationsEnabled, false);
  for (const file of GENERATED_MANIFEST_FILES) {
    const raw = await readFile(resolve(generated.outputRoot, "manifests", file), "utf8");
    assert.doesNotMatch(raw, /\bbkwatch\b|bankruptcywatch/i, `${file} contains cross-client content`);
  }
});

test("preview, production, and local operational stores have different default versions", () => {
  assert.equal(portalStoreVersion({ CONTEXT: "deploy-preview" }), "portal-preview-v1");
  assert.equal(portalStoreVersion({ CONTEXT: "branch-deploy" }), "portal-preview-v1");
  assert.equal(portalStoreVersion({ CONTEXT: "production" }), "portal-live-v1");
  assert.equal(portalStoreVersion({}), "portal-local-v1");
  assert.throws(
    () => assertPortalStoreIsolation({ CONTEXT: "deploy-preview", PORTAL_DATA_STORE_VERSION: "portal-live-v1" }),
    /preview_context_cannot_use_live_portal_store/
  );
  assert.throws(
    () => assertPortalStoreIsolation({ CONTEXT: "production", PORTAL_DATA_STORE_VERSION: "portal-preview-v1" }),
    /production_context_cannot_use_preview_portal_store/
  );
});
