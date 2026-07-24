# ADR 0002: Separate Modern Transport Security from WTLS Compatibility

Date: 2026-07-24
Status: proposed

## Context

Waves needs secure modern browser behavior and historically accurate WAP-261 interoperability.
These goals cannot be satisfied by one automatically negotiated cipher list:

- WAP-261 defines RC5, DES/3DES, and IDEA CBC suites with SHA-1 or MD5 MAC variants;
- WAP-261 defines no AES suite;
- WTLS records, handshakes, alerts, certificates, and key derivation are wire-incompatible with
  TLS and DTLS;
- AES remains a current cipher, while TLS 1.3 uses modern AEAD modes such as AES-GCM and
  ChaCha20-Poly1305;
- the current `waps://` path selects port 9202 but sends unprotected WSP.

## Decision

Adopt explicit, non-downgrading security profiles.

1. Direct `https://` uses the maintained Rustls-backed HTTP path and is the modern default.
2. WAP-261 WTLS is implemented as a separate `WtlsCompatibility` profile.
3. The WTLS profile is disabled by default and enabled only for an explicit gateway profile and
   suite allowlist.
4. Secure failure never automatically selects WTLS, clear WAP, export crypto, anonymous key
   exchange, null protection, or a truncated MAC.
5. An explicit development/interoperability setting may keep the current unprotected `waps://`
   path available while WTLS is deferred, but it reports no established security, emits an
   unavoidable warning, and blocks credentials and sensitive submissions by default.
6. Release profiles fail closed for `waps://` until a verified live WTLS profile exists.
7. A future modern datagram route evaluates DTLS 1.3 under a distinct name and route identifier.
8. Every successful secure response reports a verified `SecurityOutcome`, including negotiated
   protocol, suite, peer identity, authentication, confidentiality, integrity, and legacy state.
9. WTLS conformance coverage distinguishes assigned-value recognition from algorithms permitted
   to execute in a shipping browser.

## Why

- It preserves exact WAP-261 behavior where interoperability requires it.
- It keeps obsolete algorithms out of the default product security posture.
- It avoids inventing a private "modern WTLS" that historical gateways cannot understand.
- It reuses maintained TLS cryptography instead of implementing TLS primitives in Lowband.
- It prevents network-triggered downgrade.
- It keeps pre-alpha WAP testing available without confusing test transport with real security.
- It allows the browser, SDK, CLI, and interop tooling to apply different explicit policies over
  the same protocol implementation.

## Consequences

Positive:

- modern users receive modern TLS without losing historical WTLS coverage;
- WTLS can be packet-accurate without being misrepresented as current-grade security;
- export/null/anonymous behavior can be tested without being generally enabled;
- future DTLS work cannot accidentally claim WAP-261 interoperability;
- security state becomes visible and testable at the host contract.

Costs:

- the product maintains separate modern-TLS and legacy-WTLS policy paths;
- WTLS still requires substantial wire, state-machine, certificate, and cryptographic work;
- compatibility configuration and warning UX become required product surfaces;
- independent cryptographic review is required before enabling WTLS for real user traffic.

## Rejected alternatives

### Add AES-GCM or ChaCha20-Poly1305 to the WAP-261 cipher registry

Rejected because it is a private extension, not historical WTLS compliance, and requires both
endpoints to implement the new assignment and record-protection semantics.

### Treat TLS or DTLS as a transparent WTLS implementation

Rejected because the protocols are wire-incompatible. TLS remains the direct HTTPS solution;
DTLS may become a new controlled datagram solution.

### Automatically fall back to legacy security

Rejected because an attacker or network fault could force weaker security.

### Enable all WTLS algorithms to maximize compatibility

Rejected for the shipping browser. Lowband may recognize all assigned values and provide an
explicit archival interop build, while the runtime compatibility profile remains allowlisted.

## Acceptance conditions

- [ ] Development/interoperability `waps://` emits an unavoidable no-WTLS warning, reports no
      protection, and blocks credentials and sensitive submissions by default.
- [ ] Release profiles cannot send plaintext for `waps://`.
- [ ] Direct HTTPS uses the maintained TLS implementation and exposes negotiated security state.
- [ ] WTLS uses exact WAP-261 records, handshakes, alerts, and SIN overlays.
- [ ] Legacy WTLS activation is explicit and gateway-scoped.
- [ ] No failed secure request changes security profile automatically.
- [ ] Assigned-but-disabled algorithms produce deterministic policy errors.
- [ ] Credentials default to blocked on plain and legacy routes.
- [ ] DTLS, if added, has a distinct profile and makes no WTLS compliance claim.
- [ ] Independent review approves any production WTLS release.

## Detailed research

See
[`docs/architecture/wtls-modernization-research.md`](../wtls-modernization-research.md).
