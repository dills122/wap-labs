#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/run-and-tee.sh
. "${ROOT_DIR}/scripts/lib/run-and-tee.sh"
KANNEL_ADMIN_URL="${KANNEL_ADMIN_URL:-http://localhost:13000/status?password=changeme}"
WML_HEALTH_URL="${WML_HEALTH_URL:-http://localhost:3001/health}"
WAP_SMOKE_URL="${WAP_SMOKE_URL:-wap://localhost/}"
WAP_SMOKE_LOGIN_URL="${WAP_SMOKE_LOGIN_URL:-wap://localhost/login}"
WAP_SMOKE_REGISTER_URL="${WAP_SMOKE_REGISTER_URL:-wap://localhost/register}"
WAP_SMOKE_EXAMPLE_URL="${WAP_SMOKE_EXAMPLE_URL:-wap://localhost/examples/index.wml}"
WAP_SMOKE_DENIED_URL="${WAP_SMOKE_DENIED_URL:-wap://127.0.0.1:9200/}"
TRANSPORT_WAP_TIMEOUT_MS="${TRANSPORT_WAP_TIMEOUT_MS:-15000}"
TRANSPORT_WAP_RETRIES="${TRANSPORT_WAP_RETRIES:-1}"
TRANSPORT_WAP_SKIP_INTERNAL_HEALTH="${TRANSPORT_WAP_SKIP_INTERNAL_HEALTH:-0}"
AUTH_FORM_SMOKE_RAN=0
case "${TRANSPORT_WAP_SKIP_INTERNAL_HEALTH}" in
  0 | 1) ;;
  *) echo 'TRANSPORT_WAP_SKIP_INTERNAL_HEALTH must be 0 or 1' >&2; exit 2 ;;
esac
if [ -n "${TRANSPORT_WAP_SMOKE_ARTIFACT_DIR:-}" ]; then
  SMOKE_ARTIFACT_DIR="${TRANSPORT_WAP_SMOKE_ARTIFACT_DIR}"
  mkdir -p "${SMOKE_ARTIFACT_DIR}"
else
  SMOKE_ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/transport-wap-smoke.XXXXXX")"
fi

print_failure_diagnostics() {
  exit_code="$?"
  if [ "$exit_code" -eq 0 ]; then
    echo "transport-wap-smoke artifacts: ${SMOKE_ARTIFACT_DIR}"
    return 0
  fi

  echo
  echo "==> transport-wap-smoke diagnostics (exit ${exit_code})" >&2
  echo "Artifacts: ${SMOKE_ARTIFACT_DIR}" >&2
  if [ "${TRANSPORT_WAP_SKIP_INTERNAL_HEALTH}" = 0 ]; then
    echo "-- Kannel admin status snapshot --" >&2
    curl -fsS --connect-timeout 2 --max-time 5 "${KANNEL_ADMIN_URL}" \
      | tee "${SMOKE_ARTIFACT_DIR}/kannel-status.txt" >&2 || true
    echo >&2

    echo "-- WML server health snapshot --" >&2
    curl -fsS --connect-timeout 2 --max-time 5 "${WML_HEALTH_URL}" \
      | tee "${SMOKE_ARTIFACT_DIR}/wml-health.txt" >&2 || true
    echo >&2
  fi

  if [ "${TRANSPORT_WAP_SKIP_INTERNAL_HEALTH}" = 0 ] && command -v docker >/dev/null 2>&1; then
    if [ "${AUTH_FORM_SMOKE_RAN}" = 1 ]; then
      echo "-- docker compose logs (wml-server; Kannel omitted after auth submission) --" >&2
      (
        cd "${ROOT_DIR}" &&
        docker compose logs --tail=120 wml-server
      ) | tee "${SMOKE_ARTIFACT_DIR}/docker-compose.log" >&2 || true
    else
      echo "-- docker compose logs (kannel, wml-server) --" >&2
      (
        cd "${ROOT_DIR}" &&
        docker compose logs --tail=120 kannel wml-server
      ) | tee "${SMOKE_ARTIFACT_DIR}/docker-compose.log" >&2 || true
    fi
  fi

  return "${exit_code}"
}

trap print_failure_diagnostics EXIT

export RUST_TEST_THREADS=1

wait_for_http() {
  url="$1"
  retries="${2:-40}"
  sleep_seconds="${3:-1}"
  i=1

  while [ "$i" -le "$retries" ]; do
    if curl -fsS --connect-timeout 2 --max-time 5 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_seconds"
    i=$((i + 1))
  done

  echo "Timeout waiting for $url" >&2
  return 1
}

if [ "${TRANSPORT_WAP_SKIP_INTERNAL_HEALTH}" = 0 ]; then
  echo "==> Checking Kannel admin status"
  wait_for_http "${KANNEL_ADMIN_URL}"
  curl -fsS --connect-timeout 2 --max-time 5 "${KANNEL_ADMIN_URL}" | grep -q 'Status: running'

  echo "==> Checking WML server health"
  wait_for_http "${WML_HEALTH_URL}"
else
  echo '==> Skipping local-only health URLs for remote sealed-stack smoke'
fi

echo "==> Running transport-rust WAP smoke integration test"
(
  cd "${ROOT_DIR}/transport-rust"
  export WAP_SMOKE_URL WAP_SMOKE_LOGIN_URL WAP_SMOKE_REGISTER_URL WAP_SMOKE_EXAMPLE_URL WAP_SMOKE_DENIED_URL TRANSPORT_WAP_TIMEOUT_MS TRANSPORT_WAP_RETRIES
  run_and_tee "${SMOKE_ARTIFACT_DIR}/transport-kannel-smoke.log" \
    cargo test --test kannel_smoke -- --ignored --test-threads=1
)

echo "==> Running browser host native Kannel smoke unit test"
(
  cd "${ROOT_DIR}/browser/src-tauri"
  export WAP_SMOKE_URL TRANSPORT_WAP_TIMEOUT_MS TRANSPORT_WAP_RETRIES
  run_and_tee "${SMOKE_ARTIFACT_DIR}/browser-host-native-smoke.log" \
    cargo test host_fetch_deck_command_native_wap_home_smoke_succeeds --lib -- --ignored --test-threads=1
)

echo "==> Running browser engine/render native Kannel smoke integration test"
(
  cd "${ROOT_DIR}/browser/src-tauri"
  export WAP_SMOKE_URL WAP_SMOKE_LOGIN_URL WAP_SMOKE_REGISTER_URL TRANSPORT_WAP_TIMEOUT_MS TRANSPORT_WAP_RETRIES
  run_and_tee "${SMOKE_ARTIFACT_DIR}/browser-render-native-smoke.log" \
    cargo test kannel_fetch_deck_smoke_navigates_into_menu_card -- --ignored --test-threads=1
)

echo "==> Running browser auth-form privacy native Kannel smoke integration test"
AUTH_FORM_SMOKE_RAN=1
(
  cd "${ROOT_DIR}/browser/src-tauri"
  export WAP_SMOKE_LOGIN_URL WAP_SMOKE_REGISTER_URL TRANSPORT_WAP_TIMEOUT_MS TRANSPORT_WAP_RETRIES
  run_and_tee "${SMOKE_ARTIFACT_DIR}/browser-auth-forms-smoke.log" \
    cargo test kannel_public_auth_forms_conceal_pin_and_submit_actual_value -- --ignored --test-threads=1
)

echo "transport-wap-smoke: PASS (artifacts: ${SMOKE_ARTIFACT_DIR})"
