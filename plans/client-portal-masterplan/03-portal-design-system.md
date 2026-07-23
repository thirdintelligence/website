# Portal Design System

## Relationship to existing design sources

The public Third i site continues to follow `design/skills/DESIGN.md`. Each client portal follows the client's memory-root `DESIGN.md`, exact approved logo, and official brand colors, with shared usability patterns supplied by the portal platform.

For bkWatch, the canonical blue is `#2B66AE`.

## Design intent

The portal should feel visually stunning, creative, professional, calm, and operational. It must not look like a recolored Third i marketing page or a dashboard made entirely of equal cards.

Hierarchy principles:

1. Work and media receive the strongest emphasis.
2. Required actions are obvious but not alarming.
3. Navigation and chrome recede behind content.
4. Structure is created with spacing, typography, subtle lines, and grouping before containers.
5. Decorative visuals never compete with reading or review.

## Color philosophy

- Main backgrounds are plain near-black in dark mode and plain white in light mode.
- Brand color is used discretely in text, outlines, dividers, icons, focus states, data visualization, and buttons.
- Large saturated client-color page backgrounds are not used.
- Slight surface tints are permitted when they remain visibly neutral.
- Status meaning never relies on color alone.

## bkWatch accent gradient

Every primary accent family is based on a controlled light-blue-to-bkWatch-blue gradient.

Provisional portal tokens, subject to visual mockup validation:

```css
--client-blue: #2B66AE;
--client-blue-light: #72C7F2;
--client-accent-gradient: linear-gradient(135deg, #72C7F2 0%, #2B66AE 100%);
```

The light-blue endpoint is an interface tint, not a newly claimed bkWatch brand color. It must pass contrast testing in each usage.

Gradient use:

- primary button backgrounds;
- selected navigation indicator;
- focus and active outlines;
- important divider strokes;
- progress rails and chart emphasis;
- non-link accent text, using clipped gradient text only when a solid accessible fallback is present;
- card outline highlights on interactive or featured items.

The gradient is not used behind long body copy.

All elements presently treated as blue/light-blue portal accents should draw from this gradient family. Links and raw URLs are the accessibility exception: they may use a solid light-blue or bkWatch-blue token when gradient text would reduce contrast or obscure the underline/focus state.

## Dark mode — default

- Default on first authenticated visit.
- Page background: deep neutral black/charcoal, not blue.
- Primary text on dark surfaces: white.
- Secondary text: light neutral or accessible light blue.
- Links and raw URLs: light blue or gradient treatment with a visible underline/focus state.
- No dark blue or black text appears on dark surfaces.
- Cards remain dark neutral; client color appears in outlines and accents.
- Theme choice is remembered per browser without storing credentials.

## Light mode

- Page background: white.
- Primary text: near-black neutral.
- Secondary text: dark gray.
- Cards: white or extremely subtle neutral tint with blue-gradient outlines where hierarchy requires.
- Links: solid bkWatch blue with underline/focus treatment; gradient text is optional only when contrast remains robust.
- Client blue is not used for full-page backgrounds.

## Cards and content surfaces

Cards are used for discrete selectable objects, not every section.

Use cards for:

- projects;
- film ideas;
- assets and versions;
- Library records in visual browse mode;
- AI recommendations;
- compact action items.

Use other structures for:

- long project narratives;
- scene-by-scene presentations;
- timelines;
- scripts and storyboards;
- Library directories;
- communications feeds;
- comparisons and reports.

Card rules:

- neutral background in both modes;
- optional gradient border using a pseudo-element or mask;
- abstract element placed behind content and marked `aria-hidden="true"`;
- 12–16px radius, aligned with approved client design;
- no default scale animation on dense lists;
- hover emphasizes border/light rather than moving the entire layout;
- a single card must not contain multiple unrelated actions.

## Abstract visual language

The reusable portal template supports a per-client abstract motif library:

- thin orbital lines suggesting connected systems;
- cropped concentric rings for focus and continuity;
- precise data grids for operational structure;
- soft radial light fields using the client gradient;
- angled paths connecting milestones or related records;
- subtle dot matrices for knowledge and data;
- large cropped client-brand letterforms only when approved.

For bkWatch, prefer precise grids, controlled arcs, and connected nodes. Avoid bankruptcy clichés, gavels, distressed imagery, generic AI brains, and excessive glowing blobs.

All abstract assets are CSS/SVG, decorative, low contrast, non-interactive, responsive, and excluded from accessibility trees.

## Navigation

- Sidebar collapses as a unit.
- Sidebar items never expand.
- Active route uses gradient line/icon emphasis plus a text or shape state.
- Inactive items are quieter than main content.
- Top bar stays compact and predictable across all six work areas.
- Utilities keep consistent positions across routes.
- Full-screen mode removes sidebar, utility bar, and global search while retaining presentation controls.

## Typography and spacing

- Use the client's approved type system where defined; otherwise use the shared portal typography approved during tenant setup.
- Main page titles receive generous top and bottom space.
- Desktop content uses a bounded readable width for text and a wider media width for creative presentation.
- Dense data uses smaller type only when touch and reading targets remain accessible.
- Avoid centered long-form text.
- Body copy remains left aligned.

## Motion

- Page transitions: short fade only.
- Composer minimize/restore: spatially continuous motion.
- Timestamp activation: brief highlight and five-second progress indication.
- In-production designer treatment: preserve SVG proportions and optical centering; do not bounce or translate the figure vertically.
- Reduced-motion mode removes nonessential animation and preserves the same static, centered designer frame.

## Accessibility

- Target WCAG 2.2 AA.
- Normal text contrast: at least 4.5:1.
- Large text and meaningful UI graphics: at least 3:1.
- Controls have at least 24×24 CSS-pixel targets; 44×44 is preferred for primary/mobile actions.
- Every gradient control has a readable solid text/icon foreground.
- Focus is visible in both themes and cannot be obscured by sticky chrome.
- Search, filters, comments, media controls, sidebar, and full-screen mode are keyboard operable.
- Mobile layouts reflow without horizontal page scrolling.
- Icons always have accessible names or adjacent text.
