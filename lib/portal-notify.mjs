/**
 * portal-notify.mjs — owner notification queue.
 *
 * A comment write queues a durable notification record FIRST; email is sent by a
 * background pass. Email failure never loses the comment — it leaves a retryable
 * notification the OS surfaces. Sending is idempotent per notification id.
 */
import { key } from "./portal-store.mjs";
import { newId, nowIso } from "./portal-ids.mjs";
import { tenantLabel } from "./portal-api-util.mjs";
import { sendMail } from "./portal-mailer.mjs";

const ownerEmail = () => process.env.PORTAL_OWNER_EMAIL || "portal@thirdi.net";

export function buildCommentEmail(tenant, comment, osDeepLink) {
  const label = tenantLabel(tenant);
  const project = comment.projectId && comment.projectId !== "general" ? comment.projectId : "General";
  const subject = `[Portal · ${label} · ${project}]${comment.blocker ? " Blocker:" : ""} ${comment.title}`;
  const lines = [
    `Tenant: ${label}`, `Project: ${project}`,
    comment.context?.route ? `Context: ${comment.context.route}` : null,
    Number.isFinite(comment.timestampMs) ? `Timestamp: ${Math.floor(comment.timestampMs / 1000)}s` : null,
    ``, `Comment: ${comment.title}`,
    comment.description ? `Details: ${comment.description}` : null,
    ``, `Created: ${comment.createdAt}`,
    osDeepLink ? `OS: ${osDeepLink}` : null
  ].filter((l) => l !== null);
  return { subject, text: lines.join("\n") };
}

export async function queueNotification(store, tenant, { subjectId, sourceEventId, subject, text }) {
  const rec = {
    id: newId("ntf"), tenant, subjectId, sourceEventId, to: ownerEmail(),
    subject, text, status: "queued", attempts: 0, createdAt: nowIso()
  };
  await store.set(key(tenant, "notifications", rec.id), rec);
  return rec;
}

export async function listNotifications(store, tenant) {
  const keys = await store.list(key(tenant, "notifications") + "/");
  return (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean);
}

/** Send all non-sent notifications for a tenant. Idempotent: sent ones are skipped. */
export async function processPending(store, tenant, deps = {}) {
  const keys = await store.list(key(tenant, "notifications") + "/");
  let sent = 0, failed = 0;
  for (const k of keys) {
    const n = await store.get(k);
    if (!n || n.status === "sent") continue;
    n.attempts = (n.attempts || 0) + 1;
    const res = await sendMail({ to: n.to, subject: n.subject, text: n.text }, deps);
    n.status = res.ok ? "sent" : "failed";
    n.lastError = res.ok ? undefined : res.error;
    n.updatedAt = nowIso();
    await store.set(k, n);
    res.ok ? sent++ : failed++;
  }
  return { sent, failed };
}
