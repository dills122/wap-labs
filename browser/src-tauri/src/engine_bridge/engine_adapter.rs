use super::engine_debug_host::{EngineDebugHostState, EngineDebugPolicy};
use crate::contract_types::{
    AdvanceTimeRequest, EngineFrame, EngineRuntimeSnapshot, HandleInputRequest, HandleKeyRequest,
    LoadDeckContextRequest, LoadDeckRequest, MoveFocusedSelectEditRequest, NavigateToCardRequest,
    RenderList, ScriptDialogRequestSnapshot, ScriptTimerRequestSnapshot,
    SetFocusedInputEditDraftRequest, SetViewportColsRequest,
};
use std::sync::Mutex;
use wavenav_engine::{DeckNavigationContext, EngineViewportError, WmlEngine};

#[cfg(test)]
std::thread_local! {
    static FORCE_NEXT_FRAME_FAILURE: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
}

pub struct AppState {
    pub(crate) engine: Mutex<WmlEngine>,
    pub(crate) debug_host: Mutex<EngineDebugHostState>,
    pub(crate) debug_policy: EngineDebugPolicy,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new(EngineDebugPolicy::default())
    }
}

impl AppState {
    fn new(debug_policy: EngineDebugPolicy) -> Self {
        Self {
            engine: Mutex::new(WmlEngine::new()),
            debug_host: Mutex::new(EngineDebugHostState::default()),
            debug_policy,
        }
    }

    pub fn from_local_config() -> Self {
        Self::new(EngineDebugPolicy::from_local_config())
    }

    #[cfg(test)]
    pub(crate) fn with_debug_policy_enabled(enabled: bool) -> Self {
        Self::new(EngineDebugPolicy::from_enabled(enabled))
    }
}

fn snapshot(engine: &WmlEngine) -> EngineRuntimeSnapshot {
    EngineRuntimeSnapshot {
        active_card_id: engine.active_card_id().ok(),
        focused_link_index: engine.focused_link_index(),
        next_timer_wakeup_ms: engine.next_timer_wakeup_ms(),
        focused_input_edit_name: engine.focused_input_edit_name(),
        focused_input_edit_value: engine.focused_input_edit_value(),
        focused_select_edit_name: engine.focused_select_edit_name(),
        focused_select_edit_value: engine.focused_select_edit_value(),
        base_url: engine.base_url(),
        content_type: engine.content_type(),
        browser_context_epoch: Some(engine.browser_context_epoch()),
        history_push_sequence: Some(engine.history_push_sequence()),
        deck_language: engine.deck_language(),
        active_card_language: engine.active_card_language(),
        last_back_navigation_handled: engine.last_back_navigation_handled(),
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

fn frame(engine: &WmlEngine) -> Result<EngineFrame, String> {
    #[cfg(test)]
    if FORCE_NEXT_FRAME_FAILURE.with(|force| force.replace(false)) {
        return Err("forced frame failure".to_string());
    }
    let output = engine.render_output().map_err(|error| error.to_string())?;
    Ok(EngineFrame {
        snapshot: snapshot(engine),
        render: output.render.into(),
        presentation: output.presentation,
    })
}

fn mutate_then_frame(
    engine: &mut WmlEngine,
    mutate: impl FnOnce(&mut WmlEngine) -> Result<(), String>,
) -> Result<EngineFrame, String> {
    let mut candidate = engine.clone();
    mutate(&mut candidate)?;
    let candidate_frame = frame(&candidate)?;
    *engine = candidate;
    Ok(candidate_frame)
}

#[cfg(test)]
pub(crate) fn force_next_frame_failure() {
    FORCE_NEXT_FRAME_FAILURE.with(|force| {
        assert!(
            !force.replace(true),
            "a forced frame failure is already pending"
        );
    });
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
    engine.load_deck_context_for_navigation(
        &request.wml_xml,
        &request.base_url,
        &request.content_type,
        request.raw_bytes_base64,
        DeckNavigationContext::new(
            request.referring_url.as_deref(),
            request.navigation_url.as_deref(),
            request.navigation_kind.unwrap_or_default().into(),
        ),
    )?;
    Ok(snapshot(engine))
}

pub fn apply_render(engine: &WmlEngine) -> Result<RenderList, String> {
    Ok(engine.render().map_err(|error| error.to_string())?.into())
}

pub fn apply_render_frame(engine: &WmlEngine) -> Result<EngineFrame, String> {
    frame(engine)
}

pub fn apply_handle_key(
    engine: &mut WmlEngine,
    request: HandleKeyRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.handle_key(request.key.as_str().to_string())?;
    Ok(snapshot(engine))
}

pub fn apply_handle_key_frame(
    engine: &mut WmlEngine,
    request: HandleKeyRequest,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.handle_key(request.key.as_str().to_string())
    })
}

pub fn apply_handle_input_frame(
    engine: &mut WmlEngine,
    request: HandleInputRequest,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| candidate.handle_input(request.event))
}

pub fn apply_navigate_to_card(
    engine: &mut WmlEngine,
    request: NavigateToCardRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.navigate_to_card(request.card_id)?;
    Ok(snapshot(engine))
}

pub fn apply_navigate_to_card_frame(
    engine: &mut WmlEngine,
    request: NavigateToCardRequest,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.navigate_to_card(request.card_id)
    })
}

pub fn apply_navigate_back(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.navigate_back();
    snapshot(engine)
}

pub fn apply_navigate_back_frame(engine: &mut WmlEngine) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.navigate_back();
        Ok(())
    })
}

pub fn apply_set_viewport_cols(
    engine: &mut WmlEngine,
    request: SetViewportColsRequest,
) -> Result<EngineRuntimeSnapshot, EngineViewportError> {
    let cols =
        u64::try_from(request.cols).map_err(|_| EngineViewportError::invalid(request.cols))?;
    engine.set_viewport_cols(cols)?;
    Ok(snapshot(engine))
}

pub fn apply_advance_time_ms(
    engine: &mut WmlEngine,
    request: AdvanceTimeRequest,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.advance_time_ms(request.delta_ms)?;
    Ok(snapshot(engine))
}

pub fn apply_advance_time_ms_frame(
    engine: &mut WmlEngine,
    request: AdvanceTimeRequest,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.advance_time_ms(request.delta_ms)
    })
}

pub fn apply_load_deck_context_frame(
    engine: &mut WmlEngine,
    request: LoadDeckContextRequest,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.load_deck_context_for_navigation(
            &request.wml_xml,
            &request.base_url,
            &request.content_type,
            request.raw_bytes_base64,
            DeckNavigationContext::new(
                request.referring_url.as_deref(),
                request.navigation_url.as_deref(),
                request.navigation_kind.unwrap_or_default().into(),
            ),
        )
    })
}

pub fn apply_engine_snapshot(engine: &WmlEngine) -> EngineRuntimeSnapshot {
    snapshot(engine)
}

pub fn apply_clear_external_navigation_intent(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.clear_external_navigation_intent();
    snapshot(engine)
}

pub fn apply_clear_external_navigation_intent_frame(
    engine: &mut WmlEngine,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.clear_external_navigation_intent();
        Ok(())
    })
}

pub fn apply_begin_focused_input_edit(
    engine: &mut WmlEngine,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.begin_focused_input_edit()?;
    Ok(snapshot(engine))
}

pub fn apply_begin_focused_input_edit_frame(engine: &mut WmlEngine) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.begin_focused_input_edit().map(|_| ())
    })
}

pub fn apply_set_focused_input_edit_draft(
    engine: &mut WmlEngine,
    request: SetFocusedInputEditDraftRequest,
) -> EngineRuntimeSnapshot {
    engine.set_focused_input_edit_draft(request.value);
    snapshot(engine)
}

pub fn apply_set_focused_input_edit_draft_frame(
    engine: &mut WmlEngine,
    request: SetFocusedInputEditDraftRequest,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.set_focused_input_edit_draft(request.value);
        Ok(())
    })
}

pub fn apply_commit_focused_input_edit(
    engine: &mut WmlEngine,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.commit_focused_input_edit()?;
    Ok(snapshot(engine))
}

pub fn apply_commit_focused_input_edit_frame(
    engine: &mut WmlEngine,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.commit_focused_input_edit().map(|_| ())
    })
}

pub fn apply_cancel_focused_input_edit(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.cancel_focused_input_edit();
    snapshot(engine)
}

pub fn apply_cancel_focused_input_edit_frame(
    engine: &mut WmlEngine,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.cancel_focused_input_edit();
        Ok(())
    })
}

pub fn apply_begin_focused_select_edit(
    engine: &mut WmlEngine,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.begin_focused_select_edit()?;
    Ok(snapshot(engine))
}

pub fn apply_begin_focused_select_edit_frame(
    engine: &mut WmlEngine,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.begin_focused_select_edit().map(|_| ())
    })
}

pub fn apply_move_focused_select_edit(
    engine: &mut WmlEngine,
    request: MoveFocusedSelectEditRequest,
) -> EngineRuntimeSnapshot {
    engine.move_focused_select_edit(request.delta);
    snapshot(engine)
}

pub fn apply_move_focused_select_edit_frame(
    engine: &mut WmlEngine,
    request: MoveFocusedSelectEditRequest,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.move_focused_select_edit(request.delta);
        Ok(())
    })
}

pub fn apply_commit_focused_select_edit(
    engine: &mut WmlEngine,
) -> Result<EngineRuntimeSnapshot, String> {
    engine.commit_focused_select_edit()?;
    Ok(snapshot(engine))
}

pub fn apply_commit_focused_select_edit_frame(
    engine: &mut WmlEngine,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.commit_focused_select_edit().map(|_| ())
    })
}

pub fn apply_cancel_focused_select_edit(engine: &mut WmlEngine) -> EngineRuntimeSnapshot {
    engine.cancel_focused_select_edit();
    snapshot(engine)
}

pub fn apply_cancel_focused_select_edit_frame(
    engine: &mut WmlEngine,
) -> Result<EngineFrame, String> {
    mutate_then_frame(engine, |candidate| {
        candidate.cancel_focused_select_edit();
        Ok(())
    })
}
