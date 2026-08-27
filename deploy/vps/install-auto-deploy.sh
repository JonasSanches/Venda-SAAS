#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute este instalador como root." >&2
  exit 1
fi

cd /opt/vendamais-app
chmod 750 deploy/vps/auto-deploy.sh
install -m 0644 deploy/vps/systemd/vendamais-deploy.service /etc/systemd/system/vendamais-deploy.service
install -m 0644 deploy/vps/systemd/vendamais-deploy.timer /etc/systemd/system/vendamais-deploy.timer
mkdir -p /var/lib/vendamais
git rev-parse HEAD > /var/lib/vendamais/deployed-revision
systemctl daemon-reload
systemctl enable --now vendamais-deploy.timer
systemctl start vendamais-deploy.service
systemctl status vendamais-deploy.timer --no-pager
