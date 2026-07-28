#!/usr/bin/env sh
set -eu

script_directory=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
repository_root=$(CDPATH='' cd -- "$script_directory/../.." && pwd)
temporary_root=$(mktemp -d "${TMPDIR:-/tmp}/waves-network-preview-deploy-check.XXXXXX")

cleanup() {
  case "$temporary_root" in
    "${TMPDIR:-/tmp}"/waves-network-preview-deploy-check.*) rm -rf "$temporary_root" ;;
    *) echo "WARN: refusing to remove unexpected temporary path: $temporary_root" >&2 ;;
  esac
}
trap cleanup EXIT HUP INT TERM

scripts='docker/kannel/production/entrypoint.sh
docker/kannel/production/healthcheck.sh
deploy/network-preview/bin/install-release
deploy/network-preview/bin/rollback-release
deploy/network-preview/bin/waves-docker-firewall
scripts/build-network-preview-release.sh
scripts/deploy-network-preview-private.sh
scripts/transport-wap-smoke.sh'

cd "$repository_root"
printf '%s\n' "$scripts" | while IFS= read -r script_path; do
  sh -n "$script_path"
done
if command -v shellcheck >/dev/null 2>&1; then
  # shellcheck disable=SC2086 # The newline-separated repository-owned list is intentional.
  shellcheck -x $scripts
else
  echo 'FAIL: shellcheck is required for network-preview deployment validation' >&2
  exit 1
fi

node --test scripts/tests/network-preview-deploy.test.mjs

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  secrets_dir=$temporary_root/secrets
  mkdir -p "$secrets_dir"
  printf '%064d\n' 0 >"$secrets_dir/kannel-admin-password"
  printf '%064d\n' 1 >"$secrets_dir/kannel-status-password"
  WAVES_SECRETS_DIR=$secrets_dir \
  WML_ORIGIN_IMAGE=wap-labs/wml-origin:offline-validation \
  WAP_GATEWAY_IMAGE=wap-labs/wap-gateway:offline-validation \
    docker compose -f deploy/network-preview/compose.yaml config --quiet
else
  echo 'FAIL: Docker Compose is required for network-preview deployment validation' >&2
  exit 1
fi

echo 'PASS: production network-preview deployment contracts are valid'
