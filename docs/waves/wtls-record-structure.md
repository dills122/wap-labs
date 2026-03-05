# WTLS Record Structure (Draft)

Status: `DRAFT` (source-grounding in progress)
Date: `2026-03-04`

This is the staging document for WTLS in the WAP rewrite.
WTLS is optional and not required for initial WSP/WTP/WDP viability.
Source grounding:
- `spec-processing/source-material/WAP-199-WTLS-20000218-a.pdf`
- `spec-processing/source-material/WAP-261-WTLS-20010406-a.pdf`
- `spec-processing/source-material/WAP-261_100-WTLS-20010926-a.pdf`
- `spec-processing/source-material/WAP-261_101-WTLS-20011027-a.pdf`
- `spec-processing/source-material/WAP-261_102-WTLS-20011027-a.pdf`

## 1) Positioning

WTLS sits as a transport security layer between WTP and WDP when enabled:

`WSP -> WTP -> WTLS -> WDP`

This document defines a minimal contract-first shape to avoid coupling transport and security prematurely.

## 2) Target API shape

```rust
pub trait TlsLikeRecordLayer {
    fn wrap(&mut self, plaintext: &[u8]) -> Result<Vec<u8>, WtlsError>;
    fn unwrap(&mut self, record: &[u8]) -> Result<Vec<u8>, WtlsError>;
}
```

Current implementation can be a no-op shim that preserves bytes and records protocol mode.

## 3) Record model (abstract)

```text
WtlsRecord
  - content_type: enum
  - protocol_version: semver-like tuple
  - sequence_id: u32
  - length: u16
  - encrypted_payload: Vec<u8>
```

## 4) MVP implementation posture

- Provide compile-time/staging gate for WTLS use
- Keep plaintext-compatible fallback path
- Record wrapper and metadata logging are required even if cipher is not yet enabled

## 5) Deferred work for real WTLS

To unlock real security:

- handshake state machine
- key exchange and master secret derivation
- cipher suite negotiation
- record MAC/integrity and ciphering
- certificate parsing and trust policy
- renegotiation/session reuse behavior

## 6) Source-lookup checklist

- Exact WTLS record header fields and sizes
- Cipher suite identifiers and defaults
- Handshake message structure
- Alert/error handling semantics
- Session resume and closure behavior
