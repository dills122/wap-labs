use super::*;
use lowband_transport_rust::{
    FetchCacheControlPolicy, FetchRequestIntent, FetchRequestMethod, FetchRequestPostField,
};

fn unique_smoke_username(prefix: &str) -> String {
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("clock should be monotonic enough for test ids")
        .as_millis();
    format!("{prefix}{nonce}")
}

fn typed_post_intent(payload: &str) -> FetchRequestIntent {
    FetchRequestIntent {
        method: FetchRequestMethod::Post,
        enctype: "application/x-www-form-urlencoded".to_string(),
        send_referer: true,
        accept_charset: Some("utf-8".to_string()),
        same_deck: false,
        post_fields: payload
            .split('&')
            .map(|pair| {
                let (name, value) = pair
                    .split_once('=')
                    .expect("test form payload should contain name/value pairs");
                FetchRequestPostField {
                    name: name.to_string(),
                    value: value.to_string(),
                }
            })
            .collect(),
        source_content_type: Some("text/vnd.wap.wml; charset=utf-8".to_string()),
    }
}

#[test]
fn fetch_deck_assigns_request_id_when_missing_or_blank() {
    let mut missing = FetchDeckRequest {
        url: "http://example.test".to_string(),
        method: None,
        headers: None,
        timeout_ms: None,
        retries: None,
        request_id: None,
        request_policy: None,
    };
    ensure_request_id(&mut missing);
    let generated = missing.request_id.clone().unwrap_or_default();
    assert!(
        generated.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX),
        "expected generated request id to use waves-fetch-* prefix"
    );

    let mut blank = FetchDeckRequest {
        url: "http://example.test".to_string(),
        method: None,
        headers: None,
        timeout_ms: None,
        retries: None,
        request_id: Some("   ".to_string()),
        request_policy: None,
    };
    ensure_request_id(&mut blank);
    let generated_blank = blank.request_id.unwrap_or_default();
    assert!(
        generated_blank.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX),
        "blank request id should be replaced with generated id"
    );
}

#[test]
fn fetch_deck_preserves_non_blank_request_id() {
    let mut request = FetchDeckRequest {
        url: "http://example.test".to_string(),
        method: None,
        headers: None,
        timeout_ms: None,
        retries: None,
        request_id: Some("req-123".to_string()),
        request_policy: None,
    };
    ensure_request_id(&mut request);
    assert_eq!(request.request_id.as_deref(), Some("req-123"));
}

#[test]
fn default_fetch_destination_policy_defaults_to_public_only() {
    let policy = with_env_removed_locked(super::waves_config::FETCH_DESTINATION_POLICY_ENV, || {
        default_fetch_destination_policy()
    });
    assert_eq!(policy, FetchDestinationPolicy::PublicOnly);
}

#[test]
fn default_fetch_destination_policy_allows_private_when_env_configured() {
    let policy = with_env_var_locked(
        super::waves_config::FETCH_DESTINATION_POLICY_ENV,
        super::waves_config::FETCH_DESTINATION_POLICY_ALLOW_PRIVATE,
        default_fetch_destination_policy,
    );
    assert_eq!(policy, FetchDestinationPolicy::AllowPrivate);
}

#[test]
fn default_fetch_transport_profile_defaults_to_auto() {
    let profile = with_env_removed_locked(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV, || {
        default_fetch_transport_profile()
    });
    assert_eq!(profile, HostFetchTransportProfile::Auto);
}

#[test]
fn auto_transport_profile_uses_native_for_wap_urls() {
    let profile = super::super::fetch_host::resolve_transport_profile_override(
        HostFetchTransportProfile::Auto,
        "wap://localhost/login",
    );
    assert_eq!(
        profile,
        Some(lowband_transport_rust::FetchTransportProfile::WapNetCore)
    );
}

#[test]
fn auto_transport_profile_leaves_http_urls_unpinned() {
    let profile = super::super::fetch_host::resolve_transport_profile_override(
        HostFetchTransportProfile::Auto,
        "http://localhost:3000/login",
    );
    assert_eq!(profile, None);
}

#[test]
fn default_fetch_transport_profile_reads_explicit_native_mode() {
    let profile = with_env_var_locked(
        super::waves_config::FETCH_TRANSPORT_PROFILE_ENV,
        super::waves_config::FETCH_TRANSPORT_PROFILE_WAP_NET_CORE,
        default_fetch_transport_profile,
    );
    assert_eq!(profile, HostFetchTransportProfile::WapNetCore);
}

#[test]
fn default_fetch_transport_fallback_defaults_to_disabled() {
    let fallback =
        with_env_removed_locked(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV, || {
            default_fetch_transport_fallback()
        });
    assert_eq!(fallback, HostFetchTransportFallback::Disabled);
}

#[test]
fn default_fetch_transport_fallback_reads_gateway_bridge() {
    let fallback = with_env_var_locked(
        super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV,
        super::waves_config::FETCH_TRANSPORT_FALLBACK_GATEWAY_BRIDGED,
        default_fetch_transport_fallback,
    );
    assert_eq!(fallback, HostFetchTransportFallback::GatewayBridged);
}

#[test]
fn next_request_id_sequence_has_expected_prefix() {
    let first = super::next_request_id();
    let second = super::next_request_id();
    assert!(first.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX));
    assert!(second.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX));
    assert_ne!(first, second, "request ids should be unique");
}

#[test]
fn health_command_returns_expected_string() {
    assert_eq!(health(), super::waves_config::HEALTH_RESPONSE);
}

#[test]
fn fetch_deck_command_keeps_caller_request_id_in_error_details() {
    let response = fetch_deck(FetchDeckRequest {
        url: "http://example.test".to_string(),
        method: Some("POST".to_string()),
        headers: None,
        timeout_ms: None,
        retries: None,
        request_id: Some("caller-id-7".to_string()),
        request_policy: None,
    });
    assert!(!response.ok);
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("caller-id-7")
    );
}

#[test]
fn fetch_deck_command_generates_request_id_when_missing() {
    let response = fetch_deck(FetchDeckRequest {
        url: "http://example.test".to_string(),
        method: Some("POST".to_string()),
        headers: None,
        timeout_ms: None,
        retries: None,
        request_id: None,
        request_policy: None,
    });
    assert!(!response.ok);
    let generated = detail_string(&response, "requestId").unwrap_or_default();
    assert!(
        generated.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX),
        "expected generated request id in transport error details"
    );
}

#[test]
fn fetch_deck_command_applies_default_destination_policy_when_missing() {
    let response =
        with_env_removed_locked(super::waves_config::FETCH_DESTINATION_POLICY_ENV, || {
            fetch_deck(FetchDeckRequest {
                url: "http://127.0.0.1:9/deck.wml".to_string(),
                method: None,
                headers: None,
                timeout_ms: Some(100),
                retries: Some(0),
                request_id: Some("req-default-policy".to_string()),
                request_policy: None,
            })
        });
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("INVALID_REQUEST")
    );
}

#[test]
fn fetch_deck_command_rejects_renderer_destination_policy_override() {
    let response =
        with_env_removed_locked(super::waves_config::FETCH_DESTINATION_POLICY_ENV, || {
            fetch_deck(FetchDeckRequest {
                url: "http://127.0.0.1:9/deck.wml".to_string(),
                method: None,
                headers: None,
                timeout_ms: Some(100),
                retries: Some(0),
                request_id: Some("req-explicit-policy".to_string()),
                request_policy: Some(FetchRequestPolicy {
                    destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
                    cache_control: None,
                    referer_url: None,
                    post_context: None,
                    request_intent: None,
                    ua_capability_profile: None,
                }),
            })
        });
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("INVALID_REQUEST")
    );
}

#[test]
fn fetch_deck_command_honors_host_allow_private_override() {
    let response = with_env_var_locked(
        super::waves_config::FETCH_DESTINATION_POLICY_ENV,
        super::waves_config::FETCH_DESTINATION_POLICY_ALLOW_PRIVATE,
        || {
            fetch_deck(FetchDeckRequest {
                url: "http://127.0.0.1:9/deck.wml".to_string(),
                method: None,
                headers: None,
                timeout_ms: Some(100),
                retries: Some(0),
                request_id: Some("req-host-private-policy".to_string()),
                request_policy: None,
            })
        },
    );

    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("TRANSPORT_UNAVAILABLE")
    );
}

#[test]
fn fetch_deck_command_serializes_typed_post_intent_before_http_handoff() {
    let listener = std::net::TcpListener::bind("127.0.0.1:0").expect("bind local request listener");
    let listener_addr = listener.local_addr().expect("read listener address");
    let captured = std::sync::Arc::new(std::sync::Mutex::new(Vec::<u8>::new()));
    let captured_for_thread = std::sync::Arc::clone(&captured);
    let server = std::thread::spawn(move || {
        use std::io::{BufRead, BufReader, Read, Write};
        let (stream, _) = listener.accept().expect("accept request connection");
        let mut reader = BufReader::new(stream.try_clone().expect("clone request stream"));
        let mut request = Vec::new();
        let mut content_length = 0usize;
        loop {
            let mut line = String::new();
            reader.read_line(&mut line).expect("read request header");
            request.extend_from_slice(line.as_bytes());
            if let Some(value) = line
                .to_ascii_lowercase()
                .strip_prefix("content-length:")
                .map(str::trim)
            {
                content_length = value.parse().expect("parse request Content-Length");
            }
            if line == "\r\n" {
                break;
            }
        }
        let mut body = vec![0; content_length];
        reader.read_exact(&mut body).expect("read request body");
        request.extend_from_slice(&body);
        *captured_for_thread.lock().expect("capture request lock") = request;

        let response_body = BASIC_NAV_WML;
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/vnd.wap.wml\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            response_body.len(),
            response_body
        );
        stream
            .try_clone()
            .expect("clone response stream")
            .write_all(response.as_bytes())
            .expect("write response");
    });

    let target = format!("http://{listener_addr}/forms/submit");
    let referer = format!("http://{listener_addr}/forms/login.wml#card");
    let response = with_env_var_locked(
        super::waves_config::FETCH_DESTINATION_POLICY_ENV,
        super::waves_config::FETCH_DESTINATION_POLICY_ALLOW_PRIVATE,
        || {
            fetch_deck(FetchDeckRequest {
                url: target.clone(),
                method: Some("GET".to_string()),
                headers: None,
                timeout_ms: Some(1000),
                retries: Some(0),
                request_id: Some("req-typed-post-handoff".to_string()),
                request_policy: Some(FetchRequestPolicy {
                    destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
                    cache_control: Some(FetchCacheControlPolicy::NoCache),
                    referer_url: Some(referer),
                    post_context: None,
                    request_intent: Some(FetchRequestIntent {
                        method: FetchRequestMethod::Post,
                        enctype: "application/x-www-form-urlencoded".to_string(),
                        send_referer: true,
                        accept_charset: Some("utf-8".to_string()),
                        same_deck: false,
                        post_fields: vec![
                            FetchRequestPostField {
                                name: "first field".to_string(),
                                value: "one&two".to_string(),
                            },
                            FetchRequestPostField {
                                name: "city".to_string(),
                                value: "Montréal".to_string(),
                            },
                        ],
                        source_content_type: Some("text/vnd.wap.wml; charset=utf-8".to_string()),
                    }),
                    ua_capability_profile: None,
                }),
            })
        },
    );
    server.join().expect("request server should exit");

    assert!(
        response.ok,
        "typed POST fetch should succeed: {:?}",
        response.error
    );
    let captured = captured.lock().expect("capture request lock");
    let request = String::from_utf8_lossy(&captured);
    assert!(request.starts_with("POST /forms/submit HTTP/1.1\r\n"));
    assert!(request
        .to_ascii_lowercase()
        .contains("content-type: application/x-www-form-urlencoded; charset=utf-8\r\n"));
    assert!(request
        .to_ascii_lowercase()
        .contains("cache-control: no-cache\r\n"));
    assert!(
        request.contains("referer: login.wml\r\n") || request.contains("Referer: login.wml\r\n")
    );
    assert!(request.ends_with("first+field=one%26two&city=Montr%C3%A9al"));
}

#[test]
fn fetch_deck_command_gateway_fallback_uses_effective_request_profile() {
    #[derive(Clone, Copy)]
    struct Case {
        name: &'static str,
        configured_profile: Option<&'static str>,
        fallback_enabled: bool,
        url: &'static str,
        method: &'static str,
        initial_response_ok: bool,
        error_code: &'static str,
        expected_profiles: &'static [Option<lowband_transport_rust::FetchTransportProfile>],
        expected_ok: bool,
    }

    use lowband_transport_rust::FetchTransportProfile::{GatewayBridged, WapNetCore};

    const NATIVE_THEN_GATEWAY: &[Option<lowband_transport_rust::FetchTransportProfile>] =
        &[Some(WapNetCore), Some(GatewayBridged)];
    const NATIVE_ONLY: &[Option<lowband_transport_rust::FetchTransportProfile>] =
        &[Some(WapNetCore)];
    const GATEWAY_ONLY: &[Option<lowband_transport_rust::FetchTransportProfile>] =
        &[Some(GatewayBridged)];
    const AUTO_HTTP_ONLY: &[Option<lowband_transport_rust::FetchTransportProfile>] = &[None];

    let cases = [
        Case {
            name: "auto wap retries transport unavailable",
            configured_profile: None,
            fallback_enabled: true,
            url: "wap://localhost/deck.wml",
            method: "GET",
            initial_response_ok: false,
            error_code: "TRANSPORT_UNAVAILABLE",
            expected_profiles: NATIVE_THEN_GATEWAY,
            expected_ok: true,
        },
        Case {
            name: "auto waps retries gateway timeout",
            configured_profile: None,
            fallback_enabled: true,
            url: "waps://localhost/deck.wml",
            method: "GET",
            initial_response_ok: false,
            error_code: "GATEWAY_TIMEOUT",
            expected_profiles: NATIVE_THEN_GATEWAY,
            expected_ok: true,
        },
        Case {
            name: "explicit native still retries",
            configured_profile: Some(super::waves_config::FETCH_TRANSPORT_PROFILE_WAP_NET_CORE),
            fallback_enabled: true,
            url: "wap://localhost/deck.wml",
            method: "GET",
            initial_response_ok: false,
            error_code: "TRANSPORT_UNAVAILABLE",
            expected_profiles: NATIVE_THEN_GATEWAY,
            expected_ok: true,
        },
        Case {
            name: "auto http stays unpinned",
            configured_profile: None,
            fallback_enabled: true,
            url: "http://example.test/deck.wml",
            method: "GET",
            initial_response_ok: false,
            error_code: "TRANSPORT_UNAVAILABLE",
            expected_profiles: AUTO_HTTP_ONLY,
            expected_ok: false,
        },
        Case {
            name: "auto https stays unpinned",
            configured_profile: None,
            fallback_enabled: true,
            url: "https://example.test/deck.wml",
            method: "GET",
            initial_response_ok: false,
            error_code: "GATEWAY_TIMEOUT",
            expected_profiles: AUTO_HTTP_ONLY,
            expected_ok: false,
        },
        Case {
            name: "explicit gateway does not retry",
            configured_profile: Some(super::waves_config::FETCH_TRANSPORT_PROFILE_GATEWAY_BRIDGED),
            fallback_enabled: true,
            url: "wap://localhost/deck.wml",
            method: "GET",
            initial_response_ok: false,
            error_code: "TRANSPORT_UNAVAILABLE",
            expected_profiles: GATEWAY_ONLY,
            expected_ok: false,
        },
        Case {
            name: "successful native response does not retry",
            configured_profile: None,
            fallback_enabled: true,
            url: "wap://localhost/deck.wml",
            method: "GET",
            initial_response_ok: true,
            error_code: "TRANSPORT_UNAVAILABLE",
            expected_profiles: NATIVE_ONLY,
            expected_ok: true,
        },
        Case {
            name: "post does not retry",
            configured_profile: None,
            fallback_enabled: true,
            url: "wap://localhost/deck.wml",
            method: "POST",
            initial_response_ok: false,
            error_code: "TRANSPORT_UNAVAILABLE",
            expected_profiles: NATIVE_ONLY,
            expected_ok: false,
        },
        Case {
            name: "non-retryable native error does not retry",
            configured_profile: None,
            fallback_enabled: true,
            url: "wap://localhost/deck.wml",
            method: "GET",
            initial_response_ok: false,
            error_code: "PROTOCOL_ERROR",
            expected_profiles: NATIVE_ONLY,
            expected_ok: false,
        },
        Case {
            name: "disabled fallback does not retry",
            configured_profile: None,
            fallback_enabled: false,
            url: "wap://localhost/deck.wml",
            method: "GET",
            initial_response_ok: false,
            error_code: "TRANSPORT_UNAVAILABLE",
            expected_profiles: NATIVE_ONLY,
            expected_ok: false,
        },
    ];

    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous_profile = std::env::var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV).ok();
    let previous_fallback = std::env::var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV).ok();

    for case in cases {
        if let Some(profile) = case.configured_profile {
            std::env::set_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV, profile);
        } else {
            std::env::remove_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV);
        }
        if case.fallback_enabled {
            std::env::set_var(
                super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV,
                super::waves_config::FETCH_TRANSPORT_FALLBACK_GATEWAY_BRIDGED,
            );
        } else {
            std::env::remove_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV);
        }

        let calls = std::sync::Arc::new(std::sync::Mutex::new(Vec::<
            Option<lowband_transport_rust::FetchTransportProfile>,
        >::new()));
        let calls_for_closure = std::sync::Arc::clone(&calls);
        let response = super::super::fetch_host::fetch_deck_with_transport_executor(
            FetchDeckRequest {
                url: case.url.to_string(),
                method: Some(case.method.to_string()),
                headers: None,
                timeout_ms: Some(100),
                retries: Some(0),
                request_id: Some(format!("req-fallback-{}", case.name.replace(' ', "-"))),
                request_policy: Some(FetchRequestPolicy {
                    destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
                    cache_control: None,
                    referer_url: None,
                    post_context: None,
                    request_intent: None,
                    ua_capability_profile: None,
                }),
            },
            move |_request, profile| {
                let attempt = {
                    let mut recorded = calls_for_closure.lock().expect("calls lock should succeed");
                    recorded.push(profile);
                    recorded.len()
                };
                if (attempt == 1 && case.initial_response_ok) || attempt == 2 {
                    return mock_fetch_ok(case.url, "text/vnd.wap.wml", BASIC_NAV_WML);
                }
                FetchDeckResponse {
                    ok: false,
                    status: 0,
                    final_url: case.url.to_string(),
                    content_type: "text/plain".to_string(),
                    wml: None,
                    error: Some(lowband_transport_rust::FetchErrorInfo {
                        code: case.error_code.to_string(),
                        message: "simulated transport failure".to_string(),
                        details: None,
                    }),
                    timing_ms: FetchTiming {
                        encode: 0.0,
                        udp_rtt: 0.0,
                        decode: 0.0,
                    },
                    engine_deck_input: None,
                }
            },
        );

        let recorded = calls.lock().expect("calls lock should succeed");
        assert_eq!(response.ok, case.expected_ok, "{} response", case.name);
        assert_eq!(
            recorded.as_slice(),
            case.expected_profiles,
            "{} transport sequence",
            case.name
        );
        assert_eq!(
            recorded.len(),
            case.expected_profiles.len(),
            "{} request count",
            case.name
        );
    }

    if let Some(old) = previous_profile {
        std::env::set_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV);
    }
    if let Some(old) = previous_fallback {
        std::env::set_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV);
    }
}

#[test]
fn fetch_deck_command_gateway_fallback_cannot_be_redirected_by_fallback_env_value() {
    // M1-21 regression: `WAVES_FETCH_TRANSPORT_FALLBACK` (default_fetch_transport_fallback in
    // fetch_host.rs) only selects *whether* the gateway-bridged fallback runs -- it is a strict
    // enum toggle ("disabled" | "gateway-bridged") and carries no host/URL value of its own.
    // The actual destination for the fallback leg is enforced entirely inside
    // transport-rust (gateway::gateway_http_base / build_gateway_request, pinned by the
    // transport-rust M1-20 regression test). This test exercises the REAL transport end to
    // end (no mocked fetch_impl) to confirm the fallback path can only ever land on the
    // operator-configured `GATEWAY_HTTP_BASE` -- never on a host derived from the fallback
    // env var, from request headers, or from the original wap:// URL's own host/port.
    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous_profile = std::env::var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV).ok();
    let previous_fallback = std::env::var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV).ok();
    let previous_destination =
        std::env::var(super::waves_config::FETCH_DESTINATION_POLICY_ENV).ok();
    let previous_gateway_base = std::env::var("GATEWAY_HTTP_BASE").ok();

    let listener =
        std::net::TcpListener::bind("127.0.0.1:0").expect("bind local gateway stand-in listener");
    let listener_addr = listener.local_addr().expect("read listener address");

    let captured_request_line = std::sync::Arc::new(std::sync::Mutex::new(None::<String>));
    let captured_for_thread = std::sync::Arc::clone(&captured_request_line);
    let server = std::thread::spawn(move || {
        use std::io::{BufRead, BufReader, Write};
        let (stream, _) = listener
            .accept()
            .expect("accept gateway stand-in connection");
        let mut reader = BufReader::new(stream.try_clone().expect("clone stream for reading"));
        let mut request_line = String::new();
        reader
            .read_line(&mut request_line)
            .expect("read request line from gateway stand-in connection");
        *captured_for_thread
            .lock()
            .expect("captured request line lock should succeed") = Some(request_line);
        let mut writer = stream;
        let body = BASIC_NAV_WML;
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/vnd.wap.wml\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            body.len(),
            body
        );
        writer
            .write_all(response.as_bytes())
            .expect("write gateway stand-in response");
    });

    std::env::set_var(
        super::waves_config::FETCH_TRANSPORT_PROFILE_ENV,
        super::waves_config::FETCH_TRANSPORT_PROFILE_WAP_NET_CORE,
    );
    std::env::set_var(
        super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV,
        super::waves_config::FETCH_TRANSPORT_FALLBACK_GATEWAY_BRIDGED,
    );
    std::env::set_var(
        super::waves_config::FETCH_DESTINATION_POLICY_ENV,
        super::waves_config::FETCH_DESTINATION_POLICY_ALLOW_PRIVATE,
    );
    std::env::set_var("GATEWAY_HTTP_BASE", format!("http://{listener_addr}"));

    // The native leg deliberately targets a port nothing listens on (matches the
    // "127.0.0.1:9" convention used elsewhere in this suite) so it fails fast with
    // TRANSPORT_UNAVAILABLE and triggers the gateway-bridged fallback.
    let response = fetch_deck(FetchDeckRequest {
        url: "wap://127.0.0.1:9/private-marker.wml".to_string(),
        method: Some("GET".to_string()),
        headers: None,
        timeout_ms: Some(500),
        retries: Some(0),
        request_id: Some("req-fallback-host-scope".to_string()),
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: None,
            referer_url: None,
            post_context: None,
            request_intent: None,
            ua_capability_profile: None,
        }),
    });

    server
        .join()
        .expect("gateway stand-in server thread should exit");

    if let Some(old) = previous_profile {
        std::env::set_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV);
    }
    if let Some(old) = previous_fallback {
        std::env::set_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV);
    }
    if let Some(old) = previous_destination {
        std::env::set_var(super::waves_config::FETCH_DESTINATION_POLICY_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_DESTINATION_POLICY_ENV);
    }
    if let Some(old) = previous_gateway_base {
        std::env::set_var("GATEWAY_HTTP_BASE", old);
    } else {
        std::env::remove_var("GATEWAY_HTTP_BASE");
    }

    assert!(
        response.ok,
        "expected gateway-bridged fallback to succeed against the configured gateway base: {:?}",
        response.error
    );
    let request_line = captured_request_line
        .lock()
        .expect("captured request line lock should succeed")
        .clone()
        .expect("gateway stand-in listener should have received a request");
    assert!(
        request_line.starts_with("GET /private-marker.wml"),
        "gateway fallback should target GATEWAY_HTTP_BASE with the original wap path, got: {request_line}"
    );
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn host_fetch_deck_command_native_wap_home_smoke_succeeds() {
    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous_destination =
        std::env::var(super::waves_config::FETCH_DESTINATION_POLICY_ENV).ok();
    let previous_profile = std::env::var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV).ok();
    let previous_fallback = std::env::var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV).ok();
    std::env::set_var(
        super::waves_config::FETCH_DESTINATION_POLICY_ENV,
        super::waves_config::FETCH_DESTINATION_POLICY_ALLOW_PRIVATE,
    );
    std::env::set_var(
        super::waves_config::FETCH_TRANSPORT_PROFILE_ENV,
        super::waves_config::FETCH_TRANSPORT_PROFILE_WAP_NET_CORE,
    );
    std::env::set_var(
        super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV,
        super::waves_config::FETCH_TRANSPORT_FALLBACK_DISABLED,
    );

    let response = fetch_deck(FetchDeckRequest {
        url: std::env::var("WAP_SMOKE_URL").unwrap_or_else(|_| "wap://localhost/".to_string()),
        method: Some("GET".to_string()),
        headers: None,
        timeout_ms: Some(15000),
        retries: Some(1),
        request_id: Some("host-native-smoke".to_string()),
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: None,
            referer_url: None,
            post_context: None,
            request_intent: None,
            ua_capability_profile: None,
        }),
    });

    if let Some(old) = previous_destination {
        std::env::set_var(super::waves_config::FETCH_DESTINATION_POLICY_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_DESTINATION_POLICY_ENV);
    }
    if let Some(old) = previous_profile {
        std::env::set_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV);
    }
    if let Some(old) = previous_fallback {
        std::env::set_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV);
    }

    assert!(
        response.ok,
        "expected host native smoke fetch to succeed: {:?}",
        response.error
    );
    let deck = response
        .engine_deck_input
        .expect("engineDeckInput should be present");
    assert!(deck.wml_xml.contains("card id=\"home\""));
    assert!(deck.wml_xml.contains("Local WAP training environment."));
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn host_fetch_deck_command_native_wap_post_smoke_registers_and_logs_in() {
    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous_destination =
        std::env::var(super::waves_config::FETCH_DESTINATION_POLICY_ENV).ok();
    let previous_profile = std::env::var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV).ok();
    let previous_fallback = std::env::var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV).ok();
    std::env::set_var(
        super::waves_config::FETCH_DESTINATION_POLICY_ENV,
        super::waves_config::FETCH_DESTINATION_POLICY_ALLOW_PRIVATE,
    );
    std::env::set_var(
        super::waves_config::FETCH_TRANSPORT_PROFILE_ENV,
        super::waves_config::FETCH_TRANSPORT_PROFILE_WAP_NET_CORE,
    );
    std::env::set_var(
        super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV,
        super::waves_config::FETCH_TRANSPORT_FALLBACK_DISABLED,
    );

    let register_url = std::env::var("WAP_SMOKE_REGISTER_URL")
        .unwrap_or_else(|_| "wap://localhost/register".to_string());
    let login_url = std::env::var("WAP_SMOKE_LOGIN_URL")
        .unwrap_or_else(|_| "wap://localhost/login".to_string());
    let username = unique_smoke_username("hostsmoke");
    let payload = format!("username={username}&pin=1234");

    let register = fetch_deck(FetchDeckRequest {
        url: register_url.clone(),
        method: Some("POST".to_string()),
        headers: None,
        timeout_ms: Some(15000),
        retries: Some(1),
        request_id: Some("host-native-post-register".to_string()),
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: Some(FetchCacheControlPolicy::NoCache),
            referer_url: Some(register_url.clone()),
            post_context: None,
            request_intent: Some(typed_post_intent(&payload)),
            ua_capability_profile: None,
        }),
    });

    assert!(
        register.ok,
        "expected host native register POST to succeed: {:?}",
        register.error
    );
    let register_deck = register
        .engine_deck_input
        .expect("register engineDeckInput should be present");
    assert!(register_deck.wml_xml.contains("card id=\"register-ok\""));
    assert!(register_deck
        .wml_xml
        .contains(&format!("User {username} created.")));

    let login = fetch_deck(FetchDeckRequest {
        url: login_url.clone(),
        method: Some("POST".to_string()),
        headers: None,
        timeout_ms: Some(15000),
        retries: Some(1),
        request_id: Some("host-native-post-login".to_string()),
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: Some(FetchCacheControlPolicy::NoCache),
            referer_url: Some(login_url.clone()),
            post_context: None,
            request_intent: Some(typed_post_intent(&payload)),
            ua_capability_profile: None,
        }),
    });

    if let Some(old) = previous_destination {
        std::env::set_var(super::waves_config::FETCH_DESTINATION_POLICY_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_DESTINATION_POLICY_ENV);
    }
    if let Some(old) = previous_profile {
        std::env::set_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV);
    }
    if let Some(old) = previous_fallback {
        std::env::set_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV, old);
    } else {
        std::env::remove_var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV);
    }

    assert!(
        login.ok,
        "expected host native login POST to succeed: {:?}",
        login.error
    );
    let login_deck = login
        .engine_deck_input
        .expect("login engineDeckInput should be present");
    assert!(login_deck.wml_xml.contains("card id=\"login-ok\""));
    assert!(login_deck
        .wml_xml
        .contains(&format!("Authenticated as {username}.")));
}
