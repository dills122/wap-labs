use super::*;
use js_sys::{Array, Object, Reflect};
use wasm_bindgen::JsValue;
use wasm_bindgen_test::*;

use crate::engine_tests::engine_with_empty_select;
use crate::wavescript::wap_decoder::{decode_wap_compilation_unit, WapDecodeError};

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
const WML_301_CARD_TABLE_BOUNDARIES: &str =
    include_str!("../../examples/source/wml-301-card-table-boundaries.wml");
const WMLS_501_MINIMAL_UNIT: &str =
    include_str!("../tests/fixtures/wmlscript/wap-193-minimal-return-es.wmlsc.hex");
const WMLS_501_NAMED_UNIT: &str =
    include_str!("../tests/fixtures/wmlscript/wap-193-named-functions.wmlsc.hex");
const WMLS_501_INVALID_FUNCTION_REF_UNIT: &str =
    include_str!("../tests/fixtures/wmlscript/wap-193-invalid-function-ref.wmlsc.hex");
const WMLS_501_STACK_UNDERFLOW_UNIT: &str =
    include_str!("../tests/fixtures/wmlscript/wap-193-stack-underflow.wmlsc.hex");
const WMLS_501_STACK_OVERFLOW_UNIT: &str =
    include_str!("../tests/fixtures/wmlscript/wap-193-stack-overflow.wmlsc.hex");
const WMLS_501_VALID_LIBRARY_REFS_UNIT: &str =
    include_str!("../tests/fixtures/wmlscript/wap-193-valid-library-refs.wmlsc.hex");
const WMLS_501_INVALID_LIBRARY_INDEX_UNIT: &str =
    include_str!("../tests/fixtures/wmlscript/wap-193-invalid-library-index.wmlsc.hex");

fn wmls_501_fixture_bytes(fixture: &str) -> Vec<u8> {
    fixture
        .split_ascii_whitespace()
        .map(|token| u8::from_str_radix(token, 16).expect("fixture must contain hex bytes"))
        .collect()
}

#[wasm_bindgen_test]
fn wasm_panic_boundary_returns_typed_error_rolls_back_and_remains_usable() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm("<wml><card id=\"home\"><p>Home</p></card></wml>")
        .expect("initial deck should load");
    assert!(engine.set_var_wasm("status".to_string(), "before".to_string()));

    let result = engine.load_deck_wasm(crate::PANIC_BOUNDARY_TEST_WML);
    assert_eq!(
        result
            .expect_err("wasm load panic must become a typed engine error")
            .as_string()
            .as_deref(),
        Some(crate::CONTAINED_ENGINE_PANIC_ERROR)
    );
    assert_eq!(
        engine.get_var_wasm("status".to_string()).as_deref(),
        Some("before")
    );
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("home"));
    assert_eq!(
        engine
            .get_var_wasm("panic-boundary-probe".to_string())
            .as_deref(),
        None
    );

    engine
        .load_deck_wasm("<wml><card id=\"next\"><p>Next</p></card></wml>")
        .expect("engine must remain usable after a contained wasm panic");
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("next"));
}

#[wasm_bindgen_test]
fn wasm_wmls_501_decoder_matches_native_fixture_and_failure_semantics() {
    let fixture = wmls_501_fixture_bytes(WMLS_501_MINIMAL_UNIT);
    let decoded = decode_wap_compilation_unit(&fixture).expect("WAP-193 fixture must decode");
    assert_eq!(decoded.version, 0x01);
    assert_eq!(decoded.charset_mib_enum, 106);
    assert_eq!(decoded.function_names[0].name, "main");
    assert_eq!(decoded.functions[0].code, [0x3b]);

    let mut unknown_opcode = fixture;
    *unknown_opcode.last_mut().expect("fixture has an opcode") = 0x78;
    assert!(matches!(
        decode_wap_compilation_unit(&unknown_opcode),
        Err(WapDecodeError::UnsupportedOpcode {
            function: 0,
            pc: 0,
            opcode: 0x78,
        })
    ));
}

#[wasm_bindgen_test]
fn wasm_wmls_501_registered_runtime_routing_matches_native_outcomes_and_trace() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r##"<wml><card id="home"><a href="script:minimal.wmlsc#main">Run</a></card></wml>"##,
        )
        .expect("deck should load");
    engine.register_script_unit_wasm(
        "minimal.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_MINIMAL_UNIT),
    );

    let ok = engine
        .execute_script_ref_function_wasm("minimal.wmlsc".to_string(), "main".to_string())
        .expect("verified function outcome should serialize");
    assert_eq!(
        Reflect::get(&ok, &JsValue::from_str("ok"))
            .expect("ok field")
            .as_bool(),
        Some(true)
    );
    assert_eq!(
        Reflect::get(&ok, &JsValue::from_str("result"))
            .expect("result field")
            .as_string()
            .as_deref(),
        Some("")
    );
    engine
        .invoke_script_ref_function_wasm("minimal.wmlsc".to_string(), "main".to_string())
        .expect("verified RETURN_ES function should invoke through WASM");

    engine.register_script_unit_wasm(
        "named.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_NAMED_UNIT),
    );
    let unsupported = engine
        .execute_script_ref_function_wasm("named.wmlsc".to_string(), "todo".to_string())
        .expect("typed unsupported outcome should serialize");
    assert_eq!(
        Reflect::get(&unsupported, &JsValue::from_str("errorClass"))
            .expect("errorClass field")
            .as_string()
            .as_deref(),
        Some("fatal")
    );
    assert_eq!(
        Reflect::get(&unsupported, &JsValue::from_str("errorCategory"))
            .expect("errorCategory field")
            .as_string()
            .as_deref(),
        Some("host-binding")
    );

    engine.register_script_unit_wasm(
        "invalid-ref.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_INVALID_FUNCTION_REF_UNIT),
    );
    let invalid = engine
        .execute_script_ref_function_wasm("invalid-ref.wmlsc".to_string(), "main".to_string())
        .expect("typed verification outcome should serialize");
    assert_eq!(
        Reflect::get(&invalid, &JsValue::from_str("errorCategory"))
            .expect("errorCategory field")
            .as_string()
            .as_deref(),
        Some("integrity")
    );
    let invocation_error = engine
        .invoke_script_ref_function_wasm("invalid-ref.wmlsc".to_string(), "main".to_string())
        .expect_err("whole-unit verification failure must abort WASM invocation");
    assert_eq!(
        invocation_error.as_string().as_deref(),
        Some("wap decode: invalid function reference 2 in function 1 at pc=0")
    );

    engine.clear_trace_entries_wasm();
    engine
        .handle_key_wasm("enter".to_string())
        .expect("verified WAP action should execute through WASM");
    let traces = engine
        .trace_entries_wasm()
        .expect("trace entries should serialize");
    let trace_kinds: Vec<String> = Array::from(&traces)
        .iter()
        .filter_map(|entry| {
            Reflect::get(&entry, &JsValue::from_str("kind"))
                .ok()
                .and_then(|kind| kind.as_string())
        })
        .collect();
    assert!(trace_kinds.ends_with(&["ACTION_SCRIPT".to_string(), "SCRIPT_OK".to_string()]));
}

#[wasm_bindgen_test]
fn wasm_wmls_501_library_and_dataflow_verification_matches_native() {
    assert!(
        decode_wap_compilation_unit(&wmls_501_fixture_bytes(WMLS_501_VALID_LIBRARY_REFS_UNIT))
            .is_ok()
    );
    assert_eq!(
        decode_wap_compilation_unit(&wmls_501_fixture_bytes(WMLS_501_INVALID_LIBRARY_INDEX_UNIT)),
        Err(WapDecodeError::InvalidLibraryIndex {
            function: 0,
            pc: 0,
            index: 6,
        })
    );

    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r##"<wml><card id="home"><a href="script:dataflow.wmlsc#main">Run</a></card></wml>"##,
        )
        .expect("deck should load");

    engine.register_script_unit_wasm(
        "dataflow.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_STACK_UNDERFLOW_UNIT),
    );
    let underflow = engine
        .execute_script_ref_function_wasm("dataflow.wmlsc".to_string(), "main".to_string())
        .expect("underflow outcome must serialize");
    assert_eq!(
        Reflect::get(&underflow, &JsValue::from_str("errorCategory"))
            .expect("errorCategory field")
            .as_string()
            .as_deref(),
        Some("integrity")
    );
    assert_eq!(
        Reflect::get(&underflow, &JsValue::from_str("trap"))
            .expect("trap field")
            .as_string()
            .as_deref(),
        Some("wap decode: stack underflow in function 0 at pc=0 (required=1, available=0)")
    );

    engine.register_script_unit_wasm(
        "dataflow.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_STACK_OVERFLOW_UNIT),
    );
    let overflow = engine
        .execute_script_ref_function_wasm("dataflow.wmlsc".to_string(), "main".to_string())
        .expect("overflow outcome must serialize");
    assert_eq!(
        Reflect::get(&overflow, &JsValue::from_str("errorCategory"))
            .expect("errorCategory field")
            .as_string()
            .as_deref(),
        Some("resource")
    );
    assert_eq!(
        Reflect::get(&overflow, &JsValue::from_str("trap"))
            .expect("trap field")
            .as_string()
            .as_deref(),
        Some("wap decode: stack overflow in function 0 at pc=64 (depth=65, limit=64)")
    );

    engine.register_script_unit_wasm(
        "dataflow.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_STACK_UNDERFLOW_UNIT),
    );
    engine
        .handle_key_wasm("enter".to_string())
        .expect_err("underflow must abort the WAP action");
    let traces = Array::from(
        &engine
            .trace_entries_wasm()
            .expect("failure trace entries must serialize"),
    );
    let trace_kinds: Vec<String> = traces
        .iter()
        .filter_map(|entry| {
            Reflect::get(&entry, &JsValue::from_str("kind"))
                .ok()
                .and_then(|kind| kind.as_string())
        })
        .collect();
    assert!(trace_kinds.ends_with(&["ACTION_SCRIPT".to_string(), "SCRIPT_TRAP".to_string()]));

    engine.clear_trace_entries_wasm();
    engine.register_script_unit_wasm(
        "dataflow.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_MINIMAL_UNIT),
    );
    engine
        .handle_key_wasm("enter".to_string())
        .expect("valid replacement must execute after verifier failure");
    let recovered = engine
        .execute_script_ref_function_wasm("dataflow.wmlsc".to_string(), "main".to_string())
        .expect("recovered outcome must serialize");
    assert_eq!(
        Reflect::get(&recovered, &JsValue::from_str("ok"))
            .expect("ok field")
            .as_bool(),
        Some(true)
    );
}

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

#[wasm_bindgen_test]
fn wasm_wml_305_named_timer_lifecycle_matches_native_boundary() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <do type="accept">
              <go href="#timed"><setvar name="remaining" value="2"/></go>
            </do>
          </card>
          <card id="timed">
            <onevent type="ontimer"><go href="#expired"/></onevent>
            <timer name="remaining" value="5"/>
            <p>Timed</p>
          </card>
          <card id="expired"><p>Expired</p></card>
        </wml>
        "##;
    engine.load_deck_wasm(xml).expect("deck should load");
    engine
        .handle_key_wasm("enter".to_string())
        .expect("timer card should open");
    assert_eq!(engine.next_timer_wakeup_ms_wasm(), Some(200));

    engine
        .advance_time_ms_wasm(199)
        .expect("timer should advance");
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("timed"));
    assert_eq!(engine.next_timer_wakeup_ms_wasm(), Some(1));
    engine.advance_time_ms_wasm(1).expect("timer should expire");
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("expired"));
    assert_eq!(
        engine.get_var_wasm("remaining".to_string()).as_deref(),
        Some("0")
    );

    let mut zero = WmlEngine::new();
    zero.load_deck_wasm(
        r##"<wml><card id="zero"><onevent type="ontimer"><go href="#bad"/></onevent>
        <timer value="0"/><p>Zero</p></card><card id="bad"><p>Bad</p></card></wml>"##,
    )
    .expect("zero timer deck should load");
    assert_eq!(zero.next_timer_wakeup_ms_wasm(), None);
    assert_eq!(zero.active_card_id_wasm().as_deref(), Ok("zero"));
}

#[wasm_bindgen_test]
fn wasm_variable_substitution_amplification_bounds_match_native_boundary() {
    // M1-46 / #446: an unbounded exponential $(x)$(x) doubling via a
    // repeating ontimer refresh must fail deterministically on wasm32 the
    // same way it does natively, since `catch_unwind` cannot recover an
    // allocation-failure panic on wasm32-unknown-unknown at all (see #434).
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><a href="#loop">Start</a></card>
          <card id="loop">
            <onevent type="ontimer"><refresh><setvar name="x" value="$(x)$(x)"/></refresh></onevent>
            <timer value="1"/>
            <p>Doubling</p>
          </card>
        </wml>
        "##;
    engine.load_deck_wasm(xml).expect("deck should load");
    assert!(engine.set_var_wasm("x".to_string(), "a".to_string()));
    engine
        .handle_key_wasm("enter".to_string())
        .expect("loop card should open and start the timer");
    assert!(engine.next_timer_wakeup_ms_wasm().is_some());

    let mut failed = false;
    let mut last_ok_len = 1usize;
    for _ in 0..30 {
        match engine.advance_time_ms_wasm(100) {
            Ok(()) => {
                last_ok_len = engine
                    .get_var_wasm("x".to_string())
                    .map(|value| value.len())
                    .unwrap_or(last_ok_len);
            }
            Err(_) => {
                failed = true;
                break;
            }
        }
    }
    assert!(
        failed,
        "exponential doubling must fail deterministically before completing 30 refresh cycles"
    );
    assert_eq!(
        engine
            .get_var_wasm("x".to_string())
            .map(|value| value.len()),
        Some(last_ok_len),
        "a failed refresh must not partially commit the doubled value"
    );
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("loop"));
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

fn draw_text_with_y(render_value: &JsValue) -> Vec<(String, u32)> {
    let draw = Reflect::get(render_value, &JsValue::from_str("draw")).expect("draw property");
    Array::from(&draw)
        .iter()
        .filter_map(|command| {
            let text = Reflect::get(&command, &JsValue::from_str("text"))
                .ok()?
                .as_string()?;
            let y = Reflect::get(&command, &JsValue::from_str("y"))
                .ok()?
                .as_f64()? as u32;
            Some((text, y))
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
fn wasm_wml_301_forward_deck_load_preserves_context_and_selects_fragment() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_context_wasm(
            r#"<wml><card id="source"><p>Source</p></card></wml>"#,
            "http://example.test/source.wml",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect("source deck should load through the legacy-compatible boundary");
    assert_eq!(engine.browser_context_epoch_wasm(), 1);
    assert!(engine.set_var_wasm("account".to_string(), "Ada".to_string()));

    engine
        .load_deck_context_for_navigation_wasm(
            r#"<wml><card id="first"><p>First</p></card><card id="target"><p>Target</p></card></wml>"#,
            "http://example.test/target.wml",
            "text/vnd.wap.wml",
            None,
            Some("http://example.test/source.wml".to_string()),
            Some("http://example.test/target.wml#target".to_string()),
            Some("forward".to_string()),
        )
        .expect("forward navigation should load through the navigation boundary");

    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("target card should be active"),
        "target"
    );
    assert_eq!(
        engine.get_var_wasm("account".to_string()).as_deref(),
        Some("Ada")
    );
    assert_eq!(engine.browser_context_epoch_wasm(), 1);
}

#[wasm_bindgen_test]
fn wasm_wml_301_duplicate_same_card_access_advances_history_push_sequence() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(r##"<wml><card id="a"><p><a href="#a">Again</a></p></card></wml>"##)
        .expect("same-card fixture should load through WASM");

    assert_eq!(engine.history_push_sequence_wasm(), 0);
    engine
        .handle_key_wasm("enter".to_string())
        .expect("same-card access should succeed through WASM");
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("a"));
    assert_eq!(engine.history_push_sequence_wasm(), 1);
}

#[wasm_bindgen_test]
fn wasm_wml_301_card_table_boundaries_match_native_render_and_navigation() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(WML_301_CARD_TABLE_BOUNDARIES)
        .expect("source-derived table fixture should load through WASM");

    assert_eq!(
        draw_text_with_y(&engine.render_wasm().expect("middle card should render")),
        vec![
            ("Before".to_string(), 0),
            ("Middle table".to_string(), 2),
            ("After".to_string(), 4),
            ("Leading case".to_string(), 5),
        ]
    );

    engine
        .handle_key_wasm("enter".to_string())
        .expect("middle card should navigate to leading card");
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("leading"));
    assert_eq!(
        draw_text_with_y(&engine.render_wasm().expect("leading card should render")),
        vec![
            ("Leading table".to_string(), 0),
            ("After leading".to_string(), 2),
            ("Trailing case".to_string(), 3),
        ]
    );

    engine
        .handle_key_wasm("enter".to_string())
        .expect("leading card should navigate to trailing card");
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("trailing"));
    assert_eq!(
        draw_text_with_y(&engine.render_wasm().expect("trailing card should render")),
        vec![
            ("Before trailing".to_string(), 0),
            ("Trailing table".to_string(), 2),
        ]
    );

    engine
        .handle_key_wasm("enter".to_string())
        .expect("trailing card action should navigate to adjacent cards");
    assert_eq!(engine.active_card_id_wasm().as_deref(), Ok("adjacent"));
    assert_eq!(
        draw_text_with_y(&engine.render_wasm().expect("adjacent card should render")),
        vec![
            ("First table".to_string(), 0),
            ("Second table".to_string(), 3),
        ]
    );
}

#[wasm_bindgen_test]
fn wasm_wml_301_independent_load_rejects_unknown_fragment_and_preserves_state() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_context_wasm(
            r#"<wml><card id="source"><p>Source</p></card></wml>"#,
            "http://example.test/source.wml",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect("source deck should load through the wasm boundary");
    assert!(engine.set_var_wasm("token".to_string(), "kept".to_string()));
    let epoch = engine.browser_context_epoch_wasm();

    let error = engine
        .load_deck_context_wasm(
            r#"<wml><card id="first"><p>First</p></card></wml>"#,
            "http://example.test/destination.wml#missing",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect_err("an unknown top-level fragment should reject the wasm load");

    assert_eq!(error.as_string().as_deref(), Some("Card id not found"));
    let diagnostics = Array::from(
        &engine
            .last_wml_load_diagnostics_wasm()
            .expect("load diagnostics should serialize"),
    );
    assert_eq!(diagnostics.length(), 1);
    let diagnostic = diagnostics.get(0);
    assert_eq!(
        Reflect::get(&diagnostic, &JsValue::from_str("class"))
            .expect("class field")
            .as_string()
            .as_deref(),
        Some("recoverable")
    );
    assert_eq!(
        Reflect::get(&diagnostic, &JsValue::from_str("code"))
            .expect("code field")
            .as_string()
            .as_deref(),
        Some("WML_RECOVERABLE_CONTENT")
    );
    assert_eq!(
        Reflect::get(&diagnostic, &JsValue::from_str("outcome"))
            .expect("outcome field")
            .as_string()
            .as_deref(),
        Some("rejected")
    );
    assert_eq!(
        Reflect::get(&diagnostic, &JsValue::from_str("message"))
            .expect("message field")
            .as_string()
            .as_deref(),
        Some("Card id not found")
    );
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("rejected load must preserve the active card"),
        "source"
    );
    assert_eq!(engine.base_url_wasm(), "http://example.test/source.wml");
    assert_eq!(
        engine.get_var_wasm("token".to_string()).as_deref(),
        Some("kept")
    );
    assert_eq!(engine.browser_context_epoch_wasm(), epoch);
}

#[wasm_bindgen_test]
fn wasm_wml_301_independent_load_without_nonempty_fragment_selects_first_card() {
    for url in [
        "http://example.test/destination.wml",
        "http://example.test/destination.wml#",
    ] {
        let mut engine = WmlEngine::wasm_new();
        engine
            .load_deck_context_wasm(
                r#"<wml><card id="first"><p>First</p></card><card id="second"><p>Second</p></card></wml>"#,
                url,
                "text/vnd.wap.wml",
                None,
                None,
            )
            .expect("no fragment or an empty fragment should load the first card");

        assert_eq!(
            engine
                .active_card_id_wasm()
                .expect("the first card should be active"),
            "first",
            "{url}"
        );
    }
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
fn wasm_wml_309_frame_and_action_input_match_native_contract() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r##"<wml><card id="home"><do name="open" type="accept" label="Open"><go href="#next"/></do><p>Home</p></card><card id="next"><p>Next</p></card></wml>"##,
        )
        .expect("frame deck should load");

    let native = engine.render_frame().expect("native frame should render");
    let wasm = engine
        .render_frame_wasm()
        .expect("WASM frame should serialize");
    assert_eq!(
        Reflect::get(&wasm, &JsValue::from_str("frameId"))
            .expect("frameId")
            .as_string()
            .as_deref(),
        Some(native.frame_id.as_str())
    );
    let affordances =
        Array::from(&Reflect::get(&wasm, &JsValue::from_str("affordances")).expect("affordances"));
    assert_eq!(affordances.length(), 1);
    assert_eq!(
        Reflect::get(&affordances.get(0), &JsValue::from_str("actionId"))
            .expect("actionId")
            .as_string()
            .as_deref(),
        Some("do:open")
    );

    let input = serde_wasm_bindgen::to_value(&EngineInputEvent::ActivateAction {
        frame_id: native.frame_id,
        action_id: "do:open".to_string(),
    })
    .expect("input should serialize");
    engine
        .handle_input_wasm(input)
        .expect("WASM action input should dispatch");
    assert_eq!(
        engine
            .active_card_id_wasm()
            .expect("active card should be readable"),
        "next"
    );
}

#[wasm_bindgen_test]
fn wasm_f2_01_click_resolution_matches_native_for_the_same_frame_and_coordinate() {
    const DECK: &str = r##"<wml>
      <card id="home"><p><a href="#first">first</a><a href="#second">second</a></p></card>
      <card id="first"><p>First</p></card>
      <card id="second"><p>Second</p></card>
    </wml>"##;

    let mut native = WmlEngine::new();
    native.load_deck(DECK).expect("native deck should load");
    let mut wasm = WmlEngine::wasm_new();
    wasm.load_deck_wasm(DECK).expect("WASM deck should load");

    let native_frame = native.render_frame().expect("native frame should render");
    let wasm_frame = wasm
        .render_frame_wasm()
        .expect("WASM frame should serialize");
    let hit_regions =
        Array::from(&Reflect::get(&wasm_frame, &JsValue::from_str("hitRegions")).expect("regions"));
    assert_eq!(hit_regions.length(), 2);
    assert_eq!(
        Reflect::get(&hit_regions.get(1), &JsValue::from_str("actionId"))
            .expect("actionId")
            .as_string()
            .as_deref(),
        Some("focus:1")
    );

    native
        .handle_input(EngineInputEvent::Click {
            frame_id: native_frame.frame_id.clone(),
            x: 1,
            y: 1,
        })
        .expect("native click should dispatch");
    let input = serde_wasm_bindgen::to_value(&EngineInputEvent::Click {
        frame_id: native_frame.frame_id,
        x: 1,
        y: 1,
    })
    .expect("click input should serialize");
    wasm.handle_input_wasm(input)
        .expect("WASM click should dispatch");

    assert_eq!(
        wasm.active_card_id_wasm()
            .expect("WASM active card should be readable"),
        native
            .active_card_id()
            .expect("native active card should be readable")
    );
    assert_eq!(wasm.focused_link_index_wasm(), native.focused_link_index());
}

#[wasm_bindgen_test]
fn wasm_f2_02_scroll_window_matches_native_for_the_same_event_trace() {
    let paragraphs = (0..25)
        .map(|index| format!("<p>Row {index:02}</p>"))
        .collect::<String>();
    let deck = format!(r#"<wml><card id="home">{paragraphs}</card></wml>"#);

    let mut native = WmlEngine::new();
    native.load_deck(&deck).expect("native deck should load");
    let mut wasm = WmlEngine::wasm_new();
    wasm.load_deck_wasm(&deck).expect("WASM deck should load");

    for delta_rows in [3, i32::MAX, -2] {
        let native_frame = native.render_frame().expect("native frame should render");
        let input = EngineInputEvent::Scroll {
            frame_id: native_frame.frame_id,
            delta_rows,
        };
        native
            .handle_input(input.clone())
            .expect("native scroll should dispatch");
        wasm.handle_input_wasm(
            serde_wasm_bindgen::to_value(&input).expect("scroll input should serialize"),
        )
        .expect("WASM scroll should dispatch");

        let expected = native.render_frame().expect("native result frame");
        let actual = wasm
            .render_frame_wasm()
            .expect("WASM result frame should serialize");
        assert_eq!(
            Reflect::get(&actual, &JsValue::from_str("frameId"))
                .expect("frameId")
                .as_string()
                .as_deref(),
            Some(expected.frame_id.as_str())
        );
        let viewport = Reflect::get(&actual, &JsValue::from_str("viewport"))
            .expect("viewport should be present");
        assert_eq!(
            Reflect::get(&viewport, &JsValue::from_str("offsetRow"))
                .expect("offsetRow")
                .as_f64(),
            Some(f64::from(expected.viewport.offset_row))
        );
    }
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
    engine.register_script_entry_point_wasm("ok.wmlsc".to_string(), "main".to_string(), 0);

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
    engine.register_script_entry_point_wasm("go.wmlsc".to_string(), "main".to_string(), 0);
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
fn wasm_viewport_range_matches_native_and_recovers_after_rejection() {
    let mut engine = WmlEngine::wasm_new();
    let error = engine
        .set_viewport_cols_wasm(f64::from(u32::MAX) + 1.0)
        .expect_err("one-over-limit viewport must be rejected");

    assert_eq!(
        Reflect::get(&error, &JsValue::from_str("type"))
            .expect("typed error discriminator")
            .as_string()
            .as_deref(),
        Some("invalid-viewport")
    );
    assert_eq!(
        Reflect::get(&error, &JsValue::from_str("requestedCols"))
            .expect("requested viewport")
            .as_string()
            .as_deref(),
        Some("4294967296")
    );
    assert_eq!(
        Reflect::get(&error, &JsValue::from_str("maxCols"))
            .expect("maximum viewport")
            .as_f64(),
        Some(f64::from(u32::MAX))
    );
    assert!(engine.active_card_id_wasm().is_err());

    engine
        .set_viewport_cols_wasm(20.0)
        .expect("valid viewport must succeed after rejection");
    engine
        .load_deck_wasm(SAMPLE)
        .expect("valid operation must succeed after rejection");
    let frame = engine
        .render_frame_wasm()
        .expect("frame should render after recovery");
    let viewport = Reflect::get(&frame, &JsValue::from_str("viewport"))
        .expect("frame viewport should be present");
    assert_eq!(
        Reflect::get(&viewport, &JsValue::from_str("cols"))
            .expect("frame viewport columns")
            .as_f64(),
        Some(20.0)
    );
}

fn wasm_limit_fixture(rows: usize) -> WmlEngine {
    let mut engine = WmlEngine::wasm_new();
    engine
        .set_viewport_cols_wasm(1.0)
        .expect("limit viewport should be valid");
    engine
        .load_deck_wasm(&format!(
            "<wml><card id=\"limits\"><p>{}</p></card></wml>",
            "a ".repeat(rows)
        ))
        .expect("limit fixture should load");
    engine
}

fn assert_wasm_resource_limit(
    error: EngineRenderError,
    expected_resource: &str,
    expected_limit: usize,
) {
    let value = to_js_value(&error).expect("typed render error should serialize to JS");
    assert_eq!(
        Reflect::get(&value, &JsValue::from_str("type"))
            .expect("error type")
            .as_string()
            .as_deref(),
        Some("resource-limit")
    );
    assert_eq!(
        Reflect::get(&value, &JsValue::from_str("resource"))
            .expect("resource")
            .as_string()
            .as_deref(),
        Some(expected_resource)
    );
    assert_eq!(
        Reflect::get(&value, &JsValue::from_str("limit"))
            .expect("limit")
            .as_f64(),
        Some(expected_limit as f64)
    );
    assert_eq!(
        Reflect::get(&value, &JsValue::from_str("observed"))
            .expect("observed")
            .as_f64(),
        Some((expected_limit + 1) as f64)
    );
}

#[wasm_bindgen_test]
fn wasm_render_budgets_accept_exactly_at_limit_and_reject_one_over() {
    let exact = wasm_limit_fixture(3);
    let one_over = wasm_limit_fixture(4);

    for (limits, resource) in [
        (
            EngineRenderLimits {
                rows: 4,
                segments: 3,
                draw_commands: 4,
                serialized_bytes: usize::MAX,
            },
            "layout-segments",
        ),
        (
            EngineRenderLimits {
                rows: 4,
                segments: 4,
                draw_commands: 3,
                serialized_bytes: usize::MAX,
            },
            "draw-commands",
        ),
    ] {
        exact
            .render_output_with_limits(limits)
            .expect("exact structural limit should render in WASM");
        assert_wasm_resource_limit(
            one_over
                .render_output_with_limits(limits)
                .expect_err("one over structural limit should fail in WASM"),
            resource,
            3,
        );
    }

    let mut exact_rows = WmlEngine::wasm_new();
    exact_rows
        .load_deck_wasm("<wml><card id=\"limits\"><br/><br/><br/></card></wml>")
        .expect("exact row fixture should load");
    let mut one_over_rows = WmlEngine::wasm_new();
    one_over_rows
        .load_deck_wasm("<wml><card id=\"limits\"><br/><br/><br/><br/></card></wml>")
        .expect("one-over row fixture should load");
    let row_limits = EngineRenderLimits {
        rows: 3,
        segments: 0,
        draw_commands: 0,
        serialized_bytes: usize::MAX,
    };
    exact_rows
        .render_output_with_limits(row_limits)
        .expect("exact row limit should render in WASM");
    assert_wasm_resource_limit(
        one_over_rows
            .render_output_with_limits(row_limits)
            .expect_err("one over row limit should fail in WASM"),
        "layout-rows",
        3,
    );

    let unbounded = exact
        .render_output_with_limits(EngineRenderLimits {
            serialized_bytes: usize::MAX,
            ..EngineRenderLimits::default()
        })
        .expect("WASM fixture should render without a byte cap");
    let serialized_len = serde_json::to_vec(&unbounded)
        .expect("WASM render output should serialize")
        .len();
    exact
        .render_output_with_limits(EngineRenderLimits {
            serialized_bytes: serialized_len,
            ..EngineRenderLimits::default()
        })
        .expect("exact serialized-byte limit should render in WASM");
    assert_wasm_resource_limit(
        exact
            .render_output_with_limits(EngineRenderLimits {
                serialized_bytes: serialized_len - 1,
                ..EngineRenderLimits::default()
            })
            .expect_err("one over serialized-byte limit should fail in WASM"),
        "serialized-bytes",
        serialized_len - 1,
    );
}

#[wasm_bindgen_test]
fn wasm_resource_rejection_is_typed_and_small_deck_renders_afterward() {
    let mut engine = wasm_limit_fixture(ENGINE_MAX_LAYOUT_ROWS + 1);
    let error = engine
        .render_frame_wasm()
        .expect_err("one-over production output must fail at the WASM boundary");
    assert_eq!(
        Reflect::get(&error, &JsValue::from_str("type"))
            .expect("error type")
            .as_string()
            .as_deref(),
        Some("resource-limit")
    );

    engine
        .load_deck_wasm("<wml><card id=\"recovered\"><p>Ready</p></card></wml>")
        .expect("small deck should load after rejection");
    let frame = engine
        .render_frame_wasm()
        .expect("small deck should render after rejection");
    let card = Reflect::get(&frame, &JsValue::from_str("card")).expect("frame card");
    assert_eq!(
        Reflect::get(&card, &JsValue::from_str("id"))
            .expect("card id")
            .as_string()
            .as_deref(),
        Some("recovered")
    );
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
fn wasm_wml_306_task_failure_matches_native_rollback_and_safe_policy() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(
            r##"<wml><card id="stable"><do type="accept"><go href="#missing"><setvar name="Secret" value="private"/></go></do><p>Stable</p></card></wml>"##,
        )
        .expect("failure deck loads");

    engine
        .handle_key_wasm("enter".to_string())
        .expect_err("native and WASM mutation boundaries retain the technical task error");

    assert_eq!(
        engine.active_card_id_wasm().as_deref(),
        Ok("stable"),
        "failed task remains atomic"
    );
    assert_eq!(engine.get_var_wasm("Secret".to_string()), None);
    assert_eq!(
        engine.last_runtime_failure_code_wasm().as_deref(),
        Some("WML_TASK_FAILED")
    );
    assert_eq!(
        engine.last_runtime_failure_message_wasm().as_deref(),
        Some("The requested page action could not be completed.")
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
fn wasm_empty_select_is_inert_and_non_empty_multi_select_still_edits() {
    let mut engine = engine_with_empty_select();

    assert!(!engine
        .begin_focused_select_edit_wasm()
        .expect("empty select must be handled without trapping"));
    assert!(!engine.move_focused_select_edit_wasm(1));
    assert!(!engine
        .commit_focused_select_edit_wasm()
        .expect("empty select commit must be a no-op"));
    assert_eq!(engine.focused_select_edit_name_wasm(), None);
    assert_eq!(engine.focused_select_edit_value_wasm(), None);
    engine
        .render_wasm()
        .expect("empty select should still render");
    engine
        .handle_key_wasm("enter".to_string())
        .expect("empty select activation must not trap");
    assert_eq!(engine.focused_select_edit_name_wasm(), None);

    engine
        .load_deck_wasm(
            r#"
              <wml>
                <card id="home">
                  <select name="Choices" multiple="true">
                    <option value="alpha">Alpha</option>
                    <option value="beta">Beta</option>
                  </select>
                </card>
              </wml>
            "#,
        )
        .expect("non-empty multi-select deck should load");
    assert!(engine
        .begin_focused_select_edit_wasm()
        .expect("non-empty multi-select edit should begin"));
    assert_eq!(
        engine.focused_select_edit_value_wasm().as_deref(),
        Some("alpha")
    );
    assert!(engine
        .commit_focused_select_edit_wasm()
        .expect("first option should toggle on"));
    assert_eq!(
        engine.get_var_wasm("Choices".to_string()).as_deref(),
        Some("alpha")
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

#[wasm_bindgen_test]
fn wasm_wml_304_request_intent_matches_native_serialization() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_context_wasm(
            r##"<wml><card id="home"><do type="accept"><go href="/submit" method="post"
              sendreferer="true" cache-control="no-cache" accept-charset="utf-8">
              <postfield name="first" value="1"/><postfield name="second" value="2"/>
              </go></do></card></wml>"##,
            "https://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect("WML-304 deck should load through WASM");
    engine
        .handle_key_wasm("enter".to_string())
        .expect("go should execute through WASM");

    let policy = engine
        .external_navigation_request_policy_wasm()
        .expect("request policy should serialize through serde-wasm-bindgen");
    let intent =
        Reflect::get(&policy, &JsValue::from_str("requestIntent")).expect("requestIntent field");
    assert_eq!(
        Reflect::get(&intent, &JsValue::from_str("method"))
            .expect("method field")
            .as_string()
            .as_deref(),
        Some("post")
    );
    assert_eq!(
        Reflect::get(&intent, &JsValue::from_str("enctype"))
            .expect("enctype field")
            .as_string()
            .as_deref(),
        Some("application/x-www-form-urlencoded")
    );
    assert_eq!(
        Reflect::get(&intent, &JsValue::from_str("sendReferer"))
            .expect("sendReferer field")
            .as_bool(),
        Some(true)
    );
    let fields = Array::from(
        &Reflect::get(&intent, &JsValue::from_str("postFields")).expect("postFields field"),
    );
    assert_eq!(fields.length(), 2);
    assert_eq!(
        Reflect::get(&fields.get(0), &JsValue::from_str("name"))
            .expect("first postfield name")
            .as_string()
            .as_deref(),
        Some("first")
    );
    assert_eq!(
        Reflect::get(&policy, &JsValue::from_str("cacheControl"))
            .expect("cacheControl field")
            .as_string()
            .as_deref(),
        Some("no-cache")
    );
}

#[wasm_bindgen_test]
fn wasm_debug_events_and_snapshot_match_native_dtos_and_mask_before_serialization() {
    const CANARY: &str = "WASM_D0_02_SECRET_CANARY";
    let mut engine = WmlEngine::wasm_new();
    engine.set_debug_recording_enabled(true);
    engine
        .load_deck_context_wasm(
            r#"<wml><card id="login"><input name="password" type="password"/></card></wml>"#,
            "https://user:WASM_D0_02_SECRET_CANARY@example.test/login.wml",
            "text/vnd.wap.wml",
            None,
            None,
        )
        .expect("debug fixture should load through WASM");
    assert!(engine
        .begin_focused_input_edit_wasm()
        .expect("password edit should start through WASM"));
    assert!(engine.set_focused_input_edit_draft_wasm(CANARY.to_string()));

    let events = engine
        .poll_debug_events("0", 32)
        .expect("native DTO source should poll on WASM");
    let snapshot = engine
        .debug_snapshot()
        .expect("native snapshot DTO should build on WASM");
    assert_eq!(events.events[0].kind, EngineDebugEventKind::DeckLoad);
    assert_eq!(events.events[1].kind, EngineDebugEventKind::CardEnter);
    assert_eq!(events.events[2].kind, EngineDebugEventKind::InputEditStart);
    assert_eq!(events.events[3].kind, EngineDebugEventKind::InputEditDraft);

    let events_js = to_js_value(&events).expect("events should serialize through wasm serde");
    let snapshot_js = to_js_value(&snapshot).expect("snapshot should serialize through wasm serde");
    let events_json = js_sys::JSON::stringify(&events_js)
        .expect("events JSON should stringify")
        .as_string()
        .expect("events JSON should be a string");
    let snapshot_json = js_sys::JSON::stringify(&snapshot_js)
        .expect("snapshot JSON should stringify")
        .as_string()
        .expect("snapshot JSON should be a string");
    assert!(!events_json.contains(CANARY));
    assert!(!snapshot_json.contains(CANARY));
    assert!(events_json.contains("password-input"));
    assert!(snapshot_json.contains("password-input"));
}
