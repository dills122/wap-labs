use crate::network::wdp::transport_trait::{DatagramTransport, WdpError};
use crate::network::wdp::{
    UdpDatagramTransport, UdpDatagramTransportConfig, WdpAddress, WdpDatagram,
};
use crate::network::wsp::header_block::{
    WspHeaderBlock, WspHeaderBlockDecodePolicy, WspHeaderBlockEncodePolicy, WspHeaderField,
    WspHeaderNameEncoding,
};
use crate::network::wsp::header_registry::{resolve_header_field_page, DEFAULT_HEADER_CODE_PAGE};
use crate::network::wsp::session::{
    decode_wsp_session_event, encode_wsp_session_event, WspMethod, WspMethodRequest,
    WspSessionEvent, WspSessionMode,
};
use crate::request_meta::log_transport_event;
use crate::responses::{
    map_success_payload_response, map_terminal_send_error, normalize_content_type,
};
use crate::FetchDeckResponse;
use std::collections::HashMap;
use std::net::{SocketAddr, ToSocketAddrs};
use std::time::Instant;
use url::Url;

pub const TRANSPORT_PROFILE_ENV: &str = "LOWBAND_TRANSPORT_PROFILE";
pub const TRANSPORT_PROFILE_GATEWAY_BRIDGED: &str = "gateway-bridged";
pub const TRANSPORT_PROFILE_WAP_NET_CORE: &str = "wap-net-core";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum TransportProfile {
    GatewayBridged,
    WapNetCore,
}

pub(crate) struct NativeFetchPlan {
    pub(crate) request_url: String,
    pub(crate) outbound_headers: HashMap<String, String>,
    pub(crate) timeout_ms: u64,
    pub(crate) attempts: u8,
    pub(crate) request_id: Option<String>,
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

pub(crate) fn should_use_native_wap_get(parsed: &Url, method: &str) -> bool {
    matches!(active_transport_profile(), TransportProfile::WapNetCore)
        && matches!(parsed.scheme(), "wap" | "waps")
        && method == "GET"
}

pub(crate) fn execute_native_wap_get(plan: NativeFetchPlan) -> FetchDeckResponse {
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

    execute_native_wap_get_with_transport(&mut transport, peer, plan)
}

pub(crate) fn execute_native_wap_get_with_transport(
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

    let request_event = WspSessionEvent::MethodRequest(WspMethodRequest {
        mode: WspSessionMode::Connectionless,
        method: WspMethod::Get,
        uri: request_uri(&parsed),
        headers: request_headers_block(&plan.outbound_headers),
        body: Vec::new(),
    });
    let encoded_request =
        match encode_wsp_session_event(&request_event, WspHeaderBlockEncodePolicy::STRICT) {
            Ok(encoded) => encoded,
            Err(error) => {
                return map_terminal_send_error(
                    plan.request_url,
                    format!("failed to encode native WSP GET: {error}"),
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
                let reply = match decode_wsp_session_event(
                    &reply_datagram.payload,
                    WspSessionMode::Connectionless,
                    WspHeaderBlockDecodePolicy::STRICT,
                ) {
                    Ok(reply) => reply,
                    Err(error) => {
                        return map_terminal_send_error(
                            plan.request_url,
                            format!("failed to decode native WSP reply: {error}"),
                            plan.attempts,
                            attempt,
                            false,
                            elapsed_ms,
                            plan.request_id.as_deref(),
                        );
                    }
                };

                let WspSessionEvent::MethodResult(result) = reply else {
                    return map_terminal_send_error(
                        plan.request_url,
                        "native WSP fetch expected a method reply".to_string(),
                        plan.attempts,
                        attempt,
                        false,
                        elapsed_ms,
                        plan.request_id.as_deref(),
                    );
                };

                let content_type = normalize_content_type(
                    header_value(&result.headers, "Content-Type")
                        .or_else(|| header_value(&result.headers, "Content-type")),
                );
                return map_success_payload_response(
                    result.status_code,
                    true,
                    &plan.request_url,
                    &plan.request_url,
                    plan.request_url.clone(),
                    content_type,
                    &result.body,
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

fn request_headers_block(headers: &HashMap<String, String>) -> WspHeaderBlock {
    let mut fields: Vec<WspHeaderField> = headers
        .iter()
        .map(|(name, value)| WspHeaderField {
            name: name.clone(),
            value: value.clone(),
            name_encoding: match resolve_header_field_page(name) {
                Some(page) => WspHeaderNameEncoding::Binary { page },
                None => WspHeaderNameEncoding::Text,
            },
        })
        .collect();
    fields.sort_by(|left, right| left.name.cmp(&right.name));
    WspHeaderBlock {
        headers: fields,
        encoding_version_headers: Vec::new(),
    }
}

fn header_value<'a>(block: &'a WspHeaderBlock, name: &str) -> Option<&'a str> {
    block
        .headers
        .iter()
        .find(|header| header.name.eq_ignore_ascii_case(name))
        .map(|header| header.value.as_str())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::wdp::transport_trait::WdpResult;
    use crate::network::wsp::session::{decode_wsp_session_event, WspSessionMode};
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
    fn native_mode_gate_only_applies_to_wap_get_requests() {
        let parsed = Url::parse("wap://localhost/").expect("url should parse");
        let native = with_env_var_locked(
            TRANSPORT_PROFILE_ENV,
            TRANSPORT_PROFILE_WAP_NET_CORE,
            || should_use_native_wap_get(&parsed, "GET"),
        );
        assert!(native);

        let post = with_env_var_locked(
            TRANSPORT_PROFILE_ENV,
            TRANSPORT_PROFILE_WAP_NET_CORE,
            || should_use_native_wap_get(&parsed, "POST"),
        );
        assert!(!post);
    }

    #[test]
    fn native_fetch_roundtrip_maps_reply_to_normalized_response() {
        let request_url = "wap://127.0.0.1/login".to_string();
        let peer: SocketAddr = "127.0.0.1:9200".parse().expect("literal should parse");
        let response_event =
            WspSessionEvent::MethodResult(crate::network::wsp::session::WspMethodResult {
                mode: WspSessionMode::Connectionless,
                status_code: 200,
                headers: WspHeaderBlock {
                    headers: vec![WspHeaderField {
                        name: "Content-Type".to_string(),
                        value: "text/vnd.wap.wml".to_string(),
                        name_encoding: WspHeaderNameEncoding::Binary {
                            page: resolve_header_field_page("Content-Type")
                                .unwrap_or(DEFAULT_HEADER_CODE_PAGE),
                        },
                    }],
                    encoding_version_headers: Vec::new(),
                },
                body: br#"<?xml version="1.0"?><wml><card id="login"/></wml>"#.to_vec(),
            });
        let encoded_reply =
            encode_wsp_session_event(&response_event, WspHeaderBlockEncodePolicy::STRICT)
                .expect("reply should encode");
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

        let response = execute_native_wap_get_with_transport(
            &mut transport,
            peer,
            NativeFetchPlan {
                request_url: request_url.clone(),
                outbound_headers: HashMap::from([(
                    "Accept".to_string(),
                    "text/vnd.wap.wml".to_string(),
                )]),
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
        let event = decode_wsp_session_event(
            &sent.payload,
            WspSessionMode::Connectionless,
            WspHeaderBlockDecodePolicy::STRICT,
        )
        .expect("sent payload should decode");
        let WspSessionEvent::MethodRequest(method) = event else {
            panic!("expected method request");
        };
        assert_eq!(method.method, WspMethod::Get);
        assert_eq!(method.uri, "/login");
    }

    #[test]
    fn native_fetch_timeout_maps_transport_timeout() {
        let mut transport = FakeDatagramTransport {
            sent: Vec::new(),
            next_receive: Err(WdpError::Timeout),
        };
        let response = execute_native_wap_get_with_transport(
            &mut transport,
            "127.0.0.1:9200".parse().expect("literal should parse"),
            NativeFetchPlan {
                request_url: "wap://127.0.0.1/".to_string(),
                outbound_headers: HashMap::new(),
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
}
