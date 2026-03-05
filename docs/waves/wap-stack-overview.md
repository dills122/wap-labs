# WAP 1.x Networking Stack Rewrite Overview

Status: `ACTIVE`
Date: `2026-03-04`
Owner: `transport-rust / browser / engine-wasm integration`

This document is the current networking-layer definition for the Waves rewrite.

Grounding:
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`
- `docs/waves/DEFERRED_CAPABILITY_SPEC_TRACEABILITY.md`
- Source references: `WAP-230`, `WAP-224`, `OMA-WAP-224_002`, `WAP-259`, `WAP-261`, `WAP-199`

## 1) Definition objective

Deliver a deterministic, spec-driven transport stack that can provide:

- WDP datagram service abstraction over UDP (MVP), with bearer profiles defined for future SMS/GSM/USSD and packet-borne bearers.
- WTP transaction semantics for connection-oriented request/response and one-way reliable flows.
- WSP session and connectionless HTTP-like transaction/session services used by browser engine runtime.
- Optional WTLS shim path that can evolve into real WTLS without changing the transport public APIs.

## 2) Core network abstraction model

- `Peer`: `(network_type, bearer_type, src_addr, src_port, dst_addr, dst_port)` as the transport identity.
- `WAP frame`: ordered bytes + associated peer metadata + timestamp.
- `Transport profile`: declares mandatory/optional protocol features at startup (`Connectionless`, `ConnectionMode`, `Push`, `SessionResume`, `WTLS`, `SAR`, etc.).

Scope note: transport stack must not parse/render WBXML or WML; those stay in `transport-rust` for WBXML conversion and `engine-wasm` for WML runtime.

Profile posture:

1. `gateway-bridged`: current behavior path via configured gateway.
2. `wap-net-core`: native protocol path used for `T0-14` target profile.
3. `wap-net-ext`: future optional CL/push-advanced extension profile.

## 3) Layer contract and boundaries

- `transport-rust/src/wap/wdp/`: datagram transport abstraction and address/port semantics.
- `transport-rust/src/wap/wtp/`: deterministic state machines, retransmission logic, duplicate and TID policy.
- `transport-rust/src/wap/wsp/`: PDU codec, service state, session/capability state, method/push dispatch.
- `transport-rust/src/wap/wtls/`: record/security façade (phase-1 shim, phase-2 real protocol).
- `browser/contracts/transport.ts`: browser transport entry surface.
- `engine-wasm/contracts/wml-engine.ts`: render/runtime contract unchanged by transport choices.

Contracts:
- No layer may mutate transport-global parser state.
- Parsers are pure (`decode_* -> parsed structure`) and deterministic.
- All protocol logic is owned by `transport-rust`, then normalized into browser transport contracts.

## 4) Data and control flow (stack profile)

### 4.1 Connection-mode path (browser to HTTP origin via WSP/WTP/WDP)

`Engine/browser -> transport facade -> WSP session -> WTP class-2 -> (optional WTLS) -> WDP -> UDP`.

### 4.2 Connectionless path (WSP-CL)

`Engine/browser -> WSP-CL codec -> WDP transport -> UDP`.

### 4.3 Push path

WAP PUSH is inbound only to UA session context:
`WDP <- WSP PUSH/ConfirmedPush <- WTP <- WTLS <- Network` then dispatched as transport event into browser host and engine.

## 5) Profiles and mandatory support lanes

- `MVP-NET-CORE`: WDP/UDP + WTP class 2 + WSP connection-mode GET/POST/REPLY + PUSH decode + optional WTLS shim.
- `MVP-NET-BRIDGE`: enable WSP connectionless GET/POST for gateway parity.
- `MVP-NET-EXT`: WTLS real implementation, session resume, SAR/ESAR, confirmed push retries.

Transport feature gate should be explicit (for testability and CI matrix).

## 6) Module interfaces (required)

### 6.1 Datagram transport (WDP)

Required trait:

```rust
pub trait DatagramTransport {
    fn send(&mut self, datagram: &WdpDatagram) -> Result<(), WdpError>;
    fn receive(&mut self) -> Result<WdpDatagram, WdpError>;
}
```

### 6.2 Transaction layer (WTP)

Required types and policies:
- `TransactionManager::send_invoke` with class and policy validation.
- deterministic retransmission policy and bounded timer strategy.
- `DuplicateTracker`, `TidPolicy`, `SarPolicy` (opt-in).

### 6.3 Session layer (WSP)

Required artifacts:
- strict codec registry from assigned-number tables,
- session context including capability state,
- method/push dispatch state,
- abort/abort-code handling.

### 6.4 Security layer (WTLS)

`TlsRecordLayer` shim initially, then real `handshake|record|alert|session|alert` state machine under feature gate.

## 7) Milestones (engineering plan)

### Milestone 0: parser foundation

- Parse and encode all WDP/WTP/WSP structures with deterministic roundtrip tests.

### Milestone 1: transport and session core

- WDP UDP implementation + WTP class-2 and class-1 behavior + WSP connect/disconnect/get/post/reply.

### Milestone 2: browser integration

- `transport-rust` emits contract-shaped `WAPResult` responses into `browser/contracts/transport.ts` and engine handoff path.

### Milestone 3: resilience and push

- deterministic retries, duplicate filtering, pending transaction abort on disconnect/suspend, push event sinks, profile gating.

### Milestone 4: security gate

- WTLS record wrapper with handshake plan and policy gating for opt-in crypto path.

## 8) Traceability and tests

- Requirements map: `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md` (`RQ-TRN-001`..`019`).
- Coverage map: `docs/waves/SPEC_TEST_COVERAGE.md` (transport section).
- Implementation work-items: `docs/waves/WORK_ITEMS.md` transport lanes `T0-08`..`T0-14`.
