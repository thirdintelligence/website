# Source of truth, live connectors, sync, and upgrades

Status: operating architecture
Updated: 2026-07-22

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
| Automation cadence | `memory/THIRD_I/AUTOMATIONS.md` | Update registry first, then OS prompt/scheduler after HITL |
| Release state | Git commit/push record + Netlify deploy record | Minimal log fields and one weekly review cursor |

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
- bkWatch v2 is accepted as the shared-platform visual/structural regression baseline.

## Gated or planned

- Live operational-event mirroring into Obsidian communications folders is dry-run only until MEM-01.
- Shaw tenant routes/data/auth/live APIs are not activated beyond the protected placeholder until Shaw content/design/data and deployment gates are complete. bkWatch v2 acceptance is already recorded.
- Individual client accounts, names/roles, passkeys/MFA, recovery, and session revocation are future security work.
- Autonomous publishing from arbitrary memory prose is forbidden. A future no-deploy content release still requires structured input, validation, client-safe approval, atomic release pointers, rollback, and audit history.
- Media quarantine/scanning, retention automation, and provider budget alerts are deferred until real upload volume or provider requirements justify them; current limits/types and owner-review policy apply.
- Deploy-preview media remains gated until `thirdi-media-preview` uses a distinct scoped credential and bucket.

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
| OS live connector refresh | On local OS load plus local 15-minute cache refresh | Implemented; Gmail/Calendar freshness depends on valid read-only OAuth |
| Metrics/communications extraction | After OS snapshot refresh and before client release | Implemented scripts |
| Search rebuild/content validation | Every client content release/build | Implemented scripts/tests |
| Memory mirror | Event-driven/local sync | Dry-run until MEM-01 |
| Daily Morning Prep | 8:00 AM America/Chicago | Prompt-ready; scheduler presence must be confirmed |
| third-i-weekly | Friday 5:00 PM America/Chicago | Prompt-ready; one full-system report and hours/invoice check |
| Research/cleanup/value review | Folded into weekly/monthly/quarterly review | Planned inside existing cadence; do not add separate jobs yet |

`memory/THIRD_I/AUTOMATIONS.md` is the schedule authority. The legacy five-minute byte-change auto-deployer is retired: refresh and deployment are separate. A failed/unavailable local OS server is a skip, not a reason to deploy stale content.

## Upgrade protocol

- Minor copy/status: source correction → manifests → validation → deploy/release.
- Design change: DESIGN authority → visual proposal → HITL → implementation → screenshot/contrast/responsive tests → deploy.
- Template upgrade: change the shared core once → schema/backward-compatibility tests → bkWatch regression preview → acceptance → controlled tenant rollout. Tenant content stays separate; do not create client code forks.
- Automation change: idempotency, retry, audit, budget, security, and rollback test before enablement.
- Major portal version: feature flag/canary, content migration report, preview acceptance, production smoke, and documented rollback.

## Agent consumption contract

Agents read the controlling instructions first, then current working memory and sanitized portal data. They must state whether a value is canonical, live operational, derived, stale, planned, or unknown. Correctly routed communication is client-safe in that client's private portal; raw cross-client content, public/internal workflow architecture, credentials, and local paths remain excluded. Only explicit blockers, current memory blockers, direct client stop instructions, and Third i HITL are treated as blockers.
