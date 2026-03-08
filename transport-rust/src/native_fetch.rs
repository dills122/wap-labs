use crate::network::wdp::transport_trait::{DatagramTransport, WdpError};
use crate::network::wdp::{
    UdpDatagramTransport, UdpDatagramTransportConfig, WdpAddress, WdpDatagram,
};
use crate::request_meta::log_transport_event;
use crate::responses::{
    map_success_payload_response, map_terminal_send_error, normalize_content_type,
};
use crate::FetchDeckResponse;
use std::collections::HashMap;
use std::fmt::Write as _;
use std::net::{SocketAddr, ToSocketAddrs};
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
}

#[derive(Debug)]
struct NativeReply {
    status_code: u16,
    content_type: String,
    body: Vec<u8>,
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

    let peer = match resolve_destination_socket_addr(&parsed) {
        Ok(peer) => peer,
        Err(error) => {
            return map_terminal_send_error(
                plan.request_url,
                error,
                plan.attempts,
                1,
                false,
                0.0,
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

    let transaction_id = CONNECTIONLESS_INITIAL_TRANSACTION_ID;
    let encoded_request = match encode_connectionless_request(
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

    let mut last_error = "Retries exhausted".to_string();
    let mut last_is_timeout = false;
    let mut last_elapsed_ms = 0.0_f64;

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
            last_error = error.to_string();
            last_is_timeout = matches!(error, WdpError::Timeout);
            last_elapsed_ms = send_start.elapsed().as_secs_f64() * 1000.0;
            continue;
        }

        match transport.receive() {
            Ok(reply_datagram) => {
                let elapsed_ms = send_start.elapsed().as_secs_f64() * 1000.0;
                let reply = match decode_connectionless_wsp_reply(
                    transaction_id,
                    &reply_datagram.payload,
                ) {
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

                return map_success_payload_response(
                    reply.status_code,
                    true,
                    &plan.request_url,
                    &plan.request_url,
                    plan.request_url.clone(),
                    normalize_content_type(Some(reply.content_type.as_str())),
                    &reply.body,
                    attempt,
                    elapsed_ms,
                    plan.request_id.as_deref(),
                );
            }
            Err(error) => {
                last_error = error.to_string();
                last_is_timeout = matches!(error, WdpError::Timeout);
                last_elapsed_ms = send_start.elapsed().as_secs_f64() * 1000.0;
            }
        }
    }

    map_terminal_send_error(
        plan.request_url,
        last_error,
        plan.attempts,
        plan.attempts,
        last_is_timeout,
        last_elapsed_ms,
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

fn resolve_destination_socket_addr(parsed: &Url) -> Result<SocketAddr, String> {
    let host = parsed
        .host_str()
        .ok_or_else(|| "wap url must include a host".to_string())?;
    let port = parsed
        .port()
        .unwrap_or_else(|| default_service_port(parsed.scheme()));
    let mut resolved = (host, port)
        .to_socket_addrs()
        .map_err(|error| format!("failed to resolve wap host {host}:{port}: {error}"))?;
    resolved
        .find(|addr| addr.is_ipv4() || addr.is_ipv6())
        .ok_or_else(|| format!("failed to resolve wap host {host}:{port}"))
}

fn default_service_port(scheme: &str) -> u16 {
    match scheme {
        "waps" => 9202,
        _ => 9200,
    }
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

fn encode_connectionless_request(
    transaction_id: u8,
    method: &str,
    parsed: &Url,
    headers: &HashMap<String, String>,
    post_content_type: Option<&str>,
    post_body: Option<&[u8]>,
) -> Result<Vec<u8>, String> {
    let uri = build_kannel_request_uri(parsed)?;
    let uri_bytes = uri.as_bytes();
    let encoded_headers = encode_connectionless_request_headers(headers);
    let encoded_content_type = encode_connectionless_content_type(post_content_type)?;
    let post_body = post_body.unwrap_or(&[]);
    let mut wire = Vec::with_capacity(
        uri_bytes.len() + encoded_content_type.len() + encoded_headers.len() + post_body.len() + 12,
    );
    wire.push(transaction_id);
    wire.push(match method {
        "GET" => 0x40,
        "POST" => 0x60,
        other => return Err(format!("unsupported native WSP method: {other}")),
    });
    if method == "GET" {
        wire.extend_from_slice(&encode_uintvar(uri_bytes.len())?);
        wire.extend_from_slice(uri_bytes);
        wire.extend_from_slice(&encoded_headers);
    } else {
        let headers_len = encoded_content_type.len() + encoded_headers.len();
        wire.extend_from_slice(&encode_uintvar(uri_bytes.len())?);
        wire.extend_from_slice(&encode_uintvar(headers_len)?);
        wire.extend_from_slice(uri_bytes);
        wire.extend_from_slice(&encoded_content_type);
        wire.extend_from_slice(&encoded_headers);
        wire.extend_from_slice(post_body);
    }
    Ok(wire)
}

fn encode_connectionless_request_headers(headers: &HashMap<String, String>) -> Vec<u8> {
    let mut out = Vec::new();
    let accept_value = headers
        .get("Accept")
        .map(String::as_str)
        .unwrap_or("application/vnd.wap.wmlc");
    if accept_value.contains("application/vnd.wap.wmlc") {
        out.extend_from_slice(&[0x80, 0x94]);
    } else if accept_value.contains("text/vnd.wap.wml") {
        out.extend_from_slice(&[0x80, 0x88]);
    }
    out
}

fn encode_connectionless_content_type(content_type: Option<&str>) -> Result<Vec<u8>, String> {
    let Some(content_type) = content_type
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(Vec::new());
    };

    if content_type.as_bytes().contains(&0x00) {
        return Err("native WSP POST content type must not contain NUL bytes".to_string());
    }
    let mut out = Vec::with_capacity(content_type.len() + 1);
    out.extend_from_slice(content_type.as_bytes());
    out.push(0x00);
    Ok(out)
}

fn decode_connectionless_wsp_reply(
    expected_transaction_id: u8,
    payload: &[u8],
) -> Result<NativeReply, String> {
    let Some((&transaction_id, body)) = payload.split_first() else {
        return Err("truncated native WSP reply: missing transaction id".to_string());
    };
    if transaction_id != expected_transaction_id {
        return Err(format!(
            "unexpected native WSP reply transaction id: expected {expected_transaction_id}, got {transaction_id}"
        ));
    }

    let Some((&pdu_type, body)) = body.split_first() else {
        return Err("truncated native WSP reply: missing pdu type".to_string());
    };
    if pdu_type != 0x04 {
        return Err(format!(
            "unexpected native WSP reply pdu type: expected 0x04, got 0x{pdu_type:02X}"
        ));
    }

    let Some((&status, body)) = body.split_first() else {
        return Err("truncated native WSP reply: missing status".to_string());
    };
    let (headers_len, body) = decode_uintvar(body)?;
    if body.len() < headers_len {
        return Err("truncated native WSP reply: headers section incomplete".to_string());
    }
    let (header_section, data) = body.split_at(headers_len);
    let (content_type, content_type_len) = decode_content_type_value(header_section)?;
    if content_type_len > header_section.len() {
        return Err("truncated native WSP reply: content type overruns header section".to_string());
    }

    Ok(NativeReply {
        status_code: decode_wsp_status_code(status)?,
        content_type,
        body: data.to_vec(),
    })
}

fn encode_uintvar(value: usize) -> Result<Vec<u8>, String> {
    if value > 0x0FFF_FFFF {
        return Err(format!("value too large for uintvar encoding: {value}"));
    }
    let mut chunks = [0u8; 5];
    let mut cursor = chunks.len();
    let mut remaining = value;
    loop {
        cursor -= 1;
        chunks[cursor] = (remaining & 0x7F) as u8;
        remaining >>= 7;
        if remaining == 0 {
            break;
        }
        chunks[cursor] |= 0x80;
    }
    let mut out = chunks[cursor..].to_vec();
    for index in 0..out.len().saturating_sub(1) {
        out[index] |= 0x80;
    }
    Ok(out)
}

fn decode_uintvar(input: &[u8]) -> Result<(usize, &[u8]), String> {
    let mut value = 0usize;
    for (index, byte) in input.iter().copied().enumerate().take(5) {
        value = (value << 7) | usize::from(byte & 0x7F);
        if byte & 0x80 == 0 {
            return Ok((value, &input[index + 1..]));
        }
    }
    Err("truncated uintvar".to_string())
}

fn decode_content_type_value(input: &[u8]) -> Result<(String, usize), String> {
    let Some((&first, _)) = input.split_first() else {
        return Err("truncated native WSP reply: missing content type".to_string());
    };
    if first & 0x80 != 0 {
        let media = decode_well_known_media(first & 0x7F)
            .ok_or_else(|| format!("unsupported well-known media type: 0x{:02X}", first & 0x7F))?;
        return Ok((media.to_string(), 1));
    }
    if first <= 31 {
        let length = usize::from(first);
        if input.len() < 1 + length {
            return Err(
                "truncated native WSP reply: content type general form incomplete".to_string(),
            );
        }
        let media = decode_text_string(&input[1..1 + length])?;
        return Ok((media, 1 + length));
    }
    let media = decode_text_string(input)?;
    Ok((media.clone(), media.len() + 1))
}

fn decode_text_string(input: &[u8]) -> Result<String, String> {
    let terminator = input
        .iter()
        .position(|byte| *byte == 0x00)
        .ok_or_else(|| "truncated native WSP text string".to_string())?;
    let content = if input.first().copied() == Some(0x7F) {
        &input[1..terminator]
    } else {
        &input[..terminator]
    };
    String::from_utf8(content.to_vec())
        .map_err(|error| format!("invalid utf-8 in native WSP text string: {error}"))
}

fn decode_wsp_status_code(status: u8) -> Result<u16, String> {
    match status {
        0x10 => Ok(100),
        0x11 => Ok(101),
        0x20..=0x26 => Ok(200 + u16::from(status - 0x20)),
        0x30..=0x37 => Ok(300 + u16::from(status - 0x30)),
        0x40..=0x51 => Ok(400 + u16::from(status - 0x40)),
        0x60..=0x65 => Ok(500 + u16::from(status - 0x60)),
        _ => Err(format!(
            "unsupported native WSP status code: 0x{status:02X}"
        )),
    }
}

fn decode_well_known_media(code: u8) -> Option<&'static str> {
    match code {
        0x03 => Some("text/plain"),
        0x08 => Some("text/vnd.wap.wml"),
        0x14 => Some("application/vnd.wap.wmlc"),
        0x28 => Some("text/xml"),
        0x29 => Some("application/xml"),
        _ => None,
    }
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
    use crate::network::wdp::transport_trait::WdpResult;
    use std::sync::{Mutex, OnceLock};

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
        let encoded = encode_connectionless_request(
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
    fn encode_connectionless_content_type_rejects_nul_bytes() {
        let error = encode_connectionless_content_type(Some("text/plain\0oops"))
            .expect_err("content type with NUL should fail");

        assert!(error.contains("must not contain NUL bytes"));
    }

    #[test]
    fn resolve_destination_socket_addr_uses_default_ports() {
        let wap = Url::parse("wap://127.0.0.1/").expect("url should parse");
        let waps = Url::parse("waps://127.0.0.1/").expect("url should parse");

        assert_eq!(
            resolve_destination_socket_addr(&wap).expect("wap addr should resolve"),
            "127.0.0.1:9200".parse().expect("literal should parse")
        );
        assert_eq!(
            resolve_destination_socket_addr(&waps).expect("waps addr should resolve"),
            "127.0.0.1:9202".parse().expect("literal should parse")
        );
    }

    #[test]
    fn native_connectionless_post_wire_format_encodes_header_block_and_body() {
        let parsed = Url::parse("wap://localhost/login").expect("url should parse");
        let encoded = encode_connectionless_request(
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
    fn native_connectionless_reply_rejects_transaction_id_mismatch() {
        let encoded = build_connectionless_reply_wire(9, 0x20, 0x08, &[]);

        let error =
            decode_connectionless_wsp_reply(CONNECTIONLESS_INITIAL_TRANSACTION_ID, &encoded)
                .expect_err("transaction-id mismatch should fail");

        assert!(error.contains("unexpected native WSP reply transaction id"));
    }
}
