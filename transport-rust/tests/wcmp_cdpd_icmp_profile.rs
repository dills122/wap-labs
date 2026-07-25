use lowband_transport_rust::network::wcmp::{
    decode_wdp_control_message, encode_wdp_control_message, generate_icmpv4_error,
    handle_wdp_control_message, Icmpv4DecodeError, Icmpv4DestinationUnreachableCode,
    Icmpv4HandlingOutcome, Icmpv4Message, Icmpv4ReportedError, WcmpMessage, WdpControlEncodeError,
    WdpControlHandlingOutcome, WdpControlHandlingPolicy, WdpControlMessage, WdpControlProfile,
};
use lowband_transport_rust::network::wdp::WdpError;
use serde::Deserialize;

const FIXTURE_SOURCE: &str =
    include_str!("fixtures/transport/wcmp_cdpd_icmp_profile/icmp_fixture.json");

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IcmpFixture {
    source_documents: Vec<SourceDocument>,
    selected_rows: Vec<String>,
    clause_ids: Vec<String>,
    quoted_datagrams: QuotedDatagrams,
    cases: Vec<FixtureCase>,
}

#[derive(Debug, Deserialize)]
struct SourceDocument {
    id: String,
    sections: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct QuotedDatagrams {
    udp: Vec<u8>,
    udp_df: Vec<u8>,
}

#[derive(Debug, Deserialize)]
struct FixtureCase {
    name: String,
    encoded: Vec<u8>,
}

fn fixture() -> IcmpFixture {
    serde_json::from_str(FIXTURE_SOURCE).expect("ICMP fixture should parse")
}

fn fixture_case<'a>(fixture: &'a IcmpFixture, name: &str) -> &'a [u8] {
    &fixture
        .cases
        .iter()
        .find(|case| case.name == name)
        .unwrap_or_else(|| panic!("missing ICMP fixture case {name}"))
        .encoded
}

fn strict_policy() -> WdpControlHandlingPolicy {
    WdpControlHandlingPolicy {
        permit_echo_reply: true,
        max_non_ip_bearer_fragment_bytes: 64,
    }
}

#[test]
fn focused_fixture_is_bound_to_the_selected_ip_profile() {
    let fixture = fixture();
    assert_eq!(fixture.selected_rows, ["WCMP-C-001", "WCMP-SP-C-001"]);
    assert_eq!(fixture.clause_ids.len(), 9);
    assert!(fixture
        .source_documents
        .iter()
        .any(|source| { source.id == "WAP-202-WCMP" && source.sections == ["5.3"] }));
    assert!(fixture.source_documents.iter().any(|source| {
        source.id == "rfc-792"
            && source
                .sections
                .contains(&"Destination Unreachable Message".to_string())
            && source
                .sections
                .contains(&"Echo or Echo Reply Message".to_string())
    }));
}

#[test]
fn destination_port_unreachable_maps_at_the_wdp_boundary() {
    let fixture = fixture();
    let packet = fixture_case(&fixture, "destination-port-unreachable");
    let outcome =
        handle_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, packet, strict_policy())
            .expect("strict ICMP port report should be handled");
    assert_eq!(
        outcome,
        WdpControlHandlingOutcome::Icmpv4(Icmpv4HandlingOutcome::ReportedError(
            Icmpv4ReportedError::PortUnreachable {
                destination_port: 9200,
            },
        ))
    );
    let WdpControlHandlingOutcome::Icmpv4(Icmpv4HandlingOutcome::ReportedError(error)) = outcome
    else {
        panic!("port report should be surfaced as a WDP error");
    };
    assert_eq!(
        error.to_wdp_error(),
        WdpError::DestinationPortUnsupported(9200)
    );

    let generated = generate_icmpv4_error(
        &WdpError::DestinationPortUnsupported(9200),
        fixture.quoted_datagrams.udp.clone(),
    )
    .expect("WDP port error should generate ICMPv4");
    assert_eq!(generated.packet, packet);
}

#[test]
fn fragmentation_needed_preserves_df_and_next_hop_mtu() {
    let fixture = fixture();
    let packet = fixture_case(&fixture, "fragmentation-needed-mtu-576");
    let outcome =
        handle_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, packet, strict_policy())
            .expect("strict ICMP fragmentation report should be handled");
    let WdpControlHandlingOutcome::Icmpv4(Icmpv4HandlingOutcome::ReportedError(error)) = outcome
    else {
        panic!("fragmentation report should be surfaced as a WDP error");
    };
    assert_eq!(
        error.to_wdp_error(),
        WdpError::Ipv4FragmentationNeeded {
            actual: 33,
            next_hop_mtu: Some(576),
        }
    );

    let generated = generate_icmpv4_error(
        &WdpError::Ipv4DontFragmentMtuExceeded {
            actual: 33,
            mtu: 576,
        },
        fixture.quoted_datagrams.udp_df.clone(),
    )
    .expect("WDP DF/MTU error should generate ICMPv4");
    assert_eq!(generated.packet, packet);
}

#[test]
fn echo_request_and_reply_are_byte_exact_and_correlated() {
    let fixture = fixture();
    let request = fixture_case(&fixture, "echo-request");
    let expected_reply = fixture_case(&fixture, "echo-reply");
    let outcome =
        handle_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, request, strict_policy())
            .expect("strict ICMP echo request should be handled");
    let WdpControlHandlingOutcome::Icmpv4(Icmpv4HandlingOutcome::EchoReplyGenerated {
        message,
        packet,
    }) = outcome
    else {
        panic!("echo request should generate an ICMPv4 reply");
    };
    assert_eq!(
        message,
        Icmpv4Message::EchoReply {
            identifier: 0x1234,
            sequence_number: 2,
            data: vec![0xDE, 0xAD, 0xBE, 0xEF],
        }
    );
    assert_eq!(packet, expected_reply);
    assert!(matches!(
        handle_wdp_control_message(
            WdpControlProfile::CdpdIpv4Strict,
            expected_reply,
            strict_policy(),
        ),
        Ok(WdpControlHandlingOutcome::Icmpv4(
            Icmpv4HandlingOutcome::EchoReplyReceived {
                identifier: 0x1234,
                sequence_number: 2,
                ..
            }
        ))
    ));
}

#[test]
fn general_wcmp_is_available_only_with_the_explicit_non_ip_profile() {
    let general_echo = WdpControlMessage::GeneralWcmp(WcmpMessage::EchoRequest {
        identifier: 0x1234,
        sequence_number: 2,
        data: vec![0xDE, 0xAD, 0xBE, 0xEF],
    });
    assert!(matches!(
        encode_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, &general_echo, 64),
        Err(WdpControlEncodeError::ProfileMismatch {
            profile: WdpControlProfile::CdpdIpv4Strict,
            message_family: "general WCMP",
        })
    ));
    let encoded =
        encode_wdp_control_message(WdpControlProfile::GeneralWcmpNonIp, &general_echo, 64)
            .expect("explicit non-IP profile should retain the general-WCMP capability");
    assert_eq!(encoded, [178, 0, 18, 52, 0, 2, 222, 173, 190, 239]);
    assert_eq!(
        decode_wdp_control_message(WdpControlProfile::GeneralWcmpNonIp, &encoded)
            .expect("general-WCMP capability should decode only under the non-IP profile"),
        general_echo
    );
    assert!(decode_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, &encoded).is_err());
}

#[test]
fn malformed_icmp_packets_fail_deterministically() {
    let fixture = fixture();
    let mut invalid_checksum = fixture_case(&fixture, "echo-request").to_vec();
    invalid_checksum[11] ^= 1;
    assert!(matches!(
        decode_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, &invalid_checksum),
        Err(
            lowband_transport_rust::network::wcmp::WdpControlDecodeError::Icmpv4(
                Icmpv4DecodeError::InvalidChecksum
            )
        )
    ));

    let fragment = fixture_case(&fixture, "fragmentation-needed-mtu-576");
    let decoded = decode_wdp_control_message(WdpControlProfile::CdpdIpv4Strict, fragment)
        .expect("fixture fragmentation packet should decode");
    assert!(matches!(
        decoded,
        WdpControlMessage::Icmpv4(Icmpv4Message::DestinationUnreachable {
            code: Icmpv4DestinationUnreachableCode::FragmentationNeededAndDfSet,
            next_hop_mtu: Some(576),
            ..
        })
    ));
}
