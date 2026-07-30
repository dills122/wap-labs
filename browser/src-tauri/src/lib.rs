pub mod command_contract;
pub mod contract_types;
pub mod waves_config;

pub mod bootstrap;
mod engine_bridge;
mod fetch_host;

use contract_types::{
    AdvanceTimeRequest, EngineCommandError, EngineFrame, EngineRuntimeSnapshot, HandleInputRequest,
    HandleKeyRequest, LoadDeckContextRequest, LoadDeckRequest, MoveFocusedSelectEditRequest,
    NavigateToCardRequest, RenderList, SetFocusedInputEditDraftRequest, SetViewportColsRequest,
};
use engine_bridge::{
    command_engine_advance_time_ms, command_engine_advance_time_ms_frame,
    command_engine_begin_focused_input_edit, command_engine_begin_focused_input_edit_frame,
    command_engine_begin_focused_select_edit, command_engine_begin_focused_select_edit_frame,
    command_engine_cancel_focused_input_edit, command_engine_cancel_focused_input_edit_frame,
    command_engine_cancel_focused_select_edit, command_engine_cancel_focused_select_edit_frame,
    command_engine_clear_external_navigation_intent,
    command_engine_clear_external_navigation_intent_frame,
    command_engine_commit_focused_input_edit, command_engine_commit_focused_input_edit_frame,
    command_engine_commit_focused_select_edit, command_engine_commit_focused_select_edit_frame,
    command_engine_handle_input_frame, command_engine_handle_key, command_engine_handle_key_frame,
    command_engine_load_deck, command_engine_load_deck_context,
    command_engine_load_deck_context_frame, command_engine_move_focused_select_edit,
    command_engine_move_focused_select_edit_frame, command_engine_navigate_back,
    command_engine_navigate_back_frame, command_engine_navigate_to_card,
    command_engine_navigate_to_card_frame, command_engine_render, command_engine_render_frame,
    command_engine_set_focused_input_edit_draft, command_engine_set_focused_input_edit_draft_frame,
    command_engine_set_viewport_cols, command_engine_snapshot, AppState,
};
use fetch_host::fetch_deck_cancellable as host_fetch_deck_cancellable;
use lowband_transport_rust::{FetchCancellationToken, FetchDeckRequest, FetchDeckResponse};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, MutexGuard};
use tauri::State;
use tokio::sync::Semaphore;

const MAX_CONCURRENT_HOST_FETCHES: usize = 2;

#[derive(Debug)]
struct ActiveHostFetch {
    cancellation: FetchCancellationToken,
}

#[derive(Debug)]
struct HostFetchState {
    active: Mutex<HashMap<String, Arc<ActiveHostFetch>>>,
    admission: Arc<Semaphore>,
}

impl Default for HostFetchState {
    fn default() -> Self {
        Self {
            active: Mutex::new(HashMap::new()),
            admission: Arc::new(Semaphore::new(MAX_CONCURRENT_HOST_FETCHES)),
        }
    }
}

impl HostFetchState {
    fn active(&self) -> MutexGuard<'_, HashMap<String, Arc<ActiveHostFetch>>> {
        self.active
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    fn register(&self, request_id: &str) -> Arc<ActiveHostFetch> {
        let active_fetch = Arc::new(ActiveHostFetch {
            cancellation: FetchCancellationToken::default(),
        });
        if let Some(superseded) = self
            .active()
            .insert(request_id.to_string(), active_fetch.clone())
        {
            superseded.cancellation.cancel();
        }
        active_fetch
    }

    fn cancel(&self, request_id: &str) -> bool {
        let active_fetch = self.active().get(request_id).cloned();
        let Some(active_fetch) = active_fetch else {
            return false;
        };
        active_fetch.cancellation.cancel();
        true
    }

    fn complete(&self, request_id: &str, completed: &Arc<ActiveHostFetch>) {
        let mut active = self.active();
        if active
            .get(request_id)
            .is_some_and(|current| Arc::ptr_eq(current, completed))
        {
            active.remove(request_id);
        }
    }
}

#[tauri::command]
fn health() -> String {
    waves_config::HEALTH_RESPONSE.to_string()
}

#[tauri::command]
async fn fetch_deck(
    state: State<'_, HostFetchState>,
    mut request: FetchDeckRequest,
) -> Result<FetchDeckResponse, String> {
    fetch_host::ensure_request_id(&mut request);
    let request_id = request
        .request_id
        .clone()
        .expect("ensure_request_id must assign a request ID");
    let active_fetch = state.register(&request_id);
    let cancellation = active_fetch.cancellation.clone();
    let request_url = request.url.clone();
    let admission = state.admission.clone();
    let permit = (!cancellation.is_cancelled())
        .then(|| admission.try_acquire_owned().ok())
        .flatten();
    let response = match permit {
        Some(permit) => tauri::async_runtime::spawn_blocking(move || {
            let _permit = permit;
            host_fetch_deck_cancellable(request, cancellation)
        })
        .await
        .unwrap_or_else(|join_error| {
            host_fetch_failure(
                String::new(),
                format!("host fetch task failed: {join_error}"),
                None,
            )
        }),
        None if cancellation.is_cancelled() => {
            lowband_transport_rust::cancelled_fetch_response(request_url, Some(&request_id))
        }
        None => host_fetch_failure(
            request_url,
            "host fetch concurrency limit reached".to_string(),
            Some(&request_id),
        ),
    };
    state.complete(&request_id, &active_fetch);
    Ok(response)
}

fn host_fetch_failure(
    final_url: String,
    message: String,
    request_id: Option<&str>,
) -> FetchDeckResponse {
    FetchDeckResponse {
        ok: false,
        status: 0,
        final_url,
        content_type: "text/plain".to_string(),
        wml: None,
        error: Some(lowband_transport_rust::FetchErrorInfo {
            code: "TRANSPORT_UNAVAILABLE".to_string(),
            message,
            details: request_id.map(|request_id| serde_json::json!({ "requestId": request_id })),
        }),
        timing_ms: lowband_transport_rust::FetchTiming {
            encode: 0.0,
            udp_rtt: 0.0,
            decode: 0.0,
        },
        engine_deck_input: None,
    }
}

#[tauri::command]
fn cancel_fetch(state: State<HostFetchState>, request_id: String) -> bool {
    state.cancel(request_id.trim())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_load_deck(
    state: State<AppState>,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_load_deck(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_load_deck_context(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_load_deck_context(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_render(state: State<AppState>) -> Result<RenderList, String> {
    command_engine_render(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_render_frame(state: State<AppState>) -> Result<EngineFrame, String> {
    command_engine_render_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_handle_key(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_handle_key(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_handle_key_frame(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineFrame, String> {
    command_engine_handle_key_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_handle_input_frame(
    state: State<AppState>,
    request: HandleInputRequest,
) -> Result<EngineFrame, String> {
    command_engine_handle_input_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_navigate_to_card(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_navigate_to_card(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_navigate_to_card_frame(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineFrame, String> {
    command_engine_navigate_to_card_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_navigate_back(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_navigate_back(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_navigate_back_frame(state: State<AppState>) -> Result<EngineFrame, String> {
    command_engine_navigate_back_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_set_viewport_cols(
    state: State<AppState>,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, EngineCommandError> {
    command_engine_set_viewport_cols(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_advance_time_ms(
    state: State<AppState>,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_advance_time_ms(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_advance_time_ms_frame(
    state: State<AppState>,
    request: AdvanceTimeRequest,
) -> Result<EngineFrame, String> {
    command_engine_advance_time_ms_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_snapshot(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_snapshot(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_clear_external_navigation_intent(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_clear_external_navigation_intent(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_clear_external_navigation_intent_frame(
    state: State<AppState>,
) -> Result<EngineFrame, String> {
    command_engine_clear_external_navigation_intent_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_load_deck_context_frame(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineFrame, String> {
    command_engine_load_deck_context_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_begin_focused_input_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_begin_focused_input_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_begin_focused_input_edit_frame(state: State<AppState>) -> Result<EngineFrame, String> {
    command_engine_begin_focused_input_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_set_focused_input_edit_draft(
    state: State<AppState>,
    request: SetFocusedInputEditDraftRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_set_focused_input_edit_draft(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_set_focused_input_edit_draft_frame(
    state: State<AppState>,
    request: SetFocusedInputEditDraftRequest,
) -> Result<EngineFrame, String> {
    command_engine_set_focused_input_edit_draft_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_commit_focused_input_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_commit_focused_input_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_commit_focused_input_edit_frame(state: State<AppState>) -> Result<EngineFrame, String> {
    command_engine_commit_focused_input_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_input_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_cancel_focused_input_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_input_edit_frame(state: State<AppState>) -> Result<EngineFrame, String> {
    command_engine_cancel_focused_input_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_begin_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_begin_focused_select_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_begin_focused_select_edit_frame(state: State<AppState>) -> Result<EngineFrame, String> {
    command_engine_begin_focused_select_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_move_focused_select_edit(
    state: State<AppState>,
    request: MoveFocusedSelectEditRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_move_focused_select_edit(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_move_focused_select_edit_frame(
    state: State<AppState>,
    request: MoveFocusedSelectEditRequest,
) -> Result<EngineFrame, String> {
    command_engine_move_focused_select_edit_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_commit_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_commit_focused_select_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_commit_focused_select_edit_frame(state: State<AppState>) -> Result<EngineFrame, String> {
    command_engine_commit_focused_select_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_cancel_focused_select_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_select_edit_frame(state: State<AppState>) -> Result<EngineFrame, String> {
    command_engine_cancel_focused_select_edit_frame(state.inner())
}

#[cfg(test)]
mod tests;
