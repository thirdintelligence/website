# Roadmap and HITL Gates

## Phase 0 — Plan freeze

Deliverables:

- this masterplan;
- requirement traceability;
- architecture decisions;
- exact file plan;
- test and rollback plan.

Exit: Justin accepts or edits the plan folder.

## Phase 1 — Data contracts and reusable shell

Deliverables:

- v2 schemas;
- tenant-safe manifest split;
- content validator;
- reusable five-area router/shell;
- dark-default paired themes;
- flat collapsible sidebar;
- meaningful utility bar;
- search/filter contract.

HITL `DESIGN-01`: approve desktop/mobile shell mockups in light/dark.  
HITL `DESIGN-02`: approve abstract motif system and gradient endpoint.  
HITL `CONTENT-01`: approve migrated bkWatch client-visible copy/data.

## Phase 2 — Four bkWatch pages

Deliverables:

- Home / Today;
- Projects and project detail;
- Library and memory mapping;
- AI Roadmap;
- Film1 migration in current confirmed state;
- direct downloads and print/PDF layout;
- in-production and draft treatments.

HITL `DESIGN-03`: approve in-production grid plus animated `designer.svg`.  
HITL `CONTENT-02`: approve AI-assisted draft disclaimer.  
HITL `COMMERCIAL-01`: approve project-level pricing/scope presentation.  
HITL `AI-01`: approve AI categories, statuses, recommendations, and cited research snapshot.

## Phase 3 — Live comments and project intake

Deliverables:

- operational store in local/preview context;
- persistent composer;
- comments on all required contexts;
- timestamp and five-second range behavior;
- edit/soft-delete;
- project requests;
- OS action feed;
- owner completion round trip;
- notification queue adapter;
- local memory mirror dry run.

HITL `DATA-01`: approve Netlify Blobs as hosted operational JSON store and retention policy.  
HITL `DATA-02`: approve the selected Cloudflare R2 Standard account/buckets, 2 GiB file policy, allowed types, retention/backup, budget alerts, scoped credentials, and production environment setup.  
HITL `EMAIL-01`: approve transactional email provider, sender, and production secret setup.  
HITL `COMMS-01`: approve exact email copy and superprompt templates.  
HITL `MEM-01`: approve the live-event-to-vault mirror writing into client communications folders.

## Phase 4 — OS redesign

Deliverables:

- Dashboard;
- Clients;
- Departments;
- Framework;
- portal connection status;
- live action controls;
- view-as-client parity;
- logout placement.

HITL `OS-01`: approve OS wireframes and information hierarchy.  
HITL `MEM-02`: approve department consolidation and any source-file moves/merges.

## Phase 5 — Full QC and preview

Deliverables:

- automated test evidence;
- API isolation evidence;
- browser screenshots;
- accessibility and performance results;
- email/upload round-trip evidence;
- backup and rollback rehearsal;
- preview URL.

HITL `RELEASE-01`: approve preview design and client-visible content.  
HITL `RELEASE-02`: approve production datastore/email/media configuration.  
HITL `RELEASE-03`: explicit production deployment approval.

## Phase 6 — bkWatch production

Deliverables:

- production deploy;
- route/API/media verification;
- deployment ID;
- production screenshots;
- rollback checkpoint;
- post-release issue log.

No Shaw implementation begins until Third i accepts the bkWatch portal release.

## Phase 7 — Reusable generator and Shaw

Deliverables:

- updated future-client generator;
- client design profile input;
- tenant schema/data generator;
- protected function/route generator;
- search/index generator;
- test generator;
- Shaw portal built from Shaw memory and assets.

HITL gates repeat for Shaw brand, copy, assets, AI Roadmap, auth secret, and production deploy.

## Phase 8 — Memory and workflow learning

After each accepted release:

- record decisions in WEB_EPISODIC;
- propose, do not silently change, DESIGN.md patterns;
- document reusable portal components;
- update the generator;
- add future ideas to `16-future-features.md`;
- preserve client silos.

## Dependencies

| Dependency | Blocks |
|---|---|
| Approved shell mockups | Phase 2 visual build |
| Structured client-safe records | Library and search |
| Operational store approval | Posted comments/completion |
| R2 account/bucket/2 GiB policy approval | Comment/project media uploads and client delivery |
| Email provider approval | Automatic notification delivery |
| OS action API | Completion round trip |
| Memory migration approval | New COMMS folder writes and department consolidation |
| bkWatch acceptance | Shaw build |

## Definition of masterplan completion

This planning task is complete when all files exist, links resolve, the traceability table covers every labeled answer and organized requirement, and no application/production state has changed.
