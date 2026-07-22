# Shaw portal readiness and template plan

Status: development-ready plan; build gated until bkWatch acceptance  
Updated: 2026-07-21

## Reuse boundary

Reuse from bkWatch:

- information architecture and five work areas;
- component/token architecture, responsive behavior, and interaction contracts;
- project/demo lifecycle and locked-demo embedded-workspace model;
- schemas, sanitizer, search, tenant auth/API/store/media/audit/notification contracts;
- tests, release gates, generator, and rollback process.

Never reuse:

- bkWatch brand tokens/logos/content;
- project prompts, client feedback, credentials, source assets, generated media, communications, or private knowledge;
- bkWatch status/metrics as evidence for Shaw.

## Shaw design readiness

- Client authority: `memory/SHAW/DESIGN.md`.
- Primary blue: `#216F9B`.
- Visual direction: warm light neutrals, disciplined spacing, calm operational clarity, quiet competence.
- Use only the current approved Shaw Systems logo; reject legacy marks and “Associates LLC.” Verify the exact source files from Shaw memory before publishing.
- Third i remains discreet.

## Content inventory understood

- Company semantic/procedural memory, techniques, time tracking, README/INDEX.
- Product records: Spectrum, Amplify, Insight.
- Film/project memory for Films 1–4 where present.
- OS/Sheets-derived finance/time/project records.
- Gmail/Calendar-derived communications context, subject to sanitization.
- Shaw website workspace and approved asset roots.

## Must-resolve register

| Issue | Current evidence | Rule before client publication |
|---|---|---|
| Shaw Film 1 history | Project memory says archived before generation; time/OS/invoicing records also describe 250 fixed-bid hours and delivered conference work | Reconcile whether these are the same project, different phases, or mislabeled records. Publish no conclusion until sources agree. |
| Total Shaw hours | Older memory time summary differs from the newer OS/Sheets total | Google Sheets is financial authority; explain effective dates and retain historical snapshots. |
| Film 2 status | V1 completion and V2 production coexist | Model versions separately; never reduce to a single “active/completed” label. |
| Film 3 name | “AI Advisor” appears but official product/film nomenclature is not fully confirmed | Confirm exact client-facing name. |
| Insight status | Standalone-product confidence is low in memory | Confirm before presenting Insight as an independent product rather than a capability/interplay. |
| Logos/assets | Multiple historical locations/variants may exist | Verify current mark and client-safe files against DESIGN/memory; sanitize all screenshots. |
| Communications | Raw OS snapshot may contain signatures, access codes, links, or confidential body text | Publish only summaries/approved excerpts; never expose raw snapshot data. |

## Proposed Shaw information architecture

1. **Home:** relationship summary, needs attention, active work, recent approved activity, sourced opportunities, metric strip.
2. **Projects:** horizontal cards; version-aware film/project details; exact project/demo/full-production states; request-new-project workflow.
3. **Library:** brand, products, features, integrations, film knowledge, comments/emails/meetings, and other confirmed knowledge with source/as-of/status.
4. **AI Roadmap:** current adoption vs opportunities across the ten capability groups, source tier, value/effort/evidence, refresh state, and scoped service path.
5. **Value & Results:** Shaw-owned completed-project efficiency graph once two comparable projects are verified; financial/effort/deliverable/capability momentum; tenant-private learning explanation; future placeholders.

## Data and connector setup

- New `content/clients/shaw/` manifests generated from a reviewed Shaw source map.
- Distinct Shaw session/cookie/password hash/tenant claim/CSRF/rate limit and wrong-tenant tests.
- Add Shaw routes for live comments, drafts, project requests, media, and owner actions only after auth/data approval.
- Add Shaw to `KNOWN_TENANTS` reconciliation only when notifications and destination policy are configured.
- Create private `tenants/shaw/...` media prefixes only after DATA-02.
- Extract Shaw finance/time from the current OS/Sheets snapshot; communications from sanitized Gmail/Calendar summaries.
- Generate Shaw-only search index and deny local paths, secrets, raw prompts, and cross-tenant references.

## Acceptance order

1. bkWatch release accepted.
2. Shaw contradiction/source inventory approved.
3. Shaw client-safe content and AI status matrix approved (`CONTENT-01`, `AI-01`, `SHAW-01`).
4. Auth/storage/notification activation approved (`DATA-02` and applicable security gates).
5. Build via reusable generator and shared components.
6. Full unit/schema/API/auth/tenant/browser/accessibility/performance verification.
7. Preview review and design/content HITL.
8. Production deployment (`DEPLOY-01`), smoke, rollback evidence, OS/memory release record.

## Ready superprompt

The actionable canonical Shaw build superprompt is embedded in `os.html` as `actionPayloads.shawClientPortalPrompt`. The corresponding owner action is “Prepare Shaw portal from accepted bkWatch template.” It permits readiness/reconciliation now and blocks implementation/production activation until the acceptance and HITL conditions above are recorded.
