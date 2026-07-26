#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AUTO_INSTALL_RUST_TOOLS="${AUTO_INSTALL_RUST_TOOLS:-0}"
SKIP_NODE_INSTALLS="${SKIP_NODE_INSTALLS:-0}"
SKIP_HOOKS="${SKIP_HOOKS:-0}"

log() {
  echo "==> $*"
}

warn() {
  echo "warn: $*" >&2
}

need_cmd() {
  cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    warn "missing required command: ${cmd}"
    return 1
  fi
  return 0
}

ensure_rust_tool() {
  check_cmd="$1"
  install_cmd="$2"
  if command -v "${check_cmd}" >/dev/null 2>&1; then
    return 0
  fi
  if [ "${AUTO_INSTALL_RUST_TOOLS}" != "1" ]; then
    warn "${check_cmd} not found (set AUTO_INSTALL_RUST_TOOLS=1 to auto-install)"
    return 0
  fi
  log "installing ${check_cmd}"
  eval "${install_cmd}"
}

ensure_tauri_cli() {
  expected_version="2.10.0"
  actual_version=""
  if command -v cargo-tauri >/dev/null 2>&1; then
    actual_version="$(cargo tauri --version 2>/dev/null || true)"
  fi
  if [ "${actual_version}" = "tauri-cli ${expected_version}" ]; then
    return 0
  fi
  if [ "${AUTO_INSTALL_RUST_TOOLS}" != "1" ]; then
    warn "tauri-cli ${expected_version} required (found: ${actual_version:-missing}; set AUTO_INSTALL_RUST_TOOLS=1 to install)"
    return 0
  fi
  log "installing tauri-cli ${expected_version}"
  cargo install tauri-cli --version "${expected_version}" --locked --force
}

log "repo root: ${ROOT_DIR}"

need_cmd node || true
need_cmd pnpm || true
need_cmd cargo || true

if command -v cargo >/dev/null 2>&1; then
  ensure_rust_tool wasm-pack "cargo install wasm-pack --locked"
  ensure_tauri_cli
fi

if [ "${SKIP_NODE_INSTALLS}" != "1" ]; then
  if command -v pnpm >/dev/null 2>&1; then
    log "pnpm install (workspace)"
    (cd "${ROOT_DIR}" && pnpm install)

    log "install browser frontend dependencies"
    (cd "${ROOT_DIR}" && pnpm --dir browser/frontend install)

    if [ -f "${ROOT_DIR}/engine-wasm/host-sample/package.json" ]; then
      log "install host-sample dependencies"
      (cd "${ROOT_DIR}" && pnpm --dir engine-wasm/host-sample install --ignore-workspace)
    fi

    if [ -f "${ROOT_DIR}/marketing-site/package.json" ]; then
      log "install marketing-site dependencies"
      (cd "${ROOT_DIR}" && pnpm --dir marketing-site --ignore-workspace install)
    fi

  else
    warn "pnpm not found; skipping node installs"
  fi

  if command -v npm >/dev/null 2>&1 && [ -f "${ROOT_DIR}/wml-server/package.json" ]; then
    log "install wml-server dependencies"
    (cd "${ROOT_DIR}" && npm --prefix wml-server install)
  else
    warn "npm not found; skipping wml-server dependency install"
  fi
else
  log "skipping node installs (SKIP_NODE_INSTALLS=1)"
fi

if [ "${SKIP_HOOKS}" != "1" ]; then
  if command -v pre-commit >/dev/null 2>&1; then
    log "installing repo hooks"
    (cd "${ROOT_DIR}" && make hooks-install)
  else
    warn "pre-commit not found; skipping hook install"
    warn "install pre-commit with your package manager to enable hooks"
  fi
else
  log "skipping hook setup (SKIP_HOOKS=1)"
fi

log "init-refresh complete"
