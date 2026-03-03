use crate::runtime::events::ScriptRuntimeEffects;
use crate::wavescript::stdlib::dialogs::{default_confirm_result, default_prompt_result};
use crate::wavescript::value::ScriptValue;
use crate::wavescript::vm::{VmHost, VmTrap};
use std::collections::HashMap;

const MAX_VAR_NAME_BYTES: usize = 64;
const MAX_VAR_VALUE_BYTES: usize = 1024;
const MAX_GO_HREF_BYTES: usize = 2048;
const MAX_DIALOG_TEXT_BYTES: usize = 1024;
const MAX_TIMER_TOKEN_BYTES: usize = 64;

pub const WMLBROWSER_GET_VAR: u8 = 0x01;
pub const WMLBROWSER_SET_VAR: u8 = 0x02;
pub const WMLBROWSER_GO: u8 = 0x03;
pub const WMLBROWSER_PREV: u8 = 0x04;
pub const WMLBROWSER_ALERT: u8 = 0x05;
pub const WMLBROWSER_CONFIRM: u8 = 0x06;
pub const WMLBROWSER_PROMPT: u8 = 0x07;
pub const WMLBROWSER_SET_TIMER: u8 = 0x08;
pub const WMLBROWSER_CLEAR_TIMER: u8 = 0x09;

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

        if name.len() > MAX_VAR_NAME_BYTES {
            return ScriptValue::Invalid;
        }

        ScriptValue::String(self.vars.get(&name).cloned().unwrap_or_default())
    }

    fn set_var(&mut self, args: &[ScriptValue]) -> ScriptValue {
        if args.len() < 2 {
            return ScriptValue::Invalid;
        }
        let Some(name) = normalize_var_name(&args[0]) else {
            return ScriptValue::Invalid;
        };
        if name.len() > MAX_VAR_NAME_BYTES {
            return ScriptValue::Invalid;
        }

        let value = coerce_to_string(&args[1]);
        if value.len() > MAX_VAR_VALUE_BYTES {
            return ScriptValue::Invalid;
        }
        self.vars.insert(name, value);
        self.effects.mark_refresh_required();
        ScriptValue::Bool(true)
    }

    fn go(&mut self, args: &[ScriptValue]) -> ScriptValue {
        let Some(href) = args.first() else {
            return ScriptValue::Invalid;
        };
        let href = coerce_to_string(href);
        if href.len() > MAX_GO_HREF_BYTES {
            return ScriptValue::Invalid;
        }
        self.effects.request_go(href);
        ScriptValue::Bool(true)
    }

    fn prev(&mut self) -> ScriptValue {
        self.effects.request_prev();
        ScriptValue::Bool(true)
    }

    fn alert(&mut self, args: &[ScriptValue]) -> ScriptValue {
        let message = args.first().map(coerce_to_string).unwrap_or_default();
        if message.len() > MAX_DIALOG_TEXT_BYTES {
            return ScriptValue::Invalid;
        }

        self.effects.request_alert(message);
        ScriptValue::Bool(true)
    }

    fn confirm(&mut self, args: &[ScriptValue]) -> ScriptValue {
        let message = args.first().map(coerce_to_string).unwrap_or_default();
        if message.len() > MAX_DIALOG_TEXT_BYTES {
            return ScriptValue::Invalid;
        }

        self.effects.request_confirm(message);
        ScriptValue::Bool(default_confirm_result())
    }

    fn prompt(&mut self, args: &[ScriptValue]) -> ScriptValue {
        let message = args.first().map(coerce_to_string).unwrap_or_default();
        if message.len() > MAX_DIALOG_TEXT_BYTES {
            return ScriptValue::Invalid;
        }
        let default_value = args.get(1).map(coerce_to_string);
        if default_value
            .as_ref()
            .is_some_and(|value| value.len() > MAX_DIALOG_TEXT_BYTES)
        {
            return ScriptValue::Invalid;
        }

        self.effects.request_prompt(message, default_value.clone());
        ScriptValue::String(default_prompt_result(default_value.as_deref()))
    }

    fn set_timer(&mut self, args: &[ScriptValue]) -> ScriptValue {
        let Some(delay_ms) = args.first().and_then(coerce_to_delay_ms) else {
            return ScriptValue::Invalid;
        };

        let token = match args.get(1) {
            Some(value) => {
                let token = coerce_to_string(value);
                if token.is_empty() || token.len() > MAX_TIMER_TOKEN_BYTES {
                    return ScriptValue::Invalid;
                }
                Some(token)
            }
            None => None,
        };

        self.effects.request_timer_schedule(delay_ms, token);
        ScriptValue::Bool(true)
    }

    fn clear_timer(&mut self, args: &[ScriptValue]) -> ScriptValue {
        let Some(token) = args.first().map(coerce_to_string) else {
            return ScriptValue::Invalid;
        };
        if token.is_empty() || token.len() > MAX_TIMER_TOKEN_BYTES {
            return ScriptValue::Invalid;
        }

        self.effects.request_timer_cancel(token);
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
            WMLBROWSER_ALERT => self.alert(args),
            WMLBROWSER_CONFIRM => self.confirm(args),
            WMLBROWSER_PROMPT => self.prompt(args),
            WMLBROWSER_SET_TIMER => self.set_timer(args),
            WMLBROWSER_CLEAR_TIMER => self.clear_timer(args),
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

fn coerce_to_delay_ms(value: &ScriptValue) -> Option<u32> {
    match value {
        ScriptValue::Int32(value) => {
            if *value < 0 {
                None
            } else {
                Some(*value as u32)
            }
        }
        ScriptValue::Float64(value) => {
            if !value.is_finite() || *value < 0.0 || *value > u32::MAX as f64 {
                None
            } else {
                Some(*value as u32)
            }
        }
        _ => None,
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
#[path = "wmlbrowser_tests.rs"]
mod tests;
