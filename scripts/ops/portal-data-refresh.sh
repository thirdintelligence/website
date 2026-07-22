#!/bin/bash
# Refreshes a private local cache from the Third i OS server.
# It never reads/writes the repository and never deploys.

set -u

refresh_root="${THIRDI_REFRESH_ROOT:-$HOME/Library/Application Support/Third i}"
snapshot_path="$refresh_root/os-snapshot.json"
status_path="$refresh_root/portal-data-refresh-status.json"
log_path="$refresh_root/portal-data-refresh.log"
snapshot_url="${THIRDI_OS_SNAPSHOT_URL:-http://127.0.0.1:8765/api/os-snapshot}"

mkdir -p "$refresh_root"
chmod 700 "$refresh_root"

temp_root="$(mktemp -d)"
trap 'rm -rf "$temp_root"' EXIT
candidate_path="$temp_root/os-snapshot.json"
candidate_status="$temp_root/status.json"

write_status() {
  local state="$1"
  local detail="$2"
  local checked_at
  checked_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '{\n  "state": "%s",\n  "detail": "%s",\n  "checkedAt": "%s"\n}\n' \
    "$state" "$detail" "$checked_at" > "$candidate_status"
  install -m 600 "$candidate_status" "$status_path"
  printf '%s %s: %s\n' "$checked_at" "$state" "$detail" >> "$log_path"
  chmod 600 "$log_path"
}

if ! curl --silent --show-error --fail --max-time 45 "$snapshot_url" --output "$candidate_path" 2>> "$log_path"; then
  write_status "skipped" "Local OS server unavailable; existing cache preserved."
  exit 0
fi

snapshot_error="$(/usr/bin/plutil -extract error raw -o - "$candidate_path" 2>/dev/null || true)"
if [ -n "$snapshot_error" ] && [ "$snapshot_error" != "false" ]; then
  write_status "skipped" "Local OS server returned an error snapshot; existing cache preserved."
  exit 0
fi

has_data="false"
for key_path in sheets gmail calendar connections.sheets connections.gmail connections.calendar; do
  if /usr/bin/plutil -extract "$key_path" xml1 -o - "$candidate_path" >/dev/null 2>&1; then
    has_data="true"
    break
  fi
done

if [ "$has_data" != "true" ]; then
  write_status "skipped" "Local OS snapshot had no recognized connector data; existing cache preserved."
  exit 0
fi

install -m 600 "$candidate_path" "$snapshot_path"
write_status "refreshed" "Local OS snapshot cache updated."
