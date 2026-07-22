#!/bin/bash
# Installs the refresh-only launch agent and preserves the legacy plist as a
# disabled backup. Safe to run again after script updates.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
support_dir="$HOME/Library/Application Support/Third i"
launch_dir="$HOME/Library/LaunchAgents"
legacy_dir="$support_dir/legacy"
new_label="com.thirdi.portal-data-refresh"
old_label="com.thirdi.auto-sync"
new_plist="$launch_dir/$new_label.plist"
old_plist="$launch_dir/$old_label.plist"

mkdir -p "$support_dir" "$launch_dir" "$legacy_dir"
chmod 700 "$support_dir" "$legacy_dir"

install -m 700 "$script_dir/portal-data-refresh.sh" "$support_dir/portal-data-refresh.sh"
install -m 600 "$script_dir/com.thirdi.portal-data-refresh.plist" "$new_plist"

launchctl bootout "gui/$UID/$old_label" 2>/dev/null || true
if [ -f "$old_plist" ]; then
  backup_path="$legacy_dir/$old_label.plist.disabled"
  if [ -f "$backup_path" ]; then
    backup_path="$legacy_dir/$old_label.$(date +%Y%m%d%H%M%S).plist.disabled"
  fi
  mv "$old_plist" "$backup_path"
fi

launchctl bootout "gui/$UID/$new_label" 2>/dev/null || true
launchctl bootstrap "gui/$UID" "$new_plist"
launchctl kickstart -k "gui/$UID/$new_label"

echo "Installed $new_label (15-minute refresh-only cache; no repository writes or deploys)."
