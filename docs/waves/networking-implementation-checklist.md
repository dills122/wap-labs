# Networking Implementation Checklist (WAP 1.x Rewrite)

Date: 2026-03-04  
Status: draft

## 1) Scope posture

For `transport-rust`, the current network goal is deterministic, in-process protocol behavior behind a stable contract boundary, while preserving browser/runtime ownership boundaries.

Current implementation posture for now:

1. `profile_mode=wap-net-core` with the gateway bridge retained as explicit
   fallback and comparison lane.
2. `WDP` over UDP core implementation must be operational and deterministic.
3. Connectionless `WSP` is the strict native method path; `WTP` and
   connection-oriented WSP remain separately gated capabilities.
4. `WTLS` remains phased with explicit feature flag and deterministic no-op path.

Target implementation posture:

1. full strict WDP/WCMP/connectionless-WSP operation from `transport-rust`
   without a mandatory external protocol dependency.
2. Explicit transport profile declaration with migration gates in `docs/waves/WORK_ITEMS.md` and `docs/waves/TECHNICAL_ARCHITECTURE.md`.
3. Optional connection-oriented WSP/WTP remains modular and cannot replace
   the strict connectionless path.

## 2) Architecture contract gates

All network paths must satisfy these invariant rules:

1. `transport-rust` owns protocol parsing, transaction/session state, and error-taxonomy emission.
2. parsers and encoders are pure and stateless (`decode_* -> struct`, `encode_* -> bytes`).
3. `browser/contracts/transport.ts` and `engine-wasm/contracts/wml-engine.ts` are only transport/runtime contracts.
4. All protocol behavior that can affect determinism is traced with event log fields: profile, peer tuple, transaction id/session id, sequence state, and timer state.

Traceability requirement:

1. each new transport behavior must map to an exact WDP/WCMP/WSP source row
   when it affects the strict profile, plus an existing thematic `RQ-TRN-*` or
   `RQ-TRX-*` owner.
2. each mapping must include a test location in
   `docs/waves/SPEC_TEST_COVERAGE.md`; direct normative evidence must be
   distinguished from provisional project-authored tests.

## 3) Immediate implementation checklist

Execution priority override (`2026-03-08` refresh):

1. `T0-27` native connectionless desktop fetch path
2. `T0-28` browser host mode selection + fallback
3. `T0-29` native Kannel smoke evidence gate
4. `M1-16` payload guardrails
5. after `T0-27..T0-29`, prioritize cross-lane runtime/compliance work over broader transport breadth

### F0: Foundation and policy

1. confirm `spec-processing/source-material` has canonical transport corpus:
   - strict authority: effective `WAP-200`, `WAP-202`, and effective
     `WAP-203`
   - conditional WTP authority: effective `WAP-201`
   - successor context: `WAP-259`, `WAP-224`, `OMA-WAP-224_002`,
     `WAP-230`, and `OMA-WAP-TS-WSP`
   - exact WDP/WCMP/WSP manifests pass
     `node scripts/check-wap-transport-conformance-ledgers.mjs`
2. add/verify parser modules for deterministic PDU roundtrip:
   - `wdp`, `wtp`, `wsp` codecs + validation stubs
3. lock transport profile constants:
   - service mode(s), UDP/WTLS default posture, bearer placeholders
4. acceptance gates:
   - `T0-16` source-queue canonicalization remains clean
   - `T0-14` profile decision gates authored and reviewed
5. keep explicit source-pipeline mapping from queued raw input -> parsed markdown -> `source-material` promotion in README and ticket artifacts.

### F1: WDP bedrock

1. finalize datagram trait (`DatagramTransport`, `WdpDatagram`, `WdpAddress`, `WdpError`).
2. implement/lock UDP mapping and ports 9200-9203.
3. map address/port source metadata in request/response trace context.
4. test gates:
   - port mapping fixture set
   - malformed header/body error mapping fixture set
5. acceptance:
   - `RQ-TRN-001..004` fully traceable and no regressions in request-policy flow.

### F2: WCMP selected core

1. implement the selected general-WCMP path.
2. implement destination-unreachable, message-too-big, and echo-reply message
   structures.
3. enforce deterministic error-generation and payload rules.
4. test gates:
   - direct WAP-202 fixtures for all five selected rows
   - malformed message and no-error-in-response-to-error assertions
5. acceptance:
   - `TRN-703`, exact WCMP ledger, and thematic `RQ-TRX-006..008`

### F3: WSP connectionless service

1. make connectionless mode the explicit strict profile and keep
   connection-oriented mode capability-gated.
2. implement method invoke/reply primitives and primitive transition validation.
3. implement header/token registries and deterministic unknown-token policy.
4. close all eight selected WAP-203 rows before extending optional breadth.
5. test gates:
   - source-derived GET/POST/REPLY fixtures
   - selected header-encoding and encoding-version fixtures
6. acceptance:
   - `WSP-801`, `WSP-802`, `WSP-804`, `WSP-805`

### F3a: Conditional connection-oriented WSP/WTP

1. activate only when the profile explicitly claims connection-oriented WSP.
2. extract the exact effective WAP-201 ledger before making a conformance
   claim.
3. reuse existing WTP transaction/replay evidence as provisional input.
4. acceptance:
   - dependency-closed WAP-201/WAP-203 rows and direct normative fixtures

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
   - canonical record: `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md`
   - gate check command: `node scripts/check-networking-profile-gates.mjs`
4. maintain an explicit local gateway E2E readiness score for:
   - `transport-rust -> Kannel -> WML server`
   - `browser -> host transport -> Kannel -> WML server`
   - canonical record: `docs/waves/TRANSPORT_E2E_READINESS_SCORECARD.md`
5. acceptance:
   - implementation gates `T0-08..T0-26` retain explicit owners/artifacts
   - exact closure gates `TRN-701`, `TRN-703`, and
     `WSP-801`/`802`/`804`/`805` pass
   - no behavior drift in transport contracts (`browser/contracts/transport.ts`, `engine-wasm/contracts/wml-engine.ts`).

### F6: Native desktop fetch activation

1. add an internal transport-mode selector at the `fetch_deck_in_process` boundary.
2. implement a narrow native executor for connectionless WSP `GET`/`REPLY` over WDP/UDP.
3. keep legacy gateway bridge path available as additive fallback.
4. prove browser-host integration without moving protocol logic into browser code.
5. acceptance:
   - desktop/browser can load baseline Kannel-served decks through the native lane
   - native mode and fallback mode are both explicit and test-backed
   - no contract changes are required for the initial slice

## 4) Known adjacent-but-deferred transport context

1. `WAP-204-WAPOverGSMUSSD` and `WAP-204_103` are deferred: transport-rewrite scope is currently protocol-layer only and these docs are bearer-adaptation specific (`docs/waves/OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md` + `T0-14`).
2. `WAP-120-WAPCachingMod` is outside the transport layer but mandatory for
   the selected user-agent profile; exact closure is owned by `WAE-603`.
3. `WAP-213*` pictogram/display adjuncts are deferred: adjacent rendering/content behavior is UX-adjacent and intentionally excluded from core WSP/WTP/WDP path (`T0-16` canonicalization + `T0-17`).
4. `WAP-175`, `WAP-227`, `WAP-231`, and `WAP-204` messaging/cache-adjacent families stay out of scope for now because they add profile-adapter behavior not yet required by transport milestones (`T0-14` profile gates + `T0-17` scope lock).
5. Bearer adaptation beyond UDP (`SMS`/`packet tunnel` variants) is deferred to gateway/adapter modules with explicit `deferred/out-of-scope` flags and not-implemented stubs.

## 5) Execution alignment with project docs

1. `docs/waves/WORK_ITEMS.md` is the execution source of truth for sequencing (`T0-08..T0-26`).
2. `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md` and `..._ADJACENT_...` are the requirement sources.
3. `docs/waves/SPEC_TEST_COVERAGE.md` hosts acceptance status and must remain synchronized on every migration gate.
4. `docs/waves/TECHNICAL_ARCHITECTURE.md` should describe transport profile states before each milestone gate.
5. `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` is the single canonical profile decision record and rollback source.
