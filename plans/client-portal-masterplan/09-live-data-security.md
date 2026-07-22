# Live Data, Memory Bridge, and Security

## Architecture decision

Use an event-driven hosted operational layer for live interaction and the symlinked Obsidian vault for curated knowledge.

### Layer 1 — Curated client knowledge

- Source: local symlinked `memory/` vault.
- Contains semantic memory, products, film decisions/reflections, approved communications, and internal context.
- Published through schema validation and sanitization into versioned tenant manifests in a hosted client-content store, with the bundled last-known-good manifest as fallback.
- Requires owner approval for client-visible facts/copy.

### Layer 2 — Live operational state

- Source: authenticated hosted storage.
- Contains comments, drafts, comment completion, project requests, thumbnail selection, asset version pointers, notification state, and immutable audit events.
- Portal and OS read the same records immediately.
- Does not require a deploy for comment/completion updates.

### Layer 3 — Memory mirror

- A local deterministic sync reads new operational events and writes tenant-specific records through the shared `memory/` symlink.
- The mirror records the hosted event ID and revision so retries are idempotent.
- Agents later read mirrored comments/actions from memory.
- Failure to mirror does not erase or hide the hosted record; OS shows sync state.

## Why the split is required

The symlink exists on Justin's local projects and is valuable for agents and scripts. It does not exist inside Netlify's runtime and must not be included in deploy artifacts. A production portal therefore cannot guarantee a direct write to the local vault.

The system can guarantee durable hosted acceptance first, then observable/retryable local mirroring.

## Recommended hosted state

### Operational JSON

Use site-scoped Netlify Blobs with strong consistency for comments, drafts, actions, completion, notification state, and small metadata. Site-scoped records persist across deploys; strong consistency is required because owner completion must be immediately visible to the portal.

Recommended key pattern:

```text
portal-live-v1/
  tenants/{tenant}/comments/{commentId}.json
  tenants/{tenant}/drafts/{deviceId}/{draftId}.json
  tenants/{tenant}/project-requests/{requestId}.json
  tenants/{tenant}/presentation/{projectId}.json
  tenants/{tenant}/actions/{actionId}.json
  tenants/{tenant}/events/{yyyy}/{mm}/{eventId}.json
  tenants/{tenant}/notifications/{notificationId}.json
```

The tenant is server-derived and included in every key. List operations always use a tenant prefix.

Approved client-safe content uses a separate versioned namespace:

```text
portal-content-v2/
  tenants/{tenant}/releases/{releaseId}.json
  tenants/{tenant}/current.json
```

The local publisher reads only structured records with `clientSafe: true` and `ownerApprovedAt`, validates and sanitizes them, writes an immutable release, verifies it, then updates the `current` pointer. Portal rendering falls back to the bundled last-known-good manifest if the hosted release is missing or invalid. This enables no-agent content propagation for already approved structured memory without exposing arbitrary vault prose or requiring a Netlify deploy.

### File/media objects

Architecture selection: private Cloudflare R2 Standard storage with short-lived signed upload/download URLs and a first-release product limit of 2 GiB per file. Use tenant-prefixed opaque object keys, multipart upload over 100 MiB, immutable versions, range reads for playback, and readable `Content-Disposition` filenames.

Netlify authenticates, authorizes, creates asset metadata/audit records, and signs the transfer. It never proxies the media bytes. Netlify Blobs remains the operational JSON store, not the large-media store.

Production bucket creation, billing, scoped credentials, allowed types, retention, backup, and environment changes remain blocked until HITL gate `DATA-02`. The complete provider comparison and implementation contract is in `18-asset-storage-delivery.md`.

## Live request flow

```text
Authenticated client
  -> tenant API endpoint
  -> origin + CSRF + session + tenant authorization
  -> schema/file validation + rate limit
  -> durable operational write + audit event
  -> client success response
  -> background owner notification

Owner OS
  -> owner-only API endpoint
  -> reads all tenant action prefixes
  -> completion/reprioritization write
  -> same operational record changes
  -> client portal reads update immediately

Local sync
  -> owner-authenticated export endpoint or Netlify API credential
  -> new events since cursor
  -> deterministic tenant memory files through symlink
  -> cursor update only after verified write
```

Local publish runs through the shared symlink in the opposite direction:

```text
Approved structured memory change
  -> local watcher/publisher while the workstation is online
  -> schema + tenant + client-safety validation
  -> versioned hosted content release
  -> verify strong read and content hash
  -> update current pointer
  -> portal uses new release without application redeploy
```

## API surface

All endpoints return `Cache-Control: no-store` and JSON unless serving protected media.

| Method/path | Authorization | Purpose |
|---|---|---|
| `GET /api/portal/live` | tenant | Home/project/Library operational state |
| `GET /api/portal/search` | tenant | Tenant-only static + live search |
| `POST /api/portal/comments` | tenant | Create comment |
| `PATCH /api/portal/comments/:id` | tenant | Edit own-tenant comment content |
| `DELETE /api/portal/comments/:id` | tenant | Soft-delete client comment |
| `POST /api/portal/drafts` | tenant | Create/update persistent draft |
| `DELETE /api/portal/drafts/:id` | tenant | Explicitly delete draft |
| `POST /api/portal/project-requests` | tenant | Create client-proposed project |
| `POST /api/portal/media/upload/initiate` | tenant/intake grant | Validate intent and initiate direct multipart upload |
| `POST /api/portal/media/upload/part` | tenant/intake grant | Issue a signed R2 part authorization |
| `POST /api/portal/media/upload/complete` | tenant/intake grant | Verify and complete the upload |
| `POST /api/portal/media/upload/abort` | tenant/intake grant | Abort an incomplete upload |
| `POST /api/portal/media/download/authorize` | tenant | Issue short-lived direct download URL |
| `POST /api/portal/media/playback/authorize` | tenant | Issue short-lived inline/range URL |
| `GET /api/portal/media/:id/metadata` | tenant | Protected client-safe media metadata |
| `PATCH /api/os/actions/:id` | owner only | Complete or reprioritize action |
| `GET /api/os/portal-events` | owner only | OS dashboard aggregation |
| `GET /api/os/portal-sync-export` | owner/sync credential | Incremental memory mirror feed |

Tenant endpoints never accept an authoritative tenant field from request JSON. The route/session decides tenant and rejects mismatches.

## Authentication

Current release:

- one shared `animal##` password per tenant;
- salted scrypt hash in Netlify environment variables;
- encrypted AES-256-GCM HttpOnly session;
- Secure and SameSite cookies;
- 30-day client session;
- CSRF token and same-origin validation;
- generic login errors;
- per-IP/domain rate limiting;
- owner OS session isolated from client sessions;
- logout above session indicator.

The portal stores an encrypted session, not the plaintext password.

## Future authentication recommendation

The simplest meaningful upgrade is password plus one owner-managed rotating access token per client device/team, with the ability to revoke active sessions. If attributed approvals, per-person permissions, or sensitive uploads expand, move to individual magic-link/passkey accounts rather than adding more shared-password complexity.

This is future scope and does not block the first release.

## Threat model

| Threat | Required control |
|---|---|
| Cross-client data access | Server-derived tenant, tenant key prefix, negative tenant tests |
| Password guessing | Rate limit, scrypt, generic errors, monitoring |
| Stolen session | HttpOnly/Secure/SameSite, credential-version invalidation, logout, expiration |
| CSRF | Same-origin checks plus CSRF token for every mutation |
| XSS through comments/files | Output escaping, CSP, type validation, no inline active uploads |
| Malicious upload | MIME/magic-byte/size validation, generated keys, quarantine, protected download |
| Signed URL leakage | Short sufficient expiry, no full URL logs/analytics/email, authenticated reauthorization |
| Large transfer exhaustion | Direct R2 transfer, 2 GiB cap, multipart limits, rate limits, incomplete-upload lifecycle |
| ID guessing | Opaque random IDs plus authorization on every record |
| Lost update | ETag/revision compare-and-set behavior |
| Email failure | Durable notification record and retry; comment write remains successful |
| Sync duplication | Immutable event ID and per-target cursor/idempotency |
| Local machine unavailable | Hosted state remains authoritative and visible; mirror shows delayed status |
| Memory leakage | Explicit client-safe schema; build rejects local paths/internal classifications |
| Public indexing | `noindex`, protected routes, no public sitemap entries |

## Email delivery

Use a provider adapter behind a background function. Recommended sender: `portal@thirdi.net`; recipient: `ceo@thirdi.net`.

Provider choice and credentials require HITL. The plan favors a transactional provider with domain authentication, delivery logs, and simple API credentials over a local OAuth token. Gmail can remain an OS connector for reading communication, but an expired local Google token must not be the only notification path.

## “Guaranteed” semantics

The system may claim success only after the operational record and audit event are durably written.

- Email is at-least-once with idempotency key and visible retry status.
- Memory mirroring is at-least-once with event cursor and idempotent filenames.
- UI updates use strong reads or revision-aware polling/refetch.
- No workflow promises that a local Mac was updated synchronously from a public request.

## Scheduling decision

Do not create three agent automations merely to move comments or completions. Direct APIs cover those immediately.

Use schedules only for:

- retrying failed email/memory-mirror notifications;
- periodic reconciliation/backups;
- approved AI Roadmap research refresh;
- deterministic client-safe manifest publishing when local infrastructure is online.

If Justin later wants three daily reconciliation checks, use one local automation at 8:00 AM, 12:00 PM, and 4:00 PM America/Chicago rather than three separate agents. It should call the deterministic sync/publisher and surface failures in OS; it must not reinterpret memory or publish unapproved prose.

The existing five-minute local `auto-sync-deploy.sh` must be revised before reuse. Production deploys should not be triggered by any `os.html` byte change without schema validation, tests, diff inspection, and the agreed HITL production gate.

## Backup and recovery

- Nightly export operational JSON by tenant.
- Retain immutable event records longer than mutable presentation views.
- Keep asset versions immutable.
- Treat R2 as the client-delivery copy; retain irreplaceable masters in the approved local/owner archive.
- Automatically abort incomplete multipart uploads and configure provider budget alerts.
- Test restore into a non-production store.
- Record last successful email, memory mirror, and backup timestamps in OS.
- Never include secrets or plaintext passwords in exports.
