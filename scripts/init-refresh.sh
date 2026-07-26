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

ensure_wasm_pack() {
  # Pinned to match .github/workflows/{ci,pages,milestone-release}.yml, which
  # all install wasm-pack 0.13.1 explicitly. Local bootstrap previously
  # installed unpinned latest, so a local wasm-pack build could differ from
  # CI's output inventory without any repository change signaling it.
  expected_version="0.13.1"
  actual_version=""
  if command -v wasm-pack >/dev/null 2>&1; then
    actual_version="$(wasm-pack --version 2>/dev/null || true)"
  fi
  if [ "${actual_version}" = "wasm-pack ${expected_version}" ]; then
    return 0
  fi
  if [ "${AUTO_INSTALL_RUST_TOOLS}" != "1" ]; then
    warn "wasm-pack ${expected_version} required (found: ${actual_version:-missing}; set AUTO_INSTALL_RUST_TOOLS=1 to install)"
    return 0
  fi
  log "installing wasm-pack ${expected_version}"
  cargo install wasm-pack --version "${expected_version}" --locked --force
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
need_cmd go || true

if command -v cargo >/dev/null 2>&1; then
  ensure_wasm_pack
  ensure_tauri_cli
fi

if [ "${SKIP_NODE_INSTALLS}" != "1" ]; then
  if command -v pnpm >/dev/null 2>&1; then
    log "pnpm install (workspace)"
    (cd "${ROOT_DIR}" && pnpm install)

    if [ -f "${ROOT_DIR}/marketing-site/package.json" ]; then
      log "install marketing-site dependencies"
      (cd "${ROOT_DIR}" && pnpm --dir marketing-site --ignore-workspace install)
    fi

  else
    warn "pnpm not found; skipping node installs"
  fi

else
  log "skipping node installs (SKIP_NODE_INSTALLS=1)"
fi

if command -v go >/dev/null 2>&1; then
  log "verify wml-server Go module"
  (cd "${ROOT_DIR}/wml-server" && go mod verify)
else
  warn "go not found; skipping wml-server module verification"
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
