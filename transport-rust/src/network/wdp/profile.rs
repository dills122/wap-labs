use crate::network::wdp::datagram::{WdpAddressType, WdpServicePort};

pub const WDP_CDPD_IPV4_BEARER_TYPE: u8 = 0x0D;
pub const WDP_UDP_IPV4_PROTOCOL_NUMBER: u8 = 17;
pub const WDP_IPV4_BASELINE_DATAGRAM_BYTES: usize = 576;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CdpdIpv4Profile;

impl CdpdIpv4Profile {
    pub const BEARER_TYPE: u8 = WDP_CDPD_IPV4_BEARER_TYPE;
    pub const ADDRESS_TYPE: WdpAddressType = WdpAddressType::Ipv4;
    pub const ADDRESS_OCTETS: usize = 4;
    pub const IP_PROTOCOL: u8 = WDP_UDP_IPV4_PROTOCOL_NUMBER;
    pub const SELECTED_CONNECTIONLESS_WSP_PORT: u16 = WdpServicePort::Connectionless as u16;
    pub const WDP_SEGMENTATION_HEADER_PRESENT: bool = false;
}
