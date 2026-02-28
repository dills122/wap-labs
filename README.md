# WAP Labs

WAP Labs contains two parallel tracks:

1. A legacy WAP 1.x test environment (Kannel + WML server + optional XP VM microbrowsers).
2. A modern WAP browser emulator build: WaveNav browser + Lowband transport + host harness.

## Start Here

- Legacy test environment guide: `docs/wap-test-environment/README.md`
- Browser emulator build guide: `docs/browser-emulator/README.md`
- Documentation index: `docs/README.md`

## Repo Map

- `docker/kannel/`: gateway image/config for local lab stack
- `wml-server/`: local WML demo server and emulator UI
- `transport-python/`: Lowband transport API contract and implementation area
- `engine-wasm/`: WaveNav Rust/WASM engine and host sample
- `browser/`: Waves Tauri desktop host integration area
- `marketing-site/`: Astro-based developer landing site (GitHub Pages root)
- `docs/`: architecture, spec mapping, and implementation plans

## Quick Commands

Legacy stack:

```bash
make up
make status
make smoke
```

WaveNav engine + quick host harness:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg

cd ../host-sample
pnpm install
pnpm run dev
```

All-in-one local host dev start (build wasm + run Vite):

```bash
make dev-wavenav-host
```

Marketing site local dev:

```bash
cd marketing-site
pnpm install
pnpm run dev
```

Make shortcuts:

```bash
make install-marketing-site
make dev-marketing-site
make build-marketing-site
make preview-pages-local
```

Local GitHub Pages-style preview (build + assemble only):

```bash
./scripts/preview-pages.sh --no-serve
```

Repo quality checks and hooks:

```bash
make ci-local
make hooks-install
ENABLE_NODE_CHECKS=1 make ci-local
```

Local hook behavior:

- commit: auto-formats Rust (`engine-wasm/engine`) and stages fixes
- push: runs strict pre-push checks

Node version note:

- Use Node `20.19+` or `22.12+` (`.nvmrc` pins a known-good version).

## GitHub Pages

- Deployment workflow: `.github/workflows/pages.yml`
- Trigger: pushes to `main` that modify `marketing-site/**` or `engine-wasm/host-sample/**`
- Published routes:
  - `/` -> marketing site
  - `/simulator/` -> host sample simulator

## Contributor Docs

- Contributor guide: `CONTRIBUTING.md`
- Codex steering: `AGENTS.md`
- Formatting conventions: `.editorconfig`

## License

MIT License. See `LICENSE`.
