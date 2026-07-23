# Test, QC, Deployment, and Rollback Plan

## Test strategy

### Unit and schema

- Every v2 manifest validates.
- Every live record validates before storage and after retrieval.
- Unknown/missing data stays explicit.
- Search index contains only sanitized tenant text.
- Event IDs and retries are idempotent.
- Media version selection never deletes prior versions.
- Timestamp ranges clamp correctly at media end.
- In-production placeholder appears only for finalized-idea scenes.

### Authentication and authorization

- Anonymous portal requests receive only login content.
- Correct shared password creates encrypted persistent session.
- Incorrect password uses generic error.
- Password hash rotation invalidates old session.
- Logout removes tenant session.
- OS session cannot be reused as a client cookie and client session cannot enter OS.
- bkWatch session cannot read/search/download/write Shaw records.
- Path, query, JSON tenant, asset ID, and guessed IDs cannot override session tenant.
- CSRF and cross-origin mutation attempts fail.
- Rate limiting produces 429 without losing legitimate stored records.

### Comment round trip

1. Client posts General comment.
2. Durable comment and audit event exist.
3. OS action appears under correct tenant/project.
4. Notification record is created and email adapter invoked once per idempotency key.
5. Owner marks complete.
6. Portal project/Library context shows Completed.
7. Home completion feed updates.
8. Memory sync writes exactly one tenant comment file.

Repeat for blocker, Library item, still, video timestamp, and project request.

### Draft behavior

- Composer persists across all six top-level routes.
- Minimize/restore preserves fields.
- Browser refresh preserves server-side draft.
- Logout hides draft until reauthentication on the same device.
- Delete confirmation removes it.
- Failed post does not clear it.
- A different tenant cannot see it.

### Upload/download

- 1 MiB, 100 MiB, 1 GiB, and 2 GiB direct R2 upload paths succeed in preview; large fixtures are generated/sparse and never committed.
- Files over 100 MiB use multipart; interrupted upload resumes without repeating completed parts.
- A file one byte over 2 GiB is rejected before transfer.
- MIME spoof, active HTML/SVG/script, oversized file, and unsupported type fail.
- Filename cannot alter storage key/path.
- Other tenant cannot fetch object.
- Anonymous, expired-session, guessed-ID, cross-tenant, and `clientSafe: false` download authorizations fail.
- A 2 GiB upload/download never travels through a Netlify Function request/response body.
- Previous media versions remain downloadable.
- Direct project PDF requires tenant session.
- R2 range requests/playback and browser seeking work for protected video.
- Expired signed URLs refresh through the still-authenticated portal; full signed URLs never enter logs or analytics.
- Scene downloads use client-readable names such as `act1.scene2.vers3-description.mp4`.
- Download names never expose UUIDs, storage keys, hashes, timestamps, prompts, or local paths.
- The filename extension matches the validated media type.
- Multi-file archives preserve readable names without cross-project collisions.
- CORS rejects unapproved origins, incomplete multipart uploads expire/abort, and the budget alert is exercised before production.

### Search and filters

- Global search exists on all normal routes and disappears in full-screen mode.
- Search results use only current tenant data.
- Result links open canonical route/anchor/timestamp.
- Project/status/format/date filters render only when facets exist.
- Communications is top-level and never reappears as a Library category.
- Comments, emails, and meetings are distinct formats and their canonical routes live below `/communications`.
- A Shaw-only participant fixture cannot enter bkWatch even when its body mentions bkWatch; an explicitly joint participant record may enter both sanitized tenant summaries.

## Browser and visual QA

Required widths:

- 320px
- 390px
- 768px
- 1024px
- 1440px
- 1920px

Required modes:

- dark default;
- light;
- reduced motion;
- sidebar expanded/collapsed;
- composer open/minimized;
- full-screen presentation;
- print/PDF.

Inspect:

- no dark text on dark surfaces;
- all links readable in dark mode;
- gradient buttons/borders render consistently;
- no full blue content backgrounds except approved small accents;
- page titles have approved breathing room;
- logo and navigation align;
- abstract shapes never cover text;
- no card soup or repetitive equal-weight sections;
- no overlap, clipping, blank media, broken links, or horizontal page scroll;
- in-production SVG fills the grid while preserving proportions;
- mobile composer and search remain usable with virtual keyboard;
- timestamp click seeks and emphasizes five seconds.

## Accessibility

- axe/WCAG automated scan on every route and state.
- Manual keyboard pass.
- Visible focus in both themes.
- Skip-to-content.
- Sidebar collapse and mobile drawer announcements.
- Non-modal composer focus movement and keyboard reposition/minimize.
- Form errors connected to fields.
- Status conveyed with icon/text.
- Video has keyboard controls and captions/transcript when source exists.
- Print/PDF maintains reading order.

## Performance

Targets:

- Lighthouse performance/accessibility/best-practices/SEO above 90 where meaningful for protected pages.
- LCP below 2.5 seconds on representative mobile profile.
- CLS below 0.1.
- Lazy-load project media below the fold.
- Do not preload all Film1 stills/videos.
- Search index remains bounded and can be split by tenant/category as it grows.
- Decorative SVG/CSS animations do not create sustained layout/paint cost.

## Security review

- CSP reviewed after module/API/media changes.
- No secrets in `dist`, HTML, source maps, logs, manifests, or test fixtures.
- Protected media cannot be addressed through public `/public/` paths.
- Operational responses use `no-store`.
- Upload metadata is escaped.
- Email content is escaped and contains no secret links with excessive lifetime.
- Dependency audit and lockfile review after adding storage packages.
- Tenant-prefix and negative isolation tests run in CI and production smoke tests.

## Preview gate

Before production:

1. Build and all automated tests pass.
2. Netlify deploy preview uses non-production operational stores/providers.
3. Third i reviews all six work areas in both themes.
4. Third i reviews draft disclaimer, pricing treatment, comments, and in-production template.
5. Third i approves final client-visible bkWatch content and assets.
6. Data/security provider configuration is confirmed.
7. Backup/rollback rehearsal passes.

## Production verification

- `https://thirdi.net/bkwatch` login and authenticated Home.
- Projects, Film 1 nested routes, Value & Results, AI Roadmap, Communications, and Library.
- Global search and confirmed filters.
- Post/edit/delete comment.
- Timestamped video comment when test media is available.
- OS action and owner completion round trip.
- Email delivery to `ceo@thirdi.net`.
- Protected download.
- Anonymous and cross-tenant API denial.
- Desktop/mobile screenshots, console, network, CSP, and media checks.

Shaw remains unchanged until bkWatch production is accepted.

## Rollback

- Retain last known-good portal function, template, manifest, JS, and CSS release.
- Operational schema changes are additive during rollout.
- Keep v1 reader compatibility until acceptance window ends.
- Roll back route/function deploy without deleting v2 events or media.
- Restore selected media version by pointer change, not object deletion.
- Document Netlify deploy ID and operational backup cursor at release.
- If comments are disabled during incident, retain read access and drafts; do not claim posts succeeded.
