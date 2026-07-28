#!/usr/bin/env sh
set -eu

process_name=${0##*/}
state_dir=${KANNEL_TEST_STATE_DIR:?KANNEL_TEST_STATE_DIR is required}

case "$process_name" in
  bearerbox)
    mode=${FAKE_BEARERBOX_MODE:-run}
    exit_status=${FAKE_BEARERBOX_STATUS:-0}
    peer_name=wapbox
    ;;
  wapbox)
    mode=${FAKE_WAPBOX_MODE:-run}
    exit_status=${FAKE_WAPBOX_STATUS:-0}
    peer_name=bearerbox
    ;;
  *)
    echo "Unexpected fake child name: $process_name" >&2
    exit 64
    ;;
esac

printf '%s\n' "$$" >"$state_dir/$process_name.pid"

case "$mode" in
  run)
    exec tail -f /dev/null
    ;;
  exit)
    exit "$exit_status"
    ;;
  exit-after-peer-starts)
    while [ ! -f "$state_dir/$peer_name.pid" ]; do
      sleep 1
    done
    exit "$exit_status"
    ;;
  *)
    echo "Unexpected fake child mode for $process_name: $mode" >&2
    exit 64
    ;;
esac
