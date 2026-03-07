pub(super) use super::{
    fetch_deck_in_process,
    network::wtp::{
        duplicate_cache::{WtpDuplicateCacheState, WtpDuplicateDecision, WtpDuplicatePolicy},
        retransmission::{
            decide_retransmission, WtpRetransmissionDecision, WtpRetransmissionEvent,
            WtpRetransmissionPolicy, WtpRetransmissionState,
        },
    },
    preflight_wbxml_decoder,
    wsp_connectionless_primitive_profile::{
        decide_wsp_primitive_transition, WspPrimitiveDecision, WspPrimitiveDirection,
        WspPrimitiveProfile, WspPrimitiveProfileMode, WspPrimitiveState, WspServicePrimitive,
    },
    wtp_replay_window::{
        decide_initiator_tid, decide_responder_tid, WtpDuplicateAssumption, WtpInitiatorPolicy,
        WtpInitiatorState, WtpInitiatorTidDecision, WtpReplayCacheMode, WtpResponderPolicy,
        WtpResponderState, WtpResponderTidDecision,
    },
    FetchCacheControlPolicy, FetchDeckRequest, FetchDeckResponse, FetchDestinationPolicy,
    FetchPostContext, FetchRequestPolicy, FetchUaCapabilityProfile, MAX_RESPONSE_BODY_BYTES,
    MAX_URI_OCTETS,
};
pub(super) use crate::fetch_policy::{
    apply_request_policy, classify_destination_host, classify_ip, resolve_fetch_destination_policy,
    validate_fetch_destination, DestinationHostClass,
};
pub(super) use crate::gateway::build_gateway_request;
pub(super) use crate::request_meta::{
    details_with_request_id, log_transport_event, normalized_request_id,
};
pub(super) use crate::responses::{
    invalid_request_response, is_supported_wml_content_type, map_success_payload_response,
    map_terminal_send_error, normalize_content_type, payload_too_large_response,
};
pub(super) use crate::wbxml::{
    decode_wmlc, decode_wmlc_with_libwbxml, decode_wmlc_with_tool, libwbxml_available,
    libwbxml_disabled_by_env, libwbxml_error_text, wbxml2xml_bin, LibwbxmlDecodeError,
};
pub(super) use base64::engine::general_purpose::STANDARD as BASE64;
pub(super) use base64::Engine as _;
pub(super) use serde::Deserialize;
pub(super) use std::collections::HashMap;
pub(super) use std::fs;
pub(super) use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};
pub(super) use std::path::PathBuf;
pub(super) use std::sync::{Mutex, OnceLock};
pub(super) use toml::Value;
pub(super) use url::Url;

fn env_lock() -> &'static Mutex<()> {
    static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(()))
}

fn basic_request(url: String) -> FetchDeckRequest {
    FetchDeckRequest {
        url,
        method: None,
        headers: None,
        timeout_ms: Some(500),
        retries: Some(0),
        request_id: None,
        request_policy: None,
    }
}

fn request_policy_with_destination(
    destination_policy: FetchDestinationPolicy,
) -> FetchRequestPolicy {
    FetchRequestPolicy {
        destination_policy: Some(destination_policy),
        cache_control: None,
        referer_url: None,
        post_context: None,
        ua_capability_profile: None,
    }
}

fn detail_string(response: &super::FetchDeckResponse, key: &str) -> Option<String> {
    response
        .error
        .as_ref()
        .and_then(|error| error.details.as_ref())
        .and_then(|details| details.get(key))
        .and_then(|value| value.as_str())
        .map(str::to_string)
}

fn with_env_var_locked<T>(name: &str, value: &str, f: impl FnOnce() -> T) -> T {
    let _env_guard = env_lock().lock().expect("env lock should succeed");
    let previous = std::env::var(name).ok();
    std::env::set_var(name, value);
    let out = f();
    if let Some(old) = previous {
        std::env::set_var(name, old);
    } else {
        std::env::remove_var(name);
    }
    out
}

fn with_env_removed_locked<T>(name: &str, f: impl FnOnce() -> T) -> T {
    let _env_guard = env_lock().lock().expect("env lock should succeed");
    let previous = std::env::var(name).ok();
    std::env::remove_var(name);
    let out = f();
    if let Some(old) = previous {
        std::env::set_var(name, old);
    }
    out
}

fn with_two_env_vars_locked<T>(
    first_name: &str,
    first_value: &str,
    second_name: &str,
    second_value: &str,
    f: impl FnOnce() -> T,
) -> T {
    let _env_guard = env_lock().lock().expect("env lock should succeed");
    let first_prev = std::env::var(first_name).ok();
    let second_prev = std::env::var(second_name).ok();
    std::env::set_var(first_name, first_value);
    std::env::set_var(second_name, second_value);
    let out = f();
    if let Some(old) = first_prev {
        std::env::set_var(first_name, old);
    } else {
        std::env::remove_var(first_name);
    }
    if let Some(old) = second_prev {
        std::env::set_var(second_name, old);
    } else {
        std::env::remove_var(second_name);
    }
    out
}

#[cfg(unix)]
fn write_fake_decoder_script(xml: &str) -> PathBuf {
    use std::os::unix::fs::PermissionsExt;
    let script = format!(
        "#!/bin/sh\nif [ \"$1\" != \"-o\" ]; then exit 2; fi\nout=\"$2\"\nprintf '%s' '{}' > \"$out\"\n",
        xml
    );
    let dir = tempfile::tempdir().expect("tempdir should create");
    let path = dir.path().join("fake-wbxml2xml.sh");
    fs::write(&path, script).expect("fake decoder script should write");
    let mut perms = fs::metadata(&path)
        .expect("fake decoder metadata should exist")
        .permissions();
    perms.set_mode(0o755);
    fs::set_permissions(&path, perms).expect("fake decoder should become executable");
    let keep = path.clone();
    std::mem::forget(dir);
    keep
}

fn wbxml_sample_paths() -> Vec<PathBuf> {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("wbxml_samples");
    if !root.is_dir() {
        return Vec::new();
    }

    let mut paths: Vec<PathBuf> = fs::read_dir(root)
        .expect("wbxml_samples directory should be readable")
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().and_then(|ext| ext.to_str()) == Some("wbxml"))
        .collect();
    paths.sort();
    paths
}

fn wbxml_fixture_expectations() -> HashMap<String, String> {
    let manifest_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("wbxml_samples")
        .join("fixtures.toml");
    let raw =
        fs::read_to_string(&manifest_path).expect("fixtures.toml should exist and be readable");
    let doc: Value = raw.parse().expect("fixtures.toml should parse");
    let fixtures = doc
        .get("fixtures")
        .and_then(Value::as_array)
        .expect("fixtures.toml should contain [[fixtures]] entries");

    let mut out = HashMap::new();
    for fixture in fixtures {
        let file = fixture
            .get("file")
            .and_then(Value::as_str)
            .expect("fixture file should be a string");
        let expected = fixture
            .get("expected")
            .and_then(Value::as_str)
            .expect("fixture expected should be a string");
        out.insert(file.to_string(), expected.to_string());
    }
    out
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureMapInput {
    status: u16,
    is_wap_scheme: bool,
    request_url: String,
    upstream_url: String,
    final_url: String,
    content_type: String,
    body: Option<String>,
    body_base64: Option<String>,
    attempt: u8,
    elapsed_ms: f64,
}

impl FixtureMapInput {
    fn body_bytes(&self) -> Vec<u8> {
        if let Some(encoded) = self.body_base64.as_deref() {
            return BASE64.decode(encoded).unwrap_or_else(|_| {
                panic!("fixture bodyBase64 should decode for {}", self.final_url)
            });
        }
        if let Some(body) = self.body.as_deref() {
            return body.as_bytes().to_vec();
        }
        panic!(
            "fixture must provide either body or bodyBase64 for {}",
            self.final_url
        );
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureExpected {
    ok: bool,
    status: u16,
    final_url: String,
    content_type: String,
    wml: Option<String>,
    error_code: Option<String>,
}

fn transport_fixture_path(name: &str, file: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("transport")
        .join(name)
        .join(file)
}

fn read_json_fixture<T: for<'de> Deserialize<'de>>(name: &str, file: &str) -> T {
    let path = transport_fixture_path(name, file);
    let raw = fs::read(&path).unwrap_or_else(|_| panic!("failed reading {}", path.display()));
    serde_json::from_slice(&raw)
        .unwrap_or_else(|error| panic!("failed parsing fixture {}: {error}", path.display()))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpResponderFixtureCase {
    name: String,
    incoming_tid: u16,
    expected: String,
    policy: WtpReplayPolicyInput,
    state: WtpResponderStateInput,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpResponderStateInput {
    last_tid: u16,
    seen_tids: Vec<u16>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpInitiatorFixtureCase {
    name: String,
    incoming_tid: u16,
    expected: String,
    state: WtpInitiatorStateInput,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpInitiatorStateInput {
    last_tid: Option<u16>,
    steps_in_window: u16,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpReplayPolicyInput {
    replay_window: u16,
    cache_mode: WtpReplayCacheMode,
    duplicate_assumption: WtpDuplicateAssumption,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpReplayPolicyFixture {
    #[allow(dead_code)]
    responder_policy: WtpReplayPolicyInput,
    responder_cases: Vec<WtpResponderFixtureCase>,
    initiator_policy: WtpInitiatorPolicy,
    initiator_cases: Vec<WtpInitiatorFixtureCase>,
}

impl WtpReplayPolicyInput {
    fn into_policy(self) -> WtpResponderPolicy {
        WtpResponderPolicy {
            replay_window: self.replay_window,
            cache_mode: self.cache_mode,
            duplicate_assumption: self.duplicate_assumption,
        }
    }
}

impl WtpResponderStateInput {
    fn into_state(self) -> WtpResponderState {
        WtpResponderState::new(self.last_tid, self.seen_tids)
    }
}

impl WtpInitiatorStateInput {
    fn into_state(self) -> WtpInitiatorState {
        WtpInitiatorState {
            last_tid: self.last_tid,
            steps_in_window: self.steps_in_window,
        }
    }
}

fn expect_responder_tid_decision(expected: &str) -> WtpResponderTidDecision {
    match expected {
        "accept" => WtpResponderTidDecision::Accept,
        "replay-cached-terminal" => WtpResponderTidDecision::ReplayCachedTerminal,
        "drop-duplicate" => WtpResponderTidDecision::DropAsDuplicate,
        "drop-stale" => WtpResponderTidDecision::DropAsStale,
        other => panic!("unknown responder expectation {other}"),
    }
}

fn expect_initiator_tid_decision(expected: &str) -> fn(WtpInitiatorTidDecision) -> bool {
    match expected {
        "accept" => |decision| {
            matches!(
                decision,
                WtpInitiatorTidDecision::Accept { accepted: true, .. }
            )
        },
        "duplicate-retransmission" => {
            |decision| matches!(decision, WtpInitiatorTidDecision::DuplicateRetransmission)
        }
        "require-restart" => |decision| matches!(decision, WtpInitiatorTidDecision::RequireRestart),
        "out-of-replay-window" => {
            |decision| matches!(decision, WtpInitiatorTidDecision::OutOfReplayWindow)
        }
        other => panic!("unknown initiator expectation {other}"),
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpStateCacheCaseEvent {
    tid: u16,
    is_terminal_result: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpDuplicateCacheFixture {
    cases: Vec<WtpDuplicateCacheCase>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpDuplicateCacheCase {
    name: String,
    policy: WtpDuplicatePolicy,
    events: Vec<WtpStateCacheCaseEvent>,
    expected_decisions: Vec<String>,
}

fn parse_dup_decision(expected: &str) -> WtpDuplicateDecision {
    match expected {
        "accept" => WtpDuplicateDecision::Accept,
        "replay-cached-terminal" => WtpDuplicateDecision::ReplayCachedTerminal,
        "drop-as-duplicate" => WtpDuplicateDecision::DropAsDuplicate,
        other => panic!("unknown duplicate decision {other}"),
    }
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
#[serde(rename_all = "camelCase")]
enum WtpRetransmissionPolicyEvent {
    Named(String),
    Observed {
        event: String,
        elapsed_ms: Option<u64>,
    },
    NackObserved {
        #[serde(rename = "nackObserved")]
        nack_observed: u64,
    },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpRetransmissionFixtureCase {
    name: String,
    policy: WtpRetransmissionPolicy,
    initial_state: WtpRetransmissionState,
    events: Vec<WtpRetransmissionPolicyEvent>,
    expected_decisions: Vec<String>,
    expected_delays_ms: Vec<u64>,
    expected_state: Option<WtpRetransmissionState>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WtpRetransmissionFixture {
    #[serde(rename = "maxRetriesTestCases")]
    max_retries_test_cases: Vec<WtpRetransmissionFixtureCase>,
    #[serde(rename = "linearBackoffTestCases")]
    linear_backoff_test_cases: Vec<WtpRetransmissionFixtureCase>,
    #[serde(rename = "nackHoldoffTestCases")]
    nack_holdoff_test_cases: Vec<WtpRetransmissionFixtureCase>,
}

fn parse_retransmission_event(raw: &WtpRetransmissionPolicyEvent) -> WtpRetransmissionEvent {
    match raw {
        WtpRetransmissionPolicyEvent::Named(event) => match event.as_str() {
            "timer-expired" => WtpRetransmissionEvent::TimerExpired,
            "ack-observed" => WtpRetransmissionEvent::AckObserved,
            "reset" => WtpRetransmissionEvent::Reset,
            other => panic!("unknown retransmission event {other}"),
        },
        WtpRetransmissionPolicyEvent::Observed { event, elapsed_ms } => match event.as_str() {
            "nack-observed" => {
                let elapsed_ms = elapsed_ms.expect("nack-observed events require elapsed_ms");
                WtpRetransmissionEvent::NackObserved { elapsed_ms }
            }
            other => panic!("unknown retransmission event {other}"),
        },
        WtpRetransmissionPolicyEvent::NackObserved { nack_observed } => {
            WtpRetransmissionEvent::NackObserved {
                elapsed_ms: *nack_observed,
            }
        }
    }
}

fn parse_retransmission_decision(raw: &str) -> WtpRetransmissionDecision {
    if let Some(suffix) = raw.strip_prefix("send-") {
        let attempt = suffix
            .parse::<u8>()
            .unwrap_or_else(|_| panic!("invalid send decision value {raw}"));
        return WtpRetransmissionDecision::Send(attempt);
    }
    if let Some(suffix) = raw.strip_prefix("holdoff-") {
        let delay_ms = suffix
            .parse::<u64>()
            .unwrap_or_else(|_| panic!("invalid holdoff decision value {raw}"));
        return WtpRetransmissionDecision::HoldOff(delay_ms);
    }
    match raw {
        "retry-exhausted" => WtpRetransmissionDecision::RetryExhausted,
        "completed" => WtpRetransmissionDecision::Completed,
        other => panic!("unknown retransmission decision {other}"),
    }
}

fn run_retransmission_fixture_case(case: &WtpRetransmissionFixtureCase) {
    let mut state = case.initial_state;
    for (index, raw_event) in case.events.iter().enumerate() {
        let event = parse_retransmission_event(raw_event);
        let expected_decision = parse_retransmission_decision(&case.expected_decisions[index]);
        let expected_delay = case.expected_delays_ms[index];
        let (decision, next_state, trace) = decide_retransmission(&case.policy, &state, event);
        assert_eq!(
            decision, expected_decision,
            "case '{}' failed at event index {}",
            case.name, index
        );
        assert_eq!(
            trace.delay_ms, expected_delay,
            "case '{}' delay mismatch at event index {}",
            case.name, index
        );
        state = next_state;
        assert_eq!(
            trace.event, event,
            "case '{}' event mismatch at index {}",
            case.name, index
        );
    }
    if let Some(expected_state) = case.expected_state {
        assert_eq!(
            state, expected_state,
            "case '{}' final state mismatch",
            case.name
        );
    }
}

fn run_duplicate_cache_fixture_case(case: &WtpDuplicateCacheCase) {
    let mut state = WtpDuplicateCacheState::new();
    assert_eq!(
        case.events.len(),
        case.expected_decisions.len(),
        "case '{}' event and expected decision count must match",
        case.name
    );

    for (index, event) in case.events.iter().enumerate() {
        let raw_decision = &case.expected_decisions[index];
        let expected_decision = parse_dup_decision(raw_decision);
        let (decision, _trace) = state.decide(&case.policy, event.tid, event.is_terminal_result);
        assert_eq!(
            decision, expected_decision,
            "case '{}' failed at event index {}",
            case.name, index
        );
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WspPrimitiveProfileInput {
    mode: String,
    push_allowed: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WspPrimitiveStateInput {
    awaiting_result: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WspPrimitiveCaseInput {
    name: String,
    state: WspPrimitiveStateInput,
    primitive: String,
    direction: String,
    expected: String,
    expected_awaiting_result: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WspPrimitiveProfileScenario {
    name: String,
    policy: WspPrimitiveProfileInput,
    cases: Vec<WspPrimitiveCaseInput>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WspPrimitiveProfileFixture {
    scenarios: Vec<WspPrimitiveProfileScenario>,
}

fn parse_wsp_primitive_profile_mode(value: &str) -> WspPrimitiveProfileMode {
    match value {
        "connection-oriented" => WspPrimitiveProfileMode::ConnectionOriented,
        "connectionless" => WspPrimitiveProfileMode::Connectionless,
        "both" => WspPrimitiveProfileMode::Both,
        other => panic!("unknown WSP profile mode {other}"),
    }
}

fn parse_primitive(value: &str) -> WspServicePrimitive {
    match value {
        "S-Unit-MethodInvoke" => WspServicePrimitive::MethodInvoke,
        "S-Unit-MethodResult" => WspServicePrimitive::MethodResult,
        "S-Unit-Push" => WspServicePrimitive::Push,
        other => panic!("unknown WSP primitive {other}"),
    }
}

fn parse_direction(value: &str) -> WspPrimitiveDirection {
    match value {
        "req" => WspPrimitiveDirection::Req,
        "ind" => WspPrimitiveDirection::Ind,
        "res" => WspPrimitiveDirection::Res,
        "cnf" => WspPrimitiveDirection::Cnf,
        other => panic!("unknown WSP primitive direction {other}"),
    }
}

fn expect_wsp_primitive_decision(expected: &str) -> WspPrimitiveDecision {
    match expected {
        "accept" => WspPrimitiveDecision::Accept,
        "reject-unsupported-mode" => WspPrimitiveDecision::RejectUnsupportedMode,
        "reject-primitive" => WspPrimitiveDecision::RejectPrimitive,
        "reject-direction" => WspPrimitiveDecision::RejectDirection,
        "reject-sequence" => WspPrimitiveDecision::RejectSequence,
        other => panic!("unknown WSP primitive decision {other}"),
    }
}

mod fetch_mapping;
mod replay_profiles;
mod request_gateway_policy;
mod wbxml_env;
