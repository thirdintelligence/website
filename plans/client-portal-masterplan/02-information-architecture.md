# Information Architecture

## Global shell

### Desktop

- Collapsible left sidebar.
- Flat navigation only: Home, Projects, Library, AI Roadmap.
- No accordions, dropdowns, or hidden page groups inside the sidebar.
- Logo and tenant name remain visible in expanded mode.
- Collapsed mode uses accessible labeled icons and tooltips.
- Logout appears above the session indicator at the bottom.
- “Powered by Third i” with the Third i favicon is the final sidebar/footer mark.

### Top utility bar

The top bar is functional, not decorative. Left to right:

1. Mobile sidebar trigger or desktop context title.
2. Contextual breadcrumb or project/Library record title.
3. Optional contextual action: presentation mode, download PDF, or filter control.
4. Add Comment.
5. Global search.
6. Theme toggle.

Search is the rightmost large utility and is absent only in full-screen presentation mode. Utilities with no current function do not render.

### Mobile

- Sidebar becomes an off-canvas drawer with the same five flat links.
- Top utility bar keeps page title, Add Comment, search trigger, and theme toggle.
- Search expands to a full-width overlay/sheet.
- Comment/new-project composer becomes a full-height non-modal working sheet that can minimize to a bottom dock.

## Route map

Examples use bkWatch; the template substitutes the tenant route.

| Route | View |
|---|---|
| `/bkwatch` | Home / Today |
| `/bkwatch/projects` | Project index |
| `/bkwatch/projects/:projectSlug` | Project detail |
| `/bkwatch/projects/:projectSlug/presentation` | Full project presentation |
| `/bkwatch/projects/:projectSlug/ideas/:ideaSlug` | Film idea presentation |
| `/bkwatch/projects/:projectSlug/assets/:assetId` | Protected asset detail/version view |
| `/bkwatch/library` | Library directory |
| `/bkwatch/library/:category` | Filtered category |
| `/bkwatch/library/:category/:recordSlug` | Knowledge record detail |
| `/bkwatch/ai-roadmap` | AI Roadmap |
| `/bkwatch/search?q=` | Search result view/state |

Routes are rendered by the protected portal function. No protected route is a public static HTML file.

## Search model

Search indexes only the authenticated tenant's sanitized content and live operational records.

Indexed record types:

- projects and project sections;
- assets and version labels;
- Library records;
- products, features, partners, and integrations;
- film ideas, scenes, storyboards, and scripts;
- client-visible comments and meeting/email summaries;
- AI Roadmap categories and recommendations.

Prompts, internal notes, secrets, raw email bodies not approved for the client, and other-tenant records are never indexed.

Search result cards show type, title, matched excerpt, project/category, date, and status. Results link to the canonical record and may open the relevant timestamp or section anchor.

## Filter model

Filters are facets derived from fields that actually exist in the current result set. They are not hardcoded promises.

Approved facets:

- Project: named project or General.
- Status: only statuses present in the indexed records, plus General where meaningful.
- Format: fact, product, feature, integration, comment, email, meeting, asset, film knowledge, report, and other confirmed formats.
- Date: exact range and useful preset ranges when records have dates.
- Category/subcategory: only within Library and AI Roadmap contexts.

If a field is missing from any record type, that record receives a truthful `general` or `unknown` normalization only when semantically valid. The UI never implies a precise filter value that was not sourced.

## Canonical ownership

| Information | Canonical client view |
|---|---|
| Current relationship and actions | Home |
| Project state and creative work | Projects |
| Completed project outcomes | Project detail → Reports & outcomes |
| Assets and versions | Project detail → Assets |
| Brand/product/integration knowledge | Library |
| Communication history | Library → Communication |
| Film preferences and learned patterns | Library → Film Knowledge |
| Practical AI adoption guidance | AI Roadmap |
| Comment completion | Project/Library record plus Home completion feed |

Information may be summarized elsewhere, but every record has one canonical detail route.

## No separate approvals page

Decisions, blockers, comments, and actions remain contextual:

- project decisions live inside their project;
- Library corrections live on the relevant knowledge record;
- Home aggregates open blockers and completed comments;
- OS aggregates every action for the owner.

This avoids forcing clients to understand a separate workflow vocabulary.
