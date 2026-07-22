/* Loads sanitized tenant manifests plus tenant-authorized operational state.
   Preview mode uses bundled sample records; live mode uses the protected API. */

/** Read a non-executed <script type="application/json"> block by id (CSP-safe). */
function readJsonScript(id) {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!el) return null;
  try { return JSON.parse(el.textContent || "null"); } catch { return null; }
}

export function getConfig() {
  // Live mode injects #portal-config from the authenticated function; preview
  // uses window.__PORTAL_CONFIG__. Inline config is CSP-safe (data, not script).
  const c = readJsonScript("portal-config") || (typeof window !== "undefined" && window.__PORTAL_CONFIG__) || {};
  return {
    tenant: c.tenant || "bkwatch",
    contentBase: (c.contentBase || "/content/clients/bkwatch/").replace(/\/?$/, "/"),
    routeBase: c.routeBase || "/bkwatch",
    mode: c.mode || "preview",
    sampleLive: c.sampleLive || null,
    csrfToken: c.csrfToken || null
  };
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

/** Fetch live operational state (comments + rotating CSRF token). Live mode only. */
export async function fetchLive(cfg) {
  try {
    const res = await fetch(cfg.routeBase + "/api/live", { headers: { accept: "application/json" }, credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/** POST/PATCH/DELETE JSON to a tenant API with CSRF + credentials. */
export async function apiSend(cfg, path, method, body) {
  try {
    const res = await fetch(cfg.routeBase + path, {
      method, credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": cfg.csrfToken || "" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, data } : { ok: false, error: data.error || `http_${res.status}` };
  } catch { return { ok: false, error: "network" }; }
}

export async function loadPortalData() {
  const cfg = getConfig();
  // Live: manifests are embedded in the authenticated HTML (client-confidential,
  // never served as public static files). Preview: fetched from the local content dir.
  const embedded = readJsonScript("portal-data");
  let portal, home, projects, library, aiRoadmap, roadmap, invoicing, communications, search;
  if (embedded) {
    ({ portal, home, projects, library, aiRoadmap, roadmap, invoicing, communications, search } = embedded);
  } else {
    const b = cfg.contentBase;
    [portal, home, projects, library, aiRoadmap, roadmap, invoicing, communications, search] = await Promise.all([
      getJSON(b + "portal.json"),
      getJSON(b + "home.json"),
      getJSON(b + "projects.json"),
      getJSON(b + "library.json"),
      getJSON(b + "ai-roadmap.json"),
      getJSON(b + "roadmap.json"),
      getJSON(b + "invoicing.json"),
      getJSON(b + "communications.json"),
      getJSON(b + "search-index.json")
    ]);
  }

  // Operational (live) records.
  //  • live mode  → real tenant-authorized operational API (comments + CSRF)
  //  • preview    → a small, clearly-sample seed so the UI is reviewable offline
  let live = { comments: [], projectRequests: [] };
  if (cfg.mode === "live") {
    const l = await fetchLive(cfg);
    if (l) {
      live.comments = l.comments || [];
      live.projectRequests = l.projectRequests || [];
      cfg.csrfToken = l.csrfToken;
    }
  } else if (cfg.sampleLive) {
    try { live = await getJSON(cfg.sampleLive); } catch { /* optional */ }
  }

  return { cfg, portal, home, projects, library, aiRoadmap, roadmap, invoicing, communications, search, live };
}
