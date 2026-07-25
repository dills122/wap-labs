//! WTP Responder transaction state machine, WAP-224-WTP-20010710-a §9.6.
//!
//! Not wired into `network::wsp` or any live socket yet -- standalone, like
//! [`super::initiator`]. This module implements the state transitions and TID-verification
//! delivery gate precisely as read from the spec; see the module-level caveat on
//! [`WtpResponderContext::advance`]'s Class-2 result-retry handling for the one part of this
//! implementation that is a disclosed simplification rather than a re-verified spec transcription
//! -- see `docs/waves/RESEARCH_WTLS_WTP_HISTORICAL_QUIRKS_2026-07-25.md` Part 2 for the full
//! research this is built from.

use super::types::{
    AckExpirationCounter, RetransmissionCounter, WtpAbort, WtpAction, WtpProviderAbortReason,
    WtpTimerKind, WtpTransactionClass,
};

/// WAP-224-WTP §9.6. `ResultWait` is reachable only for Class 2 (it covers both "sent Result,
/// awaiting explicit Ack" and Result-retry, per the module-level doc comment); `WaitTimeout` is
/// reachable only for Class 1.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpResponderTransactionState {
    Listen,
    TidokWait,
    InvokeRespWait,
    ResultWait,
    WaitTimeout,
}

/// Outcome of testing an incoming Invoke's TID against the Responder's TID cache/window, per
/// WAP-224-WTP §7.8.2.3 Table 6. Computing this from a real duplicate-cache/TID-window
/// implementation (e.g. [`crate::wtp_replay_window::decide_responder_tid`]) is the caller's
/// responsibility -- this state machine only encodes what happens *after* the test, per Table
/// 6/7/8/9, not the TID-distance arithmetic itself (that arithmetic already exists and is tested
/// independently in `wtp_replay_window.rs`; duplicating it here would violate this repo's
/// duplication policy). Reconciling that module's four-variant decision with this spec-shaped
/// three-variant one is left as explicit future integration work for whoever wires this state
/// machine up to a real duplicate cache.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpTidTestOutcome {
    /// TID test Ok, or Fail-but-transport-guarantees-no-duplicates: start the transaction
    /// directly, no handshake needed.
    StartDirectly,
    /// TID test Fail and the transport cannot guarantee no duplicates: the three-way
    /// TID-verification handshake (§7.9) must run before delivery.
    RequiresVerification,
    /// Exact duplicate of the transaction currently cached as terminal (`RcvTID == LastTID`):
    /// resend the cached terminal response, never re-deliver to the user.
    ReplayCachedTerminal,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WtpResponderEvent {
    /// A new Invoke PDU. `tid_test` is the caller-supplied Table 6 outcome (see
    /// [`WtpTidTestOutcome`]). `tid_new` is whether the Invoke's TIDnew flag was set -- required
    /// to apply Table 9's LastTID-update rule correctly once verification (if any) succeeds.
    RcvInvoke {
        tid_test: WtpTidTestOutcome,
        tid_new: bool,
    },
    /// A retransmitted Invoke received while still in `TidokWait`. `retransmission_indicator_set`
    /// is the PDU's RID flag (§7.2.4): RID clear is a network-level duplicate to ignore, RID set
    /// means the peer is retrying its half of the handshake and must be re-answered.
    RcvDuplicateInvokeDuringVerification {
        retransmission_indicator_set: bool,
    },
    /// The Initiator answered "yes" (Ack with TidOk set) -- step 3 of the handshake succeeding.
    RcvAckTidOk,
    /// The Initiator answered "no" (Abort with reason InvalidTid) -- step 3 of the handshake
    /// failing. Nothing was ever indicated to the local user (the Invoke was never delivered),
    /// so this only tears down local state, matching §7.9.1's delivery gate.
    RcvVerificationRejected,
    /// A plain Ack (no Tve/TidOk flags), e.g. explicit acknowledgement of a sent Result.
    RcvAck,
    RcvAbort(WtpAbort),
    RcvErrorPdu,
    /// Class 1 only: `TR-Invoke.res`, the local WTP user supplies the final (implicit) result.
    TrInvokeRes,
    /// Class 2 only: `TR-Result.req`, the local WTP user supplies the Result.
    TrResultReq,
    TimerToA,
    TimerToR,
    TimerToW,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpResponderPolicy {
    pub max_rcr: u8,
    pub max_aec: u8,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpResponderContext {
    pub class: WtpTransactionClass,
    pub state: WtpResponderTransactionState,
    pub rcr: RetransmissionCounter,
    pub aec: AckExpirationCounter,
    /// Whether `LastTID` should be advanced to this transaction's TID once delivery actually
    /// happens (Table 9: only when the Invoke that started this transaction had TIDnew set).
    /// Captured from `RcvInvoke` and consumed by the caller once the corresponding
    /// `IndicateInvoke` action is emitted -- this state machine does not own the TID cache
    /// itself, only this one bit of Table-9-required bookkeeping about it.
    pub advance_last_tid: bool,
    /// Set while in `TidokWait`, carried over from the `RcvInvoke` that triggered verification,
    /// so `RcvAckTidOk` can apply Table 9's LastTID rule using the *original* Invoke's TIDnew
    /// flag rather than losing that information across the handshake.
    pending_tid_new: bool,
}

impl WtpResponderContext {
    pub fn new(class: WtpTransactionClass) -> Self {
        Self {
            class,
            state: WtpResponderTransactionState::Listen,
            rcr: RetransmissionCounter::default(),
            aec: AckExpirationCounter::default(),
            advance_last_tid: false,
            pending_tid_new: false,
        }
    }

    /// Advance by one event. Pure, like [`super::initiator::WtpInitiatorContext::advance`].
    ///
    /// The Class-2 Result-retry side of this state machine (`ResultWait`, covering both "sent
    /// Result, awaiting explicit Ack" and RCR-bounded retry of the Result PDU) is a disclosed
    /// simplification: this implementation pass transcribed the Initiator's §9.5 tables directly
    /// and with confidence, but summarized the Responder's Class-2 Result-side behavior from
    /// notes rather than re-reading §9.6's raw table text cell-by-cell. If the spec in fact
    /// splits this into two states for the Responder (mirroring the Initiator's
    /// `ResultRespWait`/`WaitTimeout` split), that split is not reproduced here. The
    /// correctness-critical behavior -- retry bounded by `max_rcr`, abort always typed
    /// `Provider` -- holds regardless; only the exact state *count* on this one branch is
    /// unverified. Check against WAP-224-WTP §9.6 directly before this is wired into a live
    /// socket.
    pub fn advance(
        self,
        policy: &WtpResponderPolicy,
        event: WtpResponderEvent,
    ) -> (Self, Vec<WtpAction>) {
        use WtpResponderEvent as Ev;
        use WtpResponderTransactionState as St;
        use WtpTidTestOutcome as Tid;
        use WtpTransactionClass as Cls;

        match (self.state, event) {
            (
                St::Listen,
                Ev::RcvInvoke {
                    tid_test: Tid::StartDirectly,
                    tid_new,
                },
            ) => (
                Self {
                    state: St::InvokeRespWait,
                    advance_last_tid: tid_new,
                    ..self
                },
                vec![
                    WtpAction::IndicateInvoke,
                    WtpAction::StartTimer(WtpTimerKind::Ack),
                ],
            ),

            (
                St::Listen,
                Ev::RcvInvoke {
                    tid_test: Tid::RequiresVerification,
                    tid_new,
                },
            ) => (
                Self {
                    state: St::TidokWait,
                    pending_tid_new: tid_new,
                    ..self
                },
                // §7.9.1: the Invoke MUST NOT be delivered to the user yet -- no IndicateInvoke
                // here. This is the correctness-critical branch this module exists to get right.
                vec![WtpAction::SendAckWithTve],
            ),

            (
                St::Listen,
                Ev::RcvInvoke {
                    tid_test: Tid::ReplayCachedTerminal,
                    ..
                },
            ) => (self, vec![WtpAction::ResendCachedTerminal]),

            (
                St::TidokWait,
                Ev::RcvDuplicateInvokeDuringVerification {
                    retransmission_indicator_set: true,
                },
            ) => (self, vec![WtpAction::SendAckWithTve]),
            (
                St::TidokWait,
                Ev::RcvDuplicateInvokeDuringVerification {
                    retransmission_indicator_set: false,
                },
            ) => (self, Vec::new()),

            (St::TidokWait, Ev::RcvAckTidOk) => (
                Self {
                    state: St::InvokeRespWait,
                    advance_last_tid: self.pending_tid_new,
                    pending_tid_new: false,
                    ..self
                },
                vec![
                    WtpAction::IndicateInvoke,
                    WtpAction::StartTimer(WtpTimerKind::Ack),
                ],
            ),

            (St::TidokWait, Ev::RcvVerificationRejected) => (
                Self {
                    state: St::Listen,
                    pending_tid_new: false,
                    ..self
                },
                // Nothing was ever indicated to the local user -- only local cleanup, no
                // IndicateAbort, matching §7.9.1's delivery gate.
                Vec::new(),
            ),

            (St::InvokeRespWait, Ev::TrInvokeRes) if self.class == Cls::Class1ReliableOneWay => (
                Self {
                    state: St::WaitTimeout,
                    ..self
                },
                vec![WtpAction::SendAck, WtpAction::StopTimer(WtpTimerKind::Ack)],
            ),

            (St::InvokeRespWait, Ev::TrResultReq)
                if self.class == Cls::Class2ReliableRequestResponse =>
            {
                (
                    Self {
                        state: St::ResultWait,
                        ..self
                    },
                    vec![
                        WtpAction::SendResult,
                        WtpAction::StopTimer(WtpTimerKind::Ack),
                        WtpAction::StartTimer(WtpTimerKind::Retry),
                    ],
                )
            }

            (St::InvokeRespWait, Ev::TimerToA) => {
                if self.aec.has_reached(policy.max_aec) {
                    let abort = WtpAbort::Provider(WtpProviderAbortReason::NoResponse);
                    (
                        Self {
                            state: St::Listen,
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
                        vec![
                            WtpAction::SendAckHoldOn,
                            WtpAction::StartTimer(WtpTimerKind::Ack),
                        ],
                    )
                }
            }

            (St::ResultWait, Ev::RcvAck) => (
                Self {
                    state: St::Listen,
                    ..self
                },
                vec![WtpAction::StopTimer(WtpTimerKind::Retry)],
            ),

            (St::ResultWait, Ev::TimerToR) => {
                if self.rcr.has_reached(policy.max_rcr) {
                    let abort = WtpAbort::Provider(WtpProviderAbortReason::NoResponse);
                    (
                        Self {
                            state: St::Listen,
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
                            WtpAction::SendResult,
                            WtpAction::StartTimer(WtpTimerKind::Retry),
                        ],
                    )
                }
            }

            (
                St::WaitTimeout,
                Ev::RcvDuplicateInvokeDuringVerification {
                    retransmission_indicator_set: true,
                },
            ) => (self, vec![WtpAction::SendAck]),

            (St::WaitTimeout, Ev::TimerToW) => (
                Self {
                    state: St::Listen,
                    ..self
                },
                vec![WtpAction::StopTimer(WtpTimerKind::Wait)],
            ),

            (state, Ev::RcvAbort(abort)) if state != St::Listen => (
                Self {
                    state: St::Listen,
                    ..self
                },
                vec![WtpAction::IndicateAbort(abort)],
            ),
            (state, Ev::RcvErrorPdu) if state != St::Listen => {
                let abort = WtpAbort::Provider(WtpProviderAbortReason::ProtocolError);
                (
                    Self {
                        state: St::Listen,
                        ..self
                    },
                    vec![WtpAction::IndicateAbort(abort)],
                )
            }

            // No defined transition for this (state, event) pair: ignore, matching the same
            // "never panic on protocol input, out-of-order duplicates are silently absorbed"
            // rule as the Initiator side.
            (_, _) => (self, Vec::new()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn policy() -> WtpResponderPolicy {
        WtpResponderPolicy {
            max_rcr: 3,
            max_aec: 2,
        }
    }

    // --- Correctness trap 1: TID verification must gate delivery, and `advance_last_tid` must
    // only end up true on the TIDnew branch of Table 9. ---

    #[test]
    fn direct_tid_accept_delivers_immediately_and_honors_tid_new() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, actions) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::StartDirectly,
                tid_new: true,
            },
        );
        assert_eq!(ctx.state, WtpResponderTransactionState::InvokeRespWait);
        assert!(ctx.advance_last_tid, "TIDnew was set, LastTID must advance");
        assert!(actions.contains(&WtpAction::IndicateInvoke));
    }

    #[test]
    fn verification_required_does_not_deliver_until_tid_ok() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, actions) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::RequiresVerification,
                tid_new: false,
            },
        );
        assert_eq!(ctx.state, WtpResponderTransactionState::TidokWait);
        assert!(
            !actions.contains(&WtpAction::IndicateInvoke),
            "must not deliver to the user before the TID-verification handshake completes (spec §7.9.1)"
        );
        assert!(actions.contains(&WtpAction::SendAckWithTve));

        // Handshake succeeds: NOW it may deliver, and since the original Invoke did not set
        // TIDnew, Table 9 says LastTID must stay unchanged.
        let (ctx, actions) = ctx.advance(&policy(), WtpResponderEvent::RcvAckTidOk);
        assert_eq!(ctx.state, WtpResponderTransactionState::InvokeRespWait);
        assert!(actions.contains(&WtpAction::IndicateInvoke));
        assert!(
            !ctx.advance_last_tid,
            "TIDnew was NOT set on the original Invoke -- Table 9 requires LastTID stay unchanged \
             even though verification succeeded"
        );
    }

    #[test]
    fn verification_required_with_tid_new_advances_last_tid_after_success() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, _) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::RequiresVerification,
                tid_new: true,
            },
        );
        let (ctx, _) = ctx.advance(&policy(), WtpResponderEvent::RcvAckTidOk);
        assert!(
            ctx.advance_last_tid,
            "TIDnew was set on the original Invoke -- LastTID must advance"
        );
    }

    #[test]
    fn verification_rejected_never_delivers_and_returns_to_listen() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, _) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::RequiresVerification,
                tid_new: false,
            },
        );
        let (ctx, actions) = ctx.advance(&policy(), WtpResponderEvent::RcvVerificationRejected);
        assert_eq!(ctx.state, WtpResponderTransactionState::Listen);
        assert!(
            !actions.contains(&WtpAction::IndicateInvoke) && !actions.iter().any(|a| matches!(a, WtpAction::IndicateAbort(_))),
            "nothing was ever delivered to the user, so nothing should be indicated on rejection either"
        );
    }

    #[test]
    fn replay_cached_terminal_never_redelivers_to_user() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, actions) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::ReplayCachedTerminal,
                tid_new: false,
            },
        );
        assert_eq!(
            ctx.state,
            WtpResponderTransactionState::Listen,
            "an exact duplicate does not start a new transaction"
        );
        assert_eq!(actions, vec![WtpAction::ResendCachedTerminal]);
    }

    #[test]
    fn duplicate_invoke_during_verification_ignored_when_rid_clear_reanswered_when_rid_set() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, _) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::RequiresVerification,
                tid_new: false,
            },
        );

        let (ctx, actions) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvDuplicateInvokeDuringVerification {
                retransmission_indicator_set: false,
            },
        );
        assert_eq!(ctx.state, WtpResponderTransactionState::TidokWait);
        assert!(
            actions.is_empty(),
            "RID clear during verification is a network-level duplicate, ignored"
        );

        let (ctx, actions) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvDuplicateInvokeDuringVerification {
                retransmission_indicator_set: true,
            },
        );
        assert_eq!(ctx.state, WtpResponderTransactionState::TidokWait);
        assert_eq!(actions, vec![WtpAction::SendAckWithTve]);
    }

    // --- Correctness trap 2: abort type/reason are never separable ---

    #[test]
    fn invoke_resp_wait_ack_expiration_exhaustion_aborts_with_provider_type() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (mut ctx, _) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::StartDirectly,
                tid_new: true,
            },
        );

        let mut actions = Vec::new();
        for _ in 0..=policy().max_aec {
            let (next_ctx, next_actions) = ctx.advance(&policy(), WtpResponderEvent::TimerToA);
            ctx = next_ctx;
            actions = next_actions;
        }

        assert_eq!(ctx.state, WtpResponderTransactionState::Listen);
        assert!(actions.iter().any(|action| matches!(
            action,
            WtpAction::SendAbort(WtpAbort::Provider(WtpProviderAbortReason::NoResponse))
        )));
        assert!(!actions
            .iter()
            .any(|action| matches!(action, WtpAction::SendAbort(WtpAbort::User(_)))));
    }

    #[test]
    fn result_retry_exhaustion_aborts_with_provider_type() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class2ReliableRequestResponse);
        let (ctx, _) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::StartDirectly,
                tid_new: true,
            },
        );
        let (mut ctx, _) = ctx.advance(&policy(), WtpResponderEvent::TrResultReq);
        assert_eq!(ctx.state, WtpResponderTransactionState::ResultWait);

        let mut actions = Vec::new();
        for _ in 0..=policy().max_rcr {
            let (next_ctx, next_actions) = ctx.advance(&policy(), WtpResponderEvent::TimerToR);
            ctx = next_ctx;
            actions = next_actions;
        }

        assert_eq!(ctx.state, WtpResponderTransactionState::Listen);
        assert!(actions.iter().any(|action| matches!(
            action,
            WtpAction::SendAbort(WtpAbort::Provider(WtpProviderAbortReason::NoResponse))
        )));
    }

    // --- Correctness trap 3: a defined RcvErrorPdu event never panics from any reachable state ---

    #[test]
    fn malformed_pdu_event_never_panics_from_any_reachable_state() {
        let states = [
            WtpResponderTransactionState::Listen,
            WtpResponderTransactionState::TidokWait,
            WtpResponderTransactionState::InvokeRespWait,
            WtpResponderTransactionState::ResultWait,
            WtpResponderTransactionState::WaitTimeout,
        ];
        for state in states {
            let ctx = WtpResponderContext {
                class: WtpTransactionClass::Class2ReliableRequestResponse,
                state,
                rcr: RetransmissionCounter::default(),
                aec: AckExpirationCounter::default(),
                advance_last_tid: false,
                pending_tid_new: false,
            };
            let (_ctx, _actions) = ctx.advance(&policy(), WtpResponderEvent::RcvErrorPdu);
        }
    }

    #[test]
    fn class1_uses_wait_timeout_not_class2_result_states() {
        let ctx = WtpResponderContext::new(WtpTransactionClass::Class1ReliableOneWay);
        let (ctx, _) = ctx.advance(
            &policy(),
            WtpResponderEvent::RcvInvoke {
                tid_test: WtpTidTestOutcome::StartDirectly,
                tid_new: true,
            },
        );
        let (ctx, actions) = ctx.advance(&policy(), WtpResponderEvent::TrInvokeRes);
        assert_eq!(ctx.state, WtpResponderTransactionState::WaitTimeout);
        assert!(actions.contains(&WtpAction::SendAck));
    }
}
