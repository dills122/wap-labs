#![allow(dead_code)]

use crate::network::wdp::datagram::WdpDatagram;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum WdpError {
    TransportUnavailable(String),
    AddressTypeUnsupported,
    AddressUnresolvable(String),
    DestinationPortUnsupported(u16),
    PayloadOversize { actual: usize, max: usize },
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
            Self::DestinationPortUnsupported(port) => {
                write!(f, "destination port {port} is not a supported WAP service")
            }
            Self::PayloadOversize { actual, max } => {
                write!(f, "payload size {actual} exceeds {max}")
            }
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
