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
    external_nav_intent: Option<String>,
    viewport_cols: usize,
    base_url: String,
    content_type: String,
    raw_bytes_base64: Option<String>,
}

impl Default for WmlEngine {
    fn default() -> Self {
        Self::new()
    }
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
            external_nav_intent: None,
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
        self.external_nav_intent = None;
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
        self.handle_key_internal(&key).map_err(as_js_err)
    }

    #[wasm_bindgen(js_name = navigateToCard)]
    pub fn navigate_to_card(&mut self, id: String) -> Result<(), JsValue> {
        self.navigate_to_card_internal(&id).map_err(as_js_err)
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

    #[wasm_bindgen(js_name = externalNavigationIntent)]
    pub fn external_navigation_intent(&self) -> Option<String> {
        self.external_nav_intent.clone()
    }

    #[wasm_bindgen(js_name = clearExternalNavigationIntent)]
    pub fn clear_external_navigation_intent(&mut self) {
        self.external_nav_intent = None;
    }
}

impl WmlEngine {
    fn handle_key_internal(&mut self, key: &str) -> Result<(), String> {
        let card = self.active_card_internal()?;
        let layout = layout_card(card, self.viewport_cols, self.focused_link_idx);
        let link_total = layout.links.len();

        match key {
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
                    self.navigate_to_card_internal(card_id)?;
                } else {
                    self.external_nav_intent = Some(self.resolve_external_href(href));
                }
            }
            _ => {}
        }

        Ok(())
    }

    fn navigate_to_card_internal(&mut self, id: &str) -> Result<(), String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;

        let next_idx = deck
            .card_index(id)
            .ok_or_else(|| "Card id not found".to_string())?;

        self.nav_stack.push(self.active_card_idx);
        self.active_card_idx = next_idx;
        self.focused_link_idx = 0;
        Ok(())
    }

    fn active_card_internal(&self) -> Result<&runtime::card::Card, String> {
        let deck = self
            .deck
            .as_ref()
            .ok_or_else(|| "No deck loaded".to_string())?;

        deck.cards
            .get(self.active_card_idx)
            .ok_or_else(|| "Active card index out of range".to_string())
    }

    fn active_card(&self) -> Result<&runtime::card::Card, JsValue> {
        self.active_card_internal().map_err(as_js_err)
    }

    fn resolve_external_href(&self, href: &str) -> String {
        if self.base_url.is_empty() || has_uri_scheme(href) || href.starts_with("//") {
            return href.to_string();
        }

        if let Some(path_from_root) = href.strip_prefix('/') {
            let Some(origin) = extract_origin(&self.base_url) else {
                return href.to_string();
            };
            return format!("{origin}/{path_from_root}");
        }

        let Some(base_dir) = extract_base_dir(&self.base_url) else {
            return href.to_string();
        };

        format!("{base_dir}{href}")
    }
}

fn has_uri_scheme(value: &str) -> bool {
    let Some((scheme, _)) = value.split_once(':') else {
        return false;
    };

    !scheme.is_empty()
        && scheme
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '+' || ch == '-' || ch == '.')
}

fn extract_origin(base_url: &str) -> Option<String> {
    let (scheme, remainder) = base_url.split_once("://")?;
    let authority = remainder.split('/').next().unwrap_or(remainder);
    if authority.is_empty() {
        return None;
    }
    Some(format!("{scheme}://{authority}"))
}

fn extract_base_dir(base_url: &str) -> Option<String> {
    let no_query_or_fragment = base_url
        .split('#')
        .next()
        .unwrap_or(base_url)
        .split('?')
        .next()
        .unwrap_or(base_url);

    if no_query_or_fragment.ends_with('/') {
        return Some(no_query_or_fragment.to_string());
    }

    let (prefix, _) = no_query_or_fragment.rsplit_once('/')?;
    Some(format!("{prefix}/"))
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
    const FIELD_EXAMPLE_01: &str =
        include_str!("../tests/fixtures/field/openwave-2011-example-01-navigation.wml");

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

    #[test]
    fn down_enter_fragment_navigation_resets_focus() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
            <a href="#third">Third</a>
          </card>
          <card id="next">
            <p>Second</p>
          </card>
          <card id="third">
            <p>Third</p>
          </card>
        </wml>
        "##;

        engine.load_deck(xml).expect("deck should load");
        engine
            .handle_key("down".to_string())
            .expect("down should succeed");
        assert_eq!(engine.focused_link_index(), 1);
        engine
            .handle_key("enter".to_string())
            .expect("enter should navigate");

        assert_eq!(engine.active_card_id().expect("active card"), "third");
        assert_eq!(engine.focused_link_index(), 0);
    }

    #[test]
    fn missing_fragment_returns_error_and_preserves_state() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="#missing">Broken</a>
          </card>
          <card id="next">
            <p>Second</p>
          </card>
        </wml>
        "##;

        engine.load_deck(xml).expect("deck should load");
        let err = engine
            .handle_key_internal("enter")
            .expect_err("missing fragment should return error");
        assert!(
            err.contains("Card id not found"),
            "unexpected error message: {err}"
        );
        assert_eq!(engine.active_card_idx, 0);
        assert_eq!(engine.focused_link_idx, 0);
        assert!(engine.nav_stack.is_empty());
    }

    #[test]
    fn field_example_01_loads_and_fragment_navigation_works() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(FIELD_EXAMPLE_01)
            .expect("field fixture should load");
        assert_eq!(engine.active_card_id().expect("active card"), "main");

        engine
            .handle_key("enter".to_string())
            .expect("enter should move to #content");
        assert_eq!(engine.active_card_id().expect("active card"), "content");
        assert_eq!(engine.external_navigation_intent(), None);
    }

    #[test]
    fn enter_on_external_link_sets_intent_without_mutating_card() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="next.wml?foo=1">Load</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;

        engine
            .load_deck_context(
                xml,
                "http://local.test/dir/start.wml",
                "text/vnd.wap.wml",
                None,
            )
            .expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("external enter should succeed");

        assert_eq!(engine.active_card_id().expect("active card"), "home");
        assert_eq!(
            engine.external_navigation_intent(),
            Some("http://local.test/dir/next.wml?foo=1".to_string())
        );
        assert!(engine.nav_stack.is_empty());
    }

    #[test]
    fn clear_external_navigation_intent_removes_intent() {
        let mut engine = WmlEngine::new();
        let xml = r##"
        <wml>
          <card id="home">
            <a href="https://example.org/path">Load</a>
          </card>
        </wml>
        "##;

        engine.load_deck(xml).expect("deck should load");
        engine
            .handle_key("enter".to_string())
            .expect("external enter should succeed");
        assert_eq!(
            engine.external_navigation_intent(),
            Some("https://example.org/path".to_string())
        );

        engine.clear_external_navigation_intent();
        assert_eq!(engine.external_navigation_intent(), None);
    }
}
