# wavenav_engine (Rust crate)

Core Rust crate for the WaveNav runtime with native and WASM targets.

## Prerequisites

- `rustc`
- `cargo`
- `wasm-pack`

## Commands

Run from `engine-wasm/engine`.

Build wasm package:

```bash
wasm-pack build --target web --out-dir ../pkg
```

Check native + wasm targets:

```bash
cargo check
cargo check --target wasm32-unknown-unknown
```

Run tests:

```bash
cargo test
```

Run clippy:

```bash
cargo clippy --all-targets --all-features -- -D warnings
```

Generate rustdoc API docs:

```bash
cargo doc --no-deps --open
```

Run coverage summary (optional):

```bash
# install once:
cargo install cargo-llvm-cov

# from repo root:
make coverage-rust
```

Check compile only:

```bash
cargo check
```

## Output

`wasm-pack` writes browser-consumable artifacts to:

- `engine-wasm/pkg/`
