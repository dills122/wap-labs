use super::*;
use crate::{
    EngineAffordanceSource, EngineControlAssociation, EngineInputEvent, EngineInputKey,
    EngineSelectionState,
};

const FRAME_DECK: &str = r##"
<wml>
  <template>
    <do name="template-help" type="help" label="Help $(who)"><go href="#help"/></do>
    <do name="masked" type="options"><go href="#masked"/></do>
  </template>
  <card id="home">
    <do name="open" type="accept" label="Open $(who)"><go href="#first"/></do>
    <do name="alternate" type="accept"><go href="#second"/></do>
    <do name="masked" type="options"><noop/></do>
    <do name="optional" type="x-vendor" optional="true"><go href="#optional"/></do>
    <p>Choose <a href="#first">first destination</a><a href="#second">second destination</a></p>
  </card>
  <card id="first"><p>First</p></card>
  <card id="second"><p>Second</p></card>
  <card id="help"><p>Help</p></card>
  <card id="masked"><p>Masked</p></card>
  <card id="optional"><p>Optional</p></card>
</wml>
"##;

fn frame_engine() -> WmlEngine {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            FRAME_DECK,
            "http://example.test/frame.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("frame deck should load");
    assert!(engine.set_var("who".to_string(), "Ada".to_string()));
    engine
}

#[test]
fn wml_309_frame_exposes_ordered_unique_active_do_affordances_with_labels() {
    let engine = frame_engine();
    let frame = engine.render_frame().expect("frame should render");

    assert_eq!(frame.contract_version, 3);
    assert_eq!(frame.profile_id, "class-c-reference");
    assert_eq!(frame.viewport.cols, 20);
    assert_eq!(frame.card.id, "home");
    assert_eq!(frame.focus.as_ref().map(|focus| focus.index), Some(0));
    assert_eq!(
        frame
            .affordances
            .iter()
            .map(|action| action.action_id.as_str())
            .collect::<Vec<_>>(),
        vec!["focus:0", "do:open", "do:alternate", "do:template-help"]
    );
    assert_eq!(
        frame
            .affordances
            .iter()
            .map(|action| action.label.as_str())
            .collect::<Vec<_>>(),
        vec!["first destination", "Open Ada", "accept", "Help Ada"]
    );
    assert_eq!(frame.affordances[1].source, EngineAffordanceSource::CardDo);
    assert_eq!(
        frame.affordances[3].source,
        EngineAffordanceSource::TemplateDo
    );
    assert_eq!(
        frame.affordances[1].control,
        EngineControlAssociation::Task,
        "focused content remains the primary control while every do stays exposed"
    );
    assert!(!frame
        .affordances
        .iter()
        .any(|action| action.action_id == "do:masked" || action.action_id == "do:optional"));
}

#[test]
fn wml_309_frame_identity_is_pure_and_changes_with_visible_focus_and_viewport() {
    let mut engine = frame_engine();
    let initial = engine.render_frame().expect("initial frame should render");
    assert_eq!(
        initial,
        engine.render_frame().expect("repeat frame should render"),
        "pure rendering must preserve frame identity and content"
    );

    engine
        .handle_input(EngineInputEvent::Key {
            key: EngineInputKey::Down,
        })
        .expect("typed key should use the legacy key path");
    let focused = engine.render_frame().expect("focused frame should render");
    assert_ne!(initial.frame_id, focused.frame_id);

    engine.set_viewport_cols(10).expect("valid viewport");
    let resized = engine.render_frame().expect("resized frame should render");
    assert_ne!(focused.frame_id, resized.frame_id);
    assert_eq!(resized.viewport.cols, 10);
}

#[test]
fn viewport_contract_rejects_one_over_limit_without_mutation_and_recovers() {
    let mut engine = frame_engine();
    let before = engine.render_frame().expect("initial frame should render");

    let error = engine
        .set_viewport_cols(u64::from(u32::MAX) + 1)
        .expect_err("one-over-limit viewport must be rejected");
    assert!(matches!(
        error,
        crate::EngineViewportError::InvalidViewport {
            requested_cols,
            min_cols: 1,
            max_cols: u32::MAX,
            ..
        } if requested_cols == "4294967296"
    ));
    assert_eq!(
        engine
            .render_frame()
            .expect("prior frame should remain valid"),
        before
    );

    engine
        .set_viewport_cols(10)
        .expect("valid viewport must succeed after rejection");
    assert_eq!(
        engine
            .render_frame()
            .expect("recovery frame should render")
            .viewport
            .cols,
        10
    );
}

#[test]
fn wml_309_typed_key_matches_legacy_trace_and_action_activation_is_frame_bound() {
    let mut legacy = frame_engine();
    let mut typed = frame_engine();
    legacy.clear_trace_entries();
    typed.clear_trace_entries();

    legacy
        .handle_key("down".to_string())
        .expect("legacy key should succeed");
    typed
        .handle_input(EngineInputEvent::Key {
            key: EngineInputKey::Down,
        })
        .expect("typed key should succeed");
    assert_eq!(
        legacy.render().unwrap().draw.len(),
        typed.render().unwrap().draw.len()
    );
    assert_eq!(
        serde_json::to_value(legacy.trace_entries()).unwrap(),
        serde_json::to_value(typed.trace_entries()).unwrap()
    );
    assert_eq!(
        legacy.render_frame().unwrap(),
        typed.render_frame().unwrap()
    );

    let frame = typed.render_frame().expect("action frame should render");
    typed
        .handle_input(EngineInputEvent::ActivateAction {
            frame_id: frame.frame_id.clone(),
            action_id: "do:alternate".to_string(),
        })
        .expect("named do action should activate");
    assert_eq!(typed.active_card_id().as_deref(), Ok("second"));

    let trace_before = serde_json::to_value(typed.trace_entries()).unwrap();
    let error = typed
        .handle_input(EngineInputEvent::ActivateAction {
            frame_id: frame.frame_id,
            action_id: "do:template-help".to_string(),
        })
        .expect_err("an action from the prior card frame must be stale");
    assert_eq!(error, "Engine input references a stale frame");
    assert_eq!(
        serde_json::to_value(typed.trace_entries()).unwrap(),
        trace_before
    );
}

#[test]
fn wml_309_selection_state_never_exposes_password_draft_values() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"<wml><card id="home"><p><input name="pin" type="password" value="1234"/></p></card></wml>"#,
        )
        .expect("password deck should load");
    engine
        .begin_focused_input_edit()
        .expect("input edit should begin");
    assert!(engine.set_focused_input_edit_draft("9876".to_string()));

    let frame = engine.render_frame().expect("password frame should render");
    assert!(matches!(
        frame.selection,
        EngineSelectionState::Input { editing: true, .. }
    ));
    let serialized = serde_json::to_string(&frame).expect("frame should serialize");
    assert!(!serialized.contains("1234"));
    assert!(!serialized.contains("9876"));
}
