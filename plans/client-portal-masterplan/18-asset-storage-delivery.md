# Large Asset Storage and Client Delivery

Decision status: architecture/current policy approved; preview bucket and non-secret Netlify overrides configured; preview credential/CORS pending
Prepared: 2026-07-16
Primary decision: private Cloudflare R2 Standard storage with tenant-authorized, short-lived direct upload/download URLs

## Outcome

Use Cloudflare R2 Standard as the portal's client-delivery store for approved stills, videos, PDFs, and project files.

- Support individual client-visible files up to **2 GiB** (`2,147,483,648` bytes) in the first release.
- Support more than **20 GB of new assets per month** and at least **100 GB retained per year** without changing the client experience.
- Upload and download media directly between the browser/local publishing tool and R2. Netlify authenticates and signs the transfer but never proxies the file bytes.
- Keep the R2 bucket private. A client sees a normal `Download` button, not a storage console, public folder, Google login, or permanent share link.
- Preserve the readable filename system: `1.2.3` becomes `act1.scene2.vers3`, optionally followed by a short description.
- Use R2 Standard initially. Do not use R2 Infrequent Access for active client work because its retrieval charge and 30-day minimum add complexity for a very small storage saving.

This is the best overall fit—not necessarily the lowest theoretical storage line item—because it combines very low cost, unlimited free direct egress, S3-compatible signed URLs, resumable multipart uploads, range reads for video, and no extra client account.

## Planning assumptions

The user's stated growth has two useful planning cases:

1. **Conservative retained library:** at least 100 GB by the end of year one.
2. **Straight-line growth:** 20 GB retained every month, or approximately 240 GB by the end of year one.

Downloads are variable and may be repeated by several client users. The architecture therefore optimizes for predictable egress rather than assuming each asset is downloaded only once.

The 2 GiB limit is a product policy, not a provider ceiling. R2 supports single-request uploads up to 5 GiB and multipart objects up to approximately 5 TiB. The lower portal limit protects browser reliability, upload time, and accidental cost while leaving room to raise it later. [Cloudflare R2 upload documentation](https://developers.cloudflare.com/r2/objects/upload-objects/) and [R2 platform limits](https://developers.cloudflare.com/r2/platform/limits/)

## Provider comparison

Pricing is an as-of-2026-07-16 planning snapshot and must be rechecked before account setup.

| Option | Storage | Internet delivery | 2 GiB/private portal fit | Planning conclusion |
|---|---:|---:|---|---|
| **Cloudflare R2 Standard** | $0.015/GB-month after 10 GB free | Free direct egress | Excellent: multipart, presigned GET/PUT, S3 API, range reads | **Selected** |
| Backblaze B2 | Starts at $6.95/TB-month | Free up to 3× average monthly storage, then $0.01/GB | Strong S3-compatible runner-up | Slightly cheaper storage, less predictable for repeated delivery |
| Bunny Storage + CDN | $0.01/GB-month, $1 monthly minimum | Common North America/Europe delivery $0.01/GB | Good delivery tooling | Egress makes repeated client downloads costlier |
| DigitalOcean Spaces | $5/month includes 250 GiB and 1 TiB outbound | $0.01/GiB over included transfer | Simple and predictable | Good fixed-price fallback, but costs more at this scale |
| Wasabi | $7.99/TB-month with 1 TB monthly minimum | No egress/API charge under policy | Technically strong | 1 TB minimum and 90-day minimum make 100–240 GB uneconomic |
| AWS S3 Standard | Starts near $0.023/GB-month | Transfer/request charges after allowances | Enterprise-complete | Too expensive and less predictable for this use case |
| Google Drive/Workspace | May fit existing pooled quota | No object-storage egress bill | Poor fit with shared portal password | Requires Google permissions/public links or a proxy; not the primary portal store |
| Netlify Blobs | Object capacity is large enough on paper | Coupled to Netlify usage | Poor for direct 2 GiB ingest | Function request/response limits prevent proxying these files |

Official sources: [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Backblaze B2 pricing](https://www.backblaze.com/cloud-storage/pricing), [Backblaze transaction/egress pricing](https://www.backblaze.com/cloud-storage/transaction-pricing), [Bunny Storage](https://bunny.net/pricing/storage/), [Bunny CDN](https://bunny.net/pricing/cdn/), [DigitalOcean Spaces](https://www.digitalocean.com/pricing/spaces-object-storage), [Wasabi pricing FAQ](https://wasabi.com/pricing/faq), [AWS S3 pricing](https://aws.amazon.com/s3/pricing/), [Netlify Functions limits](https://docs.netlify.com/build/functions/configuration/), and [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).

### Why R2 wins over Backblaze B2

Backblaze B2 is the storage-cost runner-up and can be cheaper when outbound traffic stays below its free allowance. At 240 GB stored, the raw storage difference is only about $1.85 per month using the published starting rate and 10 GB free allowance. R2 removes the 3×-storage egress threshold entirely, so repeated final-cut downloads, restores, and client-team downloads cannot create bandwidth overage. That predictable delivery is worth more than the small storage saving at the planned scale.

Re-evaluate B2 if retained media exceeds 1 TB, download traffic remains consistently below 3× average storage for six months, and the measured savings justify a migration.

### Why Google Drive is not the portal delivery layer

Google Drive remains useful for owner working files or an independent master/archive copy. It is not the primary portal store because the current shared-password portal cannot safely grant each client Google identity access. “Anyone with the link” would bypass tenant authorization; proxying Drive through Netlify would hit the same large-response constraint; and requiring a Google login adds client friction.

## Cost model

Cloudflare calculates Standard storage using average daily GB-month, includes 10 GB-month of Standard storage and large monthly operation allowances, and does not charge direct internet egress. Ordinary portal operation counts should remain well inside the free operation allowances. [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)

### R2 steady-state monthly storage

| Retained assets | Approximate R2 Standard storage/month | Download egress | Expected request cost at portal scale |
|---:|---:|---:|---:|
| 100 GB | $1.35 | $0 | $0 within free tier |
| 240 GB | $3.45 | $0 | $0 within free tier |
| 500 GB | $7.35 | $0 | $0 within free tier |
| 1,000 GB | $14.85 | $0 | $0 within free tier |

Formula: `max(0, retainedGB - 10) × $0.015`. Actual invoices use average daily storage and Cloudflare's billing-unit rounding.

### Approximate year-one storage cost

| Growth case | Year-end size | Approximate average stored | Approximate first-year R2 storage |
|---|---:|---:|---:|
| Reaches 100 GB linearly | 100 GB | 50 GB | about $7.20 |
| Adds 20 GB/month linearly | 240 GB | 120 GB | about $19.80 |

These figures exclude tax, optional backup storage, and abnormal request volume. They demonstrate that the selected solution is effectively a few dollars per month at the expected scale, even when client download volume is high.

### Scenario comparison

The table below is directional and uses common North America delivery rates. It is not a quote.

| Scenario: stored / downloaded in one month | R2 | Backblaze B2 | Bunny | DigitalOcean Spaces | Wasabi | AWS S3 Standard |
|---|---:|---:|---:|---:|---:|---:|
| 100 GB / 100 GB | ~$1.35 | ~$0.63 | ~$2.00 | $5.00 | $7.99 minimum | ~$2.30 before request costs |
| 240 GB / 500 GB | ~$3.45 | ~$1.60 | ~$7.40 | $5.00 | $7.99 minimum | roughly $40+ after common egress |
| 500 GB / 1 TB | ~$7.35 | ~$3.41 | ~$15.00 | roughly $10.00 | $7.99 minimum | roughly $90+ after common egress |
| 1 TB / 2 TB | ~$14.85 | ~$6.88 | ~$30.00 | roughly $30.00 | $7.99 | roughly $190+ after common egress |

Backblaze figures assume download remains inside its 3× storage allowance. R2 remains the selected provider because its egress does not depend on that assumption.

## Storage topology

Use one private production bucket with strict tenant prefixes and separate non-production buckets or accounts.

```text
thirdi-portal-media-production/
  tenants/{tenantId}/
    projects/{projectId}/
      assets/{assetId}/
        versions/{versionId}/
          source-object
          poster-object
          preview-object

thirdi-portal-media-preview/
  tenants/test-bkwatch/...
```

The object key is opaque and server-generated. It never contains a client-facing filename, local path, prompt text, email address, or secret. The operational asset record maps the opaque object key to:

- tenant, project, film/idea/scene references;
- asset ID and immutable version ID;
- validation status and `clientSafe` state;
- byte size, media type, checksum, duration/dimensions when known;
- readable download filename;
- selected/current version pointer;
- upload/approval timestamps and source provenance kept server-side.

## Upload architecture

### Owner and approved intake uploads

1. The owner publishing tool or an authenticated, owner-issued intake link requests an upload session from Netlify.
2. Netlify derives the tenant from the authenticated session or signed intake grant, validates the declared size/type/project, creates the pending asset record, and initiates an R2 multipart upload.
3. The browser or local tool uploads directly to R2 using signed part URLs. Netlify does not receive the file bytes.
4. Use multipart upload for files over 100 MiB. Default part size: **64 MiB**, producing approximately 16 parts for 1 GiB and 32 parts for 2 GiB.
5. Upload state retains upload ID, completed part numbers/ETags, expiry, and asset ID so interrupted transfers can resume.
6. The finalize endpoint verifies every expected part, total size, declared checksum/type, tenant, and pending asset record before completing the multipart upload.
7. The asset remains quarantined/non-client-safe until server-side validation and owner approval finish.
8. Abandoned multipart uploads are automatically aborted after seven days or less.

The initial product limit is 2 GiB per file. A user sees the limit, current progress, uploaded bytes, estimated time, pause/resume/retry, and a clear error if the file is too large. A failed upload never creates a downloadable “complete” asset.

### Comment attachments

Comment attachments use the same signed object path. Small attachments do not need a separate storage system merely because Netlify Blobs can hold them. One media pipeline produces consistent validation, quarantine, tenant controls, and downloads.

Client uploads remain limited to comment attachments and explicit owner-issued intake links. There is no general public upload library.

The 2 GiB limit is guaranteed for owner/local publisher uploads and client downloads. Client-originated comment attachments use a separately configurable lower limit until allowed types, quarantine, and malware-scanning/owner-review controls are approved at `DATA-02`. Do not promise 2 GiB untrusted client uploads merely because R2 can store them.

## Client download experience

The client-facing flow is intentionally simple:

1. Show asset title, version/status, file type, exact size, and a clear action such as `Download 1.82 GB`.
2. Client clicks Download.
3. Netlify validates the active tenant session, confirms the asset is client-safe and belongs to that tenant, writes a lightweight audit event, and issues a presigned R2 `GET` URL.
4. The browser downloads directly from R2 with `Content-Disposition: attachment` and the readable filename.
5. The client never signs into Cloudflare and never sees a permanent bucket link.

Default download URL lifetime: **4 hours**. This is long enough for a 2 GiB transfer on a slow connection and range/resume behavior, but it does not create a permanent share link. A signed URL is a bearer credential until expiration and must not be logged in full, stored in static HTML, placed in analytics, or emailed as a permanent asset URL. [Cloudflare presigned URL documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

If a link expires before completion, the portal silently requests a fresh authorization when the authenticated client retries. Do not expose raw `403` storage errors as the final UX.

### Playback and range reads

For inline review, issue a separate short-lived signed `GET` with the correct `Content-Type` and inline disposition. R2 supports ranged reads, allowing the browser to seek without downloading an entire 2 GiB video first. A refreshed signed URL must preserve the current playback timestamp where possible.

Do not use the original 2 GiB master as the default mobile preview when an approved optimized review proxy exists. The master remains downloadable; the portal player prefers a smaller client-safe review encode and poster for performance.

## Download filenames

The file sent to the client uses the human-facing metadata filename, not the storage key.

```text
1.2.3  ->  act1.scene2.vers3
act1.scene2.vers3-portfolio-alert.mp4
film1.final.vers2.mp4
```

The UI adds a short description next to the filename and size, for example:

```text
Act 1 · Scene 2 · Version 3 — Portfolio alert
MP4 video · 1.82 GB
```

The storage key stays opaque. `Content-Disposition` supplies the readable filename at download time. ZIP exports keep these names inside a project-named folder to avoid collisions. The complete naming contract remains in `05-projects-and-creative.md`.

## Security and privacy controls

- Bucket is private; do not enable `r2.dev` public access.
- Netlify derives tenant identity from the encrypted session, never request JSON.
- Every authorization checks tenant, asset, version, `clientSafe`, approval status, and allowed action.
- R2 credentials stay in Netlify/local owner environment variables, never browser JavaScript.
- Use a least-privilege R2 API token scoped only to the media bucket.
- CORS allows only explicit portal origins and necessary methods/headers. Production starts with `https://thirdi.net`; preview/local origins are separate non-production configuration.
- Presigned upload URLs restrict method, object key, expiry, and signed headers. Presigned download URLs are short-lived bearer credentials.
- Validate declared size/type before signing and verify size, checksum, MIME/magic bytes, and safe status after upload.
- Never render active HTML, SVG, or script directly from uploads.
- Audit authorization and completion without storing the full signed URL.
- Rate-limit authorization endpoints and cap incomplete uploads per session/tenant.
- Previous approved media versions remain immutable and downloadable; changing the current version updates a pointer rather than overwriting the object.
- Owner-only deletion uses a retention/grace workflow. Client actions never hard-delete media.

R2 documents encryption at rest with AES-256-GCM, TLS in transit, strong consistency, and eleven-nines annual durability. Durability is not protection from authorized accidental deletion, so retain a separate canonical master or backup. [R2 data security](https://developers.cloudflare.com/r2/reference/data-security/), [consistency](https://developers.cloudflare.com/r2/reference/consistency/), and [durability](https://developers.cloudflare.com/r2/reference/durability/)

## Retention, backup, and cost controls

- R2 is the client-delivery copy, not the only copy of irreplaceable masters.
- Keep the canonical production master in the approved local project store and/or owner-controlled Google Workspace archive.
- Retain every client-visible still/video version unless the owner explicitly applies the documented deletion policy.
- Automatically abort incomplete multipart uploads after at most seven days.
- Do not automatically transition active client assets to Infrequent Access.
- Create a monthly storage/download dashboard in OS by tenant and project.
- Configure provider budget notifications before production. Suggested alerts: $5, $15, and $30 estimated monthly usage.
- Review duplicate masters, unused proxies, and unapproved quarantined files monthly; never delete an approved version merely to save space.
- Test restore/download from a non-production tenant quarterly.

## Exact implementation contract

### Server endpoints

```text
POST /api/portal/media/upload/initiate
POST /api/portal/media/upload/part
POST /api/portal/media/upload/complete
POST /api/portal/media/upload/abort
POST /api/portal/media/download/authorize
POST /api/portal/media/playback/authorize
GET  /api/portal/media/:assetId/metadata
```

Each endpoint validates session, CSRF where mutating, origin, tenant, asset/project context, schema, expiry, and rate limit. The browser never supplies an authoritative tenant.

### Required environment variables

```text
PORTAL_MEDIA_PROVIDER=r2
PORTAL_MEDIA_R2_ACCOUNT_ID
PORTAL_MEDIA_R2_BUCKET
PORTAL_MEDIA_R2_ACCESS_KEY_ID
PORTAL_MEDIA_R2_SECRET_ACCESS_KEY
PORTAL_MEDIA_MAX_BYTES=2147483648
PORTAL_MEDIA_PART_BYTES=67108864
PORTAL_MEDIA_DOWNLOAD_TTL_SECONDS=14400
PORTAL_MEDIA_PART_TTL_SECONDS=3600
PORTAL_MEDIA_UPLOAD_SESSION_TTL_SECONDS=86400
PORTAL_MEDIA_CLIENT_UPLOAD_MAX_BYTES
PORTAL_MEDIA_ALLOWED_ORIGINS
```

Use distinct bucket names, credentials, and allowed origins for development/preview and production. Never place real production media in deploy previews.

### SDK boundary

Use the AWS S3-compatible JavaScript SDK behind `lib/portal-media-store.mjs`; provider-specific calls do not leak into page code or core asset records. This keeps Backblaze B2 or another S3-compatible migration possible without rewriting the portal UI.

## Acceptance tests

The media path is not ready until all of these pass:

- 1 MiB, 100 MiB, 1 GiB, and 2 GiB fixture/sparse-file upload paths complete in preview; the 1–2 GiB cases use multipart.
- An interrupted multipart upload resumes without re-uploading completed parts.
- A file one byte above 2 GiB is rejected before transfer begins.
- Wrong tenant, anonymous, expired session, guessed asset ID, and `clientSafe: false` downloads all fail.
- A 2 GiB direct download does not pass through a Netlify Function response.
- Download response uses the readable `act1.scene2.vers3-description.ext` name and validated extension.
- Range request returns the correct partial response and video seek works in browser.
- Expired download/playback authorization refreshes through the authenticated portal.
- MIME spoof, checksum mismatch, missing part, wrong part size, and incomplete completion fail safely.
- No storage key, signed URL, secret, local path, prompt, or cross-tenant metadata appears in HTML, logs, source maps, analytics, or error UI.
- Previous approved version remains retrievable after the selected version changes.
- CORS denies unapproved origins.
- Provider budget alerts are optional until real upload volume makes them useful.

Use sparse/generated test fixtures in preview rather than committing large binaries to Git.

## Current DATA-02 decision

Approved now:

- Cloudflare R2 Standard private storage;
- 2 GiB owner-published/client-downloadable files and the current lower client-upload limit;
- current allowed/blocked file types;
- signed direct transfers, owner approval before client access, short-lived URLs, and tenant prefixes;
- simple operations for now, with quarantine/scanning, retention automation, and budget alerts added only when volume/provider requirements justify them.

`thirdi-media-preview`, its deploy-preview bucket override, distinct operational store version, and exact preview/local origin allowlist are configured. The remaining setup is a bucket-scoped preview Access Key ID/Secret Access Key plus the matching R2 bucket CORS rule in `25-r2-preview-bucket.md`. Production values remain unchanged.

## Re-evaluation triggers

Review the provider/storage-class decision when any of these occur:

- retained media exceeds 1 TB;
- average monthly storage cost exceeds $15;
- measured downloads remain below 3× average storage for six consecutive months and B2 savings become meaningful;
- a single required deliverable exceeds 2 GiB;
- legal/data-location requirements change;
- client streaming becomes a primary product rather than review/download support;
- Cloudflare materially changes R2 pricing, egress, presigned URL, or durability terms.
