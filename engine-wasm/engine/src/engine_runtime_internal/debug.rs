use crate::engine_debug_recorder::{debug_error, is_sensitive_name, sanitize_text, sanitize_url};
use crate::*;

use super::node_lookup;

impl WmlEngine {
    pub(crate) fn debug_emit(&mut self, payload: EngineDebugEventPayload) {
        if self.debug_recorder.is_none() {
            return;
        }
        let card_id = self
            .deck
            .as_ref()
            .and_then(|deck| deck.cards.get(self.active_card_idx))
            .map(|card| card.id.clone());
        if let Some(recorder) = self.debug_recorder.as_mut() {
            recorder.record(card_id, payload);
        }
    }

    pub(crate) fn debug_emit_lazy(&mut self, build: impl FnOnce() -> EngineDebugEventPayload) {
        if self.debug_recorder.is_none() {
            return;
        }
        self.debug_emit(build());
    }

    pub(crate) fn debug_emit_for_card(
        &mut self,
        card_id: Option<String>,
        payload: EngineDebugEventPayload,
    ) {
        if let Some(recorder) = self.debug_recorder.as_mut() {
            recorder.record(card_id, payload);
        }
    }

    pub(crate) fn debug_advance_time(&mut self, delta_ms: u32) {
        if let Some(recorder) = self.debug_recorder.as_mut() {
            recorder.advance_time(delta_ms);
        }
    }

    pub(crate) fn set_focused_link_idx_with_debug(&mut self, next_index: usize) {
        let previous_index = self.focused_link_idx;
        self.focused_link_idx = next_index;
        if previous_index == next_index {
            return;
        }
        self.debug_emit(EngineDebugEventPayload::FocusChange {
            previous_index: u32::try_from(previous_index).ok(),
            current_index: u32::try_from(next_index).ok(),
        });
    }

    pub(crate) fn cancel_active_input_edit_with_debug(&mut self) -> bool {
        let Some(edit) = self.active_input_edit.take() else {
            return false;
        };
        self.debug_emit_lazy(|| EngineDebugEventPayload::InputEditCancel {
            name: edit.input_name,
        });
        true
    }

    pub(crate) fn debug_input_reason(
        &self,
        control_id: &str,
        name: &str,
    ) -> Option<EngineDebugRedactionReason> {
        if self
            .deck
            .as_ref()
            .and_then(|deck| deck.cards.get(self.active_card_idx))
            .and_then(|card| node_lookup::find_input(card, control_id))
            .is_some_and(|input| input.is_password)
        {
            return Some(EngineDebugRedactionReason::PasswordInput);
        }
        self.debug_variable_reason(name)
    }

    pub(crate) fn debug_variable_reason(&self, name: &str) -> Option<EngineDebugRedactionReason> {
        if self.deck.as_ref().is_some_and(|deck| {
            deck.cards.iter().any(|card| {
                node_lookup::inputs(card).any(|input| input.name == name && input.is_password)
            })
        }) {
            return Some(EngineDebugRedactionReason::PasswordInput);
        }
        if is_sensitive_name(name) {
            return Some(EngineDebugRedactionReason::SensitiveName);
        }
        self.debug_recorder
            .as_ref()
            .and_then(|recorder| recorder.variable_reason(name))
    }

    pub(crate) fn debug_mark_variable(&mut self, name: String, reason: EngineDebugRedactionReason) {
        if let Some(recorder) = self.debug_recorder.as_mut() {
            recorder.mark_variable(name, reason);
        }
    }

    pub(crate) fn debug_assignment_marks(
        &self,
        assignments: &[(String, String)],
    ) -> Vec<(String, EngineDebugRedactionReason)> {
        if self.debug_recorder.is_none() {
            return Vec::new();
        }
        assignments
            .iter()
            .filter_map(|(name, value)| {
                self.debug_value_reason(value)
                    .map(|reason| (name.clone(), reason))
            })
            .collect()
    }

    pub(crate) fn debug_value_reason(&self, value: &str) -> Option<EngineDebugRedactionReason> {
        if value.is_empty() || self.debug_recorder.is_none() {
            return None;
        }
        self.vars
            .iter()
            .filter(|(_, candidate)| candidate.as_str() == value)
            .filter_map(|(name, _)| self.debug_variable_reason(name))
            .min_by_key(crate::engine_debug_recorder::redaction_priority)
    }

    pub(crate) fn debug_safe_label(&self, value: &str) -> String {
        if self.debug_value_reason(value).is_some() {
            "<masked>".to_string()
        } else {
            value.to_string()
        }
    }

    pub(crate) fn debug_safe_function_name(&self, value: &str) -> String {
        if is_sensitive_name(value) {
            "<masked>".to_string()
        } else {
            self.debug_safe_label(value)
        }
    }

    pub(crate) fn debug_clear_variable_marks(&mut self) {
        if let Some(recorder) = self.debug_recorder.as_mut() {
            recorder.clear_variable_marks();
        }
    }

    pub(crate) fn debug_snapshot_internal(&self) -> Result<EngineDebugSnapshot, EngineDebugError> {
        let Some(recorder) = self.debug_recorder.as_ref() else {
            return Err(debug_error(
                EngineDebugErrorCode::DebugSourceUnavailable,
                "debug recorder is disabled",
            ));
        };

        let mut variables: Vec<_> = self.vars.iter().collect();
        variables.sort_by_key(|(name, _)| *name);
        let total_variables = variables.len();
        let runtime_vars = variables
            .into_iter()
            .take(ENGINE_DEBUG_MAX_SNAPSHOT_VARIABLES as usize)
            .map(|(name, value)| EngineDebugNamedValue {
                name: self.debug_safe_label(name),
                value: sanitize_text(value, self.debug_variable_reason(name)),
            })
            .collect::<Vec<_>>();

        let focused_input_edit =
            self.active_input_edit
                .as_ref()
                .map(|edit| EngineDebugNamedValue {
                    name: edit.input_name.clone(),
                    value: sanitize_text(
                        &edit.draft_value,
                        self.debug_input_reason(&edit.control_id, &edit.input_name),
                    ),
                });

        let timers = self
            .active_timer
            .as_ref()
            .into_iter()
            .take(ENGINE_DEBUG_MAX_SNAPSHOT_TIMERS as usize)
            .map(|timer| {
                let token = timer.name.as_deref().unwrap_or("card-timer");
                EngineDebugTimerSnapshot {
                    remaining_ms: timer.remaining_ms,
                    token: sanitize_text(
                        token,
                        is_sensitive_name(token)
                            .then_some(EngineDebugRedactionReason::SensitiveName),
                    ),
                }
            })
            .collect::<Vec<_>>();
        let total_timers = usize::from(self.active_timer.is_some());

        Ok(EngineDebugSnapshot {
            protocol_version: ENGINE_DEBUG_PROTOCOL_VERSION,
            captured_seq: recorder.cursor(),
            active_card_id: self
                .deck
                .as_ref()
                .and_then(|deck| deck.cards.get(self.active_card_idx))
                .map(|card| card.id.clone()),
            focused_link_index: to_debug_count(self.focused_link_idx),
            focused_input_edit,
            runtime_vars_summary: collection_summary(total_variables, runtime_vars.len()),
            runtime_vars,
            pending_external_navigation: self.debug_external_navigation_snapshot(),
            timers_summary: collection_summary(total_timers, timers.len()),
            timers,
            buffer: recorder.buffer_snapshot(),
            viewport_cols: to_debug_count(self.viewport_cols),
            base_url: sanitize_url(&self.base_url),
            content_type: self.content_type.clone(),
        })
    }

    fn debug_external_navigation_snapshot(&self) -> Option<EngineDebugExternalNavigationSnapshot> {
        let target = self.external_nav_intent.as_deref()?;
        let policy = self.external_nav_request_policy.as_ref();
        let method = policy
            .and_then(|policy| policy.request_intent.as_ref())
            .map(|intent| match intent.method {
                ScriptNavigationMethodLiteral::Get => "get".to_string(),
                ScriptNavigationMethodLiteral::Post => "post".to_string(),
            });
        let referer_url = policy
            .and_then(|policy| policy.referer_url.as_deref())
            .map(sanitize_url);
        let post_body = policy
            .and_then(|policy| policy.post_context.as_ref())
            .and_then(|post_context| post_context.payload.as_deref())
            .map(|payload| {
                let contains_secret = policy
                    .and_then(|policy| policy.request_intent.as_ref())
                    .is_some_and(|intent| {
                        intent.post_fields.iter().any(|field| {
                            self.debug_variable_reason(&field.name).is_some()
                                || self.debug_value_reason(&field.name).is_some()
                                || is_sensitive_name(&field.name)
                        })
                    });
                sanitize_text(
                    payload,
                    contains_secret.then_some(EngineDebugRedactionReason::TransportSecret),
                )
            });

        Some(EngineDebugExternalNavigationSnapshot {
            target: sanitize_url(target),
            method,
            referer_url,
            post_body,
        })
    }
}

fn collection_summary(total: usize, returned: usize) -> EngineDebugCollectionSummary {
    EngineDebugCollectionSummary {
        total_count: to_debug_count(total),
        returned_count: to_debug_count(returned),
        truncated: returned < total,
    }
}

fn to_debug_count(value: usize) -> u32 {
    u32::try_from(value).unwrap_or(u32::MAX)
}
