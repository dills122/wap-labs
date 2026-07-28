#!/usr/bin/env sh
set -eu

root_dir=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
release_id=${1:-}
output_dir=${2:-${root_dir}/dist/network-preview}

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

if [ -z "$release_id" ]; then
  release_id=$(git -C "$root_dir" rev-parse --short=12 HEAD)
fi
printf '%s' "$release_id" | grep -Eq '^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$' \
  || fail 'release ID must contain only letters, digits, dots, underscores, and hyphens'

for command_name in docker git grype syft tar; do
  command -v "$command_name" >/dev/null 2>&1 || fail "missing required command: $command_name"
done
if [ -n "$(git -C "$root_dir" status --porcelain)" ]; then
  fail 'release builds require a clean worktree'
fi

source_commit=$(git -C "$root_dir" rev-parse HEAD)
wml_image="wap-labs/wml-origin:$release_id"
gateway_image="wap-labs/wap-gateway:$release_id"
archive_path=${output_dir}/waves-network-preview-${release_id}.tar.gz
checksum_path=${archive_path}.sha256
[ ! -e "$archive_path" ] || fail "release archive already exists: $archive_path"
[ ! -e "$checksum_path" ] || fail "release checksum already exists: $checksum_path"

stage_dir=$(mktemp -d "${TMPDIR:-/tmp}/waves-network-preview-release.XXXXXX")
cleanup() {
  rm -rf "$stage_dir"
}
trap cleanup EXIT HUP INT TERM

echo '==> Building production WML origin image'
docker buildx build --platform linux/amd64 --load \
  --tag "$wml_image" "$root_dir/wml-server"

echo '==> Building production Kannel image'
docker buildx build --platform linux/amd64 --load --target production \
  --tag "$gateway_image" "$root_dir/docker/kannel"

echo '==> Scanning production images for high and critical vulnerabilities'
grype "$wml_image" --fail-on high
grype "$gateway_image" --fail-on high

echo '==> Generating CycloneDX SBOMs'
syft "$wml_image" -o "cyclonedx-json=$stage_dir/wml-origin.sbom.cdx.json"
syft "$gateway_image" -o "cyclonedx-json=$stage_dir/wap-gateway.sbom.cdx.json"

wml_image_id=$(docker image inspect --format '{{.Id}}' "$wml_image")
gateway_image_id=$(docker image inspect --format '{{.Id}}' "$gateway_image")
printf '%s' "$wml_image_id" | grep -Eq '^sha256:[0-9a-f]{64}$' || fail 'unexpected WML image ID'
printf '%s' "$gateway_image_id" | grep -Eq '^sha256:[0-9a-f]{64}$' || fail 'unexpected gateway image ID'

echo '==> Saving immutable image payload'
docker image save --output "$stage_dir/images.tar" "$wml_image" "$gateway_image"
cp "$root_dir/deploy/network-preview/compose.yaml" "$stage_dir/compose.yaml"
cp -R "$root_dir/deploy/network-preview/bin" "$stage_dir/bin"
cp -R "$root_dir/deploy/network-preview/systemd" "$stage_dir/systemd"
cp "$root_dir/deploy/network-preview/README.md" "$stage_dir/README.md"

cat >"$stage_dir/manifest.env" <<EOF
WAVES_RELEASE_ID=$release_id
WAVES_SOURCE_COMMIT=$source_commit
WML_ORIGIN_IMAGE=$wml_image
WML_ORIGIN_IMAGE_ID=$wml_image_id
WAP_GATEWAY_IMAGE=$gateway_image
WAP_GATEWAY_IMAGE_ID=$gateway_image_id
EOF

mkdir -p "$output_dir"
COPYFILE_DISABLE=1 tar --no-xattrs -C "$stage_dir" -czf "$archive_path" .
archive_sha256=$(sha256_file "$archive_path")
printf '%s  %s\n' "$archive_sha256" "$(basename "$archive_path")" >"$checksum_path"

echo "PASS: release archive $archive_path"
echo "PASS: SHA-256 $archive_sha256"
