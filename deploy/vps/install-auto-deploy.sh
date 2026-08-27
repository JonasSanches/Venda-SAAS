#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute este instalador como root." >&2
  exit 1
fi

cd /opt/vendamais-app
chmod 750 deploy/vps/auto-deploy.sh deploy/vps/monitor.sh deploy/vps/backup-config.sh
for unit in deploy/vps/systemd/*.service deploy/vps/systemd/*.timer; do
  install -m 0644 "$unit" "/etc/systemd/system/$(basename "$unit")"
done
mkdir -p /var/lib/vendamais
git rev-parse HEAD > /var/lib/vendamais/deployed-revision
systemctl daemon-reload
systemctl enable --now vendamais-deploy.timer vendamais-monitor.timer vendamais-backup.timer
systemctl start vendamais-deploy.service
systemctl status vendamais-deploy.timer --no-pager
