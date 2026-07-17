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

  // Operational (live) records. Preview seeds a small, clearly-sample set so the
  // comment/completion UI is reviewable without a datastore (DATA-01 gated).
  let live = { comments: [] };
  if (cfg.mode === "preview" && cfg.sampleLive) {
    try { live = await getJSON(cfg.sampleLive); } catch { /* optional */ }
  }

  return { cfg, portal, home, projects, library, aiRoadmap, search, live };
}
