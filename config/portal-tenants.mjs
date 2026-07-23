/**
 * Shared client-portal tenant registry.
 *
 * This file records namespace contracts only. A planned tenant is not live
 * until `status` is changed to "active" after content, auth, data, media, and
 * release approval. Runtime aggregation reads the active list from here so a
 * future tenant cannot be enabled in one subsystem and forgotten in another.
 */
export const REQUIRED_TENANT_MANIFESTS = Object.freeze([
  "portal.json",
  "home.json",
  "projects.json",
  "library.json",
  "ai-roadmap.json",
  "roadmap.json",
  "invoicing.json",
  "communications.json",
  "search-index.json"
]);

export const PORTAL_TENANTS = Object.freeze({
  bkwatch: Object.freeze({
    key: "bkwatch",
    displayName: "BankruptcyWatch",
    route: "/bkwatch",
    status: "active",
    contentDir: "content/clients/bkwatch",
    designAuthority: "memory/BKWATCH/DESIGN.md",
    passwordHashEnv: "BKWATCH_PORTAL_PASSWORD_HASH",
    sessionCookie: "thirdi_bkwatch_session",
    csrfCookie: "thirdi_bkwatch_csrf",
    cookiePath: "/bkwatch",
    operationalPrefix: "tenants/bkwatch/",
    mediaPrefix: "tenants/bkwatch/media/",
    searchIndex: "content/clients/bkwatch/search-index.json",
    ownerActionsEnabled: true,
    notificationsEnabled: true
  }),
  shaw: Object.freeze({
    key: "shaw",
    displayName: "Shaw Systems",
    route: "/shaw",
    status: "planned",
    contentDir: "content/clients/shaw",
    designAuthority: "memory/SHAW/DESIGN.md",
    passwordHashEnv: "SHAW_PORTAL_PASSWORD_HASH",
    sessionCookie: "thirdi_shaw_session",
    csrfCookie: "thirdi_shaw_csrf",
    cookiePath: "/shaw",
    operationalPrefix: "tenants/shaw/",
    mediaPrefix: "tenants/shaw/media/",
    searchIndex: "content/clients/shaw/search-index.json",
    ownerActionsEnabled: false,
    notificationsEnabled: false
  })
});

export const ACTIVE_PORTAL_TENANTS = Object.freeze(
  Object.values(PORTAL_TENANTS).filter((tenant) => tenant.status === "active").map((tenant) => tenant.key)
);

export const OWNER_ACTION_TENANTS = Object.freeze(
  Object.values(PORTAL_TENANTS)
    .filter((tenant) => tenant.status === "active" && tenant.ownerActionsEnabled)
    .map((tenant) => tenant.key)
);

export const NOTIFICATION_TENANTS = Object.freeze(
  Object.values(PORTAL_TENANTS)
    .filter((tenant) => tenant.status === "active" && tenant.notificationsEnabled)
    .map((tenant) => tenant.key)
);

export function getPortalTenant(key) {
  return PORTAL_TENANTS[key] || null;
}

export function isActivePortalTenant(key) {
  return ACTIVE_PORTAL_TENANTS.includes(key);
}
