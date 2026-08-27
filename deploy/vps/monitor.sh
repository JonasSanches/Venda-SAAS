#!/usr/bin/env bash
set -Eeuo pipefail

STATE_DIR="/var/lib/vendamais"
FAILURE_FILE="$STATE_DIR/monitor-failures"
ALERT_CONFIG="/etc/vendamais-monitor.env"
mkdir -p "$STATE_DIR"

if [[ -f "$ALERT_CONFIG" ]]; then
  # The file is root-owned and contains only the optional webhook URL.
  source "$ALERT_CONFIG"
fi

notify() {
  local message="$1"
  logger -p user.err -t vendamais-monitor -- "$message"
  if [[ -n "${MONITOR_ALERT_WEBHOOK_URL:-}" ]]; then
    printf '{"text":"VendaMais: %s"}' "$message" | curl -fsS --max-time 10 -H 'Content-Type: application/json' --data-binary @- "$MONITOR_ALERT_WEBHOOK_URL" >/dev/null || true
  fi
}

if curl -fsS --max-time 15 https://www.vendamais-app.com/api/health/ready >/dev/null; then
  if [[ -s "$FAILURE_FILE" ]] && [[ "$(cat "$FAILURE_FILE")" -ge 3 ]]; then
    notify "serviço recuperado e banco conectado"
  fi
  printf '0\n' > "$FAILURE_FILE"
else
  failures="$(( $(cat "$FAILURE_FILE" 2>/dev/null || echo 0) + 1 ))"
  printf '%s\n' "$failures" > "$FAILURE_FILE"
  if [[ "$failures" -eq 3 ]]; then
    notify "site ou banco indisponível em três verificações consecutivas"
  fi
fi

disk_usage="$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
if [[ "$disk_usage" -ge 85 ]]; then
  notify "uso de disco crítico: ${disk_usage}%"
fi
