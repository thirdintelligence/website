# Research Decisions

Research date: 2026-07-16

## 1. Professional portal visual patterns

### Finding

Information-dense products benefit when navigation and support chrome recede, central work receives the highest contrast, and separators are softened rather than multiplied. Linear's 2026 refresh explicitly reduced sidebar prominence, icon treatments, and unnecessary borders to preserve density without visual noise. [Linear design refresh](https://linear.app/now/behind-the-latest-design-refresh)

### Decision

- Keep a stable sidebar and utility bar, but make them visually quieter than project/media content.
- Use fewer cards, icons, borders, and badges.
- Create hierarchy with spacing, type, grouped surfaces, and subtle lines.
- Use client-branded abstract elements as low-contrast structure, not full-color backgrounds.
- Treat the top utility bar as a predictable workspace, not a decorative header.

## 2. Abstract card visuals

### Decision

Use a reusable per-client motif system made from CSS/SVG grids, arcs, nodes, connection paths, and radial light fields. Motifs should:

- be tied to the client's brand geometry and industry;
- be cropped asymmetrically to avoid generic centered decoration;
- sit behind content at low contrast;
- never convey required data;
- remain `aria-hidden`;
- disable expensive animation under reduced motion or low-power/mobile conditions.

For bkWatch, use controlled data grids, connected nodes, and cropped rings. Do not use generic AI brains, gavels, courtroom imagery, or saturated blue page fills.

## 3. Pricing communication

### Finding

The IPA's 2026 Pricing Playbook describes input-, output-, outcome-, and hybrid pricing and recommends choosing based on risk, flexibility, scope stability, commercial fluency, and measurability. It also notes that AI is disrupting traditional agency pricing and increasing the need to communicate value intentionally. [IPA Pricing Playbook summary](https://ipa.co.uk/news/pricing-playbook/)

### Decision

Use a hybrid communication model:

- Lead with outcome, scope, and deliverables.
- Use hours as evidence of production effort and scope risk, not as the only statement of value.
- Show currency only when it is confirmed by an agreement or approved estimate.
- For evolving creative work, show an effort range and the scope assumptions that drive it.
- Before additional work begins, show the changed scope, expected additional effort, price/estimate impact, and approval state.
- Keep commercial context inside the relevant project.
- Do not create a general pricing page in the retention portal.
- Do not show a running global hours counter in the top bar.

Recommended demo-to-full-film explanation:

> The current demo required **[confirmed hours]** to establish the visual system and prove the direction. A complete film adds **[confirmed scope differences]**, refinement passes, product-accuracy review, motion continuity, sound, and final QC. Based on the approved scope, Third i estimates **[effort range]** and will present **[confirmed price or pricing model]** before production begins.

This is transparent without training the client to equate faster AI-assisted delivery with lower value.

## 4. AI draft disclosure

### Finding

Partnership on AI recommends clear disclosure of synthetic media capabilities and limitations and recognizes direct disclosures such as labels, context notes, and disclaimers. [Responsible Practices for Synthetic Media](https://syntheticmedia.partnershiponai.org/)

### Decision

Use direct, contextual disclosure near draft media. Avoid defensive language and avoid implying that visible defects are acceptable. The notice should define the review goal:

> **AI-assisted production draft — not final.** The storyboard and script describe the intended result. Current media is an exploration used to identify major visual, motion, and product-accuracy issues before refinement. Please evaluate the draft against that target; details already specified in the storyboard remain planned for the final work.

Use three visible concepts:

- creation method: AI-assisted;
- lifecycle state: production draft, not final;
- review instruction: compare against the storyboard goal and focus on major gaps.

## 5. Timestamped media comments

### Finding

Frame.io distinguishes single-frame, range-based, and anchored comments. A current single-frame comment links feedback to the active frame, and range comments identify a full segment. [Frame.io commenting guidance](https://help.frame.io/en/articles/9090684-getting-started-how-do-i-leave-comments)

### Decision

- Capture the current timestamp by default.
- Represent the approved five-second review segment as an explicit range.
- Let the user remove the timestamp for general asset comments.
- On activation, seek, highlight, and play/emphasize the range.
- Keep freeform range handles and pinned visual annotations for the future.

## 6. Persistent composer accessibility

### Finding

The requested composer must allow interaction with the site behind it, so it should not be implemented as a modal dialog. W3C guidance says modal dialogs make the background inert and contain keyboard focus; that conflicts with navigating the portal while composing. [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

### Decision

- Build a non-modal workspace composer.
- Escape minimizes instead of silently discarding.
- Provide keyboard movement/restore behavior.
- Provide a visible destructive Delete draft action with confirmation.
- On mobile, use a full-height sheet with minimize/restore rather than a draggable floating window.

## 7. Live data push

### Finding

Netlify site-scoped Blobs persist across deploys. Strong consistency is available when immediate reads after updates matter. Netlify documents Functions + Blobs for validated user uploads and operational data. [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)

Netlify Background Functions return immediately, can run asynchronously, and retry failed invocations; they are appropriate for notification work that should not block the client transaction. [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/)

Scheduled Functions run only on published deploys and have a 30-second limit; they are suitable for reconciliation, not required for each comment. [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)

### Decision

- Direct API + strong operational store for comments/completion.
- Background job for email notification.
- Local idempotent sync for the symlinked vault.
- Scheduled reconciliation only as a safety net.
- No three-times-daily agent automation for routine comment propagation.
- Arbitrary memory prose never auto-publishes.

## 8. Upload architecture

### Finding

Netlify supports user-generated uploads to Blobs, but synchronous binary payloads are effectively limited to roughly 4.5 MB after encoding. Netlify Blobs objects can be much larger, but safely ingesting or proxying a 1–2 GiB client video through a synchronous function remains the bottleneck. [Netlify function limits](https://docs.netlify.com/build/functions/configuration/) and [Netlify upload pattern](https://developers.netlify.com/guides/user-generated-uploads-with-netlify-blobs/)

Cloudflare R2 Standard costs $0.015/GB-month after a 10 GB-month free tier and direct egress is free. It supports S3-compatible presigned URLs, multipart upload, and objects well above the portal's 2 GiB limit. [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [uploads](https://developers.cloudflare.com/r2/objects/upload-objects/), and [presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

Backblaze B2 has lower raw storage pricing, but its free egress is limited relative to average storage. The saving at 100–240 GB is under roughly $2 per month, while R2 avoids download-volume surprises. [Backblaze B2 pricing](https://www.backblaze.com/cloud-storage/pricing) and [transaction pricing](https://www.backblaze.com/cloud-storage/transaction-pricing)

### Decision

- Use Netlify Blobs for live JSON operational state.
- Use Cloudflare R2 Standard for private client-visible media, with a 2 GiB per-file product limit.
- Send large uploads/downloads directly between browser/local tooling and R2; Netlify only validates and signs.
- Use multipart upload above 100 MiB, default 64 MiB parts, and preserve resumable state.
- Never expose a storage token to the browser.
- All downloads remain tenant-authorized.
- Re-evaluate Backblaze B2 only after 1 TB retained media and measured egress stays below its allowance.

The complete cost model and implementation contract is in `18-asset-storage-delivery.md`.

## 9. AI Roadmap research sources

### Finding

FutureTools is useful for discovery and reports both editorial picks and community-ranked tools, but popularity is not proof of client fit. [FutureTools](https://futuretools.io/)

Artificial Analysis publishes methodology for comparing intelligence, speed, price, and modality-specific capability, and warns that an aggregate metric may not apply to every use case. [Artificial Analysis methodology](https://artificialanalysis.ai/methodology)

Arena rankings aggregate human preference battles and include confidence/rank spread, making them useful as another signal rather than a sole selection rule. [Arena leaderboard guide](https://help.arena.ai/articles/7011479247-how-to-see-ai-rankings-in-arena-leaderboards-2-0-wip)

### Decision

- FutureTools discovers candidates.
- Official vendor sources verify capabilities, pricing, security, and terms.
- Artificial Analysis contributes independent performance/cost data.
- Arena contributes human-preference evidence.
- Third i makes the final task-specific recommendation with as-of date and client constraints.

## 10. Department consolidation

### Decision

Consolidate the owner OS into six operating groups: Brand, Finance, Growth Strategy, Services & Delivery, People & Risk, and Communications. Preserve original memory files until a migration audit confirms indexes, links, and provenance. This is a proposed memory reorganization and requires explicit HITL before mutation.
