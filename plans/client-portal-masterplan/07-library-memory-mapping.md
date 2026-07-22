# Library and Memory Mapping

## Purpose

The Library is the client-facing database of everything Third i has worked on or learned about that client. It is not a raw vault browser.

## Taxonomy

### Branding

- Mission and positioning
- Audience segments
- Voice and communication
- Visual identity
- Approved logos and usage
- Messaging and claims
- Differentiators
- Marketing preferences

### Products

- Product families
- Individual products
- Business value
- Audiences
- Confirmed capabilities
- Related projects

### Features

- Feature name and description
- Parent product
- Status
- Confirmed value/use
- Related integration or workflow

### Integrations and partners

- Integration/partner name
- Relationship type
- Supported product/workflow
- Confirmed interplay only
- Related projects and knowledge

### Film knowledge

- Approved creative directions
- Production decisions
- Client feedback patterns
- Learned visual preferences
- Messaging preferences
- Product-accuracy rules
- Reusable scene/film lessons
- Film-specific facts remain connected to their source project

### Communication

- Comments
- Emails
- Meetings

Each communication type is a distinct subcategory. “Past activity” is not an accepted label.

### Other knowledge

Remaining client-safe facts are split into named subcategories before publishing. `Other` is permitted only as a temporary internal normalization state and should not become a large client-facing bucket.

## Source mapping

| Library area | Local source of truth |
|---|---|
| Branding | `memory/[CLIENT]/[CLIENT]_SEMANTIC.md` plus approved `DESIGN.md` identity facts |
| Products | semantic memory plus `memory/[CLIENT]/products/*.md` where present |
| Features | product documents plus semantic memory |
| Integrations/partners | semantic memory and approved product/project facts |
| Film decisions | `memory/[CLIENT]/[CLIENT]_FILM#/FILM#_EPISODIC.md` |
| Film preferences/patterns | `memory/[CLIENT]/[CLIENT]_FILM#/FILM#_REFLECTIONS.md` |
| Comments | hosted operational events mirrored to `memory/[CLIENT]/[CLIENT]_COMMS/comments/` |
| Emails | `memory/[CLIENT]/[CLIENT]_COMMS/emails/` client-safe summaries/records |
| Meetings | `memory/[CLIENT]/[CLIENT]_COMMS/meetings/` client-safe summaries/records |
| Other memory | explicitly routed and client-safe records from the remaining client silo |

## Current vault reality

The shared Obsidian vault is available locally through the project `memory/` symlink. bkWatch already has `memory/BKWATCH/BKWATCH_COMMS/` with working and episodic files, but not yet the approved `comments/`, `emails/`, and `meetings/` subfolders.

The migration plan is:

1. Inventory client-specific records currently held under centralized Third i communications memory.
2. Leave the original record intact until migration is verified.
3. Create client-silo communication folders.
4. Move or mirror only records belonging to that tenant.
5. Apply client-safety classification separately from physical location.
6. Validate no Shaw record enters bkWatch and vice versa.
7. Update memory indexes and procedural documentation.

Moving a record into a client folder does not automatically make it client-visible.

## Structured publishing contract

Arbitrary Markdown prose is never auto-published. The portal publisher accepts records with explicit fields:

- `id`
- `tenant`
- `type`
- `category`
- `subcategory`
- `title`
- `summary`
- `body`
- `status`
- `projectId` or `general`
- `format`
- `eventDate`
- `lastReviewedAt`
- `sourceRefs`
- `clientSafe: true`
- `ownerApprovedAt`
- `relatedIds`

Build fails if tenant, client-safety approval, source reference, or required facet fields are missing.

## Library views

- Browse by category/subcategory.
- Search.
- Confirmed filter facets.
- Recent by event/update date.
- Record detail.
- Related records list.
- Communication chronology.

The relationship/knowledge map is future scope.

## Comments on knowledge

Every Library record has Add Comment. Context automatically includes record ID, category, project/general, and canonical route. Corrections do not directly edit curated knowledge; they create an action for Third i to review and update memory.

## Communication display

- Comments may display their full client-visible content and status.
- Emails display approved summaries, participants, date, subject, decisions, and actions; raw email bodies require explicit approval.
- Meetings display approved summary, attendees, date, decisions, and actions; private notes remain internal.
- F14 meeting briefs/summaries live in memory and surface here.

## Filters

The Library exposes only values that exist across the indexed records. Project, status, format, and date facets are generated from the sanitized manifest and live tenant records. Unsupported or unpopulated filters do not render.

## Sync behavior

### Live to memory

A local sync can pull portal events and create deterministic Markdown/JSON records under the symlinked client communication folders. This does not require AI.

### Memory to portal

Only structured records explicitly marked `clientSafe: true` and owner-approved are converted to the client manifest. Natural-language internal memory never auto-pushes simply because a file changed.

### Conflict rule

Hosted operational event IDs are immutable. Curated Library records may reference them but do not overwrite the event. If an owner edits the curated summary, the raw event remains available internally for audit.
