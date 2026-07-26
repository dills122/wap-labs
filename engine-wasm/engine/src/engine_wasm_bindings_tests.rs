use super::*;
use js_sys::{Array, Object, Reflect};
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
const WML_203_DTD_FAMILY: &str = include_str!("../../examples/source/wml-203-dtd-family.wml");

fn draw_len(render_value: &JsValue) -> u32 {
    let draw = Reflect::get(render_value, &JsValue::from_str("draw")).expect("draw property");
    Array::from(&draw).length()
}

fn sorted_object_keys(value: &JsValue) -> Vec<String> {
    let object = Object::from(value.clone());
    let mut keys: Vec<String> = Object::keys(&object)
        .iter()
        .filter_map(|key| key.as_string())
        .collect();
    keys.sort();
    keys
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

fn trace_kinds(trace_value: &JsValue) -> Vec<String> {
    Array::from(trace_value)
        .iter()
        .filter_map(|entry| {
            Reflect::get(&entry, &JsValue::from_str("kind"))
                .ok()
                .and_then(|value| value.as_string())
        })
        .collect()
}

#[wasm_bindgen_test]
fn wasm_wml_203_strict_prologue_and_selected_dtd_family_match_native_behavior() {
    let mut engine = WmlEngine::wasm_new();
    let err = engine
        .load_deck_context_wasm(
            "<wml><card id=\"main\"><p>Missing</p></card></wml>",
            "http://example.test/apps/wml-203.wml",
            "text/vnd.wap.wml; validation=strict",
            None,
            None,
        )
        .expect_err("the WASM boundary must enforce the text prologue");
    assert_eq!(
        err.as_string().as_deref(),
        Some("Invalid WML prologue: missing required XML declaration")
    );

    engine
        .load_deck_context_wasm(
            WML_203_DTD_FAMILY,
            "http://example.test/apps/wml-203.wml",
            "text/vnd.wap.wml; validation=strict",
            None,
            None,
        )
        .expect("the selected WML 1.3 family should load through WASM");
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("main"));
    let text_render = draw_text(&engine.render_wasm().expect("text render should succeed"));
    for expected in ["Family", "Cell", "One", "Pre"] {
        assert!(
            text_render.iter().any(|line| line.contains(expected)),
            "WASM render omitted {expected:?}: {text_render:?}"
        );
    }

    let tokenized_xml = WML_203_DTD_FAMILY
        .split_once("<wml")
        .map(|(_, body)| format!("<wml{body}"))
        .expect("fixture should contain a WML root");
    engine
        .load_deck_context_wasm(
            &tokenized_xml,
            "http://example.test/apps/wml-203.wmlc",
            "application/vnd.wap.wmlc",
            None,
            None,
        )
        .expect("normalized WBXML should use transport prologue metadata");
    assert_eq!(
        draw_text(&engine.render_wasm().expect("WBXML render should succeed")),
        text_render
    );
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
            None,
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
fn wasm_wml_202_head_metadata_parser_matches_native_boundary_behavior() {
    let valid = r#"
        <wml>
          <head>
            <meta name="scenario" content="wml-202"/>
            <access domain="example.test" path="/apps"/>
            <meta http-equiv="Cache-Control" content="max-age=60" forua="true"/>
          </head>
          <card id="home"><p>Metadata deck</p></card>
        </wml>
    "#;
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(valid)
        .expect("valid WML-202 head metadata should load through wasm");
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("activeCardId should be available"),
        "home"
    );
    assert_eq!(
        draw_text(&engine.render_wasm().expect("render should succeed")),
        vec!["Metadata deck"]
    );

    let duplicate_head = r#"
        <wml>
          <head><meta name="first" content="one"/></head>
          <head><meta name="second" content="two"/></head>
          <card id="home"><p>Invalid</p></card>
        </wml>
    "#;
    let err = engine
        .load_deck_wasm(duplicate_head)
        .expect_err("native and wasm paths must both reject duplicate head elements");
    assert!(err
        .as_string()
        .expect("parser error should be a string")
        .contains("only one <head>"));
}

#[wasm_bindgen_test]
fn wasm_wml_202_access_and_language_boundary_matches_native_behavior() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_context_wasm(
            r#"<wml xml:lang="en"><head><access domain="example.test" path="/allowed"/></head><card id="home"><p>Allowed</p></card></wml>"#,
            "https://service.example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
            Some("https://www.example.test/allowed/source.wml".to_string()),
        )
        .expect("matching referring URI should load through wasm");
    assert_eq!(engine.deck_language_wasm().as_deref(), Some("en"));
    assert_eq!(engine.active_card_language_wasm().as_deref(), Some("en"));

    let err = engine
        .load_deck_context_wasm(
            r#"<wml><head><access domain="trusted.test"/></head><card id="blocked"><p>Blocked</p></card></wml>"#,
            "https://service.test/blocked.wml",
            "text/vnd.wap.wml",
            None,
            Some("https://attacker.test/source.wml".to_string()),
        )
        .expect_err("mismatched referring URI should be denied through wasm");
    assert_eq!(
        err.as_string().as_deref(),
        Some("Deck access denied for referring URI")
    );
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("denial must preserve prior active card"),
        "home"
    );
}

#[wasm_bindgen_test]
fn wasm_m1_02_handle_key_render_and_navigate_back_boundary_flow() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(FIXTURE_BASIC_TWO_CARD)
        .expect("loadDeck wasm wrapper should succeed");

    let render_value = engine.render_wasm().expect("render should succeed");
    assert_eq!(draw_len(&render_value), 2);
    assert_eq!(sorted_object_keys(&render_value), vec!["draw"]);
    let draw = Reflect::get(&render_value, &JsValue::from_str("draw")).expect("draw property");
    let commands = Array::from(&draw);
    assert_eq!(
        sorted_object_keys(&commands.get(0)),
        vec!["text", "type", "x", "y"]
    );
    assert_eq!(
        sorted_object_keys(&commands.get(1)),
        vec!["focused", "href", "text", "type", "x", "y"]
    );
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
    assert!(engine.last_back_navigation_handled_wasm());
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "home"
    );
    assert_eq!(engine.focused_link_index_wasm(), 0);
    assert!(!engine.navigate_back_wasm());
    assert!(!engine.last_back_navigation_handled_wasm());
}

#[wasm_bindgen_test]
fn wasm_wml_303_back_override_reports_handled_without_snapshot_change() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r#"<wml><card id="home">
              <do name="refresh-back" type="prev"><refresh/></do>
              <p>Home</p>
            </card></wml>"#,
        )
        .expect("deck should load");

    assert!(engine.navigate_back_wasm());
    assert!(engine.last_back_navigation_handled_wasm());
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "home"
    );
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
    assert_eq!(
        sorted_object_keys(&ok),
        vec!["navigationIntent", "requiresRefresh", "result"]
    );
    assert!(!Reflect::has(&ok, &JsValue::from_str("effects")).expect("property lookup"));
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

    let fatal = engine
        .execute_script_unit_wasm(Vec::new())
        .expect("fatal script outcome should serialize");
    assert_eq!(
        sorted_object_keys(&fatal),
        vec![
            "errorCategory",
            "errorClass",
            "invocationAborted",
            "navigationIntent",
            "ok",
            "requiresRefresh",
            "result",
            "trap",
        ]
    );
    assert!(!Reflect::has(&fatal, &JsValue::from_str("effects")).expect("property lookup"));

    engine.register_script_unit_wasm(
        "go.wmlsc".to_string(),
        vec![
            0x03, 0x05, b'#', b'n', b'e', b'x', b't', 0x20, 0x03, 0x01, 0x00,
        ],
    );
    let go = engine
        .execute_script_ref_wasm("go.wmlsc".to_string())
        .expect("go script outcome should serialize");
    let go_intent = Reflect::get(&go, &JsValue::from_str("navigationIntent"))
        .expect("navigationIntent field should exist");
    assert_eq!(sorted_object_keys(&go_intent), vec!["href", "type"]);
    assert_eq!(
        Reflect::get(&go_intent, &JsValue::from_str("type"))
            .expect("type field")
            .as_string()
            .as_deref(),
        Some("go")
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
            None,
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
fn wasm_wml_205_load_diagnostics_match_native_taxonomy() {
    let mut engine = WmlEngine::wasm_new();

    let malformed = engine
        .load_deck_wasm("<wml><card id=\"broken\"></wml>")
        .expect_err("malformed XML must fail at the wasm boundary");
    assert!(malformed.as_string().is_some());
    let diagnostics = engine
        .last_wml_load_diagnostics_wasm()
        .expect("diagnostics should serialize");
    let entries = Array::from(&diagnostics);
    assert_eq!(entries.length(), 1);
    let entry = entries.get(0);
    assert_eq!(
        Reflect::get(&entry, &JsValue::from_str("class"))
            .expect("class field")
            .as_string()
            .as_deref(),
        Some("malformed")
    );
    assert_eq!(
        Reflect::get(&entry, &JsValue::from_str("code"))
            .expect("code field")
            .as_string()
            .as_deref(),
        Some("WML_MALFORMED_XML")
    );
    assert_eq!(
        Reflect::get(&entry, &JsValue::from_str("outcome"))
            .expect("outcome field")
            .as_string()
            .as_deref(),
        Some("rejected")
    );

    engine
        .load_deck_wasm(
            r#"<!DOCTYPE wml SYSTEM "http://example.test/alternate.dtd">
               <wml><head><meta name="x" content="y"/></head><card id="ok">
               <timer value="bad"/><future><p>Known</p></future></card></wml>"#,
        )
        .expect("recoverable deck should load at wasm boundary");
    let recovered = Array::from(
        &engine
            .last_wml_load_diagnostics_wasm()
            .expect("diagnostics should serialize"),
    );
    assert_eq!(recovered.length(), 2);
    let classes = recovered
        .iter()
        .map(|entry| {
            Reflect::get(&entry, &JsValue::from_str("class"))
                .expect("class field")
                .as_string()
                .expect("class should be a string")
        })
        .collect::<Vec<_>>();
    assert_eq!(classes, ["recoverable", "unsupported"]);
}

#[wasm_bindgen_test]
fn wasm_wml_204_grouped_control_validation_matches_native_error() {
    let mut engine = WmlEngine::wasm_new();
    let invalid = r#"<wml><card id="home"><fieldset/></card></wml>"#;

    let err = engine
        .load_deck_wasm(invalid)
        .expect_err("empty WML fieldset must fail at the wasm boundary");
    assert_eq!(
        err.as_string().expect("parser error should be a string"),
        "Invalid <fieldset>: element must not be empty"
    );
}

#[wasm_bindgen_test]
fn wasm_wml_202_template_shadowing_matches_native_task_activation() {
    let mut engine = WmlEngine::wasm_new();
    let xml = r##"
        <wml>
          <template><do type="accept" name="primary"><go href="#deck"/></do></template>
          <card id="home"><do type="accept" name="primary"><go href="#card"/></do></card>
          <card id="deck"><p>Deck</p></card>
          <card id="card"><p>Card</p></card>
        </wml>
        "##;

    engine
        .load_deck_wasm(xml)
        .expect("deck should load through wasm boundary");
    engine
        .handle_key_wasm("enter".to_string())
        .expect("card binding should activate");
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "card"
    );
    assert!(
        draw_text(&engine.render_wasm().expect("render should succeed"))
            .iter()
            .any(|text| text.contains("Card"))
    );
    assert_eq!(
        trace_kinds(
            &engine
                .trace_entries_wasm()
                .expect("trace entries should serialize")
        ),
        ["LOAD_DECK", "KEY", "ACTION_ACCEPT", "ACTION_FRAGMENT"]
    );

    assert!(engine.navigate_back_wasm());
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "home"
    );
    engine
        .handle_key_wasm("enter".to_string())
        .expect("card binding should remain active after back navigation");
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be available"),
        "card"
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

#[wasm_bindgen_test]
fn wasm_wml_204_invalid_variable_reference_rejection_is_atomic() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_context_wasm(
            r#"<wml><card id="stable"><p>Stable</p></card></wml>"#,
            "https://example.test/stable.wml",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect("baseline deck should load");
    assert!(engine.set_var_wasm("session".to_string(), "preserved".to_string()));

    engine
        .load_deck_wasm(
            r#"<wml><card id="invalid"><input name="pin" value="$(bad-name)"/></card></wml>"#,
        )
        .expect_err("invalid vdata reference must reject the wasm load");

    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("prior active card should remain available"),
        "stable"
    );
    assert_eq!(
        engine.get_var_wasm("session".to_string()).as_deref(),
        Some("preserved")
    );
}

#[wasm_bindgen_test]
fn wasm_wml_204_conversion_order_empty_option_and_href_match_native() {
    let mut engine = WmlEngine::wasm_new();
    let raw = "A B/C?D=E&F";
    engine
        .load_deck_context_wasm(
            r##"
            <wml>
              <card id="start"><a href="#controls">Controls</a></card>
              <card id="controls">
                <select name="Selected" value="beta">
                  <option value="alpha">Alpha</option>
                  <option value="beta">Beta</option>
                </select>
                <input name="Copied" value="$(Selected)"/>
                <input name="Escaped" value="$(Raw:escape)"/>
                <select name="Choice">
                  <option value="$(Raw)" onpick="/choose/$(Raw)">Choose raw value</option>
                </select>
                <select name="EmptyChoice" iname="EmptyIndex" ivalue="1">
                  <option>Visible label</option>
                </select>
              </card>
            </wml>
            "##,
            "https://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect("deck should load");
    assert!(engine.set_var_wasm("Raw".to_string(), raw.to_string()));
    engine
        .navigate_to_card_wasm("controls".to_string())
        .expect("controls should initialize");

    assert_eq!(
        engine.get_var_wasm("Copied".to_string()).as_deref(),
        Some("beta")
    );
    assert_eq!(
        engine.get_var_wasm("Escaped".to_string()).as_deref(),
        Some("A%20B%2FC%3FD%3DE%26F")
    );
    assert_eq!(
        engine.get_var_wasm("Choice".to_string()).as_deref(),
        Some(raw)
    );
    assert_eq!(engine.get_var_wasm("EmptyChoice".to_string()), None);
    assert_eq!(
        engine.get_var_wasm("EmptyIndex".to_string()).as_deref(),
        Some("1")
    );

    engine
        .handle_key_wasm("down".to_string())
        .expect("focus should move to copied input");
    engine
        .handle_key_wasm("down".to_string())
        .expect("focus should move to escaped input");
    engine
        .handle_key_wasm("down".to_string())
        .expect("focus should move to choice select");
    assert!(engine
        .begin_focused_select_edit_wasm()
        .expect("select edit should begin"));
    assert!(engine
        .commit_focused_select_edit_wasm()
        .expect("onpick navigation should succeed"));
    assert_eq!(
        engine.external_navigation_intent_wasm().as_deref(),
        Some("https://example.test/choose/A%20B%2FC%3FD%3DE%26F")
    );
    assert_eq!(engine.get_var_wasm("Raw".to_string()).as_deref(), Some(raw));
}

#[wasm_bindgen_test]
fn wasm_wml_302_variable_render_and_task_snapshot_match_native() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_context_wasm(
            r##"
            <wml>
              <card id="home">
                <do type="accept">
                  <go href="next/$(Value)">
                    <setvar name="Copied" value="$(Value)"/>
                    <setvar name="Value" value="new"/>
                  </go>
                </do>
                <p>Value $$ $(Value:noesc)</p>
              </card>
            </wml>
            "##,
            "https://example.test/decks/home.wml",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect("deck should load through WASM");
    assert!(engine.set_var_wasm("Value".to_string(), "old value".to_string()));

    assert!(
        draw_text(&engine.render_wasm().expect("render should succeed"))
            .iter()
            .any(|line| line.contains("Value $ old value"))
    );
    engine
        .handle_key_wasm("enter".to_string())
        .expect("accept task should execute through WASM");

    assert_eq!(
        engine.get_var_wasm("Copied".to_string()).as_deref(),
        Some("old value")
    );
    assert_eq!(
        engine.get_var_wasm("Value".to_string()).as_deref(),
        Some("new")
    );
    assert_eq!(
        engine.external_navigation_intent_wasm().as_deref(),
        Some("https://example.test/decks/next/old%20value")
    );
}
