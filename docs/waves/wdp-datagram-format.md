# WDP Datagram Format and Transport Contract

Status: `ACTIVE`
Date: `2026-03-04`

## 1) What WDP provides

In this project WDP is a constrained, testable datagram abstraction for upper protocol layers.
It maps to one transport datagram in memory and to one UDP datagram in the MVP transport.

For the selected WAP 1.2.1 Class C path, WAP-200 plus RFC 768 and RFC 791
define the active behavior:

- WDP is the standard datagram interface between bearer services and upper layers.
- CDPD is selected as an IP-capable bearer and WDP maps directly to UDP/IPv4.
- WSP/WTP/WTLS session identity is by address/port quadruplet (client/server address + ports).
- the selected AMPS/CDPD/IPv4 bearer assignment is `0x0D`.
- bearer fragmentation/reassembly terminates below WDP; no second WDP
  segmentation header is added to this IP path.

## 2) MVP datagram model

```rust
pub struct WdpDatagram {
    pub src_addr: WdpAddress,
    pub dst_addr: WdpAddress,
    pub src_port: u16,
    pub dst_port: u16,
    pub payload: Vec<u8>,
}

pub struct WdpAddress {
    pub addr_type: AddressType, // IPv4, IPv6, or future GSM/USSD forms
    pub value: Vec<u8>,
}
```

The source-shaped service primitive types are:

```rust
pub struct TDUnitdataRequest {
    pub source_address: WdpAddress,
    pub source_port: u16,
    pub destination_address: WdpAddress,
    pub destination_port: u16,
    pub user_data: Vec<u8>,
}

pub struct TDUnitdataIndication {
    pub source_address: WdpAddress,
    pub source_port: u16,
    pub destination_address: Option<WdpAddress>,
    pub destination_port: Option<u16>,
    pub user_data: Vec<u8>,
}
```

## 3) WAP service ports in profile

The complete WAP-200 Appendix B registry is recognized:

- WTA secure connectionless/session: `2805`, `2923`.
- Push connectionless/secure connectionless: `2948`, `2949`.
- WSP connectionless/session/secure connectionless/secure session:
  `9200..9203`.
- vCard/vCalendar datagram and secure datagram: `9204..9207`.

Transport policy:
- server entities MUST bind well-known service ports.
- client entities may use ephemeral source ports.
- the profile must log/validate source/destination quadruplets for each session.
- recognizing a registered port does not activate that optional application or
  security profile. The selected non-secure connectionless WSP service uses
  destination port `9200`.

## 4) Bearer implementation contracts

### 4.1 CDPD/UDP/IPv4 — selected strict path

- addresses are exactly four octets and UDP is IPv4 protocol `17`;
- map WDP user data 1:1 to UDP data with 16-bit source and destination ports;
- encode and validate IPv4 and UDP lengths and checksums, including odd-octet
  checksum padding, computed-zero encoding as `0xFFFF`, and permitted
  all-zero UDP checksum omission;
- accept IPv4 datagrams through the 576-octet baseline and require explicit
  destination assurance for larger sends;
- treat `65,535` octets as the IPv4 protocol maximum and `65,507` octets as
  the corresponding no-options UDP payload maximum;
- discard TTL-zero, bad-header-checksum, malformed-length, bad non-zero UDP
  checksum, unsupported-protocol, and DF/path-MTU failures deterministically;
- keep the stateless WDP/UDP decoder restricted to complete IPv4 datagrams;
- collect fragments in the explicit destination-IP boundary below WDP,
  keyed by identification, source, destination, and protocol.

### 4.2 SMS/USSD/other GSM bearers — deferred

Implementation is deferred but reserved in model:

- optional UDH-style fragmentation and reassembly,
- bearer-specific maximum payload sizes,
- optional sequence numbers/retry semantics.

## 5) Segmentation boundary

- the selected CDPD/IP path adds no WDP segmentation header;
- IPv4 gateways may fragment and the destination IP module reassembles before
  delivery to WDP;
- the stateless codec still returns `Ipv4FragmentRequiresReassembly` when it
  is called directly with a fragment, preserving the `TRN-701` boundary;
- `Ipv4Reassembler` owns bounded fragment collection at the destination-IP
  boundary, outside the WDP datagram service;
- the selected strict receive policy accepts complete/reassembled datagrams
  through 576 octets, rejects larger units without truncating WDP user data,
  and can be widened only by an explicit destination capability;
- pending assemblies are bounded by datagram count, buffered bytes, total
  datagram size, and deterministic simulated-time expiry;
- duplicate fragments are idempotent, while conflicting overlaps, malformed
  flags/lengths, oversize extents, and incomplete expiry are explicit outcomes.

The optional generic `WdpSarPolicy::Enabled` path remains an inactive future
bearer capability. It is not used to manufacture a WDP segmentation layer for
CDPD/IPv4.

## 6) Error taxonomy

Minimum errors expected by upper layers:

- `WdpError::TransportUnavailable`
- `WdpError::AddressTypeUnsupported`
- `WdpError::AddressUnresolvable`
- `WdpError::PayloadOversize`
- `WdpError::Ipv4FragmentMalformed`
- `WdpError::Ipv4ReassemblyOversize`
- `WdpError::Ipv4ReassemblyCapacityExceeded`
- `WdpError::Ipv4ReassemblyBufferExceeded`
- `WdpError::Timeout`
- `WdpError::CorruptOrMalformed`

## 7) Implementation notes for this repo

- Keep WDP free of HTTP/WSP semantics.
- expose only transport-visible fields and typed errors.
- ensure all parse/codec methods stay stateless to keep replayability in tests.

## 8) Evidence

The direct fixture
`transport-rust/tests/fixtures/transport/wdp_cdpd_ipv4_mapped/wdp_fixture.json`
links the nine selected SCR rows and all 49 mapped TRN-701 clauses to exact
profile constants, registered ports, positive wire packets, and deterministic
malformed outcomes.

The additive TRN-702 fixture
`transport-rust/tests/fixtures/transport/wdp_constrained_payload_mapped/reassembly_fixture.json`
maps the narrow nine-clause payload/fragment subset to whole, out-of-order,
duplicate, malformed, overlap, oversize, and incomplete-expiry replays. This
does not claim broader TRN-706 replay-corpus closure. Validate both with:

```sh
cargo test --manifest-path transport-rust/Cargo.toml --lib network::wdp
cargo test --manifest-path transport-rust/Cargo.toml --test wdp_constrained_replay
node scripts/check-wap-transport-conformance-ledgers.mjs
node scripts/check-wap-selected-normative-clauses.mjs
node scripts/wap-context-pack.mjs TRN-702
```
