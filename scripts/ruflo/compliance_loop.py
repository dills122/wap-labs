#!/usr/bin/env python3
"""Supervise one local, evidence-gated Ruflo compliance claim at a time."""

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import time
import uuid


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
RELEASE = '.ruflo-local/releases/3.77.1'
LEDGER = 'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json'
IMPLEMENTATION_ROOTS = (
    'engine-wasm/engine/src/',
    'engine-wasm/engine/tests/',
    'engine-wasm/contracts/',
    'engine-wasm/examples/source/',
    'browser/frontend/src/',
    'browser/src-tauri/src/',
    'transport-rust/src/',
    'transport-rust/tests/',
    'gateway-kannel/',
    'docker/kannel/',
)
TERMINAL = {'released', 'abandoned'}
RUNNING = {'working', 'verifying'}
DEFAULT_TIMEOUT = 180


class UserError(Exception):
    """An invalid operation or unavailable prerequisite."""


class CleanupUncertain(Exception):
    """Process cleanup could not be verified within its deadline."""


class StopRequested(Exception):
    """An operator requested termination of this process."""


def git(root, *args):
    result = subprocess.run(
        ['git', '-C', str(root), *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        timeout=20, check=False,
    )
    if result.returncode != 0:
        raise UserError(result.stderr.decode(errors='replace').strip() or 'Git command failed.')
    return result.stdout


def git_text(root, *args):
    return git(root, *args).decode().strip()


def git_paths(root, *args):
    return {os.fsdecode(path) for path in git(root, *args).split(b'\0') if path}


def git_dir(root, option):
    return Path(git_text(root, 'rev-parse', '--path-format=absolute', option)).resolve()


def dirty(root):
    return bool(git(root, 'status', '--porcelain=v1', '-z', '--untracked-files=all'))


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError) as exc:
        raise UserError(f'Cannot read JSON from {path}: {exc}.') from exc


def write_json(path, value):
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False) as stream:
        temporary = Path(stream.name)
        try:
            json.dump(value, stream, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)


def now():
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def claim_lock(state_dir):
    state_dir.mkdir(mode=0o700, exist_ok=True)
    with (state_dir / 'claim.lock').open('a') as stream:
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise UserError('Another compliance-loop command is running for this repository.') from exc
        yield


def save_state(path, state):
    state['updatedAt'] = now()
    # Preserve each claim even when the active receipt is replaced by the next one.
    write_json(path.parent / state['id'] / 'receipt.json', state)
    write_json(path, state)


def strings(value, *, limit, name):
    if (
        not isinstance(value, list) or not 1 <= len(value) <= limit
        or any(not isinstance(part, str) or not part.strip() or '\0' in part for part in value)
    ):
        raise UserError(f'{name} must be a nonempty array of at most {limit} nonempty strings.')
    return value


def scoped_file(root, relative):
    path = PurePosixPath(relative)
    if (
        path.as_posix() != relative or path.is_absolute() or '..' in path.parts
        or any(character < ' ' or character == '\x7f' for character in relative)
        or any(part.startswith('.') for part in path.parts)
        or not relative.startswith(IMPLEMENTATION_ROOTS)
    ):
        raise UserError(f'Path must name one exact implementation file: {relative!r}.')
    resolved = root
    for index, part in enumerate(path.parts):
        resolved /= part
        if resolved.is_symlink():
            raise UserError(f'Symlinks are outside claim scope: {relative}.')
        if index < len(path.parts) - 1 and resolved.exists() and not resolved.is_dir():
            raise UserError(f'An owned path parent must be a directory: {relative}.')
    if resolved.exists() and not resolved.is_file():
        raise UserError(f'Path must be a regular file: {relative}.')
    return resolved


def open_clauses(root, plan):
    ledger = read_json(root / LEDGER)
    clauses = {clause['id']: clause for family in ledger['families'] for clause in family['clauses']}
    for clause_id in plan['clauses']:
        clause = clauses.get(clause_id)
        if not clause or plan['workItem'] not in clause.get('directWorkItems', []):
            raise UserError(f'{clause_id} is not directly mapped to {plan["workItem"]}.')
        status = clause.get('fixturePlan', {}).get('status')
        assessment = clause.get('mapping', {}).get('clauseImplementationStatus')
        if status != 'planned' or assessment not in (None, 'not-assessed'):
            raise UserError(f'{clause_id} does not have an open planned fixture.')


def read_plan(path, worktree):
    plan = read_json(path)
    if not isinstance(plan, dict) or set(plan) - {
        'workItem', 'clauses', 'objective', 'paths', 'checks', 'timeoutSeconds'
    }:
        raise UserError('Plan must contain workItem, clauses, objective, paths, checks, and optional timeoutSeconds.')
    work_item = plan.get('workItem')
    if not isinstance(work_item, str) or not re.fullmatch(r'[A-Z]+-\d+', work_item):
        raise UserError('workItem must be a canonical work-item ID.')
    objective = plan.get('objective')
    if not isinstance(objective, str) or not objective.strip() or len(objective) > 4000 or '\0' in objective:
        raise UserError('objective must be nonempty and at most 4000 characters.')
    clauses = strings(plan.get('clauses'), limit=16, name='clauses')
    paths = strings(plan.get('paths'), limit=32, name='paths')
    if len(set(clauses)) != len(clauses) or len(set(paths)) != len(paths):
        raise UserError('Duplicate clauses or owned paths are not allowed.')
    for path_name in paths:
        scoped_file(worktree, path_name)
    checks = plan.get('checks')
    if not isinstance(checks, list) or not 1 <= len(checks) <= 12:
        raise UserError('checks must contain one to twelve argv arrays.')
    for check in checks:
        strings(check, limit=32, name='check argv')
    timeout = plan.setdefault('timeoutSeconds', DEFAULT_TIMEOUT)
    if type(timeout) is not int or not 1 <= timeout <= 1800:
        raise UserError('timeoutSeconds must be an integer between 1 and 1800.')
    open_clauses(worktree, plan)
    return plan


def claim(state_path, common, plan_path, worktree):
    if state_path.exists() and read_json(state_path)['status'] not in TERMINAL:
        raise UserError('This repository already has an active compliance claim.')
    worktree = worktree.resolve()
    if (
        Path(git_text(worktree, 'rev-parse', '--show-toplevel')).resolve() != worktree
        or git_dir(worktree, '--git-common-dir') != common
        or git_dir(worktree, '--git-dir') == common
    ):
        raise UserError('Use the root of an isolated linked worktree in this repository.')
    branch = git_text(worktree, 'branch', '--show-current')
    if not branch or branch in {'main', 'gh-pages'}:
        raise UserError('Claim requires a linked worktree on a feature branch.')
    base = git_text(worktree, 'rev-parse', 'HEAD')
    if dirty(worktree):
        raise UserError('Claim requires a clean worktree.')
    plan = read_plan(plan_path, worktree)
    result = subprocess.run(
        ['node', 'scripts/wap-context-pack.mjs', plan['workItem']], cwd=worktree,
        capture_output=True, text=True, timeout=30, check=False,
    )
    if result.returncode != 0:
        raise UserError(f'Cannot retrieve the focused context pack: {result.stderr.strip()[-600:]}')
    for clause_id in plan['clauses']:
        if not any(line.startswith(f'- **{clause_id}**') for line in result.stdout.splitlines()):
            raise UserError(f'Focused context pack does not contain {clause_id}.')
    if dirty(worktree) or git_text(worktree, 'rev-parse', 'HEAD') != base:
        raise UserError('The worktree changed during claim validation.')
    claim_id = uuid.uuid4().hex
    directory = state_path.parent / claim_id
    directory.mkdir(mode=0o700)
    (directory / 'context.md').write_text(result.stdout)
    state = {
        'id': claim_id, 'status': 'claimed', 'worktree': str(worktree), 'branch': branch,
        'base': base, 'workerHead': base, 'plan': plan, 'attempts': [],
        'gitDir': str(git_dir(worktree, '--git-dir')),
    }
    save_state(state_path, state)


def check_worktree(state, expected_head):
    worktree = Path(state['worktree'])
    if (
        str(git_dir(worktree, '--git-dir')) != state['gitDir']
        or git_text(worktree, 'rev-parse', 'HEAD') != expected_head
        or git_text(worktree, 'branch', '--show-current') != state['branch']
    ):
        raise UserError('The claimed branch or HEAD changed. Restore the recorded checkpoint or abandon the claim.')
    return worktree


def snapshot(state):
    root = Path(state['worktree'])
    paths = git_paths(root, 'diff', '--name-only', '--no-renames', '-z', state['base'], '--')
    paths |= git_paths(root, 'ls-files', '--others', '--exclude-standard', '-z')
    outside = sorted(paths - set(state['plan']['paths']))
    if outside:
        raise UserError(f'Changes outside the owned paths: {", ".join(repr(path) for path in outside)}.')
    if git_paths(root, 'diff', '--cached', '--name-only', '--no-renames', '-z', 'HEAD', '--'):
        raise UserError('The Git index has staged changes. A worker may only change owned worktree files.')
    files = {}
    for name in sorted(paths):
        path = scoped_file(root, name)
        if path.exists():
            mode = '100755' if path.stat().st_mode & stat.S_IXUSR else '100644'
            files[name] = {'mode': mode, 'sha256': digest(path.read_bytes())}
        else:
            files[name] = None
    return {'files': files, 'sha256': digest(json.dumps(files, sort_keys=True).encode())}


def commit_matches_checkpoint(state, commit):
    worktree = Path(state['worktree'])
    expected = state['checkpoint']['files']
    paths = git_paths(worktree, 'diff-tree', '-r', '--no-commit-id', '--name-only',
                      '--no-renames', '-z', state['base'], commit, '--')
    if paths != expected.keys():
        return False
    for name, checkpoint in expected.items():
        entry = git(worktree, '--literal-pathspecs', 'ls-tree', '--full-tree',
                    '-z', commit, '--', name)
        if checkpoint is None:
            if entry:
                return False
            continue
        metadata, separator, path = entry.partition(b'\t')
        fields = metadata.split()
        if not separator or path != os.fsencode(name) + b'\0' or len(fields) != 3:
            return False
        mode, kind, blob = fields
        if kind != b'blob' or mode not in (b'100644', b'100755') or mode.decode() != checkpoint['mode']:
            return False
        if digest(git(worktree, 'cat-file', 'blob', blob.decode())) != checkpoint['sha256']:
            return False
    return True


def signal_group(process, sig):
    try:
        os.killpg(process.pid, sig)
    except ProcessLookupError:
        return False
    return True


def stop_group(process):
    try:
        if signal_group(process, signal.SIGTERM):
            deadline = time.monotonic() + 5
            # The coordinator can exit before its proxy has reaped the separate
            # Codex process group. Allow surviving group members to finish cleanup.
            while True:
                process.poll()
                if not signal_group(process, 0):
                    break
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    if signal_group(process, signal.SIGKILL):
                        process.wait(timeout=5)
                        raise CleanupUncertain(
                            'Process group required forced shutdown. Inspect for remaining descendants before manually recovering the claim.'
                        )
                    break
                time.sleep(min(0.05, remaining))
        process.wait()
    except (PermissionError, subprocess.TimeoutExpired) as exc:
        raise CleanupUncertain(
            'Could not confirm process cleanup. Inspect for remaining descendants before manually recovering the claim.'
        ) from exc


def run_logged(argv, cwd, log, timeout, env=None):
    with log.open('xb') as stream:
        process = subprocess.Popen(
            argv, cwd=cwd, env=env, stdin=subprocess.DEVNULL, stdout=stream,
            stderr=subprocess.STDOUT, start_new_session=True,
        )
        try:
            return process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            return 124
        except (KeyboardInterrupt, StopRequested):
            return 130
        finally:
            try:
                stop_group(process)
            except CleanupUncertain as exc:
                stream.write(f'\n{exc}\n'.encode())
                raise


def runtime_paths(repo):
    node = shutil.which('node')
    codex = shutil.which('codex')
    if not node or not codex:
        raise UserError('Put Node 26 and Codex on PATH before running workers.')
    node = str(Path(node).resolve())
    version = subprocess.check_output([node, '--version'], text=True, timeout=10).strip()
    if not version.startswith('v26.'):
        raise UserError(f'Workers require the project Node 26 toolchain, found {version}.')
    lock_hash = digest((SCRIPT_DIR / 'package-lock.json').read_bytes())
    for root in dict.fromkeys((repo, git_dir(repo, '--git-common-dir').parent, REPO_ROOT)):
        release = root / RELEASE
        marker = release / '.wap-ruflo-lock-sha256'
        cli = release / 'node_modules/ruflo/bin/ruflo.js'
        if marker.is_file() and marker.read_text().strip() == lock_hash and cli.is_file():
            return node, str(Path(codex).resolve()), cli
    raise UserError('Install the repository-pinned Ruflo release using scripts/ruflo/bootstrap.py.')


def launch_worker(repo, state, mode, log):
    node, codex, cli = runtime_paths(repo)
    request = log.with_suffix('.request.json')
    receipt = log.with_suffix('.result.json')
    expected_head = state['verificationHead'] if mode == 'review' else state['workerHead']
    packet = {
        'id': state['id'], 'mode': mode, 'base': state['base'], 'head': expected_head,
        'worktree': state['worktree'], 'plan': state['plan'],
        'previousVerification': state.get('previousVerification'),
    }
    write_json(request, packet)
    env = dict(
        os.environ, RUFLO_PINNED_NODE=node, RUFLO_PINNED_CLI=str(cli), WAP_RUFLO_CODEX=codex,
        PYTHONDONTWRITEBYTECODE='1',
        PATH=os.pathsep.join((str(SCRIPT_DIR / 'bin'), str(Path(node).parent), os.environ.get('PATH', ''))),
    )
    code = run_logged(
        [node, str(SCRIPT_DIR / 'compliance-worker.mjs'), str(request), str(receipt)],
        log.parent, log, state['plan']['timeoutSeconds'] + 20, env,
    )
    if code != 0 or not receipt.is_file():
        return False
    result = read_json(receipt)
    return (
        result.get('id') == state['id'] and result.get('mode') == mode
        and result.get('head') == expected_head and result.get('status') == 'completed'
        and result.get('accepted') is True
    )


def begin_attempt(state_path, state, phase):
    directory = state_path.parent / state['id'] / f'{len(state["attempts"]) + 1:02}-{phase}'
    directory.mkdir(mode=0o700)
    attempt = {'phase': phase, 'startedAt': now(), 'logs': str(directory)}
    state['attempts'].append(attempt)
    return directory, attempt


def do_work(repo, state_path, state, mode):
    status = state['status']
    if mode == 'work' and status == 'claimed':
        worktree = check_worktree(state, state['base'])
        if dirty(worktree):
            raise UserError('Start work from the clean claimed base.')
    elif mode == 'resume' and status in {'interrupted', 'revision_requested'}:
        head = state['workerHead'] if status == 'interrupted' else state['verificationHead']
        worktree = check_worktree(state, head)
        if status == 'revision_requested' and dirty(worktree):
            raise UserError('Start a verification revision from the clean reviewed candidate commit.')
        if snapshot(state) != state.get('checkpoint'):
            raise UserError('Resume checkpoint changed. Restore the exact recorded files before resuming.')
        state['workerHead'] = head
    else:
        raise UserError(f'Cannot {mode} a claim in state {status}.')
    open_clauses(worktree, state['plan'])
    before = snapshot(state)
    log_dir, attempt = begin_attempt(state_path, state, mode)
    state['status'] = 'working'
    save_state(state_path, state)
    try:
        accepted = launch_worker(repo, state, mode, log_dir / 'worker.log')
    except (OSError, ValueError, UserError, subprocess.SubprocessError) as exc:
        accepted = False
        attempt['error'] = str(exc)
    try:
        check_worktree(state, state['workerHead'])
        checkpoint = snapshot(state)
        open_clauses(worktree, state['plan'])
    except (OSError, ValueError, UserError, subprocess.SubprocessError) as exc:
        state['status'] = 'blocked'
        attempt['finishedAt'] = now()
        attempt['error'] = str(exc)
        save_state(state_path, state)
        raise UserError(f'Worker output is outside the claimed boundary. {exc}') from exc
    state['checkpoint'] = checkpoint
    attempt['checkpoint'] = checkpoint['sha256']
    attempt['finishedAt'] = now()
    if accepted and checkpoint['files'] and (mode == 'resume' or checkpoint != before):
        state['status'] = 'candidate'
        state.pop('verificationHead', None)
        state.pop('previousVerification', None)
        save_state(state_path, state)
        return
    state['status'] = 'interrupted' if checkpoint['files'] else 'blocked'
    save_state(state_path, state)
    raise UserError(f'Worker did not leave a completed candidate. State is {state["status"]}; logs: {log_dir}.')


def run_verification(state, log_dir):
    worktree = Path(state['worktree'])
    commands = [*state['plan']['checks'], ['node', '--run', 'wap-compliance:check']]
    for index, argv in enumerate(commands, 1):
        log = log_dir / f'check-{index:02}.log'
        code = run_logged(argv, worktree, log, state['plan']['timeoutSeconds'])
        if code in (124, 130, 137, 143) or code < 0:
            # Trusted checks can launch independent sessions that outlive their
            # original process group. Keep verification locked pending inspection.
            raise CleanupUncertain(
                f'Check {index} stopped with code {code}. Confirm any remaining processes '
                f'are stopped before manually recovering the claim; see {log}.'
            )
        if code != 0:
            raise UserError(f'Check {index} exited {code}; see {log}.')
        check_worktree(state, state['verificationHead'])
        if dirty(worktree):
            raise UserError(f'Check {index} changed the candidate worktree; see {log}.')


def verify(repo, state_path, state):
    if state['status'] not in {'candidate', 'revision_requested'}:
        raise UserError(f'Cannot verify a claim in state {state["status"]}.')
    worktree = Path(state['worktree'])
    commit = git_text(worktree, 'rev-parse', 'HEAD')
    check_worktree(state, commit)
    if dirty(worktree) or git_text(worktree, 'rev-list', '--parents', '-n', '1', 'HEAD').split() != [commit, state['base']]:
        raise UserError('Verification requires one clean local candidate commit on the claimed base.')
    if snapshot(state) != state.get('checkpoint') or not commit_matches_checkpoint(state, commit):
        raise UserError('Candidate commit does not match the recorded worker checkpoint.')
    open_clauses(worktree, state['plan'])
    log_dir, attempt = begin_attempt(state_path, state, 'verify')
    state['status'] = 'verifying'
    state['verificationHead'] = commit
    attempt['head'] = commit
    save_state(state_path, state)
    try:
        run_verification(state, log_dir)
        if not launch_worker(repo, state, 'review', log_dir / 'review.log'):
            raise UserError(f'Independent review did not pass; see {log_dir}.')
        check_worktree(state, commit)
        if dirty(worktree) or snapshot(state) != state['checkpoint']:
            raise UserError('Candidate worktree changed during verification.')
        open_clauses(worktree, state['plan'])
    except (OSError, ValueError, UserError, subprocess.SubprocessError) as exc:
        attempt['error'] = str(exc)
        attempt['finishedAt'] = now()
        state['previousVerification'] = str(log_dir)
        state['status'] = 'revision_requested'
        save_state(state_path, state)
        raise UserError(str(exc)) from exc
    attempt['finishedAt'] = now()
    state['status'] = 'verified'
    state['verifiedHead'] = commit
    save_state(state_path, state)


def run(args):
    repo = args.repo.resolve()
    common = git_dir(repo, '--git-common-dir')
    state_dir = common / 'ruflo-compliance-loop'
    state_path = state_dir / 'claim.json'
    if args.command == 'status':
        print(json.dumps(read_json(state_path) if state_path.exists() else {'status': 'idle'}, indent=2))
        return
    with claim_lock(state_dir):
        if args.command == 'claim':
            claim(state_path, common, args.plan, args.worktree)
        else:
            if not state_path.is_file():
                raise UserError('No compliance claim exists.')
            state = read_json(state_path)
            if state['status'] in RUNNING:
                raise UserError(
                    'The previous supervisor did not settle the run. Inspect the recorded logs and stop '
                    'any remaining processes before recovering this claim manually.'
                )
            if args.command in {'work', 'resume'}:
                do_work(repo, state_path, state, args.command)
            elif args.command == 'verify':
                verify(repo, state_path, state)
            elif args.command == 'release':
                if state['status'] != 'verified':
                    raise UserError('Only a verified claim can be released. Abandon other settled claims explicitly.')
                state['status'] = 'released'
                save_state(state_path, state)
            elif args.command == 'abandon':
                if state['status'] in TERMINAL:
                    raise UserError(f'Cannot abandon a claim in state {state["status"]}.')
                state['status'] = 'abandoned'
                save_state(state_path, state)
        result = read_json(state_path)
        print(json.dumps({'id': result['id'], 'status': result['status'], 'receipt': str(state_path)}))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=REPO_ROOT, help='Any checkout in the repository.')
    phases = parser.add_subparsers(dest='command', required=True)
    claim_parser = phases.add_parser('claim', help='Validate and claim one open compliance slice.')
    claim_parser.add_argument('plan', type=Path)
    claim_parser.add_argument('--worktree', type=Path, required=True)
    for name in ('work', 'resume', 'verify', 'status', 'release', 'abandon'):
        phases.add_parser(name)
    try:
        run(parser.parse_args(argv))
    except (OSError, ValueError, UserError, CleanupUncertain, subprocess.SubprocessError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 1
    except (KeyboardInterrupt, StopRequested):
        print('FAIL: Interrupted. Run status before restarting.', file=sys.stderr)
        return 130
    return 0


if __name__ == '__main__':
    def stop_requested(_signum, _frame):
        raise StopRequested

    signal.signal(signal.SIGTERM, stop_requested)
    sys.exit(main())
