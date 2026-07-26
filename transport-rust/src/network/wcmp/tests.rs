use super::*;
use crate::network::wdp::WdpError;
use serde::Deserialize;

const FIXTURE_SOURCE: &str =
    include_str!("../../../tests/fixtures/transport/wcmp_core_mapped/wcmp_fixture.json");

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WcmpFixture {
    source_document_id: String,
    source_sections: Vec<String>,
    capability_rows: Vec<String>,
    address_profile: FixtureAddressProfile,
    cases: Vec<FixtureCase>,
    malformed: Vec<MalformedCase>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureAddressProfile {
    address_type: u8,
    address: Vec<u8>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureCase {
    name: String,
    encoded: Vec<u8>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MalformedCase {
    name: String,
    encoded: Vec<u8>,
    error: String,
}

fn fixture() -> WcmpFixture {
    serde_json::from_str(FIXTURE_SOURCE).expect("WCMP fixture should parse")
}

fn fixture_case<'a>(fixture: &'a WcmpFixture, name: &str) -> &'a FixtureCase {
    fixture
        .cases
        .iter()
        .find(|case| case.name == name)
        .unwrap_or_else(|| panic!("missing WCMP fixture case {name}"))
}

fn fixture_address(fixture: &WcmpFixture) -> WcmpAddress {
    WcmpAddress::new(
        fixture.address_profile.address_type,
        fixture.address_profile.address.clone(),
    )
}

fn expected_message(fixture: &WcmpFixture, name: &str) -> WcmpMessage {
    let address = fixture_address(fixture);
    match name {
        "destination-port-unreachable" => WcmpMessage::DestinationUnreachable {
            code: WcmpDestinationUnreachableCode::PortUnreachable,
            destination_port: 9200,
            originator_port: 49_152,
            address,
        },
        "message-too-big-1024" => WcmpMessage::MessageTooBig {
            destination_port: 9200,
            originator_port: 49_152,
            address,
            maximum_message_size: 1024,
        },
        "echo-request" => WcmpMessage::EchoRequest {
            identifier: 0x1234,
            sequence_number: 2,
            data: vec![0xDE, 0xAD, 0xBE, 0xEF],
        },
        "echo-reply" => WcmpMessage::EchoReply {
            identifier: 0x1234,
            sequence_number: 2,
            data: vec![0xDE, 0xAD, 0xBE, 0xEF],
        },
        other => panic!("unknown WCMP fixture case {other}"),
    }
}

#[test]
fn source_derived_fixture_covers_non_ip_general_wcmp_capability_rows() {
    let fixture = fixture();
    assert_eq!(fixture.source_document_id, "WAP-202-WCMP");
    assert_eq!(
        fixture.source_sections,
        ["5.1", "5.2", "5.4", "5.5.1", "5.5.2", "5.5.3.1", "5.5.3.3", "5.5.3.5"]
    );
    assert_eq!(
        fixture.capability_rows,
        [
            "WCMP-C-001",
            "WCMP-SP-C-002",
            "WCMP-GEN-C-001",
            "WCMP-GEN-C-003",
            "WCMP-GEN-C-006"
        ]
    );
    assert_eq!(
        fixture.address_profile.address_type,
        WDP_ADDRESS_TYPE_CDPD_IPV4
    );
    assert_eq!(fixture.address_profile.address.len(), 4);
}

#[test]
fn selected_messages_preserve_exact_wap_1_2_1_bytes_and_roundtrip() {
    let fixture = fixture();
    for case in &fixture.cases {
        let expected = expected_message(&fixture, &case.name);
        let encoded =
            encode_wcmp(&expected, case.encoded.len()).expect("fixture message should encode");
        assert_eq!(encoded, case.encoded, "case '{}' encoded bytes", case.name);
        assert_eq!(
            decode_wcmp(&case.encoded).expect("fixture message should decode"),
            expected,
            "case '{}' decoded structure",
            case.name
        );
    }
}

#[test]
fn destination_and_size_reports_map_to_stable_wdp_errors() {
    let fixture = fixture();
    let port_case = fixture_case(&fixture, "destination-port-unreachable");
    let size_case = fixture_case(&fixture, "message-too-big-1024");
    let policy = WcmpHandlingPolicy {
        max_bearer_fragment_bytes: 64,
        permit_echo_reply: true,
    };

    let WcmpHandlingOutcome::ReportedError(port_error) =
        handle_wcmp(&port_case.encoded, policy).expect("destination report should decode")
    else {
        panic!("destination report should map to an error");
    };
    assert_eq!(
        port_error.to_wdp_error(),
        WdpError::DestinationPortUnsupported(9200)
    );

    let WcmpHandlingOutcome::ReportedError(size_error) =
        handle_wcmp(&size_case.encoded, policy).expect("size report should decode")
    else {
        panic!("size report should map to an error");
    };
    assert_eq!(
        size_error.to_wdp_error(),
        WdpError::PeerMessageTooBig { max: 1024 }
    );
}

#[test]
fn echo_request_generates_exact_reply_and_preserves_correlation() {
    let fixture = fixture();
    let request = fixture_case(&fixture, "echo-request");
    let expected_reply = fixture_case(&fixture, "echo-reply");
    let outcome = handle_wcmp(
        &request.encoded,
        WcmpHandlingPolicy {
            max_bearer_fragment_bytes: request.encoded.len(),
            permit_echo_reply: true,
        },
    )
    .expect("echo request should be handled");
    let WcmpHandlingOutcome::EchoReplyGenerated {
        message,
        packet,
        data_truncated,
    } = outcome
    else {
        panic!("echo request should generate a reply");
    };
    assert_eq!(message, expected_message(&fixture, "echo-reply"));
    assert_eq!(packet, expected_reply.encoded);
    assert!(!data_truncated);
}

#[test]
fn echo_reply_truncates_only_data_to_return_path_fragment_size() {
    let fixture = fixture();
    let request = fixture_case(&fixture, "echo-request");
    let outcome = handle_wcmp(
        &request.encoded,
        WcmpHandlingPolicy {
            max_bearer_fragment_bytes: 8,
            permit_echo_reply: true,
        },
    )
    .expect("bounded echo request should be handled");
    let WcmpHandlingOutcome::EchoReplyGenerated {
        message,
        packet,
        data_truncated,
    } = outcome
    else {
        panic!("echo request should generate a reply");
    };
    assert_eq!(
        message,
        WcmpMessage::EchoReply {
            identifier: 0x1234,
            sequence_number: 2,
            data: vec![0xDE, 0xAD],
        }
    );
    assert_eq!(packet, vec![179, 0, 0x12, 0x34, 0, 2, 0xDE, 0xAD]);
    assert!(data_truncated);
}

#[test]
fn incoming_echo_reply_is_reported_not_re_replied() {
    let fixture = fixture();
    let reply = fixture_case(&fixture, "echo-reply");
    let outcome = handle_wcmp(
        &reply.encoded,
        WcmpHandlingPolicy {
            max_bearer_fragment_bytes: 64,
            permit_echo_reply: true,
        },
    )
    .expect("echo reply should decode");

    let WcmpMessage::EchoReply {
        identifier,
        sequence_number,
        data,
    } = expected_message(&fixture, "echo-reply")
    else {
        panic!("fixture echo-reply case should decode to an EchoReply message");
    };
    assert_eq!(
        outcome,
        WcmpHandlingOutcome::EchoReplyReceived {
            identifier,
            sequence_number,
            data,
        }
    );
}

#[test]
fn wcmp_handling_error_display_wraps_decode_and_encode_causes() {
    assert!(WcmpHandlingError::from(WcmpDecodeError::LengthOverflow)
        .to_string()
        .contains("WCMP decode failed"));
    assert!(WcmpHandlingError::from(WcmpEncodeError::LengthOverflow)
        .to_string()
        .contains("WCMP reply generation failed"));
}

#[test]
fn echo_reply_rate_limit_is_explicit_and_deterministic() {
    let fixture = fixture();
    let request = fixture_case(&fixture, "echo-request");
    assert_eq!(
        handle_wcmp(
            &request.encoded,
            WcmpHandlingPolicy {
                max_bearer_fragment_bytes: 64,
                permit_echo_reply: false,
            }
        )
        .expect("rate-limited echo should be a defined outcome"),
        WcmpHandlingOutcome::EchoReplySuppressed(WcmpSuppressionReason::EchoReplyRateLimited)
    );
}

fn generation_request(failure: WcmpGenerationFailure) -> WcmpErrorGenerationRequest {
    WcmpErrorGenerationRequest {
        failure,
        original: WcmpOriginalDatagram {
            destination_port: 9200,
            originator_port: 49_152,
            destination_address: WcmpAddress::cdpd_ipv4([192, 0, 2, 7]),
        },
        max_bearer_fragment_bytes: 64,
        trigger_is_wcmp_error: false,
        fragmented_datagram_error_already_sent: false,
    }
}

#[test]
fn generation_maps_port_and_buffer_failures_to_selected_messages() {
    let fixture = fixture();
    let port = generate_wcmp_error(&generation_request(WcmpGenerationFailure::PortUnreachable))
        .expect("port failure should generate WCMP");
    let size = generate_wcmp_error(&generation_request(
        WcmpGenerationFailure::FirstSegmentExceedsReassemblyBuffer {
            maximum_message_size: 1024,
        },
    ))
    .expect("buffer failure should generate WCMP");

    assert_eq!(
        port,
        WcmpGenerationOutcome::Generated {
            message: expected_message(&fixture, "destination-port-unreachable"),
            packet: fixture_case(&fixture, "destination-port-unreachable")
                .encoded
                .clone(),
        }
    );
    assert_eq!(
        size,
        WcmpGenerationOutcome::Generated {
            message: expected_message(&fixture, "message-too-big-1024"),
            packet: fixture_case(&fixture, "message-too-big-1024")
                .encoded
                .clone(),
        }
    );
}

#[test]
fn reported_destination_unreachable_maps_remaining_codes_to_wdp_errors() {
    let fixture = fixture();
    let address = fixture_address(&fixture);
    let reported = |code| WcmpReportedError::DestinationUnreachable {
        code,
        destination_port: 9200,
        originator_port: 49_152,
        address: address.clone(),
    };

    assert_eq!(
        reported(WcmpDestinationUnreachableCode::NoRouteToDestination).to_wdp_error(),
        WdpError::NoRouteToDestination
    );
    assert_eq!(
        reported(WcmpDestinationUnreachableCode::CommunicationAdministrativelyProhibited)
            .to_wdp_error(),
        WdpError::CommunicationAdministrativelyProhibited
    );
    assert_eq!(
        reported(WcmpDestinationUnreachableCode::AddressUnreachable).to_wdp_error(),
        WdpError::AddressUnreachable
    );
}

#[test]
fn generation_maps_remaining_destination_unreachable_failures() {
    let cases = [
        (
            WcmpGenerationFailure::NoRouteToDestination,
            WcmpDestinationUnreachableCode::NoRouteToDestination,
        ),
        (
            WcmpGenerationFailure::CommunicationAdministrativelyProhibited,
            WcmpDestinationUnreachableCode::CommunicationAdministrativelyProhibited,
        ),
        (
            WcmpGenerationFailure::AddressUnreachable,
            WcmpDestinationUnreachableCode::AddressUnreachable,
        ),
    ];

    for (failure, expected_code) in cases {
        let outcome = generate_wcmp_error(&generation_request(failure))
            .expect("destination-unreachable failure should generate WCMP");
        match outcome {
            WcmpGenerationOutcome::Generated { message, .. } => match message {
                WcmpMessage::DestinationUnreachable { code, .. } => {
                    assert_eq!(code, expected_code);
                }
                other => panic!("expected DestinationUnreachable, got {other:?}"),
            },
            other => panic!("expected Generated outcome, got {other:?}"),
        }
    }
}

#[test]
fn generation_suppresses_prohibited_error_responses() {
    let mut request = generation_request(WcmpGenerationFailure::PortUnreachable);
    request.trigger_is_wcmp_error = true;
    assert_eq!(
        generate_wcmp_error(&request).expect("suppression should not fail"),
        WcmpGenerationOutcome::Suppressed(WcmpSuppressionReason::ErrorInResponseToWcmpError)
    );

    request.trigger_is_wcmp_error = false;
    request.fragmented_datagram_error_already_sent = true;
    assert_eq!(
        generate_wcmp_error(&request).expect("suppression should not fail"),
        WcmpGenerationOutcome::Suppressed(WcmpSuppressionReason::FragmentErrorAlreadySent)
    );

    request.fragmented_datagram_error_already_sent = false;
    request.failure = WcmpGenerationFailure::Congestion;
    assert_eq!(
        generate_wcmp_error(&request).expect("suppression should not fail"),
        WcmpGenerationOutcome::Suppressed(WcmpSuppressionReason::Congestion)
    );
}

#[test]
fn constrained_fragment_and_address_limits_reject_without_truncation() {
    let fixture = fixture();
    let message = expected_message(&fixture, "destination-port-unreachable");
    assert_eq!(
        encode_wcmp(&message, 11),
        Err(WcmpEncodeError::MessageTooLarge {
            actual: 12,
            max: 11
        })
    );
    let address = WcmpAddress::new(0x03, vec![0xAA; 256]);
    let oversized_address = WcmpMessage::DestinationUnreachable {
        code: WcmpDestinationUnreachableCode::PortUnreachable,
        destination_port: 9200,
        originator_port: 49_152,
        address,
    };
    assert_eq!(
        encode_wcmp(&oversized_address, 1024),
        Err(WcmpEncodeError::AddressTooLong {
            actual: 256,
            max: 255
        })
    );
}

#[test]
fn malformed_fixture_outcomes_are_stable() {
    let fixture = fixture();
    for case in fixture.malformed {
        let error = decode_wcmp(&case.encoded)
            .expect_err("malformed fixture should fail")
            .to_string();
        assert_eq!(error, case.error, "case '{}' error mapping", case.name);
    }
}

#[test]
fn all_type_octets_have_a_deterministic_classification() {
    for message_type in 0u8..=u8::MAX {
        let expected = match message_type {
            0..=127 => WcmpTypeClass::Error,
            128..=191 => WcmpTypeClass::Informational,
            192..=255 => WcmpTypeClass::Reserved,
        };
        assert_eq!(WcmpTypeClass::from_message_type(message_type), expected);
    }
}
