#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KANNEL_ADMIN_URL="${KANNEL_ADMIN_URL:-http://localhost:13000/status?password=changeme}"
WML_HEALTH_URL="${WML_HEALTH_URL:-http://localhost:3000/health}"

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

if [ -n "${NATIVE_E2E_ARTIFACT_DIR:-}" ]; then
  ARTIFACT_DIR="${NATIVE_E2E_ARTIFACT_DIR}"
  mkdir -p "${ARTIFACT_DIR}"
else
  mkdir -p "${ROOT_DIR}/browser/frontend/test-results"
  ARTIFACT_DIR="$(mktemp -d "${ROOT_DIR}/browser/frontend/test-results/native-tauri-kannel.XXXXXX")"
fi

cleanup() {
  exit_code="$?"
  trap - EXIT
  (
    cd "${ROOT_DIR}"
    docker compose ps --all >"${ARTIFACT_DIR}/docker-compose-ps.txt" 2>&1 || true
    docker compose logs --no-color kannel wml-server >"${ARTIFACT_DIR}/docker-compose.log" 2>&1 || true
    docker compose down >"${ARTIFACT_DIR}/docker-compose-down.log" 2>&1 || true
    docker compose ps --all >"${ARTIFACT_DIR}/docker-compose-ps-after-down.txt" 2>&1 || true
  )
  printf '%s\n' "${exit_code}" >"${ARTIFACT_DIR}/exit-code.txt"
  echo "native Tauri/Kannel artifacts: ${ARTIFACT_DIR}"
  exit "${exit_code}"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

wait_for_http() {
  url="$1"
  retries="${2:-60}"
  i=1
  while [ "${i}" -le "${retries}" ]; do
    if curl -fsS --connect-timeout 2 --max-time 5 "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "timeout waiting for ${url}" >&2
  return 1
}

cd "${ROOT_DIR}"

echo "==> Starting isolated Kannel + WML services"
export WML_DTD_VERSION=1.3
docker compose up -d --build kannel wml-server
wait_for_http "${KANNEL_ADMIN_URL}"
curl -fsS --connect-timeout 2 --max-time 5 "${KANNEL_ADMIN_URL}" | grep -q 'Status: running'
wait_for_http "${WML_HEALTH_URL}"

# The app remains production-default PublicOnly. This controlled local-stack lane opts into the
# existing host policy boundary explicitly and pins the active profile with fallback disabled.
export WAVES_FETCH_DESTINATION_POLICY=allow-private
export WAVES_FETCH_TRANSPORT_PROFILE=wap-net-core
export WAVES_FETCH_TRANSPORT_FALLBACK=disabled
export LOWBAND_TRANSPORT_PROFILE=wap-net-core
export VITE_WAVES_DEFAULT_URL=wap://localhost/
export VITE_WAVES_DEFAULT_RUN_MODE=network
export GATEWAY_HTTP_BASE="${GATEWAY_HTTP_BASE:-http://localhost:13002}"
export NATIVE_E2E_APP_BINARY="${NATIVE_E2E_APP_BINARY:-${ROOT_DIR}/browser/src-tauri/target/debug/wavenav_host}"
export NATIVE_E2E_ARTIFACT_DIR="${ARTIFACT_DIR}"
export WEBKIT_DISABLE_COMPOSITING_MODE="${WEBKIT_DISABLE_COMPOSITING_MODE:-1}"

{
  echo "tauri-driver: $(cargo install --list | sed -n '/^tauri-driver /{p;q;}')"
  echo "WebKitWebDriver: $(WebKitWebDriver --version 2>&1 | head -n 1)"
  echo "rustc: $(rustc --version)"
  echo "node: $(node --version)"
  echo "transport-profile: ${WAVES_FETCH_TRANSPORT_PROFILE}"
  echo "transport-fallback: ${WAVES_FETCH_TRANSPORT_FALLBACK}"
  echo "destination-policy: ${WAVES_FETCH_DESTINATION_POLICY}"
  echo "wml-dtd-version: ${WML_DTD_VERSION}"
} >"${ARTIFACT_DIR}/environment.txt"

echo "==> Building the production Tauri frontend and debug application binary"
pnpm --dir browser run tauri:build -- --no-bundle

echo "==> Driving the native Waves window through tauri-driver"
pnpm --dir browser/frontend run test:native-kannel:ui
