use crate::*;

use super::evaluate_vdata;

impl WmlEngine {
    pub(crate) fn start_timer_for_active_card(&mut self) -> Result<(), String> {
        let (timer, ontimer_action) = {
            let card = self.active_card_internal()?;
            (
                card.timer.clone(),
                self.active_onevent_action_internal("ontimer")?,
            )
        };
        let Some(timer) = timer else {
            self.active_timer = None;
            return Ok(());
        };
        let raw_value = match timer.name.as_deref() {
            Some(name) => match self.vars.get(name) {
                Some(value) => value.clone(),
                None => evaluate_vdata(&timer.value, &self.vars)?,
            },
            None => evaluate_vdata(&timer.value, &self.vars)?,
        };
        let Ok(value_ds) = raw_value.trim().parse::<u32>() else {
            self.active_timer = None;
            self.push_trace("TIMER_IGNORE", format!("value={raw_value}"));
            return Ok(());
        };
        if value_ds == 0 {
            self.active_timer = None;
            self.push_trace("TIMER_IGNORE", "value=0".to_string());
            return Ok(());
        }
        let remaining_ms = value_ds.saturating_mul(100);
        self.active_timer = Some(CardTimerState {
            card_idx: self.active_card_idx,
            remaining_ms,
            name: timer.name,
            ontimer_action,
        });
        if self.debug_recorder.is_some() {
            let token = self
                .active_timer
                .as_ref()
                .and_then(|timer| timer.name.as_deref())
                .unwrap_or("card-timer")
                .to_string();
            self.debug_emit(EngineDebugEventPayload::TimerSchedule {
                delay_ms: remaining_ms,
                token: crate::engine_debug_recorder::sanitize_text(
                    &token,
                    crate::engine_debug_recorder::is_sensitive_name(&token)
                        .then_some(EngineDebugRedactionReason::SensitiveName),
                ),
            });
        }
        self.push_trace("TIMER_START", format!("valueDs={value_ds}"));
        Ok(())
    }

    pub(crate) fn stop_active_timer_for_exit(&mut self) {
        let Some(timer) = self.active_timer.take() else {
            return;
        };
        let token = timer.name.as_deref().unwrap_or("card-timer");
        self.debug_emit_lazy(|| EngineDebugEventPayload::TimerCancel {
            token: crate::engine_debug_recorder::sanitize_text(
                token,
                crate::engine_debug_recorder::is_sensitive_name(token)
                    .then_some(EngineDebugRedactionReason::SensitiveName),
            ),
        });
        self.persist_timer_value(&timer, Self::remaining_timer_deciseconds(&timer));
        self.push_trace("TIMER_STOP", format!("remainingMs={}", timer.remaining_ms));
    }

    pub(crate) fn dispatch_active_timer_expiry(&mut self) -> Result<(), String> {
        let Some(timer) = self.active_timer.take() else {
            return Ok(());
        };
        let token = timer.name.as_deref().unwrap_or("card-timer");
        self.debug_emit_lazy(|| EngineDebugEventPayload::TimerFire {
            token: crate::engine_debug_recorder::sanitize_text(
                token,
                crate::engine_debug_recorder::is_sensitive_name(token)
                    .then_some(EngineDebugRedactionReason::SensitiveName),
            ),
        });
        self.persist_timer_value(&timer, 0);
        self.push_trace("TIMER_EXPIRE", String::new());
        let Some(action) = timer.ontimer_action else {
            return Ok(());
        };
        if self.timer_dispatch_depth >= MAX_TIMER_DISPATCH_DEPTH {
            return Err("timer: dispatch depth exceeded".to_string());
        }
        self.timer_dispatch_depth += 1;
        self.push_trace("ACTION_ONTIMER", String::new());
        let result = self.execute_card_task_action(&action);
        self.timer_dispatch_depth -= 1;
        result
    }

    pub(crate) fn advance_time_ms_internal(&mut self, delta_ms: u32) -> Result<(), String> {
        self.debug_advance_time(delta_ms);
        let Some(timer_card_idx) = self.active_timer.as_ref().map(|timer| timer.card_idx) else {
            return Ok(());
        };
        if delta_ms == 0 {
            return Ok(());
        }
        if timer_card_idx != self.active_card_idx {
            self.active_timer = None;
            return Ok(());
        }
        let (before, after) = {
            // The guard above already proved `active_timer` is `Some`, but this
            // path is reachable from untrusted script/host-driven time advance,
            // so per the panic-vs-`Result` guidance in
            // `docs/agents/RUST_ENGINE_STEERING.md` a broken invariant degrades
            // to a structured error instead of panicking.
            let timer = self
                .active_timer
                .as_mut()
                .ok_or_else(|| "timer: active timer missing after presence check".to_string())?;
            let before = timer.remaining_ms;
            timer.remaining_ms = timer.remaining_ms.saturating_sub(delta_ms);
            (before, timer.remaining_ms)
        };
        self.push_trace(
            "TIMER_TICK",
            format!("deltaMs={delta_ms};beforeMs={before};afterMs={after}"),
        );
        if after == 0 {
            self.dispatch_active_timer_expiry()?;
        }
        Ok(())
    }

    fn remaining_timer_deciseconds(timer: &CardTimerState) -> u32 {
        timer.remaining_ms / 100 + u32::from(!timer.remaining_ms.is_multiple_of(100))
    }

    fn persist_timer_value(&mut self, timer: &CardTimerState, value_ds: u32) {
        if let Some(name) = &timer.name {
            self.vars.insert(name.clone(), value_ds.to_string());
            self.push_trace("TIMER_PERSIST", format!("name={name};valueDs={value_ds}"));
        }
    }
}
