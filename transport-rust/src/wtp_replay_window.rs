#![allow(dead_code)]

use serde::{Deserialize, Serialize};

pub const WTP_TID_MODULUS: u16 = 1 << 14;
const WTP_TID_MASK: u16 = WTP_TID_MODULUS - 1;

fn tid_distance(last_tid: u16, incoming_tid: u16) -> u16 {
    (incoming_tid.wrapping_sub(last_tid)) & WTP_TID_MASK
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpResponderTidDecision {
    Accept,
    ReplayCachedTerminal,
    DropAsDuplicate,
    DropAsStale,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpInitiatorTidDecision {
    Accept {
        accepted: bool,
        next_steps_in_window: u16,
        next_last_tid: u16,
    },
    DuplicateRetransmission,
    RequireRestart,
    OutOfReplayWindow,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WtpReplayCacheMode {
    Cache,
    NoCache,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WtpDuplicateAssumption {
    Guaranteed,
    NotGuaranteed,
}

#[derive(Debug, Clone, Copy, Deserialize)]
pub struct WtpResponderPolicy {
    pub replay_window: u16,
    pub cache_mode: WtpReplayCacheMode,
    pub duplicate_assumption: WtpDuplicateAssumption,
}

#[derive(Debug, Clone)]
pub struct WtpResponderState {
    pub last_tid: u16,
    pub seen_tids: Vec<u16>,
}

impl WtpResponderState {
    pub fn new(last_tid: u16, seen_tids: Vec<u16>) -> Self {
        Self {
            last_tid,
            seen_tids,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct WtpResponderTidTrace {
    pub policy_replay_window: u16,
    pub policy_cache_mode: WtpReplayCacheMode,
    pub policy_duplicate_assumption: WtpDuplicateAssumption,
    pub last_tid: u16,
    pub incoming_tid: u16,
    pub distance: u16,
    pub decision: WtpResponderTidDecision,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WtpInitiatorPolicy {
    pub maximum_packet_lifetime: u16,
}

impl WtpInitiatorPolicy {
    pub fn max_replay_steps(&self) -> u16 {
        let two_mpl = self.maximum_packet_lifetime.saturating_mul(2);
        two_mpl.min(WTP_TID_MASK)
    }
}

#[derive(Debug, Clone, Copy)]
pub struct WtpInitiatorState {
    pub last_tid: Option<u16>,
    pub steps_in_window: u16,
}

impl WtpInitiatorState {
    pub fn with_restart(&self) -> Self {
        Self {
            last_tid: None,
            steps_in_window: 0,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct WtpInitiatorTidTrace {
    pub policy_max_steps: u16,
    pub last_tid: Option<u16>,
    pub incoming_tid: u16,
    pub distance: Option<u16>,
    pub steps_in_window: u16,
    pub decision: WtpInitiatorTidDecision,
}

pub fn decide_responder_tid(
    policy: &WtpResponderPolicy,
    state: &WtpResponderState,
    incoming_tid: u16,
) -> (WtpResponderTidDecision, WtpResponderTidTrace) {
    let decision = if state.seen_tids.contains(&incoming_tid) {
        match (policy.cache_mode, policy.duplicate_assumption) {
            (WtpReplayCacheMode::Cache, WtpDuplicateAssumption::Guaranteed) => {
                WtpResponderTidDecision::ReplayCachedTerminal
            }
            _ => WtpResponderTidDecision::DropAsDuplicate,
        }
    } else {
        let distance = tid_distance(state.last_tid, incoming_tid);
        let window = policy.replay_window.min(WTP_TID_MASK);
        if distance == 0 {
            match (policy.cache_mode, policy.duplicate_assumption) {
                (WtpReplayCacheMode::Cache, WtpDuplicateAssumption::Guaranteed) => {
                    WtpResponderTidDecision::ReplayCachedTerminal
                }
                _ => WtpResponderTidDecision::DropAsDuplicate,
            }
        } else if distance > window {
            WtpResponderTidDecision::DropAsStale
        } else {
            WtpResponderTidDecision::Accept
        }
    };

    let distance = tid_distance(state.last_tid, incoming_tid);

    let trace = WtpResponderTidTrace {
        policy_replay_window: policy.replay_window,
        policy_cache_mode: policy.cache_mode,
        policy_duplicate_assumption: policy.duplicate_assumption,
        last_tid: state.last_tid,
        incoming_tid,
        distance,
        decision,
    };

    (decision, trace)
}

pub fn decide_initiator_tid(
    policy: &WtpInitiatorPolicy,
    state: &WtpInitiatorState,
    incoming_tid: u16,
) -> (WtpInitiatorTidDecision, WtpInitiatorTidTrace) {
    let max_steps = policy.max_replay_steps();
    let no_prior_tid = state.last_tid.is_none();

    let decision = if no_prior_tid {
        WtpInitiatorTidDecision::Accept {
            accepted: true,
            next_steps_in_window: 1,
            next_last_tid: incoming_tid,
        }
    } else if state.steps_in_window >= max_steps {
        WtpInitiatorTidDecision::RequireRestart
    } else {
        let last_tid = state
            .last_tid
            .expect("state.last_tid should exist when not empty");
        let distance = tid_distance(last_tid, incoming_tid);
        if distance == 0 {
            WtpInitiatorTidDecision::DuplicateRetransmission
        } else if distance > max_steps {
            WtpInitiatorTidDecision::OutOfReplayWindow
        } else {
            WtpInitiatorTidDecision::Accept {
                accepted: true,
                next_steps_in_window: state.steps_in_window + 1,
                next_last_tid: incoming_tid,
            }
        }
    };

    let trace = WtpInitiatorTidTrace {
        policy_max_steps: max_steps,
        last_tid: state.last_tid,
        incoming_tid,
        distance: state.last_tid.map(|last| tid_distance(last, incoming_tid)),
        steps_in_window: state.steps_in_window,
        decision,
    };

    (decision, trace)
}
