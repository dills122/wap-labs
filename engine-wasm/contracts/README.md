# WaveNav Engine Contracts

`wml-engine.ts` is the handwritten, target-aware engine method facade. The serialized payload
types it imports from `generated/runtime-dtos.ts` are generated from the serde-visible Rust types
in `engine-wasm/engine`; do not hand-edit the generated file or duplicate those shapes in the
facade.

This is the narrow additive M1-03 follow-up for engine serialized DTO parity. It does not activate
the broader M1-03 proposal to generate the complete native/WASM method API.

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

`WmlGoRequestPolicy.requestIntent` is the WML-304 engine handoff for method, ordered resolved
postfields, `sendreferer`, `cache-control`, `enctype`, `accept-charset`, and same-deck
classification. The native Rust and WASM serializers expose the same shape. This contract does
not perform a fetch, merge GET fields into a query, construct multipart content, choose a wire
charset, or replay POST history; those remain host/transport follow-ups.
