use super::engine_adapter::{
    apply_advance_time_ms, apply_advance_time_ms_frame, apply_begin_focused_input_edit,
    apply_begin_focused_input_edit_frame, apply_begin_focused_select_edit,
    apply_begin_focused_select_edit_frame, apply_cancel_focused_input_edit,
    apply_cancel_focused_input_edit_frame, apply_cancel_focused_select_edit,
    apply_cancel_focused_select_edit_frame, apply_clear_external_navigation_intent,
    apply_clear_external_navigation_intent_frame, apply_commit_focused_input_edit,
    apply_commit_focused_input_edit_frame, apply_commit_focused_select_edit,
    apply_commit_focused_select_edit_frame, apply_engine_snapshot, apply_handle_key,
    apply_handle_key_frame, apply_load_deck, apply_load_deck_context,
    apply_load_deck_context_frame, apply_move_focused_select_edit,
    apply_move_focused_select_edit_frame, apply_navigate_back, apply_navigate_back_frame,
    apply_navigate_to_card, apply_navigate_to_card_frame, apply_render, apply_render_frame,
    apply_set_focused_input_edit_draft, apply_set_focused_input_edit_draft_frame,
    apply_set_viewport_cols, AppState,
};
use crate::contract_types::{
    AdvanceTimeRequest, EngineFrame, EngineRuntimeSnapshot, HandleKeyRequest,
    LoadDeckContextRequest, LoadDeckRequest, MoveFocusedSelectEditRequest, NavigateToCardRequest,
    RenderList, SetFocusedInputEditDraftRequest, SetViewportColsRequest,
};
use wavenav_engine::WmlEngine;

fn lock_engine<'a>(state: &'a AppState) -> Result<std::sync::MutexGuard<'a, WmlEngine>, String> {
    state
        .engine
        .lock()
        .map_err(|_| "engine state lock poisoned".to_string())
}

pub fn command_engine_load_deck(
    state: &AppState,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_load_deck(&mut engine, request)
}

pub fn command_engine_load_deck_context(
    state: &AppState,
    request: LoadDeckContextRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_load_deck_context(&mut engine, request)
}

pub fn command_engine_render(state: &AppState) -> Result<RenderList, String> {
    let engine = lock_engine(state)?;
    apply_render(&engine)
}

pub fn command_engine_render_frame(state: &AppState) -> Result<EngineFrame, String> {
    let engine = lock_engine(state)?;
    apply_render_frame(&engine)
}

pub fn command_engine_handle_key(
    state: &AppState,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_handle_key(&mut engine, request)
}

pub fn command_engine_handle_key_frame(
    state: &AppState,
    request: HandleKeyRequest,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_handle_key_frame(&mut engine, request)
}

pub fn command_engine_navigate_to_card(
    state: &AppState,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_navigate_to_card(&mut engine, request)
}

pub fn command_engine_navigate_to_card_frame(
    state: &AppState,
    request: NavigateToCardRequest,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_navigate_to_card_frame(&mut engine, request)
}

pub fn command_engine_navigate_back(state: &AppState) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_navigate_back(&mut engine))
}

pub fn command_engine_navigate_back_frame(state: &AppState) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_navigate_back_frame(&mut engine)
}

pub fn command_engine_set_viewport_cols(
    state: &AppState,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_set_viewport_cols(&mut engine, request))
}

pub fn command_engine_advance_time_ms(
    state: &AppState,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_advance_time_ms(&mut engine, request)
}

pub fn command_engine_advance_time_ms_frame(
    state: &AppState,
    request: AdvanceTimeRequest,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_advance_time_ms_frame(&mut engine, request)
}

pub fn command_engine_snapshot(state: &AppState) -> Result<EngineRuntimeSnapshot, String> {
    let engine = lock_engine(state)?;
    Ok(apply_engine_snapshot(&engine))
}

pub fn command_engine_clear_external_navigation_intent(
    state: &AppState,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_clear_external_navigation_intent(&mut engine))
}

pub fn command_engine_clear_external_navigation_intent_frame(
    state: &AppState,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_clear_external_navigation_intent_frame(&mut engine)
}

pub fn command_engine_load_deck_context_frame(
    state: &AppState,
    request: LoadDeckContextRequest,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_load_deck_context_frame(&mut engine, request)
}

pub fn command_engine_begin_focused_input_edit(
    state: &AppState,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_begin_focused_input_edit(&mut engine)
}

pub fn command_engine_begin_focused_input_edit_frame(
    state: &AppState,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_begin_focused_input_edit_frame(&mut engine)
}

pub fn command_engine_set_focused_input_edit_draft(
    state: &AppState,
    request: SetFocusedInputEditDraftRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_set_focused_input_edit_draft(&mut engine, request))
}

pub fn command_engine_set_focused_input_edit_draft_frame(
    state: &AppState,
    request: SetFocusedInputEditDraftRequest,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_set_focused_input_edit_draft_frame(&mut engine, request)
}

pub fn command_engine_commit_focused_input_edit(
    state: &AppState,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_commit_focused_input_edit(&mut engine)
}

pub fn command_engine_commit_focused_input_edit_frame(
    state: &AppState,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_commit_focused_input_edit_frame(&mut engine)
}

pub fn command_engine_cancel_focused_input_edit(
    state: &AppState,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_cancel_focused_input_edit(&mut engine))
}

pub fn command_engine_cancel_focused_input_edit_frame(
    state: &AppState,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_cancel_focused_input_edit_frame(&mut engine)
}

pub fn command_engine_begin_focused_select_edit(
    state: &AppState,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_begin_focused_select_edit(&mut engine)
}

pub fn command_engine_begin_focused_select_edit_frame(
    state: &AppState,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_begin_focused_select_edit_frame(&mut engine)
}

pub fn command_engine_move_focused_select_edit(
    state: &AppState,
    request: MoveFocusedSelectEditRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_move_focused_select_edit(&mut engine, request))
}

pub fn command_engine_move_focused_select_edit_frame(
    state: &AppState,
    request: MoveFocusedSelectEditRequest,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_move_focused_select_edit_frame(&mut engine, request)
}

pub fn command_engine_commit_focused_select_edit(
    state: &AppState,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_commit_focused_select_edit(&mut engine)
}

pub fn command_engine_commit_focused_select_edit_frame(
    state: &AppState,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_commit_focused_select_edit_frame(&mut engine)
}

pub fn command_engine_cancel_focused_select_edit(
    state: &AppState,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_cancel_focused_select_edit(&mut engine))
}

pub fn command_engine_cancel_focused_select_edit_frame(
    state: &AppState,
) -> Result<EngineFrame, String> {
    let mut engine = lock_engine(state)?;
    apply_cancel_focused_select_edit_frame(&mut engine)
}
