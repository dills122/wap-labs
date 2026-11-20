#!/usr/bin/env python3
"""Propagate the Ruflo worker timeout to the local Codex process group."""

import os
import signal
import subprocess
import sys

sys.dont_write_bytecode = True

from compliance_loop import StopRequested, signal_group


def main():
    worker = None
    stopped = False

    def request_stop(_signum, _frame):
        nonlocal stopped
        stopped = True
        if worker is not None:
            raise StopRequested

    signal.signal(signal.SIGTERM, request_stop)
    signal.signal(signal.SIGINT, request_stop)
    try:
        if stopped:
            return 143
        worker = subprocess.Popen(
            [os.environ['WAP_RUFLO_CODEX'], *sys.argv[1:]], start_new_session=True,
        )
        # A signal can arrive before Popen returns the process handle.
        return 143 if stopped else worker.wait()
    except StopRequested:
        return 143
    finally:
        if worker is not None:
            signal.signal(signal.SIGTERM, signal.SIG_IGN)
            signal.signal(signal.SIGINT, signal.SIG_IGN)
            signal_group(worker, signal.SIGKILL)
            worker.wait()


if __name__ == '__main__':
    sys.exit(main())
