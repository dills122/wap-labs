# WAP Labs

WAP Labs is focused on building a modern, deterministic WAP browser stack:

- `browser/`: Waves desktop host (Tauri frontend + native command bridge)
- `engine-wasm/`: WaveNav runtime engine (Rust core with wasm + native targets)
- `transport-rust/`: Lowband transport and WAP/WML handoff pipeline

The Kannel interoperability stack (`gateway-kannel/`, `docker/kannel/`, `wml-server/`) also
provides the local foundation for the planned desktop-only public WAP lab. It is not embedded in
the desktop application or connected to the browser-hosted WASM simulator.

![Waves rendering a WML page with selectable links](images/waves-network-page-with-links.png)

## Start Here

- Browser/engine architecture and roadmap: `docs/waves/TECHNICAL_ARCHITECTURE.md`
- Browser integration work board: `docs/waves/WORK_ITEMS.md`
- Maintenance and tech debt board: `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- Engine implementation board: `docs/wml-engine/work-items.md`
- Engine phase roadmap (`A-D`): `docs/wml-engine/ticket-plan.md`
- Transport phase roadmap (`A-D`): `docs/waves/TRANSPORT_RUST_PHASE_PLAN.md`
- Frame-interface migration plan: `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`
- Frame-interface phase board (`F0-F4`): `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`
- Project Atlas (generated planning/compliance portal): `docs-portal/README.md`
- Code-generation audit and target standard: `docs/architecture/code-generation-audit.md`
- WAP 1.2.1 compliance program: `docs/waves/WAP_1_2_1_COMPLIANCE_PROGRAM.md`
- Development prerequisites + bootstrap: `docs/development-prerequisites.md`
- Documentation index: `docs/README.md`

Secondary docs:

- Usability and graceful-failure backlog: `docs/waves/USABILITY_RESILIENCE_BACKLOG.md`
- Legacy test environment guide: `docs/wap-test-environment/README.md`
- Browser emulator quickstart: `docs/browser-emulator/README.md`
- Spec-processing subproject: `spec-processing/README.md`

## Progress Snapshot

Status source: `docs/waves/wap-1.2.1-compliance-program.json`,
`docs/waves/WORK_ITEMS.md`, `docs/waves/MAINTENANCE_WORK_ITEMS.md`,
`docs/wml-engine/work-items.md`, and `.github/workflows/engine-fuzz.yml`
(updated 2026-07-26).

| Track | Implemented | Roadmap / In Progress |
|---|---|---|
| Waves desktop app (`browser/`) | Desktop shell is usable end-to-end, and `WBP-00` through additive `WBP-05A` are complete with responsive navigation, host accessibility, and rendered evidence | Keep `WBP-06` inactive until a separately authorized F0 contract task begins; the completed `D0-01` baseline has settled its contract gate |
| WaveNav runtime (`engine-wasm/`) | Runtime covers deck/head/access/meta parsing, navigation, focus, input/select semantics, deterministic render output, native/WASM parity checks, the completed WML-2 parser/validation baseline, completed WML-302 variable/substitution, WML-303 action/event/BACK, and WML-305 timer evidence, plus WML-301's implemented context/history subset | Preserve completed evidence and advance WML-304 through a graph-first request-intent boundary without moving fetch behavior into the engine |
| Lowband transport (`transport-rust/`) | The selected WDP path is 9/9 rows implemented, the strict CDPD/IPv4 WCMP profile is 2/2 rows implemented through ICMPv4, TRN-702 constraints and the schema-v2 TRN-706 WDP replay boundary are direct-fixture-backed, TRN-707 records the successor delta, the pinned WBXML decoder has all 47 selected client clauses implemented, and the WDP delivery fixture now feeds native WML-203 parity evidence | Preserve the strict connectionless evidence; activate general WCMP only for explicit non-IP bearers and WTP only with connection-oriented WSP |
| WAP evidence program | 40/198 selected parent rows are implemented and 287/762 clauses are directly assessed; Atlas renders the canonical program and active documents | 70 partial and 88 missing parents remain, so the project stays explicitly pre-conformance |
| Frame-based render/input migration | Additive frame-oriented host commands are already in place for the hot browser paths | Finish the deliberate `M1-09` migration only after the current runtime/debug boundary work settles |
| Fuzz hardening (`engine-wasm/engine/fuzz`) | Cargo-fuzz scaffold with `engine_wml_fuzzer`, starter corpus seeds, and scheduled weekly CI run | Add target coverage for transport/protocol surfaces, grow dictionaries/corpus, and tune campaign budgets |
| WAP lab stack (`gateway-kannel/`, `wml-server/`) | Local Kannel smoke and the bounded, standard-library Go WML origin are available with deterministic route/session tests | Production Kannel hardening, OpenTofu infrastructure, external probes, and public exposure remain separate gated work |

## Repo Map (Product-First)

- `browser/`: Waves desktop host product surface (frontend + Tauri integration)
- `engine-wasm/`: Runtime engine, wasm bindings, and host sample harness
- `transport-rust/`: In-process transport library and contract handoff
- `docs/`: architecture, contracts, traceability, and work boards
- `gateway-kannel/`, `docker/kannel/`: legacy gateway test environment
- `wml-server/`: bounded Go WML origin and deterministic lab fixtures
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
pnpm verify:fast
pnpm verify
pnpm verify:full
# requires an already-running local Kannel/WML stack:
pnpm verify:extended
make lint-rust-transport
make test-rust-transport
pnpm test:story all
pnpm wap-graph:check
pnpm --dir docs-portal run check
pnpm --dir docs-portal run build
cd engine-wasm/engine && cargo +nightly fuzz run engine_wml_fuzzer -- -runs=200
```

## Quick Commands (Local Kannel/WML Lab)

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
make verify-fast
make verify-change
make verify-full
make lint-rust-transport
make test-rust-transport
make coverage-rust-transport
make hooks-install
```

`make ci-local` remains a deprecated compatibility alias for `make verify-full` and prints an
advisory because local verification cannot reproduce GitHub-hosted CI, security, coverage, or OS
packaging exactly. See [Local Verification Contract](docs/ci/LOCAL_VERIFICATION.md) for profile
selection, outcome labels, prerequisites, and intentionally external lanes.

Bootstrap/refresh local tool and dependency setup:

```bash
./scripts/init-refresh.sh
```

### Local AI context

Repo-specific instructions and the existing WAP-focused Codex skills stay checked in. Reusable
skills and shared steering are linked from the sibling `ai-central` checkout and are ignored by
Git:

```bash
pnpm codex:links
```

The script expects AI Central at `../ai-central` by default. Set `AI_CENTRAL_HOME` to either the
AI Central repository or its `templates` directory when the checkout lives elsewhere. Use
`pnpm codex:links -- --dry-run` to preview the links.

Local hook behavior:

- commit: runs `lint-staged` on staged files only (Prettier + rustfmt)
- push: runs strict pre-push checks

Node version note:

- Use Node `20.19+` or `22.12+` (`.nvmrc` pins a known-good version).

## GitHub Pages

- Deployment workflow: `.github/workflows/pages.yml`
- Trigger: pushes to `main` that modify the marketing site, simulator, Atlas,
  active docs/manifests, workspace locks, or the Pages workflow
- Published routes:
  - `/` -> marketing site
  - `/simulator/` -> host sample simulator
  - `/atlas/` -> canonical project Atlas

## Contributor Docs

- Contributor guide: `CONTRIBUTING.md`
- Codex steering: `AGENTS.md`
- Formatting conventions: `.editorconfig`
- Attribution: `AUTHORS.md`
- Notices: `NOTICE.md`

## License

MIT License. See `LICENSE`.
