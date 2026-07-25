use super::*;
use js_sys::{Array, Reflect};
use wasm_bindgen::JsValue;
use wasm_bindgen_test::*;

const SAMPLE: &str = r##"
<wml>
  <card id="home">
    <p>Hello</p>
    <a href="#next">Next</a>
  </card>
  <card id="next"><p>World</p></card>
</wml>
"##;

const FIXTURE_BASIC_TWO_CARD: &str = include_str!("../tests/fixtures/phase-a/basic-two-card.wml");
const FIXTURE_MISSING_FRAGMENT: &str =
    include_str!("../tests/fixtures/phase-a/missing-fragment.wml");

fn draw_len(render_value: &JsValue) -> u32 {
    let draw = Reflect::get(render_value, &JsValue::from_str("draw")).expect("draw property");
    Array::from(&draw).length()
}

fn draw_text(render_value: &JsValue) -> Vec<String> {
    let draw = Reflect::get(render_value, &JsValue::from_str("draw")).expect("draw property");
    Array::from(&draw)
        .iter()
        .filter_map(|command| {
            Reflect::get(&command, &JsValue::from_str("text"))
                .ok()
                .and_then(|value| value.as_string())
        })
        .collect()
}

#[wasm_bindgen_test]
fn wasm_m1_02_load_deck_context_boundary_sets_metadata() {
    let mut engine = WmlEngine::wasm_new();

    engine
        .load_deck_context_wasm(
            SAMPLE,
            "http://example.test/deck.wml",
            "text/vnd.wap.wml",
            Some("AAECAw==".to_string()),
        )
        .expect("loadDeckContext wasm wrapper should succeed");

    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("activeCardId should be available"),
        "home"
    );
    assert_eq!(engine.base_url_wasm(), "http://example.test/deck.wml");
    assert_eq!(engine.content_type_wasm(), "text/vnd.wap.wml");
    assert_eq!(engine.focused_link_index_wasm(), 0);
}

#[wasm_bindgen_test]
fn wasm_m1_02_handle_key_render_and_navigate_back_boundary_flow() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(FIXTURE_BASIC_TWO_CARD)
        .expect("loadDeck wasm wrapper should succeed");

    let render_value = engine.render_wasm().expect("render should succeed");
    assert_eq!(draw_len(&render_value), 2);
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "home"
    );
    assert_eq!(engine.focused_link_index_wasm(), 0);

    engine
        .handle_key_wasm("enter".to_string())
        .expect("enter key should navigate");
    let after_enter_render = engine.render_wasm().expect("render should succeed");
    assert!(draw_len(&after_enter_render) > 0);
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "next"
    );

    assert!(engine.navigate_back_wasm());
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "home"
    );
    assert_eq!(engine.focused_link_index_wasm(), 0);
    assert!(!engine.navigate_back_wasm());
}

#[wasm_bindgen_test]
fn wasm_m1_02_invoke_script_ref_boundary_outcomes() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(SAMPLE)
        .expect("loadDeck wasm wrapper should succeed");
    engine.register_script_unit_wasm("ok.wmlsc".to_string(), vec![0x00]);

    let ok = engine
        .invoke_script_ref_wasm("ok.wmlsc".to_string())
        .expect("invokeScriptRef should succeed");
    let nav = Reflect::get(&ok, &JsValue::from_str("navigationIntent"))
        .expect("navigationIntent field should exist");
    let nav_type = Reflect::get(&nav, &JsValue::from_str("type"))
        .expect("navigation intent type should exist")
        .as_string()
        .expect("type should be string");
    assert_eq!(nav_type, "none");
    let requires_refresh = Reflect::get(&ok, &JsValue::from_str("requiresRefresh"))
        .expect("requiresRefresh field should exist")
        .as_bool()
        .expect("requiresRefresh should be bool");
    assert!(!requires_refresh);
    let result =
        Reflect::get(&ok, &JsValue::from_str("result")).expect("result field should exist");
    assert_eq!(
        result.as_string().expect("result should be string"),
        String::new()
    );
    assert_eq!(engine.last_script_execution_ok_wasm(), Some(true));
    assert_eq!(engine.last_script_execution_trap_wasm(), None);
    assert_eq!(
        engine.last_script_execution_error_class_wasm(),
        Some("none".to_string())
    );
    assert_eq!(
        engine.last_script_execution_error_category_wasm(),
        Some("none".to_string())
    );

    let err = engine
        .invoke_script_ref_wasm("missing.wmlsc".to_string())
        .expect_err("missing script should return JsValue error");
    let err_msg = err.as_string().expect("error should be a string message");
    assert!(err_msg.contains("script unit not registered"));
    assert_eq!(engine.last_script_execution_ok_wasm(), Some(false));
    assert_eq!(
        engine.last_script_execution_error_class_wasm(),
        Some("fatal".to_string())
    );
    assert_eq!(
        engine.last_script_execution_error_category_wasm(),
        Some("host-binding".to_string())
    );
    assert!(engine
        .last_script_execution_trap_wasm()
        .expect("trap should be present")
        .contains("script unit not registered"));
}

#[wasm_bindgen_test]
fn wasm_handle_key_missing_fragment_returns_error_and_preserves_state() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(FIXTURE_MISSING_FRAGMENT)
        .expect("loadDeck wasm wrapper should succeed");

    let err = engine
        .handle_key_wasm("enter".to_string())
        .expect_err("missing fragment should return JsValue error");
    let err_msg = err.as_string().expect("error should be a string message");
    assert!(err_msg.contains("Card id not found"));

    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "home"
    );
    assert_eq!(engine.focused_link_index_wasm(), 0);
    assert!(!engine.navigate_back_wasm());
}

#[wasm_bindgen_test]
fn wasm_handle_key_unknown_is_noop_for_navigation_state() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(SAMPLE)
        .expect("loadDeck wasm wrapper should succeed");

    engine
        .handle_key_wasm("unsupported-key".to_string())
        .expect("unknown key should be ignored without error");

    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "home"
    );
    assert_eq!(engine.focused_link_index_wasm(), 0);
    assert_eq!(engine.external_navigation_intent_wasm(), None);
}

#[wasm_bindgen_test]
fn wasm_load_deck_context_rejects_oversized_wml_payload() {
    let mut engine = WmlEngine::wasm_new();
    let oversized_xml = format!(
        "<wml><card id=\"home\"><p>{}</p></card></wml>",
        "a".repeat(MAX_DECK_WML_XML_BYTES + 1)
    );

    let err = engine
        .load_deck_context_wasm(
            &oversized_xml,
            "http://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect_err("oversized wml payload should fail at wasm boundary");
    let err_msg = err.as_string().expect("error should be a string message");
    assert!(err_msg.contains("Deck payload exceeds"));
}

#[wasm_bindgen_test]
fn wasm_load_deck_context_rejects_oversized_raw_payload() {
    let mut engine = WmlEngine::wasm_new();
    let oversized_raw = "A".repeat(MAX_DECK_RAW_BYTES_BASE64_BYTES + 1);

    let err = engine
        .load_deck_context_wasm(
            SAMPLE,
            "http://example.test/deck.wml",
            "text/vnd.wap.wml",
            Some(oversized_raw),
        )
        .expect_err("oversized raw payload should fail at wasm boundary");
    let err_msg = err.as_string().expect("error should be a string message");
    assert!(err_msg.contains("Raw deck payload exceeds"));
}

#[wasm_bindgen_test]
fn wasm_wml_204_control_validation_matches_native_error() {
    let mut engine = WmlEngine::wasm_new();
    let invalid = r#"<wml><card id="home"><input name="pin" type="number"/></card></wml>"#;

    let err = engine
        .load_deck_wasm(invalid)
        .expect_err("invalid WML control syntax must fail at the wasm boundary");
    assert_eq!(
        err.as_string().expect("parser error should be a string"),
        "Invalid <input>: attribute 'type' must be 'text' or 'password'"
    );
}

#[wasm_bindgen_test]
fn wasm_wml_204_input_mask_rejection_matches_native_state() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r#"<wml><card id="home"><input name="Pin" value="1234" format="4N"/></card></wml>"#,
        )
        .expect("deck should load");
    assert!(engine.set_var_wasm("Pin".to_string(), "1234".to_string()));
    assert!(engine
        .begin_focused_input_edit_wasm()
        .expect("edit should start"));
    assert!(engine.set_focused_input_edit_draft_wasm("12ab".to_string()));

    let err = engine
        .commit_focused_input_edit_wasm()
        .expect_err("invalid masked value should be rejected")
        .as_string()
        .expect("error should be a string");
    assert_eq!(
        err,
        "Input 'Pin' rejected: value does not conform to format mask"
    );
    assert_eq!(
        engine.focused_input_edit_name_wasm(),
        Some("Pin".to_string())
    );
    assert_eq!(
        engine.focused_input_edit_value_wasm(),
        Some("12ab".to_string())
    );
    assert_eq!(
        engine.get_var_wasm("Pin".to_string()),
        Some("1234".to_string())
    );
}

#[wasm_bindgen_test]
fn wasm_wml_204_input_initialization_matches_native_state() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r#"<wml><card id="home"><input name="Pin" value="1234" format="4N"/></card></wml>"#,
        )
        .expect("deck should load");

    assert_eq!(
        engine.get_var_wasm("Pin".to_string()),
        Some("1234".to_string())
    );
    assert!(engine
        .begin_focused_input_edit_wasm()
        .expect("initialized input should be editable"));
    assert_eq!(
        engine.focused_input_edit_value_wasm(),
        Some("1234".to_string())
    );
}

#[wasm_bindgen_test]
fn wasm_wml_204_input_vdata_maxlength_and_password_state_match_native() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r#"
              <wml>
                <card id="home">
                  <input name="DefaultPin" value="12345-123" format="NNNNN\-3N"/>
                  <input
                    name="Pin"
                    value="$(DefaultPin)"
                    type="password"
                    format="NNNNN\-3N"
                    maxlength="9"
                  />
                </card>
              </wml>
            "#,
        )
        .expect("deck should load");

    assert_eq!(
        engine.get_var_wasm("Pin".to_string()),
        Some("12345-123".to_string())
    );
    let initial_render = engine.render_wasm().expect("render should succeed");
    assert!(draw_text(&initial_render)
        .iter()
        .any(|text| text.contains("[Pin: *****-***]")));

    assert!(engine
        .handle_key_wasm("down".to_string())
        .map(|_| true)
        .expect("focus should move to password input"));
    assert!(engine
        .begin_focused_input_edit_wasm()
        .expect("edit should begin"));
    assert!(engine.set_focused_input_edit_draft_wasm("54321-9876".to_string()));
    assert_eq!(
        engine.focused_input_edit_value_wasm(),
        Some("54321-987".to_string())
    );
    assert!(engine
        .commit_focused_input_edit_wasm()
        .expect("valid truncated value should commit"));
    assert_eq!(
        engine.get_var_wasm("Pin".to_string()),
        Some("54321-987".to_string())
    );
}

#[wasm_bindgen_test]
fn wasm_wml_204_select_initialization_and_commit_match_native_state() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r#"
              <wml>
                <card id="home">
                  <select
                    name="Choices"
                    iname="ChoiceIndexes"
                    ivalue="2;2;8;1"
                    multiple="true"
                  >
                    <option value="alpha">Alpha</option>
                    <option value="beta">Beta</option>
                  </select>
                </card>
              </wml>
            "#,
        )
        .expect("deck should load");

    assert_eq!(
        engine.get_var_wasm("Choices".to_string()),
        Some("beta;alpha".to_string())
    );
    assert_eq!(
        engine.get_var_wasm("ChoiceIndexes".to_string()),
        Some("2;1".to_string())
    );
    assert!(engine
        .begin_focused_select_edit_wasm()
        .expect("select edit should begin"));
    assert!(engine
        .commit_focused_select_edit_wasm()
        .expect("multiple selection should toggle"));
    assert_eq!(
        engine.get_var_wasm("Choices".to_string()),
        Some("alpha".to_string())
    );
    assert_eq!(
        engine.get_var_wasm("ChoiceIndexes".to_string()),
        Some("1".to_string())
    );
}
