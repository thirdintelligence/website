/* Mailer adapter + notification queue: idempotent delivery, no send loss. */
import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupEnv, freshStore } from "./helpers.mjs";
import { getStore } from "../../lib/portal-store.mjs";
import { sendMail } from "../../lib/portal-mailer.mjs";
import { buildCommentEmail, queueNotification, processPending, listNotifications } from "../../lib/portal-notify.mjs";

let cleanup;
beforeEach(async () => { await setupEnv(); ({ cleanup } = await freshStore()); });
afterEach(async () => { await cleanup?.(); });

test("buildCommentEmail formats subject and body", () => {
  const email = buildCommentEmail("bkwatch", { title: "Check F03", projectId: "film1-shaw-bkwatch", blocker: true, createdAt: "2026-07-17T00:00:00Z", context: { route: "/bkwatch/projects/film1-shaw-bkwatch" } });
  assert.match(email.subject, /^\[Portal · bkWatch · film1-shaw-bkwatch\] Blocker: Check F03$/);
  assert.match(email.text, /Comment: Check F03/);
});

test("mailer: log provider succeeds; resend without key is not configured", async () => {
  process.env.PORTAL_MAIL_PROVIDER = "log";
  assert.equal((await sendMail({ to: "portal@thirdi.net", subject: "s", text: "t" })).ok, true);
  process.env.PORTAL_MAIL_PROVIDER = "resend";
  delete process.env.PORTAL_MAIL_API_KEY;
  assert.equal((await sendMail({ to: "x", subject: "s", text: "t" })).error, "mail_not_configured");
  process.env.PORTAL_MAIL_PROVIDER = "log";
});

test("processPending sends queued notifications once (idempotent)", async () => {
  const store = await getStore();
  await queueNotification(store, "bkwatch", { subjectId: "c1", sourceEventId: "e1", subject: "s1", text: "t1" });
  await queueNotification(store, "bkwatch", { subjectId: "c2", sourceEventId: "e2", subject: "s2", text: "t2" });

  const first = await processPending(store, "bkwatch");
  assert.equal(first.sent, 2);
  const second = await processPending(store, "bkwatch");
  assert.equal(second.sent, 0); // already sent → not resent
  assert.ok((await listNotifications(store, "bkwatch")).every((n) => n.status === "sent"));
});

test("resend failure leaves a retryable failed notification (comment not lost)", async () => {
  const store = await getStore();
  await queueNotification(store, "bkwatch", { subjectId: "c3", sourceEventId: "e3", subject: "s3", text: "t3" });
  process.env.PORTAL_MAIL_PROVIDER = "resend";
  process.env.PORTAL_MAIL_API_KEY = "test-key";
  // Inject a failing fetch to simulate provider downtime.
  const res = await processPending(store, "bkwatch", { fetchImpl: async () => ({ ok: false, status: 500 }) });
  assert.equal(res.failed, 1);
  const n = (await listNotifications(store, "bkwatch"))[0];
  assert.equal(n.status, "failed");
  assert.equal(n.lastError, "resend_500");
  process.env.PORTAL_MAIL_PROVIDER = "log";
});
