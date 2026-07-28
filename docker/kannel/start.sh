#!/usr/bin/env sh
set -eu

bearerbox_pid=
wapbox_pid=

# shellcheck disable=SC2317,SC2329 # Invoked through POSIX signal traps.
stop_children() {
  if [ -n "$wapbox_pid" ]; then
    kill "$wapbox_pid" 2>/dev/null || true
  fi
  if [ -n "$bearerbox_pid" ]; then
    kill "$bearerbox_pid" 2>/dev/null || true
  fi

  if [ -n "$wapbox_pid" ]; then
    wait "$wapbox_pid" 2>/dev/null || true
  fi
  if [ -n "$bearerbox_pid" ]; then
    wait "$bearerbox_pid" 2>/dev/null || true
  fi
}

# shellcheck disable=SC2329 # Invoked through POSIX signal traps.
handle_signal() {
  signal_name="$1"
  signal_status="$2"

  trap - TERM INT
  echo "Received $signal_name; stopping Kannel..." >&2
  stop_children
  exit "$signal_status"
}

trap 'handle_signal TERM 143' TERM
trap 'handle_signal INT 130' INT

echo "Starting Kannel bearerbox..."
bearerbox /etc/kannel/kannel.conf &
bearerbox_pid=$!

# Give bearerbox a moment to initialize before starting wapbox.
sleep 2

echo "Starting Kannel wapbox..."
wapbox /etc/kannel/kannel.conf &
wapbox_pid=$!

# POSIX sh has no `wait -n` (wait for whichever background job exits first).
# Poll instead, then explicitly reap the failed child and stop/reap its peer.
exited_name=
exited_pid=
surviving_name=
surviving_pid=
while [ -z "$exited_pid" ]; do
  if ! kill -0 "$bearerbox_pid" 2>/dev/null; then
    exited_name=bearerbox
    exited_pid="$bearerbox_pid"
    surviving_name=wapbox
    surviving_pid="$wapbox_pid"
  elif ! kill -0 "$wapbox_pid" 2>/dev/null; then
    exited_name=wapbox
    exited_pid="$wapbox_pid"
    surviving_name=bearerbox
    surviving_pid="$bearerbox_pid"
  else
    sleep 1
  fi
done

if wait "$exited_pid"; then
  child_status=0
else
  child_status=$?
fi

echo "Kannel $exited_name exited unexpectedly with status $child_status." >&2

# An unexpected clean child exit still means the two-process service failed.
if [ "$child_status" -eq 0 ]; then
  supervisor_status=1
  echo "Treating unexpected status 0 as supervisor failure status 1." >&2
else
  supervisor_status="$child_status"
fi

if kill -0 "$surviving_pid" 2>/dev/null; then
  echo "Stopping Kannel $surviving_name..." >&2
  kill "$surviving_pid" 2>/dev/null || true
fi
wait "$surviving_pid" 2>/dev/null || true

exit "$supervisor_status"
