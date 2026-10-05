#!/bin/bash
# deploy.sh — build glmps.fizx.uk and push dist/ to the server.
# Usage: ./deploy.sh

set -euo pipefail

SERVER="fizx.uk"   # a Host alias in ~/.ssh/config: the user, port and key live there
REMOTE_PATH="/var/www/glmps.fizx.uk"

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "▸ building…"
if [ ! -d node_modules ]; then npm ci --silent; fi
npm run build

echo "▸ rsync → $SERVER:$REMOTE_PATH"
# nginx only reads, so force world-readable modes rather than copying whatever
# the local files happen to have. --chmod needs real rsync (not macOS openrsync).
rsync -avz --delete --chmod=D755,F644 \
  --exclude='.DS_Store' \
  dist/ "$SERVER:$REMOTE_PATH/"

# No chown: the webroot belongs to the deploy user. Root login is off on the
# server and sudo asks for a password, so nothing here uses either.

echo "✓ live at https://glmps.fizx.uk"
echo
echo "If /r/<naddr> 404s, the vhost has lost its SPA fallback; the copy to"
echo "install (as root, on the server) is nginx-glmps.fizx.uk.conf."
