#!/usr/bin/env bash
# Build locally, ship to the server, restart. Run from the project root.
#
#   ./deploy/deploy.sh
#
# First run only, on the server:
#   sudo mkdir -p /srv/jev && sudo chown deploy:deploy /srv/jev
#   sudo cp deploy/jev.service /etc/systemd/system/ && sudo systemctl daemon-reload
#   printf 'TYPESAFE_API_KEY=%s\n' 'sk-...' | sudo tee /srv/jev/.env >/dev/null
#   sudo chmod 600 /srv/jev/.env && sudo chown deploy:deploy /srv/jev/.env
#   sudo systemctl enable --now jev
set -euo pipefail

HOST="${JEV_HOST:-deploy@46.62.130.159}"
DIR="${JEV_DIR:-/srv/jev}"

echo "→ building"
npm run build

echo "→ syncing to $HOST:$DIR"
# .env is deliberately excluded: the server holds its own copy, and it must
# never be overwritten by a local file.
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude .env \
  dist server shared package.json package-lock.json \
  "$HOST:$DIR/"

echo "→ installing production dependencies"
ssh "$HOST" "cd $DIR && npm ci --omit=dev"

echo "→ restarting"
ssh "$HOST" "sudo systemctl restart jev && sleep 1 && systemctl is-active jev"

echo "→ checking"
curl -fsS "https://sumitnarang.com/jev/api/health" && echo
echo "✓ https://sumitnarang.com/jev"
