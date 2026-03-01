# browser (Waves Tauri Host Skeleton)

This directory is the desktop host app for Waves, implemented as a Tauri (Rust) app.

## Current status

This is an architecture + skeleton scaffold only.

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
- Transport sidecar boot management in `src-tauri/src/lib.rs`:
  - auto-starts `transport-python/service.py` on app setup
  - waits for `/health` before app run proceeds
  - shuts down child process on app exit

Not implemented yet:

- Full browser chrome (address bar/history panes/history/devtools)
- End-to-end UI fetch -> transport fetch -> engine load flow
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

## Transport sidecar runtime knobs

- `TRANSPORT_API_BASE` (default `http://127.0.0.1:8765`)
- `TRANSPORT_SIDECAR_AUTOSTART` (default `1`; set `0` to disable auto-start)
- `TRANSPORT_SIDECAR_AUTO_PROVISION` (default `1`; set `0` to disable venv/pip bootstrap)
- `TRANSPORT_SERVICE_PATH` (optional absolute path to `service.py`)
- `PYTHON_BIN` (optional explicit runtime python; when unset Waves prefers `transport-python/.venv/bin/python`)
- `PYTHON_BOOTSTRAP_BIN` (default `python3`; used to create `.venv` when missing)

On first boot, Waves will provision `transport-python/.venv` and install `requirements.txt`
automatically if transport dependencies are not yet present.

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
