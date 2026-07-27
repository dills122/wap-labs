#!/usr/bin/env sh

network_preview_fail() {
  echo "FAIL: $*" >&2
  exit 1
}

network_preview_require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    network_preview_fail "required command not found: $1"
  fi
}

network_preview_require_value() {
  variable_name=$1
  eval "variable_value=\${$variable_name:-}"
  if [ -z "$variable_value" ]; then
    network_preview_fail "required environment variable is unset: $variable_name"
  fi
}

network_preview_validate_account_id() {
  if [ "${#NETWORK_PREVIEW_R2_ACCOUNT_ID}" -ne 32 ] ||
    ! printf '%s\n' "$NETWORK_PREVIEW_R2_ACCOUNT_ID" | grep -Eq '^[0-9a-f]{32}$'; then
    network_preview_fail \
      "NETWORK_PREVIEW_R2_ACCOUNT_ID must be a 32-character lowercase hexadecimal ID"
  fi
}

network_preview_validate_bucket() {
  if ! printf '%s\n' "$NETWORK_PREVIEW_R2_BUCKET" |
    grep -Eq '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'; then
    network_preview_fail \
      "NETWORK_PREVIEW_R2_BUCKET must be a 3-63 character lowercase bucket name"
  fi
}

network_preview_validate_state_key() {
  if [ "$NETWORK_PREVIEW_R2_STATE_KEY" != "wap-labs/network-preview/preview.tfstate" ]; then
    network_preview_fail \
      "NETWORK_PREVIEW_R2_STATE_KEY must equal wap-labs/network-preview/preview.tfstate"
  fi
}

network_preview_validate_recovery_prefix() {
  if [ "${NETWORK_PREVIEW_R2_RECOVERY_PREFIX:-}" != "wap-labs/network-preview/recovery" ]; then
    network_preview_fail \
      "NETWORK_PREVIEW_R2_RECOVERY_PREFIX must equal wap-labs/network-preview/recovery"
  fi
}

network_preview_validate_r2_contract() {
  network_preview_validate_account_id
  network_preview_validate_bucket
  network_preview_validate_state_key
  network_preview_validate_recovery_prefix
}

network_preview_sha256_file() {
  file_path=$1
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file_path" | awk '{ print $1 }'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file_path" | awk '{ print $1 }'
    return
  fi
  network_preview_fail "sha256sum or shasum is required"
}

network_preview_write_output() {
  output_name=$1
  output_value=$2
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s=%s\n' "$output_name" "$output_value" >>"$GITHUB_OUTPUT"
  else
    printf '%s=%s\n' "$output_name" "$output_value"
  fi
}
