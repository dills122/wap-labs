#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use std::net::{Ipv4Addr, Ipv6Addr, SocketAddr};

pub const WDP_MAX_UDP_PAYLOAD_BYTES: usize = 65_507;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WdpAddressType {
    Ipv4,
    Ipv6,
    Unspecified,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WdpAddress {
    pub address_type: WdpAddressType,
    pub value: Vec<u8>,
}

impl WdpAddress {
    pub fn ipv4(bytes: [u8; 4]) -> Self {
        Self {
            address_type: WdpAddressType::Ipv4,
            value: bytes.to_vec(),
        }
    }

    pub fn ipv6(bytes: [u8; 16]) -> Self {
        Self {
            address_type: WdpAddressType::Ipv6,
            value: bytes.to_vec(),
        }
    }

    pub fn unspecified() -> Self {
        Self {
            address_type: WdpAddressType::Unspecified,
            value: Vec::new(),
        }
    }

    pub fn from_socket_addr(addr: SocketAddr) -> Self {
        match addr.ip() {
            std::net::IpAddr::V4(addr) => Self::ipv4(addr.octets()),
            std::net::IpAddr::V6(addr) => Self::ipv6(addr.octets()),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WdpServicePort {
    Connectionless = 9200,
    Session = 9201,
    SecureConnectionless = 9202,
    SecureSession = 9203,
}

impl WdpServicePort {
    pub const ALL: [u16; 4] = [9200, 9201, 9202, 9203];

    pub fn is_known(port: u16) -> bool {
        Self::from_u16(port).is_some()
    }

    pub fn from_u16(port: u16) -> Option<Self> {
        match port {
            9200 => Some(Self::Connectionless),
            9201 => Some(Self::Session),
            9202 => Some(Self::SecureConnectionless),
            9203 => Some(Self::SecureSession),
            _ => None,
        }
    }
}

impl WdpAddress {
    pub fn as_socket_addr(&self, port: u16) -> Option<SocketAddr> {
        match self.address_type {
            WdpAddressType::Ipv4 if self.value.len() == 4 => {
                let mut octets = [0u8; 4];
                octets.copy_from_slice(&self.value[..4]);
                Some(SocketAddr::from((Ipv4Addr::from(octets), port)))
            }
            WdpAddressType::Ipv6 if self.value.len() == 16 => {
                let mut octets = [0u8; 16];
                octets.copy_from_slice(&self.value[..16]);
                Some(SocketAddr::from((Ipv6Addr::from(octets), port)))
            }
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WdpDatagram {
    pub src_addr: WdpAddress,
    pub dst_addr: WdpAddress,
    pub src_port: u16,
    pub dst_port: u16,
    pub payload: Vec<u8>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, SocketAddr};

    #[test]
    fn wdp_service_port_from_u16_returns_expected_mapping() {
        assert_eq!(
            WdpServicePort::from_u16(9200),
            Some(WdpServicePort::Connectionless)
        );
        assert_eq!(
            WdpServicePort::from_u16(9201),
            Some(WdpServicePort::Session)
        );
        assert_eq!(
            WdpServicePort::from_u16(9202),
            Some(WdpServicePort::SecureConnectionless)
        );
        assert_eq!(
            WdpServicePort::from_u16(9203),
            Some(WdpServicePort::SecureSession)
        );
        assert_eq!(WdpServicePort::from_u16(1), None);
    }

    #[test]
    fn wdp_address_roundtrips_ipv4_socket_addr() {
        let addr = SocketAddr::new(IpAddr::V4("127.0.0.1".parse().unwrap()), 9200);
        let wire = WdpAddress::from_socket_addr(addr);
        let parsed = wire.as_socket_addr(9200).expect("ipv4 should parse");

        assert_eq!(parsed, addr);
    }

    #[test]
    fn wdp_address_roundtrips_ipv6_socket_addr() {
        let addr = SocketAddr::new(IpAddr::V6("::1".parse().unwrap()), 9201);
        let wire = WdpAddress::from_socket_addr(addr);
        let parsed = wire.as_socket_addr(9201).expect("ipv6 should parse");

        assert_eq!(parsed, addr);
    }
}
