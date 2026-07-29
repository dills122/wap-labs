use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use lowband_transport_rust::{
    FetchDeckRequest, FetchDeckResponse, FetchDestinationPolicy, FetchRequestIntent,
    FetchRequestMethod, FetchRequestPolicy, FetchRequestPostField,
};

fn smoke_timeout_ms() -> u64 {
    std::env::var("TRANSPORT_WAP_TIMEOUT_MS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(15000)
}

pub fn assert_wbxml_13_response(response: &FetchDeckResponse) {
    assert_eq!(response.content_type, "application/vnd.wap.wmlc");
    let encoded = response
        .engine_deck_input
        .as_ref()
        .and_then(|deck| deck.raw_bytes_base64.as_deref())
        .expect("compiled WML response should retain raw WBXML bytes");
    let raw = BASE64
        .decode(encoded)
        .expect("rawBytesBase64 should contain valid base64");
    assert!(
        raw.starts_with(&[0x03, 0x0a]),
        "expected WBXML 1.3 version/public-id prefix 03 0a, got {:02x?}",
        raw.get(..2).unwrap_or(&raw)
    );
}

fn smoke_retries() -> u8 {
    std::env::var("TRANSPORT_WAP_RETRIES")
        .ok()
        .and_then(|value| value.parse::<u8>().ok())
        .unwrap_or(1)
}

pub fn request(url: &str) -> FetchDeckRequest {
    FetchDeckRequest {
        url: url.to_string(),
        method: Some("GET".to_string()),
        headers: None,
        timeout_ms: Some(smoke_timeout_ms()),
        retries: Some(smoke_retries()),
        request_id: None,
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: None,
            referer_url: None,
            post_context: None,
            request_intent: None,
            ua_capability_profile: None,
        }),
    }
}

pub fn post_request(url: &str, payload: &str) -> FetchDeckRequest {
    FetchDeckRequest {
        url: url.to_string(),
        method: Some("POST".to_string()),
        headers: None,
        timeout_ms: Some(smoke_timeout_ms()),
        retries: Some(smoke_retries()),
        request_id: None,
        request_policy: Some(FetchRequestPolicy {
            destination_policy: Some(FetchDestinationPolicy::AllowPrivate),
            cache_control: Some(lowband_transport_rust::FetchCacheControlPolicy::NoCache),
            referer_url: Some(url.to_string()),
            post_context: None,
            request_intent: Some(FetchRequestIntent {
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
                            .expect("smoke form payload should contain name/value pairs");
                        FetchRequestPostField {
                            name: name.to_string(),
                            value: value.to_string(),
                        }
                    })
                    .collect(),
                source_content_type: Some("text/vnd.wap.wml; charset=utf-8".to_string()),
            }),
            ua_capability_profile: None,
        }),
    }
}

pub fn assert_engine_input_contains(
    response: &FetchDeckResponse,
    base_url: &str,
    expected_markers: &[&str],
) {
    let deck = response
        .engine_deck_input
        .as_ref()
        .expect("engineDeckInput should be present");
    assert_eq!(deck.base_url, base_url);
    assert!(
        deck.wml_xml.to_ascii_lowercase().contains("<wml"),
        "expected WML XML payload in engineDeckInput"
    );
    for marker in expected_markers {
        assert!(
            deck.wml_xml.contains(marker),
            "expected engineDeckInput.wml_xml to contain marker {:?}",
            marker
        );
    }
    assert!(
        deck.raw_bytes_base64.is_some(),
        "expected raw payload bytes for fidelity/debug path"
    );
}
