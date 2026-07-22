# Source of truth, live connectors, sync, and upgrades

Status: operating architecture  
Updated: 2026-07-21

## Source-of-truth model

There is no single file that can safely own every kind of truth. Authority is explicit by data class:

| Data class | Authority | Portal update path |
|---|---|---|
| Brand/product/project canon | Client memory + approved project artifacts | Curate client-safe manifest → validate → search index → tests → deploy/release |
| Design | Root `design/skills/DESIGN.md`, then client `memory/[CLIENT]/DESIGN.md` | Token/component change → visual verification → HITL → deploy |
| Film state/lifecycle | Latest project WORKING memory + lifecycle contract + sanitized project manifest | State transition validation → manifest/release → OS/memory sync |
| Finance/time | Google Sheets snapshot consumed by `os.html` and deterministic metrics extractor | Refresh OS snapshot → extract tenant metrics → validate → deploy/release |
| Email/meeting context | Read-only Gmail/Calendar snapshot and sanitized communications summaries | Refresh snapshot → sanitize/extract → review → manifest/release |
| Comments/drafts/project requests | Tenant-scoped hosted operational store | Immediate API read/write; no site deploy |
| Owner actions/audit/notification state | Hosted operational store, aggregated through owner API | Immediate OS readback; reconciliation every 10 minutes |
| Client media | Approved project master + private R2 delivery copy and asset metadata | Direct signed upload → validate/finalize → attach asset/version record |
| Agent instructions | AGENTS/workflow/rules/design + masterplan handoff + current working memory | Version-controlled/local plan change, tested OS prompt update |

## Local filesystem map

- Third i web implementation: `/Users/justinbrannon/Desktop/Third i/ThirdI_WEB`
- Shared memory link from this repository: `memory` → `/Users/justinbrannon/Desktop/Shaw/Film2-Amplify/Film2_Agent/memory`
- Shaw workspace roots: `/Users/justinbrannon/Desktop/Shaw` and `/Users/justinbrannon/Desktop/Shaw/Shaw_WEB`
- bkWatch workspace roots: `/Users/justinbrannon/Desktop/bkWatch`, `/Users/justinbrannon/Desktop/bkWatch/bkWatch_WEB`, and `/Users/justinbrannon/Desktop/bkWatch/Film1-ShawBkWatch`

Agents may read these configured roots locally. Browser code and deployed Netlify functions cannot follow the Mac symlink and must never receive a local absolute path. Only sanitized structured records and approved media are published.

## What is live now

- Authenticated bkWatch portal and authenticated owner OS.
- Server-side tenant session validation, credential-version invalidation, CSRF, origin checks, rate limits, and no-store headers.
- Comment CRUD, blocker comments, server-side draft persistence, project requests, and live aggregation.
- Owner action aggregation and completion endpoints.
- Immutable audit-event records for operational mutations.
- Notification queue plus scheduled `portal-reconcile` every 10 minutes; comment durability does not depend on email delivery.
- R2-compatible operational/media adapters and signed transfer endpoints are implemented. Production use depends on approved/configured environment and DATA-02 policy.
- Deterministic search-index generation from sanitized manifests.
- OS snapshot extraction for client-safe communications and metrics.

## Gated or planned

- Live operational-event mirroring into Obsidian communications folders is dry-run only until MEM-01.
- Shaw tenant routes/data/auth/live APIs are not activated beyond the protected placeholder until bkWatch acceptance plus SHAW-01/DATA-02/DEPLOY-01.
- Individual client accounts, names/roles, passkeys/MFA, recovery, and session revocation are future security work.
- Autonomous publishing from arbitrary memory prose is forbidden. A future no-deploy content release still requires structured input, validation, client-safe approval, atomic release pointers, rollback, and audit history.
- Media quarantine/malware scanning and client-originated upload limits require the approved DATA-02 policy.

## Efficient update paths

### Immediate, no deploy

- comment/blocker comment create/edit/delete;
- draft save/restore;
- client project request;
- OS action creation/completion;
- notification retry/reconciliation;
- already-published asset metadata changes supported by the hosted record contract.

### Reviewed content update

1. read current client memory/project source;
2. resolve contradictions and mark confidence/as-of/provenance;
3. change the tenant manifest through the deterministic publisher;
4. validate schema, tenant, clientSafe boundary, and forbidden local paths/secrets;
5. rebuild search and derived metrics;
6. run unit/API/browser/accessibility/build checks;
7. preview/HITL where content or design is client-visible;
8. publish atomically and keep rollback evidence;
9. update OS and memory with the release ID.

Current repository manifests deploy with the application. The future optimization is an immutable tenant release bundle plus one atomic “current release” pointer, so reviewed copy/status changes do not require a code deploy.

### Media update

1. local owner tool discovers only an allowlisted tenant/project root;
2. compute checksum/type/size and create a pending asset record;
3. request signed direct R2 upload parts;
4. browser/tool sends bytes directly to R2;
5. finalize verifies tenant, checksum, type, size, part list, and policy;
6. owner marks client-safe/approved and attaches the asset version to the stable project/idea/scene;
7. portal receives a short-lived authorized inline/download URL.

## Automation schedule

| Automation | Cadence | Current state |
|---|---|---|
| Portal notification reconciliation | Every 10 minutes | Implemented for bkWatch |
| OS live connector refresh | On local OS load/sync run | Implemented; Gmail/Calendar freshness depends on valid read-only OAuth |
| Metrics/communications extraction | After OS snapshot refresh and before client release | Implemented scripts |
| Search rebuild/content validation | Every client content release/build | Implemented scripts/tests |
| Memory mirror | Event-driven/local sync | Dry-run until MEM-01 |
| AI Roadmap source refresh | Monthly and before major client review | Planned operational policy |
| Backup/restore verification | Nightly backup, quarterly restore exercise | Required before broad production rollout |
| Storage/budget/queue health | Continuous/provider alerts plus OS summary | Planned at DATA-02/operations gate |

## Upgrade protocol

- Minor copy/status: source correction → manifests → validation → deploy/release.
- Design change: DESIGN authority → visual proposal → HITL → implementation → screenshot/contrast/responsive tests → deploy.
- Template upgrade: schema migration with backward compatibility → bkWatch preview → acceptance → tenant-by-tenant rollout; never overwrite all tenants at once.
- Automation change: idempotency, retry, audit, budget, security, and rollback test before enablement.
- Major portal version: feature flag/canary, content migration report, preview acceptance, production smoke, and documented rollback.

## Agent consumption contract

Agents read the controlling instructions first, then current working memory and sanitized portal data. They must state whether a value is canonical, live operational, derived, stale, planned, or unknown. They may propose changes from raw memory but never publish arbitrary prose or cross-client facts without sanitization and approval.
