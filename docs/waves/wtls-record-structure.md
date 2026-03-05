# WTLS Record Structure and Security Roadmap

Status: `ACTIVE`
Date: `2026-03-04`

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

## 2) API contract

```rust
pub trait TlsLikeRecordLayer {
    fn wrap(&mut self, plaintext: &[u8]) -> Result<Vec<u8>, WtlsError>;
    fn unwrap(&mut self, record: &[u8]) -> Result<Vec<u8>, WtlsError>;
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
- no packet transformation in `wrap/unwrap`,
- protocol metadata is preserved and logged,
- parse/serialize boundaries remain stable.

## 4) MVP implementation posture

- compile-time/config flag controls WTLS activation,
- no-op implementation is valid and deterministic,
- transport logs `wtls.mode`, `wtls.version`, and sequence metrics for all packets.

## 5) Staged implementation plan

### Phase A (current)
- Transparent wrapper implementation.
- Alert/error surface mapping into transport errors.
- Session state stub for open/close semantics.

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
- explicit alert code mapping,
- sequence number and anti-replay policy per role.
