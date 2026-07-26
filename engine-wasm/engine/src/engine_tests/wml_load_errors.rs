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
