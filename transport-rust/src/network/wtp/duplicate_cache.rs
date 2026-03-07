#![allow(dead_code)]

use std::collections::VecDeque;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpDuplicatePolicy {
    pub cache_terminal_responses: bool,
    pub max_cached_transactions: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WtpDuplicateDecision {
    Accept,
    ReplayCachedTerminal,
    DropAsDuplicate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WtpDuplicateObservation {
    pub tid: u16,
    pub terminal_seen: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct WtpDuplicateCacheState {
    observations: VecDeque<WtpDuplicateObservation>,
}

#[derive(Debug)]
pub struct WtpDuplicateTrace {
    pub policy: WtpDuplicatePolicy,
    pub tid: u16,
    pub terminal_seen: bool,
    pub cache_size: usize,
}

impl WtpDuplicateCacheState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn decide(
        &mut self,
        policy: &WtpDuplicatePolicy,
        tid: u16,
        is_terminal_result: bool,
    ) -> (WtpDuplicateDecision, WtpDuplicateTrace) {
        let existing = self.observations.iter().find(|obs| obs.tid == tid).copied();

        let decision = if let Some(previous) = existing {
            if (previous.terminal_seen || is_terminal_result) && policy.cache_terminal_responses {
                WtpDuplicateDecision::ReplayCachedTerminal
            } else {
                WtpDuplicateDecision::DropAsDuplicate
            }
        } else {
            WtpDuplicateDecision::Accept
        };

        if !self.observations.iter().any(|obs| obs.tid == tid) {
            self.observations.push_back(WtpDuplicateObservation {
                tid,
                terminal_seen: is_terminal_result,
            });
            if self.observations.len() > policy.max_cached_transactions {
                self.observations.pop_front();
            }
        }

        (
            decision,
            WtpDuplicateTrace {
                policy: *policy,
                tid,
                terminal_seen: is_terminal_result,
                cache_size: self.observations.len(),
            },
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cache_accepts_new_transaction_and_records_terminal_seen_state() {
        let policy = WtpDuplicatePolicy {
            cache_terminal_responses: true,
            max_cached_transactions: 2,
        };
        let mut state = WtpDuplicateCacheState::new();

        let (accept_first, trace_first) = state.decide(&policy, 10, false);
        assert_eq!(accept_first, WtpDuplicateDecision::Accept);
        assert_eq!(trace_first.cache_size, 1);

        let (accept_second, trace_second) = state.decide(&policy, 11, true);
        assert_eq!(accept_second, WtpDuplicateDecision::Accept);
        assert_eq!(trace_second.cache_size, 2);

        let (replay, _trace_replay) = state.decide(&policy, 11, false);
        assert_eq!(replay, WtpDuplicateDecision::ReplayCachedTerminal);
        assert_eq!(state.observations.len(), 2);
    }

    #[test]
    fn cache_drops_nonterminal_duplicate_when_terminal_replay_disabled() {
        let policy = WtpDuplicatePolicy {
            cache_terminal_responses: false,
            max_cached_transactions: 1,
        };
        let mut state = WtpDuplicateCacheState::new();

        let (first, _) = state.decide(&policy, 5, false);
        assert_eq!(first, WtpDuplicateDecision::Accept);

        let (second, _) = state.decide(&policy, 5, false);
        assert_eq!(second, WtpDuplicateDecision::DropAsDuplicate);
    }

    #[test]
    fn cache_replaces_oldest_when_capacity_exceeded() {
        let policy = WtpDuplicatePolicy {
            cache_terminal_responses: true,
            max_cached_transactions: 2,
        };
        let mut state = WtpDuplicateCacheState::new();

        let _ = state.decide(&policy, 1, true);
        let _ = state.decide(&policy, 2, true);
        let (third, _) = state.decide(&policy, 3, true);
        assert_eq!(third, WtpDuplicateDecision::Accept);
        assert_eq!(state.observations.len(), 2);
        let (first_accepted_after_eviction, _) = state.decide(&policy, 1, false);
        assert_eq!(first_accepted_after_eviction, WtpDuplicateDecision::Accept);
        let (third_replayed, _) = state.decide(&policy, 3, false);
        assert_eq!(third_replayed, WtpDuplicateDecision::ReplayCachedTerminal);
    }
}
