use super::*;
use crate::{
    WmlLoadDiagnosticClassLiteral, WmlLoadDiagnosticCodeLiteral, WmlLoadDiagnosticOutcomeLiteral,
};

fn assert_diagnostic(
    diagnostic: &crate::WmlLoadDiagnostic,
    class: WmlLoadDiagnosticClassLiteral,
    code: WmlLoadDiagnosticCodeLiteral,
    outcome: WmlLoadDiagnosticOutcomeLiteral,
) {
    assert_eq!(diagnostic.class, class);
    assert_eq!(diagnostic.code, code);
    assert_eq!(diagnostic.outcome, outcome);
    assert!(!diagnostic.message.is_empty());
}

fn strict_wml(root: &str) -> String {
    format!(
        r#"<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
{root}"#
    )
}

fn assert_strict_invalid_load_is_atomic(engine: &mut WmlEngine, label: &str, root: &str) {
    let message = engine
        .load_deck_context(
            &strict_wml(root),
            "http://invalid.test/rejected.wml",
            "text/vnd.wap.wml; validation=strict",
            None,
        )
        .expect_err(&format!("{label}: invalid WML must be rejected"));

    let diagnostics = engine.last_wml_load_diagnostics();
    assert_eq!(diagnostics.len(), 1, "{label}");
    assert_diagnostic(
        &diagnostics[0],
        WmlLoadDiagnosticClassLiteral::Invalid,
        WmlLoadDiagnosticCodeLiteral::InvalidWml,
        WmlLoadDiagnosticOutcomeLiteral::Rejected,
    );
    assert_eq!(diagnostics[0].message, message, "{label}");
    assert_eq!(engine.active_card_id().as_deref(), Ok("stable"), "{label}");
    assert_eq!(engine.base_url(), "http://local.test/stable.wml", "{label}");
    assert_eq!(
        engine.get_var("session".to_string()).as_deref(),
        Some("preserved"),
        "{label}"
    );
}

#[test]
fn wml_205_classifies_malformed_and_invalid_loads_without_replacing_runtime_state() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r#"<wml><card id="stable"><p>Stable</p></card></wml>"#,
            "http://local.test/stable.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("baseline deck should load");
    assert!(engine.set_var("session".to_string(), "preserved".to_string()));

    let malformed_message = engine
        .load_deck("<wml><card id=\"broken\"></wml>")
        .expect_err("malformed XML must be rejected");
    let malformed = engine.last_wml_load_diagnostics();
    assert_eq!(malformed.len(), 1);
    assert_diagnostic(
        &malformed[0],
        WmlLoadDiagnosticClassLiteral::Malformed,
        WmlLoadDiagnosticCodeLiteral::MalformedXml,
        WmlLoadDiagnosticOutcomeLiteral::Rejected,
    );
    assert_eq!(malformed[0].message, malformed_message);
    assert_eq!(engine.active_card_id().as_deref(), Ok("stable"));
    assert_eq!(engine.base_url(), "http://local.test/stable.wml");
    assert_eq!(
        engine.get_var("session".to_string()).as_deref(),
        Some("preserved")
    );

    let invalid_message = engine
        .load_deck("<wml><template/></wml>")
        .expect_err("well-formed invalid WML must be rejected");
    let invalid = engine.last_wml_load_diagnostics();
    assert_eq!(invalid.len(), 1);
    assert_diagnostic(
        &invalid[0],
        WmlLoadDiagnosticClassLiteral::Invalid,
        WmlLoadDiagnosticCodeLiteral::InvalidWml,
        WmlLoadDiagnosticOutcomeLiteral::Rejected,
    );
    assert_eq!(invalid[0].message, invalid_message);
    assert_eq!(engine.active_card_id().as_deref(), Ok("stable"));
    assert_eq!(engine.base_url(), "http://local.test/stable.wml");
    assert_eq!(
        engine.get_var("session".to_string()).as_deref(),
        Some("preserved")
    );
}

#[test]
fn wml_205_successful_load_replaces_diagnostics_with_ordered_recoveries() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <!DOCTYPE wml SYSTEM "http://example.test/alternate.dtd">
        <wml>
          <head><meta name="author" content="Waves"/></head>
          <card id="home">
            <timer value="not-a-number"/>
            <future><p>Preserved known content</p></future>
          </card>
        </wml>
    "#;

    engine
        .load_deck(xml)
        .expect("unsupported and recoverable content should not reject the deck");

    let diagnostics = engine.last_wml_load_diagnostics();
    assert_eq!(diagnostics.len(), 2);
    assert_diagnostic(
        &diagnostics[0],
        WmlLoadDiagnosticClassLiteral::Recoverable,
        WmlLoadDiagnosticCodeLiteral::RecoverableContent,
        WmlLoadDiagnosticOutcomeLiteral::Ignored,
    );
    assert!(diagnostics[0].message.contains("<timer>"));
    assert_diagnostic(
        &diagnostics[1],
        WmlLoadDiagnosticClassLiteral::Unsupported,
        WmlLoadDiagnosticCodeLiteral::UnsupportedOptionalConstruct,
        WmlLoadDiagnosticOutcomeLiteral::Ignored,
    );
    assert!(diagnostics[1].message.contains("<future>"));
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("Preserved")));

    engine
        .load_deck(r#"<wml><card id="clean"><p>Clean</p></card></wml>"#)
        .expect("clean deck should load");
    assert!(engine.last_wml_load_diagnostics().is_empty());
}

#[test]
fn wml_205_payload_rejection_is_structured_and_atomic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(r#"<wml><card id="stable"><p>Stable</p></card></wml>"#)
        .expect("baseline deck should load");
    let oversized = format!(
        "<wml><card id=\"large\"><p>{}</p></card></wml>",
        "x".repeat(MAX_DECK_WML_XML_BYTES + 1)
    );

    engine
        .load_deck(&oversized)
        .expect_err("oversized WML should be rejected");

    let diagnostics = engine.last_wml_load_diagnostics();
    assert_eq!(diagnostics.len(), 1);
    assert_diagnostic(
        &diagnostics[0],
        WmlLoadDiagnosticClassLiteral::Invalid,
        WmlLoadDiagnosticCodeLiteral::InvalidWml,
        WmlLoadDiagnosticOutcomeLiteral::Rejected,
    );
    assert_eq!(engine.active_card_id().as_deref(), Ok("stable"));
}

#[test]
fn wml_205_rejects_an_invalid_form_of_every_declared_wml_element_atomically() {
    let cases = [
        ("wml", r#"<wml>text<card id="home"/></wml>"#),
        ("head", r#"<wml><head/><card id="home"/></wml>"#),
        (
            "access",
            r#"<wml><head><access>text</access></head><card id="home"/></wml>"#,
        ),
        (
            "meta",
            r#"<wml><head><meta name="purpose"/></head><card id="home"/></wml>"#,
        ),
        (
            "template",
            r#"<wml><template>text</template><card id="home"/></wml>"#,
        ),
        (
            "card",
            r#"<wml><card id="home"><input name="orphan"/></card></wml>"#,
        ),
        (
            "do",
            r#"<wml><card id="home"><do><noop/></do></card></wml>"#,
        ),
        (
            "onevent",
            r#"<wml><card id="home"><onevent><noop/></onevent></card></wml>"#,
        ),
        (
            "go",
            r#"<wml><card id="home"><do type="accept"><go/></do></card></wml>"#,
        ),
        (
            "prev",
            r#"<wml><card id="home"><do type="accept"><prev><postfield name="x" value="y"/></prev></do></card></wml>"#,
        ),
        (
            "refresh",
            r#"<wml><card id="home"><do type="accept"><refresh><postfield name="x" value="y"/></refresh></do></card></wml>"#,
        ),
        (
            "noop",
            r#"<wml><card id="home"><do type="accept"><noop>text</noop></do></card></wml>"#,
        ),
        (
            "postfield",
            r##"<wml><card id="home"><do type="accept"><go href="#home"><postfield name="x"/></go></do></card></wml>"##,
        ),
        (
            "setvar",
            r#"<wml><card id="home"><do type="accept"><refresh><setvar name="x"/></refresh></do></card></wml>"#,
        ),
        (
            "select",
            r#"<wml><card id="home"><p><select name="x"/></p></card></wml>"#,
        ),
        (
            "optgroup",
            r#"<wml><card id="home"><p><select><optgroup/></select></p></card></wml>"#,
        ),
        (
            "option",
            r#"<wml><card id="home"><p><select><option><b>bad</b></option></select></p></card></wml>"#,
        ),
        (
            "input",
            r#"<wml><card id="home"><p><input/></p></card></wml>"#,
        ),
        (
            "fieldset",
            r#"<wml><card id="home"><p><fieldset><option>orphan</option></fieldset></p></card></wml>"#,
        ),
        ("timer", r#"<wml><card id="home"><timer/></card></wml>"#),
        (
            "img",
            r#"<wml><card id="home"><p><img alt="missing source"/></p></card></wml>"#,
        ),
        (
            "anchor",
            r#"<wml><card id="home"><p><anchor>missing task</anchor></p></card></wml>"#,
        ),
        (
            "a",
            r#"<wml><card id="home"><p><a>missing target</a></p></card></wml>"#,
        ),
        (
            "table",
            r#"<wml><card id="home"><p><table columns="1"/></p></card></wml>"#,
        ),
        (
            "tr",
            r#"<wml><card id="home"><p><table columns="1"><tr/></table></p></card></wml>"#,
        ),
        (
            "td",
            r#"<wml><card id="home"><p><table columns="1"><tr><td><input name="x"/></td></tr></table></p></card></wml>"#,
        ),
        (
            "em",
            r#"<wml><card id="home"><p><em><input name="x"/></em></p></card></wml>"#,
        ),
        (
            "strong",
            r#"<wml><card id="home"><p><strong><input name="x"/></strong></p></card></wml>"#,
        ),
        (
            "b",
            r#"<wml><card id="home"><p><b><input name="x"/></b></p></card></wml>"#,
        ),
        (
            "i",
            r#"<wml><card id="home"><p><i><input name="x"/></i></p></card></wml>"#,
        ),
        (
            "u",
            r#"<wml><card id="home"><p><u><input name="x"/></u></p></card></wml>"#,
        ),
        (
            "big",
            r#"<wml><card id="home"><p><big><input name="x"/></big></p></card></wml>"#,
        ),
        (
            "small",
            r#"<wml><card id="home"><p><small><input name="x"/></small></p></card></wml>"#,
        ),
        (
            "p",
            r#"<wml><card id="home"><p><option>orphan</option></p></card></wml>"#,
        ),
        (
            "br",
            r#"<wml><card id="home"><p><br>text</br></p></card></wml>"#,
        ),
        (
            "pre",
            r#"<wml><card id="home"><pre><img alt="x" src="x"/></pre></card></wml>"#,
        ),
    ];

    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            &strict_wml(r#"<wml><card id="stable"><p>Stable</p></card></wml>"#),
            "http://local.test/stable.wml",
            "text/vnd.wap.wml; validation=strict",
            None,
        )
        .expect("strict baseline deck should load");
    assert!(engine.set_var("session".to_string(), "preserved".to_string()));

    for (element, root) in cases {
        assert_strict_invalid_load_is_atomic(&mut engine, element, root);
    }
}

#[test]
fn wml_205_enforces_case_literal_length_and_cross_attribute_error_conditions() {
    let cases = [
        ("case-sensitive root", r#"<WML><card id="home"/></WML>"#),
        ("case-sensitive element", r#"<wml><CARD id="home"/></wml>"#),
        (
            "case-sensitive attribute",
            r#"<wml><card ID="home"/></wml>"#,
        ),
        (
            "literal access domain",
            r#"<wml><head><access domain="$origin"/></head><card id="home"/></wml>"#,
        ),
        (
            "literal meta property",
            r#"<wml><head><meta name="$property" content="value"/></head><card id="home"/></wml>"#,
        ),
        (
            "literal do type",
            r#"<wml><card id="home"><do type="$kind"><noop/></do></card></wml>"#,
        ),
        (
            "literal input format",
            r#"<wml><card id="home"><p><input name="value" format="$mask"/></p></card></wml>"#,
        ),
        (
            "literal accept charset",
            r##"<wml><card id="home"><do type="accept"><go href="#home" accept-charset="$charset"/></do></card></wml>"##,
        ),
        (
            "image length",
            r#"<wml><card id="home"><p><img alt="x" src="x" width="10px"/></p></card></wml>"#,
        ),
        (
            "zero table columns",
            r#"<wml><card id="home"><p><table columns="0"><tr><td>x</td></tr></table></p></card></wml>"#,
        ),
        (
            "get multipart form",
            r##"<wml><card id="home"><do type="accept"><go href="#home" method="get" enctype="multipart/form-data"/></do></card></wml>"##,
        ),
    ];

    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            &strict_wml(r#"<wml><card id="stable"><p>Stable</p></card></wml>"#),
            "http://local.test/stable.wml",
            "text/vnd.wap.wml; validation=strict",
            None,
        )
        .expect("strict baseline deck should load");
    assert!(engine.set_var("session".to_string(), "preserved".to_string()));

    for (condition, root) in cases {
        assert_strict_invalid_load_is_atomic(&mut engine, condition, root);
    }
}

#[test]
fn wml_204_invalid_control_variable_references_reject_load_atomically() {
    let invalid_controls = [
        ("input value", r#"<input name="pin" value="$(bad-name)"/>"#),
        (
            "select ivalue",
            r#"<select name="choice" ivalue="$(index:bogus)"><option>A</option></select>"#,
        ),
        (
            "option value",
            r#"<select name="choice"><option value="$9bad">A</option></select>"#,
        ),
        (
            "option onpick",
            r#"<select><option onpick="$(target:bogus)">A</option></select>"#,
        ),
        (
            "non-vdata input format",
            r#"<input name="pin" format="$mask"/>"#,
        ),
    ];

    for (case, control) in invalid_controls {
        let mut engine = WmlEngine::new();
        engine
            .load_deck_context(
                r#"<wml><card id="stable"><p>Stable</p></card></wml>"#,
                "http://local.test/stable.wml",
                "text/vnd.wap.wml",
                None,
            )
            .expect("baseline deck should load");
        assert!(engine.set_var("session".to_string(), "preserved".to_string()));

        let invalid = format!(r#"<wml><card id="invalid">{control}</card></wml>"#);
        let message = engine
            .load_deck(&invalid)
            .expect_err("invalid control variable syntax must reject the deck");

        assert!(!message.is_empty(), "case {case}");
        let diagnostics = engine.last_wml_load_diagnostics();
        assert_eq!(diagnostics.len(), 1, "case {case}");
        assert_diagnostic(
            &diagnostics[0],
            WmlLoadDiagnosticClassLiteral::Invalid,
            WmlLoadDiagnosticCodeLiteral::InvalidWml,
            WmlLoadDiagnosticOutcomeLiteral::Rejected,
        );
        assert_eq!(
            engine.active_card_id().as_deref(),
            Ok("stable"),
            "case {case}"
        );
        assert_eq!(
            engine.base_url(),
            "http://local.test/stable.wml",
            "case {case}"
        );
        assert_eq!(
            engine.get_var("session".to_string()).as_deref(),
            Some("preserved"),
            "case {case}"
        );
    }
}
