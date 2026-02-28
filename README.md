# WAP Labs

WAP Labs contains two parallel tracks:

1. A legacy WAP 1.x test environment (Kannel + WML server + optional XP VM microbrowsers).
2. A modern WAP browser emulator build (transport service + Rust/WASM WML engine + host harness).

## Start Here

- Legacy test environment guide: `docs/wap-test-environment/README.md`
- Browser emulator build guide: `docs/browser-emulator/README.md`
- Documentation index: `docs/README.md`

## Repo Map

- `docker/kannel/`: gateway image/config for local lab stack
- `wml-server/`: local WML demo server and emulator UI
- `transport-python/`: transport API contract and implementation area
- `engine-wasm/`: Rust/WASM WML engine and host sample
- `electron-app/`: desktop host integration area
- `docs/`: architecture, spec mapping, and implementation plans

## Quick Commands

Legacy stack:

```bash
make up
make status
make smoke
```

WASM engine + quick host harness:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg

cd ../host-sample
npm install
npm run dev
```

Repo quality checks and hooks:

```bash
make ci-local
make hooks-install
ENABLE_NODE_CHECKS=1 make ci-local
```

Node version note:

- Use Node `20.19+` or `22.12+` (`.nvmrc` pins a known-good version).

## Contributor Docs

- Contributor guide: `CONTRIBUTING.md`
- Codex steering: `AGENTS.md`
- Formatting conventions: `.editorconfig`

## License

MIT License. See `LICENSE`.
