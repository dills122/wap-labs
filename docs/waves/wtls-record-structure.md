# WTLS Record Structure and Security Roadmap

Status: `ACTIVE`
Date: `2026-03-06`

This document defines the security layer contract for the networking rewrite.

WTLS is optional in MVP; a deterministic no-op transport path must remain fully usable.

Source grounding:
- `spec-processing/source-material/WAP-199-WTLS-20000218-a.pdf`
- `spec-processing/source-material/WAP-261-WTLS-20010406-a.pdf`
- `spec-processing/source-material/WAP-261_100-WTLS-20010926-a.pdf`
- `spec-processing/source-material/WAP-261_101-WTLS-20011027-a.pdf`
- `spec-processing/source-material/WAP-261_102-WTLS-20011027-a.pdf`

## 1) Placement in stack

`WSP -> WTP -> WTLS -> WDP`

If enabled, WTLS wraps WTP payloads before WDP framing.

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

## 3) Record frame

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

## 4) MVP implementation posture

- explicit policy object controls WTLS activation,
- disabled mode is the default-safe posture,
- active-minimal mode currently covers:
  - record encode/decode,
  - alert encode/decode,
  - narrow handshake message encode/decode,
  - handshake retransmission and duplicate handling delegated to existing WTP policies.

## 5) Staged implementation plan

### Phase A (current)
- Explicit `Disabled` vs `ActiveMinimal` boundary in `transport-rust/src/network/wtls/record.rs`.
- Alert surface in `transport-rust/src/network/wtls/alerts.rs`.
- Minimal handshake framing plus reliability policy reuse in `transport-rust/src/network/wtls/handshake.rs`.
- Fixture-backed coverage:
  - `transport-rust/tests/fixtures/transport/wtls_record_boundary_mapped/record_fixture.json`
  - `transport-rust/tests/fixtures/transport/wtls_handshake_reliability_mapped/handshake_fixture.json`

### Phase B (security-complete)
- handshake state machine,
- key exchange + session establishment,
- key-block derivation and key refresh,
- record-level authentication/encryption,
- certificate/profile trust decisions,
- renegotiation and resumptions.

## 6) Deferred precision items

- exact WTLS field bit layout,
- exact cipher/cipher-suite matrix,
- certificate chain parsing and trust-anchor selection,
- record-level authentication/encryption,
- sequence number and anti-replay policy per role beyond reused WTP duplicate policy.
