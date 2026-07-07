---
name: web_workflow
trigger: slash_command
scope: web-projects
version: 2.0.0
description: "Universal web design + development workflow — works for ANY company. Company-specific style via DESIGN.md skill + project rules. HITL at every design decision."
---

# WEB Workflow — Universal Design + Development

> **The universal workflow for building professional corporate websites.** This workflow is the SAME regardless of which company's site is being built. Company-specific style, tone, and content come from:
> - **Rules** (`.devin/rules/[company]_web.md`) — project constraints, tech decisions, deployment config
> - **DESIGN.md skill** (`design/skills/DESIGN.md`) — the company's complete visual system (colors, typography, spacing, components, imagery)
>
> **Principle:** Workflow = universal process. Rules = company-specific constraints. Skills = company-specific style instructions.

---

## THE AGENTIC ARCHITECTURE (Always Know Where You Are)

```
THIRD I — THE COFOUNDER (orchestration · memory · learning · automation)
│   EXEC (all-client strategy) · COMMS (all-client communication) · R&D (the moat)
│
├── PROJECT TYPES ──────── shared workflow + skills per type
│   FILM → film workflow · 12 skills · guides
│   WEB  → web workflow  · DESIGN.md skill · design/dev skills
│
└── PROJECTS ──────────── own rules · own DESIGN.md · memories
    ThirdI_WEB    → src/ + design/skills/DESIGN.md + memory/THIRD_I/THIRD_I_WEB/
    [Company]_WEB → src/ + design/skills/DESIGN.md + memory/[COMPANY]/[COMPANY]_WEB/
```

**Hierarchy:**
- `web.md` (THIS FILE) → universal process for all web projects
- `.devin/rules/[company]_web.md` → company-specific rules (deployment, tech constraints, content strategy)
- `design/skills/DESIGN.md` → company-specific visual system (THE design skill)
- `memory/[COMPANY]/[COMPANY]_SEMANTIC.md` → brand DNA source (read-only, feeds into DESIGN.md)

---

## MANDATORY OUTPUT FORMAT

```
═══════════════════════════════════════════════════════════════
WEB WORKFLOW — EXECUTION
═══════════════════════════════════════════════════════════════

0. CONTEXT
   COMPANY: [which company's site]
   TYPE: [design_system | page_design | component | develop | deploy | review | asset_request]
   MODEL: [model name]
   AGENT: [agent platform]
   MEMORY: [✓ | ⚠ | ✗]
     WORKING: [1-line from WEB_WORKING.md]
     DESIGN SKILL: [✓ loaded | ✗ missing — RUN DESIGN SETUP FIRST]
   STATE: [site status + current phase]

1. MEMORY PARSE
   Loaded: [files]
   DESIGN.md: [version + completeness: complete | gaps identified]
   FILM integration: [genAI assets needed? from which project?]
   Brand system: [loaded from SEMANTIC.md → DESIGN.md]

A. PLANNING
   PAGE/COMPONENT: [what's being built]
   DESIGN SKILL REF: [which DESIGN.md sections apply]
   COMPLEXITY: [Low | Medium | High]
   HITL QUESTIONS: [design decisions that need user input]
   TASKS:
     1. [task] → [skill used]

B. EXECUTION
   [code/design output]
   BRAND COMPLIANCE: [checked against DESIGN.md ✓/✗]
   PERFORMANCE: [lighthouse estimates]
   STATUS: [complete | needs_review | deploy-ready]

C. LEARNING
   KNOWLEDGE TYPE: [project-specific | company-general | technique]
   DESIGN SYSTEM UPDATE: [new tokens/components added to DESIGN.md]
   COMPONENT LIBRARY: [reusable components created]

D. REFLECTION
   PATTERNS: [design/code patterns worth standardizing]
   DESIGN.md GAPS: [anything discovered missing from the design skill]
   NEXT: [next page/component/feature]

═══════════════════════════════════════════════════════════════
```

---

## The DESIGN.md Skill (Core of Company-Specific Style)

> **DESIGN.md is the single source of truth for how a company's website looks and feels.** It is built ONCE per company through a HITL interview process, then referenced by the agent on every design/development task.

### What DESIGN.md Contains

| Section | Purpose | HITL Required |
|---|---|---|
| **Brand Foundation** | Colors, typography, spacing scale, border radii | YES — every value confirmed |
| **Component Patterns** | Buttons, cards, forms, navigation, hero sections | YES — style choices |
| **Page Templates** | Layout patterns for each page type | YES — structure approval |
| **Imagery & Assets** | Photo style, illustration style, icon system | YES — aesthetic direction |
| **Animation & Motion** | Transitions, hover states, scroll effects | YES — feel/energy |
| **Responsive Strategy** | Breakpoints, mobile-first decisions | Confirm defaults |
| **Accessibility** | Contrast ratios, focus states, ARIA patterns | Auto (standards-based) |

### DESIGN.md Creation Process (First-Time Setup)

```
1. Load company SEMANTIC.md → extract brand DNA (colors, tone, audience)
2. Present pre-filled DESIGN.md draft with known values
3. ASK gap questions (typography, spacing, imagery style, etc.)
4. User answers → agent builds complete DESIGN.md
5. HITL GATE: Present final DESIGN.md for approval
6. Lock DESIGN.md — all future work references it
7. DESIGN.md evolves ONLY via explicit user request or pattern promotion
```

### DESIGN.md Location

```
[Project Root]/design/skills/DESIGN.md
```

---

## Memory Priority Circles

### Circle 1 — Always Loaded (every web session)
1. `dashboard.md`
2. `design/skills/DESIGN.md` — THE design skill
3. `memory/[COMPANY]/[COMPANY]_WEB/WEB_WORKING.md`
4. `memory/PERSONA.md`

### Circle 2 — On-Demand
- `memory/[COMPANY]/[COMPANY]_SEMANTIC.md` — brand DNA
- `memory/[COMPANY]/[COMPANY]_WEB/WEB_EPISODIC.md` — decision history
- `.devin/rules/[company]_web.md` — project rules
- `memory/THIRD_I/THIRD_I_TECHNIQUES.md` — reusable techniques
- FILM project memory — for genAI asset integration

### Circle 3 — Cross-Company (with permission)
- `memory/SUPERSKILL_ARCHIVE.md` — available skills
- Other company's DESIGN.md (for pattern inspiration, never copy)

---

## The 8-Phase Execution Loop

```
Phase 0 — context_check: Load DESIGN.md + rules + working memory. If DESIGN.md missing → run Design Setup.
Phase 1 — task_router: Classify (design_system | page_design | component | develop | deploy | review)
Phase 2 — Skill Execution:
           designer → reads DESIGN.md, proposes layout/component (HITL)
           developer → implements approved design in Next.js + Tailwind
           deployer → builds, deploys, monitors
Phase 3 — qc: Brand compliance (vs DESIGN.md) + accessibility + performance + code quality
Phase 3.5 — self_heal: If QC fails → diagnose → auto-fix (low-risk) or escalate (high-risk)
Phase 4 — HITL Gate: Design decisions ALWAYS wait. Code ships if tests pass.
Phase 5 — learner: Log decisions to WEB_EPISODIC. Track component library growth.
Phase 6 — reflector: Detect reusable patterns → propose DESIGN.md additions or technique promotions
Phase 7 — Delivery: Preview URL (Vercel preview) or merged code + next priorities
```

---

## HITL Decision Matrix (EVERY Design Step Gets a Gate)

| Decision Type | Risk | Action |
|---|---|---|
| **Color/typography/spacing** | HIGH (brand) | WAIT — present options with rationale |
| **Component style** (button shape, card layout) | HIGH (UX) | WAIT — show visual mockup or code preview |
| **Page structure** (sections, hierarchy) | HIGH (IA) | WAIT — present wireframe-level plan |
| **Animation/motion** | MEDIUM | Present, proceed unless objected |
| **Responsive breakpoints** | LOW | Auto (use DESIGN.md defaults) + report |
| **Accessibility fixes** | LOW | Auto-execute (standards-based) + report |
| **Performance optimization** | LOW | Auto-execute + report |
| **Deployment** | MEDIUM | Present plan, proceed unless objected |
| **Content copy** | HIGH (voice) | WAIT — never write final copy without approval |
| **DESIGN.md changes** | HIGH (system) | ALWAYS WAIT — never modify design skill without explicit request |

---

## Quality Gates

| Gate | Standard | Tool | Auto-Fix? |
|---|---|---|---|
| Performance | Lighthouse >90 all categories | Lighthouse CI | Yes (image optimization, code splitting) |
| Accessibility | WCAG 2.1 AA compliant | axe-core | Yes (ARIA labels, contrast) |
| Code quality | TypeScript strict, no lint errors | ESLint + Prettier | Yes (auto-format) |
| Brand compliance | Matches DESIGN.md exactly | Manual + token check | No — HITL if deviation found |
| SEO | Meta tags, OG images, structured data, sitemap | Lighthouse SEO | Yes (meta generation) |
| Responsive | Works at 320px, 768px, 1024px, 1440px+ | Browser preview | No — HITL for layout issues |

---

## Tech Stack (LOCKED for all web projects)

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 14+** (App Router) | SSG for marketing sites, SSR where dynamic |
| Styling | **TailwindCSS 3+** | Utility-first, custom theme from DESIGN.md tokens |
| Language | **TypeScript** (strict mode) | No `any` types, full type safety |
| Components | **shadcn/ui** (base) + custom | Accessible primitives, styled per DESIGN.md |
| Icons | **Lucide React** | Consistent, customizable, tree-shakeable |
| Animation | **Framer Motion** | Declarative, performant, SSR-safe |
| Deployment | **Vercel** | Preview deployments, edge functions |
| Images | **Next/Image** + **sharp** | Auto WebP/AVIF, responsive sizes |
| SEO | **next-seo** | Centralized meta management |
| Analytics | TBD per company | Vercel Analytics or Plausible |

---

## FILM Integration Protocol

When the WEB project needs genAI assets (hero images, product shots, illustrations):

1. Define asset spec in `design/asset-requests/[name].md` (size, format, content, mood)
2. Reference DESIGN.md imagery section for style constraints
3. Generate via FILM workflow (Nano Banana Pro / Higgsfield / GPT Image 2)
4. Export to `public/images/` or `src/assets/`
5. Optimize: compress, generate responsive sizes (640/1024/1440/2560), convert to WebP + AVIF
6. Update DESIGN.md imagery inventory if new asset type introduced

---

## Design Setup Questionnaire (Run ONCE per company)

> When DESIGN.md doesn't exist or is incomplete, the agent runs this interview process.

### Questions Asked (in order):

**1. Brand Foundation**
- Confirm primary/secondary/accent colors from SEMANTIC.md
- Typography: heading font, body font, mono font (or let agent recommend)
- Spacing scale: compact (4px base) | comfortable (8px base) | spacious (12px base)
- Border radius: sharp (0-2px) | soft (4-8px) | round (12-16px) | pill (full)
- Shadow style: none | subtle | elevated | dramatic

**2. Layout & Structure**
- Navigation: top bar | sidebar | hybrid | minimal
- Page width: narrow (960px) | standard (1200px) | wide (1440px) | full-bleed
- Section spacing: tight | balanced | generous
- Grid: 12-column | content-width | asymmetric

**3. Component Style**
- Buttons: solid | outline | ghost | gradient
- Cards: flat | bordered | shadowed | glass-morphism
- Forms: underline | bordered | filled
- CTAs: primary style + hover behavior

**4. Visual Identity**
- Hero sections: full-screen | split (text+image) | centered | video background
- Image treatment: sharp | rounded corners | masked shapes | overlapping
- Illustration style: none | geometric | organic | 3D | genAI
- Background patterns: none | subtle geometric | gradient mesh | texture

**5. Motion & Feel**
- Overall energy: calm/minimal | balanced | dynamic/energetic
- Scroll animations: none | fade-in | parallax | staggered
- Hover states: subtle | transform | glow | color shift
- Page transitions: instant | fade | slide

**6. Content & Voice**
- Headline style: short+punchy | descriptive | question-based
- CTA language: action verbs | benefit-driven | conversational
- Tone: corporate | friendly-professional | bold | minimalist

---

## File Structure (Standard for all web projects)

```
[Company]_WEB/
├── .devin/
│   ├── rules/[company]_web.md       ← Company-specific project rules
│   └── workflows/web.md             ← THIS FILE (universal)
├── design/
│   ├── skills/DESIGN.md             ← THE company design skill (built via questionnaire)
│   ├── assets/                      ← Design assets (logos, imagery source files)
│   └── asset-requests/              ← FILM integration requests
├── src/                             ← Next.js application source
│   ├── app/                         ← App Router pages
│   ├── components/                  ← React components
│   │   ├── ui/                      ← Base UI primitives (shadcn)
│   │   ├── layout/                  ← Header, Footer, Nav, Section wrappers
│   │   └── sections/                ← Page-specific sections
│   ├── lib/                         ← Utilities, helpers
│   └── styles/                      ← Global styles, Tailwind config
├── public/                          ← Static assets
├── memory/                          ← Symlink to Obsidian vault
├── dashboard.md                     ← Project status at a glance
├── AGENTS.md                        ← Agent instructions pointer
└── CLAUDE.md                        ← Same as AGENTS.md (alternate agent)
```

---

## Non-Negotiables

1. **DESIGN.md is REQUIRED before any code is written** — run Design Setup first
2. **Every visual decision goes through HITL** — the user defines style, the agent implements
3. **Brand compliance is non-negotiable** — if it doesn't match DESIGN.md, it doesn't ship
4. **Mobile-first always** — design for 320px, enhance up
5. **Performance budget: LCP < 2.5s, CLS < 0.1, FID < 100ms** — no exceptions
6. **Accessibility is not optional** — WCAG 2.1 AA minimum on every component
7. **DESIGN.md changes require explicit user request** — agent NEVER modifies it autonomously
8. **Content copy is HITL-gated** — agent proposes, user approves every word on the live site

---

## Cross-Project References

| Project | Relationship |
|---|---|
| **EXEC** | Receives requirements, content strategy, pricing/services copy |
| **COMMS** | Sends preview links for client review, receives feedback |
| **FILM** | Receives genAI assets (hero images, product shots, video) |
| **Company SEMANTIC.md** | Source of brand DNA that feeds into DESIGN.md |

---

*Workflow version: 2.0.0 — Universal WEB (HITL-gated design, company-specific DESIGN.md skill)*
*Applies to: ThirdI_WEB, Shaw_WEB, bkWatch_WEB, and all future company web projects*
