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
- Canonical engine-owned WBP-06 presentation frame and typed input projection, with completed F1
  Canvas publication and F2-01 engine-resolved click/hit-region input while legacy wrappers remain
  available for the declared later cutover
- Rust-sourced transport host contract generation:
  - generator: `src-tauri/src/bin/generate_contracts.rs`
  - output: `contracts/generated/transport-host.ts`
- AST-sourced typed Tauri invoke client generation:
  - generator: `scripts/generate-contract-wrappers.mjs`
  - output: `contracts/generated/tauri-host-client.ts`
- Rust-sourced host ingress limits and typed command errors:
  - source: `src-tauri/src/host_contract.rs`
  - output: `contracts/generated/host.ts`
- Frontend basic smoke harness under `frontend/` (load/render/key loop)
- Ordinary-browser Waves story entry backed by the real WaveNav WASM engine and deterministic
  canonical fixture fetching (`pnpm test:story:waves`)
- Browser-style shell UI (address bar + back/reload/go + viewport-first layout)
- Closed `WBP-00`/`WBP-01` baseline with a neutral 20-column Class C reference, reproducible
  startup/navigation/input measurements, stable complete keyboard order, and default/minimum-window
  evidence
- Closed `WBP-02` through `WBP-05A` browser foundation with the reference-handset scaffold,
  source/route/profile toolbar separation, ordinary-path Welcome/Help tutorial, and host-chrome
  accessibility baseline plus single-channel announcements and rendered 200 percent evidence
- Closed additive `WBP-02A` native-host-chrome default without changing the neutral Class C
  handset, engine viewport semantics, element IDs, or keyboard order
- Responsive full-window shell plus gateway-aware startup status that names the probed URL and
  preserves network mode when the gateway cannot be verified
- App identity baseline (`Waves Browser` title/product metadata and bundled icon set)
- Native app menu baseline with About metadata (`WAP/WML based browser 1.x`)
- Rust-owned application command registry with generated TypeScript metadata, enabled-state
  projection, native menu routing, platform shortcuts, and registry-derived shortcut help
- Integrated keyboard-accessible Library for bundled examples and safe Favorites, including
  add/open/remove plus sanitized import/export; unpublished Services remain visibly disabled
- Integrated Preferences for launch behavior, display scale, accessibility, safe restore,
  developer mode, and bounded timeline retention, with explicit settings-only and full-data reset
- Enabled native entries and shared frontend command routing for Library, Favorites import/export,
  Preferences, and add favorite; the unrelated update placeholder remains disabled
- Shared constants baseline:
  - frontend runtime + copy: `frontend/src/app/waves-config.ts`, `frontend/src/app/waves-copy.ts`
  - tauri app/menu/event constants: `src-tauri/src/waves_config.rs`
- I18n prep baseline:
  - frontend user-facing strings route through `frontend/src/app/waves-copy.ts`
- Transport-first URL navigation flow (`fetch_deck` -> `engine_load_deck_context` -> render)
- Deterministic host session state model (`idle/loading/loaded/error`)
- Phase-aware network lifecycle presentation (`Preparing`, `Connecting`, route-supported `Gateway`,
  `Decode`, `Deck`, and `Card`) with correlation IDs and categorized recovery actions
- Go/Stop reflects actual cancellability; failed navigation preserves the previous committed frame
  and offers exact-request Retry, Change route, Details, and Return without engine-authored error UI
- External intent follow loop (`externalNavigationIntent` -> host fetch/load cycle)
- Generation-scoped navigation coordination prevents overlapping startup, timer, and user loads
  from committing stale engine, history, status, or persistence state
- Debug-only raw WML paste path (`Load Raw WML (Debug)` under debug section)
- Collapsed developer tools drawer routed through the shared Inspector command for
  session/transport/snapshot/timeline panels
- Native engine harness commands in `src-tauri/src/lib.rs`:
  - `engine_load_deck`
  - `engine_load_deck_context`
  - `engine_render`
  - `engine_handle_key`
  - `engine_handle_input_frame`
  - `engine_navigate_to_card`
  - `engine_navigate_back`
  - `engine_set_viewport_cols`
  - `engine_snapshot`
  - `engine_clear_external_navigation_intent`
- Default-disabled D0-03 engine debug session bridge with generated open/poll/snapshot/close Tauri
  commands, one process-local session, engine-owned bounded recording, and typed sanitized outcomes
- Optional D0-04 Engine Inspector with visibility-aware polling, bounded filters/retention/snapshot
  presentation, cursor-gap accounting, and a versioned 256 KiB allowlisted capture artifact
- In-process Rust transport library under `../transport-rust/`:
  - `http://`/`https://` fetch
  - `wap://`/`waps://` gateway bridge mapping
  - per-request correlation ID plumbing and structured request lifecycle logs
  - retry/timeout and error taxonomy mapping
  - WBXML decode through Lowband's pinned built-in WML 1.3 decoder
  - startup preflight for decoder availability

Not implemented yet:

- Remaining F3/F4 internal split and legacy-path removal; deterministic engine-owned scrolling and
  primary keyboard/control-button routing through the unified typed input path are complete
- Safe session persistence and crash recovery (`WBP-12`)
- Production packaging/signing/notarization

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
- Rust (`ts-rs`) + AST-generated host error contract: `browser/contracts/generated/host.ts`
- AST-generated typed Tauri client: `browser/contracts/generated/tauri-host-client.ts`
- Rust-owned Tauri command descriptor: `browser/src-tauri/src/command_contract.rs`
- Rust-owned application command registry:
  `browser/src-tauri/src/application_commands.rs` ->
  `browser/contracts/generated/application-commands.ts`

`command_contract.rs` is the only Tauri invoke command inventory. It expands into Rust invoke registration,
feeds Tauri's restricted app manifest, and generates the TypeScript client/facade metadata plus the
aggregate permission and capability configuration. Command functions remain explicit adapters in
`src-tauri/src/lib.rs`; runtime and transport behavior is not generated.

The host rejects oversized IPC input before task admission, transport execution, or engine locking.
The generated `HOST_INGRESS_LIMITS` projection publishes byte limits for correlation IDs (128), card
IDs (256), edit drafts (65,536), context URLs (4,096), and deck content types (1,024). Command
rejections use the generated `HostCommandError` envelope. Its codes keep invalid input,
cancellation, task admission and join failures, unavailable engine state, engine resource limits,
engine failures, opaque host failures, and malformed responses distinguishable without including
the rejected values. The frontend invoke guard derives runtime response validators from the same
Rust-generated TypeScript declarations and fails closed on invalid response shapes.

`application_commands.rs` separately owns browser application command IDs, labels, menu groups,
default enablement, and macOS/Linux shortcut mappings. The frontend command registry and visible
shortcut reference consume its generated TypeScript projection. Native menu events, shortcuts,
and existing visible controls converge on the same observable dispatcher; unavailable application
surfaces remain registered but disabled. Shortcut execution stays in the focus-aware frontend
bridge instead of native OS accelerators so focused host and WML editing events pass through
unchanged.

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
- `VITE_WAVES_DEFAULT_URL` (optional frontend startup URL; the address bar is empty by default)
- Decoder backend: Lowband's built-in
  `lowband-wml13-wbxml/0.3.0` implementation with bounded output and parser
  depth. No external `wbxml2xml` installation or bundled sidecar is required.

## Engine debug host policy

The D0-03 read-only engine debug command bridge is disabled by default. Start the native Tauri host
with `WAVES_ENGINE_DEBUG_POLICY=enabled` to allow one process-local protocol-v1 session. No other
value enables it, and the policy does not expose a sensitive-data override or remote listener.

The D0-04 Inspector is available in the existing docked and detached Developer Tools workspace.
It opens and closes the generated D0-03 session, pauses polling while hidden, retains and renders
bounded projections, and exports only the versioned allowlist documented in
[`ENGINE_DEBUG_INSPECTOR.md`](ENGINE_DEBUG_INSPECTOR.md). It does not add mutable debugger
commands, raw source/secret access, replay, or multi-session behavior.

## Native Tauri/Kannel UI pilot

Linux can drive the production Tauri window through the supported `tauri-driver` WebDriver
bridge. The pilot clicks the real address/softkey controls and crosses the generated Tauri IPC
contract, native Rust host, `transport-rust`, and Kannel; it does not install a mock invoke layer.

With `tauri-driver` 2.0.6, `WebKitWebDriver`, Docker, and an X11 display available:

```bash
xvfb-run -a make smoke-native-tauri-kannel-ui
```

The runner builds the production frontend and debug Tauri binary, provisions the local gateway,
opts into `allow-private` only through the existing host test boundary, pins `wap-net-core` with
fallback disabled, serves the test deck as WML 1.3 through explicit test-only response settings,
captures screenshots/DOM/driver/service logs, and always stops the GUI process
group and Docker services. This pilot is scheduled/manual until the promotion criteria in
`docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md` are met.

## Next implementation slice

1. Preserve completed `WBP-00` through `WBP-05A` and additive `WBP-02A`, including native chrome,
   single-announcement behavior, rendered accessibility evidence, and the landed navigation
   concurrency hardening; do not reopen completed tickets.
2. Preserve completed WBP-06/F0 frame, input, drift, and WML-309 evidence. Keep `EngineDebug*`
   separate and retain the legacy render/key compatibility paths until the declared cutover gate.
3. Preserve the merged typed POST history `#541`, F2-02 scrolling `#542`, F2-03 unified input
   `#543`, WBP-11 phase recovery `#544`, and APP-SHELL-01 Library/Preferences `#545` slices
   without destabilizing their shared browser shell seams.
4. Use the machine-checked
   [`WBP-14` desktop-path evidence audit](../docs/waves/WBP_14_DESKTOP_PATH_EVIDENCE.md) to add
   native timeout, cancellation, invalid-deck, and script-trap cases without treating component
   tests as desktop-path evidence.
5. Complete `WBP-12` crash recovery and `WBP-13` sanitized replay before claiming WBP-14 closure;
   packaged screen-reader, latency, and memory evidence remain explicit release gaps.
6. Keep the remaining `M1-09` (`F2-F4` frame migration) dependency-gated and `M1-03` as a
   non-priority generator follow-up.
7. Treat `WBP-15` as ready for evidence-bounded Nokia 7110 profile planning, not implementation;
   `WBP-16` may run independently as an Openwave handset/browser evidence-lock research task.

## Planning + Traceability

- Desktop product and interaction design: `docs/waves/WAVES_DESKTOP_PRODUCT_DESIGN.md`
- Browser product implementation plan: `docs/waves/WAVES_BROWSER_PRODUCT_IMPLEMENTATION_PLAN.md`
- Desktop application completion PRD: `docs/waves/PRD-WAVES-DESKTOP-APPLICATION-COMPLETION.md`
- WBP-00/WBP-01 decisions, measurements, and integration seams: `docs/waves/WAVES_BROWSER_BASELINE.md`
- WBP-05A rendered accessibility evidence: `docs/waves/WAVES_BROWSER_ACCESSIBILITY_EVIDENCE.md`
- WBP-14 desktop-path evidence audit: `docs/waves/WBP_14_DESKTOP_PATH_EVIDENCE.md`
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
- [x] Add versioned, allowlisted event timeline exports with chronology validation and secret-safe
      diagnostic projections (`APP-PRIV-01` / `RSL-06`)
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
