# Approved shared client-portal operating plan

Status: implemented; bkWatch regression locked; Shaw draft publication-gated
Updated: 2026-07-23

## Decision

Use one shared client-portal platform with separate tenant configuration, design tokens, content, auth, operational data, media prefixes, and search indexes.

- Shared upgrades change the platform once and roll out to the template and applicable clients after tests/HITL.
- Client-specific content and project changes stay inside that tenant.
- Do not copy a client's HTML to start a new portal.
- Do not create a permanent code fork per client.
- Hashes identify inputs/releases and skip unchanged work; they are not the portal architecture.
- The current bkWatch portal remains visually unchanged during this planning/system pass.

## Smallest useful source structure

```text
portal platform
├── shared renderer, components, routes, schemas, APIs, tests
├── tenant registry
├── bkWatch config + sanitized content + private data namespace
├── Shaw config + sanitized content + private data namespace
└── generator: validates inputs and creates a thin tenant package
```

The generator accepts a tenant key, route, design authority, logo/assets, client-safe company/product/project records, auth namespace, preview/production storage namespaces, and initial enabled features. It generates tenant configuration, nine manifests, an isolation fixture, and an immutable release record—not a copied portal page, function, route, or credential.

The registry is implemented in `config/portal-tenants.mjs`; the shared authenticated renderer is `lib/portal-platform.mjs`; and the generator is `scripts/portal/generate-tenant.mjs`. Active-tenant lists drive API path acceptance, owner action aggregation, and notification reconciliation. Shaw is predeclared with unique auth/cookie/operational/media/search/release namespaces but remains `planned`, so those runtime lists still contain bkWatch only.

## Update behavior

| Change | Path |
|---|---|
| Comment, draft, project request, action | Immediate tenant-scoped API; no deploy |
| Client fact/status/copy | Memory authority → sanitized structured manifest → validation → release |
| Shared component/schema | Shared core → bkWatch regression preview → HITL if visible → compatible tenant rollout |
| Client design | Tenant DESIGN authority → visual HITL → tenant config/component update |
| New client | Generator → tenant content/design/auth/storage review → preview → acceptance |

For 100+ small pushes per week, run cheap changed-file checks per push and one full-system review weekly. Store only the minimal release fields defined in `memory/THIRD_I/AUTOMATIONS.md`.

## Agent efficiency contract

Agents should read one short context map first, then only the authority needed for the task. Prefer the shared memory roots and live tools over copied summaries. Each portal field should be traceable to a stable authority/path/tool, with status `canonical`, `live`, `derived`, `planned`, or `unknown`.

## Shaw generator inputs already confirmed

- bkWatch v2 is accepted as the reusable design/structure baseline.
- Shaw Projects contains Films 1–4. Other engagements appear in Library/Value unless separately scoped as projects.
- Film 1 is completed conference work: 250 hours, fixed-bid/pre-contract, and the official Film 1 record.
- Film 2 V1 and V2 are complete.
- Film 3 is `Film 3 - AI Advisor`; creative brainstorming is complete and direction lock is next.
- Film 4 is `Film 4 - Insight`, a Spectrum feature story planned for the Summit loop.
- Films 2, 3, and 4 must be planned as one aligned Summit campaign; every film considers the other two.
- Correctly routed Shaw communications are client-safe in the private Shaw portal. Cross-client content and internal workflow architecture remain excluded.

## Implemented release packages

- bkWatch baseline: `bkwatch-2026-07-21-89ced3ba9288`.
- Shaw non-public draft: `shaw-2026-07-23-0f8b31354a71`.
- Formal regression authority: `tests/portal/fixtures/bkwatch-visual-lock.json`.
- Formal accessibility baseline: `tests/portal/fixtures/bkwatch-axe-baseline.json`.
- Full implementation evidence: `26-shared-platform-implementation-report.md`.

## Gates that remain

- Shaw content/design review before client-visible publication.
- Separate Shaw auth/operational/media namespaces before activation.
- Preview-media bucket exists; its bucket-scoped key/secret and exact CORS rule remain.
- Full verification and production deployment approval.

The executable ThirdI_WEB superprompt lives in `os.html` as `actionPayloads.clientPortalPlatformPrompt`. OS source restructuring is deliberately a separate prompt.
