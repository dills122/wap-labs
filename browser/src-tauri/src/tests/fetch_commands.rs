use super::*;

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
fn bundled_wbxml_resource_relpath_looks_valid() {
    let linux = "wbxml/linux/wbxml2xml";
    let mac = "wbxml/macos/wbxml2xml";
    let windows = "wbxml/windows/wbxml2xml.exe";
    assert!(linux.starts_with("wbxml/"));
    assert!(mac.starts_with("wbxml/"));
    assert!(windows.starts_with("wbxml/"));
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
fn fetch_deck_command_preserves_explicit_destination_policy_override() {
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
                    ua_capability_profile: None,
                }),
            })
        });
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("TRANSPORT_UNAVAILABLE")
    );
}

#[test]
fn fetch_deck_command_retries_native_wap_request_with_gateway_fallback_when_configured() {
    let _guard = env_lock().lock().expect("env lock should succeed");
    let previous_profile = std::env::var(super::waves_config::FETCH_TRANSPORT_PROFILE_ENV).ok();
    let previous_fallback = std::env::var(super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV).ok();
    std::env::set_var(
        super::waves_config::FETCH_TRANSPORT_PROFILE_ENV,
        super::waves_config::FETCH_TRANSPORT_PROFILE_WAP_NET_CORE,
    );
    std::env::set_var(
        super::waves_config::FETCH_TRANSPORT_FALLBACK_ENV,
        super::waves_config::FETCH_TRANSPORT_FALLBACK_GATEWAY_BRIDGED,
    );

    let calls = std::sync::Arc::new(std::sync::Mutex::new(Vec::<
        Option<lowband_transport_rust::FetchTransportProfile>,
    >::new()));
    let calls_for_closure = std::sync::Arc::clone(&calls);
    let response = super::super::fetch_host::fetch_deck_with_transport_executor(
        FetchDeckRequest {
            url: "wap://localhost/".to_string(),
            method: Some("GET".to_string()),
            headers: None,
            timeout_ms: Some(100),
            retries: Some(0),
            request_id: Some("req-fallback".to_string()),
            request_policy: Some(FetchRequestPolicy {
                destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
                cache_control: None,
                referer_url: None,
                post_context: None,
                ua_capability_profile: None,
            }),
        },
        move |_request, profile| {
            calls_for_closure
                .lock()
                .expect("calls lock should succeed")
                .push(profile);
            match profile {
                Some(lowband_transport_rust::FetchTransportProfile::WapNetCore) => {
                    FetchDeckResponse {
                        ok: false,
                        status: 0,
                        final_url: "wap://localhost/".to_string(),
                        content_type: "text/plain".to_string(),
                        wml: None,
                        error: Some(lowband_transport_rust::FetchErrorInfo {
                            code: "TRANSPORT_UNAVAILABLE".to_string(),
                            message: "native path unavailable".to_string(),
                            details: None,
                        }),
                        timing_ms: FetchTiming {
                            encode: 0.0,
                            udp_rtt: 0.0,
                            decode: 0.0,
                        },
                        engine_deck_input: None,
                    }
                }
                Some(lowband_transport_rust::FetchTransportProfile::GatewayBridged) => {
                    mock_fetch_ok("wap://localhost/", "text/vnd.wap.wml", BASIC_NAV_WML)
                }
                other => panic!("unexpected profile override: {other:?}"),
            }
        },
    );

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

    assert!(response.ok);
    assert_eq!(
        *calls.lock().expect("calls lock should succeed"),
        vec![
            Some(lowband_transport_rust::FetchTransportProfile::WapNetCore),
            Some(lowband_transport_rust::FetchTransportProfile::GatewayBridged)
        ]
    );
}
