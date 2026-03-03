use super::{
    coerce_to_string, WmlBrowserHost, WMLBROWSER_ALERT, WMLBROWSER_CLEAR_TIMER, WMLBROWSER_CONFIRM,
    WMLBROWSER_GET_VAR, WMLBROWSER_GO, WMLBROWSER_PREV, WMLBROWSER_PROMPT, WMLBROWSER_SET_TIMER,
    WMLBROWSER_SET_VAR,
};
use crate::runtime::events::{
    ScriptDialogRequest, ScriptNavigationIntent, ScriptRuntimeEffects, ScriptTimerRequest,
};
use crate::wavescript::value::ScriptValue;
use crate::wavescript::vm::VmHost;
use std::collections::HashMap;

#[test]
fn set_and_get_var_roundtrip() {
    let mut vars = HashMap::new();
    let mut effects = ScriptRuntimeEffects::default();
    let mut host = WmlBrowserHost::new(&mut vars, &mut effects);

    let set = host
        .call(
            WMLBROWSER_SET_VAR,
            &[
                ScriptValue::String("score".to_string()),
                ScriptValue::Int32(7),
            ],
        )
        .expect("setVar should not trap");
    assert_eq!(set, ScriptValue::Bool(true));

    let value = host
        .call(
            WMLBROWSER_GET_VAR,
            &[ScriptValue::String("score".to_string())],
        )
        .expect("getVar should not trap");
    assert_eq!(value, ScriptValue::String("7".to_string()));
}

#[test]
fn invalid_var_name_does_not_mutate_store() {
    let mut vars = HashMap::new();
    let mut effects = ScriptRuntimeEffects::default();
    {
        let mut host = WmlBrowserHost::new(&mut vars, &mut effects);
        let result = host
            .call(
                WMLBROWSER_SET_VAR,
                &[
                    ScriptValue::String("9bad".to_string()),
                    ScriptValue::String("x".to_string()),
                ],
            )
            .expect("setVar should return invalid, not trap");

        assert_eq!(result, ScriptValue::Invalid);
        assert!(
            host.call(
                WMLBROWSER_GET_VAR,
                &[ScriptValue::String("9bad".to_string())]
            )
            .expect("getVar should not trap")
                == ScriptValue::Invalid
        );
    }
    assert!(!effects.requires_refresh());
}

#[test]
fn go_and_prev_update_deferred_navigation_intent() {
    let mut vars = HashMap::new();
    let mut effects = ScriptRuntimeEffects::default();
    {
        let mut host = WmlBrowserHost::new(&mut vars, &mut effects);
        host.call(WMLBROWSER_GO, &[ScriptValue::String("#next".to_string())])
            .expect("go should not trap");
    }
    assert_eq!(
        effects.navigation_intent(),
        &ScriptNavigationIntent::Go("#next".to_string())
    );

    {
        let mut host = WmlBrowserHost::new(&mut vars, &mut effects);
        host.call(WMLBROWSER_PREV, &[])
            .expect("prev should not trap");
    }
    assert_eq!(effects.navigation_intent(), &ScriptNavigationIntent::Prev);

    {
        let mut host = WmlBrowserHost::new(&mut vars, &mut effects);
        host.call(WMLBROWSER_GO, &[ScriptValue::String(String::new())])
            .expect("go empty should not trap");
    }
    assert_eq!(effects.navigation_intent(), &ScriptNavigationIntent::None);
}

#[test]
fn set_var_marks_refresh_required() {
    let mut vars = HashMap::new();
    let mut effects = ScriptRuntimeEffects::default();
    let mut host = WmlBrowserHost::new(&mut vars, &mut effects);

    host.call(
        WMLBROWSER_SET_VAR,
        &[
            ScriptValue::String("name".to_string()),
            ScriptValue::String("alice".to_string()),
        ],
    )
    .expect("setVar should not trap");

    assert!(effects.requires_refresh());
}

#[test]
fn string_coercion_is_deterministic_for_scalars() {
    assert_eq!(coerce_to_string(&ScriptValue::Bool(true)), "true");
    assert_eq!(coerce_to_string(&ScriptValue::Bool(false)), "false");
    assert_eq!(coerce_to_string(&ScriptValue::Int32(-3)), "-3");
    assert_eq!(coerce_to_string(&ScriptValue::Float64(1.5)), "1.5");
    assert_eq!(coerce_to_string(&ScriptValue::Invalid), "");
}

#[test]
fn oversized_setvar_value_is_rejected_without_mutation() {
    let mut vars = HashMap::new();
    let mut effects = ScriptRuntimeEffects::default();
    let mut host = WmlBrowserHost::new(&mut vars, &mut effects);
    let oversized = "x".repeat(super::MAX_VAR_VALUE_BYTES + 1);

    let result = host
        .call(
            WMLBROWSER_SET_VAR,
            &[
                ScriptValue::String("safe".to_string()),
                ScriptValue::String(oversized),
            ],
        )
        .expect("setVar should return invalid, not trap");

    assert_eq!(result, ScriptValue::Invalid);
    assert_eq!(
        host.call(
            WMLBROWSER_GET_VAR,
            &[ScriptValue::String("safe".to_string())]
        )
        .expect("getVar should not trap"),
        ScriptValue::String(String::new())
    );
    assert!(!effects.requires_refresh());
}

#[test]
fn dialog_calls_record_requests_with_deterministic_return_values() {
    let mut vars = HashMap::new();
    let mut effects = ScriptRuntimeEffects::default();
    let mut host = WmlBrowserHost::new(&mut vars, &mut effects);

    let alert = host
        .call(
            WMLBROWSER_ALERT,
            &[ScriptValue::String("hello".to_string())],
        )
        .expect("alert should not trap");
    let confirm = host
        .call(
            WMLBROWSER_CONFIRM,
            &[ScriptValue::String("continue?".to_string())],
        )
        .expect("confirm should not trap");
    let prompt = host
        .call(
            WMLBROWSER_PROMPT,
            &[
                ScriptValue::String("name".to_string()),
                ScriptValue::String("guest".to_string()),
            ],
        )
        .expect("prompt should not trap");

    assert_eq!(alert, ScriptValue::Bool(true));
    assert_eq!(confirm, ScriptValue::Bool(false));
    assert_eq!(prompt, ScriptValue::String("guest".to_string()));
    assert_eq!(
        effects.dialog_requests(),
        &[
            ScriptDialogRequest::Alert {
                message: "hello".to_string()
            },
            ScriptDialogRequest::Confirm {
                message: "continue?".to_string()
            },
            ScriptDialogRequest::Prompt {
                message: "name".to_string(),
                default_value: Some("guest".to_string())
            },
        ]
    );
}

#[test]
fn timer_calls_record_schedule_and_cancel_requests() {
    let mut vars = HashMap::new();
    let mut effects = ScriptRuntimeEffects::default();
    let mut host = WmlBrowserHost::new(&mut vars, &mut effects);

    let scheduled = host
        .call(
            WMLBROWSER_SET_TIMER,
            &[
                ScriptValue::Int32(250),
                ScriptValue::String("otp".to_string()),
            ],
        )
        .expect("set timer should not trap");
    let cancelled = host
        .call(
            WMLBROWSER_CLEAR_TIMER,
            &[ScriptValue::String("otp".to_string())],
        )
        .expect("clear timer should not trap");

    assert_eq!(scheduled, ScriptValue::Bool(true));
    assert_eq!(cancelled, ScriptValue::Bool(true));
    assert_eq!(
        effects.timer_requests(),
        &[
            ScriptTimerRequest::Schedule {
                delay_ms: 250,
                token: Some("otp".to_string())
            },
            ScriptTimerRequest::Cancel {
                token: "otp".to_string()
            },
        ]
    );
}

#[test]
fn timer_schedule_rejects_negative_or_invalid_delay() {
    let mut vars = HashMap::new();
    let mut effects = ScriptRuntimeEffects::default();
    let mut host = WmlBrowserHost::new(&mut vars, &mut effects);

    let negative = host
        .call(WMLBROWSER_SET_TIMER, &[ScriptValue::Int32(-1)])
        .expect("invalid set timer should not trap");
    let invalid_type = host
        .call(
            WMLBROWSER_SET_TIMER,
            &[ScriptValue::String("later".to_string())],
        )
        .expect("invalid set timer should not trap");

    assert_eq!(negative, ScriptValue::Invalid);
    assert_eq!(invalid_type, ScriptValue::Invalid);
    assert!(effects.timer_requests().is_empty());
}
