# Transport Rust Phase Plan

Status: active implementation roadmap for `transport-rust/`

## Goal

Incrementally evolve the in-process Rust transport from gateway-backed HTTP bridging to native protocol handling without leaking runtime/render concerns into transport.

Transport boundary ends at normalized deck payload and optional XML event stream handoff.

## Current Baseline

- `transport-rust` is integrated in browser host (`browser/src-tauri`).
- `wap://`/`waps://` currently bridge through configured gateway HTTP endpoint.
- WBXML decode currently uses external `wbxml2xml` executable invocation.
- Retry/timeout/error mapping and coverage gate are active in Rust CI.

## Phase A (Ready Now): In-process WBXML decode via `libwbxml` FFI

Objective:

- Replace shelling out to `wbxml2xml` with direct in-process decode.

Scope:

- Add `libwbxml` FFI layer (`-sys` style module/crate boundary).
- Use `bindgen` for generated C bindings.
- Add safe Rust wrapper API for decode entrypoints and error mapping.
- Preserve existing error taxonomy (`WBXML_DECODE_FAILED`, etc.).
- Keep all decode logic in `transport-rust` (no browser/runtime decode).

Non-goals:

- No WSP/WTP parser rewrite yet.
- No WTLS session implementation.
- No runtime/render changes.

Definition of done:

- `fetch_deck` behavior unchanged for callers.
- `WBXML2XML_BIN` dependency removed from normal runtime path.
- Transport tests cover success + failure decode branches through FFI wrapper.

## Phase B: Streaming XML event boundary after decode

Objective:

- Support low-memory, deck-scoped processing from decoded XML stream.

Scope:

- Introduce streaming parser layer (preferred: `quick-xml`; `xml-rs` acceptable if constrained).
- Add bounded parsing/memory guardrails and deterministic failure mapping.
- Keep engine-facing contract stable unless explicitly versioned.

## Phase C: Native WSP/WTP protocol parsing path (feature-gated)

Objective:

- Add direct binary protocol path while retaining gateway-backed mode.

Scope:

- Add parser/FSM modules (candidate: `nom`) for WSP/WTP framing and headers.
- Introduce transport mode flags and clear fallback strategy.
- Keep browser API stable (`fetch_deck` contract first).

## Phase D: WTLS and security profile expansion (deferred)

Objective:

- Add encrypted-session protocol support only after protocol parity gates.

Scope:

- ASN.1/WTLS certificate handling (candidate: `rasn`, subject to design review).
- Cipher/profile handling behind explicit feature flags.

## Dependency Guidance

Recommended now:

- `bindgen` for `libwbxml` FFI generation.

Recommended later by phase:

- Phase B: streaming XML parser crate.
- Phase C: binary parser/fsm crate(s), likely `nom`.
- Phase D: ASN.1/WTLS stack, likely feature-gated.

## Guardrails

- Transport must not own rendering, runtime navigation, or WMLScript execution.
- Engine must not own network transport or WBXML decode.
- Contract updates (`browser/contracts/transport.ts`) must accompany behavior changes.

## Tracking

- Update related execution items in `docs/waves/WORK_ITEMS.md`.
- Keep CI gates in sync with transport scope (`fmt`, `test`, `coverage`).
