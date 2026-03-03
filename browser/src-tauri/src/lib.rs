pub mod contract_types;
pub mod waves_config;

use contract_types::{
    AdvanceTimeRequest, EngineRuntimeSnapshot, HandleKeyRequest, LoadDeckContextRequest,
    LoadDeckRequest, NavigateToCardRequest, RenderList, ScriptDialogRequestSnapshot,
    ScriptTimerRequestSnapshot, SetViewportColsRequest,
};
use lowband_transport_rust::{
    fetch_deck_in_process, preflight_wbxml_decoder, FetchDeckRequest, FetchDeckResponse,
};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use tauri::menu::{AboutMetadataBuilder, Menu, MenuBuilder, SubmenuBuilder};
use tauri::path::BaseDirectory;
use tauri::Emitter;
use tauri::Manager;
use tauri::State;
use wavenav_engine::WmlEngine;

struct AppState {
    engine: Mutex<WmlEngine>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            engine: Mutex::new(WmlEngine::new()),
        }
    }
}

fn snapshot(engine: &WmlEngine) -> EngineRuntimeSnapshot {
    EngineRuntimeSnapshot {
        active_card_id: engine.active_card_id().ok(),
        focused_link_index: engine.focused_link_index(),
        base_url: engine.base_url(),
        content_type: engine.content_type(),
        external_navigation_intent: engine.external_navigation_intent(),
        last_script_execution_ok: engine.last_script_execution_ok(),
        last_script_execution_trap: engine.last_script_execution_trap(),
        last_script_execution_error_class: engine.last_script_execution_error_class(),
        last_script_execution_error_category: engine.last_script_execution_error_category(),
        last_script_requires_refresh: engine.last_script_requires_refresh(),
        last_script_dialog_requests: engine
            .last_script_dialog_requests()
            .into_iter()
            .map(|request| match request {
                wavenav_engine::ScriptDialogRequestLiteral::Alert { message } => {
                    ScriptDialogRequestSnapshot::Alert { message }
                }
                wavenav_engine::ScriptDialogRequestLiteral::Confirm { message } => {
                    ScriptDialogRequestSnapshot::Confirm { message }
                }
                wavenav_engine::ScriptDialogRequestLiteral::Prompt {
                    message,
                    default_value,
                } => ScriptDialogRequestSnapshot::Prompt {
                    message,
                    default_value,
                },
            })
            .collect(),
        last_script_timer_requests: engine
            .last_script_timer_requests()
            .into_iter()
            .map(|request| match request {
                wavenav_engine::ScriptTimerRequestLiteral::Schedule { delay_ms, token } => {
                    ScriptTimerRequestSnapshot::Schedule { delay_ms, token }
                }
                wavenav_engine::ScriptTimerRequestLiteral::Cancel { token } => {
                    ScriptTimerRequestSnapshot::Cancel { token }
                }
            })
            .collect(),
    }
}

fn apply_load_deck(
    engine: &mut WmlEngine,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.load_deck(&request.wml_xml)?;
    Ok(snapshot(engine))
}

fn apply_load_deck_context(
    engine: &mut WmlEngine,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.load_deck_context(
        &request.wml_xml,
        &request.base_url,
        &request.content_type,
        request.raw_bytes_base64,
    )?;
    Ok(snapshot(engine))
}

fn apply_render(engine: &WmlEngine) -> Result<RenderList, String> {
    Ok(engine.render()?.into())
}

fn apply_handle_key(
    engine: &mut WmlEngine,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.handle_key(request.key.as_str().to_string())?;
    Ok(snapshot(engine))
}

fn apply_navigate_to_card(
    engine: &mut WmlEngine,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.navigate_to_card(request.card_id)?;
    Ok(snapshot(engine))
}

fn apply_navigate_back(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.navigate_back();
    snapshot(engine)
}

fn apply_set_viewport_cols(
    engine: &mut WmlEngine,
    request: SetViewportColsRequest,
) -> EngineRuntimeSnapshot {
    engine.set_viewport_cols(request.cols);
    snapshot(engine)
}

fn apply_advance_time_ms(
    engine: &mut WmlEngine,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.advance_time_ms(request.delta_ms)?;
    Ok(snapshot(engine))
}

fn apply_engine_snapshot(engine: &WmlEngine) -> EngineRuntimeSnapshot {
    snapshot(engine)
}

fn apply_clear_external_navigation_intent(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.clear_external_navigation_intent();
    snapshot(engine)
}

fn lock_engine<'a>(state: &'a AppState) -> Result<std::sync::MutexGuard<'a, WmlEngine>, String> {
    state
        .engine
        .lock()
        .map_err(|_| "engine state lock poisoned".to_string())
}

#[tauri::command]
fn health() -> String {
    waves_config::HEALTH_RESPONSE.to_string()
}

fn bundled_wbxml_resource_relpath() -> &'static str {
    #[cfg(target_os = "macos")]
    {
        "wbxml/macos/wbxml2xml"
    }
    #[cfg(target_os = "linux")]
    {
        "wbxml/linux/wbxml2xml"
    }
    #[cfg(target_os = "windows")]
    {
        "wbxml/windows/wbxml2xml.exe"
    }
}

fn configure_bundled_wbxml_decoder(app: &tauri::AppHandle) -> Result<(), String> {
    let resource_path = app
        .path()
        .resolve(bundled_wbxml_resource_relpath(), BaseDirectory::Resource)
        .map_err(|err| format!("failed resolving wbxml resource path: {err}"))?;
    if !resource_path.is_file() {
        return Ok(());
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&resource_path)
            .map_err(|err| format!("failed reading wbxml binary metadata: {err}"))?
            .permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&resource_path, perms)
            .map_err(|err| format!("failed making wbxml binary executable: {err}"))?;
    }

    std::env::set_var("WBXML2XML_BIN", &resource_path);
    Ok(())
}

fn preflight_wbxml_decoder_available() -> Result<(), String> {
    let backend = preflight_wbxml_decoder()?;
    println!("WBXML decoder backend: {backend}");
    Ok(())
}

#[tauri::command]
fn fetch_deck(mut request: FetchDeckRequest) -> FetchDeckResponse {
    ensure_request_id(&mut request);
    fetch_deck_in_process(request)
}

fn next_request_id() -> String {
    static REQUEST_SEQUENCE: AtomicU64 = AtomicU64::new(1);
    let seq = REQUEST_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    format!("{}{seq}", waves_config::FETCH_REQUEST_ID_PREFIX)
}

fn ensure_request_id(request: &mut FetchDeckRequest) {
    let keep_existing = request
        .request_id
        .as_ref()
        .map(|value| !value.trim().is_empty())
        .unwrap_or(false);
    if !keep_existing {
        request.request_id = Some(next_request_id());
    }
}

fn handle_check_for_updates_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Err(error) = app.emit(
        waves_config::EVENT_UPDATER_CHECK_REQUESTED,
        serde_json::json!({
            "source": "menu",
            "placeholder": true
        }),
    ) {
        eprintln!("failed to emit updater check event: {error}");
    }
    println!("Check for Updates requested (hook ready, updater not yet implemented)");
}

fn build_app_menu<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let about_metadata = AboutMetadataBuilder::new()
        .name(Some(waves_config::APP_NAME))
        .version(Some(env!("CARGO_PKG_VERSION")))
        .short_version(Some(waves_config::APP_SHORT_VERSION))
        .comments(Some(waves_config::APP_ABOUT_COMMENTS))
        .copyright(Some(waves_config::APP_COPYRIGHT))
        .build();

    let mut menu = MenuBuilder::new(app);

    #[cfg(target_os = "macos")]
    {
        menu = menu.item(
            &SubmenuBuilder::new(app, waves_config::APP_NAME)
                .about(Some(about_metadata.clone()))
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?,
        );
    }

    #[cfg(not(any(
        target_os = "linux",
        target_os = "dragonfly",
        target_os = "freebsd",
        target_os = "netbsd",
        target_os = "openbsd"
    )))]
    {
        menu = menu.item(
            &SubmenuBuilder::new(app, "File")
                .close_window()
                .separator()
                .quit()
                .build()?,
        );
    }

    menu = menu
        .item(
            &SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .separator()
                .select_all()
                .build()?,
        )
        .item(
            &SubmenuBuilder::new(app, "Window")
                .minimize()
                .maximize()
                .separator()
                .close_window()
                .build()?,
        )
        .item(
            &SubmenuBuilder::new(app, "Help")
                .text(
                    waves_config::MENU_CHECK_FOR_UPDATES_ID,
                    waves_config::MENU_CHECK_FOR_UPDATES_LABEL,
                )
                .separator()
                .about(Some(about_metadata))
                .build()?,
        );

    menu.build()
}

#[tauri::command]
fn engine_load_deck(
    state: State<AppState>,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_load_deck(state.inner(), request)
}

#[tauri::command]
fn engine_load_deck_context(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_load_deck_context(state.inner(), request)
}

#[tauri::command]
fn engine_render(state: State<AppState>) -> Result<RenderList, String> {
    command_engine_render(state.inner())
}

#[tauri::command]
fn engine_handle_key(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_handle_key(state.inner(), request)
}

#[tauri::command]
fn engine_navigate_to_card(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_navigate_to_card(state.inner(), request)
}

#[tauri::command]
fn engine_navigate_back(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_navigate_back(state.inner())
}

#[tauri::command]
fn engine_set_viewport_cols(
    state: State<AppState>,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_set_viewport_cols(state.inner(), request)
}

#[tauri::command]
fn engine_advance_time_ms(
    state: State<AppState>,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_advance_time_ms(state.inner(), request)
}

#[tauri::command]
fn engine_snapshot(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_snapshot(state.inner())
}

#[tauri::command]
fn engine_clear_external_navigation_intent(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_clear_external_navigation_intent(state.inner())
}

fn command_engine_load_deck(
    state: &AppState,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_load_deck(&mut engine, request)
}

fn command_engine_load_deck_context(
    state: &AppState,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_load_deck_context(&mut engine, request)
}

fn command_engine_render(state: &AppState) -> Result<RenderList, String> {
    let engine = lock_engine(state)?;
    apply_render(&engine)
}

fn command_engine_handle_key(
    state: &AppState,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_handle_key(&mut engine, request)
}

fn command_engine_navigate_to_card(
    state: &AppState,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_navigate_to_card(&mut engine, request)
}

fn command_engine_navigate_back(state: &AppState) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_navigate_back(&mut engine))
}

fn command_engine_set_viewport_cols(
    state: &AppState,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_set_viewport_cols(&mut engine, request))
}

fn command_engine_advance_time_ms(
    state: &AppState,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_advance_time_ms(&mut engine, request)
}

fn command_engine_snapshot(state: &AppState) -> Result<EngineRuntimeSnapshot, String> {
    let engine = lock_engine(state)?;
    Ok(apply_engine_snapshot(&engine))
}

fn command_engine_clear_external_navigation_intent(
    state: &AppState,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_clear_external_navigation_intent(&mut engine))
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .menu(build_app_menu)
        .on_menu_event(|app, event| {
            if event.id() == waves_config::MENU_CHECK_FOR_UPDATES_ID {
                handle_check_for_updates_menu(app);
            }
        })
        .setup(|app| {
            configure_bundled_wbxml_decoder(app.handle())?;
            preflight_wbxml_decoder_available()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            health,
            fetch_deck,
            engine_load_deck,
            engine_load_deck_context,
            engine_render,
            engine_handle_key,
            engine_navigate_to_card,
            engine_navigate_back,
            engine_set_viewport_cols,
            engine_advance_time_ms,
            engine_snapshot,
            engine_clear_external_navigation_intent
        ])
        .run(tauri::generate_context!())
        .expect(waves_config::RUN_ERROR_CONTEXT);
}

#[cfg(test)]
mod tests {
    use super::{
        apply_advance_time_ms, apply_clear_external_navigation_intent, apply_engine_snapshot,
        apply_handle_key, apply_load_deck, apply_load_deck_context, apply_navigate_back,
        apply_navigate_to_card, apply_render, apply_set_viewport_cols,
        bundled_wbxml_resource_relpath, command_engine_advance_time_ms,
        command_engine_clear_external_navigation_intent, command_engine_handle_key,
        command_engine_load_deck, command_engine_load_deck_context, command_engine_navigate_back,
        command_engine_navigate_to_card, command_engine_render, command_engine_set_viewport_cols,
        command_engine_snapshot, contract_types, ensure_request_id, fetch_deck, health,
        AdvanceTimeRequest, AppState, HandleKeyRequest, LoadDeckContextRequest, LoadDeckRequest,
        NavigateToCardRequest, ScriptDialogRequestSnapshot, ScriptTimerRequestSnapshot,
        SetViewportColsRequest,
    };
    use contract_types::{DrawCmd, EngineKey};
    use lowband_transport_rust::{
        EngineDeckInputPayload, FetchDeckRequest, FetchDeckResponse, FetchTiming,
    };
    use wavenav_engine::WmlEngine;

    const BASIC_NAV_WML: &str = r##"
    <wml>
      <card id="home">
        <p>Hello from Waves</p>
        <a href="#next">Next</a>
      </card>
      <card id="next">
        <p>Second card</p>
      </card>
    </wml>
    "##;

    const EXTERNAL_LINK_WML: &str = r##"
    <wml>
      <card id="home">
        <a href="next.wml?foo=1">Load External</a>
      </card>
    </wml>
    "##;

    const FIXTURE_LOAD_NAV_EXTERNAL_WML: &str =
        include_str!("../tests/fixtures/integration/load-nav-external.wml");

    fn mock_fetch_ok(url: &str, content_type: &str, wml: &str) -> FetchDeckResponse {
        FetchDeckResponse {
            ok: true,
            status: 200,
            final_url: url.to_string(),
            content_type: content_type.to_string(),
            wml: Some(wml.to_string()),
            error: None,
            timing_ms: FetchTiming {
                encode: 0.0,
                udp_rtt: 1.0,
                decode: 0.0,
            },
            engine_deck_input: Some(EngineDeckInputPayload {
                wml_xml: wml.to_string(),
                base_url: url.to_string(),
                content_type: content_type.to_string(),
                raw_bytes_base64: None,
            }),
        }
    }

    fn load_transport_response_into_engine(
        engine: &mut WmlEngine,
        transport: FetchDeckResponse,
    ) -> Result<super::EngineRuntimeSnapshot, String> {
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

    fn detail_string(response: &FetchDeckResponse, key: &str) -> Option<String> {
        response
            .error
            .as_ref()
            .and_then(|error| error.details.as_ref())
            .and_then(|details| details.get(key))
            .and_then(|value| value.as_str())
            .map(str::to_string)
    }

    #[test]
    fn smoke_load_render_and_snapshot() {
        let mut engine = WmlEngine::new();
        let snapshot = apply_load_deck_context(
            &mut engine,
            LoadDeckContextRequest {
                wml_xml: BASIC_NAV_WML.to_string(),
                base_url: "http://local.test/start.wml".to_string(),
                content_type: "text/vnd.wap.wml".to_string(),
                raw_bytes_base64: None,
            },
        )
        .expect("deck should load");
        assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));

        let render = apply_render(&engine).expect("render should succeed");
        let contains_greeting = render.draw.iter().any(|cmd| match cmd {
            DrawCmd::Text { text, .. } => text.contains("Hello from Waves"),
            _ => false,
        });
        assert!(
            contains_greeting,
            "render output should include greeting text"
        );

        let post = apply_engine_snapshot(&engine);
        assert_eq!(post.focused_link_index, 0);
    }

    #[test]
    fn smoke_key_navigation_and_back_stack() {
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

        let after_enter = apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Enter,
            },
        )
        .expect("enter should navigate");
        assert_eq!(after_enter.active_card_id.as_deref(), Some("next"));

        let after_back = apply_navigate_back(&mut engine);
        assert_eq!(after_back.active_card_id.as_deref(), Some("home"));
    }

    #[test]
    fn advance_time_command_expires_timer_card_deterministically() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="2"/>
            <onevent type="ontimer"><go href="#done"/></onevent>
            <p>Timed</p>
          </card>
          <card id="done"><p>Done</p></card>
        </wml>
        "##;
        apply_load_deck_context(
            &mut engine,
            LoadDeckContextRequest {
                wml_xml: xml.to_string(),
                base_url: "http://local.test/start.wml".to_string(),
                content_type: "text/vnd.wap.wml".to_string(),
                raw_bytes_base64: None,
            },
        )
        .expect("deck should load");
        apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Enter,
            },
        )
        .expect("enter should navigate to timer card");

        let snapshot = apply_advance_time_ms(&mut engine, AdvanceTimeRequest { delta_ms: 200 })
            .expect("advance should trigger ontimer");
        assert_eq!(snapshot.active_card_id.as_deref(), Some("done"));
    }

    #[test]
    fn smoke_external_intent_set_and_clear() {
        let mut engine = WmlEngine::new();
        apply_load_deck_context(
            &mut engine,
            LoadDeckContextRequest {
                wml_xml: EXTERNAL_LINK_WML.to_string(),
                base_url: "http://local.test/dir/start.wml".to_string(),
                content_type: "text/vnd.wap.wml".to_string(),
                raw_bytes_base64: None,
            },
        )
        .expect("deck should load");

        apply_set_viewport_cols(&mut engine, super::SetViewportColsRequest { cols: 20 });
        let after_enter = apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Enter,
            },
        )
        .expect("enter should set external intent");
        assert_eq!(
            after_enter.external_navigation_intent.as_deref(),
            Some("http://local.test/dir/next.wml?foo=1")
        );

        let after_clear = apply_clear_external_navigation_intent(&mut engine);
        assert_eq!(after_clear.external_navigation_intent, None);
    }

    #[test]
    fn snapshot_exposes_script_dialog_and_timer_requests() {
        let mut engine = WmlEngine::new();
        let script_deck = r##"
        <wml>
          <card id="home">
            <a href="script:effects.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
        apply_load_deck_context(
            &mut engine,
            LoadDeckContextRequest {
                wml_xml: script_deck.to_string(),
                base_url: "http://local.test/start.wml".to_string(),
                content_type: "text/vnd.wap.wml".to_string(),
                raw_bytes_base64: None,
            },
        )
        .expect("deck should load");

        let mut unit = Vec::new();
        unit.push(0x03);
        unit.push(5);
        unit.extend_from_slice(b"hello");
        unit.push(0x20);
        unit.push(0x05);
        unit.push(0x01); // alert(message)
        unit.push(0x01);
        unit.push(25);
        unit.push(0x03);
        unit.push(3);
        unit.extend_from_slice(b"otp");
        unit.push(0x20);
        unit.push(0x08);
        unit.push(0x02); // setTimer(delay, token)
        unit.push(0x00);
        engine.register_script_unit("effects.wmlsc".to_string(), unit);

        apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Enter,
            },
        )
        .expect("enter should invoke script");

        let snapshot = apply_engine_snapshot(&engine);
        assert_eq!(snapshot.last_script_dialog_requests.len(), 1);
        assert_eq!(snapshot.last_script_timer_requests.len(), 1);
        assert!(matches!(
            snapshot.last_script_dialog_requests[0],
            ScriptDialogRequestSnapshot::Alert { .. }
        ));
        assert!(matches!(
            snapshot.last_script_timer_requests[0],
            ScriptTimerRequestSnapshot::Schedule { .. }
        ));
    }

    #[test]
    fn snapshot_exposes_script_error_class_and_category() {
        let mut engine = WmlEngine::new();
        let script_deck = r##"
        <wml>
          <card id="home">
            <a href="script:nonfatal.wmlsc#main">Run non-fatal</a>
            <a href="script:fatal.wmlsc#main">Run fatal</a>
          </card>
        </wml>
        "##;
        apply_load_deck_context(
            &mut engine,
            LoadDeckContextRequest {
                wml_xml: script_deck.to_string(),
                base_url: "http://local.test/start.wml".to_string(),
                content_type: "text/vnd.wap.wml".to_string(),
                raw_bytes_base64: None,
            },
        )
        .expect("deck should load");

        engine.register_script_unit(
            "nonfatal.wmlsc".to_string(),
            vec![0x03, 1, b'x', 0x01, 1, 0x02, 0x00],
        );
        engine.register_script_unit("fatal.wmlsc".to_string(), vec![0xff]);

        apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Enter,
            },
        )
        .expect("non-fatal script should not abort");

        let nonfatal_snapshot = apply_engine_snapshot(&engine);
        assert_eq!(nonfatal_snapshot.last_script_execution_ok, Some(true));
        assert_eq!(
            nonfatal_snapshot
                .last_script_execution_error_class
                .as_deref(),
            Some("non-fatal")
        );
        assert_eq!(
            nonfatal_snapshot
                .last_script_execution_error_category
                .as_deref(),
            Some("computational")
        );

        apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Down,
            },
        )
        .expect("focus should move to second link");
        let err = apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Enter,
            },
        )
        .expect_err("fatal script should abort key handling");
        assert!(err.contains("unsupported opcode"));

        let fatal_snapshot = apply_engine_snapshot(&engine);
        assert_eq!(fatal_snapshot.last_script_execution_ok, Some(false));
        assert_eq!(
            fatal_snapshot.last_script_execution_error_class.as_deref(),
            Some("fatal")
        );
        assert_eq!(
            fatal_snapshot
                .last_script_execution_error_category
                .as_deref(),
            Some("integrity")
        );
    }

    #[test]
    fn browser_flow_http_fetch_then_engine_load_succeeds() {
        let wml = r#"<wml><card id="home"><p>HTTP Fetch Deck</p></card></wml>"#;
        let response = mock_fetch_ok("http://example.test/index.wml", "text/vnd.wap.wml", wml);

        let mut engine = WmlEngine::new();
        let snapshot = load_transport_response_into_engine(&mut engine, response)
            .expect("engine loadDeckContext should succeed");
        assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
        assert_render_contains(&engine, "HTTP Fetch Deck");
    }

    #[test]
    fn browser_flow_wap_fetch_then_engine_load_succeeds() {
        let wml = r#"<wml><card id="wap"><p>WAP Fetch Deck</p></card></wml>"#;
        let response = mock_fetch_ok(
            "wap://example.test/start.wml?src=wap",
            "text/vnd.wap.wml",
            wml,
        );
        assert_eq!(response.final_url, "wap://example.test/start.wml?src=wap");

        let mut engine = WmlEngine::new();
        load_transport_response_into_engine(&mut engine, response)
            .expect("engine loadDeckContext should succeed");
        assert_render_contains(&engine, "WAP Fetch Deck");
    }

    #[test]
    fn browser_e2e_fetch_load_render_sequence_renders_expected_content() {
        let wml = r##"
        <wml>
          <card id="home">
            <p>Transport-to-engine pipeline</p>
            <a href="#next">Next</a>
          </card>
          <card id="next"><p>Second</p></card>
        </wml>
        "##;
        let transport = mock_fetch_ok("http://example.test/deck.wml", "text/vnd.wap.wml", wml);
        assert!(transport.ok, "transport fetch should succeed");

        let mut engine = WmlEngine::new();
        let snapshot = load_transport_response_into_engine(&mut engine, transport)
            .expect("loadDeckContext should succeed");
        assert_eq!(snapshot.active_card_id.as_deref(), Some("home"));
        assert_render_contains(&engine, "pipeline");
    }

    #[test]
    fn browser_fixture_load_navigate_and_external_intent_flow_is_deterministic() {
        let transport = mock_fetch_ok(
            "http://example.test/fixtures/load-nav-external.wml",
            "text/vnd.wap.wml",
            FIXTURE_LOAD_NAV_EXTERNAL_WML,
        );
        let mut engine = WmlEngine::new();
        let loaded = load_transport_response_into_engine(&mut engine, transport)
            .expect("fixture loadDeckContext should succeed");
        assert_eq!(loaded.active_card_id.as_deref(), Some("home"));
        assert_eq!(loaded.focused_link_index, 0);
        assert_render_contains(&engine, "Fixture Home");

        let after_fragment = apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Enter,
            },
        )
        .expect("enter on first link should navigate to fragment card");
        assert_eq!(after_fragment.active_card_id.as_deref(), Some("menu"));
        assert_eq!(after_fragment.external_navigation_intent, None);
        assert_render_contains(&engine, "Fixture Menu");

        let after_back = apply_navigate_back(&mut engine);
        assert_eq!(after_back.active_card_id.as_deref(), Some("home"));
        assert_eq!(after_back.focused_link_index, 0);

        let after_down = apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Down,
            },
        )
        .expect("down should advance focus to external link");
        assert_eq!(after_down.active_card_id.as_deref(), Some("home"));
        assert_eq!(after_down.focused_link_index, 1);
        assert_eq!(after_down.external_navigation_intent, None);

        let after_external = apply_handle_key(
            &mut engine,
            HandleKeyRequest {
                key: EngineKey::Enter,
            },
        )
        .expect("enter on second link should emit external intent");
        assert_eq!(after_external.active_card_id.as_deref(), Some("home"));
        assert_eq!(after_external.focused_link_index, 1);
        assert_eq!(
            after_external.external_navigation_intent.as_deref(),
            Some("http://example.test/fixtures/news.wml?src=fixture")
        );

        let after_clear = apply_clear_external_navigation_intent(&mut engine);
        assert_eq!(after_clear.external_navigation_intent, None);

        let repeat_snapshot = apply_engine_snapshot(&engine);
        assert_eq!(repeat_snapshot.active_card_id.as_deref(), Some("home"));
        assert_eq!(repeat_snapshot.focused_link_index, 1);
        assert_eq!(repeat_snapshot.external_navigation_intent, None);
    }

    #[test]
    fn fetch_deck_assigns_request_id_when_missing_or_blank() {
        let mut missing = FetchDeckRequest {
            url: "http://example.test".to_string(),
            method: None,
            headers: None,
            timeout_ms: None,
            retries: None,
            request_id: None,
        };
        ensure_request_id(&mut missing);
        let generated = missing.request_id.clone().unwrap_or_default();
        assert!(
            generated.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX),
            "expected generated request id to use waves-fetch-* prefix"
        );

        let mut blank = FetchDeckRequest {
            url: "http://example.test".to_string(),
            method: None,
            headers: None,
            timeout_ms: None,
            retries: None,
            request_id: Some("   ".to_string()),
        };
        ensure_request_id(&mut blank);
        let generated_blank = blank.request_id.unwrap_or_default();
        assert!(
            generated_blank.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX),
            "blank request id should be replaced with generated id"
        );
    }

    #[test]
    fn fetch_deck_preserves_non_blank_request_id() {
        let mut request = FetchDeckRequest {
            url: "http://example.test".to_string(),
            method: None,
            headers: None,
            timeout_ms: None,
            retries: None,
            request_id: Some("req-123".to_string()),
        };
        ensure_request_id(&mut request);
        assert_eq!(request.request_id.as_deref(), Some("req-123"));
    }

    #[test]
    fn next_request_id_sequence_has_expected_prefix() {
        let first = super::next_request_id();
        let second = super::next_request_id();
        assert!(first.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX));
        assert!(second.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX));
        assert_ne!(first, second, "request ids should be unique");
    }

    #[test]
    fn health_command_returns_expected_string() {
        assert_eq!(health(), super::waves_config::HEALTH_RESPONSE);
    }

    #[test]
    fn bundled_wbxml_resource_relpath_looks_valid() {
        let rel = bundled_wbxml_resource_relpath();
        assert!(rel.starts_with("wbxml/"));
        assert!(rel.contains("wbxml2xml"));
    }

    #[test]
    fn fetch_deck_command_keeps_caller_request_id_in_error_details() {
        let response = fetch_deck(FetchDeckRequest {
            url: "http://example.test".to_string(),
            method: Some("POST".to_string()),
            headers: None,
            timeout_ms: None,
            retries: None,
            request_id: Some("caller-id-7".to_string()),
        });
        assert!(!response.ok);
        assert_eq!(
            detail_string(&response, "requestId").as_deref(),
            Some("caller-id-7")
        );
    }

    #[test]
    fn fetch_deck_command_generates_request_id_when_missing() {
        let response = fetch_deck(FetchDeckRequest {
            url: "http://example.test".to_string(),
            method: Some("POST".to_string()),
            headers: None,
            timeout_ms: None,
            retries: None,
            request_id: None,
        });
        assert!(!response.ok);
        let generated = detail_string(&response, "requestId").unwrap_or_default();
        assert!(
            generated.starts_with(super::waves_config::FETCH_REQUEST_ID_PREFIX),
            "expected generated request id in transport error details"
        );
    }

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

        let _set_cols =
            command_engine_set_viewport_cols(&state, SetViewportColsRequest { cols: 18 })
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
}
