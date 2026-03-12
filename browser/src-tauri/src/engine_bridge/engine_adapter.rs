use crate::contract_types::{
    AdvanceTimeRequest, EngineRuntimeSnapshot, HandleKeyRequest, LoadDeckContextRequest,
    LoadDeckRequest, NavigateToCardRequest, RenderList, ScriptDialogRequestSnapshot,
    ScriptTimerRequestSnapshot, SetFocusedInputEditDraftRequest, SetViewportColsRequest,
};
use std::sync::Mutex;
use wavenav_engine::WmlEngine;

pub struct AppState {
    pub(crate) engine: Mutex<WmlEngine>,
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
        focused_input_edit_name: engine.focused_input_edit_name(),
        focused_input_edit_value: engine.focused_input_edit_value(),
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

pub fn apply_begin_focused_input_edit(
    engine: &mut WmlEngine,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.begin_focused_input_edit()?;
    Ok(snapshot(engine))
}

pub fn apply_set_focused_input_edit_draft(
    engine: &mut WmlEngine,
    request: SetFocusedInputEditDraftRequest,
) -> EngineRuntimeSnapshot {
    engine.set_focused_input_edit_draft(request.value);
    snapshot(engine)
}

pub fn apply_commit_focused_input_edit(
    engine: &mut WmlEngine,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.commit_focused_input_edit()?;
    Ok(snapshot(engine))
}

pub fn apply_cancel_focused_input_edit(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.cancel_focused_input_edit();
    snapshot(engine)
}
