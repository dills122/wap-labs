#!/usr/bin/env python3
"""Install a pinned local Ruflo and add a project-scoped Codex MCP entry.

Existing Ruflo configuration is never overwritten. Run from any directory with
Node 26 and npm on PATH. Local state remains excluded via Git's local exclude.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
try:
    import tomllib
except ModuleNotFoundError:
    raise SystemExit('Python 3.11 or newer is required for TOML configuration.')

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'scripts/ruflo'
RELEASE = ROOT / '.ruflo-local/releases/3.77.1'
CLI = RELEASE / 'node_modules/ruflo/bin/ruflo.js'
GUARD = SOURCE / 'bounded-mcp.mjs'
CONFIG = ROOT / '.codex/config.toml'
EXCLUSIONS = ('/.ruflo-local/', '/.claude-flow/', '/.swarm/', '/.ruflo/', '/.claude/memory.db*', '/.codex/config.toml')
TOOLS = ['swarm_init', 'swarm_status', 'swarm_shutdown', 'agent_spawn', 'agent_status', 'agent_list', 'agent_terminate', 'task_create', 'task_status', 'task_list', 'task_assign', 'task_update', 'task_complete', 'task_cancel']


def main():
    node = shutil.which('node')
    npm = shutil.which('npm')
    if not node or not npm:
        raise SystemExit('Node 26 and npm must be available on PATH.')
    node = str(Path(node).resolve())
    version = subprocess.check_output([node, '--version'], text=True).strip()
    if not version.startswith('v26.'):
        raise SystemExit(f'Use the project Node 26 toolchain; found {version}.')
    if not GUARD.is_file():
        raise SystemExit('The bounded Ruflo MCP guard is missing; update this checkout.')
    if CONFIG.is_symlink():
        raise SystemExit('Refusing to modify a symlinked project Codex configuration.')
    old = CONFIG.read_text() if CONFIG.exists() else ''
    try:
        parsed = tomllib.loads(old)
    except tomllib.TOMLDecodeError as exc:
        raise SystemExit(f'Cannot parse existing Codex configuration: {exc}') from exc
    existing = parsed.get('mcp_servers', {}).get('ruflo')
    desired = {
        'command': node, 'args': [str(GUARD), str(CLI)], 'cwd': str(ROOT),
        'enabled': True, 'startup_timeout_sec': 30, 'tool_timeout_sec': 60,
        'enabled_tools': TOOLS, 'tools': {'task_list': {'approval_mode': 'approve'}}
    }
    if existing is not None and existing != desired:
        raise SystemExit('A different project Ruflo configuration already exists. Preserve it and migrate it manually; no configuration was changed.')

    updated = old
    if existing is None:
        # JSON string escaping is valid TOML basic-string escaping for these paths.
        def q(value):
            return json.dumps(value, ensure_ascii=False)
        text = '\n# Local Ruflo coordination (installed by scripts/ruflo/bootstrap.py)\n[mcp_servers.ruflo]\n'
        text += f'command = {q(node)}\nargs = [{q(str(GUARD))}, {q(str(CLI))}]\ncwd = {q(str(ROOT))}\n'
        text += 'enabled = true\nstartup_timeout_sec = 30\ntool_timeout_sec = 60\n'
        text += f'enabled_tools = {json.dumps(TOOLS)}\n\n[mcp_servers.ruflo.tools.task_list]\napproval_mode = "approve"\n'
        updated = old.rstrip() + '\n' + text if old else text.lstrip()
        try:
            tomllib.loads(updated)
        except tomllib.TOMLDecodeError as exc:
            raise SystemExit(f'Cannot add Ruflo to the existing Codex configuration: {exc}. Preserve it and configure Ruflo manually.') from exc

    git = shutil.which('git')
    if not git:
        raise SystemExit('Git is required to protect local-only files from being committed.')
    exclude = Path(subprocess.check_output([git, 'rev-parse', '--git-path', 'info/exclude'], cwd=ROOT, text=True).strip())
    if not exclude.is_absolute():
        exclude = ROOT / exclude
    exclude.parent.mkdir(parents=True, exist_ok=True)
    previous = exclude.read_text() if exclude.exists() else ''
    missing = [entry for entry in EXCLUSIONS if entry not in previous.splitlines()]
    if missing:
        with exclude.open('a') as stream:
            if previous and not previous.endswith('\n'):
                stream.write('\n')
            stream.write('\n# Local Ruflo runtime and Codex override\n' + '\n'.join(missing) + '\n')

    lock_hash = hashlib.sha256((SOURCE / 'package-lock.json').read_bytes()).hexdigest()
    marker = RELEASE / '.wap-ruflo-lock-sha256'
    if RELEASE.exists():
        if not marker.is_file() or marker.read_text().strip() != lock_hash or not CLI.is_file():
            raise SystemExit(f'{RELEASE} already exists but does not match the pinned install. Preserve it and inspect it before retrying.')
    else:
        RELEASE.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='.ruflo-install-', dir=RELEASE.parent) as directory:
            staged = Path(directory)
            shutil.copy2(SOURCE / 'package.json', staged / 'package.json')
            shutil.copy2(SOURCE / 'package-lock.json', staged / 'package-lock.json')
            env = os.environ.copy()
            env['PATH'] = str(Path(node).parent) + os.pathsep + env.get('PATH', '')
            print('==> Installing locked Ruflo without lifecycle scripts', flush=True)
            subprocess.run([npm, 'ci', '--ignore-scripts', '--no-fund', '--no-audit'], cwd=staged, env=env, check=True)
            if not (staged / 'node_modules/ruflo/bin/ruflo.js').is_file():
                raise SystemExit('The installed Ruflo CLI is missing.')
            (staged / marker.name).write_text(lock_hash + '\n')
            staged.rename(RELEASE)
    if existing is None:
        CONFIG.parent.mkdir(parents=True, exist_ok=True)
        CONFIG.write_text(updated)
    print('PASS: local Ruflo installed; reopen Codex to load the project MCP configuration.')
    print('Ruflo dependencies must be audited before use; see docs/agents/RUFLO_CODEX_PILOT.md.')


if __name__ == '__main__':
    main()
