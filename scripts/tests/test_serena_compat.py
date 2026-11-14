import importlib.util
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

spec = importlib.util.spec_from_file_location('serena_compat', Path(__file__).parents[1] / 'serena-compat.py')
compat = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compat)


class SerenaCompatTests(unittest.TestCase):
    def test_astro_filters_directories_but_keeps_real_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'cache.astro').mkdir()
            (root / 'component.astro').write_text('<div />')
            server = SimpleNamespace(repo_path=directory)
            wrapped = compat.filter_astro_files(lambda _server: ['cache.astro', 'component.astro'])
            self.assertEqual(wrapped(server), ['component.astro'])

    def test_yaml_configuration_returns_one_default_per_item(self):
        self.assertEqual(compat.yaml_configuration({'items': [{}, {}]}), [{}, {}])
        self.assertEqual(compat.yaml_configuration({}), [])

    def test_health_probe_prefers_reference_capable_source(self):
        files = [SimpleNamespace(rel_path='config.yaml'), SimpleNamespace(rel_path='src/main.ts')]
        result = compat.prioritize_reference_sources(lambda _project, _path='': files)(None)
        self.assertEqual([item.rel_path for item in result], ['src/main.ts', 'config.yaml'])


if __name__ == '__main__':
    unittest.main()
