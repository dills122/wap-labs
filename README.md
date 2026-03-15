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
- Engine phase roadmap (`A-D`): `docs/wml-engine/ticket-plan.md`
- Transport phase roadmap (`A-D`): `docs/waves/TRANSPORT_RUST_PHASE_PLAN.md`
- Frame-interface migration plan: `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`
- Frame-interface phase board (`F0-F4`): `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`
- Development prerequisites + bootstrap: `docs/development-prerequisites.md`
- Documentation index: `docs/README.md`

Secondary docs:

- Legacy test environment guide: `docs/wap-test-environment/README.md`
- Browser emulator quickstart: `docs/browser-emulator/README.md`
- Spec-processing subproject: `spec-processing/README.md`

## Progress Snapshot

Status source: `docs/waves/WORK_ITEMS.md`, `docs/waves/MAINTENANCE_WORK_ITEMS.md`, `docs/wml-engine/work-items.md`, `.github/workflows/engine-fuzz.yml` (updated 2026-03-15).

| Track | Implemented | Roadmap / In Progress |
|---|---|---|
| Waves desktop app (`browser/`) | Desktop shell is usable end-to-end: network/local mode, runtime deck navigation, focused text/select editing, browser back/reload flow, debug/timeline surfaces, and reduced UI blocking on failed/slow network paths | History/session fidelity follow-up, timer/dialog runtime completion, and debug connector contract work |
| WaveNav runtime (`engine-wasm/`) | Runtime covers deck/card parsing, navigation, focus, text-input editing, select interaction, deterministic render output, and native/wasm parity-critical behavior | History fidelity, timer/dialog semantics, and deeper spec-conformance follow-ups |
| Lowband transport (`transport-rust/`) | Native/browser fetch pipeline is stable with request-policy controls, explicit payload guardrails, and real Kannel-backed smoke coverage | Additional conformance fixtures, remaining high-value cleanup, and future protocol breadth only when it serves active priorities |
| Frame-based render/input migration | Additive frame-oriented host commands are already in place for the hot browser paths | Finish the deliberate `M1-09` migration only after the current runtime/debug boundary work settles |
| Fuzz hardening (`engine-wasm/engine/fuzz`) | Cargo-fuzz scaffold with `engine_wml_fuzzer`, starter corpus seeds, and scheduled weekly CI run | Add target coverage for transport/protocol surfaces, grow dictionaries/corpus, and tune campaign budgets |
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
cd engine-wasm/engine && cargo +nightly fuzz run engine_wml_fuzzer -- -runs=200
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

`make smoke-transport-wap` is the local Kannel/browser transport smoke entrypoint for the active native/browser validation lane; check `docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md` for current posture and evidence.

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
