# WAP Labs

WAP Labs is focused on building a modern, deterministic WAP browser stack:

- `browser/`: Waves desktop host (Tauri frontend + native command bridge)
- `engine-wasm/`: WaveNav runtime engine (Rust core with wasm + native targets)
- `transport-rust/`: Lowband transport and WAP/WML handoff pipeline

The legacy/demo stack still exists for compatibility testing (`gateway-kannel/`, `wml-server/`), but it is no longer the primary product focus.

## Start Here

- Browser/engine architecture and roadmap: `docs/waves/TECHNICAL_ARCHITECTURE.md`
- Browser integration work board: `docs/waves/WORK_ITEMS.md`
- Maintenance and tech debt board: `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- Engine implementation board: `docs/wml-engine/work-items.md`
- Frame-interface migration plan: `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`
- Development prerequisites + bootstrap: `docs/development-prerequisites.md`
- Documentation index: `docs/README.md`

Secondary docs:

- Legacy test environment guide: `docs/wap-test-environment/README.md`
- Browser emulator quickstart: `docs/browser-emulator/README.md`
- Spec-processing subproject: `spec-processing/README.md`

## Progress Snapshot

Status source: `docs/waves/WORK_ITEMS.md`, `docs/waves/MAINTENANCE_WORK_ITEMS.md`, `docs/wml-engine/work-items.md` (updated 2026-03-03).

| Track | Implemented | Roadmap / In Progress |
|---|---|---|
| Waves desktop app (`browser/`) | Core browser shell works: load pages, move around cards, follow links, go back, and inspect runtime state | Better release safety checks, cleaner internal structure, and finishing request/network policy behavior |
| WaveNav runtime (`engine-wasm/`) | MVP runtime is in place: parse WML, navigate cards, manage focus, and render stable output | Broader parity coverage, parser hardening, and follow-up behavior work for deeper spec correctness |
| Lowband transport (`transport-rust/`) | Stable fetch + normalization baseline with clear error categories | More modular internals, stronger CI checks, and additional conformance scenarios |
| Frame-based render/input migration | Migration plan and phased work tickets are defined | Move hosts to a shared frame/input boundary and retire legacy render/input paths |
| Legacy/demo stack (`gateway-kannel/`, `wml-server/`) | Still available for compatibility smoke checks | Maintenance only; not the main build track |

## Repo Map (Product-First)

- `browser/`: Waves desktop host product surface (frontend + Tauri integration)
- `engine-wasm/`: Runtime engine, wasm bindings, and host sample harness
- `transport-rust/`: In-process transport library and contract handoff
- `docs/`: architecture, contracts, traceability, and work boards
- `gateway-kannel/`, `docker/kannel/`: legacy gateway test environment
- `wml-server/`: local demo/fixture WML server
- `marketing-site/`: project site and hosted simulator entrypoint
- `spec-processing/`: canonical source-spec processing and provenance

## Quick Commands (Browser/Engine)

Bootstrap:

```bash
./scripts/init-refresh.sh
```

Run browser frontend shell:

```bash
pnpm --dir browser run dev
```

Run desktop Tauri host:

```bash
pnpm --dir browser run tauri:dev
```

Run engine host-sample harness:

```bash
make dev-wavenav-host
```

Build engine wasm package directly:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
```

Quality checks:

```bash
make ci-local
make lint-rust-transport
make test-rust-transport
```

## Quick Commands (Legacy/Compatibility)

Legacy stack:

```bash
make up
make status
make smoke
make smoke-transport-wap
# optional direct gateway override:
# GATEWAY_HTTP_BASE=http://localhost:13002 make smoke-transport-wap
```

`make smoke-transport-wap` defaults to `GATEWAY_HTTP_BASE=http://localhost:3000/gateway` so host-side smoke remains stable while still exercising Kannel through the existing proxy path.

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
make lint-rust-transport
make test-rust-transport
make coverage-rust-transport
make hooks-install
ENABLE_NODE_CHECKS=1 make ci-local
```

Bootstrap/refresh local tool and dependency setup:

```bash
./scripts/init-refresh.sh
```

Local hook behavior:

- commit: runs `lint-staged` on staged files only (Prettier + rustfmt)
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
- Attribution: `AUTHORS.md`
- Notices: `NOTICE.md`

## License

MIT License. See `LICENSE`.
