# Development Prerequisites

Canonical prerequisite + setup reference for local development across all repository layers.

## Baseline Tools

- `git`
- `node` 20.19+ (or 22.12+) and `npm`
- `pnpm` 10+
- Go 1.25+
- Rust toolchain (`rustup`, `cargo`, `rustc`)
- `pre-commit` (recommended for local hook parity)

Optional but commonly required:

- `wasm-pack` (engine wasm package builds)
- `cargo-tauri` / `tauri-cli` (desktop host dev/build)
- Docker + Compose (legacy Kannel stack)
- OpenTofu 1.12.5 (network-preview infrastructure validation)
- actionlint 1.7.12 (semantic validation of network-preview GitHub Actions workflows)
- `shellcheck` (network-preview reusable shell validation)

## One-shot Bootstrap / Refresh

From repo root:

```bash
./scripts/init-refresh.sh
```

The script is idempotent and will:

- install/update workspace Node dependencies
- verify the standard-library-only `wml-server` Go module
- optionally install hooks (if `pre-commit` is available)
- optionally install Rust CLI tools (`wasm-pack`, `cargo-tauri`) when enabled

## Script Knobs

Environment variables supported by `scripts/init-refresh.sh`:

- `AUTO_INSTALL_RUST_TOOLS=1` to auto-install missing `wasm-pack` and `cargo-tauri`
- `SKIP_NODE_INSTALLS=1` to skip Node dependency setup
- `SKIP_HOOKS=1` to skip hook installation

## Layer-Specific Notes

### `transport-rust/`

- Lint: `cargo fmt --check` and `cargo clippy --all-targets --all-features -- -D warnings`
- Tests: `cargo test`

### `engine-wasm/engine`

- Build wasm package: `wasm-pack build --target web --out-dir ../pkg`
- Tests: `cargo test`

### `browser/src-tauri`

- Build checks: `cargo check`
- Tests: `cargo test`
- Tauri dev: `pnpm --dir browser tauri:dev`

### `wml-server/`

- Format: `make fmt`
- Lint: `cd wml-server && go vet ./...`
- Tests: `cd wml-server && go test ./...`
- Start the origin directly: `cd wml-server && go run ./cmd/wml-server`
- Public WML listens on `:3000`; internal health and metrics listen on `:3001`.

### `infra/network-preview/`

- Version: `infra/network-preview/.opentofu-version`
- Static validation: `make lint-tofu`
- Install the pinned workflow linter with
  `go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12`.
- Direct format check: `tofu fmt -check -recursive infra/network-preview`
- Static checks disable the remote backend and use no cloud credentials.
- Semantic workflow validity is offline evidence only; it does not configure the protected
  `PRE-003` environments or prove live R2/DigitalOcean behavior.
- The R2 lock driver is access-backed and must not run before the protected `PRE-003` environment
  exists; see `infra/network-preview/README.md`.

## CI Parity Commands

From repo root:

```bash
make lint
make test
make smoke-transport-wap
```
