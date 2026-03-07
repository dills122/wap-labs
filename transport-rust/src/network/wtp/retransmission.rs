#![allow(dead_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum WtpBackoffKind {
    Constant,
    Linear,
    Exponential,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WtpRetransmissionPolicy {
    pub max_retries: u8,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
    pub backoff_kind: WtpBackoffKind,
    pub backoff_step_ms: u64,
    pub sar_enabled: bool,
    pub nack_holdoff_ms: u64,
}

impl Default for WtpRetransmissionPolicy {
    fn default() -> Self {
        Self {
            max_retries: 2,
            initial_delay_ms: 100,
            max_delay_ms: 800,
            backoff_kind: WtpBackoffKind::Linear,
            backoff_step_ms: 100,
            sar_enabled: false,
            nack_holdoff_ms: 150,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WtpRetransmissionState {
    pub attempts: u8,
    pub last_nack_elapsed_ms: Option<u64>,
    pub completed: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpRetransmissionDecision {
    Send(u8),
    HoldOff(u64),
    RetryExhausted,
    Completed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpRetransmissionEvent {
    TimerExpired,
    NackObserved { elapsed_ms: u64 },
    AckObserved,
    Reset,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpRetransmissionTrace {
    pub policy: WtpRetransmissionPolicy,
    pub state: WtpRetransmissionState,
    pub event: WtpRetransmissionEvent,
    pub delay_ms: u64,
}

fn delay_after_attempt(policy: &WtpRetransmissionPolicy, attempt: u8) -> u64 {
    let base = policy.initial_delay_ms;
    let step = policy.backoff_step_ms;
    let computed = match policy.backoff_kind {
        WtpBackoffKind::Constant => base,
        WtpBackoffKind::Linear => {
            base.saturating_add(step.saturating_mul(u64::from(attempt.saturating_sub(1))))
        }
        WtpBackoffKind::Exponential => {
            let exponent = attempt.saturating_sub(1).min(10);
            let factor = 1_u64 << exponent;
            base.saturating_mul(factor)
        }
    };
    computed.min(policy.max_delay_ms).max(base)
}

pub fn decide_retransmission(
    policy: &WtpRetransmissionPolicy,
    state: &WtpRetransmissionState,
    event: WtpRetransmissionEvent,
) -> (
    WtpRetransmissionDecision,
    WtpRetransmissionState,
    WtpRetransmissionTrace,
) {
    let mut next_state = *state;

    let decision = match event {
        WtpRetransmissionEvent::Reset => {
            next_state = WtpRetransmissionState::default();
            WtpRetransmissionDecision::Completed
        }
        WtpRetransmissionEvent::AckObserved => {
            next_state.completed = true;
            WtpRetransmissionDecision::Completed
        }
        WtpRetransmissionEvent::TimerExpired => {
            let next_attempt = next_state.attempts.saturating_add(1);
            if next_attempt > policy.max_retries {
                WtpRetransmissionDecision::RetryExhausted
            } else {
                next_state.attempts = next_attempt;
                WtpRetransmissionDecision::Send(next_attempt)
            }
        }
        WtpRetransmissionEvent::NackObserved { elapsed_ms } => {
            if !policy.sar_enabled {
                let next_attempt = next_state.attempts.saturating_add(1);
                next_state.attempts = next_attempt;
                WtpRetransmissionDecision::Send(next_attempt)
            } else if let Some(last_nack) = next_state.last_nack_elapsed_ms {
                let next_send_allowed = last_nack.saturating_add(policy.nack_holdoff_ms);
                if elapsed_ms < next_send_allowed {
                    WtpRetransmissionDecision::HoldOff(next_send_allowed - elapsed_ms)
                } else {
                    next_state.last_nack_elapsed_ms = Some(elapsed_ms);
                    let next_attempt = next_state.attempts.saturating_add(1);
                    if next_attempt > policy.max_retries {
                        WtpRetransmissionDecision::RetryExhausted
                    } else {
                        next_state.attempts = next_attempt;
                        WtpRetransmissionDecision::Send(next_attempt)
                    }
                }
            } else {
                next_state.last_nack_elapsed_ms = Some(elapsed_ms);
                WtpRetransmissionDecision::HoldOff(policy.nack_holdoff_ms)
            }
        }
    };

    let mut delay_ms = 0;
    if let WtpRetransmissionDecision::Send(attempt) = decision {
        delay_ms = delay_after_attempt(policy, attempt);
    }

    (
        decision,
        next_state,
        WtpRetransmissionTrace {
            policy: *policy,
            state: next_state,
            event,
            delay_ms,
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn timer_expiry_increments_attempts_until_retry_exhausted() {
        let policy = WtpRetransmissionPolicy {
            max_retries: 1,
            initial_delay_ms: 100,
            max_delay_ms: 200,
            backoff_kind: WtpBackoffKind::Constant,
            backoff_step_ms: 0,
            sar_enabled: false,
            nack_holdoff_ms: 0,
        };
        let mut state = WtpRetransmissionState::default();

        let (first, next, trace_first) =
            decide_retransmission(&policy, &state, WtpRetransmissionEvent::TimerExpired);
        assert_eq!(first, WtpRetransmissionDecision::Send(1));
        assert_eq!(next.attempts, 1);
        assert_eq!(trace_first.delay_ms, 100);

        state = next;
        let (second, next, _) =
            decide_retransmission(&policy, &state, WtpRetransmissionEvent::TimerExpired);
        assert_eq!(second, WtpRetransmissionDecision::RetryExhausted);
        assert_eq!(next.attempts, 1);
    }

    #[test]
    fn linear_backoff_grows_by_step_with_max_cap() {
        let policy = WtpRetransmissionPolicy {
            max_delay_ms: 170,
            backoff_step_ms: 30,
            max_retries: 4,
            backoff_kind: WtpBackoffKind::Linear,
            ..WtpRetransmissionPolicy::default()
        };
        let mut state = WtpRetransmissionState::default();

        let (_, second_state, first_trace) =
            decide_retransmission(&policy, &state, WtpRetransmissionEvent::TimerExpired);
        state = second_state;
        assert_eq!(first_trace.delay_ms, 100);

        let (_, third_state, second_trace) =
            decide_retransmission(&policy, &state, WtpRetransmissionEvent::TimerExpired);
        state = third_state;
        assert_eq!(second_trace.delay_ms, 130);

        let (_, fourth_state, third_trace) =
            decide_retransmission(&policy, &state, WtpRetransmissionEvent::TimerExpired);
        state = fourth_state;
        assert_eq!(third_trace.delay_ms, 160);

        let (_, _, capped_trace) =
            decide_retransmission(&policy, &state, WtpRetransmissionEvent::TimerExpired);
        assert_eq!(capped_trace.delay_ms, 170);
    }

    #[test]
    fn nack_holdoff_blocks_redundant_retransmits_when_sar_is_enabled() {
        let policy = WtpRetransmissionPolicy {
            sar_enabled: true,
            nack_holdoff_ms: 50,
            ..WtpRetransmissionPolicy::default()
        };
        let state = WtpRetransmissionState::default();

        let (first, next, first_trace) = decide_retransmission(
            &policy,
            &state,
            WtpRetransmissionEvent::NackObserved { elapsed_ms: 10 },
        );
        assert_eq!(first, WtpRetransmissionDecision::HoldOff(50));
        assert_eq!(first_trace.delay_ms, 0);
        assert_eq!(next.last_nack_elapsed_ms, Some(10));

        let (second, next, _trace) = decide_retransmission(
            &policy,
            &next,
            WtpRetransmissionEvent::NackObserved { elapsed_ms: 40 },
        );
        assert_eq!(second, WtpRetransmissionDecision::HoldOff(20));
        assert_eq!(next.last_nack_elapsed_ms, Some(10));

        let (third, _next_state, _trace) = decide_retransmission(
            &policy,
            &next,
            WtpRetransmissionEvent::NackObserved { elapsed_ms: 80 },
        );
        assert_eq!(third, WtpRetransmissionDecision::Send(1));
    }

    #[test]
    fn ack_sets_complete_and_resets_holdoff_counter() {
        let state = WtpRetransmissionState {
            attempts: 2,
            last_nack_elapsed_ms: Some(80),
            completed: false,
        };

        let (decision, next_state, _) = decide_retransmission(
            &WtpRetransmissionPolicy::default(),
            &state,
            WtpRetransmissionEvent::AckObserved,
        );
        assert_eq!(decision, WtpRetransmissionDecision::Completed);
        assert!(next_state.completed);
    }
}
