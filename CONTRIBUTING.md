# Contributing

## Development setup

1. Clone repository and install required tools:
   - Docker + Docker Compose
   - Node 20+
   - Rust toolchain + wasm-pack (for `engine-wasm`)
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

## Pull request checklist

- [ ] Code builds/tests pass locally for touched components
- [ ] Docs updated for setup/contract changes
- [ ] No generated artifacts committed unless intentionally required
