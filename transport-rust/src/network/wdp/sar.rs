use crate::network::wdp::datagram::WDP_MAX_UDP_PAYLOAD_BYTES;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WdpSarPolicy {
    #[default]
    Disabled,
    Enabled {
        segment_size: usize,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WdpSarDecision {
    SendAsSingleDatagram,
    SendAsFragments { fragment_count: usize },
    OversizeRejected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WdpSarTrace {
    pub policy: WdpSarPolicy,
    pub payload_len: usize,
    pub max_udp_payload: usize,
    pub segment_size: usize,
    pub decision: WdpSarDecision,
}

pub fn classify_sar_packet(
    policy: &WdpSarPolicy,
    payload_len: usize,
) -> (WdpSarDecision, WdpSarTrace) {
    let trace = WdpSarTrace {
        policy: *policy,
        payload_len,
        max_udp_payload: WDP_MAX_UDP_PAYLOAD_BYTES,
        segment_size: match *policy {
            WdpSarPolicy::Disabled => WDP_MAX_UDP_PAYLOAD_BYTES,
            WdpSarPolicy::Enabled { segment_size } => segment_size.max(1),
        },
        decision: WdpSarDecision::OversizeRejected,
    };

    let decision = match *policy {
        WdpSarPolicy::Disabled => {
            if payload_len <= WDP_MAX_UDP_PAYLOAD_BYTES {
                WdpSarDecision::SendAsSingleDatagram
            } else {
                WdpSarDecision::OversizeRejected
            }
        }
        WdpSarPolicy::Enabled { segment_size: 0 } => WdpSarDecision::OversizeRejected,
        WdpSarPolicy::Enabled { segment_size } => {
            let capped_segment_size = segment_size.max(1);
            let fragments =
                (payload_len.saturating_add(capped_segment_size - 1)) / capped_segment_size;
            if fragments <= 1 {
                WdpSarDecision::SendAsSingleDatagram
            } else {
                WdpSarDecision::SendAsFragments {
                    fragment_count: fragments,
                }
            }
        }
    };

    (decision, WdpSarTrace { decision, ..trace })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disabled_policy_keeps_single_datagram_for_legal_payload_sizes() {
        let (decision, trace) = classify_sar_packet(&WdpSarPolicy::Disabled, 10_000);
        assert_eq!(decision, WdpSarDecision::SendAsSingleDatagram);
        assert_eq!(trace.segment_size, WDP_MAX_UDP_PAYLOAD_BYTES);
    }

    #[test]
    fn disabled_policy_rejects_oversize_payload() {
        let (decision, trace) = classify_sar_packet(&WdpSarPolicy::Disabled, 70_000);
        assert_eq!(decision, WdpSarDecision::OversizeRejected);
        assert_eq!(trace.payload_len, 70_000);
    }

    #[test]
    fn enabled_policy_fragments_when_needed() {
        let (decision, trace) =
            classify_sar_packet(&WdpSarPolicy::Enabled { segment_size: 6000 }, 17_000);
        assert_eq!(
            decision,
            WdpSarDecision::SendAsFragments { fragment_count: 3 }
        );
        assert_eq!(trace.segment_size, 6000);
    }

    #[test]
    fn enabled_policy_with_zero_segment_size_rejects() {
        let (decision, _) = classify_sar_packet(&WdpSarPolicy::Enabled { segment_size: 0 }, 10);
        assert_eq!(decision, WdpSarDecision::OversizeRejected);
    }
}
