#!/usr/bin/env sh
set -eu

script_directory=$(CDPATH='' cd "$(dirname "$0")" && pwd)
# shellcheck source=scripts/ci/network-preview-lib.sh
. "$script_directory/network-preview-lib.sh"

for command_name in tofu jq grep mktemp cp mkdir; do
  network_preview_require_command "$command_name"
done

network_preview_require_value TF_VAR_state_encryption_passphrase

repository_root=$(CDPATH='' cd "$script_directory/../.." && pwd)
fixture_root="$repository_root/infra/network-preview/tests/encrypted-plan"
work_root=$(mktemp -d "${TMPDIR:-/tmp}/wap-labs-encrypted-plan.XXXXXX")
offline_root="$work_root/config"
plan_path="$work_root/offline.tfplan"
summary_path="$work_root/summary.md"

cleanup() {
  case "$work_root" in
    "${TMPDIR:-/tmp}"/wap-labs-encrypted-plan.*) rm -rf "$work_root" ;;
    *) echo "WARN: refusing to remove unexpected temporary path: $work_root" >&2 ;;
  esac
}
trap cleanup EXIT HUP INT TERM

mkdir "$offline_root"
for source_file in encryption.tf outputs.tf versions.tf; do
  cp "$fixture_root/$source_file" "$offline_root/$source_file"
done

tofu -chdir="$offline_root" init -backend=false -lockfile=readonly -no-color >/dev/null

tofu -chdir="$offline_root" plan \
  -input=false \
  -lock=false \
  -no-color \
  -out="$plan_path" >/dev/null

# A known planned output value must not appear in the encrypted on-disk plan.
if LC_ALL=C grep -a -F 'offline-encryption-sentinel' "$plan_path" >/dev/null 2>&1; then
  network_preview_fail "saved plan exposes known plaintext despite enforced plan encryption"
fi

# OpenTofu must still decrypt and parse the plan with the configured passphrase.
tofu -chdir="$offline_root" show -json "$plan_path" |
  jq -e '.format_version | type == "string"' >/dev/null

GITHUB_STEP_SUMMARY="$summary_path" \
  "$script_directory/summarize-network-preview-plan.sh" "$offline_root" "$plan_path" >/dev/null
if grep -F 'offline-encryption-sentinel' "$summary_path" >/dev/null 2>&1; then
  network_preview_fail "sanitized plan summary exposed a planned output value"
fi
if ! grep -F 'Sanitized OpenTofu plan' "$summary_path" >/dev/null 2>&1; then
  network_preview_fail "sanitized plan summary was not produced"
fi

echo "PASS: saved plan is encrypted at rest and only sanitized review data is published"
