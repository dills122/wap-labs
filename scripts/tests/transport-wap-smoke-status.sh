#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
. "${ROOT_DIR}/scripts/lib/run-and-tee.sh"

TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/transport-wap-status-test.XXXXXX")"
TEST_LOG="${TEST_DIR}/failure.log"

cleanup() {
  rm -f "${TEST_LOG}"
  rmdir "${TEST_DIR}"
}
trap cleanup EXIT HUP INT TERM

set +e
run_and_tee "${TEST_LOG}" sh -c 'printf "%s\n" expected-failure; exit 23'
captured_status="$?"
set -e

if [ "${captured_status}" -ne 23 ]; then
  echo "expected status 23, got ${captured_status}" >&2
  exit 1
fi
grep -qx 'expected-failure' "${TEST_LOG}"
