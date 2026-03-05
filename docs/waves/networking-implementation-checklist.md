# Networking Implementation Checklist (WAP 1.x Rewrite)

Date: 2026-03-04  
Status: draft

## 1) Scope posture

For `transport-rust`, the current network goal is deterministic, in-process protocol behavior behind a stable contract boundary, while preserving browser/runtime ownership boundaries.

Current implementation posture for now:

1. `profile_mode=bridge-first` with protocol-parity lanes for replay, verification, and decode fixtures.
2. `WDP` over UDP core implementation must be operational and deterministic.
3. `WTP` and `WSP` behavior implemented behind feature gates and gradually promoted as gate requirements pass.
4. `WTLS` remains phased with explicit feature flag and deterministic no-op path.

Target implementation posture:

1. full `WDP -> WTP -> WSP` stack operation from transport-rust without mandatory external protocol dependency.
2. Explicit transport profile declaration with migration gates in `docs/waves/WORK_ITEMS.md` and `docs/waves/TECHNICAL_ARCHITECTURE.md`.

## 2) Architecture contract gates

All network paths must satisfy these invariant rules:

1. `transport-rust` owns protocol parsing, transaction/session state, and error-taxonomy emission.
2. parsers and encoders are pure and stateless (`decode_* -> struct`, `encode_* -> bytes`).
3. `browser/contracts/transport.ts` and `engine-wasm/contracts/wml-engine.ts` are only transport/runtime contracts.
4. All protocol behavior that can affect determinism is traced with event log fields: profile, peer tuple, transaction id/session id, sequence state, and timer state.

Traceability requirement:

1. each new transport behavior must map to at least one existing `RQ-TRN-*` or `RQ-TRX-*` ID.
2. each `Rq-*` mapping must include a test-location in `docs/waves/SPEC_TEST_COVERAGE.md`.

## 3) Immediate implementation checklist

### F0: Foundation and policy

1. confirm `spec-processing/source-material` has canonical transport corpus:
   - `WAP-259`, `WAP-224`, `OMA-WAP-224_002`, `WSP-230`, `OMA-WAP-TS-WSP`
   - `WAP-202`, `WAP-225`, `WAP-229*`, `WAP-223*`, `WAP-159`
2. add/verify parser modules for deterministic PDU roundtrip:
   - `wdp`, `wtp`, `wsp` codecs + validation stubs
3. lock transport profile constants:
   - service mode(s), UDP/WTLS default posture, bearer placeholders
4. acceptance gates:
   - `T0-16` source-queue canonicalization remains clean
   - `T0-14` profile decision gates authored and reviewed

### F1: WDP bedrock

1. finalize datagram trait (`DatagramTransport`, `WdpDatagram`, `WdpAddress`, `WdpError`).
2. implement/lock UDP mapping and ports 9200-9203.
3. map address/port source metadata in request/response trace context.
4. test gates:
   - port mapping fixture set
   - malformed header/body error mapping fixture set
5. acceptance:
   - `RQ-TRN-001..004` fully traceable and no regressions in request-policy flow.

### F2: WTP transaction core

1. implement deterministic state machine types for class-0/class-1/class-2.
2. implement TID lifecycle and replay-window policy for initiator and responder.
3. implement bounded retransmission + abort path + duplicate filtering policy.
4. test gates:
   - TID table fixtures for cache/no-cache/replay
   - retransmission bound and timer trace assertions
5. acceptance:
   - `RQ-TRN-005..009` and `RQ-TRN-016`

### F3: WSP service/session

1. implement protocol-mode gating and profile validation (`connection-oriented`, `connectionless`, both).
2. implement method invoke/reply primitives and primitive transition validation.
3. implement header/token registries and deterministic unknown-token policy.
4. implement capability negotiation and cap bound handling.
5. test gates:
   - primitive matrix fixtures
   - assigned-number roundtrip fixtures
   - cap overrun / conflict fixtures
6. acceptance:
   - `RQ-TRN-010..015`, `RQ-TRN-017..019`

### F4: Security path and gateway bridge bridge

1. stabilize WTLS shim contract and explicit disabled-by-default behavior.
2. keep gateway bridge path deterministic for HTTP/WAP gateway behavior while protocol path is behind feature gate.
3. test gates:
   - handshake-disabled path compatibility checks
   - security-posture migration check fixture
4. acceptance:
   - `RQ-SEC-004`, `RQ-SEC-005`, WAP networking profile gate from `T0-14`

### F5: Migration and integration hardening

1. add protocol-profile gate assertions to CI-like fixture script path:
   - required tickets and minimum layer status checks before profile promotion.
2. run a cross-layer contract smoke map with `browser` + `engine-wasm` + `transport-rust`.
3. publish explicit profile transition decision: current -> target.
4. acceptance:
   - all `T0-08..T0-14` gates with explicit owner and artifact.
   - no behavior drift in transport contracts (`browser/contracts/transport.ts`, `engine-wasm/contracts/wml-engine.ts`).

## 4) Known adjacent-but-deferred transport context

1. `WAP-204-WAPOverGSMUSSD` and `WAP-204_103` are not in current transport rewrite lane.
2. `WAP-120-WAPCachingMod` remains out of transport-rewrite scope, tracked in out-of-scope family review.
3. Bearer adaptation beyond UDP (SMS/packet tunnel) is deferred and should remain in adapter-only modules with explicit not-implemented stubs.

## 5) Execution alignment with project docs

1. `docs/waves/WORK_ITEMS.md` is the execution source of truth for sequencing (`T0-08..T0-17`).
2. `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md` and `..._ADJACENT_...` are the requirement sources.
3. `docs/waves/SPEC_TEST_COVERAGE.md` hosts acceptance status and must remain synchronized on every migration gate.
4. `docs/waves/TECHNICAL_ARCHITECTURE.md` should describe transport profile states before each milestone gate.
