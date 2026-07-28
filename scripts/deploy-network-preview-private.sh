#!/usr/bin/env sh
set -eu

root_dir=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
archive_path=${1:-}
ssh_target=${2:-}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

[ -n "$archive_path" ] && [ -f "$archive_path" ] || fail 'release archive path is required'
[ -n "$ssh_target" ] || fail 'explicit Tailscale SSH target is required, for example waves@waves-network-preview'
case "$ssh_target" in
  *[!0-9A-Za-z@._:-]*) fail 'SSH target contains unsupported characters' ;;
esac
for command_name in scp ssh; do
  command -v "$command_name" >/dev/null 2>&1 || fail "missing required command: $command_name"
done

expected_sha256=$(sha256_file "$archive_path")
remote_archive=/tmp/waves-network-preview-release-${expected_sha256}.tar.gz
remote_uploaded=0
cleanup_remote_archive() {
  if [ "$remote_uploaded" -eq 1 ]; then
    ssh -- "$ssh_target" "rm -f '$remote_archive'" >/dev/null 2>&1 || true
  fi
}
trap cleanup_remote_archive EXIT HUP INT TERM

echo "==> Uploading verified release archive over Tailscale SSH to $ssh_target"
scp -- "$archive_path" "$ssh_target:$remote_archive"
remote_uploaded=1
echo '==> Installing release with Docker ingress sealed'
ssh -- "$ssh_target" "sudo /bin/sh -s -- '$remote_archive' '$expected_sha256'" \
  <"$root_dir/deploy/network-preview/bin/install-release"
cleanup_remote_archive
remote_uploaded=0
trap - EXIT HUP INT TERM
echo 'PASS: private deployment completed; public Docker ingress remains sealed'
