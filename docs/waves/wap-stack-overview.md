# WAP 1.x Stack Rewrite Overview (Draft)

Status: `DRAFT`
Date: `2026-03-04`
Owner: `transport-rust / browser / engine-wasm integration`

This document is a working draft for the planned WAP 1.x stack rewrite.
It is designed to be refined as source material is reviewed and validated.

Grounding status:
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`
- Source references: `WAP-230`, `OMA-WAP-TS-WSP-V1_0-20020920-C`, `WAP-224`, `OMA-WAP-224_002`, `WAP-259`, `WAP-199-WTLS`

## 1) Objective

Implement a layered, deterministic WAP 1.x network stack for Waves that is:

- Spec-driven and incrementally validated
- Strictly separated by protocol layer (WDP → WTP → WSP, optional WTLS)
- Deterministic and testable without UI/browser assumptions
- Integrated with existing browser transport contracts without changing rendering behavior

## 2) Layer targets

### WDP (Datagram transport layer)

- Datagrams over bearer transport (UDP in MVP)
- Port addressing and payload framing
- Bearer abstraction for future SMS/GPRS implementations

### WTP (Transaction layer)

- Lightweight reliable transaction behavior for request/response semantics
- ACK/retry/duplicate suppression
- Transaction IDs and per-peer state

### WSP (Session layer)

- Session and connectionless request semantics
- Header token encoding/decoding
- GET/POST/REPLY/PUSH/CONNECT/DISCONNECT message flow

### WTLS (Optional)

- Placeholder security profile initially
- Record/handshake scaffolding behind feature flags

## 3) Architectural boundaries

- `transport-rust` owns all protocol parsing/encoding and packet FSM behavior
- `engine-wasm` remains responsible for WML parsing/layout/rendering/runtime
- `browser` owns host I/O, window/input, adapter contracts
- `browser/contracts/transport.ts` and `engine-wasm/contracts/wml-engine.ts` are considered contract files to keep aligned if API surfaces change

No protocol parsing in host renderer or engine runtime.

## 4) Directory plan

- `transport-rust/src/wap/wdp/`
- `transport-rust/src/wap/wtp/`
- `transport-rust/src/wap/wsp/`
- `transport-rust/src/wap/wtls/` (scaffolded initially)

Each protocol module follows:

- `pdu.rs` (typed packet enums/structs)
- `codec.rs` (pure encode/decode/validate)
- `state.rs` (deterministic transitions, when applicable)
- `service.rs` (session/transaction orchestration)
- `tests.rs` (roundtrip and fixture tests)

## 5) Minimal source flow

1. `browser adapter` requests transport action
2. `browser` façade maps to `transport-rust` WSP service
3. WSP service emits/consumes WTP PDUs
4. WTP service uses WDP transport abstraction
5. WDP backend sends/receives UDP (MVP)

## 6) Test-first checkpoints

### Milestone 1 — WDP MVP

- In-memory + UDP datagram transport
- Deterministic encode/decode roundtrips

### Milestone 2 — WTP MVP

- Class 0/1/2 invoke + ack + result
- Duplicate suppression and retry behavior

### Milestone 3 — WSP MVP

- GET over WSP over WTP
- REPLY parsing to normalized payload
- PUSH parsing

### Milestone 4 — Integration

- Browser consumes WSP responses through existing engine-facing contract
- Trace logs include layer/tagged IDs for replay/debug

## 7) Observability baseline

Standard log shape (example):

- `[WDP] tx src=9200 dst=9200 len=128`
- `[WTP] tx invoke tid=12 class=2 retries=0`
- `[WTP] rx ack tid=12`
- `[WSP] tx GET session=abc url=/index.wml`

## 8) Open questions (to resolve from source material)

- Exact WTP timer/ack timing defaults for class behavior
- Header token set completeness and deprecated tokens
- Bearer-specific behavior for WDP over UDP (porting constraints)
- WTLS minimum viable parity scope
- Error-code mapping and abort semantics

## 9) Next docs

Source-aligned references are split out in:

- `wsp-pdu-reference.md`
- `wtp-state-machine.md`
- `wdp-datagram-format.md`
- `wtls-record-structure.md`
