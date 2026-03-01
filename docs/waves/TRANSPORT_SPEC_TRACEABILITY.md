# Waves Transport Spec Traceability

Version: v0.1  
Status: S0-02 complete (initial extraction)

## Purpose

Capture normative transport-layer requirements for the Waves protocol rewrite track and map them to implementation-ready acceptance criteria.

## Source set reviewed (S0-02)

- `docs/source-material/WAP-230-WSP-20010705-a.pdf`
- `docs/source-material/WAP-224-WTP-20010710-a.pdf`
- `docs/source-material/OMA-WAP-224_002-WTP-SIN-20020827-a.PDF`
- `docs/source-material/WAP-259-WDP-20010614-a.pdf`

## Normative precedence

1. `WAP-259` for WDP baseline and bearer adaptation constraints.
2. `WAP-224` for WTP transaction semantics and conformance.
3. `OMA-WAP-224_002` as WTP correction overlay (SAR clarification + class-field encoding fix).
4. `WAP-230` for WSP session/method/push and static conformance profile.

## Requirements matrix

Legend:

- `M` = mandatory
- `O` = optional

### RQ-TRN-001 WDP core datagram service

- Requirement:
  - Provide WDP abstract datagram service primitives and behavior to upper layers.
  - Core client/server WDP functionality must be present.
- Spec:
  - `WAP-259` 5.3, Appendix A
  - SCRs: `WDP-C-001 (M)`, `WDP-S-001 (M)`, `WDP-CORE-C-001 (M)`, `WDP-CORE-S-001 (M)`, `WDP-PF-C-001 (M)`, `WDP-PF-C-002 (M)`, `WDP-PF-S-001 (M)`, `WDP-PF-S-002 (M)`
- AC:
  - [ ] `T-DUnitdata` path works for send/receive between transport and upper layers.
  - [ ] Error indication path is defined for transport failures (`T-DError` behavior where applicable).

### RQ-TRN-002 WDP over IP must use UDP

- Requirement:
  - For bearers using IP routing, WDP datagram service is UDP (not a custom datagram protocol).
- Spec:
  - `WAP-259` section 6 (WDP datagram protocol over bearers)
- AC:
  - [ ] IP-backed bearer profile uses UDP socket/datagram semantics.
  - [ ] No alternate custom datagram framing used on IP bearers.

### RQ-TRN-003 WDP addressing and ports

- Requirement:
  - WDP must support port-based upper-layer addressing.
  - WAP registered service ports must be honored for protocol roles.
- Spec:
  - `WAP-259` 4.x, Appendix B (IANA/WAP ports)
- AC:
  - [ ] Port mapping table includes WSP/WTP secure/non-secure service ports (`9200`-`9203`) and related service ports as needed.
  - [ ] Session binding uses address/port tuple consistently.

### RQ-TRN-004 WDP payload protection and error handling

- Requirement:
  - If bearer does not provide corruption protection, WDP adaptation must provide payload protection.
  - WCMP is recommended for WDP error signaling.
- Spec:
  - `WAP-259` 4.2/4.3
  - SCRs: `WDP-C-002 (O)`, `WDP-S-002 (O)`
- AC:
  - [ ] Corruption-handling policy is explicit per bearer profile.
  - [ ] WCMP support state is declared (implemented, deferred, or bridged externally).

### RQ-TRN-005 WTP underlying datagram assumptions

- Requirement:
  - WTP requires underlying datagram service to provide at least port routing and SDU length.
- Spec:
  - `WAP-224` 5.2
- AC:
  - [ ] WTP adapter contract requires source/destination addressing + SDU length metadata.

### RQ-TRN-006 WTP transaction classes baseline

- Requirement:
  - Support transaction classes and their semantics:
    - Class 0 unreliable invoke/no result
    - Class 1 reliable invoke/no result
    - Class 2 reliable invoke + one reliable result
- Spec:
  - `WAP-224` 4.2.1, 4.2.2, 4.2.3; 6.1/6.2/6.3
  - SCRs: `WTP-C-001..006`, `WTP-S-001..006` (profile-dependent mandatory set)
- AC:
  - [ ] Class behavior fixtures validate expected ACK/result/termination rules.
  - [ ] Unsupported class behavior is deterministic and standards-aligned.

### RQ-TRN-007 WTP reliability and control functions

- Requirement:
  - Reliable transaction support includes retransmission-until-ack, abort handling, duplicate/TID handling, and timer/counter behavior.
- Spec:
  - `WAP-224` 7.1..7.12, 10
  - SCR anchors: `WTP-C-010`, `WTP-C-011`, `WTP-C-015`, `WTP-C-016`, `WTP-C-022` (+ server counterparts)
- AC:
  - [ ] Retransmission and abort conditions are bounded and observable in traces.
  - [ ] Duplicate invoke and TID verification behavior is test-covered.

### RQ-TRN-008 WTP SAR/ESAR support model

- Requirement:
  - SAR and ESAR are optional but must interoperate correctly when present.
  - Selective retransmission and packet groups follow section 7.14/7.15 semantics.
- Spec:
  - `WAP-224` 4.6, 7.14, 7.15, 10.6
  - SCR anchors: `WTP-C-020`, `WTP-C-023..026` (+ server counterparts)
- AC:
  - [ ] SAR capability negotiation/behavior is explicit per peer role.
  - [ ] Packet-group/NACK flows pass conformance fixtures for missing-segment recovery.

### RQ-TRN-009 WTP SIN clarification overlay

- Requirement:
  - Apply `OMA-WAP-224_002` clarifications:
    - SAR/non-SAR interaction behavior and flag semantics when SAR capability exists but is not used.
    - Class field encoding correction in PDU header table.
- Spec:
  - `OMA-WAP-224_002` section 3 and section 4
- AC:
  - [ ] SAR-capable vs non-SAR-capable interoperability cases are fixture-tested (both directions).
  - [ ] Class field encoding uses corrected SIN value (verify against source PDF table during implementation).

### RQ-TRN-010 WSP mode profile and stack dependency

- Requirement:
  - WSP implementation must declare connectionless vs connection-oriented mode support and satisfy mode-specific dependencies.
- Spec:
  - `WAP-230` Appendix D.1
  - SCRs: `WSP-C-001`, `WSP-CL-*`, `WSP-CO-*` root mode requirements
- AC:
  - [ ] Waves transport profile explicitly states active WSP mode(s).
  - [ ] Mode selection is consistent with available WDP/WTP capabilities.

### RQ-TRN-011 WSP connection-oriented session lifecycle

- Requirement:
  - Connection-oriented session must support connect/disconnect and optional suspend/resume behavior where profile includes it.
  - Pending method/push transactions must be aborted on disconnect/suspend transitions.
- Spec:
  - `WAP-230` 6.3, 7.1.2, 8.2.2/8.2.5
  - SCR anchors: `WSP-CO-C-002..010`, `WSP-CO-S-002..010`
- AC:
  - [ ] Session lifecycle state machine has deterministic connect/disconnect/suspend/resume transitions.
  - [ ] Outstanding transactions are aborted and surfaced consistently on session teardown/suspend.

### RQ-TRN-012 WSP method invocation/result behavior

- Requirement:
  - Support method invoke/result data flow and abort signaling semantics in active mode profile.
  - Transaction identifiers must correlate pending operations.
- Spec:
  - `WAP-230` 6.3.3, 6.4.2, 7.1.3/7.2, 8.2.3
  - SCR anchors: `WSP-CO-C-017..022`, `WSP-CL-C-004..020` (+ server-side counterparts)
- AC:
  - [ ] Invoke/result/abort primitive sequencing is covered by integration tests.
  - [ ] Multi-transaction overlap does not corrupt transaction identity mapping.

### RQ-TRN-013 WSP capability negotiation

- Requirement:
  - Capability negotiation controls enabled facilities and defaults for session behavior.
  - Unknown capabilities are ignored safely.
- Spec:
  - `WAP-230` 6.3.2, 8.3
  - SCR anchors: `WSP-CO-C-005`, `WSP-CO-C-006` (+ server equivalents)
- AC:
  - [ ] Capability negotiation results are stored in session state and applied to subsequent operations.
  - [ ] Unknown capability identifiers do not crash or desynchronize sessions.

### RQ-TRN-014 WSP encoding version and header encoding rules

- Requirement:
  - Encoding-version header behavior and header code-page rules must be followed for interoperability.
  - Unsupported binary encoding should produce standards-aligned error behavior.
- Spec:
  - `WAP-230` 8.4.2.70 and related header encoding sections
  - SCR anchors: `WSP-CO-C-014`, `WSP-CO-C-020`, `WSP-CL-C-020` (+ server equivalents)
- AC:
  - [ ] Encoding-version negotiation and fallback behavior is deterministic.
  - [ ] Unsupported encoding path yields error/status behavior defined by spec.

### RQ-TRN-015 WSP push semantics in selected profile

- Requirement:
  - If push is enabled for profile, implement push/confirmed-push and related acknowledgement rules per mode.
- Spec:
  - `WAP-230` 6.3 Push facility, 8.2.4, Appendix D
  - SCR anchors: `WSP-CO-C-010`, `WSP-CO-C-011`, `WSP-CL-C-002` (+ server counterparts)
- AC:
  - [ ] Push paths are explicitly enabled/disabled by profile.
  - [ ] Confirmed push round-trip behavior is test-covered when enabled.

## Migration phase mapping

- Phase 2 (WSP parsing in Rust): `RQ-TRN-010`..`RQ-TRN-015`
- Phase 3 (WSP session in Rust): `RQ-TRN-011`, `RQ-TRN-013`
- Phase 4 (WTP retransmission in Rust): `RQ-TRN-005`..`RQ-TRN-009`
- Phase 5 (UDP/WDP in Rust): `RQ-TRN-001`..`RQ-TRN-004`

## Notes

- The WSP/WTP/WDP conformance appendices are extensive. This document focuses on requirements that materially impact Waves' planned protocol rewrite and host/runtime integration.
- Bearer-specific adaptation matrices in `WAP-259` are tracked as profile decisions; only selected bearer paths used by Waves need implementation in initial milestones.
