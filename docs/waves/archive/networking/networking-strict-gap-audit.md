# Networking Strict Gap Audit (Implementation-Oriented)

Scope: WDP → WTP → WSP rewrite path plus WTLS optional phase path.

Inputs:
- [docs/waves/archive/networking/networking-chatgpt-full-context.md](/Users/dsteele/repos/wap-labs/docs/waves/archive/networking/networking-chatgpt-full-context.md)
- [docs/waves/archive/networking/networking-gap-analysis.md](/Users/dsteele/repos/wap-labs/docs/waves/archive/networking/networking-gap-analysis.md)
- [docs/waves/archive/networking/networking-gap-to-source-map.md](/Users/dsteele/repos/wap-labs/docs/waves/archive/networking/networking-gap-to-source-map.md)

## P0 — Blockers (cannot move to protocol-native profile)

### 1) WTP reliable transaction engine not fully implemented

- Internal evidence: [docs/waves/wtp-state-machine.md](docs/waves/wtp-state-machine.md), [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [docs/waves/networking-implementation-checklist.md](docs/waves/networking-implementation-checklist.md), [docs/waves/archive/networking/networking-gap-analysis.md](docs/waves/archive/networking/networking-gap-analysis.md)
- Missing behavior:
  - concrete retransmission timing policy (RTO/backoff/count, deterministic test profile)
  - duplicate detection/retention policy for `(peer, tid, opcode)` windows
  - NACK delay/hold-off semantics for SAR paths
- External anchors:
  - `WAP-224-WTP` sections `7.2`, `7.2.3`, `7.2.4`, `10.x`, `10.6`, Appendix B
  - `OMA-WAP-224_002-WTP-SIN` section 3/4
- transport-rust targets:
  - `transport-rust/src/network/wtp/transaction_manager.rs`
  - `transport-rust/src/network/wtp/state_machine.rs`
  - `transport-rust/src/network/wtp/retransmission.rs`
  - `transport-rust/src/network/wtp/duplicate_cache.rs`
  - `transport-rust/src/network/wtp/pdu.rs`
- Required tests:
  - `invoke_retransmit`
  - `duplicate_invoke`
  - `duplicate_result`
  - `nack_delay`
  - `abort_handling`
  - `tid_window_wrap`

### 2) WDP transport contract and UDP/ports behavior missing from protocol layer

- Internal evidence: [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md RQ-TRN-001..004](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [spec-processing/README.md](spec-processing/README.md), [spec-processing/Makefile.networking](spec-processing/Makefile.networking)
- Missing behavior:
  - explicit datagram transport trait in Rust
  - validated WAP port model with tuple-consistent dispatch
  - deterministic bearer-fragmentation/MTU handling strategy
- External anchors:
  - `WAP-259-WDP` sections `4.2`, `5.3`, `6`, `7`
- transport-rust targets:
  - `transport-rust/src/network/wdp/transport_trait.rs`
  - `transport-rust/src/network/wdp/datagram.rs`
  - `transport-rust/src/network/wdp/udp_adapter.rs`
  - `transport-rust/src/network/wdp/sar.rs`
- Required tests:
  - `port_dispatch`
  - `udp_roundtrip`
  - `mtu_drop`
  - `truncated_datagram`
  - `sar_reassembly`

### 3) WSP header token registry and unknown-token behavior is still incomplete

- Internal evidence: [docs/waves/wsp-pdu-reference.md](docs/waves/wsp-pdu-reference.md), [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md RQ-TRN-018](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [docs/waves/archive/networking/networking-gap-analysis.md](docs/waves/archive/networking/networking-gap-analysis.md)
- Missing behavior:
  - full Table 34/35/38/39 coverage
  - complete code-page shift + fallback logic
  - deterministic handling for unsupported/unknown tokens
- External anchors:
  - `WAP-230-WSP` section `8.4` and Tables `34`, `35`, `38`, `39`
  - `OMA-WAP-TS-WSP` for transport-profile clarifications
- transport-rust targets:
  - `transport-rust/src/network/wsp/headers.rs`
  - `transport-rust/src/network/wsp/header_registry.rs`
  - `transport-rust/src/network/wsp/encoder.rs`
  - `transport-rust/src/network/wsp/decoder.rs`
  - `transport-rust/src/network/wsp/pdu.rs`
- Required tests:
  - `token_encode_decode`
  - `unknown_token_fallback`
  - `code_page_shift`
  - `encoding_version_unsupported`

## P1 — Critical next

### 4) WTLS phase-0/phase-1 plan not implemented

- Internal evidence: [docs/waves/wtls-record-structure.md](docs/waves/wtls-record-structure.md), [docs/waves/networking-layer-definition.md](docs/waves/networking-layer-definition.md)
- Missing behavior:
  - transport-facing WTLS record parser/wrapper
  - alert/error mapping and handshake state transition boundaries (even minimal)
- External anchors:
  - `WAP-199-WTLS` sections `6`, `7`, `8`
- transport-rust targets:
  - `transport-rust/src/network/wtls/record.rs`
  - `transport-rust/src/network/wtls/handshake.rs`
  - `transport-rust/src/network/wtls/alerts.rs`
- Required tests:
  - `wtls_record_parse`
  - `wtls_alert_decode`
  - `wtls_handshake_sequence` (minimal path only)

### 5) Interop fixture matrix still not grounded in real captures

- Internal evidence: [docs/waves/networking-migration-readiness-checklist.md](docs/waves/networking-migration-readiness-checklist.md), [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [docs/waves/archive/networking/networking-gap-to-source-map.md](docs/waves/archive/networking/networking-gap-to-source-map.md)
- Missing behavior:
  - CONNECT/GET/REPLY canonical decode fixtures
  - retransmit/duplicate transaction fixture corpus (PCAP or equivalent capture replay)
- transport-rust targets:
  - `transport-rust/tests/network/interop/*.pcap` (or decoded fixture equivalent)
  - `transport-rust/tests/network/interop/*_expected.json`
  - harness: `transport-rust/tests/interop_replay.rs`
- Required tests:
  - `connect_session_replay`
  - `get_reply_replay`
  - `retransmit_flow`
  - `duplicate_tid_flow`

## P2 — Important hardening (after P0/P1)

### 6) Trait boundaries and error taxonomies not hardened

- Internal evidence: [docs/waves/networking-implementation-checklist.md](docs/waves/networking-implementation-checklist.md), [docs/waves/networking-layer-definition.md](docs/waves/networking-layer-definition.md)
- Missing behavior:
  - explicit protocol-layer error enums
  - explicit module/trait boundaries for layer contracts
- transport-rust targets:
  - `transport-rust/src/network/error.rs`
  - `transport-rust/src/network/traits.rs`

### 7) Parser pipeline policy for canonical source replacements

- Internal evidence: [docs/waves/archive/networking/networking-gap-analysis.md](docs/waves/archive/networking/networking-gap-analysis.md), [spec-processing/finalize-new-source-material.fish](spec-processing/finalize-new-source-material.fish)
- Missing behavior:
  - explicit diff-review gate before canonical promotion of cleaned markdown
- Targets:
  - `spec-processing/finalize-new-source-material.fish`
  - `spec-processing/Makefile.networking`

### 8) Spec precedence matrix for overlapping versions

- Internal evidence: [docs/waves/TRANSPORT_SPEC_TRACEABILITY.md](docs/waves/TRANSPORT_SPEC_TRACEABILITY.md), [docs/waves/networking-migration-readiness-checklist.md](docs/waves/networking-migration-readiness-checklist.md)
- Missing behavior:
  - explicit precedence/override table between base/overlay specs for runtime decisions
- Targets:
  - `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md` (if implemented behavior changes)
  - `docs/waves/networking-layer-definition.md`

## Recommended phase rollout

1. `wap-net-core` MVP: WDP UDP + WTP class 1/2 + WSP connectionless GET/REPLY path
2. Add WSP connection-aware baseline + profile gating
3. Add WTP SR/NACK + SAR optional lane
4. Add WTLS phase-0/phase-1 boundary with clear opt-in gate
5. Add capture/replay suite and lock migration gates (`T0-08..T0-17`) before bridge profile promotion

Suggested codex handoff prompt:

"Use these files as your strict implementation references. Implement P0 gaps first, then P1. For each gap: create concrete module/function stubs in `transport-rust/src/network/{wdp,wtp,wsp,wtls}` with typed traits/errors, wire SPEC_TEST_COVERAGE and migration ticket mapping, and add fixture-level tests for each acceptance item."

