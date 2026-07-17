/**
 * portal-store.mjs — tenant-prefixed operational key/value store.
 *
 * Two adapters behind one interface:
 *   • FileAdapter (default)   — JSON files under a local dir. Used for local dev,
 *     `netlify dev`, and tests. No external dependency.
 *   • R2Adapter (prod)        — Cloudflare R2 (S3-compatible, strongly consistent)
 *     via the same @aws-sdk/client-s3 already used for media. Writes go to R2, not
 *     the read-only function filesystem. No Netlify Blobs / OpenTelemetry deps.
 *
 * Selection: PORTAL_STORE=r2 (on Netlify) → R2; otherwise file.
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

class R2Adapter {
  constructor(client, bucket, prefix) { this.client = client; this.bucket = bucket; this.prefix = prefix; }
  static async create() {
    const { S3Client } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.PORTAL_MEDIA_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.PORTAL_MEDIA_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.PORTAL_MEDIA_R2_SECRET_ACCESS_KEY
      }
    });
    // Operational data lives under an isolated prefix in the media bucket (or a
    // dedicated bucket). It is never exposed via the media download signer.
    const bucket = process.env.PORTAL_OPS_BUCKET || process.env.PORTAL_MEDIA_R2_BUCKET;
    return new R2Adapter(client, bucket, `_ops/${STORE_NAME}/`);
  }
  #key(key) { return this.prefix + key + ".json"; }
  async get(key) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: this.#key(key) }));
      return JSON.parse(await res.Body.transformToString());
    } catch (e) {
      if (e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) return null;
      throw e;
    }
  }
  async set(key, value) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: this.#key(key), Body: JSON.stringify(value), ContentType: "application/json" }));
    return value;
  }
  async delete(key) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.#key(key) }));
  }
  async list(prefix = "") {
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    const full = this.prefix + prefix;
    const out = [];
    let token;
    do {
      const res = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: full, ContinuationToken: token }));
      for (const obj of res.Contents || []) {
        const k = obj.Key.slice(this.prefix.length);
        if (k.endsWith(".json")) out.push(k.slice(0, -5));
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out.sort();
  }
}

let cached = null;
export async function getStore(opts = {}) {
  if (opts.dir) return new FileAdapter(opts.dir); // tests pass an explicit dir
  if (cached) return cached;
  cached = (process.env.PORTAL_STORE === "r2") ? await R2Adapter.create() : new FileAdapter();
  return cached;
}

/** Reset the module cache (tests). */
export function _resetStore() { cached = null; }

/** Tenant-scoped key builder — the ONLY way callers should form keys. */
export function key(tenant, ...parts) {
  if (!/^[a-z0-9-]+$/.test(tenant)) throw new Error("invalid tenant");
  return ["tenants", tenant, ...parts].join("/");
}
