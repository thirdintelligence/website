/* Media policy, client-readable download names, and media-function authorization.
   R2 is intentionally NOT configured here, so signing calls return the honest
   "media_not_configured" path — proving auth/validation happen before any signing. */
import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupEnv, freshStore, authedReq } from "./helpers.mjs";
import { getStore, key } from "../../lib/portal-store.mjs";
import { validateIntent, MULTIPART_THRESHOLD } from "../../lib/portal-media-policy.mjs";
import { fromSceneRef, assetDownloadName, isSafeDownloadName } from "../../lib/portal-download-name.mjs";
import media from "../../netlify/functions/portal-media.mjs";

const U = "http://localhost:8888";
const mUrl = (p) => `${U}/bkwatch/api/media/${p}`;
let cleanup;
beforeEach(async () => { await setupEnv(); ({ cleanup } = await freshStore()); });
afterEach(async () => { await cleanup?.(); });

test("validateIntent enforces type, size, and multipart threshold", () => {
  assert.equal(validateIntent({ filename: "a.mp4", sizeBytes: 1024, contentType: "video/mp4" }).ok, true);
  assert.equal(validateIntent({ filename: "a.mp4", sizeBytes: MULTIPART_THRESHOLD + 1, contentType: "video/mp4" }).multipart, true);
  assert.equal(validateIntent({ filename: "x.svg", sizeBytes: 10, contentType: "image/svg+xml" }).ok, false); // active content
  assert.equal(validateIntent({ filename: "x.html", sizeBytes: 10 }).ok, false);
  assert.equal(validateIntent({ filename: "x.mp4", sizeBytes: 3e9, contentType: "video/mp4" }).error, "too_large");
  assert.equal(validateIntent({ filename: "x.mp4", sizeBytes: 10, contentType: "image/png" }).error, "type_mismatch");
});

test("download names are readable and never leak internal identifiers", () => {
  assert.equal(fromSceneRef("1.2.3", { description: "Portfolio Alert", ext: "mp4" }), "act1.scene2.vers3-portfolio-alert.mp4");
  assert.equal(fromSceneRef("1.2.2", { description: "Alternative frame", ext: "png" }), "act1.scene2.vers2-alternative-frame.png");
  assert.equal(assetDownloadName({ parts: ["film1", "final"], version: 2, ext: "mp4" }), "film1.final.vers2.mp4");
  assert.equal(isSafeDownloadName("act1.scene2.vers3-x.mp4"), true);
  assert.equal(isSafeDownloadName("a1b2c3d4e5f6a7b8.mp4"), false); // hash-like
  assert.equal(isSafeDownloadName("../secret.mp4"), false);        // path
});

test("media initiate rejects bad type (422) and reports unconfigured R2 (503)", async () => {
  const bad = await media(authedReq(mUrl("upload/initiate"), "POST", { body: { filename: "x.exe", sizeBytes: 10 } }));
  assert.equal(bad.status, 422);
  const ok = await media(authedReq(mUrl("upload/initiate"), "POST", { body: { filename: "clip.mp4", sizeBytes: 1024, contentType: "video/mp4" } }));
  assert.equal(ok.status, 503); // valid intent, but no R2 credentials configured
  assert.equal((await ok.json()).error, "media_not_configured");
});

test("download authorize denies non-approved media and unknown ids", async () => {
  const store = await getStore();
  await store.set(key("bkwatch", "media", "ast_pending"), { id: "ast_pending", tenant: "bkwatch", status: "pending", storageKey: key("bkwatch", "media", "ast_pending", "v1"), downloadName: "act1.scene1.vers1.mp4", sizeBytes: 10, versionId: "v1" });
  await store.set(key("bkwatch", "media", "ast_ok"), { id: "ast_ok", tenant: "bkwatch", status: "approved", storageKey: key("bkwatch", "media", "ast_ok", "v1"), downloadName: "act1.scene1.vers1.mp4", sizeBytes: 10, versionId: "v1" });

  assert.equal((await media(authedReq(mUrl("download/authorize"), "POST", { body: { assetId: "ast_pending" } }))).status, 403);
  assert.equal((await media(authedReq(mUrl("download/authorize"), "POST", { body: { assetId: "nope" } }))).status, 404);
  const approved = await media(authedReq(mUrl("download/authorize"), "POST", { body: { assetId: "ast_ok" } }));
  assert.equal(approved.status, 503); // approved + tenant-authorized, only blocked by missing R2 creds
});

test("media requires authentication and CSRF", async () => {
  assert.equal((await media(authedReq(mUrl("upload/initiate"), "POST", { anon: true, body: {} }))).status, 401);
  assert.equal((await media(authedReq(mUrl("upload/initiate"), "POST", { csrf: false, body: {} }))).status, 403);
});

test("multipart completion validates ordered parts before storage calls", async () => {
  const store = await getStore();
  await store.set(key("bkwatch", "media", "ast_multi"), {
    id: "ast_multi", tenant: "bkwatch", status: "uploading", uploadId: "upload-1",
    storageKey: key("bkwatch", "media", "ast_multi", "v1"), versionId: "v1"
  });
  assert.equal((await media(authedReq(mUrl("upload/part"), "POST", { body: { assetId: "ast_multi", partNumber: 0 } }))).status, 422);
  assert.equal((await media(authedReq(mUrl("upload/complete"), "POST", { body: { assetId: "ast_multi", parts: [] } }))).status, 422);
  assert.equal((await media(authedReq(mUrl("upload/complete"), "POST", { body: { assetId: "ast_multi", parts: [{ partNumber: 2, etag: "x" }] } }))).status, 422);
});

test("playback authorization is limited to approved video", async () => {
  const store = await getStore();
  await store.set(key("bkwatch", "media", "ast_image"), { id: "ast_image", tenant: "bkwatch", status: "approved", kind: "image", storageKey: "x" });
  await store.set(key("bkwatch", "media", "ast_video"), { id: "ast_video", tenant: "bkwatch", status: "pending", kind: "video", storageKey: "y" });
  assert.equal((await media(authedReq(mUrl("playback/authorize"), "POST", { body: { assetId: "ast_image" } }))).status, 403);
  assert.equal((await media(authedReq(mUrl("playback/authorize"), "POST", { body: { assetId: "ast_video" } }))).status, 403);
});
