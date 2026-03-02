# Waves Browser Build (In Progress)

This track builds Waves, a modern WAP 1.x browser emulator with a real protocol boundary and a spec-driven runtime.

## Goal

Build a faithful WAP-style browser stack that:

- fetches content through a transport boundary
- runs a WML runtime in Rust/WASM
- renders deterministic draw commands in a host UI

## Current Architecture

- Transport/API boundary (Lowband, in-process library): `transport-rust/`
- Runtime engine (WaveNav): `engine-wasm/`
- Host harness (quick test): `engine-wasm/host-sample/`
- Desktop host target (Tauri shell): `browser/`

Reference architecture doc:

- `docs/modern-wap-browser-architecture.md`

## WaveNav Engine Plan (Spec-driven)

Primary engine docs:

- `docs/wml-engine/README.md`
- `docs/wml-engine/source-material-review.md`
- `docs/wml-engine/requirements-matrix.md`
- `docs/wml-engine/architecture.md`
- `docs/wml-engine/ticket-plan.md`
- `docs/wml-engine/test-strategy.md`

Historical draft references are intentionally non-authoritative and should not be used as the implementation source of truth.

These are based on locally reviewed source material in:

- `docs/source-material/` (canonical root set; see `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`)
- `docs/waves/*TRACEABILITY*.md` and related review docs

## Build and Run (Current)

Build WASM package:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
```

Run browser harness (no desktop shell):

```bash
cd engine-wasm/host-sample
pnpm install
pnpm run dev
```

## What Is In Scope Right Now

- WML deck/card parsing and rendering MVP
- Deterministic focus + fragment navigation (`#cardId`)
- Stable boundary contract (`loadDeckContext` metadata-aware input)

## Deferred for Later Phases

- Full task/event/timer semantics
- Variable substitution completeness
- Form submission pipeline
- WMLScript and advanced styling/transforms

## Planning Sync Docs

- `docs/waves/WORK_ITEMS.md`
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
