#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENVIRONMENT_CLI="${ROOT_DIR}/browser/frontend/e2e/native/environment-cli.mjs"
EVIDENCE_CLI="${ROOT_DIR}/browser/frontend/e2e/native/evidence-cli.mjs"
NATIVE_E2E_PREBUILT_IMAGES="${NATIVE_E2E_PREBUILT_IMAGES:-0}"

case "${NATIVE_E2E_PREBUILT_IMAGES}" in
  0 | 1) ;;
  *)
    echo "NATIVE_E2E_PREBUILT_IMAGES must be 0 or 1" >&2
    exit 2
    ;;
esac

KANNEL_ADMIN_PASSWORD="${KANNEL_ADMIN_PASSWORD:-changeme}"
if [ "${#KANNEL_ADMIN_PASSWORD}" -lt 4 ]; then
  echo "native E2E infrastructure secret must contain at least 4 characters" >&2
  exit 2
fi

if [ "$(uname -s)" != "Linux" ]; then
  echo "native Tauri WebDriver smoke requires Linux (tauri-driver does not support macOS)" >&2
  exit 1
fi

for required_command in docker pnpm cargo tauri-driver WebKitWebDriver; do
  if ! command -v "${required_command}" >/dev/null 2>&1; then
    echo "missing required command: ${required_command}" >&2
    exit 1
  fi
done

if [ -z "${DISPLAY:-}" ]; then
  echo "DISPLAY is unset; run this smoke under xvfb-run or an X11 session" >&2
  exit 1
fi

ARTIFACT_ROOT="${NATIVE_E2E_ARTIFACT_DIR:-${ROOT_DIR}/browser/frontend/test-results/native-tauri-kannel}"
mkdir -p "${ARTIFACT_ROOT}"
ARTIFACT_DIR="$(mktemp -d "${ARTIFACT_ROOT}/run.XXXXXX")"
RUN_NONCE="${NATIVE_E2E_RUN_NONCE:-$(basename "${ARTIFACT_DIR}")}"
COMPOSE_PROJECT="$(node "${ENVIRONMENT_CLI}" run-id "${RUN_NONCE}" "$$")"
COMPOSE_OWNED=0
WML_ORIGIN_INSTANCE_ID="${COMPOSE_PROJECT}"
export WML_ORIGIN_INSTANCE_ID
export NATIVE_E2E_RUN_ID="${COMPOSE_PROJECT}"

compose_e2e() {
  docker compose \
    --project-name "${COMPOSE_PROJECT}" \
    --file "${ROOT_DIR}/docker-compose.yml" \
    --file "${ROOT_DIR}/docker-compose.native-e2e.yml" \
    "$@"
}

RUNTIME_ROOT="${ARTIFACT_DIR}/runtime"
export XDG_DATA_HOME="${RUNTIME_ROOT}/xdg-data"
export XDG_CONFIG_HOME="${RUNTIME_ROOT}/xdg-config"
export XDG_CACHE_HOME="${RUNTIME_ROOT}/xdg-cache"
export XDG_STATE_HOME="${RUNTIME_ROOT}/xdg-state"
export XDG_RUNTIME_DIR="${RUNTIME_ROOT}/xdg-runtime"
mkdir -p \
  "${XDG_DATA_HOME}" \
  "${XDG_CONFIG_HOME}" \
  "${XDG_CACHE_HOME}" \
  "${XDG_STATE_HOME}" \
  "${XDG_RUNTIME_DIR}"
chmod 700 "${XDG_RUNTIME_DIR}"

cleanup() {
  exit_code="$?"
  cleanup_failed=0
  trap - EXIT
  if [ "${COMPOSE_OWNED}" -eq 1 ]; then
    (
      compose_e2e ps --all >"${ARTIFACT_DIR}/docker-compose-ps.txt" 2>&1 || cleanup_failed=1
      compose_e2e down >"${ARTIFACT_DIR}/docker-compose-down.log" 2>&1 || cleanup_failed=1
      compose_e2e ps --all >"${ARTIFACT_DIR}/docker-compose-ps-after-down.txt" 2>&1 || cleanup_failed=1
      remaining="$(compose_e2e ps --all --quiet 2>/dev/null || true)"
      if [ -n "${remaining}" ]; then
        cleanup_failed=1
      fi
      exit "${cleanup_failed}"
    ) || cleanup_failed=1
  fi
  if [ "${cleanup_failed}" -ne 0 ]; then
    exit_code=1
  fi
  node "${EVIDENCE_CLI}" ensure-run-failure \
    "${ARTIFACT_DIR}" "${COMPOSE_PROJECT}" >/dev/null 2>&1 || exit_code=1
  printf '%s\n' "${exit_code}" >"${ARTIFACT_DIR}/exit-code.txt"
  echo "native Tauri/Kannel artifacts: ${ARTIFACT_DIR}"
  exit "${exit_code}"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

wait_for_http() {
  label="$1"
  url="$2"
  retries="${3:-60}"
  i=1
  while [ "${i}" -le "${retries}" ]; do
    if curl -fsS --connect-timeout 2 --max-time 5 "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "timeout waiting for ${label}" >&2
  return 1
}

cd "${ROOT_DIR}"

echo "==> Starting isolated Kannel + WML services"
export WML_DTD_VERSION=1.3
if [ -n "$(compose_e2e ps --all --quiet)" ]; then
  echo "native E2E Compose project was not empty before startup" >&2
  exit 1
fi
COMPOSE_OWNED=1
if [ "${NATIVE_E2E_PREBUILT_IMAGES}" = 1 ]; then
  compose_e2e up -d --no-build kannel wml-server
else
  compose_e2e up -d --build kannel wml-server
fi

KANNEL_ADMIN_BINDING="$(compose_e2e port kannel 13000 --protocol tcp)"
WML_INTERNAL_BINDING="$(compose_e2e port wml-server 3001 --protocol tcp)"
WML_PUBLIC_BINDING="$(compose_e2e port wml-server 3000 --protocol tcp)"
GATEWAY_UDP_BINDING="$(compose_e2e port kannel 9200 --protocol udp)"
KANNEL_ADMIN_BASE="$(node "${ENVIRONMENT_CLI}" url http tcp "${KANNEL_ADMIN_BINDING}")"
WML_INTERNAL_BASE="$(node "${ENVIRONMENT_CLI}" url http tcp "${WML_INTERNAL_BINDING}")"
WML_PUBLIC_BASE="$(node "${ENVIRONMENT_CLI}" url http tcp "${WML_PUBLIC_BINDING}")"
export KANNEL_ADMIN_PASSWORD
KANNEL_ADMIN_URL="${KANNEL_ADMIN_BASE}/status?password=${KANNEL_ADMIN_PASSWORD}"
WML_HEALTH_URL="${WML_INTERNAL_BASE}/health"
WML_METRICS_URL="${WML_INTERNAL_BASE}/metrics"
WAVES_FETCH_ROUTING_MANIFEST="${ARTIFACT_DIR}/fetch-routing.json"
node "${ENVIRONMENT_CLI}" write-manifest \
  "${WAVES_FETCH_ROUTING_MANIFEST}" \
  "${COMPOSE_PROJECT}" \
  "${COMPOSE_PROJECT}" \
  "${GATEWAY_UDP_BINDING}" \
  "${WML_ORIGIN_INSTANCE_ID}"
export WAVES_FETCH_ROUTING_MANIFEST

wait_for_http "Kannel admin status" "${KANNEL_ADMIN_URL}"
curl -fsS --connect-timeout 2 --max-time 5 "${KANNEL_ADMIN_URL}" | grep -q 'Status: running'
wait_for_http "WML origin health" "${WML_HEALTH_URL}"
curl -fsS --connect-timeout 2 --max-time 5 "${WML_HEALTH_URL}" |
  grep -Fq "\"originInstanceId\":\"${WML_ORIGIN_INSTANCE_ID}\""

echo "==> Verifying owned native WAP routing before launching the browser"
(
  cd "${ROOT_DIR}/transport-rust"
  export WAP_GATEWAY_ENDPOINT="${GATEWAY_UDP_BINDING}"
  cargo test --test kannel_smoke kannel_wap_owned_origin_identity_smoke -- --ignored --exact --test-threads=1
)

# The app remains production-default PublicOnly. This controlled local-stack lane opts into the
# existing host policy boundary explicitly and pins the active profile with fallback disabled.
export WAVES_FETCH_DESTINATION_POLICY=allow-private
export WAVES_FETCH_TRANSPORT_PROFILE=wap-net-core
export WAVES_FETCH_TRANSPORT_FALLBACK=disabled
export LOWBAND_TRANSPORT_PROFILE=wap-net-core
export VITE_WAVES_DEFAULT_URL=wap://localhost/
export VITE_WAVES_DEFAULT_RUN_MODE=network
export NATIVE_E2E_APP_BINARY="${NATIVE_E2E_APP_BINARY:-${ROOT_DIR}/browser/src-tauri/target/debug/wavenav_host}"
export NATIVE_E2E_ARTIFACT_DIR="${ARTIFACT_DIR}"
export WML_METRICS_URL
export WML_PUBLIC_BASE
export WEBKIT_DISABLE_COMPOSITING_MODE="${WEBKIT_DISABLE_COMPOSITING_MODE:-1}"

{
  echo "tauri-driver: $(tauri-driver --version 2>&1 | head -n 1)"
  echo "WebKitWebDriver: $(WebKitWebDriver --version 2>&1 | head -n 1)"
  echo "rustc: $(rustc --version)"
  echo "node: $(node --version)"
  echo "transport-profile: ${WAVES_FETCH_TRANSPORT_PROFILE}"
  echo "transport-fallback: ${WAVES_FETCH_TRANSPORT_FALLBACK}"
  echo "destination-policy: ${WAVES_FETCH_DESTINATION_POLICY}"
  echo "wml-dtd-version: ${WML_DTD_VERSION}"
  echo "request-observation: ${WML_METRICS_URL}"
} >"${ARTIFACT_DIR}/environment.txt"

echo "==> Building the production Tauri frontend and debug application binary"
(
  cd "${ROOT_DIR}/browser/src-tauri"
  cargo tauri build --debug --no-bundle
)

echo "==> Driving the native Waves window through tauri-driver"
pnpm --dir browser/frontend run test:native-kannel:ui
