#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/vendamais-app"
BACKUP_DIR="/var/backups/vendamais"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="$BACKUP_DIR/config-$timestamp.tar.gz"

install -d -m 0700 "$BACKUP_DIR"
tar -C "$APP_DIR" -czf "$archive" \
  deploy/vps/.env.production \
  deploy/vps/Caddyfile \
  deploy/vps/docker-compose.yml
chmod 0600 "$archive"
sha256sum "$archive" > "$archive.sha256"
chmod 0600 "$archive.sha256"
find "$BACKUP_DIR" -type f -mtime +14 -delete
logger -t vendamais-backup -- "Configuração salva em $archive"
