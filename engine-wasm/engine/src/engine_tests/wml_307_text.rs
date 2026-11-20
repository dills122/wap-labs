use super::*;

const TEXT_EXAMPLE: &str = include_str!("../../../examples/source/wml-307-text-entities.wml");
pub(crate) const TEXT_URL: &str = "http://example.test/apps/wml-307.wml";
pub(crate) const TEXT_CONTENT_TYPE: &str = "text/vnd.wap.wml; validation=strict";
pub(crate) const ENTITY_VALUE: &str = "\"&'<>A\u{a0}B\u{ad}CĮĮ&quot;";
pub(crate) const RENDERED_TEXT: &str = "Café ĮĮ &quot;";

pub(crate) fn invalid_character_decks() -> impl Iterator<Item = (&'static str, String)> {
    const PROLOGUE: &str = concat!(
        "<?xml version=\"1.0\"?>",
        "<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\" ",
        "\"http://www.wapforum.org/DTD/wml13.dtd\">"
    );
    [
        ("literal control in content", "", "<p>a\u{1f}b</p>"),
        ("literal NUL in content", "", "<p>a\0b</p>"),
        (
            "literal noncharacter in CDATA",
            "",
            "<p><![CDATA[a\u{fffe}b]]></p>",
        ),
        (
            "literal control in comment",
            "",
            "<!-- a\u{b}b --><p>ok</p>",
        ),
        (
            "literal control in attribute",
            " title=\"a\u{1}b\"",
            "<p>ok</p>",
        ),
        ("decimal control reference", "", "<p>a&#31;b</p>"),
        ("hex NUL reference", "", "<p>a&#x0;b</p>"),
        ("surrogate reference", "", "<p>a&#xD800;b</p>"),
        ("out-of-range reference", "", "<p>a&#x110000;b</p>"),
        ("noncharacter reference", "", "<p>a&#xFFFF;b</p>"),
        ("signed numeric reference", "", "<p>a&#x+41;b</p>"),
        (
            "attribute control reference",
            " title=\"a&#31;b\"",
            "<p>ok</p>",
        ),
        (
            "attribute noncharacter reference",
            " title=\"a&#xFFFE;b\"",
            "<p>ok</p>",
        ),
    ]
    .into_iter()
    .map(|(name, attributes, content)| {
        (
            name,
            format!("{PROLOGUE}<wml><card id=\"main\"{attributes}>{content}</card></wml>"),
        )
    })
}

#[test]
fn wml_307_rejects_invalid_xml_characters() {
    for (case, deck) in invalid_character_decks() {
        let mut engine = WmlEngine::new();
        let error = engine
            .load_deck_context(&deck, TEXT_URL, TEXT_CONTENT_TYPE, None)
            .expect_err(case);
        assert!(error.contains("Malformed XML"), "{case}: {error}");
        let diagnostics = engine.last_wml_load_diagnostics();
        assert_eq!(diagnostics.len(), 1, "{case}");
        assert_eq!(
            diagnostics[0].code,
            crate::WmlLoadDiagnosticCodeLiteral::MalformedXml,
            "{case}"
        );
    }
}

pub(crate) fn text_decks() -> [(&'static str, String); 4] {
    let (_, deck) = TEXT_EXAMPLE.split_once("-->").expect("example metadata");
    let deck = deck.trim_start_matches('\n');
    let ascii = deck
        .replace("encoding=\"UTF-8\"", "encoding=\"US-ASCII\"")
        .replace("Café", "Caf&#233;");
    assert!(
        ascii.is_ascii(),
        "the ASCII fixture must contain only ASCII bytes"
    );
    [
        ("declared UTF-8", deck.to_owned()),
        ("UTF-8 BOM", format!("\u{feff}{deck}")),
        ("implicit UTF-8", deck.replace(" encoding=\"UTF-8\"", "")),
        ("ASCII source with Unicode references", ascii),
    ]
}

#[test]
fn wml_307_text_encoding_and_entities() {
    for (case, deck) in text_decks() {
        let mut engine = WmlEngine::new();
        engine
            .load_deck_context(&deck, TEXT_URL, TEXT_CONTENT_TYPE, None)
            .unwrap_or_else(|error| panic!("{case}: {error}"));
        assert_eq!(engine.active_card_id().as_deref(), Ok("main"), "{case}");
        let render = engine.render().expect("text deck should render");
        assert!(
            render
                .draw
                .iter()
                .any(|cmd| matches!(cmd, DrawCmd::Text { text, .. } if text == RENDERED_TEXT)),
            "{case}: unexpected render {render:?}"
        );
        engine.handle_key("enter".into()).expect("follow Next");
        assert_eq!(engine.active_card_id().as_deref(), Ok("next"), "{case}");
        assert_eq!(
            engine.get_var("entityProbe".into()).as_deref(),
            Some(ENTITY_VALUE),
            "{case}"
        );
    }
}
