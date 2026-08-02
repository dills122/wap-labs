use crate::runtime::variable::MAX_AGGREGATE_VAR_STORE_BYTES;
use crate::{
    DeckNavigationContext, DeckNavigationKind, WmlEngine, WmlLoadDiagnosticCodeLiteral,
    WmlLoadDiagnosticOutcomeLiteral,
};

const POLICY_DECK: &str = include_str!("../../tests/fixtures/wml-306/low-memory.wml");
const TASK_FAILURE_DECK: &str = include_str!("../../tests/fixtures/wml-306/task-failure.wml");
const ACCESS_DENIED_DECK: &str = include_str!("../../tests/fixtures/wml-306/access-denied.wml");
const ALTERNATE_DTD_DECK: &str = include_str!("../../tests/fixtures/wml-306/alternate-dtd.wml");

#[test]
fn wml_306_low_memory_reclaims_history_resets_context_and_retries_atomically() {
    let mut engine = WmlEngine::new();
    engine.load_deck(POLICY_DECK).expect("policy deck loads");
    engine
        .navigate_to_card("pressure".to_string())
        .expect("history entry is created");
    let filler_len = MAX_AGGREGATE_VAR_STORE_BYTES - "Filler".len() - 1;
    assert!(engine.set_var("Filler".to_string(), "x".repeat(filler_len)));
    let previous_epoch = engine.browser_context_epoch();

    engine
        .handle_key("enter".to_string())
        .expect("context reset makes the bounded assignment retryable");

    assert_eq!(engine.get_var("Filler".to_string()), None);
    assert_eq!(engine.get_var("Added".to_string()).as_deref(), Some("ok"));
    assert_eq!(engine.browser_context_epoch(), previous_epoch + 1);
    assert_eq!(
        engine.last_runtime_failure_code().as_deref(),
        Some("WML_CONTEXT_RESET")
    );
    assert_eq!(
        engine.last_runtime_failure_message().as_deref(),
        Some("Browser memory was exhausted. The page context was reset.")
    );
    assert!(
        !engine.navigate_back(),
        "low-memory reset clears engine history"
    );
}

#[test]
fn wml_306_task_failure_rolls_back_and_publishes_only_safe_host_copy() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(TASK_FAILURE_DECK)
        .expect("failure deck loads");

    let technical = engine
        .handle_key("enter".to_string())
        .expect_err("missing destination remains a native task error");

    assert!(technical.contains("Card id not found"));
    assert_eq!(engine.active_card_id().as_deref(), Ok("stable"));
    assert_eq!(engine.get_var("Secret".to_string()), None);
    assert_eq!(
        engine.last_runtime_failure_code().as_deref(),
        Some("WML_TASK_FAILED")
    );
    assert_eq!(
        engine.last_runtime_failure_message().as_deref(),
        Some("The requested page action could not be completed.")
    );
    assert!(!engine
        .last_runtime_failure_message()
        .unwrap_or_default()
        .contains("missing"));

    engine
        .navigate_to_card("still-missing".to_string())
        .expect_err("a later direct API error must not reuse the recorded task failure");
    assert_eq!(engine.last_runtime_failure_code(), None);
}

#[test]
fn wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable() {
    let mut engine = WmlEngine::new();
    engine.load_deck(POLICY_DECK).expect("baseline deck loads");
    let error = engine
        .load_deck_context_for_navigation(
            ACCESS_DENIED_DECK,
            "http://target.example/private/deck.wml",
            "text/vnd.wap.wml",
            None,
            DeckNavigationContext::new(
                Some("http://attacker.example/public/start.wml"),
                Some("http://target.example/private/deck.wml"),
                DeckNavigationKind::Forward,
            ),
        )
        .expect_err("referrer is outside the access components");
    assert_eq!(error, "Deck access denied for referring URI");
    assert_eq!(engine.active_card_id().as_deref(), Ok("start"));

    engine
        .load_deck_context_for_navigation(
            ALTERNATE_DTD_DECK,
            "http://example.test/alternate.wml",
            "text/vnd.wap.wml",
            None,
            DeckNavigationContext::new(
                None,
                Some("http://example.test/alternate.wml"),
                DeckNavigationKind::Independent,
            ),
        )
        .expect("alternate DTD ignores unknown wrappers");
    let diagnostics = engine.last_wml_load_diagnostics();
    assert!(diagnostics.iter().any(|diagnostic| {
        diagnostic.code == WmlLoadDiagnosticCodeLiteral::UnsupportedOptionalConstruct
            && diagnostic.outcome == WmlLoadDiagnosticOutcomeLiteral::Ignored
    }));
    let rendered = format!("{:?}", engine.render().expect("known content renders"));
    assert!(rendered.contains("Known content"));
    assert!(!rendered.contains("secret"));
}
