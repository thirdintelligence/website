# Shaw portal readiness and template plan

Status: planning accepted; shared-platform/generator work authorized; client publication gated
Updated: 2026-07-22

## Verdict

Yes: the accepted bkWatch v2 portal provides the design, six-workspace structure, lifecycle, schemas, interaction contracts, tests, and operating patterns needed to build Shaw content on the shared platform. There is no Shaw portal shell yet.

## Reuse boundary

Reuse the shared renderer, six work areas, components/tokens architecture, responsive behavior, project/demo lifecycle, schemas, sanitizer, search, auth/API/store/media/audit/notification contracts, tests, release gates, and generator.

Never reuse bkWatch brand/content, credentials, prompts, feedback, assets, generated media, communications, or private knowledge. New tenants are configuration/content/data namespaces on one platform—not copied HTML or permanent code forks.

## Confirmed Shaw canon

| Record | Current authority |
|---|---|
| Film 1 | Complete 2026 conference work; 250 hours; fixed-bid/pre-contract separate engagement; official Shaw Film 1. The archived May scaffold is historical and does not describe delivery status. |
| Film 2 | `Film 2 - Amplify`; V1 complete and V2 complete. Preserve version history. |
| Film 3 | `Film 3 - AI Advisor`; creative brainstorm complete; awaiting direction lock. |
| Film 4 | `Film 4 - Insight`; planned Summit loop film. Insight is a Spectrum feature/capability, not an unconfirmed standalone product. |
| Campaign | Films 2, 3, and 4 are one aligned Summit loop. Planning for every film must consider the other two and the central Spectrum/Amplify/AI Advisor/Insight story. |

Shaw Projects will show Films 1–4. Other engagements—including training, AV, agent, web, and operational support—belong in Library/Value unless separately scoped as a project.

## Design readiness

- Client authority: `memory/SHAW/DESIGN.md`.
- Primary blue: `#216F9B`.
- Warm light neutrals, disciplined spacing, calm operational clarity, and quiet competence.
- Use only the approved current Shaw Systems logo; reject legacy marks and “Associates LLC.”
- Shaw is primary; Third i is discreet.

## Client-safe publishing rule

Correctly routed Shaw communications and related information are considered client-safe inside the private Shaw portal. Exclude cross-client content, public/internal Third i workflow architecture, credentials, raw prompts, local paths, and anything explicitly marked private or blocked. Do not treat automatic email footer language as a publishing blocker.

## Six work areas

1. **Home:** current work, required actions, recent activity, relationship summary, and sourced opportunities.
2. **Projects:** horizontal cards for Films 1–4; exact version/project/demo/full-production states and request-new-project workflow.
3. **Value & Results:** completed-film efficiency/quality trend once comparable projects exist, current metrics, capabilities, private learning explanation, and future placeholders.
4. **AI Roadmap:** current adoption/opportunities with source, value, effort, evidence, and refresh status.
5. **Communications:** correctly routed comments, sanitized email summaries, and meetings; no access codes or raw bodies.
6. **Library:** products, features, integrations, film knowledge, decisions, and other confirmed work.

## Data setup still required before publication

- Generate the seven missing Shaw manifests from reviewed Shaw sources. `communications.json` and `invoicing.json` already exist; `portal.json`, `home.json`, `projects.json`, `library.json`, `ai-roadmap.json`, `roadmap.json`, and `search-index.json` remain.
- Create a distinct Shaw auth/session/cookie/tenant/rate-limit namespace and wrong-tenant tests.
- Create Shaw operational and media prefixes only after data/media setup approval.
- Pull finance/time from Sheets/OS; pull communication context from correctly routed client-safe records.
- Build a Shaw-only search index and deny cross-tenant references, secrets, raw prompts, and local paths.
- Keep production and deploy-preview media buckets/credentials separate.

The namespace contract is predeclared in `config/portal-tenants.mjs`, but Shaw remains `planned`: its owner-action and notification flags stay off, `/shaw/api/*` routes do not exist, and it is excluded from reconciliation until the activation gates pass. Run `npm run portal:readiness -- shaw` for the current file/namespace report.

## Acceptance order

1. Shared platform/generator plan and source map.
2. Shaw client-safe content and design review.
3. Shaw auth/data/media/notification activation.
4. Generator produces the tenant package without copying portal HTML.
5. Unit/schema/API/auth/tenant/browser/accessibility/performance verification.
6. Preview review and content/design HITL.
7. Production deployment, smoke test, rollback record, and OS/memory release update.

## Superprompts

- Shared portal platform and Shaw generator: `actionPayloads.clientPortalPlatformPrompt` in `os.html`.
- OS source restructuring: `actionPayloads.osRestructurePrompt` in `os.html`.

These are separate by design so the OS can be simplified without coupling that one-time restructure to portal generation.
