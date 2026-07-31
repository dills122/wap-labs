use serde_json::json;

use crate::{
    DrawCmd, EngineInputEvent, EngineInputKey, EngineTraceEntry, RenderList,
    ScriptErrorCategoryLiteral, ScriptErrorClassLiteral, ScriptExecutionOutcome,
    ScriptInvocationOutcome, ScriptNavigationIntentLiteral, ScriptValueLiteral, WmlEngine,
};

#[test]
fn wml_309_frame_and_input_contracts_keep_stable_serialized_shapes() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r##"<wml><card id="home"><do name="open" type="accept" label="Open"><go href="#next"/></do><p>Home</p></card><card id="next"><p>Next</p></card></wml>"##,
            "http://example.test/frame.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("fixture deck should load");
    let frame = engine.render_frame().expect("frame should render");

    assert_eq!(
        serde_json::to_value(&frame).expect("frame should serialize"),
        json!({
            "contractVersion": 2,
            "frameId": frame.frame_id,
            "profileId": "class-c-reference",
            "viewport": { "cols": 20 },
            "deck": {
                "baseUrl": "http://example.test/frame.wml",
                "contentType": "text/vnd.wap.wml",
                "language": null
            },
            "card": { "id": "home", "language": null },
            "rows": [{
                "index": 0,
                "segments": [{ "type": "text", "x": 0, "text": "Home" }]
            }],
            "hitRegions": [],
            "focus": null,
            "selection": { "type": "none" },
            "affordances": [{
                "actionId": "do:open",
                "label": "Open",
                "enabled": true,
                "source": "card-do",
                "control": "primary",
                "doName": "open",
                "doType": "accept"
            }],
            "backAvailable": false
        })
    );
    assert_eq!(
        serde_json::to_value(EngineInputEvent::Key {
            key: EngineInputKey::Enter
        })
        .expect("key input should serialize"),
        json!({ "type": "key", "key": "enter" })
    );
    assert_eq!(
        serde_json::to_value(EngineInputEvent::ActivateAction {
            frame_id: "0123456789abcdef".to_string(),
            action_id: "do:open".to_string()
        })
        .expect("action input should serialize"),
        json!({
            "type": "activate-action",
            "frameId": "0123456789abcdef",
            "actionId": "do:open"
        })
    );
    assert_eq!(
        serde_json::to_value(EngineInputEvent::Click {
            frame_id: "0123456789abcdef".to_string(),
            x: 7,
            y: 3
        })
        .expect("click input should serialize"),
        json!({
            "type": "click",
            "frameId": "0123456789abcdef",
            "x": 7,
            "y": 3
        })
    );
}

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
