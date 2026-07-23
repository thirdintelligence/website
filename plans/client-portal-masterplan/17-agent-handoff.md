# ThirdI_WEB Agent Handoff

Prepared: 2026-07-16; current-state addendum: 2026-07-22
Target agent: Third-i-Web
Working directory: `/Users/justinbrannon/Desktop/Third i/ThirdI_WEB`

## Start here

Read in this order before changing source:

1. repository `AGENTS.md`;
2. `.devin/workflows/web.md`;
3. `.devin/rules/thirdi_web.md`;
4. `design/skills/DESIGN.md`;
5. `plans/client-portal-masterplan/00-README.md`;
6. `plans/client-portal-masterplan/14-roadmap-hitl.md`;
7. the phase-specific plan files;
8. `plans/client-portal-masterplan/15-requirements-traceability.md` before declaring a phase complete.
9. `plans/client-portal-masterplan/20-film-demo-lifecycle.md` before any film project/data/UI work.
10. `plans/client-portal-masterplan/21-vision-design-system-audit.md`, `22-source-of-truth-sync-operations.md`, and `23-shaw-portal-readiness.md` before declaring the template or Shaw readiness complete.
11. `plans/client-portal-masterplan/24-approved-platform-operating-plan.md` before changing portal architecture or generating a tenant.
12. `memory/THIRD_I/AUTOMATIONS.md` before creating or changing any recurring automation.

## Current-state addendum

- The bkWatch project is named `shaw-bkWatch`; `Final Demo` is its selected demo, not its project name.
- Current phase is `demo-production/building`; full-film production has not started.
- Brainstorm/unselected directions have storyboard/script pages and no media placeholders.
- Once locked, the selected demo's complete storyboard/history/script/comments workspace lives directly above Creative Directions on the main project page and has no separate direction page. Its scenes use `designer.svg` during demo production; approval advances this same record into full-film production.
- `NEW FILING` is generated with its filing object. Shaw interface-use approval is already secured; exact sanitized assets remain required.
- The implementation now includes live portal operations and R2-compatible adapters; use `22-source-of-truth-sync-operations.md` to distinguish active configuration from gated/planned activation.
- bkWatch v2 is accepted as the reusable design/structure baseline. Communications is a separate sixth work area; Library remains the knowledge workspace.
- The approved architecture is one shared portal core plus tenant configuration/content/auth/data/media/search. Never copy a client HTML page to create another tenant.
- Shaw Film 1 is complete conference work (250 hours, fixed-bid/pre-contract); Film 2 V1 and V2 are complete; Film 3 is AI Advisor and awaiting direction lock; Film 4 is Insight. Films 2–4 form one aligned Summit loop.

For bkWatch visual/content work also read:

- `memory/BKWATCH/DESIGN.md`;
- `memory/BKWATCH/BKWATCH_SEMANTIC.md`;
- `memory/BKWATCH/BKWATCH_PROCEDURAL.md`;
- `memory/BKWATCH/BKWATCH_FILM1/`;
- approved local bkWatch assets.

## Verified ready

| Capability | Evidence on 2026-07-21 |
|---|---|
| Repository filesystem | Plan and repository are readable/writable |
| Shared Obsidian memory | `memory/` symlink resolves; Third i and bkWatch memory are readable; Third i memory is writable |
| bkWatch inputs | `DESIGN.md`, semantic memory, Film1 episodic/reflections, logo, current manifest, and `assets/designer.svg` are readable |
| Runtime/package discipline | `engines.node >=22`, one npm lockfile, pinned AJV, Playwright, and AWS S3/R2 SDK dependencies |
| Netlify CLI | Installed (`25.0.1`) and authenticated to the Third i account |
| Netlify project | Linked to `thirdintelligence`, project ID `a790b3a4-8c53-420a-920c-f274c0ec6e3d`, production URL `https://thirdi.net` |
| Production auth secrets | Keys present: `BKWATCH_PORTAL_PASSWORD_HASH`, `OS_PORTAL_PASSWORD_HASH`, `PORTAL_SESSION_SECRET`; values were not displayed |
| Git | `origin` resolves to `https://github.com/thirdintelligence/website.git`; the audited release is maintained on `client-portals` |
| Local connectors | Local OS snapshot endpoint reachable; Sheets, Gmail, and Calendar reported active; refresh is separated from deployment |
| Portal implementation | Six work areas, schemas, client-safe manifests, search, Value & Results, project lifecycle, comments/drafts/requests/actions/audit, and owner readback exist |
| Existing tests | 63/63 Node tests pass, including auth, schema, tenant isolation, live operations, media contracts, notification reconciliation, and Value & Results privacy |
| Existing auth | bkWatch and owner OS server-side auth/tenant-isolation tests pass |

## Remaining activation and operations gates

### ENV-01 — Configure non-production environments

Keep distinct development/deploy-preview auth and store namespaces. Never use production passwords or production operational data in preview tests.

### DATA-01 — Operational storage

The R2-backed `_ops/<version>/` adapter and tenant-scoped operational endpoints are implemented. Retention, backup, namespace-separation, and restore policy remain explicit operating decisions before adding tenants.

### DATA-02 — Separate preview media

The researched architecture is Cloudflare R2 Standard with direct signed multipart upload/download, a 2 GiB per-file product limit, and readable client filenames. The full cost/security/flow decision is in `18-asset-storage-delivery.md`.

Signed upload/download and media-isolation contracts are implemented and tested; current limits/types and simple owner-review policy are approved. `thirdi-media-preview`, the deploy-preview bucket override, operational store version, and media-origin allowlist are configured. Add the preview-only scoped token and matching R2 CORS policy before preview media testing. Defer quarantine/scanning, retention automation, and budget alerts until real volume or provider requirements justify them.

### EMAIL-01 — Approve outbound email provider

The durable notification queue and ten-minute reconciliation are implemented. Verify the production transactional provider, sender/domain authentication, copy, and retry health before relying on outbound delivery; comment durability never depends on email success.

### MEM-01 — Create communication subfolders only after approval

These approved target folders do not yet exist:

- `memory/BKWATCH/BKWATCH_COMMS/comments/`
- `memory/BKWATCH/BKWATCH_COMMS/emails/`
- `memory/BKWATCH/BKWATCH_COMMS/meetings/`

Run the dry-run migration and receive `MEM-01` before writing or moving communication memory.

### OPS-01 — Replace auto-sync

The legacy `com.thirdi.auto-sync` job failed with exit `126` because macOS background access to Desktop was denied and its byte-change production deploy behavior was unsafe. Retire it. The replacement refreshes a local snapshot cache only, runs outside Desktop, and never edits the repository or deploys.

## Build sequence for the next agent

1. Read the current lifecycle, vision audit, source-of-truth plan, and Shaw readiness files listed above.
2. Treat the deployed bkWatch portal, sanitized v2 manifests, schemas, and passing tests as the reusable baseline.
3. Maintain bkWatch through deterministic manifest/search/metric builds and immediate hosted operational updates as classified in `22-source-of-truth-sync-operations.md`.
4. Run the complete QC matrix for every release; receive design HITL for any new visual decision.
5. Keep memory mirror in dry-run until `MEM-01`; use the refresh-only local service and explicit tested releases.
6. Build the shared platform/generator from `24-approved-platform-operating-plan.md`; keep current bkWatch UI unchanged unless a later visual HITL approves a change.
7. Plan Shaw from the accepted bkWatch baseline and confirmed canon; activate Shaw tenant auth, storage, notifications, and deployment only through the named Shaw/data/deploy gates.

## Non-negotiable operational boundaries

- Never expose raw memory or local paths.
- Never let the request body select authoritative tenant identity.
- Never auto-publish unstructured memory prose.
- Never treat successful email as the primary durable comment write.
- Never store the shared password in browser storage.
- Never expose client prompts.
- Never run production data/provider setup without the named HITL gate.
- Never use the failing auto-sync job as proof that portal state is synchronized.

## Handoff verdict

The bkWatch v2 portal is the accepted, tested reusable design/structure template—not a mockup. The architecture decision and Shaw facts are resolved well enough to build the shared platform and generator. Shaw client publication still depends on tenant-specific content/design approval, separated preview/production media configuration, auth/data activation, full QC, and deployment HITL.
