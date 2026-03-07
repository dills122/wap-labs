use super::{
    classify_vm_trap, classify_vm_trap_category, convert_script_call_args, parse_script_href,
    ParsedScriptRef, ScriptCallArgLiteral, ScriptDialogRequestLiteral, ScriptErrorCategoryLiteral,
    ScriptErrorClassLiteral, ScriptNavigationIntentLiteral, ScriptTimerRequestLiteral,
    ScriptValueLiteral, WmlEngine, MAX_DECK_RAW_BYTES_BASE64_BYTES, MAX_DECK_WML_XML_BYTES,
};
use crate::layout::flow_layout::layout_card;
use crate::render::render_list::DrawCmd;
use crate::wavescript::value::ScriptValue;
use crate::wavescript::vm::VmTrap;

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
const FIXTURE_BASIC_TWO_CARD: &str = include_str!("../tests/fixtures/phase-a/basic-two-card.wml");
const FIXTURE_MIXED_INLINE_TEXT_LINKS: &str =
    include_str!("../tests/fixtures/phase-a/mixed-inline-text-links.wml");
const FIXTURE_LINK_WRAP: &str = include_str!("../tests/fixtures/phase-a/link-wrap.wml");
const FIXTURE_MISSING_FRAGMENT: &str =
    include_str!("../tests/fixtures/phase-a/missing-fragment.wml");
const FIXTURE_TASK_ACTION_ORDER: &str =
    include_str!("../tests/fixtures/phase-a/task-action-order.wml");

fn render_snapshot_lines(engine: &WmlEngine) -> Vec<String> {
    let card = engine
        .active_card_internal()
        .expect("active card must exist for snapshot");
    let layout = layout_card(card, engine.viewport_cols, engine.focused_link_idx);
    layout
        .render_list
        .draw
        .iter()
        .map(|cmd| match cmd {
            DrawCmd::Text { x, y, text } => format!("text:{x}:{y}:{text}"),
            DrawCmd::Link {
                x,
                y,
                text,
                focused,
                href,
            } => format!("link:{x}:{y}:focused={focused}:href={href}:text={text}"),
        })
        .collect()
}

fn push_string(bytes: &mut Vec<u8>, value: &str) {
    let raw = value.as_bytes();
    assert!(
        u8::try_from(raw.len()).is_ok(),
        "test string too long for PUSH_STRING8"
    );
    bytes.push(0x03);
    bytes.push(raw.len() as u8);
    bytes.extend_from_slice(raw);
}

fn assert_trace_kinds_subsequence(engine: &WmlEngine, expected: &[&str]) {
    let kinds: Vec<String> = engine
        .trace_entries()
        .into_iter()
        .map(|entry| entry.kind)
        .collect();
    let mut cursor = 0usize;
    for kind in kinds {
        if cursor < expected.len() && kind == expected[cursor] {
            cursor += 1;
        }
    }
    assert_eq!(
        cursor,
        expected.len(),
        "expected trace subsequence {:?} not found in {:?}",
        expected,
        engine
            .trace_entries()
            .iter()
            .map(|entry| entry.kind.as_str())
            .collect::<Vec<_>>()
    );
}

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

#[test]
fn load_deck_returns_structured_error_for_invalid_root() {
    let mut engine = WmlEngine::new();
    let msg = engine
        .load_deck("<card id=\"home\"><p>Hello</p></card>")
        .expect_err("missing wml root must fail");
    assert!(msg.contains("<wml>"), "unexpected error message: {msg}");
}

#[test]
fn load_deck_rejects_excessive_nested_markup_depth() {
    let mut engine = WmlEngine::new();
    let depth = 200usize;
    let wrappers = "<x>".repeat(depth);
    let closes = "</x>".repeat(depth);
    let xml = format!("<wml><card id=\"home\">{wrappers}<p>deep</p>{closes}</card></wml>");

    let err = engine
        .load_deck(&xml)
        .expect_err("excessive nesting must fail deterministically");
    assert!(
        err.contains("Parse limit exceeded: nesting depth"),
        "unexpected error message: {err}"
    );
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
fn enter_normalizes_out_of_range_focus_for_external_link_cards() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="http://example.test/one.wml">One</a>
            <a href="http://example.test/two.wml">Two</a>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine.focused_link_idx = 99;

    engine
        .handle_key_internal("enter")
        .expect("enter should resolve focused external link");

    assert_eq!(engine.focused_link_idx, 1);
    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://example.test/two.wml".to_string())
    );
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("focused=true:href=http://example.test/two.wml:text=Two")));
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

#[test]
fn external_navigation_query_only_uses_base_document() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="?q=1">Query</a>
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

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://local.test/dir/start.wml?q=1".to_string())
    );
}

#[test]
fn external_navigation_parent_segment_resolves() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="../next.wml">Parent</a>
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

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://local.test/next.wml".to_string())
    );
}

#[test]
fn external_navigation_scheme_relative_inherits_base_scheme() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="//cdn.example.org/deck.wml">CDN</a>
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

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://cdn.example.org/deck.wml".to_string())
    );
}

#[test]
fn load_deck_sets_default_metadata_values() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
        )
        .expect("deck should load");

    assert_eq!(engine.base_url(), "");
    assert_eq!(engine.content_type(), "text/vnd.wap.wml");
}

#[test]
fn load_deck_context_overrides_metadata_values() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
            "http://local.test/path/start.wml",
            "application/vnd.wap.wmlc",
            Some("AQID".to_string()),
        )
        .expect("deck should load");

    assert_eq!(engine.base_url(), "http://local.test/path/start.wml");
    assert_eq!(engine.content_type(), "application/vnd.wap.wmlc");
}

#[test]
fn load_deck_context_rejects_oversized_wml_payload() {
    let mut engine = WmlEngine::new();
    let inner = "a".repeat(MAX_DECK_WML_XML_BYTES + 1);
    let xml = format!("<wml><card id=\"home\"><p>{inner}</p></card></wml>");

    let err = engine
        .load_deck_context(
            &xml,
            "http://local.test/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect_err("oversized deck should be rejected");
    assert!(
        err.contains("Deck payload exceeds"),
        "unexpected error message: {err}"
    );
}

#[test]
fn load_deck_context_rejects_oversized_raw_payload() {
    let mut engine = WmlEngine::new();
    let raw = "A".repeat(MAX_DECK_RAW_BYTES_BASE64_BYTES + 1);

    let err = engine
        .load_deck_context(
            "<wml><card id=\"home\"><p>ok</p></card></wml>",
            "http://local.test/start.wml",
            "application/vnd.wap.wmlc",
            Some(raw),
        )
        .expect_err("oversized raw payload should be rejected");
    assert!(
        err.contains("Raw deck payload exceeds"),
        "unexpected error message: {err}"
    );
}

#[test]
fn load_deck_compat_path_resets_metadata_to_defaults() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#;
    engine
        .load_deck_context(
            xml,
            "http://local.test/path/start.wml",
            "application/vnd.wap.wmlc",
            Some("AQID".to_string()),
        )
        .expect("deck should load");
    assert_eq!(engine.base_url(), "http://local.test/path/start.wml");
    assert_eq!(engine.content_type(), "application/vnd.wap.wmlc");

    engine
        .load_deck(xml)
        .expect("loadDeck should remain functional");
    assert_eq!(engine.base_url(), "");
    assert_eq!(engine.content_type(), "text/vnd.wap.wml");
}

#[test]
fn execute_script_unit_halt_bytecode_returns_ok() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0x00]);
    assert!(outcome.ok);
    assert!(outcome.trap.is_none());
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::String(String::new())
    );
}

#[test]
fn execute_script_unit_empty_bytecode_returns_decode_trap() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[]);
    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, super::ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Integrity
    );
    assert!(outcome.invocation_aborted);
    assert_eq!(
        outcome.trap.as_deref(),
        Some("decode: empty compilation unit")
    );
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
}

#[test]
fn execute_script_unit_unknown_opcode_returns_decode_fatal() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0xff]);
    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, super::ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Integrity
    );
    assert!(outcome.invocation_aborted);
    assert_eq!(
        outcome.trap.as_deref(),
        Some("decode: unsupported opcode 0xff at pc=0")
    );
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
}

#[test]
fn execute_script_unit_addition_returns_ok() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0x01, 4, 0x01, 8, 0x02, 0x00]);
    assert!(outcome.ok);
    assert!(outcome.trap.is_none());
    assert_eq!(outcome.result, super::ScriptValueLiteral::Number(12.0));
}

#[test]
fn execute_script_unit_truncated_immediate_returns_decode_fatal() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0x01]);
    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, super::ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Integrity
    );
    assert!(outcome.invocation_aborted);
    assert_eq!(
        outcome.trap.as_deref(),
        Some("decode: truncated immediate for opcode 0x01 at pc=0")
    );
}

#[test]
fn execute_script_unit_type_mismatch_is_non_fatal_invalid() {
    let engine = WmlEngine::new();
    let outcome = engine.execute_script_unit_internal(&[0x03, 1, b'x', 0x01, 1, 0x02, 0x00]);

    assert!(outcome.ok);
    assert_eq!(
        outcome.error_class,
        super::ScriptErrorClassLiteral::NonFatal
    );
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Computational
    );
    assert!(!outcome.invocation_aborted);
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
    assert_eq!(
        outcome.trap.as_deref(),
        Some("vm: type error (expected int32)")
    );
}

#[test]
fn execute_script_unit_return_from_root_reports_vm_trap() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0x13]);
    assert!(!outcome.ok);
    assert_eq!(outcome.trap.as_deref(), Some("vm: return from root frame"));
}

#[test]
fn execute_script_unit_stack_underflow_is_non_fatal_invalid() {
    let engine = WmlEngine::new();
    let outcome = engine.execute_script_unit_internal(&[0x02, 0x00]);

    assert!(outcome.ok);
    assert_eq!(
        outcome.error_class,
        super::ScriptErrorClassLiteral::NonFatal
    );
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Computational
    );
    assert!(!outcome.invocation_aborted);
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
    assert_eq!(outcome.trap.as_deref(), Some("vm: stack underflow"));
}

#[test]
fn vm_trap_classification_matrix_is_explicit() {
    fn expected_class(trap: &VmTrap) -> ScriptErrorClassLiteral {
        match trap {
            VmTrap::TypeError(_) | VmTrap::StackUnderflow => ScriptErrorClassLiteral::NonFatal,
            VmTrap::EmptyUnit
            | VmTrap::InvalidEntryPoint { .. }
            | VmTrap::UnsupportedOpcode(_)
            | VmTrap::TruncatedImmediate { .. }
            | VmTrap::StackOverflow { .. }
            | VmTrap::InvalidLocalIndex { .. }
            | VmTrap::InvalidCallTarget { .. }
            | VmTrap::CallDepthExceeded { .. }
            | VmTrap::ReturnFromRootFrame
            | VmTrap::ExecutionLimitExceeded { .. }
            | VmTrap::Utf8ImmediateDecode
            | VmTrap::HostCallUnavailable { .. }
            | VmTrap::HostCallError { .. } => ScriptErrorClassLiteral::Fatal,
        }
    }

    let matrix = vec![
        VmTrap::EmptyUnit,
        VmTrap::InvalidEntryPoint { entry_pc: 1 },
        VmTrap::UnsupportedOpcode(0xff),
        VmTrap::TruncatedImmediate { opcode: 0x01 },
        VmTrap::StackOverflow { limit: 1 },
        VmTrap::StackUnderflow,
        VmTrap::TypeError("expected int32"),
        VmTrap::InvalidLocalIndex { index: 0 },
        VmTrap::InvalidCallTarget { target: 0 },
        VmTrap::CallDepthExceeded { limit: 1 },
        VmTrap::ReturnFromRootFrame,
        VmTrap::ExecutionLimitExceeded { limit: 1 },
        VmTrap::Utf8ImmediateDecode,
        VmTrap::HostCallUnavailable { function_id: 1 },
        VmTrap::HostCallError {
            function_id: 1,
            message: "x".to_string(),
        },
    ];

    for trap in matrix {
        let expected = expected_class(&trap);
        assert_eq!(
            classify_vm_trap(&trap),
            expected,
            "trap class mismatch for {trap:?}"
        );
    }
}

#[test]
fn vm_trap_error_category_matrix_is_explicit() {
    fn expected_category(trap: &VmTrap) -> ScriptErrorCategoryLiteral {
        match trap {
            VmTrap::TypeError(_) | VmTrap::StackUnderflow => {
                ScriptErrorCategoryLiteral::Computational
            }
            VmTrap::EmptyUnit
            | VmTrap::InvalidEntryPoint { .. }
            | VmTrap::UnsupportedOpcode(_)
            | VmTrap::TruncatedImmediate { .. }
            | VmTrap::InvalidLocalIndex { .. }
            | VmTrap::InvalidCallTarget { .. }
            | VmTrap::Utf8ImmediateDecode
            | VmTrap::ReturnFromRootFrame => ScriptErrorCategoryLiteral::Integrity,
            VmTrap::StackOverflow { .. }
            | VmTrap::CallDepthExceeded { .. }
            | VmTrap::ExecutionLimitExceeded { .. } => ScriptErrorCategoryLiteral::Resource,
            VmTrap::HostCallUnavailable { .. } | VmTrap::HostCallError { .. } => {
                ScriptErrorCategoryLiteral::HostBinding
            }
        }
    }

    let matrix = vec![
        VmTrap::EmptyUnit,
        VmTrap::InvalidEntryPoint { entry_pc: 1 },
        VmTrap::UnsupportedOpcode(0xff),
        VmTrap::TruncatedImmediate { opcode: 0x01 },
        VmTrap::StackOverflow { limit: 1 },
        VmTrap::StackUnderflow,
        VmTrap::TypeError("expected int32"),
        VmTrap::InvalidLocalIndex { index: 0 },
        VmTrap::InvalidCallTarget { target: 0 },
        VmTrap::CallDepthExceeded { limit: 1 },
        VmTrap::ReturnFromRootFrame,
        VmTrap::ExecutionLimitExceeded { limit: 1 },
        VmTrap::Utf8ImmediateDecode,
        VmTrap::HostCallUnavailable { function_id: 1 },
        VmTrap::HostCallError {
            function_id: 1,
            message: "x".to_string(),
        },
    ];

    for trap in matrix {
        let expected = expected_category(&trap);
        assert_eq!(
            classify_vm_trap_category(&trap),
            expected,
            "trap category mismatch for {trap:?}"
        );
    }
}

#[test]
fn execute_script_ref_reports_missing_unit() {
    let mut engine = WmlEngine::new();
    let outcome = engine.execute_script_ref_internal("missing.wmlsc", "main");
    engine.last_script_outcome = Some(outcome);
    assert_eq!(engine.last_script_execution_ok(), Some(false));
    assert_eq!(
        engine.last_script_execution_trap().as_deref(),
        Some("loader: script unit not registered (missing.wmlsc)")
    );
}

#[test]
fn script_link_executes_registered_unit_without_external_navigation() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:calc.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit("calc.wmlsc".to_string(), vec![0x01, 4, 0x01, 5, 0x02, 0x00]);

    engine
        .handle_key("enter".to_string())
        .expect("script execution should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.external_navigation_intent(), None);
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
}

#[test]
fn script_link_returns_error_when_unit_is_missing() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:missing.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let err = engine
        .handle_key_internal("enter")
        .expect_err("missing script unit should fail");
    assert_eq!(err, "loader: script unit not registered (missing.wmlsc)");
    assert_eq!(
        engine.last_script_execution_trap().as_deref(),
        Some("loader: script unit not registered (missing.wmlsc)")
    );
}

#[test]
fn clear_script_units_removes_registered_units() {
    let mut engine = WmlEngine::new();
    engine.register_script_unit("unit.wmlsc".to_string(), vec![0x00]);
    engine.clear_script_units();

    let outcome = engine
        .execute_script_ref_internal("unit.wmlsc", "main")
        .trap
        .expect("missing unit should trap");
    assert_eq!(outcome, "loader: script unit not registered (unit.wmlsc)");
}

#[test]
fn parse_script_href_extracts_source_before_fragment() {
    assert!(matches!(
        parse_script_href("script:calc.wmlsc#main"),
        Some(ParsedScriptRef {
            src: "calc.wmlsc",
            function_name: Some("main")
        })
    ));
    assert!(matches!(
        parse_script_href("script:calc.wmlsc"),
        Some(ParsedScriptRef {
            src: "calc.wmlsc",
            function_name: None
        })
    ));
    assert_eq!(parse_script_href("script:#main"), None);
    assert_eq!(parse_script_href("#next"), None);
}

#[test]
fn execute_script_ref_function_uses_registered_entry_point() {
    let mut engine = WmlEngine::new();
    engine.register_script_unit(
        "multi.wmlsc".to_string(),
        vec![0x01, 1, 0x00, 0x01, 9, 0x00],
    );
    engine.register_script_entry_point("multi.wmlsc".to_string(), "alt".to_string(), 3);

    let outcome = engine.execute_script_ref_internal("multi.wmlsc", "alt");
    assert!(outcome.ok);
    assert_eq!(outcome.result, super::ScriptValueLiteral::Number(9.0));
    assert_eq!(outcome.trap, None);
}

#[test]
fn execute_script_ref_function_missing_entry_point_traps() {
    let mut engine = WmlEngine::new();
    engine.register_script_unit("multi.wmlsc".to_string(), vec![0x01, 1, 0x00]);

    let outcome = engine.execute_script_ref_internal("multi.wmlsc", "missing");
    assert!(!outcome.ok);
    assert_eq!(
        outcome.trap.as_deref(),
        Some("loader: function entry point not registered (multi.wmlsc#missing)")
    );
}

#[test]
fn script_link_function_dispatch_uses_registered_entry_point() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:multi.wmlsc#alt">Run alt</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit(
        "multi.wmlsc".to_string(),
        vec![0x01, 1, 0x00, 0x01, 9, 0x00],
    );
    engine.register_script_entry_point("multi.wmlsc".to_string(), "alt".to_string(), 3);

    engine
        .handle_key("enter".to_string())
        .expect("script alt entrypoint should execute");
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
}

#[test]
fn execute_script_ref_call_passes_args_into_function_locals() {
    let mut engine = WmlEngine::new();
    engine.register_script_unit("sum.wmlsc".to_string(), vec![0x11, 0, 0x11, 1, 0x02, 0x00]);
    engine.register_script_entry_point("sum.wmlsc".to_string(), "sum".to_string(), 0);

    let outcome = engine.execute_script_ref_call_internal(
        "sum.wmlsc",
        "sum",
        &[ScriptValue::Int32(10), ScriptValue::Int32(32)],
    );
    assert!(outcome.ok);
    assert_eq!(outcome.result, ScriptValueLiteral::Number(42.0));
    assert_eq!(outcome.trap, None);
}

#[test]
fn wmlbrowser_setvar_getvar_lifecycle_and_coercion() {
    let mut engine = WmlEngine::new();
    assert!(engine.set_var("alpha".to_string(), "1".to_string()));
    assert_eq!(engine.get_var("alpha".to_string()).as_deref(), Some("1"));
    assert!(!engine.set_var("9bad".to_string(), "x".to_string()));

    let mut unit = Vec::new();
    push_string(&mut unit, "score");
    unit.push(0x01);
    unit.push(7);
    unit.push(0x20);
    unit.push(0x02);
    unit.push(0x02);
    push_string(&mut unit, "score");
    unit.push(0x20);
    unit.push(0x01);
    unit.push(0x01);
    unit.push(0x00);
    engine.register_script_unit("vars.wmlsc".to_string(), unit);

    let outcome = engine.execute_script_ref_internal("vars.wmlsc", "main");
    assert!(outcome.ok);
    assert_eq!(outcome.result, ScriptValueLiteral::String("7".to_string()));
    assert_eq!(engine.get_var("score".to_string()).as_deref(), Some("7"));
    assert!(outcome.requires_refresh);
    assert_eq!(
        outcome.navigation_intent,
        ScriptNavigationIntentLiteral::None
    );
}

#[test]
fn wmlbrowser_get_current_card_returns_fragment_when_context_exists() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine
        .load_deck_context(
            xml,
            "http://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");

    let unit = vec![
        0x20, 0x0B, // getCurrentCard()
        0x00, 0x00,
    ];
    engine.register_script_unit("current-card.wmlsc".to_string(), unit);

    let outcome = engine.execute_script_ref_internal("current-card.wmlsc", "main");
    assert!(outcome.ok);
    assert_eq!(
        outcome.result,
        ScriptValueLiteral::String("#home".to_string())
    );
}

#[test]
fn wmlbrowser_get_current_card_returns_invalid_without_context() {
    let mut engine = WmlEngine::new();
    let unit = vec![
        0x20, 0x0B, // getCurrentCard()
        0x00, 0x00,
    ];
    engine.register_script_unit("current-card-noctx.wmlsc".to_string(), unit);

    let outcome = engine.execute_script_ref_internal("current-card-noctx.wmlsc", "main");
    assert!(outcome.ok);
    assert_eq!(
        outcome.result,
        ScriptValueLiteral::Invalid { invalid: true }
    );
}

#[test]
fn wmlbrowser_new_context_clears_vars_and_history_and_prev_has_no_effect() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <a href="#next">To next</a>
          </card>
          <card id="next">
            <a href="script:ctx.wmlsc#main">Run context reset</a>
          </card>
        </wml>
        "##;
    engine
        .load_deck_context(
            xml,
            "http://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to mid");
    engine
        .handle_key("enter".to_string())
        .expect("mid enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(engine.nav_stack.len(), 2);

    let mut unit = Vec::new();
    push_string(&mut unit, "session");
    push_string(&mut unit, "abc");
    unit.push(0x20);
    unit.push(0x02); // setVar(name, value)
    unit.push(0x02);
    unit.push(0x20);
    unit.push(0x04); // prev()
    unit.push(0x00);
    unit.push(0x20);
    unit.push(0x0A); // newContext()
    unit.push(0x00);
    unit.push(0x00);
    engine.register_script_unit("ctx.wmlsc".to_string(), unit);

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("script context reset should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert!(
        engine.nav_stack.is_empty(),
        "newContext should clear history stack"
    );
    assert_eq!(
        engine.get_var("session".to_string()),
        None,
        "newContext should clear vars"
    );
    assert!(
        !engine.navigate_back(),
        "back should be empty after newContext"
    );
    let traces = engine.trace_entries();
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_NEWCONTEXT"));
    assert!(
        traces.iter().all(|entry| entry.kind != "ACTION_BACK"),
        "prev request should have no effect after newContext"
    );
}

#[test]
fn execute_script_ref_is_raw_and_does_not_apply_navigation_effects() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01);
    unit.push(0x00);
    engine.register_script_unit("raw-nav.wmlsc".to_string(), unit);

    let outcome = engine.execute_script_ref_internal("raw-nav.wmlsc", "main");
    assert!(outcome.ok);
    assert_eq!(
        outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Go {
            href: "#next".to_string()
        }
    );
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}

#[test]
fn execute_script_ref_does_not_publish_dialog_or_timer_effects() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "hello");
    unit.push(0x20);
    unit.push(0x05);
    unit.push(0x01); // alert(message)
    unit.push(0x01);
    unit.push(25);
    push_string(&mut unit, "otp");
    unit.push(0x20);
    unit.push(0x08);
    unit.push(0x02); // setTimer(delay, token)
    unit.push(0x00);
    engine.register_script_unit("raw-effects.wmlsc".to_string(), unit);

    let outcome = engine.execute_script_ref_internal("raw-effects.wmlsc", "main");
    assert!(outcome.ok);
    assert!(engine.last_script_dialog_requests().is_empty());
    assert!(engine.last_script_timer_requests().is_empty());
}

#[test]
fn invoke_script_ref_applies_effects_and_returns_invocation_outcome() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let mut unit = Vec::new();
    push_string(&mut unit, "nextCard");
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x02);
    unit.push(0x02); // setVar
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go
    unit.push(0x00);
    engine.register_script_unit("invoke-nav.wmlsc".to_string(), unit);

    let outcome = engine
        .invoke_script_ref_internal("invoke-nav.wmlsc", "main", &[])
        .expect("invoke should succeed");
    assert_eq!(
        outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Go {
            href: "#next".to_string()
        }
    );
    assert!(outcome.requires_refresh);
    assert_eq!(
        engine.get_var("nextCard".to_string()).as_deref(),
        Some("#next")
    );
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(engine.last_script_requires_refresh(), Some(true));
}

#[test]
fn invoke_script_ref_trap_does_not_apply_deferred_navigation() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #next
    unit.push(0xff); // trap
    engine.register_script_unit("trap-nav.wmlsc".to_string(), unit);

    let err = engine
        .invoke_script_ref_internal("trap-nav.wmlsc", "main", &[])
        .expect_err("invoke should trap");
    assert!(err.contains("unsupported opcode"));
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.last_script_execution_ok(), Some(false));
}

#[test]
fn invoke_script_ref_non_fatal_returns_invalid_without_abort() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit(
        "nonfatal.wmlsc".to_string(),
        vec![0x03, 1, b'x', 0x01, 1, 0x02, 0x00],
    );

    let outcome = engine
        .invoke_script_ref_internal("nonfatal.wmlsc", "main", &[])
        .expect("non-fatal type error should not abort invocation");
    assert_eq!(
        outcome.result,
        ScriptValueLiteral::Invalid { invalid: true }
    );
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("non-fatal")
    );
    assert_eq!(
        engine.last_script_execution_error_category().as_deref(),
        Some("computational")
    );
}

#[test]
fn invoke_script_ref_non_fatal_preserves_deferred_navigation_effects() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go("#next")
    unit.push(0x02); // add => non-fatal (stack underflow / type mismatch)
    unit.push(0x00);
    engine.register_script_unit("nonfatal-nav.wmlsc".to_string(), unit);

    let outcome = engine
        .invoke_script_ref_internal("nonfatal-nav.wmlsc", "main", &[])
        .expect("non-fatal error should not abort invocation");
    assert_eq!(
        outcome.result,
        ScriptValueLiteral::Invalid { invalid: true }
    );
    assert_eq!(
        outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Go {
            href: "#next".to_string()
        }
    );
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("non-fatal")
    );
    assert_eq!(
        engine.last_script_execution_error_category().as_deref(),
        Some("computational")
    );
}

#[test]
fn fatal_invocation_failure_keeps_engine_recoverable() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit("fatal.wmlsc".to_string(), vec![0xff]);
    engine.register_script_unit("good.wmlsc".to_string(), vec![0x01, 2, 0x01, 3, 0x02, 0x00]);

    let err = engine
        .invoke_script_ref_internal("fatal.wmlsc", "main", &[])
        .expect_err("fatal decode error should abort invocation");
    assert!(err.contains("unsupported opcode"));
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("fatal")
    );
    assert_eq!(
        engine.last_script_execution_error_category().as_deref(),
        Some("integrity")
    );

    let outcome = engine
        .invoke_script_ref_internal("good.wmlsc", "main", &[])
        .expect("engine should stay recoverable after fatal invocation");
    assert_eq!(outcome.result, ScriptValueLiteral::Number(5.0));
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("none")
    );
    assert_eq!(
        engine.last_script_execution_error_category().as_deref(),
        Some("none")
    );
}

#[test]
fn invoke_script_ref_records_dialog_and_timer_effect_traces() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "wake up");
    unit.push(0x20);
    unit.push(0x05);
    unit.push(0x01); // alert(message)
    unit.push(0x01);
    unit.push(25); // delay ms
    push_string(&mut unit, "otp");
    unit.push(0x20);
    unit.push(0x08);
    unit.push(0x02); // setTimer(delayMs, token)
    push_string(&mut unit, "otp");
    unit.push(0x20);
    unit.push(0x09);
    unit.push(0x01); // clearTimer(token)
    unit.push(0x00);
    engine.register_script_unit("effects.wmlsc".to_string(), unit);

    let outcome = engine
        .invoke_script_ref_internal("effects.wmlsc", "main", &[])
        .expect("invoke should succeed");
    assert!(outcome.result != ScriptValueLiteral::Invalid { invalid: true });

    let traces = engine.trace_entries();
    assert!(
        traces.iter().any(|entry| entry.kind == "DIALOG_ALERT"),
        "missing dialog trace"
    );
    assert!(
        traces.iter().any(|entry| entry.kind == "TIMER_SCHEDULE"),
        "missing timer schedule trace"
    );
    assert!(
        traces.iter().any(|entry| entry.kind == "TIMER_CANCEL"),
        "missing timer cancel trace"
    );

    assert_eq!(
        engine.last_script_dialog_requests(),
        vec![ScriptDialogRequestLiteral::Alert {
            message: "wake up".to_string(),
        }]
    );
    assert_eq!(
        engine.last_script_timer_requests(),
        vec![
            ScriptTimerRequestLiteral::Schedule {
                delay_ms: 25,
                token: Some("otp".to_string()),
            },
            ScriptTimerRequestLiteral::Cancel {
                token: "otp".to_string(),
            },
        ]
    );
}

#[test]
fn wmlbrowser_script_go_fragment_applies_at_post_invocation_boundary() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:nav.wmlsc#main">Script go</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01);
    unit.push(0x00);
    engine.register_script_unit("nav.wmlsc".to_string(), unit);

    engine
        .handle_key("enter".to_string())
        .expect("script go should apply post invocation");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
}

#[test]
fn wmlbrowser_script_prev_applies_post_invocation() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Go next</a>
          </card>
          <card id="next">
            <a href="script:nav.wmlsc#back">Back via script</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("fragment nav should work");
    assert_eq!(engine.active_card_id().expect("active"), "next");

    engine.register_script_unit("nav.wmlsc".to_string(), vec![0x20, 0x04, 0x00, 0x00]);
    engine.register_script_entry_point("nav.wmlsc".to_string(), "back".to_string(), 0);
    engine
        .handle_key("enter".to_string())
        .expect("script prev should apply");
    assert_eq!(engine.active_card_id().expect("active"), "home");
}

#[test]
fn wmlbrowser_navigation_last_call_wins_matrix() {
    let mut engine = WmlEngine::new();
    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #next
    unit.push(0x20);
    unit.push(0x04);
    unit.push(0x00); // prev
    unit.push(0x00);
    let go_prev = unit.clone();

    let mut unit = Vec::new();
    unit.push(0x20);
    unit.push(0x04);
    unit.push(0x00); // prev
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #next
    unit.push(0x00);
    let prev_go = unit.clone();

    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #next
    push_string(&mut unit, "");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go ""
    unit.push(0x00);
    let go_cancel = unit.clone();

    engine.register_script_unit("go_prev.wmlsc".to_string(), go_prev);
    engine.register_script_unit("prev_go.wmlsc".to_string(), prev_go);
    engine.register_script_unit("go_cancel.wmlsc".to_string(), go_cancel);

    let go_prev_outcome = engine.execute_script_ref_internal("go_prev.wmlsc", "main");
    assert!(go_prev_outcome.ok);
    assert_eq!(
        go_prev_outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Prev
    );

    let prev_go_outcome = engine.execute_script_ref_internal("prev_go.wmlsc", "main");
    assert!(prev_go_outcome.ok);
    assert_eq!(
        prev_go_outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Go {
            href: "#next".to_string()
        }
    );

    let go_cancel_outcome = engine.execute_script_ref_internal("go_cancel.wmlsc", "main");
    assert!(go_cancel_outcome.ok);
    assert_eq!(
        go_cancel_outcome.navigation_intent,
        ScriptNavigationIntentLiteral::None
    );
}

#[test]
fn convert_script_call_args_maps_number_to_int_when_whole() {
    let args = vec![
        ScriptCallArgLiteral::Number(7.0),
        ScriptCallArgLiteral::Number(7.5),
        ScriptCallArgLiteral::Bool(true),
        ScriptCallArgLiteral::String("x".to_string()),
        ScriptCallArgLiteral::Invalid { invalid: true },
    ];
    let converted = convert_script_call_args(&args);
    assert_eq!(
        converted,
        vec![
            ScriptValue::Int32(7),
            ScriptValue::Float64(7.5),
            ScriptValue::Bool(true),
            ScriptValue::String("x".to_string()),
            ScriptValue::Invalid
        ]
    );
}

#[test]
fn enter_triggers_accept_do_action_when_no_links_exist() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <do type="accept">
              <go href="script:calc.wmlsc#main"/>
            </do>
            <p>No focusable links on this card.</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit("calc.wmlsc".to_string(), vec![0x01, 2, 0x01, 3, 0x02, 0x00]);

    engine
        .handle_key("enter".to_string())
        .expect("enter should execute accept action script");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
}

#[test]
fn enter_accept_prev_action_navigates_back_when_history_exists() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <do type="accept"><prev/></do>
            <p>Accept should trigger prev.</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");

    engine
        .handle_key("enter".to_string())
        .expect("accept prev should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    let traces = engine.trace_entries();
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_ACCEPT"));
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_PREV"));
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_BACK"));
}

#[test]
fn enter_accept_refresh_action_keeps_current_card_and_history() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <do type="accept"><refresh/></do>
            <p>Accept should refresh without navigation.</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);

    engine
        .handle_key("enter".to_string())
        .expect("accept refresh should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);
    let traces = engine.trace_entries();
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_ACCEPT"));
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_REFRESH"));
}

#[test]
fn enter_accept_noop_action_keeps_current_card_and_history() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <do type="accept"><noop/></do>
            <p>Accept should noop without navigation.</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("accept noop should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_NOOP"]);
}

#[test]
fn fixture_accept_go_trace_order_is_deterministic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_TASK_ACTION_ORDER)
        .expect("task-action fixture should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to accept-go");
    assert_eq!(engine.active_card_id().expect("active card"), "accept-go");

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("accept go should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "target");
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_FRAGMENT"]);
}

#[test]
fn fixture_accept_prev_trace_order_is_deterministic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_TASK_ACTION_ORDER)
        .expect("task-action fixture should load");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-prev link");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to accept-prev");
    assert_eq!(engine.active_card_id().expect("active card"), "accept-prev");

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("accept prev should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_trace_kinds_subsequence(
        &engine,
        &["KEY", "ACTION_ACCEPT", "ACTION_PREV", "ACTION_BACK"],
    );
}

#[test]
fn fixture_accept_refresh_trace_order_is_deterministic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_TASK_ACTION_ORDER)
        .expect("task-action fixture should load");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-prev link");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-refresh link");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to accept-refresh");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "accept-refresh"
    );

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("accept refresh should succeed");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "accept-refresh"
    );
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_REFRESH"]);
}

#[test]
fn fixture_accept_failure_rolls_back_and_trace_order_is_deterministic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_TASK_ACTION_ORDER)
        .expect("task-action fixture should load");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-prev link");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-refresh link");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-broken link");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to accept-broken");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "accept-broken"
    );
    assert_eq!(engine.nav_stack.len(), 1);

    engine.clear_trace_entries();
    let err = engine
        .handle_key("enter".to_string())
        .expect_err("accept go #missing should fail");
    assert!(err.contains("Card id not found"));
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "accept-broken"
    );
    assert_eq!(engine.nav_stack.len(), 1);
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_FRAGMENT"]);
}

#[test]
fn onenterforward_failure_rolls_back_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterforward"><go href="#missing"/></onevent>
            <p>Middle</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let err = engine
        .handle_key("enter".to_string())
        .expect_err("onenterforward failure should bubble");
    assert!(err.contains("Card id not found"));
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);
    assert!(engine.nav_stack.is_empty());
}

#[test]
fn onenterforward_noop_keeps_deterministic_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterforward"><noop/></onevent>
            <p>Middle</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.clear_trace_entries();

    engine
        .handle_key("enter".to_string())
        .expect("onenterforward noop should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_FRAGMENT", "ACTION_NOOP"]);
}

#[test]
fn ontimer_zero_dispatches_immediately_on_card_entry() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="0"/>
            <onevent type="ontimer"><go href="#next"/></onevent>
            <p>Timed card</p>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("fragment nav should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_trace_kinds_subsequence(
        &engine,
        &[
            "ACTION_FRAGMENT",
            "TIMER_START",
            "ACTION_ONTIMER",
            "ACTION_FRAGMENT",
        ],
    );
}

#[test]
fn ontimer_failure_on_entry_rolls_back_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="0"/>
            <onevent type="ontimer"><go href="#missing"/></onevent>
            <p>Timed card</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let err = engine
        .handle_key("enter".to_string())
        .expect_err("ontimer missing fragment should fail");
    assert!(err.contains("Card id not found"));
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert!(engine.nav_stack.is_empty());
}

#[test]
fn timer_non_zero_expires_after_deterministic_advance() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="5"/>
            <onevent type="ontimer"><go href="#next"/></onevent>
            <p>Timed card</p>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("fragment nav should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");

    engine
        .advance_time_ms(400)
        .expect("advance should decrement timer");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    engine
        .advance_time_ms(100)
        .expect("advance should expire timer");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_trace_kinds_subsequence(
        &engine,
        &[
            "TIMER_START",
            "TIMER_TICK",
            "TIMER_TICK",
            "TIMER_EXPIRE",
            "ACTION_ONTIMER",
        ],
    );
}

#[test]
fn timer_large_single_tick_expires_once_for_host_coarse_clock() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="5"/>
            <onevent type="ontimer"><go href="#next"/></onevent>
            <p>Timed card</p>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("fragment nav should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");

    engine
        .advance_time_ms(5_000)
        .expect("coarse tick should expire timer");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    let expire_count_after_first_tick = engine
        .trace_entries()
        .iter()
        .filter(|entry| entry.kind == "TIMER_EXPIRE")
        .count();
    assert_eq!(expire_count_after_first_tick, 1);

    engine
        .advance_time_ms(5_000)
        .expect("further ticks after expiry should no-op");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    let expire_count_after_second_tick = engine
        .trace_entries()
        .iter()
        .filter(|entry| entry.kind == "TIMER_EXPIRE")
        .count();
    assert_eq!(expire_count_after_second_tick, 1);
}

#[test]
fn timer_stops_on_card_exit() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="10"/>
            <onevent type="ontimer"><go href="#timer-target"/></onevent>
            <a href="#manual-next">Manual next</a>
          </card>
          <card id="manual-next"><p>Manual next</p></card>
          <card id="timer-target"><p>Timer target</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to timed");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate to manual-next");
    assert_eq!(engine.active_card_id().expect("active card"), "manual-next");

    engine
        .advance_time_ms(5_000)
        .expect("advance with stopped timer should no-op");
    assert_eq!(engine.active_card_id().expect("active card"), "manual-next");
    assert!(
        !engine
            .trace_entries()
            .iter()
            .any(|entry| entry.kind == "ACTION_ONTIMER"
                && entry.active_card_id.as_deref() == Some("timer-target")),
        "timer should not fire after card exit"
    );
}

#[test]
fn timer_refresh_resumes_remaining_time() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="5"/>
            <onevent type="ontimer"><go href="#next"/></onevent>
            <do type="accept"><refresh/></do>
            <p>Refresh should resume timer.</p>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to timed");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");

    engine.advance_time_ms(300).expect("advance should work");
    engine
        .handle_key("enter".to_string())
        .expect("accept refresh should resume timer");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    engine.advance_time_ms(100).expect("advance should work");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    engine
        .advance_time_ms(100)
        .expect("remaining timer should expire");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_trace_kinds_subsequence(
        &engine,
        &[
            "TIMER_START",
            "TIMER_TICK",
            "ACTION_ACCEPT",
            "ACTION_REFRESH",
            "TIMER_RESUME",
            "TIMER_TICK",
            "TIMER_TICK",
            "TIMER_EXPIRE",
            "ACTION_ONTIMER",
        ],
    );
}

#[test]
fn navigate_runs_onenterforward_action() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterforward">
              <go href="#next"/>
            </onevent>
            <p>Middle</p>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate and run onenterforward");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
}

#[test]
fn navigate_back_runs_onenterbackward_action() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterbackward">
              <go href="#rewind"/>
            </onevent>
            <a href="#next">To next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
          <card id="rewind">
            <p>Rewind</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    engine
        .handle_key("enter".to_string())
        .expect("middle enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");

    let handled = engine.navigate_back();
    assert!(handled, "back should pop existing history entry");
    assert_eq!(engine.active_card_id().expect("active card"), "rewind");
    let traces = engine.trace_entries();
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_BACK"));
    assert!(traces
        .iter()
        .any(|entry| entry.kind == "ACTION_FRAGMENT" && entry.detail == "rewind"));
}

#[test]
fn navigate_back_runs_onenterbackward_prev_action() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterbackward"><prev/></onevent>
            <a href="#next">To next</a>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    engine
        .handle_key("enter".to_string())
        .expect("middle enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");

    assert!(engine.navigate_back(), "back should pop next -> mid");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "home",
        "mid onenterbackward prev should immediately rewind one more entry"
    );
}

#[test]
fn onenterbackward_failure_rolls_back_back_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterbackward"><go href="#missing"/></onevent>
            <a href="#next">To next</a>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    engine
        .handle_key("enter".to_string())
        .expect("middle enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(engine.nav_stack.len(), 2);

    let handled = engine.navigate_back();
    assert!(handled, "back should report handled when history exists");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "next",
        "failed onenterbackward action should roll back back-navigation state"
    );
    assert_eq!(engine.nav_stack.len(), 2);
    let traces = engine.trace_entries();
    assert!(traces
        .iter()
        .any(|entry| entry.kind == "ACTION_ONENTERBACKWARD_ERROR"));
}

#[test]
fn navigate_back_runs_onenterbackward_script_action() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterbackward">
              <go href="script:nav.wmlsc#main"/>
            </onevent>
            <a href="#next">To next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
          <card id="rewind">
            <p>Rewind</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "#rewind");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #rewind
    unit.push(0x00); // halt
    engine.register_script_unit("nav.wmlsc".to_string(), unit);

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    engine
        .handle_key("enter".to_string())
        .expect("middle enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");

    let handled = engine.navigate_back();
    assert!(handled, "back should pop existing history entry");
    assert_eq!(engine.active_card_id().expect("active card"), "rewind");
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
    let traces = engine.trace_entries();
    assert!(traces
        .iter()
        .any(|entry| entry.kind == "ACTION_SCRIPT" && entry.detail == "nav.wmlsc#main"));
    assert!(traces.iter().any(
        |entry| entry.kind == "SCRIPT_OK" && entry.active_card_id.as_deref() == Some("rewind")
    ));
}

#[test]
fn navigate_back_onenterbackward_script_navigation_last_call_wins() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid-go-prev">Flow A</a>
            <a href="#mid-prev-go">Flow B</a>
          </card>
          <card id="mid-go-prev">
            <onevent type="onenterbackward">
              <go href="script:nav.wmlsc#goThenPrev"/>
            </onevent>
            <a href="#next-a">To next-a</a>
          </card>
          <card id="mid-prev-go">
            <onevent type="onenterbackward">
              <go href="script:nav.wmlsc#prevThenGo"/>
            </onevent>
            <a href="#next-b">To next-b</a>
          </card>
          <card id="next-a"><p>Next A</p></card>
          <card id="next-b"><p>Next B</p></card>
          <card id="rewind"><p>Rewind</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    let go_then_prev_pc = unit.len();
    push_string(&mut unit, "#rewind");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #rewind
    unit.push(0x20);
    unit.push(0x04);
    unit.push(0x00); // prev
    unit.push(0x00); // halt
    let prev_then_go_pc = unit.len();
    unit.push(0x20);
    unit.push(0x04);
    unit.push(0x00); // prev
    push_string(&mut unit, "#rewind");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #rewind
    unit.push(0x00); // halt
    engine.register_script_unit("nav.wmlsc".to_string(), unit);
    engine.register_script_entry_point(
        "nav.wmlsc".to_string(),
        "goThenPrev".to_string(),
        go_then_prev_pc,
    );
    engine.register_script_entry_point(
        "nav.wmlsc".to_string(),
        "prevThenGo".to_string(),
        prev_then_go_pc,
    );

    engine
        .handle_key("enter".to_string())
        .expect("flow A should enter mid-go-prev");
    engine
        .handle_key("enter".to_string())
        .expect("flow A should enter next-a");
    assert_eq!(engine.active_card_id().expect("active card"), "next-a");
    assert!(engine.navigate_back(), "flow A back should be handled");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "home",
        "goThenPrev should resolve to prev at invocation boundary"
    );

    engine
        .handle_key("down".to_string())
        .expect("move focus to flow B link");
    engine
        .handle_key("enter".to_string())
        .expect("flow B should enter mid-prev-go");
    engine
        .handle_key("enter".to_string())
        .expect("flow B should enter next-b");
    assert_eq!(engine.active_card_id().expect("active card"), "next-b");
    assert!(engine.navigate_back(), "flow B back should be handled");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "rewind",
        "prevThenGo should resolve to go at invocation boundary"
    );
}

#[test]
fn navigate_back_restores_previous_card() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate");
    assert_eq!(engine.active_card_id().expect("active card"), "next");

    let handled = engine.navigate_back();
    assert!(handled, "back should pop existing history entry");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);
}

#[test]
fn navigate_back_returns_false_when_history_empty() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
        )
        .expect("deck should load");

    let handled = engine.navigate_back();
    assert!(!handled, "back should report false with empty history");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}

#[test]
fn trace_entries_record_key_and_actions() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate");

    assert!(!engine.trace_entries.is_empty());
    assert!(
        engine.trace_entries.iter().any(|entry| entry.kind == "KEY"),
        "expected KEY trace entry"
    );
    assert!(
        engine
            .trace_entries
            .iter()
            .any(|entry| entry.kind == "ACTION_FRAGMENT"),
        "expected ACTION_FRAGMENT trace entry"
    );
}

#[test]
fn trace_entries_include_script_error_taxonomy_for_non_fatal() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:nonfatal.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit(
        "nonfatal.wmlsc".to_string(),
        vec![0x03, 1, b'x', 0x01, 1, 0x02, 0x00],
    );

    engine
        .handle_key("enter".to_string())
        .expect("non-fatal script should not abort action handling");

    let script_ok = engine
        .trace_entries
        .iter()
        .find(|entry| entry.kind == "SCRIPT_OK")
        .expect("SCRIPT_OK trace should be present");
    assert_eq!(script_ok.script_ok, Some(true));
    assert_eq!(
        script_ok.script_error_class,
        Some(ScriptErrorClassLiteral::NonFatal)
    );
    assert_eq!(
        script_ok.script_error_category,
        Some(ScriptErrorCategoryLiteral::Computational)
    );
}

#[test]
fn trace_entries_include_script_error_taxonomy_for_fatal() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:fatal.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit("fatal.wmlsc".to_string(), vec![0xff]);

    let err = engine
        .handle_key_internal("enter")
        .expect_err("fatal decode error should abort action handling");
    assert!(err.contains("unsupported opcode"));

    let script_trap = engine
        .trace_entries
        .iter()
        .find(|entry| entry.kind == "SCRIPT_TRAP")
        .expect("SCRIPT_TRAP trace should be present");
    assert_eq!(script_trap.script_ok, Some(false));
    assert_eq!(
        script_trap.script_error_class,
        Some(ScriptErrorClassLiteral::Fatal)
    );
    assert_eq!(
        script_trap.script_error_category,
        Some(ScriptErrorCategoryLiteral::Integrity)
    );
}

#[test]
fn clear_trace_entries_resets_trace_state() {
    let mut engine = WmlEngine::new();
    engine.push_trace("TEST", "x".to_string());
    assert!(!engine.trace_entries.is_empty());

    engine.clear_trace_entries();
    assert!(engine.trace_entries.is_empty());
    assert_eq!(engine.next_trace_seq, 1);
}

#[test]
fn phase_a_basic_two_card_fixture_snapshot_and_navigation() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_BASIC_TWO_CARD)
        .expect("fixture should load");
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Welcome".to_string(),
            "link:0:1:focused=true:href=#next:text=Go next".to_string(),
        ]
    );

    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Second card".to_string(),
            "link:0:1:focused=true:href=#home:text=Back home".to_string(),
        ]
    );
}

#[test]
fn phase_a_mixed_inline_text_links_fixture_preserves_source_order() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_MIXED_INLINE_TEXT_LINKS)
        .expect("fixture should load");

    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Hello".to_string(),
            "link:0:1:focused=true:href=#next:text=Next".to_string(),
            "text:0:2:and".to_string(),
            "link:0:3:focused=false:href=#final:text=Final".to_string(),
        ]
    );

    engine
        .handle_key("down".to_string())
        .expect("down should move focus to second link");
    assert_eq!(engine.focused_link_index(), 1);
}

#[test]
fn phase_a_link_wrap_fixture_snapshots_widths_and_focus_stability() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_LINK_WRAP)
        .expect("fixture should load");

    engine.set_viewport_cols(16);
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:abcdefghijklmnop".to_string(),
            "text:0:1:qrstuvwx".to_string(),
            "link:0:2:focused=true:href=#one:text=abcdefghijklmnop".to_string(),
            "link:0:3:focused=true:href=#one:text=qrstuvwx".to_string(),
            "link:0:4:focused=false:href=#two:text=short".to_string(),
        ]
    );

    engine.set_viewport_cols(20);
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:abcdefghijklmnopqrst".to_string(),
            "text:0:1:uvwx".to_string(),
            "link:0:2:focused=true:href=#one:text=abcdefghijklmnopqrst".to_string(),
            "link:0:3:focused=true:href=#one:text=uvwx".to_string(),
            "link:0:4:focused=false:href=#two:text=short".to_string(),
        ]
    );

    engine.set_viewport_cols(24);
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:abcdefghijklmnopqrstuvwx".to_string(),
            "link:0:1:focused=true:href=#one:text=abcdefghijklmnopqrstuvwx".to_string(),
            "link:0:2:focused=false:href=#two:text=short".to_string(),
        ]
    );

    engine.set_viewport_cols(8);
    engine
        .handle_key("down".to_string())
        .expect("down should move focus to second logical link");
    assert_eq!(engine.focused_link_index(), 1);
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:abcdefgh".to_string(),
            "text:0:1:ijklmnop".to_string(),
            "text:0:2:qrstuvwx".to_string(),
            "link:0:3:focused=false:href=#one:text=abcdefgh".to_string(),
            "link:0:4:focused=false:href=#one:text=ijklmnop".to_string(),
            "link:0:5:focused=false:href=#one:text=qrstuvwx".to_string(),
            "link:0:6:focused=true:href=#two:text=short".to_string(),
        ]
    );
}

#[test]
fn phase_a_missing_fragment_fixture_keeps_runtime_state_stable() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_MISSING_FRAGMENT)
        .expect("fixture should load");
    assert_eq!(
        render_snapshot_lines(&engine),
        vec![
            "text:0:0:Missing fragment".to_string(),
            "text:0:1:check".to_string(),
            "link:0:2:focused=true:href=#missing:text=Broken".to_string(),
        ]
    );

    let err = engine
        .handle_key_internal("enter")
        .expect_err("missing fragment must return error");
    assert!(
        err.contains("Card id not found"),
        "unexpected missing fragment error: {err}"
    );
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);
}

#[test]
fn m1_02_load_deck_context_public_api_sets_metadata_and_state() {
    let mut engine = WmlEngine::new();

    engine
        .load_deck_context(
            SAMPLE,
            "http://example.test/decks/start.wml",
            "application/vnd.wap.xhtml+xml",
            Some("AAECAw==".to_string()),
        )
        .expect("loadDeckContext should succeed");

    assert_eq!(engine.base_url(), "http://example.test/decks/start.wml");
    assert_eq!(engine.content_type(), "application/vnd.wap.xhtml+xml");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);

    let trace = engine.trace_entries();
    assert!(!trace.is_empty(), "trace should contain LOAD_DECK entry");
    assert_eq!(trace[0].kind, "LOAD_DECK");
}

#[test]
fn m1_02_handle_key_render_and_navigate_back_public_api_flow() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_BASIC_TWO_CARD)
        .expect("fixture should load");

    let initial_render = engine.render().expect("initial render");
    assert_eq!(initial_render.draw.len(), 2);
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);

    engine
        .handle_key("enter".to_string())
        .expect("enter should follow fragment");
    let after_enter_render = engine.render().expect("render after enter");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert!(!after_enter_render.draw.is_empty());

    assert!(engine.navigate_back(), "navigateBack should pop history");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);
    assert!(
        !engine.navigate_back(),
        "navigateBack should be false when empty"
    );
}

#[test]
fn m1_02_script_invocation_public_outcome_regression() {
    let mut engine = WmlEngine::new();
    engine.load_deck(SAMPLE).expect("sample deck should load");
    engine.register_script_unit("noop.wmlsc".to_string(), vec![0x00]);

    let invocation = engine
        .invoke_script_ref("noop.wmlsc".to_string())
        .expect("invokeScriptRef should succeed");
    assert_eq!(
        invocation.navigation_intent,
        ScriptNavigationIntentLiteral::None
    );
    assert!(!invocation.requires_refresh);
    assert_eq!(invocation.result, ScriptValueLiteral::String(String::new()));

    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
    assert_eq!(
        engine.last_script_execution_error_class(),
        Some("none".to_string())
    );
    assert_eq!(
        engine.last_script_execution_error_category(),
        Some("none".to_string())
    );
}

#[test]
fn m1_02_load_deck_and_load_deck_context_have_matching_runtime_behavior() {
    let mut engine_compat = WmlEngine::new();
    let mut engine_context = WmlEngine::new();

    engine_compat
        .load_deck(FIXTURE_MIXED_INLINE_TEXT_LINKS)
        .expect("loadDeck path should succeed");
    engine_context
        .load_deck_context(
            FIXTURE_MIXED_INLINE_TEXT_LINKS,
            "http://example.test/fixture.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("loadDeckContext path should succeed");

    assert_eq!(
        render_snapshot_lines(&engine_compat),
        render_snapshot_lines(&engine_context)
    );
    assert_eq!(
        engine_compat.active_card_id().expect("active card"),
        engine_context.active_card_id().expect("active card")
    );
    assert_eq!(
        engine_compat.focused_link_index(),
        engine_context.focused_link_index()
    );

    engine_compat
        .handle_key("down".to_string())
        .expect("down should move focus in compat path");
    engine_context
        .handle_key("down".to_string())
        .expect("down should move focus in context path");
    assert_eq!(
        render_snapshot_lines(&engine_compat),
        render_snapshot_lines(&engine_context)
    );
    assert_eq!(
        engine_compat.focused_link_index(),
        engine_context.focused_link_index()
    );

    engine_compat
        .handle_key("enter".to_string())
        .expect("enter should navigate in compat path");
    engine_context
        .handle_key("enter".to_string())
        .expect("enter should navigate in context path");
    assert_eq!(
        engine_compat.active_card_id().expect("active card"),
        engine_context.active_card_id().expect("active card")
    );
    assert_eq!(
        render_snapshot_lines(&engine_compat),
        render_snapshot_lines(&engine_context)
    );

    assert_eq!(
        engine_compat.navigate_back(),
        engine_context.navigate_back()
    );
    assert_eq!(
        engine_compat.active_card_id().expect("active card"),
        engine_context.active_card_id().expect("active card")
    );
    assert_eq!(
        render_snapshot_lines(&engine_compat),
        render_snapshot_lines(&engine_context)
    );
}

#[test]
fn m1_02_invoke_script_ref_missing_unit_has_stable_error_surface() {
    let mut engine = WmlEngine::new();
    engine.load_deck(SAMPLE).expect("sample deck should load");

    let err = engine
        .invoke_script_ref("missing.wmlsc".to_string())
        .expect_err("missing unit should return invocation error");
    assert!(
        err.contains("script unit not registered"),
        "unexpected invocation error: {err}"
    );

    assert_eq!(engine.last_script_execution_ok(), Some(false));
    assert_eq!(
        engine.last_script_execution_error_class(),
        Some("fatal".to_string())
    );
    assert_eq!(
        engine.last_script_execution_error_category(),
        Some("host-binding".to_string())
    );
    assert!(engine
        .last_script_execution_trap()
        .expect("trap should be present")
        .contains("script unit not registered"));
}
