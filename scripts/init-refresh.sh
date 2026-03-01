#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTO_INSTALL_RUST_TOOLS="${AUTO_INSTALL_RUST_TOOLS:-0}"
SKIP_NODE_INSTALLS="${SKIP_NODE_INSTALLS:-0}"
SKIP_PYTHON_SETUP="${SKIP_PYTHON_SETUP:-0}"
SKIP_HOOKS="${SKIP_HOOKS:-0}"

log() {
  echo "==> $*"
}

warn() {
  echo "warn: $*" >&2
}

need_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    warn "missing required command: ${cmd}"
    return 1
  fi
  return 0
}

ensure_rust_tool() {
  local check_cmd="$1"
  local install_cmd="$2"
  if command -v "${check_cmd}" >/dev/null 2>&1; then
    return 0
  fi
  if [[ "${AUTO_INSTALL_RUST_TOOLS}" != "1" ]]; then
    warn "${check_cmd} not found (set AUTO_INSTALL_RUST_TOOLS=1 to auto-install)"
    return 0
  fi
  log "installing ${check_cmd}"
  eval "${install_cmd}"
}

log "repo root: ${ROOT_DIR}"

need_cmd python3 || true
need_cmd node || true
need_cmd pnpm || true
need_cmd cargo || true

if command -v cargo >/dev/null 2>&1; then
  ensure_rust_tool wasm-pack "cargo install wasm-pack --locked"
  ensure_rust_tool cargo-tauri "cargo install tauri-cli --version '^2.0' --locked"
fi

if [[ "${SKIP_NODE_INSTALLS}" != "1" ]]; then
  if command -v pnpm >/dev/null 2>&1; then
    log "pnpm install (workspace)"
    (cd "${ROOT_DIR}" && pnpm install)

    log "install browser frontend dependencies"
    (cd "${ROOT_DIR}" && pnpm --dir browser/frontend install)

    if [[ -f "${ROOT_DIR}/engine-wasm/host-sample/package.json" ]]; then
      log "install host-sample dependencies"
      (cd "${ROOT_DIR}" && pnpm --dir engine-wasm/host-sample install --ignore-workspace)
    fi

    if [[ -f "${ROOT_DIR}/marketing-site/package.json" ]]; then
      log "install marketing-site dependencies"
      (cd "${ROOT_DIR}" && pnpm --dir marketing-site --ignore-workspace install)
    fi

    log "refresh generated transport contract"
    (cd "${ROOT_DIR}" && pnpm run generate:transport-contract)
  else
    warn "pnpm not found; skipping node installs"
  fi

  if command -v npm >/dev/null 2>&1 && [[ -f "${ROOT_DIR}/wml-server/package.json" ]]; then
    log "install wml-server dependencies"
    (cd "${ROOT_DIR}" && npm --prefix wml-server install)
  else
    warn "npm not found; skipping wml-server dependency install"
  fi
else
  log "skipping node installs (SKIP_NODE_INSTALLS=1)"
fi

if [[ "${SKIP_PYTHON_SETUP}" != "1" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    log "setup transport-python virtualenv"
    (cd "${ROOT_DIR}/transport-python" && python3 -m venv .venv)
    log "install transport-python runtime + dev dependencies"
    (
      cd "${ROOT_DIR}/transport-python" && \
      .venv/bin/python -m pip install --upgrade pip && \
      .venv/bin/python -m pip install -r requirements.txt -r requirements-dev.txt
    )
  else
    warn "python3 not found; skipping transport-python setup"
  fi
else
  log "skipping python setup (SKIP_PYTHON_SETUP=1)"
fi

if [[ "${SKIP_HOOKS}" != "1" ]]; then
  if command -v pre-commit >/dev/null 2>&1; then
    log "installing repo hooks"
    (cd "${ROOT_DIR}" && make hooks-install)
  else
    warn "pre-commit not found; skipping hook install"
    warn "install with: pipx install pre-commit"
  fi
else
  log "skipping hook setup (SKIP_HOOKS=1)"
fi

log "init-refresh complete"
