use lowband_transport_rust::network::wdp::{WdpAddress, WdpDatagram, WdpServicePort};
use lowband_transport_rust::network::wsp::{
    decode_wsp_session_event, WspEncodingVersion, WspHeaderBlockDecodePolicy, WspMethod,
    WspSessionEvent, WspSessionMode,
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
    datagrams: Vec<ReplayDatagram>,
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

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
enum ReplayDirection {
    Uplink,
    Downlink,
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

fn replay_case(case: &ReplayCase) -> Vec<ReplayEvent> {
    let mut out = Vec::new();

    for input in &case.datagrams {
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
                .unwrap_or_else(|error| panic!("case '{}' WSP decode failed: {error}", case.name));

        match session_event {
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
