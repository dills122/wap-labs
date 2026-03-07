use lowband_transport_rust::network::wdp::{WdpAddress, WdpDatagram, WdpServicePort};
use lowband_transport_rust::network::wsp::{
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
use serde::Deserialize;
use std::fs;
use std::net::IpAddr;
use std::path::{Path, PathBuf};

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
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayCase {
    name: String,
    capture: ReplayCapture,
    datagrams: Option<Vec<ReplayDatagram>>,
    retransmission_steps: Option<Vec<ReplayRetransmissionStep>>,
    duplicate_steps: Option<Vec<ReplayDuplicateStep>>,
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
    assert_eq!(
        fixture.schema_version,
        1,
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
            "interop-reference" | "heuristic"
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
                "synthetic-seed" | "kannel" | "wireshark"
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

fn mode_for_datagram(datagram: &WdpDatagram) -> Option<(WspSessionMode, u16)> {
    for port in [datagram.dst_port, datagram.src_port] {
        match WdpServicePort::from_u16(port) {
            Some(WdpServicePort::Connectionless | WdpServicePort::SecureConnectionless) => {
                return Some((WspSessionMode::Connectionless, port));
            }
            Some(WdpServicePort::Session | WdpServicePort::SecureSession) => {
                return Some((WspSessionMode::ConnectionOriented, port));
            }
            None => {}
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
        })
        .collect()
}

#[test]
fn interop_replay_fixture_get_reply_paths_are_deterministic() {
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
