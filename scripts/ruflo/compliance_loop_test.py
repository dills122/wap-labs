import contextlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import compliance_loop as loop


CLAUSE = 'WML-CL-ANCHOR-ACTIVATION'
OWNED_PATH = 'engine-wasm/engine/src/example.rs'
MANIFEST = 'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json'


class ComplianceLoopTest(unittest.TestCase):
    def setUp(self):
        workspace = tempfile.TemporaryDirectory()
        self.addCleanup(workspace.cleanup)
        root = Path(workspace.name)
        self.primary = root / 'repo'
        self.primary.mkdir()
        self.linked = root / 'linked'
        self.git(self.primary, 'init', '-b', 'main')
        self.git(self.primary, 'config', 'user.name', 'Ruflo Test')
        self.git(self.primary, 'config', 'user.email', 'ruflo-test@local.invalid')
        self.git(self.primary, 'config', 'commit.gpgsign', 'false')
        self.git(self.primary, 'config', 'core.hooksPath', str(root / 'no-hooks'))
        self.write(self.primary / OWNED_PATH, '// base\n')
        self.write(
            self.primary / MANIFEST,
            json.dumps({'families': [{'clauses': [{
                'id': CLAUSE,
                'directWorkItems': ['WML-201'],
                'fixturePlan': {'status': 'planned'},
                'mapping': {'clauseImplementationStatus': 'not-assessed'},
            }]}]}),
        )
        self.write(
            self.primary / 'scripts/wap-context-pack.mjs',
            f'console.log("# WML-201\\n\\n## Direct normative clauses\\n\\n- **{CLAUSE}** — Example");\n',
        )
        self.commit(self.primary, 'Initial fixture')
        self.git(self.primary, 'worktree', 'add', '-b', 'codex/fixture', str(self.linked))
        self.plan = root / 'plan.json'
        self.write(self.plan, json.dumps({
            'workItem': 'WML-201',
            'clauses': [CLAUSE],
            'objective': 'Add a checked implementation.',
            'paths': [OWNED_PATH],
            'checks': [['node', '--version']],
        }))

    @staticmethod
    def git(cwd, *args):
        return subprocess.run(
            ['git', '-C', str(cwd), *args], check=True, capture_output=True, text=True,
        ).stdout.strip()

    @staticmethod
    def write(path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')

    def commit(self, cwd, message):
        self.git(cwd, 'add', '-A')
        self.git(cwd, 'commit', '-m', message)

    def command(self, *args):
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            return loop.main(['--repo', str(self.primary), *map(str, args)])

    def claim(self):
        self.assertEqual(self.command('claim', self.plan, '--worktree', self.linked), 0)

    def test_timeout_resume_and_fresh_verification(self):
        self.claim()
        self.assertNotEqual(self.command('resume'), 0)
        phases = []

        def worker(repo, state, mode, log):
            phases.append(mode)
            if mode == 'work':
                self.write(self.linked / OWNED_PATH, '// checkpoint\n')
                return False
            if mode == 'resume':
                self.assertEqual((self.linked / OWNED_PATH).read_text(), '// checkpoint\n')
                self.write(self.linked / OWNED_PATH, '// candidate\n')
            return True

        with patch.object(loop, 'launch_worker', side_effect=worker), \
             patch.object(loop, 'run_verification') as verification:
            self.assertNotEqual(self.command('work'), 0)
            self.assertNotEqual(self.command('claim', self.plan, '--worktree', self.linked), 0)
            self.write(self.linked / OWNED_PATH, '// stale edit\n')
            self.assertNotEqual(self.command('resume'), 0)
            self.assertEqual(phases, ['work'])
            self.write(self.linked / OWNED_PATH, '// checkpoint\n')
            self.assertEqual(self.command('resume'), 0)
            self.assertNotEqual(self.command('verify'), 0)
            verification.assert_not_called()
            self.commit(self.linked, 'Candidate')
            self.assertEqual(self.command('verify'), 0)
            self.assertEqual(phases, ['work', 'resume', 'review'])
            verification.assert_called_once()
            self.assertEqual(self.git(self.linked, 'diff', 'main', '--', MANIFEST), '')
            self.assertNotEqual(self.command('claim', self.plan, '--worktree', self.linked), 0)
            self.assertEqual(self.command('release'), 0)
            self.assertEqual(self.command('claim', self.plan, '--worktree', self.linked), 0)

    def test_rejects_candidate_with_different_commit_content(self):
        self.claim()

        def worker(repo, state, mode, log):
            self.write(self.linked / OWNED_PATH, '// checked checkpoint\n')
            return True

        with patch.object(loop, 'launch_worker', side_effect=worker):
            self.assertEqual(self.command('work'), 0)
        self.write(self.linked / OWNED_PATH, '// unexpected replacement\n')
        self.commit(self.linked, 'Different content')
        with patch.object(loop, 'launch_worker') as review, \
             patch.object(loop, 'run_verification') as verification:
            self.assertNotEqual(self.command('verify'), 0)
            verification.assert_not_called()
            review.assert_not_called()

    def test_failed_review_requires_a_fresh_review(self):
        self.claim()

        def worker(repo, state, mode, log):
            self.assertEqual(mode, 'work')
            self.write(self.linked / OWNED_PATH, '// candidate\n')
            return True

        with patch.object(loop, 'launch_worker', side_effect=worker):
            self.assertEqual(self.command('work'), 0)
        self.commit(self.linked, 'Candidate')
        with patch.object(loop, 'run_verification') as verification, \
             patch.object(loop, 'launch_worker', side_effect=[False, True]) as review:
            self.assertNotEqual(self.command('verify'), 0)
            self.assertNotEqual(self.command('release'), 0)
            self.assertEqual(self.command('verify'), 0)
            self.assertEqual(verification.call_count, 2)
            self.assertEqual([call.args[2] for call in review.call_args_list], ['review', 'review'])

    def test_resume_can_acknowledge_a_completed_checkpoint_without_editing(self):
        self.claim()

        def worker(repo, state, mode, log):
            if mode == 'work':
                self.write(self.linked / OWNED_PATH, '// finished before timeout\n')
                return False
            self.assertEqual(mode, 'resume')
            self.assertEqual((self.linked / OWNED_PATH).read_text(), '// finished before timeout\n')
            return True

        with patch.object(loop, 'launch_worker', side_effect=worker):
            self.assertNotEqual(self.command('work'), 0)
            self.assertEqual(self.command('resume'), 0)
        self.commit(self.linked, 'Candidate')
        with patch.object(loop, 'run_verification'), patch.object(loop, 'launch_worker', return_value=True):
            self.assertEqual(self.command('verify'), 0)

    def test_verify_hashes_committed_file_mode_even_if_git_ignores_worktree_mode(self):
        self.claim()

        def worker(repo, state, mode, log):
            self.write(self.linked / OWNED_PATH, '// candidate\n')
            return True

        with patch.object(loop, 'launch_worker', side_effect=worker):
            self.assertEqual(self.command('work'), 0)
        self.git(self.linked, 'config', 'core.filemode', 'false')
        self.git(self.linked, 'add', '--', OWNED_PATH)
        self.git(self.linked, 'update-index', '--chmod=+x', '--', OWNED_PATH)
        self.git(self.linked, 'commit', '-m', 'Wrong mode in Git tree')
        self.assertEqual(self.git(self.linked, 'status', '--porcelain'), '')
        with patch.object(loop, 'run_verification') as verification:
            self.assertNotEqual(self.command('verify'), 0)
            verification.assert_not_called()

    def test_verify_hashes_raw_blobs_when_clean_filters_normalize_worktree_bytes(self):
        self.write(self.linked / '.gitattributes', f'{OWNED_PATH} text eol=crlf\n')
        self.commit(self.linked, 'Enable line ending conversion')
        self.claim()
        content = b'// candidate\r\n'

        def worker(repo, state, mode, log):
            (self.linked / OWNED_PATH).write_bytes(content)
            return True

        with patch.object(loop, 'launch_worker', side_effect=worker):
            self.assertEqual(self.command('work'), 0)
        self.commit(self.linked, 'Candidate with normalized content')
        self.assertEqual((self.linked / OWNED_PATH).read_bytes(), content)
        self.assertEqual(self.git(self.linked, 'status', '--porcelain'), '')
        with patch.object(loop, 'run_verification') as verification:
            self.assertNotEqual(self.command('verify'), 0)
            verification.assert_not_called()

    def test_timed_out_verification_leaves_the_claim_unsettled(self):
        self.assert_unsettled_verification(124)

    def test_sigterm_from_shell_leaves_the_claim_unsettled(self):
        self.assert_unsettled_verification(143)

    def test_sigkill_from_shell_leaves_the_claim_unsettled(self):
        self.assert_unsettled_verification(137)

    def assert_unsettled_verification(self, code):
        self.claim()

        def worker(repo, state, mode, log):
            self.write(self.linked / OWNED_PATH, '// candidate\n')
            return True

        with patch.object(loop, 'launch_worker', side_effect=worker):
            self.assertEqual(self.command('work'), 0)
        self.commit(self.linked, 'Candidate')
        with patch.object(loop, 'run_logged', return_value=code), \
             patch.object(loop, 'launch_worker') as review:
            self.assertNotEqual(self.command('verify'), 0)
            review.assert_not_called()
        common = Path(self.git(self.primary, 'rev-parse', '--path-format=absolute', '--git-common-dir'))
        receipt = json.loads((common / 'ruflo-compliance-loop/claim.json').read_text())
        self.assertEqual(receipt['status'], 'verifying')
        self.assertNotEqual(self.command('resume'), 0)
        self.assertNotEqual(self.command('abandon'), 0)

    def test_rejects_primary_or_dirty_worktree(self):
        self.assertNotEqual(self.command('claim', self.plan, '--worktree', self.primary), 0)
        self.write(self.linked / OWNED_PATH, '// dirty\n')
        self.assertNotEqual(self.command('claim', self.plan, '--worktree', self.linked), 0)

    def test_timeout_allows_child_cleanup_after_the_leader_exits(self):
        ready = self.plan.parent / 'child-ready'
        cleanup = self.plan.parent / 'child-cleanup'
        child = '''
import signal
import sys
import time
from pathlib import Path

def stop(*_):
    time.sleep(0.2)
    Path(sys.argv[2]).touch()
    raise SystemExit(0)

signal.signal(signal.SIGTERM, stop)
Path(sys.argv[1]).touch()
signal.pause()
'''
        parent = '''
import subprocess
import sys
import time

subprocess.Popen([sys.executable, '-c', sys.argv[1], *sys.argv[2:]])
time.sleep(30)
'''
        result = loop.run_logged(
            [sys.executable, '-c', parent, child, str(ready), str(cleanup)],
            self.linked, self.plan.parent / 'timeout.log', timeout=1,
        )
        self.assertEqual(result, 124)
        self.assertTrue(ready.exists(), 'child started before timeout')
        self.assertTrue(cleanup.exists(), 'child finished cleanup after the leader exited')

    def test_writer_scope_excludes_shared_compliance_files(self):
        bad_plan = json.loads(self.plan.read_text())
        bad_plan['paths'] += [MANIFEST]
        self.write(self.plan, json.dumps(bad_plan))
        self.assertNotEqual(self.command('claim', self.plan, '--worktree', self.linked), 0)


if __name__ == '__main__':
    unittest.main()
