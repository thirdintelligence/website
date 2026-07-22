# Requirements Traceability

## Labeled answers

| Answer | Plan coverage |
|---|---|
| A4 approved | `01-approved-requirements.md` preserves the prior approved portal rules unless explicitly changed |
| A5 original four pages, expanded by approved Value & Results work | `01-approved-requirements.md`, `02-information-architecture.md`, files `04`–`08`, and current portal implementation |
| A9 subcategories/comms/memory map | `07-library-memory-mapping.md` |
| A10 animal## and shared attribution | `01-approved-requirements.md`, `09-live-data-security.md` |
| P02 gradient accents/dark readability | `03-portal-design-system.md` |
| P03 no dropdown sidebar items | `02-information-architecture.md`, `03-portal-design-system.md` |
| P11 in-production designer SVG | `05-projects-and-creative.md` |
| F01 global search | `02-information-architecture.md` |
| F02 accurate filters | `02-information-architecture.md`, `07-library-memory-mapping.md` |
| F03 no since-last-visit | `01-approved-requirements.md`, `04-home-today.md` |
| F04 owner-only completion | `06-comments-and-intake.md`, `10-os-redesign.md` |
| F05 comment system | `06-comments-and-intake.md` |
| F06 timestamp now | `06-comments-and-intake.md`, research in `11` |
| F07 media-only versions | `05-projects-and-creative.md` |
| F08 controlled deep-link uploads | `01-approved-requirements.md`, `06-comments-and-intake.md` |
| F09 direct downloads/no center | `05-projects-and-creative.md` |
| F11 future | `16-future-features.md` |
| F12 no freshness warnings | `01-approved-requirements.md`, AI-specific internal refresh only in `08` |
| F13 integrated value/effort/evidence | `04-home-today.md`, `08-ai-roadmap.md` |
| F14 memory + Library | `07-library-memory-mapping.md` |
| F15 no AI assistant | `01-approved-requirements.md` |
| Q09 provenance not necessary in UI | `01-approved-requirements.md`; provenance retained internally for integrity |
| Q11 future relationship map | `16-future-features.md` |
| Q12 comments on any Library item | `07-library-memory-mapping.md` |
| Q17 unrestricted client-visible downloads | `05-projects-and-creative.md` |
| Q22 analytics future | `16-future-features.md` |
| Q23 happiness pulse future | `16-future-features.md` |
| Q24 dark default | `03-portal-design-system.md` |
| Q25 collapsible sidebar/meaningful top bar | `02-information-architecture.md` |
| Q30 favicon by powered-by mark | `02-information-architecture.md` |
| Q32 logout above session | `02-information-architecture.md`, `09-live-data-security.md` |

## Organized brief

| Requirement | Plan coverage |
|---|---|
| Current route/stack preservation | `12-implementation-file-plan.md` |
| Home actions/communications | `04-home-today.md` |
| Projects media/script/storyboard/alternatives | `05-projects-and-creative.md` |
| New project auto-route/action | `05-projects-and-creative.md`, `06-comments-and-intake.md` |
| Project thumbnail behavior | `05-projects-and-creative.md` |
| Demo/draft disclaimer | `05-projects-and-creative.md`, research in `11` |
| No prompts to client | `01-approved-requirements.md`, `05-projects-and-creative.md` |
| Full project PDF | `05-projects-and-creative.md` |
| Client-friendly download filenames (`1.2.3` → `act1.scene2.vers3`) | `05-projects-and-creative.md`, validation in `13-test-qc-deploy.md` |
| Up to 2 GiB individual videos/assets | `18-asset-storage-delivery.md`, contract in `05`, `06`, `09`, tests in `13` |
| 20 GB+/month and 100 GB+/year low-cost delivery | provider/cost model in `18-asset-storage-delivery.md` |
| Library database/taxonomy | `07-library-memory-mapping.md` |
| Company/film memory locations | `07-library-memory-mapping.md` |
| Communications folder migration | `07-library-memory-mapping.md`, HITL in `14` |
| AI research and service positioning | `08-ai-roadmap.md`, `11-research-decisions.md` |
| Discrete color/abstract shapes | `03-portal-design-system.md`, `11-research-decisions.md` |
| Search in top right | `02-information-architecture.md` |
| Pricing research/decision | `05-projects-and-creative.md`, `11-research-decisions.md` |
| OS four pages | `10-os-redesign.md` |
| Department consolidation | `10-os-redesign.md`, HITL in `14` |
| Fourth live Portal indicator | `10-os-redesign.md` |
| Comment email + OS action | `06-comments-and-intake.md`, `09-live-data-security.md` |
| Completion push to client | `06-comments-and-intake.md`, `10-os-redesign.md` |
| Shared symlink memory | `00-README.md`, `07`, `09` |
| No-agent live connectors | `09-live-data-security.md` |
| Agent-required copy prompts | `06-comments-and-intake.md`, `10-os-redesign.md` |
| Scheduled automation decision | `09-live-data-security.md`, research in `11` |
| Future upgrade due 11/15 | `16-future-features.md` |
| Exact files | `12-implementation-file-plan.md` |
| Tests/security/rollback | `13-test-qc-deploy.md` |
| HITL before production writes/deploy | `14-roadmap-hitl.md` |
| Private, simple direct client downloads | `18-asset-storage-delivery.md` |
| Project name distinct from selected demo | `20-film-demo-lifecycle.md`, `05-projects-and-creative.md` |
| Brainstorm directions have storyboard/script pages and no media placeholders | `20-film-demo-lifecycle.md`, `05-projects-and-creative.md` |
| Locked demo embeds above Creative Directions; approval advances the same record | `20-film-demo-lifecycle.md` |
| Vision/design/final-product audit | `21-vision-design-system-audit.md` |
| Source of truth, local filesystem, connectors, update/automation/upgrade plan | `22-source-of-truth-sync-operations.md` |
| Shaw template/readiness and OS superprompt | `23-shaw-portal-readiness.md`, `os.html` `shawClientPortalPrompt` |

## Reconciliations recorded

### Shared memory vs production runtime

Resolved in `09-live-data-security.md`: symlinked memory is local; hosted operational state provides live portal/OS round trips; deterministic sync mirrors events to memory.

### No general upload vs comment attachments

Resolved in `01-approved-requirements.md`: attachments and owner-issued intake links are explicit exceptions; no general upload area.

### No close button vs accessibility

Resolved in `06-comments-and-intake.md`: non-modal composer with Minimize and explicit Delete draft; Escape minimizes rather than discards.

### Automatic new project vs curated memory

Resolved in `05-projects-and-creative.md`: a live client-proposed project record renders immediately but does not invent or overwrite curated project memory.

### No provenance UI vs factual integrity

Resolved in `01-approved-requirements.md`: sources/as-of remain required in the data/build layer but may be visually quiet and are not a mandatory client-facing column.

### Pricing visibility vs no public pricing

Resolved in `05` and `11`: private project-level confirmed scope/investment is appropriate; no public/general pricing page or global hours counter.
