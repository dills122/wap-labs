use crate::network::wdp::ipv4_udp::{checksum, IPV4_FLAG_DONT_FRAGMENT, IPV4_FRAGMENT_OFFSET_MASK};
use crate::network::wdp::{WdpError, WDP_IPV4_MAX_DATAGRAM_BYTES, WDP_UDP_IPV4_PROTOCOL_NUMBER};

pub const ICMPV4_PROTOCOL_NUMBER: u8 = 1;
pub const ICMPV4_TYPE_ECHO_REPLY: u8 = 0;
pub const ICMPV4_TYPE_DESTINATION_UNREACHABLE: u8 = 3;
pub const ICMPV4_TYPE_ECHO_REQUEST: u8 = 8;

const ICMPV4_HEADER_BYTES: usize = 8;
const IPV4_MIN_HEADER_BYTES: usize = 20;
const UDP_HEADER_BYTES: usize = 8;
const ICMPV4_MIN_ERROR_BYTES: usize =
    ICMPV4_HEADER_BYTES + IPV4_MIN_HEADER_BYTES + UDP_HEADER_BYTES;
const ICMPV4_MAX_MESSAGE_BYTES: usize = WDP_IPV4_MAX_DATAGRAM_BYTES - IPV4_MIN_HEADER_BYTES;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Icmpv4DestinationUnreachableCode {
    PortUnreachable,
    FragmentationNeededAndDfSet,
}

impl Icmpv4DestinationUnreachableCode {
    const fn to_u8(self) -> u8 {
        match self {
            Self::PortUnreachable => 3,
            Self::FragmentationNeededAndDfSet => 4,
        }
    }

    const fn from_u8(value: u8) -> Option<Self> {
        match value {
            3 => Some(Self::PortUnreachable),
            4 => Some(Self::FragmentationNeededAndDfSet),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Icmpv4Message {
    DestinationUnreachable {
        code: Icmpv4DestinationUnreachableCode,
        next_hop_mtu: Option<u16>,
        original_datagram: Vec<u8>,
    },
    EchoRequest {
        identifier: u16,
        sequence_number: u16,
        data: Vec<u8>,
    },
    EchoReply {
        identifier: u16,
        sequence_number: u16,
        data: Vec<u8>,
    },
}

impl Icmpv4Message {
    pub const fn message_type(&self) -> u8 {
        match self {
            Self::DestinationUnreachable { .. } => ICMPV4_TYPE_DESTINATION_UNREACHABLE,
            Self::EchoRequest { .. } => ICMPV4_TYPE_ECHO_REQUEST,
            Self::EchoReply { .. } => ICMPV4_TYPE_ECHO_REPLY,
        }
    }

    pub const fn code(&self) -> u8 {
        match self {
            Self::DestinationUnreachable { code, .. } => code.to_u8(),
            Self::EchoRequest { .. } | Self::EchoReply { .. } => 0,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Icmpv4DecodeError {
    PacketTooLarge {
        actual: usize,
        max: usize,
    },
    Truncated {
        needed: usize,
        actual: usize,
    },
    InvalidChecksum,
    UnsupportedType(u8),
    InvalidCode {
        message_type: u8,
        code: u8,
    },
    NonZeroUnusedField,
    QuotedIpv4VersionUnsupported(u8),
    QuotedIpv4HeaderLengthInvalid(u8),
    QuotedIpv4TotalLengthInvalid {
        declared: usize,
        minimum: usize,
    },
    QuotedIpv4HeaderChecksumInvalid,
    QuotedIpv4FragmentOffsetNonZero(u16),
    QuotedUdpLengthInvalid {
        declared: usize,
        ipv4_payload: usize,
    },
    QuotedDatagramTruncated {
        needed: usize,
        actual: usize,
    },
    QuotedDatagramLengthInvalid {
        expected: usize,
        actual: usize,
    },
    QuotedIpv4ProtocolUnsupported(u8),
    FragmentationNeededWithoutDf,
}

impl std::fmt::Display for Icmpv4DecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::PacketTooLarge { actual, max } => {
                write!(f, "ICMPv4 packet size {actual} exceeds {max}")
            }
            Self::Truncated { needed, actual } => {
                write!(
                    f,
                    "truncated ICMPv4 packet: need {needed} octets, got {actual}"
                )
            }
            Self::InvalidChecksum => write!(f, "invalid ICMPv4 checksum"),
            Self::UnsupportedType(message_type) => {
                write!(f, "unsupported ICMPv4 type {message_type}")
            }
            Self::InvalidCode { message_type, code } => {
                write!(f, "invalid ICMPv4 code {code} for type {message_type}")
            }
            Self::NonZeroUnusedField => write!(f, "ICMPv4 unused field is non-zero"),
            Self::QuotedIpv4VersionUnsupported(version) => {
                write!(f, "unsupported quoted IP version {version}; expected IPv4")
            }
            Self::QuotedIpv4HeaderLengthInvalid(ihl) => {
                write!(f, "invalid quoted IPv4 IHL {ihl}; expected at least 5")
            }
            Self::QuotedIpv4TotalLengthInvalid { declared, minimum } => write!(
                f,
                "invalid quoted IPv4 total length {declared}; expected at least {minimum}"
            ),
            Self::QuotedIpv4HeaderChecksumInvalid => {
                write!(f, "invalid quoted IPv4 header checksum")
            }
            Self::QuotedIpv4FragmentOffsetNonZero(offset) => write!(
                f,
                "invalid quoted IPv4 fragment offset {offset}; expected first fragment"
            ),
            Self::QuotedUdpLengthInvalid {
                declared,
                ipv4_payload,
            } => write!(
                f,
                "invalid quoted UDP length {declared}; IPv4 payload is {ipv4_payload} octets"
            ),
            Self::QuotedDatagramTruncated { needed, actual } => write!(
                f,
                "truncated ICMPv4 quoted datagram: need {needed} octets, got {actual}"
            ),
            Self::QuotedDatagramLengthInvalid { expected, actual } => write!(
                f,
                "invalid ICMPv4 quoted datagram length: expected {expected} octets, got {actual}"
            ),
            Self::QuotedIpv4ProtocolUnsupported(protocol) => write!(
                f,
                "unsupported quoted IPv4 protocol {protocol}; expected UDP 17"
            ),
            Self::FragmentationNeededWithoutDf => write!(
                f,
                "ICMPv4 fragmentation-needed quote does not have the IPv4 DF flag set"
            ),
        }
    }
}

impl std::error::Error for Icmpv4DecodeError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Icmpv4EncodeError {
    MessageTooLarge { actual: usize, max: usize },
    LengthOverflow,
    InvalidOriginalDatagram(Icmpv4DecodeError),
    PortUnreachableCarriesMtu,
    FragmentationNeededMissingMtu,
}

impl std::fmt::Display for Icmpv4EncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::MessageTooLarge { actual, max } => {
                write!(f, "ICMPv4 message size {actual} exceeds {max}")
            }
            Self::LengthOverflow => write!(f, "ICMPv4 message length overflow"),
            Self::InvalidOriginalDatagram(error) => {
                write!(f, "invalid ICMPv4 original datagram quote: {error}")
            }
            Self::PortUnreachableCarriesMtu => {
                write!(
                    f,
                    "ICMPv4 port-unreachable message cannot carry a next-hop MTU"
                )
            }
            Self::FragmentationNeededMissingMtu => write!(
                f,
                "strict ICMPv4 fragmentation-needed generation requires a next-hop MTU"
            ),
        }
    }
}

impl std::error::Error for Icmpv4EncodeError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct QuotedDatagramMetadata {
    total_length: usize,
    destination_port: u16,
    dont_fragment: bool,
    quote_length: usize,
}

fn require_len(input: &[u8], needed: usize) -> Result<(), Icmpv4DecodeError> {
    super::require_min_len(input, needed, |needed, actual| {
        Icmpv4DecodeError::Truncated { needed, actual }
    })
}

fn quoted_datagram_metadata(
    original_datagram: &[u8],
) -> Result<QuotedDatagramMetadata, Icmpv4DecodeError> {
    if original_datagram.len() < IPV4_MIN_HEADER_BYTES {
        return Err(Icmpv4DecodeError::QuotedDatagramTruncated {
            needed: IPV4_MIN_HEADER_BYTES,
            actual: original_datagram.len(),
        });
    }
    let version = original_datagram[0] >> 4;
    if version != 4 {
        return Err(Icmpv4DecodeError::QuotedIpv4VersionUnsupported(version));
    }
    let ihl = original_datagram[0] & 0x0F;
    if ihl < 5 {
        return Err(Icmpv4DecodeError::QuotedIpv4HeaderLengthInvalid(ihl));
    }
    let header_length = usize::from(ihl) * 4;
    let needed = header_length + UDP_HEADER_BYTES;
    if original_datagram.len() < needed {
        return Err(Icmpv4DecodeError::QuotedDatagramTruncated {
            needed,
            actual: original_datagram.len(),
        });
    }
    if original_datagram[9] != WDP_UDP_IPV4_PROTOCOL_NUMBER {
        return Err(Icmpv4DecodeError::QuotedIpv4ProtocolUnsupported(
            original_datagram[9],
        ));
    }
    let total_length = usize::from(u16::from_be_bytes([
        original_datagram[2],
        original_datagram[3],
    ]));
    if total_length < needed {
        return Err(Icmpv4DecodeError::QuotedIpv4TotalLengthInvalid {
            declared: total_length,
            minimum: needed,
        });
    }
    if checksum(&original_datagram[..header_length]) != 0 {
        return Err(Icmpv4DecodeError::QuotedIpv4HeaderChecksumInvalid);
    }
    let flags_and_offset = u16::from_be_bytes([original_datagram[6], original_datagram[7]]);
    let fragment_offset = flags_and_offset & IPV4_FRAGMENT_OFFSET_MASK;
    if fragment_offset != 0 {
        return Err(Icmpv4DecodeError::QuotedIpv4FragmentOffsetNonZero(
            fragment_offset,
        ));
    }
    let udp_length = usize::from(u16::from_be_bytes([
        original_datagram[header_length + 4],
        original_datagram[header_length + 5],
    ]));
    let ipv4_payload = total_length - header_length;
    if udp_length < UDP_HEADER_BYTES || udp_length != ipv4_payload {
        return Err(Icmpv4DecodeError::QuotedUdpLengthInvalid {
            declared: udp_length,
            ipv4_payload,
        });
    }
    Ok(QuotedDatagramMetadata {
        total_length,
        destination_port: u16::from_be_bytes([
            original_datagram[header_length + 2],
            original_datagram[header_length + 3],
        ]),
        dont_fragment: flags_and_offset & IPV4_FLAG_DONT_FRAGMENT != 0,
        quote_length: needed,
    })
}

fn encoded_len(message: &Icmpv4Message) -> Result<usize, Icmpv4EncodeError> {
    let data_len = match message {
        Icmpv4Message::DestinationUnreachable {
            original_datagram, ..
        } => original_datagram.len(),
        Icmpv4Message::EchoRequest { data, .. } | Icmpv4Message::EchoReply { data, .. } => {
            data.len()
        }
    };
    ICMPV4_HEADER_BYTES
        .checked_add(data_len)
        .ok_or(Icmpv4EncodeError::LengthOverflow)
}

pub fn encode_icmpv4(message: &Icmpv4Message) -> Result<Vec<u8>, Icmpv4EncodeError> {
    let message_len = encoded_len(message)?;
    if message_len > ICMPV4_MAX_MESSAGE_BYTES {
        return Err(Icmpv4EncodeError::MessageTooLarge {
            actual: message_len,
            max: ICMPV4_MAX_MESSAGE_BYTES,
        });
    }
    let mut output = vec![0u8; message_len];
    output[0] = message.message_type();
    output[1] = message.code();
    match message {
        Icmpv4Message::DestinationUnreachable {
            code,
            next_hop_mtu,
            original_datagram,
        } => {
            let metadata = quoted_datagram_metadata(original_datagram)
                .map_err(Icmpv4EncodeError::InvalidOriginalDatagram)?;
            if original_datagram.len() != metadata.quote_length {
                return Err(Icmpv4EncodeError::InvalidOriginalDatagram(
                    Icmpv4DecodeError::QuotedDatagramLengthInvalid {
                        expected: metadata.quote_length,
                        actual: original_datagram.len(),
                    },
                ));
            }
            match code {
                Icmpv4DestinationUnreachableCode::PortUnreachable => {
                    if next_hop_mtu.is_some() {
                        return Err(Icmpv4EncodeError::PortUnreachableCarriesMtu);
                    }
                }
                Icmpv4DestinationUnreachableCode::FragmentationNeededAndDfSet => {
                    if !metadata.dont_fragment {
                        return Err(Icmpv4EncodeError::InvalidOriginalDatagram(
                            Icmpv4DecodeError::FragmentationNeededWithoutDf,
                        ));
                    }
                    let mtu =
                        next_hop_mtu.ok_or(Icmpv4EncodeError::FragmentationNeededMissingMtu)?;
                    output[6..8].copy_from_slice(&mtu.to_be_bytes());
                }
            }
            output[ICMPV4_HEADER_BYTES..].copy_from_slice(original_datagram);
        }
        Icmpv4Message::EchoRequest {
            identifier,
            sequence_number,
            data,
        }
        | Icmpv4Message::EchoReply {
            identifier,
            sequence_number,
            data,
        } => {
            output[4..6].copy_from_slice(&identifier.to_be_bytes());
            output[6..8].copy_from_slice(&sequence_number.to_be_bytes());
            output[ICMPV4_HEADER_BYTES..].copy_from_slice(data);
        }
    }
    let computed = checksum(&output);
    output[2..4].copy_from_slice(&computed.to_be_bytes());
    Ok(output)
}

pub fn decode_icmpv4(input: &[u8]) -> Result<Icmpv4Message, Icmpv4DecodeError> {
    if input.len() > ICMPV4_MAX_MESSAGE_BYTES {
        return Err(Icmpv4DecodeError::PacketTooLarge {
            actual: input.len(),
            max: ICMPV4_MAX_MESSAGE_BYTES,
        });
    }
    require_len(input, ICMPV4_HEADER_BYTES)?;
    if checksum(input) != 0 {
        return Err(Icmpv4DecodeError::InvalidChecksum);
    }
    let message_type = input[0];
    let code = input[1];
    match message_type {
        ICMPV4_TYPE_DESTINATION_UNREACHABLE => {
            require_len(input, ICMPV4_MIN_ERROR_BYTES)?;
            let code = Icmpv4DestinationUnreachableCode::from_u8(code)
                .ok_or(Icmpv4DecodeError::InvalidCode { message_type, code })?;
            let next_hop_mtu = match code {
                Icmpv4DestinationUnreachableCode::PortUnreachable => {
                    if input[4..8] != [0, 0, 0, 0] {
                        return Err(Icmpv4DecodeError::NonZeroUnusedField);
                    }
                    None
                }
                Icmpv4DestinationUnreachableCode::FragmentationNeededAndDfSet => {
                    if input[4..6] != [0, 0] {
                        return Err(Icmpv4DecodeError::NonZeroUnusedField);
                    }
                    let mtu = u16::from_be_bytes([input[6], input[7]]);
                    (mtu != 0).then_some(mtu)
                }
            };
            let original_datagram = input[ICMPV4_HEADER_BYTES..].to_vec();
            let metadata = quoted_datagram_metadata(&original_datagram)?;
            if original_datagram.len() != metadata.quote_length {
                return Err(Icmpv4DecodeError::QuotedDatagramLengthInvalid {
                    expected: metadata.quote_length,
                    actual: original_datagram.len(),
                });
            }
            if code == Icmpv4DestinationUnreachableCode::FragmentationNeededAndDfSet
                && !metadata.dont_fragment
            {
                return Err(Icmpv4DecodeError::FragmentationNeededWithoutDf);
            }
            Ok(Icmpv4Message::DestinationUnreachable {
                code,
                next_hop_mtu,
                original_datagram,
            })
        }
        ICMPV4_TYPE_ECHO_REQUEST | ICMPV4_TYPE_ECHO_REPLY => {
            if code != 0 {
                return Err(Icmpv4DecodeError::InvalidCode { message_type, code });
            }
            let identifier = u16::from_be_bytes([input[4], input[5]]);
            let sequence_number = u16::from_be_bytes([input[6], input[7]]);
            let data = input[ICMPV4_HEADER_BYTES..].to_vec();
            if message_type == ICMPV4_TYPE_ECHO_REQUEST {
                Ok(Icmpv4Message::EchoRequest {
                    identifier,
                    sequence_number,
                    data,
                })
            } else {
                Ok(Icmpv4Message::EchoReply {
                    identifier,
                    sequence_number,
                    data,
                })
            }
        }
        _ => Err(Icmpv4DecodeError::UnsupportedType(message_type)),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Icmpv4ReportedError {
    PortUnreachable {
        destination_port: u16,
    },
    FragmentationNeeded {
        original_datagram_bytes: usize,
        next_hop_mtu: Option<u16>,
    },
}

impl Icmpv4ReportedError {
    pub fn to_wdp_error(&self) -> WdpError {
        match self {
            Self::PortUnreachable { destination_port } => {
                WdpError::DestinationPortUnsupported(*destination_port)
            }
            Self::FragmentationNeeded {
                original_datagram_bytes,
                next_hop_mtu,
            } => WdpError::Ipv4FragmentationNeeded {
                actual: *original_datagram_bytes,
                next_hop_mtu: next_hop_mtu.map(usize::from),
            },
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Icmpv4SuppressionReason {
    EchoReplyRateLimited,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Icmpv4HandlingPolicy {
    pub permit_echo_reply: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Icmpv4HandlingOutcome {
    ReportedError(Icmpv4ReportedError),
    EchoReplyGenerated {
        message: Icmpv4Message,
        packet: Vec<u8>,
    },
    EchoReplySuppressed(Icmpv4SuppressionReason),
    EchoReplyReceived {
        identifier: u16,
        sequence_number: u16,
        data: Vec<u8>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Icmpv4HandlingError {
    Decode(Icmpv4DecodeError),
    Encode(Icmpv4EncodeError),
}

impl std::fmt::Display for Icmpv4HandlingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Decode(error) => write!(f, "ICMPv4 decode failed: {error}"),
            Self::Encode(error) => write!(f, "ICMPv4 reply generation failed: {error}"),
        }
    }
}

impl std::error::Error for Icmpv4HandlingError {}

impl From<Icmpv4DecodeError> for Icmpv4HandlingError {
    fn from(value: Icmpv4DecodeError) -> Self {
        Self::Decode(value)
    }
}

impl From<Icmpv4EncodeError> for Icmpv4HandlingError {
    fn from(value: Icmpv4EncodeError) -> Self {
        Self::Encode(value)
    }
}

pub fn handle_icmpv4(
    input: &[u8],
    policy: Icmpv4HandlingPolicy,
) -> Result<Icmpv4HandlingOutcome, Icmpv4HandlingError> {
    match decode_icmpv4(input)? {
        Icmpv4Message::DestinationUnreachable {
            code,
            next_hop_mtu,
            original_datagram,
        } => {
            let metadata = quoted_datagram_metadata(&original_datagram)?;
            let error = match code {
                Icmpv4DestinationUnreachableCode::PortUnreachable => {
                    Icmpv4ReportedError::PortUnreachable {
                        destination_port: metadata.destination_port,
                    }
                }
                Icmpv4DestinationUnreachableCode::FragmentationNeededAndDfSet => {
                    Icmpv4ReportedError::FragmentationNeeded {
                        original_datagram_bytes: metadata.total_length,
                        next_hop_mtu,
                    }
                }
            };
            Ok(Icmpv4HandlingOutcome::ReportedError(error))
        }
        Icmpv4Message::EchoRequest {
            identifier,
            sequence_number,
            data,
        } => {
            if !policy.permit_echo_reply {
                return Ok(Icmpv4HandlingOutcome::EchoReplySuppressed(
                    Icmpv4SuppressionReason::EchoReplyRateLimited,
                ));
            }
            let message = Icmpv4Message::EchoReply {
                identifier,
                sequence_number,
                data,
            };
            let packet = encode_icmpv4(&message)?;
            Ok(Icmpv4HandlingOutcome::EchoReplyGenerated { message, packet })
        }
        Icmpv4Message::EchoReply {
            identifier,
            sequence_number,
            data,
        } => Ok(Icmpv4HandlingOutcome::EchoReplyReceived {
            identifier,
            sequence_number,
            data,
        }),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Icmpv4GeneratedError {
    pub message: Icmpv4Message,
    pub packet: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Icmpv4ErrorGenerationError {
    UnsupportedWdpError,
    DestinationPortMismatch {
        error_port: u16,
        quoted_port: u16,
    },
    OriginalLengthMismatch {
        error_length: usize,
        quoted_length: usize,
    },
    NextHopMtuOutOfRange(usize),
    InvalidOriginalDatagram(Icmpv4DecodeError),
    Encode(Icmpv4EncodeError),
}

impl std::fmt::Display for Icmpv4ErrorGenerationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedWdpError => write!(f, "WDP error has no selected ICMPv4 mapping"),
            Self::DestinationPortMismatch {
                error_port,
                quoted_port,
            } => write!(
                f,
                "WDP destination port {error_port} differs from quoted UDP port {quoted_port}"
            ),
            Self::OriginalLengthMismatch {
                error_length,
                quoted_length,
            } => write!(
                f,
                "WDP datagram length {error_length} differs from quoted IPv4 length {quoted_length}"
            ),
            Self::NextHopMtuOutOfRange(mtu) => {
                write!(f, "next-hop MTU {mtu} cannot be encoded in ICMPv4")
            }
            Self::InvalidOriginalDatagram(error) => {
                write!(f, "invalid ICMPv4 original datagram quote: {error}")
            }
            Self::Encode(error) => write!(f, "ICMPv4 error generation failed: {error}"),
        }
    }
}

impl std::error::Error for Icmpv4ErrorGenerationError {}

impl From<Icmpv4EncodeError> for Icmpv4ErrorGenerationError {
    fn from(value: Icmpv4EncodeError) -> Self {
        Self::Encode(value)
    }
}

pub fn generate_icmpv4_error(
    error: &WdpError,
    original_datagram: Vec<u8>,
) -> Result<Icmpv4GeneratedError, Icmpv4ErrorGenerationError> {
    let metadata = quoted_datagram_metadata(&original_datagram)
        .map_err(Icmpv4ErrorGenerationError::InvalidOriginalDatagram)?;
    let original_datagram = original_datagram[..metadata.quote_length].to_vec();
    let message = match error {
        WdpError::DestinationPortUnsupported(error_port) => {
            if *error_port != metadata.destination_port {
                return Err(Icmpv4ErrorGenerationError::DestinationPortMismatch {
                    error_port: *error_port,
                    quoted_port: metadata.destination_port,
                });
            }
            Icmpv4Message::DestinationUnreachable {
                code: Icmpv4DestinationUnreachableCode::PortUnreachable,
                next_hop_mtu: None,
                original_datagram,
            }
        }
        WdpError::Ipv4DontFragmentMtuExceeded { actual, mtu } => {
            if *actual != metadata.total_length {
                return Err(Icmpv4ErrorGenerationError::OriginalLengthMismatch {
                    error_length: *actual,
                    quoted_length: metadata.total_length,
                });
            }
            let mtu = u16::try_from(*mtu)
                .map_err(|_| Icmpv4ErrorGenerationError::NextHopMtuOutOfRange(*mtu))?;
            Icmpv4Message::DestinationUnreachable {
                code: Icmpv4DestinationUnreachableCode::FragmentationNeededAndDfSet,
                next_hop_mtu: Some(mtu),
                original_datagram,
            }
        }
        _ => return Err(Icmpv4ErrorGenerationError::UnsupportedWdpError),
    };
    let packet = encode_icmpv4(&message)?;
    Ok(Icmpv4GeneratedError { message, packet })
}

#[cfg(test)]
mod tests {
    use super::*;

    const UDP_QUOTE: [u8; 28] = [
        69, 0, 0, 33, 18, 52, 0, 0, 64, 17, 228, 134, 192, 0, 2, 10, 192, 0, 2, 7, 192, 0, 35, 240,
        0, 13, 249, 51,
    ];
    const UDP_DF_QUOTE: [u8; 28] = [
        69, 0, 0, 33, 18, 52, 64, 0, 64, 17, 164, 134, 192, 0, 2, 10, 192, 0, 2, 7, 192, 0, 35,
        240, 0, 13, 249, 51,
    ];

    #[test]
    fn destination_errors_encode_decode_and_map_exactly() {
        let port = Icmpv4Message::DestinationUnreachable {
            code: Icmpv4DestinationUnreachableCode::PortUnreachable,
            next_hop_mtu: None,
            original_datagram: UDP_QUOTE.to_vec(),
        };
        let fragment = Icmpv4Message::DestinationUnreachable {
            code: Icmpv4DestinationUnreachableCode::FragmentationNeededAndDfSet,
            next_hop_mtu: Some(576),
            original_datagram: UDP_DF_QUOTE.to_vec(),
        };
        for expected in [port, fragment] {
            let encoded = encode_icmpv4(&expected).expect("valid ICMPv4 should encode");
            assert_eq!(decode_icmpv4(&encoded), Ok(expected));
        }

        let port_packet = encode_icmpv4(&Icmpv4Message::DestinationUnreachable {
            code: Icmpv4DestinationUnreachableCode::PortUnreachable,
            next_hop_mtu: None,
            original_datagram: UDP_QUOTE.to_vec(),
        })
        .expect("port report should encode");
        let Icmpv4HandlingOutcome::ReportedError(error) = handle_icmpv4(
            &port_packet,
            Icmpv4HandlingPolicy {
                permit_echo_reply: true,
            },
        )
        .expect("port report should map") else {
            panic!("expected a reported WDP error");
        };
        assert_eq!(
            error.to_wdp_error(),
            WdpError::DestinationPortUnsupported(9200)
        );

        let mut full_datagram = UDP_QUOTE.to_vec();
        full_datagram.extend_from_slice(&[0xDE, 0xAD, 0xBE, 0xEF, 1]);
        let generated =
            generate_icmpv4_error(&WdpError::DestinationPortUnsupported(9200), full_datagram)
                .expect("generation should quote only the IPv4 header and first 64 data bits");
        assert_eq!(&generated.packet[ICMPV4_HEADER_BYTES..], UDP_QUOTE);
    }

    #[test]
    fn echo_reply_is_deterministic_and_preserves_payload() {
        let request = Icmpv4Message::EchoRequest {
            identifier: 0x1234,
            sequence_number: 2,
            data: vec![0xDE, 0xAD, 0xBE, 0xEF],
        };
        let packet = encode_icmpv4(&request).expect("echo should encode");
        assert_eq!(packet, [8, 0, 72, 44, 18, 52, 0, 2, 222, 173, 190, 239]);
        let Icmpv4HandlingOutcome::EchoReplyGenerated { message, packet } = handle_icmpv4(
            &packet,
            Icmpv4HandlingPolicy {
                permit_echo_reply: true,
            },
        )
        .expect("echo should be handled") else {
            panic!("expected echo reply generation");
        };
        assert_eq!(
            message,
            Icmpv4Message::EchoReply {
                identifier: 0x1234,
                sequence_number: 2,
                data: vec![0xDE, 0xAD, 0xBE, 0xEF],
            }
        );
        assert_eq!(packet, [0, 0, 80, 44, 18, 52, 0, 2, 222, 173, 190, 239]);
    }

    #[test]
    fn malformed_checksum_and_fragment_quote_are_rejected() {
        let mut invalid_checksum = [8, 0, 72, 44, 18, 52, 0, 2, 222, 173, 190, 239];
        invalid_checksum[11] ^= 1;
        assert_eq!(
            decode_icmpv4(&invalid_checksum),
            Err(Icmpv4DecodeError::InvalidChecksum)
        );

        let without_df = Icmpv4Message::DestinationUnreachable {
            code: Icmpv4DestinationUnreachableCode::FragmentationNeededAndDfSet,
            next_hop_mtu: Some(576),
            original_datagram: UDP_QUOTE.to_vec(),
        };
        assert_eq!(
            encode_icmpv4(&without_df),
            Err(Icmpv4EncodeError::InvalidOriginalDatagram(
                Icmpv4DecodeError::FragmentationNeededWithoutDf
            ))
        );

        let mut invalid_quote = UDP_QUOTE.to_vec();
        invalid_quote[12] ^= 1;
        assert_eq!(
            encode_icmpv4(&Icmpv4Message::DestinationUnreachable {
                code: Icmpv4DestinationUnreachableCode::PortUnreachable,
                next_hop_mtu: None,
                original_datagram: invalid_quote,
            }),
            Err(Icmpv4EncodeError::InvalidOriginalDatagram(
                Icmpv4DecodeError::QuotedIpv4HeaderChecksumInvalid
            ))
        );
    }
}
