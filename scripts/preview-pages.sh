#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="4173"
SERVE="1"
INSTALL_MODE="auto"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [--port <port>] [--no-serve] [--install|--skip-install]

Builds marketing-site, simulator, and project Atlas, assembles a local GitHub Pages-style
artifact in ./_site, and optionally serves it.

Options:
  --port <port>  Port for local preview server (default: 4173)
  --no-serve     Build and assemble only; do not start local server
  --install      Force dependency install steps before build
  --skip-install Skip dependency install steps before build
  -h, --help     Show this help
USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required command not found: $1" >&2
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      if [[ $# -lt 2 ]]; then
        echo "error: --port requires a value" >&2
        exit 1
      fi
      PORT="$2"
      shift 2
      ;;
    --no-serve)
      SERVE="0"
      shift
      ;;
    --install)
      INSTALL_MODE="force"
      shift
      ;;
    --skip-install)
      INSTALL_MODE="skip"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_cmd pnpm
require_cmd wasm-pack
require_cmd python3

should_install() {
  local dir="$1"
  if [[ "$INSTALL_MODE" == "force" ]]; then
    return 0
  fi
  if [[ "$INSTALL_MODE" == "skip" ]]; then
    return 1
  fi
  [[ ! -d "$dir/node_modules" ]]
}

if should_install "$ROOT_DIR/marketing-site"; then
  echo "==> Installing marketing-site dependencies"
  pnpm --dir "$ROOT_DIR/marketing-site" --ignore-workspace install --frozen-lockfile
else
  echo "==> Skipping marketing-site install (dependencies already present)"
fi

echo "==> Building marketing-site"
pnpm --dir "$ROOT_DIR/marketing-site" --ignore-workspace run build

echo "==> Building WaveNav wasm package"
(
  cd "$ROOT_DIR/engine-wasm/engine"
  wasm-pack build --target web --out-dir ../pkg
)

if should_install "$ROOT_DIR/engine-wasm/host-sample"; then
  echo "==> Installing simulator dependencies"
  pnpm --dir "$ROOT_DIR/engine-wasm/host-sample" install --frozen-lockfile --config.shared-workspace-lockfile=false
else
  echo "==> Skipping simulator install (dependencies already present)"
fi

echo "==> Building simulator"
pnpm --dir "$ROOT_DIR/engine-wasm/host-sample" run build

if should_install "$ROOT_DIR/docs-portal"; then
  echo "==> Installing project Atlas dependencies"
  pnpm --dir "$ROOT_DIR" install --frozen-lockfile --ignore-scripts
else
  echo "==> Skipping project Atlas install (dependencies already present)"
fi

echo "==> Building project Atlas"
pnpm --dir "$ROOT_DIR/docs-portal" run build

echo "==> Assembling _site artifact"
rm -rf "$ROOT_DIR/_site"
mkdir -p "$ROOT_DIR/_site/simulator" "$ROOT_DIR/_site/atlas"
cp -R "$ROOT_DIR/marketing-site/dist/." "$ROOT_DIR/_site/"
cp -R "$ROOT_DIR/engine-wasm/host-sample/dist/." "$ROOT_DIR/_site/simulator/"
cp -R "$ROOT_DIR/docs-portal/dist/." "$ROOT_DIR/_site/atlas/"
touch "$ROOT_DIR/_site/.nojekyll"

echo "==> Artifact ready"
echo "    Root:      $ROOT_DIR/_site/index.html"
echo "    Simulator: $ROOT_DIR/_site/simulator/index.html"
echo "    Atlas:     $ROOT_DIR/_site/atlas/index.html"

PREVIEW_ROOT="$ROOT_DIR/_site-preview"
rm -rf "$PREVIEW_ROOT"
mkdir -p "$PREVIEW_ROOT/wap-labs"
cp -R "$ROOT_DIR/_site/." "$PREVIEW_ROOT/wap-labs/"

if [[ "$SERVE" == "0" ]]; then
  echo "    Preview:   $PREVIEW_ROOT/wap-labs/index.html"
  echo "==> Done (no server started)"
  exit 0
fi

echo "==> Serving Pages-style bundle at http://localhost:${PORT}/wap-labs/"
echo "    Marketing: http://localhost:${PORT}/wap-labs/"
echo "    Simulator: http://localhost:${PORT}/wap-labs/simulator/"
echo "    Atlas:     http://localhost:${PORT}/wap-labs/atlas/"
echo "    Press Ctrl+C to stop"
python3 -m http.server "$PORT" -d "$PREVIEW_ROOT"
