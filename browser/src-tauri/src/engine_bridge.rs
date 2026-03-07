use crate::contract_types::{
    AdvanceTimeRequest, EngineRuntimeSnapshot, HandleKeyRequest, LoadDeckContextRequest,
    LoadDeckRequest, NavigateToCardRequest, RenderList, ScriptDialogRequestSnapshot,
    ScriptTimerRequestSnapshot, SetViewportColsRequest,
};
use std::sync::Mutex;
use wavenav_engine::WmlEngine;

pub struct AppState {
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
        external_navigation_request_policy: engine
            .external_navigation_request_policy()
            .map(crate::contract_types::ExternalNavigationRequestPolicySnapshot::from),
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

pub fn apply_load_deck(
    engine: &mut WmlEngine,
    request: LoadDeckRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.load_deck(&request.wml_xml)?;
    Ok(snapshot(engine))
}

pub fn apply_load_deck_context(
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

pub fn apply_render(engine: &WmlEngine) -> Result<RenderList, String> {
    Ok(engine.render()?.into())
}

pub fn apply_handle_key(
    engine: &mut WmlEngine,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.handle_key(request.key.as_str().to_string())?;
    Ok(snapshot(engine))
}

pub fn apply_navigate_to_card(
    engine: &mut WmlEngine,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.navigate_to_card(request.card_id)?;
    Ok(snapshot(engine))
}

pub fn apply_navigate_back(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.navigate_back();
    snapshot(engine)
}

pub fn apply_set_viewport_cols(
    engine: &mut WmlEngine,
    request: SetViewportColsRequest,
) -> EngineRuntimeSnapshot {
    engine.set_viewport_cols(request.cols);
    snapshot(engine)
}

pub fn apply_advance_time_ms(
    engine: &mut WmlEngine,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.advance_time_ms(request.delta_ms)?;
    Ok(snapshot(engine))
}

pub fn apply_engine_snapshot(engine: &WmlEngine) -> EngineRuntimeSnapshot {
    snapshot(engine)
}

pub fn apply_clear_external_navigation_intent(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.clear_external_navigation_intent();
    snapshot(engine)
}

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

pub fn command_engine_handle_key(
    state: &AppState,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_handle_key(&mut engine, request)
}

pub fn command_engine_navigate_to_card(
    state: &AppState,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    apply_navigate_to_card(&mut engine, request)
}

pub fn command_engine_navigate_back(state: &AppState) -> Result<EngineRuntimeSnapshot, String> {
    let mut engine = lock_engine(state)?;
    Ok(apply_navigate_back(&mut engine))
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
