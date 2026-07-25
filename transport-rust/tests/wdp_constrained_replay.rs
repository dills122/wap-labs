use lowband_transport_rust::network::wdp::{
    classify_sar_packet, decode_cdpd_ipv4_udp, CdpdIpv4Profile, Ipv4Reassembler,
    Ipv4ReassemblyOutcome, Ipv4ReassemblyPolicy, WdpSarDecision, WdpSarPolicy,
    WDP_IPV4_BASELINE_DATAGRAM_BYTES, WDP_IPV4_MAX_DATAGRAM_BYTES,
};
use serde::Deserialize;

const FIXTURE_SOURCE: &str =
    include_str!("fixtures/transport/wdp_constrained_payload_mapped/reassembly_fixture.json");
const CLAUSE_LEDGER_SOURCE: &str = include_str!(
    "../../spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Fixture {
    source_documents: Vec<SourceDocument>,
    clause_ids: Vec<String>,
    profile: Profile,
    complete_packet: Vec<u8>,
    expected_user_data: Vec<u8>,
    replay_cases: Vec<ReplayCase>,
}

#[derive(Debug, Deserialize)]
struct SourceDocument {
    id: String,
    sections: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Profile {
    bearer: String,
    ipv4_baseline_datagram_bytes: usize,
    ipv4_protocol_maximum_datagram_bytes: usize,
    udp_maximum_payload_bytes: usize,
    wdp_segmentation_header_present: bool,
    oversize_policy: String,
    truncation_policy: String,
    reassembly_owner: String,
    max_pending_datagrams: usize,
    max_buffered_payload_bytes: usize,
    timeout_ticks: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayCase {
    name: String,
    steps: Vec<ReplayStep>,
    expire_before_tick: Option<u64>,
    expire_at_tick: Option<u64>,
    expected_expired_buffered_bytes: Option<usize>,
    expected_pending_after_error: Option<usize>,
}

#[derive(Debug, Deserialize)]
struct ReplayStep {
    tick: u64,
    packet: Vec<u8>,
    expected: String,
    duplicate: Option<bool>,
    error: Option<String>,
}

fn fixture() -> Fixture {
    serde_json::from_str(FIXTURE_SOURCE).expect("TRN-702 fixture should parse")
}

fn policy(profile: &Profile) -> Ipv4ReassemblyPolicy {
    Ipv4ReassemblyPolicy {
        max_datagram_bytes: profile.ipv4_baseline_datagram_bytes,
        max_pending_datagrams: profile.max_pending_datagrams,
        max_buffered_payload_bytes: profile.max_buffered_payload_bytes,
        timeout_ticks: profile.timeout_ticks,
    }
}

#[test]
fn trn_702_fixture_maps_only_the_adopted_authoritative_clause_subset() {
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

    let ledger: serde_json::Value =
        serde_json::from_str(CLAUSE_LEDGER_SOURCE).expect("clause ledger should parse");
    let adopted = ledger["families"]
        .as_array()
        .expect("families should be an array")
        .iter()
        .find(|family| family["family"] == "wdp")
        .expect("WDP family should exist")["clauses"]
        .as_array()
        .expect("WDP clauses should be an array")
        .iter()
        .filter(|clause| {
            clause["mapping"]["workItems"]
                .as_array()
                .is_some_and(|items| items.iter().any(|item| item == "TRN-702"))
        })
        .map(|clause| {
            clause["id"]
                .as_str()
                .expect("adopted clause should have an ID")
                .to_string()
        })
        .collect::<Vec<_>>();
    assert_eq!(fixture.clause_ids, adopted);
}

#[test]
fn selected_cdpd_profile_exposes_bounded_ip_reassembly_without_wdp_sar() {
    let fixture = fixture();
    let profile = fixture.profile;
    assert_eq!(profile.bearer, "AMPS/CDPD/IPv4");
    assert_eq!(
        profile.ipv4_baseline_datagram_bytes,
        WDP_IPV4_BASELINE_DATAGRAM_BYTES
    );
    assert_eq!(
        profile.ipv4_protocol_maximum_datagram_bytes,
        WDP_IPV4_MAX_DATAGRAM_BYTES
    );
    assert_eq!(profile.udp_maximum_payload_bytes, 65_507);
    assert_eq!(
        profile.wdp_segmentation_header_present,
        CdpdIpv4Profile::WDP_SEGMENTATION_HEADER_PRESENT
    );
    assert!(!profile.wdp_segmentation_header_present);
    assert_eq!(profile.oversize_policy, "reject");
    assert_eq!(profile.truncation_policy, "never-truncate-wdp-unitdata");
    assert_eq!(profile.reassembly_owner, "destination-ip-module-below-wdp");

    let (decision, trace) = classify_sar_packet(&WdpSarPolicy::Disabled, 65_508);
    assert_eq!(decision, WdpSarDecision::OversizeRejected);
    assert_eq!(trace.policy, WdpSarPolicy::Disabled);
}

#[test]
fn source_derived_fragment_replays_are_deterministic() {
    let fixture = fixture();
    for case in &fixture.replay_cases {
        let mut reassembler =
            Ipv4Reassembler::new(policy(&fixture.profile)).expect("fixture policy should be valid");
        for step in &case.steps {
            match step.expected.as_str() {
                "pending" => {
                    let pending = match reassembler
                        .ingest(&step.packet, step.tick)
                        .unwrap_or_else(|error| panic!("case '{}' failed: {error}", case.name))
                    {
                        Ipv4ReassemblyOutcome::Pending(pending) => pending,
                        Ipv4ReassemblyOutcome::Complete(_) => {
                            panic!("case '{}' completed early", case.name)
                        }
                    };
                    assert_eq!(
                        pending.duplicate,
                        step.duplicate.unwrap_or(false),
                        "case '{}' duplicate classification",
                        case.name
                    );
                }
                "complete" => {
                    let packet = match reassembler
                        .ingest(&step.packet, step.tick)
                        .unwrap_or_else(|error| panic!("case '{}' failed: {error}", case.name))
                    {
                        Ipv4ReassemblyOutcome::Complete(packet) => packet,
                        Ipv4ReassemblyOutcome::Pending(_) => {
                            panic!("case '{}' remained incomplete", case.name)
                        }
                    };
                    assert_eq!(packet, fixture.complete_packet, "case '{}'", case.name);
                    assert_eq!(
                        decode_cdpd_ipv4_udp(&packet)
                            .expect("complete reassembly should decode")
                            .payload,
                        fixture.expected_user_data,
                        "case '{}'",
                        case.name
                    );
                }
                "error" => {
                    let error = reassembler
                        .ingest(&step.packet, step.tick)
                        .expect_err("fixture expected a deterministic rejection");
                    assert_eq!(
                        error.to_string(),
                        step.error.as_deref().expect("error text should be present"),
                        "case '{}'",
                        case.name
                    );
                }
                other => panic!("case '{}' has unknown outcome '{other}'", case.name),
            }
        }

        if let Some(before_tick) = case.expire_before_tick {
            assert!(
                reassembler.expire(before_tick).is_empty(),
                "case '{}' expired early",
                case.name
            );
        }
        if let Some(expire_tick) = case.expire_at_tick {
            let expired = reassembler.expire(expire_tick);
            assert_eq!(expired.len(), 1, "case '{}' expiration count", case.name);
            assert_eq!(
                expired[0].buffered_payload_bytes,
                case.expected_expired_buffered_bytes
                    .expect("expiration fixture should declare buffered bytes"),
                "case '{}'",
                case.name
            );
            assert_eq!(expired[0].expected_payload_bytes, None);
        }
        if let Some(expected) = case.expected_pending_after_error {
            assert_eq!(
                reassembler.pending_datagrams(),
                expected,
                "case '{}' pending state after rejection",
                case.name
            );
            assert_eq!(
                reassembler.buffered_payload_bytes(),
                0,
                "case '{}' buffered state after rejection",
                case.name
            );
        }
    }
}
