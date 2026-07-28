#!/usr/bin/env sh
set -eu

ROOT_DIR=$(cd "$(dirname "$0")/../../.." && pwd)
START_SCRIPT="$ROOT_DIR/docker/kannel/start.sh"
TEST_DIR=$(mktemp -d "${TMPDIR:-/tmp}/kannel-supervisor-test.XXXXXX")
FAKE_BIN="$TEST_DIR/bin"
supervisor_pid=

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

cleanup() {
  if [ -n "$supervisor_pid" ]; then
    kill "$supervisor_pid" 2>/dev/null || true
    wait "$supervisor_pid" 2>/dev/null || true
  fi

  for pid_file in "$TEST_DIR"/*/*.pid; do
    if [ -f "$pid_file" ]; then
      child_pid=$(sed -n '1p' "$pid_file")
      kill "$child_pid" 2>/dev/null || true
    fi
  done

  rm -rf "$TEST_DIR"
}
trap cleanup EXIT HUP INT TERM

mkdir -p "$FAKE_BIN"
cp "$ROOT_DIR/docker/kannel/tests/fake-kannel-child.sh" "$FAKE_BIN/bearerbox"
cp "$ROOT_DIR/docker/kannel/tests/fake-kannel-child.sh" "$FAKE_BIN/wapbox"

wait_for_file() {
  awaited_file="$1"
  awaited_description="$2"
  attempts=0

  while [ ! -f "$awaited_file" ] && [ "$attempts" -lt 8 ]; do
    sleep 1
    attempts=$((attempts + 1))
  done

  [ -f "$awaited_file" ] || fail "timed out waiting for $awaited_description"
}

wait_for_exit() {
  awaited_pid="$1"
  awaited_description="$2"
  attempts=0

  while kill -0 "$awaited_pid" 2>/dev/null && [ "$attempts" -lt 6 ]; do
    sleep 1
    attempts=$((attempts + 1))
  done

  if kill -0 "$awaited_pid" 2>/dev/null; then
    fail "$awaited_description did not exit promptly"
  fi
}

assert_process_gone() {
  pid_file="$1"
  process_description="$2"
  wait_for_file "$pid_file" "$process_description pid file"
  process_pid=$(sed -n '1p' "$pid_file")
  if kill -0 "$process_pid" 2>/dev/null; then
    fail "$process_description process $process_pid is still running"
  fi
}

run_child_exit_test() {
  test_name="$1"
  bearerbox_mode="$2"
  bearerbox_status="$3"
  wapbox_mode="$4"
  wapbox_status="$5"
  failed_child="$6"
  raw_child_status="$7"
  expected_supervisor_status="$8"

  state_dir="$TEST_DIR/$test_name"
  log_file="$state_dir/supervisor.log"
  mkdir -p "$state_dir"

  PATH="$FAKE_BIN:$PATH" \
    KANNEL_TEST_STATE_DIR="$state_dir" \
    FAKE_BEARERBOX_MODE="$bearerbox_mode" \
    FAKE_BEARERBOX_STATUS="$bearerbox_status" \
    FAKE_WAPBOX_MODE="$wapbox_mode" \
    FAKE_WAPBOX_STATUS="$wapbox_status" \
    sh "$START_SCRIPT" >"$log_file" 2>&1 &
  supervisor_pid=$!

  wait_for_file "$state_dir/bearerbox.pid" "bearerbox startup"
  wait_for_file "$state_dir/wapbox.pid" "wapbox startup"
  wait_for_exit "$supervisor_pid" "supervisor after $failed_child exit"

  if wait "$supervisor_pid"; then
    actual_status=0
  else
    actual_status=$?
  fi
  supervisor_pid=

  if [ "$actual_status" -ne "$expected_supervisor_status" ]; then
    fail "$test_name expected supervisor status $expected_supervisor_status, got $actual_status"
  fi

  grep -Fq \
    "Kannel $failed_child exited unexpectedly with status $raw_child_status." \
    "$log_file" || fail "$test_name did not identify the failed child and status"
  if [ "$raw_child_status" -eq 0 ]; then
    grep -Fq 'Treating unexpected status 0 as supervisor failure status 1.' \
      "$log_file" || fail "$test_name did not document the status conversion"
  fi

  assert_process_gone "$state_dir/bearerbox.pid" "$test_name bearerbox"
  assert_process_gone "$state_dir/wapbox.pid" "$test_name wapbox"
  rm -f "$state_dir/bearerbox.pid" "$state_dir/wapbox.pid"
  echo "PASS: $test_name"
}

run_signal_cleanup_test() {
  state_dir="$TEST_DIR/signal-cleanup"
  log_file="$state_dir/supervisor.log"
  mkdir -p "$state_dir"

  PATH="$FAKE_BIN:$PATH" \
    KANNEL_TEST_STATE_DIR="$state_dir" \
    FAKE_BEARERBOX_MODE=run \
    FAKE_WAPBOX_MODE=run \
    sh "$START_SCRIPT" >"$log_file" 2>&1 &
  supervisor_pid=$!

  wait_for_file "$state_dir/bearerbox.pid" "signal test bearerbox startup"
  wait_for_file "$state_dir/wapbox.pid" "signal test wapbox startup"
  kill -TERM "$supervisor_pid"
  wait_for_exit "$supervisor_pid" "supervisor after TERM"

  if wait "$supervisor_pid"; then
    actual_status=0
  else
    actual_status=$?
  fi
  supervisor_pid=

  [ "$actual_status" -eq 143 ] || fail "TERM expected status 143, got $actual_status"
  grep -Fq 'Received TERM; stopping Kannel...' "$log_file" || \
    fail "TERM cleanup was not logged"
  assert_process_gone "$state_dir/bearerbox.pid" "TERM bearerbox"
  assert_process_gone "$state_dir/wapbox.pid" "TERM wapbox"
  rm -f "$state_dir/bearerbox.pid" "$state_dir/wapbox.pid"
  echo 'PASS: signal cleanup'
}

run_child_exit_test \
  bearerbox-failure exit-after-peer-starts 23 run 0 bearerbox 23 23
run_child_exit_test \
  wapbox-failure run 0 exit 37 wapbox 37 37
run_child_exit_test \
  clean-child-exit run 0 exit 0 wapbox 0 1
run_signal_cleanup_test

echo 'PASS: Kannel supervisor tests'
