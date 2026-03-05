# WDP Datagram Format and Transport Contract

Status: `ACTIVE`
Date: `2026-03-04`

## 1) What WDP provides

In this project WDP is a constrained, testable datagram abstraction for upper protocol layers.
It maps to one transport datagram in memory and to one UDP datagram in the MVP transport.

From `WAP-259`:

- WDP is the standard datagram interface between bearer services and upper layers.
- over IP, WDP mapping is UDP.
- WSP/WTP/WTLS session identity is by address/port quadruplet (client/server address + ports).

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

Minimal interface required by current transport:

```rust
pub trait DatagramTransport {
    fn send(&mut self, datagram: &WdpDatagram) -> Result<(), WdpError>;
    fn receive(&mut self) -> Result<WdpDatagram, WdpError>;
}
```

## 3) WAP service ports in profile

WAP registered datagram ports are part of service selection and must be preserved:

- WSP Connectionless Session Service (non-secure): `9200`.
- WSP Session Service (non-secure): `9201`.
- WSP Connectionless Session Service (secure): `9202`.
- WSP Session Service (secure): `9203`.
- Push services have additional legacy ports in WAP-259 Appendix B; only those required by enabled transport profile are part of MVP.

Transport policy:
- server entities MUST bind well-known service ports.
- client entities may use ephemeral source ports.
- the profile must log/validate source/destination quadruplets for each session.

## 4) Bearer implementation contracts

### 4.1 UDP (`wdp over IP`) — MVP

- map WDP datagram `payload` 1:1 to UDP payload.
- use 16-bit port fields.
- map receive errors into typed `WdpError` values.

### 4.2 SMS/USSD/other GSM bearers — deferred

Implementation is deferred but reserved in model:

- optional UDH-style fragmentation and reassembly,
- bearer-specific maximum payload sizes,
- optional sequence numbers/retry semantics.

## 5) Segmentation policy

- no automatic segmentation in core MVP service layer.
- higher layer may enforce MTU via capability/SDU checks.
- if bearer segmenting is enabled, use WTP SAR/ESAR policy where the WTP layer explicitly requests grouping and recovery.

## 6) Error taxonomy

Minimum errors expected by upper layers:

- `WdpError::TransportUnavailable`
- `WdpError::AddressTypeUnsupported`
- `WdpError::AddressUnresolvable`
- `WdpError::PayloadOversize`
- `WdpError::Timeout`
- `WdpError::CorruptOrMalformed`

## 7) Implementation notes for this repo

- Keep WDP free of HTTP/WSP semantics.
- expose only transport-visible fields and typed errors.
- ensure all parse/codec methods stay stateless to keep replayability in tests.

## 8) Pending precision

- WAP-259 bearer-specific checksum requirements are profile-dependent.
- keep a deferred issue for explicit bearer obligations per profile until bearer adapter is in-scope.
