/* Loads the sanitized v2 tenant manifests. In preview mode the operational
   layer (comments/completions) is seeded from a bundled sample set; in live mode
   (Phase 3+) it will come from the tenant-authorized operational API instead. */

export function getConfig() {
  const c = window.__PORTAL_CONFIG__ || {};
  return {
    tenant: c.tenant || "bkwatch",
    contentBase: (c.contentBase || "/content/clients/bkwatch/").replace(/\/?$/, "/"),
    routeBase: c.routeBase || "/bkwatch",
    mode: c.mode || "preview",
    sampleLive: c.sampleLive || null
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
  const b = cfg.contentBase;
  const [portal, home, projects, library, aiRoadmap, search] = await Promise.all([
    getJSON(b + "portal.json"),
    getJSON(b + "home.json"),
    getJSON(b + "projects.json"),
    getJSON(b + "library.json"),
    getJSON(b + "ai-roadmap.json"),
    getJSON(b + "search-index.json")
  ]);

  // Operational (live) records.
  //  • live mode  → real tenant-authorized operational API (comments + CSRF)
  //  • preview    → a small, clearly-sample seed so the UI is reviewable offline
  let live = { comments: [] };
  if (cfg.mode === "live") {
    const l = await fetchLive(cfg);
    if (l) { live.comments = l.comments || []; cfg.csrfToken = l.csrfToken; }
  } else if (cfg.sampleLive) {
    try { live = await getJSON(cfg.sampleLive); } catch { /* optional */ }
  }

  return { cfg, portal, home, projects, library, aiRoadmap, search, live };
}
