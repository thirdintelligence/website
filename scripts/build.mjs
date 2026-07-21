import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

/* Copy public assets (images, portal CSS/JS) */
await cp(resolve(root, "public"), resolve(dist, "public"), { recursive: true });

/* Portal in-production artwork is referenced from /assets. Keep it in the
   published bundle so the authenticated shell never renders a broken image. */
await mkdir(resolve(dist, "assets"), { recursive: true });
await cp(resolve(root, "assets", "designer.svg"), resolve(dist, "assets", "designer.svg"));

/* Copy styles */
await cp(resolve(root, "styles"), resolve(dist, "styles"), { recursive: true });

/* Copy pages */
await cp(resolve(root, "pages"), resolve(dist, "pages"), { recursive: true });

/* Copy root index.html (redirects to /pages/home.html via netlify.toml) */
await cp(resolve(root, "index.html"), resolve(dist, "index.html"));

console.log("Built public site into dist/. Includes styles/, pages/, public/, and portal artwork.");
console.log("Protected portal source and client manifests were excluded (served via Netlify Functions).");
