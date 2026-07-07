---
trigger: always_on
scope: thirdi-web
version: 2.0.0
project: Third i WEB
company: Third i
updated: 2026-07-06
---

# Third i WEB — Project Rules (Company-Specific)

> **Third i's own website.** The agency's public face — must demonstrate the AI-native workflow's power. Every visitor should think: "If their own site is this good, imagine what they'd build for us."
>
> **This file = company-specific constraints.** The universal process lives in `.devin/workflows/web.md`. The visual system lives in `design/skills/DESIGN.md`.

---

## 1. Site Purpose & Positioning

- **Primary goal:** Convert qualified leads ($5K+ engagements) into discovery calls
- **Secondary goal:** Showcase the AI-native workflow as the competitive moat
- **Audience:** B2B decision-makers (VP+) at mid-market companies seeking creative/marketing services
- **Proof of concept:** The site itself IS the portfolio piece — it demonstrates what Third i delivers
- **Differentiator:** "Not a traditional agency. Not an AI gimmick. A workflow that gets smarter with every project."

---

## 2. Site Architecture (Pages)

| Page | Purpose | Priority |
|---|---|---|
| **Home** | Hero + value prop + service overview + social proof + CTA | P0 |
| **Services** | AI Film Production, Web Design+Dev, Strategic Marketing, AI Consulting | P0 |
| **Portfolio** | Shaw Film showcase, bkWatch Film showcase, web project showcase | P1 |
| **About** | Founder story, AI-native philosophy, how we work | P1 |
| **Contact** | Discovery call booking, inquiry form | P0 |

### Content Strategy
- **Headlines:** Short, punchy, confident — never clever for clever's sake
- **Body copy:** Benefit-driven, concrete outcomes, no buzzword salad
- **CTAs:** Action verbs — "Start a Project", "See Our Work", "Book a Call"
- **Social proof:** Client logos, project metrics, testimonials (when available)
- **Pricing:** NOT on site — drives to conversation ("Every project is scoped to your goals")

---

## 3. Technical Constraints

| Constraint | Requirement |
|---|---|
| **Framework** | Next.js 14+ (App Router, SSG for all pages) |
| **Styling** | TailwindCSS with custom theme from DESIGN.md tokens |
| **TypeScript** | Strict mode, no `any` types |
| **Deployment** | Netlify (auto-deploy on push to `main`) |
| **Domain** | [thirdi.net](https://thirdi.net) (live, Cloudflare DNS) |
| **GitHub Repo** | [thirdintelligence/website](https://github.com/thirdintelligence/website) |
| **Netlify Site ID** | `a790b3a4-8c53-420a-920c-f274c0ec6e3d` |
| **Performance** | LCP < 2.5s, CLS < 0.1, FID < 100ms, Lighthouse >90 |
| **SEO** | next-seo, structured data, OG images per page |
| **Analytics** | Netlify Analytics or Plausible (privacy-first, no cookies) |
| **Forms** | Netlify Forms or server actions (no third-party form services) |
| **Images** | Next/Image with WebP + AVIF, responsive srcset |
| **Fonts** | Self-hosted via `next/font` (no external font requests) |

---

## 4. Design Skill Reference

- **DESIGN.md location:** `design/skills/DESIGN.md`
- **Brand source:** `memory/THIRD_I/THIRD_I_SEMANTIC.md` §1 + §3
- **Color palette (from memory):**
  - Primary: `#B8C0FF` (lavender) + `#2E0A4F` (deep purple)
  - Accents: `#BF00FF` (electric violet), `#1B0033` (midnight), `#F8F2FF` (ghost white)
  - Bright: `#FF4FD8` (hot pink), `#FFD166` (warm gold), `#7CFFB2` (mint green)
- **Tone:** Professional, confident, innovative, human — never robotic, never overselling
- **Visual energy:** Confident competence — let results speak

> **All other design decisions (typography, spacing, components, animation) are defined in DESIGN.md.** These rules only provide the brand DNA source. DESIGN.md is the implementation.

---

## 5. Content Sources

| Content | Source | Notes |
|---|---|---|
| Service descriptions | `memory/THIRD_I/THIRD_I_EXEC/EXEC_WORKING.md` §Services | Extract from service catalog |
| Pricing philosophy | `memory/THIRD_I/THIRD_I_EXEC/EXEC_GROWTH_STRATEGY.md` | Value-based, three tiers, never hourly |
| Portfolio assets | Shaw FILM projects + bkWatch FILM projects | Via FILM integration protocol |
| Founder bio | `memory/PERSONA.md` | Justin Brannon identity |
| Company story | `memory/THIRD_I/THIRD_I_SEMANTIC.md` | Brand DNA, mission, positioning |
| R&D capabilities | `~/Desktop/Third i/R&D/agentic-ai/statements/` | Client-facing capability docs |

---

## 6. Legacy Site Context

- **Previous site:** `~/Desktop/Third i/Website/` (vanilla HTML/CSS/JS + Three.js)
- **What carries forward:** Logo assets (`Images/Logos/`), brand name styling
- **What does NOT carry forward:** Tech stack, design patterns, 3D room concept, code
- **Migration:** Complete rebuild — no code reuse from legacy

---

## 7. Cross-Project References

| Project | What WEB Provides | What WEB Receives |
|---|---|---|
| **Third i EXEC** | Deployed site, analytics, leads | Requirements, content strategy, service copy |
| **Third i COMMS** | Preview links, status updates | Change requests, client feedback |
| **Shaw Film** | Portfolio showcase | GenAI video assets (embedded/linked) |
| **bkWatch Film** | Portfolio showcase | GenAI video assets |
| **R&D** | Capability highlights | Research artifacts for display |

---

## 8. Deployment Rules

- **Production:** Auto-deploy on `main` branch push → Netlify production → [thirdi.net](https://thirdi.net)
- **Preview:** Every PR gets a Netlify deploy preview URL → share for HITL review
- **Environment variables:** Managed in Netlify dashboard (never in repo)
- **Branch naming:** `feature/[component]`, `fix/[issue]`, `content/[page]`
- **Commits:** Conventional commits (`feat:`, `fix:`, `style:`, `content:`)

---

## 9. Non-Negotiables (Third i Specific)

1. **The site IS the proof of concept** — it must be best-in-class or we don't ship
2. **No placeholder content in production** — every word, image, and interaction must be final
3. **Performance is marketing** — a slow site undermines the "AI-native = fast" message
4. **Mobile-first** — 60%+ of B2B discovery happens on mobile
5. **Accessibility is non-negotiable** — demonstrates professionalism
6. **Dark mode support** — Third i's brand palette works beautifully in dark mode
7. **No third-party tracking scripts** — privacy-first, Vercel Analytics only

---

*Rules version: 2.0.0 — Third i WEB (company-specific, references universal workflow + DESIGN.md skill)*
