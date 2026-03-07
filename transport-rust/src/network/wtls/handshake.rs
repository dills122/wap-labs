#![allow(dead_code)]

use crate::network::wtp::duplicate_cache::{
    WtpDuplicateCacheState, WtpDuplicateDecision, WtpDuplicatePolicy, WtpDuplicateTrace,
};
use crate::network::wtp::retransmission::{
    decide_retransmission, WtpRetransmissionDecision, WtpRetransmissionEvent,
    WtpRetransmissionPolicy, WtpRetransmissionState, WtpRetransmissionTrace,
};
use serde::Deserialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtlsHandshakeMessageType {
    ClientHello,
    ServerHello,
    Finished,
}

impl WtlsHandshakeMessageType {
    fn to_u8(self) -> u8 {
        match self {
            WtlsHandshakeMessageType::ClientHello => 1,
            WtlsHandshakeMessageType::ServerHello => 2,
            WtlsHandshakeMessageType::Finished => 20,
        }
    }

    fn from_u8(raw: u8) -> Option<Self> {
        match raw {
            1 => Some(Self::ClientHello),
            2 => Some(Self::ServerHello),
            20 => Some(Self::Finished),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WtlsHandshakeMessage {
    pub message_type: WtlsHandshakeMessageType,
    pub sequence_number: u16,
    pub payload: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WtlsHandshakeMessageDecodeError {
    TruncatedHeader,
    InvalidType(u8),
    TruncatedPayload { expected: usize, actual: usize },
    TrailingBytes { extra: usize },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtlsHandshakePolicy {
    pub retransmission: WtpRetransmissionPolicy,
    pub duplicate: WtpDuplicatePolicy,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtlsHandshakeRetransmissionTrace {
    pub decision: WtpRetransmissionDecision,
    pub state: WtpRetransmissionState,
    pub trace: WtpRetransmissionTrace,
}

#[derive(Debug)]
pub struct WtlsHandshakeDuplicateTrace {
    pub decision: WtpDuplicateDecision,
    pub trace: WtpDuplicateTrace,
}

pub fn encode_handshake_message(message: &WtlsHandshakeMessage) -> Vec<u8> {
    let length = u16::try_from(message.payload.len()).unwrap_or(u16::MAX);
    let mut out = Vec::with_capacity(5 + message.payload.len());
    out.push(message.message_type.to_u8());
    out.extend_from_slice(&message.sequence_number.to_be_bytes());
    out.extend_from_slice(&length.to_be_bytes());
    out.extend_from_slice(&message.payload);
    out
}

pub fn decode_handshake_message(
    input: &[u8],
) -> Result<WtlsHandshakeMessage, WtlsHandshakeMessageDecodeError> {
    if input.len() < 5 {
        return Err(WtlsHandshakeMessageDecodeError::TruncatedHeader);
    }
    let message_type = WtlsHandshakeMessageType::from_u8(input[0])
        .ok_or(WtlsHandshakeMessageDecodeError::InvalidType(input[0]))?;
    let sequence_number = u16::from_be_bytes([input[1], input[2]]);
    let declared_len = usize::from(u16::from_be_bytes([input[3], input[4]]));
    let actual_len = input.len().saturating_sub(5);
    if actual_len < declared_len {
        return Err(WtlsHandshakeMessageDecodeError::TruncatedPayload {
            expected: declared_len,
            actual: actual_len,
        });
    }
    if actual_len > declared_len {
        return Err(WtlsHandshakeMessageDecodeError::TrailingBytes {
            extra: actual_len - declared_len,
        });
    }

    Ok(WtlsHandshakeMessage {
        message_type,
        sequence_number,
        payload: input[5..].to_vec(),
    })
}

pub fn decide_handshake_retransmission(
    policy: &WtlsHandshakePolicy,
    state: &WtpRetransmissionState,
    event: WtpRetransmissionEvent,
) -> WtlsHandshakeRetransmissionTrace {
    let (decision, next_state, trace) = decide_retransmission(&policy.retransmission, state, event);
    WtlsHandshakeRetransmissionTrace {
        decision,
        state: next_state,
        trace,
    }
}

pub fn decide_handshake_duplicate(
    policy: &WtlsHandshakePolicy,
    state: &mut WtpDuplicateCacheState,
    sequence_number: u16,
    is_terminal_message: bool,
) -> WtlsHandshakeDuplicateTrace {
    let (decision, trace) = state.decide(&policy.duplicate, sequence_number, is_terminal_message);
    WtlsHandshakeDuplicateTrace { decision, trace }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wtp::duplicate_cache::WtpDuplicateCacheState;
    use crate::network::wtp::retransmission::{WtpBackoffKind, WtpRetransmissionEvent};
    use crate::test_support::load_json_fixture;

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct HandshakeFixture {
        message_case: HandshakeMessageCase,
        retransmission_cases: Vec<RetransmissionCase>,
        duplicate_cases: Vec<DuplicateCase>,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct HandshakeMessageCase {
        message_type: String,
        sequence_number: u16,
        payload: Vec<u8>,
        expected_wire: Vec<u8>,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct RetransmissionCase {
        event: String,
        elapsed_ms: Option<u64>,
        expected_decision: String,
        expected_attempts: u8,
        expected_completed: bool,
        expected_delay_ms: u64,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct DuplicateCase {
        sequence_number: u16,
        is_terminal_message: bool,
        expected_decision: String,
        expected_cache_size: usize,
    }

    fn load_fixture() -> HandshakeFixture {
        load_json_fixture(&[
            "tests",
            "fixtures",
            "transport",
            "wtls_handshake_reliability_mapped",
            "handshake_fixture.json",
        ])
    }

    fn fixture_policy() -> WtlsHandshakePolicy {
        WtlsHandshakePolicy {
            retransmission: WtpRetransmissionPolicy {
                max_retries: 2,
                initial_delay_ms: 100,
                max_delay_ms: 200,
                backoff_kind: WtpBackoffKind::Constant,
                backoff_step_ms: 0,
                sar_enabled: false,
                nack_holdoff_ms: 0,
            },
            duplicate: WtpDuplicatePolicy {
                cache_terminal_responses: true,
                max_cached_transactions: 2,
            },
        }
    }

    fn message_type_from_fixture(raw: &str) -> WtlsHandshakeMessageType {
        match raw {
            "client-hello" => WtlsHandshakeMessageType::ClientHello,
            "server-hello" => WtlsHandshakeMessageType::ServerHello,
            "finished" => WtlsHandshakeMessageType::Finished,
            other => panic!("unsupported handshake type {other}"),
        }
    }

    fn retransmission_event(raw: &str, elapsed_ms: Option<u64>) -> WtpRetransmissionEvent {
        match raw {
            "timer-expired" => WtpRetransmissionEvent::TimerExpired,
            "ack-observed" => WtpRetransmissionEvent::AckObserved,
            "reset" => WtpRetransmissionEvent::Reset,
            "nack-observed" => WtpRetransmissionEvent::NackObserved {
                elapsed_ms: elapsed_ms.expect("nack fixture requires elapsed_ms"),
            },
            other => panic!("unsupported retransmission event {other}"),
        }
    }

    fn retransmission_decision_name(decision: WtpRetransmissionDecision) -> &'static str {
        match decision {
            WtpRetransmissionDecision::Send(_) => "send",
            WtpRetransmissionDecision::HoldOff(_) => "holdoff",
            WtpRetransmissionDecision::RetryExhausted => "retry-exhausted",
            WtpRetransmissionDecision::Completed => "completed",
        }
    }

    fn duplicate_decision_name(decision: WtpDuplicateDecision) -> &'static str {
        match decision {
            WtpDuplicateDecision::Accept => "accept",
            WtpDuplicateDecision::ReplayCachedTerminal => "replay-cached-terminal",
            WtpDuplicateDecision::DropAsDuplicate => "drop-as-duplicate",
        }
    }

    #[test]
    fn wtls_handshake_fixture_roundtrips_message_and_reliability_policies() {
        let fixture = load_fixture();
        let message = WtlsHandshakeMessage {
            message_type: message_type_from_fixture(&fixture.message_case.message_type),
            sequence_number: fixture.message_case.sequence_number,
            payload: fixture.message_case.payload.clone(),
        };
        assert_eq!(
            encode_handshake_message(&message),
            fixture.message_case.expected_wire
        );
        assert_eq!(
            decode_handshake_message(&fixture.message_case.expected_wire).expect("message decode"),
            message
        );

        let policy = fixture_policy();
        let mut retransmission_state = WtpRetransmissionState::default();
        for case in fixture.retransmission_cases {
            let trace = decide_handshake_retransmission(
                &policy,
                &retransmission_state,
                retransmission_event(&case.event, case.elapsed_ms),
            );
            assert_eq!(
                retransmission_decision_name(trace.decision),
                case.expected_decision
            );
            assert_eq!(trace.state.attempts, case.expected_attempts);
            assert_eq!(trace.state.completed, case.expected_completed);
            assert_eq!(trace.trace.delay_ms, case.expected_delay_ms);
            retransmission_state = trace.state;
        }

        let mut duplicate_state = WtpDuplicateCacheState::new();
        for case in fixture.duplicate_cases {
            let trace = decide_handshake_duplicate(
                &policy,
                &mut duplicate_state,
                case.sequence_number,
                case.is_terminal_message,
            );
            assert_eq!(
                duplicate_decision_name(trace.decision),
                case.expected_decision
            );
            assert_eq!(trace.trace.cache_size, case.expected_cache_size);
        }
    }

    #[test]
    fn decode_handshake_rejects_invalid_shapes() {
        assert_eq!(
            decode_handshake_message(&[9, 0, 1, 0, 0]),
            Err(WtlsHandshakeMessageDecodeError::InvalidType(9))
        );
        assert_eq!(
            decode_handshake_message(&[1, 0, 1, 0, 1, 9, 9]),
            Err(WtlsHandshakeMessageDecodeError::TrailingBytes { extra: 1 })
        );
    }
}
