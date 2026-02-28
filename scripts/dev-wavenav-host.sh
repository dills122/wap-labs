#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v wasm-pack >/dev/null 2>&1; then
  echo "error: wasm-pack is required but not installed."
  echo "install: cargo install wasm-pack"
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "error: pnpm is required but not installed."
  echo "install: corepack enable && corepack prepare pnpm@10.23.0 --activate"
  exit 1
fi

echo "==> Building WaveNav wasm package..."
(
  cd "$ROOT_DIR/engine-wasm/engine"
  wasm-pack build --target web --out-dir ../pkg
)

echo "==> Starting WaveNav host sample dev server..."
(
  cd "$ROOT_DIR/engine-wasm/host-sample"
  pnpm run dev
)
