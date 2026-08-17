# @portal_update — Client Portal Update & Upload Workflow

> **Trigger:** `@portal_update` — called when updating a client portal with new
> or changed project state, scaffolding, scene media, voiceover, or any asset
> that needs to appear in a tenant portal on thirdi.net.

## Purpose

Provide one safe, repeatable command that:
1. Updates portal scaffolding from current project memory and state
2. Presents the asset-to-scene mapping for HITL confirmation
3. Uploads only after approval
4. Verifies every uploaded asset is approved and playable
5. Never leaves unapproved or broken media in the portal

## Non-Negotiable Rules

1. **Never assume media from another client's project.** Each tenant's media
   comes only from that tenant's own production folders. A bkWatch asset never
   appears in a Shaw project, and vice versa.
2. **Media is either approved and playable, or it is absent.** No placeholder
   media, no "awaiting approval" states, no pending transfers in the portal.
3. **Stills never get a play button.** Only `kind=video` and `kind=audio` get
   `data-media-playback`. Stills render as preview-only thumbnails.
4. **VO always lives in the project's `Audio/VOs/` folder.** Check there first.
5. **Hours always come from `ACCOUNTING.md` memory.** Never guess or hardcode.
6. **`startedAt` comes from the project's first working session date.**
7. **Upload only after HITL confirms the asset-to-scene mapping.**

## Execution Phases

### Phase 1 — Context & Scaffolding Audit

1. Load the project's current memory (working, episodic, accounting).
2. Load the tenant's `content/clients/<tenant>/projects.json`.
3. Identify the target project by ID.
4. Audit scaffolding fields against current project state:
   - `startedAt` — first working session
   - `hoursInvested` — from ACCOUNTING.md, summed for this project's weeks
   - `sceneMediaPolicy` — `scene-previews` if scenes have individual stills;
     `hero-only` if only a hero video exists
   - `status` / `statusLabel` — current project status
   - `phase` — current production phase from working memory
   - `nextMilestone` — next concrete milestone
   - `productionLifecycle` — projectPhase, demoPhase, selectedIdeaIds
   - `thumbnail` — points to an approved asset that exists
   - `comment.openBlockers` — must match actual blocker count
   - `blockers` — only real operational blockers
5. Audit the production lane (selected idea):
   - Scene count matches the storyboard
   - Scene titles, times, descriptions match the canonical script
   - `mediaPolicy` reflects actual media state
   - `lifecycleState` reflects actual production state
6. Report all scaffolding issues found.

### Phase 2 — Fix Scaffolding

1. Apply all scaffolding fixes identified in Phase 1.
2. Update the project's `assets` array:
   - Remove any asset that has no approved media (no mediaId, or mediaId not
     verified as approved in the production media store).
   - Remove any video asset if no video has been produced yet.
   - Keep stills and VO that are verified approved.
3. Update scene `assetIds` to reference only assets that exist in the array.
4. Update `thumbnail` to point to a verified approved asset.
5. Run content validation (`npm run portal:validate`).

### Phase 3 — Asset Mapping & HITL Confirmation

1. Scan the project's production folders for new media:
   - `Stills/act#/` for scene stills
   - `Audio/VOs/` for voiceover takes
   - `Videos/act#/` for motion renders (if any)
2. Map each file to its scene using the storyboard's scene numbering.
3. Present the mapping table to the user:
   ```
   | File | Scene | Description | Kind |
   |------|-------|-------------|------|
   | act1/1.1.png | F3-1.1 | Reality Before the Advisor | still |
   ```
4. Ask the user to confirm or adjust the mapping.
5. **Do not proceed to upload until the user confirms.**

### Phase 4 — Upload

1. For each confirmed asset:
   a. Run `publish-owner-media.mjs` with:
      - `--tenant <tenant>`
      - `--project <project-id>`
      - `--file <absolute-path>`
      - `--description <sanitized-scene-description>`
      - `--approve-note <approval-note>`
   b. Capture the `mediaId` from the output.
   c. Verify the media is approved by checking the owner API:
      `GET /os/api/media/<id>?tenant=<tenant>`
   d. Verify playback/preview authorization returns 200.
2. If any upload fails, stop and report. Do not continue with broken media.
3. If all uploads succeed, collect all media IDs.

### Phase 5 — Update Manifest

1. Add asset definitions to the project's `assets` array:
   - Each asset has: `id`, `kind`, `title`, `mediaState: "approved"`,
     `downloadable`, `versioned`, `currentVersionId`, `versions[]`.
   - Each version has: `id`, `label`, `state: "approved"`, `current`,
     `createdAt`, `downloadName`, `sizeLabel`, `mediaId`.
2. Update scene `assetIds` to reference the new asset IDs.
3. Update `thumbnail` if the hero asset changed.
4. Run content validation.
5. Run the full test suite.
6. Run the build.

### Phase 6 — Deploy & Push

1. Deploy to Netlify production.
2. Verify the deploy is live.
3. Verify key routes return 200.
4. Push to GitHub.
5. Report the execution receipt.

## File Locations

| Item | Location |
|---|---|
| Tenant manifests | `content/clients/<tenant>/` |
| Upload script | `scripts/portal/publish-owner-media.mjs` |
| Media policy | `lib/portal-media-policy.mjs` |
| Media function | `netlify/functions/portal-media.mjs` |
| Portal renderer | `public/portal/` |
| Project schemas | `schemas/portal/project.schema.json` |
| Tenant config | `config/portal-tenants.mjs` |
| Accounting memory | `memory/THIRD_I/THIRD_I_EXEC/departments/ACCOUNTING.md` |

## Verification Checklist

Before declaring done:
- [ ] Every asset in the manifest has a verified approved `mediaId`
- [ ] No video assets exist unless motion has been produced
- [ ] Stills render as preview-only thumbnails (no play button)
- [ ] VO plays via `data-media-kind="audio"` button
- [ ] `sceneMediaPolicy` matches the actual scene media layout
- [ ] `hoursInvested` matches ACCOUNTING.md
- [ ] `startedAt` matches the project's first working session
- [ ] `comment.openBlockers` matches actual blocker count
- [ ] Content validation passes
- [ ] All tests pass
- [ ] Build passes
- [ ] Deploy is live
- [ ] Changes pushed to GitHub
