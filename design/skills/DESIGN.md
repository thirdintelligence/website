---
type: skill
scope: thirdi-web
version: 1.0.0
status: COMPLETE
company: Third i
created: 2026-07-06
updated: 2026-07-07
---

# DESIGN.md — Third i Visual Design System

> **THE design skill for Third i's website.** This file is the single source of truth for every visual decision. The agent reads this before writing ANY code. Nothing ships that contradicts this document.
>
> **Status: COMPLETE — all design decisions locked via HITL interview (2026-07-07).**

---

## 1. Brand Foundation

### Color Palette (from THIRD_I_SEMANTIC.md — CONFIRMED)

| Role | Color | Hex | Usage |
|---|---|---|---|
| **Primary 1** | Lavender | `#B8C0FF` | Backgrounds, primary surfaces, brand accent |
| **Primary 2** | Deep Purple | `#2E0A4F` | Text on light, headers, hero backgrounds |
| **Accent 1** | Electric Violet | `#BF00FF` | Interactive elements, links, highlights |
| **Accent 2** | Midnight | `#1B0033` | Dark mode backgrounds, depth |
| **Accent 3** | Ghost White | `#F8F2FF` | Light backgrounds, cards, breathing space |
| **Bright 1** | Hot Pink | `#FF4FD8` | CTAs, attention-grabbers, badges |
| **Bright 2** | Warm Gold | `#FFD166` | Success states, premium indicators |
| **Bright 3** | Mint Green | `#7CFFB2` | Active states, positive indicators |

### Semantic Colors

| Role | Light Mode | Dark Mode |
|---|---|---|
| **Background** | `#F8F2FF` (ghost white) | `#1B0033` (midnight) |
| **Surface** | `#FFFFFF` | `#2E0A4F` (deep purple) |
| **Text Primary** | `#2E0A4F` | `#F8F2FF` |
| **Text Secondary** | `#5A4B6B` | `#B8C0FF` |
| **Border** | `#E8E0F0` | `#4A2D6B` |
| **Interactive** | `#BF00FF` | `#BF00FF` |
| **CTA** | `#FF4FD8` | `#FF4FD8` |

### Typography (LOCKED)

| Role | Font | Rationale |
|---|---|---|
| **Headings** | Space Grotesk | Geometric, technical, distinctive character — matches innovative brand |
| **Body** | Inter | Supremely legible, professional, web-native — the industry standard |
| **Mono** | JetBrains Mono | Clean, technical credibility — for code snippets and data |

### Type Scale

| Element | Size (mobile) | Size (desktop) | Weight | Line Height |
|---|---|---|---|---|
| **Display (hero)** | 36px | 64px | 700 | 1.1 |
| **H1** | 30px | 48px | 700 | 1.2 |
| **H2** | 24px | 36px | 600 | 1.25 |
| **H3** | 20px | 28px | 600 | 1.3 |
| **H4** | 18px | 22px | 600 | 1.35 |
| **Body** | 16px | 18px | 400 | 1.6 |
| **Small** | 14px | 14px | 400 | 1.5 |
| **Caption** | 12px | 12px | 500 | 1.4 |

### Spacing Scale (LOCKED — Comfortable / 8px base)

```
xs: 4px    sm: 8px    md: 16px    lg: 24px
xl: 32px   2xl: 48px  3xl: 64px   4xl: 96px   5xl: 128px
```

### Border Radius (LOCKED — Soft / 8px)

```
none: 0    sm: 4px    md: 8px    lg: 12px    xl: 16px    full: 9999px
```

### Shadow System (LOCKED — Subtle)

```
shadow-sm: 0 1px 2px rgba(46, 10, 79, 0.05)
shadow-md: 0 4px 6px rgba(46, 10, 79, 0.07)
shadow-lg: 0 10px 15px rgba(46, 10, 79, 0.10)
shadow-xl: 0 20px 25px rgba(46, 10, 79, 0.12)
shadow-glow: 0 0 20px rgba(191, 0, 255, 0.15)   /* for glass cards + CTA hover */
```

---

## 2. Component Patterns

### Buttons (LOCKED)

| Variant | Style | Hover |
|---|---|---|
| **Primary CTA** | Gradient (`#BF00FF` → `#FF4FD8`) + white text | Glow intensifies + scale(1.03) |
| **Secondary** | Outline (electric violet `#BF00FF` border) + violet text | Fills with violet, text goes white |
| **Tertiary** | Ghost (no border/bg, violet text) | Underline appears |

**Sizes:** sm (32px h) · md (40px h) · lg (48px h) · xl (56px h)
**Radius:** `full` (pill shape) for all buttons
**Font:** Space Grotesk, weight 600, size matches button height proportion

### Cards (LOCKED — Glass-morphism)

```css
/* Glass card base */
background: rgba(248, 242, 255, 0.08);       /* ghost white at 8% */
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(184, 192, 255, 0.15);  /* lavender border */
border-radius: 12px;
box-shadow: 0 0 20px rgba(191, 0, 255, 0.08); /* subtle violet glow */

/* Hover state */
border-color: rgba(191, 0, 255, 0.3);         /* glow border brightens */
box-shadow: 0 0 30px rgba(191, 0, 255, 0.15);
transform: scale(1.02);
```

**Dark mode variant:** Background shifts to `rgba(27, 0, 51, 0.6)` (midnight at 60%)

### Navigation (LOCKED — Glass Top Bar)

- **Layout:** Fixed top bar, blurs content behind on scroll
- **Left:** Third i logo (icon mark on mobile, full on desktop)
- **Center/Right:** Nav links (Home, Services, Portfolio, About)
- **Far Right:** CTA button ("Start a Project" — primary gradient style)
- **Mobile:** Hamburger → full-screen overlay with glass background
- **Scroll behavior:** Transparent at top, glass-morphism activates on scroll (>50px)

```css
/* Nav glass effect (active on scroll) */
background: rgba(27, 0, 51, 0.7);
backdrop-filter: blur(16px);
border-bottom: 1px solid rgba(184, 192, 255, 0.1);
```

---

## 3. Page Templates

### Hero Section Style (LOCKED — Split 60/40)

- **Layout:** 60% text (left) + 40% visual (right)
- **Text side:** Display headline + subheadline (body size) + primary CTA + secondary CTA
- **Visual side:** GenAI-generated creative or animated element (Framer Motion)
- **Background:** Gradient mesh (deep purple → midnight → lavender hints)
- **Height:** ~85vh (not full-screen, shows content peek below)

### Section Layout Pattern

**Recommended (based on 5-page architecture):**
```
[Hero: full-width, brand gradient/image]
[Services: 3-4 card grid, icon + title + description]
[Portfolio: masonry or horizontal scroll, large images]
[How We Work: numbered steps or timeline]
[CTA: full-width, contrasting background, single clear action]
[Footer: links + contact + social]
```

---

## 4. Imagery & Assets

### Photo/Image Style (LOCKED)

| Decision | Value |
|---|---|
| **Image treatment** | Rounded corners (12px — `lg` token) + subtle shadow |
| **Image source** | GenAI (via FILM workflow) — proves the AI-native workflow IS the product |
| **Image mood** | Creative/vibrant — matches brand energy, never stock-photo generic |
| **Portfolio images** | Full-bleed or contained with rounded corners, depending on context |
| **Background patterns** | Gradient mesh (lavender `#B8C0FF` → deep purple `#2E0A4F` transitions) |

### Icon System (CONFIRMED)

- **Library:** Lucide React (tree-shakeable, consistent stroke width)
- **Size:** 20px (inline), 24px (standalone), 32px+ (feature icons)
- **Style:** Stroke, 1.5px width, matches text color
- **Custom icons:** Only if Lucide doesn't cover it — maintain same stroke weight

### Logo Usage

- **Source:** `~/Desktop/Third i/Website/Images/Logos/`
- **Variants needed:** Full logo, icon mark, dark/light versions
- **Minimum size:** 32px height for icon mark, 120px width for full logo
- **Clear space:** 1× logo height on all sides

---

## 5. Animation & Motion

### Overall Energy (LOCKED — Balanced)

Purposeful motion that enhances UX without distracting. Every animation must have a reason.

### Specific Motion Patterns (LOCKED)

| Element | Implementation |
|---|---|
| **Scroll animations** | Fade-in + translateY(20px → 0) · staggered 50ms between siblings |
| **Hover states (cards)** | scale(1.02) + shadow-lg + border glow brightens |
| **Hover states (CTAs)** | Glow intensifies + scale(1.03) |
| **Page transitions** | Fade (200ms ease-out) |
| **Loading states** | Skeleton shimmer (glass-morphism shimmer effect) |
| **Nav appearance** | Fade-in backdrop-filter on scroll (150ms) |

### Motion Tokens (Framer Motion)
```
duration.fast: 150ms
duration.normal: 300ms
duration.slow: 500ms
easing.default: [0.25, 0.1, 0.25, 1]     // cubic-bezier
easing.spring: { stiffness: 300, damping: 30 }
easing.bounce: { stiffness: 400, damping: 25 }
stagger.children: 50ms
```

---

## 6. Responsive Strategy (DEFAULTS — confirm or override)

| Breakpoint | Width | Layout Adjustment |
|---|---|---|
| **Mobile** | 320px – 767px | Single column, stacked, larger touch targets |
| **Tablet** | 768px – 1023px | 2-column where appropriate, condensed nav |
| **Desktop** | 1024px – 1439px | Full layout, all features visible |
| **Wide** | 1440px+ | Max-width container (1200px), centered |

- **Approach:** Mobile-first (base styles = mobile, enhance up)
- **Container max-width:** 1200px (centered with auto margins)
- **Gutters:** 16px (mobile), 24px (tablet), 32px (desktop)

---

## 7. Accessibility (AUTO — standards-based, no HITL needed)

- **Contrast:** WCAG AA minimum (4.5:1 text, 3:1 large text/UI)
- **Focus states:** Visible focus ring (2px `#BF00FF` outline, 2px offset)
- **Reduced motion:** Respect `prefers-reduced-motion` — disable all animations
- **Screen readers:** Semantic HTML, ARIA labels on interactive elements
- **Keyboard navigation:** Full tab order, escape closes modals, arrow keys in menus
- **Alt text:** Required on all images, descriptive and concise
- **Color alone:** Never use color as the only indicator (add icons/text)

---

## 8. Dark Mode Strategy

- **Default:** System preference (`prefers-color-scheme`)
- **Toggle:** Available in header (sun/moon icon)
- **Implementation:** CSS variables + TailwindCSS `dark:` variant
- **Brand in dark mode:** Midnight `#1B0033` base → lavender `#B8C0FF` accents → same CTAs

---

## 9. Content & Voice (LOCKED)

| Decision | Value |
|---|---|
| **Headline style** | Short + punchy — "Film at the Speed of Thought" / "Your Workflow, Evolved" |
| **CTA language** | Action verbs — "Start a Project" / "See Our Work" / "Book a Call" |
| **Body tone** | Friendly-professional — confident without cold, human without casual |
| **Never** | Robotic, overselling, buzzword salad, clever-for-clever's-sake |
| **Proof points** | Concrete outcomes and metrics, not vague promises |
| **Pricing on site** | NO — drives to conversation ("Every project is scoped to your goals") |

---

## Tailwind Theme Config (Ready to implement)

```typescript
// tailwind.config.ts — theme.extend
const theme = {
  extend: {
    colors: {
      // Primary
      lavender: '#B8C0FF',
      'deep-purple': '#2E0A4F',
      // Accents
      violet: '#BF00FF',
      midnight: '#1B0033',
      'ghost-white': '#F8F2FF',
      // Bright
      'hot-pink': '#FF4FD8',
      gold: '#FFD166',
      mint: '#7CFFB2',
      // Semantic
      border: 'rgba(232, 224, 240, 1)',       // light mode
      'border-dark': 'rgba(74, 45, 107, 1)',  // dark mode
    },
    fontFamily: {
      heading: ['Space Grotesk', 'sans-serif'],
      body: ['Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    boxShadow: {
      sm: '0 1px 2px rgba(46, 10, 79, 0.05)',
      DEFAULT: '0 4px 6px rgba(46, 10, 79, 0.07)',
      lg: '0 10px 15px rgba(46, 10, 79, 0.10)',
      xl: '0 20px 25px rgba(46, 10, 79, 0.12)',
      glow: '0 0 20px rgba(191, 0, 255, 0.15)',
      'glow-lg': '0 0 30px rgba(191, 0, 255, 0.25)',
    },
    animation: {
      'fade-in': 'fadeIn 0.3s ease-out forwards',
      'fade-up': 'fadeUp 0.4s ease-out forwards',
      shimmer: 'shimmer 2s infinite',
    },
    keyframes: {
      fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      fadeUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
    },
  },
};
```

---

## Status & Completion

| Section | Status |
|---|---|
| Colors | ✅ LOCKED |
| Typography | ✅ LOCKED — Space Grotesk / Inter / JetBrains Mono |
| Spacing | ✅ LOCKED — 8px base (comfortable) |
| Border Radius | ✅ LOCKED — Soft (8px default) |
| Shadows | ✅ LOCKED — Subtle (purple-tinted) |
| Buttons | ✅ LOCKED — Gradient CTA + Outline + Ghost |
| Cards | ✅ LOCKED — Glass-morphism |
| Navigation | ✅ LOCKED — Glass top bar |
| Hero | ✅ LOCKED — Split 60/40 |
| Imagery | ✅ LOCKED — GenAI, rounded corners, gradient mesh backgrounds |
| Animation | ✅ LOCKED — Balanced (fade-up stagger, scale hovers, glow CTAs) |
| Responsive | ✅ LOCKED — Mobile-first, 1200px container |
| Accessibility | ✅ LOCKED — WCAG AA, focus rings, reduced-motion |
| Dark Mode | ✅ LOCKED — System preference + toggle |
| Content Voice | ✅ LOCKED — Short+punchy headlines, action CTAs, friendly-professional |

**All sections complete. This document is now the source of truth for all Third i web design decisions.**

---

*DESIGN.md version: 1.0.0 — Third i (COMPLETE — locked 2026-07-07 via HITL interview)*
