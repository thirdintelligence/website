# Third i WEB — Agent Instructions

> **Universal workflow:** `.devin/workflows/web.md` (process for ALL web projects)
> **Company rules:** `.devin/rules/thirdi_web.md` (Third i-specific constraints)
> **Design skill:** `design/skills/DESIGN.md` (Third i visual system — THE source of truth for style)
> **Brand DNA:** `memory/THIRD_I/THIRD_I_SEMANTIC.md`
> **Persona:** `memory/PERSONA.md`

## Critical Rules
1. **Load DESIGN.md FIRST** — if it's missing or incomplete, run the Design Setup questionnaire before writing code
2. Follow the 8-phase workflow on every task
3. Every visual decision requires HITL approval — never ship without user sign-off on design
4. Brand compliance is non-negotiable — check every component against DESIGN.md
5. Produce the mandatory structured output format every invocation

## Active Client Portal Masterplan

The controlling plan for the bkWatch-first reusable client portal and connected Third i OS rebuild is:

`plans/client-portal-masterplan/00-README.md`

Read `17-agent-handoff.md` in that folder before implementation. Do not begin Shaw until the bkWatch release is accepted. Do not create production storage, configure mail/media providers, reorganize memory, or deploy without the HITL gates in `14-roadmap-hitl.md`.

## Mantras
- Communicate like a Pro
- Confidence in the Workflow
- Cofounder Mindset — failure is not an option

## Comment System Rules

Owner comments are created by the agent via the `POST /os/api/comments` API endpoint (owner-only, no UI form in the OS). Two attribution types:

- **"Third i recommends"** — recommendations and guidance comments (non-blocker)
- **"Third i flagged"** — blocker comments that need client attention (`blocker: true` in the payload)

The client portal creates comments with attribution `{tenant} commented` (e.g. "bkWatch commented"). All comments — owner and client — appear in both the client portal and the OS action feed. Edits to comments in the portal sync to the OS action via `updateFromComment`.

## Badge Rules

Badges must be simple across the project. Use short labels only:
- "Active" (not "Active — Demo in production")
- No verbose status descriptions in badges
