#!/usr/bin/env sh
set -eu

admin_secret_file=${KANNEL_ADMIN_PASSWORD_FILE:-/run/secrets/kannel_admin_password}
status_secret_file=${KANNEL_STATUS_PASSWORD_FILE:-/run/secrets/kannel_status_password}
template_file=/etc/kannel/kannel.conf.tmpl
runtime_dir=/run/kannel
runtime_config=${runtime_dir}/kannel.conf

read_secret() {
  secret_file=$1
  secret_name=$2
  if [ ! -r "$secret_file" ]; then
    echo "FAIL: $secret_name secret file is not readable" >&2
    exit 1
  fi
  secret_value=$(tr -d '\r\n' <"$secret_file")
  if ! printf '%s' "$secret_value" | grep -Eq '^[0-9a-f]{64}$'; then
    echo "FAIL: $secret_name must contain exactly 64 lowercase hexadecimal characters" >&2
    exit 1
  fi
  printf '%s' "$secret_value"
}

admin_password=$(read_secret "$admin_secret_file" KANNEL_ADMIN_PASSWORD)
status_password=$(read_secret "$status_secret_file" KANNEL_STATUS_PASSWORD)

umask 077
mkdir -p "$runtime_dir"
sed \
  -e "s/__KANNEL_ADMIN_PASSWORD__/$admin_password/g" \
  -e "s/__KANNEL_STATUS_PASSWORD__/$status_password/g" \
  "$template_file" >"$runtime_config"
unset admin_password status_password

bearerbox_pid=
wapbox_pid=
# shellcheck disable=SC2329 # Invoked through POSIX signal/exit traps.
terminate() {
  trap - EXIT HUP INT TERM
  if [ -n "$wapbox_pid" ]; then
    kill "$wapbox_pid" 2>/dev/null || true
  fi
  if [ -n "$bearerbox_pid" ]; then
    kill "$bearerbox_pid" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}
trap terminate EXIT HUP INT TERM

echo 'Starting production Kannel bearerbox...'
bearerbox -v 1 "$runtime_config" &
bearerbox_pid=$!
printf '%s\n' "$bearerbox_pid" >"$runtime_dir/bearerbox.pid"

i=0
while [ "$i" -lt 20 ]; do
  if curl -sS --output /dev/null --connect-timeout 1 --max-time 2 \
    'http://127.0.0.1:13000/status' \
    >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$bearerbox_pid" 2>/dev/null; then
    echo 'FAIL: bearerbox exited during startup' >&2
    exit 1
  fi
  i=$((i + 1))
  sleep 1
done
if [ "$i" -ge 20 ]; then
  echo 'FAIL: bearerbox did not become healthy' >&2
  exit 1
fi

echo 'Starting production Kannel wapbox...'
wapbox -v 1 "$runtime_config" &
wapbox_pid=$!
printf '%s\n' "$wapbox_pid" >"$runtime_dir/wapbox.pid"

while kill -0 "$bearerbox_pid" 2>/dev/null && kill -0 "$wapbox_pid" 2>/dev/null; do
  sleep 1
done

echo 'FAIL: a Kannel process exited unexpectedly' >&2
exit 1
