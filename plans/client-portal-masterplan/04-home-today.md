# Home / Today

## Purpose

Home is the relationship control surface. It should show the client what matters today without asking them to interpret the entire Library or project history.

## Page order

### 1. Relationship header

- Client-specific mission statement.
- Concise summary of what Third i is providing now.
- Current relationship phase and last meaningful update date.
- Add Comment button in the page header/top-right utility area.
- No generic welcome copy or vanity greeting.

### 2. Needs attention

Highest-priority open items, ordered by:

1. blockers;
2. comments awaiting Third i action;
3. client decisions or requested clarifications inside projects;
4. approaching milestones;
5. general open comments.

Each item shows project, action title, status text, created date, and canonical link. Color is supplemental.

### 3. Active work

Each active project receives a compact visual row or feature card with:

- approved thumbnail or truthful ungenerated thumbnail;
- project name and business purpose;
- current phase;
- next milestone;
- open blocker/comment count;
- latest client-safe update;
- direct link to the project.

No project completion percentage is shown unless the underlying milestone model is complete enough to support it.

### 4. Recently completed actions

When Third i marks a comment complete in OS, it appears here with:

- completed status and icon;
- original comment title;
- project or Library context;
- completion timestamp;
- optional owner response/result when supplied;
- canonical link.

This is a chronological feed, not a personalized “since your last visit” feature.

### 5. Relationship activity

Use explicit subcategories rather than “past activity”:

- Project updates
- Completed actions
- New deliverables
- Communication summaries
- Meetings
- Emails
- Comments

Only client-visible events render. Email and meeting entries use approved summaries, not automatically exposed raw content.

### 6. Next opportunities

Show no more than three relevant recommendations. Each must connect to a confirmed client goal or project and include:

- desired outcome;
- why it matters now;
- value;
- effort band;
- evidence/source class;
- Third i recommendation;
- link to the relevant project, Library record, or AI Roadmap section.

This is not a standalone opportunity backlog and does not use aggressive sales copy.

## Home statistics

Home uses only decision-useful indicators, for example:

- active projects;
- open blockers;
- deliverables ready for review;
- completed actions;
- next milestone date.

Detailed project metrics and outcomes live in Projects. Every metric retains source and as-of metadata in the record.

## Empty and loading states

- No active projects: explain the next agreed relationship milestone.
- No open actions: “Nothing needs your attention right now.”
- Live state temporarily unavailable: show sanitized static project state and a clear retry status; never replace it with fabricated zeroes.
- In-production media does not appear on Home unless it is a finalized-idea scene with the approved production placeholder.

## Acceptance checks

- A client can identify the top action within 10 seconds.
- The page contains no separate approvals terminology.
- Completed comments appear after an owner completion event without redeploying the portal.
- No other tenant's actions can be returned by the Home API.
- Home remains useful when there are zero comments or zero active projects.
