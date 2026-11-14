#!/usr/bin/env python3
"""Launch Serena with project-local compatibility fixes for its LSP adapters.

The installed Serena distribution is never modified. Keep these shims narrow and
remove them when the corresponding upstream behavior is fixed.
"""
import sys
from functools import wraps
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_EXTENSIONS = {'.yaml', '.yml', '.json', '.toml'}


def filter_astro_files(original):
    @wraps(original)
    def wrapped(server):
        return [path for path in original(server) if (Path(server.repo_path) / path).is_file()]
    return wrapped


def yaml_configuration(params):
    return [{} for _ in params.get('items', [])]


def prioritize_reference_sources(original):
    @wraps(original)
    def wrapped(project, *args, **kwargs):
        files = original(project, *args, **kwargs)
        return sorted(files, key=lambda item: Path(item.rel_path).suffix.lower() in CONFIG_EXTENSIONS)
    return wrapped


def install_compatibility():
    from solidlsp.language_servers.astro_language_server import AstroLanguageServer
    from solidlsp.language_servers.yaml_language_server import YamlLanguageServer

    AstroLanguageServer._find_all_astro_files = filter_astro_files(AstroLanguageServer._find_all_astro_files)
    original_start = YamlLanguageServer._start_server

    @wraps(original_start)
    def start_yaml(server):
        server.server.on_request('workspace/configuration', yaml_configuration)
        return original_start(server)

    YamlLanguageServer._start_server = start_yaml

    if sys.argv[1:3] == ['project', 'health-check']:
        from serena.project import Project
        Project.gather_source_files = prioritize_reference_sources(Project.gather_source_files)


def main():
    from serena.cli import top_level

    cwd = Path.cwd().resolve()
    if cwd == PROJECT_ROOT or PROJECT_ROOT in cwd.parents:
        install_compatibility()
    sys.exit(top_level())


if __name__ == '__main__':
    main()
