use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use wavenav_engine::{RenderList, WmlEngine};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FetchDeckRequest {
    url: String,
    method: Option<String>,
    timeout_ms: Option<u64>,
    retries: Option<u8>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FetchDeckResponse {
    ok: bool,
    status: u16,
    final_url: String,
    content_type: String,
    wml: Option<String>,
    error: Option<String>,
}

#[derive(Default)]
struct AppState {
    engine: Mutex<WmlEngine>,
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

#[tauri::command]
fn fetch_deck(request: FetchDeckRequest) -> FetchDeckResponse {
    let _ = (&request.method, request.timeout_ms, request.retries);
    // Skeleton behavior only. Transport-python integration will be wired in the first vertical slice.
    FetchDeckResponse {
        ok: false,
        status: 501,
        final_url: request.url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(
            "fetch_deck not implemented; integrate transport-python HTTP client".to_string(),
        ),
    }
}

#[tauri::command]
fn engine_load_deck(
    state: State<AppState>,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    engine.load_deck(&request.wml_xml)?;
    Ok(snapshot(&engine))
}

#[tauri::command]
fn engine_load_deck_context(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    engine.load_deck_context(
        &request.wml_xml,
        &request.base_url,
        &request.content_type,
        request.raw_bytes_base64,
    )?;
    Ok(snapshot(&engine))
}

#[tauri::command]
fn engine_render(state: State<AppState>) -> Result<RenderList, String> {
    let engine = lock_engine(&state)?;
    engine.render()
}

#[tauri::command]
fn engine_handle_key(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    engine.handle_key(request.key)?;
    Ok(snapshot(&engine))
}

#[tauri::command]
fn engine_navigate_to_card(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    engine.navigate_to_card(request.card_id)?;
    Ok(snapshot(&engine))
}

#[tauri::command]
fn engine_navigate_back(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    engine.navigate_back();
    Ok(snapshot(&engine))
}

#[tauri::command]
fn engine_set_viewport_cols(
    state: State<AppState>,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    engine.set_viewport_cols(request.cols);
    Ok(snapshot(&engine))
}

#[tauri::command]
fn engine_snapshot(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    let engine = lock_engine(&state)?;
    Ok(snapshot(&engine))
}

#[tauri::command]
fn engine_clear_external_navigation_intent(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(&state)?;
    engine.clear_external_navigation_intent();
    Ok(snapshot(&engine))
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
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
