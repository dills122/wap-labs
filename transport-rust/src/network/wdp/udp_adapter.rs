#![allow(dead_code)]

use crate::network::wdp::datagram::{
    WdpAddress, WdpDatagram, WdpServicePort, WDP_MAX_UDP_PAYLOAD_BYTES,
};
use crate::network::wdp::transport_trait::{DatagramTransport, WdpError, WdpResult};
use std::net::{SocketAddr, UdpSocket};
use std::time::Duration;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UdpDatagramTransportConfig {
    pub bind_address: String,
    pub read_timeout_ms: Option<u64>,
}

impl Default for UdpDatagramTransportConfig {
    fn default() -> Self {
        Self {
            bind_address: "127.0.0.1:0".to_string(),
            read_timeout_ms: Some(100),
        }
    }
}

pub struct UdpDatagramTransport {
    socket: UdpSocket,
    read_timeout_ms: Option<u64>,
}

impl UdpDatagramTransport {
    pub fn new(config: UdpDatagramTransportConfig) -> WdpResult<Self> {
        let socket = UdpSocket::bind(&config.bind_address)
            .map_err(|error| WdpError::TransportUnavailable(error.to_string()))?;
        if let Some(timeout_ms) = config.read_timeout_ms {
            socket
                .set_read_timeout(Some(Duration::from_millis(timeout_ms)))
                .map_err(|error| WdpError::TransportUnavailable(error.to_string()))?;
        }
        Ok(Self {
            socket,
            read_timeout_ms: config.read_timeout_ms,
        })
    }

    pub fn local_addr(&self) -> SocketAddr {
        self.socket
            .local_addr()
            .unwrap_or_else(|_| "127.0.0.1:0".parse().expect("literal is valid socket addr"))
    }
}

fn socket_addr_from_wdp(address: &WdpAddress, port: u16) -> WdpResult<SocketAddr> {
    if WdpServicePort::from_u16(port).is_none() {
        return Err(WdpError::DestinationPortUnsupported(port));
    }
    address
        .as_socket_addr(port)
        .ok_or(WdpError::AddressTypeUnsupported)
}

fn map_udp_error(error: std::io::Error) -> WdpError {
    if error.kind() == std::io::ErrorKind::WouldBlock
        || error.kind() == std::io::ErrorKind::TimedOut
    {
        WdpError::Timeout
    } else {
        WdpError::TransportUnavailable(error.to_string())
    }
}

impl DatagramTransport for UdpDatagramTransport {
    fn send(&mut self, datagram: &WdpDatagram) -> WdpResult<()> {
        if datagram.payload.len() > WDP_MAX_UDP_PAYLOAD_BYTES {
            return Err(WdpError::PayloadOversize {
                actual: datagram.payload.len(),
                max: WDP_MAX_UDP_PAYLOAD_BYTES,
            });
        }

        let destination = socket_addr_from_wdp(&datagram.dst_addr, datagram.dst_port)?;
        self.socket
            .send_to(&datagram.payload, destination)
            .map(|_| ())
            .map_err(map_udp_error)
    }

    fn receive(&mut self) -> WdpResult<WdpDatagram> {
        let mut buffer = vec![0u8; WDP_MAX_UDP_PAYLOAD_BYTES.max(1)];
        let (size, source_addr) = self.socket.recv_from(&mut buffer).map_err(map_udp_error)?;
        if size > WDP_MAX_UDP_PAYLOAD_BYTES {
            return Err(WdpError::CorruptOrMalformed);
        }
        let local_addr = self
            .socket
            .local_addr()
            .map_err(|error| WdpError::TransportUnavailable(error.to_string()))?;
        Ok(WdpDatagram {
            src_addr: WdpAddress::from_socket_addr(source_addr),
            dst_addr: WdpAddress::from_socket_addr(local_addr),
            src_port: source_addr.port(),
            dst_port: local_addr.port(),
            payload: buffer[..size].to_vec(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn bind_or_return(config: UdpDatagramTransportConfig) -> Option<UdpDatagramTransport> {
        UdpDatagramTransport::new(config).ok()
    }

    fn make_loopback_ipv4_address(_port: u16) -> WdpAddress {
        WdpAddress::ipv4([127, 0, 0, 1])
    }

    #[test]
    fn udp_adapter_rejects_unknown_destination_port() {
        let mut transport = match bind_or_return(UdpDatagramTransportConfig {
            bind_address: "127.0.0.1:0".to_string(),
            read_timeout_ms: None,
        }) {
            Some(transport) => transport,
            None => return,
        };

        let outbound = WdpDatagram {
            src_addr: make_loopback_ipv4_address(9200),
            dst_addr: make_loopback_ipv4_address(9000),
            src_port: 12345,
            dst_port: 9000,
            payload: b"hello".to_vec(),
        };

        let error = transport
            .send(&outbound)
            .expect_err("unknown port should be rejected");
        assert!(matches!(error, WdpError::DestinationPortUnsupported(9000)));
    }

    #[test]
    fn udp_adapter_rejects_oversize_payloads() {
        let mut transport = match bind_or_return(UdpDatagramTransportConfig {
            bind_address: "127.0.0.1:0".to_string(),
            read_timeout_ms: None,
        }) {
            Some(transport) => transport,
            None => return,
        };
        let destination = make_loopback_ipv4_address(9200);
        let outbound = WdpDatagram {
            src_addr: destination.clone(),
            dst_addr: destination,
            src_port: 12345,
            dst_port: 9200,
            payload: vec![0xFF; WDP_MAX_UDP_PAYLOAD_BYTES + 1],
        };

        let error = transport
            .send(&outbound)
            .expect_err("payload should be rejected when too large");
        assert!(matches!(
            error,
            WdpError::PayloadOversize {
                actual: _,
                max: 65_507
            }
        ));
    }

    #[test]
    fn udp_send_and_receive_roundtrip_with_known_service_ports() {
        let mut receiver = match bind_or_return(UdpDatagramTransportConfig {
            bind_address: "127.0.0.1:9200".to_string(),
            read_timeout_ms: Some(1000),
        }) {
            Some(receiver) => receiver,
            None => return,
        };
        let recv_port = receiver.local_addr().port();
        if recv_port != 9200 {
            return;
        }

        let mut sender = match bind_or_return(UdpDatagramTransportConfig {
            bind_address: "127.0.0.1:0".to_string(),
            read_timeout_ms: None,
        }) {
            Some(sender) => sender,
            None => return,
        };

        let outbound = WdpDatagram {
            src_addr: make_loopback_ipv4_address(recv_port),
            dst_addr: make_loopback_ipv4_address(recv_port),
            src_port: 0,
            dst_port: 9200,
            payload: b"payload-bytes".to_vec(),
        };
        sender
            .socket
            .connect(format!("127.0.0.1:{recv_port}"))
            .expect("connect");
        sender.send(&outbound).expect("send should succeed");

        let observed = receiver.receive().expect("receiver should get payload");
        assert_eq!(observed.payload, b"payload-bytes".to_vec());
        assert_eq!(observed.src_port, sender.local_addr().port());
        assert_eq!(observed.dst_port, recv_port);
        assert_eq!(observed.dst_addr, make_loopback_ipv4_address(recv_port));
    }
}
