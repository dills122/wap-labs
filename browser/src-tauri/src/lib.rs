pub mod contract_types;
pub mod waves_config;

#[cfg(not(test))]
pub mod bootstrap;
mod engine_bridge;
mod fetch_host;

use contract_types::{
    AdvanceTimeRequest, EngineRuntimeSnapshot, HandleKeyRequest, LoadDeckContextRequest,
    LoadDeckRequest, MoveFocusedSelectEditRequest, NavigateToCardRequest, RenderList,
    SetFocusedInputEditDraftRequest, SetViewportColsRequest,
};
use engine_bridge::{
    command_engine_advance_time_ms, command_engine_begin_focused_input_edit,
    command_engine_begin_focused_select_edit, command_engine_cancel_focused_input_edit,
    command_engine_cancel_focused_select_edit, command_engine_clear_external_navigation_intent,
    command_engine_commit_focused_input_edit, command_engine_commit_focused_select_edit,
    command_engine_handle_key, command_engine_load_deck, command_engine_load_deck_context,
    command_engine_move_focused_select_edit, command_engine_navigate_back,
    command_engine_navigate_to_card, command_engine_render,
    command_engine_set_focused_input_edit_draft, command_engine_set_viewport_cols,
    command_engine_snapshot, AppState,
};
use fetch_host::fetch_deck as host_fetch_deck;
use lowband_transport_rust::{FetchDeckRequest, FetchDeckResponse};
use tauri::State;

#[tauri::command]
fn health() -> String {
    waves_config::HEALTH_RESPONSE.to_string()
}

#[tauri::command]
fn fetch_deck(request: FetchDeckRequest) -> FetchDeckResponse {
    host_fetch_deck(request)
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
fn engine_handle_key(
    state: State<AppState>,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_handle_key(state.inner(), request)
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
fn engine_navigate_back(state: State<AppState>) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_navigate_back(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_set_viewport_cols(
    state: State<AppState>,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, String> {
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
fn engine_begin_focused_input_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_begin_focused_input_edit(state.inner())
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
fn engine_commit_focused_input_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_commit_focused_input_edit(state.inner())
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
fn engine_begin_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_begin_focused_select_edit(state.inner())
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
fn engine_commit_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_commit_focused_select_edit(state.inner())
}

#[tauri::command]
#[cfg_attr(test, allow(dead_code))]
fn engine_cancel_focused_select_edit(
    state: State<AppState>,
) -> Result<EngineRuntimeSnapshot, String> {
    command_engine_cancel_focused_select_edit(state.inner())
}

#[cfg(test)]
mod tests;
