# Third i Client Portal Masterplan

Status: bkWatch v2 accepted; shared platform implemented; Shaw draft generated and publication-gated
Version: 3.0
Prepared: 2026-07-23
First tenant: bkWatch
Second tenant: Shaw Systems, planned from the accepted bkWatch template

## Purpose

This folder is the controlling implementation plan for the reusable private portals at `thirdi.net/[client]` and the connected owner-only Third i OS at `thirdi.net/os`.

The portals are client-retention systems. They make the relationship useful between deliverables by combining current work, project review, institutional knowledge, communication, and practical AI guidance in one client-branded workspace.

## Baseline snapshot

This plan starts from the 2026-07-16 repository state:

| Route | Baseline |
|---|---|
| `thirdi.net/` | Live Third i homepage |
| `thirdi.net/services` | Live services page |
| `thirdi.net/portfolio` | Placeholder |
| `thirdi.net/about` | Placeholder |
| `thirdi.net/contact` | Live contact page |
| `thirdi.net/bkwatch` | Live protected placeholder-generation portal |
| `thirdi.net/shaw` | Protected coming-soon portal |
| `thirdi.net/os` | Owner-only server-authenticated OS |

The masterplan changes the client portal and OS architecture. It does not authorize unrelated marketing-site work.

## Authority order

When sources disagree, use this order:

1. Third i's approved brief in `CLIENT_PORTAL_BRIEF.md` and the files in this folder.
2. `.devin/workflows/web.md` v3.0.
3. Client memory-root `DESIGN.md` and approved brand assets.
4. `design/skills/DESIGN.md` for shared Third i platform behavior.
5. `.devin/rules/thirdi_web.md` and current implementation constraints.
6. Existing portal code, which is a placeholder implementation and may be replaced.

The approved client-portal directions in this plan are a client-portal overlay. They do not silently modify Third i's locked public-site `DESIGN.md`.

## Plan map

| File | Controls |
|---|---|
| `01-approved-requirements.md` | Product definition, non-negotiables, approved and removed scope |
| `02-information-architecture.md` | Six-area navigation, route map, global utilities, entity relationships |
| `03-portal-design-system.md` | Light/dark themes, accents, cards, abstract visuals, navigation, accessibility |
| `04-home-today.md` | Home hierarchy, action and communication sections, completion behavior |
| `05-projects-and-creative.md` | Project index/detail, Film 1, assets, versions, drafts, placeholders, downloads |
| `06-comments-and-intake.md` | Persistent composer, timestamped comments, uploads, new-project intake, OS actions |
| `07-library-memory-mapping.md` | Library taxonomy, filters, vault mapping, comms reorganization, publishing boundary |
| `08-ai-roadmap.md` | Research-backed AI roadmap model, source policy, refresh workflow |
| `09-live-data-security.md` | Hosted operational store, symlink bridge, auth, APIs, email, failure handling |
| `10-os-redesign.md` | Owner OS pages, departments, portal connection, action rules |
| `11-research-decisions.md` | Research conclusions for pricing, draft disclosure, UI, review, data push |
| `12-implementation-file-plan.md` | Exact proposed source files and migration sequence |
| `13-test-qc-deploy.md` | Unit, API, tenant, browser, accessibility, performance, backup and rollback gates |
| `14-roadmap-hitl.md` | Phases, dependencies, approval gates, definition of done |
| `15-requirements-traceability.md` | Mapping from every labeled answer to this plan |
| `16-future-features.md` | Deferred features and the 2026-11-15 upgrade action |
| `17-agent-handoff.md` | Verified target-agent access, missing setup, and safe starting sequence |
| `18-asset-storage-delivery.md` | 2 GiB media delivery, provider research, R2 architecture, cost model, security, and tests |
| `19-gate-activation-checklist.md` | Current provider, operations, memory, and release activation status |
| `20-film-demo-lifecycle.md` | Canonical project/demo/full-production state machine, locked-demo embed, placeholder policy, and approval transition |
| `21-vision-design-system-audit.md` | Full vision/design/product audit, strengths, gaps, and acceptance checklist |
| `22-source-of-truth-sync-operations.md` | Data authority, local filesystem, live connectors, sync, automations, updates, and upgrades |
| `23-shaw-portal-readiness.md` | Shaw design/content readiness, contradiction register, template boundary, and acceptance order |
| `24-approved-platform-operating-plan.md` | Approved shared-core/tenant-config architecture, generator, update behavior, and Shaw facts |
| `25-r2-preview-bucket.md` | Simple Cloudflare R2 deploy-preview bucket setup and current media policy |
| `26-shared-platform-implementation-report.md` | Implemented source map, migration evidence, generator contract, releases, Shaw draft, verification, and rollback |
| `plan-manifest.json` | Machine-readable phase and document index |

## Operating interpretation of “shared memory”

Every local project has a `memory/` symlink into the same Obsidian vault. This is useful and remains the local knowledge source of truth.

It does not mean Netlify can read the vault at runtime. A deployed function cannot follow a symlink to the local Third i filesystem. The system therefore has two synchronized layers:

1. **Curated knowledge:** the symlinked Obsidian vault and sanitized client manifests.
2. **Live operational state:** authenticated hosted records for comments, drafts, completion, uploads, and client-created project requests.

The portal and OS read the same hosted operational records immediately. A local deterministic sync mirrors those records into the vault. Client-safe memory changes reach the portal only through an explicit structured publishing pipeline.

## Build order

1. Freeze schemas and API contracts.
2. Build the reusable portal shell and live operational layer.
3. Maintain all six bkWatch work areas with real current content and Film 1 in its confirmed project/demo/full-production state.
4. Build the connected OS views and completion flow.
5. Pass local and preview QC.
6. Maintain the accepted bkWatch v2 release as the regression baseline.
7. Build the shared platform/generator without changing the accepted bkWatch design.
8. Generate Shaw from the approved reusable system after its tenant-specific content/design/data gates.

## Current status

The bkWatch v2 portal and operating architecture are accepted as the reusable baseline. The authenticated renderer now lives in the shared platform, while the bkWatch wrapper is tenant-only and the exact accepted shell hash is preserved. The manifest-only generator has produced immutable bkWatch and Shaw release packages. Shaw remains `planned`; its complete draft package is not the live content directory and has no active shell, API routes, auth, operational writes, owner aggregation, notifications, media, or release pointer. See `26-shared-platform-implementation-report.md` for implementation and verification evidence.
