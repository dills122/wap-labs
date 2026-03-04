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
}

#[wasm_bindgen_test]
fn wasm_m1_02_handle_key_render_and_navigate_back_boundary_flow() {
    let mut engine = WmlEngine::wasm_new();
    engine
        .load_deck_wasm(FIXTURE_BASIC_TWO_CARD)
        .expect("loadDeck wasm wrapper should succeed");

    let render_value = engine.render_wasm().expect("render should succeed");
    let draw = Reflect::get(&render_value, &JsValue::from_str("draw")).expect("draw property");
    let draw_arr = Array::from(&draw);
    assert_eq!(draw_arr.length(), 2);

    engine
        .handle_key_wasm("enter".to_string())
        .expect("enter key should navigate");
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

    let err = engine
        .invoke_script_ref_wasm("missing.wmlsc".to_string())
        .expect_err("missing script should return JsValue error");
    let err_msg = err.as_string().expect("error should be a string message");
    assert!(err_msg.contains("script unit not registered"));
}
