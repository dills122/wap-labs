use super::*;

#[test]
fn apply_load_deck_returns_error_for_invalid_root() {
    let mut engine = WmlEngine::new();
    let error = apply_load_deck(
        &mut engine,
        LoadDeckRequest {
            wml_xml: "<card id=\"home\"><p>bad</p></card>".to_string(),
        },
    )
    .expect_err("invalid root should fail");
    assert!(error.contains("Missing required <wml> root element"));
}

#[test]
fn apply_load_deck_context_rejects_oversized_wml_payload() {
    let mut engine = WmlEngine::new();
    let inner = "a".repeat((512 * 1024) + 1);
    let xml = format!("<wml><card id=\"home\"><p>{inner}</p></card></wml>");

    let error = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: xml,
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect_err("oversized wml should fail");
    assert!(error.contains("Deck payload exceeds"));
}

#[test]
fn apply_load_deck_context_rejects_oversized_raw_payload() {
    let mut engine = WmlEngine::new();
    let raw = "A".repeat((1024 * 1024) + 1);

    let error = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "application/vnd.wap.wmlc".to_string(),
            raw_bytes_base64: Some(raw),
        },
    )
    .expect_err("oversized raw payload should fail");
    assert!(error.contains("Raw deck payload exceeds"));
}

#[test]
fn apply_navigate_to_card_returns_error_for_unknown_card() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("deck should load");

    let error = apply_navigate_to_card(
        &mut engine,
        NavigateToCardRequest {
            card_id: "missing".to_string(),
        },
    )
    .expect_err("unknown card should fail");
    assert_eq!(error, "Card id not found");
}

#[test]
fn load_transport_response_into_engine_requires_ok_and_engine_input() {
    let mut engine = WmlEngine::new();
    let non_ok = FetchDeckResponse {
        ok: false,
        status: 500,
        final_url: "http://example.test".to_string(),
        content_type: "text/plain".to_string(),
        wml: None,
        error: None,
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: 0.0,
            decode: 0.0,
        },
        engine_deck_input: None,
    };
    let err_non_ok = load_transport_response_into_engine(&mut engine, non_ok)
        .expect_err("non-ok response should fail");
    assert_eq!(err_non_ok, "transport response is not ok");

    let ok_missing_input = FetchDeckResponse {
        ok: true,
        status: 200,
        final_url: "http://example.test".to_string(),
        content_type: "text/vnd.wap.wml".to_string(),
        wml: Some("<wml><card id=\"home\"><p>hi</p></card></wml>".to_string()),
        error: None,
        timing_ms: FetchTiming {
            encode: 0.0,
            udp_rtt: 0.0,
            decode: 0.0,
        },
        engine_deck_input: None,
    };
    let err_missing_input = load_transport_response_into_engine(&mut engine, ok_missing_input)
        .expect_err("missing engine deck input should fail");
    assert_eq!(err_missing_input, "missing engineDeckInput");
}

#[test]
fn apply_set_viewport_cols_clamps_to_minimum_one() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("deck should load");

    apply_set_viewport_cols(&mut engine, super::SetViewportColsRequest { cols: 0 });
    let render = apply_render(&engine).expect("render should succeed");
    assert!(
        !render.draw.is_empty(),
        "render should still succeed at clamped cols"
    );
}

#[test]
fn handle_key_request_rejects_unknown_key_variant() {
    let parsed = serde_json::from_str::<HandleKeyRequest>(r#"{"key":"noop"}"#);
    assert!(
        parsed.is_err(),
        "unknown key should fail request deserialization"
    );
}

#[test]
fn apply_navigate_back_on_empty_history_keeps_state() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("deck should load");

    let snapshot = apply_navigate_back(&mut engine);
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
    assert_eq!(snapshot.focused_link_index, 0);
}

#[test]
fn command_engine_wrappers_drive_state_transitions() {
    let state = AppState::default();
    let loaded = command_engine_load_deck_context(
        &state,
        LoadDeckContextRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("load deck context should succeed");
    assert_eq!(loaded.active_card_id.as_deref(), Some("home"));

    let _render = command_engine_render(&state).expect("render should succeed");
    let entered = command_engine_handle_key(
        &state,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate");
    assert_eq!(entered.active_card_id.as_deref(), Some("next"));

    let backed = command_engine_navigate_back(&state).expect("navigate back should succeed");
    assert_eq!(backed.active_card_id.as_deref(), Some("home"));

    let nav = command_engine_navigate_to_card(
        &state,
        NavigateToCardRequest {
            card_id: "next".to_string(),
        },
    )
    .expect("navigateToCard should succeed");
    assert_eq!(nav.active_card_id.as_deref(), Some("next"));

    let _set_cols = command_engine_set_viewport_cols(&state, SetViewportColsRequest { cols: 18 })
        .expect("set viewport should succeed");
    let snap = command_engine_snapshot(&state).expect("snapshot should succeed");
    assert_eq!(snap.active_card_id.as_deref(), Some("next"));

    let _cleared = command_engine_clear_external_navigation_intent(&state)
        .expect("clear external intent should succeed");
}

#[test]
fn command_engine_load_deck_path_is_callable() {
    let state = AppState::default();
    let out = command_engine_load_deck(
        &state,
        LoadDeckRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
        },
    )
    .expect("load_deck wrapper should succeed");
    assert_eq!(out.active_card_id.as_deref(), Some("home"));
}

#[test]
fn command_engine_load_deck_context_surfaces_oversized_raw_payload_error() {
    let state = AppState::default();
    let raw = "A".repeat((1024 * 1024) + 1);

    let error = command_engine_load_deck_context(
        &state,
        LoadDeckContextRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "application/vnd.wap.wmlc".to_string(),
            raw_bytes_base64: Some(raw),
        },
    )
    .expect_err("oversized raw payload should fail");
    assert!(error.contains("Raw deck payload exceeds"));
}

#[test]
fn tauri_apply_accept_noop_refresh_prev_and_error_paths_are_deterministic() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: TASK_ACTION_ORDER_WML.to_string(),
            base_url: "http://local.test/task-order.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("deck should load");

    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-prev");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate to accept-prev");
    engine.clear_trace_entries();
    let prev_snapshot = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("accept-prev should navigate back");
    assert_eq!(prev_snapshot.active_card_id.as_deref(), Some("home"));
    assert_trace_kinds_subsequence(
        &engine,
        &["KEY", "ACTION_ACCEPT", "ACTION_PREV", "ACTION_BACK"],
    );

    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-prev");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-refresh");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate to accept-refresh");
    engine.clear_trace_entries();
    let refresh_snapshot = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("accept-refresh should keep current card");
    assert_eq!(
        refresh_snapshot.active_card_id.as_deref(),
        Some("accept-refresh")
    );
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_REFRESH"]);

    apply_navigate_back(&mut engine);
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-prev");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-refresh");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-noop");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate to accept-noop");
    engine.clear_trace_entries();
    let noop_snapshot = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("accept-noop should keep current card");
    assert_eq!(noop_snapshot.active_card_id.as_deref(), Some("accept-noop"));
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_NOOP"]);

    apply_navigate_back(&mut engine);
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-prev");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-refresh");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-noop");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down should focus accept-broken");
    apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate to accept-broken");
    engine.clear_trace_entries();
    let err = apply_handle_key(
        &mut engine,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect_err("accept-broken should fail deterministically");
    assert!(err.contains("Card id not found"));
    let snapshot = apply_engine_snapshot(&engine);
    assert_eq!(snapshot.active_card_id.as_deref(), Some("accept-broken"));
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_FRAGMENT"]);
}

#[test]
fn command_engine_advance_time_ms_is_callable() {
    let state = AppState::default();
    let xml = r##"
    <wml>
      <card id="home">
        <a href="#timed">To timed</a>
      </card>
      <card id="timed">
        <timer value="1"/>
        <onevent type="ontimer"><go href="#done"/></onevent>
        <p>Timed</p>
      </card>
      <card id="done"><p>Done</p></card>
    </wml>
    "##;
    command_engine_load_deck_context(
        &state,
        LoadDeckContextRequest {
            wml_xml: xml.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("load should succeed");
    command_engine_handle_key(
        &state,
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate to timed");

    let snapshot = command_engine_advance_time_ms(&state, AdvanceTimeRequest { delta_ms: 100 })
        .expect("advance wrapper should succeed");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("done"));
}
