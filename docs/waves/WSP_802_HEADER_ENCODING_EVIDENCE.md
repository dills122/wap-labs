# WSP-802 Header and Encoding-Version Evidence

Status: implemented

## Boundary and effective sources

WSP-802 owns generic WSP header field-name/value framing, the effective default-page registry,
header code-page policy, Encoding-Version behavior, and the SIN-corrected Expect encoding in
`transport-rust/`. The effective order is WAP-203-WSP followed by SIN 001, SIN 003, and SIN 005.
The implementation source review used the hash-locked WAP 1.2.1 archive and verified the four
document hashes recorded in the source manifest before interpreting the effective tables.

The previously declared `general-formats` family was a planning-scope error, not a missing
normative mapping. WAP-188 General Formats defines telephone numbers, DTMF, and address/dial
strings; it does not define WSP header names, header value framing, code pages, Content-Type,
Expect, or Encoding-Version. WSP-802 therefore declares only the `wsp` source family. No
General Formats clause was invented or reassigned to close the gap.

Content-Type stays on the shared WSP-801/WML-304 seam: this slice reuses the existing
connectionless Content-Type framing and does not claim WML-304 media/charset ownership.

## Implemented behavior

- The effective Table 39 default page contains exactly 68 assignments, `0x00` through `0x43`,
  with the four superseded assignments retained for decoding but excluded from outbound name
  selection. Successor-only `0x44` through `0x47` assignments are rejected or handled by the
  explicit unknown policy.
- Header sets start on page 1. Pages 2–15 are WAP-reserved, pages 16–127 require application
  agreement, and pages 128–255 are future-reserved. Short and long page shifts use the WSP wire
  forms and the selected page is local to one header set.
- Generic values support short length, uintvar length, NUL-terminated text, and terminal
  short-integer framing. Unknown field names can error, preserve their raw framed value, or skip
  it without interpreting field-specific syntax.
- Binary Encoding-Version supports default and application-page identities, version defaults,
  sender/peer version caps, hop-local caching, hop-by-hop removal, per-extension-page
  advertisements, and compatible textual retry selection.
- Native reply validation performs a bounded discovery pass at the implementation ceiling and a
  second strict pass at the peer's advertised default-page version. This accepts Kannel's valid
  ordering where WSP 1.3 fields precede a trailing `Encoding-Version: 1.3`, while an absent,
  duplicate, under-claimed, malformed, or implementation-exceeding declaration still fails
  closed under the WAP 1.2 default/version rules.
- Corrective issue `#449` closes a residual in the completed WSP-802 text-form evidence:
  malformed one- or two-token textual values are rejected instead of being normalized into a
  different valid binary advertisement. This correction does not reopen WSP-802 or `T0-20`.
- Expect uses SIN 001: `100-continue` is octet `0x80`; extension expressions require a
  Value-length wrapper. The superseded unwrapped expression is rejected.
- HTTP comma-list values are expanded into ordered repeated WSP fields while quoted commas are
  preserved. A text-encoded field name always carries a text value.

## Executable evidence

- `transport-rust/tests/wsp_header_grammar.rs`
- `transport-rust/tests/fixtures/transport/wsp_header_grammar_mapped/header_fixture.json`
- The mapped Encoding-Version table asserts exact bytes for `1.3`, `40`, and `40 1.3`, plus
  exact `InvalidVersion` failures for malformed one- and two-token values.
- Native WSP header, Encoding-Version, Expect, peer-cache, retry, list-expansion, and hop-boundary
  unit tests under `transport-rust/src/network/wsp/`
- Native origin-identity tests under `transport-rust/src/native_fetch.rs` include the exact Kannel
  header ordering, absent/under-claimed version rejection, and duplicate-version rejection.
- `transport-rust/tests/kannel_smoke.rs::kannel_wap_owned_origin_identity_smoke` proves the same
  strict response-identity contract against an isolated live Kannel/WML stack and a dynamic UDP
  mapping.
- `cargo test --manifest-path transport-rust/Cargo.toml --test wsp_header_grammar`
- `cargo test --manifest-path transport-rust/Cargo.toml --test wsp_connectionless_matrix`
- `cargo test --manifest-path transport-rust/Cargo.toml`
- `node scripts/check-wap-transport-conformance-ledgers.mjs`

The WSP-801 matrix remains a separate byte-exact regression gate. WML-304 remains additive
follow-up ownership and is not reopened by this evidence.
