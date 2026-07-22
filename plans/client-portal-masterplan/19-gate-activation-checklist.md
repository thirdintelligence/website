# Gate Activation Checklist (Phase 3+)

Prepared: 2026-07-17 · Updated: 2026-07-21 · For: Third i

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

**Decision needed:** approve the Cloudflare R2 Standard architecture in `18-asset-storage-delivery.md`.

**You do:**
1. Create a Cloudflare account + **R2 bucket** (production) and a separate **preview** bucket.
2. Create a scoped R2 API token (S3-compatible) limited to those buckets.
3. Approve: 2 GiB per-file limit, allowed MIME types, retention/backup, and a monthly budget alert.
4. Set a CORS policy allowing only the portal origins.
5. Add to Netlify env (never commit): `PORTAL_MEDIA_R2_ACCOUNT_ID`, `PORTAL_MEDIA_R2_BUCKET`,
   `PORTAL_MEDIA_R2_ACCESS_KEY_ID`, `PORTAL_MEDIA_R2_SECRET_ACCESS_KEY`,
   `PORTAL_MEDIA_ALLOWED_ORIGINS` (+ the numeric limits already in `.env.example`).

**Then I build:** signed multipart upload/download functions (bytes never pass through
Netlify), version history, readable `act1.scene2.vers3-description.mp4` filenames,
and the upload/download/isolation tests.

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

The `com.thirdi.auto-sync` launch agent currently exits `126`. Before any auto-publish, I
diagnose/replace it with the validated event/content sync in `09-live-data-security.md`.

---

## RELEASE-01/02/03 — Preview approval → provider config → production deploy

Only after the above: full QC matrix, a Netlify **deploy-preview** on non-prod stores for
your review, then your explicit production deploy approval. `main` auto-deploys, so the
switch to v2 happens through a reviewed PR with a rollback artifact retained.

---

## Suggested order

`DATA-01` → live comments/drafts/completion (highest client value) →
`EMAIL-01` → notifications → `DATA-02` → media/downloads → `MEM-01` → memory mirror →
OS redesign → `RELEASE-01/02/03`. Shaw only after bkWatch production is accepted.
