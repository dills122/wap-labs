#!/usr/bin/env sh
set -eu

runtime_dir=/run/kannel
status_secret_file=${KANNEL_STATUS_PASSWORD_FILE:-/run/secrets/kannel_status_password}
for process_name in bearerbox wapbox; do
  pid_file=${runtime_dir}/${process_name}.pid
  test -r "$pid_file"
  pid=$(sed -n '1p' "$pid_file")
  case "$pid" in
    '' | *[!0-9]*) exit 1 ;;
  esac
  kill -0 "$pid" 2>/dev/null
done

test -r "$status_secret_file"
curl -sS --output /dev/null --connect-timeout 1 --max-time 3 \
  --get --data-urlencode "password@$status_secret_file" \
  'http://127.0.0.1:13000/status'
