#!/usr/bin/env sh

# Run a piped command and fail if the command (not tee) exited nonzero.
# POSIX sh has no pipefail/PIPESTATUS, so the command records its own status.
run_and_tee() {
  log_file="$1"
  shift
  status_file="$(mktemp "${TMPDIR:-/tmp}/run-and-tee-status.XXXXXX")"
  {
    set +e
    "$@"
    piped_status="$?"
    printf '%s\n' "${piped_status}" >"${status_file}"
    exit "${piped_status}"
  } | tee "${log_file}"
  if [ ! -s "${status_file}" ]; then
    echo "failed to capture command status for ${log_file}" >&2
    rm -f "${status_file}"
    return 1
  fi
  cmd_status="$(cat "${status_file}")"
  rm -f "${status_file}"
  case "${cmd_status}" in
    ''|*[!0-9]*)
      echo "invalid captured command status ${cmd_status} for ${log_file}" >&2
      return 1
      ;;
    *)
      return "${cmd_status}"
      ;;
  esac
}
