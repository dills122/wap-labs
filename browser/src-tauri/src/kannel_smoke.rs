use super::contract_types::{DrawCmd, EngineKey, HandleKeyRequest};
use super::engine_bridge::{apply_handle_key, apply_load_deck_context, apply_render};
use super::fetch_host::fetch_deck;
use super::{EngineRuntimeSnapshot, FetchDeckRequest, FetchDeckResponse, LoadDeckContextRequest};
use lowband_transport_rust::{FetchDestinationPolicy, FetchRequestPolicy};
use wavenav_engine::WmlEngine;

fn smoke_fetch_request(url: String) -> FetchDeckRequest {
    FetchDeckRequest {
        url,
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

fn fetch_kannel_smoke_target() -> FetchDeckResponse {
    let target = std::env::var("WAP_SMOKE_URL").unwrap_or_else(|_| "wap://localhost/".to_string());
    let transport = fetch_deck(smoke_fetch_request(target));
    assert!(
        transport.ok,
        "expected transport smoke fetch to succeed: {:?}",
        transport.error
    );
    transport
}

fn load_transport_response_into_engine(
    engine: &mut WmlEngine,
    transport: FetchDeckResponse,
) -> Result<EngineRuntimeSnapshot, String> {
    if !transport.ok {
        return Err("transport response is not ok".to_string());
    }
    let deck = transport
        .engine_deck_input
        .ok_or_else(|| "missing engineDeckInput".to_string())?;
    apply_load_deck_context(
        engine,
        LoadDeckContextRequest {
            wml_xml: deck.wml_xml,
            base_url: deck.base_url,
            content_type: deck.content_type,
            raw_bytes_base64: deck.raw_bytes_base64,
        },
    )
}

fn assert_render_contains(engine: &WmlEngine, expected_text: &str) {
    let render = apply_render(engine).expect("render should succeed");
    let contains = render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Text { text, .. } => text.contains(expected_text),
        DrawCmd::Link { text, .. } => text.contains(expected_text),
    });
    assert!(
        contains,
        "render output should contain expected text: {expected_text}"
    );
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_fetch_deck_smoke_loads_into_engine() {
    let mut engine = WmlEngine::new();
    let snapshot = load_transport_response_into_engine(&mut engine, fetch_kannel_smoke_target())
        .expect("transport response should load into engine");
    assert!(
        matches!(
            snapshot.active_card_id.as_deref(),
            Some("home") | Some("welcome") | Some("login")
        ),
        "unexpected active card from Kannel-backed deck: {:?}",
        snapshot.active_card_id
    );

    assert_render_contains(&engine, "Local WAP training environment.");
    assert_render_contains(&engine, "Open Menu");
}

#[test]
#[ignore = "runs against external Kannel dev stack (make up)"]
fn kannel_fetch_deck_smoke_navigates_into_menu_card() {
    let mut engine = WmlEngine::new();
    let loaded = load_transport_response_into_engine(&mut engine, fetch_kannel_smoke_target())
        .expect("transport response should load into engine");
    assert_eq!(loaded.active_card_id.as_deref(), Some("home"));
    assert_render_contains(&engine, "Open Menu");

    let entered = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate into menu card");
    assert_eq!(entered.active_card_id.as_deref(), Some("menu"));
    assert_render_contains(&engine, "Main Menu");
    assert_render_contains(&engine, "1. Login");
    assert_render_contains(&engine, "2. Register");
}
