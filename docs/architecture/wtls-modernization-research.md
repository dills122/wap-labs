# WTLS Compatibility and Modern Transport Security Research

Date: 2026-07-24
Status: research recommendation
Compatibility target: WAP 1.2.1 with WML 1.3
Implementation target: Lowband transport in `transport-rust`

## Executive decision

Use two separate security lanes:

1. **Modern transport security is the default.** Direct `https://` uses a maintained TLS
   implementation with TLS 1.3 preferred, authenticated encryption, current certificate
   validation, and no legacy WTLS algorithms.
2. **Historical WTLS is an explicit compatibility profile.** It implements the WAP-261 wire
   protocol and selected conformance requirements exactly, but is disabled by default, scoped to
   an allowlisted WAP gateway, and visibly reported as legacy security.

Do not silently fall back from modern TLS to WTLS, from WTLS to clear WAP, or from a stronger
WTLS suite to an export suite after a failed handshake.

If a modern secure datagram route is eventually required between two Lowband-controlled peers,
evaluate DTLS 1.3 as a separate protocol profile. It must not be called standards-compliant WTLS
and it will not interoperate with historical WAP gateways.

## The AES correction

AES is not the obsolete part of historical WTLS:

- WAP-261 defines no AES cipher.
- Its bulk-encryption registry contains `NULL`, RC5-CBC, DES-CBC, 3DES-CBC-EDE, and IDEA-CBC
  variants.
- AES remains a current NIST standard with 128-, 192-, and 256-bit keys.
- The current TLS 1.3 specification requires implementations to support
  `TLS_AES_128_GCM_SHA256` and recommends AES-256-GCM and ChaCha20-Poly1305 support.

There is therefore no historically accurate "legacy AES mode" for this target. The historical
fallback is WTLS with its original algorithms and wire behavior. The modern mode is TLS 1.3, or
potentially DTLS 1.3 for a new controlled datagram route.

## Source authority and review ledger

Repository source authority follows
[`docs/waves/SOURCE_AUTHORITY_POLICY.md`](../waves/SOURCE_AUTHORITY_POLICY.md).

| Source                            | Class                              | Use in this decision                                                 |
| --------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `WAP-261-WTLS-20010406-a.pdf`     | Normative historical               | WTLS record, alert, handshake, algorithms, classes, and SCR baseline |
| `WAP-261_100-WTLS-20010926-a.pdf` | Normative historical overlay       | Server-certificate selection and trusted-authority clarification     |
| `WAP-261_101-WTLS-20011027-a.pdf` | Normative historical overlay       | Public-key hash calculation clarification                            |
| `WAP-261_102-WTLS-20011027-a.pdf` | Normative historical overlay       | Certificate-request key-identifier correction                        |
| NIST FIPS 197-upd1                | Current cryptographic standard     | AES status and key sizes                                             |
| RFC 9846                          | Current Internet standard          | TLS 1.3 protocol and cipher-suite baseline; obsoletes RFC 8446       |
| RFC 9325 / BCP 195                | Current operational guidance       | Version, cipher, and downgrade policy                                |
| RFC 8439                          | Current cryptographic construction | ChaCha20-Poly1305 and software-efficiency rationale                  |
| RFC 9147, updated by RFC 9853     | Current Internet standard          | Optional future secure datagram profile                              |
| NIST SP 800-52 Rev. 2             | Current guidance under review      | TLS configuration and TLS 1.3 adoption context                       |
| NIST SP 800-131A Rev. 2           | Current transition guidance        | Legacy algorithm transition context                                  |

The local WAP corpus contains the WAP-261 baseline and all three identified WTLS SIN overlays.
No additional WAP-261 algorithm overlay was found in the reviewed corpus.

## What WAP-261 actually specifies

### Protocol shape

WAP-261 describes a WTLS protocol version value of `1` and says the current specification covers
WTLS implementation Class 1. WTLS is similar in purpose to TLS 1.0 but changes the wire protocol
for constrained and datagram transports.

Important differences from TLS include:

- a compact bit-field record header;
- optional record length;
- explicit 16-bit sequence numbers required over datagrams;
- transport-layer fragmentation rather than TLS record fragmentation;
- handshake retransmission and message concatenation rules for lossy datagrams;
- dynamic key refresh;
- WTLS-optimized certificates and trust identifiers;
- different algorithm registries and a 20-byte WTLS `master_secret`;
- a three-level alert model with a four-byte checksum.

WTLS is not TLS with smaller packets. TLS or Rustls records cannot be placed on WAP secure ports
and expected to interoperate.

### Key-exchange registry

WAP-261 Appendix A assigns the following key-exchange families:

- `NULL` and `SHARED_SECRET`;
- anonymous finite-field DH, including 512- and 768-bit-limited forms;
- anonymous RSA, including 512- and 768-bit-limited forms;
- authenticated RSA, including 512- and 768-bit-limited forms;
- anonymous ECDH with compressed or uncompressed points and limited-size forms;
- authenticated `ECDH_ECDSA` with compressed or uncompressed points.

Several choices are anonymous, export-limited, use small parameters, or rely on historical
certificate and signature rules. Recognition of an assigned value is not permission to negotiate
it in the shipping browser.

### Bulk-encryption registry

| Assigned value | WAP-261 name   | Effective key bits | Modern product policy                                     |
| -------------: | -------------- | -----------------: | --------------------------------------------------------- |
|              0 | `NULL`         |                  0 | Never accepted for a request requiring security           |
|              1 | `RC5_CBC_40`   |                 40 | Parse/diagnose only; archival interop build at most       |
|              2 | `RC5_CBC_56`   |                 56 | Parse/diagnose only; archival interop build at most       |
|              3 | `RC5_CBC`      |                128 | Legacy WTLS provider only, if required by interop profile |
|              4 | `DES_CBC_40`   |                 40 | Parse/diagnose only; archival interop build at most       |
|              5 | `DES_CBC`      |                 56 | Parse/diagnose only; archival interop build at most       |
|              6 | `3DES_CBC_EDE` |     112-equivalent | Legacy WTLS provider only, if required by interop profile |
|              7 | `IDEA_CBC_40`  |                 40 | Parse/diagnose only; archival interop build at most       |
|              8 | `IDEA_CBC_56`  |                 56 | Parse/diagnose only; archival interop build at most       |
|              9 | `IDEA_CBC`     |                128 | Legacy WTLS provider only, if required by interop profile |
|             10 | `RC5_CBC_64`   |                 64 | Parse/diagnose only; archival interop build at most       |
|             11 | `IDEA_CBC_64`  |                 64 | Parse/diagnose only; archival interop build at most       |

The specification itself warns that 40-bit ciphers are highly susceptible to exhaustive search
and ideally should not be supported. All defined non-null ciphers use CBC with an eight-byte block
size and separate MAC-then-encrypt processing. None is a modern AEAD construction.

### MAC registry

| Assigned value | WAP-261 name |            Output used | Modern product policy                           |
| -------------: | ------------ | ---------------------: | ----------------------------------------------- |
|              0 | `SHA_0`      |                0 bytes | Never accepted for a request requiring security |
|              1 | `SHA_40`     |  5 bytes of HMAC-SHA-1 | Archival compatibility only                     |
|              2 | `SHA_80`     | 10 bytes of HMAC-SHA-1 | Legacy compatibility only                       |
|              3 | `SHA`        | 20 bytes of HMAC-SHA-1 | Legacy compatibility only                       |
|              4 | Removed      |                    N/A | Reject deterministically                        |
|              5 | `MD5_40`     |    5 bytes of HMAC-MD5 | Archival compatibility only                     |
|              6 | `MD5_80`     |   10 bytes of HMAC-MD5 | Archival compatibility only                     |
|              7 | `MD5`        |   16 bytes of HMAC-MD5 | Archival compatibility only                     |

WAP-261 makes `SHA` support mandatory in the client and server SCR tables and recommends
`SHA_80` in preference to the full-length form. That historical interoperability rule must not be
misrepresented as modern security advice.

### Minimum conformance work is larger than crypto

A useful WTLS client is not achieved by adding a cipher to the current record wrapper. The
WAP-261 client SCR includes mandatory behavior across:

- full and abbreviated handshakes;
- record concatenation and reliable handshake behavior;
- explicit sequence numbering and duplicate removal;
- key refresh;
- critical and fatal alerts plus alert checksums;
- Change Cipher Spec and application data;
- at least one anonymous key-exchange option;
- at least one server-authenticated option and certificate verification;
- encryption and MAC behavior;
- non-null defaults and rejection of unsolicited null key exchange.

The three SINs also alter certificate-selection and identifier behavior and must be applied before
interop claims are made.

## Current Lowband audit

### What is already suitable for the modern lane

- `reqwest` is built with its Rustls TLS backend.
- Direct `https://` requests already use that maintained TLS stack.
- The current dependency graph includes Rustls, Ring, WebPKI, and secret-zeroization support.
- Modern TLS therefore does not require Lowband to implement AES, ChaCha20, certificate path
  validation, or the TLS handshake itself.

The browser should continue to use the maintained TLS library and expose the negotiated result.
Lowband must not create a home-grown TLS implementation.

### What the current WTLS modules are

The files under `transport-rust/src/network/wtls/` are useful prototype boundaries, but are not
WAP-261 wire implementations:

| Surface             | Current prototype                    | WAP-261 requirement                                                              |
| ------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| Record content type | TLS values 20-23                     | WTLS values 1-4 in bits 4-7 of `record_type`                                     |
| Record header       | Fixed type/version/sequence/length   | Bit-field type with optional sequence and length; no TLS-style version pair      |
| Handshake header    | Type, sequence, length               | Type and 16-bit length; sequencing belongs to the WTLS record                    |
| Handshake messages  | Client Hello, Server Hello, Finished | Ten defined handshake message types and their complete bodies                    |
| Alert               | Two bytes and two levels             | Six bytes, warning/critical/fatal, full description registry, four-byte checksum |
| Record protection   | Plain payload wrapper                | MAC, CBC protection, padding, key derivation, refresh, and replay handling       |
| Trust               | None                                 | WTLS/X.509 certificate parsing, trust selection, validation, and SIN overlays    |

The fixtures prove deterministic behavior of this prototype envelope. They do not prove WTLS
wire conformance.

### What the live `waps://` route does

The current native fetch path:

1. selects UDP port 9202 for `waps://`;
2. encodes the same connectionless WSP payload used by `wap://`;
3. sends it directly through the WDP UDP adapter;
4. never invokes the prototype WTLS modules.

The current route is therefore unencrypted. During pre-alpha development and interoperability
testing, it may remain available through an explicit non-production test posture, but every
request must report that WTLS is unavailable and that authentication, confidentiality, and
integrity protection are all absent. Credentials and sensitive submissions remain blocked.
Release profiles must fail closed until a real security profile exists.

## Target security profiles

### `ModernWeb`

Purpose:

- normal installed-browser access to `https://` WML/WMLC origins;
- secure default for user credentials and sensitive deck data.

Policy:

- use Rustls through the existing HTTP client;
- prefer TLS 1.3;
- support only maintained modern TLS configurations;
- allow the TLS implementation to negotiate AES-128-GCM, AES-256-GCM, or
  ChaCha20-Poly1305;
- use the platform/product trust policy and normal authority verification;
- return the negotiated protocol, cipher suite, peer identity, and validation result.

AES-128-GCM is the TLS 1.3 mandatory-to-implement baseline and is efficient on systems with AES
acceleration. ChaCha20-Poly1305 provides an efficient independent option on systems without
specialized AES hardware. Both should be available; Lowband should not hard-code AES-256 as the
only or universally "best" choice.

### `WtlsCompatibility`

Purpose:

- packet-accurate interoperability with historical WAP gateways;
- WAP-261 conformance and preservation of original behavior.

Policy:

- separate Cargo capability such as `wtls-compat`;
- disabled by default at runtime;
- enabled only for an explicit gateway profile;
- no automatic activation after a TLS, DTLS, WSP, or HTTP failure;
- negotiated suite restricted by a per-profile allowlist;
- export, null, anonymous, and truncated-MAC options independently controllable;
- user-visible legacy-security state;
- credentials and sensitive submissions blocked unless the user or administrator explicitly
  permits them for that profile;
- independent security review before a production security claim.

For near-complete historical coverage, Lowband should recognize every assigned algorithm and
produce deterministic unsupported-policy errors. Executable crypto can be delivered in tiers:

1. **Interop tier:** the smallest strong-historical subset demonstrated by target gateways.
2. **Extended compatibility tier:** additional non-export suites required by captured devices.
3. **Archival tier:** export, null, anonymous, and other intentionally unsafe combinations,
   available only in a non-production interop tool build.

This separates specification coverage from unsafe default negotiation.

### `PlainWap`

Purpose:

- historically accurate unencrypted `wap://` traffic where explicitly selected.

Policy:

- never presented as secure;
- no automatic fallback from either secure profile;
- prominent transport state;
- credentials disabled by default;
- destination and gateway still explicitly configured.

### Development/interoperability exception

Purpose:

- keep current WAP transport and browser testing unblocked while WTLS is deferred.

Policy:

- available only through an explicit development/interoperability setting;
- permits the current unprotected `waps://` exchange without representing it as WTLS;
- emits an unavoidable warning in the request result and browser security state;
- reports no established security protocol and sets authentication, confidentiality, and
  integrity protection to false;
- blocks credentials, cookies marked secure, and sensitive form submissions by default;
- never activates because a secure negotiation failed;
- is prohibited by release configuration and verified by a release-gate test.

This is a temporary testing exception, not a compatibility mode or security implementation.

### `ModernDatagram` (future option)

Purpose:

- efficient authenticated datagram transport between endpoints controlled by this project or a
  cooperating integrator.

Policy:

- evaluate DTLS 1.3 rather than inventing new WTLS record protection;
- give it a new route/profile identifier;
- do not use WAP secure service ports as if it were WTLS;
- require both endpoints to opt into the same protocol;
- preserve WSP payload semantics only if the product has a concrete WSP-over-DTLS use case.

This is an enhancement lane, not a WAP-261 compliance lane.

## Contract direction

The public contract should report the selected policy and the verified outcome separately:

```rust
pub enum SecurityProfile {
    ModernWeb,
    WtlsCompatibility {
        gateway_profile_id: String,
    },
    PlainWap,
    ModernDatagram,
}

pub enum LegacyWtlsPolicy {
    Deny,
    AllowListed {
        allowed_key_exchanges: Vec<WtlsKeyExchange>,
        allowed_bulk_ciphers: Vec<WtlsBulkCipher>,
        allowed_macs: Vec<WtlsMac>,
        allow_anonymous: bool,
        allow_export_strength: bool,
        allow_null_protection: bool,
    },
}

pub struct SecurityOutcome {
    pub requested_profile: SecurityProfile,
    pub established_protocol: Option<String>,
    pub negotiated_suite: Option<String>,
    pub peer_identity: Option<String>,
    pub authenticated: bool,
    pub confidential: bool,
    pub integrity_protected: bool,
    pub legacy: bool,
    pub warnings: Vec<SecurityWarning>,
}
```

These are design shapes, not yet stable public API types. Contract changes must begin in exported
Rust types and flow through the generated browser transport contract.

Required invariants:

1. A release profile cannot produce a successful response for a secure scheme unless
   `authenticated`, `confidential`, and `integrity_protected` match the selected policy.
2. The development/interoperability exception is explicit, reports all three protections as
   false, displays an unavoidable warning, and never claims WTLS was established.
3. A failed secure handshake is a terminal security error, not a route-selection hint.
4. Changing from `ModernWeb` to `WtlsCompatibility`, `PlainWap`, or the testing exception
   requires explicit policy or a direct user action.
5. Session resumption state and credentials cannot cross profiles or gateway identities.
6. The browser displays the negotiated result, not merely the requested scheme.
7. Security traces redact secrets, key material, credential values, and sensitive deck data.

## Crypto implementation boundary

### Modern TLS

Use Rustls through a maintained HTTP/TLS integration. Let the library own:

- TLS negotiation and downgrade protection;
- AEAD implementation;
- key exchange and key schedule;
- certificate parsing and path validation;
- record limits and key update;
- constant-time and platform-specific cryptographic implementation details.

Lowband owns route policy, destination validation, trust-store selection, reporting, and
application limits.

### Legacy WTLS

WTLS needs its own protocol implementation because its records, handshakes, certificates, key
schedule, and algorithms are wire-incompatible with TLS.

Separate the state machine from cryptographic primitives:

```rust
trait WtlsCryptoProvider {
    fn random_bytes(&self, output: &mut [u8]) -> Result<(), WtlsCryptoError>;
    fn prf(&self, input: WtlsPrfInput<'_>) -> Result<SecretBytes, WtlsCryptoError>;
    fn mac(&self, input: WtlsMacInput<'_>) -> Result<Vec<u8>, WtlsCryptoError>;
    fn encrypt_record(&self, input: WtlsEncryptInput<'_>) -> Result<Vec<u8>, WtlsCryptoError>;
    fn decrypt_record(&self, input: WtlsDecryptInput<'_>) -> Result<SecretBytes, WtlsCryptoError>;
    fn key_exchange(&self, input: WtlsKeyExchangeInput<'_>)
        -> Result<SecretBytes, WtlsCryptoError>;
}
```

The provider boundary must not make unsafe algorithms appear interchangeable with modern TLS.
Legacy algorithms should be compiled and enabled only where the compatibility profile requires
them.

Implementation rules:

- use audited library primitives where a compatible implementation exists;
- do not hand-write AES, RC5, DES, IDEA, hash, or big-integer primitives;
- obtain entropy from the operating system;
- zeroize WTLS master secrets, pre-master secrets, traffic keys, MAC secrets, and decrypted secret
  buffers;
- use constant-time comparisons for MACs, Finished values, and key identifiers;
- authenticate before accepting a sequence number into the replay window;
- avoid distinguishable padding/MAC errors;
- bound every record, vector, certificate, chain, retransmission buffer, and session cache;
- keep protocol parsing free of secret-dependent control flow where practical;
- treat all WTLS input as hostile.

## Downgrade and fallback rules

The product may offer compatibility, but it must not offer opportunistic downgrade.

Forbidden:

- retrying failed HTTPS as WTLS;
- retrying failed WTLS as clear WAP;
- adding export or null suites after a handshake failure;
- accepting a server-selected suite that was not offered;
- accepting `NULL` key exchange unless the client explicitly requested it;
- preserving a session established under a different security profile;
- hiding a downgrade warning in diagnostics only.

Allowed:

- the user selects a saved historical WAP gateway profile;
- an administrator provisions a gateway-specific WTLS suite allowlist;
- an interop tool enables an archival profile with an unavoidable warning and no credential
  storage;
- the user deliberately retries a resource over a different route after seeing the security
  consequence.

## Work program

WTLS implementation remains deferred behind the native-browser and live WSP/WTP work, but the
research produces the following ordered backlog.

| ID      | Work item                                         | Output / exit condition                                                                                                              |
| ------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| WTLS-00 | Label insecure `waps://` testing and gate release | Development/interoperability requests return an unavoidable no-WTLS warning and false protection state; release profiles fail closed |
| WTLS-01 | Freeze WAP-261 + SIN requirement matrix           | Client SCR rows, section anchors, selected class/profile, and evidence targets                                                       |
| WTLS-02 | Replace prototype record/alert codecs             | Exact bit-field record, concatenation, sequence, checksum, and full alert registry fixtures                                          |
| WTLS-03 | Implement complete handshake values and FSM       | Full/abbreviated flows, ordering, retransmission, duplicates, and negative transitions                                               |
| WTLS-04 | Define session and replay state                   | Address/port association, explicit sequence window, key refresh, resume, and teardown                                                |
| WTLS-05 | Implement certificate and trust profile           | WTLS certificate plus selected X.509 behavior with all three SIN overlays                                                            |
| WTLS-06 | Add isolated legacy crypto provider               | OS RNG, secret lifecycle, PRF/MAC/key schedule, selected non-export suites, known-answer tests                                       |
| WTLS-07 | Add archival algorithm registry                   | Every assigned value recognized; unsupported and intentionally disabled outcomes tested                                              |
| WTLS-08 | Integrate live secure routes                      | Port 9202/9203 paths call the same conformance-tested WTLS codecs and return `SecurityOutcome`                                       |
| WTLS-09 | Build interop corpus                              | Kannel plus an independent implementation/capture set; packet loss, replay, malformed, and resume cases                              |
| WTLS-10 | Independent review and product gate               | Cryptographic review, fuzzing, side-channel review, security UX, and release decision                                                |
| WTLS-X1 | Evaluate DTLS 1.3 separately                      | Library maturity, footprint, WSP mapping, endpoint use case, and explicit non-WTLS naming                                            |

Do not start `WTLS-06` by choosing algorithms first. `WTLS-01` through `WTLS-05` determine the
actual wire, trust, and interoperability requirements the provider must satisfy.

## Verification strategy

Historical conformance evidence should include:

- byte-exact record, alert, and handshake golden fixtures;
- all assigned algorithm and alert values, including deterministic rejection;
- WAP-261 PRF, MAC, key-block, IV, key-refresh, and CBC known-answer vectors;
- full and abbreviated handshake transcript fixtures;
- certificate and public-key identifier vectors incorporating all SIN corrections;
- explicit sequence, replay-window, duplicate, wrap, loss, and reordering tests;
- null, anonymous, export, weak-MAC, bad-padding, bad-MAC, and invalid-certificate negatives;
- differential packet captures against at least two independent oracles where possible;
- parser/state-machine fuzzing and resource-exhaustion tests;
- redaction tests proving secrets never enter traces or serialized errors.

Modern security evidence should include:

- TLS version and negotiated-suite reporting;
- normal certificate, hostname, expiry, unknown-anchor, and revocation-policy cases;
- proof that secure failure does not select WTLS or clear WAP;
- clean-machine trust-store and installer tests;
- current dependency, vulnerability, and cryptographic-policy review at release time.

## Alternatives considered

### Add AES-GCM to WTLS and call it compliant

Rejected. WAP-261 does not assign an AES suite and its record protection is not an AEAD
construction. A private cipher assignment would require both endpoints, would not interoperate
with historical gateways, and would not be WAP-261 compliance.

### Wrap the existing WTLS API around TLS

Rejected for the classic WAP route. TLS requires a reliable ordered stream and has a different
wire protocol. It is valid for direct HTTPS, not as WTLS on ports 9202/9203.

### Create a proprietary "WTLS 2"

Not selected. If a modern datagram protocol is needed, a standardized DTLS 1.3 profile should be
evaluated before inventing a new security protocol.

### Make WTLS the default because it is historically authentic

Rejected. Historical authenticity is an interoperability mode, not an acceptable default
security posture for credentials or user data.

### Automatically try modern, legacy, then clear

Rejected. Network interference could turn ordinary handshake failure into a security downgrade.

## External references

- [WTLS, WAP-261](https://www.openmobilealliance.org/tech/affiliates/wap/wap-261-wtls-20010406-a.pdf)
- [AES, FIPS 197-upd1](https://csrc.nist.gov/pubs/fips/197/final)
- [TLS 1.3, RFC 9846](https://www.rfc-editor.org/info/rfc9846/)
- [Recommendations for TLS and DTLS, RFC 9325](https://www.rfc-editor.org/rfc/rfc9325.html)
- [ChaCha20 and Poly1305, RFC 8439](https://www.rfc-editor.org/rfc/rfc8439.html)
- [DTLS 1.3, RFC 9147](https://www.rfc-editor.org/info/rfc9147/)
- [DTLS Return Routability Check, RFC 9853](https://www.rfc-editor.org/info/rfc9853/)
- [NIST TLS Guidance, SP 800-52 Rev. 2](https://csrc.nist.gov/pubs/sp/800/52/r2/final)
- [NIST Algorithm Transition Guidance, SP 800-131A Rev. 2](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final)
- [Rustls cipher-suite providers](https://docs.rs/rustls/latest/rustls/crypto/ring/cipher_suite/)

## Related repository evidence

- [`transport-rust/Cargo.toml`](../../transport-rust/Cargo.toml)
- [`transport-rust/src/native_fetch.rs`](../../transport-rust/src/native_fetch.rs)
- [`transport-rust/src/network/wtls/record.rs`](../../transport-rust/src/network/wtls/record.rs)
- [`transport-rust/src/network/wtls/handshake.rs`](../../transport-rust/src/network/wtls/handshake.rs)
- [`transport-rust/src/network/wtls/alerts.rs`](../../transport-rust/src/network/wtls/alerts.rs)
- [`docs/waves/wtls-record-structure.md`](../waves/wtls-record-structure.md)
- [`docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`](../waves/SECURITY_BOUNDARY_TRACEABILITY.md)
- [`docs/architecture/native-wap-browser-product-architecture.md`](native-wap-browser-product-architecture.md)
