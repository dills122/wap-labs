#!/usr/bin/env sh
set -eu

if ! command -v actionlint >/dev/null 2>&1; then
  echo "FAIL: actionlint not found; install v1.7.12 with 'go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12'" >&2
  exit 1
fi

actionlint \
  .github/workflows/opentofu.yml \
  .github/workflows/opentofu-protected-plan.yml \
  .github/workflows/opentofu-protected-apply.yml
