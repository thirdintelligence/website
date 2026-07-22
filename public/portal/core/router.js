/* Hash router for the local preview. Route names/shape mirror the production
   path map (plan 02); a later phase swaps hash for tenant-path routing without
   changing page code. */
import { getConfig } from "./data.js";

const ROUTES = [
  { name: "home", re: /^\/?$/, keys: [] },
  { name: "projects", re: /^\/projects\/?$/, keys: [] },
  { name: "projectRequest", re: /^\/projects\/requests\/([^/]+)\/?$/, keys: ["requestId"] },
  { name: "idea", re: /^\/projects\/([^/]+)\/ideas\/([^/]+)\/?$/, keys: ["slug", "ideaSlug"] },
  { name: "project", re: /^\/projects\/([^/]+)\/?$/, keys: ["slug"] },
  { name: "library", re: /^\/library\/?$/, keys: [] },
  { name: "libraryComms", re: /^\/library\/communication\/(comments|emails|meetings)\/?$/, keys: ["subpage"] },
  { name: "libraryRecord", re: /^\/library\/([^/]+)\/([^/]+)\/?$/, keys: ["category", "recordId"] },
  { name: "libraryCategory", re: /^\/library\/([^/]+)\/?$/, keys: ["category"] },
  { name: "aiRoadmap", re: /^\/ai-roadmap\/?$/, keys: [] },
  { name: "valueResults", re: /^\/value-results\/?$/, keys: [] }
];

/** Convert a stored absolute route ("/bkwatch/projects/x") to an in-app path. */
export function toInApp(route) {
  const base = getConfig().routeBase;
  let p = String(route || "/");
  if (p.startsWith(base)) p = p.slice(base.length) || "/";
  return p.startsWith("/") ? p : "/" + p;
}

/** Href for use in anchors (hash mode). Accepts absolute or in-app paths. */
export function href(route) {
  const p = route.startsWith(getConfig().routeBase) ? toInApp(route) : (route.startsWith("/") ? route : "/" + route);
  const [path, hash] = p.split("#");
  return "#" + path + (hash ? "%anchor%" + hash : "");
}

export function currentLocation() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [pathPart, anchor] = raw.split("%anchor%");
  const [path, query] = pathPart.split("?");
  const params = new URLSearchParams(query || "");
  return { path: path || "/", query: params, anchor };
}

export function match(path) {
  for (const r of ROUTES) {
    const m = r.re.exec(path);
    if (m) {
      const params = { ...(r.params || {}) };
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { name: r.name, params };
    }
  }
  return { name: "notFound", params: {} };
}

export function navigate(inAppPath) {
  location.hash = inAppPath.startsWith("/") ? inAppPath : "/" + inAppPath;
}

export function onRouteChange(cb) {
  window.addEventListener("hashchange", cb);
}
