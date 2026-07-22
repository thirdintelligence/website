# Third i OS Redesign

## Purpose

The OS remains owner-only and keeps its existing design foundation, while adopting the portal's calmer layout, clearer hierarchy, useful color, and reduced card repetition. It is the operating counterpart to the client portals, not the same client-safe surface.

## Top-level OS pages

### 1. Dashboard

- prioritized action items;
- portal comments and client project requests;
- recent communications;
- recent owner actions;
- failed notification/sync states;
- current deadlines and meetings;
- live connection strip.

### 2. Clients

- flat client selector/dropdown in the top utility area;
- selected client summary mirrors the client's portal view using the same sanitized records;
- internal-only annotations and action controls are layered separately and cannot enter client responses;
- direct links to the client's Home, Projects, Library, and AI Roadmap.

### 3. Departments

Large equal-size department cards lead to department views. Avoid nesting every Markdown file as its own department.

Recommended consolidation:

1. **Brand** — brand system, positioning, identity, claims, and brand governance.
2. **Finance** — accounting, invoicing, time tracking, cash flow, commercial policies.
3. **Growth Strategy** — mission, roadmap, growth plans, marketing strategy, and competitive strategy.
4. **Services & Delivery** — service catalog, client delivery standards, project health, capacity, quality.
5. **People & Risk** — HR, contractors, legal, security, privacy, compliance.
6. **Communications** — client communications, meeting follow-up, notification state, communication standards.

`ACCOUNTING.md` remains a focused ledger/process source under Finance rather than a separate top-level department. Growth, Marketing, Competition, Mission, and roadmap strategy may be synthesized into a client-safe-independent `GROWTH_STRATEGY.md` while preserving original source files until the migration is validated.

The three dedicated subpages requested in the brief remain:

- Branding
- Finances
- Roadmap

Recommended additional dedicated subpages:

- Client Delivery
- Communications
- Risk & Security

Department consolidation is a memory change and requires HITL gate `MEM-02` before files move or merge.

### 4. Framework

- current agentic workflows;
- memory architecture;
- workflow/skills/rules relationship;
- live connector architecture;
- portal live-data and memory-mirror architecture;
- reusable client generator;
- test and security state.

## Portal connection

The live strip becomes:

`Sheets ✓ · Gmail ✓ · Calendar ✓ · Portals ✓`

Portals status is honest and calculated from:

- successful owner read of the portal operational store;
- latest comment/action event time;
- latest successful completion round trip;
- notification queue health;
- latest local memory-mirror cursor/heartbeat;
- tenant-isolation health check.

It must not report healthy merely because the public route returns HTTP 200.

## Portal action items

Every portal action contains:

- type;
- tenant/client;
- project or General;
- title and context;
- priority;
- status;
- source event ID;
- created/updated time;
- executable behavior or copy-prompt;
- assigned agent when applicable.

Only these owner actions are directly executable without an agent:

- mark comment complete;
- reopen comment when supported;
- reorder priority;
- retry failed notification;
- change selected project thumbnail when already approved;
- hide/restore a client-created project request pending review.

Complex work becomes a versioned copy-prompt with the correct agent and workflow. A button must not imply execution if an agent or approval is still required.

For agent-required work, OS shows `Copy prompt` and assigned agent. `Complete` remains available only after the work result exists and Justin is confirming closure; having a pre-built prompt is not itself completion.

## Agent handoff

Agents may read the protected/generated OS state to discover Justin's reordered priorities, new comments, and action choices. Knowledge, history, brand facts, and approved project truth still come from memory and live connectors. OS is the action/orchestration surface, not a replacement factual memory vault.

## Comment completion flow

1. Owner selects Complete.
2. OS may request an optional client-visible resolution note.
3. Owner API verifies OS session and CSRF.
4. Comment revision updates in the operational store.
5. Immutable completion event is written.
6. Client project/Library view reflects Completed.
7. Home shows the completed action.
8. Local sync mirrors the event into client communications memory.

## Client-view parity

The OS's “View as client” uses the same protected portal renderer/data contract as the client. It must not be a hand-built approximation. Internal overlays are off in this mode.

## Logout

Owner logout remains server-side, placed above the session indicator, and visually aligned with client portals. Client and OS sessions remain isolated.

## Visual direction

- Preserve Third i typography and brand tokens.
- Use deep neutral surfaces with Third i color as accents.
- Reduce equal-weight cards.
- Use feeds, tables, timelines, grouped lists, and split panes where they communicate better.
- Keep sidebar/navigation quieter than active work.
- Use abstract workflow/connection visuals only where they explain relationships.
- Validate dark and light modes independently.
