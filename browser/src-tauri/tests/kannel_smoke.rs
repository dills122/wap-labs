use lowband_transport_rust::{
    fetch_deck_in_process, FetchDeckRequest, FetchDestinationPolicy, FetchRequestPolicy,
};
use wavenav_engine::{DrawCmd, WmlEngine};

fn request(url: &str) -> FetchDeckRequest {
    FetchDeckRequest {
        url: url.to_string(),
        method: Some("GET".to_string()),
        headers: None,
        timeout_ms: Some(15000),
        retries: Some(1),
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

fn fetch_kannel_smoke_target() -> lowband_transport_rust::FetchDeckResponse {
    let target = std::env::var("WAP_SMOKE_URL").unwrap_or_else(|_| "wap://localhost/".to_string());
    let transport = fetch_deck_in_process(request(&target));
    assert!(
        transport.ok,
        "expected transport smoke fetch to succeed: {:?}",
        transport.error
    );
    transport
}

fn load_transport_response_into_engine(
    engine: &mut WmlEngine,
    transport: lowband_transport_rust::FetchDeckResponse,
) {
    let deck = transport
        .engine_deck_input
        .expect("engineDeckInput should be present");
    engine
        .load_deck_context(
            &deck.wml_xml,
            &deck.base_url,
            &deck.content_type,
            deck.raw_bytes_base64,
        )
        .expect("transport response should load into engine");
}

fn render_contains(engine: &WmlEngine, expected_text: &str) -> bool {
    let render = engine.render().expect("render should succeed");
    render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Text { text, .. } => text.contains(expected_text),
        DrawCmd::Link { text, .. } => text.contains(expected_text),
    })
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_fetch_deck_smoke_loads_into_engine() {
    let mut engine = WmlEngine::new();
    load_transport_response_into_engine(&mut engine, fetch_kannel_smoke_target());
    let active = engine.active_card_id().expect("active card should exist");
    assert!(matches!(active.as_str(), "home" | "welcome" | "login"));
    assert!(render_contains(&engine, "Local WAP training environment."));
    assert!(render_contains(&engine, "Open Menu"));
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_fetch_deck_smoke_navigates_into_menu_card() {
    let mut engine = WmlEngine::new();
    load_transport_response_into_engine(&mut engine, fetch_kannel_smoke_target());
    assert_eq!(engine.active_card_id().as_deref(), Ok("home"));
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate into menu card");
    assert_eq!(engine.active_card_id().as_deref(), Ok("menu"));
    assert!(render_contains(&engine, "Main Menu"));
    assert!(render_contains(&engine, "1. Login"));
    assert!(render_contains(&engine, "2. Register"));
}
