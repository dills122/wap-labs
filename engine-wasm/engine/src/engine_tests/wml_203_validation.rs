use super::*;

const WML_203_DTD_FAMILY: &str = include_str!("../../../examples/source/wml-203-dtd-family.wml");
const STRICT_WML_CONTENT_TYPE: &str = "text/vnd.wap.wml; validation=strict";

fn canonical_wml(body: &str) -> String {
    format!(
        "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\" \"http://www.wapforum.org/DTD/wml13.dtd\">\n{body}"
    )
}

fn load_strict(source: &str) -> Result<WmlEngine, String> {
    let mut engine = WmlEngine::new();
    engine.load_deck_context(
        source,
        "http://example.test/apps/wml-203.wml",
        STRICT_WML_CONTENT_TYPE,
        None,
    )?;
    Ok(engine)
}

fn strict_error(source: &str, context: &str) -> String {
    match load_strict(source) {
        Ok(_) => panic!("{context}"),
        Err(error) => error,
    }
}

#[test]
fn wml_203_text_requires_xml_and_doctype_prologue_components() {
    let no_prologue = "<wml><card id=\"main\"><p>Missing</p></card></wml>";
    assert_eq!(
        strict_error(no_prologue, "XML declaration must be mandatory"),
        "Invalid WML prologue: missing required XML declaration"
    );

    let xml_only = "<?xml version=\"1.0\"?><wml><card id=\"main\"><p>Missing</p></card></wml>";
    assert_eq!(
        strict_error(xml_only, "DOCTYPE must be mandatory"),
        "Invalid WML prologue: missing required DOCTYPE declaration"
    );
}

#[test]
fn wml_203_full_selected_dtd_family_loads_and_renders() {
    let engine = load_strict(WML_203_DTD_FAMILY)
        .expect("the source-derived selected WML 1.3 family should load");

    assert_eq!(engine.active_card_id().as_deref(), Ok("main"));
    let text = render_snapshot_lines(&engine).join("\n");
    for expected in ["Family", "Cell", "One", "Pre"] {
        assert!(
            text.contains(expected),
            "render omitted {expected:?}: {text}"
        );
    }
}

#[test]
fn wml_203_text_and_normalized_wbxml_share_selected_dtd_validation() {
    let text_engine = load_strict(WML_203_DTD_FAMILY).expect("strict text should load");
    let tokenized_xml = WML_203_DTD_FAMILY
        .split_once("<wml")
        .map(|(_, body)| format!("<wml{body}"))
        .expect("fixture should contain a WML root");
    let mut wbxml_engine = WmlEngine::new();
    wbxml_engine
        .load_deck_context(
            &tokenized_xml,
            "http://example.test/apps/wml-203.wml",
            "application/vnd.wap.wmlc",
            None,
        )
        .expect("normalized WBXML should use its transport header as the prologue");

    assert_eq!(wbxml_engine.active_card_id(), text_engine.active_card_id());
    assert_eq!(
        render_snapshot_lines(&wbxml_engine),
        render_snapshot_lines(&text_engine)
    );
}

#[test]
fn wml_203_invalid_content_model_mutations_are_rejected_deterministically() {
    let cases = [
        ("unknown element", "<wml><card id=\"main\"><p><blink>bad</blink></p></card></wml>"),
        ("card flow order", "<wml><card id=\"main\"><a href=\"#main\">bad</a></card></wml>"),
        ("empty table", "<wml><card id=\"main\"><p><table columns=\"1\"/></p></card></wml>"),
        ("empty row", "<wml><card id=\"main\"><p><table columns=\"1\"><tr/></table></p></card></wml>"),
        ("multiple do tasks", "<wml><card id=\"main\"><do type=\"accept\"><noop/><prev/></do><p>bad</p></card></wml>"),
        ("empty select", "<wml><card id=\"main\"><p><select name=\"s\"/></p></card></wml>"),
        ("anchor without task", "<wml><card id=\"main\"><p><anchor>bad</anchor></p></card></wml>"),
        ("anchor with multiple tasks", "<wml><card id=\"main\"><p><anchor>bad<prev/><refresh/></anchor></p></card></wml>"),
        ("missing image source", "<wml><card id=\"main\"><p><img alt=\"bad\"/></p></card></wml>"),
        ("nested table", "<wml><card id=\"main\"><p><table columns=\"1\"><tr><td><em><table columns=\"1\"><tr><td>bad</td></tr></table></em></td></tr></table></p></card></wml>"),
        ("unexpected attribute", "<wml bogus=\"x\"><card id=\"main\"><p>bad</p></card></wml>"),
        ("duplicate ID", "<wml><card id=\"same\"><p id=\"same\">bad</p></card></wml>"),
        ("pre space mode", "<wml><card id=\"main\"><pre xml:space=\"default\">bad</pre></card></wml>"),
        ("nonempty noop", "<wml><card id=\"main\"><do type=\"accept\"><noop>bad</noop></do><p>bad</p></card></wml>"),
    ];

    for (label, body) in cases {
        let source = canonical_wml(body);
        let first = strict_error(&source, label);
        let second = strict_error(&source, label);
        assert_eq!(first, second, "{label} rejection changed across loads");
    }
}
