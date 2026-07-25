#![allow(dead_code)]

use crate::network::wdp::datagram::WdpDatagram;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum WdpError {
    TransportUnavailable(String),
    AddressTypeUnsupported,
    AddressUnresolvable(String),
    NoRouteToDestination,
    CommunicationAdministrativelyProhibited,
    AddressUnreachable,
    DestinationPortUnsupported(u16),
    PayloadOversize {
        actual: usize,
        max: usize,
    },
    PeerMessageTooBig {
        max: usize,
    },
    Ipv4PacketTruncated {
        actual: usize,
        minimum: usize,
    },
    Ipv4VersionUnsupported(u8),
    Ipv4HeaderLengthInvalid(u8),
    Ipv4TotalLengthInvalid {
        declared: usize,
        actual: usize,
        header: usize,
    },
    Ipv4HeaderChecksumInvalid,
    Ipv4TtlExpired,
    Ipv4ProtocolUnsupported(u8),
    Ipv4FragmentRequiresReassembly {
        identification: u16,
        source: [u8; 4],
        destination: [u8; 4],
        protocol: u8,
        fragment_offset_units: u16,
        more_fragments: bool,
    },
    Ipv4LargeDatagramUnassured {
        actual: usize,
        baseline: usize,
    },
    Ipv4DontFragmentMtuExceeded {
        actual: usize,
        mtu: usize,
    },
    Ipv4FragmentMalformed {
        reason: String,
    },
    Ipv4ReassemblyOversize {
        actual: usize,
        max: usize,
    },
    Ipv4ReassemblyCapacityExceeded {
        actual: usize,
        max: usize,
    },
    Ipv4ReassemblyBufferExceeded {
        actual: usize,
        max: usize,
    },
    Ipv4ReassemblyPolicyInvalid,
    UdpLengthInvalid {
        declared: usize,
        actual: usize,
    },
    UdpChecksumInvalid,
    Timeout,
    CorruptOrMalformed,
    Internal(String),
}

impl std::fmt::Display for WdpError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TransportUnavailable(reason) => {
                write!(f, "transport unavailable: {reason}")
            }
            Self::AddressTypeUnsupported => write!(f, "address type unsupported by WDP transport"),
            Self::AddressUnresolvable(reason) => write!(f, "address unresolvable: {reason}"),
            Self::NoRouteToDestination => write!(f, "no route to destination"),
            Self::CommunicationAdministrativelyProhibited => {
                write!(f, "communication administratively prohibited")
            }
            Self::AddressUnreachable => write!(f, "destination address unreachable"),
            Self::DestinationPortUnsupported(port) => {
                write!(f, "destination port {port} is not a supported WAP service")
            }
            Self::PayloadOversize { actual, max } => {
                write!(f, "payload size {actual} exceeds {max}")
            }
            Self::PeerMessageTooBig { max } => {
                write!(f, "peer maximum message size is {max}")
            }
            Self::Ipv4PacketTruncated { actual, minimum } => {
                write!(
                    f,
                    "truncated IPv4 packet: need at least {minimum} octets, got {actual}"
                )
            }
            Self::Ipv4VersionUnsupported(version) => {
                write!(f, "unsupported IP version {version}; expected IPv4")
            }
            Self::Ipv4HeaderLengthInvalid(ihl) => {
                write!(f, "invalid IPv4 IHL {ihl}; expected at least 5")
            }
            Self::Ipv4TotalLengthInvalid {
                declared,
                actual,
                header,
            } => {
                write!(
                    f,
                    "invalid IPv4 total length {declared} for header {header} and packet {actual}"
                )
            }
            Self::Ipv4HeaderChecksumInvalid => write!(f, "invalid IPv4 header checksum"),
            Self::Ipv4TtlExpired => write!(f, "IPv4 time to live is zero"),
            Self::Ipv4ProtocolUnsupported(protocol) => {
                write!(f, "unsupported IPv4 protocol {protocol}; expected UDP 17")
            }
            Self::Ipv4FragmentRequiresReassembly {
                identification,
                source,
                destination,
                protocol,
                fragment_offset_units,
                more_fragments,
            } => {
                write!(
                    f,
                    "IPv4 fragment requires lower-layer reassembly: id={identification}, source={}.{}.{}.{}, destination={}.{}.{}.{}, protocol={protocol}, offset={fragment_offset_units}, more={more_fragments}",
                    source[0],
                    source[1],
                    source[2],
                    source[3],
                    destination[0],
                    destination[1],
                    destination[2],
                    destination[3]
                )
            }
            Self::Ipv4LargeDatagramUnassured { actual, baseline } => {
                write!(
                    f,
                    "IPv4 datagram size {actual} exceeds baseline {baseline} without destination assurance"
                )
            }
            Self::Ipv4DontFragmentMtuExceeded { actual, mtu } => {
                write!(
                    f,
                    "IPv4 datagram size {actual} exceeds path MTU {mtu} with DF set"
                )
            }
            Self::Ipv4FragmentMalformed { reason } => {
                write!(f, "malformed IPv4 fragment: {reason}")
            }
            Self::Ipv4ReassemblyOversize { actual, max } => {
                write!(
                    f,
                    "IPv4 reassembly size {actual} exceeds configured limit {max}"
                )
            }
            Self::Ipv4ReassemblyCapacityExceeded { actual, max } => {
                write!(
                    f,
                    "IPv4 pending reassembly count {actual} exceeds configured limit {max}"
                )
            }
            Self::Ipv4ReassemblyBufferExceeded { actual, max } => {
                write!(
                    f,
                    "IPv4 reassembly buffer size {actual} exceeds configured limit {max}"
                )
            }
            Self::Ipv4ReassemblyPolicyInvalid => {
                write!(f, "invalid IPv4 reassembly policy")
            }
            Self::UdpLengthInvalid { declared, actual } => {
                write!(
                    f,
                    "invalid UDP length {declared}; available UDP octets {actual}"
                )
            }
            Self::UdpChecksumInvalid => write!(f, "invalid UDP checksum"),
            Self::Timeout => write!(f, "transport timeout"),
            Self::CorruptOrMalformed => write!(f, "corrupt or malformed datagram"),
            Self::Internal(reason) => write!(f, "internal transport error: {reason}"),
        }
    }
}

impl std::error::Error for WdpError {}

pub type WdpResult<T> = Result<T, WdpError>;

pub trait DatagramTransport {
    fn send(&mut self, datagram: &WdpDatagram) -> WdpResult<()>;
    fn receive(&mut self) -> WdpResult<WdpDatagram>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wdp_error_display_mentions_overflow_limit() {
        let error = WdpError::PayloadOversize {
            actual: 700_000,
            max: 65_507,
        };
        assert_eq!(
            error.to_string(),
            "payload size 700000 exceeds 65507".to_string()
        );
    }

    #[test]
    fn wdp_error_display_mentions_unknown_port() {
        let error = WdpError::DestinationPortUnsupported(9999);
        assert!(error.to_string().contains("9999"));
    }
}
