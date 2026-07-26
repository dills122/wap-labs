pub mod datagram;
pub mod ipv4_reassembly;
pub mod ipv4_udp;
pub mod primitive;
pub mod profile;
pub mod sar;
pub mod transport_trait;
pub mod udp_adapter;

pub use datagram::{WdpAddress, WdpAddressType, WdpDatagram, WdpServicePort};
pub use ipv4_reassembly::{
    Ipv4FragmentKey, Ipv4IncompleteReassembly, Ipv4Reassembler, Ipv4ReassemblyOutcome,
    Ipv4ReassemblyPending, Ipv4ReassemblyPolicy,
};
pub use ipv4_udp::{
    decode_cdpd_ipv4_udp, encode_cdpd_ipv4_udp, CdpdIpv4SendPolicy, UdpChecksumPolicy,
};
pub use primitive::{TDUnitdataIndication, TDUnitdataRequest};
pub use profile::{
    CdpdIpv4Profile, WDP_CDPD_IPV4_BEARER_TYPE, WDP_IPV4_BASELINE_DATAGRAM_BYTES,
    WDP_IPV4_MAX_DATAGRAM_BYTES, WDP_UDP_IPV4_PROTOCOL_NUMBER,
};
pub use sar::{classify_sar_packet, WdpSarDecision, WdpSarPolicy, WdpSarTrace};
pub use transport_trait::{DatagramTransport, WdpError, WdpResult};
pub use udp_adapter::{UdpDatagramTransport, UdpDatagramTransportConfig};

#[cfg(test)]
mod tests;
