use super::message::{
    WcmpAddress, WcmpDestinationUnreachableCode, WcmpMessage, WcmpTypeClass,
    WCMP_TYPE_DESTINATION_UNREACHABLE, WCMP_TYPE_ECHO_REPLY, WCMP_TYPE_ECHO_REQUEST,
    WCMP_TYPE_MESSAGE_TOO_BIG,
};
use crate::network::wdp::datagram::WDP_MAX_UDP_PAYLOAD_BYTES;

const GENERAL_HEADER_BYTES: usize = 2;
const PORT_FIELDS_BYTES: usize = 4;
const ADDRESS_HEADER_BYTES: usize = 2;
const ECHO_FIXED_BYTES: usize = 6;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WcmpDecodeError {
    PacketTooLarge {
        actual: usize,
        max: usize,
    },
    Truncated {
        needed: usize,
        actual: usize,
    },
    UnsupportedType {
        message_type: u8,
        class: WcmpTypeClass,
    },
    InvalidCode {
        message_type: u8,
        code: u8,
    },
    LengthMismatch {
        expected: usize,
        actual: usize,
    },
    LengthOverflow,
}

impl std::fmt::Display for WcmpDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::PacketTooLarge { actual, max } => {
                write!(f, "WCMP packet size {actual} exceeds {max}")
            }
            Self::Truncated { needed, actual } => {
                write!(
                    f,
                    "truncated WCMP packet: need {needed} octets, got {actual}"
                )
            }
            Self::UnsupportedType {
                message_type,
                class,
            } => write!(f, "unsupported WCMP type {message_type} in {class:?} class"),
            Self::InvalidCode { message_type, code } => {
                write!(f, "invalid WCMP code {code} for type {message_type}")
            }
            Self::LengthMismatch { expected, actual } => {
                write!(
                    f,
                    "WCMP packet length mismatch: expected {expected}, got {actual}"
                )
            }
            Self::LengthOverflow => write!(f, "WCMP packet length overflow"),
        }
    }
}

impl std::error::Error for WcmpDecodeError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WcmpEncodeError {
    AddressTooLong { actual: usize, max: usize },
    MessageTooLarge { actual: usize, max: usize },
    LengthOverflow,
}

impl std::fmt::Display for WcmpEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::AddressTooLong { actual, max } => {
                write!(f, "WCMP address size {actual} exceeds {max}")
            }
            Self::MessageTooLarge { actual, max } => {
                write!(
                    f,
                    "WCMP message size {actual} exceeds bearer fragment size {max}"
                )
            }
            Self::LengthOverflow => write!(f, "WCMP message length overflow"),
        }
    }
}

impl std::error::Error for WcmpEncodeError {}

fn checked_total(parts: &[usize]) -> Result<usize, WcmpEncodeError> {
    parts.iter().try_fold(0usize, |total, part| {
        total
            .checked_add(*part)
            .ok_or(WcmpEncodeError::LengthOverflow)
    })
}

fn encoded_address_length(address: &WcmpAddress) -> Result<usize, WcmpEncodeError> {
    if address.data.len() > u8::MAX as usize {
        return Err(WcmpEncodeError::AddressTooLong {
            actual: address.data.len(),
            max: u8::MAX as usize,
        });
    }
    checked_total(&[ADDRESS_HEADER_BYTES, address.data.len()])
}

fn push_u16(output: &mut Vec<u8>, value: u16) {
    output.extend_from_slice(&value.to_be_bytes());
}

fn push_address(output: &mut Vec<u8>, address: &WcmpAddress) {
    output.push(address.address_type);
    output.push(address.data.len() as u8);
    output.extend_from_slice(&address.data);
}

pub fn encoded_wcmp_len(message: &WcmpMessage) -> Result<usize, WcmpEncodeError> {
    match message {
        WcmpMessage::DestinationUnreachable { address, .. } => checked_total(&[
            GENERAL_HEADER_BYTES,
            PORT_FIELDS_BYTES,
            encoded_address_length(address)?,
        ]),
        WcmpMessage::MessageTooBig { address, .. } => checked_total(&[
            GENERAL_HEADER_BYTES,
            PORT_FIELDS_BYTES,
            encoded_address_length(address)?,
            2,
        ]),
        WcmpMessage::EchoRequest { data, .. } | WcmpMessage::EchoReply { data, .. } => {
            checked_total(&[ECHO_FIXED_BYTES, data.len()])
        }
    }
}

pub fn encode_wcmp(
    message: &WcmpMessage,
    max_bearer_fragment_bytes: usize,
) -> Result<Vec<u8>, WcmpEncodeError> {
    let encoded_len = encoded_wcmp_len(message)?;
    if encoded_len > max_bearer_fragment_bytes {
        return Err(WcmpEncodeError::MessageTooLarge {
            actual: encoded_len,
            max: max_bearer_fragment_bytes,
        });
    }

    let mut output = Vec::with_capacity(encoded_len);
    output.push(message.message_type());
    output.push(message.code());
    match message {
        WcmpMessage::DestinationUnreachable {
            destination_port,
            originator_port,
            address,
            ..
        } => {
            push_u16(&mut output, *destination_port);
            push_u16(&mut output, *originator_port);
            push_address(&mut output, address);
        }
        WcmpMessage::MessageTooBig {
            destination_port,
            originator_port,
            address,
            maximum_message_size,
        } => {
            push_u16(&mut output, *destination_port);
            push_u16(&mut output, *originator_port);
            push_address(&mut output, address);
            push_u16(&mut output, *maximum_message_size);
        }
        WcmpMessage::EchoRequest {
            identifier,
            sequence_number,
            data,
        }
        | WcmpMessage::EchoReply {
            identifier,
            sequence_number,
            data,
        } => {
            push_u16(&mut output, *identifier);
            push_u16(&mut output, *sequence_number);
            output.extend_from_slice(data);
        }
    }
    Ok(output)
}

fn require_len(input: &[u8], needed: usize) -> Result<(), WcmpDecodeError> {
    if input.len() < needed {
        return Err(WcmpDecodeError::Truncated {
            needed,
            actual: input.len(),
        });
    }
    Ok(())
}

fn read_u16(input: &[u8], offset: usize) -> Result<u16, WcmpDecodeError> {
    let end = offset
        .checked_add(2)
        .ok_or(WcmpDecodeError::LengthOverflow)?;
    require_len(input, end)?;
    Ok(u16::from_be_bytes([input[offset], input[offset + 1]]))
}

fn decode_address(input: &[u8], offset: usize) -> Result<(WcmpAddress, usize), WcmpDecodeError> {
    let header_end = offset
        .checked_add(ADDRESS_HEADER_BYTES)
        .ok_or(WcmpDecodeError::LengthOverflow)?;
    require_len(input, header_end)?;
    let data_len = input[offset + 1] as usize;
    let data_end = header_end
        .checked_add(data_len)
        .ok_or(WcmpDecodeError::LengthOverflow)?;
    require_len(input, data_end)?;
    Ok((
        WcmpAddress::new(input[offset], input[header_end..data_end].to_vec()),
        data_end,
    ))
}

fn require_exact_len(input: &[u8], expected: usize) -> Result<(), WcmpDecodeError> {
    if input.len() != expected {
        return Err(WcmpDecodeError::LengthMismatch {
            expected,
            actual: input.len(),
        });
    }
    Ok(())
}

pub fn decode_wcmp(input: &[u8]) -> Result<WcmpMessage, WcmpDecodeError> {
    if input.len() > WDP_MAX_UDP_PAYLOAD_BYTES {
        return Err(WcmpDecodeError::PacketTooLarge {
            actual: input.len(),
            max: WDP_MAX_UDP_PAYLOAD_BYTES,
        });
    }
    require_len(input, GENERAL_HEADER_BYTES)?;
    let message_type = input[0];
    let code = input[1];
    match message_type {
        WCMP_TYPE_DESTINATION_UNREACHABLE => {
            let code = WcmpDestinationUnreachableCode::from_u8(code)
                .ok_or(WcmpDecodeError::InvalidCode { message_type, code })?;
            require_len(input, GENERAL_HEADER_BYTES + PORT_FIELDS_BYTES)?;
            let destination_port = read_u16(input, 2)?;
            let originator_port = read_u16(input, 4)?;
            let (address, end) = decode_address(input, 6)?;
            require_exact_len(input, end)?;
            Ok(WcmpMessage::DestinationUnreachable {
                code,
                destination_port,
                originator_port,
                address,
            })
        }
        WCMP_TYPE_MESSAGE_TOO_BIG => {
            if code != 0 {
                return Err(WcmpDecodeError::InvalidCode { message_type, code });
            }
            require_len(input, GENERAL_HEADER_BYTES + PORT_FIELDS_BYTES)?;
            let destination_port = read_u16(input, 2)?;
            let originator_port = read_u16(input, 4)?;
            let (address, end) = decode_address(input, 6)?;
            let expected = end.checked_add(2).ok_or(WcmpDecodeError::LengthOverflow)?;
            require_exact_len(input, expected)?;
            let maximum_message_size = read_u16(input, end)?;
            Ok(WcmpMessage::MessageTooBig {
                destination_port,
                originator_port,
                address,
                maximum_message_size,
            })
        }
        WCMP_TYPE_ECHO_REQUEST | WCMP_TYPE_ECHO_REPLY => {
            if code != 0 {
                return Err(WcmpDecodeError::InvalidCode { message_type, code });
            }
            require_len(input, ECHO_FIXED_BYTES)?;
            let identifier = read_u16(input, 2)?;
            let sequence_number = read_u16(input, 4)?;
            let data = input[ECHO_FIXED_BYTES..].to_vec();
            if message_type == WCMP_TYPE_ECHO_REQUEST {
                Ok(WcmpMessage::EchoRequest {
                    identifier,
                    sequence_number,
                    data,
                })
            } else {
                Ok(WcmpMessage::EchoReply {
                    identifier,
                    sequence_number,
                    data,
                })
            }
        }
        _ => Err(WcmpDecodeError::UnsupportedType {
            message_type,
            class: WcmpTypeClass::from_message_type(message_type),
        }),
    }
}
