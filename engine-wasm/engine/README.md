# wml_engine (Rust crate)

Core Rust crate for the WASM engine.

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

Run tests:

```bash
cargo test
```

Check compile only:

```bash
cargo check
```

## Output

`wasm-pack` writes browser-consumable artifacts to:

- `engine-wasm/pkg/`
