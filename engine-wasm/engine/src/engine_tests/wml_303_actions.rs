use super::*;
use crate::runtime::card::{CardEventBindingKind, CardTaskAction};

#[test]
fn wml_303_retains_do_identity_metadata_and_orders_active_actions() {
    let xml = r##"
        <wml>
          <template>
            <do name="template-help" type="help" label="Help" xml:lang="en">
              <go href="#help"/>
            </do>
            <do name="masked" type="options"><go href="#masked"/></do>
          </template>
          <card id="home">
            <do type="accept" label="Open"><go href="#accepted"/></do>
            <do name="masked" type="options"><noop/></do>
            <do name="optional-help" type="x-vendor" optional="true">
              <go href="#optional"/>
            </do>
            <p>Home</p>
          </card>
          <card id="accepted"><p>Accepted</p></card>
          <card id="help"><p>Help</p></card>
          <card id="masked"><p>Masked</p></card>
          <card id="optional"><p>Optional</p></card>
        </wml>
        "##;
    let deck = crate::parser::wml_parser::parse_wml(xml).expect("deck should parse");
    let bindings = deck.active_do_bindings(0);

    assert_eq!(
        bindings.len(),
        2,
        "noop and optional actions are not active"
    );
    assert!(matches!(
        &bindings[0].kind,
        CardEventBindingKind::Do {
            name,
            do_type,
            label: Some(label),
            optional: false,
            language: None,
        } if name == "accept" && do_type == "accept" && label == "Open"
    ));
    assert!(matches!(
        &bindings[1].kind,
        CardEventBindingKind::Do {
            name,
            do_type,
            label: Some(label),
            optional: false,
            language: Some(language),
        } if name == "template-help" && do_type == "help" && label == "Help" && language == "en"
    ));
    assert_eq!(
        deck.active_do_action_by_name(0, "template-help"),
        Some(&CardTaskAction::Go {
            href: "#help".to_string(),
            method: None,
            post_fields: Vec::new(),
        })
    );
}

#[test]
fn wml_303_rejects_duplicate_do_identity_and_conflicting_intrinsic_bindings() {
    for (xml, expected) in [
        (
            r##"<wml><card id="home">
              <do type="accept"><noop/></do>
              <do name="accept" type="options"><noop/></do>
            </card></wml>"##,
            "duplicate <do> binding name 'accept'",
        ),
        (
            r##"<wml><card id="home" onenterforward="#next">
              <onevent type="onenterforward"><noop/></onevent>
            </card><card id="next"><p>Next</p></card></wml>"##,
            "conflicting 'onenterforward' event bindings",
        ),
    ] {
        let error = crate::parser::wml_parser::parse_wml(xml)
            .expect_err("conflicting bindings must reject the deck");
        assert!(error.contains(expected), "unexpected error: {error:?}");
    }
}

#[test]
fn wml_303_intrinsic_attribute_equivalence_and_illegal_parent_are_deterministic() {
    let attribute = crate::parser::wml_parser::parse_wml(
        r##"<wml>
          <card id="home" onenterforward="#next"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>"##,
    )
    .expect("intrinsic attribute deck should parse");
    let element = crate::parser::wml_parser::parse_wml(
        r##"<wml>
          <card id="home"><onevent type="onenterforward"><go href="#next"/></onevent><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>"##,
    )
    .expect("onevent deck should parse");
    assert_eq!(
        attribute.cards[0].event_bindings,
        element.cards[0].event_bindings
    );

    let illegal = crate::parser::wml_parser::parse_wml(
        r#"<wml><card id="home"><onevent type="onpick"><noop/></onevent><p>Home</p></card></wml>"#,
    )
    .expect("illegal-parent event should be ignored, not fatal");
    assert!(illegal.cards[0].event_bindings.is_empty());
}

#[test]
fn wml_303_option_onevent_onpick_executes_in_immediate_option_scope() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <p><select name="choice">
              <option value="alpha">Alpha</option>
              <option value="beta">
                <onevent type="onpick"><go href="#picked"/></onevent>
                Beta
              </option>
            </select></p>
          </card>
          <card id="picked"><p>Picked</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    assert!(engine
        .begin_focused_select_edit()
        .expect("select edit should begin"));
    assert!(engine.move_focused_select_edit(1));
    assert!(engine
        .commit_focused_select_edit()
        .expect("onpick task should succeed"));

    assert_eq!(engine.active_card_id().expect("active card"), "picked");
    assert_trace_kinds_subsequence(
        &engine,
        &["SELECT_EDIT_COMMIT", "ACTION_ONPICK", "ACTION_FRAGMENT"],
    );

    let conflict = crate::parser::wml_parser::parse_wml(
        r##"<wml><card id="home"><p><select name="choice">
          <option value="alpha" onpick="#one">
            <onevent type="onpick"><go href="#two"/></onevent>
            Alpha
          </option>
        </select></p></card><card id="one"/><card id="two"/></wml>"##,
    )
    .expect_err("attribute and element onpick bindings must conflict");
    assert!(conflict.contains("conflicting 'onpick' event bindings"));
}

#[test]
fn wml_303_forward_entry_action_runs_before_destination_timer() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><a href="#entry">Enter</a></card>
          <card id="entry" onenterforward="#final"><timer value="1"/><p>Entry</p></card>
          <card id="final"><timer value="2"/><p>Final</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.clear_trace_entries();

    engine
        .handle_key("enter".to_string())
        .expect("forward entry chain should succeed");

    assert_eq!(engine.active_card_id().expect("active card"), "final");
    assert_trace_kinds_subsequence(
        &engine,
        &["KEY", "ACTION_FRAGMENT", "ACTION_FRAGMENT", "TIMER_START"],
    );
    let timer_starts = engine
        .trace_entries()
        .into_iter()
        .filter(|entry| entry.kind == "TIMER_START")
        .collect::<Vec<_>>();
    assert_eq!(timer_starts.len(), 1);
    assert!(timer_starts[0].detail.contains("valueDs=2"));
}

#[test]
fn wml_303_back_prefers_first_active_prev_binding_in_effective_order() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <template>
            <do name="template-prev" type="prev"><go href="#template"/></do>
          </template>
          <card id="home"><a href="#current">Next</a></card>
          <card id="current">
            <do name="first-prev" type="prev"><go href="#first"/></do>
            <do name="second-prev" type="prev"><go href="#second"/></do>
            <p>Current</p>
          </card>
          <card id="first"><p>First</p></card>
          <card id="second"><p>Second</p></card>
          <card id="template"><p>Template</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("forward navigation should succeed");

    assert!(engine.navigate_back(), "active prev binding consumes BACK");
    assert!(engine.last_back_navigation_handled());
    assert_eq!(engine.active_card_id().expect("active card"), "first");
    assert!(engine
        .trace_entries()
        .iter()
        .any(|entry| entry.kind == "ACTION_BACK_OVERRIDE"));
}

#[test]
fn wml_303_card_noop_masks_template_prev_and_intrinsic_back_pops_history() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <template>
            <do name="back" type="prev"><go href="#template"/></do>
          </template>
          <card id="home"><a href="#current">Next</a></card>
          <card id="current">
            <do name="back" type="prev"><noop/></do>
            <p>Current</p>
          </card>
          <card id="template"><p>Template</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("forward navigation should succeed");

    assert!(
        engine.navigate_back(),
        "intrinsic history pop consumes BACK"
    );
    assert!(engine.last_back_navigation_handled());
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert!(!engine
        .trace_entries()
        .iter()
        .any(|entry| entry.kind == "ACTION_BACK_OVERRIDE"));
}

#[test]
fn wml_303_back_override_can_consume_without_changing_card() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml><card id="home">
          <do name="refresh-back" type="prev"><refresh/></do>
          <p>Home</p>
        </card></wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    assert!(engine.navigate_back(), "refresh override consumes BACK");
    assert!(engine.last_back_navigation_handled());
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_trace_kinds_subsequence(&engine, &["ACTION_BACK_OVERRIDE", "ACTION_REFRESH"]);
}

#[test]
fn wml_303_empty_intrinsic_back_is_unhandled_but_remains_callable() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(r#"<wml><card id="home"><p>Home</p></card></wml>"#)
        .expect("deck should load");

    assert!(!engine.navigate_back());
    assert!(!engine.last_back_navigation_handled());
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert!(engine
        .trace_entries()
        .iter()
        .any(|entry| entry.kind == "ACTION_BACK_EMPTY"));
}

#[test]
fn wml_303_failed_back_override_rolls_back_control_and_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <input name="draft" value="original"/>
            <do name="broken-back" type="prev"><go href="#missing"/></do>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    assert!(engine
        .begin_focused_input_edit()
        .expect("input edit should begin"));
    assert!(engine.set_focused_input_edit_draft("changed".to_string()));

    assert!(
        engine.navigate_back(),
        "the active override consumes BACK on failure"
    );
    assert!(engine.last_back_navigation_handled());
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(
        engine.get_var("draft".to_string()),
        Some("original".to_string())
    );
    assert_eq!(
        engine.focused_input_edit_value(),
        Some("changed".to_string())
    );
    assert!(engine
        .trace_entries()
        .iter()
        .any(|entry| entry.kind == "ACTION_BACK_OVERRIDE_ERROR"));
}

#[test]
fn wml_303_focused_link_precedes_accept_and_unfocused_accept_uses_card_precedence() {
    let mut engine = WmlEngine::new();
    let with_link = r##"
        <wml>
          <template><do name="template-accept" type="accept"><go href="#template"/></do></template>
          <card id="home">
            <do name="card-accept" type="accept"><go href="#card"/></do>
            <a href="#link">Link</a>
          </card>
          <card id="link"><p>Link</p></card>
          <card id="card"><p>Card</p></card>
          <card id="template"><p>Template</p></card>
        </wml>
        "##;
    engine.load_deck(with_link).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("focused link should activate");
    assert_eq!(engine.active_card_id().expect("active card"), "link");

    let without_link = r##"
        <wml>
          <template><do name="template-accept" type="accept"><go href="#template"/></do></template>
          <card id="home">
            <do name="card-accept" type="accept"><go href="#card"/></do>
            <p>No focus target</p>
          </card>
          <card id="card"><p>Card</p></card>
          <card id="template"><p>Template</p></card>
        </wml>
        "##;
    engine.load_deck(without_link).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("accept action should activate");
    assert_eq!(engine.active_card_id().expect("active card"), "card");
}
