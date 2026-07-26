# Contributing

Before starting work, choose the documentation track:

- Legacy stack setup/runbook: `docs/wap-test-environment/README.md`
- Browser emulator build track: `docs/browser-emulator/README.md`

## Development setup

Quick bootstrap:

```bash
./scripts/init-refresh.sh
```

Canonical prerequisite reference:

- `docs/development-prerequisites.md`

1. Clone repository and install required tools:
   - Docker + Docker Compose
   - Node 20.19+ (or 22.12+). Repo pin: `.nvmrc`
   - pnpm 10+ (for Node workspace scripts)
   - Rust toolchain + wasm-pack (for `engine-wasm`)
   - `pre-commit` (for git hooks)
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
make hooks-install
```

Hook behavior:

- `pre-commit` hook runs `lint-staged` on staged files only:
  - Prettier for `browser/frontend` and `engine-wasm/host-sample`
  - `rustfmt` for staged Rust files in `engine-wasm/engine`, `browser/src-tauri`, and `transport-rust`
  - Frontend typecheck (`pnpm --dir browser/frontend exec tsc --noEmit`) when staged changes touch `browser/contracts/*` or `browser/frontend/*`
- `pre-push` hook runs strict checks via `pre-commit` (`rust fmt --check`, `cargo clippy -D warnings`, `cargo test` where configured, and configured non-mutating checks).

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

- Canonical changed-path verification:

```bash
pnpm verify
```

- Strict deterministic offline verification before opening a PR:

```bash
pnpm verify:full
```

The smaller `pnpm verify:fast` profile covers orchestration, whitespace, and version checks.
`pnpm verify:extended` adds the explicit live Kannel gate and an advisory browser baseline; it is
not part of ordinary offline verification. Selected required prerequisites never silently skip:
the command reports `UNAVAILABLE PREREQUISITE` and exits nonzero with a remediation hint.

See [Local Verification Contract](docs/ci/LOCAL_VERIFICATION.md) for path selection, exact outcome
labels, Make aliases, and the local-versus-GitHub CI boundary. `make ci-local` is a deprecated
compatibility alias that prints that boundary before running `make verify-full`.

Pre-push node hooks are opt-in:

```bash
WAP_ENABLE_NODE_HOOKS=1 pre-commit run --all-files
```

## Git Hooks and CI

- Local hooks are wired from `.githooks/` (`git config core.hooksPath .githooks`).
- `.githooks/pre-commit` runs `lint-staged` and `.githooks/pre-push` runs `.pre-commit-config.yaml` checks.
- CI runs in GitHub Actions:
  - `.github/workflows/ci.yml` (required PR/push checks)
    - complete WAP compliance and active status drift run in a path-aware job under the aggregate
      required gate
  - `.github/workflows/transport-wap-smoke.yml` (manual WAP smoke against Kannel stack)
- Branch protection required-check policy: `docs/ci/REQUIRED_CHECKS.md`
- Some layer checks are intentionally disabled until those layers are bootstrapped:
  - `electron-app` lint/test/build
  - Node package lint/test scripts where not yet defined

## Pull request checklist

- [ ] Code builds/tests pass locally for touched components
- [ ] Docs updated for setup/contract changes
- [ ] No generated artifacts committed unless intentionally required
