use super::*;

fn borrowed_state(state: &AppState) -> tauri::State<'_, AppState> {
    // `tauri::State<'_, T>` is a tuple wrapper around `&T`; tests can borrow it directly.
    unsafe { std::mem::transmute::<&AppState, tauri::State<'_, AppState>>(state) }
}

#[test]
fn tauri_command_wrappers_drive_managed_state_roundtrip() {
    let state = AppState::default();

    let loaded = super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: BASIC_NAV_WML.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("load should succeed");
    assert_eq!(loaded.active_card_id.as_deref(), Some("home"));

    let rendered =
        super::super::engine_render(borrowed_state(&state)).expect("render should succeed");
    assert!(
        rendered.draw.iter().any(|cmd| match cmd {
            DrawCmd::Text { text, .. } => text.contains("Hello from Waves"),
            DrawCmd::Link { text, .. } => text.contains("Next"),
        }),
        "render output should include deck content"
    );

    let after_enter = super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate");
    assert_eq!(after_enter.active_card_id.as_deref(), Some("next"));

    let after_back =
        super::super::engine_navigate_back(borrowed_state(&state)).expect("back should succeed");
    assert_eq!(after_back.active_card_id.as_deref(), Some("home"));

    let snapshot =
        super::super::engine_snapshot(borrowed_state(&state)).expect("snapshot should succeed");
    assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
}

#[test]
fn tauri_command_wrappers_handle_external_intent_and_timer_paths() {
    let state = AppState::default();

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: EXTERNAL_LINK_WML.to_string(),
            base_url: "http://local.test/dir/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("load should succeed");
    let after_enter = super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should set external intent");
    assert_eq!(
        after_enter.external_navigation_intent.as_deref(),
        Some("http://local.test/dir/next.wml?foo=1")
    );

    let after_clear = super::super::engine_clear_external_navigation_intent(borrowed_state(&state))
        .expect("clear should succeed");
    assert_eq!(after_clear.external_navigation_intent, None);

    let timer_state = AppState::default();
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
    super::super::engine_load_deck_context(
        borrowed_state(&timer_state),
        LoadDeckContextRequest {
            wml_xml: xml.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("load should succeed");
    super::super::engine_handle_key(
        borrowed_state(&timer_state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should navigate to timed card");
    let advanced = super::super::engine_advance_time_ms(
        borrowed_state(&timer_state),
        AdvanceTimeRequest { delta_ms: 100 },
    )
    .expect("advance should succeed");
    assert_eq!(advanced.active_card_id.as_deref(), Some("done"));
}
