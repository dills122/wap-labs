use super::codec::{decode_wcmp, encode_wcmp, WcmpDecodeError, WcmpEncodeError};
use super::message::{WcmpAddress, WcmpDestinationUnreachableCode, WcmpMessage};
use crate::network::wdp::WdpError;
use serde::{Deserialize, Serialize};

const ECHO_FIXED_BYTES: usize = 6;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WcmpGenerationFailure {
    NoRouteToDestination,
    CommunicationAdministrativelyProhibited,
    AddressUnreachable,
    PortUnreachable,
    Congestion,
    FirstSegmentExceedsReassemblyBuffer { maximum_message_size: u16 },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WcmpOriginalDatagram {
    pub destination_port: u16,
    pub originator_port: u16,
    pub destination_address: WcmpAddress,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WcmpErrorGenerationRequest {
    pub failure: WcmpGenerationFailure,
    pub original: WcmpOriginalDatagram,
    pub max_bearer_fragment_bytes: usize,
    pub trigger_is_wcmp_error: bool,
    pub fragmented_datagram_error_already_sent: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WcmpSuppressionReason {
    ErrorInResponseToWcmpError,
    FragmentErrorAlreadySent,
    Congestion,
    EchoReplyRateLimited,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WcmpGenerationOutcome {
    Generated {
        message: WcmpMessage,
        packet: Vec<u8>,
    },
    Suppressed(WcmpSuppressionReason),
}

pub fn generate_wcmp_error(
    request: &WcmpErrorGenerationRequest,
) -> Result<WcmpGenerationOutcome, WcmpEncodeError> {
    if request.trigger_is_wcmp_error {
        return Ok(WcmpGenerationOutcome::Suppressed(
            WcmpSuppressionReason::ErrorInResponseToWcmpError,
        ));
    }
    if request.fragmented_datagram_error_already_sent {
        return Ok(WcmpGenerationOutcome::Suppressed(
            WcmpSuppressionReason::FragmentErrorAlreadySent,
        ));
    }

    let destination_unreachable = |code| WcmpMessage::DestinationUnreachable {
        code,
        destination_port: request.original.destination_port,
        originator_port: request.original.originator_port,
        address: request.original.destination_address.clone(),
    };
    let message = match request.failure {
        WcmpGenerationFailure::NoRouteToDestination => {
            destination_unreachable(WcmpDestinationUnreachableCode::NoRouteToDestination)
        }
        WcmpGenerationFailure::CommunicationAdministrativelyProhibited => destination_unreachable(
            WcmpDestinationUnreachableCode::CommunicationAdministrativelyProhibited,
        ),
        WcmpGenerationFailure::AddressUnreachable => {
            destination_unreachable(WcmpDestinationUnreachableCode::AddressUnreachable)
        }
        WcmpGenerationFailure::PortUnreachable => {
            destination_unreachable(WcmpDestinationUnreachableCode::PortUnreachable)
        }
        WcmpGenerationFailure::Congestion => {
            return Ok(WcmpGenerationOutcome::Suppressed(
                WcmpSuppressionReason::Congestion,
            ));
        }
        WcmpGenerationFailure::FirstSegmentExceedsReassemblyBuffer {
            maximum_message_size,
        } => WcmpMessage::MessageTooBig {
            destination_port: request.original.destination_port,
            originator_port: request.original.originator_port,
            address: request.original.destination_address.clone(),
            maximum_message_size,
        },
    };
    let packet = encode_wcmp(&message, request.max_bearer_fragment_bytes)?;
    Ok(WcmpGenerationOutcome::Generated { message, packet })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WcmpHandlingPolicy {
    pub max_bearer_fragment_bytes: usize,
    pub permit_echo_reply: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WcmpReportedError {
    DestinationUnreachable {
        code: WcmpDestinationUnreachableCode,
        destination_port: u16,
        originator_port: u16,
        address: WcmpAddress,
    },
    MessageTooBig {
        destination_port: u16,
        originator_port: u16,
        address: WcmpAddress,
        maximum_message_size: u16,
    },
}

impl WcmpReportedError {
    pub fn to_wdp_error(&self) -> WdpError {
        match self {
            Self::DestinationUnreachable {
                code: WcmpDestinationUnreachableCode::NoRouteToDestination,
                ..
            } => WdpError::NoRouteToDestination,
            Self::DestinationUnreachable {
                code: WcmpDestinationUnreachableCode::CommunicationAdministrativelyProhibited,
                ..
            } => WdpError::CommunicationAdministrativelyProhibited,
            Self::DestinationUnreachable {
                code: WcmpDestinationUnreachableCode::AddressUnreachable,
                ..
            } => WdpError::AddressUnreachable,
            Self::DestinationUnreachable {
                code: WcmpDestinationUnreachableCode::PortUnreachable,
                destination_port,
                ..
            } => WdpError::DestinationPortUnsupported(*destination_port),
            Self::MessageTooBig {
                maximum_message_size,
                ..
            } => WdpError::PeerMessageTooBig {
                max: usize::from(*maximum_message_size),
            },
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WcmpHandlingOutcome {
    ReportedError(WcmpReportedError),
    EchoReplyGenerated {
        message: WcmpMessage,
        packet: Vec<u8>,
        data_truncated: bool,
    },
    EchoReplySuppressed(WcmpSuppressionReason),
    EchoReplyReceived {
        identifier: u16,
        sequence_number: u16,
        data: Vec<u8>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WcmpHandlingError {
    Decode(WcmpDecodeError),
    Encode(WcmpEncodeError),
}

impl std::fmt::Display for WcmpHandlingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Decode(error) => write!(f, "WCMP decode failed: {error}"),
            Self::Encode(error) => write!(f, "WCMP reply generation failed: {error}"),
        }
    }
}

impl std::error::Error for WcmpHandlingError {}

impl From<WcmpDecodeError> for WcmpHandlingError {
    fn from(value: WcmpDecodeError) -> Self {
        Self::Decode(value)
    }
}

impl From<WcmpEncodeError> for WcmpHandlingError {
    fn from(value: WcmpEncodeError) -> Self {
        Self::Encode(value)
    }
}

pub fn handle_wcmp(
    input: &[u8],
    policy: WcmpHandlingPolicy,
) -> Result<WcmpHandlingOutcome, WcmpHandlingError> {
    match decode_wcmp(input)? {
        WcmpMessage::DestinationUnreachable {
            code,
            destination_port,
            originator_port,
            address,
        } => Ok(WcmpHandlingOutcome::ReportedError(
            WcmpReportedError::DestinationUnreachable {
                code,
                destination_port,
                originator_port,
                address,
            },
        )),
        WcmpMessage::MessageTooBig {
            destination_port,
            originator_port,
            address,
            maximum_message_size,
        } => Ok(WcmpHandlingOutcome::ReportedError(
            WcmpReportedError::MessageTooBig {
                destination_port,
                originator_port,
                address,
                maximum_message_size,
            },
        )),
        WcmpMessage::EchoRequest {
            identifier,
            sequence_number,
            mut data,
        } => {
            if !policy.permit_echo_reply {
                return Ok(WcmpHandlingOutcome::EchoReplySuppressed(
                    WcmpSuppressionReason::EchoReplyRateLimited,
                ));
            }
            let maximum_data_len = policy
                .max_bearer_fragment_bytes
                .saturating_sub(ECHO_FIXED_BYTES);
            let data_truncated = data.len() > maximum_data_len;
            data.truncate(maximum_data_len);
            let message = WcmpMessage::EchoReply {
                identifier,
                sequence_number,
                data,
            };
            let packet = encode_wcmp(&message, policy.max_bearer_fragment_bytes)?;
            Ok(WcmpHandlingOutcome::EchoReplyGenerated {
                message,
                packet,
                data_truncated,
            })
        }
        WcmpMessage::EchoReply {
            identifier,
            sequence_number,
            data,
        } => Ok(WcmpHandlingOutcome::EchoReplyReceived {
            identifier,
            sequence_number,
            data,
        }),
    }
}
