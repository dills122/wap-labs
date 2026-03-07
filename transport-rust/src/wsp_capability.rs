#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspMode {
    ConnectionOriented,
    Connectionless,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub struct WspCapabilityProposal {
    pub client_message_size: Option<u32>,
    pub server_message_size: Option<u32>,
    pub max_outstanding_requests: Option<u16>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct NegotiatedWspCapabilities {
    pub mode: WspMode,
    pub client_message_size: Option<u32>,
    pub server_message_size: Option<u32>,
    pub max_outstanding_requests: Option<u16>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspCapabilityNegotiationError {
    InvalidProposalValue {
        field: &'static str,
        side: &'static str,
        value: u32,
    },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WspCapabilityBoundError {
    MruExceeded {
        mode: WspMode,
        bytes: u32,
        limit: u32,
        abort_reason: &'static str,
    },
    MoreExceeded {
        mode: WspMode,
        outstanding: u16,
        limit: u16,
        abort_reason: &'static str,
    },
}

pub fn negotiate_wsp_capabilities(
    mode: WspMode,
    client: WspCapabilityProposal,
    server: WspCapabilityProposal,
) -> Result<NegotiatedWspCapabilities, WspCapabilityNegotiationError> {
    validate_proposal(client, "client")?;
    validate_proposal(server, "server")?;

    Ok(NegotiatedWspCapabilities {
        mode,
        client_message_size: merge_numeric(client.client_message_size, server.client_message_size),
        server_message_size: merge_numeric(server.server_message_size, client.server_message_size),
        max_outstanding_requests: merge_numeric_u16(
            client.max_outstanding_requests,
            server.max_outstanding_requests,
        ),
    })
}

pub fn enforce_wsp_capability_bounds(
    negotiated: NegotiatedWspCapabilities,
    inbound_message_bytes: u32,
    outstanding_requests: u16,
) -> Result<(), WspCapabilityBoundError> {
    let mru_limit = negotiated
        .client_message_size
        .or(negotiated.server_message_size);
    if let Some(limit) = mru_limit {
        if inbound_message_bytes > limit {
            return Err(WspCapabilityBoundError::MruExceeded {
                mode: negotiated.mode,
                bytes: inbound_message_bytes,
                limit,
                abort_reason: "MRUEXCEEDED",
            });
        }
    }

    if let Some(limit) = negotiated.max_outstanding_requests {
        if outstanding_requests > limit {
            return Err(WspCapabilityBoundError::MoreExceeded {
                mode: negotiated.mode,
                outstanding: outstanding_requests,
                limit,
                abort_reason: "MOREXCEEDED",
            });
        }
    }

    Ok(())
}

fn validate_proposal(
    proposal: WspCapabilityProposal,
    side: &'static str,
) -> Result<(), WspCapabilityNegotiationError> {
    if let Some(value) = proposal.client_message_size {
        if value == 0 {
            return Err(WspCapabilityNegotiationError::InvalidProposalValue {
                field: "clientMessageSize",
                side,
                value,
            });
        }
    }
    if let Some(value) = proposal.server_message_size {
        if value == 0 {
            return Err(WspCapabilityNegotiationError::InvalidProposalValue {
                field: "serverMessageSize",
                side,
                value,
            });
        }
    }
    if let Some(value) = proposal.max_outstanding_requests {
        if value == 0 {
            return Err(WspCapabilityNegotiationError::InvalidProposalValue {
                field: "maxOutstandingRequests",
                side,
                value: value as u32,
            });
        }
    }
    Ok(())
}

fn merge_numeric(local: Option<u32>, peer: Option<u32>) -> Option<u32> {
    match (local, peer) {
        (Some(left), Some(right)) => Some(left.min(right)),
        (Some(left), None) => Some(left),
        (None, Some(right)) => Some(right),
        (None, None) => None,
    }
}

fn merge_numeric_u16(local: Option<u16>, peer: Option<u16>) -> Option<u16> {
    match (local, peer) {
        (Some(left), Some(right)) => Some(left.min(right)),
        (Some(left), None) => Some(left),
        (None, Some(right)) => Some(right),
        (None, None) => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::load_json_fixture;
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct CapabilityFixture {
        negotiation_cases: Vec<NegotiationCase>,
        bound_cases: Vec<BoundCase>,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct NegotiationCase {
        mode: String,
        client: ProposalInput,
        server: ProposalInput,
        expected: NegotiatedInput,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct BoundCase {
        mode: String,
        negotiated: NegotiatedInput,
        inbound_message_bytes: u32,
        outstanding_requests: u16,
        expected: String,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ProposalInput {
        client_message_size: Option<u32>,
        server_message_size: Option<u32>,
        max_outstanding_requests: Option<u16>,
    }

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct NegotiatedInput {
        client_message_size: Option<u32>,
        server_message_size: Option<u32>,
        max_outstanding_requests: Option<u16>,
    }

    fn load_fixture() -> CapabilityFixture {
        load_json_fixture(&[
            "tests",
            "fixtures",
            "transport",
            "wsp_capability_bounds_mapped",
            "capability_fixture.json",
        ])
    }

    fn mode_from_str(value: &str) -> WspMode {
        match value {
            "connection-oriented" => WspMode::ConnectionOriented,
            "connectionless" => WspMode::Connectionless,
            other => panic!("unsupported mode: {other}"),
        }
    }

    fn proposal_from_input(input: ProposalInput) -> WspCapabilityProposal {
        WspCapabilityProposal {
            client_message_size: input.client_message_size,
            server_message_size: input.server_message_size,
            max_outstanding_requests: input.max_outstanding_requests,
        }
    }

    fn negotiated_from_input(mode: WspMode, input: NegotiatedInput) -> NegotiatedWspCapabilities {
        NegotiatedWspCapabilities {
            mode,
            client_message_size: input.client_message_size,
            server_message_size: input.server_message_size,
            max_outstanding_requests: input.max_outstanding_requests,
        }
    }

    #[test]
    fn wsp_capability_fixture_negotiation_uses_deterministic_min_merge() {
        let fixture = load_fixture();
        for case in fixture.negotiation_cases {
            let mode = mode_from_str(&case.mode);
            let result = negotiate_wsp_capabilities(
                mode,
                proposal_from_input(case.client),
                proposal_from_input(case.server),
            )
            .expect("negotiation case should succeed");
            assert_eq!(
                result,
                negotiated_from_input(mode, case.expected),
                "negotiation mismatch for mode {}",
                case.mode
            );
        }
    }

    #[test]
    fn wsp_capability_fixture_bound_checks_map_to_abort_reasons() {
        let fixture = load_fixture();
        for case in fixture.bound_cases {
            let mode = mode_from_str(&case.mode);
            let negotiated = negotiated_from_input(mode, case.negotiated);
            let result = enforce_wsp_capability_bounds(
                negotiated,
                case.inbound_message_bytes,
                case.outstanding_requests,
            );
            match case.expected.as_str() {
                "ok" => assert!(result.is_ok(), "expected ok for mode {}", case.mode),
                "MRUEXCEEDED" => match result {
                    Err(WspCapabilityBoundError::MruExceeded { abort_reason, .. }) => {
                        assert_eq!(abort_reason, "MRUEXCEEDED")
                    }
                    other => panic!("expected MRUEXCEEDED, got {:?}", other),
                },
                "MOREXCEEDED" => match result {
                    Err(WspCapabilityBoundError::MoreExceeded { abort_reason, .. }) => {
                        assert_eq!(abort_reason, "MOREXCEEDED")
                    }
                    other => panic!("expected MOREXCEEDED, got {:?}", other),
                },
                other => panic!("unsupported expected bound outcome: {other}"),
            }
        }
    }

    #[test]
    fn wsp_capability_invalid_zero_values_are_rejected_deterministically() {
        let error = negotiate_wsp_capabilities(
            WspMode::ConnectionOriented,
            WspCapabilityProposal {
                client_message_size: Some(0),
                server_message_size: Some(1024),
                max_outstanding_requests: Some(4),
            },
            WspCapabilityProposal {
                client_message_size: Some(1024),
                server_message_size: Some(1024),
                max_outstanding_requests: Some(4),
            },
        )
        .expect_err("zero proposal value should be rejected");

        assert_eq!(
            error,
            WspCapabilityNegotiationError::InvalidProposalValue {
                field: "clientMessageSize",
                side: "client",
                value: 0
            }
        );
    }
}
