# Projects and Creative Presentation

## Project index

The Projects page contains:

- page title and concise relationship context;
- `Create a New Project` button;
- filters for active, completed, paused, and archived states;
- search within projects;
- featured active work;
- completed/archived project history;
- no standalone Decisions or Deliverables page.

Every project tile shows a thumbnail, title, status, project type, one-line value statement, next milestone or completion outcome, and comment count.

## New-project creation

`Create a New Project` opens the persistent composer specified in `06-comments-and-intake.md` with:

- project name, required;
- description/details, required;
- optional attachments;
- no blocker toggle;
- no existing-project selector.

On submit:

1. A tenant-scoped `client_project_request` record is created immediately.
2. A generic protected project route renders from that live record; no static HTML file is mutated.
3. The state is `Client proposed — awaiting Third i review`.
4. The submitted description and assets are visible to the same tenant.
5. An email event and OS action item are created.
6. The local sync mirrors the request into client communication memory.
7. An agent/owner later promotes the request into curated project memory and the sanitized project manifest.

Automatic creation must not invent strategy, milestones, ownership, budget, or delivery dates.

## Project detail hierarchy

1. Project hero: thumbnail/media, objective, audience, core value, state, next milestone.
2. Draft/production notice where applicable.
3. Current actions and comments.
4. Key messaging, theme, and creative vision.
5. Main playable demo/rough cut/final media, if present.
6. Script and storyboard.
7. Scene-by-scene creative presentation for film projects.
8. Strongest approved alternative for each scene.
9. Deliverables and assets with version history.
10. Timeline, milestones, blockers, owners, and next steps.
11. Reports and outcomes for completed work.
12. Related projects/products/integrations only where confirmed.
13. Scope and investment panel when commercial data is approved for client display.

## Comment placement

Add Comment is available:

- in the project header with the project preselected;
- immediately below each still/video asset;
- at the top-right of script and storyboard sections;
- at scene level;
- within reports/outcomes where feedback is meaningful.

Asset comments inherit project, asset ID, version ID, scene ID, and playback timestamp when applicable.

## Film 1 preservation

The project is `shaw-bkWatch`. `Final Demo` is the selected demo currently being built inside it. The demo is not complete, in review, approved, or in full-film production. The plan, six-scene selected demo, supporting ideas, locked script, instruction counts, and approval checkpoints may be represented only as supported by sanitized memory.

No still, motion clip, completed video, approval, or production progress is invented.

## Film presentation

The existing strong structure is retained:

- premium project overview;
- all idea directions as selectable visual entries;
- idea comparison using confirmed criteria;
- dedicated route for each idea;
- complete scene order;
- still or still sequence at inspection-friendly size;
- immediately followed by scene title, visual/camera/action direction, and exact script/dialogue;
- duration, transition, purpose, and production status when known;
- previous/next idea and scene index;
- full-screen and print/PDF modes.

Controls never hide the full storyboard/script evidence.

Scenes and project sections may exist before any still or video is attached. The data model and renderer must never require media in order to create a project, idea, scene, script, storyboard, action, or comment target.

## Approved local asset discovery

The local publisher may discover assets from approved still/video folders inside the canonical project folder. Discovery is a build input, not a browser filesystem feature:

- only configured tenant/project roots are scanned;
- files require an approved client-safe record before publication;
- local absolute paths are converted to generated protected asset IDs;
- prompts, rejected outputs, hidden files, source caches, and unapproved iterations are excluded;
- missing files fail validation rather than producing broken client media;
- the deployed portal never reveals the local source path.

## Draft disclaimer

Place one prominent but respectful notice above the first draft asset and a compact `Draft` label on each draft version:

> **AI-assisted production draft — not final.** The storyboard and script describe the intended result. Current media is an exploration used to identify major visual, motion, and product-accuracy issues before refinement. Please evaluate the draft against that target; details already specified in the storyboard remain planned for the final work.

The notice may be shortened after first display but must remain accessible near draft media. It does not appear on final/approved media.

## Demo and full-production placeholder

Use only for scenes of a selected demo actively being built or an approved storyboard actively in full-film production.

Composition:

- the established production grid fills the media frame;
- transparent `assets/designer.svg` sits above the grid;
- SVG uses `object-fit: contain`, locked aspect ratio, and the largest size that stays fully inside the frame;
- label: `Demo in production` during demo build, or `In production` during full-film production;
- no secondary milestone/status copy appears inside the preview;
- animation stops or becomes static under `prefers-reduced-motion`.

Do not use any media/still/video preview placeholder for brainstorm or unselected ideas. Every brainstorm idea receives its own storyboard and script page. Once a client locks one or more demos or a hybrid, the complete locked workspace is embedded directly above Creative Directions on the main project page and no longer has a separate presentation page. Only selected direction(s) receive scene placeholders. Demo approval advances that same embedded storyboard—with preview/version history, script, comments, approvals, and provenance intact—into full-film production without copying or relocating it. See `20-film-demo-lifecycle.md`.

## Ungenerated project thumbnail

Until a project has a still:

- use the neutral grid and play-button composition;
- do not show `designer.svg`;
- do not label the project media “In production” unless it meets the finalized-scene rule.

The first uploaded client-visible still becomes the default thumbnail. A client may select any client-visible still as the project thumbnail. Thumbnail selection is stored as live project presentation state and is owner-auditable.

## Version history

### Versioned

- stills;
- video;
- posters/thumbnails derived from versioned media.

New versions create immutable version records. Previous versions stay available for review and owner-controlled rollback. A selected/current version is explicit.

### Live-only

- storyboard;
- script;
- descriptions;
- messaging;
- strategy;
- reports and outcomes.

Text changes replace the current client-visible record without a client-facing version browser. Internal source history may still exist in Git or memory.

## Downloads

- Every client-visible asset has an immediate Download action.
- Full project PDF is available from project detail and presentation mode.
- Approved stills, videos, PDFs, and files may be up to 2 GiB each in the first release.
- Downloads use a tenant-authorized Netlify endpoint that issues a short-lived Cloudflare R2 URL; the 2 GiB file bytes never pass through a Netlify Function.
- Each action displays type and exact size, for example `Download 1.82 GB`.
- Large downloads support browser range/resume behavior where the client/browser supports it.
- There is no download center.
- Prompt files and internal artifacts are never downloadable.

The full provider, cost, upload, download, security, retention, and testing decision is in `18-asset-storage-delivery.md`.

### Client-friendly filenames

Downloaded files use readable production hierarchy rather than opaque numeric IDs.

Base pattern:

```text
act{act}.scene{scene}.vers{version}
```

Example conversion:

```text
1.2.3  ->  act1.scene2.vers3
```

When a short description helps the client identify the file, append a concise lowercase slug:

```text
act1.scene2.vers3-portfolio-alert.mp4
act1.scene2.vers3-selected-frame.png
act1.scene2.vers2-alternative-frame.png
```

Non-scene assets use the same plain-language principle:

```text
film1.final.vers2.mp4
film1.presentation.vers3.pdf
film1.storyboard.current.pdf
```

Filename rules:

- keep `act`, `scene`, and `vers` fully written as shown;
- use lowercase ASCII, periods for hierarchy, and hyphens inside the brief description;
- keep descriptions to roughly two to five useful words;
- preserve the correct file extension;
- never expose storage keys, UUIDs, hashes, raw timestamps, local paths, or internal generation names;
- the visible download label also shows a readable title such as `Act 1 · Scene 2 · Version 3 — Portfolio alert`;
- when several files are downloaded together, preserve these filenames inside a project-named ZIP/folder so identical scene names from different projects cannot collide.

## Pricing and commercial context

Do not place a universal running-hours counter in the global top bar. It makes every portal interaction feel transactional and separates effort from project value.

Use an optional project-level `Scope & investment` panel when commercial information is confirmed and appropriate:

- agreed pricing model;
- approved scope/deliverables;
- estimated effort range where useful;
- actual tracked hours where the contract is time-based;
- approved investment or estimate range;
- scope-change status;
- “estimate, not invoice” label;
- date and source.

For demo-to-full-production conversations, explain the production multiplier before showing a number: the demo's measured effort, additional scenes/refinement/QC, expected effort range, and a separately approved price. Never infer a price from hours unless the governing agreement permits it.

Other Third i services may show a private, client-specific indicative range only when the current service catalog and commercial source confirm it. The display must include scope assumptions and an as-of date; otherwise use `Scope required` and invite a project conversation rather than inventing a number.
