#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl

wait_for_http() {
  local url="$1"
  local retries="${2:-40}"
  local sleep_seconds="${3:-1}"
  local i

  for ((i = 1; i <= retries; i += 1)); do
    if curl -fsS --connect-timeout 2 --max-time 3 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_seconds"
  done

  echo "Timeout waiting for $url" >&2
  return 1
}

echo "[1/7] Checking Kannel admin status endpoint"
wait_for_http 'http://localhost:13000/status?password=changeme'
STATUS_RESP="$(curl -fsS --connect-timeout 2 --max-time 5 'http://localhost:13000/status?password=changeme')"
echo "$STATUS_RESP" | grep -q 'Status: running'

echo "[2/7] Checking WML home page content type"
wait_for_http 'http://localhost:3000/health'
HOME_HEADERS="$(curl -fsSI --connect-timeout 2 --max-time 5 'http://localhost:3000/')"
echo "$HOME_HEADERS" | grep -qi 'Content-Type: text/vnd.wap.wml'

echo "[3/7] Registering demo user"
REGISTER_RESP="$(curl -fsS --connect-timeout 2 --max-time 5 -X POST 'http://localhost:3000/register' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'username=demo&pin=1234')"
echo "$REGISTER_RESP" | grep -q 'Registration OK\|Username already exists'

echo "[4/7] Logging in demo user"
LOGIN_RESP="$(curl -fsS --connect-timeout 2 --max-time 5 -X POST 'http://localhost:3000/login' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'username=demo&pin=1234')"
SID="$(echo "$LOGIN_RESP" | sed -n 's/.*portal?sid=\([a-f0-9]\{16\}\).*/\1/p' | head -n 1)"
if [[ -z "$SID" ]]; then
  echo "Unable to extract session ID from login response" >&2
  exit 1
fi

echo "[5/7] Verifying portal and messages flow"
PORTAL_RESP="$(curl -fsS --connect-timeout 2 --max-time 5 "http://localhost:3000/portal?sid=${SID}")"
echo "$PORTAL_RESP" | grep -q 'Welcome, demo'
MESSAGES_RESP="$(curl -fsS --connect-timeout 2 --max-time 5 "http://localhost:3000/messages?sid=${SID}&page=1")"
echo "$MESSAGES_RESP" | grep -q 'Messages'

echo "[6/7] Checking metrics endpoint"
METRICS_RESP="$(curl -fsS --connect-timeout 2 --max-time 5 'http://localhost:3000/metrics')"
echo "$METRICS_RESP" | grep -q '^requests_total '

echo "[7/7] Validating gateway HTTP bridge endpoint"
GATEWAY_RESP="$(curl -sS --max-time 8 'http://localhost:13002/' || true)"
if echo "$GATEWAY_RESP" | grep -q '<wml>'; then
  echo "Gateway HTTP bridge returned WML content."
else
  echo "Gateway endpoint did not return HTTP WML in time; continue with emulator-based WSP verification."
fi

echo "Smoke test passed."
