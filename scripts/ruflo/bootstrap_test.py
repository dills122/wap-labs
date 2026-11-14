#!/usr/bin/env python3
"""Exercise non-destructive setup and idempotence without network or a real install."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parent


class BootstrapTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='ruflo-🦀-')
        self.root = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)
        dest = self.root / 'scripts/ruflo'
        dest.mkdir(parents=True)
        for name in ('bootstrap.py', 'package.json', 'package-lock.json', 'bounded-mcp.mjs'):
            shutil.copy2(SOURCE / name, dest / name)
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        self.bin = self.root / 'fake-bin'
        self.bin.mkdir()
        self.fake('node', '#!/bin/sh\nprintf "v26.13.1\\n"\n')
        self.fake('npm', '#!/bin/sh\nmkdir -p node_modules/ruflo/bin\ntouch node_modules/ruflo/bin/ruflo.js\n')
        self.env = os.environ.copy()
        self.env['PATH'] = str(self.bin) + os.pathsep + self.env.get('PATH', '')

    def fake(self, name, contents):
        path = self.bin / name
        path.write_text(contents)
        path.chmod(0o755)

    def run_bootstrap(self):
        return subprocess.run(['python3', str(self.root / 'scripts/ruflo/bootstrap.py')], cwd=self.root, env=self.env, text=True, capture_output=True)

    def test_preserves_unrelated_config_and_is_idempotent(self):
        config = self.root / '.codex/config.toml'
        config.parent.mkdir()
        original = '[mcp_servers.serena]\ncommand = "serena"\n'
        config.write_text(original)
        first = self.run_bootstrap()
        self.assertEqual(first.returncode, 0, first.stderr)
        text = config.read_text()
        self.assertTrue(text.startswith(original))
        self.assertIn('[mcp_servers.ruflo.tools.task_list]', text)
        self.assertNotIn('[mcp_servers.ruflo.tools.task_create]', text)
        self.assertIn('bounded-mcp.mjs', text)
        second = self.run_bootstrap()
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertEqual(config.read_text(), text)

    def test_existing_ruflo_configuration_is_not_overwritten(self):
        config = self.root / '.codex/config.toml'
        config.parent.mkdir()
        original = '[mcp_servers.ruflo]\ncommand = "existing"\n'
        config.write_text(original)
        result = self.run_bootstrap()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(config.read_text(), original)
        self.assertFalse((self.root / '.ruflo-local').exists())

    def test_inline_mcp_table_is_preserved(self):
        config = self.root / '.codex/config.toml'
        config.parent.mkdir()
        original = 'mcp_servers = {}\n'
        config.write_text(original)
        result = self.run_bootstrap()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(config.read_text(), original)
        self.assertFalse((self.root / '.ruflo-local').exists())

    def test_failed_install_can_be_retried(self):
        self.fake('npm', '#!/bin/sh\nexit 1\n')
        self.assertNotEqual(self.run_bootstrap().returncode, 0)
        self.fake('npm', '#!/bin/sh\nmkdir -p node_modules/ruflo/bin\ntouch node_modules/ruflo/bin/ruflo.js\n')
        self.assertEqual(self.run_bootstrap().returncode, 0)


if __name__ == '__main__':
    unittest.main()
