/**
 * Build a tenant-only search index from already-sanitized portal manifests.
 * This is shared by live content maintenance and immutable tenant releases.
 */
import { createHash } from "node:crypto";

const clip = (value, length = 180) => value ? String(value).slice(0, length) : undefined;
const boundedId = (prefix, value) => {
  const id = `${prefix}:${value}`;
  return id.length <= 200
    ? id
    : `${prefix}:sha256-${createHash("sha256").update(String(value)).digest("hex")}`;
};

export function buildPortalSearchIndex({ portal, projects, library, aiRoadmap, communications }) {
  const tenant = portal.tenant;
  const base = portal.client.route;
  const entries = [];

  for (const project of projects.projects) {
    entries.push({
      id: project.id,
      type: "project",
      title: project.title,
      excerpt: clip(project.valueStatement),
      project: project.title,
      status: project.statusLabel || project.status,
      format: "project",
      date: projects.asOf,
      route: `${base}/projects/${project.slug}`
    });
    if (project.film) {
      for (const idea of project.film.ideas) {
        const selected = (project.productionLifecycle?.selectedIdeaIds || []).includes(idea.slug) || idea.recommended;
        const ideaRoute = selected
          ? `${base}/projects/${project.slug}#selected-demo`
          : `${base}/projects/${project.slug}/ideas/${idea.slug}`;
        entries.push({
          id: `${project.id}:${idea.slug}`,
          type: "film-idea",
          title: idea.title,
          excerpt: clip(idea.concept),
          project: project.title,
          status: idea.status,
          format: "film knowledge",
          route: ideaRoute
        });
        for (const scene of idea.scenes) {
          entries.push({
            id: `${project.id}:${idea.slug}:${scene.id}`,
            type: "scene",
            title: `${scene.id} · ${scene.title}`,
            excerpt: clip(scene.description || scene.script),
            project: project.title,
            status: scene.status,
            format: "scene",
            route: selected ? `${base}/projects/${project.slug}#${scene.id}` : `${ideaRoute}#${scene.id}`
          });
        }
      }
    }
  }

  for (const record of library.records) {
    entries.push({
      id: record.id,
      type: "library",
      title: record.title,
      excerpt: clip(record.summary),
      category: record.category,
      status: record.status,
      format: record.format,
      date: record.eventDate || record.lastReviewedAt,
      route: `${base}/library/${record.category}/${record.id}`
    });
  }

  for (const capability of aiRoadmap.capabilities) {
    entries.push({
      id: capability.id,
      type: "ai-capability",
      title: capability.name,
      excerpt: clip(capability.outcome),
      category: capability.category,
      status: capability.status,
      format: "ai capability",
      date: capability.researchAsOf,
      route: `${base}/ai-roadmap#${capability.id}`
    });
  }

  for (const email of communications.emails || []) {
    const date = Number.isFinite(email.timestamp) && email.timestamp > 0
      ? new Date(email.timestamp).toISOString().slice(0, 10)
      : undefined;
    entries.push({
      id: boundedId("email", email.id),
      type: "email",
      title: email.subject || "Email",
      excerpt: clip(email.snippet || email.preview),
      category: "communications",
      format: "email",
      ...(date ? { date } : {}),
      route: `${base}/communications/emails`
    });
  }

  for (const meeting of communications.meetings || []) {
    const date = /^\d{4}-\d{2}-\d{2}/.test(meeting.start || "")
      ? meeting.start.slice(0, 10)
      : undefined;
    entries.push({
      id: boundedId("meeting", meeting.id),
      type: "meeting",
      title: meeting.summary || "Meeting",
      excerpt: clip([meeting.startLabel, meeting.contactLabel].filter(Boolean).join(" · ")),
      category: "communications",
      format: "meeting",
      ...(date ? { date } : {}),
      route: `${base}/communications/meetings`
    });
  }

  return {
    schemaVersion: "2.0.0",
    tenant,
    clientSafe: true,
    asOf: portal.asOf,
    entries
  };
}
