#!/usr/bin/env sh
set -eu

script_directory=$(CDPATH='' cd "$(dirname "$0")" && pwd)
# shellcheck source=scripts/ci/network-preview-lib.sh
. "$script_directory/network-preview-lib.sh"

for command_name in tofu aws jq mktemp cp kill sleep grep; do
  network_preview_require_command "$command_name"
done

for variable_name in \
  NETWORK_PREVIEW_R2_ACCOUNT_ID \
  NETWORK_PREVIEW_R2_BUCKET \
  NETWORK_PREVIEW_R2_STATE_KEY \
  NETWORK_PREVIEW_R2_TEST_PREFIX \
  NETWORK_PREVIEW_R2_TEST_RUN_ID \
  AWS_ACCESS_KEY_ID \
  AWS_SECRET_ACCESS_KEY \
  TOFU_ENCRYPTION_PASSPHRASE; do
  network_preview_require_value "$variable_name"
done

case "$NETWORK_PREVIEW_R2_TEST_PREFIX" in
  wap-labs/network-preview/tests | wap-labs/network-preview/tests/*) ;;
  *)
    echo "FAIL: NETWORK_PREVIEW_R2_TEST_PREFIX must remain below wap-labs/network-preview/tests" >&2
    exit 1
    ;;
esac

network_preview_validate_account_id
network_preview_validate_bucket
network_preview_validate_state_key

test_run_id=$NETWORK_PREVIEW_R2_TEST_RUN_ID
if ! printf '%s\n' "$test_run_id" |
  grep -Eq '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'; then
  echo "FAIL: NETWORK_PREVIEW_R2_TEST_RUN_ID must be a collision-resistant lowercase UUID" >&2
  exit 1
fi

state_key="${NETWORK_PREVIEW_R2_TEST_PREFIX%/}/${test_run_id}/terraform.tfstate"
if [ "$NETWORK_PREVIEW_R2_STATE_KEY" = "$state_key" ]; then
  echo "FAIL: isolated lock test key matches the preview state key" >&2
  exit 1
fi

repository_root=$(CDPATH='' cd "$(dirname "$0")/../.." && pwd)
preview_root="$repository_root/infra/network-preview/environments/preview"
fixture_root="$repository_root/infra/network-preview/tests/r2-lock"
work_root=$(mktemp -d "${TMPDIR:-/tmp}/wap-labs-r2-lock.XXXXXX")
holder_pid=
endpoint="https://${NETWORK_PREVIEW_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
lock_key="${state_key}.tflock"
test_object_prefix="${NETWORK_PREVIEW_R2_TEST_PREFIX%/}/${test_run_id}/"
remote_cleanup_allowed=
remote_cleanup_complete=

export AWS_REGION=auto
export AWS_DEFAULT_REGION=auto

remove_remote_test_objects() {
  aws s3 rm "s3://${NETWORK_PREVIEW_R2_BUCKET}/${lock_key}" \
    --endpoint-url "$endpoint" --no-progress >/dev/null
  aws s3 rm "s3://${NETWORK_PREVIEW_R2_BUCKET}/${state_key}" \
    --endpoint-url "$endpoint" --no-progress >/dev/null
}

test_prefix_is_empty() {
  aws s3api list-objects-v2 \
    --bucket "$NETWORK_PREVIEW_R2_BUCKET" \
    --prefix "$test_object_prefix" \
    --endpoint-url "$endpoint" \
    --no-cli-pager \
    --output json |
    jq -e '([.Contents[]?.Key] | length) == 0' >/dev/null
}

cleanup() {
  if [ -n "$holder_pid" ]; then
    kill -KILL "$holder_pid" >/dev/null 2>&1 || true
    wait "$holder_pid" >/dev/null 2>&1 || true
  fi
  if [ -n "$remote_cleanup_allowed" ] && [ -z "$remote_cleanup_complete" ]; then
    remove_remote_test_objects >/dev/null 2>&1 || true
  fi
  case "$work_root" in
    "${TMPDIR:-/tmp}"/wap-labs-r2-lock.*) rm -rf "$work_root" ;;
    *) echo "WARN: refusing to remove unexpected temporary path: $work_root" >&2 ;;
  esac
}
trap cleanup EXIT HUP INT TERM

if ! test_prefix_is_empty; then
  echo "FAIL: isolated R2 test prefix already contains objects; refusing destructive cleanup" >&2
  exit 1
fi
remote_cleanup_allowed=1

cp "$preview_root/backend.tf" "$work_root/backend.tf"
cp "$fixture_root/versions.tf" "$work_root/versions.tf"
cp "$fixture_root/hold.tf" "$work_root/hold.tf"

backend_config="$work_root/backend.hcl"
{
  echo "bucket = \"${NETWORK_PREVIEW_R2_BUCKET}\""
  echo "key = \"${state_key}\""
  echo "endpoints = { s3 = \"${endpoint}\" }"
} >"$backend_config"

export TF_IN_AUTOMATION=1
export TF_INPUT=0
export TF_VAR_state_encryption_passphrase="$TOFU_ENCRYPTION_PASSPHRASE"
export TF_DATA_DIR="$work_root/.terraform"

tofu_run() {
  tofu -chdir="$work_root" "$@"
}

lock_exists() {
  aws s3api head-object \
    --bucket "$NETWORK_PREVIEW_R2_BUCKET" \
    --key "$lock_key" \
    --endpoint-url "$endpoint" \
    --no-cli-pager >/dev/null 2>&1
}

wait_for_lock() {
  attempts=0
  while [ "$attempts" -lt 30 ]; do
    if lock_exists; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 1
  done
  echo "FAIL: OpenTofu did not publish the isolated R2 lock within 30 seconds" >&2
  return 1
}

expect_contention() {
  if tofu_run plan -lock-timeout=0s -input=false -no-color >"$work_root/contender.log" 2>&1; then
    echo "FAIL: concurrent OpenTofu plan unexpectedly acquired the held lock" >&2
    return 1
  fi
  if ! grep -i "lock" "$work_root/contender.log" >/dev/null 2>&1; then
    echo "FAIL: contender failed without reporting lock contention" >&2
    return 1
  fi
}

echo "==> initializing isolated R2 lock test"
tofu_run init -reconfigure -backend-config="$backend_config" -lockfile=readonly -no-color >/dev/null

echo "==> proving contention and normal release"
tofu_run apply -auto-approve -lock-timeout=0s -input=false -no-color >"$work_root/holder.log" 2>&1 &
holder_pid=$!
wait_for_lock
expect_contention
wait "$holder_pid"
holder_pid=
if lock_exists; then
  echo "FAIL: lock remained after graceful completion" >&2
  exit 1
fi
tofu_run plan -lock-timeout=0s -input=false -no-color >/dev/null

echo "==> proving stale-lock recovery"
tofu_run apply -auto-approve -lock-timeout=0s -input=false -no-color >"$work_root/stale-holder.log" 2>&1 &
holder_pid=$!
wait_for_lock
kill -KILL "$holder_pid"
wait "$holder_pid" >/dev/null 2>&1 || true
holder_pid=
expect_contention

aws s3 cp "s3://${NETWORK_PREVIEW_R2_BUCKET}/${lock_key}" "$work_root/lock.json" \
  --endpoint-url "$endpoint" --no-progress >/dev/null
lock_id=$(jq -er '.ID | select(type == "string" and length > 0)' "$work_root/lock.json")
tofu_run force-unlock -force "$lock_id" >/dev/null

if lock_exists; then
  echo "FAIL: force-unlock did not remove the isolated R2 lock" >&2
  exit 1
fi
tofu_run plan -lock-timeout=0s -input=false -no-color >/dev/null

echo "==> removing isolated R2 lock-test objects"
remove_remote_test_objects
if ! test_prefix_is_empty; then
  echo "FAIL: isolated R2 test objects remain after cleanup" >&2
  exit 1
fi
remote_cleanup_complete=1

echo "PASS: isolated R2 lock acquisition, contention, release, and stale recovery"
