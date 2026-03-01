# browser (Waves Tauri Host)

This directory is the desktop host app for Waves, implemented as a Tauri (Rust) app.

## Current status

Implemented now:

- Tauri Rust shell scaffold under `src-tauri/`
- Host-side transport contract in `contracts/transport.ts`
- Host-side native engine contract in `contracts/engine.ts`
- Frontend basic smoke harness under `frontend/` (load/render/key loop)
- Native engine harness commands in `src-tauri/src/lib.rs`:
  - `engine_load_deck`
  - `engine_load_deck_context`
  - `engine_render`
  - `engine_handle_key`
  - `engine_navigate_to_card`
  - `engine_navigate_back`
  - `engine_set_viewport_cols`
  - `engine_snapshot`
  - `engine_clear_external_navigation_intent`
- In-process Rust transport library under `../transport-rust/`:
  - `http://`/`https://` fetch
  - `wap://`/`waps://` gateway bridge mapping
  - retry/timeout and error taxonomy mapping
  - WBXML decode using `wbxml2xml` utility
  - startup preflight for decoder availability

Not implemented yet:

- Full browser chrome (address bar/history panes/history/devtools)
- End-to-end UI fetch -> transport fetch -> engine load flow
- Production packaging/signing

## Direction

The desktop host will be a WAP-only browser shell:

1. UI triggers fetch/navigation intents.
2. Tauri command layer calls in-process Rust transport functions.
3. Returned WML + metadata are passed to `engine-wasm` runtime.
4. Runtime render output is drawn in host viewport.

## Contracts

- Desktop/transport contract: `browser/contracts/transport.ts`
- Engine contract: `engine-wasm/contracts/wml-engine.ts`

## Transport runtime knobs

- `GATEWAY_HTTP_BASE` (default `http://127.0.0.1:13002`)
- Decoder backend order:
  - preferred: in-process `libwbxml` shared library
  - fallback: `wbxml2xml` CLI
- `WBXML2XML_BIN` (optional explicit path to `wbxml2xml` fallback binary)
- `LOWBAND_DISABLE_LIBWBXML=1` (debug/testing: force CLI fallback path)

## Bundled WBXML decoder

You can bundle `wbxml2xml` as a Tauri resource:

- `src-tauri/resources/wbxml/macos/wbxml2xml`
- `src-tauri/resources/wbxml/linux/wbxml2xml`
- `src-tauri/resources/wbxml/windows/wbxml2xml.exe`

When present, startup sets `WBXML2XML_BIN` to the bundled binary automatically.

## Next implementation slice

1. Connect frontend URL flow to `fetch_deck` + `engine_load_deck_context`.
2. Expand frontend harness into browser chrome and URL navigation UX.
3. Add fixture-driven integration checks for load/render/nav parity.

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
