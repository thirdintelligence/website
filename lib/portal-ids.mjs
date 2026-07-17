/* Stable, roughly time-sortable IDs + timestamps for operational records. */
import { randomBytes } from "node:crypto";

export function newId(prefix) {
  const t = Date.now().toString(36);
  const r = randomBytes(6).toString("hex");
  return `${prefix}_${t}${r}`;
}

export function newDeviceId() { return "dev_" + randomBytes(16).toString("hex"); }

export function nowIso() { return new Date().toISOString(); }

/** yyyy / mm segments for time-bucketed event keys. */
export function ymSegments(iso = nowIso()) {
  const d = new Date(iso);
  return { y: String(d.getUTCFullYear()), m: String(d.getUTCMonth() + 1).padStart(2, "0") };
}
