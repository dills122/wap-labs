//! Shared WTP (Wireless Transaction Protocol, WAP-224-WTP-20010710-a) types used by both the
//! Initiator ([`super::initiator`]) and Responder ([`super::responder`]) transaction state
//! machines.
//!
//! Built from the research in
//! `docs/waves/RESEARCH_WTLS_WTP_HISTORICAL_QUIRKS_2026-07-25.md` Part 2, which reads the
//! primary spec directly and cites section numbers throughout -- see that document for the
//! normative justification behind each shape here, and its "Open questions" section for what
//! was not independently re-verified against the raw spec text.
//!
//! No I/O, no wire codec, and no wall-clock timing live in this module or its siblings: timers
//! are requested as [`WtpAction::StartTimer`]/[`WtpAction::StopTimer`] values for the caller to
//! actually schedule, matching the existing `elapsed_ms`-as-data pattern in
//! `network::wtp::retransmission`.

/// WAP-224-WTP §6. `Class0`/`Class1` share the Initiator/Responder state *sets* with `Class2`
/// but never reach the Class-2-only states (`ResultRespWait` on the Initiator side,
/// `ResultWait`/`WaitTimeout` variants gated to Class 2/1 respectively on the Responder side) --
/// enforced by the `advance` match arms in `initiator`/`responder`, not by the type system. See
/// the research memo §3.1 for why a fully separate per-class state enum was considered and not
/// done here (judged not worth the added type machinery for a first real implementation pass).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpTransactionClass {
    Class0UnreliableInvoke,
    Class1ReliableOneWay,
    Class2ReliableRequestResponse,
}

/// WAP-224-WTP §8.3.4.1 Table 19. Closed set of *provider*-generated abort reasons. A `User`
/// abort's reason is opaque to WTP itself (WSP owns that code space per the spec text), which is
/// why it is not a variant of this enum -- see [`WtpAbort`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpProviderAbortReason {
    Unknown,
    ProtocolError,
    /// Initiator-only: negative outcome of the three-way TID-verification handshake (§7.9.3
    /// Table 9, "Invalid TID -> abort").
    InvalidTid,
    NotImplementedClass2,
    NotImplementedSar,
    NotImplementedUAck,
    WtpVersionOne,
    CapacityTemporarilyExceeded,
    /// Ack-Expiration-Counter or Retransmission-Counter exhausted -- see the doc comment on
    /// [`crate::network::wtp::initiator::WtpInitiatorContext::advance`] for the caveat that this
    /// implementation uses `NoResponse` for both RCR and AEC exhaustion, which was not
    /// independently confirmed cell-by-cell against the primary spec's per-transition reason
    /// codes in this implementation pass (matches Kannel's own observed behavior for the
    /// RCR-exhaustion case, per the research memo's bug #102 citation).
    NoResponse,
    MessageTooLarge,
    NotImplementedExtendedSar,
}

/// WAP-224-WTP §8.3.4.1 Table 18. Pairs abort type and reason so the two can never be emitted
/// separately -- the direct type-level fix for a real historical bug (Kannel `ChangeLog-1.3.2`
/// bug #102: a `RESULT_RESP_WAIT` retry-exhaustion abort shipped with type `USER` instead of
/// `PROVIDER` because the fields were independently defaultable). With this shape it is not
/// possible to construct "provider gave up" with the wrong type, or a `User` abort carrying a
/// `WtpProviderAbortReason` that was never meant for it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpAbort {
    Provider(WtpProviderAbortReason),
    /// `TR-Abort.req`-originated abort. The `u8` is a WTP-user-owned (e.g. WSP-defined) reason
    /// code that WTP itself does not interpret (§7.7).
    User(u8),
}

/// WAP-224-WTP §9.4.1, Table 38-39. One conceptual timer per transaction, reused for three
/// different interval purposes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpTimerKind {
    /// Bound before retransmitting a PDU.
    Retry,
    /// Bound before an Ack (or hold-on Ack) must be sent.
    Ack,
    /// Bound on how long to retain state to answer a duplicate-of-the-last-message after the
    /// transaction is otherwise complete.
    Wait,
}

/// WAP-224-WTP §9.4.2 Table 40. Bounds PDU retransmissions. Kept as a distinct newtype from
/// [`AckExpirationCounter`] so the two -- which bound genuinely different things -- can never be
/// compared against each other's limit by accident.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct RetransmissionCounter(pub u8);

impl RetransmissionCounter {
    pub fn increment(self) -> Self {
        Self(self.0.saturating_add(1))
    }

    pub fn has_reached(self, max: u8) -> bool {
        self.0 >= max
    }
}

/// WAP-224-WTP §9.4.2 Table 40. Bounds how many times the Ack-interval timer may expire/restart
/// (i.e. how many "hold-on" cycles) before the transaction aborts with `NoResponse`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct AckExpirationCounter(pub u8);

impl AckExpirationCounter {
    pub fn increment(self) -> Self {
        Self(self.0.saturating_add(1))
    }

    pub fn has_reached(self, max: u8) -> bool {
        self.0 >= max
    }
}

/// A side-effect *request* emitted by a pure transition function. The state machine itself never
/// performs I/O or starts a real timer -- the caller executes these against the actual wire/timer
/// boundary, matching the "internal functions return values, I/O happens at the edge" rule in
/// `docs/agents/RUST_ENGINE_STEERING.md` (this crate's transport analogue).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WtpAction {
    /// Send (or resend, if this is a retry) the Invoke PDU.
    SendInvoke,
    /// Send a plain Ack PDU (no Tve/TidOk flag).
    SendAck,
    /// Send an Ack PDU with the Tve flag set: "do you have an outstanding transaction with this
    /// TID?" -- step 2 of the three-way TID-verification handshake (§7.9).
    SendAckWithTve,
    /// Send an Ack PDU with the TidOk flag set: "yes" -- step 3 of the handshake, sent by the
    /// Initiator in response to `SendAckWithTve` from the Responder.
    SendAckWithTidOk,
    /// Send a "hold on" Ack: stops the peer from retransmitting the Invoke without carrying a
    /// result (§7.1.5.3). Distinct from `SendAck` because it does not end the transaction.
    SendAckHoldOn,
    /// Resend whichever PDU (Ack or Result) is cached as this transaction's terminal response,
    /// because the peer's retransmitted Invoke was recognized as an exact duplicate of an
    /// already-completed transaction.
    ResendCachedTerminal,
    /// Send the Result PDU (Class 2 only).
    SendResult,
    SendAbort(WtpAbort),
    StartTimer(WtpTimerKind),
    StopTimer(WtpTimerKind),
    /// `TR-Invoke.cnf` to the local WTP user (Initiator side): the Invoke was acknowledged.
    ConfirmInvoke,
    /// `TR-Invoke.ind` to the local WTP user (Responder side): deliver the invoke. Must never be
    /// emitted before a triggered TID-verification handshake completes (§7.9.1) -- this is the
    /// state machine's core correctness obligation on the Responder side.
    IndicateInvoke,
    /// `TR-Result.ind` to the local WTP user (Initiator side).
    IndicateResult,
    /// `TR-Abort.ind` to the local WTP user.
    IndicateAbort(WtpAbort),
}
