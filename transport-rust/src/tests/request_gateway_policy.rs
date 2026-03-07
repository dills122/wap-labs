use super::*;

#[test]
fn transport_normalize_content_type_handles_charset_and_empty() {
    assert_eq!(
        normalize_content_type(Some("text/vnd.wap.wml; charset=utf-8")),
        "text/vnd.wap.wml"
    );
    assert_eq!(normalize_content_type(Some("")), "application/octet-stream");
    assert_eq!(normalize_content_type(None), "application/octet-stream");
}

#[test]
fn transport_normalized_request_id_trims_and_rejects_blank() {
    assert_eq!(normalized_request_id(Some(" req-1 ")), Some("req-1"));
    assert_eq!(normalized_request_id(Some("   ")), None);
    assert_eq!(normalized_request_id(None), None);
}

#[test]
fn transport_details_with_request_id_merges_object_details() {
    let merged =
        details_with_request_id(Some("req-merge"), Some(serde_json::json!({ "attempt": 2 })))
            .expect("details should exist");
    assert_eq!(
        merged.get("requestId").and_then(|value| value.as_str()),
        Some("req-merge")
    );
    assert_eq!(
        merged.get("attempt").and_then(|value| value.as_u64()),
        Some(2)
    );
}

#[test]
fn transport_details_with_request_id_keeps_non_object_details_and_handles_blank() {
    let passthrough = details_with_request_id(Some("req-raw"), Some(serde_json::json!("raw")))
        .expect("details should exist");
    assert_eq!(passthrough.as_str(), Some("raw"));

    let blank_id = details_with_request_id(Some("   "), Some(serde_json::json!({ "a": 1 })));
    assert!(blank_id.is_none());
}

#[test]
fn transport_log_event_accepts_blank_or_missing_request_id() {
    log_transport_event(
        "transport.test",
        None,
        "http://example.test",
        serde_json::json!({ "ok": true }),
    );
    log_transport_event(
        "transport.test",
        Some("   "),
        "http://example.test",
        serde_json::json!({ "ok": true }),
    );
}

#[test]
fn transport_build_gateway_request_maps_wap_url_and_headers() {
    let headers = HashMap::new();
    let result = build_gateway_request("wap://example.test/home.wml?x=1", "GET", &headers)
        .expect("gateway mapping should succeed");
    let (gateway_url, mapped_headers) = result;
    assert_eq!(gateway_url, "http://localhost:13002/home.wml?x=1");
    assert!(
        !mapped_headers.contains_key("Host"),
        "transport should not inject Host header for gateway mapping"
    );
    assert_eq!(
        mapped_headers.get("X-Wap-Target-Url"),
        Some(&"wap://example.test/home.wml?x=1".to_string())
    );
}

#[test]
fn transport_build_gateway_request_handles_root_path() {
    let headers = HashMap::new();
    let (gateway_url, _) = build_gateway_request("wap://example.test", "GET", &headers)
        .expect("gateway root mapping should succeed");
    assert_eq!(gateway_url, "http://localhost:13002/");
}

#[test]
fn transport_build_gateway_request_rejects_non_wap_scheme() {
    let headers = HashMap::new();
    let err = build_gateway_request("http://example.test/home.wml", "GET", &headers)
        .expect_err("non-wap scheme should be rejected");
    assert!(err.contains("unsupported scheme"));
}

#[test]
fn transport_build_gateway_request_rejects_non_get_method() {
    let headers = HashMap::new();
    let err = build_gateway_request("wap://example.test/home.wml", "POST", &headers)
        .expect_err("non-GET method should be rejected");
    assert!(err.contains("only supports GET"));
}

#[test]
fn transport_build_gateway_request_keeps_target_in_x_wap_target_url_when_port_present() {
    let headers = HashMap::new();
    let (_, mapped_headers) =
        build_gateway_request("wap://example.test:9200/home.wml", "GET", &headers)
            .expect("gateway mapping with explicit target port should succeed");
    assert_eq!(
        mapped_headers.get("X-Wap-Target-Url").map(String::as_str),
        Some("wap://example.test:9200/home.wml")
    );
}

#[test]
fn transport_build_gateway_request_keeps_existing_host_header() {
    let mut headers = HashMap::new();
    headers.insert("Host".to_string(), "custom.host".to_string());
    let (_, mapped_headers) = build_gateway_request("wap://example.test/home.wml", "GET", &headers)
        .expect("gateway mapping should succeed");
    assert_eq!(
        mapped_headers.get("Host").map(String::as_str),
        Some("custom.host")
    );
}

#[test]
fn apply_request_policy_adds_no_cache_headers_and_referer() {
    let mut headers = HashMap::new();
    headers.insert("X-Test".to_string(), "yes".to_string());
    let policy = FetchRequestPolicy {
        destination_policy: None,
        cache_control: Some(FetchCacheControlPolicy::NoCache),
        referer_url: Some("http://example.test/home.wml".to_string()),
        post_context: None,
        ua_capability_profile: None,
    };

    let (method, mapped_headers, suppressed, ua_profile) =
        apply_request_policy("GET".to_string(), headers, Some(&policy));
    assert_eq!(method, "GET");
    assert!(!suppressed);
    assert_eq!(ua_profile, FetchUaCapabilityProfile::Disabled);
    assert_eq!(
        mapped_headers.get("Cache-Control").map(String::as_str),
        Some("no-cache")
    );
    assert_eq!(
        mapped_headers.get("Pragma").map(String::as_str),
        Some("no-cache")
    );
    assert_eq!(
        mapped_headers.get("Referer").map(String::as_str),
        Some("http://example.test/home.wml")
    );
    assert_eq!(
        mapped_headers.get("X-Test").map(String::as_str),
        Some("yes")
    );
}

#[test]
fn apply_request_policy_suppresses_same_deck_post_without_no_cache() {
    let policy = FetchRequestPolicy {
        destination_policy: None,
        cache_control: Some(FetchCacheControlPolicy::Default),
        referer_url: None,
        post_context: Some(FetchPostContext {
            same_deck: Some(true),
            content_type: Some("application/x-www-form-urlencoded".to_string()),
            payload: Some("a=1".to_string()),
        }),
        ua_capability_profile: None,
    };
    let (method, _mapped_headers, suppressed, ua_profile) =
        apply_request_policy("POST".to_string(), HashMap::new(), Some(&policy));
    assert_eq!(method, "GET");
    assert!(suppressed);
    assert_eq!(ua_profile, FetchUaCapabilityProfile::Disabled);
}

#[test]
fn apply_request_policy_keeps_post_when_no_cache_is_set() {
    let policy = FetchRequestPolicy {
        destination_policy: None,
        cache_control: Some(FetchCacheControlPolicy::NoCache),
        referer_url: None,
        post_context: Some(FetchPostContext {
            same_deck: Some(true),
            content_type: Some("application/x-www-form-urlencoded".to_string()),
            payload: Some("a=1".to_string()),
        }),
        ua_capability_profile: None,
    };
    let (method, mapped_headers, suppressed, ua_profile) =
        apply_request_policy("POST".to_string(), HashMap::new(), Some(&policy));
    assert_eq!(method, "POST");
    assert!(!suppressed);
    assert_eq!(ua_profile, FetchUaCapabilityProfile::Disabled);
    assert_eq!(
        mapped_headers.get("Cache-Control").map(String::as_str),
        Some("no-cache")
    );
}

#[test]
fn apply_request_policy_wap_baseline_profile_adds_capability_headers() {
    let policy = FetchRequestPolicy {
        destination_policy: None,
        cache_control: None,
        referer_url: None,
        post_context: None,
        ua_capability_profile: Some(FetchUaCapabilityProfile::WapBaseline),
    };
    let (method, mapped_headers, suppressed, ua_profile) =
        apply_request_policy("GET".to_string(), HashMap::new(), Some(&policy));
    assert_eq!(method, "GET");
    assert!(!suppressed);
    assert_eq!(ua_profile, FetchUaCapabilityProfile::WapBaseline);
    assert_eq!(
        mapped_headers.get("Accept").map(String::as_str),
        Some("text/vnd.wap.wml, application/vnd.wap.wmlc, image/vnd.wap.wbmp; level=0")
    );
    assert_eq!(
        mapped_headers.get("Accept-Charset").map(String::as_str),
        Some("utf-8, us-ascii;q=0.8")
    );
    assert_eq!(
        mapped_headers.get("Accept-Encoding").map(String::as_str),
        Some("identity")
    );
    assert_eq!(
        mapped_headers.get("Accept-Language").map(String::as_str),
        Some("en")
    );
}

#[test]
fn apply_request_policy_wap_baseline_profile_keeps_existing_capability_headers() {
    let mut headers = HashMap::new();
    headers.insert("Accept-Language".to_string(), "fr-ca".to_string());
    let policy = FetchRequestPolicy {
        destination_policy: None,
        cache_control: None,
        referer_url: None,
        post_context: None,
        ua_capability_profile: Some(FetchUaCapabilityProfile::WapBaseline),
    };
    let (_method, mapped_headers, _suppressed, _ua_profile) =
        apply_request_policy("GET".to_string(), headers, Some(&policy));
    assert_eq!(
        mapped_headers.get("Accept-Language").map(String::as_str),
        Some("fr-ca")
    );
}

#[test]
fn apply_request_policy_disabled_profile_does_not_add_capability_headers() {
    let policy = FetchRequestPolicy {
        destination_policy: None,
        cache_control: None,
        referer_url: None,
        post_context: None,
        ua_capability_profile: Some(FetchUaCapabilityProfile::Disabled),
    };
    let (_method, mapped_headers, _suppressed, ua_profile) =
        apply_request_policy("GET".to_string(), HashMap::new(), Some(&policy));
    assert_eq!(ua_profile, FetchUaCapabilityProfile::Disabled);
    assert!(!mapped_headers.contains_key("Accept"));
    assert!(!mapped_headers.contains_key("Accept-Charset"));
    assert!(!mapped_headers.contains_key("Accept-Encoding"));
    assert!(!mapped_headers.contains_key("Accept-Language"));
}
