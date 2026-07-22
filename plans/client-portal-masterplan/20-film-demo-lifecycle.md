# Film project, demo, and promotion lifecycle

Status: controlling reusable product contract  
Updated: 2026-07-21

## Canonical naming

- A **project** has a stable client-facing name. Current bkWatch project: `Film 1 - Shaw Integration`.
- A **demo direction** is an idea inside a project. Current selected direction: `Final Demo`.
- Never use a demo title as the project title.
- Store `projectPhase`, `demoPhase`, and `fullFilmPhase` separately. A project can be active while its demo is building and its full film is not started.
- Stable route IDs may retain legacy strings for compatibility; display names must use current canon.

## State machine

| State | Client surface | Media policy | Exit condition |
|---|---|---|---|
| `brainstorming` | Every idea has its own storyboard/script page | No preview container or placeholder | Ideas ready to compare |
| `direction-selection` | Compare ideas; client may select one or more or request a hybrid | Still no media placeholders | Selection recorded |
| `demo-production` | As soon as a direction is locked, its complete storyboard/script workspace is embedded directly above Creative Directions on the project page; it has no separate direction page | `designer.svg` per selected scene until actual demo media exists | Demo assembled for review |
| `demo-review` | The embedded demo, versions, storyboard, script, and comments remain together on the project page | Real media plus history; truthful missing states only | Client approves, revises, or rejects |
| `demo-approved` | The embedded canonical record locks for full-film production | History preserved | Approval transition passes validation |
| `full-production` | The same embedded record advances in place; no page is copied or moved | Scene media/version history continues on the same stable records | Full film enters review |
| `final-review` | Full-film versions and comments | Real media and complete version history | Client acceptance |
| `delivered` | Read-only delivery record plus downloads/results | Approved final media | Reopen only through a new scoped change |

## Hybrid rule

A client may combine ideas. Create a new canonical idea with its own stable ID/slug and `sourceIdeaIds`. Do not silently mutate one source idea or erase the alternatives. Before lock it may be reviewed like any brainstorm direction. At lock, its complete workspace is embedded in the project page and its separate presentation route redirects to that embedded record.

## Placeholder rule

`designer.svg` means work is actively underway. It is permitted only for:

1. scenes of a selected demo in `demo-production`; or
2. scenes of an approved storyboard in `full-production` while their real media is not yet attached.

It is forbidden on brainstorm/unselected ideas. Those pages render storyboard and script content directly without a blank video/still area, neutral play tile, or text such as “Not yet generated.”

## Lock-to-project transaction

Locking a direction is an explicit state change, not a copy/paste operation:

1. validate the client selection and canonical idea ID;
2. set `selectedIdeaIds`, `canonicalIdeaId`, and `promotionState=embedded`;
3. set `projectPhase=demo-production`, while `fullFilmPhase` remains `not-started`;
4. preserve stable idea/scene IDs, asset IDs, versions, comments, approval records, source references, and audit events;
5. render the complete selected presentation immediately above Creative Directions on the main project page;
6. remove navigation to a separate page for the locked direction while leaving alternative brainstorm pages available below;
7. emit a lock/embed audit event and an owner OS action;
8. reject the transition if the idea, selection, tenant, or required provenance is missing.

Demo approval later changes the same record to `promotionState=promoted`, `projectPhase=full-production`, and `fullFilmPhase=in-production`. It never creates, copies, or relocates a second storyboard page.

## Current bkWatch truth

- Project: `Film 1 - Shaw Integration`
- Selected demo: `Final Demo`
- `projectPhase`: `demo-production`
- `demoPhase`: `building`
- `fullFilmPhase`: `not-started`
- `promotionState`: `embedded`
- Unselected directions: storyboard/script only, `mediaPolicy=none`
- Selected demo: `mediaPolicy=demo-placeholders`
- `NEW FILING` is generated with the filing object in the same production pass.
- Shaw interface-use approval is already secured; exact sanitized assets remain an input requirement.

## Agent invariant

Every agent that plans, publishes, syncs, or reports film state must read this contract. If another source calls the project “Demo,” gives a locked demo a separate page, says the current demo is complete/in review, or says full-film production has started, this file and the latest project working memory supersede it.
