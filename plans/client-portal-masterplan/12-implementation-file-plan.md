# Implementation File Plan

This file describes the intended source layout. It does not authorize the changes yet.

## Preserve and evolve

| Current file | Planned treatment |
|---|---|
| `lib/portal-auth.mjs` | Preserve security design; add stable per-browser device ID/session helper only after tests |
| `netlify/functions/bkwatch-portal.mjs` | Preserve route/auth responsibility; refactor rendering and API bootstrap |
| `netlify/functions/os-portal.mjs` | Preserve isolated owner auth; connect OS renderer to live portal APIs |
| `content/clients/bkwatch.json` | Migrate into schema-v2 split manifests; retain migration snapshot |
| `content/clients/shaw.json` | Generate from approved Shaw sources; keep client publication gated by Shaw content/design/data approval |
| `portal-template.html` | Replace with the approved six-work-area reusable shell |
| `bkWatch-os.html` | Migrate content to template/renderer; keep as a rollback artifact until production acceptance |
| `public/portal/client-portal.js` | Split into focused ES modules; temporary compatibility wrapper during migration |
| `public/portal/bkwatch.css` | Consolidate into token/profile plus shared components |
| dated bkWatch override CSS files | Remove only after visual parity and rollback snapshot |
| `portal-schema.json` | Version and extend; do not mutate production data without migration validation |
| `scripts/create-client-portal.mjs` | Extend into the future-client generator after bkWatch template is accepted |
| `scripts/build.mjs` | Add schema validation and protected asset handling |
| `sync-os.sh` | Separate OS snapshot sync from portal operational sync |
| `auto-sync-deploy.sh` | Replace unsafe byte-change production deploy with validated, logged workflow |
| `os.html` | Preserve foundation; progressively migrate views and live actions |

## New portal source modules

```text
public/portal/core/
  portal-app.js              # bootstrap, route state, errors, live refresh
  portal-router.js           # six-work-area and nested-route matching
  portal-shell.js            # sidebar, top utility bar, footer/session
  portal-theme.js            # dark-default theme state and accessible toggle
  portal-search.js           # tenant-only search UI and result navigation
  portal-filters.js          # manifest-derived facets
  portal-comments.js         # composer, persistence, posted comments
  portal-media-review.js     # timestamp/range playback behavior
  portal-downloads.js        # R2-authorized downloads, readable names, expiry refresh
  portal-uploads.js          # multipart progress/resume/abort for approved intake
  portal-fullscreen.js       # presentation mode
  portal-api.js              # CSRF-aware JSON client and error normalization
  portal-a11y.js             # focus, announcements, keyboard movement

public/portal/pages/
  home.js
  projects.js
  project-detail.js
  film-presentation.js
  communications.js
  library.js
  library-record.js
  ai-roadmap.js

public/portal/components/
  action-item.js
  activity-feed.js
  asset-viewer.js
  comment-composer.js
  comment-thread.js
  draft-notice.js
  in-production.js
  project-card.js
  project-timeline.js
  status-label.js
  version-history.js

public/portal/styles/
  portal-tokens.css
  portal-shell.css
  portal-components.css
  portal-pages.css
  portal-print.css
  portal-motion.css
  tenants/bkwatch.css
  tenants/shaw.css
```

## New schemas

```text
schemas/portal/
  client-manifest-v2.schema.json
  library-record.schema.json
  project.schema.json
  film.schema.json
  asset.schema.json
  comment.schema.json
  project-request.schema.json
  action.schema.json
  audit-event.schema.json
  ai-capability.schema.json
  communications.schema.json
  roadmap.schema.json
```

All schemas require a tenant, version, stable ID, status vocabulary, dates, client-safety state where applicable, and explicit optionality. Unknown fields do not silently become empty strings.

## Sanitized tenant content

```text
content/clients/bkwatch/
  portal.json
  home.json
  projects.json
  library.json
  ai-roadmap.json
  roadmap.json
  invoicing.json
  communications.json
  search-index.json

content/clients/shaw/
  portal.json
  home.json
  projects.json
  library.json
  ai-roadmap.json
  roadmap.json
  invoicing.json
  communications.json
  search-index.json
```

The `search-index.json` contains only sanitized text already present in the tenant's manifests. No raw memory filename or local path is included.

## Server-side files

```text
lib/portal-live-store.mjs       # tenant-prefixed strong-consistency records
config/portal-tenants.mjs       # active/planned tenant namespaces and activation flags
lib/portal-request-auth.mjs     # tenant/owner authorization for APIs
lib/portal-validation.mjs       # JSON/file validation and normalization
lib/portal-audit.mjs            # immutable event writer
lib/portal-content.mjs          # load sanitized static manifests
lib/portal-search.mjs           # combine static tenant index + live records
lib/portal-mailer.mjs           # provider adapter and idempotency
lib/portal-media-store.mjs      # S3-compatible R2 signed/multipart abstraction
lib/portal-media-policy.mjs     # 2 GiB/type/part/TTL/tenant policy
lib/portal-media-metadata.mjs   # pending/quarantine/approved asset records
lib/portal-download-name.mjs    # client filename: act1.scene2.vers3-description.ext
lib/portal-pdf.mjs              # project print/PDF response strategy

netlify/functions/portal-live.mjs
netlify/functions/portal-content.mjs
netlify/functions/portal-comments.mjs
netlify/functions/portal-drafts.mjs
netlify/functions/portal-project-requests.mjs
netlify/functions/portal-search.mjs
netlify/functions/portal-media.mjs
netlify/functions/portal-media-upload.mjs
netlify/functions/portal-media-download.mjs
netlify/functions/portal-notify.mjs       # background
netlify/functions/os-portal-actions.mjs
netlify/functions/os-portal-events.mjs
netlify/functions/os-portal-sync.mjs
netlify/functions/portal-reconcile.mjs    # scheduled safety net only
```

Functions use modern default exports plus `config`, path/method restrictions, and code-defined rate limits.

## Local memory and publishing tools

```text
scripts/portal/
  build-client-manifest.mjs       # structured client-safe memory -> manifest
  validate-client-content.mjs     # schema, path, source, tenant checks
  build-search-index.mjs          # sanitized manifest only
  sync-portal-events.mjs          # hosted event feed -> symlinked memory
  migrate-client-comms.mjs        # dry-run-first comms reorganization
  verify-memory-isolation.mjs     # cross-client and local-path audit
  publish-client-portal.mjs       # build/test/diff; never hides prod gate
  reconcile-portal-live.mjs       # retry email/mirror inconsistencies
  check-tenant-readiness.mjs      # read-only manifest/namespace/gate report
```

Memory mirror targets:

```text
memory/[CLIENT]/[CLIENT]_COMMS/comments/{event-date}-{event-id}.md
memory/[CLIENT]/[CLIENT]_COMMS/emails/
memory/[CLIENT]/[CLIENT]_COMMS/meetings/
```

The scripts resolve the repository `memory/` symlink at runtime but never copy the raw vault into `dist/` or Netlify included files.

## OS modules

The current `os.html` may initially remain a generated single file, but its source should be split in the authoritative ThirdI_EXEC project:

```text
os/
  data/os-state.json
  components/os-shell.js
  components/action-queue.js
  components/connection-strip.js
  components/client-view.js
  pages/dashboard.js
  pages/clients.js
  pages/departments.js
  pages/framework.js
  styles/os-tokens.css
  styles/os-shell.css
  styles/os-pages.css
```

ThirdI_WEB continues to receive the built `os.html`; owner authentication remains in `netlify/functions/os-portal.mjs`.

## Test files

```text
tests/portal-live-store.test.mjs
tests/portal-comments-api.test.mjs
tests/portal-drafts-api.test.mjs
tests/portal-project-requests.test.mjs
tests/portal-search.test.mjs
tests/portal-media-auth.test.mjs
tests/portal-media-multipart.test.mjs
tests/portal-media-download-name.test.mjs
tests/portal-notification.test.mjs
tests/portal-memory-sync.test.mjs
tests/portal-tenant-isolation.test.mjs
tests/portal-content-v2.test.mjs
tests/os-portal-actions.test.mjs
tests/e2e/bkwatch-portal.spec.mjs
tests/e2e/os-portal-roundtrip.spec.mjs
tests/visual/bkwatch-light.spec.mjs
tests/visual/bkwatch-dark.spec.mjs
```

## Environment variables — proposed

No values are committed.

```text
BKWATCH_PORTAL_PASSWORD_HASH
SHAW_PORTAL_PASSWORD_HASH
OS_PORTAL_PASSWORD_HASH
PORTAL_SESSION_SECRET
PORTAL_DATA_STORE_VERSION
PORTAL_MAIL_PROVIDER
PORTAL_MAIL_API_KEY
PORTAL_MAIL_FROM
PORTAL_OWNER_EMAIL
PORTAL_MEDIA_PROVIDER                 # r2
PORTAL_MEDIA_R2_ACCOUNT_ID
PORTAL_MEDIA_R2_BUCKET
PORTAL_MEDIA_R2_ACCESS_KEY_ID
PORTAL_MEDIA_R2_SECRET_ACCESS_KEY
PORTAL_MEDIA_MAX_BYTES                # 2147483648
PORTAL_MEDIA_PART_BYTES               # 67108864
PORTAL_MEDIA_DOWNLOAD_TTL_SECONDS     # 14400
PORTAL_MEDIA_PART_TTL_SECONDS         # 3600
PORTAL_MEDIA_UPLOAD_SESSION_TTL_SECONDS # 86400
PORTAL_MEDIA_CLIENT_UPLOAD_MAX_BYTES  # separately approved at DATA-02
PORTAL_MEDIA_ALLOWED_ORIGINS
PORTAL_SYNC_TOKEN
```

Provider-specific media variables are required only after `DATA-02`. Production and preview use separate buckets/credentials; values are never committed.

## Migration sequence

1. Add schemas and validation without changing current rendering.
2. Convert current bkWatch manifest to v2 and prove content parity.
3. Add shared portal shell/modules behind a preview-only flag.
4. Add live store and APIs in local/preview environment.
5. Add Home, Projects, Library, AI Roadmap.
6. Add comments, drafts, timestamp review, project request, and OS action view.
7. Add email/media provider only after HITL configuration.
8. Add memory mirror dry run, then verified writes.
9. Run full QC and preview approval.
10. Switch bkWatch production route to v2 with rollback artifact retained.
11. Remove obsolete dated CSS only after acceptance window.
12. Generate Shaw after bkWatch sign-off.
