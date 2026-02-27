#!/usr/bin/env bash
set -euo pipefail

echo "Starting Kannel bearerbox..."
bearerbox /etc/kannel/kannel.conf &

# Give bearerbox a moment to initialize before starting wapbox.
sleep 2

echo "Starting Kannel wapbox..."
wapbox /etc/kannel/kannel.conf &

wait -n
