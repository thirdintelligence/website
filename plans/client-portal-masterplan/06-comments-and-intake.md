# Comments, Timestamped Review, and Intake

## Interaction model

Comments and new-project requests share one reusable **workspace composer**.

The composer is non-modal because the user must continue navigating and inspecting the site while writing. It has a visible title, minimize control, submit control, and delete-draft action. There is no ambiguous close button.

- Escape minimizes without deleting.
- Minimized drafts dock at bottom-right on desktop and bottom edge on mobile.
- Restore returns focus to the last active field.
- Delete draft requires confirmation and is the only discard action.
- Desktop composer is movable by pointer and keyboard controls.
- Mobile composer uses a full-height sheet and does not require drag positioning.

Desktop default size is approximately 420–520px wide and 520–680px tall, constrained to the viewport and resizable only if testing shows the form needs it. Its last safe position is remembered per browser. The composer never covers the global navigation and always exposes Minimize.

## Persistence

Drafts persist across routes and browser restarts until posted or deleted.

Recommended implementation:

- server-side draft record in the tenant's live store;
- keyed by tenant plus an opaque per-browser device ID;
- device ID stored in an HttpOnly, Secure, SameSite cookie;
- draft content never embedded in URLs;
- autosave after a short debounce and show saved/error state;
- draft cannot be read before successful tenant authentication.

This avoids leaving private draft content in browser `localStorage` while preserving the requested experience.

## Comment fields

| Field | Requirement |
|---|---|
| Comment | Required title/text input |
| Blocker | Toggle, default off |
| Project | Confirmed project list plus General; contextual project preselected |
| Description / more details | Optional multiline text |
| Attachments | Optional controlled file/media upload |
| Context | System supplied: route, Library record, scene, asset, version, timestamp |

## Timestamp behavior

When the composer opens from a video asset:

1. Capture the active asset and version.
2. Capture current playback time to millisecond precision supported by the player.
3. Show the timestamp in the composer with an option to remove it for a general asset comment.
4. Store a default five-second range beginning at that point, clamped to media duration.
5. When the posted timestamp is activated, seek to the start, highlight the comment, and play/emphasize the five-second range.
6. Pause or return to normal playback at the end according to the user's prior player state.

The current release supports single-time and automatic five-second range comments. Freeform range handles, frame pins, drawings, and annotations are future features.

## Attachments

Allowed types and limits are server-configured and displayed before upload.

- Validate extension, MIME type, magic bytes, size, and tenant.
- Rename objects to generated IDs; never trust client filenames as storage keys.
- Store original filename only as escaped metadata.
- Scan or quarantine unsupported/risky content.
- Do not execute or render active HTML/SVG/script uploads inline.
- Images, video, PDFs, and standard documents are downloadable through protected routes.

Netlify synchronous functions effectively cap binary requests near 4.5 MB, so file bodies never travel through a Netlify Function. The selected architecture is private Cloudflare R2 Standard storage with tenant-authorized direct uploads/downloads. Use resumable multipart upload over 100 MiB and enforce a first-release maximum of 2 GiB per file.

Small comment attachments use the same pipeline so validation, quarantine, audit, tenant isolation, and downloads have one security model. Client uploads remain limited to comment attachments and owner-issued intake links; there is no general upload area.

Provider setup, allowed types, retention, backup, and production credentials remain HITL gate `DATA-02`. See `18-asset-storage-delivery.md`.

## Posting flow

The synchronous transaction must:

1. verify tenant session, origin, CSRF, payload schema, and rate limit;
2. write the comment and immutable audit event to the strong-consistency operational store;
3. create or update the corresponding OS action record;
4. return the posted record to the portal;
5. clear the draft only after the write succeeds.

After durable write, a background notification job sends the owner email. Email failure never loses the comment; it creates a retryable notification state visible in OS.

## Posted comment presentation

- Brand-matched chat/messaging bubble shape.
- Readable normal body-text size.
- Blocker/status icon and text.
- Context and timestamp link.
- Small bkWatch-blue pencil edit control.
- Small red trash control with confirmation.
- Status text: Open or Completed.
- Attribution: `bkWatch commented` or equivalent tenant label.

With shared access, any holder of the client password can edit or delete client comments. Deletion is a soft-delete in the audit log even though it disappears from the client UI.

## Completion ownership

- Clients cannot mark comments complete.
- Only a valid owner OS session can call the completion endpoint.
- Completion records owner action time and optional completion note.
- Project and Library views update immediately.
- Home adds the item to Recently completed actions.

## Email notification

Recipient: `ceo@thirdi.net`.

Subject format:

`[Portal · bkWatch · Project] Blocker: Comment title`

Body includes tenant, project, route/context, comment, description, timestamp, safe attachment links, created time, OS deep link, and retry/event ID. The pre-built analysis superprompt is available in OS but is not sent to or displayed for the client.

## Superprompt

Each action stores a non-client-visible prompt generated from a versioned template, not an AI call at submission time. It includes:

- assigned agent;
- client and project;
- sanitized comment context;
- relevant source files to read;
- instruction to analyze the request, identify already-planned changes, propose implementation, run the project workflow, and preserve client privacy;
- HITL boundaries.

## New-project intake

Uses the same persistence, attachment, notification, and audit system. Its submission creates a client-proposed live project record as specified in `05-projects-and-creative.md` and a corresponding OS action with a project-creation superprompt.

## Failure states

- Offline: keep draft, show offline status, retry only with user visibility.
- Validation failure: preserve fields and identify the exact invalid field.
- Upload failure: keep comment text; allow attachment retry/removal.
- Comment write failure: do not clear draft or claim success.
- Email failure: comment remains posted; OS shows notification retry state.
- Completion conflict: use record revision/ETag and ask OS to refresh rather than overwriting a newer change.
