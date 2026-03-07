use lowband_transport_rust::{
    FetchDeckRequest, FetchDeckResponse, FetchDestinationPolicy, FetchRequestPolicy,
};

fn smoke_timeout_ms() -> u64 {
    std::env::var("TRANSPORT_WAP_TIMEOUT_MS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(15000)
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
