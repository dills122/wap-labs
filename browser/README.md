# browser (Waves Tauri Host Skeleton)

This directory is the desktop host app for Waves, implemented as a Tauri (Rust) app.

## Current status

This is an architecture + skeleton scaffold only.

Implemented now:

- Tauri Rust shell scaffold under `src-tauri/`
- Host-side transport contract in `contracts/transport.ts`
- Frontend shell placeholder under `frontend/`

Not implemented yet:

- Full browser chrome (address bar/history panes/devtools)
- End-to-end deck fetch/render loop in Tauri commands
- Python transport service lifecycle management
- Production packaging/signing

## Direction

The desktop host will be a WAP-only browser shell:

1. UI triggers fetch/navigation intents.
2. Tauri command layer calls `transport-python` HTTP API.
3. Returned WML + metadata are passed to `engine-wasm` runtime.
4. Runtime render output is drawn in host viewport.

The Python transport layer remains mandatory for now (no WSP/WBXML rewrite in Rust at this stage).

## Contracts

- Desktop/transport contract: `browser/contracts/transport.ts`
- Engine contract: `engine-wasm/contracts/wml-engine.ts`

## Next implementation slice

1. Wire a minimal Tauri command (`fetch_deck`) to the Python service.
2. Add a basic frontend route that loads a URL and displays status/errors.
3. Connect loaded WML into the existing engine host rendering loop.

## Planning + Traceability

- Work board: `docs/waves/WORK_ITEMS.md` (Phases `B*`, `T*`, `W*`)
- Contract mapping: `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- Test coverage matrix: `docs/waves/SPEC_TEST_COVERAGE.md`
- Browser architecture baseline: `docs/waves/TECHNICAL_ARCHITECTURE.md`

## Current checklist (planning)

- [ ] Freeze Tauri command and TypeScript contract parity
- [ ] Add deterministic URL load and runtime status model
- [ ] Implement transport fetch -> engine loadDeckContext handoff
- [ ] Add integration fixtures for load/nav/external-intent loops
