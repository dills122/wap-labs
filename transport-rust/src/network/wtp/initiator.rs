//! WTP Initiator transaction state machine, WAP-224-WTP-20010710-a §9.5.
//!
//! This is the role Waves actually needs first: as a WML browser client, Waves is always the
//! WTP Initiator for method invocations, and Class 2 (reliable Invoke, reliable Result) is the
//! class connection-oriented WSP rides on (§6.3). Kannel -- the reference gateway this project's
//! `gateway-kannel/` tests against -- never implements a Class-2 Initiator role at all (it is
//! only ever a WTP Responder for Class 2; its Initiator role is push-only, Class 0/1), so this
//! path has the least existing local precedent to lean on and is worth getting right against the
//! spec tables directly. See the research memo's §3.3 for the full reasoning.
//!
//! Not wired into `network::wsp` or any live socket yet -- this module is deliberately
//! standalone. See `docs/waves/RESEARCH_WTLS_WTP_HISTORICAL_QUIRKS_2026-07-25.md` Part 2 for the
//! design rationale and open questions.

use super::types::{
    AckExpirationCounter, RetransmissionCounter, WtpAbort, WtpAction, WtpProviderAbortReason,
    WtpTimerKind, WtpTransactionClass,
};

/// WAP-224-WTP §9.5. `ResultRespWait` and `WaitTimeout` are Class-2-only in the spec; `advance`
/// never produces them for Class 0/1 (enforced by its match arms and by the tests below, not by
/// the type system -- see the scope note in `types.rs`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpInitiatorTransactionState {
    Null,
    ResultWait,
    ResultRespWait,
    WaitTimeout,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WtpInitiatorEvent {
    /// `TR-Invoke.req`: the local WTP user wants to start a transaction.
    TrInvokeReq,
    /// A plain Ack PDU (no Tve flag) for the current transaction.
    RcvAck,
    /// An Ack PDU with the Tve flag set: the Responder is asking "do you have an outstanding
    /// transaction with this TID?" as step 2 of the three-way TID-verification handshake. The
    /// Initiator side always answers "yes" here (it just sent this TID) and moves on.
    RcvAckTve,
    RcvAbort(WtpAbort),
    RcvErrorPdu,
    /// Class 2 only: the Result PDU arrived. `retransmitted` distinguishes a first delivery
    /// (RID clear) from a retransmission (RID set) once already in `WaitTimeout`.
    RcvResult {
        retransmitted: bool,
    },
    /// Class 2 only: `TR-Result.res`, the local WTP user has consumed the Result.
    TrResultRes,
    TimerToR,
    TimerToA,
    TimerToW,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpInitiatorPolicy {
    pub max_rcr: u8,
    pub max_aec: u8,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpInitiatorContext {
    pub class: WtpTransactionClass,
    pub state: WtpInitiatorTransactionState,
    pub rcr: RetransmissionCounter,
    pub aec: AckExpirationCounter,
    /// Set once an Ack has confirmed the Invoke while still awaiting a Result (§9.4, `HoldOn`
    /// variable in Table 41). Tracked for fidelity with the spec's state table even though this
    /// implementation does not yet branch on it beyond the `advance` transitions themselves.
    pub hold_on: bool,
}

impl WtpInitiatorContext {
    pub fn new(class: WtpTransactionClass) -> Self {
        Self {
            class,
            state: WtpInitiatorTransactionState::Null,
            rcr: RetransmissionCounter::default(),
            aec: AckExpirationCounter::default(),
            hold_on: false,
        }
    }

    /// Advance by one event. Pure: returns the next context and the actions the caller must
    /// execute (send PDUs, start/stop timers, indicate to the local user) -- this function never
    /// performs I/O itself.
    pub fn advance(
        self,
        policy: &WtpInitiatorPolicy,
        event: WtpInitiatorEvent,
    ) -> (Self, Vec<WtpAction>) {
        use WtpInitiatorEvent as Ev;
        use WtpInitiatorTransactionState as St;
        use WtpTransactionClass as Cls;

        match (self.state, event) {
            (St::Null, Ev::TrInvokeReq) => {
                let actions = vec![
                    WtpAction::SendInvoke,
                    WtpAction::StartTimer(WtpTimerKind::Retry),
                ];
                let next_state = if self.class == Cls::Class0UnreliableInvoke {
                    St::Null
                } else {
                    St::ResultWait
                };
                (
                    Self {
                        state: next_state,
                        rcr: RetransmissionCounter::default(),
                        aec: AckExpirationCounter::default(),
                        hold_on: false,
                        ..self
                    },
                    actions,
                )
            }

            (St::ResultWait, Ev::RcvAckTve) => {
                let actions = vec![
                    WtpAction::SendAckWithTidOk,
                    WtpAction::StopTimer(WtpTimerKind::Retry),
                    WtpAction::StartTimer(WtpTimerKind::Retry),
                ];
                (
                    Self {
                        rcr: self.rcr.increment(),
                        ..self
                    },
                    actions,
                )
            }

            (St::ResultWait, Ev::RcvAck) => {
                let actions = vec![
                    WtpAction::StopTimer(WtpTimerKind::Retry),
                    WtpAction::ConfirmInvoke,
                ];
                if self.class == Cls::Class2ReliableRequestResponse {
                    (
                        Self {
                            hold_on: true,
                            ..self
                        },
                        actions,
                    )
                } else {
                    // Class 1: the transaction is complete once its single Ack lands.
                    (
                        Self {
                            state: St::Null,
                            ..self
                        },
                        actions,
                    )
                }
            }

            (St::ResultWait, Ev::RcvResult { .. })
                if self.class == Cls::Class2ReliableRequestResponse =>
            {
                (
                    Self {
                        state: St::ResultRespWait,
                        ..self
                    },
                    vec![
                        WtpAction::StopTimer(WtpTimerKind::Retry),
                        WtpAction::IndicateResult,
                    ],
                )
            }

            (St::ResultWait, Ev::TimerToR) => {
                if self.rcr.has_reached(policy.max_rcr) {
                    let abort = WtpAbort::Provider(WtpProviderAbortReason::NoResponse);
                    (
                        Self {
                            state: St::Null,
                            ..self
                        },
                        vec![WtpAction::SendAbort(abort), WtpAction::IndicateAbort(abort)],
                    )
                } else {
                    (
                        Self {
                            rcr: self.rcr.increment(),
                            ..self
                        },
                        vec![
                            WtpAction::SendInvoke,
                            WtpAction::StartTimer(WtpTimerKind::Retry),
                        ],
                    )
                }
            }

            (St::ResultRespWait, Ev::TrResultRes) => (
                Self {
                    state: St::WaitTimeout,
                    ..self
                },
                vec![
                    WtpAction::SendAck,
                    WtpAction::StartTimer(WtpTimerKind::Wait),
                ],
            ),

            (St::ResultRespWait, Ev::TimerToA) => {
                if self.aec.has_reached(policy.max_aec) {
                    let abort = WtpAbort::Provider(WtpProviderAbortReason::NoResponse);
                    (
                        Self {
                            state: St::Null,
                            ..self
                        },
                        vec![WtpAction::SendAbort(abort), WtpAction::IndicateAbort(abort)],
                    )
                } else {
                    (
                        Self {
                            aec: self.aec.increment(),
                            ..self
                        },
                        vec![WtpAction::StartTimer(WtpTimerKind::Ack)],
                    )
                }
            }

            (
                St::WaitTimeout,
                Ev::RcvResult {
                    retransmitted: true,
                },
            ) => (self, vec![WtpAction::SendAck]),

            (St::WaitTimeout, Ev::TimerToW) => (
                Self {
                    state: St::Null,
                    ..self
                },
                vec![WtpAction::StopTimer(WtpTimerKind::Wait)],
            ),

            // §7.7.4(C): receiving an Abort PDU (or a defined RcvErrorPdu event -- a malformed
            // PDU must resolve to this typed event upstream, never reach this match with raw
            // bytes) tears down local transaction state and indicates to the user, from any
            // active state.
            (state, Ev::RcvAbort(abort)) if state != St::Null => (
                Self {
                    state: St::Null,
                    ..self
                },
                vec![WtpAction::IndicateAbort(abort)],
            ),
            (state, Ev::RcvErrorPdu) if state != St::Null => {
                let abort = WtpAbort::Provider(WtpProviderAbortReason::ProtocolError);
                (
                    Self {
                        state: St::Null,
                        ..self
                    },
                    vec![WtpAction::IndicateAbort(abort)],
                )
            }

            // No defined transition for this (state, event) pair: ignore rather than panic.
            // Matches this crate's "never panic on protocol input" rule -- an event this state
            // doesn't expect is treated as a no-op, not an error, since WTP itself is silent on
            // out-of-order duplicates in several of these cases (§7.2.4).
            (_, _) => (self, Vec::new()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn policy() -> WtpInitiatorPolicy {
        WtpInitiatorPolicy {
            max_rcr: 3,
            max_aec: 2,
        }
    }

    #[test]
    fn class2_invoke_ack_result_result_res_reaches_wait_timeout() {
        let ctx = WtpInitiatorContext::new(WtpTransactionClass::Class2ReliableRequestResponse);

        let (ctx, actions) = ctx.advance(&policy(), WtpInitiatorEvent::TrInvokeReq);
        assert_eq!(ctx.state, WtpInitiatorTransactionState::ResultWait);
        assert_eq!(
            actions,
            vec![
                WtpAction::SendInvoke,
                WtpAction::StartTimer(WtpTimerKind::Retry)
            ]
        );

        let (ctx, actions) = ctx.advance(&policy(), WtpInitiatorEvent::RcvAck);
        assert_eq!(ctx.state, WtpInitiatorTransactionState::ResultWait);
        assert!(ctx.hold_on);
        assert!(actions.contains(&WtpAction::ConfirmInvoke));

        let (ctx, actions) = ctx.advance(
            &policy(),
            WtpInitiatorEvent::RcvResult {
                retransmitted: false,
            },
        );
        assert_eq!(ctx.state, WtpInitiatorTransactionState::ResultRespWait);
        assert!(actions.contains(&WtpAction::IndicateResult));

        let (ctx, actions) = ctx.advance(&policy(), WtpInitiatorEvent::TrResultRes);
        assert_eq!(ctx.state, WtpInitiatorTransactionState::WaitTimeout);
        assert!(actions.contains(&WtpAction::SendAck));

        let (ctx, actions) = ctx.advance(&policy(), WtpInitiatorEvent::TimerToW);
        assert_eq!(ctx.state, WtpInitiatorTransactionState::Null);
        assert_eq!(actions, vec![WtpAction::StopTimer(WtpTimerKind::Wait)]);
    }

    #[test]
    fn class1_completes_on_single_ack_without_reaching_class2_states() {
        let ctx = WtpInitiatorContext::new(WtpTransactionClass::Class1ReliableOneWay);
        let (ctx, _) = ctx.advance(&policy(), WtpInitiatorEvent::TrInvokeReq);
        assert_eq!(ctx.state, WtpInitiatorTransactionState::ResultWait);

        let (ctx, _) = ctx.advance(&policy(), WtpInitiatorEvent::RcvAck);
        assert_eq!(
            ctx.state,
            WtpInitiatorTransactionState::Null,
            "Class 1 has no Result phase"
        );
    }

    #[test]
    fn class0_stays_in_null_and_never_retries() {
        let ctx = WtpInitiatorContext::new(WtpTransactionClass::Class0UnreliableInvoke);
        let (ctx, actions) = ctx.advance(&policy(), WtpInitiatorEvent::TrInvokeReq);
        assert_eq!(ctx.state, WtpInitiatorTransactionState::Null);
        assert_eq!(
            actions,
            vec![
                WtpAction::SendInvoke,
                WtpAction::StartTimer(WtpTimerKind::Retry)
            ]
        );

        // No defined transition for a retry timer while already Null/Class0 -- must be ignored,
        // not panic and not retransmit (Class 0 has "no duplicate removal or verification
        // procedure performed", §6.1, precisely because there is no retry at all).
        let (ctx, actions) = ctx.advance(&policy(), WtpInitiatorEvent::TimerToR);
        assert_eq!(ctx.state, WtpInitiatorTransactionState::Null);
        assert!(actions.is_empty());
    }

    // --- Correctness trap 1 (initiator side): TID-verification handshake ---

    #[test]
    fn tid_verification_ack_is_answered_with_tid_ok_and_retry_counted() {
        let ctx = WtpInitiatorContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, _) = ctx.advance(&policy(), WtpInitiatorEvent::TrInvokeReq);

        let (ctx, actions) = ctx.advance(&policy(), WtpInitiatorEvent::RcvAckTve);
        assert_eq!(
            ctx.state,
            WtpInitiatorTransactionState::ResultWait,
            "must stay in ResultWait during verification"
        );
        assert_eq!(ctx.rcr, RetransmissionCounter(1));
        assert!(actions.contains(&WtpAction::SendAckWithTidOk));
    }

    // --- Correctness trap 2: abort type/reason are never separable ---

    #[test]
    fn retransmission_counter_exhaustion_aborts_with_provider_type_never_user() {
        let mut ctx = WtpInitiatorContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        (ctx, _) = ctx.advance(&policy(), WtpInitiatorEvent::TrInvokeReq);

        let mut actions = Vec::new();
        for _ in 0..=policy().max_rcr {
            let (next_ctx, next_actions) = ctx.advance(&policy(), WtpInitiatorEvent::TimerToR);
            ctx = next_ctx;
            actions = next_actions;
        }

        assert_eq!(ctx.state, WtpInitiatorTransactionState::Null);
        assert!(
            actions
                .iter()
                .any(|action| matches!(
                    action,
                    WtpAction::SendAbort(WtpAbort::Provider(WtpProviderAbortReason::NoResponse))
                )),
            "RCR exhaustion must abort with type Provider, matching the fix for Kannel bug #102 \
             (a real shipped bug where this exact transition sent type User instead), actions: {actions:?}"
        );
        assert!(
            !actions
                .iter()
                .any(|action| matches!(action, WtpAction::SendAbort(WtpAbort::User(_)))),
            "must never emit a User-typed abort for a provider-driven retry exhaustion"
        );
    }

    #[test]
    fn ack_expiration_counter_exhaustion_aborts_with_provider_type() {
        let mut ctx = WtpInitiatorContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        (ctx, _) = ctx.advance(&policy(), WtpInitiatorEvent::TrInvokeReq);
        (ctx, _) = ctx.advance(
            &policy(),
            WtpInitiatorEvent::RcvResult {
                retransmitted: false,
            },
        );
        assert_eq!(ctx.state, WtpInitiatorTransactionState::ResultRespWait);

        let mut actions = Vec::new();
        for _ in 0..=policy().max_aec {
            let (next_ctx, next_actions) = ctx.advance(&policy(), WtpInitiatorEvent::TimerToA);
            ctx = next_ctx;
            actions = next_actions;
        }

        assert_eq!(ctx.state, WtpInitiatorTransactionState::Null);
        assert!(actions.iter().any(|action| matches!(
            action,
            WtpAction::SendAbort(WtpAbort::Provider(WtpProviderAbortReason::NoResponse))
        )));
    }

    #[test]
    fn peer_abort_tears_down_from_any_active_state_and_indicates_to_user() {
        let ctx = WtpInitiatorContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, _) = ctx.advance(&policy(), WtpInitiatorEvent::TrInvokeReq);

        let inbound_abort = WtpAbort::Provider(WtpProviderAbortReason::InvalidTid);
        let (ctx, actions) = ctx.advance(&policy(), WtpInitiatorEvent::RcvAbort(inbound_abort));
        assert_eq!(ctx.state, WtpInitiatorTransactionState::Null);
        assert_eq!(actions, vec![WtpAction::IndicateAbort(inbound_abort)]);
    }

    // --- Correctness trap 3: malformed input never reaches this layer as raw bytes, only as a
    // defined RcvErrorPdu event, and that event never panics regardless of current state. ---

    #[test]
    fn malformed_pdu_event_never_panics_from_any_reachable_state() {
        let states = [
            WtpInitiatorTransactionState::Null,
            WtpInitiatorTransactionState::ResultWait,
            WtpInitiatorTransactionState::ResultRespWait,
            WtpInitiatorTransactionState::WaitTimeout,
        ];
        for state in states {
            let ctx = WtpInitiatorContext {
                class: WtpTransactionClass::Class2ReliableRequestResponse,
                state,
                rcr: RetransmissionCounter::default(),
                aec: AckExpirationCounter::default(),
                hold_on: false,
            };
            let (_ctx, _actions) = ctx.advance(&policy(), WtpInitiatorEvent::RcvErrorPdu);
        }
    }
}
