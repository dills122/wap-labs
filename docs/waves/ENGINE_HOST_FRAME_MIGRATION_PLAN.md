# Engine-Host Frame Interface Migration Plan

Status: planning-ready  
Last updated: 2026-03-03

## Purpose

Define a deterministic, multi-target rendering boundary where the engine emits structured frame data and hosts render it, without engine-generated HTML or host DOM-coupled assumptions.

This plan is intentionally scoped to interface and rendering-boundary migration only.

## Scope

In scope:

- engine output model migration from `RenderList` to `EngineFrame` (additive first)
- engine input model migration from key-only calls to typed `EngineInputEvent` (additive first)
- host adapter updates for:
  - WASM browser harness (`engine-wasm/host-sample`)
  - Waves Tauri frontend (`browser/frontend`)
- contract-source and type-generation alignment across Rust and TypeScript
- parity and determinism validation across native + wasm targets

Out of scope:

- protocol stack redesign
- broad runtime feature expansion unrelated to interface migration
- GPU renderer implementation (only compatibility posture)

## Current Baseline (Observed)

1. Engine already emits structured draw commands (`RenderList`, `DrawCmd::Text|Link`).
2. WASM host sample already consumes draw commands and paints to Canvas2D.
3. Tauri frontend currently converts draw commands into HTML string lines (`innerHTML`) for viewport presentation.
4. Input flow is key-driven (`up/down/enter`) with host-triggered back and timer ticks; no click/scroll event boundary exists yet.
5. Type contracts are partly centralized:
   - generated host contracts from Rust (`ts-rs`) in `browser/contracts/generated/*`
   - handwritten engine wasm contract in `engine-wasm/contracts/wml-engine.ts`

## Target Architecture

### Engine Output Boundary

Engine returns a frame object with enough data for renderer independence:

- `EngineFrame`
  - `viewport`
  - `drawCommands`
  - optional `hitRegions` (for deterministic click mapping)
  - optional `metadata` (diagnostics/version/feature flags)

### Engine Input Boundary

Engine accepts typed input events:

- `EngineInputEvent`
  - `KeyPress`
  - `Click`
  - `Scroll`
  - optional future events (`Softkey`, `TextCommit`)

### Host Responsibilities

- renderer implementation selection (Canvas2D now, future GPU later)
- mapping host/native/browser input into `EngineInputEvent`
- transport, windowing, and side-effect policy remain host-owned

### Engine Responsibilities

- deterministic layout, navigation, focus, and hit-testing
- deterministic frame generation (host-agnostic)
- zero DOM/HTML assumptions

## Compatibility Strategy

Use additive migration with compatibility shims:

1. Introduce new frame/input API while preserving existing `render()` and `handleKey()` paths.
2. Migrate hosts to new APIs incrementally.
3. Keep regression parity tests on both APIs until cutover.
4. Remove legacy API only after parity gate is green.

## Contract-First Plan

Primary contract evolution sequence:

1. Define canonical Rust-side interface types (`EngineFrame`, `DrawCommand`, `EngineInputEvent`, `EngineCommand`).
2. Generate TypeScript bindings from Rust-owned types for host usage.
3. Keep `engine-wasm/contracts/wml-engine.ts` aligned as contract surface until fully generator-backed.
4. Update `browser/contracts/generated/engine-host.ts` generation pipeline for new methods and shapes.

Contract guardrails:

- no host-specific fields in engine-owned frame/input contracts
- serialization-only target glue at adapters
- contract changes require docs and parity-test updates in same change

## Migration Phases

### Phase F0: Contracts and Adapters (No Behavior Change)

- define frame/input types
- add engine API methods:
  - `renderFrame() -> EngineFrame`
  - `handleInput(event: EngineInputEvent)`
- keep legacy methods with wrappers:
  - `render()`
  - `handleKey()`

### Phase F1: Host Renderer Migration

- update WASM host sample to consume `EngineFrame` path
- replace Tauri frontend viewport HTML rendering with Canvas2D renderer adapter
- keep presenter/session/timeline behavior unchanged outside rendering surface

### Phase F2: Input Event Surface Expansion

- add click and scroll routing from hosts to engine
- implement deterministic hit testing in engine frame/hit-region model
- keep keyboard path behavior identical

### Phase F3: Internal Engine Boundary Cleanup

- split current combined layout+draw generation into:
  - layout phase
  - paint phase
- preserve draw ordering and focus determinism across targets

### Phase F4: Cutover and Legacy Removal

- require parity suite green on native + wasm for frame/input paths
- remove legacy `RenderList` and key-only API surfaces
- finalize docs and coverage mappings

## Determinism and Parity Gates

Must remain deterministic across native and wasm:

- `loadDeckContext`
- `handleInput(KeyPress)`
- `renderFrame`
- script invocation side effects
- back-stack/focus transitions
- timer-driven transitions

Parity-critical coverage must include:

- snapshot parity for frame command sequence
- focus and navigation parity under identical input traces
- click hit-target parity using frame/hit-region mapping fixtures

## Risks and Mitigations

1. Risk: contract drift between handwritten and generated TS types.
- Mitigation: make Rust-owned contract generation authoritative and add CI drift checks.

2. Risk: renderer-dependent text metrics affecting determinism.
- Mitigation: keep engine layout in logical units (rows/cols) and avoid host-measured line wrapping.

3. Risk: click semantics diverge by target host.
- Mitigation: engine-owned hit-region identifiers in frame output; hosts send coordinates only.

4. Risk: migration stalls due to dual-path complexity.
- Mitigation: strict phase gates and explicit legacy removal criteria.

## Documentation Update Requirements Per Phase

Each migration phase PR must update:

- `engine-wasm/contracts/wml-engine.ts`
- `engine-wasm/README.md`
- `browser/contracts/generated/engine-host.ts` (generated output)
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
- `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md` status

## Acceptance Criteria (Program-Level)

Migration is complete when:

1. Engine no longer exposes legacy `RenderList`/`handleKey` API in primary host path.
2. Both hosts consume `EngineFrame` and `EngineInputEvent`.
3. Tauri viewport rendering no longer depends on HTML line injection.
4. Native/wasm parity suite covers frame/input critical paths and passes.
5. Contract and docs drift checks enforce boundary consistency in CI.
