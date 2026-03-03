use crate::*;

impl WmlEngine {
    pub(crate) fn start_or_resume_timer_for_active_card(
        &mut self,
        is_refresh: bool,
    ) -> Result<(), String> {
        let (timer_value_ds, ontimer_action) = {
            let card = self.active_card_internal()?;
            (card.timer_value_ds, card.ontimer_action.clone())
        };
        let Some(value_ds) = timer_value_ds else {
            self.active_timer = None;
            return Ok(());
        };
        if is_refresh {
            if let Some(timer) = &self.active_timer {
                if timer.card_idx == self.active_card_idx {
                    self.push_trace(
                        "TIMER_RESUME",
                        format!("remainingMs={}", timer.remaining_ms),
                    );
                    return Ok(());
                }
            }
        }
        let remaining_ms = value_ds.saturating_mul(100);
        self.active_timer = Some(CardTimerState {
            card_idx: self.active_card_idx,
            remaining_ms,
            ontimer_action,
        });
        self.push_trace("TIMER_START", format!("valueDs={value_ds}"));
        if remaining_ms != 0 {
            return Ok(());
        }
        self.dispatch_active_timer_expiry()
    }

    pub(crate) fn stop_active_timer_for_exit(&mut self) {
        let Some(timer) = self.active_timer.take() else {
            return;
        };
        self.push_trace("TIMER_STOP", format!("remainingMs={}", timer.remaining_ms));
    }

    pub(crate) fn dispatch_active_timer_expiry(&mut self) -> Result<(), String> {
        let Some(timer) = self.active_timer.take() else {
            return Ok(());
        };
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
            let timer = self
                .active_timer
                .as_mut()
                .expect("timer must exist after guard");
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
}
