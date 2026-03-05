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

Profile modes in use:

1. `gateway-bridged` (current): terminal path enters through configured gateway.
2. `wap-net-core` (target): in-process `WDP -> WTP -> WSP` stack with deterministic profile gating.
3. `wap-net-ext` (future): CL/push/advanced profile features after explicit migration approval.

Current profile decision point:

1. protocol migration stays behind explicit profile gates and feature flags.
2. transport contracts (`browser/contracts/transport.ts` and engine handoff paths) remain the compatibility boundary during all migration stages.

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

Status: optional + low priority while protocol-stack lanes are incomplete.

Objective:

- Support low-memory, deck-scoped processing from decoded XML stream.

Scope:

- Introduce streaming parser layer (preferred: `quick-xml`; `xml-rs` acceptable if constrained).
- Add bounded parsing/memory guardrails and deterministic failure mapping.
- Keep engine-facing contract stable unless explicitly versioned.

## Phase C: Native WSP/WTP protocol parsing path (feature-gated)

Status: active protocol lane.

Objective:

- Add direct binary protocol path while retaining gateway-backed mode.

Scope:

- Add parser/FSM modules (candidate: `nom`) for WSP/WTP framing and headers.
- Introduce transport mode flags and clear fallback strategy.
- Keep browser API stable (`fetch_deck` contract first).

## Phase D: WTLS and security profile expansion (deferred)

Status: deferred until transport protocol gates close.

Objective:

- Add encrypted-session protocol support only after protocol parity gates close.
- ASN.1/WTLS certificate handling (candidate: `rasn`, subject to design review).
- Cipher/profile handling behind explicit feature flags.

## Migration lane for this repo: protocol-aligned execution stack

1. `T0-08`: WTP retransmission and replay behavior
2. `T0-09`: WSP connectionless primitive enforcement
3. `T0-10`: WSP assigned-number fidelity
4. `T0-11`: WSP capability negotiation and bounds
5. `T0-12`: TCP capability profile declaration
6. `T0-13`: SMPP adaptation scope decision
7. `T0-14`: transport profile decision and promotion gates
8. `T0-16`: source queue/variant canonicalization lock
9. `T0-17`: transport-adjacent scope sweep
10. `T0-18`: WTP retransmission/NACK hold-off policy implementation
11. `T0-19`: WDP datagram trait + UDP mapping baseline
12. `T0-20`: WSP registry/unknown-token policy completion
13. `T0-21`: WTLS phase boundary and minimal reliability lane
14. `T0-22`: interop replay harness and golden event corpus

## Regrouped networking priority order (`2026-03-05`)

1. `T0-19` WDP datagram trait + UDP mapping baseline
2. `T0-18` WTP retransmission/duplicate/NACK hold-off behavior
3. `T0-20` WSP registry/token and unknown-codepage handling
4. `T0-22` interop replay harness and golden event corpus
5. `T0-21` WTLS phase boundary/minimal lane (default disabled)

## Notes

- `Phase D` does not run forward until profile gates close and explicit security-profile scope is settled in `T0-14` and `T0-21`.

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
