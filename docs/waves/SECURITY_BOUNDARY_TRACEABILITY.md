# Waves Security Boundary Traceability

Version: v0.2
Status: S0-04 complete; WTLS wire/security audit refreshed 2026-07-24

## Purpose

Capture security-related requirements from WAP transport security specs and map them to the Waves policy boundary:

- where we simulate legacy behavior
- where we rely on modern secure transport in host/network layers
- what remains for full protocol-parity implementation

## Source Authority Policy

- See `docs/waves/SOURCE_AUTHORITY_POLICY.md` for normative vs supplemental source precedence and citation rules.

## Source set reviewed (S0-04)

- `spec-processing/source-material/WAP-199-WTLS-20000218-a.pdf`
- `spec-processing/source-material/WAP-261-WTLS-20010406-a.pdf`
- `spec-processing/source-material/WAP-261_100-WTLS-20010926-a.pdf`
- `spec-processing/source-material/WAP-261_101-WTLS-20011027-a.pdf`
- `spec-processing/source-material/WAP-261_102-WTLS-20011027-a.pdf`
- `spec-processing/source-material/WAP-219-TLS-20010411-a.pdf`
- `spec-processing/source-material/WAP-219_100-TLS-20011029-a.pdf`
- `spec-processing/source-material/WAP-187-TransportE2ESec-20010628-a.pdf`
- `spec-processing/source-material/WAP-187_101-TransportE2ESec-20011009-a.pdf`

## Normative precedence

1. `WAP-199` as legacy WTLS baseline reference for the pre-`WAP-261` profile lineage.
2. `WAP-261` as WTLS baseline, overlaid by `WAP-261_100/_101/_102` SIN updates.
3. `WAP-219` as TLS profile baseline, overlaid by `WAP-219_100` (SCR-table format update).
4. `WAP-187` as transport end-to-end security operational model, overlaid by `WAP-187_101` typo correction in SCR linkage.

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
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Host/proxy secure transport profile explicitly lists supported TLS features and negotiated constraints.
  - [ ] Session resume behavior and server-authentication behavior are defined in implementation policy.

### RQ-SEC-002 TLS certificate handling profile

- Requirement:
  - Client/server certificate processing follows profiled X.509 rules and associated validation expectations.
- Spec:
  - `WAP-219` 6.3 and Appendix A SCR groups (`TLS-C-03x`, `TLS-C-10x`, `TLS-S-03x`, `TLS-S-10x`)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Certificate validation policy is explicit (trusted anchors, hostname/authority checks, failure handling).
  - [ ] Client-cert behavior is feature-gated/documented if not implemented in current milestone.

### RQ-SEC-003 TLS SIN overlay application

- Requirement:
  - Apply `WAP-219_100` SCR table replacement (naming/format alignment) when mapping compliance.
- Spec:
  - `WAP-219_100` section 3
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Traceability uses updated SCR naming format from SIN.

### RQ-SEC-004 WTLS protocol feature baseline

- Requirement:
  - WTLS handshake/record/alert/cipher/MAC/key-exchange feature families are tracked and mapped to supported profile.
- Spec:
  - `WAP-199` (legacy WTLS baseline context)
  - `WAP-261` core + Appendix A static conformance groups (`WTLS-C-*`, `WTLS-S-*`)
- AC:
  - Evidence: [ ] Link WAP-261-wire-correct tests/fixtures and commands proving this requirement.
  - Prototype evidence only: `transport-rust/src/network/wtls/record.rs`, `transport-rust/src/network/wtls/alerts.rs`, `transport-rust/src/network/wtls/handshake.rs`; fixtures `transport-rust/tests/fixtures/transport/wtls_record_boundary_mapped/record_fixture.json` and `transport-rust/tests/fixtures/transport/wtls_handshake_reliability_mapped/handshake_fixture.json`; command: `cd transport-rust && cargo test --lib`
  - [x] Security implementation matrix states which WTLS feature families are:
    - simulated
    - implemented as exact WTLS
    - deferred for parity

Implementation note:

- Current baseline is explicit:
  - simulated: a stable record envelope, two-byte alert, and narrow handshake envelope
  - delegated/reused: retransmission and duplicate-message reliability policy via existing WTP logic
  - deferred: WAP-261 wire codecs, cipher/MAC/key-exchange/session crypto, certificate/trust, live secure route, and full conformance matrices
- The simulation is not a WAP-261 wire subset:
  - record content types and header structure are TLS-shaped rather than WTLS bit fields;
  - handshake framing inserts a non-spec sequence field and omits most message types;
  - alerts omit the critical level, full registry, and four-byte checksum.
- `waps://` currently selects port 9202 but sends unprotected WSP without invoking these modules.
- Pre-alpha development/interoperability profiles may retain that route only with an unavoidable
  no-WTLS warning and false authentication, confidentiality, and integrity state; release
  profiles must fail closed.
- Modern TLS is a separate direct-HTTPS security profile, not delegated WTLS behavior.
- Detailed evidence and the ordered replacement plan are in
  `docs/architecture/wtls-modernization-research.md`.

### RQ-SEC-005 WTLS server certificate constraints from SIN

- Requirement:
  - Server certificate returned during handshake must align with trusted authorities indicated by client hello, except explicit SIN-defined exception when trusted authority list is empty and non-anonymous handshake is suggested.
- Spec:
  - `WAP-261_100` section 3.3 updates to 10.5.1.2 and 10.5.2
- AC:
  - Evidence: [ ] Link certificate-selection, trust, and negative tests implementing the SIN rule.
  - [ ] Certificate-selection logic (or simulation logic) follows SIN rule and exception handling.
  - [ ] Mismatch path yields deterministic WAP-261 handshake failure behavior.

Implementation note:

- The current `T0-21` baseline does not implement Client Hello certificate identifiers,
  certificate parsing, certificate selection, or trust evaluation.
- Its generic invalid-type/shape failures are not evidence for the SIN certificate rule.
- SIN-driven certificate constraints remain deferred to the full active security lane, but the boundary and failure posture are now deterministic and test-backed.

### RQ-SEC-006 End-to-end secure proxy model behavior

- Requirement:
  - End-to-end security flow includes secure session establishment to subordinate pull proxy and certificate validation/user indication requirements.
- Spec:
  - `WAP-187` sections 7/8 and Appendix A SCRs (`E2E-*`, plus referenced `WTLS-*`)
  - `WAP-187_101` SCR typo correction (reference to `WTLS-C-191`)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Security session establishment and certificate validation steps are represented in host/transport flow.
  - [ ] User-visible secure-session indication policy is defined.
  - [ ] SCR reference uses corrected item naming from SIN (`WTLS-C-191`).

## Waves boundary decisions (current)

1. Runtime correctness first:

- Engine/runtime determinism is prioritized before full historical crypto stack parity.

2. Secure transport bridging:

- Direct HTTPS delegates secure channel establishment to a maintained modern TLS stack.
- Historical WTLS requires its own exact WAP-261 implementation and cannot be delegated to TLS.

3. Compatibility obligations:

- Any simulated/delegated behavior must still preserve user-agent observable outcomes defined by security-related specs (error/reporting/session semantics).

4. Security profile separation:

- Modern TLS is the default secure web route.
- WTLS is an opt-in, allowlisted compatibility profile.
- Clear WAP is never an automatic fallback.
- A future DTLS route is a separately named enhancement and makes no WTLS claim.
- See `docs/architecture/decisions/0002-separate-modern-security-from-wtls-compatibility.md`.

## Notes

- WTLS Appendix A contains a large SCR matrix. `WTLS-01` in the modernization research freezes a
  row-level client profile before implementation resumes.
- WAP-261 defines no AES bulk cipher. Its historical registry uses RC5, DES/3DES, and IDEA CBC;
  AES-GCM and ChaCha20-Poly1305 belong to the separate modern TLS/DTLS profile.
