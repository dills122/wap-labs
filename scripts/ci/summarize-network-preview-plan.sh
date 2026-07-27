#!/usr/bin/env sh
set -eu

script_directory=$(CDPATH='' cd "$(dirname "$0")" && pwd)
# shellcheck source=scripts/ci/network-preview-lib.sh
. "$script_directory/network-preview-lib.sh"

for command_name in tofu jq mktemp mkfifo; do
  network_preview_require_command "$command_name"
done

if [ "$#" -ne 2 ]; then
  network_preview_fail "usage: $0 TOFU_ROOT PLAN_PATH"
fi

tofu_root=$1
plan_path=$2
summary_destination=${GITHUB_STEP_SUMMARY:-}
if [ -z "$summary_destination" ]; then
  network_preview_fail "GITHUB_STEP_SUMMARY must name the trusted workflow-run summary"
fi

work_root=$(mktemp -d "${TMPDIR:-/tmp}/wap-labs-plan-summary.XXXXXX")
show_fifo="$work_root/tofu-show.json"
sanitized_summary="$work_root/sanitized.json"
show_pid=

cleanup() {
  if [ -n "$show_pid" ]; then
    kill "$show_pid" >/dev/null 2>&1 || true
    wait "$show_pid" >/dev/null 2>&1 || true
  fi
  case "$work_root" in
    "${TMPDIR:-/tmp}"/wap-labs-plan-summary.*) rm -rf "$work_root" ;;
    *) echo "WARN: refusing to remove unexpected temporary path: $work_root" >&2 ;;
  esac
}
trap cleanup EXIT HUP INT TERM

mkfifo "$show_fifo"
tofu -chdir="$tofu_root" show -json "$plan_path" >"$show_fifo" &
show_pid=$!

if ! jq -e '
  [
    .resource_changes[]?
    | select(.change.actions != ["no-op"])
    | {
        address,
        actions: (.change.actions | join(" -> "))
      }
  ] as $changes
  | {
      change_count: ($changes | length),
      action_counts: (
        $changes
        | group_by(.actions)
        | map({action: .[0].actions, count: length})
      ),
      resources: $changes
    }
' <"$show_fifo" >"$sanitized_summary"; then
  wait "$show_pid" >/dev/null 2>&1 || true
  show_pid=
  network_preview_fail "could not sanitize the reviewed plan"
fi

if ! wait "$show_pid"; then
  show_pid=
  network_preview_fail "OpenTofu could not read the encrypted reviewed plan"
fi
show_pid=

{
  echo "## Sanitized OpenTofu plan"
  echo
  printf 'Changed resource addresses: **%s**\n\n' \
    "$(jq -r '.change_count' "$sanitized_summary")"
  echo "| Action | Count |"
  echo "| --- | ---: |"
  jq -r '.action_counts[] | "| \(.action | gsub("[|\\r\\n]"; " ")) | \(.count) |"' \
    "$sanitized_summary"
  echo
  echo "| Resource address | Action |"
  echo "| --- | --- |"
  jq -r '
    .resources[]
    | "| `\(.address | gsub("[`|\\r\\n]"; " "))` | \(.actions | gsub("[|\\r\\n]"; " ")) |"
  ' "$sanitized_summary"
} >>"$summary_destination"

echo "PASS: published only action, resource-address, and count plan data"
