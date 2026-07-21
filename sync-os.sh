#!/bin/bash
# Syncs os.html from ThirdI_EXEC to ThirdI_WEB as os.html
# 1. Fetches live snapshot from local dashboard server
# 2. Embeds snapshot as window.__SNAPSHOT__ in the HTML
# 3. Leaves authentication to the server-side /os Netlify Function
# Run before deploying ThirdI_WEB to Netlify

EXEC_DASHBOARD="/Users/justinbrannon/Desktop/Third i/ThirdI_EXEC/os.html"
WEB_OS="/Users/justinbrannon/Desktop/Third i/ThirdI_WEB/os.html"
LOCAL_API="http://localhost:8765/api/os-snapshot"

if [ ! -f "$EXEC_DASHBOARD" ]; then
  echo "ERROR: os.html not found at $EXEC_DASHBOARD"
  exit 1
fi

cp "$EXEC_DASHBOARD" "$WEB_OS"

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
    html = html.replace('<head>', '<head>' + tag);
    fs.writeFileSync(file, html);
  " "$WEB_OS" "$SNAPSHOT"
  echo "Embedded live snapshot from local server"
else
  echo "WARNING: Local server did not return a verified snapshot, deploying without embedded snapshot"
fi

echo "Synced os.html -> os.html for server-side owner authentication ($(wc -c < "$WEB_OS") bytes)"

# Extract client communications (emails + meetings) from the embedded snapshot
# into per-client communications.json files for the client portals.
WEB_ROOT="/Users/justinbrannon/Desktop/Third i/ThirdI_WEB"
if [ -f "$WEB_ROOT/scripts/portal/extract-communications.mjs" ]; then
  node "$WEB_ROOT/scripts/portal/extract-communications.mjs" 2>/dev/null && \
    echo "Extracted client communications from snapshot" || \
    echo "WARNING: Failed to extract client communications"
fi
