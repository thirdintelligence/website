/* Operational API round-trips, tenant isolation, and the owner completion flow.
   Handlers are invoked directly with authenticated Requests + a fresh file store. */
import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupEnv, freshStore, authedReq } from "./helpers.mjs";
import { getStore, key } from "../../lib/portal-store.mjs";
import { listActions } from "../../lib/portal-actions.mjs";
import { listNotifications } from "../../lib/portal-notify.mjs";
import { listEvents } from "../../lib/portal-audit.mjs";

import comments from "../../netlify/functions/portal-comments.mjs";
import drafts from "../../netlify/functions/portal-drafts.mjs";
import projectRequests from "../../netlify/functions/portal-project-requests.mjs";
import live from "../../netlify/functions/portal-live.mjs";
import osActions from "../../netlify/functions/os-portal-actions.mjs";

const U = "http://localhost:8888";
const cUrl = U + "/bkwatch/api/comments";
let cleanup;

beforeEach(async () => { await setupEnv(); ({ cleanup } = await freshStore()); });
afterEach(async () => { await cleanup?.(); });

const postComment = (body) => comments(authedReq(cUrl, "POST", { body }));

test("store: set/get/list/delete + key guards tenant", async () => {
  const store = await getStore();
  await store.set(key("bkwatch", "x", "1"), { a: 1 });
  assert.deepEqual(await store.get(key("bkwatch", "x", "1")), { a: 1 });
  assert.deepEqual(await store.list("tenants/bkwatch/x/"), ["tenants/bkwatch/x/1"]);
  await store.delete(key("bkwatch", "x", "1"));
  assert.equal(await store.get(key("bkwatch", "x", "1")), null);
  assert.throws(() => key("../evil", "x"));
});

test("comment create → durable record + OS action + queued notification + audit", async () => {
  const res = await postComment({ title: "Faster settle on F02", blocker: false, projectId: "film1-shaw-bkwatch", context: { scope: "scene", sceneId: "F02" } });
  assert.equal(res.status, 201);
  const { comment } = await res.json();
  assert.equal(comment.tenant, "bkwatch");
  assert.equal(comment.status, "open");
  assert.equal(comment.attribution, "bkWatch commented");

  const store = await getStore();
  const actions = await listActions(store, "bkwatch");
  assert.equal(actions.length, 1);
  assert.equal(actions[0].subjectId, comment.id);
  assert.equal(actions[0].executable, true);

  const notes = await listNotifications(store, "bkwatch");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].status, "queued");
  assert.equal(notes[0].to, "portal@thirdi.net");
  assert.match(notes[0].subject, /\[Portal · bkWatch · film1-shaw-bkwatch\]/);

  const events = await listEvents(store, "bkwatch");
  assert.ok(events.some((e) => e.type === "comment.created" && e.subjectId === comment.id));
});

test("blocker comment produces a blocker action", async () => {
  const { comment } = await (await postComment({ title: "Confirm live Status field", blocker: true })).json();
  assert.equal(comment.kind, "comment");
  assert.equal(comment.blocker, true);
  const actions = await listActions(await getStore(), "bkwatch");
  assert.equal(actions[0].type, "blocker");
  assert.equal(actions[0].subjectId, comment.id);
});

test("comment edit + soft-delete", async () => {
  const { comment } = await (await postComment({ title: "Original" })).json();
  const edited = await (await comments(authedReq(`${cUrl}/${comment.id}`, "PATCH", { body: { title: "Edited" } }))).json();
  assert.equal(edited.comment.title, "Edited");
  assert.equal(edited.comment.revision, 2);

  const del = await comments(authedReq(`${cUrl}/${comment.id}`, "DELETE"));
  assert.equal(del.status, 200);
  const list = await (await comments(authedReq(cUrl, "GET"))).json();
  assert.equal(list.comments.find((c) => c.id === comment.id), undefined); // hidden from UI
  const raw = await (await getStore()).get(key("bkwatch", "comments", comment.id));
  assert.equal(raw.deleted, true); // retained internally for audit
});

test("client input cannot override the server-derived tenant", async () => {
  const { comment } = await (await postComment({ title: "x", tenant: "shaw", status: "completed", attribution: "hacker" })).json();
  assert.equal(comment.tenant, "bkwatch");
  assert.equal(comment.status, "open");
  assert.equal(comment.attribution, "bkWatch commented");
});

test("anonymous and missing-CSRF requests are rejected", async () => {
  assert.equal((await comments(authedReq(cUrl, "POST", { anon: true, body: { title: "x" } }))).status, 401);
  assert.equal((await comments(authedReq(cUrl, "POST", { csrf: false, body: { title: "x" } }))).status, 403);
});

test("tenant isolation: bkWatch session cannot use another tenant's cookie namespace", async () => {
  await postComment({ title: "bkwatch only" });
  // A Shaw session presented to the /bkwatch endpoint has no bkwatch cookie → denied.
  const crossed = await comments(authedReq(cUrl, "GET", { tenant: "shaw" }));
  assert.equal(crossed.status, 401);
  // Shaw's own list is empty and never contains bkWatch records.
  const shawList = await (await comments(authedReq(U + "/shaw/api/comments", "GET", { tenant: "shaw" }))).json();
  assert.equal(shawList.comments.length, 0);
});

test("drafts persist server-side per device cookie", async () => {
  const dUrl = U + "/bkwatch/api/drafts";
  const post = await drafts(authedReq(dUrl, "POST", { body: { mode: "comment", fields: { title: "draft" } } }));
  const setCookie = post.headers.get("set-cookie");
  assert.match(setCookie, /thirdi_bkwatch_device=/);
  const device = setCookie.split(";")[0];
  const get = await drafts(new Request(dUrl, { headers: { cookie: `${device}; thirdi_bkwatch_session=${authedReq(dUrl).headers.get("cookie").match(/thirdi_bkwatch_session=([^;]+)/)[1]}` } }));
  const { draft } = await get.json();
  assert.equal(draft.fields.title, "draft");
});

test("project request → record + non-executable action + notification", async () => {
  const res = await projectRequests(authedReq(U + "/bkwatch/api/project-requests", "POST", { body: { name: "Compliance explainer", description: "A short film for compliance leaders." } }));
  assert.equal(res.status, 201);
  const store = await getStore();
  const actions = await listActions(store, "bkwatch");
  assert.equal(actions[0].type, "project-request");
  assert.equal(actions[0].executable, false);
  assert.equal((await listNotifications(store, "bkwatch")).length, 1);
});

test("live endpoint returns comments, counts, and a rotated CSRF token", async () => {
  await postComment({ title: "blocker one", blocker: true });
  const res = await live(authedReq(U + "/bkwatch/api/live", "GET"));
  const body = await res.json();
  assert.equal(body.counts.comments, 1);
  assert.equal(body.counts.openBlockers, 1);
  assert.ok(body.csrfToken);
  assert.match(res.headers.get("set-cookie"), /thirdi_bkwatch_csrf=/);
});

test("owner completes a comment → comment flips to Completed with an event", async () => {
  const { comment } = await (await postComment({ title: "Approve script" })).json();
  const store = await getStore();
  const actionId = (await listActions(store, "bkwatch"))[0].id;

  // client cannot reach the owner endpoint
  assert.equal((await osActions(authedReq(`${U}/os/api/actions/${actionId}`, "PATCH", { tenant: "bkwatch", body: { tenant: "bkwatch", op: "complete" } }))).status, 401);

  // owner completes
  const res = await osActions(authedReq(`${U}/os/api/actions/${actionId}`, "PATCH", { tenant: "thirdi-os", body: { tenant: "bkwatch", op: "complete", note: "Confirmed." } }));
  assert.equal(res.status, 200);
  const updated = await store.get(key("bkwatch", "comments", comment.id));
  assert.equal(updated.status, "completed");
  assert.equal(updated.completionNote, "Confirmed.");
  assert.ok((await listEvents(store, "bkwatch")).some((e) => e.type === "comment.completed"));
});

test("owner event feed aggregates client actions; client session is denied", async () => {
  await postComment({ title: "for the feed" });
  assert.equal((await osActions(authedReq(U + "/os/api/portal-events", "GET", { tenant: "bkwatch" }))).status, 401);
  const feed = await (await osActions(authedReq(U + "/os/api/portal-events", "GET", { tenant: "thirdi-os" }))).json();
  assert.equal(feed.tenants.bkwatch.actions.length, 1);
  assert.equal(feed.connection.portals, "ok");
});
