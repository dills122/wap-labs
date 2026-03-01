# Waves Security Boundary Traceability

Version: v0.1  
Status: S0-04 complete (initial extraction)

## Purpose

Capture security-related requirements from WAP transport security specs and map them to the Waves policy boundary:

- where we simulate legacy behavior
- where we rely on modern secure transport in host/network layers
- what remains for full protocol-parity implementation

## Source set reviewed (S0-04)

- `docs/source-material/WAP-261-WTLS-20010406-a.pdf`
- `docs/source-material/WAP-261_100-WTLS-20010926-a.pdf`
- `docs/source-material/WAP-261_101-WTLS-20011027-a.pdf`
- `docs/source-material/WAP-261_102-WTLS-20011027-a.pdf`
- `docs/source-material/WAP-219-TLS-20010411-a.pdf`
- `docs/source-material/WAP-219_100-TLS-20011029-a.pdf`
- `docs/source-material/WAP-187-TransportE2ESec-20010628-a.pdf`
- `docs/source-material/WAP-187_101-TransportE2ESec-20011009-a.pdf`

## Normative precedence

1. `WAP-261` as WTLS baseline, overlaid by `WAP-261_100/_101/_102` SIN updates.
2. `WAP-219` as TLS profile baseline, overlaid by `WAP-219_100` (SCR-table format update).
3. `WAP-187` as transport end-to-end security operational model, overlaid by `WAP-187_101` typo correction in SCR linkage.

## Requirements matrix

Legend:

- `M` = mandatory
- `O` = optional

### RQ-SEC-001 TLS profile baseline for secure HTTP transport

- Requirement:
  - Conform to TLS 1.0 profile baseline and implement required cipher/auth/session behavior in profiled contexts.
- Spec:
  - `WAP-219` section 6, Appendix A
  - SCR anchors: `TLS-001`, `TLS-C-*`, `TLS-S-*`
- AC:
  - [ ] Host/proxy secure transport profile explicitly lists supported TLS features and negotiated constraints.
  - [ ] Session resume behavior and server-authentication behavior are defined in implementation policy.

### RQ-SEC-002 TLS certificate handling profile

- Requirement:
  - Client/server certificate processing follows profiled X.509 rules and associated validation expectations.
- Spec:
  - `WAP-219` 6.3 and Appendix A SCR groups (`TLS-C-03x`, `TLS-C-10x`, `TLS-S-03x`, `TLS-S-10x`)
- AC:
  - [ ] Certificate validation policy is explicit (trusted anchors, hostname/authority checks, failure handling).
  - [ ] Client-cert behavior is feature-gated/documented if not implemented in current milestone.

### RQ-SEC-003 TLS SIN overlay application

- Requirement:
  - Apply `WAP-219_100` SCR table replacement (naming/format alignment) when mapping compliance.
- Spec:
  - `WAP-219_100` section 3
- AC:
  - [ ] Traceability uses updated SCR naming format from SIN.

### RQ-SEC-004 WTLS protocol feature baseline

- Requirement:
  - WTLS handshake/record/alert/cipher/MAC/key-exchange feature families are tracked and mapped to supported profile.
- Spec:
  - `WAP-261` core + Appendix A static conformance groups (`WTLS-C-*`, `WTLS-S-*`)
- AC:
  - [ ] Security implementation matrix states which WTLS feature families are:
    - simulated
    - delegated to modern TLS
    - deferred for parity

### RQ-SEC-005 WTLS server certificate constraints from SIN

- Requirement:
  - Server certificate returned during handshake must align with trusted authorities indicated by client hello, except explicit SIN-defined exception when trusted authority list is empty and non-anonymous handshake is suggested.
- Spec:
  - `WAP-261_100` section 3.3 updates to 10.5.1.2 and 10.5.2
- AC:
  - [ ] Certificate-selection logic (or simulation logic) follows SIN rule and exception handling.
  - [ ] Mismatch path yields deterministic handshake failure behavior.

### RQ-SEC-006 End-to-end secure proxy model behavior

- Requirement:
  - End-to-end security flow includes secure session establishment to subordinate pull proxy and certificate validation/user indication requirements.
- Spec:
  - `WAP-187` sections 7/8 and Appendix A SCRs (`E2E-*`, plus referenced `WTLS-*`)
  - `WAP-187_101` SCR typo correction (reference to `WTLS-C-191`)
- AC:
  - [ ] Security session establishment and certificate validation steps are represented in host/transport flow.
  - [ ] User-visible secure-session indication policy is defined.
  - [ ] SCR reference uses corrected item naming from SIN (`WTLS-C-191`).

## Waves boundary decisions (current)

1. Runtime correctness first:
- Engine/runtime determinism is prioritized before full historical crypto stack parity.

2. Secure transport bridging:
- Current architecture may delegate secure channel establishment to modern transport stack while preserving legacy observable semantics at runtime boundaries.

3. Compatibility obligations:
- Any simulated/delegated behavior must still preserve user-agent observable outcomes defined by security-related specs (error/reporting/session semantics).

## Notes

- WTLS Appendix A contains a large SCR matrix. This document captures Waves-relevant boundary obligations first; per-feature WTLS parity tables can be expanded in a follow-up if/when full native WTLS implementation is scheduled.
