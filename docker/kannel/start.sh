#!/usr/bin/env sh
set -eu

echo "Starting Kannel bearerbox..."
bearerbox /etc/kannel/kannel.conf &
bearerbox_pid=$!

# Give bearerbox a moment to initialize before starting wapbox.
sleep 2

echo "Starting Kannel wapbox..."
wapbox /etc/kannel/kannel.conf &
wapbox_pid=$!

# POSIX sh has no `wait -n` (wait for whichever background job exits first).
# Poll instead so the container exits as soon as either process dies, rather
# than staying up silently with a crashed peer.
while kill -0 "$bearerbox_pid" 2>/dev/null && kill -0 "$wapbox_pid" 2>/dev/null; do
    sleep 1
done
wait
