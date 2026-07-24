# WTLS Record Structure and Security Roadmap

Status: `ACTIVE — PROTOTYPE BOUNDARY, NOT WAP-261 WIRE CONFORMANCE`
Date: `2026-07-24`

This document defines the current prototype security-layer boundary for the networking rewrite.

WTLS is optional in MVP; a deterministic no-op transport path must remain fully usable.

The modern/default versus historical compatibility decision is documented in
[`docs/architecture/wtls-modernization-research.md`](../architecture/wtls-modernization-research.md)
and
[`ADR 0002`](../architecture/decisions/0002-separate-modern-security-from-wtls-compatibility.md).

Source grounding:

- `spec-processing/source-material/WAP-199-WTLS-20000218-a.pdf`
- `spec-processing/source-material/WAP-261-WTLS-20010406-a.pdf`
- `spec-processing/source-material/WAP-261_100-WTLS-20010926-a.pdf`
- `spec-processing/source-material/WAP-261_101-WTLS-20011027-a.pdf`
- `spec-processing/source-material/WAP-261_102-WTLS-20011027-a.pdf`

## 1) Placement in stack

`WSP connectionless -> WTLS -> WDP`

or:

`WSP connection-mode -> WTP -> WTLS -> WDP`

WTLS protects the upper protocol payload before WDP bearer transport. WTP is not present in the
connectionless WSP route.

## 2) Current implementation boundary

```rust
pub enum WtlsMode {
    Disabled,
    ActiveMinimal,
}

pub struct WtlsRecordLayerPolicy {
    pub mode: WtlsMode,
    pub version_major: u8,
    pub version_minor: u8,
}
```

## 3) Prototype record frame

```text
WtlsRecord {
  content_type,
  protocol_version,
  seq_number,
  length,
  payload,
}
```

Phase A contract:

- `Disabled` mode is deterministic passthrough with no packet transformation,
- `ActiveMinimal` mode wraps payloads in a stable record envelope,
- parse/serialize boundaries remain stable and reject truncated or trailing bytes.

This envelope is test scaffolding, not a partial WAP-261 record encoding:

- it uses TLS content-type values 20-23 instead of WTLS values 1-4;
- it carries a TLS-style version pair that the WTLS record header does not contain;
- it always includes sequence and length fields instead of using the WTLS `record_type` bit
  indicators;
- it does not represent the WTLS cipher-spec bit.

## 4) MVP implementation posture

- explicit policy object controls WTLS activation,
- disabled mode is the default-safe posture,
- active-minimal mode currently covers:
  - prototype record encode/decode,
  - prototype alert encode/decode,
  - narrow prototype handshake message encode/decode,
  - handshake retransmission and duplicate handling delegated to existing WTP policies.

The prototype alert and handshake formats also differ materially from WAP-261:

- WTLS alerts include warning, critical, and fatal levels plus a four-byte checksum;
- WTLS defines a larger alert-description registry;
- a WTLS handshake header is message type plus 16-bit length, while the prototype inserts a
  sequence number;
- WTLS defines ten handshake message types and complete typed bodies.

Fixtures for this phase prove deterministic prototype behavior only.

## 5) Staged implementation plan

### Phase A (current)

- Explicit `Disabled` vs `ActiveMinimal` boundary in `transport-rust/src/network/wtls/record.rs`.
- Alert surface in `transport-rust/src/network/wtls/alerts.rs`.
- Minimal handshake framing plus reliability policy reuse in `transport-rust/src/network/wtls/handshake.rs`.
- Fixture-backed coverage:
  - `transport-rust/tests/fixtures/transport/wtls_record_boundary_mapped/record_fixture.json`
  - `transport-rust/tests/fixtures/transport/wtls_handshake_reliability_mapped/handshake_fixture.json`

### Phase B (wire-correct foundations)

- replace the prototype record, alert, and handshake encodings with exact WAP-261 forms,
- apply all three WAP-261 SIN overlays,
- implement every assigned value as recognized, supported, or policy-disabled,
- label the development/interoperability `waps://` path as unprotected with an unavoidable
  warning, and make release profiles fail closed until a verified live security outcome exists.

### Phase C (security-complete compatibility profile)

- handshake state machine,
- key exchange + session establishment,
- key-block derivation and key refresh,
- record-level authentication/encryption,
- certificate/profile trust decisions,
- renegotiation and resumptions.

## 6) Resolved research items

- WAP-261 uses a compact bit-field record header, not the current fixed prototype header.
- The bulk-cipher registry is RC5/DES/3DES/IDEA; WAP-261 defines no AES suite.
- The MAC registry uses SHA-1 and MD5 variants, including truncated outputs.
- Modern security remains a separate TLS 1.3 or future DTLS 1.3 route.
- Historical WTLS is explicit, allowlisted, disabled by default, and cannot be an automatic
  fallback.

The certificate parser, trust implementation, record protection, complete state machine, and
interop-tested suite subset remain deferred implementation work. See the ordered `WTLS-00`
through `WTLS-10` backlog in the modernization research.
