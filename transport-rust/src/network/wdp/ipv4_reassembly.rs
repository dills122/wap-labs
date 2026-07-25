use crate::network::wdp::ipv4_udp::{
    checksum, IPV4_FLAG_DONT_FRAGMENT, IPV4_FLAG_MORE_FRAGMENTS, IPV4_FRAGMENT_OFFSET_MASK,
    IPV4_MIN_HEADER_BYTES,
};
use crate::network::wdp::profile::{
    WDP_IPV4_BASELINE_DATAGRAM_BYTES, WDP_IPV4_MAX_DATAGRAM_BYTES, WDP_UDP_IPV4_PROTOCOL_NUMBER,
};
use crate::network::wdp::transport_trait::{WdpError, WdpResult};
use std::collections::BTreeMap;

const IPV4_FLAG_RESERVED: u16 = 0x8000;
const IPV4_FRAGMENT_OFFSET_UNIT_BYTES: usize = 8;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Ipv4ReassemblyPolicy {
    pub max_datagram_bytes: usize,
    pub max_pending_datagrams: usize,
    pub max_buffered_payload_bytes: usize,
    pub timeout_ticks: u64,
}

impl Default for Ipv4ReassemblyPolicy {
    fn default() -> Self {
        Self {
            max_datagram_bytes: WDP_IPV4_BASELINE_DATAGRAM_BYTES,
            max_pending_datagrams: 8,
            max_buffered_payload_bytes: 8 * WDP_IPV4_BASELINE_DATAGRAM_BYTES,
            timeout_ticks: 30,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Ipv4FragmentKey {
    pub identification: u16,
    pub source: [u8; 4],
    pub destination: [u8; 4],
    pub protocol: u8,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ipv4ReassemblyPending {
    pub key: Ipv4FragmentKey,
    pub buffered_payload_bytes: usize,
    pub expected_payload_bytes: Option<usize>,
    pub expires_at_tick: u64,
    pub duplicate: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ipv4IncompleteReassembly {
    pub key: Ipv4FragmentKey,
    pub buffered_payload_bytes: usize,
    pub expected_payload_bytes: Option<usize>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Ipv4ReassemblyOutcome {
    Complete(Vec<u8>),
    Pending(Ipv4ReassemblyPending),
}

#[derive(Debug)]
struct ParsedFragment<'a> {
    key: Ipv4FragmentKey,
    header: &'a [u8],
    payload: &'a [u8],
    offset_bytes: usize,
    more_fragments: bool,
}

#[derive(Debug)]
struct PendingAssembly {
    header: Option<Vec<u8>>,
    fragments: BTreeMap<usize, Vec<u8>>,
    final_payload_bytes: Option<usize>,
    buffered_payload_bytes: usize,
    last_activity_tick: u64,
}

#[derive(Debug)]
pub struct Ipv4Reassembler {
    policy: Ipv4ReassemblyPolicy,
    pending: BTreeMap<Ipv4FragmentKey, PendingAssembly>,
    buffered_payload_bytes: usize,
}

impl Ipv4Reassembler {
    pub fn new(policy: Ipv4ReassemblyPolicy) -> WdpResult<Self> {
        if policy.max_datagram_bytes < WDP_IPV4_BASELINE_DATAGRAM_BYTES
            || policy.max_datagram_bytes > WDP_IPV4_MAX_DATAGRAM_BYTES
            || policy.max_pending_datagrams == 0
            || policy.max_buffered_payload_bytes < policy.max_datagram_bytes
            || policy.timeout_ticks == 0
        {
            return Err(WdpError::Ipv4ReassemblyPolicyInvalid);
        }
        Ok(Self {
            policy,
            pending: BTreeMap::new(),
            buffered_payload_bytes: 0,
        })
    }

    pub fn policy(&self) -> Ipv4ReassemblyPolicy {
        self.policy
    }

    pub fn pending_datagrams(&self) -> usize {
        self.pending.len()
    }

    pub fn buffered_payload_bytes(&self) -> usize {
        self.buffered_payload_bytes
    }

    pub fn ingest(&mut self, packet: &[u8], now_tick: u64) -> WdpResult<Ipv4ReassemblyOutcome> {
        let fragment = parse_fragment(packet)?;
        let fragment_total_bytes = fragment
            .header
            .len()
            .checked_add(fragment.offset_bytes)
            .and_then(|length| length.checked_add(fragment.payload.len()))
            .ok_or(WdpError::Ipv4ReassemblyOversize {
                actual: usize::MAX,
                max: self.policy.max_datagram_bytes,
            })?;
        if fragment_total_bytes > self.policy.max_datagram_bytes {
            return Err(WdpError::Ipv4ReassemblyOversize {
                actual: fragment_total_bytes,
                max: self.policy.max_datagram_bytes,
            });
        }

        if fragment.offset_bytes == 0 && !fragment.more_fragments {
            return Ok(Ipv4ReassemblyOutcome::Complete(packet.to_vec()));
        }
        if !self.pending.contains_key(&fragment.key)
            && self.pending.len() >= self.policy.max_pending_datagrams
        {
            return Err(WdpError::Ipv4ReassemblyCapacityExceeded {
                actual: self.pending.len() + 1,
                max: self.policy.max_pending_datagrams,
            });
        }

        let key = fragment.key;
        let duplicate = {
            let assembly = self.pending.entry(key).or_insert_with(|| PendingAssembly {
                header: None,
                fragments: BTreeMap::new(),
                final_payload_bytes: None,
                buffered_payload_bytes: 0,
                last_activity_tick: now_tick,
            });

            if fragment.offset_bytes == 0 {
                match &assembly.header {
                    Some(existing) if existing.as_slice() != fragment.header => {
                        self.discard(key);
                        return Err(malformed("conflicting first-fragment headers"));
                    }
                    None => assembly.header = Some(fragment.header.to_vec()),
                    Some(_) => {}
                }
            }

            let fragment_end = fragment
                .offset_bytes
                .checked_add(fragment.payload.len())
                .ok_or(WdpError::Ipv4ReassemblyOversize {
                    actual: usize::MAX,
                    max: self.policy.max_datagram_bytes,
                })?;
            if let Some(final_payload_bytes) = assembly.final_payload_bytes {
                if fragment_end > final_payload_bytes {
                    self.discard(key);
                    return Err(malformed("fragment extends beyond final payload length"));
                }
            }

            if !fragment.more_fragments {
                match assembly.final_payload_bytes {
                    Some(existing) if existing != fragment_end => {
                        self.discard(key);
                        return Err(malformed("conflicting final-fragment lengths"));
                    }
                    None => {
                        if assembly.fragments.iter().any(|(offset, bytes)| {
                            offset.saturating_add(bytes.len()) > fragment_end
                        }) {
                            self.discard(key);
                            return Err(malformed("final fragment ends before buffered data"));
                        }
                        assembly.final_payload_bytes = Some(fragment_end);
                    }
                    Some(_) => {}
                }
            }

            let duplicate = match assembly.fragments.get(&fragment.offset_bytes) {
                Some(existing) if existing.as_slice() == fragment.payload => true,
                Some(_) => {
                    self.discard(key);
                    return Err(malformed("conflicting fragments share an offset"));
                }
                None => {
                    let overlaps = assembly.fragments.iter().any(|(offset, bytes)| {
                        let existing_end = offset.saturating_add(bytes.len());
                        fragment.offset_bytes < existing_end && *offset < fragment_end
                    });
                    if overlaps {
                        self.discard(key);
                        return Err(malformed("overlapping fragments are rejected"));
                    }
                    let next_buffered = self
                        .buffered_payload_bytes
                        .checked_add(fragment.payload.len())
                        .ok_or(WdpError::Ipv4ReassemblyBufferExceeded {
                            actual: usize::MAX,
                            max: self.policy.max_buffered_payload_bytes,
                        })?;
                    if next_buffered > self.policy.max_buffered_payload_bytes {
                        self.discard(key);
                        return Err(WdpError::Ipv4ReassemblyBufferExceeded {
                            actual: next_buffered,
                            max: self.policy.max_buffered_payload_bytes,
                        });
                    }
                    assembly
                        .fragments
                        .insert(fragment.offset_bytes, fragment.payload.to_vec());
                    assembly.buffered_payload_bytes += fragment.payload.len();
                    self.buffered_payload_bytes = next_buffered;
                    false
                }
            };
            assembly.last_activity_tick = now_tick;
            duplicate
        };

        if let Some(packet) = self.try_complete(key)? {
            return Ok(Ipv4ReassemblyOutcome::Complete(packet));
        }
        let assembly = self
            .pending
            .get(&key)
            .ok_or_else(|| WdpError::Internal("pending IPv4 assembly disappeared".to_string()))?;
        Ok(Ipv4ReassemblyOutcome::Pending(Ipv4ReassemblyPending {
            key,
            buffered_payload_bytes: assembly.buffered_payload_bytes,
            expected_payload_bytes: assembly.final_payload_bytes,
            expires_at_tick: now_tick.saturating_add(self.policy.timeout_ticks),
            duplicate,
        }))
    }

    pub fn expire(&mut self, now_tick: u64) -> Vec<Ipv4IncompleteReassembly> {
        let expired_keys = self
            .pending
            .iter()
            .filter_map(|(key, assembly)| {
                (now_tick.saturating_sub(assembly.last_activity_tick) >= self.policy.timeout_ticks)
                    .then_some(*key)
            })
            .collect::<Vec<_>>();
        expired_keys
            .into_iter()
            .filter_map(|key| {
                self.pending.remove(&key).map(|assembly| {
                    self.buffered_payload_bytes = self
                        .buffered_payload_bytes
                        .saturating_sub(assembly.buffered_payload_bytes);
                    Ipv4IncompleteReassembly {
                        key,
                        buffered_payload_bytes: assembly.buffered_payload_bytes,
                        expected_payload_bytes: assembly.final_payload_bytes,
                    }
                })
            })
            .collect()
    }

    fn discard(&mut self, key: Ipv4FragmentKey) {
        if let Some(assembly) = self.pending.remove(&key) {
            self.buffered_payload_bytes = self
                .buffered_payload_bytes
                .saturating_sub(assembly.buffered_payload_bytes);
        }
    }

    fn try_complete(&mut self, key: Ipv4FragmentKey) -> WdpResult<Option<Vec<u8>>> {
        let Some(assembly) = self.pending.get(&key) else {
            return Ok(None);
        };
        let (Some(header), Some(final_payload_bytes)) =
            (&assembly.header, assembly.final_payload_bytes)
        else {
            return Ok(None);
        };
        let mut cursor = 0usize;
        for (offset, bytes) in &assembly.fragments {
            if *offset != cursor {
                return Ok(None);
            }
            cursor = cursor
                .checked_add(bytes.len())
                .ok_or(WdpError::Ipv4ReassemblyOversize {
                    actual: usize::MAX,
                    max: self.policy.max_datagram_bytes,
                })?;
        }
        if cursor != final_payload_bytes {
            return Ok(None);
        }

        let total_length = header.len().checked_add(final_payload_bytes).ok_or(
            WdpError::Ipv4ReassemblyOversize {
                actual: usize::MAX,
                max: self.policy.max_datagram_bytes,
            },
        )?;
        if total_length > self.policy.max_datagram_bytes {
            self.discard(key);
            return Err(WdpError::Ipv4ReassemblyOversize {
                actual: total_length,
                max: self.policy.max_datagram_bytes,
            });
        }
        let total_length_u16 =
            u16::try_from(total_length).map_err(|_| WdpError::Ipv4ReassemblyOversize {
                actual: total_length,
                max: self.policy.max_datagram_bytes,
            })?;

        let mut packet = Vec::with_capacity(total_length);
        packet.extend_from_slice(header);
        for bytes in assembly.fragments.values() {
            packet.extend_from_slice(bytes);
        }
        packet[2..4].copy_from_slice(&total_length_u16.to_be_bytes());
        packet[6..8].copy_from_slice(&0u16.to_be_bytes());
        packet[10..12].copy_from_slice(&0u16.to_be_bytes());
        let header_checksum = checksum(&packet[..header.len()]);
        packet[10..12].copy_from_slice(&header_checksum.to_be_bytes());
        self.discard(key);
        Ok(Some(packet))
    }
}

fn malformed(reason: &str) -> WdpError {
    WdpError::Ipv4FragmentMalformed {
        reason: reason.to_string(),
    }
}

fn parse_fragment(packet: &[u8]) -> WdpResult<ParsedFragment<'_>> {
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

    let flags_and_offset = u16::from_be_bytes([packet[6], packet[7]]);
    if flags_and_offset & IPV4_FLAG_RESERVED != 0 {
        return Err(malformed("reserved IPv4 flag is set"));
    }
    let fragment_offset_units = flags_and_offset & IPV4_FRAGMENT_OFFSET_MASK;
    let more_fragments = flags_and_offset & IPV4_FLAG_MORE_FRAGMENTS != 0;
    if flags_and_offset & IPV4_FLAG_DONT_FRAGMENT != 0
        && (fragment_offset_units != 0 || more_fragments)
    {
        return Err(malformed("DF is set on a fragmented datagram"));
    }
    let payload = &packet[header_length..];
    if more_fragments
        && (payload.is_empty()
            || !payload
                .len()
                .is_multiple_of(IPV4_FRAGMENT_OFFSET_UNIT_BYTES))
    {
        return Err(malformed(
            "non-final fragment payload must be a non-empty multiple of eight octets",
        ));
    }
    if fragment_offset_units != 0 && payload.is_empty() {
        return Err(malformed("non-initial fragment payload is empty"));
    }
    let offset_bytes = usize::from(fragment_offset_units)
        .checked_mul(IPV4_FRAGMENT_OFFSET_UNIT_BYTES)
        .ok_or(WdpError::Ipv4ReassemblyOversize {
            actual: usize::MAX,
            max: WDP_IPV4_MAX_DATAGRAM_BYTES,
        })?;

    Ok(ParsedFragment {
        key: Ipv4FragmentKey {
            identification: u16::from_be_bytes([packet[4], packet[5]]),
            source: [packet[12], packet[13], packet[14], packet[15]],
            destination: [packet[16], packet[17], packet[18], packet[19]],
            protocol: packet[9],
        },
        header: &packet[..header_length],
        payload,
        offset_bytes,
        more_fragments,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wdp::{
        decode_cdpd_ipv4_udp, encode_cdpd_ipv4_udp, CdpdIpv4SendPolicy, UdpChecksumPolicy,
        WdpAddress, WdpDatagram, WdpServicePort,
    };

    fn datagram(payload_len: usize) -> WdpDatagram {
        WdpDatagram {
            src_addr: WdpAddress::ipv4([192, 0, 2, 10]),
            dst_addr: WdpAddress::ipv4([192, 0, 2, 7]),
            src_port: 49_152,
            dst_port: WdpServicePort::Connectionless as u16,
            payload: vec![0xA5; payload_len],
        }
    }

    fn fragment_packet(
        identification: u16,
        offset_units: u16,
        more_fragments: bool,
        payload: &[u8],
    ) -> Vec<u8> {
        let total_length = IPV4_MIN_HEADER_BYTES + payload.len();
        let mut packet = vec![0u8; total_length];
        packet[0] = 0x45;
        packet[2..4].copy_from_slice(&(total_length as u16).to_be_bytes());
        packet[4..6].copy_from_slice(&identification.to_be_bytes());
        let flags_and_offset = if more_fragments {
            IPV4_FLAG_MORE_FRAGMENTS
        } else {
            0
        } | offset_units;
        packet[6..8].copy_from_slice(&flags_and_offset.to_be_bytes());
        packet[8] = 64;
        packet[9] = WDP_UDP_IPV4_PROTOCOL_NUMBER;
        packet[12..16].copy_from_slice(&[192, 0, 2, 10]);
        packet[16..20].copy_from_slice(&[192, 0, 2, 7]);
        packet[IPV4_MIN_HEADER_BYTES..].copy_from_slice(payload);
        let header_checksum = checksum(&packet[..IPV4_MIN_HEADER_BYTES]);
        packet[10..12].copy_from_slice(&header_checksum.to_be_bytes());
        packet
    }

    #[test]
    fn selected_policy_accepts_whole_baseline_and_rejects_larger_without_truncation() {
        let mut reassembler =
            Ipv4Reassembler::new(Ipv4ReassemblyPolicy::default()).expect("policy should be valid");
        let baseline = encode_cdpd_ipv4_udp(
            &datagram(548),
            CdpdIpv4SendPolicy {
                udp_checksum: UdpChecksumPolicy::Generate,
                ..CdpdIpv4SendPolicy::default()
            },
        )
        .expect("576-octet datagram should encode");
        assert_eq!(baseline.len(), WDP_IPV4_BASELINE_DATAGRAM_BYTES);
        assert!(matches!(
            reassembler.ingest(&baseline, 0),
            Ok(Ipv4ReassemblyOutcome::Complete(packet)) if packet == baseline
        ));

        let oversize = encode_cdpd_ipv4_udp(
            &datagram(549),
            CdpdIpv4SendPolicy {
                destination_accepts_large_datagrams: true,
                ..CdpdIpv4SendPolicy::default()
            },
        )
        .expect("assured 577-octet datagram should encode");
        assert_eq!(
            reassembler.ingest(&oversize, 1),
            Err(WdpError::Ipv4ReassemblyOversize {
                actual: 577,
                max: 576
            })
        );
        assert_eq!(reassembler.pending_datagrams(), 0);
    }

    #[test]
    fn policy_rejects_bounds_that_violate_the_ipv4_baseline() {
        assert!(matches!(
            Ipv4Reassembler::new(Ipv4ReassemblyPolicy {
                max_datagram_bytes: 575,
                ..Ipv4ReassemblyPolicy::default()
            }),
            Err(WdpError::Ipv4ReassemblyPolicyInvalid)
        ));
    }

    #[test]
    fn complete_reassembled_packet_is_accepted_by_the_wdp_udp_decoder() {
        let user_data_bytes = 548;
        let original = encode_cdpd_ipv4_udp(
            &datagram(user_data_bytes),
            CdpdIpv4SendPolicy {
                identification: 0x1234,
                ..CdpdIpv4SendPolicy::default()
            },
        )
        .expect("packet should encode");
        assert_eq!(original.len(), WDP_IPV4_BASELINE_DATAGRAM_BYTES);
        let first_payload_bytes = 552;
        let first_length = IPV4_MIN_HEADER_BYTES + first_payload_bytes;
        let mut first = original[..first_length].to_vec();
        first[2..4].copy_from_slice(&(first_length as u16).to_be_bytes());
        first[6..8].copy_from_slice(&IPV4_FLAG_MORE_FRAGMENTS.to_be_bytes());
        first[10..12].copy_from_slice(&0u16.to_be_bytes());
        let first_checksum = checksum(&first[..IPV4_MIN_HEADER_BYTES]);
        first[10..12].copy_from_slice(&first_checksum.to_be_bytes());

        let mut second = original[..IPV4_MIN_HEADER_BYTES].to_vec();
        second.extend_from_slice(&original[first_length..]);
        let second_length = second.len() as u16;
        second[2..4].copy_from_slice(&second_length.to_be_bytes());
        let second_offset_units = (first_payload_bytes / IPV4_FRAGMENT_OFFSET_UNIT_BYTES) as u16;
        second[6..8].copy_from_slice(&second_offset_units.to_be_bytes());
        second[10..12].copy_from_slice(&0u16.to_be_bytes());
        let second_checksum = checksum(&second[..IPV4_MIN_HEADER_BYTES]);
        second[10..12].copy_from_slice(&second_checksum.to_be_bytes());

        let mut reassembler =
            Ipv4Reassembler::new(Ipv4ReassemblyPolicy::default()).expect("policy should be valid");
        assert!(matches!(
            reassembler.ingest(&second, 1),
            Ok(Ipv4ReassemblyOutcome::Pending(_))
        ));
        let complete = match reassembler
            .ingest(&first, 2)
            .expect("fragments should reassemble")
        {
            Ipv4ReassemblyOutcome::Complete(packet) => packet,
            Ipv4ReassemblyOutcome::Pending(_) => panic!("assembly should be complete"),
        };
        assert_eq!(complete, original);
        assert_eq!(
            decode_cdpd_ipv4_udp(&complete).expect("WDP should receive complete UDP data"),
            datagram(user_data_bytes)
        );
    }

    #[test]
    fn pending_datagram_capacity_is_bounded_without_evicting_existing_state() {
        let mut reassembler = Ipv4Reassembler::new(Ipv4ReassemblyPolicy {
            max_pending_datagrams: 1,
            max_buffered_payload_bytes: WDP_IPV4_BASELINE_DATAGRAM_BYTES,
            ..Ipv4ReassemblyPolicy::default()
        })
        .expect("policy should be valid");
        let first = fragment_packet(1, 0, true, &[0x11; 8]);
        let second = fragment_packet(2, 0, true, &[0x22; 8]);
        assert!(matches!(
            reassembler.ingest(&first, 0),
            Ok(Ipv4ReassemblyOutcome::Pending(_))
        ));
        assert_eq!(
            reassembler.ingest(&second, 1),
            Err(WdpError::Ipv4ReassemblyCapacityExceeded { actual: 2, max: 1 })
        );
        assert_eq!(reassembler.pending_datagrams(), 1);
        assert_eq!(reassembler.buffered_payload_bytes(), 8);
    }

    #[test]
    fn aggregate_buffer_limit_rejects_only_the_new_assembly() {
        let mut reassembler = Ipv4Reassembler::new(Ipv4ReassemblyPolicy {
            max_pending_datagrams: 2,
            max_buffered_payload_bytes: WDP_IPV4_BASELINE_DATAGRAM_BYTES,
            ..Ipv4ReassemblyPolicy::default()
        })
        .expect("policy should be valid");
        let first = fragment_packet(1, 0, true, &[0x11; 552]);
        let second = fragment_packet(2, 0, true, &[0x22; 32]);
        assert!(matches!(
            reassembler.ingest(&first, 0),
            Ok(Ipv4ReassemblyOutcome::Pending(_))
        ));
        assert_eq!(
            reassembler.ingest(&second, 1),
            Err(WdpError::Ipv4ReassemblyBufferExceeded {
                actual: 584,
                max: 576
            })
        );
        assert_eq!(reassembler.pending_datagrams(), 1);
        assert_eq!(reassembler.buffered_payload_bytes(), 552);
    }
}
