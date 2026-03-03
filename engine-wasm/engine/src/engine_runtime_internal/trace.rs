use crate::*;

impl WmlEngine {
    pub(crate) fn push_trace(&mut self, kind: &str, detail: String) {
        if self.trace_entries.len() >= MAX_TRACE_ENTRIES {
            self.trace_entries.remove(0);
        }

        let active_card_id = self.active_card_internal().ok().map(|card| card.id.clone());
        let entry = EngineTraceEntry {
            seq: self.next_trace_seq,
            kind: kind.to_string(),
            detail,
            active_card_id,
            focused_link_index: self.focused_link_idx,
            external_navigation_intent: self.external_nav_intent.clone(),
            script_ok: self.last_script_outcome.as_ref().map(|outcome| outcome.ok),
            script_error_class: self
                .last_script_outcome
                .as_ref()
                .map(|outcome| outcome.error_class.clone()),
            script_error_category: self
                .last_script_outcome
                .as_ref()
                .map(|outcome| outcome.error_category.clone()),
            script_trap: self
                .last_script_outcome
                .as_ref()
                .and_then(|outcome| outcome.trap.clone()),
        };
        self.next_trace_seq += 1;
        self.trace_entries.push(entry);
    }

    pub(crate) fn active_card_internal(&self) -> Result<&runtime::card::Card, String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;

        deck.cards
            .get(self.active_card_idx)
            .ok_or_else(|| "Active card index out of range".to_string())
    }
}
