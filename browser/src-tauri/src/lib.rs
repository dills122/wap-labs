pub mod application_commands;
pub mod application_state;
pub mod command_contract;
pub mod contract_types;
pub mod host_contract;
pub mod waves_config;

pub mod bootstrap;
mod engine_bridge;
mod fetch_host;

use application_state::{
    ApplicationStateLoadResult, ApplicationStateV1, AtomicApplicationStateBackend,
    ClearApplicationStateComponentRequest, SaveApplicationStateRequest,
};
use contract_types::{
    AdvanceTimeRequest, EngineDebugCloseSessionOutcome, EngineDebugCloseSessionRequest,
    EngineDebugOpenSessionOutcome, EngineDebugOpenSessionRequest, EngineDebugPollEventsOutcome,
    EngineDebugPollEventsRequest, EngineDebugSnapshotOutcome, EngineDebugSnapshotRequest,
    EngineFrame, EngineRuntimeSnapshot, HandleInputRequest, HandleKeyRequest,
    LoadDeckContextRequest, LoadDeckRequest, MoveFocusedSelectEditRequest, NavigateToCardRequest,
    RenderList, SetFocusedInputEditDraftRequest, SetViewportColsRequest,
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
    command_engine_debug_close_session, command_engine_debug_get_snapshot,
    command_engine_debug_open_session, command_engine_debug_poll_events,
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
use host_contract::{validate_correlation_id, HostCommandError};
use lowband_transport_rust::{FetchCancellationToken, FetchDeckRequest, FetchDeckResponse};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, MutexGuard};
use tauri::{AppHandle, Manager, State};
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

#[cfg_attr(test, allow(dead_code))]
fn application_state_backend(app: &AppHandle) -> Result<AtomicApplicationStateBackend, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "application-state-app-data-path-unavailable".to_string())?;
    Ok(AtomicApplicationStateBackend::new(app_data_dir))
}

#[cfg_attr(test, allow(dead_code))]
fn available_monitor_ids(app: &AppHandle) -> Vec<String> {
    app.available_monitors()
        .unwrap_or_default()
        .into_iter()
        .enumerate()
        .map(|(index, monitor)| {
            monitor
                .name()
                .cloned()
                .unwrap_or_else(|| format!("unnamed-monitor-{index}"))
        })
        .collect()
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
async fn application_state_load(app: AppHandle) -> Result<ApplicationStateLoadResult, String> {
    let backend = application_state_backend(&app)?;
    let monitor_ids = available_monitor_ids(&app);
    tauri::async_runtime::spawn_blocking(move || backend.load(&monitor_ids))
        .await
        .map_err(|_| "application-state-load-task-failed".to_string())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
async fn application_state_save(
    app: AppHandle,
    request: SaveApplicationStateRequest,
) -> Result<ApplicationStateV1, String> {
    let backend = application_state_backend(&app)?;
    let monitor_ids = available_monitor_ids(&app);
    tauri::async_runtime::spawn_blocking(move || backend.save(request.state, &monitor_ids))
        .await
        .map_err(|_| "application-state-save-task-failed".to_string())?
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
async fn application_state_reset(app: AppHandle) -> Result<ApplicationStateV1, String> {
    let backend = application_state_backend(&app)?;
    tauri::async_runtime::spawn_blocking(move || backend.reset())
        .await
        .map_err(|_| "application-state-reset-task-failed".to_string())?
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
async fn application_state_clear_component(
    app: AppHandle,
    request: ClearApplicationStateComponentRequest,
) -> Result<ApplicationStateV1, String> {
    let backend = application_state_backend(&app)?;
    let monitor_ids = available_monitor_ids(&app);
    tauri::async_runtime::spawn_blocking(move || {
        backend.clear_component(request.component, &monitor_ids)
    })
    .await
    .map_err(|_| "application-state-clear-task-failed".to_string())?
}

#[tauri::command]
async fn fetch_deck(
    state: State<'_, HostFetchState>,
    mut request: FetchDeckRequest,
) -> Result<FetchDeckResponse, HostCommandError> {
    lowband_transport_rust::validate_fetch_deck_request(&request)
        .map_err(|error| HostCommandError::invalid_request(error.to_string()))?;
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
        .map_err(|_| HostCommandError::task_join_failed()),
        None if cancellation.is_cancelled() => Ok(
            lowband_transport_rust::cancelled_fetch_response(request_url, Some(&request_id)),
        ),
        None => Err(HostCommandError::task_spawn_failed()),
    };
    state.complete(&request_id, &active_fetch);
    response
}

#[tauri::command]
fn cancel_fetch(
    state: State<HostFetchState>,
    request_id: String,
) -> Result<bool, HostCommandError> {
    validate_correlation_id(&request_id)?;
    Ok(state.cancel(request_id.trim()))
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_load_deck(
    state: State<AppState>,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_load_deck(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_load_deck_context(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_load_deck_context(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_render(state: State<AppState>) -> Result<RenderList, HostCommandError> {
    command_engine_render(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_render_frame(state: State<AppState>) -> Result<EngineFrame, HostCommandError> {
    command_engine_render_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_handle_key(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_handle_key(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_handle_key_frame(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_handle_key_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_handle_input_frame(
    state: State<AppState>,
    request: HandleInputRequest,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_handle_input_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_navigate_to_card(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_navigate_to_card(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_navigate_to_card_frame(
    state: State<AppState>,
    request: NavigateToCardRequest,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_navigate_to_card_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_navigate_back(state: State<AppState>) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_navigate_back(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_navigate_back_frame(state: State<AppState>) -> Result<EngineFrame, HostCommandError> {
    command_engine_navigate_back_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_set_viewport_cols(
    state: State<AppState>,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_set_viewport_cols(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_advance_time_ms(
    state: State<AppState>,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_advance_time_ms(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_advance_time_ms_frame(
    state: State<AppState>,
    request: AdvanceTimeRequest,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_advance_time_ms_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_snapshot(state: State<AppState>) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_snapshot(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_debug_open_session(
    state: State<AppState>,
    request: EngineDebugOpenSessionRequest,
) -> EngineDebugOpenSessionOutcome {
    command_engine_debug_open_session(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_debug_poll_events(
    state: State<AppState>,
    request: EngineDebugPollEventsRequest,
) -> EngineDebugPollEventsOutcome {
    command_engine_debug_poll_events(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_debug_get_snapshot(
    state: State<AppState>,
    request: EngineDebugSnapshotRequest,
) -> EngineDebugSnapshotOutcome {
    command_engine_debug_get_snapshot(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_debug_close_session(
    state: State<AppState>,
    request: EngineDebugCloseSessionRequest,
) -> EngineDebugCloseSessionOutcome {
    command_engine_debug_close_session(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_clear_external_navigation_intent(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_clear_external_navigation_intent(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_clear_external_navigation_intent_frame(
    state: State<AppState>,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_clear_external_navigation_intent_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_load_deck_context_frame(
    state: State<AppState>,
    request: LoadDeckContextRequest,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_load_deck_context_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_begin_focused_input_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_begin_focused_input_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_begin_focused_input_edit_frame(
    state: State<AppState>,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_begin_focused_input_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_set_focused_input_edit_draft(
    state: State<AppState>,
    request: SetFocusedInputEditDraftRequest,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_set_focused_input_edit_draft(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_set_focused_input_edit_draft_frame(
    state: State<AppState>,
    request: SetFocusedInputEditDraftRequest,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_set_focused_input_edit_draft_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_commit_focused_input_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_commit_focused_input_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_commit_focused_input_edit_frame(
    state: State<AppState>,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_commit_focused_input_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_input_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_cancel_focused_input_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_input_edit_frame(
    state: State<AppState>,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_cancel_focused_input_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_begin_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_begin_focused_select_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_begin_focused_select_edit_frame(
    state: State<AppState>,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_begin_focused_select_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_move_focused_select_edit(
    state: State<AppState>,
    request: MoveFocusedSelectEditRequest,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_move_focused_select_edit(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_move_focused_select_edit_frame(
    state: State<AppState>,
    request: MoveFocusedSelectEditRequest,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_move_focused_select_edit_frame(state.inner(), request)
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_commit_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_commit_focused_select_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_commit_focused_select_edit_frame(
    state: State<AppState>,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_commit_focused_select_edit_frame(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, HostCommandError> {
    command_engine_cancel_focused_select_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_select_edit_frame(
    state: State<AppState>,
) -> Result<EngineFrame, HostCommandError> {
    command_engine_cancel_focused_select_edit_frame(state.inner())
}

#[cfg(test)]
mod tests;
