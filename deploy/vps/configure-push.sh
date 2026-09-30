#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/vendamais-app"
COMPOSE_FILE="$APP_DIR/deploy/vps/docker-compose.yml"
ENV_FILE="$APP_DIR/deploy/vps/.env.production"
TEMP_FILE="$(mktemp)"

trap 'rm -f "$TEMP_FILE"' EXIT

cd "$APP_DIR"
docker compose -f "$COMPOSE_FILE" run --rm --no-deps api node apps/api/scripts/print-vapid-env.cjs > "$TEMP_FILE"
sed -i '/^PUSH_VAPID_/d' "$ENV_FILE"
cat "$TEMP_FILE" >> "$ENV_FILE"
chmod 600 "$ENV_FILE"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate api

echo "Notificações push configuradas. Abra o Venda+ instalado no celular e permita os avisos."
