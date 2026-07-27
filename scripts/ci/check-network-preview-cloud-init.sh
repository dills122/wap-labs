#!/usr/bin/env sh
set -eu

script_directory=$(CDPATH='' cd "$(dirname "$0")" && pwd)
repository_root=$(CDPATH='' cd "$script_directory/../.." && pwd)
fixture_root="$repository_root/infra/network-preview/tests/cloud-init-render"
data_root=$(mktemp -d "${TMPDIR:-/tmp}/wap-labs-cloud-init-check.XXXXXX")

cleanup() {
  case "$data_root" in
    "${TMPDIR:-/tmp}"/wap-labs-cloud-init-check.*) rm -rf "$data_root" ;;
    *) echo "WARN: refusing to remove unexpected temporary path: $data_root" >&2 ;;
  esac
}
trap cleanup EXIT HUP INT TERM

export TF_DATA_DIR="$data_root/tofu-data"
export TF_IN_AUTOMATION=1
export TF_INPUT=0

tofu -chdir="$fixture_root" init -backend=false -no-color >/dev/null
tofu -chdir="$fixture_root" validate -no-color >/dev/null

echo "PASS: rendered cloud-init YAML and embedded Tailscale bootstrap are valid"
