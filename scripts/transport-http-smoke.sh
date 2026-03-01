#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WML_SERVER_PORT="${WML_SERVER_PORT:-3000}"
TRANSPORT_PORT="${TRANSPORT_PORT:-8765}"
TRANSPORT_BIND="${TRANSPORT_BIND:-127.0.0.1}"
TRANSPORT_SERVICE_DIR="${ROOT_DIR}/transport-python"
TRANSPORT_BOOTSTRAP_PYTHON="${TRANSPORT_BOOTSTRAP_PYTHON:-python3}"

WML_PID=""
TRANSPORT_PID=""

cleanup() {
  if [[ -n "${TRANSPORT_PID}" ]] && kill -0 "${TRANSPORT_PID}" >/dev/null 2>&1; then
    kill "${TRANSPORT_PID}" >/dev/null 2>&1 || true
    wait "${TRANSPORT_PID}" 2>/dev/null || true
  fi
  if [[ -n "${WML_PID}" ]] && kill -0 "${WML_PID}" >/dev/null 2>&1; then
    kill "${WML_PID}" >/dev/null 2>&1 || true
    wait "${WML_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "==> Ensuring transport-python venv and dependencies"
if [[ ! -x "${TRANSPORT_SERVICE_DIR}/.venv/bin/python" ]]; then
  (
    cd "${TRANSPORT_SERVICE_DIR}"
    "${TRANSPORT_BOOTSTRAP_PYTHON}" -m venv .venv
  )
fi
(
  cd "${TRANSPORT_SERVICE_DIR}"
  .venv/bin/python -m pip install -r requirements.txt >/tmp/transport-pip.log 2>&1
)

echo "==> Starting local WML server on port ${WML_SERVER_PORT}"
(
  cd "${ROOT_DIR}/wml-server"
  PORT="${WML_SERVER_PORT}" npm start >/tmp/wml-server.log 2>&1
) &
WML_PID=$!

echo "==> Starting transport-python service on ${TRANSPORT_BIND}:${TRANSPORT_PORT}"
(
  cd "${TRANSPORT_SERVICE_DIR}"
  TRANSPORT_BIND="${TRANSPORT_BIND}" TRANSPORT_PORT="${TRANSPORT_PORT}" .venv/bin/python service.py >/tmp/transport-python.log 2>&1
) &
TRANSPORT_PID=$!

echo "==> Waiting for services to become healthy"
ready="0"
for _ in $(seq 1 40); do
  if curl -fsS "http://${TRANSPORT_BIND}:${TRANSPORT_PORT}/health" >/dev/null 2>&1 \
    && curl -fsS "http://127.0.0.1:${WML_SERVER_PORT}/" >/dev/null 2>&1; then
    ready="1"
    break
  fi
  sleep 0.25
done

if [[ "${ready}" != "1" ]]; then
  echo "transport-http-smoke: services failed to become healthy"
  echo "--- transport-python.log ---"
  sed -n '1,200p' /tmp/transport-python.log || true
  echo "--- transport-pip.log ---"
  sed -n '1,200p' /tmp/transport-pip.log || true
  echo "--- wml-server.log ---"
  sed -n '1,200p' /tmp/wml-server.log || true
  exit 1
fi

echo "==> Running transport fetch smoke check"
RESPONSE="$(curl -fsS -X POST "http://${TRANSPORT_BIND}:${TRANSPORT_PORT}/fetch" \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"http://127.0.0.1:${WML_SERVER_PORT}/\",\"method\":\"GET\",\"timeoutMs\":5000,\"retries\":1}")"

python3 - "$RESPONSE" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])

assert payload.get("ok") is True, f"expected ok=true, got: {payload}"
assert payload.get("status", 0) >= 200, f"expected HTTP status, got: {payload.get('status')}"
engine_input = payload.get("engineDeckInput") or {}
wml = engine_input.get("wmlXml", "")
assert "<wml" in wml.lower(), "expected engineDeckInput.wmlXml to contain WML payload"
print("transport-http-smoke: PASS")
PY
