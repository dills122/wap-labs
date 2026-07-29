use super::*;
use crate::{
    DeckNavigationContext, DeckNavigationKind, WmlLoadDiagnosticClassLiteral,
    WmlLoadDiagnosticCodeLiteral, WmlLoadDiagnosticOutcomeLiteral,
};

const CONTENT_TYPE: &str = "text/vnd.wap.wml";
const CARD_TABLE_BOUNDARIES: &str =
    include_str!("../../../examples/source/wml-301-card-table-boundaries.wml");

fn load_for_navigation(
    engine: &mut WmlEngine,
    xml: &str,
    base_url: &str,
    navigation_url: &str,
    kind: DeckNavigationKind,
) {
    engine
        .load_deck_context_for_navigation(
            xml,
            base_url,
            CONTENT_TYPE,
            None,
            DeckNavigationContext::new(None, Some(navigation_url), kind),
        )
        .expect("navigation-shaped deck load should succeed");
}

#[test]
fn wml_301_card_table_boundaries_render_at_card_edges_and_survive_navigation() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(CARD_TABLE_BOUNDARIES)
        .expect("source-derived card/table fixture should load");

    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Before",
            "text:0:2:Middle table",
            "text:0:4:After",
            "link:0:5:focused=true:href=#leading:text=Leading case",
        ]
    );

    engine
        .handle_key("enter".to_string())
        .expect("middle-card link should open the leading-table card");
    assert_eq!(engine.active_card_id().as_deref(), Ok("leading"));
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Leading table",
            "text:0:2:After leading",
            "link:0:3:focused=true:href=#trailing:text=Trailing case",
        ]
    );

    engine
        .handle_key("enter".to_string())
        .expect("leading-card link should open the trailing-table card");
    assert_eq!(engine.active_card_id().as_deref(), Ok("trailing"));
    assert_eq!(
        render_snapshot_lines(&engine),
        vec!["text:0:0:Before trailing", "text:0:2:Trailing table",]
    );

    engine
        .handle_key("enter".to_string())
        .expect("card action should open the adjacent-table card");
    assert_eq!(engine.active_card_id().as_deref(), Ok("adjacent"));
    assert_eq!(
        render_snapshot_lines(&engine),
        vec!["text:0:0:First table", "text:0:3:Second table"]
    );

    assert!(engine.navigate_back());
    assert_eq!(engine.active_card_id().as_deref(), Ok("trailing"));
    assert_eq!(
        render_snapshot_lines(&engine),
        vec!["text:0:0:Before trailing", "text:0:2:Trailing table",]
    );
}

#[test]
fn wml_301_invalid_card_table_structures_are_rejected_without_state_drift() {
    let canonical = |body: &str| {
        format!(
            "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\" \"http://www.wapforum.org/DTD/wml13.dtd\">\n{body}"
        )
    };
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            &canonical(r#"<wml><card id="stable"><p>Stable</p></card></wml>"#),
            "http://example.test/stable.wml",
            "text/vnd.wap.wml; validation=strict",
            None,
        )
        .expect("stable baseline should load");

    let cases = [
        (
            "direct card table",
            r#"<wml><card id="bad"><table columns="1"><tr><td>Bad</td></tr></table></card></wml>"#,
            "expected onevent*, timer?, then zero or more do, p, or pre elements",
        ),
        (
            "table in pre",
            r#"<wml><card id="bad"><pre><table columns="1"><tr><td>Bad</td></tr></table></pre></card></wml>"#,
            "unexpected child <table> for WML 1.3 DTD",
        ),
        (
            "nested table",
            r#"<wml><card id="bad"><p><table columns="1"><tr><td><em><table columns="1"><tr><td>Bad</td></tr></table></em></td></tr></table></p></card></wml>"#,
            "nested tables are prohibited",
        ),
    ];

    for (label, source, expected) in cases {
        let error = engine
            .load_deck_context(
                &canonical(source),
                "http://example.test/invalid.wml",
                "text/vnd.wap.wml; validation=strict",
                None,
            )
            .expect_err("invalid card/table structure should fail");
        assert!(
            error.contains(expected),
            "{label}: expected {expected:?}, got {error:?}"
        );
        assert_eq!(engine.active_card_id().as_deref(), Ok("stable"), "{label}");
        assert_eq!(
            render_snapshot_lines(&engine),
            vec!["text:0:0:Stable"],
            "{label}"
        );
    }
}

#[test]
fn wml_301_forward_load_preserves_context_selects_fragment_and_stops_after_entry_event() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r#"<wml><card id="source"><p>Source</p></card></wml>"#,
            "http://example.test/source.wml",
            CONTENT_TYPE,
            None,
        )
        .expect("source deck should load");
    assert!(engine.set_var("token".to_string(), "kept".to_string()));
    let epoch = engine.browser_context_epoch();

    load_for_navigation(
        &mut engine,
        r#"
        <wml>
          <card id="first"><p>Fallback</p></card>
          <card id="target">
            <onevent type="onenterforward"><go href="after.wml"/></onevent>
            <timer value="10"/>
            <p>Target $(token)</p>
          </card>
        </wml>
        "#,
        "http://example.test/destination.wml",
        "http://example.test/destination.wml#target",
        DeckNavigationKind::Forward,
    );

    assert_eq!(engine.active_card_id().as_deref(), Ok("target"));
    assert_eq!(engine.get_var("token".to_string()).as_deref(), Some("kept"));
    assert_eq!(engine.browser_context_epoch(), epoch);
    assert!(
        engine.active_timer.is_none(),
        "an onenterforward task stops outer entry processing before timer start"
    );
    let kinds = engine
        .trace_entries()
        .into_iter()
        .map(|entry| entry.kind)
        .collect::<Vec<_>>();
    let load = kinds.iter().rposition(|kind| kind == "LOAD_DECK").unwrap();
    let event = kinds
        .iter()
        .rposition(|kind| kind == "ACTION_EXTERNAL")
        .unwrap();
    assert!(load < event, "destination load must precede its entry task");
}

#[test]
fn wml_301_forward_load_falls_back_to_first_card_for_unknown_fragment() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(r#"<wml><card id="source"><p>Source</p></card></wml>"#)
        .unwrap();

    load_for_navigation(
        &mut engine,
        r#"<wml><card id="first"><p>First</p></card><card id="second"><p>Second</p></card></wml>"#,
        "http://example.test/destination.wml",
        "http://example.test/destination.wml#missing",
        DeckNavigationKind::Forward,
    );

    assert_eq!(engine.active_card_id().as_deref(), Ok("first"));
}

#[test]
fn wml_301_independent_load_rejects_unknown_fragment_and_preserves_state() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r#"<wml><card id="source"><p>Source</p></card></wml>"#,
            "http://example.test/source.wml",
            CONTENT_TYPE,
            None,
        )
        .expect("source deck should load");
    assert!(engine.set_var("token".to_string(), "kept".to_string()));
    let epoch = engine.browser_context_epoch();
    let trace =
        serde_json::to_value(engine.trace_entries()).expect("trace entries should serialize");

    let error = engine
        .load_deck_context(
            r#"<wml><card id="first"><p>First</p></card></wml>"#,
            "http://example.test/destination.wml#missing",
            CONTENT_TYPE,
            None,
        )
        .expect_err("an unknown top-level fragment should reject the load");

    assert_eq!(error, "Card id not found");
    let diagnostics = engine.last_wml_load_diagnostics();
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].class,
        WmlLoadDiagnosticClassLiteral::Recoverable
    );
    assert_eq!(
        diagnostics[0].code,
        WmlLoadDiagnosticCodeLiteral::RecoverableContent
    );
    assert_eq!(
        diagnostics[0].outcome,
        WmlLoadDiagnosticOutcomeLiteral::Rejected
    );
    assert_eq!(diagnostics[0].message, error);
    assert_eq!(engine.active_card_id().as_deref(), Ok("source"));
    assert_eq!(engine.base_url(), "http://example.test/source.wml");
    assert_eq!(engine.get_var("token".to_string()).as_deref(), Some("kept"));
    assert_eq!(engine.browser_context_epoch(), epoch);
    assert_eq!(
        serde_json::to_value(engine.trace_entries()).expect("trace entries should serialize"),
        trace
    );
}

#[test]
fn wml_301_independent_load_without_nonempty_fragment_selects_first_card() {
    for url in [
        "http://example.test/destination.wml",
        "http://example.test/destination.wml#",
    ] {
        let mut engine = WmlEngine::new();
        engine
            .load_deck_context(
                r#"<wml><card id="first"><p>First</p></card><card id="second"><p>Second</p></card></wml>"#,
                url,
                CONTENT_TYPE,
                None,
            )
            .expect("no fragment or an empty fragment should load the first card");

        assert_eq!(engine.active_card_id().as_deref(), Ok("first"), "{url}");
    }
}

#[test]
fn wml_301_destination_newcontext_reinitializes_the_cross_deck_context() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(r#"<wml><card id="source"><p>Source</p></card></wml>"#)
        .unwrap();
    assert!(engine.set_var("secret".to_string(), "discard".to_string()));
    let previous_epoch = engine.browser_context_epoch();

    load_for_navigation(
        &mut engine,
        r#"<wml><card id="fresh" newcontext="true"><p>Fresh</p></card></wml>"#,
        "http://example.test/fresh.wml",
        "http://example.test/fresh.wml#fresh",
        DeckNavigationKind::Forward,
    );

    assert_eq!(engine.get_var("secret".to_string()), None);
    assert!(engine.nav_stack.is_empty());
    assert_eq!(engine.browser_context_epoch(), previous_epoch + 1);
}

#[test]
fn wml_301_backward_load_uses_backward_entry_order_and_preserves_context() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(r#"<wml><card id="source"><p>Source</p></card></wml>"#)
        .unwrap();
    assert!(engine.set_var("token".to_string(), "kept".to_string()));

    load_for_navigation(
        &mut engine,
        r#"
        <wml><card id="previous">
          <onevent type="onenterbackward"><go href="after-back.wml"/></onevent>
          <timer value="10"/>
          <p>Previous</p>
        </card></wml>
        "#,
        "http://example.test/previous.wml",
        "http://example.test/previous.wml#previous",
        DeckNavigationKind::Backward,
    );

    assert_eq!(engine.get_var("token".to_string()).as_deref(), Some("kept"));
    assert!(engine.active_timer.is_none());
    assert!(engine
        .trace_entries()
        .iter()
        .any(|entry| entry.kind == "ACTION_EXTERNAL"));
}

#[test]
fn wml_301_reload_preserves_browser_context_without_running_forward_entry() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(r#"<wml><card id="home"><p>Home</p></card></wml>"#)
        .unwrap();
    assert!(engine.set_var("token".to_string(), "kept".to_string()));
    let epoch = engine.browser_context_epoch();

    load_for_navigation(
        &mut engine,
        r#"
        <wml><card id="home">
          <onevent type="onenterforward">
            <refresh><setvar name="unexpected" value="yes"/></refresh>
          </onevent>
          <p>Reloaded</p>
        </card></wml>
        "#,
        "http://example.test/home.wml",
        "http://example.test/home.wml#home",
        DeckNavigationKind::Reload,
    );

    assert_eq!(engine.get_var("token".to_string()).as_deref(), Some("kept"));
    assert_eq!(engine.get_var("unexpected".to_string()), None);
    assert_eq!(engine.browser_context_epoch(), epoch);
}

#[test]
fn wml_301_failed_cross_deck_entry_rolls_back_context_and_active_deck() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r#"<wml><card id="source"><p>Source</p></card></wml>"#,
            "http://example.test/source.wml",
            CONTENT_TYPE,
            None,
        )
        .expect("source deck should load");
    assert!(engine.set_var("token".to_string(), "kept".to_string()));
    let epoch = engine.browser_context_epoch();

    let error = engine
        .load_deck_context_for_navigation(
            r#"
            <wml><card id="broken">
              <onevent type="onenterforward">
                <go href="script:missing.wmlsc#main"/>
              </onevent>
              <p>Broken</p>
            </card></wml>
            "#,
            "http://example.test/broken.wml",
            CONTENT_TYPE,
            None,
            DeckNavigationContext::new(
                Some("http://example.test/source.wml"),
                Some("http://example.test/broken.wml#broken"),
                DeckNavigationKind::Forward,
            ),
        )
        .expect_err("failed destination entry should reject the cross-deck load");

    assert!(error.contains("not registered"));
    assert_eq!(engine.active_card_id().as_deref(), Ok("source"));
    assert_eq!(engine.base_url(), "http://example.test/source.wml");
    assert_eq!(engine.get_var("token".to_string()).as_deref(), Some("kept"));
    assert_eq!(engine.browser_context_epoch(), epoch);
}
