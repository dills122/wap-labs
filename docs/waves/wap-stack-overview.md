# WAP 1.x Networking Stack Rewrite Overview

Status: `ACTIVE`
Date: `2026-03-04`
Owner: `transport-rust / browser / engine-wasm integration`

This document is the current networking-layer definition for the Waves rewrite.

Grounding:
- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`
- `docs/waves/DEFERRED_CAPABILITY_SPEC_TRACEABILITY.md`
- Strict source references: effective `WAP-200`, `WAP-202`, and effective
  `WAP-203`
- Conditional/context references: effective `WAP-201`, `WAP-259`, `WAP-224`,
  `WAP-230`, OMA corrections, `WAP-261`, and `WAP-199`

## 1) Definition objective

Deliver a deterministic, spec-driven transport stack that can provide:

- WDP datagram service abstraction over UDP (MVP), with bearer profiles defined for future SMS/GSM/USSD and packet-borne bearers.
- WCMP selected error and diagnostic message behavior.
- Connectionless WSP GET/POST/REPLY services used by the browser runtime.
- Optional WTP and connection-oriented WSP transaction/session behavior.
- Optional WTLS shim path that can evolve into real WTLS without changing the transport public APIs.

## 2) Core network abstraction model

- `Peer`: `(network_type, bearer_type, src_addr, src_port, dst_addr, dst_port)` as the transport identity.
- `WAP frame`: ordered bytes + associated peer metadata + timestamp.
- `Transport profile`: declares mandatory/optional protocol features at startup (`Connectionless`, `ConnectionMode`, `Push`, `SessionResume`, `WTLS`, `SAR`, etc.).

Scope note: transport stack must not parse/render WBXML or WML; those stay in `transport-rust` for WBXML conversion and `engine-wasm` for WML runtime.

Profile posture:

1. `gateway-bridged`: legacy gateway path retained as rollback and comparison lane.
2. `wap-net-core`: active native WDP/UDP -> connectionless WSP path.
3. `wap-net-ext`: future additional-bearer, connection-oriented WSP/WTP,
   Push, and advanced-session profile.

## 3) Layer contract and boundaries

- `transport-rust/src/network/wdp/`: datagram transport abstraction and address/port semantics.
- `transport-rust/src/network/wcmp/`: selected control-message codec and policy
  target.
- `transport-rust/src/network/wsp/`: PDU codec and connectionless method
  dispatch; optional session/capability breadth.
- `transport-rust/src/network/wtp/`: conditional state machines,
  retransmission logic, duplicate and TID policy.
- `transport-rust/src/network/wtls/`: record/security façade.
- `browser/contracts/transport.ts`: browser transport entry surface.
- `engine-wasm/contracts/wml-engine.ts`: render/runtime contract unchanged by transport choices.

Contracts:
- No layer may mutate transport-global parser state.
- Parsers are pure (`decode_* -> parsed structure`) and deterministic.
- All protocol logic is owned by `transport-rust`, then normalized into browser transport contracts.

## 4) Data and control flow (stack profile)

### 4.1 Strict connectionless path

`Engine/browser -> WSP-CL codec -> WDP transport -> UDP`.

WCMP supplies the selected control/error side path.

### 4.2 Conditional connection-mode path

`Engine/browser -> transport facade -> WSP session -> WTP class-2 -> WDP`.

This path is not part of the initial selected Class C profile.

### 4.3 Conditional Push path

WAP PUSH is inbound only to UA session context:
`WDP <- WSP PUSH/ConfirmedPush <- WTP <- WTLS <- Network` then dispatched as transport event into browser host and engine.

## 5) Profiles and mandatory support lanes

- `MVP-NET-CORE`: WDP/UDP + selected WCMP + connectionless WSP
  GET/POST/REPLY.
- `MVP-NET-BRIDGE`: legacy gateway fallback/comparison path.
- `MVP-NET-EXT`: connection-oriented WSP/WTP, additional bearers, Push,
  session resume, SAR/ESAR, and later security choices.

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

### 6.2 Control-message layer (WCMP)

Required strict artifacts:

- destination-unreachable, message-too-big, and echo-reply structures,
- error-generation guardrails,
- deterministic malformed-message handling.

### 6.3 Conditional transaction layer (WTP)

Required types and policies:
- `TransactionManager::send_invoke` with class and policy validation.
- deterministic retransmission policy and bounded timer strategy.
- `DuplicateTracker`, `TidPolicy`, `SarPolicy` (opt-in).

### 6.4 WSP layer

Required artifacts:
- strict codec registry from assigned-number tables,
- connectionless GET/POST/REPLY method dispatch,
- conditional session/capability/push state,
- abort/abort-code handling.

### 6.5 Security layer (WTLS)

`TlsRecordLayer` shim initially, then real `handshake|record|alert|session|alert` state machine under feature gate.

## 7) Milestones (engineering plan)

### Milestone 0: parser foundation

- Close all 22 selected WDP/WCMP/WSP rows with source-derived deterministic
  fixtures.

### Milestone 1: strict transport core

- WDP UDP implementation + selected WCMP behavior + connectionless WSP
  GET/POST/REPLY.

### Milestone 2: browser integration

- `transport-rust` emits contract-shaped `WAPResult` responses into `browser/contracts/transport.ts` and engine handoff path.

### Milestone 3: optional transport breadth

- connection-oriented WSP/WTP, deterministic retries, duplicate filtering,
  session teardown, Push event sinks, and profile gating.

### Milestone 4: security gate

- WTLS record wrapper with handshake plan and policy gating for opt-in crypto path.

## 8) Traceability and tests

- Requirements map: `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md` (`RQ-TRN-001`..`019`).
- Exact ledgers: `docs/waves/WAP_1_2_1_TRANSPORT_SCR_LEDGERS.md`.
- Coverage map: `docs/waves/SPEC_TEST_COVERAGE.md` (transport section).
- Implementation work-items: `docs/waves/WORK_ITEMS.md` transport lanes `T0-08`..`T0-14`.
