#![allow(dead_code)]

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpTransactionClass {
    Class0UnreliableInvoke,
    Class1ReliableOneWay,
    Class2ReliableRequestResponse,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpTransactionState {
    Idle,
    InvokeSent,
    AwaitingAck,
    AwaitingResult,
    Completed,
    Aborted,
    TimedOut,
    Closed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpTransactionEvent {
    SendInvoke,
    ReceiveAck,
    ReceiveResult,
    ReceiveNack,
    TimerExpired,
    Abort,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpTransactionDecision {
    EmitInvoke,
    ReplayTerminal,
    DropAsDuplicate,
    Retry,
    Complete,
    Fail,
    Ignore,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpTransactionTransition {
    pub next_state: WtpTransactionState,
    pub decision: WtpTransactionDecision,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpTransactionTransitionTrace {
    pub tx_class: WtpTransactionClass,
    pub current_state: WtpTransactionState,
    pub event: WtpTransactionEvent,
    pub next_state: WtpTransactionState,
    pub decision: WtpTransactionDecision,
}

pub fn advance_wtp_transaction_state(
    tx_class: WtpTransactionClass,
    state: WtpTransactionState,
    event: WtpTransactionEvent,
) -> (WtpTransactionTransition, WtpTransactionTransitionTrace) {
    use WtpTransactionClass::*;
    use WtpTransactionDecision::*;
    use WtpTransactionEvent::*;
    use WtpTransactionState::*;

    let (next_state, decision) = match (tx_class, state, event) {
        (Class0UnreliableInvoke, Idle, SendInvoke) => (Completed, EmitInvoke),
        (Class0UnreliableInvoke, _, _) => (Closed, Ignore),

        (Class1ReliableOneWay, Idle, SendInvoke) => (InvokeSent, EmitInvoke),
        (Class1ReliableOneWay, InvokeSent, ReceiveAck) => (Completed, Complete),
        (Class1ReliableOneWay, InvokeSent, ReceiveNack) => (Completed, ReplayTerminal),
        (Class1ReliableOneWay, InvokeSent, TimerExpired) => (InvokeSent, Retry),
        (Class1ReliableOneWay, InvokeSent, Abort) => (Aborted, Fail),
        (Class1ReliableOneWay, _, _) => (InvokeSent, Ignore),

        (Class2ReliableRequestResponse, Idle, SendInvoke) => (InvokeSent, EmitInvoke),
        (Class2ReliableRequestResponse, InvokeSent, ReceiveAck) => (AwaitingAck, Ignore),
        (Class2ReliableRequestResponse, AwaitingAck, ReceiveAck) => (AwaitingResult, Ignore),
        (Class2ReliableRequestResponse, AwaitingAck, ReceiveResult) => (AwaitingResult, Ignore),
        (Class2ReliableRequestResponse, AwaitingResult, ReceiveResult) => (Completed, Complete),
        (Class2ReliableRequestResponse, InvokeSent, ReceiveNack) => (Completed, ReplayTerminal),
        (Class2ReliableRequestResponse, InvokeSent, TimerExpired)
        | (Class2ReliableRequestResponse, AwaitingAck, TimerExpired)
        | (Class2ReliableRequestResponse, AwaitingResult, TimerExpired) => (state, Retry),
        (Class2ReliableRequestResponse, state, Abort) if state != Completed => (Aborted, Fail),
        (Class2ReliableRequestResponse, _, _) => (TimedOut, Ignore),
    };

    (
        WtpTransactionTransition {
            next_state,
            decision,
        },
        WtpTransactionTransitionTrace {
            tx_class,
            current_state: state,
            event,
            next_state,
            decision,
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn class0_emit_and_ignore_unknown_events_after_complete() {
        let transition = advance_wtp_transaction_state(
            WtpTransactionClass::Class0UnreliableInvoke,
            WtpTransactionState::Completed,
            WtpTransactionEvent::TimerExpired,
        );
        assert_eq!(
            transition.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::Closed,
                decision: WtpTransactionDecision::Ignore,
            }
        );
    }

    #[test]
    fn class1_retry_on_timer_and_complete_on_ack() {
        let transition = advance_wtp_transaction_state(
            WtpTransactionClass::Class1ReliableOneWay,
            WtpTransactionState::Idle,
            WtpTransactionEvent::SendInvoke,
        );
        assert_eq!(
            transition.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::InvokeSent,
                decision: WtpTransactionDecision::EmitInvoke,
            }
        );

        let retry = advance_wtp_transaction_state(
            WtpTransactionClass::Class1ReliableOneWay,
            WtpTransactionState::InvokeSent,
            WtpTransactionEvent::TimerExpired,
        );
        assert_eq!(
            retry.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::InvokeSent,
                decision: WtpTransactionDecision::Retry,
            }
        );

        let complete = advance_wtp_transaction_state(
            WtpTransactionClass::Class1ReliableOneWay,
            WtpTransactionState::InvokeSent,
            WtpTransactionEvent::ReceiveAck,
        );
        assert_eq!(
            complete.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::Completed,
                decision: WtpTransactionDecision::Complete,
            }
        );
    }

    #[test]
    fn class2_retries_then_completes_on_result() {
        let invoke = advance_wtp_transaction_state(
            WtpTransactionClass::Class2ReliableRequestResponse,
            WtpTransactionState::Idle,
            WtpTransactionEvent::SendInvoke,
        );
        assert_eq!(
            invoke.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::InvokeSent,
                decision: WtpTransactionDecision::EmitInvoke,
            }
        );

        let await_ack = advance_wtp_transaction_state(
            WtpTransactionClass::Class2ReliableRequestResponse,
            WtpTransactionState::InvokeSent,
            WtpTransactionEvent::ReceiveAck,
        );
        assert_eq!(
            await_ack.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::AwaitingAck,
                decision: WtpTransactionDecision::Ignore,
            }
        );

        let await_result = advance_wtp_transaction_state(
            WtpTransactionClass::Class2ReliableRequestResponse,
            WtpTransactionState::AwaitingAck,
            WtpTransactionEvent::ReceiveResult,
        );
        assert_eq!(
            await_result.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::AwaitingResult,
                decision: WtpTransactionDecision::Ignore,
            }
        );

        let complete = advance_wtp_transaction_state(
            WtpTransactionClass::Class2ReliableRequestResponse,
            WtpTransactionState::AwaitingResult,
            WtpTransactionEvent::ReceiveResult,
        );
        assert_eq!(
            complete.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::Completed,
                decision: WtpTransactionDecision::Complete,
            }
        );
    }

    #[test]
    fn class2_timeout_retry_uses_last_active_state() {
        let retry = advance_wtp_transaction_state(
            WtpTransactionClass::Class2ReliableRequestResponse,
            WtpTransactionState::AwaitingResult,
            WtpTransactionEvent::TimerExpired,
        );
        assert_eq!(
            retry.0,
            WtpTransactionTransition {
                next_state: WtpTransactionState::AwaitingResult,
                decision: WtpTransactionDecision::Retry,
            }
        );
    }
}
