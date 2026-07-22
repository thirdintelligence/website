#!/bin/bash
# Manual OS release preparation.
# ThirdI_WEB/os.html is the current runtime baseline. This script never copies
# the older ThirdI_EXEC/os.html over it and is never run by launchd.
# It fetches a valid snapshot, embeds it, and updates deterministic portal
# extracts for a reviewed/tested release.

WEB_OS="/Users/justinbrannon/Desktop/Third i/ThirdI_WEB/os.html"
LOCAL_API="http://127.0.0.1:8765/api/os-snapshot"

if [ ! -f "$WEB_OS" ]; then
  echo "ERROR: canonical runtime os.html not found at $WEB_OS"
  exit 1
fi

# Fetch live snapshot from local server and embed it only when it is valid.
SNAPSHOT=$(curl -s --fail --max-time 45 "$LOCAL_API" 2>/dev/null)
if [ -n "$SNAPSHOT" ] && node -e "const s=JSON.parse(process.argv[1]); const ok=!s.error && ['sheets','gmail','calendar'].every((key)=>s.connections?.[key]?.status==='active'); if (!ok) process.exit(1);" "$SNAPSHOT" 2>/dev/null; then
  # Use node to inject the snapshot — handles JSON newlines/special chars safely
  node -e "
    const fs = require('fs');
    const file = process.argv[1];
    const snapshot = process.argv[2];
    let html = fs.readFileSync(file, 'utf8');
    const tag = '<script>window.__SNAPSHOT__=' + snapshot + ';</script>';
    const marker = '<script>window.__SNAPSHOT__=';
    const start = html.indexOf(marker);
    const end = start >= 0 ? html.indexOf('</script>', start) : -1;
    html = start >= 0 && end >= 0
      ? html.slice(0, start) + tag + html.slice(end + '</script>'.length)
      : html.replace('<head>', '<head>' + tag);
    fs.writeFileSync(file, html);
  " "$WEB_OS" "$SNAPSHOT"
  echo "Embedded live snapshot from local server"
else
  echo "ERROR: Local server did not return a verified snapshot; repository left unchanged"
  exit 1
fi

echo "Prepared canonical os.html for reviewed release ($(wc -c < "$WEB_OS") bytes)"

# Extract client communications (emails + meetings) from the embedded snapshot
# into per-client communications.json files for the client portals.
WEB_ROOT="/Users/justinbrannon/Desktop/Third i/ThirdI_WEB"
if [ -f "$WEB_ROOT/scripts/portal/extract-communications.mjs" ]; then
  node "$WEB_ROOT/scripts/portal/extract-communications.mjs" 2>/dev/null && \
    echo "Extracted client communications from snapshot" || \
    echo "WARNING: Failed to extract client communications"
fi

# Extract real metrics (hours, amounts, efficiency trends) from the spreadsheet
# data in the snapshot into per-client invoicing.json files.
if [ -f "$WEB_ROOT/scripts/portal/extract-metrics.mjs" ]; then
  node "$WEB_ROOT/scripts/portal/extract-metrics.mjs" 2>/dev/null && \
    echo "Extracted real metrics from spreadsheet" || \
    echo "WARNING: Failed to extract metrics"
fi
