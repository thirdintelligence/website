# Gate Activation Checklist (Phase 3+)

Prepared: 2026-07-17 · Updated: 2026-07-22 · For: Third i

## Build status (updated 2026-07-17 — VERIFIED ON A NETLIFY DEPLOY-PREVIEW)

- Phase 1–2 preview: COMPLETE + accepted at the design/content gate.
- Phase 3 live backend: **BUILT, TESTED (63/63 current full suite), and VERIFIED END-TO-END on a
  Netlify deploy-preview** — real login, comment write/read persistence, and R2
  media presigning all succeeded on Netlify infrastructure.
- **Operational store = Cloudflare R2** (not Netlify Blobs). Reason: `@netlify/blobs`
  pulls `@netlify/otel` → 6 moderate OpenTelemetry advisories. R2 reuses the media
  credentials, keeps the dependency tree at **0 vulnerabilities**, and stores JSON
  under an isolated `_ops/<version>/` prefix. Toggle with `PORTAL_STORE=r2`.
- Required env vars now set in Netlify: the 8 media/mail vars + `PORTAL_STORE=r2`.
  The 3 auth secrets already existed (production-scoped).
- MEM-01 (memory mirror) remains DRY-RUN only until you approve it.
- The current bkWatch portal release is explicitly authorized for production by Third i's standing deploy instruction. Shaw activation remains separately gated.

This is the concrete "what I need from you" list to finish each gate. Nothing
changes production until you complete the step and explicitly say go.

---

## DATA-01 — Live operational store (comments, drafts, completion, actions)

**Implemented:** the portal uses the R2-backed operational adapter under an isolated
`_ops/<version>/` prefix. Comment, blocker-comment, draft, project-request, live
aggregation, owner action, and audit endpoints are built and tenant-scoped. Netlify
Blobs is not the active architecture.

**Remaining policy decision:** approve retention for soft-deleted comments and audit
events, plus verify preview and production namespaces remain distinct before any new
tenant activation.

---

## DATA-02 — Media storage (uploads + 2 GiB downloads) via Cloudflare R2

**Architecture approved and implemented:** private R2, signed direct transfers, tenant prefixes, owner approval before client access, 2 GiB owner/512 MiB client limits, current allowed types, and short-lived URLs.

**Current state:** `thirdi-media-preview` exists. Netlify deploy previews now resolve the preview bucket, a distinct operational store version, and a stable preview/local origin allowlist. Add the bucket-scoped preview Access Key ID/Secret Access Key and matching Cloudflare R2 CORS rule described in `25-r2-preview-bucket.md`; production credentials remain untouched.

Do not add quarantine/scanning, new retention automation, or budget alerts until real upload volume/provider requirements justify them. Review those policies when client-originated media becomes common.

---

## EMAIL-01 — Outbound notification to ceo@thirdi.net

**Decision needed:** pick a transactional email provider (e.g. Resend, Postmark, or SES)
and approve the sender identity.

**You do:**
1. Create the provider account and verify the sending domain (SPF/DKIM for `thirdi.net`).
2. Add to Netlify env: `PORTAL_MAIL_PROVIDER`, `PORTAL_MAIL_API_KEY`, `PORTAL_MAIL_FROM`
   (`PORTAL_OWNER_EMAIL=ceo@thirdi.net` is already set).
3. Approve the email copy + the OS superprompt templates (COMMS-01).

**Then I build:** the background notification job (email failure never loses the comment —
it becomes a retryable OS state), idempotent per event ID.

---

## MEM-01 — Client communications memory folders

**Decision needed:** approve creating and writing to the client-silo comms folders.

**You do:** approve after reviewing the dry-run output (I run the mirror in dry-run first).

**Then I build/run:** create
`memory/BKWATCH/BKWATCH_COMMS/{comments,emails,meetings}/`, migrate only bkWatch-owned
records, and enable the deterministic live→memory mirror (one file per event, idempotent).

---

## OPS-01 — Replace the failing auto-sync

**Complete 2026-07-22.** The old Desktop job and byte-change production deployer are retired. `com.thirdi.portal-data-refresh` runs from Application Support every 15 minutes, updates only a private local cache, preserves the last good cache when the local server is unavailable, exits cleanly, and never edits the repository or deploys. The disabled legacy plist is retained under Application Support for recovery/audit context.

---

## RELEASE-01/02/03 — Preview approval → provider config → production deploy

Only after the above: full QC matrix, a Netlify **deploy-preview** on non-prod stores for
your review, then your explicit production deploy approval. `main` auto-deploys, so the
switch to v2 happens through a reviewed PR with a rollback artifact retained.

---

## Suggested order

`DATA-01` → live comments/drafts/completion (highest client value) →
`EMAIL-01` → notifications → `DATA-02` → media/downloads → `MEM-01` → memory mirror →
OS redesign → `RELEASE-01/02/03`. bkWatch v2 is accepted; Shaw still requires its tenant content/design/data/deploy gates.
