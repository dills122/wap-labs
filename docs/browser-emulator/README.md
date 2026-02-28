# WaveNav Browser Build (In Progress)

This track builds WaveNav, a modern WAP 1.x browser emulator with a real protocol boundary and a spec-driven runtime.

## Goal

Build a faithful WAP-style browser stack that:

- fetches content through a transport boundary
- runs a WML runtime in Rust/WASM
- renders deterministic draw commands in a host UI

## Current Architecture

- Transport/API boundary (Lowband): `transport-python/`
- Runtime engine (WaveNav): `engine-wasm/`
- Host harness (quick test): `engine-wasm/host-sample/`
- Desktop host target: `electron-app/`

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

- `docs/source-material/sub-set/`

## Build and Run (Current)

Build WASM package:

```bash
cd engine-wasm/engine
wasm-pack build --target web --out-dir ../pkg
```

Run browser harness (no Electron):

```bash
cd engine-wasm/host-sample
npm install
npm run dev
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
