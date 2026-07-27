#!/usr/bin/env sh
set -eu

script_directory=$(CDPATH='' cd "$(dirname "$0")" && pwd)
# shellcheck source=scripts/ci/network-preview-lib.sh
. "$script_directory/network-preview-lib.sh"

for command_name in gh jq grep mktemp unzip; do
  network_preview_require_command "$command_name"
done

for variable_name in \
  GITHUB_REPOSITORY \
  GITHUB_REPOSITORY_ID \
  PLAN_RUN_ID \
  PLAN_ARTIFACT_ID \
  EXPECTED_SOURCE_COMMIT \
  PLAN_DESTINATION; do
  network_preview_require_value "$variable_name"
done

if ! printf '%s\n' "$GITHUB_REPOSITORY" | grep -Eq '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'; then
  network_preview_fail "GITHUB_REPOSITORY is invalid"
fi
for numeric_value in "$GITHUB_REPOSITORY_ID" "$PLAN_RUN_ID" "$PLAN_ARTIFACT_ID"; do
  if ! printf '%s\n' "$numeric_value" | grep -Eq '^[1-9][0-9]*$'; then
    network_preview_fail "repository, run, and artifact IDs must be positive integers"
  fi
done
if ! printf '%s\n' "$EXPECTED_SOURCE_COMMIT" | grep -Eq '^[0-9a-f]{40}$'; then
  network_preview_fail "EXPECTED_SOURCE_COMMIT must be a lowercase 40-character commit SHA"
fi
if [ -e "$PLAN_DESTINATION" ]; then
  network_preview_fail "refusing to overwrite plan destination: $PLAN_DESTINATION"
fi

destination_parent=$(dirname "$PLAN_DESTINATION")
if [ ! -d "$destination_parent" ]; then
  network_preview_fail "plan destination parent does not exist: $destination_parent"
fi

work_root=$(mktemp -d "${TMPDIR:-/tmp}/wap-labs-plan-provenance.XXXXXX")
workflow_json="$work_root/workflow.json"
run_json="$work_root/run.json"
artifact_json="$work_root/artifact.json"
artifact_zip="$work_root/artifact.zip"

cleanup() {
  case "$work_root" in
    "${TMPDIR:-/tmp}"/wap-labs-plan-provenance.*) rm -rf "$work_root" ;;
    *) echo "WARN: refusing to remove unexpected temporary path: $work_root" >&2 ;;
  esac
}
trap cleanup EXIT HUP INT TERM

api_header="X-GitHub-Api-Version: 2022-11-28"
workflow_path=".github/workflows/opentofu-protected-plan.yml"

gh api -H "$api_header" \
  "/repos/${GITHUB_REPOSITORY}/actions/workflows/opentofu-protected-plan.yml" >"$workflow_json"
gh api -H "$api_header" \
  "/repos/${GITHUB_REPOSITORY}/actions/runs/${PLAN_RUN_ID}" >"$run_json"
gh api -H "$api_header" \
  "/repos/${GITHUB_REPOSITORY}/actions/artifacts/${PLAN_ARTIFACT_ID}" >"$artifact_json"

workflow_id=$(jq -er \
  --arg path "$workflow_path" \
  '.id | select(type == "number")' "$workflow_json")
if ! jq -e --arg path "$workflow_path" \
  '.path == $path and .state == "active"' "$workflow_json" >/dev/null; then
  network_preview_fail "approved protected-plan workflow identity is not active"
fi

if ! jq -e \
  --arg repository "$GITHUB_REPOSITORY" \
  --argjson repository_id "$GITHUB_REPOSITORY_ID" \
  --argjson run_id "$PLAN_RUN_ID" \
  --argjson workflow_id "$workflow_id" \
  --arg workflow_path "$workflow_path" '
    .id == $run_id
    and .repository.id == $repository_id
    and .repository.full_name == $repository
    and .head_repository.id == $repository_id
    and .workflow_id == $workflow_id
    and (.path == $workflow_path or .path == ($workflow_path + "@main"))
    and .head_branch == "main"
    and .event == "workflow_dispatch"
    and .status == "completed"
    and .conclusion == "success"
    and (.run_attempt | type == "number" and . >= 1)
    and (.head_sha | type == "string" and test("^[0-9a-f]{40}$"))
  ' "$run_json" >/dev/null; then
  network_preview_fail "plan run does not match the approved repository/workflow/ref/conclusion"
fi

source_commit=$(jq -er '.head_sha' "$run_json")
plan_run_attempt=$(jq -er '.run_attempt' "$run_json")
if [ "$source_commit" != "$EXPECTED_SOURCE_COMMIT" ]; then
  network_preview_fail \
    "reviewed plan is stale: its source commit is not the current protected main commit"
fi

if ! jq -e \
  --argjson artifact_id "$PLAN_ARTIFACT_ID" \
  --argjson run_id "$PLAN_RUN_ID" \
  --argjson repository_id "$GITHUB_REPOSITORY_ID" \
  --arg source_commit "$source_commit" '
    .id == $artifact_id
    and .expired == false
    and .workflow_run.id == $run_id
    and .workflow_run.repository_id == $repository_id
    and .workflow_run.head_repository_id == $repository_id
    and .workflow_run.head_branch == "main"
    and .workflow_run.head_sha == $source_commit
  ' "$artifact_json" >/dev/null; then
  network_preview_fail "artifact does not belong to the verified protected plan run"
fi

artifact_name=$(jq -er '.name | select(type == "string")' "$artifact_json")
artifact_prefix="network-preview-plan-v1-${source_commit}-${plan_run_attempt}-"
case "$artifact_name" in
  "$artifact_prefix"*) plan_digest=${artifact_name#"$artifact_prefix"} ;;
  *) network_preview_fail "artifact name is not trusted protected-plan provenance" ;;
esac
if ! printf '%s\n' "$plan_digest" | grep -Eq '^[0-9a-f]{64}$'; then
  network_preview_fail "artifact provenance does not contain a valid plan SHA-256"
fi

gh api -H "$api_header" -H "Accept: application/vnd.github+json" \
  "/repos/${GITHUB_REPOSITORY}/actions/artifacts/${PLAN_ARTIFACT_ID}/zip" >"$artifact_zip"

archive_entries=$(unzip -Z1 "$artifact_zip")
if [ "$archive_entries" != "encrypted.tfplan" ]; then
  network_preview_fail "plan artifact must contain exactly encrypted.tfplan"
fi
umask 077
unzip -p "$artifact_zip" encrypted.tfplan >"$PLAN_DESTINATION"
downloaded_digest=$(network_preview_sha256_file "$PLAN_DESTINATION")
if [ "$downloaded_digest" != "$plan_digest" ]; then
  rm -f "$PLAN_DESTINATION"
  network_preview_fail "downloaded encrypted plan does not match trusted run provenance"
fi

network_preview_write_output source_commit "$source_commit"
network_preview_write_output plan_run_attempt "$plan_run_attempt"
network_preview_write_output artifact_name "$artifact_name"
network_preview_write_output plan_digest "$plan_digest"
network_preview_write_output plan_path "$PLAN_DESTINATION"

echo "PASS: verified and downloaded the exact encrypted reviewed plan artifact"
