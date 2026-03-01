#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KANNEL_ADMIN_URL="${KANNEL_ADMIN_URL:-http://localhost:13000/status?password=changeme}"
WML_HEALTH_URL="${WML_HEALTH_URL:-http://localhost:3000/health}"
# Default through the wml-server gateway proxy, which forwards into Kannel
# in the same docker network and is more stable across host environments.
GATEWAY_HTTP_BASE="${GATEWAY_HTTP_BASE:-http://localhost:3000/gateway}"
WAP_SMOKE_URL="${WAP_SMOKE_URL:-wap://localhost/}"
TRANSPORT_WAP_TIMEOUT_MS="${TRANSPORT_WAP_TIMEOUT_MS:-15000}"
TRANSPORT_WAP_RETRIES="${TRANSPORT_WAP_RETRIES:-1}"

wait_for_http() {
  local url="$1"
  local retries="${2:-40}"
  local sleep_seconds="${3:-1}"
  local i

  for ((i = 1; i <= retries; i += 1)); do
    if curl -fsS --connect-timeout 2 --max-time 5 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_seconds"
  done

  echo "Timeout waiting for $url" >&2
  return 1
}

echo "==> Checking Kannel admin status"
wait_for_http "${KANNEL_ADMIN_URL}"
curl -fsS --connect-timeout 2 --max-time 5 "${KANNEL_ADMIN_URL}" | grep -q 'Status: running'

echo "==> Checking WML server health"
wait_for_http "${WML_HEALTH_URL}"

echo "==> Running transport-rust WAP smoke integration test"
(
  cd "${ROOT_DIR}/transport-rust"
  GATEWAY_HTTP_BASE="${GATEWAY_HTTP_BASE}" \
    WAP_SMOKE_URL="${WAP_SMOKE_URL}" \
    TRANSPORT_WAP_TIMEOUT_MS="${TRANSPORT_WAP_TIMEOUT_MS}" \
    TRANSPORT_WAP_RETRIES="${TRANSPORT_WAP_RETRIES}" \
    RUST_TEST_THREADS=1 \
    cargo test --test kannel_smoke -- --ignored --test-threads=1
)

echo "transport-wap-smoke: PASS"
