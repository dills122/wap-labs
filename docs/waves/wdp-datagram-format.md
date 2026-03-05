# WDP Datagram Format (Draft)

Status: `DRAFT` (source-grounding in progress)
Date: `2026-03-04`

This file captures the WDP-facing transport abstraction and current MVP datagram contract.
Source grounding:
- `spec-processing/source-material/WAP-259-WDP-20010614-a.pdf`

## 1) Contract purpose

WDP provides a datagram-style service under WAP transport layers, equivalent in spirit to UDP but with adapter-specific constraints and optional segmentation behavior.

## 2) Rust interface

```rust
pub trait DatagramTransport {
    fn send(&mut self, datagram: &WdpDatagram) -> Result<(), WdpError>;
    fn receive(&mut self) -> Result<WdpDatagram, WdpError>;
}
```

Transport implementations:

- In-memory transport (tests)
- UDP transport (MVP)
- SMS/GPRS adapters (future)

## 3) Wire-like model (abstraction layer)

```text
WdpDatagram
  - src_port: u16
  - dst_port: u16
  - payload: Vec<u8>
```

Notes:

- Payload length is the segment boundary for WDP in this abstraction.
- Segmentation strategy (if needed) is resolved by bearers/upper layers.

## 4) UDP implementation notes

- Bind to local socket and map `src_port/dst_port` into datagram fields
- `receive()` returns one full datagram or times out by policy
- Unknown/invalid source mapping is surfaced as transport error

## 5) Segmentation and reassembly (out-of-scope for MVP)

For MVP the focus is payload passthrough with caller-managed message boundaries.
If/when required:

- fragment_id / more_fragments flags
- ordering + reassembly buffer
- max segment size policy by bearer

## 6) Error model (starter)

- transport unavailable
- invalid address/port
- decode mismatch
- oversized payload for backend
- timeout/no data available

## 7) TODO from source review

- canonical bearer header fields in WDP true framing
- checksum/length behavior (if any in the selected mode)
- bearer-specific retransmission obligations
