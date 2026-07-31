use crate::*;
impl WmlEngine {
    /// Construct a new engine instance with empty runtime state.
    pub fn new() -> WmlEngine {
        WmlEngine {
            deck: None,
            active_card_idx: 0,
            nav_stack: Vec::new(),
            focused_link_idx: 0,
            external_nav_intent: None,
            external_nav_request_policy: None,
            viewport_cols: DEFAULT_VIEWPORT_COLS,
            base_url: String::new(),
            content_type: String::new(),
            raw_bytes_base64: None,
            vars: HashMap::new(),
            script_units: HashMap::new(),
            script_entrypoints: HashMap::new(),
            pending_script_effects: ScriptRuntimeEffects::default(),
            last_script_outcome: None,
            last_script_dialog_requests: Vec::new(),
            last_script_timer_requests: Vec::new(),
            trace_entries: Vec::new(),
            next_trace_seq: 1,
            timer_dispatch_depth: 0,
            nav_dispatch_depth: 0,
            active_timer: None,
            active_input_edit: None,
            active_select_edit: None,
            last_back_navigation_handled: false,
            last_wml_load_diagnostics: Vec::new(),
            browser_context_epoch: 0,
            debug_recorder: None,
        }
    }

    fn read_with_panic_boundary<T: 'static>(
        &self,
        mut operation: impl FnMut(&Self) -> T + 'static,
    ) -> Result<T, String> {
        let candidate = self.clone();
        catch_engine_panic(move || operation(&candidate))
    }

    fn mutate_with_panic_boundary<T: 'static>(
        &mut self,
        mut operation: impl FnMut(&mut Self) -> T + 'static,
    ) -> Result<T, String> {
        use std::cell::RefCell;
        use std::rc::Rc;

        let candidate = Rc::new(RefCell::new(self.clone()));
        let operation_candidate = Rc::clone(&candidate);
        let result = catch_engine_panic(move || {
            let mut candidate = operation_candidate.borrow_mut();
            operation(&mut candidate)
        })?;
        let candidate = Rc::try_unwrap(candidate)
            .map_err(|_| "engine: panic boundary retained candidate state".to_string())?
            .into_inner();
        *self = candidate;
        Ok(result)
    }

    /// Load a WML deck using default metadata (`text/vnd.wap.wml`).
    pub fn load_deck(&mut self, xml: &str) -> Result<(), String> {
        self.load_deck_context(xml, "", "text/vnd.wap.wml", None)
    }

    /// Load a WML deck with explicit transport metadata for traceability.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]):
    /// this parses untrusted, network-delivered WML, so a defensive-programming
    /// bug here should degrade to a typed error, not crash the host.
    pub fn load_deck_context(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
    ) -> Result<(), String> {
        self.load_deck_context_with_referring_url(
            wml_xml,
            base_url,
            content_type,
            raw_bytes_base64,
            None,
        )
    }

    /// Load a WML deck and, when supplied by the host, enforce its access
    /// policy against the URI of the deck that initiated the go traversal.
    pub fn load_deck_context_with_referring_url(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
        referring_url: Option<&str>,
    ) -> Result<(), String> {
        self.load_deck_context_for_navigation(
            wml_xml,
            base_url,
            content_type,
            raw_bytes_base64,
            DeckNavigationContext::new(
                referring_url,
                Some(base_url),
                DeckNavigationKind::Independent,
            ),
        )
    }

    /// Load a deck using the host-resolved navigation relationship.
    ///
    /// The host owns fetching and request-shaped history. The engine owns WML
    /// browser-context preservation, fragment selection, and destination card
    /// entry ordering. Existing load APIs remain independent navigations.
    pub fn load_deck_context_for_navigation(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
        navigation: DeckNavigationContext<'_>,
    ) -> Result<(), String> {
        let wml_xml = wml_xml.to_string();
        let base_url = base_url.to_string();
        let content_type = content_type.to_string();
        let referring_url = navigation.referring_url.map(str::to_string);
        let navigation_url = navigation.navigation_url.map(str::to_string);
        let navigation_kind = navigation.kind;
        let result = match self.mutate_with_panic_boundary(move |engine| {
            engine.load_deck_context_bounded(
                &wml_xml,
                &base_url,
                &content_type,
                raw_bytes_base64.clone(),
                DeckNavigationContext::new(
                    referring_url.as_deref(),
                    navigation_url.as_deref(),
                    navigation_kind,
                ),
            )
        }) {
            Ok(result) => result,
            Err(message) => Err(WmlLoadDiagnostic::recoverable_rejection(message)),
        };

        match result {
            Ok(()) => Ok(()),
            Err(diagnostic) => {
                let message = diagnostic.message.clone();
                self.last_wml_load_diagnostics = vec![diagnostic];
                Err(message)
            }
        }
    }

    fn load_deck_context_bounded(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
        navigation: DeckNavigationContext<'_>,
    ) -> Result<(), WmlLoadDiagnostic> {
        #[cfg(test)]
        if wml_xml == PANIC_BOUNDARY_TEST_WML {
            self.set_var("panic-boundary-probe".to_string(), "partial".to_string());
            panic!("test-only engine panic boundary probe");
        }
        if wml_xml.len() > MAX_DECK_WML_XML_BYTES {
            return Err(WmlLoadDiagnostic::invalid(format!(
                "Deck payload exceeds {}-byte limit (got {} bytes)",
                MAX_DECK_WML_XML_BYTES,
                wml_xml.len()
            )));
        }
        if raw_bytes_base64
            .as_ref()
            .is_some_and(|payload| payload.len() > MAX_DECK_RAW_BYTES_BASE64_BYTES)
        {
            return Err(WmlLoadDiagnostic::invalid(format!(
                "Raw deck payload exceeds {}-byte limit (got {} bytes)",
                MAX_DECK_RAW_BYTES_BASE64_BYTES,
                raw_bytes_base64.as_ref().map_or(0, |payload| payload.len())
            )));
        }

        #[cfg(test)]
        let test_input = test_compatibility_wml_input(wml_xml, content_type);
        #[cfg(test)]
        let wml_xml = test_input.as_ref();
        let parsed = parse_wml_report_for_content_type(wml_xml, content_type)?;
        let access_allowed = parsed
            .deck
            .allows_referring_uri(base_url, navigation.referring_url)
            .map_err(WmlLoadDiagnostic::invalid)?;
        if !access_allowed {
            return Err(WmlLoadDiagnostic::invalid(
                "Deck access denied for referring URI",
            ));
        }
        let previous_context_epoch = self.browser_context_epoch;
        let previous_card_id = self.debug_recorder.as_ref().and_then(|_| {
            self.deck
                .as_ref()
                .and_then(|deck| deck.cards.get(self.active_card_idx))
                .map(|card| card.id.clone())
        });
        let previous_timer_token = self
            .debug_recorder
            .as_ref()
            .and(self.active_timer.as_ref())
            .map(|timer| {
                timer
                    .name
                    .clone()
                    .unwrap_or_else(|| "card-timer".to_string())
            });
        let previous_input_edit_name = self
            .debug_recorder
            .as_ref()
            .and(self.active_input_edit.as_ref())
            .map(|edit| edit.input_name.clone());
        let mut next = WmlEngine::new();
        next.viewport_cols = self.viewport_cols;
        next.debug_recorder = self.debug_recorder.clone();
        if navigation.kind == DeckNavigationKind::Independent {
            next.browser_context_epoch = previous_context_epoch.saturating_add(1);
            next.debug_clear_variable_marks();
        } else {
            next.browser_context_epoch = previous_context_epoch;
            next.vars = self.vars.clone();
            next.script_units = self.script_units.clone();
            next.script_entrypoints = self.script_entrypoints.clone();
            next.trace_entries = self.trace_entries.clone();
            next.next_trace_seq = self.next_trace_seq;
        }
        next.deck = Some(parsed.deck);
        next.base_url = base_url.to_string();
        next.content_type = content_type.to_string();
        next.raw_bytes_base64 = raw_bytes_base64;
        next.last_wml_load_diagnostics = parsed.diagnostics;
        next.active_card_idx = next
            .destination_card_index(
                navigation.navigation_url.unwrap_or(base_url),
                navigation.kind,
            )
            .map_err(WmlLoadDiagnostic::recoverable_rejection)?;
        let reset_context = navigation.kind == DeckNavigationKind::Forward
            && next
                .deck
                .as_ref()
                .and_then(|deck| deck.cards.get(next.active_card_idx))
                .is_some_and(|card| card.new_context);
        if reset_context {
            next.reset_browser_context_for_newcontext();
            next.push_trace(
                "NEWCONTEXT",
                format!("target={}", next.active_card_id().unwrap_or_default()),
            );
        }
        if next.debug_recorder.is_some() {
            if previous_card_id.is_some() {
                next.debug_emit_for_card(
                    previous_card_id.clone(),
                    EngineDebugEventPayload::CardExit,
                );
            }
            if let Some(token) = previous_timer_token {
                let reason = crate::engine_debug_recorder::is_sensitive_name(&token)
                    .then_some(EngineDebugRedactionReason::SensitiveName);
                next.debug_emit_for_card(
                    previous_card_id.clone(),
                    EngineDebugEventPayload::TimerCancel {
                        token: crate::engine_debug_recorder::sanitize_text(&token, reason),
                    },
                );
            }
            if let Some(name) = previous_input_edit_name {
                next.debug_emit_for_card(
                    previous_card_id,
                    EngineDebugEventPayload::InputEditCancel { name },
                );
            }
            let card_count = next.deck.as_ref().map_or(0, |deck| deck.cards.len());
            next.debug_emit(EngineDebugEventPayload::DeckLoad {
                base_url: crate::engine_debug_recorder::sanitize_url(base_url),
                content_type: content_type.to_string(),
                card_count: u32::try_from(card_count).unwrap_or(u32::MAX),
            });
            next.debug_emit(EngineDebugEventPayload::CardEnter);
        }
        next.push_trace("LOAD_DECK", format!("contentType={content_type}"));
        next.initialize_controls_on_active_card()
            .map_err(WmlLoadDiagnostic::invalid)?;
        let entry_handled = match navigation.kind {
            DeckNavigationKind::Forward => next
                .run_onenterforward_for_active_card()
                .map_err(WmlLoadDiagnostic::invalid)?,
            DeckNavigationKind::Backward => next
                .run_onenterbackward_for_active_card()
                .map_err(WmlLoadDiagnostic::invalid)?,
            DeckNavigationKind::Independent | DeckNavigationKind::Reload => false,
        };
        if !entry_handled {
            next.start_timer_for_active_card()
                .map_err(WmlLoadDiagnostic::invalid)?;
        }
        *self = next;
        Ok(())
    }

    fn destination_card_index(
        &self,
        navigation_url: &str,
        navigation_kind: DeckNavigationKind,
    ) -> Result<usize, String> {
        let fragment = navigation_url
            .split_once('#')
            .map(|(_, fragment)| fragment)
            .filter(|fragment| !fragment.is_empty());
        let Some(fragment) = fragment else {
            return Ok(0);
        };
        match self
            .deck
            .as_ref()
            .and_then(|deck| deck.card_index(fragment))
        {
            Some(index) => Ok(index),
            None if navigation_kind == DeckNavigationKind::Independent => {
                Err(CARD_ID_NOT_FOUND_ERROR.to_string())
            }
            None => Ok(0),
        }
    }

    /// Diagnostics emitted by the most recent WML load attempt.
    ///
    /// A rejected load publishes exactly one diagnostic and leaves all other
    /// engine state unchanged. A successful load replaces this list with its
    /// ordered ignored/recoverable-content diagnostics.
    pub fn last_wml_load_diagnostics(&self) -> Vec<WmlLoadDiagnostic> {
        self.last_wml_load_diagnostics.clone()
    }

    /// Read a runtime variable.
    pub fn get_var(&self, name: String) -> Option<String> {
        self.vars.get(&name).cloned()
    }

    /// Set a runtime variable if `name` passes deterministic validation and
    /// the aggregate variable store stays within its byte budget.
    pub fn set_var(&mut self, name: String, value: String) -> bool {
        if !is_valid_var_name(&name) {
            return false;
        }
        crate::runtime::variable::checked_insert(&mut self.vars, name, value).is_ok()
    }

    /// Render active card into draw commands for the current viewport width.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]):
    /// layout is parity-critical and driven by deck content, so a
    /// defensive-programming bug here should degrade to a typed error, not
    /// crash the host.
    pub fn render(&self) -> Result<RenderList, EngineRenderError> {
        self.render_output().map(|output| output.render)
    }

    /// Build the canonical, host-neutral presentation frame for the active card.
    ///
    /// Frame construction is pure: repeated calls over the same observable
    /// engine state return the same content-derived `frameId` and do not add
    /// trace entries. Legacy [`Self::render`] remains available during F0/F1.
    pub fn render_frame(&self) -> Result<EnginePresentationFrame, EngineRenderError> {
        self.render_output().map(|output| output.presentation)
    }

    /// Build legacy and presentation output from one bounded layout pass.
    ///
    /// The Tauri migration adapter uses this method so the compatibility
    /// render list and canonical presentation frame cannot diverge or cause
    /// duplicate layout work.
    pub fn render_output(&self) -> Result<EngineRenderOutput, EngineRenderError> {
        self.read_with_panic_boundary(Self::render_output_bounded)
            .map_err(EngineRenderError::engine_failure)?
    }

    fn render_output_bounded(&self) -> Result<EngineRenderOutput, EngineRenderError> {
        self.render_output_with_limits(EngineRenderLimits::default())
    }

    pub(crate) fn render_output_with_limits(
        &self,
        limits: EngineRenderLimits,
    ) -> Result<EngineRenderOutput, EngineRenderError> {
        let runtime_card = self
            .runtime_card_for_layout()
            .map_err(EngineRenderError::engine_failure)?;
        let layout = layout_card_with_limits(
            &runtime_card,
            self.viewport_cols,
            self.focused_link_idx,
            limits,
        )?;
        let render = layout.render_list.clone();
        let focus_index = if layout.focus_targets.is_empty() {
            None
        } else {
            Some(clamp_focus(
                self.focused_link_idx,
                layout.focus_targets.len(),
            ))
        };

        let mut rows: Vec<EngineFrameRow> = Vec::new();
        for segment in &layout.segments {
            if rows.last().is_none_or(|row| row.index != segment.y) {
                rows.push(EngineFrameRow {
                    index: segment.y,
                    segments: Vec::new(),
                });
            }
            let frame_segment = match segment.focus_index {
                Some(index) => EngineFrameSegment::Focusable {
                    x: segment.x,
                    text: segment.text.clone(),
                    focus_id: format!("focus:{index}"),
                    target_kind: layout.focus_targets[index].frame_kind(),
                    focused: focus_index == Some(index),
                },
                None => EngineFrameSegment::Text {
                    x: segment.x,
                    text: segment.text.clone(),
                },
            };
            rows.last_mut()
                .expect("a row is created before its segment")
                .segments
                .push(frame_segment);
        }

        let focus = match focus_index {
            Some(index) => Some(EngineFocusState {
                index: u32::try_from(index)
                    .map_err(|_| "Frame focus index exceeds contract range".to_string())?,
                focus_id: format!("focus:{index}"),
                target_kind: layout.focus_targets[index].frame_kind(),
            }),
            None => None,
        };
        let hit_regions = layout
            .segments
            .iter()
            .filter_map(|segment| {
                segment.focus_index.map(|index| {
                    let width = u32::try_from(segment.text.chars().count())
                        .map_err(|_| "Frame hit-region width exceeds contract range".to_string())?;
                    Ok(EngineHitRegion {
                        x: segment.x,
                        y: segment.y,
                        width,
                        height: 1,
                        action_id: format!("focus:{index}"),
                        target_kind: layout.focus_targets[index].frame_kind(),
                    })
                })
            })
            .collect::<Result<Vec<_>, String>>()?;
        let selection = focus_index
            .and_then(|index| layout.focus_targets.get(index))
            .map_or(EngineSelectionState::None, |target| match target {
                FocusTarget::Link(_) => EngineSelectionState::None,
                FocusTarget::Input { control_id, name } => EngineSelectionState::Input {
                    control_id: control_id.clone(),
                    name: name.clone(),
                    editing: self
                        .active_input_edit
                        .as_ref()
                        .is_some_and(|edit| edit.control_id == *control_id),
                },
                FocusTarget::Select(control_id) => EngineSelectionState::Select {
                    control_id: control_id.clone(),
                    editing: self
                        .active_select_edit
                        .as_ref()
                        .is_some_and(|edit| edit.select_name == *control_id),
                    value: self.active_select_edit.as_ref().and_then(|edit| {
                        (edit.select_name == *control_id)
                            .then(|| self.focused_select_edit_value())
                            .flatten()
                    }),
                },
            });

        let mut affordances = Vec::new();
        if let Some(index) = focus_index {
            let target = &layout.focus_targets[index];
            let label = layout
                .segments
                .iter()
                .filter(|segment| segment.focus_index == Some(index))
                .map(|segment| segment.text.as_str())
                .collect::<Vec<_>>()
                .join(" ");
            let source = match target {
                FocusTarget::Link(_) => EngineAffordanceSource::FocusedLink,
                FocusTarget::Input { .. } => EngineAffordanceSource::FocusedInput,
                FocusTarget::Select(_) => EngineAffordanceSource::FocusedSelect,
            };
            affordances.push(EngineAffordance {
                action_id: format!("focus:{index}"),
                label,
                enabled: true,
                source,
                control: EngineControlAssociation::Primary,
                do_name: None,
                do_type: None,
            });
        }

        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;
        let mut has_prev_do = false;
        let mut has_primary_do = focus_index.is_some();
        for (source, binding) in deck.active_do_bindings_with_source(self.active_card_idx) {
            let runtime::card::CardEventBindingKind::Do {
                name,
                do_type,
                label,
                ..
            } = &binding.kind
            else {
                continue;
            };
            let is_prev = do_type.eq_ignore_ascii_case("prev");
            has_prev_do |= is_prev;
            let label = label
                .as_deref()
                .map(|label| engine_runtime_internal::evaluate_vdata(label, &self.vars))
                .transpose()?
                .filter(|label| !label.is_empty())
                .unwrap_or_else(|| do_type.clone());
            let control = if is_prev {
                EngineControlAssociation::Back
            } else if do_type.eq_ignore_ascii_case("accept") && !has_primary_do {
                has_primary_do = true;
                EngineControlAssociation::Primary
            } else {
                EngineControlAssociation::Task
            };
            affordances.push(EngineAffordance {
                action_id: format!("do:{name}"),
                label,
                enabled: true,
                source: match source {
                    runtime::deck::CardEventBindingSource::Card => EngineAffordanceSource::CardDo,
                    runtime::deck::CardEventBindingSource::Template => {
                        EngineAffordanceSource::TemplateDo
                    }
                },
                control,
                do_name: Some(name.clone()),
                do_type: Some(do_type.clone()),
            });
        }
        if !has_prev_do && !self.nav_stack.is_empty() {
            affordances.push(EngineAffordance {
                action_id: "history:back".to_string(),
                label: "Back".to_string(),
                enabled: true,
                source: EngineAffordanceSource::History,
                control: EngineControlAssociation::Back,
                do_name: None,
                do_type: None,
            });
        }

        let mut frame = EnginePresentationFrame {
            contract_version: ENGINE_FRAME_CONTRACT_VERSION,
            frame_id: String::new(),
            profile_id: ENGINE_FRAME_PROFILE_ID.to_string(),
            viewport: EngineViewport {
                cols: u32::try_from(self.viewport_cols)
                    .expect("viewport range is validated before engine state mutation"),
            },
            deck: EngineDeckDisplayMetadata {
                base_url: self.base_url.clone(),
                content_type: self.content_type.clone(),
                language: deck.language.clone(),
            },
            card: EngineCardDisplayMetadata {
                id: runtime_card.id,
                language: deck.card_language(self.active_card_idx).map(str::to_string),
            },
            rows,
            hit_regions,
            focus,
            selection,
            back_available: has_prev_do || !self.nav_stack.is_empty(),
            affordances,
        };
        frame
            .assign_content_identity()
            .map_err(EngineRenderError::engine_failure)?;
        let output = EngineRenderOutput {
            render,
            presentation: frame,
        };
        output.enforce_serialized_limit(limits.serialized_bytes)?;
        Ok(output)
    }

    /// Handle one input key (`up`, `down`, `enter`).
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]):
    /// this can trigger navigation and script invocation, so a
    /// defensive-programming bug here should degrade to a typed error, not
    /// crash the host.
    pub fn handle_key(&mut self, key: String) -> Result<(), String> {
        self.mutate_with_panic_boundary(move |engine| engine.handle_key_internal(&key))?
    }

    /// Dispatch the additive typed F0 input surface.
    ///
    /// Key events delegate to the legacy key path. Action activation is bound
    /// to the exact frame that advertised it so stale host controls cannot
    /// invoke a task after navigation or focus changes.
    pub fn handle_input(&mut self, event: EngineInputEvent) -> Result<(), String> {
        self.mutate_with_panic_boundary(move |engine| engine.handle_input_bounded(event.clone()))?
    }

    fn handle_input_bounded(&mut self, event: EngineInputEvent) -> Result<(), String> {
        match event {
            EngineInputEvent::Key { key } => self.handle_key_internal(key.as_str()),
            EngineInputEvent::ActivateAction {
                frame_id,
                action_id,
            } => {
                let frame = self.input_frame(&frame_id)?;
                if !frame
                    .affordances
                    .iter()
                    .any(|affordance| affordance.enabled && affordance.action_id == action_id)
                {
                    return Err("Engine input references an unavailable action".to_string());
                }
                self.activate_frame_action(&action_id)
            }
            EngineInputEvent::Click { frame_id, x, y } => {
                let frame = self.input_frame(&frame_id)?;
                let Some(action_id) = frame
                    .hit_regions
                    .iter()
                    .find(|region| region.contains(x, y))
                    .map(|region| region.action_id.clone())
                else {
                    return Ok(());
                };
                self.focus_action_for_click(&action_id)?;
                self.activate_frame_action(&action_id)
            }
        }
    }

    fn input_frame(&self, frame_id: &str) -> Result<EnginePresentationFrame, String> {
        let frame = self
            .render_output_bounded()
            .map_err(|error| error.to_string())?
            .presentation;
        if frame.frame_id != frame_id {
            return Err("Engine input references a stale frame".to_string());
        }
        Ok(frame)
    }

    fn focus_action_for_click(&mut self, action_id: &str) -> Result<(), String> {
        let index = action_id
            .strip_prefix("focus:")
            .and_then(|index| index.parse::<usize>().ok())
            .ok_or_else(|| "Engine click references an unavailable hit target".to_string())?;
        if index == self.focused_link_idx {
            return Ok(());
        }
        if self.active_input_edit.is_some() {
            self.commit_focused_input_edit_internal()?;
        }
        if self.active_select_edit.is_some() {
            self.commit_focused_select_edit_internal()?;
        }
        self.set_focused_link_idx_with_debug(index);
        Ok(())
    }

    fn activate_frame_action(&mut self, action_id: &str) -> Result<(), String> {
        if action_id.starts_with("focus:") {
            return self.handle_key_internal("enter");
        }
        if action_id == "history:back" {
            let handled = self.activate_back_internal();
            self.last_back_navigation_handled = handled;
            return Ok(());
        }
        let name = action_id
            .strip_prefix("do:")
            .ok_or_else(|| "Engine input references an unknown action".to_string())?;
        let action = self
            .deck
            .as_ref()
            .and_then(|deck| deck.active_do_action_by_name(self.active_card_idx, name))
            .cloned()
            .ok_or_else(|| "Engine input references an unavailable action".to_string())?;
        if name == "accept" {
            self.debug_emit_lazy(|| EngineDebugEventPayload::ActionAccept {
                action_type: "accept".to_string(),
                name: Some(name.to_string()),
            });
        }
        self.push_trace("ACTION_AFFORDANCE", format!("action_id={action_id}"));
        self.execute_card_task_action(&action)
    }

    /// Navigate directly to a card id and push history.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]).
    pub fn navigate_to_card(&mut self, id: String) -> Result<(), String> {
        self.mutate_with_panic_boundary(move |engine| {
            engine.navigate_to_card_without_newcontext_internal(&id)
        })?
    }

    /// Activate BACK. An effective WML `do type="prev"` binding takes
    /// precedence; otherwise the intrinsic history-pop behavior runs.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]).
    /// This method has no `Result` in its public signature (kept stable per
    /// the existing contract), so a contained panic is recorded as a trace
    /// entry and reported as `false` (navigation did not happen), the same
    /// observable outcome as the existing empty-history and
    /// dispatch-depth-exceeded cases.
    pub fn navigate_back(&mut self) -> bool {
        let handled = match self.mutate_with_panic_boundary(Self::activate_back_internal) {
            Ok(handled) => handled,
            Err(message) => {
                self.push_trace("ENGINE_PANIC_CONTAINED", message);
                false
            }
        };
        self.last_back_navigation_handled = handled;
        handled
    }

    /// Return whether the most recent BACK activation was consumed.
    pub fn last_back_navigation_handled(&self) -> bool {
        self.last_back_navigation_handled
    }

    /// Advance simulated runtime clock for card timer lifecycle behavior.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]).
    pub fn advance_time_ms(&mut self, delta_ms: u32) -> Result<(), String> {
        self.mutate_with_panic_boundary(move |engine| engine.advance_time_ms_internal(delta_ms))?
    }

    /// Return the deterministic delay until the active native WML timer expires.
    pub fn next_timer_wakeup_ms(&self) -> Option<u32> {
        self.active_timer.as_ref().map(|timer| timer.remaining_ms)
    }

    /// Set viewport width in columns within the shared native/WASM frame contract range.
    pub fn set_viewport_cols(&mut self, cols: u64) -> Result<(), EngineViewportError> {
        let cols = u32::try_from(cols).map_err(|_| EngineViewportError::invalid(cols))?;
        if cols < ENGINE_VIEWPORT_MIN_COLS {
            return Err(EngineViewportError::invalid(cols));
        }
        self.viewport_cols = cols as usize;
        Ok(())
    }

    /// Start edit session for the currently focused input control.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]).
    pub fn begin_focused_input_edit(&mut self) -> Result<bool, String> {
        self.mutate_with_panic_boundary(Self::begin_focused_input_edit_internal)?
    }

    /// Replace edit-session draft value for the focused input.
    pub fn set_focused_input_edit_draft(&mut self, value: String) -> bool {
        let Some(control_id) = self
            .active_input_edit
            .as_ref()
            .map(|edit| edit.control_id.clone())
        else {
            return false;
        };
        let max_len = self.input_max_len_on_active_card(&control_id);
        let draft = truncate_to_chars(&value, max_len);
        let recording = self.debug_recorder.is_some();
        let event = if let Some(edit) = self.active_input_edit.as_mut() {
            edit.draft_value = draft;
            recording.then(|| {
                (
                    edit.control_id.clone(),
                    edit.input_name.clone(),
                    edit.draft_value.clone(),
                )
            })
        } else {
            None
        };
        if let Some((control_id, input_name, draft_value)) = event {
            let reason = self.debug_input_reason(&control_id, &input_name);
            self.debug_emit(EngineDebugEventPayload::InputEditDraft {
                name: input_name,
                value: crate::engine_debug_recorder::sanitize_text(&draft_value, reason),
            });
        }
        true
    }

    /// Commit active focused-input edit session.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]).
    pub fn commit_focused_input_edit(&mut self) -> Result<bool, String> {
        self.mutate_with_panic_boundary(Self::commit_focused_input_edit_internal)?
    }

    /// Cancel active focused-input edit session.
    pub fn cancel_focused_input_edit(&mut self) -> bool {
        self.cancel_active_input_edit_with_debug()
    }

    /// Start edit session for the currently focused select control.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]).
    pub fn begin_focused_select_edit(&mut self) -> Result<bool, String> {
        self.mutate_with_panic_boundary(Self::begin_focused_select_edit_internal)?
    }

    /// Move the draft selection for the active focused-select edit session.
    pub fn move_focused_select_edit(&mut self, delta: i32) -> bool {
        let Some(select_name) = self
            .active_select_edit
            .as_ref()
            .map(|edit| edit.select_name.clone())
        else {
            return false;
        };
        let Some(option_count) = self.select_option_count_on_active_card(&select_name) else {
            return false;
        };
        if option_count == 0 {
            return false;
        }
        if let Some(edit) = self.active_select_edit.as_mut() {
            edit.draft_index = wrap_select_index(edit.draft_index, delta, option_count);
            true
        } else {
            false
        }
    }

    /// Commit active focused-select edit session.
    ///
    /// Wrapped in the panic-containment boundary (see [`catch_engine_panic`]).
    pub fn commit_focused_select_edit(&mut self) -> Result<bool, String> {
        self.mutate_with_panic_boundary(Self::commit_focused_select_edit_internal)?
    }

    /// Cancel active focused-select edit session.
    pub fn cancel_focused_select_edit(&mut self) -> bool {
        if self.active_select_edit.is_none() {
            return false;
        }
        self.active_select_edit = None;
        true
    }

    /// Return focused input name when edit session is active.
    pub fn focused_input_edit_name(&self) -> Option<String> {
        self.active_input_edit
            .as_ref()
            .map(|edit| edit.input_name.clone())
    }

    /// Return focused input draft value when edit session is active.
    pub fn focused_input_edit_value(&self) -> Option<String> {
        self.active_input_edit
            .as_ref()
            .map(|edit| edit.draft_value.clone())
    }

    /// Return focused select name when edit session is active.
    pub fn focused_select_edit_name(&self) -> Option<String> {
        self.active_select_edit
            .as_ref()
            .map(|edit| edit.select_name.clone())
    }

    /// Return focused select draft value when edit session is active.
    pub fn focused_select_edit_value(&self) -> Option<String> {
        let edit = self.active_select_edit.as_ref()?;
        self.select_value_on_active_card(&edit.select_name, edit.draft_index)
    }

    /// Get active card id.
    pub fn active_card_id(&self) -> Result<String, String> {
        let card = self.active_card_internal()?;
        Ok(card.id.clone())
    }

    /// Get focused link index for the active card layout.
    pub fn focused_link_index(&self) -> usize {
        self.focused_link_idx
    }

    /// Get deck base URL metadata from last `loadDeckContext`.
    pub fn base_url(&self) -> String {
        self.base_url.clone()
    }

    /// Get content type metadata from last `loadDeckContext`.
    pub fn content_type(&self) -> String {
        self.content_type.clone()
    }

    /// Monotonic identifier for the active WML browser context. Hosts use it
    /// to keep request-shaped history synchronized with engine newcontext and
    /// independent-navigation resets.
    pub fn browser_context_epoch(&self) -> u32 {
        self.browser_context_epoch
    }

    /// Get authored deck-level `xml:lang` metadata.
    pub fn deck_language(&self) -> Option<String> {
        self.deck.as_ref().and_then(|deck| deck.language.clone())
    }

    /// Get the active card language after card-over-deck inheritance.
    pub fn active_card_language(&self) -> Option<String> {
        self.deck
            .as_ref()
            .and_then(|deck| deck.card_language(self.active_card_idx))
            .map(str::to_string)
    }

    /// Get host-resolved external navigation intent when one is pending.
    pub fn external_navigation_intent(&self) -> Option<String> {
        self.external_nav_intent.clone()
    }

    /// Get request-policy metadata for the pending external navigation intent.
    pub fn external_navigation_request_policy(
        &self,
    ) -> Option<ScriptNavigationRequestPolicyLiteral> {
        self.external_nav_request_policy.clone()
    }

    /// Clear pending external navigation intent.
    pub fn clear_external_navigation_intent(&mut self) {
        self.external_nav_intent = None;
        self.external_nav_request_policy = None;
    }

    /// Execute a raw project-specific nine-opcode compatibility fixture with
    /// no runtime host bindings.
    ///
    /// This entry point does not accept normative WAP-193 compilation units;
    /// use [`Self::register_script_unit`] and invoke a decoded external name
    /// for that path.
    ///
    /// Wrapped in the same panic-containment boundary as every other
    /// script-execution entry point (see [`Self::execute_script_contained`]),
    /// so a defensive-programming bug in the decoder or VM degrades to a
    /// typed `ScriptExecutionOutcome::fatal` instead of unwinding raw through
    /// the `#[wasm_bindgen]` boundary as an uncaught JS exception.
    pub fn execute_script_unit(&self, bytes: Vec<u8>) -> ScriptExecutionOutcome {
        self.read_with_panic_boundary(move |engine| engine.execute_script_unit_internal(&bytes))
            .unwrap_or_else(contained_panic_script_outcome)
    }

    /// Register a WAP-193 bytecode unit by source key.
    ///
    /// A unit with no manual entry-point metadata is decoded and verified as
    /// a WAP-193 compilation unit when executed. Existing project-specific
    /// nine-opcode fixtures remain available only through the explicit
    /// compatibility boundary established by [`Self::register_script_entry_point`].
    pub fn register_script_unit(&mut self, src: String, bytes: Vec<u8>) {
        self.script_units.insert(src, bytes);
    }

    /// Clear all registered units and function entry points.
    pub fn clear_script_units(&mut self) {
        self.script_units.clear();
        self.script_entrypoints.clear();
    }

    /// Register a legacy-fixture entry point program counter.
    ///
    /// Manual PCs are not part of WAP-193's external function-name table.
    /// Calling this method explicitly opts `src` into the project-specific
    /// nine-opcode compatibility VM; strict WAP units resolve names from their
    /// decoded function pool and must not register manual PCs.
    pub fn register_script_entry_point(
        &mut self,
        src: String,
        function_name: String,
        entry_pc: usize,
    ) {
        self.script_entrypoints
            .entry(src)
            .or_default()
            .insert(function_name, entry_pc);
    }

    /// Clear all registered entry points.
    pub fn clear_script_entry_points(&mut self) {
        self.script_entrypoints.clear();
    }

    /// Run a script-execution entry point and settle the shared post-execution
    /// state.
    ///
    /// Shared by every `execute_script_ref*` method: run `execute` inside the
    /// panic-containment boundary (see [`catch_engine_panic`]), record the
    /// outcome, and drop the deferred effects that the non-applying `execute_*`
    /// family deliberately does not run. These methods have no `Result` in
    /// their public signature (kept stable per the existing contract); a
    /// contained panic is reported through the same
    /// `ScriptExecutionOutcome::fatal` shape already used for VM traps (see
    /// `classify_vm_trap_outcome`), not a bespoke error shape.
    fn execute_script_contained(
        &mut self,
        execute: impl FnMut(&mut Self) -> ScriptExecutionOutcome + 'static,
    ) -> ScriptExecutionOutcome {
        let outcome = self
            .mutate_with_panic_boundary(execute)
            .unwrap_or_else(contained_panic_script_outcome);
        self.last_script_outcome = Some(outcome.clone());
        self.pending_script_effects = ScriptRuntimeEffects::default();
        self.last_script_dialog_requests.clear();
        self.last_script_timer_requests.clear();
        outcome
    }

    /// Run a script invocation inside the panic-containment boundary.
    ///
    /// Shared by every `invoke_script_ref*` method. Unlike
    /// [`Self::execute_script_contained`], the invoking family applies its
    /// deferred runtime effects internally, so this only owns panic
    /// containment: a defensive-programming bug in the VM or in re-entrant
    /// navigation degrades to a typed error instead of crashing the host.
    fn invoke_script_contained(
        &mut self,
        invoke: impl FnMut(&mut Self) -> Result<ScriptInvocationOutcome, String> + 'static,
    ) -> Result<ScriptInvocationOutcome, String> {
        self.mutate_with_panic_boundary(invoke)?
    }

    /// Execute script reference without applying deferred runtime effects.
    pub fn execute_script_ref(&mut self, src: String) -> ScriptExecutionOutcome {
        self.execute_script_contained(move |engine| {
            engine.execute_script_ref_internal(&src, "main")
        })
    }

    /// Execute script function without applying deferred runtime effects.
    pub fn execute_script_ref_function(
        &mut self,
        src: String,
        function_name: String,
    ) -> ScriptExecutionOutcome {
        self.execute_script_contained(move |engine| {
            engine.execute_script_ref_internal(&src, &function_name)
        })
    }

    /// Execute script function call without applying deferred runtime effects.
    pub fn execute_script_ref_call(
        &mut self,
        src: String,
        function_name: String,
        args: Vec<ScriptCallArgLiteral>,
    ) -> ScriptExecutionOutcome {
        let vm_args = convert_script_call_args(&args);
        self.execute_script_contained(move |engine| {
            engine.execute_script_ref_call_internal(&src, &function_name, &vm_args)
        })
    }

    /// Invoke script reference and apply deferred runtime effects at boundary.
    pub fn invoke_script_ref(&mut self, src: String) -> Result<ScriptInvocationOutcome, String> {
        self.invoke_script_contained(move |engine| {
            engine.invoke_script_ref_internal(&src, "main", &[])
        })
    }

    /// Invoke script function and apply deferred runtime effects at boundary.
    pub fn invoke_script_ref_function(
        &mut self,
        src: String,
        function_name: String,
    ) -> Result<ScriptInvocationOutcome, String> {
        self.invoke_script_contained(move |engine| {
            engine.invoke_script_ref_internal(&src, &function_name, &[])
        })
    }

    /// Invoke script function call and apply deferred runtime effects.
    pub fn invoke_script_ref_call(
        &mut self,
        src: String,
        function_name: String,
        args: Vec<ScriptCallArgLiteral>,
    ) -> Result<ScriptInvocationOutcome, String> {
        let vm_args = convert_script_call_args(&args);
        self.invoke_script_contained(move |engine| {
            engine.invoke_script_ref_internal(&src, &function_name, &vm_args)
        })
    }

    /// Read last script trap message, if any.
    pub fn last_script_execution_trap(&self) -> Option<String> {
        self.last_script_outcome
            .as_ref()
            .and_then(|outcome| outcome.trap.clone())
    }

    /// Read `ok` status from the last script execution.
    pub fn last_script_execution_ok(&self) -> Option<bool> {
        self.last_script_outcome.as_ref().map(|outcome| outcome.ok)
    }

    /// Read classified error class from the last script execution.
    pub fn last_script_execution_error_class(&self) -> Option<String> {
        self.last_script_outcome
            .as_ref()
            .map(|outcome| outcome.error_class.as_str().to_string())
    }

    /// Read classified error category from the last script execution.
    pub fn last_script_execution_error_category(&self) -> Option<String> {
        self.last_script_outcome
            .as_ref()
            .map(|outcome| outcome.error_category.as_str().to_string())
    }

    /// Read refresh requirement from the last script execution.
    pub fn last_script_requires_refresh(&self) -> Option<bool> {
        self.last_script_outcome
            .as_ref()
            .map(|outcome| outcome.requires_refresh)
    }

    /// Read dialog side-effect requests from the last successful script invocation.
    pub fn last_script_dialog_requests(&self) -> Vec<ScriptDialogRequestLiteral> {
        self.last_script_dialog_requests
            .iter()
            .map(script_dialog_request_to_literal)
            .collect()
    }

    /// Read timer side-effect requests from the last successful script invocation.
    pub fn last_script_timer_requests(&self) -> Vec<ScriptTimerRequestLiteral> {
        self.last_script_timer_requests
            .iter()
            .map(script_timer_request_to_literal)
            .collect()
    }

    /// Get bounded trace buffer entries.
    pub fn trace_entries(&self) -> Vec<EngineTraceEntry> {
        self.trace_entries.clone()
    }

    /// Clear trace entries and reset trace sequence numbering.
    pub fn clear_trace_entries(&mut self) {
        self.trace_entries.clear();
        self.next_trace_seq = 1;
    }

    /// Enable or disable the engine-owned debug source.
    ///
    /// Enabling starts a fresh bounded recorder. Repeating the current state
    /// is idempotent. Host policy and session lifecycle remain D0-03-owned.
    pub fn set_debug_recording_enabled(&mut self, enabled: bool) {
        match (enabled, self.debug_recorder.is_some()) {
            (true, false) => {
                self.debug_recorder = Some(crate::engine_debug_recorder::EngineDebugRecorder::new())
            }
            (false, true) => self.debug_recorder = None,
            (true, true) | (false, false) => {}
        }
    }

    /// Return whether the engine-owned debug source is active.
    pub fn debug_recording_enabled(&self) -> bool {
        self.debug_recorder.is_some()
    }

    /// Return the recorder's current cursor for a newly attached host session.
    pub fn debug_event_cursor(&self) -> Result<String, EngineDebugError> {
        self.debug_recorder
            .as_ref()
            .map(crate::engine_debug_recorder::EngineDebugRecorder::cursor)
            .ok_or_else(|| {
                crate::engine_debug_recorder::debug_error(
                    EngineDebugErrorCode::DebugSourceUnavailable,
                    "debug recorder is disabled",
                )
            })
    }

    /// Read a bounded debug event batch without mutating recorder state.
    pub fn poll_debug_events(
        &self,
        cursor: &str,
        max_events: u16,
    ) -> Result<EngineDebugEventBatch, EngineDebugError> {
        self.debug_recorder
            .as_ref()
            .ok_or_else(|| {
                crate::engine_debug_recorder::debug_error(
                    EngineDebugErrorCode::DebugSourceUnavailable,
                    "debug recorder is disabled",
                )
            })?
            .poll(cursor, max_events)
    }

    /// Construct a bounded, sanitized, read-only runtime snapshot.
    pub fn debug_snapshot(&self) -> Result<EngineDebugSnapshot, EngineDebugError> {
        self.debug_snapshot_internal()
    }
}

#[cfg(test)]
fn test_compatibility_wml_input<'a>(
    wml_xml: &'a str,
    content_type: &str,
) -> std::borrow::Cow<'a, str> {
    if content_type.contains("validation=strict")
        || content_type.split(';').next().is_some_and(|media_type| {
            media_type
                .trim()
                .eq_ignore_ascii_case("application/vnd.wap.wmlc")
        })
        || wml_xml.contains("<?xml")
    {
        return std::borrow::Cow::Borrowed(wml_xml);
    }
    if wml_xml.contains("<!DOCTYPE") {
        return std::borrow::Cow::Owned(format!("<?xml version=\"1.0\"?>\n{wml_xml}"));
    }
    std::borrow::Cow::Owned(format!(
        "<?xml version=\"1.0\"?>\n<!DOCTYPE wml SYSTEM \"http://tests.wap-labs.invalid/compat.dtd\">\n{wml_xml}"
    ))
}

fn truncate_to_chars(value: &str, max_len: Option<usize>) -> String {
    let Some(limit) = max_len else {
        return value.to_string();
    };
    value.chars().take(limit).collect()
}

fn wrap_select_index(current: usize, delta: i32, len: usize) -> usize {
    let len = len.max(1) as i32;
    let current = current as i32;
    let next = (current + delta).rem_euclid(len);
    next as usize
}

/// Builds the `ScriptExecutionOutcome` reported for a panic caught by
/// [`catch_engine_panic`] on the `execute_script_ref*` family. Reuses the
/// existing fatal-outcome shape (`ScriptErrorCategoryLiteral::Resource`,
/// the same category already used for `VmTrap::StackOverflow`,
/// `CallDepthExceeded`, and `ExecutionLimitExceeded`) so hosts see one
/// consistent shape for "the engine hit an internal resource limit or bug"
/// instead of a bespoke error type.
fn contained_panic_script_outcome(message: String) -> ScriptExecutionOutcome {
    ScriptExecutionOutcome::fatal(message, ScriptErrorCategoryLiteral::Resource)
}
