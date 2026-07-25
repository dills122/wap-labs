use super::*;
use serde::Deserialize;

const FIXTURE_SOURCE: &str =
    include_str!("../../../tests/fixtures/transport/wdp_cdpd_ipv4_mapped/wdp_fixture.json");
const WDP_LEDGER_SOURCE: &str =
    include_str!("../../../../spec-processing/source-manifests/wap-1.2.1-wdp-scr.json");
const CLAUSE_LEDGER_SOURCE: &str = include_str!(
    "../../../../spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WdpFixture {
    source_documents: Vec<SourceDocument>,
    selected_rows: Vec<String>,
    clause_ids: Vec<String>,
    profile: FixtureProfile,
    registered_ports: Vec<RegisteredPort>,
    datagram: FixtureDatagram,
    send_policy: FixtureSendPolicy,
    cases: Vec<FixtureCase>,
    malformed: Vec<MalformedCase>,
}

#[derive(Debug, Deserialize)]
struct SourceDocument {
    id: String,
    sections: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureProfile {
    bearer_type: u8,
    address_octets: usize,
    ip_protocol: u8,
    selected_wsp_port: u16,
    ipv4_baseline_datagram_bytes: usize,
    wdp_segmentation_header_present: bool,
}

#[derive(Debug, Deserialize)]
struct RegisteredPort {
    port: u16,
    service: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureDatagram {
    source_address: [u8; 4],
    source_port: u16,
    destination_address: [u8; 4],
    destination_port: u16,
    user_data: Vec<u8>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureSendPolicy {
    identification: u16,
    time_to_live: u8,
    dont_fragment: bool,
    destination_accepts_large_datagrams: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureCase {
    name: String,
    udp_checksum: String,
    encoded: Vec<u8>,
}

#[derive(Debug, Deserialize)]
struct MalformedCase {
    name: String,
    encoded: Vec<u8>,
    error: String,
}

fn fixture() -> WdpFixture {
    serde_json::from_str(FIXTURE_SOURCE).expect("WDP fixture should parse")
}

fn fixture_datagram(fixture: &WdpFixture) -> WdpDatagram {
    WdpDatagram {
        src_addr: WdpAddress::ipv4(fixture.datagram.source_address),
        dst_addr: WdpAddress::ipv4(fixture.datagram.destination_address),
        src_port: fixture.datagram.source_port,
        dst_port: fixture.datagram.destination_port,
        payload: fixture.datagram.user_data.clone(),
    }
}

fn fixture_policy(fixture: &WdpFixture, checksum: UdpChecksumPolicy) -> CdpdIpv4SendPolicy {
    CdpdIpv4SendPolicy {
        identification: fixture.send_policy.identification,
        time_to_live: fixture.send_policy.time_to_live,
        dont_fragment: fixture.send_policy.dont_fragment,
        path_mtu: None,
        destination_accepts_large_datagrams: fixture
            .send_policy
            .destination_accepts_large_datagrams,
        udp_checksum: checksum,
    }
}

#[test]
fn source_derived_fixture_covers_selected_class_c_rows_and_clauses() {
    let fixture = fixture();
    assert_eq!(
        fixture
            .source_documents
            .iter()
            .map(|source| source.id.as_str())
            .collect::<Vec<_>>(),
        ["WAP-200-WDP", "rfc-768", "rfc-791"]
    );
    assert!(fixture
        .source_documents
        .iter()
        .all(|source| !source.sections.is_empty()));
    let wdp_ledger: serde_json::Value =
        serde_json::from_str(WDP_LEDGER_SOURCE).expect("WDP ledger should parse");
    let selected_rows = wdp_ledger["obligations"]
        .as_array()
        .expect("WDP obligations should be an array")
        .iter()
        .filter(|row| {
            row["disposition"]["classCProfile"] == "required-by-selected-class-c-transport-path"
        })
        .map(|row| {
            row["id"]
                .as_str()
                .expect("selected WDP row should have an ID")
                .to_string()
        })
        .collect::<Vec<_>>();
    assert_eq!(fixture.selected_rows, selected_rows);

    let clause_ledger: serde_json::Value =
        serde_json::from_str(CLAUSE_LEDGER_SOURCE).expect("clause ledger should parse");
    let clause_ids = clause_ledger["families"]
        .as_array()
        .expect("clause families should be an array")
        .iter()
        .find(|family| family["family"] == "wdp")
        .expect("clause ledger should contain WDP")
        .get("clauses")
        .and_then(serde_json::Value::as_array)
        .expect("WDP clauses should be an array")
        .iter()
        .map(|clause| {
            clause["id"]
                .as_str()
                .expect("WDP clause should have an ID")
                .to_string()
        })
        .collect::<Vec<_>>();
    assert_eq!(fixture.clause_ids, clause_ids);
    assert_eq!(fixture.clause_ids.len(), 49);
}

#[test]
fn registered_port_and_bearer_profile_are_exact() {
    let fixture = fixture();
    assert_eq!(fixture.profile.bearer_type, WDP_CDPD_IPV4_BEARER_TYPE);
    assert_eq!(
        fixture.profile.address_octets,
        CdpdIpv4Profile::ADDRESS_OCTETS
    );
    assert_eq!(fixture.profile.ip_protocol, WDP_UDP_IPV4_PROTOCOL_NUMBER);
    assert_eq!(
        fixture.profile.selected_wsp_port,
        CdpdIpv4Profile::SELECTED_CONNECTIONLESS_WSP_PORT
    );
    assert_eq!(
        fixture.profile.ipv4_baseline_datagram_bytes,
        WDP_IPV4_BASELINE_DATAGRAM_BYTES
    );
    assert_eq!(
        fixture.profile.wdp_segmentation_header_present,
        CdpdIpv4Profile::WDP_SEGMENTATION_HEADER_PRESENT
    );
    assert!(!fixture.profile.wdp_segmentation_header_present);

    let fixture_ports = fixture
        .registered_ports
        .iter()
        .map(|entry| entry.port)
        .collect::<Vec<_>>();
    assert_eq!(fixture_ports, WdpServicePort::ALL);
    assert!(fixture
        .registered_ports
        .iter()
        .all(|entry| !entry.service.is_empty() && WdpServicePort::is_known(entry.port)));
}

#[test]
fn td_unitdata_request_and_indication_preserve_address_port_and_payload_semantics() {
    let fixture = fixture();
    let datagram = fixture_datagram(&fixture);
    let request = TDUnitdataRequest {
        source_address: datagram.src_addr.clone(),
        source_port: datagram.src_port,
        destination_address: datagram.dst_addr.clone(),
        destination_port: datagram.dst_port,
        user_data: datagram.payload.clone(),
    };
    assert_eq!(request.into_datagram(), datagram);

    let indication = TDUnitdataIndication::from(datagram.clone());
    assert_eq!(indication.source_address, datagram.src_addr);
    assert_eq!(indication.source_port, datagram.src_port);
    assert_eq!(indication.destination_address, Some(datagram.dst_addr));
    assert_eq!(indication.destination_port, Some(datagram.dst_port));
    assert_eq!(indication.user_data, datagram.payload);
}

#[test]
fn simultaneous_connectionless_instances_are_multiplexed_by_port_fields() {
    let fixture = fixture();
    let first = fixture_datagram(&fixture);
    let mut second = first.clone();
    second.src_port += 1;
    second.dst_port = WdpServicePort::VCardDatagram as u16;

    let first_packet = encode_cdpd_ipv4_udp(
        &first,
        fixture_policy(&fixture, UdpChecksumPolicy::Generate),
    )
    .expect("first communication instance should encode");
    let second_packet = encode_cdpd_ipv4_udp(
        &second,
        fixture_policy(&fixture, UdpChecksumPolicy::Generate),
    )
    .expect("second communication instance should encode");
    assert_ne!(&first_packet[20..24], &second_packet[20..24]);
    assert_eq!(
        decode_cdpd_ipv4_udp(&first_packet).expect("first instance should decode"),
        first
    );
    assert_eq!(
        decode_cdpd_ipv4_udp(&second_packet).expect("second instance should decode"),
        second
    );
}

#[test]
fn selected_cdpd_ipv4_profile_preserves_exact_udp_ipv4_bytes() {
    let fixture = fixture();
    let datagram = fixture_datagram(&fixture);
    for case in &fixture.cases {
        let checksum = match case.udp_checksum.as_str() {
            "generate" => UdpChecksumPolicy::Generate,
            "omit" => UdpChecksumPolicy::Omit,
            other => panic!("unknown fixture checksum policy {other}"),
        };
        let encoded = encode_cdpd_ipv4_udp(&datagram, fixture_policy(&fixture, checksum))
            .expect("fixture datagram should encode");
        assert_eq!(encoded, case.encoded, "case '{}' encoded bytes", case.name);
        assert_eq!(
            decode_cdpd_ipv4_udp(&case.encoded).expect("fixture datagram should decode"),
            datagram,
            "case '{}' decoded primitive",
            case.name
        );
    }
}

#[test]
fn udp_source_port_zero_and_computed_zero_checksum_follow_rfc_768_encoding() {
    let fixture = fixture();
    let mut datagram = fixture_datagram(&fixture);
    datagram.src_port = 0;
    let encoded = encode_cdpd_ipv4_udp(
        &datagram,
        fixture_policy(&fixture, UdpChecksumPolicy::Generate),
    )
    .expect("zero source port should encode");
    assert_eq!(&encoded[20..22], &[0, 0]);
    assert_eq!(
        decode_cdpd_ipv4_udp(&encoded)
            .expect("zero source port should decode")
            .src_port,
        0
    );

    datagram.src_port = fixture.datagram.source_port;
    datagram.payload = vec![0x97, 0xD7];
    let encoded = encode_cdpd_ipv4_udp(
        &datagram,
        fixture_policy(&fixture, UdpChecksumPolicy::Generate),
    )
    .expect("computed zero checksum fixture should encode");
    assert_eq!(&encoded[26..28], &[0xFF, 0xFF]);
    assert_eq!(
        decode_cdpd_ipv4_udp(&encoded)
            .expect("all-one checksum encoding should decode")
            .payload,
        datagram.payload
    );
}

#[test]
fn malformed_ipv4_udp_fixture_outcomes_are_stable() {
    let fixture = fixture();
    for case in fixture.malformed {
        let error = decode_cdpd_ipv4_udp(&case.encoded)
            .expect_err("malformed fixture should fail")
            .to_string();
        assert_eq!(error, case.error, "case '{}' error mapping", case.name);
    }
}

#[test]
fn large_datagram_and_df_policies_are_deterministic() {
    let fixture = fixture();
    let mut datagram = fixture_datagram(&fixture);
    datagram.payload = vec![0xA5; 549];
    let error = encode_cdpd_ipv4_udp(
        &datagram,
        CdpdIpv4SendPolicy {
            destination_accepts_large_datagrams: false,
            ..fixture_policy(&fixture, UdpChecksumPolicy::Generate)
        },
    )
    .expect_err("datagram above 576 octets needs destination assurance");
    assert_eq!(
        error,
        WdpError::Ipv4LargeDatagramUnassured {
            actual: 577,
            baseline: 576
        }
    );

    let error = encode_cdpd_ipv4_udp(
        &datagram,
        CdpdIpv4SendPolicy {
            dont_fragment: true,
            path_mtu: Some(576),
            destination_accepts_large_datagrams: true,
            ..fixture_policy(&fixture, UdpChecksumPolicy::Generate)
        },
    )
    .expect_err("DF datagram above the path MTU should be discarded");
    assert_eq!(
        error,
        WdpError::Ipv4DontFragmentMtuExceeded {
            actual: 577,
            mtu: 576
        }
    );

    datagram.payload.pop();
    assert_eq!(
        encode_cdpd_ipv4_udp(
            &datagram,
            CdpdIpv4SendPolicy {
                destination_accepts_large_datagrams: false,
                ..fixture_policy(&fixture, UdpChecksumPolicy::Generate)
            }
        )
        .expect("576-octet baseline datagram should encode")
        .len(),
        576
    );
}
