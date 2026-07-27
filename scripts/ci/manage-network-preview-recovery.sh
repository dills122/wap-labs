#!/usr/bin/env sh
set -eu

script_directory=$(CDPATH='' cd "$(dirname "$0")" && pwd)
# shellcheck source=scripts/ci/network-preview-lib.sh
. "$script_directory/network-preview-lib.sh"

for command_name in aws jq grep mktemp sort sed wc date tofu; do
  network_preview_require_command "$command_name"
done

for variable_name in \
  NETWORK_PREVIEW_R2_ACCOUNT_ID \
  NETWORK_PREVIEW_R2_BUCKET \
  NETWORK_PREVIEW_R2_STATE_KEY \
  NETWORK_PREVIEW_R2_RECOVERY_PREFIX \
  AWS_ACCESS_KEY_ID \
  AWS_SECRET_ACCESS_KEY \
  SOURCE_COMMIT \
  APPLY_RUN_ID \
  APPLY_RUN_ATTEMPT \
  TOFU_ROOT; do
  network_preview_require_value "$variable_name"
done

network_preview_validate_r2_contract
if ! printf '%s\n' "$SOURCE_COMMIT" | grep -Eq '^[0-9a-f]{40}$'; then
  network_preview_fail "SOURCE_COMMIT must be a lowercase 40-character commit SHA"
fi
for numeric_value in "$APPLY_RUN_ID" "$APPLY_RUN_ATTEMPT"; do
  if ! printf '%s\n' "$numeric_value" | grep -Eq '^[1-9][0-9]*$'; then
    network_preview_fail "apply run ID and attempt must be positive integers"
  fi
done
if [ ! -d "$TOFU_ROOT" ]; then
  network_preview_fail "TOFU_ROOT is not a directory: $TOFU_ROOT"
fi

case "${1:-}" in
  prepare | assert | finalize) recovery_phase=$1 ;;
  *) network_preview_fail "usage: $0 prepare|assert|finalize" ;;
esac

if [ "$recovery_phase" = "prepare" ]; then
  network_preview_require_value RECOVERY_NONCE
  if ! printf '%s\n' "$RECOVERY_NONCE" | grep -Eq '^[0-9a-f]{32}$'; then
    network_preview_fail "RECOVERY_NONCE must be 128 bits of lowercase hexadecimal data"
  fi
else
  RECOVERY_KEY=${RECOVERY_KEY:-}
  RECOVERY_SHA256=${RECOVERY_SHA256:-}
  network_preview_require_value RECOVERY_MODE
  case "$RECOVERY_MODE" in
    copy)
      network_preview_require_value RECOVERY_KEY
      network_preview_require_value RECOVERY_SHA256
      ;;
    bootstrap) ;;
    *) network_preview_fail "RECOVERY_MODE must be copy or bootstrap" ;;
  esac
fi

work_root=$(mktemp -d "${TMPDIR:-/tmp}/wap-labs-r2-recovery.XXXXXX")
endpoint="https://${NETWORK_PREVIEW_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
state_key=$NETWORK_PREVIEW_R2_STATE_KEY
lock_key="${state_key}.tflock"
recovery_prefix="${NETWORK_PREVIEW_R2_RECOVERY_PREFIX%/}/"

cleanup() {
  case "$work_root" in
    "${TMPDIR:-/tmp}"/wap-labs-r2-recovery.*) rm -rf "$work_root" ;;
    *) echo "WARN: refusing to remove unexpected temporary path: $work_root" >&2 ;;
  esac
}
trap cleanup EXIT HUP INT TERM

export AWS_REGION=auto
export AWS_DEFAULT_REGION=auto

list_objects() {
  object_prefix=$1
  output_path=$2
  aws s3api list-objects-v2 \
    --bucket "$NETWORK_PREVIEW_R2_BUCKET" \
    --prefix "$object_prefix" \
    --endpoint-url "$endpoint" \
    --no-cli-pager \
    --output json >"$output_path"
}

object_count() {
  object_key=$1
  list_path="$work_root/object-list.json"
  list_objects "$object_key" "$list_path"
  jq -er --arg key "$object_key" \
    '[.Contents[]? | select(.Key == $key)] | length' "$list_path"
}

download_object() {
  object_key=$1
  destination=$2
  aws s3api get-object \
    --bucket "$NETWORK_PREVIEW_R2_BUCKET" \
    --key "$object_key" \
    --endpoint-url "$endpoint" \
    --no-cli-pager \
    "$destination" >/dev/null
}

head_object() {
  object_key=$1
  destination=$2
  aws s3api head-object \
    --bucket "$NETWORK_PREVIEW_R2_BUCKET" \
    --key "$object_key" \
    --endpoint-url "$endpoint" \
    --no-cli-pager \
    --output json >"$destination"
}

require_exact_object_count() {
  object_key=$1
  expected_count=$2
  actual_count=$(object_count "$object_key")
  if [ "$actual_count" -ne "$expected_count" ]; then
    network_preview_fail \
      "expected $expected_count object(s) at $object_key, found $actual_count"
  fi
}

verify_recovery_object() {
  object_key=$1
  file_stem=$2
  head_path="$work_root/${file_stem}.head.json"
  body_path="$work_root/${file_stem}.body"
  head_object "$object_key" "$head_path"
  expected_digest=$(jq -er '
    .Metadata
    | select(.["recovery-format"] == "v1")
    | .["source-sha256"]
    | select(type == "string" and test("^[0-9a-f]{64}$"))
  ' "$head_path")
  if ! jq -e \
    --arg source_key "$state_key" \
    '
      .Metadata["source-key"] == $source_key
      and (.Metadata["source-commit"] | type == "string" and test("^[0-9a-f]{40}$"))
      and (.Metadata["apply-run-id"] | type == "string" and test("^[1-9][0-9]*$"))
      and (.Metadata["apply-run-attempt"] | type == "string" and test("^[1-9][0-9]*$"))
      and (.Metadata["created-at"] | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T"))
    ' "$head_path" >/dev/null; then
    network_preview_fail "recovery metadata is incomplete for $object_key"
  fi
  download_object "$object_key" "$body_path"
  actual_digest=$(network_preview_sha256_file "$body_path")
  if [ "$actual_digest" != "$expected_digest" ]; then
    network_preview_fail "recovery object SHA-256 does not match metadata: $object_key"
  fi
  verified_recovery_digest=$actual_digest
}

verify_selected_recovery_object() {
  if ! printf '%s\n' "$RECOVERY_KEY" | grep -Eq \
    "^${recovery_prefix}${SOURCE_COMMIT}/${APPLY_RUN_ID}-${APPLY_RUN_ATTEMPT}-[0-9a-f]{32}\\.tfstate$"; then
    network_preview_fail "selected recovery key does not match this apply run provenance"
  fi
  verify_recovery_object "$RECOVERY_KEY" selected-recovery
  if ! jq -e \
    --arg source_commit "$SOURCE_COMMIT" \
    --arg apply_run_id "$APPLY_RUN_ID" \
    --arg apply_run_attempt "$APPLY_RUN_ATTEMPT" '
      .Metadata["source-commit"] == $source_commit
      and .Metadata["apply-run-id"] == $apply_run_id
      and .Metadata["apply-run-attempt"] == $apply_run_attempt
    ' "$work_root/selected-recovery.head.json" >/dev/null; then
    network_preview_fail "selected recovery metadata does not match this apply run provenance"
  fi
}

prepare_recovery() {
  require_exact_object_count "$lock_key" 0
  state_count=$(object_count "$state_key")
  case "$state_count" in
    0)
      # This is permitted only for the serialized first resource-creating apply.
      require_exact_object_count "$lock_key" 0
      network_preview_write_output recovery_mode bootstrap
      network_preview_write_output recovery_key none
      network_preview_write_output recovery_sha256 none
      echo "PASS: bootstrap proven immediately before apply; state and lock keys are absent"
      ;;
    1)
      source_path="$work_root/source.tfstate"
      source_recheck_path="$work_root/source-recheck.tfstate"
      recovery_path="$work_root/recovery.tfstate"
      download_object "$state_key" "$source_path"
      source_digest=$(network_preview_sha256_file "$source_path")
      recovery_key="${recovery_prefix}${SOURCE_COMMIT}/${APPLY_RUN_ID}-${APPLY_RUN_ATTEMPT}-${RECOVERY_NONCE}.tfstate"
      require_exact_object_count "$recovery_key" 0
      created_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

      aws s3api put-object \
        --bucket "$NETWORK_PREVIEW_R2_BUCKET" \
        --key "$recovery_key" \
        --body "$source_path" \
        --content-type application/octet-stream \
        --if-none-match '*' \
        --metadata \
        "recovery-format=v1,source-key=${state_key},source-sha256=${source_digest},source-commit=${SOURCE_COMMIT},apply-run-id=${APPLY_RUN_ID},apply-run-attempt=${APPLY_RUN_ATTEMPT},created-at=${created_at}" \
        --endpoint-url "$endpoint" \
        --no-cli-pager >/dev/null

      require_exact_object_count "$recovery_key" 1
      download_object "$recovery_key" "$recovery_path"
      recovery_digest=$(network_preview_sha256_file "$recovery_path")
      if [ "$recovery_digest" != "$source_digest" ]; then
        network_preview_fail "encrypted recovery copy does not match its source SHA-256"
      fi

      download_object "$state_key" "$source_recheck_path"
      source_recheck_digest=$(network_preview_sha256_file "$source_recheck_path")
      if [ "$source_recheck_digest" != "$source_digest" ]; then
        network_preview_fail "encrypted source state changed during recovery-copy preparation"
      fi

      network_preview_write_output recovery_mode copy
      network_preview_write_output recovery_key "$recovery_key"
      network_preview_write_output recovery_sha256 "$recovery_digest"
      echo "PASS: created and verified an immutable encrypted pre-apply recovery copy"
      ;;
    *) network_preview_fail "multiple exact state objects were reported unexpectedly" ;;
  esac
}

assert_recovery() {
  require_exact_object_count "$lock_key" 0
  case "$RECOVERY_MODE" in
    bootstrap)
      require_exact_object_count "$state_key" 0
      echo "PASS: bootstrap state and lock absence reconfirmed immediately before apply"
      ;;
    copy)
      require_exact_object_count "$state_key" 1
      require_exact_object_count "$RECOVERY_KEY" 1
      verify_selected_recovery_object
      if [ "$verified_recovery_digest" != "$RECOVERY_SHA256" ]; then
        network_preview_fail "selected recovery object changed before apply"
      fi
      source_assert_path="$work_root/source-assert.tfstate"
      download_object "$state_key" "$source_assert_path"
      source_assert_digest=$(network_preview_sha256_file "$source_assert_path")
      if [ "$source_assert_digest" != "$RECOVERY_SHA256" ]; then
        network_preview_fail "encrypted source state changed after recovery preparation"
      fi
      echo "PASS: source, lock, and recovery digests reconfirmed immediately before apply"
      ;;
  esac
}

finalize_recovery() {
  # This decrypts state only in memory and discards it; no plaintext state is retained or logged.
  tofu -chdir="$TOFU_ROOT" state pull >/dev/null
  require_exact_object_count "$lock_key" 0
  require_exact_object_count "$state_key" 1

  current_state_path="$work_root/current.tfstate"
  download_object "$state_key" "$current_state_path"
  current_state_digest=$(network_preview_sha256_file "$current_state_path")

  if [ "$RECOVERY_MODE" = "copy" ]; then
    require_exact_object_count "$RECOVERY_KEY" 1
    verify_selected_recovery_object
    if [ "$verified_recovery_digest" != "$RECOVERY_SHA256" ]; then
      network_preview_fail "selected recovery object no longer matches its pre-apply SHA-256"
    fi
  fi

  recovery_list_json="$work_root/recovery-list.json"
  recovery_list_tsv="$work_root/recovery-list.tsv"
  verified_list_tsv="$work_root/verified-list.tsv"
  sorted_list_tsv="$work_root/sorted-list.tsv"
  prune_list_tsv="$work_root/prune-list.tsv"
  list_objects "$recovery_prefix" "$recovery_list_json"
  jq -r --arg prefix "$recovery_prefix" '
    .Contents[]?
    | select(.Key | startswith($prefix))
    | [.LastModified, .Key]
    | @tsv
  ' "$recovery_list_json" >"$recovery_list_tsv"

  : >"$verified_list_tsv"
  verification_index=0
  tab=$(printf '\t')
  while IFS="$tab" read -r last_modified object_key; do
    if [ -z "$object_key" ]; then
      continue
    fi
    if ! printf '%s\n' "$object_key" | grep -Eq \
      "^${recovery_prefix}[0-9a-f]{40}/[1-9][0-9]*-[1-9][0-9]*-[0-9a-f]{32}\\.tfstate$"; then
      network_preview_fail "unexpected object under the recovery prefix: $object_key"
    fi
    verification_index=$((verification_index + 1))
    verify_recovery_object "$object_key" "recovery-${verification_index}"
    printf '%s\t%s\n' "$last_modified" "$object_key" >>"$verified_list_tsv"
  done <"$recovery_list_tsv"

  sort -r "$verified_list_tsv" >"$sorted_list_tsv"
  verified_count=$(wc -l <"$sorted_list_tsv" | tr -d ' ')
  : >"$prune_list_tsv"
  if [ "$verified_count" -gt 5 ]; then
    sed -n '6,$p' "$sorted_list_tsv" >"$prune_list_tsv"
  fi

  while IFS="$tab" read -r last_modified object_key; do
    if [ -z "$object_key" ]; then
      continue
    fi
    verification_index=$((verification_index + 1))
    verify_recovery_object "$object_key" "prune-${verification_index}"
    aws s3api delete-object \
      --bucket "$NETWORK_PREVIEW_R2_BUCKET" \
      --key "$object_key" \
      --endpoint-url "$endpoint" \
      --no-cli-pager >/dev/null
    require_exact_object_count "$object_key" 0
  done <"$prune_list_tsv"

  retained_count=$verified_count
  if [ "$retained_count" -gt 5 ]; then
    retained_count=5
  fi
  network_preview_write_output current_state_sha256 "$current_state_digest"
  network_preview_write_output recovery_retained_count "$retained_count"
  echo "PASS: verified current encrypted state and retained up to five newest recovery copies"
}

case "$recovery_phase" in
  prepare) prepare_recovery ;;
  assert) assert_recovery ;;
  finalize) finalize_recovery ;;
esac
