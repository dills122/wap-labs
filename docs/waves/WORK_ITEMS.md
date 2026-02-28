# Waves Browser Work Items (Integration Track)

Purpose: execution board for Waves desktop browser integration work.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

Current mode: planning only. No ticket execution has started.

## Baseline Assumptions

These assumptions are active for this board and should not be re-litigated in each ticket:

1. `transport-python/` networking behavior is already functionally validated via CLI probes.
2. `engine-wasm/` runtime/rendering has reached a substantial milestone and is ready for full browser integration.

This board therefore prioritizes host/browser integration, UX shell behavior, and runtime/transport orchestration over low-level parser/transport re-validation.

## Scope

Primary implementation target:

- `browser/` (Tauri host app)

Integrated dependencies:

- `engine-wasm/` (runtime + wasm contract)
- `transport-python/` (sidecar/API transport boundary)

## Pre-Kickoff Guardrail

Do not begin implementation work on this board until the project is explicitly kicked off.

All items below are intentionally prepared as `todo` only.

## Ticket Template

1. `ID`: stable id (`B0-01`, `B1-02`, etc.)
2. `Status`
3. `Depends On`
4. `Files`
5. `Build`
6. `Tests`
7. `Accept`

## Initial Backlog (Prepared, Not Started)

These are the first tickets to pull once Waves browser implementation officially starts.

### P0-01 Repo bootstrap alignment for `browser/`

1. `Status`: `todo`
2. `Depends On`: none
3. `Files`:
- `browser/README.md`
- `browser/package.json`
- `docs/waves/WORK_ITEMS.md`
4. `Build`:
- Ensure naming and scripts reflect Waves browser app conventions.
- Confirm local runbook commands are documented.
5. `Tests`:
- Manual doc sanity pass and script command dry-run.
6. `Accept`:
- `browser/` onboarding docs are coherent and match repository conventions.

### P0-02 Tauri shell command contract freeze

1. `Status`: `todo`
2. `Depends On`: `P0-01`
3. `Files`:
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/transport.ts`
4. `Build`:
- Finalize initial command signatures (`health`, `fetch_deck` payload shape).
- Align Rust command payload naming with TypeScript contract naming.
5. `Tests`:
- Type checks for frontend imports.
- Rust compile-only sanity for command signatures.
6. `Accept`:
- Host command boundary is stable enough for integration work.

### P0-03 Sidecar process lifecycle spec

1. `Status`: `todo`
2. `Depends On`: `P0-02`
3. `Files`:
- `browser/src-tauri/src/*`
- `docs/waves/TECHNICAL_ARCHITECTURE.md`
4. `Build`:
- Define sidecar start/stop/restart policy and failure handling states.
- Document expected sidecar health and timeout policy.
5. `Tests`:
- Simulated sidecar unavailable scenario runbook.
6. `Accept`:
- Sidecar lifecycle behavior is documented and implementable without ambiguity.

### P0-04 First end-to-end integration fixture definition

1. `Status`: `todo`
2. `Depends On`: `P0-03`
3. `Files`:
- `docs/waves/*`
- `engine-wasm/host-sample/examples/*` (reference fixtures only)
4. `Build`:
- Define first browser integration scenario set (load, fragment nav, external nav intent).
- Record expected host state checkpoints for each scenario.
5. `Tests`:
- Checklist definitions only (no code execution yet).
6. `Accept`:
- Browser integration AC is written before code work starts.

## Phase B0: Host Skeleton Stabilization

### B0-01 Finalize Tauri host skeleton boot path

1. `Status`: `todo`
2. `Depends On`: none
3. `Files`:
- `browser/src-tauri/src/lib.rs`
- `browser/src-tauri/tauri.conf.json`
- `browser/frontend/src/*`
4. `Build`:
- Ensure host boots with deterministic health/status command wiring.
- Validate frontend<->Tauri invoke path with one placeholder command.
5. `Tests`:
- Smoke boot test (`tauri dev`) without transport dependency.
6. `Accept`:
- Host opens and returns deterministic health string.

### B0-02 Host contract parity and session model scaffold

1. `Status`: `todo`
2. `Depends On`: `B0-01`
3. `Files`:
- `browser/contracts/transport.ts`
- `browser/README.md`
4. `Build`:
- Freeze minimal host session state contract for URL/focus/card/error visibility.
5. `Tests`:
- Type-level contract checks in host frontend build.
6. `Accept`:
- Contract reflects required state for integration tickets.

## Phase B1: Transport + Engine Vertical Slice

### B1-01 Tauri command: fetch deck from Python sidecar

1. `Status`: `todo`
2. `Depends On`: `B0-01`, `B0-02`
3. `Files`:
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/transport.ts`
4. `Build`:
- Implement `fetch_deck` command calling `transport-python` API/sidecar.
- Return normalized payload (`wml`, `finalUrl`, `contentType`, error mapping).
5. `Tests`:
- Integration test against mocked or local sidecar endpoint.
6. `Accept`:
- Valid URL fetch yields deterministic payload without host crash.

### B1-02 Browser UI: URL load flow and status/error surfaces

1. `Status`: `todo`
2. `Depends On`: `B1-01`
3. `Files`:
- `browser/frontend/src/*`
4. `Build`:
- Add URL input + load action.
- Show loading, success, and error states.
5. `Tests`:
- UI flow checks for success and transport error path.
6. `Accept`:
- User can load a deck URL and see deterministic status transitions.

### B1-03 Wire fetched deck into wasm runtime

1. `Status`: `todo`
2. `Depends On`: `B1-02`
3. `Files`:
- `browser/frontend/src/*`
- `engine-wasm/contracts/wml-engine.ts`
4. `Build`:
- Feed fetched WML to engine via `loadDeckContext`.
- Render runtime output in host viewport.
5. `Tests`:
- End-to-end sample deck load and first-card render check.
6. `Accept`:
- Browser host renders first card from fetched deck.

## Phase B2: Browser Interaction Model

### B2-01 Input model bridge (directional + enter + softkey placeholders)

1. `Status`: `todo`
2. `Depends On`: `B1-03`
3. `Files`:
- `browser/frontend/src/*`
4. `Build`:
- Map keyboard/softkey controls to runtime actions deterministically.
5. `Tests`:
- Key-sequence integration checks using known fixtures.
6. `Accept`:
- Focus/navigation in host matches runtime expectations.

### B2-02 External intent handoff and host-level navigation policy

1. `Status`: `todo`
2. `Depends On`: `B2-01`
3. `Files`:
- `browser/frontend/src/*`
- `engine-wasm/contracts/wml-engine.ts`
4. `Build`:
- Consume `externalNavigationIntent` and perform host-driven fetch transition flow.
5. `Tests`:
- External link flow test ensuring active card behavior and next fetch behavior are deterministic.
6. `Accept`:
- External href path operates through host transport loop.

## Phase B3: Determinism & Regression Harness

### B3-01 Browser-side integration fixtures

1. `Status`: `todo`
2. `Depends On`: `B2-02`
3. `Files`:
- `browser/frontend/src/*`
- `docs/waves/*`
4. `Build`:
- Add repeatable integration fixture suite for load->navigate->render flows.
5. `Tests`:
- Snapshot or structured state assertions per fixture scenario.
6. `Accept`:
- Browser integration regressions are detectable in CI.

### B3-02 Event timeline/debug export parity

1. `Status`: `todo`
2. `Depends On`: `B3-01`
3. `Files`:
- `browser/frontend/src/*`
4. `Build`:
- Add deterministic event timeline and export path comparable to host-sample quality.
5. `Tests`:
- Validate export payload contains action/state chronology.
6. `Accept`:
- Debug artifacts can be attached for integration bug triage.
