# Shared client-portal platform implementation report

Status: implemented and locally validated; bkWatch production release pending final deploy record
Date: 2026-07-23
Branch: `client-portals`
Rollback commit: `d7a071bf6531dbbe689bb28931ec521e4453b119`

## Outcome

The accepted bkWatch v2 portal now runs through one shared authenticated renderer without changing its accepted visual output. A reusable tenant generator produces configuration, manifests, isolation fixtures, and immutable release metadata only. Shaw has a complete client-safe draft package built from confirmed Shaw canon, but it remains outside the live content directory and cannot be published or activated until its tenant gates pass.

## Shared-platform source map

| Concern | Shared authority | Tenant-specific authority |
|---|---|---|
| Authenticated renderer, login, session rotation, CSP, manifest embedding | `lib/portal-platform.mjs` | `config/portal-tenants.mjs` shell/auth/cookie fields |
| Browser renderer, routes, components, workspaces | `public/portal/core/`, `public/portal/components/`, `public/portal/pages/` | tenant manifests and tenant CSS token file |
| Schemas and validation | `schemas/portal/`, `lib/portal-schemas.mjs`, `lib/portal-content-safety.mjs` | sanitized tenant manifests |
| Operational APIs | shared `netlify/functions/portal-*.mjs` and `lib/portal-*.mjs` | server-derived active tenant and tenant-prefixed keys |
| Operational storage | `lib/portal-store.mjs` | preview/production store version plus `tenants/<tenant>/` |
| Media | shared signer/policy/store modules | environment bucket plus tenant media key prefix |
| Search | `lib/portal-search-index.mjs` | generated from one tenant's sanitized manifests |
| Release generation | `scripts/portal/generate-tenant.mjs` | `config/portal-generator/<tenant>.json` and tenant record sources |
| Runtime activation | active tenant lists and Netlify redirects | tenant status, flags, auth values, release pointer, HITL |
| Verification | shared tests, browser capture, axe/Lighthouse release audit | tenant fixture, wrong-tenant fixture, visual/accessibility baseline |

The bkWatch function is now a thin wrapper around `createPortalPlatform("bkwatch")`. It contains no login or portal HTML. Shaw has no approved shared-platform shell config and remains on the existing coming-soon page.

## No-regression migration map

| Before | After | Evidence |
|---|---|---|
| Auth/session/rendering embedded in `bkwatch-portal.mjs` | Shared in `lib/portal-platform.mjs`; thin tenant wrapper | auth tests and exact shell hash |
| Search builder owned its indexing logic | Shared pure `buildPortalSearchIndex()` plus CLI wrapper | content/search tests and generator validation |
| Production-looking default store version used outside production | Context-derived `portal-local-v1`, `portal-preview-v1`, or `portal-live-v1` with cross-context denial | environment-isolation tests |
| Planned Shaw API path fell through to HTML placeholder | Explicit inactive-tenant JSON 404 before the catch-all | Netlify ordering test and deployed route check |
| No stored formal audit artifact | Reusable `portal:audit` writes axe and Lighthouse JSON/HTML under the release ID | stored release evidence |

The pre-migration authenticated shell fixture was 155,651 bytes with SHA-256 `d34d67d1edd004ea7fbad3d85884d869dcdefc47c5c85c09ceb3b0061d3e7131`. The post-extraction shell is byte-identical. All accepted CSS hashes remain unchanged. One no-layout ARIA improvement adds progressbar semantics to Value & Results and is recorded in the visual lock.

## Generator contract

### Inputs

- tenant key, name, route, and planned/active state;
- design authority and logical approved-logo destinations;
- password-hash environment variable name, distinct session/CSRF cookies, and cookie path;
- distinct preview/production operational store versions, prefixes, media bucket authority, media prefix, and search index;
- feature gates for owner actions, notifications, and media;
- eight sanitized structured source manifests;
- content/design/publication approval state and release channel.

### Outputs

- `tenant-config.json`;
- nine validated manifests, including a deterministic generated search index;
- `test-fixture.json` containing wrong-tenant and namespace expectations;
- `release.json` with input/manifest hashes and approval/activation state.

The generator never emits HTML, a Netlify function, a redirect, a credential, or a live release pointer. Existing immutable output cannot be overwritten by a different input hash.

## Tenant-isolation model

| Boundary | bkWatch | Shaw |
|---|---|---|
| Runtime state | `active` | `planned` |
| Route | `/bkwatch` | `/shaw` placeholder only |
| Password hash env | `BKWATCH_PORTAL_PASSWORD_HASH` | `SHAW_PORTAL_PASSWORD_HASH` |
| Session cookie | `thirdi_bkwatch_session` | `thirdi_shaw_session` |
| CSRF cookie | `thirdi_bkwatch_csrf` | `thirdi_shaw_csrf` |
| Operational key | `tenants/bkwatch/` | `tenants/shaw/` |
| Media key | `tenants/bkwatch/media/` | `tenants/shaw/media/` |
| Search index | bkWatch-only | generated Shaw-only draft |
| Owner aggregation | on | off |
| Notifications | on | off |
| Shared shell | active | absent |
| Release pointer | production record after deployment | absent |

Tenant identity is always derived from an authenticated active route, never from a request body. Preview and production operational data use separate `_ops/portal-preview-v1/` and `_ops/portal-live-v1/` namespaces. Preview media uses `thirdi-media-preview`; production media remains under its production environment authority.

## Release packages

### bkWatch

- Release ID: `bkwatch-2026-07-21-89ced3ba9288`.
- Input hash: `89ced3ba9288c1c979a3e5b4d148853465656737c8561a5d914c66f564e584ab`.
- Package: `portal-releases/bkwatch/releases/bkwatch-2026-07-21-89ced3ba9288/`.
- Content/design/publication baseline approvals: true.
- Media feature remains false until the provider gate is complete.

### Shaw

- Release ID: `shaw-2026-07-23-0f8b31354a71`.
- Input hash: `0f8b31354a7145db97a47bce1f455ea88fc4b00661b75cab0bf9b2251310f6c8`.
- Package: `portal-releases/shaw/drafts/shaw-2026-07-23-0f8b31354a71/`.
- Content/design/publication approvals: false.
- Promoted: false.
- Runtime activation actions: all false.

The Shaw draft contains Films 1–4 with the confirmed states, places other engagements in Library/Value, preserves Film 1's 250-hour fixed-bid/pre-contract canon, and treats Films 2–4 as one Summit campaign loop. Three mixed-client communications were excluded before release; the isolation suite now asserts that no Shaw manifest contains bkWatch/BankruptcyWatch content.

## Verification evidence

- 75/75 automated tests pass, including the explicit deployed inactive-tenant API denial.
- Nine live bkWatch manifests validate.
- Both generator inputs validate and reproduce their release IDs.
- bkWatch readiness passes; Shaw readiness reports a complete draft but incomplete live package and `activationReady=false`.
- Production build passes.
- 17 dark/light/mobile browser captures complete with no console/page errors, broken images, overflow, route, card-action, lifecycle, or alignment failures.
- Formal axe audit covers nine routes. No new serious/critical issue exists. Three accepted visual-baseline findings remain explicitly recorded for a later design HITL.
- Lighthouse: performance 93, accessibility 96, best practices 96.
- Dependency audit: zero known vulnerabilities after the formal audit tooling update.

Stored reports:

- `release-evidence/bkwatch/bkwatch-2026-07-21-89ced3ba9288/axe.json`;
- `release-evidence/bkwatch/bkwatch-2026-07-21-89ced3ba9288/lighthouse.json`;
- `release-evidence/bkwatch/bkwatch-2026-07-21-89ced3ba9288/lighthouse.html`;
- `release-evidence/bkwatch/bkwatch-2026-07-21-89ced3ba9288/summary.json`.

## Remaining Shaw tenant gates

1. Approve the Shaw draft's copy, metrics, source mapping, and planned placeholders.
2. Approve the Shaw portal visual direction and supply/copy the current blue and white logo assets into the approved public destinations.
3. Generate and configure a distinct Shaw password hash; verify the Shaw cookie/session namespace and owner access.
4. Promote the approved manifests into a Shaw release pointer without copying HTML.
5. Add Shaw API routes, owner aggregation, and notification reconciliation only when the live operational routes are ready.
6. Add the preview-only R2 key/secret and exact CORS rule; verify preview media without production credentials.
7. Run Shaw browser, accessibility, performance, auth, wrong-tenant, data, preview, and rollback checks.
8. Receive production publication approval, deploy, smoke test, and record the release.

No Shaw client-visible publication is authorized by this implementation.
