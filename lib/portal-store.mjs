/**
 * portal-store.mjs — tenant-prefixed operational key/value store.
 *
 * Two adapters behind one interface:
 *   • FileAdapter (default)   — JSON files under a local dir. Used for local dev,
 *     `netlify dev`, and tests. No external dependency.
 *   • BlobsAdapter (prod)     — Netlify Blobs (strong consistency), loaded via a
 *     runtime-only dynamic import so the package is never in the committed tree.
 *
 * Selection: PORTAL_STORE=blobs (on Netlify) → Blobs; otherwise file.
 * Keys look like: tenants/<tenant>/comments/<id>. The tenant segment is always
 * supplied by server-derived auth, never by the request body.
 */
import { mkdir, readFile, writeFile, rm, readdir, stat } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";

const DEFAULT_DIR = resolve(import.meta.dirname, "..", ".portal-store");
const STORE_NAME = process.env.PORTAL_DATA_STORE_VERSION || "portal-live-v1";

class FileAdapter {
  constructor(dir) { this.dir = dir || process.env.PORTAL_STORE_DIR || DEFAULT_DIR; }
  #path(key) { return join(this.dir, STORE_NAME, key + ".json"); }

  async get(key) {
    try { return JSON.parse(await readFile(this.#path(key), "utf8")); }
    catch (e) { if (e.code === "ENOENT") return null; throw e; }
  }
  async set(key, value) {
    const p = this.#path(key);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, JSON.stringify(value, null, 2), "utf8");
    return value;
  }
  async delete(key) { await rm(this.#path(key), { force: true }); }
  async list(prefix = "") {
    const root = join(this.dir, STORE_NAME);
    const out = [];
    const walk = async (rel) => {
      let entries;
      try { entries = await readdir(join(root, rel), { withFileTypes: true }); }
      catch (e) { if (e.code === "ENOENT") return; throw e; }
      for (const ent of entries) {
        const childRel = rel ? join(rel, ent.name) : ent.name;
        if (ent.isDirectory()) await walk(childRel);
        else if (ent.name.endsWith(".json")) out.push(childRel.slice(0, -5).split("\\").join("/"));
      }
    };
    await walk("");
    return out.filter((k) => k.startsWith(prefix)).sort();
  }
}

class BlobsAdapter {
  constructor(store) { this.store = store; }
  static async create() {
    const { getStore } = await import("@netlify/blobs");
    return new BlobsAdapter(getStore({ name: STORE_NAME, consistency: "strong" }));
  }
  async get(key) { return this.store.get(key, { type: "json" }); }
  async set(key, value) { await this.store.setJSON(key, value); return value; }
  async delete(key) { await this.store.delete(key); }
  async list(prefix = "") {
    const res = await this.store.list({ prefix });
    return (res.blobs || []).map((b) => b.key).sort();
  }
}

let cached = null;
export async function getStore(opts = {}) {
  if (opts.dir) return new FileAdapter(opts.dir); // tests pass an explicit dir
  if (cached) return cached;
  cached = (process.env.PORTAL_STORE === "blobs") ? await BlobsAdapter.create() : new FileAdapter();
  return cached;
}

/** Reset the module cache (tests). */
export function _resetStore() { cached = null; }

/** Tenant-scoped key builder — the ONLY way callers should form keys. */
export function key(tenant, ...parts) {
  if (!/^[a-z0-9-]+$/.test(tenant)) throw new Error("invalid tenant");
  return ["tenants", tenant, ...parts].join("/");
}
