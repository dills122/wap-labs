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
