# Engine-Host Frame Migration Work Items

Purpose: execution board for migrating Waves runtime/host integration to `EngineFrame` + `EngineInputEvent`.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

## Program Guardrails

1. Keep changes layered:
- engine runtime logic in `engine-wasm/`
- host rendering/input wiring in `browser/` and `engine-wasm/host-sample/`
- no WBXML parsing in host TypeScript

2. Contract-first policy:
- update contract surfaces before implementation cutover
- keep native and wasm behavior aligned

3. Determinism policy:
- preserve deterministic navigation, focus, and frame output ordering
- no host-timing dependent layout logic

4. Scope policy:
- no broad refactor bundles; deliver phased, testable slices

## Ticket Template

1. `ID`
2. `Status`
3. `Depends On`
4. `Files`
5. `Build`
6. `Tests`
7. `Accept`
8. `Notes` (optional)

## Phase F0: Contract and API Introduction

### F0-01 Define canonical frame/input contract types

1. `Status`: `todo`
2. `Depends On`: none
3. `Files`:
- `engine-wasm/engine/src/render/*`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/src-tauri/src/contract_types.rs`
- `browser/src-tauri/src/bin/generate_contracts.rs`
4. `Build`:
- Add additive types for:
  - `EngineFrame`
  - `DrawCommand` (new contract alias or replacement for `DrawCmd`)
  - `EngineInputEvent`
  - `EngineCommand` (if command queue is adopted)
- Keep legacy `RenderList` contract available.
5. `Tests`:
- contract generation succeeds
- TypeScript compile in `browser/frontend`
6. `Accept`:
- New frame/input types are exported in Rust and TS contracts without breaking current hosts.

### F0-02 Add additive engine APIs with compatibility wrappers

1. `Status`: `todo`
2. `Depends On`: `F0-01`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/src-tauri/src/lib.rs`
- `browser/contracts/generated/engine-host.ts`
4. `Build`:
- Add:
  - `renderFrame()`
  - `handleInput(event)`
- Keep:
  - `render()`
  - `handleKey()`
- Implement wrapper behavior so outputs stay equivalent for key-only flow.
5. `Tests`:
- `cd engine-wasm/engine && cargo test`
- `cd browser/src-tauri && cargo test`
6. `Accept`:
- Old and new APIs return equivalent behavior for existing fixtures and key sequences.

### F0-03 Contract drift guardrails for frame/input interfaces

1. `Status`: `todo`
2. `Depends On`: `F0-01`
3. `Files`:
- `scripts/` (new contract drift check)
- `.github/workflows/*`
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
4. `Build`:
- Add CI check that generated TS contracts are in sync with Rust contract types.
5. `Tests`:
- intentional drift causes CI/check failure
6. `Accept`:
- contract changes cannot merge with stale generated outputs.

## Phase F1: Host Rendering Migration

### F1-01 WASM host sample frame renderer adoption

1. `Status`: `todo`
2. `Depends On`: `F0-02`
3. `Files`:
- `engine-wasm/host-sample/renderer.ts`
- `engine-wasm/host-sample/main.ts`
- `engine-wasm/README.md`
4. `Build`:
- Consume `renderFrame()` and draw from frame contract.
- Keep behavior and appearance stable.
5. `Tests`:
- host sample manual fixture checks
6. `Accept`:
- sample no longer depends on legacy `RenderList` call path.

### F1-02 Tauri frontend viewport migration to Canvas2D

1. `Status`: `todo`
2. `Depends On`: `F0-02`
3. `Files`:
- `browser/frontend/src/app/browser-shell-template.ts`
- `browser/frontend/src/app/browser-presenter.ts`
- `browser/frontend/src/styles.css`
- `browser/frontend/src/app/browser-presenter.test.ts`
4. `Build`:
- replace HTML line injection viewport path with canvas renderer adapter.
- preserve skeleton, status, and timeline UX.
5. `Tests`:
- `pnpm --dir browser/frontend test`
- `pnpm --dir browser/frontend build`
6. `Accept`:
- viewport rendering no longer uses `innerHTML` for deck content.
- draw output parity remains stable for local fixtures.

### F1-03 Navigation-state integration with frame rendering

1. `Status`: `todo`
2. `Depends On`: `F1-02`
3. `Files`:
- `browser/frontend/src/app/navigation-state.ts`
- `browser/frontend/src/app/browser-controller.ts`
- `browser/frontend/src/app/navigation-state.test.ts`
4. `Build`:
- keep render/snapshot sequencing deterministic with `engineRenderFrame`.
5. `Tests`:
- navigation-state tests cover render-after-load and render-after-input ordering.
6. `Accept`:
- no regressions in load/fetch/back/external-intent flows.

## Phase F2: Input Event Expansion

### F2-01 Add click event path with deterministic hit resolution

1. `Status`: `todo`
2. `Depends On`: `F0-02`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/layout/*`
- `browser/frontend/src/app/browser-controller.ts`
- `engine-wasm/host-sample/main.ts`
4. `Build`:
- add host click -> `EngineInputEvent::Click` routing.
- engine resolves click through frame/hit regions, not host-side link lookup.
5. `Tests`:
- engine fixture tests for click-target determinism
- host integration tests for click navigation
6. `Accept`:
- click activation behavior matches keyboard activation targets.

### F2-02 Add scroll event path and viewport offset semantics

1. `Status`: `todo`
2. `Depends On`: `F2-01`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/frontend/src/app/browser-controller.ts`
4. `Build`:
- support `EngineInputEvent::Scroll`.
- define deterministic scroll clamping and frame offset behavior.
5. `Tests`:
- scroll boundary and repeatability tests in engine.
6. `Accept`:
- identical event traces produce identical visible frame windows.

### F2-03 Softkey/input abstraction alignment

1. `Status`: `todo`
2. `Depends On`: `F2-01`
3. `Files`:
- `browser/frontend/src/app/keyboard.ts`
- `browser/frontend/src/app/browser-controller.ts`
- `engine-wasm/contracts/wml-engine.ts`
4. `Build`:
- map host keyboard/buttons into unified `EngineInputEvent` path.
- keep legacy key APIs as compatibility layer until cutover.
5. `Tests`:
- keyboard and control-button regression tests.
6. `Accept`:
- single input abstraction path is used in host application code.

## Phase F3: Engine Internal Boundary Split

### F3-01 Separate layout and paint phases

1. `Status`: `todo`
2. `Depends On`: `F0-02`
3. `Files`:
- `engine-wasm/engine/src/layout/*`
- `engine-wasm/engine/src/render/*`
- `engine-wasm/engine/src/lib.rs`
4. `Build`:
- move draw-command emission into paint pass over layout output.
- preserve current command ordering and focus semantics.
5. `Tests`:
- existing render snapshot tests
- new tests for layout-output determinism independent from paint
6. `Accept`:
- layout and paint responsibilities are explicit and test-covered.

### F3-02 Frame snapshot parity harness (native + wasm)

1. `Status`: `todo`
2. `Depends On`: `F3-01`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/tests/*` (new if needed)
- `docs/waves/SPEC_TEST_COVERAGE.md`
4. `Build`:
- add parity-critical snapshots for `renderFrame` and input traces.
5. `Tests`:
- `cd engine-wasm/engine && cargo test`
6. `Accept`:
- frame and navigation parity is verified across targets for critical flows.

## Phase F4: Cutover and Legacy Removal

### F4-01 Remove legacy render/input API from host paths

1. `Status`: `todo`
2. `Depends On`: `F1-03`, `F2-03`, `F3-02`
3. `Files`:
- `browser/frontend/src/*`
- `engine-wasm/host-sample/*`
- `browser/contracts/generated/*`
- `engine-wasm/contracts/wml-engine.ts`
4. `Build`:
- stop calling legacy `render()`/`handleKey()` in host code.
- retain compatibility only where needed for transition windows.
5. `Tests`:
- browser frontend tests/build
- host-sample smoke checks
6. `Accept`:
- all active hosts run on frame/input API path.

### F4-02 Legacy contract and wrapper removal (final)

1. `Status`: `todo`
2. `Depends On`: `F4-01`
3. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/src-tauri/src/contract_types.rs`
- `browser/src-tauri/src/bin/generate_contracts.rs`
- docs references to legacy API
4. `Build`:
- remove legacy `RenderList`/`DrawCmd` wrappers and key-only APIs when no longer used.
5. `Tests`:
- engine, browser frontend, and tauri host tests/builds
6. `Accept`:
- contract surface is single-path (`EngineFrame` + `EngineInputEvent`) and documented.

## Program Tracking

Cross-reference docs:

- migration architecture: `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`
- waves integration board: `docs/waves/WORK_ITEMS.md`
- maintenance board: `docs/waves/MAINTENANCE_WORK_ITEMS.md`

Completion gate:

- all `F0-F4` tickets marked `done`
- parity gates in `docs/waves/SPEC_TEST_COVERAGE.md` updated and passing
- contract mapping updated in `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
