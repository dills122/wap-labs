# WaveNav Engine Contracts

`wml-engine.ts` is the handwritten, target-aware engine method facade. The serialized payload
types it imports from `generated/runtime-dtos.ts` are generated from the serde-visible Rust types
in `engine-wasm/engine`; do not hand-edit the generated file or duplicate those shapes in the
facade.

This is the additive serialized-DTO projection used by the legacy runtime methods, the D0-01
`EngineDebug*` namespace, and the WBP-06/F0 frame-and-input boundary. It does not activate the
broader M1-03 proposal to generate the complete native/WASM method API.

The committed projection carries its generator, schema version, and canonical source paths in its
header. Regenerate or verify it from the repository root with:

```sh
pnpm --dir engine-wasm/host-sample run contracts:generate
pnpm --dir engine-wasm/host-sample run contracts:check
```

`contracts:check` regenerates from Rust and fails on tracked drift. Native serde fixtures and WASM
boundary tests separately pin representative render, error, navigation-effect, and exact-key
serialization. Optional Rust values use the existing `serde_wasm_bindgen` boundary convention
(`undefined` for missing values), represented as optional TypeScript properties. Trace sequence
numbers stay JavaScript `number` values because the boundary uses the default safe-integer
serializer rather than BigInt mode.

`EnginePresentationFrame` is the authoritative engine-to-host display contract. Version 1 carries
a content-derived `frameId`, profile and viewport identity, deck/card display metadata, ordered
rows and segments, focus and non-secret selection state, ordered actionable affordances, and Back
availability. `EngineInputEvent` currently accepts key input and frame-bound action activation.
Hosts must return the current `frameId` and an advertised `actionId`; stale or unavailable actions
are rejected before runtime mutation. `primary`, `task`, and `back` are logical control
associations, not vendor-specific physical key claims.

The legacy `render()`/`RenderList` and `handleKey()` methods remain additive compatibility paths.
`renderFrame()` and `handleInput()` use the same runtime/layout/action implementation, and the
native/WASM parity suites pin their output, trace, serialization, and stale-frame behavior.
`EngineDebug*` remains a separate diagnostics namespace and is not a render or input API. Pointer
hit regions, scroll semantics, editor event expansion, renderer cutover, and physical softkey
placement remain later frame-migration work.

`ENGINE_VIEWPORT_RANGE` is generated from the Rust-owned frame contract and is shared by native,
WASM, Tauri, and frontend validation. `setViewportCols()` accepts integer columns from `1` through
`u32::MAX`; an out-of-range value rejects with the serialized `EngineViewportError` before state
mutation. Tauri frame-producing mutation adapters operate on a complete candidate engine state
and commit it only after legacy render and presentation-frame construction both succeed, so a
frame error preserves the prior deck, card, history, variables, focus, timers, and navigation
intent.

`WmlGoRequestPolicy.requestIntent` is the WML-304 engine handoff for method, ordered resolved
postfields, `sendreferer`, `cache-control`, `enctype`, `accept-charset`, and same-deck
classification. The native Rust and WASM serializers expose the same shape. This contract does
not perform a fetch, merge GET fields into a query, construct multipart content, choose a wire
charset, or replay POST history; those remain host/transport follow-ups.
