#!/usr/bin/env python3
"""Run the bounded, read-only Ruflo/Codex pilot from this checkout."""
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys

root = Path(__file__).resolve().parents[2]
node = shutil.which('node')
codex = shutil.which('codex')
cli = root / '.ruflo-local/releases/3.77.1/node_modules/ruflo/bin/ruflo.js'
if not node or not codex or not cli.is_file():
    raise SystemExit('Install Ruflo with scripts/ruflo/bootstrap.py and put Node 26 and Codex on PATH.')
env = os.environ.copy()
env['RUFLO_PINNED_NODE'] = str(Path(node).resolve())
env['RUFLO_PINNED_CLI'] = str(cli)
env['PATH'] = os.pathsep.join((str(root / 'scripts/ruflo/bin'), str(Path(node).resolve().parent), env.get('PATH', '')))
process = subprocess.Popen([node, str(root / 'scripts/ruflo/pilot.mjs')], cwd=root, env=env, start_new_session=True)
try:
    raise SystemExit(process.wait(timeout=180))
except subprocess.TimeoutExpired:
    os.killpg(process.pid, signal.SIGTERM)
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.wait()
    sys.exit('Ruflo pilot exceeded its outer deadline.')
