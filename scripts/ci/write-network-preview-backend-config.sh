#!/usr/bin/env sh
set -eu

script_directory=$(CDPATH='' cd "$(dirname "$0")" && pwd)
# shellcheck source=scripts/ci/network-preview-lib.sh
. "$script_directory/network-preview-lib.sh"

network_preview_require_value NETWORK_PREVIEW_R2_ACCOUNT_ID
network_preview_require_value NETWORK_PREVIEW_R2_BUCKET
network_preview_require_value NETWORK_PREVIEW_R2_STATE_KEY
network_preview_require_value NETWORK_PREVIEW_R2_RECOVERY_PREFIX
network_preview_validate_r2_contract

if [ "$#" -ne 1 ]; then
  network_preview_fail "usage: $0 BACKEND_CONFIG_PATH"
fi

backend_config_path=$1
if [ -e "$backend_config_path" ]; then
  network_preview_fail "refusing to overwrite backend configuration: $backend_config_path"
fi

backend_parent=$(dirname "$backend_config_path")
if [ ! -d "$backend_parent" ]; then
  network_preview_fail "backend configuration parent does not exist: $backend_parent"
fi

endpoint="https://${NETWORK_PREVIEW_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
umask 077
{
  printf 'bucket = "%s"\n' "$NETWORK_PREVIEW_R2_BUCKET"
  printf 'key = "%s"\n' "$NETWORK_PREVIEW_R2_STATE_KEY"
  printf 'endpoints = { s3 = "%s" }\n' "$endpoint"
} >"$backend_config_path"

echo "PASS: wrote partial R2 backend configuration"
