use super::*;

#[test]
fn apply_load_deck_returns_error_for_invalid_root() {
    let mut engine = WmlEngine::new();
    let error = apply_load_deck(
        &mut engine,
        LoadDeckRequest {
            wml_xml: canonical_text_wml("<card id=\"home\"><p>bad</p></card>"),
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
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
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
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "application/vnd.wap.wmlc".to_string(),
            raw_bytes_base64: Some(raw),
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect_err("oversized raw payload should fail");
    assert!(error.contains("Raw deck payload exceeds"));
}

#[test]
fn one_over_limit_viewport_is_typed_and_recovery_load_succeeds() {
    let mut engine = WmlEngine::new();
    let error = apply_set_viewport_cols(
        &mut engine,
        SetViewportColsRequest {
            cols: (u32::MAX as usize) + 1,
        },
    )
    .expect_err("one over the frame contract range must be rejected");

    assert!(matches!(
        error,
        wavenav_engine::EngineViewportError::InvalidViewport {
            requested_cols,
            min_cols: 1,
            max_cols: u32::MAX,
            ..
        } if requested_cols == "4294967296"
    ));
    assert!(
        engine.active_card_id().is_err(),
        "viewport validation must happen before engine mutation"
    );

    apply_set_viewport_cols(&mut engine, SetViewportColsRequest { cols: 20 })
        .expect("a valid viewport must succeed after rejection");
    let frame = apply_load_deck_context_frame(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("a valid load must succeed after viewport rejection");
    assert_eq!(frame.snapshot.active_card_id.as_deref(), Some("home"));
}

fn frame_test_engine(wml: &str) -> WmlEngine {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(wml),
            base_url: "http://local.test/atomic.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("atomicity fixture should load");
    engine
}

fn observable_engine_state(engine: &WmlEngine) -> serde_json::Value {
    serde_json::json!({
        "snapshot": apply_engine_snapshot(engine),
        "render": engine.render().map(|render| serde_json::to_value(render).expect("render serializes")),
        "presentation": engine.render_frame().map(|frame| serde_json::to_value(frame).expect("frame serializes")),
        "variables": (["UserName", "Choice", "marker"]
            .into_iter()
            .map(|name| (name, engine.get_var(name.to_string())))
            .collect::<Vec<_>>()),
        "trace": engine.trace_entries(),
        "diagnostics": engine.last_wml_load_diagnostics(),
    })
}

fn assert_forced_frame_failure_is_atomic(
    operation_name: &str,
    mut engine: WmlEngine,
    mut operation: impl FnMut(&mut WmlEngine) -> Result<crate::contract_types::EngineFrame, String>,
) {
    let before = observable_engine_state(&engine);
    force_next_frame_failure();
    let error = operation(&mut engine).expect_err("fault injection must reject the frame command");
    assert_eq!(error, "forced frame failure", "{operation_name}");
    assert_eq!(
        observable_engine_state(&engine),
        before,
        "{operation_name} must preserve the exact prior observable state"
    );
    operation(&mut engine)
        .unwrap_or_else(|error| panic!("{operation_name} must recover after rejection: {error}"));
}

#[test]
fn every_mutating_frame_adapter_is_atomic_on_frame_failure() {
    const FORM_WML: &str = r##"
    <wml>
      <card id="home">
        <p>
          <input name="UserName" value="before" type="text"/>
          <select name="Choice" value="a">
            <option value="a">Alpha</option>
            <option value="b">Beta</option>
          </select>
        </p>
      </card>
    </wml>
    "##;
    const TIMER_WML: &str = r##"
    <wml>
      <card id="home">
        <onevent type="ontimer"><go href="#done"/></onevent>
        <timer value="1"/>
        <p>Waiting</p>
      </card>
      <card id="done"><p>Done</p></card>
    </wml>
    "##;

    let replacement = LoadDeckContextRequest {
        wml_xml: canonical_text_wml(r#"<wml><card id="replacement"><p>New</p></card></wml>"#),
        base_url: "http://local.test/replacement.wml".to_string(),
        content_type: "text/vnd.wap.wml".to_string(),
        raw_bytes_base64: None,
        referring_url: None,
        navigation_url: None,
        navigation_kind: None,
    };
    assert_forced_frame_failure_is_atomic(
        "load deck context",
        frame_test_engine(BASIC_NAV_WML),
        |engine| apply_load_deck_context_frame(engine, replacement.clone()),
    );

    assert_forced_frame_failure_is_atomic(
        "handle key",
        frame_test_engine(BASIC_NAV_WML),
        |engine| {
            apply_handle_key_frame(
                engine,
                HandleKeyRequest {
                    key: EngineKey::Enter,
                },
            )
        },
    );
    assert_forced_frame_failure_is_atomic(
        "handle input",
        frame_test_engine(BASIC_NAV_WML),
        |engine| {
            apply_handle_input_frame(
                engine,
                HandleInputRequest {
                    event: EngineInputEvent::Key {
                        key: wavenav_engine::EngineInputKey::Enter,
                    },
                },
            )
        },
    );
    assert_forced_frame_failure_is_atomic(
        "navigate to card",
        frame_test_engine(BASIC_NAV_WML),
        |engine| {
            apply_navigate_to_card_frame(
                engine,
                NavigateToCardRequest {
                    card_id: "next".to_string(),
                },
            )
        },
    );

    let mut back_engine = frame_test_engine(BASIC_NAV_WML);
    back_engine
        .navigate_to_card("next".to_string())
        .expect("back fixture should have history");
    assert_forced_frame_failure_is_atomic("navigate back", back_engine, |engine| {
        apply_navigate_back_frame(engine)
    });

    assert_forced_frame_failure_is_atomic("advance time", frame_test_engine(TIMER_WML), |engine| {
        apply_advance_time_ms_frame(engine, AdvanceTimeRequest { delta_ms: 100 })
    });

    let mut intent_engine = frame_test_engine(EXTERNAL_LINK_WML);
    intent_engine
        .handle_key("enter".to_string())
        .expect("intent fixture should create an external request");
    assert_forced_frame_failure_is_atomic("clear external intent", intent_engine, |engine| {
        apply_clear_external_navigation_intent_frame(engine)
    });

    assert_forced_frame_failure_is_atomic(
        "begin input edit",
        frame_test_engine(FORM_WML),
        apply_begin_focused_input_edit_frame,
    );

    let mut input_draft_engine = frame_test_engine(FORM_WML);
    input_draft_engine
        .begin_focused_input_edit()
        .expect("input edit should begin");
    assert_forced_frame_failure_is_atomic("set input draft", input_draft_engine, |engine| {
        apply_set_focused_input_edit_draft_frame(
            engine,
            SetFocusedInputEditDraftRequest {
                value: "after".to_string(),
            },
        )
    });

    let mut input_commit_engine = frame_test_engine(FORM_WML);
    input_commit_engine
        .begin_focused_input_edit()
        .expect("input edit should begin");
    input_commit_engine.set_focused_input_edit_draft("after".to_string());
    assert_forced_frame_failure_is_atomic("commit input edit", input_commit_engine, |engine| {
        apply_commit_focused_input_edit_frame(engine)
    });

    let mut input_cancel_engine = frame_test_engine(FORM_WML);
    input_cancel_engine
        .begin_focused_input_edit()
        .expect("input edit should begin");
    input_cancel_engine.set_focused_input_edit_draft("after".to_string());
    assert_forced_frame_failure_is_atomic("cancel input edit", input_cancel_engine, |engine| {
        apply_cancel_focused_input_edit_frame(engine)
    });

    let mut select_begin_engine = frame_test_engine(FORM_WML);
    select_begin_engine
        .handle_key("down".to_string())
        .expect("select fixture should focus the select");
    assert_forced_frame_failure_is_atomic("begin select edit", select_begin_engine, |engine| {
        apply_begin_focused_select_edit_frame(engine)
    });

    let mut select_move_engine = frame_test_engine(FORM_WML);
    select_move_engine
        .handle_key("down".to_string())
        .expect("select fixture should focus the select");
    select_move_engine
        .begin_focused_select_edit()
        .expect("select edit should begin");
    assert_forced_frame_failure_is_atomic("move select edit", select_move_engine, |engine| {
        apply_move_focused_select_edit_frame(engine, MoveFocusedSelectEditRequest { delta: 1 })
    });

    let mut select_commit_engine = frame_test_engine(FORM_WML);
    select_commit_engine
        .handle_key("down".to_string())
        .expect("select fixture should focus the select");
    select_commit_engine
        .begin_focused_select_edit()
        .expect("select edit should begin");
    select_commit_engine.move_focused_select_edit(1);
    assert_forced_frame_failure_is_atomic("commit select edit", select_commit_engine, |engine| {
        apply_commit_focused_select_edit_frame(engine)
    });

    let mut select_cancel_engine = frame_test_engine(FORM_WML);
    select_cancel_engine
        .handle_key("down".to_string())
        .expect("select fixture should focus the select");
    select_cancel_engine
        .begin_focused_select_edit()
        .expect("select edit should begin");
    select_cancel_engine.move_focused_select_edit(1);
    assert_forced_frame_failure_is_atomic("cancel select edit", select_cancel_engine, |engine| {
        apply_cancel_focused_select_edit_frame(engine)
    });
}

#[test]
fn apply_load_deck_context_enforces_referring_uri_and_exposes_language_atomically() {
    let mut engine = WmlEngine::new();
    let stable = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(
                r#"<wml xml:lang="en"><card id="stable"><p>Stable</p></card></wml>"#,
            ),
            base_url: "https://stable.test/deck.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("stable deck should load");
    assert_eq!(stable.deck_language.as_deref(), Some("en"));
    assert_eq!(stable.active_card_language.as_deref(), Some("en"));

    let error = apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(
                r#"<wml><head><access domain="trusted.test"/></head><card id="blocked"><p>Blocked</p></card></wml>"#,
            ),
            base_url: "https://service.test/blocked.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: Some("https://attacker.test/source.wml".to_string()),
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect_err("mismatched referring URI must be denied");
    assert_eq!(error, "Deck access denied for referring URI");

    let snapshot = apply_engine_snapshot(&engine);
    assert_eq!(snapshot.active_card_id.as_deref(), Some("stable"));
    assert_eq!(snapshot.base_url, "https://stable.test/deck.wml");
}

#[test]
fn apply_navigate_to_card_returns_error_for_unknown_card() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
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
fn apply_set_viewport_cols_rejects_zero_without_changing_the_previous_viewport() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");

    let before = engine.render_frame().expect("initial frame should render");
    let error = apply_set_viewport_cols(&mut engine, super::SetViewportColsRequest { cols: 0 })
        .expect_err("zero must be rejected");
    assert!(matches!(
        error,
        wavenav_engine::EngineViewportError::InvalidViewport { .. }
    ));
    assert_eq!(
        engine
            .render_frame()
            .expect("prior viewport should remain valid"),
        before
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
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");

    let snapshot = apply_navigate_back(&mut engine);
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
    assert_eq!(snapshot.focused_link_index, 0);
    assert!(!snapshot.last_back_navigation_handled);
}

#[test]
fn wml_303_back_override_handled_state_crosses_the_native_host_contract() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(
                r#"<wml><card id="home">
                  <do name="refresh-back" type="prev"><refresh/></do>
                  <p>Home</p>
                </card></wml>"#,
            ),
            base_url: "http://local.test/wml-303.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect("deck should load");

    let snapshot = apply_navigate_back(&mut engine);
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
    assert!(snapshot.last_back_navigation_handled);
}

#[test]
fn command_engine_wrappers_drive_state_transitions() {
    let state = AppState::default();
    let loaded = command_engine_load_deck_context(
        &state,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
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
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
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
            wml_xml: canonical_text_wml(BASIC_NAV_WML),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "application/vnd.wap.wmlc".to_string(),
            raw_bytes_base64: Some(raw),
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
        },
    )
    .expect_err("oversized raw payload should fail");
    assert_eq!(
        error.code,
        crate::host_contract::HostCommandErrorCode::EngineFailure
    );
    assert!(!error.message.contains(&"A".repeat(128)));
}

#[test]
fn tauri_apply_accept_noop_refresh_prev_and_error_paths_are_deterministic() {
    let mut engine = WmlEngine::new();
    apply_load_deck_context(
        &mut engine,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(TASK_ACTION_ORDER_WML),
            base_url: "http://local.test/task-order.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
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
    assert_trace_kinds_subsequence(&engine, &["KEY"]);
    assert!(!engine
        .trace_entries()
        .iter()
        .any(|entry| matches!(entry.kind.as_str(), "ACTION_ACCEPT" | "ACTION_NOOP")));

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
        <p><a href="#timed">To timed</a></p>
      </card>
      <card id="timed">
        <onevent type="ontimer"><go href="#done"/></onevent>
        <timer value="1"/>
        <p>Timed</p>
      </card>
      <card id="done"><p>Done</p></card>
    </wml>
    "##;
    command_engine_load_deck_context(
        &state,
        LoadDeckContextRequest {
            wml_xml: canonical_text_wml(xml),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
            referring_url: None,
            navigation_url: None,
            navigation_kind: None,
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
