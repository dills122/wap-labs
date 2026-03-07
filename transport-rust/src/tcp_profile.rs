#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TcpPostureStatus {
    Implemented,
    Delegated,
    Deferred,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TcpPostureDecision {
    pub status: TcpPostureStatus,
    pub rationale: &'static str,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WirelessProfiledTcpPosture {
    pub rfc_baseline: TcpPostureDecision,
    pub sack: TcpPostureDecision,
    pub split_mode: TcpPostureDecision,
    pub end_to_end_mode: TcpPostureDecision,
    pub window_scale_64kb_or_more: TcpPostureDecision,
}

pub fn wireless_profiled_tcp_posture() -> WirelessProfiledTcpPosture {
    WirelessProfiledTcpPosture {
        rfc_baseline: TcpPostureDecision {
            status: TcpPostureStatus::Delegated,
            rationale: "Handled by platform TCP stack via reqwest/rustls transport path.",
        },
        sack: TcpPostureDecision {
            status: TcpPostureStatus::Delegated,
            rationale: "SACK behavior is delegated to host OS TCP implementation.",
        },
        split_mode: TcpPostureDecision {
            status: TcpPostureStatus::Deferred,
            rationale: "Explicitly out of current MVP scope until networking profile gate T0-14.",
        },
        end_to_end_mode: TcpPostureDecision {
            status: TcpPostureStatus::Delegated,
            rationale:
                "Direct TCP path semantics are provided by host TCP stack and upstream routing.",
        },
        window_scale_64kb_or_more: TcpPostureDecision {
            status: TcpPostureStatus::Delegated,
            rationale: "Window scaling support is delegated to host TCP stack capability.",
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::load_json_fixture;
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct FixtureDecision {
        status: String,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct FixturePosture {
        rfc_baseline: FixtureDecision,
        sack: FixtureDecision,
        split_mode: FixtureDecision,
        end_to_end_mode: FixtureDecision,
        window_scale_64kb_or_more: FixtureDecision,
    }

    fn load_fixture() -> FixturePosture {
        load_json_fixture(&[
            "tests",
            "fixtures",
            "transport",
            "wireless_profiled_tcp_policy_mapped",
            "policy_fixture.json",
        ])
    }

    fn status_to_str(status: TcpPostureStatus) -> &'static str {
        match status {
            TcpPostureStatus::Implemented => "implemented",
            TcpPostureStatus::Delegated => "delegated",
            TcpPostureStatus::Deferred => "deferred",
        }
    }

    #[test]
    fn wireless_profiled_tcp_posture_matches_declared_policy_fixture() {
        let fixture = load_fixture();
        let posture = wireless_profiled_tcp_posture();
        assert_eq!(
            status_to_str(posture.rfc_baseline.status),
            fixture.rfc_baseline.status
        );
        assert_eq!(status_to_str(posture.sack.status), fixture.sack.status);
        assert_eq!(
            status_to_str(posture.split_mode.status),
            fixture.split_mode.status
        );
        assert_eq!(
            status_to_str(posture.end_to_end_mode.status),
            fixture.end_to_end_mode.status
        );
        assert_eq!(
            status_to_str(posture.window_scale_64kb_or_more.status),
            fixture.window_scale_64kb_or_more.status
        );
    }
}
