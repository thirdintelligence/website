/* Minimal static server for the LOCAL portal preview (no auth, no secrets).
   Serves the repo root so /public, /content, and /assets resolve, and defaults
   to the preview harness. Not used in production. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, normalize } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const PORT = process.env.PORT || 4599;
const DEFAULT = "/public/portal/preview.html";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2"
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/" || urlPath === "") urlPath = DEFAULT;
    // Prevent path traversal.
    const filePath = resolve(ROOT, "." + normalize(urlPath));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
    const info = await stat(filePath).catch(() => null);
    if (!info || !info.isFile()) { res.writeHead(404); return res.end("Not found: " + urlPath); }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": TYPES[extname(filePath)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
});

server.listen(PORT, () => {
  console.log(`Portal preview → http://localhost:${PORT}${DEFAULT}`);
  console.log("(local preview only — no auth, sanitized sample data)");
});
