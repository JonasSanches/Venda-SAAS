#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/vendamais-app"
COMPOSE_FILE="deploy/vps/docker-compose.yml"
STATE_DIR="/var/lib/vendamais"
STATE_FILE="$STATE_DIR/deployed-revision"

exec 9>"/run/lock/vendamais-deploy.lock"
flock -n 9 || exit 0

cd "$APP_DIR"

# Keep operational units synchronized even when there is no application update.
units_changed=0
for unit in deploy/vps/systemd/*.service deploy/vps/systemd/*.timer; do
  destination="/etc/systemd/system/$(basename "$unit")"
  if [[ ! -f "$destination" ]] || ! cmp -s "$unit" "$destination"; then
    install -m 0644 "$unit" "$destination"
    units_changed=1
  fi
done
chmod 750 deploy/vps/auto-deploy.sh deploy/vps/monitor.sh deploy/vps/backup-config.sh
if [[ "$units_changed" -eq 1 ]]; then
  systemctl daemon-reload
  systemctl enable --now vendamais-monitor.timer vendamais-backup.timer
fi

git fetch --quiet origin main
target_revision="$(git rev-parse origin/main)"
deployed_revision="$(cat "$STATE_FILE" 2>/dev/null || true)"

if [[ "$target_revision" == "$deployed_revision" ]]; then
  exit 0
fi

echo "Deploying revision $target_revision"
git checkout --quiet main
git pull --ff-only origin main

# Build first: a compilation error leaves the currently running containers intact.
docker compose -f "$COMPOSE_FILE" build api web
docker compose -f "$COMPOSE_FILE" up -d

for _ in {1..24}; do
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' vps-api-1 2>/dev/null || true)"
  if [[ "$health" == "healthy" ]]; then
    mkdir -p "$STATE_DIR"
    printf '%s\n' "$target_revision" > "$STATE_FILE"
    docker image prune -f >/dev/null
    echo "Deploy completed: $target_revision"
    exit 0
  fi
  sleep 5
done

echo "Deploy failed: API did not become healthy" >&2
docker compose -f "$COMPOSE_FILE" logs --tail=80 api >&2
exit 1
