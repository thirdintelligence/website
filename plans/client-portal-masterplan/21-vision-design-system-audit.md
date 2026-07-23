# Vision, design, and product-system audit

Status: final-version audit with gated improvement plan
Updated: 2026-07-21

## Product vision

The portal is a client-branded operating workspace and relationship record: one place to understand current work, review creative evidence, comment, request work, inspect institutional knowledge, evaluate AI opportunities, and see verified value. It is not a marketing site, a raw memory browser, a per-film OS, or a decorative dashboard.

## What the current system is good at

| Area | Strength |
|---|---|
| Information hierarchy | Project hero, single-column detail, horizontal project cards, action-oriented cards, and direct scene/story/script inspection support real client review. |
| Honest state | Draft, missing, in-production, blocker, selected, active, planned, and unknown states are textual and not color-only. |
| Client identity | Tenant tokens, client logos, light/dark modes, and restrained Third i attribution keep the workspace client-first. |
| Review continuity | Scene comments, blockers-as-comments, draft persistence, stable routes, version structures, and owner actions form a useful review loop. |
| Knowledge depth | Library taxonomy, a dedicated Communications workspace, provenance, search, AI Roadmap, and Value & Results make the relationship more valuable than a file-delivery portal. |
| Privacy architecture | Server-side sessions, tenant derivation, CSRF, rate limits, no-store responses, client-safe manifests, and private media contracts create a sound base. |
| Reuse | Schemas, modular portal pages/components, a tenant generator, and a masterplan can support Shaw and future clients without content copying. |

## Corrections applied in this release

- Replaced the ambiguous project identity with `shaw-bkWatch`.
- Separated demo production from full-film production in schema, data, UI, memory, OS, and agent instructions.
- Removed media preview containers from unselected brainstorm directions.
- Limited `designer.svg` to selected demo production and added the precise label `Demo in production`.
- Embedded the complete locked demo workspace directly above Creative Directions and retired its duplicate direction page; approval advances the same stable record later.
- Kept the existing approved visual system; no new visual direction was introduced without HITL.

## Remaining design/product gaps

| Priority | Gap | Why it matters | Planned resolution / gate |
|---|---|---|---|
| P0 | Public Portfolio and About pages still contain placeholder content | A “final” company site cannot point prospects to empty proof | Content/design review and explicit deploy HITL |
| P0 | Shaw source history contains contradictions | A polished UI cannot compensate for inaccurate client history | Reconciliation in `23-shaw-portal-readiness.md` before SHAW-01 |
| P1 | Real media rendering is modeled but current project has no approved client media | Hero/scene/version UX needs production evidence | Publish approved asset records through the R2/media pipeline after DATA-02 |
| P1 | Shared tenant password cannot attribute individual approvals | Comments show tenant-level attribution, not a specific reviewer | Future account/passkey/role upgrade; preserve current secure shared-password phase |
| P1 | Accessibility/performance evidence is script-driven but not yet a formal release artifact per deploy | Regression confidence should be auditable | Save axe/Lighthouse/browser reports and budgets with each release |
| P1 | `os.html` is a large generated/embedded artifact | Manual prompt/state drift is hard to detect | Move prompts/actions/snapshot to structured source files and generate `os.html` with schema tests |
| P2 | Some portal sections still use many equal-weight cards | Dense screens can feel like a catalog instead of a guided workspace | After HITL, consolidate secondary content into ranked lists/rows while preserving action buttons |
| P2 | Analytics/health visibility is limited | Operational failures may be found by a user first | Add privacy-safe uptime, error, queue, storage, and deploy health to owner OS only |
| P2 | Vanilla public site conflicts with the documented Next.js target | Two architectural directions increase maintenance | Decide at a separate architecture gate; do not rewrite a stable portal solely for framework uniformity |

## Design acceptance checklist

- Client brand is visually primary; Third i is discreet.
- All text meets WCAG AA contrast; focus is visible; reduced motion is honored.
- Colored buttons use black text until hover, then white.
- Clickable cards include a visible destination action and never underline body text on hover; compact communication rows may use the owning section's visible `View all` destination instead of repeating the same button on every row.
- Project cards remain horizontal; project presentation remains one full-width column.
- Status/title controls are optically centered in their assigned control space.
- `designer.svg` has no bounce and remains optically centered with its phase label.
- Unselected brainstorm ideas contain no media preview placeholder.
- A locked demo has one client-facing home: its complete workspace on the main project page immediately above Creative Directions.
- Communications has one client-facing home outside Library; legacy Library communication links redirect without duplicating content.
- Project name and production phase remain unambiguous at card, hero, search, roadmap, Library, OS, and PDF surfaces.
- Mobile widths preserve reading order, button access, media fit, and no horizontal overflow.

## Vision outcome

The accepted target is a calm, precise client command center: current work is immediately legible; creative rigor is inspectable; feedback is actionable; knowledge is sourced; value grows over time; private client material never crosses tenants; and agents can determine exactly what is true, what is live, what is planned, and what requires approval.
