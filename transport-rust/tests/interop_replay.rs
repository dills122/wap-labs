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
    cases: Vec<ReplayCase>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplayCase {
    name: String,
    datagrams: Option<Vec<ReplayDatagram>>,
    retransmission_steps: Option<Vec<ReplayRetransmissionStep>>,
    duplicate_steps: Option<Vec<ReplayDuplicateStep>>,
    expected_events: Vec<ExpectedReplayEvent>,
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
        for case in fixture.cases {
            assert_eq!(
                replay_case(&case),
                expected_events(&case),
                "fixture '{}' case '{}' mismatch",
                path.display(),
                case.name
            );
        }
    }
}
