use lowband_transport_rust::{fetch_deck_in_process, FetchDeckRequest};

fn smoke_target_url() -> String {
    std::env::var("WAP_SMOKE_URL").unwrap_or_else(|_| "wap://localhost/".to_string())
}

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

fn request(url: &str) -> FetchDeckRequest {
    FetchDeckRequest {
        url: url.to_string(),
        method: Some("GET".to_string()),
        headers: None,
        timeout_ms: Some(smoke_timeout_ms()),
        retries: Some(smoke_retries()),
    }
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_wap_login_smoke_normalizes_engine_input() {
    let target = smoke_target_url();
    let response = fetch_deck_in_process(request(&target));

    assert!(
        response.ok,
        "expected ok=true for target={target}, got error={:?} status={} contentType={}",
        response.error,
        response.status,
        response.content_type
    );
    assert!(
        response.status >= 200 && response.status < 400,
        "expected success HTTP status, got: {}",
        response.status
    );
    assert_eq!(response.final_url, target);
    assert!(
        response.content_type == "text/vnd.wap.wml"
            || response.content_type == "application/vnd.wap.wml+xml"
            || response.content_type == "text/xml"
            || response.content_type == "application/xml",
        "unexpected content type: {}",
        response.content_type
    );

    let deck = response
        .engine_deck_input
        .expect("engineDeckInput should be present");
    assert_eq!(deck.base_url, target);
    assert!(
        deck.wml_xml.to_ascii_lowercase().contains("<wml"),
        "expected WML XML payload in engineDeckInput"
    );
    assert!(
        deck.raw_bytes_base64.is_some(),
        "expected raw payload bytes for fidelity/debug path"
    );
}
