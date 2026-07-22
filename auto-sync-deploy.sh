#!/bin/bash
# Legacy compatibility entrypoint.
# Auto-deployment from local file changes is intentionally retired.
# This wrapper only refreshes the local OS snapshot cache and never edits the
# repository, runs a build, or deploys to Netlify.

set -u

installed_refresh="$HOME/Library/Application Support/Third i/portal-data-refresh.sh"
source_refresh="/Users/justinbrannon/Desktop/Third i/ThirdI_WEB/scripts/ops/portal-data-refresh.sh"

if [ -x "$installed_refresh" ]; then
  exec "$installed_refresh"
fi

if [ -x "$source_refresh" ]; then
  exec "$source_refresh"
fi

echo "Third i snapshot refresh is not installed. Run scripts/ops/install-portal-data-refresh.sh." >&2
exit 0
