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
- Ordinary-browser Waves story entry backed by the real WaveNav WASM engine and deterministic
  canonical fixture fetching (`pnpm test:story:waves`)
- Browser-style shell UI (address bar + back/reload/go + viewport-first layout)
- Closed `WBP-00`/`WBP-01` baseline with a neutral 20-column Class C reference, reproducible
  startup/navigation/input measurements, stable complete keyboard order, and default/minimum-window
  evidence
- Responsive full-window shell plus gateway-aware startup status that names the probed URL and
  preserves network mode when the gateway cannot be verified
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
  - WBXML decode through Lowband's pinned built-in WML 1.3 decoder
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
- Rust-owned Tauri command descriptor: `browser/src-tauri/src/command_contract.rs`

`command_contract.rs` is the only command inventory. It expands into Rust invoke registration,
feeds Tauri's restricted app manifest, and generates the TypeScript client/facade metadata plus the
aggregate permission and capability configuration. Command functions remain explicit adapters in
`src-tauri/src/lib.rs`; runtime and transport behavior is not generated.

Regenerate every committed host contract artifact from Rust:

```bash
pnpm --dir browser run contracts:codegen
```

The command is self-sufficient on a clean checkout: it creates the minimal
`frontend/dist/index.html` required by Tauri's compile-time configuration when
no real frontend build exists. Use `pnpm --dir browser run contracts:check` to
regenerate the contracts and fail on committed drift.

## Tauri generated assets

Generation uses Node `22.22.1` from `.nvmrc`, pnpm `10.23.0` from the root `packageManager` field,
locked Rust dependencies from `browser/src-tauri/Cargo.lock`, and exactly `tauri-cli 2.10.0`.
`AUTO_INSTALL_RUST_TOOLS=1 ./scripts/init-refresh.sh` installs that CLI version when it is missing.

Tauri's four JSON schema outputs under `src-tauri/gen/schemas` are committed tool-owned files.
Their formats do not safely accept project provenance fields; provenance is therefore recorded
here. Regenerate and drift-check them with:

```bash
pnpm --dir browser run tauri:schemas
pnpm --dir browser run tauri:schemas:check
```

The check runs `cargo check --locked` and fails on any tracked schema drift. Dependency-driven
schema changes must be reviewed and committed with the corresponding `Cargo.lock` change. Tauri's
per-command expansions under `src-tauri/permissions/autogenerated` are intentionally ignored;
the committed generated aggregate `permissions/waves-host.toml` is the reviewable allowlist.

`src-tauri/icons/waves.svg` is the canonical icon. The five deterministic PNG/ICO derivatives are
committed and byte-checked; `icon.icns` is committed but only structurally validated because
`tauri-cli 2.10.0` does not produce stable ICNS bytes. Normal regeneration never replaces ICNS.
The generator uses a temporary output directory and copies only the allowlisted desktop assets, so
Tauri's extra mobile/Store outputs never enter the repository.

```bash
pnpm --dir browser run tauri:icons
pnpm --dir browser run tauri:icons:check
```

Use `pnpm --dir browser run tauri:icons:refresh-icns` only for an intentional, reviewed package
asset refresh. `src-tauri/icons/generated-assets.json` records provenance and policy. Run
`pnpm --dir browser run tauri:generated:check` for the combined command-contract, schema, and icon
generation gate.

## Transport runtime knobs

- `GATEWAY_HTTP_BASE` (default `http://localhost:13002`)
- `VITE_WAVES_DEFAULT_URL` (frontend startup URL, default `http://127.0.0.1:3000/`)
- Decoder backend: Lowband's built-in
  `lowband-wml13-wbxml/0.3.0` implementation with bounded output and parser
  depth. No external `wbxml2xml` installation or bundled sidecar is required.

## Next implementation slice

1. Continue with browser-owned `WBP-05` host accessibility using the safe seam in
   `docs/waves/WAVES_BROWSER_BASELINE.md`; `WBP-02`, `WBP-03`, and `WBP-04` landed in `#344`,
   `#346`, and `#347` without changing engine or transport contracts.
2. Keep one owner for root shell, global-style, copy, and generated example-manifest integration.
3. Keep `WBP-06` and later frame, input, transport lifecycle, persistence, and diagnostics work
   dependency-gated on their engine/transport contracts.
4. Defer `D0-01`, `W1-06`, and `M1-09` (`F0-F4` frame migration) until the
   upstream runtime boundary is stable enough not to churn the host contract.
5. Keep `M1-03` as non-priority generator follow-up.

## Planning + Traceability

- Desktop product and interaction design: `docs/waves/WAVES_DESKTOP_PRODUCT_DESIGN.md`
- Browser product implementation plan: `docs/waves/WAVES_BROWSER_PRODUCT_IMPLEMENTATION_PLAN.md`
- WBP-00/WBP-01 decisions, measurements, and integration seams: `docs/waves/WAVES_BROWSER_BASELINE.md`
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
- [x] Decompose browser high-churn files into boundary modules (`M1-08`)
- [x] Wire cache/reload and request-policy metadata from runtime to transport flow (`T0-04`)
- [x] Wire profile-gated UA capability header controls in host flow (`T0-05`)
- [x] Land browser responsiveness and UI-blocking remediation for startup/navigation/fetch hot paths (`A5-07`, `#109`, `#110`)
- [x] Make the shell fill the available window and report gateway probe URL/failure details without disabling network mode (`#333`)
- [x] Land active payload-size guardrails across transport/engine/browser boundaries (`M1-16`)
