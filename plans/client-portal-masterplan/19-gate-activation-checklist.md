# Gate Activation Checklist (Phase 3+)

Prepared: 2026-07-17 · For: Justin

## Build status (updated 2026-07-17, after DATA-02 + EMAIL-01 grant)

- Phase 1–2 preview: COMPLETE + accepted at the design/content gate.
- Phase 3 live backend: **CODE BUILT + FULLY TESTED locally** (comments CRUD,
  drafts, project requests, owner completion round-trip, tenant isolation, R2
  media signing, readable download names, idempotent email queue). 53/53 tests
  pass. It runs on a local file store for dev/tests and switches to Netlify Blobs
  + Cloudflare R2 + your mail provider purely via environment variables.
- What remains to go LIVE is **configuration + a deploy-preview**, not new code:
  set the env vars below in Netlify, then verify on a preview URL before prod.
- MEM-01 (memory mirror) remains DRY-RUN only until you approve it.
- No production state has changed; nothing is pushed.

This is the concrete "what I need from you" list to finish each gate. Nothing
changes production until you complete the step and explicitly say go.

---

## DATA-01 — Live operational store (comments, drafts, completion, actions)

**Decision needed:** approve **Netlify Blobs** as the hosted operational JSON store,
plus a retention policy (how long soft-deleted comments/audit events are kept).

**You do:**
1. Confirm Netlify Blobs is enabled for the `thirdintelligence` site (it is available on the plan; no extra signup).
2. Approve retention (suggested: audit events kept indefinitely; soft-deleted client comments hidden from UI but retained 180 days).
3. In Netlify → Site config → Environment variables, set (per context):
   - `PORTAL_DATA_STORE_VERSION=portal-live-v1`
   - a distinct **deploy-preview / dev** store namespace so previews never touch production data.

**Then I build (local + preview first):** `@netlify/blobs` adapter behind the storage
interface, the `portal-comments` / `portal-drafts` / `portal-project-requests` /
`portal-live` functions, tenant-derived auth, CSRF, rate limiting, immutable audit,
and the OS completion round-trip — all covered by the tenant-isolation test matrix.

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
