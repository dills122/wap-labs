#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH='' cd "$(dirname "$0")/../.." && pwd)
exec node "$ROOT/spec-processing/scripts/check-docling-cleaned-quality.mjs" "$@"
