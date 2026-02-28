use wasm_bindgen::prelude::*;

mod layout;
mod nav;
mod parser;
mod render;
mod runtime;

use layout::flow_layout::layout_card;
use nav::focus::{clamp_focus, move_focus_down, move_focus_up};
use parser::wml_parser::parse_wml;
use render::render_list::RenderList;
use runtime::deck::Deck;

const DEFAULT_VIEWPORT_COLS: usize = 20;

#[wasm_bindgen]
pub struct WmlEngine {
    deck: Option<Deck>,
    active_card_idx: usize,
    nav_stack: Vec<usize>,
    focused_link_idx: usize,
    viewport_cols: usize,
    base_url: String,
    content_type: String,
    raw_bytes_base64: Option<String>,
}

#[wasm_bindgen]
impl WmlEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WmlEngine {
        WmlEngine {
            deck: None,
            active_card_idx: 0,
            nav_stack: Vec::new(),
            focused_link_idx: 0,
            viewport_cols: DEFAULT_VIEWPORT_COLS,
            base_url: String::new(),
            content_type: String::new(),
            raw_bytes_base64: None,
        }
    }

    #[wasm_bindgen(js_name = loadDeck)]
    pub fn load_deck(&mut self, xml: &str) -> Result<(), JsValue> {
        self.load_deck_context(xml, "", "text/vnd.wap.wml", None)
    }

    #[wasm_bindgen(js_name = loadDeckContext)]
    pub fn load_deck_context(
        &mut self,
        wml_xml: &str,
        base_url: &str,
        content_type: &str,
        raw_bytes_base64: Option<String>,
    ) -> Result<(), JsValue> {
        let deck = parse_wml(wml_xml).map_err(as_js_err)?;
        self.deck = Some(deck);
        self.active_card_idx = 0;
        self.nav_stack.clear();
        self.focused_link_idx = 0;
        self.base_url = base_url.to_string();
        self.content_type = content_type.to_string();
        self.raw_bytes_base64 = raw_bytes_base64;
        Ok(())
    }

    #[wasm_bindgen]
    pub fn render(&self) -> Result<JsValue, JsValue> {
        let card = self.active_card()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx);
        to_js_value(&layout.render_list)
    }

    #[wasm_bindgen(js_name = handleKey)]
    pub fn handle_key(&mut self, key: String) -> Result<(), JsValue> {
        let card = self.active_card()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx);
        let link_total = layout.links.len();

        match key.as_str() {
            "up" => {
                self.focused_link_idx = move_focus_up(self.focused_link_idx, link_total);
            }
            "down" => {
                self.focused_link_idx = move_focus_down(self.focused_link_idx, link_total);
            }
            "enter" => {
                if link_total == 0 {
                    return Ok(());
                }
                let idx = clamp_focus(self.focused_link_idx, link_total);
                let href = &layout.links[idx];
                if let Some(card_id) = href.strip_prefix('#') {
                    self.navigate_to_card(card_id.to_string())?;
                }
            }
            _ => {}
        }

        Ok(())
    }

    #[wasm_bindgen(js_name = navigateToCard)]
    pub fn navigate_to_card(&mut self, id: String) -> Result<(), JsValue> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| JsValue::from_str("No deck loaded"))?;

        let next_idx = deck
            .card_index(&id)
            .ok_or_else(|| JsValue::from_str("Card id not found"))?;

        self.nav_stack.push(self.active_card_idx);
        self.active_card_idx = next_idx;
        self.focused_link_idx = 0;
        Ok(())
    }

    #[wasm_bindgen(js_name = setViewportCols)]
    pub fn set_viewport_cols(&mut self, cols: usize) {
        self.viewport_cols = cols.max(1);
    }

    #[wasm_bindgen(js_name = activeCardId)]
    pub fn active_card_id(&self) -> Result<String, JsValue> {
        let card = self.active_card()?;
        Ok(card.id.clone())
    }

    #[wasm_bindgen(js_name = focusedLinkIndex)]
    pub fn focused_link_index(&self) -> usize {
        self.focused_link_idx
    }

    #[wasm_bindgen(js_name = baseUrl)]
    pub fn base_url(&self) -> String {
        self.base_url.clone()
    }

    #[wasm_bindgen(js_name = contentType)]
    pub fn content_type(&self) -> String {
        self.content_type.clone()
    }
}

impl WmlEngine {
    fn active_card(&self) -> Result<&runtime::card::Card, JsValue> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| JsValue::from_str("No deck loaded"))?;

        deck.cards
            .get(self.active_card_idx)
            .ok_or_else(|| JsValue::from_str("Active card index out of range"))
    }
}

fn to_js_value(render_list: &RenderList) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(render_list).map_err(|err| JsValue::from_str(&err.to_string()))
}

fn as_js_err(message: String) -> JsValue {
    JsValue::from_str(&message)
}

#[cfg(test)]
mod tests {
    use super::WmlEngine;

    const SAMPLE: &str = r##"
    <wml>
      <card id="home">
        <p>Hello</p>
        <a href="#next">Next</a>
      </card>
      <card id="next">
        <p>World</p>
      </card>
    </wml>
    "##;

    #[test]
    fn enter_navigates_to_fragment_card() {
        let mut engine = WmlEngine::new();
        engine.load_deck(SAMPLE).expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("enter should succeed");

        assert_eq!(
            engine.active_card_id().expect("active card should exist"),
            "next"
        );
    }

    #[cfg(target_arch = "wasm32")]
    #[test]
    fn load_deck_returns_structured_error_for_invalid_root() {
        let mut engine = WmlEngine::new();
        let err = engine
            .load_deck("<card id=\"home\"><p>Hello</p></card>")
            .expect_err("missing wml root must fail");

        let msg = err
            .as_string()
            .expect("parser errors should cross wasm boundary as strings");
        assert!(msg.contains("<wml>"), "unexpected error message: {msg}");
    }

    #[test]
    fn load_deck_accepts_unknown_tags() {
        let mut engine = WmlEngine::new();
        let xml = r#"
        <wml>
          <experimental>
            <ignored/>
          </experimental>
          <card id="home">
            <p>Hello</p>
          </card>
        </wml>
        "#;

        engine
            .load_deck(xml)
            .expect("unknown tags should be ignored, not rejected");
        assert_eq!(engine.active_card_id().expect("active card"), "home");
    }
}
