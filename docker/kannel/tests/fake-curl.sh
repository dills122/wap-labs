#!/usr/bin/env sh
set -eu

state_dir=${KANNEL_TEST_STATE_DIR:?KANNEL_TEST_STATE_DIR is required}
failure_count=${FAKE_CURL_FAILURES:-0}
attempt_file="$state_dir/readiness-probe.txt"
attempt=0

if [ -f "$attempt_file" ]; then
  attempt=$(sed -n '1p' "$attempt_file")
fi
attempt=$((attempt + 1))
printf '%s\n' "$attempt" >"$attempt_file"

[ -f "$state_dir/bearerbox.pid" ]
[ "$attempt" -gt "$failure_count" ]
