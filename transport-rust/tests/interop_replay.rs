use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use lowband_transport_rust::network::wdp::{
    decode_cdpd_ipv4_udp, encode_cdpd_ipv4_udp, CdpdIpv4SendPolicy, Ipv4Reassembler,
    Ipv4ReassemblyOutcome, Ipv4ReassemblyPolicy, UdpChecksumPolicy, WdpAddress, WdpDatagram,
    WdpServicePort,
};
use lowband_transport_rust::network::wsp::{
    connectionless::{decode_connectionless_pdu, WspConnectionlessPdu},
    decode_wsp_session_event, WspEncodingVersion, WspHeaderBlockDecodePolicy, WspMethod,
    WspSessionEvent, WspSessionMode,
};
use lowband_transport_rust::network::wtp::duplicate_cache::{
    WtpDuplicateCacheState, WtpDuplicateDecision, WtpDuplicatePolicy,
};
use lowband_transport_rust::network::wtp::retransmission::{
    decide_retransmission, WtpBackoffKind, WtpRetransmissionDecision, WtpRetransmissionEvent,
    WtpRetransmissionPolicy, WtpRetransmissionState,
};
use lowband_transport_rust::{
    fetch_deck_in_process, FetchDeckRequest, FetchDestinationPolicy, FetchRequestPolicy,
};
use serde::Deserialize;
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::net::IpAddr;
use std::path::{Path, PathBuf};
use std::thread::JoinHandle;
use wavenav_engine::WmlEngine;

const CLAUSE_LEDGER_SOURCE: &str = include_str!(
    "../../spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json"
);
const WML_203_CANONICAL_TEXT_DECK: &str =
    include_str!("../../engine-wasm/examples/source/wml-203-wbxml-parity.wml");
const WML_203_WDP_CASE: &str = "selected_cdpd_wbxml_unitdata_round_trip";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayFixture {
    schema_version: u32,
    corpus: ReplayCorpus,
    cases: Vec<ReplayCase>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayCorpus {
    id: String,
    title: String,
    source_class: String,
    provenance: String,
    legal_reuse: String,
    derived_from: String,
    profile: Option<String>,
    source_documents: Option<Vec<ReplaySourceDocument>>,
    clause_ids: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct ReplaySourceDocument {
    id: String,
    sections: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayCase {
    name: String,
    capture: ReplayCapture,
    datagrams: Option<Vec<ReplayDatagram>>,
    retransmission_steps: Option<Vec<ReplayRetransmissionStep>>,
    duplicate_steps: Option<Vec<ReplayDuplicateStep>>,
    wdp_steps: Option<Vec<ReplayWdpStep>>,
    wdp_reassembly_policy: Option<ReplayWdpReassemblyPolicy>,
    expected_events: Vec<ExpectedReplayEvent>,
    expected_transaction_outcomes: Vec<ExpectedTransactionOutcome>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayCapture {
    capture_id: String,
    source_family: String,
    capture_kind: String,
    provenance_note: String,
    legal_reuse: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayDatagram {
    direction: ReplayDirection,
    src_addr: String,
    dst_addr: String,
    src_port: u16,
    dst_port: u16,
    payload: Vec<u8>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayRetransmissionStep {
    event: ReplayRetransmissionEvent,
    policy: ReplayRetransmissionPolicy,
    state: ReplayRetransmissionState,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayDuplicateStep {
    tid: u16,
    is_terminal_result: bool,
    policy: ReplayDuplicatePolicy,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayWdpDatagram {
    src_addr: String,
    dst_addr: String,
    src_port: u16,
    dst_port: u16,
    payload: ReplayPayload,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum ReplayPayload {
    Bytes { bytes: Vec<u8> },
    Repeat { byte: u8, length: usize },
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayWdpSendPolicy {
    identification: u16,
    time_to_live: u8,
    dont_fragment: bool,
    path_mtu: Option<usize>,
    destination_accepts_large_datagrams: bool,
    udp_checksum: ReplayUdpChecksumPolicy,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
enum ReplayUdpChecksumPolicy {
    Generate,
    Omit,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayWdpReassemblyPolicy {
    max_datagram_bytes: usize,
    max_pending_datagrams: usize,
    max_buffered_payload_bytes: usize,
    timeout_ticks: u64,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum ReplayWdpStep {
    RoundTrip {
        datagram: ReplayWdpDatagram,
        send_policy: ReplayWdpSendPolicy,
        expected_packet: Option<Vec<u8>>,
        expected_packet_len: usize,
    },
    Decode {
        packet: Vec<u8>,
    },
    Fragment {
        tick: u64,
        packet: Vec<u8>,
    },
    Expire {
        tick: u64,
    },
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
enum ReplayDirection {
    Uplink,
    Downlink,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
enum ReplayRetransmissionEventKind {
    TimerExpired,
    AckObserved,
    Reset,
    NackObserved,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct ReplayRetransmissionEvent {
    kind: ReplayRetransmissionEventKind,
    elapsed_ms: Option<u64>,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct ReplayRetransmissionPolicy {
    max_retries: u8,
    initial_delay_ms: u64,
    max_delay_ms: u64,
    backoff_kind: WtpBackoffKind,
    backoff_step_ms: u64,
    sar_enabled: bool,
    nack_holdoff_ms: u64,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct ReplayRetransmissionState {
    attempts: u8,
    last_nack_elapsed_ms: Option<u64>,
    completed: bool,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct ReplayDuplicatePolicy {
    cache_terminal_responses: bool,
    max_cached_transactions: usize,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum ExpectedReplayEvent {
    Datagram {
        direction: ReplayDirection,
        mode: String,
        service_port: u16,
        payload_len: usize,
    },
    MethodRequest {
        direction: ReplayDirection,
        mode: String,
        method: String,
        uri: String,
        body_len: usize,
    },
    MethodResult {
        direction: ReplayDirection,
        mode: String,
        status_code: u16,
        body_len: usize,
    },
    ConnectRequest {
        direction: ReplayDirection,
        mode: String,
        version_major: u8,
        version_minor: u8,
        max_outstanding_requests: Option<u16>,
    },
    ConnectReply {
        direction: ReplayDirection,
        mode: String,
        version_major: u8,
        version_minor: u8,
        session_id: u16,
        max_outstanding_requests: Option<u16>,
    },
    Retransmission {
        decision: String,
        attempt: Option<u8>,
        delay_ms: u64,
        attempts: u8,
        completed: bool,
    },
    Duplicate {
        decision: String,
        tid: u16,
        cache_size: usize,
    },
    WdpAccepted {
        packet_len: usize,
        datagram: ReplayWdpDatagram,
    },
    WdpRejected {
        error: String,
    },
    WdpFragmentPending {
        duplicate: bool,
        buffered_payload_bytes: usize,
        expected_payload_bytes: Option<usize>,
        expires_at_tick: u64,
    },
    WdpReassembled {
        packet_len: usize,
        datagram: ReplayWdpDatagram,
    },
    WdpIncompleteExpired {
        count: usize,
        buffered_payload_bytes: usize,
    },
}

#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum ExpectedTransactionOutcome {
    SessionConnect {
        mode: String,
        session_id: u16,
        version_major: u8,
        version_minor: u8,
        max_outstanding_requests: Option<u16>,
    },
    MethodRoundTrip {
        mode: String,
        method: String,
        uri: String,
        status_code: u16,
        response_body_len: usize,
    },
    RetransmissionFinalState {
        final_decision: String,
        attempts: u8,
        completed: bool,
    },
    DuplicateCacheSummary {
        accepted: usize,
        replayed_terminal: usize,
        dropped_duplicates: usize,
        final_cache_size: usize,
    },
    WdpReplaySummary {
        accepted_datagrams: usize,
        rejected_packets: usize,
        duplicate_fragments: usize,
        completed_reassemblies: usize,
        expired_assemblies: usize,
    },
}

#[derive(Debug, PartialEq, Eq)]
enum ReplayEvent {
    Datagram {
        direction: ReplayDirection,
        mode: WspSessionMode,
        service_port: u16,
        payload_len: usize,
    },
    MethodRequest {
        direction: ReplayDirection,
        mode: WspSessionMode,
        method: WspMethod,
        uri: String,
        body_len: usize,
    },
    MethodResult {
        direction: ReplayDirection,
        mode: WspSessionMode,
        status_code: u16,
        body_len: usize,
    },
    ConnectRequest {
        direction: ReplayDirection,
        mode: WspSessionMode,
        version_major: u8,
        version_minor: u8,
        max_outstanding_requests: Option<u16>,
    },
    ConnectReply {
        direction: ReplayDirection,
        mode: WspSessionMode,
        version_major: u8,
        version_minor: u8,
        session_id: u16,
        max_outstanding_requests: Option<u16>,
    },
    Retransmission {
        decision: String,
        attempt: Option<u8>,
        delay_ms: u64,
        attempts: u8,
        completed: bool,
    },
    Duplicate {
        decision: String,
        tid: u16,
        cache_size: usize,
    },
    WdpAccepted {
        packet_len: usize,
        datagram: WdpDatagram,
    },
    WdpRejected {
        error: String,
    },
    WdpFragmentPending {
        duplicate: bool,
        buffered_payload_bytes: usize,
        expected_payload_bytes: Option<usize>,
        expires_at_tick: u64,
    },
    WdpReassembled {
        packet_len: usize,
        datagram: WdpDatagram,
    },
    WdpIncompleteExpired {
        count: usize,
        buffered_payload_bytes: usize,
    },
}

#[derive(Debug, PartialEq, Eq)]
enum ReplayTransactionOutcome {
    SessionConnect {
        mode: WspSessionMode,
        session_id: u16,
        version_major: u8,
        version_minor: u8,
        max_outstanding_requests: Option<u16>,
    },
    MethodRoundTrip {
        mode: WspSessionMode,
        method: WspMethod,
        uri: String,
        status_code: u16,
        response_body_len: usize,
    },
    RetransmissionFinalState {
        final_decision: String,
        attempts: u8,
        completed: bool,
    },
    DuplicateCacheSummary {
        accepted: usize,
        replayed_terminal: usize,
        dropped_duplicates: usize,
        final_cache_size: usize,
    },
    WdpReplaySummary {
        accepted_datagrams: usize,
        rejected_packets: usize,
        duplicate_fragments: usize,
        completed_reassemblies: usize,
        expired_assemblies: usize,
    },
}

fn interop_fixture_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("network")
        .join("interop")
}

fn replay_fixture_paths(root: &Path) -> Vec<PathBuf> {
    let mut paths: Vec<PathBuf> = fs::read_dir(root)
        .expect("interop fixture root should be readable")
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().and_then(|ext| ext.to_str()) == Some("json"))
        .collect();
    paths.sort();
    paths
}

fn load_fixture(path: &Path) -> ReplayFixture {
    let raw =
        fs::read_to_string(path).unwrap_or_else(|_| panic!("failed reading {}", path.display()));
    serde_json::from_str(&raw)
        .unwrap_or_else(|error| panic!("failed parsing {}: {error}", path.display()))
}

fn validate_fixture_metadata(path: &Path, fixture: &ReplayFixture) {
    assert!(
        matches!(fixture.schema_version, 1 | 2),
        "fixture '{}' uses unsupported schema version {}",
        path.display(),
        fixture.schema_version
    );
    assert!(
        !fixture.corpus.id.is_empty()
            && !fixture.corpus.title.is_empty()
            && !fixture.corpus.provenance.is_empty()
            && !fixture.corpus.derived_from.is_empty(),
        "fixture '{}' must include non-empty corpus metadata",
        path.display()
    );
    assert!(
        matches!(
            fixture.corpus.source_class.as_str(),
            "normative" | "interop-reference" | "heuristic"
        ),
        "fixture '{}' uses invalid source class '{}'",
        path.display(),
        fixture.corpus.source_class
    );
    assert!(
        matches!(
            fixture.corpus.legal_reuse.as_str(),
            "local-test-only" | "synthetic-derivative"
        ),
        "fixture '{}' uses invalid corpus legal reuse '{}'",
        path.display(),
        fixture.corpus.legal_reuse
    );
    if let Some(source_documents) = &fixture.corpus.source_documents {
        assert!(
            !source_documents.is_empty()
                && source_documents
                    .iter()
                    .all(|source| !source.id.is_empty() && !source.sections.is_empty()),
            "fixture '{}' must include anchored source documents",
            path.display()
        );
    }
    if let Some(clause_ids) = &fixture.corpus.clause_ids {
        assert_eq!(
            fixture.schema_version,
            2,
            "fixture '{}' must use schema version 2 for exact WDP delivery evidence",
            path.display()
        );
        assert!(
            !clause_ids.is_empty(),
            "fixture '{}' must include at least one mapped clause",
            path.display()
        );
        let ledger: serde_json::Value =
            serde_json::from_str(CLAUSE_LEDGER_SOURCE).expect("clause ledger should parse");
        let mapped = ledger["families"]
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
                    .is_some_and(|items| items.iter().any(|item| item == "TRN-706"))
            })
            .map(|clause| {
                clause["id"]
                    .as_str()
                    .expect("mapped clause should have an ID")
                    .to_string()
            })
            .collect::<Vec<_>>();
        assert_eq!(
            clause_ids.as_slice(),
            mapped.as_slice(),
            "fixture '{}' clause mapping must match canonical TRN-706 mappings",
            path.display()
        );
        assert_eq!(
            fixture.corpus.profile.as_deref(),
            Some("wap-net-core-selected-wdp-only"),
            "fixture '{}' must retain its selected WDP-only profile boundary",
            path.display()
        );
    }
    for case in &fixture.cases {
        assert!(
            !case.capture.capture_id.is_empty()
                && !case.capture.provenance_note.is_empty()
                && !case.capture.source_family.is_empty(),
            "fixture '{}' case '{}' must include capture metadata",
            path.display(),
            case.name
        );
        assert!(
            matches!(
                case.capture.source_family.as_str(),
                "synthetic-seed" | "wap-1.2.1-selected-wdp" | "kannel" | "wireshark"
            ),
            "fixture '{}' case '{}' uses unsupported source family '{}'",
            path.display(),
            case.name,
            case.capture.source_family
        );
        assert!(
            matches!(
                case.capture.capture_kind.as_str(),
                "seed-trace" | "pcap-derivative"
            ),
            "fixture '{}' case '{}' uses unsupported capture kind '{}'",
            path.display(),
            case.name,
            case.capture.capture_kind
        );
        assert!(
            matches!(
                case.capture.legal_reuse.as_str(),
                "local-test-only" | "synthetic-derivative"
            ),
            "fixture '{}' case '{}' uses invalid capture legal reuse '{}'",
            path.display(),
            case.name,
            case.capture.legal_reuse
        );
        assert!(
            !case.expected_transaction_outcomes.is_empty(),
            "fixture '{}' case '{}' must define transaction outcomes",
            path.display(),
            case.name
        );
        if let Some(steps) = &case.wdp_steps {
            assert!(
                !steps.is_empty()
                    && case.datagrams.is_none()
                    && case.retransmission_steps.is_none()
                    && case.duplicate_steps.is_none(),
                "fixture '{}' case '{}' must keep the WDP replay lane typed and separate",
                path.display(),
                case.name
            );
        }
    }
}

fn parse_addr(raw: &str) -> WdpAddress {
    let addr: IpAddr = raw
        .parse()
        .unwrap_or_else(|_| panic!("invalid IP address in fixture: {raw}"));
    match addr {
        IpAddr::V4(addr) => WdpAddress::ipv4(addr.octets()),
        IpAddr::V6(addr) => WdpAddress::ipv6(addr.octets()),
    }
}

fn to_datagram(input: &ReplayDatagram) -> WdpDatagram {
    WdpDatagram {
        src_addr: parse_addr(&input.src_addr),
        dst_addr: parse_addr(&input.dst_addr),
        src_port: input.src_port,
        dst_port: input.dst_port,
        payload: input.payload.clone(),
    }
}

fn replay_payload(input: &ReplayPayload) -> Vec<u8> {
    match input {
        ReplayPayload::Bytes { bytes } => bytes.clone(),
        ReplayPayload::Repeat { byte, length } => vec![*byte; *length],
    }
}

fn to_wdp_datagram(input: &ReplayWdpDatagram) -> WdpDatagram {
    WdpDatagram {
        src_addr: parse_addr(&input.src_addr),
        dst_addr: parse_addr(&input.dst_addr),
        src_port: input.src_port,
        dst_port: input.dst_port,
        payload: replay_payload(&input.payload),
    }
}

fn to_wdp_send_policy(input: ReplayWdpSendPolicy) -> CdpdIpv4SendPolicy {
    CdpdIpv4SendPolicy {
        identification: input.identification,
        time_to_live: input.time_to_live,
        dont_fragment: input.dont_fragment,
        path_mtu: input.path_mtu,
        destination_accepts_large_datagrams: input.destination_accepts_large_datagrams,
        udp_checksum: match input.udp_checksum {
            ReplayUdpChecksumPolicy::Generate => UdpChecksumPolicy::Generate,
            ReplayUdpChecksumPolicy::Omit => UdpChecksumPolicy::Omit,
        },
    }
}

fn to_wdp_reassembly_policy(input: ReplayWdpReassemblyPolicy) -> Ipv4ReassemblyPolicy {
    Ipv4ReassemblyPolicy {
        max_datagram_bytes: input.max_datagram_bytes,
        max_pending_datagrams: input.max_pending_datagrams,
        max_buffered_payload_bytes: input.max_buffered_payload_bytes,
        timeout_ticks: input.timeout_ticks,
    }
}

fn mode_for_datagram(datagram: &WdpDatagram) -> Option<(WspSessionMode, u16)> {
    for port in [datagram.dst_port, datagram.src_port] {
        match WdpServicePort::from_u16(port) {
            Some(WdpServicePort::Connectionless | WdpServicePort::SecureConnectionless) => {
                return Some((WspSessionMode::Connectionless, port));
            }
            Some(WdpServicePort::Session | WdpServicePort::SecureSession) => {
                return Some((WspSessionMode::ConnectionOriented, port));
            }
            Some(_) | None => {}
        }
    }
    None
}

fn decode_policy_for_mode(mode: WspSessionMode) -> WspHeaderBlockDecodePolicy {
    match mode {
        WspSessionMode::Connectionless | WspSessionMode::ConnectionOriented => {
            WspHeaderBlockDecodePolicy {
                negotiated_version: Some(WspEncodingVersion::V1_4),
                ..WspHeaderBlockDecodePolicy::STRICT
            }
        }
    }
}

fn to_retransmission_policy(input: ReplayRetransmissionPolicy) -> WtpRetransmissionPolicy {
    WtpRetransmissionPolicy {
        max_retries: input.max_retries,
        initial_delay_ms: input.initial_delay_ms,
        max_delay_ms: input.max_delay_ms,
        backoff_kind: input.backoff_kind,
        backoff_step_ms: input.backoff_step_ms,
        sar_enabled: input.sar_enabled,
        nack_holdoff_ms: input.nack_holdoff_ms,
    }
}

fn to_retransmission_state(input: ReplayRetransmissionState) -> WtpRetransmissionState {
    WtpRetransmissionState {
        attempts: input.attempts,
        last_nack_elapsed_ms: input.last_nack_elapsed_ms,
        completed: input.completed,
    }
}

fn to_retransmission_event(input: ReplayRetransmissionEvent) -> WtpRetransmissionEvent {
    match input.kind {
        ReplayRetransmissionEventKind::TimerExpired => WtpRetransmissionEvent::TimerExpired,
        ReplayRetransmissionEventKind::AckObserved => WtpRetransmissionEvent::AckObserved,
        ReplayRetransmissionEventKind::Reset => WtpRetransmissionEvent::Reset,
        ReplayRetransmissionEventKind::NackObserved => WtpRetransmissionEvent::NackObserved {
            elapsed_ms: input
                .elapsed_ms
                .expect("nack-observed replay events require elapsedMs"),
        },
    }
}

fn to_duplicate_policy(input: ReplayDuplicatePolicy) -> WtpDuplicatePolicy {
    WtpDuplicatePolicy {
        cache_terminal_responses: input.cache_terminal_responses,
        max_cached_transactions: input.max_cached_transactions,
    }
}

fn retransmission_decision_name(decision: WtpRetransmissionDecision) -> (&'static str, Option<u8>) {
    match decision {
        WtpRetransmissionDecision::Send(attempt) => ("send", Some(attempt)),
        WtpRetransmissionDecision::HoldOff(_) => ("holdoff", None),
        WtpRetransmissionDecision::RetryExhausted => ("retry-exhausted", None),
        WtpRetransmissionDecision::Completed => ("completed", None),
    }
}

fn duplicate_decision_name(decision: WtpDuplicateDecision) -> &'static str {
    match decision {
        WtpDuplicateDecision::Accept => "accept",
        WtpDuplicateDecision::ReplayCachedTerminal => "replay-cached-terminal",
        WtpDuplicateDecision::DropAsDuplicate => "drop-as-duplicate",
    }
}

fn replay_case(case: &ReplayCase) -> Vec<ReplayEvent> {
    let mut out = Vec::new();

    if let Some(datagrams) = &case.datagrams {
        for input in datagrams {
            let datagram = to_datagram(input);
            let (mode, service_port) = mode_for_datagram(&datagram)
                .unwrap_or_else(|| panic!("case '{}' uses no known WDP service port", case.name));

            out.push(ReplayEvent::Datagram {
                direction: input.direction,
                mode,
                service_port,
                payload_len: datagram.payload.len(),
            });

            if mode == WspSessionMode::Connectionless {
                let pdu = decode_connectionless_pdu(&datagram.payload).unwrap_or_else(|error| {
                    panic!("case '{}' WSP decode failed: {error}", case.name)
                });
                match pdu {
                    WspConnectionlessPdu::Get { uri, .. } => out.push(ReplayEvent::MethodRequest {
                        direction: input.direction,
                        mode,
                        method: WspMethod::Get,
                        uri,
                        body_len: 0,
                    }),
                    WspConnectionlessPdu::Post { uri, body, .. } => {
                        out.push(ReplayEvent::MethodRequest {
                            direction: input.direction,
                            mode,
                            method: WspMethod::Post,
                            uri,
                            body_len: body.len(),
                        })
                    }
                    WspConnectionlessPdu::Reply {
                        status_code, body, ..
                    } => out.push(ReplayEvent::MethodResult {
                        direction: input.direction,
                        mode,
                        status_code,
                        body_len: body.len(),
                    }),
                }
                continue;
            }

            let session_event =
                decode_wsp_session_event(&datagram.payload, mode, decode_policy_for_mode(mode))
                    .unwrap_or_else(|error| {
                        panic!("case '{}' WSP decode failed: {error}", case.name)
                    });

            match session_event {
                WspSessionEvent::ConnectRequest(connect) => out.push(ReplayEvent::ConnectRequest {
                    direction: input.direction,
                    mode: connect.mode,
                    version_major: connect.version_major,
                    version_minor: connect.version_minor,
                    max_outstanding_requests: connect.capabilities.max_outstanding_requests,
                }),
                WspSessionEvent::ConnectReply(reply) => out.push(ReplayEvent::ConnectReply {
                    direction: input.direction,
                    mode: reply.mode,
                    version_major: reply.version_major,
                    version_minor: reply.version_minor,
                    session_id: reply.session_id,
                    max_outstanding_requests: reply
                        .negotiated_capabilities
                        .max_outstanding_requests,
                }),
                WspSessionEvent::MethodRequest(request) => out.push(ReplayEvent::MethodRequest {
                    direction: input.direction,
                    mode: request.mode,
                    method: request.method,
                    uri: request.uri,
                    body_len: request.body.len(),
                }),
                WspSessionEvent::MethodResult(result) => out.push(ReplayEvent::MethodResult {
                    direction: input.direction,
                    mode: result.mode,
                    status_code: result.status_code,
                    body_len: result.body.len(),
                }),
            }
        }
    }

    if let Some(steps) = &case.retransmission_steps {
        for step in steps {
            let policy = to_retransmission_policy(step.policy);
            let state = to_retransmission_state(step.state);
            let event = to_retransmission_event(step.event);
            let (decision, next_state, trace) = decide_retransmission(&policy, &state, event);
            let (decision_name, attempt) = retransmission_decision_name(decision);

            out.push(ReplayEvent::Retransmission {
                decision: decision_name.to_string(),
                attempt,
                delay_ms: trace.delay_ms,
                attempts: next_state.attempts,
                completed: next_state.completed,
            });
        }
    }

    if let Some(steps) = &case.duplicate_steps {
        let mut cache = WtpDuplicateCacheState::new();
        for step in steps {
            let policy = to_duplicate_policy(step.policy);
            let (decision, trace) = cache.decide(&policy, step.tid, step.is_terminal_result);
            out.push(ReplayEvent::Duplicate {
                decision: duplicate_decision_name(decision).to_string(),
                tid: trace.tid,
                cache_size: trace.cache_size,
            });
        }
    }

    if let Some(steps) = &case.wdp_steps {
        let mut reassembler = case
            .wdp_reassembly_policy
            .map(to_wdp_reassembly_policy)
            .map(Ipv4Reassembler::new)
            .transpose()
            .unwrap_or_else(|error| panic!("case '{}' has invalid policy: {error}", case.name));

        for step in steps {
            match step {
                ReplayWdpStep::RoundTrip {
                    datagram,
                    send_policy,
                    expected_packet,
                    expected_packet_len,
                } => {
                    let input = to_wdp_datagram(datagram);
                    let packet = encode_cdpd_ipv4_udp(&input, to_wdp_send_policy(*send_policy))
                        .unwrap_or_else(|error| {
                            panic!("case '{}' WDP encode failed: {error}", case.name)
                        });
                    assert_eq!(
                        packet.len(),
                        *expected_packet_len,
                        "case '{}' encoded packet length",
                        case.name
                    );
                    if let Some(expected) = expected_packet {
                        assert_eq!(
                            packet.as_slice(),
                            expected.as_slice(),
                            "case '{}' encoded packet bytes",
                            case.name
                        );
                    }
                    let decoded = decode_cdpd_ipv4_udp(&packet).unwrap_or_else(|error| {
                        panic!("case '{}' WDP decode failed: {error}", case.name)
                    });
                    assert_eq!(
                        decoded, input,
                        "case '{}' WDP round trip changed the datagram",
                        case.name
                    );
                    out.push(ReplayEvent::WdpAccepted {
                        packet_len: packet.len(),
                        datagram: decoded,
                    });
                }
                ReplayWdpStep::Decode { packet } => {
                    let error = decode_cdpd_ipv4_udp(packet)
                        .expect_err("malformed WDP replay packet should be rejected");
                    out.push(ReplayEvent::WdpRejected {
                        error: error.to_string(),
                    });
                }
                ReplayWdpStep::Fragment { tick, packet } => {
                    let active = reassembler.as_mut().unwrap_or_else(|| {
                        panic!(
                            "case '{}' fragment step requires a reassembly policy",
                            case.name
                        )
                    });
                    match active.ingest(packet, *tick).unwrap_or_else(|error| {
                        panic!("case '{}' fragment replay failed: {error}", case.name)
                    }) {
                        Ipv4ReassemblyOutcome::Pending(pending) => {
                            out.push(ReplayEvent::WdpFragmentPending {
                                duplicate: pending.duplicate,
                                buffered_payload_bytes: pending.buffered_payload_bytes,
                                expected_payload_bytes: pending.expected_payload_bytes,
                                expires_at_tick: pending.expires_at_tick,
                            });
                        }
                        Ipv4ReassemblyOutcome::Complete(packet) => {
                            let decoded = decode_cdpd_ipv4_udp(&packet).unwrap_or_else(|error| {
                                panic!(
                                    "case '{}' reassembled WDP decode failed: {error}",
                                    case.name
                                )
                            });
                            out.push(ReplayEvent::WdpReassembled {
                                packet_len: packet.len(),
                                datagram: decoded,
                            });
                        }
                    }
                }
                ReplayWdpStep::Expire { tick } => {
                    let active = reassembler.as_mut().unwrap_or_else(|| {
                        panic!(
                            "case '{}' expire step requires a reassembly policy",
                            case.name
                        )
                    });
                    let expired = active.expire(*tick);
                    out.push(ReplayEvent::WdpIncompleteExpired {
                        count: expired.len(),
                        buffered_payload_bytes: expired
                            .iter()
                            .map(|assembly| assembly.buffered_payload_bytes)
                            .sum(),
                    });
                }
            }
        }
    }

    out
}

fn expected_mode(name: &str) -> WspSessionMode {
    match name {
        "connectionless" => WspSessionMode::Connectionless,
        "connection-oriented" => WspSessionMode::ConnectionOriented,
        other => panic!("unsupported expected mode: {other}"),
    }
}

fn expected_method(name: &str) -> WspMethod {
    match name {
        "get" => WspMethod::Get,
        "post" => WspMethod::Post,
        other => panic!("unsupported expected method: {other}"),
    }
}

fn expected_events(case: &ReplayCase) -> Vec<ReplayEvent> {
    case.expected_events
        .iter()
        .map(|event| match event {
            ExpectedReplayEvent::Datagram {
                direction,
                mode,
                service_port,
                payload_len,
            } => ReplayEvent::Datagram {
                direction: *direction,
                mode: expected_mode(mode),
                service_port: *service_port,
                payload_len: *payload_len,
            },
            ExpectedReplayEvent::MethodRequest {
                direction,
                mode,
                method,
                uri,
                body_len,
            } => ReplayEvent::MethodRequest {
                direction: *direction,
                mode: expected_mode(mode),
                method: expected_method(method),
                uri: uri.clone(),
                body_len: *body_len,
            },
            ExpectedReplayEvent::MethodResult {
                direction,
                mode,
                status_code,
                body_len,
            } => ReplayEvent::MethodResult {
                direction: *direction,
                mode: expected_mode(mode),
                status_code: *status_code,
                body_len: *body_len,
            },
            ExpectedReplayEvent::ConnectRequest {
                direction,
                mode,
                version_major,
                version_minor,
                max_outstanding_requests,
            } => ReplayEvent::ConnectRequest {
                direction: *direction,
                mode: expected_mode(mode),
                version_major: *version_major,
                version_minor: *version_minor,
                max_outstanding_requests: *max_outstanding_requests,
            },
            ExpectedReplayEvent::ConnectReply {
                direction,
                mode,
                version_major,
                version_minor,
                session_id,
                max_outstanding_requests,
            } => ReplayEvent::ConnectReply {
                direction: *direction,
                mode: expected_mode(mode),
                version_major: *version_major,
                version_minor: *version_minor,
                session_id: *session_id,
                max_outstanding_requests: *max_outstanding_requests,
            },
            ExpectedReplayEvent::Retransmission {
                decision,
                attempt,
                delay_ms,
                attempts,
                completed,
            } => ReplayEvent::Retransmission {
                decision: decision.clone(),
                attempt: *attempt,
                delay_ms: *delay_ms,
                attempts: *attempts,
                completed: *completed,
            },
            ExpectedReplayEvent::Duplicate {
                decision,
                tid,
                cache_size,
            } => ReplayEvent::Duplicate {
                decision: decision.clone(),
                tid: *tid,
                cache_size: *cache_size,
            },
            ExpectedReplayEvent::WdpAccepted {
                packet_len,
                datagram,
            } => ReplayEvent::WdpAccepted {
                packet_len: *packet_len,
                datagram: to_wdp_datagram(datagram),
            },
            ExpectedReplayEvent::WdpRejected { error } => ReplayEvent::WdpRejected {
                error: error.clone(),
            },
            ExpectedReplayEvent::WdpFragmentPending {
                duplicate,
                buffered_payload_bytes,
                expected_payload_bytes,
                expires_at_tick,
            } => ReplayEvent::WdpFragmentPending {
                duplicate: *duplicate,
                buffered_payload_bytes: *buffered_payload_bytes,
                expected_payload_bytes: *expected_payload_bytes,
                expires_at_tick: *expires_at_tick,
            },
            ExpectedReplayEvent::WdpReassembled {
                packet_len,
                datagram,
            } => ReplayEvent::WdpReassembled {
                packet_len: *packet_len,
                datagram: to_wdp_datagram(datagram),
            },
            ExpectedReplayEvent::WdpIncompleteExpired {
                count,
                buffered_payload_bytes,
            } => ReplayEvent::WdpIncompleteExpired {
                count: *count,
                buffered_payload_bytes: *buffered_payload_bytes,
            },
        })
        .collect()
}

fn derive_transaction_outcomes(events: &[ReplayEvent]) -> Vec<ReplayTransactionOutcome> {
    let mut out = Vec::new();

    let connect_request = events.iter().find_map(|event| match event {
        ReplayEvent::ConnectRequest {
            mode,
            version_major,
            version_minor,
            max_outstanding_requests,
            ..
        } => Some((
            *mode,
            *version_major,
            *version_minor,
            *max_outstanding_requests,
        )),
        _ => None,
    });
    if let Some(ReplayEvent::ConnectReply {
        mode,
        version_major,
        version_minor,
        session_id,
        max_outstanding_requests,
        ..
    }) = events
        .iter()
        .find(|event| matches!(event, ReplayEvent::ConnectReply { .. }))
    {
        let negotiated_requests = match connect_request {
            Some((_, _, _, request_max)) => max_outstanding_requests.or(request_max),
            None => *max_outstanding_requests,
        };
        out.push(ReplayTransactionOutcome::SessionConnect {
            mode: *mode,
            session_id: *session_id,
            version_major: *version_major,
            version_minor: *version_minor,
            max_outstanding_requests: negotiated_requests,
        });
    }

    let method_request = events.iter().find_map(|event| match event {
        ReplayEvent::MethodRequest {
            mode, method, uri, ..
        } => Some((*mode, *method, uri.clone())),
        _ => None,
    });
    let method_result = events.iter().find_map(|event| match event {
        ReplayEvent::MethodResult {
            status_code,
            body_len,
            ..
        } => Some((*status_code, *body_len)),
        _ => None,
    });
    if let (Some((mode, method, uri)), Some((status_code, response_body_len))) =
        (method_request, method_result)
    {
        out.push(ReplayTransactionOutcome::MethodRoundTrip {
            mode,
            method,
            uri,
            status_code,
            response_body_len,
        });
    }

    if let Some(ReplayEvent::Retransmission {
        decision,
        attempts,
        completed,
        ..
    }) = events
        .iter()
        .rev()
        .find(|event| matches!(event, ReplayEvent::Retransmission { .. }))
    {
        out.push(ReplayTransactionOutcome::RetransmissionFinalState {
            final_decision: decision.clone(),
            attempts: *attempts,
            completed: *completed,
        });
    }

    let accepted = events
        .iter()
        .filter(|event| matches!(event, ReplayEvent::Duplicate { decision, .. } if decision == "accept"))
        .count();
    let replayed_terminal = events
        .iter()
        .filter(|event| {
            matches!(event, ReplayEvent::Duplicate { decision, .. } if decision == "replay-cached-terminal")
        })
        .count();
    let dropped_duplicates = events
        .iter()
        .filter(|event| {
            matches!(event, ReplayEvent::Duplicate { decision, .. } if decision == "drop-as-duplicate")
        })
        .count();
    if accepted + replayed_terminal + dropped_duplicates > 0 {
        let final_cache_size = events
            .iter()
            .rev()
            .find_map(|event| match event {
                ReplayEvent::Duplicate { cache_size, .. } => Some(*cache_size),
                _ => None,
            })
            .expect("duplicate events imply final cache size");
        out.push(ReplayTransactionOutcome::DuplicateCacheSummary {
            accepted,
            replayed_terminal,
            dropped_duplicates,
            final_cache_size,
        });
    }

    let accepted_datagrams = events
        .iter()
        .filter(|event| matches!(event, ReplayEvent::WdpAccepted { .. }))
        .count();
    let rejected_packets = events
        .iter()
        .filter(|event| matches!(event, ReplayEvent::WdpRejected { .. }))
        .count();
    let duplicate_fragments = events
        .iter()
        .filter(|event| {
            matches!(
                event,
                ReplayEvent::WdpFragmentPending {
                    duplicate: true,
                    ..
                }
            )
        })
        .count();
    let completed_reassemblies = events
        .iter()
        .filter(|event| matches!(event, ReplayEvent::WdpReassembled { .. }))
        .count();
    let expired_assemblies = events
        .iter()
        .filter_map(|event| match event {
            ReplayEvent::WdpIncompleteExpired { count, .. } => Some(*count),
            _ => None,
        })
        .sum();
    if accepted_datagrams
        + rejected_packets
        + duplicate_fragments
        + completed_reassemblies
        + expired_assemblies
        > 0
        || events.iter().any(|event| {
            matches!(
                event,
                ReplayEvent::WdpFragmentPending { .. } | ReplayEvent::WdpIncompleteExpired { .. }
            )
        })
    {
        out.push(ReplayTransactionOutcome::WdpReplaySummary {
            accepted_datagrams,
            rejected_packets,
            duplicate_fragments,
            completed_reassemblies,
            expired_assemblies,
        });
    }

    out
}

fn expected_transaction_outcomes(case: &ReplayCase) -> Vec<ReplayTransactionOutcome> {
    case.expected_transaction_outcomes
        .iter()
        .map(|outcome| match outcome {
            ExpectedTransactionOutcome::SessionConnect {
                mode,
                session_id,
                version_major,
                version_minor,
                max_outstanding_requests,
            } => ReplayTransactionOutcome::SessionConnect {
                mode: expected_mode(mode),
                session_id: *session_id,
                version_major: *version_major,
                version_minor: *version_minor,
                max_outstanding_requests: *max_outstanding_requests,
            },
            ExpectedTransactionOutcome::MethodRoundTrip {
                mode,
                method,
                uri,
                status_code,
                response_body_len,
            } => ReplayTransactionOutcome::MethodRoundTrip {
                mode: expected_mode(mode),
                method: expected_method(method),
                uri: uri.clone(),
                status_code: *status_code,
                response_body_len: *response_body_len,
            },
            ExpectedTransactionOutcome::RetransmissionFinalState {
                final_decision,
                attempts,
                completed,
            } => ReplayTransactionOutcome::RetransmissionFinalState {
                final_decision: final_decision.clone(),
                attempts: *attempts,
                completed: *completed,
            },
            ExpectedTransactionOutcome::DuplicateCacheSummary {
                accepted,
                replayed_terminal,
                dropped_duplicates,
                final_cache_size,
            } => ReplayTransactionOutcome::DuplicateCacheSummary {
                accepted: *accepted,
                replayed_terminal: *replayed_terminal,
                dropped_duplicates: *dropped_duplicates,
                final_cache_size: *final_cache_size,
            },
            ExpectedTransactionOutcome::WdpReplaySummary {
                accepted_datagrams,
                rejected_packets,
                duplicate_fragments,
                completed_reassemblies,
                expired_assemblies,
            } => ReplayTransactionOutcome::WdpReplaySummary {
                accepted_datagrams: *accepted_datagrams,
                rejected_packets: *rejected_packets,
                duplicate_fragments: *duplicate_fragments,
                completed_reassemblies: *completed_reassemblies,
                expired_assemblies: *expired_assemblies,
            },
        })
        .collect()
}

#[test]
fn interop_replay_fixture_paths_are_deterministic() {
    let root = interop_fixture_root();
    assert!(
        root.is_dir(),
        "interop fixture root should exist: {}",
        root.display()
    );

    let fixture_paths = replay_fixture_paths(&root);
    assert!(
        !fixture_paths.is_empty(),
        "expected at least one interop replay fixture in {}",
        root.display()
    );

    for path in fixture_paths {
        let fixture = load_fixture(&path);
        validate_fixture_metadata(&path, &fixture);
        for case in fixture.cases {
            let replayed = replay_case(&case);
            assert_eq!(
                replayed,
                expected_events(&case),
                "fixture '{}' case '{}' mismatch",
                path.display(),
                case.name
            );
            assert_eq!(
                derive_transaction_outcomes(&replayed),
                expected_transaction_outcomes(&case),
                "fixture '{}' case '{}' transaction outcomes mismatch",
                path.display(),
                case.name
            );
        }
    }
}

fn serve_one_wmlc_response(body: Vec<u8>) -> (String, JoinHandle<()>) {
    let listener =
        std::net::TcpListener::bind("127.0.0.1:0").expect("bind local WMLC fixture server");
    let address = listener.local_addr().expect("read fixture server address");
    let server = std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().expect("accept WMLC fixture request");
        let mut reader = BufReader::new(stream.try_clone().expect("clone WMLC request stream"));
        loop {
            let mut line = String::new();
            reader.read_line(&mut line).expect("read WMLC request");
            if line == "\r\n" || line.is_empty() {
                break;
            }
        }
        let headers = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/vnd.wap.wmlc\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
            body.len()
        );
        stream
            .write_all(headers.as_bytes())
            .expect("write WMLC response headers");
        stream.write_all(&body).expect("write WMLC response body");
    });
    (format!("http://{address}/wml-203.wmlc"), server)
}

#[test]
fn wml_203_reconstructed_wdp_sdu_matches_text_engine_behavior() {
    let fixture = load_fixture(&interop_fixture_root().join("wdp_cdpd_ipv4_seed.json"));
    let case = fixture
        .cases
        .iter()
        .find(|case| case.name == WML_203_WDP_CASE)
        .expect("WML-203 WDP replay case should exist");
    let expected_datagram = case
        .expected_events
        .iter()
        .find_map(|event| match event {
            ExpectedReplayEvent::WdpAccepted { datagram, .. }
            | ExpectedReplayEvent::WdpReassembled { datagram, .. } => Some(datagram),
            _ => None,
        })
        .expect("WML-203 replay case should expose an exact WDP delivery event");
    let wbxml_sdu = replay_payload(&expected_datagram.payload);
    let expected_raw_bytes_base64 = BASE64.encode(&wbxml_sdu);

    let (url, server) = serve_one_wmlc_response(wbxml_sdu);
    let response = fetch_deck_in_process(FetchDeckRequest {
        url,
        method: Some("GET".to_string()),
        headers: None,
        timeout_ms: Some(1_000),
        retries: Some(0),
        request_id: Some("wml-203-reconstructed-sdu".to_string()),
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: None,
            referer_url: None,
            post_context: None,
            ua_capability_profile: None,
        }),
    });
    server.join().expect("WMLC fixture server should exit");
    assert!(
        response.ok,
        "reconstructed WDP SDU should decode at the fetch boundary: {:?}",
        response.error
    );
    assert_eq!(response.content_type, "application/vnd.wap.wmlc");

    let deck_input = response
        .engine_deck_input
        .expect("successful WMLC response should provide engineDeckInput");
    assert_eq!(
        deck_input.raw_bytes_base64.as_deref(),
        Some(expected_raw_bytes_base64.as_str()),
        "binary handoff should preserve the exact reconstructed WBXML payload"
    );
    let mut binary_engine = WmlEngine::new();
    binary_engine
        .load_deck_context(
            &deck_input.wml_xml,
            &deck_input.base_url,
            &deck_input.content_type,
            deck_input.raw_bytes_base64,
        )
        .expect("transport-decoded WBXML should load into the native engine");

    let mut text_engine = WmlEngine::new();
    text_engine
        .load_deck_context(
            WML_203_CANONICAL_TEXT_DECK,
            &deck_input.base_url,
            "text/vnd.wap.wml",
            None,
        )
        .expect("canonical text WML should load into the native engine");

    assert_eq!(binary_engine.active_card_id(), text_engine.active_card_id());
    assert_eq!(
        binary_engine.focused_link_index(),
        text_engine.focused_link_index()
    );
    assert_eq!(
        binary_engine.external_navigation_intent(),
        text_engine.external_navigation_intent()
    );
    assert_eq!(
        serde_json::to_value(
            binary_engine
                .render()
                .expect("binary render should succeed")
        )
        .expect("serialize binary render"),
        serde_json::to_value(text_engine.render().expect("text render should succeed"))
            .expect("serialize text render"),
        "reconstructed WBXML and canonical text should produce identical render lists"
    );
}
