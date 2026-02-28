# Contributing

Before starting work, choose the documentation track:

- Legacy stack setup/runbook: `docs/wap-test-environment/README.md`
- Browser emulator build track: `docs/browser-emulator/README.md`

## Development setup

1. Clone repository and install required tools:
   - Docker + Docker Compose
   - Node 20.19+ (or 22.12+). Repo pin: `.nvmrc`
   - pnpm 10+ (for Node workspace scripts)
   - Rust toolchain + wasm-pack (for `engine-wasm`)
   - Python 3.11+ + `pre-commit` (for git hooks)
2. Start legacy stack:

```bash
make up
make status
```

3. Build WASM engine package:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
```

4. Install git hooks:

```bash
pipx install pre-commit
make hooks-install
```

Hook behavior:

- `pre-commit` hook auto-runs `cargo fmt` for staged Rust files in `engine-wasm/engine` and re-stages changes.
- `pre-push` hook runs strict checks via `pre-commit` (`rust fmt --check`, `cargo test`, and configured non-mutating checks).

## Coding standards

- Follow `.editorconfig`.
- Keep cross-layer contracts synchronized with implementation changes.
- Add/update docs for any setup, command, or interface change.

## Testing

- Legacy smoke test:

```bash
make smoke
```

- WASM engine tests:

```bash
cd engine-wasm/engine
cargo test
```

- Repo-wide CI-equivalent checks:

```bash
make ci-local
```

Node checks are disabled by default in `make` to avoid blocking environments without stable pnpm/corepack setup. Enable them explicitly when needed:

```bash
ENABLE_NODE_CHECKS=1 make ci-local
```

Pre-commit node hooks are also opt-in:

```bash
WAP_ENABLE_NODE_HOOKS=1 pre-commit run --all-files
```

## Git Hooks and CI

- Local hooks are wired from `.githooks/` (`git config core.hooksPath .githooks`) and use `.pre-commit-config.yaml` for pre-push checks.
- CI runs in GitHub Actions: `.github/workflows/ci.yml`.
- Some layer checks are intentionally disabled until those layers are bootstrapped:
  - `transport-python` lint/test
  - `electron-app` lint/test/build
  - Node package lint/test scripts where not yet defined

## Pull request checklist

- [ ] Code builds/tests pass locally for touched components
- [ ] Docs updated for setup/contract changes
- [ ] No generated artifacts committed unless intentionally required
