use lowband_transport_rust::{
    fetch_deck_in_process, preflight_wbxml_decoder, FetchDeckRequest, FetchDeckResponse,
};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use tauri::path::BaseDirectory;
use tauri::Manager;
use tauri::State;
use wavenav_engine::{RenderList, WmlEngine};

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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoadDeckRequest {
    wml_xml: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoadDeckContextRequest {
    wml_xml: String,
    base_url: String,
    content_type: String,
    raw_bytes_base64: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HandleKeyRequest {
    key: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NavigateToCardRequest {
    card_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SetViewportColsRequest {
    cols: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct EngineRuntimeSnapshot {
    active_card_id: Option<String>,
    focused_link_index: usize,
    base_url: String,
    content_type: String,
    external_navigation_intent: Option<String>,
    last_script_execution_ok: Option<bool>,
    last_script_execution_trap: Option<String>,
    last_script_requires_refresh: Option<bool>,
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
        last_script_requires_refresh: engine.last_script_requires_refresh(),
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
    engine.render()
}

fn apply_handle_key(
    engine: &mut WmlEngine,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.handle_key(request.key)?;
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

fn apply_engine_snapshot(engine: &WmlEngine) -> EngineRuntimeSnapshot {
    snapshot(engine)
}

fn apply_clear_external_navigation_intent(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.clear_external_navigation_intent();
    snapshot(engine)
}

fn lock_engine<'a>(
    state: &'a State<AppState>,
) -> Result<std::sync::MutexGuard<'a, WmlEngine>, String> {
    state
        .engine
        .lock()
        .map_err(|_| "engine state lock poisoned".to_string())
}

#[tauri::command]
fn health() -> String {
    "wavenav-host-tauri-native-engine".to_string()
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
fn fetch_deck(_state: State<AppState>, mut request: FetchDeckRequest) -> FetchDeckResponse {
    ensure_request_id(&mut request);
    fetch_deck_in_process(request)
}

fn next_request_id() -> String {
    static REQUEST_SEQUENCE: AtomicU64 = AtomicU64::new(1);
    let seq = REQUEST_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    format!("waves-fetch-{seq}")
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

#[tauri::command]
fn engine_load_deck(
    state: State<AppState>,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    apply_load_deck(&mut engine, request)
}

#[tauri::command]
fn engine_load_deck_context(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    apply_load_deck_context(&mut engine, request)
}

#[tauri::command]
fn engine_render(state: State<AppState>) -> Result<RenderList, String> {
    let engine = lock_engine(&state)?;
    apply_render(&engine)
}

#[tauri::command]
fn engine_handle_key(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    apply_handle_key(&mut engine, request)
}

#[tauri::command]
fn engine_navigate_to_card(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    apply_navigate_to_card(&mut engine, request)
}

#[tauri::command]
fn engine_navigate_back(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    Ok(apply_navigate_back(&mut engine))
}

#[tauri::command]
fn engine_set_viewport_cols(
    state: State<AppState>,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    Ok(apply_set_viewport_cols(&mut engine, request))
}

#[tauri::command]
fn engine_snapshot(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    let engine = lock_engine(&state)?;
    Ok(apply_engine_snapshot(&engine))
}

#[tauri::command]
fn engine_clear_external_navigation_intent(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    Ok(apply_clear_external_navigation_intent(&mut engine))
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
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
            engine_snapshot,
            engine_clear_external_navigation_intent
        ])
        .run(tauri::generate_context!())
        .expect("error while running Waves Tauri host");
}

#[cfg(test)]
mod tests {
    use super::{
        apply_clear_external_navigation_intent, apply_engine_snapshot, apply_handle_key,
        apply_load_deck_context, apply_navigate_back, apply_render, apply_set_viewport_cols,
        ensure_request_id, HandleKeyRequest, LoadDeckContextRequest,
    };
    use lowband_transport_rust::{
        EngineDeckInputPayload, FetchDeckRequest, FetchDeckResponse, FetchTiming,
    };
    use wavenav_engine::{DrawCmd, WmlEngine};

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
                key: "enter".to_string(),
            },
        )
        .expect("enter should navigate");
        assert_eq!(after_enter.active_card_id.as_deref(), Some("next"));

        let after_back = apply_navigate_back(&mut engine);
        assert_eq!(after_back.active_card_id.as_deref(), Some("home"));
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
                key: "enter".to_string(),
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
            generated.starts_with("waves-fetch-"),
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
            generated_blank.starts_with("waves-fetch-"),
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
}
