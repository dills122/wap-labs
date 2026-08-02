use crate::runtime::card::{CardGoRequest, CardPostField, CardSetVar};
use crate::runtime::variable::{checked_apply_assignments, is_valid_name};
use crate::*;
use url::Url;

use super::{evaluate_href, evaluate_vdata};

impl WmlEngine {
    pub(crate) fn active_do_action_internal(
        &self,
        do_type: &str,
    ) -> Result<Option<CardTaskAction>, String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;
        Ok(deck
            .active_do_action(self.active_card_idx, do_type)
            .cloned())
    }

    pub(crate) fn active_onevent_action_internal(
        &self,
        event_type: &str,
    ) -> Result<Option<CardTaskAction>, String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;
        Ok(deck
            .active_onevent_action(self.active_card_idx, event_type)
            .cloned())
    }

    /// Resolve BACK through the WML1 action set before using intrinsic history.
    /// The active action list is already in card-before-template, document
    /// order, so the first effective `prev` binding is deterministic.
    pub(crate) fn activate_back_internal(&mut self) -> bool {
        let action = match self.active_do_action_internal("prev") {
            Ok(action) => action,
            Err(error) => {
                self.push_trace("ACTION_BACK_ERROR", error);
                return false;
            }
        };
        let Some(action) = action else {
            return self.navigate_back_internal();
        };

        self.push_trace("ACTION_BACK_OVERRIDE", String::new());
        if let Err(error) = self.execute_card_task_action(&action) {
            self.push_trace("ACTION_BACK_OVERRIDE_ERROR", error);
        }
        true
    }

    /// Navigate to `id`, guarded against unbounded recursion.
    ///
    /// `onenterforward`/`onenterbackward` actions and `WMLBrowser.go()` from
    /// WMLScript can re-enter navigation (directly, or via
    /// [`Self::apply_pending_script_effects`]), so a cyclic deck (card A's
    /// `onenterforward` targets card B and B's targets A) would otherwise
    /// recurse until the native or WASM stack overflows. `nav_dispatch_depth`
    /// bounds that recursion, mirroring the `timer_dispatch_depth` guard in
    /// `engine_runtime_internal/timers.rs`.
    pub(crate) fn navigate_to_card_internal(&mut self, id: &str) -> Result<(), String> {
        self.navigate_to_card_internal_with_context(id, true)
    }

    pub(crate) fn navigate_to_card_without_newcontext_internal(
        &mut self,
        id: &str,
    ) -> Result<(), String> {
        self.navigate_to_card_internal_with_context(id, false)
    }

    fn navigate_to_card_internal_with_context(
        &mut self,
        id: &str,
        apply_new_context: bool,
    ) -> Result<(), String> {
        if self.nav_dispatch_depth >= MAX_NAV_DISPATCH_DEPTH {
            self.push_trace("NAV_DEPTH_EXCEEDED", format!("target={id}"));
            return Err("navigation: dispatch depth exceeded".to_string());
        }
        self.nav_dispatch_depth += 1;
        let result = self.navigate_to_card_internal_bounded(id, apply_new_context);
        self.nav_dispatch_depth -= 1;
        result
    }

    fn navigate_to_card_internal_bounded(
        &mut self,
        id: &str,
        apply_new_context: bool,
    ) -> Result<(), String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;

        let next_idx = deck
            .card_index(id)
            .ok_or_else(|| CARD_ID_NOT_FOUND_ERROR.to_string())?;
        let reset_context = apply_new_context && deck.cards[next_idx].new_context;

        // Every fallible entry step below rolls back all navigation state for
        // deterministic failure behavior on entry-task failures. This also
        // unwinds cleanly when a deeper recursive navigation trips the
        // dispatch-depth guard above: each frame rolls back to its own prior
        // state, so the engine ends up back on the last card that was fully,
        // successfully entered before the cycle was detected.
        let nav = NavRollbackGuard::forward(self);
        nav.engine.debug_emit(EngineDebugEventPayload::CardExit);
        nav.engine.stop_active_timer_for_exit();
        nav.engine.cancel_active_input_edit_with_debug();
        nav.engine.active_select_edit = None;
        let previous_idx = nav.engine.active_card_idx;
        if reset_context {
            nav.engine.reset_browser_context_for_newcontext();
            nav.engine.push_trace("NEWCONTEXT", format!("target={id}"));
        } else {
            nav.engine.nav_stack.push(previous_idx);
        }
        nav.engine.active_card_idx = next_idx;
        nav.engine.viewport_offset_row = 0;
        nav.engine.set_focused_link_idx_with_debug(0);
        nav.engine.debug_emit(EngineDebugEventPayload::CardEnter);
        nav.engine.initialize_controls_on_active_card()?;
        if nav.engine.run_onenterforward_for_active_card()? {
            nav.engine.history_push_sequence = nav.engine.history_push_sequence.saturating_add(1);
            nav.commit();
            return Ok(());
        }
        nav.engine.start_timer_for_active_card()?;
        nav.engine.history_push_sequence = nav.engine.history_push_sequence.saturating_add(1);
        nav.commit();
        Ok(())
    }

    pub(crate) fn reset_browser_context_for_newcontext(&mut self) {
        self.reset_browser_context_state();
        self.pending_script_effects = ScriptRuntimeEffects::default();
        self.last_script_outcome = None;
        self.last_script_dialog_requests.clear();
        self.last_script_timer_requests.clear();
    }

    /// Resets the browser-context state shared by both newcontext triggers:
    /// card-attribute `newcontext="true"` entry (via
    /// [`Self::reset_browser_context_for_newcontext`]) and WMLScript
    /// `WMLBrowser.newContext()` (`engine_runtime_internal/script_effects.rs`).
    /// Deliberately excludes `pending_script_effects`/`last_script_outcome`/
    /// `last_script_dialog_requests`/`last_script_timer_requests`: the script
    /// path records the current call's dialog/timer requests into those
    /// fields immediately before requesting a reset, and clearing them here
    /// would drop that call's own outputs before the host reads them.
    pub(crate) fn reset_browser_context_state(&mut self) {
        self.browser_context_epoch = self.browser_context_epoch.saturating_add(1);
        self.history_push_sequence = 0;
        self.vars.clear();
        self.debug_clear_variable_marks();
        self.nav_stack.clear();
        self.focused_link_idx = 0;
        self.external_nav_intent = None;
        self.external_nav_request_policy = None;
        self.active_timer = None;
        self.cancel_active_input_edit_with_debug();
        self.active_select_edit = None;
    }

    /// Navigate back in history, guarded against unbounded recursion. See
    /// [`Self::navigate_to_card_internal`] for why the guard is needed.
    pub(crate) fn navigate_back_internal(&mut self) -> bool {
        self.navigate_back_internal_with_assignments(&[])
    }

    fn navigate_back_internal_with_assignments(
        &mut self,
        assignments: &[(String, String)],
    ) -> bool {
        if self.nav_dispatch_depth >= MAX_NAV_DISPATCH_DEPTH {
            self.push_trace("NAV_DEPTH_EXCEEDED", "target=<back>".to_string());
            return false;
        }
        self.nav_dispatch_depth += 1;
        let result = self.navigate_back_internal_bounded(assignments);
        self.nav_dispatch_depth -= 1;
        result
    }

    fn navigate_back_internal_bounded(&mut self, assignments: &[(String, String)]) -> bool {
        let nav = NavRollbackGuard::back(self);
        let Some(back_target_idx) = nav.engine.nav_stack.pop() else {
            nav.engine.push_trace("ACTION_BACK_EMPTY", String::new());
            nav.commit();
            return false;
        };

        nav.engine.debug_emit(EngineDebugEventPayload::CardExit);
        nav.engine.stop_active_timer_for_exit();
        nav.engine.cancel_active_input_edit_with_debug();
        nav.engine.active_select_edit = None;
        nav.engine.active_card_idx = back_target_idx;
        nav.engine.viewport_offset_row = 0;
        nav.engine.set_focused_link_idx_with_debug(0);
        nav.engine.debug_emit(EngineDebugEventPayload::CardEnter);
        if let Err(err) = nav.engine.apply_set_var_assignments(assignments) {
            nav.engine.push_trace("SETVAR_BUDGET_ERROR", err);
            return true;
        }
        nav.engine.push_trace("ACTION_BACK", String::new());
        // Each fallible entry step traces first, then leaves the guard armed so
        // the drop restores the pre-navigation state before returning.
        if let Err(err) = nav.engine.initialize_controls_on_active_card() {
            nav.engine.push_trace("INPUT_INIT_ERROR", err);
            return true;
        }
        match nav.engine.run_onenterbackward_for_active_card() {
            Ok(true) => {
                nav.commit();
                return true;
            }
            Ok(false) => {}
            Err(err) => {
                nav.engine.push_trace("ACTION_ONENTERBACKWARD_ERROR", err);
                return true;
            }
        }
        if let Err(err) = nav.engine.start_timer_for_active_card() {
            nav.engine.push_trace("ACTION_ONTIMER_ERROR", err);
            return true;
        }
        nav.commit();
        true
    }

    pub(crate) fn run_onenterforward_for_active_card(&mut self) -> Result<bool, String> {
        let action = self.active_onevent_action_internal("onenterforward")?;
        if let Some(action) = action {
            self.execute_card_task_action(&action)?;
            return Ok(true);
        }
        Ok(false)
    }

    pub(crate) fn run_onenterbackward_for_active_card(&mut self) -> Result<bool, String> {
        let action = self.active_onevent_action_internal("onenterbackward")?;
        if let Some(action) = action {
            self.execute_card_task_action(&action)?;
            return Ok(true);
        }
        Ok(false)
    }

    pub(crate) fn execute_card_task_action(
        &mut self,
        action: &CardTaskAction,
    ) -> Result<(), String> {
        let task = TaskRollbackGuard::new(self);
        let result = task.engine.execute_card_task_action_bounded(action);
        if result.is_ok() {
            task.commit();
        }
        result
    }

    fn execute_card_task_action_bounded(&mut self, action: &CardTaskAction) -> Result<(), String> {
        if self.active_input_edit.is_some() {
            self.commit_focused_input_edit_internal()?;
        }
        if self.active_select_edit.is_some() {
            self.commit_focused_select_edit_internal()?;
        }
        self.sync_all_select_variables_on_active_card()?;

        let (action, set_vars) = action.base_and_set_vars();
        let assignments = self.snapshot_set_vars(set_vars)?;

        match action {
            CardTaskAction::Go { href, request } => {
                let href = evaluate_href(href, &self.vars)?;
                self.apply_set_var_assignments(&assignments)?;
                self.execute_prepared_action_href(&href, request)
            }
            CardTaskAction::Prev => {
                self.push_trace("ACTION_PREV", String::new());
                self.navigate_back_internal_with_assignments(&assignments);
                Ok(())
            }
            CardTaskAction::Refresh => {
                self.push_trace("ACTION_REFRESH", String::new());
                self.stop_active_timer_for_exit();
                self.apply_set_var_assignments(&assignments)?;
                self.initialize_controls_on_active_card()?;
                self.start_timer_for_active_card()?;
                Ok(())
            }
            CardTaskAction::Noop => {
                self.push_trace("ACTION_NOOP", String::new());
                Ok(())
            }
            CardTaskAction::WithSetVars { .. } => {
                unreachable!("base_and_set_vars unwraps the setvar wrapper")
            }
        }
    }

    pub(crate) fn execute_action_href(&mut self, href: &str) -> Result<(), String> {
        if self.active_input_edit.is_some() {
            self.commit_focused_input_edit_internal()?;
        }
        if self.active_select_edit.is_some() {
            self.commit_focused_select_edit_internal()?;
        }
        self.sync_all_select_variables_on_active_card()?;

        let href = evaluate_href(href, &self.vars)?;
        self.execute_prepared_action_href(&href, &CardGoRequest::default())
    }

    fn execute_prepared_action_href(
        &mut self,
        href: &str,
        request: &CardGoRequest,
    ) -> Result<(), String> {
        if let Some(script_ref) = parse_script_href(href) {
            let function_name = script_ref.function_name.unwrap_or("main");
            self.push_trace(
                "ACTION_SCRIPT",
                format!("{}#{}", script_ref.src, function_name),
            );
            if let Err(message) =
                self.invoke_script_ref_internal(script_ref.src, function_name, &[])
            {
                self.push_trace("SCRIPT_TRAP", message.clone());
                return Err(message);
            }
            self.push_trace("SCRIPT_OK", String::new());
            return Ok(());
        }

        if let Some(card_id) = href.strip_prefix('#') {
            if request.cache_control.as_deref() == Some("no-cache") {
                let resolved_href = self.resolve_external_href(href);
                self.push_trace("ACTION_EXTERNAL", resolved_href.clone());
                if self.debug_recorder.is_some() {
                    let target = crate::engine_debug_recorder::sanitize_url(&resolved_href);
                    self.debug_emit(EngineDebugEventPayload::ActionExternal {
                        target: target.clone(),
                    });
                    self.debug_emit(EngineDebugEventPayload::NavigationIntent { target });
                }
                self.external_nav_intent = Some(resolved_href.clone());
                self.external_nav_request_policy =
                    Some(self.wml_go_request_policy(&resolved_href, request)?);
                self.cancel_active_input_edit_with_debug();
                self.active_select_edit = None;
                return Ok(());
            }
            self.push_trace("ACTION_FRAGMENT", card_id.to_string());
            self.debug_emit_lazy(|| EngineDebugEventPayload::NavigationIntent {
                target: crate::engine_debug_recorder::sanitize_url(href),
            });
            self.navigate_to_card_internal(card_id)?;
            return Ok(());
        }

        let resolved_href = self.resolve_external_href(href);
        self.push_trace("ACTION_EXTERNAL", href.to_string());
        if self.debug_recorder.is_some() {
            let target = crate::engine_debug_recorder::sanitize_url(&resolved_href);
            self.debug_emit(EngineDebugEventPayload::ActionExternal {
                target: target.clone(),
            });
            self.debug_emit(EngineDebugEventPayload::NavigationIntent { target });
        }
        self.external_nav_intent = Some(resolved_href.clone());
        self.external_nav_request_policy =
            Some(self.wml_go_request_policy(&resolved_href, request)?);
        self.cancel_active_input_edit_with_debug();
        self.active_select_edit = None;
        Ok(())
    }

    fn snapshot_set_vars(&self, set_vars: &[CardSetVar]) -> Result<Vec<(String, String)>, String> {
        set_vars
            .iter()
            .map(|set_var| {
                Ok((
                    evaluate_vdata(&set_var.name, &self.vars)?,
                    evaluate_vdata(&set_var.value, &self.vars)?,
                ))
            })
            .collect()
    }

    fn apply_set_var_assignments(
        &mut self,
        assignments: &[(String, String)],
    ) -> Result<(), String> {
        let debug_marks = self.debug_assignment_marks(assignments);
        let valid_assignments: Vec<(String, String)> = assignments
            .iter()
            .filter(|(name, _)| is_valid_name(name))
            .cloned()
            .collect();
        checked_apply_assignments(&mut self.vars, &valid_assignments)?;
        for (name, reason) in debug_marks {
            self.debug_mark_variable(name, reason);
        }
        Ok(())
    }

    pub(crate) fn resolve_external_href(&self, href: &str) -> String {
        if self.base_url.is_empty() {
            return href.to_string();
        }

        let Ok(base) = Url::parse(&self.base_url) else {
            return href.to_string();
        };

        match base.join(href) {
            Ok(resolved) => resolved.to_string(),
            Err(_) => href.to_string(),
        }
    }

    pub(crate) fn default_external_navigation_request_policy(
        &self,
    ) -> ScriptNavigationRequestPolicyLiteral {
        ScriptNavigationRequestPolicyLiteral {
            cache_control: None,
            referer_url: None,
            post_context: None,
            request_intent: None,
        }
    }

    fn wml_go_request_policy(
        &mut self,
        resolved_href: &str,
        request: &CardGoRequest,
    ) -> Result<ScriptNavigationRequestPolicyLiteral, String> {
        let method = if request.method.eq_ignore_ascii_case("POST") {
            ScriptNavigationMethodLiteral::Post
        } else {
            ScriptNavigationMethodLiteral::Get
        };
        let enctype = evaluate_vdata(&request.enctype, &self.vars)?;
        let same_deck = self.is_same_document_navigation(resolved_href);
        let post_fields = self.resolve_post_fields(&request.post_fields)?;
        let referer_url = if !request.send_referer || self.base_url.trim().is_empty() {
            None
        } else {
            Some(self.base_url.clone())
        };
        let post_context = if method == ScriptNavigationMethodLiteral::Post
            && enctype == "application/x-www-form-urlencoded"
        {
            Some(ScriptNavigationPostContextLiteral {
                same_deck: Some(same_deck),
                content_type: Some(enctype.clone()),
                payload: Some(Self::encode_post_fields(&post_fields)),
            })
        } else {
            None
        };
        Ok(ScriptNavigationRequestPolicyLiteral {
            cache_control: match request.cache_control.as_deref() {
                Some("no-cache") => Some(ScriptNavigationCacheControlPolicyLiteral::NoCache),
                _ => None,
            },
            referer_url,
            post_context,
            request_intent: Some(ScriptNavigationRequestIntentLiteral {
                method,
                enctype,
                send_referer: request.send_referer,
                accept_charset: request.accept_charset.clone(),
                same_deck,
                post_fields,
            }),
        })
    }

    fn resolve_post_fields(
        &mut self,
        post_fields: &[CardPostField],
    ) -> Result<Vec<ScriptNavigationPostFieldLiteral>, String> {
        let recording = self.debug_recorder.is_some();
        let mut resolved_fields = Vec::with_capacity(post_fields.len());
        let mut debug_fields = Vec::new();
        for field in post_fields {
            let name = evaluate_vdata(&field.name, &self.vars)?;
            let mut source_name = None;
            let (value, source) = if field.value.is_empty() {
                self.resolve_post_field_name_fallback(&name)
            } else if let Some(variable_name) = field
                .value
                .strip_prefix("$(")
                .and_then(|value| value.strip_suffix(')'))
            {
                let variable_name = variable_name.trim();
                if recording {
                    source_name = Some(variable_name.to_string());
                }
                let resolved = self.resolve_post_field_name_fallback(variable_name);
                if resolved.0.is_empty() {
                    self.resolve_post_field_name_fallback(&name)
                } else {
                    resolved
                }
            } else {
                let resolved = evaluate_vdata(&field.value, &self.vars)?;
                if resolved.is_empty() {
                    self.resolve_post_field_name_fallback(&name)
                } else {
                    let source = if field.value.contains("$(") {
                        EngineDebugPostfieldResolutionSource::Variable
                    } else {
                        EngineDebugPostfieldResolutionSource::Fallback
                    };
                    (resolved, source)
                }
            };

            if recording {
                let reason = [
                    self.debug_variable_reason(&name),
                    source_name
                        .as_deref()
                        .and_then(|source_name| self.debug_variable_reason(source_name)),
                    self.debug_value_reason(&value),
                ]
                .into_iter()
                .flatten()
                .min_by_key(crate::engine_debug_recorder::redaction_priority);
                let debug_name = if self.debug_value_reason(&name).is_some() {
                    "<masked>".to_string()
                } else {
                    name.clone()
                };
                debug_fields.push(EngineDebugPostfieldResolution {
                    name: debug_name,
                    value: crate::engine_debug_recorder::sanitize_text(&value, reason),
                    source,
                });
            }
            resolved_fields.push(ScriptNavigationPostFieldLiteral { name, value });
        }
        if recording && !debug_fields.is_empty() {
            self.debug_emit(EngineDebugEventPayload::PostfieldResolve {
                fields: debug_fields,
            });
        }
        Ok(resolved_fields)
    }

    fn encode_post_fields(post_fields: &[ScriptNavigationPostFieldLiteral]) -> String {
        let mut serializer = url::form_urlencoded::Serializer::new(String::new());
        for field in post_fields {
            serializer.append_pair(&field.name, &field.value);
        }
        serializer.finish()
    }

    fn resolve_post_field_name_fallback(
        &self,
        name: &str,
    ) -> (String, EngineDebugPostfieldResolutionSource) {
        if let Some(edit) = &self.active_input_edit {
            if edit.input_name == name {
                return (
                    edit.draft_value.clone(),
                    EngineDebugPostfieldResolutionSource::Draft,
                );
            }
        }
        if let Some(value) = self.vars.get(name).cloned() {
            return (value, EngineDebugPostfieldResolutionSource::Variable);
        }
        if let Some(value) = self.input_value_for_name_on_active_card(name) {
            return (value, EngineDebugPostfieldResolutionSource::Card);
        }
        (
            String::new(),
            EngineDebugPostfieldResolutionSource::Fallback,
        )
    }

    fn is_same_document_navigation(&self, resolved_href: &str) -> bool {
        let base = self
            .base_url
            .split('#')
            .next()
            .unwrap_or(self.base_url.as_str());
        let target = resolved_href.split('#').next().unwrap_or(resolved_href);
        !base.is_empty() && base == target
    }
}

/// Snapshot-and-restore guard for the state one navigation attempt may mutate.
///
/// Card entry has three fallible steps (input initialization, the `onenter*`
/// task action, and timer start/resume). Rollback is all-or-nothing across
/// them: a failure in any step must leave the engine exactly where it was
/// before the attempt. The guard captures the affected fields up front and
/// restores them on drop — including on `?` and early `return` paths — unless
/// [`NavRollbackGuard::commit`] disarms it once the whole attempt succeeded.
///
/// While the guard is alive the engine is reached through its `engine` field,
/// because the guard holds the `&mut WmlEngine` it must be able to restore.
struct NavRollbackGuard<'a> {
    engine: &'a mut WmlEngine,
    rollback: Option<NavStateRollback>,
}

struct NavStateRollback {
    active_card_idx: usize,
    focused_link_idx: usize,
    viewport_offset_row: usize,
    nav_stack: Vec<usize>,
    active_timer: Option<CardTimerState>,
    vars: HashMap<String, String>,
    external_nav_intent: Option<String>,
    external_nav_request_policy: Option<ScriptNavigationRequestPolicyLiteral>,
    active_input_edit: Option<InputEditState>,
    active_select_edit: Option<SelectEditState>,
    pending_script_effects: ScriptRuntimeEffects,
    last_script_outcome: Option<ScriptExecutionOutcome>,
    last_script_dialog_requests: Vec<ScriptDialogRequest>,
    last_script_timer_requests: Vec<ScriptTimerRequest>,
    browser_context_epoch: u32,
    history_push_sequence: u32,
}

impl NavStateRollback {
    fn capture(engine: &WmlEngine) -> Self {
        Self {
            active_card_idx: engine.active_card_idx,
            focused_link_idx: engine.focused_link_idx,
            viewport_offset_row: engine.viewport_offset_row,
            nav_stack: engine.nav_stack.clone(),
            active_timer: engine.active_timer.clone(),
            vars: engine.vars.clone(),
            external_nav_intent: engine.external_nav_intent.clone(),
            external_nav_request_policy: engine.external_nav_request_policy.clone(),
            active_input_edit: engine.active_input_edit.clone(),
            active_select_edit: engine.active_select_edit.clone(),
            pending_script_effects: engine.pending_script_effects.clone(),
            last_script_outcome: engine.last_script_outcome.clone(),
            last_script_dialog_requests: engine.last_script_dialog_requests.clone(),
            last_script_timer_requests: engine.last_script_timer_requests.clone(),
            browser_context_epoch: engine.browser_context_epoch,
            history_push_sequence: engine.history_push_sequence,
        }
    }

    fn restore(self, engine: &mut WmlEngine) {
        engine.active_card_idx = self.active_card_idx;
        engine.focused_link_idx = self.focused_link_idx;
        engine.viewport_offset_row = self.viewport_offset_row;
        engine.nav_stack = self.nav_stack;
        engine.active_timer = self.active_timer;
        engine.vars = self.vars;
        engine.external_nav_intent = self.external_nav_intent;
        engine.external_nav_request_policy = self.external_nav_request_policy;
        engine.active_input_edit = self.active_input_edit;
        engine.active_select_edit = self.active_select_edit;
        engine.pending_script_effects = self.pending_script_effects;
        engine.last_script_outcome = self.last_script_outcome;
        engine.last_script_dialog_requests = self.last_script_dialog_requests;
        engine.last_script_timer_requests = self.last_script_timer_requests;
        engine.browser_context_epoch = self.browser_context_epoch;
        engine.history_push_sequence = self.history_push_sequence;
    }
}

impl<'a> NavRollbackGuard<'a> {
    fn forward(engine: &'a mut WmlEngine) -> Self {
        let rollback = NavStateRollback::capture(engine);
        Self {
            engine,
            rollback: Some(rollback),
        }
    }

    fn back(engine: &'a mut WmlEngine) -> Self {
        let rollback = NavStateRollback::capture(engine);
        Self {
            engine,
            rollback: Some(rollback),
        }
    }

    /// Disarm the guard: the navigation attempt is keeping its new state.
    fn commit(mut self) {
        self.rollback = None;
    }
}

impl Drop for NavRollbackGuard<'_> {
    fn drop(&mut self) {
        let Some(rollback) = self.rollback.take() else {
            return;
        };
        rollback.restore(self.engine);
    }
}

/// Roll back all state mutated while a task is being evaluated. Navigation has
/// its own nested guard, but task preparation also commits control drafts and
/// synchronizes variables; those mutations must be atomic with task success.
struct TaskRollbackGuard<'a> {
    engine: &'a mut WmlEngine,
    rollback: Option<NavStateRollback>,
}

impl<'a> TaskRollbackGuard<'a> {
    fn new(engine: &'a mut WmlEngine) -> Self {
        let rollback = NavStateRollback::capture(engine);
        Self {
            engine,
            rollback: Some(rollback),
        }
    }

    fn commit(mut self) {
        self.rollback = None;
    }
}

impl Drop for TaskRollbackGuard<'_> {
    fn drop(&mut self) {
        let Some(rollback) = self.rollback.take() else {
            return;
        };
        rollback.restore(self.engine);
    }
}

#[derive(Debug, PartialEq, Eq)]
pub(crate) struct ParsedScriptRef<'a> {
    pub(crate) src: &'a str,
    pub(crate) function_name: Option<&'a str>,
}

pub(crate) fn parse_script_href(href: &str) -> Option<ParsedScriptRef<'_>> {
    let body = href.strip_prefix("script:")?;
    let (src, function_name) = match body.split_once('#') {
        Some((src, fn_name)) => {
            let fn_name = if fn_name.is_empty() {
                None
            } else {
                Some(fn_name)
            };
            (src, fn_name)
        }
        None => (body, None),
    };
    if src.is_empty() {
        return None;
    }
    Some(ParsedScriptRef { src, function_name })
}

#[cfg(test)]
mod tests {
    use crate::WmlEngine;

    /// A failed back-entry handler must restore a timer stopped while attempting
    /// to leave the invoking card, including its named-variable persistence.
    #[test]
    fn failed_back_entry_restores_invoking_named_timer_state() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <onevent type="onenterbackward"><go href="#missing"/></onevent>
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer name="remaining" value="5"/>
            <p>Timed</p>
          </card>
        </wml>
        "##;
        engine.load_deck(xml).expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("home enter should navigate to timed card");
        assert_eq!(engine.active_card_id().expect("active card"), "timed");
        engine.advance_time_ms(200).expect("timer should advance");
        assert_eq!(engine.next_timer_wakeup_ms(), Some(300));

        let handled = engine.navigate_back();

        assert!(handled, "back should report handled when history exists");
        assert_eq!(
            engine.active_card_id().expect("active card"),
            "timed",
            "failed entry handler should roll back back-navigation state"
        );
        assert_eq!(engine.nav_stack.len(), 1);
        assert_eq!(engine.focused_link_index(), 0);
        assert_eq!(engine.next_timer_wakeup_ms(), Some(300));
        assert_eq!(engine.get_var("remaining".to_string()), None);
    }
}
