#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KANNEL_ADMIN_URL="${KANNEL_ADMIN_URL:-http://localhost:13000/status?password=changeme}"
WML_HEALTH_URL="${WML_HEALTH_URL:-http://localhost:3000/health}"
WAP_SMOKE_URL="${WAP_SMOKE_URL:-wap://localhost/}"
WAP_SMOKE_LOGIN_URL="${WAP_SMOKE_LOGIN_URL:-wap://localhost/login}"
TRANSPORT_WAP_TIMEOUT_MS="${TRANSPORT_WAP_TIMEOUT_MS:-15000}"
TRANSPORT_WAP_RETRIES="${TRANSPORT_WAP_RETRIES:-1}"
SMOKE_ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/transport-wap-smoke.XXXXXX")"

print_failure_diagnostics() {
  local exit_code="$?"
  if [[ "${exit_code}" -eq 0 ]]; then
    echo "transport-wap-smoke artifacts: ${SMOKE_ARTIFACT_DIR}"
    return 0
  fi

  echo
  echo "==> transport-wap-smoke diagnostics (exit ${exit_code})" >&2
  echo "Artifacts: ${SMOKE_ARTIFACT_DIR}" >&2
  echo "-- Kannel admin status snapshot --" >&2
  curl -fsS --connect-timeout 2 --max-time 5 "${KANNEL_ADMIN_URL}" \
    | tee "${SMOKE_ARTIFACT_DIR}/kannel-status.txt" >&2 || true
  echo >&2

  echo "-- WML server health snapshot --" >&2
  curl -fsS --connect-timeout 2 --max-time 5 "${WML_HEALTH_URL}" \
    | tee "${SMOKE_ARTIFACT_DIR}/wml-health.txt" >&2 || true
  echo >&2

  if command -v docker >/dev/null 2>&1; then
    echo "-- docker compose logs (kannel, wml-server) --" >&2
    (
      cd "${ROOT_DIR}" &&
      docker compose logs --tail=120 kannel wml-server
    ) | tee "${SMOKE_ARTIFACT_DIR}/docker-compose.log" >&2 || true
  fi

  return "${exit_code}"
}

trap print_failure_diagnostics EXIT

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
  WAP_SMOKE_URL="${WAP_SMOKE_URL}" \
    WAP_SMOKE_LOGIN_URL="${WAP_SMOKE_LOGIN_URL}" \
    TRANSPORT_WAP_TIMEOUT_MS="${TRANSPORT_WAP_TIMEOUT_MS}" \
    TRANSPORT_WAP_RETRIES="${TRANSPORT_WAP_RETRIES}" \
    RUST_TEST_THREADS=1 \
    cargo test --test kannel_smoke -- --ignored --test-threads=1 \
    | tee "${SMOKE_ARTIFACT_DIR}/transport-kannel-smoke.log"
)

echo "==> Running browser host native Kannel smoke unit test"
(
  cd "${ROOT_DIR}/browser/src-tauri"
  WAP_SMOKE_URL="${WAP_SMOKE_URL}" \
    TRANSPORT_WAP_TIMEOUT_MS="${TRANSPORT_WAP_TIMEOUT_MS}" \
    TRANSPORT_WAP_RETRIES="${TRANSPORT_WAP_RETRIES}" \
    RUST_TEST_THREADS=1 \
    cargo test host_fetch_deck_command_native_wap_home_smoke_succeeds --lib -- --ignored --test-threads=1 \
    | tee "${SMOKE_ARTIFACT_DIR}/browser-host-native-smoke.log"
)

echo "==> Running browser engine/render native Kannel smoke integration test"
(
  cd "${ROOT_DIR}/browser/src-tauri"
  WAP_SMOKE_URL="${WAP_SMOKE_URL}" \
    TRANSPORT_WAP_TIMEOUT_MS="${TRANSPORT_WAP_TIMEOUT_MS}" \
    TRANSPORT_WAP_RETRIES="${TRANSPORT_WAP_RETRIES}" \
    RUST_TEST_THREADS=1 \
    cargo test kannel_fetch_deck_smoke_navigates_into_menu_card -- --ignored --test-threads=1 \
    | tee "${SMOKE_ARTIFACT_DIR}/browser-render-native-smoke.log"
)

echo "transport-wap-smoke: PASS (artifacts: ${SMOKE_ARTIFACT_DIR})"
