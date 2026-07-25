use crate::network::wdp::datagram::{
    WdpAddress, WdpAddressType, WdpDatagram, WdpServicePort, WDP_MAX_UDP_PAYLOAD_BYTES,
};
use crate::network::wdp::profile::{
    WDP_IPV4_BASELINE_DATAGRAM_BYTES, WDP_UDP_IPV4_PROTOCOL_NUMBER,
};
use crate::network::wdp::transport_trait::{WdpError, WdpResult};

pub(super) const IPV4_MIN_HEADER_BYTES: usize = 20;
const UDP_HEADER_BYTES: usize = 8;
pub(super) const IPV4_FLAG_DONT_FRAGMENT: u16 = 0x4000;
pub(super) const IPV4_FLAG_MORE_FRAGMENTS: u16 = 0x2000;
pub(super) const IPV4_FRAGMENT_OFFSET_MASK: u16 = 0x1FFF;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UdpChecksumPolicy {
    Generate,
    Omit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CdpdIpv4SendPolicy {
    pub identification: u16,
    pub time_to_live: u8,
    pub dont_fragment: bool,
    pub path_mtu: Option<usize>,
    pub destination_accepts_large_datagrams: bool,
    pub udp_checksum: UdpChecksumPolicy,
}

impl Default for CdpdIpv4SendPolicy {
    fn default() -> Self {
        Self {
            identification: 0,
            time_to_live: 64,
            dont_fragment: false,
            path_mtu: None,
            destination_accepts_large_datagrams: false,
            udp_checksum: UdpChecksumPolicy::Generate,
        }
    }
}

fn ipv4_octets(address: &WdpAddress) -> WdpResult<[u8; 4]> {
    if address.address_type != WdpAddressType::Ipv4 || address.value.len() != 4 {
        return Err(WdpError::AddressTypeUnsupported);
    }
    let mut octets = [0; 4];
    octets.copy_from_slice(&address.value);
    Ok(octets)
}

fn ones_complement_sum(bytes: &[u8]) -> u32 {
    let mut sum = 0u32;
    for chunk in bytes.chunks(2) {
        let word = if chunk.len() == 2 {
            u16::from_be_bytes([chunk[0], chunk[1]])
        } else {
            u16::from_be_bytes([chunk[0], 0])
        };
        sum += u32::from(word);
        while sum > u32::from(u16::MAX) {
            sum = (sum & u32::from(u16::MAX)) + (sum >> 16);
        }
    }
    sum
}

pub(super) fn checksum(bytes: &[u8]) -> u16 {
    !(ones_complement_sum(bytes) as u16)
}

fn udp_checksum(source: [u8; 4], destination: [u8; 4], udp: &[u8]) -> u16 {
    let udp_length = udp.len() as u16;
    let mut covered = Vec::with_capacity(12 + udp.len());
    covered.extend_from_slice(&source);
    covered.extend_from_slice(&destination);
    covered.push(0);
    covered.push(WDP_UDP_IPV4_PROTOCOL_NUMBER);
    covered.extend_from_slice(&udp_length.to_be_bytes());
    covered.extend_from_slice(udp);
    checksum(&covered)
}

pub fn encode_cdpd_ipv4_udp(
    datagram: &WdpDatagram,
    policy: CdpdIpv4SendPolicy,
) -> WdpResult<Vec<u8>> {
    let source = ipv4_octets(&datagram.src_addr)?;
    let destination = ipv4_octets(&datagram.dst_addr)?;
    if !WdpServicePort::is_known(datagram.dst_port) {
        return Err(WdpError::DestinationPortUnsupported(datagram.dst_port));
    }
    if datagram.payload.len() > WDP_MAX_UDP_PAYLOAD_BYTES {
        return Err(WdpError::PayloadOversize {
            actual: datagram.payload.len(),
            max: WDP_MAX_UDP_PAYLOAD_BYTES,
        });
    }
    if policy.time_to_live == 0 {
        return Err(WdpError::Ipv4TtlExpired);
    }

    let udp_length =
        UDP_HEADER_BYTES
            .checked_add(datagram.payload.len())
            .ok_or(WdpError::PayloadOversize {
                actual: datagram.payload.len(),
                max: WDP_MAX_UDP_PAYLOAD_BYTES,
            })?;
    let total_length =
        IPV4_MIN_HEADER_BYTES
            .checked_add(udp_length)
            .ok_or(WdpError::PayloadOversize {
                actual: datagram.payload.len(),
                max: WDP_MAX_UDP_PAYLOAD_BYTES,
            })?;
    let total_length_u16 = u16::try_from(total_length).map_err(|_| WdpError::PayloadOversize {
        actual: datagram.payload.len(),
        max: WDP_MAX_UDP_PAYLOAD_BYTES,
    })?;
    let udp_length_u16 = u16::try_from(udp_length).map_err(|_| WdpError::PayloadOversize {
        actual: datagram.payload.len(),
        max: WDP_MAX_UDP_PAYLOAD_BYTES,
    })?;

    if total_length > WDP_IPV4_BASELINE_DATAGRAM_BYTES
        && !policy.destination_accepts_large_datagrams
    {
        return Err(WdpError::Ipv4LargeDatagramUnassured {
            actual: total_length,
            baseline: WDP_IPV4_BASELINE_DATAGRAM_BYTES,
        });
    }
    if let Some(path_mtu) = policy.path_mtu {
        if policy.dont_fragment && total_length > path_mtu {
            return Err(WdpError::Ipv4DontFragmentMtuExceeded {
                actual: total_length,
                mtu: path_mtu,
            });
        }
    }

    let mut packet = vec![0u8; total_length];
    packet[0] = 0x45;
    packet[2..4].copy_from_slice(&total_length_u16.to_be_bytes());
    packet[4..6].copy_from_slice(&policy.identification.to_be_bytes());
    let flags_and_offset = if policy.dont_fragment {
        IPV4_FLAG_DONT_FRAGMENT
    } else {
        0
    };
    packet[6..8].copy_from_slice(&flags_and_offset.to_be_bytes());
    packet[8] = policy.time_to_live;
    packet[9] = WDP_UDP_IPV4_PROTOCOL_NUMBER;
    packet[12..16].copy_from_slice(&source);
    packet[16..20].copy_from_slice(&destination);
    let header_checksum = checksum(&packet[..IPV4_MIN_HEADER_BYTES]);
    packet[10..12].copy_from_slice(&header_checksum.to_be_bytes());

    let udp = &mut packet[IPV4_MIN_HEADER_BYTES..];
    udp[0..2].copy_from_slice(&datagram.src_port.to_be_bytes());
    udp[2..4].copy_from_slice(&datagram.dst_port.to_be_bytes());
    udp[4..6].copy_from_slice(&udp_length_u16.to_be_bytes());
    udp[8..].copy_from_slice(&datagram.payload);
    if policy.udp_checksum == UdpChecksumPolicy::Generate {
        let computed = udp_checksum(source, destination, udp);
        let encoded = if computed == 0 { u16::MAX } else { computed };
        udp[6..8].copy_from_slice(&encoded.to_be_bytes());
    }
    Ok(packet)
}

pub fn decode_cdpd_ipv4_udp(packet: &[u8]) -> WdpResult<WdpDatagram> {
    if packet.len() < IPV4_MIN_HEADER_BYTES {
        return Err(WdpError::Ipv4PacketTruncated {
            actual: packet.len(),
            minimum: IPV4_MIN_HEADER_BYTES,
        });
    }

    let version = packet[0] >> 4;
    if version != 4 {
        return Err(WdpError::Ipv4VersionUnsupported(version));
    }
    let ihl = packet[0] & 0x0F;
    if ihl < 5 {
        return Err(WdpError::Ipv4HeaderLengthInvalid(ihl));
    }
    let header_length = usize::from(ihl) * 4;
    if packet.len() < header_length {
        return Err(WdpError::Ipv4PacketTruncated {
            actual: packet.len(),
            minimum: header_length,
        });
    }
    let total_length = usize::from(u16::from_be_bytes([packet[2], packet[3]]));
    if total_length < header_length || total_length != packet.len() {
        return Err(WdpError::Ipv4TotalLengthInvalid {
            declared: total_length,
            actual: packet.len(),
            header: header_length,
        });
    }
    if checksum(&packet[..header_length]) != 0 {
        return Err(WdpError::Ipv4HeaderChecksumInvalid);
    }
    if packet[8] == 0 {
        return Err(WdpError::Ipv4TtlExpired);
    }
    if packet[9] != WDP_UDP_IPV4_PROTOCOL_NUMBER {
        return Err(WdpError::Ipv4ProtocolUnsupported(packet[9]));
    }

    let source = [packet[12], packet[13], packet[14], packet[15]];
    let destination = [packet[16], packet[17], packet[18], packet[19]];
    let identification = u16::from_be_bytes([packet[4], packet[5]]);
    let flags_and_offset = u16::from_be_bytes([packet[6], packet[7]]);
    let fragment_offset_units = flags_and_offset & IPV4_FRAGMENT_OFFSET_MASK;
    let more_fragments = flags_and_offset & IPV4_FLAG_MORE_FRAGMENTS != 0;
    if fragment_offset_units != 0 || more_fragments {
        return Err(WdpError::Ipv4FragmentRequiresReassembly {
            identification,
            source,
            destination,
            protocol: packet[9],
            fragment_offset_units,
            more_fragments,
        });
    }

    let udp = &packet[header_length..];
    if udp.len() < UDP_HEADER_BYTES {
        return Err(WdpError::UdpLengthInvalid {
            declared: udp.len(),
            actual: udp.len(),
        });
    }
    let udp_length = usize::from(u16::from_be_bytes([udp[4], udp[5]]));
    if udp_length < UDP_HEADER_BYTES || udp_length != udp.len() {
        return Err(WdpError::UdpLengthInvalid {
            declared: udp_length,
            actual: udp.len(),
        });
    }
    let source_port = u16::from_be_bytes([udp[0], udp[1]]);
    let destination_port = u16::from_be_bytes([udp[2], udp[3]]);
    if !WdpServicePort::is_known(destination_port) {
        return Err(WdpError::DestinationPortUnsupported(destination_port));
    }
    let encoded_checksum = u16::from_be_bytes([udp[6], udp[7]]);
    if encoded_checksum != 0 && udp_checksum(source, destination, udp) != 0 {
        return Err(WdpError::UdpChecksumInvalid);
    }

    Ok(WdpDatagram {
        src_addr: WdpAddress::ipv4(source),
        dst_addr: WdpAddress::ipv4(destination),
        src_port: source_port,
        dst_port: destination_port,
        payload: udp[UDP_HEADER_BYTES..].to_vec(),
    })
}
