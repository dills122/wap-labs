use crate::runtime::events::ScriptRuntimeEffects;
use crate::wavescript::value::ScriptValue;
use crate::wavescript::vm::{VmHost, VmTrap};
use std::collections::HashMap;

pub const WMLBROWSER_GET_VAR: u8 = 0x01;
pub const WMLBROWSER_SET_VAR: u8 = 0x02;
pub const WMLBROWSER_GO: u8 = 0x03;
pub const WMLBROWSER_PREV: u8 = 0x04;

pub struct WmlBrowserHost<'a> {
    vars: &'a mut HashMap<String, String>,
    effects: &'a mut ScriptRuntimeEffects,
}

impl<'a> WmlBrowserHost<'a> {
    pub fn new(
        vars: &'a mut HashMap<String, String>,
        effects: &'a mut ScriptRuntimeEffects,
    ) -> Self {
        Self { vars, effects }
    }

    fn get_var(&self, args: &[ScriptValue]) -> ScriptValue {
        let Some(name) = args.first() else {
            return ScriptValue::Invalid;
        };
        let Some(name) = normalize_var_name(name) else {
            return ScriptValue::Invalid;
        };

        ScriptValue::String(self.vars.get(&name).cloned().unwrap_or_default())
    }

    fn set_var(&mut self, args: &[ScriptValue]) -> ScriptValue {
        if args.len() < 2 {
            return ScriptValue::Invalid;
        }
        let Some(name) = normalize_var_name(&args[0]) else {
            return ScriptValue::Invalid;
        };

        let value = coerce_to_string(&args[1]);
        self.vars.insert(name, value);
        self.effects.mark_refresh_required();
        ScriptValue::Bool(true)
    }

    fn go(&mut self, args: &[ScriptValue]) -> ScriptValue {
        let Some(href) = args.first() else {
            return ScriptValue::Invalid;
        };

        self.effects.request_go(coerce_to_string(href));
        ScriptValue::Bool(true)
    }

    fn prev(&mut self) -> ScriptValue {
        self.effects.request_prev();
        ScriptValue::Bool(true)
    }
}

impl VmHost for WmlBrowserHost<'_> {
    fn call(&mut self, function_id: u8, args: &[ScriptValue]) -> Result<ScriptValue, VmTrap> {
        let result = match function_id {
            WMLBROWSER_GET_VAR => self.get_var(args),
            WMLBROWSER_SET_VAR => self.set_var(args),
            WMLBROWSER_GO => self.go(args),
            WMLBROWSER_PREV => self.prev(),
            _ => {
                return Err(VmTrap::HostCallError {
                    function_id,
                    message: "wmlbrowser: unknown function".to_string(),
                })
            }
        };

        Ok(result)
    }
}

pub fn coerce_to_string(value: &ScriptValue) -> String {
    match value {
        ScriptValue::Bool(value) => {
            if *value {
                "true".to_string()
            } else {
                "false".to_string()
            }
        }
        ScriptValue::Int32(value) => value.to_string(),
        ScriptValue::Float64(value) => {
            if value.is_nan() {
                "NaN".to_string()
            } else if value.is_infinite() && value.is_sign_positive() {
                "Infinity".to_string()
            } else if value.is_infinite() {
                "-Infinity".to_string()
            } else {
                value.to_string()
            }
        }
        ScriptValue::String(value) => value.clone(),
        ScriptValue::Invalid => String::new(),
    }
}

fn normalize_var_name(value: &ScriptValue) -> Option<String> {
    let raw = coerce_to_string(value);
    if raw.is_empty() {
        return None;
    }

    let mut chars = raw.chars();
    let first = chars.next()?;
    if !is_valid_var_first_char(first) {
        return None;
    }

    if !chars.all(is_valid_var_char) {
        return None;
    }

    Some(raw)
}

fn is_valid_var_first_char(ch: char) -> bool {
    ch.is_ascii_alphabetic() || ch == '_'
}

fn is_valid_var_char(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_' || ch == '.' || ch == '-'
}

#[cfg(test)]
mod tests {
    use super::{
        coerce_to_string, WmlBrowserHost, WMLBROWSER_GET_VAR, WMLBROWSER_GO, WMLBROWSER_PREV,
        WMLBROWSER_SET_VAR,
    };
    use crate::runtime::events::{ScriptNavigationIntent, ScriptRuntimeEffects};
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
}
