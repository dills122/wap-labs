use crate::fetch_policy::{resolve_fetch_destination_addresses, FetchDestinationError};
use crate::network::wdp::transport_trait::{DatagramTransport, WdpError};
use crate::network::wdp::{
    UdpDatagramTransport, UdpDatagramTransportConfig, WdpAddress, WdpDatagram,
};
use crate::network::wsp::connectionless::{
    decode_connectionless_reply, encode_connectionless_request, WspConnectionlessEncodeError,
    WspConnectionlessMethod, WspConnectionlessRequest,
};
use crate::network::wsp::header_block::{WspHeaderBlock, WspHeaderField, WspHeaderNameEncoding};
use crate::network::wsp::header_registry::DEFAULT_HEADER_CODE_PAGE;
use crate::request_meta::log_transport_event;
use crate::responses::{
    invalid_request_response, map_success_payload_response, map_terminal_send_error,
    FetchAttemptFailure, SuccessPayloadParams,
};
use crate::{FetchDeckResponse, FetchDestinationPolicy};
use std::collections::HashMap;
use std::fmt::Write as _;
use std::net::SocketAddr;
use std::time::Instant;
use url::Url;

pub const TRANSPORT_PROFILE_ENV: &str = "LOWBAND_TRANSPORT_PROFILE";
pub const TRANSPORT_PROFILE_GATEWAY_BRIDGED: &str = "gateway-bridged";
pub const TRANSPORT_PROFILE_WAP_NET_CORE: &str = "wap-net-core";
const CONNECTIONLESS_INITIAL_TRANSACTION_ID: u8 = 1;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum TransportProfile {
    GatewayBridged,
    WapNetCore,
}

pub(crate) struct NativeFetchPlan {
    pub(crate) request_url: String,
    pub(crate) method: String,
    pub(crate) outbound_headers: HashMap<String, String>,
    pub(crate) post_body: Option<Vec<u8>>,
    pub(crate) post_content_type: Option<String>,
    pub(crate) timeout_ms: u64,
    pub(crate) attempts: u8,
    pub(crate) request_id: Option<String>,
    pub(crate) destination_policy: FetchDestinationPolicy,
}

/// Media type this transport negotiates when the caller sends no `Accept`.
const DEFAULT_ACCEPT_MEDIA: &str = "application/vnd.wap.wmlc";

/// Failure while building the connectionless request for a native fetch plan.
#[derive(Debug)]
enum NativeRequestEncodeError {
    UnsupportedMethod(String),
    InvalidRequestUri(String),
    Wsp(WspConnectionlessEncodeError),
}

impl std::fmt::Display for NativeRequestEncodeError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedMethod(method) => {
                write!(formatter, "unsupported native WSP method: {method}")
            }
            Self::InvalidRequestUri(message) => formatter.write_str(message),
            Self::Wsp(error) => write!(formatter, "{error}"),
        }
    }
}

pub(crate) fn active_transport_profile() -> TransportProfile {
    match std::env::var(TRANSPORT_PROFILE_ENV)
        .unwrap_or_else(|_| TRANSPORT_PROFILE_GATEWAY_BRIDGED.to_string())
        .trim()
        .to_ascii_lowercase()
        .as_str()
    {
        TRANSPORT_PROFILE_WAP_NET_CORE => TransportProfile::WapNetCore,
        _ => TransportProfile::GatewayBridged,
    }
}

pub(crate) fn should_use_native_wap_request(parsed: &Url, method: &str) -> bool {
    matches!(active_transport_profile(), TransportProfile::WapNetCore)
        && matches!(parsed.scheme(), "wap" | "waps")
        && matches!(method, "GET" | "POST")
}

pub(crate) fn execute_native_wap_request(plan: NativeFetchPlan) -> FetchDeckResponse {
    let parsed = match Url::parse(&plan.request_url) {
        Ok(parsed) => parsed,
        Err(error) => {
            return map_terminal_send_error(
                plan.request_url,
                format!("invalid wap url: {error}"),
                plan.attempts,
                1,
                false,
                0.0,
                plan.request_id.as_deref(),
            );
        }
    };

    let peer = match resolve_destination_socket_addr(&parsed, &plan.destination_policy) {
        Ok(peer) => peer,
        Err(error) => {
            return map_destination_resolution_error(
                plan.request_url,
                error,
                plan.attempts,
                plan.request_id.as_deref(),
            );
        }
    };

    let bind_address = default_bind_address(&peer);
    let mut transport = match UdpDatagramTransport::new(UdpDatagramTransportConfig {
        bind_address,
        read_timeout_ms: Some(plan.timeout_ms),
    }) {
        Ok(transport) => transport,
        Err(error) => {
            return map_terminal_send_error(
                plan.request_url,
                error.to_string(),
                plan.attempts,
                1,
                matches!(error, WdpError::Timeout),
                0.0,
                plan.request_id.as_deref(),
            );
        }
    };

    execute_native_wap_request_with_transport(&mut transport, peer, plan)
}

pub(crate) fn execute_native_wap_request_with_transport(
    transport: &mut impl DatagramTransport,
    peer: SocketAddr,
    plan: NativeFetchPlan,
) -> FetchDeckResponse {
    let parsed = match Url::parse(&plan.request_url) {
        Ok(parsed) => parsed,
        Err(error) => {
            return map_terminal_send_error(
                plan.request_url,
                format!("invalid wap url: {error}"),
                plan.attempts,
                1,
                false,
                0.0,
                plan.request_id.as_deref(),
            );
        }
    };

    warn_if_unprotected_waps_scheme(&parsed, plan.request_id.as_deref(), &plan.request_url);

    let transaction_id = CONNECTIONLESS_INITIAL_TRANSACTION_ID;
    let encoded_request = match encode_native_wap_request(
        transaction_id,
        &plan.method,
        &parsed,
        &plan.outbound_headers,
        plan.post_content_type.as_deref(),
        plan.post_body.as_deref(),
    ) {
        Ok(encoded) => encoded,
        Err(error) => {
            return map_terminal_send_error(
                plan.request_url,
                format!("failed to encode native WSP {}: {error}", plan.method),
                plan.attempts,
                1,
                false,
                0.0,
                plan.request_id.as_deref(),
            );
        }
    };

    let mut failure = FetchAttemptFailure::default();

    for attempt in 1..=plan.attempts {
        let send_start = Instant::now();
        let outbound = WdpDatagram {
            src_addr: WdpAddress::unspecified(),
            dst_addr: WdpAddress::from_socket_addr(peer),
            src_port: 0,
            dst_port: peer.port(),
            payload: encoded_request.clone(),
        };

        log_transport_event(
            "transport.fetch.native.attempt",
            plan.request_id.as_deref(),
            &plan.request_url,
            serde_json::json!({
                "attempt": attempt,
                "attempts": plan.attempts,
                "peer": peer.to_string(),
                "payloadLen": outbound.payload.len()
            }),
        );

        if let Err(error) = transport.send(&outbound) {
            failure.record(
                error.to_string(),
                matches!(error, WdpError::Timeout),
                send_start.elapsed().as_secs_f64() * 1000.0,
            );
            continue;
        }

        match transport.receive() {
            Ok(reply_datagram) => {
                let elapsed_ms = send_start.elapsed().as_secs_f64() * 1000.0;
                let reply =
                    match decode_connectionless_reply(transaction_id, &reply_datagram.payload) {
                        Ok(reply) => reply,
                        Err(error) => {
                            return map_terminal_send_error(
                                plan.request_url,
                                format!(
                                    "failed to decode native WSP reply: {error} (payload={})",
                                    hex_bytes(&reply_datagram.payload)
                                ),
                                plan.attempts,
                                attempt,
                                false,
                                elapsed_ms,
                                plan.request_id.as_deref(),
                            );
                        }
                    };

                return map_success_payload_response(SuccessPayloadParams {
                    status: reply.status_code,
                    is_wap_scheme: true,
                    request_url: &plan.request_url,
                    upstream_url: &plan.request_url,
                    final_url: plan.request_url.clone(),
                    content_type: reply.content_type,
                    body: &reply.body,
                    attempt,
                    elapsed_ms,
                    request_id: plan.request_id.as_deref(),
                });
            }
            Err(error) => {
                failure.record(
                    error.to_string(),
                    matches!(error, WdpError::Timeout),
                    send_start.elapsed().as_secs_f64() * 1000.0,
                );
            }
        }
    }

    failure.into_terminal_response(
        plan.request_url,
        plan.attempts,
        plan.attempts,
        plan.request_id.as_deref(),
    )
}

fn default_bind_address(peer: &SocketAddr) -> String {
    if peer.is_ipv4() {
        "0.0.0.0:0".to_string()
    } else {
        "[::]:0".to_string()
    }
}

fn resolve_destination_socket_addr(
    parsed: &Url,
    destination_policy: &FetchDestinationPolicy,
) -> Result<SocketAddr, FetchDestinationError> {
    let host = parsed.host_str().ok_or_else(|| {
        FetchDestinationError::Unresolvable("wap url must include a host".to_string())
    })?;
    let port = parsed
        .port()
        .unwrap_or_else(|| default_service_port(parsed.scheme()));
    resolve_fetch_destination_addresses(host, port, destination_policy)?
        .into_iter()
        .next()
        .ok_or_else(|| {
            FetchDestinationError::Unresolvable(format!("failed to resolve wap host {host}:{port}"))
        })
}

fn map_destination_resolution_error(
    request_url: String,
    error: FetchDestinationError,
    attempts: u8,
    request_id: Option<&str>,
) -> FetchDeckResponse {
    let message = error.to_string();
    if error.is_policy_blocked() {
        invalid_request_response(request_url, message, request_id)
    } else {
        map_terminal_send_error(request_url, message, attempts, 1, false, 0.0, request_id)
    }
}

fn default_service_port(scheme: &str) -> u16 {
    match scheme {
        "waps" => 9202,
        _ => 9200,
    }
}

/// `waps://` selects the WTLS-secured port (9202) by URL convention, but this crate does not
/// yet invoke `network::wtls` from any live send path -- `encode_native_wap_request` produces
/// the identical unprotected connectionless-WSP payload for `wap://` and `waps://` alike. This
/// is the explicitly decided, temporary state from
/// `docs/architecture/decisions/0002-separate-modern-security-from-wtls-compatibility.md`
/// (development/interoperability `waps://` may stay available while WTLS is deferred, but "it
/// reports no established security, emits an unavoidable warning"), tracked as `WTLS-00` in
/// `docs/architecture/wtls-modernization-research.md`. Do not remove this warning by treating a
/// `waps://` request as secure until `WTLS-08` ("Integrate live secure routes") actually routes
/// it through a conformance-tested WTLS codec and returns a real `SecurityOutcome`.
fn warn_if_unprotected_waps_scheme(parsed: &Url, request_id: Option<&str>, request_url: &str) {
    if let Some(payload) = unprotected_waps_warning_payload(parsed.scheme()) {
        log_transport_event(
            "transport.fetch.native.security",
            request_id,
            request_url,
            payload,
        );
    }
}

/// Pure decision half of [`warn_if_unprotected_waps_scheme`], split out so the warning payload
/// is unit-testable without capturing stdout.
fn unprotected_waps_warning_payload(scheme: &str) -> Option<serde_json::Value> {
    if scheme != "waps" {
        return None;
    }
    Some(serde_json::json!({
        "scheme": "waps",
        "protected": false,
        "reason": "wtls-not-implemented",
        "reference": "WTLS-00"
    }))
}

fn request_uri(parsed: &Url) -> String {
    let path = if parsed.path().is_empty() {
        "/"
    } else {
        parsed.path()
    };
    match parsed.query() {
        Some(query) => format!("{path}?{query}"),
        None => path.to_string(),
    }
}

fn build_kannel_request_uri(parsed: &Url) -> Result<String, String> {
    let host = parsed
        .host_str()
        .ok_or_else(|| "wap url must include a host".to_string())?;
    let logical_port = parsed
        .port()
        .unwrap_or_else(|| default_http_port_for_host(host));
    let scheme = match parsed.scheme() {
        "waps" => "https",
        _ => "http",
    };
    let host = if host.contains(':') {
        format!("[{host}]")
    } else {
        host.to_string()
    };
    let path = request_uri(parsed);
    let authority = match (scheme, logical_port) {
        ("http", 80) | ("https", 443) => host,
        _ => format!("{host}:{logical_port}"),
    };
    Ok(format!("{scheme}://{authority}{path}"))
}

fn default_http_port_for_host(host: &str) -> u16 {
    match host {
        "localhost" | "127.0.0.1" | "::1" => 13002,
        _ => 80,
    }
}

/// Builds the connectionless WSP request wire bytes for a native fetch plan.
///
/// All wire-format concerns live in `crate::network::wsp::connectionless`; this
/// function only maps fetch-level inputs (HTTP-style method, parsed URL, the
/// outbound header map) onto that codec's inputs.
fn encode_native_wap_request(
    transaction_id: u8,
    method: &str,
    parsed: &Url,
    headers: &HashMap<String, String>,
    post_content_type: Option<&str>,
    post_body: Option<&[u8]>,
) -> Result<Vec<u8>, NativeRequestEncodeError> {
    let method = WspConnectionlessMethod::from_http_method(method)
        .ok_or_else(|| NativeRequestEncodeError::UnsupportedMethod(method.to_string()))?;
    let uri =
        build_kannel_request_uri(parsed).map_err(NativeRequestEncodeError::InvalidRequestUri)?;
    let header_block = connectionless_request_headers(headers);

    encode_connectionless_request(&WspConnectionlessRequest {
        transaction_id,
        method,
        uri: &uri,
        headers: &header_block,
        content_type: post_content_type,
        body: post_body.unwrap_or(&[]),
    })
    .map_err(NativeRequestEncodeError::Wsp)
}

/// Negotiates the single `Accept` media type this transport advertises.
///
/// Only the two WML media types are negotiable; anything else advertises
/// nothing rather than forwarding an unrepresentable `Accept` value.
fn negotiated_accept_media(headers: &HashMap<String, String>) -> Option<&'static str> {
    let accept_value = headers
        .get("Accept")
        .map(String::as_str)
        .unwrap_or(DEFAULT_ACCEPT_MEDIA);
    if accept_value.contains("application/vnd.wap.wmlc") {
        Some("application/vnd.wap.wmlc")
    } else if accept_value.contains("text/vnd.wap.wml") {
        Some("text/vnd.wap.wml")
    } else {
        None
    }
}

fn connectionless_request_headers(headers: &HashMap<String, String>) -> WspHeaderBlock {
    let mut block = WspHeaderBlock::default();
    if let Some(media) = negotiated_accept_media(headers) {
        block.headers.push(WspHeaderField {
            name: "Accept".to_string(),
            value: media.to_string(),
            name_encoding: WspHeaderNameEncoding::Binary {
                page: DEFAULT_HEADER_CODE_PAGE,
            },
        });
    }
    block
}

fn hex_bytes(bytes: &[u8]) -> String {
    let mut out = String::new();
    for (index, byte) in bytes.iter().enumerate() {
        if index > 0 {
            out.push(' ');
        }
        let _ = write!(&mut out, "{byte:02X}");
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fetch_policy::DestinationHostClass;
    use crate::network::wdp::transport_trait::WdpResult;
    use crate::network::wsp::connectionless::{decode_uintvar, encode_uintvar};
    use std::sync::{Mutex, OnceLock};

    #[test]
    fn unprotected_waps_warning_payload_flags_waps_scheme() {
        let payload = unprotected_waps_warning_payload("waps").expect("waps must warn");
        assert_eq!(payload["scheme"], "waps");
        assert_eq!(payload["protected"], false);
        assert_eq!(payload["reason"], "wtls-not-implemented");
        assert_eq!(payload["reference"], "WTLS-00");
    }

    #[test]
    fn unprotected_waps_warning_payload_is_silent_for_wap_scheme() {
        assert_eq!(unprotected_waps_warning_payload("wap"), None);
    }

    struct FakeDatagramTransport {
        sent: Vec<WdpDatagram>,
        next_receive: WdpResult<WdpDatagram>,
    }

    impl DatagramTransport for FakeDatagramTransport {
        fn send(&mut self, datagram: &WdpDatagram) -> WdpResult<()> {
            self.sent.push(datagram.clone());
            Ok(())
        }

        fn receive(&mut self) -> WdpResult<WdpDatagram> {
            self.next_receive.clone()
        }
    }

    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    fn with_env_var_locked<T>(name: &str, value: &str, f: impl FnOnce() -> T) -> T {
        let _guard = env_lock().lock().expect("env lock should succeed");
        let previous = std::env::var(name).ok();
        std::env::set_var(name, value);
        let out = f();
        if let Some(previous) = previous {
            std::env::set_var(name, previous);
        } else {
            std::env::remove_var(name);
        }
        out
    }

    fn with_env_removed_locked<T>(name: &str, f: impl FnOnce() -> T) -> T {
        let _guard = env_lock().lock().expect("env lock should succeed");
        let previous = std::env::var(name).ok();
        std::env::remove_var(name);
        let out = f();
        if let Some(previous) = previous {
            std::env::set_var(name, previous);
        }
        out
    }

    fn detail_string(response: &FetchDeckResponse, key: &str) -> Option<String> {
        response
            .error
            .as_ref()
            .and_then(|error| error.details.as_ref())
            .and_then(|details| details.get(key))
            .and_then(|value| value.as_str())
            .map(str::to_string)
    }

    fn build_connectionless_reply_wire(
        transaction_id: u8,
        status: u8,
        content_type: u8,
        body: &[u8],
    ) -> Vec<u8> {
        let headers_len = encode_uintvar(1).expect("single-octet content type should encode");
        let mut wire = vec![transaction_id, 0x04, status];
        wire.extend_from_slice(&headers_len);
        wire.push(content_type | 0x80);
        wire.extend_from_slice(body);
        wire
    }

    #[test]
    fn transport_profile_defaults_to_gateway_bridge() {
        let profile = with_env_removed_locked(TRANSPORT_PROFILE_ENV, active_transport_profile);
        assert_eq!(profile, TransportProfile::GatewayBridged);
    }

    #[test]
    fn transport_profile_selects_native_mode_when_configured() {
        let profile = with_env_var_locked(
            TRANSPORT_PROFILE_ENV,
            TRANSPORT_PROFILE_WAP_NET_CORE,
            active_transport_profile,
        );
        assert_eq!(profile, TransportProfile::WapNetCore);
    }

    #[test]
    fn native_mode_gate_only_applies_to_wap_get_and_post_requests() {
        let parsed = Url::parse("wap://localhost/").expect("url should parse");
        let native = with_env_var_locked(
            TRANSPORT_PROFILE_ENV,
            TRANSPORT_PROFILE_WAP_NET_CORE,
            || should_use_native_wap_request(&parsed, "GET"),
        );
        assert!(native);

        let post = with_env_var_locked(
            TRANSPORT_PROFILE_ENV,
            TRANSPORT_PROFILE_WAP_NET_CORE,
            || should_use_native_wap_request(&parsed, "POST"),
        );
        assert!(post);
    }

    #[test]
    fn native_fetch_roundtrip_maps_reply_to_normalized_response() {
        let request_url = "wap://127.0.0.1/login".to_string();
        let peer: SocketAddr = "127.0.0.1:9200".parse().expect("literal should parse");
        let encoded_reply = build_connectionless_reply_wire(
            CONNECTIONLESS_INITIAL_TRANSACTION_ID,
            0x20,
            0x08,
            br#"<?xml version="1.0"?><wml><card id="login"/></wml>"#,
        );
        let reply_datagram = WdpDatagram {
            src_addr: WdpAddress::ipv4([127, 0, 0, 1]),
            dst_addr: WdpAddress::ipv4([127, 0, 0, 1]),
            src_port: 9200,
            dst_port: 49152,
            payload: encoded_reply,
        };
        let mut transport = FakeDatagramTransport {
            sent: Vec::new(),
            next_receive: Ok(reply_datagram),
        };

        let response = execute_native_wap_request_with_transport(
            &mut transport,
            peer,
            NativeFetchPlan {
                request_url: request_url.clone(),
                method: "GET".to_string(),
                outbound_headers: HashMap::from([(
                    "Accept".to_string(),
                    "text/vnd.wap.wml".to_string(),
                )]),
                post_body: None,
                post_content_type: None,
                timeout_ms: 200,
                attempts: 1,
                request_id: Some("req-native-get".to_string()),
                destination_policy: FetchDestinationPolicy::AllowPrivate,
            },
        );

        assert!(response.ok);
        assert_eq!(response.final_url, request_url);
        assert_eq!(response.content_type, "text/vnd.wap.wml");
        assert!(response
            .wml
            .as_deref()
            .unwrap_or_default()
            .contains("card id=\"login\""));
        assert_eq!(transport.sent.len(), 1);

        let sent = &transport.sent[0];
        assert_eq!(sent.dst_port, 9200);
        assert_eq!(
            sent.payload.first().copied(),
            Some(CONNECTIONLESS_INITIAL_TRANSACTION_ID)
        );
        assert_eq!(sent.payload.get(1).copied(), Some(0x40));
        let (uri_len, rest) = decode_uintvar(&sent.payload[2..]).expect("uri length should decode");
        let uri = std::str::from_utf8(&rest[..uri_len]).expect("uri should be utf8");
        assert_eq!(uri, "http://127.0.0.1:13002/login");
        assert_eq!(&rest[uri_len..], &[0x80, 0x88]);
    }

    #[test]
    fn native_fetch_timeout_maps_transport_timeout() {
        let mut transport = FakeDatagramTransport {
            sent: Vec::new(),
            next_receive: Err(WdpError::Timeout),
        };
        let response = execute_native_wap_request_with_transport(
            &mut transport,
            "127.0.0.1:9200".parse().expect("literal should parse"),
            NativeFetchPlan {
                request_url: "wap://127.0.0.1/".to_string(),
                method: "GET".to_string(),
                outbound_headers: HashMap::new(),
                post_body: None,
                post_content_type: None,
                timeout_ms: 100,
                attempts: 1,
                request_id: Some("req-native-timeout".to_string()),
                destination_policy: FetchDestinationPolicy::AllowPrivate,
            },
        );

        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|error| error.code.as_str()),
            Some("GATEWAY_TIMEOUT")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-native-timeout")
        );
    }

    #[test]
    fn native_connectionless_wire_format_prefixes_transaction_id() {
        let parsed = Url::parse("wap://localhost/").expect("url should parse");
        let encoded = encode_native_wap_request(
            CONNECTIONLESS_INITIAL_TRANSACTION_ID,
            "GET",
            &parsed,
            &HashMap::new(),
            None,
            None,
        )
        .expect("request should encode");

        assert_eq!(
            encoded.first().copied(),
            Some(CONNECTIONLESS_INITIAL_TRANSACTION_ID)
        );
        assert_eq!(encoded.get(1).copied(), Some(0x40));
        let (uri_len, rest) = decode_uintvar(&encoded[2..]).expect("uri len should decode");
        let uri = std::str::from_utf8(&rest[..uri_len]).expect("uri should decode");
        assert_eq!(uri, "http://localhost:13002/");
        assert_eq!(&rest[uri_len..], &[0x80, 0x94]);
    }

    #[test]
    fn default_service_ports_match_wap_and_waps_defaults() {
        assert_eq!(default_service_port("wap"), 9200);
        assert_eq!(default_service_port("waps"), 9202);
    }

    #[test]
    fn request_uri_preserves_path_and_query() {
        let parsed = Url::parse("wap://example.test/login?step=1").expect("url should parse");
        assert_eq!(request_uri(&parsed), "/login?step=1");
    }

    #[test]
    fn build_kannel_request_uri_maps_loopback_and_secure_hosts() {
        let local = Url::parse("wap://localhost/register").expect("url should parse");
        let secure = Url::parse("waps://example.test/portal?sid=1").expect("url should parse");

        assert_eq!(
            build_kannel_request_uri(&local).expect("local uri should build"),
            "http://localhost:13002/register"
        );
        assert_eq!(
            build_kannel_request_uri(&secure).expect("secure uri should build"),
            "https://example.test:80/portal?sid=1"
        );
    }

    #[test]
    fn encode_native_wap_request_rejects_content_type_with_nul_bytes() {
        let parsed = Url::parse("wap://localhost/login").expect("url should parse");

        let error = encode_native_wap_request(
            CONNECTIONLESS_INITIAL_TRANSACTION_ID,
            "POST",
            &parsed,
            &HashMap::new(),
            Some("text/plain\0oops"),
            Some(b"a=1"),
        )
        .expect_err("content type with NUL should fail");

        assert!(error.to_string().contains("must not contain NUL bytes"));
    }

    #[test]
    fn encode_native_wap_request_rejects_unsupported_methods() {
        let parsed = Url::parse("wap://localhost/").expect("url should parse");

        let error = encode_native_wap_request(
            CONNECTIONLESS_INITIAL_TRANSACTION_ID,
            "HEAD",
            &parsed,
            &HashMap::new(),
            None,
            None,
        )
        .expect_err("HEAD is not a connectionless method this transport encodes");

        assert_eq!(error.to_string(), "unsupported native WSP method: HEAD");
    }

    #[test]
    fn connectionless_request_headers_negotiate_a_single_accept_media_type() {
        assert_eq!(
            negotiated_accept_media(&HashMap::new()),
            Some("application/vnd.wap.wmlc"),
            "missing Accept must fall back to the compiled WML media type"
        );
        assert_eq!(
            negotiated_accept_media(&HashMap::from([(
                "Accept".to_string(),
                "text/vnd.wap.wml".to_string()
            )])),
            Some("text/vnd.wap.wml")
        );
        assert_eq!(
            negotiated_accept_media(&HashMap::from([(
                "Accept".to_string(),
                "application/json".to_string()
            )])),
            None,
            "unrepresentable Accept values advertise nothing"
        );
        assert!(connectionless_request_headers(&HashMap::from([(
            "Accept".to_string(),
            "application/json".to_string()
        )]))
        .headers
        .is_empty());
    }

    #[test]
    fn resolve_destination_socket_addr_uses_default_ports() {
        let wap = Url::parse("wap://127.0.0.1/").expect("url should parse");
        let waps = Url::parse("waps://127.0.0.1/").expect("url should parse");

        assert_eq!(
            resolve_destination_socket_addr(&wap, &FetchDestinationPolicy::AllowPrivate)
                .expect("wap addr should resolve"),
            "127.0.0.1:9200".parse().expect("literal should parse")
        );
        assert_eq!(
            resolve_destination_socket_addr(&waps, &FetchDestinationPolicy::AllowPrivate)
                .expect("waps addr should resolve"),
            "127.0.0.1:9202".parse().expect("literal should parse")
        );
    }

    #[test]
    fn resolve_destination_socket_addr_rejects_private_peer_under_public_only() {
        let wap = Url::parse("wap://127.0.0.1/").expect("url should parse");

        let error = resolve_destination_socket_addr(&wap, &FetchDestinationPolicy::PublicOnly)
            .expect_err("public-only must reject a resolved loopback peer");

        assert!(error.is_policy_blocked());
        assert!(error.to_string().contains("public-only"));
        assert!(error.to_string().contains("loopback"));
    }

    #[test]
    fn native_destination_policy_failure_maps_invalid_request() {
        let response = map_destination_resolution_error(
            "wap://private.test/".to_string(),
            FetchDestinationError::blocked_resolved_address(DestinationHostClass::Private),
            1,
            Some("req-native-policy"),
        );

        assert_eq!(
            response.error.as_ref().map(|error| error.code.as_str()),
            Some("INVALID_REQUEST")
        );
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("req-native-policy")
        );
    }

    #[test]
    fn native_destination_resolution_failure_maps_transport_error() {
        let response = map_destination_resolution_error(
            "wap://unknown.invalid/".to_string(),
            FetchDestinationError::Unresolvable("failed to resolve wap host x:9200".to_string()),
            2,
            Some("req-native-dns"),
        );

        assert_eq!(
            response.error.as_ref().map(|error| error.code.as_str()),
            Some("TRANSPORT_UNAVAILABLE"),
            "non-policy resolution failures must not be classified as INVALID_REQUEST"
        );
    }

    #[test]
    fn native_connectionless_post_wire_format_encodes_header_block_and_body() {
        let parsed = Url::parse("wap://localhost/login").expect("url should parse");
        let encoded = encode_native_wap_request(
            CONNECTIONLESS_INITIAL_TRANSACTION_ID,
            "POST",
            &parsed,
            &HashMap::from([("Accept".to_string(), "text/vnd.wap.wml".to_string())]),
            Some("application/x-www-form-urlencoded"),
            Some(b"username=alice&pin=0000"),
        )
        .expect("post request should encode");

        assert_eq!(
            encoded.first().copied(),
            Some(CONNECTIONLESS_INITIAL_TRANSACTION_ID)
        );
        assert_eq!(encoded.get(1).copied(), Some(0x60));
        let (uri_len, remainder) = decode_uintvar(&encoded[2..]).expect("uri len should decode");
        let (headers_len, remainder) =
            decode_uintvar(remainder).expect("headers len should decode");
        let uri = std::str::from_utf8(&remainder[..uri_len]).expect("uri should decode");
        assert_eq!(uri, "http://localhost:13002/login");
        let remainder = &remainder[uri_len..];
        assert_eq!(headers_len, 36);
        assert_eq!(
            &remainder[..headers_len],
            &[
                b'a', b'p', b'p', b'l', b'i', b'c', b'a', b't', b'i', b'o', b'n', b'/', b'x', b'-',
                b'w', b'w', b'w', b'-', b'f', b'o', b'r', b'm', b'-', b'u', b'r', b'l', b'e', b'n',
                b'c', b'o', b'd', b'e', b'd', 0x00, 0x80, 0x88,
            ]
        );
        assert_eq!(&remainder[headers_len..], b"username=alice&pin=0000");
    }

    #[test]
    fn native_connectionless_post_wire_format_preserves_resolved_form_payload_variants() {
        let parsed = Url::parse("wap://localhost/login").expect("url should parse");
        let payloads = [
            "username=tester&pin=1220",
            "username=usern1220&pin=1200",
            "username=var-user&pin=2222",
        ];

        for payload in payloads {
            let encoded = encode_native_wap_request(
                CONNECTIONLESS_INITIAL_TRANSACTION_ID,
                "POST",
                &parsed,
                &HashMap::from([("Accept".to_string(), "text/vnd.wap.wml".to_string())]),
                Some("application/x-www-form-urlencoded"),
                Some(payload.as_bytes()),
            )
            .expect("post request should encode");

            assert_eq!(encoded.get(1).copied(), Some(0x60));
            let (uri_len, remainder) =
                decode_uintvar(&encoded[2..]).expect("uri len should decode");
            let (headers_len, remainder) =
                decode_uintvar(remainder).expect("headers len should decode");
            let remainder = &remainder[uri_len..];
            let body = &remainder[headers_len..];
            let body_str = std::str::from_utf8(body).expect("body should decode");
            let fields: HashMap<String, String> = url::form_urlencoded::parse(body)
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect();

            assert_eq!(body_str, payload, "encoded body should preserve payload");
            assert!(
                !fields["username"].is_empty(),
                "username should be non-empty"
            );
            assert!(!fields["pin"].is_empty(), "pin should be non-empty");
        }
    }

    #[test]
    fn native_connectionless_reply_mismatch_maps_terminal_transport_error() {
        // Codec-level reply decoding is covered in
        // `crate::network::wsp::connectionless`; this pins how a decode failure
        // surfaces through the fetch path.
        let reply_datagram = WdpDatagram {
            src_addr: WdpAddress::ipv4([127, 0, 0, 1]),
            dst_addr: WdpAddress::ipv4([127, 0, 0, 1]),
            src_port: 9200,
            dst_port: 49152,
            payload: build_connectionless_reply_wire(9, 0x20, 0x08, &[]),
        };
        let mut transport = FakeDatagramTransport {
            sent: Vec::new(),
            next_receive: Ok(reply_datagram),
        };

        let response = execute_native_wap_request_with_transport(
            &mut transport,
            "127.0.0.1:9200".parse().expect("literal should parse"),
            NativeFetchPlan {
                request_url: "wap://127.0.0.1/".to_string(),
                method: "GET".to_string(),
                outbound_headers: HashMap::new(),
                post_body: None,
                post_content_type: None,
                timeout_ms: 200,
                attempts: 1,
                request_id: Some("req-native-mismatch".to_string()),
                destination_policy: FetchDestinationPolicy::AllowPrivate,
            },
        );

        assert!(!response.ok);
        assert_eq!(
            response.error.as_ref().map(|error| error.code.as_str()),
            Some("TRANSPORT_UNAVAILABLE")
        );
        assert!(response
            .error
            .as_ref()
            .map(|error| error
                .message
                .contains("unexpected native WSP reply transaction id"))
            .unwrap_or(false));
    }
}
