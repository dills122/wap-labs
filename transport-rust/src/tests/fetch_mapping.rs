use super::*;

#[test]
fn transport_supported_content_type_matrix() {
    assert!(is_supported_wml_content_type("text/vnd.wap.wml"));
    assert!(is_supported_wml_content_type("application/vnd.wap.wml+xml"));
    assert!(!is_supported_wml_content_type("application/json"));
}

#[test]
fn transport_fetch_invalid_method_maps_invalid_request() {
    let response = fetch_deck_in_process(FetchDeckRequest {
        method: Some("POST".to_string()),
        request_id: Some("req-invalid-method".to_string()),
        ..basic_request("http://example.test".to_string())
    });
    assert!(!response.ok);
    assert_eq!(response.status, 0);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("INVALID_REQUEST")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-invalid-method")
    );
}

#[test]
fn transport_fetch_invalid_url_maps_invalid_request() {
    let response = fetch_deck_in_process(FetchDeckRequest {
        request_id: Some("req-invalid-url".to_string()),
        ..basic_request("example.test/no-scheme".to_string())
    });
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("INVALID_REQUEST")
    );
    assert_eq!(
        response.error.as_ref().map(|err| err.message.as_str()),
        Some("URL must include a scheme")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-invalid-url")
    );
}

#[test]
fn transport_fetch_rejects_url_longer_than_1024_octets() {
    let long_path = "a".repeat(MAX_URI_OCTETS + 1);
    let long_url = format!("http://example.test/{long_path}");
    let response = fetch_deck_in_process(FetchDeckRequest {
        request_id: Some("req-uri-too-long".to_string()),
        ..basic_request(long_url.clone())
    });
    assert!(!response.ok);
    assert_eq!(response.status, 0);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("INVALID_REQUEST")
    );
    assert_eq!(response.final_url, long_url);
    assert!(response
        .error
        .as_ref()
        .map(|err| err.message.contains("1024-octet limit"))
        .unwrap_or(false));
}

#[test]
fn transport_fetch_accepts_url_at_1024_octet_boundary() {
    let prefix = "http://example.test/";
    let fill = "a".repeat(MAX_URI_OCTETS - prefix.len());
    let url = format!("{prefix}{fill}");
    assert_eq!(url.len(), MAX_URI_OCTETS);
    let response = fetch_deck_in_process(FetchDeckRequest {
        request_id: Some("req-uri-limit".to_string()),
        ..basic_request(url)
    });
    assert_ne!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("INVALID_REQUEST"),
        "1024-octet URL should not fail local URI-length validation"
    );
}

#[test]
fn transport_map_success_payload_http_success_builds_engine_deck_input() {
    let base = "http://example.test/index.wml".to_string();
    let body = b"<wml><card id=\"home\"><p>ok</p></card></wml>";
    let response = map_success_payload_response(
        200,
        false,
        &base,
        &base,
        base.clone(),
        "text/vnd.wap.wml".to_string(),
        body,
        1,
        3.5,
        None,
    );
    assert!(response.ok);
    assert_eq!(response.status, 200);
    assert_eq!(response.content_type, "text/vnd.wap.wml");
    assert!(response.engine_deck_input.is_some());
    let deck = response
        .engine_deck_input
        .as_ref()
        .expect("engine deck input should be present");
    assert_eq!(deck.base_url, "http://example.test/index.wml");
    assert_eq!(deck.content_type, response.content_type);
    assert_eq!(
        response.wml.as_deref(),
        Some(deck.wml_xml.as_str()),
        "wml and engineDeckInput.wmlXml should be identical"
    );
    assert_eq!(
        deck.raw_bytes_base64.as_deref(),
        Some(BASE64.encode(body).as_str()),
        "raw bytes should preserve original payload bytes as base64"
    );
}

#[test]
fn transport_map_success_payload_rejects_oversized_body() {
    let base = "http://example.test/index.wml".to_string();
    let body = vec![b'a'; MAX_RESPONSE_BODY_BYTES + 1];
    let response = map_success_payload_response(
        200,
        false,
        &base,
        &base,
        base.clone(),
        "text/vnd.wap.wml".to_string(),
        body.as_slice(),
        1,
        3.5,
        Some("req-oversized-body"),
    );

    assert!(!response.ok);
    assert_eq!(response.status, 200);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("PAYLOAD_TOO_LARGE")
    );
    assert!(response
        .error
        .as_ref()
        .map(|err| err.message.contains("Payload exceeds"))
        .unwrap_or(false));
    assert!(response.engine_deck_input.is_none());
}

#[test]
fn transport_map_success_payload_accepts_body_at_limit() {
    let base = "http://example.test/index.wml".to_string();
    let body = vec![b'a'; MAX_RESPONSE_BODY_BYTES];
    let response = map_success_payload_response(
        200,
        false,
        &base,
        &base,
        base.clone(),
        "text/vnd.wap.wml".to_string(),
        body.as_slice(),
        1,
        3.5,
        Some("req-body-at-limit"),
    );

    assert!(response.ok, "body at hard limit should map successfully");
    assert_eq!(response.status, 200);
    assert!(response.error.is_none());
    assert!(response.engine_deck_input.is_some());
    let deck = response
        .engine_deck_input
        .expect("engine deck input should be present at boundary");
    assert_eq!(deck.wml_xml.len(), MAX_RESPONSE_BODY_BYTES);
    assert_eq!(
        deck.raw_bytes_base64.as_deref(),
        Some(BASE64.encode(body).as_str())
    );
}

#[test]
fn transport_map_success_payload_utf16le_textual_wml_maps_ok() {
    let base = "http://example.test/index.wml".to_string();
    let utf16le_body: Vec<u8> = vec![
        0xFF, 0xFE, b'<', 0x00, b'w', 0x00, b'm', 0x00, b'l', 0x00, b'>', 0x00, b'<', 0x00, b'/',
        0x00, b'w', 0x00, b'm', 0x00, b'l', 0x00, b'>', 0x00,
    ];
    let response = map_success_payload_response(
        200,
        false,
        &base,
        &base,
        base.clone(),
        "text/vnd.wap.wml".to_string(),
        &utf16le_body,
        1,
        3.5,
        None,
    );
    assert!(response.ok);
    assert_eq!(response.wml.as_deref(), Some("<wml></wml>"));
}

#[test]
fn transport_map_success_payload_utf16_odd_length_maps_protocol_error() {
    let base = "http://example.test/index.wml".to_string();
    let invalid_utf16_body: Vec<u8> = vec![0xFF, 0xFE, b'<', 0x00, b'w'];
    let response = map_success_payload_response(
        200,
        false,
        &base,
        &base,
        base.clone(),
        "text/vnd.wap.wml".to_string(),
        &invalid_utf16_body,
        1,
        3.5,
        Some("req-utf16-invalid"),
    );
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("PROTOCOL_ERROR")
    );
    assert_eq!(
        response.error.as_ref().map(|err| err.message.as_str()),
        Some("Invalid UTF-16 payload: odd byte length")
    );
}

#[test]
fn transport_map_success_payload_http_error_maps_protocol_error() {
    let response = map_success_payload_response(
        502,
        false,
        "http://request.example",
        "http://upstream.example",
        "http://request.example".to_string(),
        "text/plain".to_string(),
        b"upstream fail",
        2,
        9.1,
        Some("req-protocol"),
    );
    assert!(!response.ok);
    assert_eq!(response.status, 502);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("PROTOCOL_ERROR")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-protocol")
    );
}

#[test]
fn transport_map_success_payload_unsupported_content_type_maps_error() {
    let response = map_success_payload_response(
        200,
        false,
        "http://request.example",
        "http://upstream.example",
        "http://request.example".to_string(),
        "application/json".to_string(),
        br#"{"ok":true}"#,
        1,
        2.0,
        Some("req-content"),
    );
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("UNSUPPORTED_CONTENT_TYPE")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-content")
    );
}

#[test]
fn transport_fixture_mapped_unsupported_content_type() {
    let input: FixtureMapInput =
        read_json_fixture("unsupported_content_type_mapped", "map_input.json");
    let expected: FixtureExpected =
        read_json_fixture("unsupported_content_type_mapped", "expected.json");
    let body = input.body_bytes();
    let response = map_success_payload_response(
        input.status,
        input.is_wap_scheme,
        &input.request_url,
        &input.upstream_url,
        input.final_url,
        input.content_type,
        &body,
        input.attempt,
        input.elapsed_ms,
        None,
    );
    assert_eq!(response.ok, expected.ok);
    assert_eq!(response.status, expected.status);
    assert_eq!(response.final_url, expected.final_url);
    assert_eq!(response.content_type, expected.content_type);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        expected.error_code.as_deref()
    );
    if let Some(expected_wml) = expected.wml.as_deref() {
        assert_eq!(response.wml.as_deref(), Some(expected_wml));
    }
}

#[test]
fn transport_map_success_payload_wmlc_decode_failure_maps_error() {
    let response = with_env_var_locked("WBXML2XML_BIN", "__missing_decoder__", || {
        map_success_payload_response(
            200,
            false,
            "http://request.example",
            "http://upstream.example",
            "http://request.example".to_string(),
            "application/vnd.wap.wmlc".to_string(),
            b"\x03\x01\x6a\x00",
            1,
            2.0,
            Some("req-wbxml"),
        )
    });
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("WBXML_DECODE_FAILED")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-wbxml")
    );
}

#[test]
#[cfg(unix)]
fn transport_map_success_payload_wmlc_decode_success_maps_ok() {
    let script = write_fake_decoder_script("<wml><card id=\"d\"/></wml>");
    let body = b"\x03\x01\x6a\x00";
    let response = with_two_env_vars_locked(
        "LOWBAND_DISABLE_LIBWBXML",
        "1",
        "WBXML2XML_BIN",
        script.to_string_lossy().as_ref(),
        || {
            map_success_payload_response(
                200,
                false,
                "http://request.example",
                "http://upstream.example",
                "http://request.example".to_string(),
                "application/vnd.wap.wmlc".to_string(),
                body,
                1,
                2.0,
                None,
            )
        },
    );
    assert!(response.ok);
    assert_eq!(response.status, 200);
    let deck = response
        .engine_deck_input
        .as_ref()
        .expect("engine deck input should be present");
    assert_eq!(deck.base_url, "http://request.example");
    assert_eq!(deck.content_type, "application/vnd.wap.wmlc");
    assert_eq!(
        response.wml.as_deref(),
        Some(deck.wml_xml.as_str()),
        "decoded wml should be mirrored into engineDeckInput.wmlXml"
    );
    assert_eq!(
        deck.raw_bytes_base64.as_deref(),
        Some(BASE64.encode(body).as_str()),
        "decoded success should preserve original wbxml bytes"
    );
}

#[test]
fn transport_map_success_payload_wap_protocol_error_uses_original_url() {
    let response = map_success_payload_response(
        500,
        true,
        "wap://example.test/start.wml",
        "http://gateway.local/start.wml",
        "wap://example.test/start.wml".to_string(),
        "text/plain".to_string(),
        b"bad gateway",
        1,
        4.0,
        None,
    );
    assert!(!response.ok);
    assert_eq!(response.final_url, "wap://example.test/start.wml");
}

#[test]
fn transport_fixture_mapped_protocol_error_5xx() {
    let input: FixtureMapInput = read_json_fixture("protocol_error_5xx_mapped", "map_input.json");
    let expected: FixtureExpected = read_json_fixture("protocol_error_5xx_mapped", "expected.json");
    let body = input.body_bytes();
    let response = map_success_payload_response(
        input.status,
        input.is_wap_scheme,
        &input.request_url,
        &input.upstream_url,
        input.final_url,
        input.content_type,
        &body,
        input.attempt,
        input.elapsed_ms,
        None,
    );
    assert_eq!(response.ok, expected.ok);
    assert_eq!(response.status, expected.status);
    assert_eq!(response.final_url, expected.final_url);
    assert_eq!(response.content_type, expected.content_type);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        expected.error_code.as_deref()
    );
    if let Some(expected_wml) = expected.wml.as_deref() {
        assert_eq!(response.wml.as_deref(), Some(expected_wml));
    }
}

#[test]
fn transport_fixture_mapped_utf16le_textual_wml_ok() {
    let input: FixtureMapInput = read_json_fixture("utf16le_textual_wml_mapped", "map_input.json");
    let expected: FixtureExpected =
        read_json_fixture("utf16le_textual_wml_mapped", "expected.json");
    let body = input.body_bytes();
    let response = map_success_payload_response(
        input.status,
        input.is_wap_scheme,
        &input.request_url,
        &input.upstream_url,
        input.final_url,
        input.content_type,
        &body,
        input.attempt,
        input.elapsed_ms,
        None,
    );
    assert_eq!(response.ok, expected.ok);
    assert_eq!(response.status, expected.status);
    assert_eq!(response.final_url, expected.final_url);
    assert_eq!(response.content_type, expected.content_type);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        expected.error_code.as_deref()
    );
    if let Some(expected_wml) = expected.wml.as_deref() {
        assert_eq!(response.wml.as_deref(), Some(expected_wml));
    }
}

#[test]
fn transport_fixture_mapped_utf16_odd_length_protocol_error() {
    let input: FixtureMapInput =
        read_json_fixture("utf16_odd_length_protocol_error_mapped", "map_input.json");
    let expected: FixtureExpected =
        read_json_fixture("utf16_odd_length_protocol_error_mapped", "expected.json");
    let body = input.body_bytes();
    let response = map_success_payload_response(
        input.status,
        input.is_wap_scheme,
        &input.request_url,
        &input.upstream_url,
        input.final_url,
        input.content_type,
        &body,
        input.attempt,
        input.elapsed_ms,
        None,
    );
    assert_eq!(response.ok, expected.ok);
    assert_eq!(response.status, expected.status);
    assert_eq!(response.final_url, expected.final_url);
    assert_eq!(response.content_type, expected.content_type);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        expected.error_code.as_deref()
    );
    if let Some(expected_wml) = expected.wml.as_deref() {
        assert_eq!(response.wml.as_deref(), Some(expected_wml));
    }
}

#[test]
fn transport_map_terminal_send_error_maps_timeout_code() {
    let response = map_terminal_send_error(
        "http://example.test".to_string(),
        "timed out".to_string(),
        3,
        3,
        true,
        123.0,
        Some("req-timeout"),
    );
    assert!(!response.ok);
    assert_eq!(response.status, 0);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("GATEWAY_TIMEOUT")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-timeout")
    );
}

#[test]
fn transport_map_terminal_send_error_maps_transport_unavailable_code() {
    let response = map_terminal_send_error(
        "http://example.test".to_string(),
        "connection refused".to_string(),
        2,
        2,
        false,
        10.0,
        Some("req-unavailable"),
    );
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("TRANSPORT_UNAVAILABLE")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-unavailable")
    );
}

#[test]
fn transport_fetch_wap_invalid_gateway_base_maps_transport_unavailable() {
    let response = with_env_var_locked("GATEWAY_HTTP_BASE", "not-a-url", || {
        fetch_deck_in_process(basic_request("wap://example.test/home.wml".to_string()))
    });
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("TRANSPORT_UNAVAILABLE")
    );
}

#[test]
fn transport_fetch_http_unreachable_returns_terminal_transport_error() {
    let response = fetch_deck_in_process(FetchDeckRequest {
        retries: Some(2),
        timeout_ms: Some(100),
        request_id: Some("req-retry-http".to_string()),
        request_policy: Some(request_policy_with_destination(
            FetchDestinationPolicy::AllowPrivate,
        )),
        ..basic_request("http://127.0.0.1:9/unreachable.wml".to_string())
    });
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("TRANSPORT_UNAVAILABLE")
    );
    let attempts = response
        .error
        .as_ref()
        .and_then(|err| err.details.as_ref())
        .and_then(|details| details.get("attempts"))
        .and_then(|value| value.as_u64());
    assert_eq!(attempts, Some(3));
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-retry-http")
    );
}

#[test]
fn transport_fetch_wap_with_valid_gateway_base_keeps_final_url_on_terminal_error() {
    let response = with_env_var_locked("GATEWAY_HTTP_BASE", "http://127.0.0.1:9", || {
        fetch_deck_in_process(FetchDeckRequest {
            retries: Some(0),
            timeout_ms: Some(100),
            request_id: Some("req-retry-wap".to_string()),
            request_policy: Some(request_policy_with_destination(
                FetchDestinationPolicy::AllowPrivate,
            )),
            ..basic_request("wap://example.test/path.wml?x=1".to_string())
        })
    });
    assert!(!response.ok);
    assert_eq!(response.final_url, "wap://example.test/path.wml?x=1");
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("TRANSPORT_UNAVAILABLE")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-retry-wap")
    );
}

#[test]
fn transport_destination_policy_defaults_to_public_only() {
    let resolved = resolve_fetch_destination_policy(None);
    assert_eq!(resolved, FetchDestinationPolicy::PublicOnly);
}

#[test]
fn transport_destination_policy_rejects_loopback_without_override() {
    let parsed = Url::parse("http://127.0.0.1:8080/deck.wml").expect("url should parse");
    let err = validate_fetch_destination(&parsed, &FetchDestinationPolicy::PublicOnly)
        .expect_err("loopback destination should be blocked");
    assert!(err.contains("public-only"));
    assert!(err.contains("loopback"));
}

#[test]
fn transport_destination_policy_rejects_private_without_override() {
    let parsed = Url::parse("http://10.0.0.8/deck.wml").expect("url should parse");
    let err = validate_fetch_destination(&parsed, &FetchDestinationPolicy::PublicOnly)
        .expect_err("private destination should be blocked");
    assert!(err.contains("private"));
}

#[test]
fn transport_destination_policy_allows_private_with_override() {
    let parsed = Url::parse("http://10.0.0.8/deck.wml").expect("url should parse");
    validate_fetch_destination(&parsed, &FetchDestinationPolicy::AllowPrivate)
        .expect("allow-private should permit private targets");
}

#[test]
fn transport_destination_policy_rejects_unsupported_scheme() {
    let parsed = Url::parse("ftp://example.test/deck.wml").expect("url should parse");
    let err = validate_fetch_destination(&parsed, &FetchDestinationPolicy::PublicOnly)
        .expect_err("unsupported scheme should be rejected");
    assert!(err.contains("Unsupported URL scheme"));
}

#[test]
fn transport_destination_policy_rejects_localhost_domains_without_override() {
    let parsed = Url::parse("http://api.localhost/deck.wml").expect("url should parse");
    let err = validate_fetch_destination(&parsed, &FetchDestinationPolicy::PublicOnly)
        .expect_err("localhost domain should be blocked");
    assert!(err.contains("loopback"));
}

#[test]
fn transport_classify_destination_host_returns_none_when_host_missing() {
    let parsed = Url::parse("mailto:ops@example.test").expect("url should parse");
    assert_eq!(classify_destination_host(&parsed), None);
}

#[test]
fn transport_classify_destination_host_classifies_domain_and_ipv6() {
    let parsed_public = Url::parse("https://example.test/deck.wml").expect("url should parse");
    assert_eq!(
        classify_destination_host(&parsed_public),
        Some(DestinationHostClass::Public)
    );

    let parsed_loopback = Url::parse("https://[::1]/deck.wml").expect("ipv6 url should parse");
    assert_eq!(
        classify_destination_host(&parsed_loopback),
        Some(DestinationHostClass::Loopback)
    );
}

#[test]
fn transport_classify_ip_covers_blocked_destination_classes() {
    assert_eq!(
        classify_ip(IpAddr::V4(Ipv4Addr::UNSPECIFIED)),
        DestinationHostClass::Unspecified
    );
    assert_eq!(
        classify_ip(IpAddr::V4(Ipv4Addr::new(169, 254, 10, 10))),
        DestinationHostClass::LinkLocal
    );
    assert_eq!(
        classify_ip(IpAddr::V4(Ipv4Addr::new(224, 0, 0, 1))),
        DestinationHostClass::Multicast
    );
    assert_eq!(
        classify_ip(IpAddr::V6(Ipv6Addr::UNSPECIFIED)),
        DestinationHostClass::Unspecified
    );
    assert_eq!(
        classify_ip(IpAddr::V6(Ipv6Addr::new(0xfe80, 0, 0, 0, 0, 0, 0, 1))),
        DestinationHostClass::LinkLocal
    );
    assert_eq!(
        classify_ip(IpAddr::V6(Ipv6Addr::new(0xff02, 0, 0, 0, 0, 0, 0, 1))),
        DestinationHostClass::Multicast
    );
}

#[test]
fn transport_fetch_blocks_loopback_when_policy_not_overridden() {
    let response = fetch_deck_in_process(FetchDeckRequest {
        request_id: Some("req-loopback-blocked".to_string()),
        ..basic_request("http://127.0.0.1:9/unreachable.wml".to_string())
    });
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("INVALID_REQUEST")
    );
    let message = response
        .error
        .as_ref()
        .map(|error| error.message.clone())
        .unwrap_or_default();
    assert!(message.contains("public-only"));
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-loopback-blocked")
    );
}

#[test]
fn transport_invalid_request_response_helper() {
    let response = invalid_request_response(
        "http://example.test".to_string(),
        "bad input".to_string(),
        Some("req-helper"),
    );
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|err| err.code.as_str()),
        Some("INVALID_REQUEST")
    );
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-helper")
    );
}

#[test]
fn transport_payload_too_large_response_with_known_actual_bytes() {
    let response = payload_too_large_response(
        200,
        "http://example.test/deck.wml".to_string(),
        "text/vnd.wap.wml".to_string(),
        512 * 1024,
        Some(700_000),
        1,
        5.0,
        Some("req-too-large"),
    );
    assert!(!response.ok);
    assert_eq!(
        response.error.as_ref().map(|error| error.code.as_str()),
        Some("PAYLOAD_TOO_LARGE")
    );
    let message = response
        .error
        .as_ref()
        .map(|error| error.message.as_str())
        .unwrap_or_default();
    assert!(message.contains("got 700000 bytes"));
    assert_eq!(
        detail_string(&response, "requestId").as_deref(),
        Some("req-too-large")
    );
}

#[test]
fn transport_payload_too_large_response_without_actual_bytes() {
    let response = payload_too_large_response(
        200,
        "http://example.test/deck.wml".to_string(),
        "text/vnd.wap.wml".to_string(),
        512 * 1024,
        None,
        2,
        9.0,
        None,
    );
    assert!(!response.ok);
    let message = response
        .error
        .as_ref()
        .map(|error| error.message.as_str())
        .unwrap_or_default();
    assert_eq!(message, "Payload exceeds 524288-byte limit");
}

#[test]
fn transport_error_code_trigger_matrix_is_deterministic() {
    struct Case {
        name: &'static str,
        response: super::FetchDeckResponse,
        expected_code: &'static str,
    }

    let cases = vec![
        Case {
            name: "invalid-request-method",
            response: invalid_request_response(
                "http://example.test".to_string(),
                "Unsupported method: POST".to_string(),
                None,
            ),
            expected_code: "INVALID_REQUEST",
        },
        Case {
            name: "payload-too-large",
            response: payload_too_large_response(
                200,
                "http://example.test/deck.wml".to_string(),
                "text/vnd.wap.wml".to_string(),
                512 * 1024,
                Some(700_000),
                1,
                1.0,
                None,
            ),
            expected_code: "PAYLOAD_TOO_LARGE",
        },
        Case {
            name: "protocol-error-5xx",
            response: map_success_payload_response(
                502,
                false,
                "http://request.example",
                "http://upstream.example",
                "http://request.example".to_string(),
                "text/plain".to_string(),
                b"upstream fail",
                1,
                1.0,
                None,
            ),
            expected_code: "PROTOCOL_ERROR",
        },
        Case {
            name: "unsupported-content-type",
            response: map_success_payload_response(
                200,
                false,
                "http://request.example",
                "http://upstream.example",
                "http://request.example".to_string(),
                "application/json".to_string(),
                br#"{"ok":true}"#,
                1,
                1.0,
                None,
            ),
            expected_code: "UNSUPPORTED_CONTENT_TYPE",
        },
        Case {
            name: "terminal-timeout",
            response: map_terminal_send_error(
                "http://example.test".to_string(),
                "timeout".to_string(),
                2,
                2,
                true,
                5.0,
                None,
            ),
            expected_code: "GATEWAY_TIMEOUT",
        },
        Case {
            name: "terminal-transport-unavailable",
            response: map_terminal_send_error(
                "http://example.test".to_string(),
                "connection refused".to_string(),
                2,
                2,
                false,
                5.0,
                None,
            ),
            expected_code: "TRANSPORT_UNAVAILABLE",
        },
    ];

    for case in cases {
        let code = case
            .response
            .error
            .as_ref()
            .map(|err| err.code.as_str())
            .unwrap_or("<missing>");
        assert_eq!(code, case.expected_code, "case '{}' failed", case.name);
    }
}
