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

## CI Parity Commands

From repo root:

```bash
make lint
make test
make smoke-transport-wap
```
