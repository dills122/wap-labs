use super::{
    classify_vm_trap, classify_vm_trap_category, convert_script_call_args, parse_script_href,
    ParsedScriptRef, ScriptCallArgLiteral, ScriptDialogRequestLiteral, ScriptErrorCategoryLiteral,
    ScriptErrorClassLiteral, ScriptNavigationIntentLiteral, ScriptTimerRequestLiteral,
    ScriptValueLiteral, WmlEngine, MAX_DECK_RAW_BYTES_BASE64_BYTES, MAX_DECK_WML_XML_BYTES,
    MAX_TRACE_ENTRIES,
};
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
    include_str!("../../tests/fixtures/field/openwave-2011-example-01-navigation.wml");
const FIXTURE_BASIC_TWO_CARD: &str =
    include_str!("../../tests/fixtures/phase-a/basic-two-card.wml");
const FIXTURE_MIXED_INLINE_TEXT_LINKS: &str =
    include_str!("../../tests/fixtures/phase-a/mixed-inline-text-links.wml");
const FIXTURE_LINK_WRAP: &str = include_str!("../../tests/fixtures/phase-a/link-wrap.wml");
const FIXTURE_MISSING_FRAGMENT: &str =
    include_str!("../../tests/fixtures/phase-a/missing-fragment.wml");
const FIXTURE_TASK_ACTION_ORDER: &str =
    include_str!("../../tests/fixtures/phase-a/task-action-order.wml");

fn render_snapshot_lines(engine: &WmlEngine) -> Vec<String> {
    engine
        .render()
        .expect("render should succeed for snapshot")
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

mod actions_timers;
mod navigation_metadata;
mod script_runtime;
mod traces_public_api;
