use serde_json::json;

use crate::{
    DrawCmd, EngineTraceEntry, RenderList, ScriptErrorCategoryLiteral, ScriptErrorClassLiteral,
    ScriptExecutionOutcome, ScriptInvocationOutcome, ScriptNavigationIntentLiteral,
    ScriptValueLiteral,
};

#[test]
fn script_outcomes_serialize_flat_effect_fields() {
    let execution = ScriptExecutionOutcome::fatal(
        "decode: empty compilation unit".to_string(),
        ScriptErrorCategoryLiteral::Integrity,
    );
    let invocation = ScriptInvocationOutcome {
        navigation_intent: ScriptNavigationIntentLiteral::Go {
            href: "#next".to_string(),
        },
        requires_refresh: true,
        result: ScriptValueLiteral::String("ok".to_string()),
    };

    assert_eq!(
        serde_json::to_value(execution).expect("execution outcome should serialize"),
        json!({
            "ok": false,
            "result": { "invalid": true },
            "trap": "decode: empty compilation unit",
            "errorClass": "fatal",
            "errorCategory": "integrity",
            "invocationAborted": true,
            "navigationIntent": { "type": "none" },
            "requiresRefresh": false
        })
    );
    assert_eq!(
        serde_json::to_value(invocation).expect("invocation outcome should serialize"),
        json!({
            "navigationIntent": { "type": "go", "href": "#next" },
            "requiresRefresh": true,
            "result": "ok"
        })
    );
}

#[test]
fn render_error_and_trace_fixtures_keep_stable_serialized_shapes() {
    let render = RenderList {
        draw: vec![
            DrawCmd::Text {
                x: 0,
                y: 0,
                text: "Status".to_string(),
            },
            DrawCmd::Link {
                x: 0,
                y: 1,
                text: "Next".to_string(),
                focused: true,
                href: "#next".to_string(),
            },
        ],
    };
    let trace = EngineTraceEntry {
        seq: 7,
        kind: "SCRIPT_TRAP".to_string(),
        detail: "decode failed".to_string(),
        active_card_id: Some("home".to_string()),
        focused_link_index: 0,
        external_navigation_intent: None,
        script_ok: Some(false),
        script_error_class: Some(ScriptErrorClassLiteral::Fatal),
        script_error_category: Some(ScriptErrorCategoryLiteral::Integrity),
        script_trap: Some("decode: empty compilation unit".to_string()),
    };

    assert_eq!(
        serde_json::to_value(render).expect("render list should serialize"),
        json!({
            "draw": [
                { "type": "text", "x": 0, "y": 0, "text": "Status" },
                {
                    "type": "link",
                    "x": 0,
                    "y": 1,
                    "text": "Next",
                    "focused": true,
                    "href": "#next"
                }
            ]
        })
    );
    assert_eq!(
        serde_json::to_value(trace).expect("trace entry should serialize"),
        json!({
            "seq": 7,
            "kind": "SCRIPT_TRAP",
            "detail": "decode failed",
            "active_card_id": "home",
            "focused_link_index": 0,
            "external_navigation_intent": null,
            "script_ok": false,
            "script_error_class": "fatal",
            "script_error_category": "integrity",
            "script_trap": "decode: empty compilation unit"
        })
    );
}
