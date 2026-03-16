# browser (Waves Tauri Host)

This directory is the desktop host app for Waves, implemented as a Tauri (Rust) app.

## Current status

Implemented now:

- Tauri Rust shell scaffold under `src-tauri/`
- Host-side transport contract in `contracts/transport.ts`
- Host-side native engine contract in `contracts/engine.ts`
- Rust-sourced engine host contract generation:
  - generator: `src-tauri/src/bin/generate_contracts.rs`
  - output: `contracts/generated/engine-host.ts`
- Rust-sourced transport host contract generation:
  - generator: `src-tauri/src/bin/generate_contracts.rs`
  - output: `contracts/generated/transport-host.ts`
- AST-sourced typed Tauri invoke client generation:
  - generator: `scripts/generate-contract-wrappers.mjs`
  - output: `contracts/generated/tauri-host-client.ts`
- Frontend basic smoke harness under `frontend/` (load/render/key loop)
- Browser-style shell UI (address bar + back/reload/go + viewport-first layout)
- App identity baseline (`Waves Browser` title/product metadata and bundled icon set)
- Native app menu baseline with About metadata (`WAP/WML based browser 1.x`)
- Help menu placeholder for updates (`Check for Updates (Coming Soon)`)
- Update hook baseline: menu event emits `waves://updater/check-requested` for future updater wiring
- Shared constants baseline:
  - frontend runtime + copy: `frontend/src/app/waves-config.ts`, `frontend/src/app/waves-copy.ts`
  - tauri app/menu/event constants: `src-tauri/src/waves_config.rs`
- I18n prep baseline:
  - frontend user-facing strings route through `frontend/src/app/waves-copy.ts`
- Transport-first URL navigation flow (`fetch_deck` -> `engine_load_deck_context` -> render)
- Deterministic host session state model (`idle/loading/loaded/error`)
- External intent follow loop (`externalNavigationIntent` -> host fetch/load cycle)
- Debug-only raw WML paste path (`Load Raw WML (Debug)` under debug section)
- Collapsed developer tools drawer (toggle with `Ctrl+Shift+D`) for session/transport/snapshot/timeline panels
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
  - per-request correlation ID plumbing and structured request lifecycle logs
  - retry/timeout and error taxonomy mapping
  - WBXML decode using `wbxml2xml` utility
  - startup preflight for decoder availability

Not implemented yet:

- Full browser chrome (address bar/history panes/history/devtools)
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
- Rust (`ts-rs`) + AST-generated host engine contract: `browser/contracts/generated/engine-host.ts`
- Rust (`ts-rs`) + AST-generated host transport contract: `browser/contracts/generated/transport-host.ts`
- AST-generated typed Tauri client: `browser/contracts/generated/tauri-host-client.ts`

Regenerate host contract types from Rust:

```bash
pnpm --dir browser run contracts:codegen
```

Regenerate Tauri app icons from canonical SVG source:

```bash
pnpm --dir browser run tauri:icons
```

## Transport runtime knobs

- `GATEWAY_HTTP_BASE` (default `http://localhost:13002`)
- `VITE_WAVES_DEFAULT_URL` (frontend startup URL, default `http://127.0.0.1:3000/`)
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

1. Execute the current host-impacting runtime fidelity lane:
- `W0-05` timer/dialog integration baseline
- `D0-01` debug connector contract/architecture baseline
2. Keep `W1-06` next after the current runtime/debug lane is stable.
3. Keep `M1-08` residual cleanup opportunistic only; do not preempt active runtime tickets with broad browser reshaping.
4. Defer `M1-09` (`F0-F4` frame migration) until the current runtime/debug boundary work is stable enough not to churn the host contract again.
5. Keep `M1-03` as non-priority generator follow-up.

## Planning + Traceability

- Work board: `docs/waves/WORK_ITEMS.md` (Phases `B*`, `T*`, `W*`)
- User onboarding/help plan: `docs/waves/USER_ONBOARDING_EXPERIENCE_PLAN.md`
- Contract mapping: `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- Test coverage matrix: `docs/waves/SPEC_TEST_COVERAGE.md`
- Browser architecture baseline: `docs/waves/TECHNICAL_ARCHITECTURE.md`

## Current checklist (planning)

- [x] Freeze Tauri command and TypeScript contract parity
- [x] Add deterministic URL load and runtime status model
- [x] Implement transport fetch -> engine loadDeckContext handoff
- [x] Add integration fixtures for load/nav/external-intent loops
- [x] Add event timeline export parity and chronology validation checks
- [x] Ship browser-style shell with hidden developer drawer
- [x] Add global keyboard navigation when not in text-entry fields
- [x] Add hybrid back behavior (engine card-history + host URL fallback)
- [x] Remove frontend contract type duplication and import shared engine/transport contracts directly (`M1-01`)
- [x] Add browser-side automated regression checks for navigation state machine (`M1-05`)
- [ ] Decompose browser high-churn files into boundary modules (`M1-08`, baseline landed; residual cleanup remains opportunistic)
- [x] Wire cache/reload and request-policy metadata from runtime to transport flow (`T0-04`)
- [x] Wire profile-gated UA capability header controls in host flow (`T0-05`)
- [x] Land browser responsiveness and UI-blocking remediation for startup/navigation/fetch hot paths (`A5-07`, `#109`, `#110`)
- [x] Land active payload-size guardrails across transport/engine/browser boundaries (`M1-16`)
