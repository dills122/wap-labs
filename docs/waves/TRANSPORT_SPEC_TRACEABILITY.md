# Waves Transport Spec Traceability

Version: v0.3
Status: active (target-era SCR extraction and selected-path audit complete)

## Purpose

Capture normative transport-layer requirements for the Waves protocol rewrite track and map them to implementation-ready acceptance criteria.

## Source Authority Policy

- See `docs/waves/SOURCE_AUTHORITY_POLICY.md` for normative vs supplemental source precedence and citation rules.
- External vector adoption guidance is tracked separately in:
  - `docs/waves/NETWORKING_VECTOR_ADOPTION_SWEEP.md`
  - `docs/waves/networking-vector-adoption.json`

## Strict target source set

- WDP: `WAP-200` plus approved SINs `001`, `002`, `003`, `004`, and `005`
- WCMP: `WAP-202`
- WSP: `WAP-203` plus approved SINs `001`, `003`, and `005`
- WTP, conditional only: `WAP-201` plus approved SINs, if a
  connection-oriented WSP capability is claimed

The exact WDP/WCMP/WSP source rows and selected Class C dependency closure are
recorded in:

- `docs/waves/WAP_1_2_1_TRANSPORT_SCR_LEDGERS.md`
- `spec-processing/source-manifests/wap-1.2.1-wdp-scr.json`
- `spec-processing/source-manifests/wap-1.2.1-wcmp-scr.json`
- `spec-processing/source-manifests/wap-1.2.1-wsp-scr.json`

The target release source identities are governed by
`docs/waves/WAP_1_2_1_SOURCE_BASELINE.md`. Private recovered payloads remain
outside Git until redistribution is permitted.

Successor-era `WAP-259`, `WAP-224`, `WAP-230`, and OMA corrections remain
useful delta/context evidence. They cannot replace target-era authority.

## Normative precedence

1. WAP-215 selects `WDP:MCF`, `WCMP:MCF`, and `WSP:MCF` for the Class C
   client target.
2. The effective WAP-200 sequence governs WDP.
3. WAP-202 governs WCMP.
4. The effective WAP-203 sequence governs WSP; SIN 005 corrects the
   `WSP-CO-C-012` dependency expression.
5. WAP-201/WTP becomes normative only for a separately claimed
   connection-oriented WSP capability. The initial strict profile selects
   connectionless WSP over WDP and does not activate WTP.
6. Successor documents are delta/context evidence only.

The `RQ-TRN-*` groups below are implementation-oriented themes. Exact
conformance is decided by the three machine ledgers: 317 total source rows,
22 selected rows, a selected audit of 0 implemented / 17 partial / 5 missing,
and 0/22 direct normative tests.

## Requirements matrix

Legend:

- `M` = mandatory
- `O` = optional

### RQ-TRN-001 WDP core datagram service

- Requirement:
  - Provide WDP abstract datagram service primitives and behavior to upper layers.
  - Core client/server WDP functionality must be present.
- Spec:
  - effective `WAP-200` sequence, sections 3.1, 6.1, 6.3.1.1, Appendix E
  - selected SCRs: `WDP-C-001`, `WDP-CORE-C-001`, `WDP-PF-C-001`,
    `WDP-PF-C-002`, `WDP-CT-C-002`, `WDP-NA-C-000`, `WDP-NA-C-003`,
    `WDP-NA-C-006`, `WDP-NA-C-007`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] `T-DUnitdata` path works for send/receive between transport and upper layers.
  - [ ] Error indication path is defined for transport failures (`T-DError` behavior where applicable).

### RQ-TRN-002 WDP over IP must use UDP

- Requirement:
  - For bearers using IP routing, WDP datagram service is UDP (not a custom datagram protocol).
- Spec:
  - effective `WAP-200` sequence, selected CDPD-over-UDP/IP alternative
    `WDP-CT-C-002`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] IP-backed bearer profile uses UDP socket/datagram semantics.
  - [ ] No alternate custom datagram framing used on IP bearers.

### RQ-TRN-003 WDP addressing and ports

- Requirement:
  - WDP must support port-based upper-layer addressing.
  - WAP registered service ports must be honored for protocol roles.
- Spec:
  - effective `WAP-200` sequence, sections 3.1 and 6.1
  - selected rows `WDP-NA-C-003`, `WDP-NA-C-006`, and `WDP-NA-C-007`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Port mapping table includes WSP/WTP secure/non-secure service ports (`9200`-`9203`) and related service ports as needed.
  - [ ] Session binding uses address/port tuple consistently.

### RQ-TRN-004 WDP payload protection and error handling

- Requirement:
  - If bearer does not provide corruption protection, WDP adaptation must provide payload protection.
  - WCMP is recommended for WDP error signaling.
- Spec:
  - effective `WAP-200` sequence and `WAP-202`
  - selected WCMP rows are tracked in the exact WCMP ledger
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Corruption-handling policy is explicit per bearer profile.
  - [ ] WCMP support state is declared (implemented, deferred, or bridged externally).

### RQ-TRN-005 WTP underlying datagram assumptions

- Requirement:
  - WTP requires underlying datagram service to provide at least port routing and SDU length.
- Spec:
  - conditional target authority: effective `WAP-201` sequence
  - successor evidence: `WAP-224` 5.2
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] WTP adapter contract requires source/destination addressing + SDU length metadata.

### RQ-TRN-006 WTP transaction classes baseline

- Requirement:
  - Support transaction classes and their semantics:
    - Class 0 unreliable invoke/no result
    - Class 1 reliable invoke/no result
    - Class 2 reliable invoke + one reliable result
- Spec:
  - conditional target authority: effective `WAP-201` sequence
  - successor evidence: `WAP-224` 4.2.1, 4.2.2, 4.2.3; 6.1/6.2/6.3
  - SCRs: `WTP-C-001..006`, `WTP-S-001..006` (profile-dependent mandatory set)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Class behavior fixtures validate expected ACK/result/termination rules.
  - [ ] Unsupported class behavior is deterministic and standards-aligned.

### RQ-TRN-007 WTP reliability and control functions

- Requirement:
  - Reliable transaction support includes retransmission-until-ack, abort handling, duplicate/TID handling, and timer/counter behavior.
- Spec:
  - conditional target authority: effective `WAP-201` sequence
  - successor evidence: `WAP-224` 7.1..7.12, 10
  - SCR anchors: `WTP-C-010`, `WTP-C-011`, `WTP-C-015`, `WTP-C-016`, `WTP-C-022` (+ server counterparts)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Retransmission and abort conditions are bounded and observable in traces.
  - [ ] Duplicate invoke and TID verification behavior is test-covered.

### RQ-TRN-008 WTP SAR/ESAR support model

- Requirement:
  - SAR and ESAR are optional but must interoperate correctly when present.
  - Selective retransmission and packet groups follow section 7.14/7.15 semantics.
- Spec:
  - conditional target authority: effective `WAP-201` sequence
  - successor evidence: `WAP-224` 4.6, 7.14, 7.15, 10.6
  - SCR anchors: `WTP-C-020`, `WTP-C-023..026` (+ server counterparts)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] SAR capability negotiation/behavior is explicit per peer role.
  - [ ] Packet-group/NACK flows pass conformance fixtures for missing-segment recovery.

### RQ-TRN-009 WTP SIN clarification overlay

- Requirement:
  - If the successor WTP capability is offered, apply `OMA-WAP-224_002`
    clarifications:
    - SAR/non-SAR interaction behavior and flag semantics when SAR capability exists but is not used.
    - Class field encoding correction in PDU header table.
- Spec:
  - successor-only evidence: `OMA-WAP-224_002` section 3 and section 4
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] SAR-capable vs non-SAR-capable interoperability cases are fixture-tested (both directions).
  - [ ] Class field encoding uses corrected SIN value (verify against source PDF table during implementation).

### RQ-TRN-010 WSP mode profile and stack dependency

- Requirement:
  - WSP implementation must declare connectionless vs connection-oriented mode support and satisfy mode-specific dependencies.
- Spec:
  - effective `WAP-203` sequence, sections 6, 7, and 8; Appendix D
  - SCRs: `WSP-C-001`, `WSP-CL-*`, `WSP-CO-*` root mode requirements
- AC:
  - Evidence: `transport-rust/src/network/wsp/session.rs`, `transport-rust/tests/fixtures/transport/wsp_session_method_baseline_mapped/session_fixture.json`; command: `cd transport-rust && cargo test --lib`
  - [ ] Waves transport profile explicitly states active WSP mode(s).
  - [ ] Mode selection is consistent with available WDP/WTP capabilities.

### RQ-TRN-011 WSP connection-oriented session lifecycle

- Requirement:
  - Connection-oriented session must support connect/disconnect and optional suspend/resume behavior where profile includes it.
  - Pending method/push transactions must be aborted on disconnect/suspend transitions.
- Spec:
  - effective `WAP-203` sequence, 6.3, 7.1.2, 8.2.2/8.2.5
  - SCR anchors: `WSP-CO-C-002..010`, `WSP-CO-S-002..010`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Session lifecycle state machine has deterministic connect/disconnect/suspend/resume transitions.
  - [ ] Outstanding transactions are aborted and surfaced consistently on session teardown/suspend.

### RQ-TRN-012 WSP method invocation/result behavior

- Requirement:
  - Support method invoke/result data flow and abort signaling semantics in active mode profile.
  - Transaction identifiers must correlate pending operations.
- Spec:
  - effective `WAP-203` sequence, 6.3.3, 6.4.2, 7.1.3/7.2, 8.2.3
  - SCR anchors: `WSP-CO-C-017..022`, `WSP-CL-C-004..020` (+ server-side counterparts)
- AC:
  - Evidence: `transport-rust/src/network/wsp/pdu.rs`, `transport-rust/src/network/wsp/session.rs`, `transport-rust/tests/fixtures/transport/wsp_pdu_baseline_mapped/pdu_fixture.json`, `transport-rust/tests/fixtures/transport/wsp_session_method_baseline_mapped/session_fixture.json`; command: `cd transport-rust && cargo test --lib`
  - [ ] Invoke/result/abort primitive sequencing is covered by integration tests.
  - [ ] Multi-transaction overlap does not corrupt transaction identity mapping.

### RQ-TRN-013 WSP capability negotiation

- Requirement:
  - Capability negotiation controls enabled facilities and defaults for session behavior.
  - Unknown capabilities are ignored safely.
- Spec:
  - effective `WAP-203` sequence, 6.3.2 and 8.3
  - SCR anchors: `WSP-CO-C-005`, `WSP-CO-C-006` (+ server equivalents)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Capability negotiation results are stored in session state and applied to subsequent operations.
  - [ ] Unknown capability identifiers do not crash or desynchronize sessions.

### RQ-TRN-014 WSP encoding version and header encoding rules

- Requirement:
  - Encoding-version header behavior and header code-page rules must be followed for interoperability.
  - Unsupported binary encoding should produce standards-aligned error behavior.
- Spec:
  - effective `WAP-203` sequence, 8.4.1 and related 8.4 header-encoding
    sections
  - SCR anchors: `WSP-CO-C-014`, `WSP-CO-C-020`, `WSP-CL-C-020` (+ server equivalents)
- AC:
  - Evidence: `transport-rust/src/network/wsp/encoding_version.rs`, `transport-rust/src/network/wsp/header_block.rs`, `transport-rust/src/network/wsp/pdu.rs`, `transport-rust/src/network/wsp/session.rs`, `transport-rust/tests/fixtures/transport/wsp_pdu_baseline_mapped/pdu_fixture.json`, `transport-rust/tests/fixtures/transport/wsp_session_method_baseline_mapped/session_fixture.json`; command: `cd transport-rust && cargo test --lib`
  - [ ] Encoding-version negotiation and fallback behavior is deterministic.
  - [ ] Unsupported encoding path yields error/status behavior defined by spec.

### RQ-TRN-015 WSP push semantics in selected profile

- Requirement:
  - If push is enabled for profile, implement push/confirmed-push and related acknowledgement rules per mode.
- Spec:
  - effective `WAP-203` sequence, 6.3 Push facility, 8.2.4, Appendix D
  - SCR anchors: `WSP-CO-C-010`, `WSP-CO-C-011`, `WSP-CL-C-002` (+ server counterparts)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Push paths are explicitly enabled/disabled by profile.
  - [ ] Confirmed push round-trip behavior is test-covered when enabled.

### RQ-TRN-016 WTP TID window and MPL discipline

- Requirement:
  - WTP responder-side TID acceptance/replay behavior must follow window-based validation and duplicate-handling rules.
  - WTP initiator TID allocation rate must respect MPL-derived constraints.
- Spec:
  - conditional target authority: effective `WAP-201` sequence
  - successor evidence: `WAP-224` 7.8.2, 7.8.3.1
  - tables: `Table 6`, `Table 7`, `Table 8`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Responder behavior is explicit for: no-cache, TID cache present, and transport duplicate-guarantee assumptions.
  - [ ] Initiator TID increment policy includes the `2**14 steps in 2*MPL` bound and deterministic behavior on restart/wrap windows.

### RQ-TRN-017 WSP connectionless primitive profile conformance

- Requirement:
  - If connectionless mode is enabled, allowed client/server primitive occurrences must follow the WSP connectionless primitive matrix.
- Spec:
  - effective `WAP-203` sequence, 6.4.3
  - table: `Table 9` (connectionless service primitives)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Primitive occurrence matrix (`req`/`ind` only; no `res`/`cnf`) is encoded in transport profile tests.
  - [ ] Invalid primitive usage paths fail deterministically and do not desynchronize session/transaction state.

### RQ-TRN-018 WSP assigned-number registry fidelity

- Requirement:
  - WSP parsing/encoding must use spec-defined assigned-number registries for PDU types, abort reasons, well-known parameters, and header field names.
- Spec:
  - effective `WAP-203` sequence, section 8.4
  - tables: `Table 34`, `Table 35`, `Table 38`, `Table 39`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Registry token maps are fixture-backed for decode and encode paths.
  - [ ] Unknown/unassigned values map to deterministic error or ignore behavior per profile policy.

### RQ-TRN-019 WSP capability-bounds enforcement

- Requirement:
  - Negotiated capability values must follow capability semantics and enforce session limits for SDU/message size and outstanding-request counts.
- Spec:
  - effective `WAP-203` sequence, 6.3.2 and 8.3
  - tables: `Table 17`, `Table 18`, `Table 19`, `Table 20`, `Table 21`, `Table 22`, `Table 23`, `Table 24`, `Table 37`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Final negotiated values use deterministic min/intersection behavior for numeric/set capabilities.
  - [ ] Exceeded capability limits are handled with deterministic abort/error behavior and trace output.

## Migration phase mapping

- Phase 1 (Transport profile baseline + ports/wrap): `RQ-TRN-001`..`RQ-TRN-004`, `RQ-TRN-010`, `RQ-TRN-017`
- Phase 2 (conditional WTP capability only): `RQ-TRN-005`..`RQ-TRN-009`,
  `RQ-TRN-016`
- Phase 3 (WSP method semantics and optional session breadth):
  `RQ-TRN-010`..`RQ-TRN-015`, `RQ-TRN-018`, `RQ-TRN-019`
- Phase 4: post-phase integration alignment is blocked on profile gates (`T0-11`, `T0-14`) for any capability/security boundary that impacts runtime behavior.
- Migration dependency lock: `T0-08`..`T0-14` must be closed before production profile move in `TECHNICAL_ARCHITECTURE.md`.
- Profile-gate evidence reference (`T0-14`): `docs/waves/NETWORK_PROFILE_DECISION_RECORD.md` + `node scripts/check-networking-profile-gates.mjs`.

## Adjacent transport-context watchlist

The transport stack will remain stable while adjacent networking specs are explicitly deferred:

1. `WAP-204` family (WAP over GSM/USSD) is deferred because bearer-adapter semantics are profile- and carrier-specific; scope and requirements are maintained in `OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md`.
2. `WAP-120-WAPCachingMod` is outside transport ownership but active under
   `WAE-603`; `WAP-175*` cache-operation breadth remains deferred from the
   core protocol rewrite milestone.
3. `WAP-213*` (pictogram/display adjuncts) is not required for protocol-layer correctness and is deferred to rendering-adjacent tracks.
4. `WAP-227` and `WAP-231` are deferred because persistent state/EFI integrations are not needed for transport-layer milestone behavior.
5. Any future revival must open a dedicated scope ticket, update this traceability mapping, and pass `T0-14`+`T0-17` lock checks.

## Notes

- The exact ledgers, not this thematic matrix, are the selected-profile
  completion authority.
- The initial strict bearer decision is CDPD WDP over UDP/IP with IPv4. Its
  `TIAEIA-732` external source citation remains an explicit source-normalization
  action under `SRC-005`.
- Additional bearers and connection-oriented WSP/WTP are modular enhancements;
  they cannot replace or waive the 22-row strict connectionless path.
