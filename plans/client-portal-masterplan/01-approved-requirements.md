# Approved Requirements

## Product definition

The portal is a private client relationship operating system, not a marketing landing page. Its primary goal is to retain clients and keep them happy.

It must answer, quickly:

- What is Third i working on now?
- What needs the client's attention?
- What has been completed?
- What has Third i learned about the client's brand, products, integrations, and preferences?
- What assets and project evidence are available?
- What should the client consider next, including practical AI improvements?

## Final client-facing pages

Six top-level portal pages are in scope:

1. Home / Today
2. Projects
3. Value & Results
4. AI Roadmap
5. Communications
6. Library

Project detail, creative presentation, reports, outcomes, deliverables, and assets are nested views inside Projects. Brand, products, integrations, features, and film knowledge remain Library categories. Comments, email summaries, and meetings have one canonical top-level Communications workspace.

## Approved global features

- Dark mode is the default; light mode remains available.
- A collapsible desktop sidebar has six flat links and no nested dropdowns.
- A meaningful top utility bar contains global search, Add Comment, theme control, and contextual utilities.
- Global search remains visible at the top right except in full-screen presentation mode.
- Comments may be added from Home, Communications, any project or asset, and any Library item.
- Comments and new-project intake use a movable, minimizable persistent composer.
- Drafts persist across route changes until posted or explicitly deleted.
- Timestamped video comments capture the current playback position now.
- Clicking a timestamp seeks to the point and emphasizes/plays the five-second review range.
- Stills and video retain version history; storyboard, script, and text knowledge remain live-only.
- Clients may directly download every client-visible still, video, file, and full-project PDF.
- Individual approved client-delivery assets support up to 2 GiB in the first release.
- The storage plan must remain economical at 20 GB+ of new media per month and 100 GB+ retained per year.
- Large files use private tenant-authorized direct transfer; no client storage-provider account or public share folder is required.
- Clients can create project requests through the portal.
- Client-submitted comments automatically appear as OS action items and trigger a notification to `ceo@thirdi.net`.
- Only the owner may mark comments complete; completion appears on the portal Home page.
- Shared attribution is sufficient: `[Client] commented`.
- The current per-client `animal##` shared-password system remains for this release.
- Logout is above the session indicator.
- Third i favicon appears to the left of “powered by Third i.”

## Explicitly removed

- No Decisions and Approvals top-level page.
- No Account or Access page.
- No expandable or dropdown sidebar navigation items.
- No “since your last visit” feature.
- No standalone approvals inbox.
- No dedicated download center.
- No standalone opportunity backlog.
- No client-visible prompts.
- No citation/provenance UI requirement for general Library facts in the initial visual surface; provenance remains in the sanitized build pipeline and internal validation.
- No client-facing AI assistant.
- No general unrestricted upload area.
- No automatic content-freshness warnings.
- No automatic portal-usage analytics in the current release.
- No client happiness survey in the current release.

## Upload exception

Client uploads are permitted only in these controlled contexts:

1. Attachments to a comment.
2. An owner-issued deep link to a specific Library correction, description/script request, media request, or new-project intake section.
3. The Create New Project composer.

There is no browseable “upload anything” area.

The 2 GiB limit is guaranteed for owner-published/client-downloadable deliverables. Whether a client-originated comment attachment may also use the full limit is a separate `DATA-02` security/allowed-type decision; do not silently treat every authenticated client upload as trusted production media.

## Information integrity

- Client-safe records are separated from internal memory.
- Facts, draft media, in-production states, recommendations, and completion states are labeled honestly.
- Opportunities never become claims of current client adoption.
- No internal or rejected creative work is exposed unless explicitly approved for client review.
- Every statistic retains source and as-of metadata in the data layer, even when that metadata is visually quiet.
- Missing values remain unknown rather than invented.

## Privacy and tenancy

- Every live record includes exactly one tenant key. A joint communication may produce a separately sanitized summary in each participant tenant, but a client mention without an actual participant never grants that tenant a copy.
- The server derives authorization from the session; the browser cannot choose a different tenant.
- All media, uploads, comments, drafts, and operational APIs are tenant-protected.
- Shaw and bkWatch content cannot share namespaces, search indexes, caches, downloads, or API results.
- Raw vault files and local filesystem paths never ship to the browser.

## Client-visible content rule

The browser receives only:

- sanitized client manifests;
- approved client media;
- live records created inside that same tenant;
- public research excerpts or summaries approved for the AI Roadmap.

## Film project/demo language

Project title, selected demo title, demo phase, and full-film phase remain separate. Brainstorm directions show storyboard/script content on their own pages with no media placeholders. As soon as a demo/hybrid is locked, its complete workspace moves into the main project page directly above Creative Directions and its separate direction page is retired. Selected demo scenes in active demo production are labeled **Demo in production**. Approval advances that same embedded record into full-film production; it never copies the storyboard to another page.

## Future-only scope

The following remain deferred:

- stronger client authentication;
- relationship-map Library view;
- opt-in digest/notifications;
- aggregate portal analytics;
- client happiness pulse;
- advanced playback-linked annotation beyond current timestamp/range behavior.
