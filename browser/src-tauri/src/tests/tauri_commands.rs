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

#[test]
fn tauri_command_wrappers_handle_focused_input_edit_commands() {
    let state = AppState::default();
    let wml = r##"
    <wml>
      <card id="home">
        <input name="UserName" value="AHMED" type="text"/>
      </card>
    </wml>
    "##;

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: wml.to_string(),
            base_url: "http://local.test/start.wml".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("load should succeed");

    let begin = super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin focused input edit should succeed");
    assert_eq!(begin.focused_input_edit_name.as_deref(), Some("UserName"));
    assert_eq!(begin.focused_input_edit_value.as_deref(), Some("AHMED"));

    let drafted = super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "BOB".to_string(),
        },
    )
    .expect("set focused input draft should succeed");
    assert_eq!(drafted.focused_input_edit_value.as_deref(), Some("BOB"));
    let render =
        super::super::engine_render(borrowed_state(&state)).expect("render should succeed");
    assert!(render.draw.iter().any(|cmd| match cmd {
        DrawCmd::Link { text, href, .. } => {
            href == "input:UserName" && text.contains("[UserName: BOB]")
        }
        _ => false,
    }));

    let committed = super::super::engine_commit_focused_input_edit(borrowed_state(&state))
        .expect("commit focused input edit should succeed");
    assert_eq!(committed.focused_input_edit_name, None);
    assert_eq!(committed.focused_input_edit_value, None);

    let begin_again = super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin focused input edit should succeed");
    assert_eq!(begin_again.focused_input_edit_value.as_deref(), Some("BOB"));
    let cancelled = super::super::engine_cancel_focused_input_edit(borrowed_state(&state))
        .expect("cancel focused input edit should succeed");
    assert_eq!(cancelled.focused_input_edit_name, None);
}

#[test]
fn tauri_command_wrappers_submit_two_input_post_payload_after_edit_flow() {
    let state = AppState::default();
    let wml = r##"
    <wml>
      <card id="login">
        <p>User: <input name="username" value="" type="text"/></p>
        <p>PIN: <input name="pin" value="" type="password"/></p>
        <do type="accept">
          <go method="post" href="/login">
            <postfield name="username" value="$(username)"/>
            <postfield name="pin" value="$(pin)"/>
          </go>
        </do>
      </card>
    </wml>
    "##;

    super::super::engine_load_deck_context(
        borrowed_state(&state),
        LoadDeckContextRequest {
            wml_xml: wml.to_string(),
            base_url: "wap://localhost/login".to_string(),
            content_type: "text/vnd.wap.wml".to_string(),
            raw_bytes_base64: None,
        },
    )
    .expect("load should succeed");

    super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin username edit should succeed");
    super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "usern1220".to_string(),
        },
    )
    .expect("username draft should succeed");
    super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Down,
        },
    )
    .expect("down key should commit username and move focus");

    super::super::engine_begin_focused_input_edit(borrowed_state(&state))
        .expect("begin pin edit should succeed");
    super::super::engine_set_focused_input_edit_draft(
        borrowed_state(&state),
        SetFocusedInputEditDraftRequest {
            value: "1220".to_string(),
        },
    )
    .expect("pin draft should succeed");
    super::super::engine_commit_focused_input_edit(borrowed_state(&state))
        .expect("pin commit should succeed");

    let submitted = super::super::engine_handle_key(
        borrowed_state(&state),
        HandleKeyRequest {
            key: EngineKey::Enter,
        },
    )
    .expect("enter should execute accept action");
    let policy = submitted
        .external_navigation_request_policy
        .expect("submit should emit external navigation request policy");
    let post_context = policy
        .post_context
        .expect("submit should include post context");
    assert_eq!(
        post_context.payload.as_deref(),
        Some("username=usern1220&pin=1220")
    );
}
