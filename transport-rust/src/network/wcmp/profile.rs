use super::codec::{decode_wcmp, encode_wcmp, WcmpDecodeError, WcmpEncodeError};
use super::handler::{handle_wcmp, WcmpHandlingError, WcmpHandlingOutcome, WcmpHandlingPolicy};
use super::icmpv4::{
    decode_icmpv4, encode_icmpv4, handle_icmpv4, Icmpv4DecodeError, Icmpv4EncodeError,
    Icmpv4HandlingError, Icmpv4HandlingOutcome, Icmpv4HandlingPolicy, Icmpv4Message,
};
use super::message::WcmpMessage;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WdpControlProfile {
    CdpdIpv4Strict,
    GeneralWcmpNonIp,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WdpControlMessage {
    Icmpv4(Icmpv4Message),
    GeneralWcmp(WcmpMessage),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WdpControlEncodeError {
    ProfileMismatch {
        profile: WdpControlProfile,
        message_family: &'static str,
    },
    Icmpv4(Icmpv4EncodeError),
    GeneralWcmp(WcmpEncodeError),
}

impl std::fmt::Display for WdpControlEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ProfileMismatch {
                profile,
                message_family,
            } => write!(
                f,
                "{message_family} control message is unavailable for {profile:?}"
            ),
            Self::Icmpv4(error) => write!(f, "ICMPv4 encode failed: {error}"),
            Self::GeneralWcmp(error) => write!(f, "general WCMP encode failed: {error}"),
        }
    }
}

impl std::error::Error for WdpControlEncodeError {}

pub fn encode_wdp_control_message(
    profile: WdpControlProfile,
    message: &WdpControlMessage,
    max_non_ip_bearer_fragment_bytes: usize,
) -> Result<Vec<u8>, WdpControlEncodeError> {
    match (profile, message) {
        (WdpControlProfile::CdpdIpv4Strict, WdpControlMessage::Icmpv4(message)) => {
            encode_icmpv4(message).map_err(WdpControlEncodeError::Icmpv4)
        }
        (WdpControlProfile::GeneralWcmpNonIp, WdpControlMessage::GeneralWcmp(message)) => {
            encode_wcmp(message, max_non_ip_bearer_fragment_bytes)
                .map_err(WdpControlEncodeError::GeneralWcmp)
        }
        (profile, WdpControlMessage::Icmpv4(_)) => Err(WdpControlEncodeError::ProfileMismatch {
            profile,
            message_family: "ICMPv4",
        }),
        (profile, WdpControlMessage::GeneralWcmp(_)) => {
            Err(WdpControlEncodeError::ProfileMismatch {
                profile,
                message_family: "general WCMP",
            })
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WdpControlDecodeError {
    Icmpv4(Icmpv4DecodeError),
    GeneralWcmp(WcmpDecodeError),
}

impl std::fmt::Display for WdpControlDecodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Icmpv4(error) => write!(f, "ICMPv4 decode failed: {error}"),
            Self::GeneralWcmp(error) => write!(f, "general WCMP decode failed: {error}"),
        }
    }
}

impl std::error::Error for WdpControlDecodeError {}

pub fn decode_wdp_control_message(
    profile: WdpControlProfile,
    input: &[u8],
) -> Result<WdpControlMessage, WdpControlDecodeError> {
    match profile {
        WdpControlProfile::CdpdIpv4Strict => decode_icmpv4(input)
            .map(WdpControlMessage::Icmpv4)
            .map_err(WdpControlDecodeError::Icmpv4),
        WdpControlProfile::GeneralWcmpNonIp => decode_wcmp(input)
            .map(WdpControlMessage::GeneralWcmp)
            .map_err(WdpControlDecodeError::GeneralWcmp),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WdpControlHandlingPolicy {
    pub permit_echo_reply: bool,
    pub max_non_ip_bearer_fragment_bytes: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WdpControlHandlingOutcome {
    Icmpv4(Icmpv4HandlingOutcome),
    GeneralWcmp(WcmpHandlingOutcome),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WdpControlHandlingError {
    Icmpv4(Icmpv4HandlingError),
    GeneralWcmp(WcmpHandlingError),
}

impl std::fmt::Display for WdpControlHandlingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Icmpv4(error) => write!(f, "ICMPv4 handling failed: {error}"),
            Self::GeneralWcmp(error) => write!(f, "general WCMP handling failed: {error}"),
        }
    }
}

impl std::error::Error for WdpControlHandlingError {}

pub fn handle_wdp_control_message(
    profile: WdpControlProfile,
    input: &[u8],
    policy: WdpControlHandlingPolicy,
) -> Result<WdpControlHandlingOutcome, WdpControlHandlingError> {
    match profile {
        WdpControlProfile::CdpdIpv4Strict => handle_icmpv4(
            input,
            Icmpv4HandlingPolicy {
                permit_echo_reply: policy.permit_echo_reply,
            },
        )
        .map(WdpControlHandlingOutcome::Icmpv4)
        .map_err(WdpControlHandlingError::Icmpv4),
        WdpControlProfile::GeneralWcmpNonIp => handle_wcmp(
            input,
            WcmpHandlingPolicy {
                max_bearer_fragment_bytes: policy.max_non_ip_bearer_fragment_bytes,
                permit_echo_reply: policy.permit_echo_reply,
            },
        )
        .map(WdpControlHandlingOutcome::GeneralWcmp)
        .map_err(WdpControlHandlingError::GeneralWcmp),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn message_family_requires_an_explicit_matching_profile() {
        let general = WdpControlMessage::GeneralWcmp(WcmpMessage::EchoRequest {
            identifier: 1,
            sequence_number: 2,
            data: vec![3],
        });
        assert!(matches!(
            encode_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, &general, 64),
            Err(WdpControlEncodeError::ProfileMismatch { .. })
        ));
        assert_eq!(
            encode_wdp_control_message(WdpControlProfile::GeneralWcmpNonIp, &general, 64)
                .expect("general WCMP should remain available for non-IP bearers"),
            [178, 0, 0, 1, 0, 2, 3]
        );

        let icmp = WdpControlMessage::Icmpv4(Icmpv4Message::EchoRequest {
            identifier: 1,
            sequence_number: 2,
            data: vec![3],
        });
        assert!(matches!(
            encode_wdp_control_message(WdpControlProfile::GeneralWcmpNonIp, &icmp, 64),
            Err(WdpControlEncodeError::ProfileMismatch { .. })
        ));
        assert!(encode_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, &icmp, 64).is_ok());
    }
}
