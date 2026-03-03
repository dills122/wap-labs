use crate::*;
use serde::{Deserialize, Serialize};
pub(crate) fn format_decode_error(err: DecodeError) -> String {
    match err {
        DecodeError::EmptyUnit => "decode: empty compilation unit".to_string(),
        DecodeError::UnitTooLarge { size, limit } => {
            format!("decode: unit too large (size={size}, limit={limit})")
        }
        DecodeError::UnsupportedOpcode { pc, opcode } => {
            format!("decode: unsupported opcode 0x{opcode:02x} at pc={pc}")
        }
        DecodeError::TruncatedImmediate { pc, opcode } => {
            format!("decode: truncated immediate for opcode 0x{opcode:02x} at pc={pc}")
        }
        DecodeError::InvalidCallTarget { pc, target } => {
            format!("decode: invalid call target {target} from pc={pc}")
        }
    }
}

pub(crate) fn format_vm_trap(trap: VmTrap) -> String {
    match trap {
        VmTrap::EmptyUnit => "vm: empty unit".to_string(),
        VmTrap::InvalidEntryPoint { entry_pc } => {
            format!("vm: invalid entry point ({entry_pc})")
        }
        VmTrap::UnsupportedOpcode(opcode) => format!("vm: unsupported opcode 0x{opcode:02x}"),
        VmTrap::TruncatedImmediate { opcode } => {
            format!("vm: truncated immediate for opcode 0x{opcode:02x}")
        }
        VmTrap::StackOverflow { limit } => format!("vm: stack overflow (limit={limit})"),
        VmTrap::StackUnderflow => "vm: stack underflow".to_string(),
        VmTrap::TypeError(message) => format!("vm: type error ({message})"),
        VmTrap::InvalidLocalIndex { index } => format!("vm: invalid local index ({index})"),
        VmTrap::InvalidCallTarget { target } => format!("vm: invalid call target ({target})"),
        VmTrap::CallDepthExceeded { limit } => format!("vm: call depth exceeded (limit={limit})"),
        VmTrap::ReturnFromRootFrame => "vm: return from root frame".to_string(),
        VmTrap::ExecutionLimitExceeded { limit } => {
            format!("vm: execution step limit exceeded ({limit})")
        }
        VmTrap::Utf8ImmediateDecode => "vm: invalid utf-8 string immediate".to_string(),
        VmTrap::HostCallUnavailable { function_id } => {
            format!("vm: host call unavailable (function={function_id})")
        }
        VmTrap::HostCallError {
            function_id,
            message,
        } => {
            format!("vm: host call error (function={function_id}, message={message})")
        }
    }
}

pub(crate) fn script_value_to_literal(value: ScriptValue) -> ScriptValueLiteral {
    match value {
        ScriptValue::Bool(value) => ScriptValueLiteral::Bool(value),
        ScriptValue::Int32(value) => ScriptValueLiteral::Number(f64::from(value)),
        ScriptValue::Float64(value) => ScriptValueLiteral::Number(value),
        ScriptValue::String(value) => ScriptValueLiteral::String(value),
        ScriptValue::Invalid => ScriptValueLiteral::Invalid { invalid: true },
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptExecutionOutcome {
    pub ok: bool,
    pub result: ScriptValueLiteral,
    pub trap: Option<String>,
    pub error_class: ScriptErrorClassLiteral,
    pub error_category: ScriptErrorCategoryLiteral,
    pub invocation_aborted: bool,
    pub navigation_intent: ScriptNavigationIntentLiteral,
    pub requires_refresh: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptInvocationOutcome {
    pub navigation_intent: ScriptNavigationIntentLiteral,
    pub requires_refresh: bool,
    pub result: ScriptValueLiteral,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ScriptDialogRequestLiteral {
    Alert {
        message: String,
    },
    Confirm {
        message: String,
    },
    Prompt {
        message: String,
        #[serde(rename = "defaultValue")]
        default_value: Option<String>,
    },
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ScriptTimerRequestLiteral {
    Schedule {
        #[serde(rename = "delayMs")]
        delay_ms: u32,
        token: Option<String>,
    },
    Cancel {
        token: String,
    },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EngineTraceEntry {
    pub seq: u64,
    pub kind: String,
    pub detail: String,
    pub active_card_id: Option<String>,
    pub focused_link_index: usize,
    pub external_navigation_intent: Option<String>,
    pub script_ok: Option<bool>,
    pub script_error_class: Option<ScriptErrorClassLiteral>,
    pub script_error_category: Option<ScriptErrorCategoryLiteral>,
    pub script_trap: Option<String>,
}

impl ScriptExecutionOutcome {
    pub(crate) fn ok(
        result: ScriptValueLiteral,
        navigation_intent: ScriptNavigationIntentLiteral,
        requires_refresh: bool,
    ) -> Self {
        Self {
            ok: true,
            result,
            trap: None,
            error_class: ScriptErrorClassLiteral::None,
            error_category: ScriptErrorCategoryLiteral::None,
            invocation_aborted: false,
            navigation_intent,
            requires_refresh,
        }
    }

    pub(crate) fn non_fatal(
        message: String,
        category: ScriptErrorCategoryLiteral,
        navigation_intent: ScriptNavigationIntentLiteral,
        requires_refresh: bool,
    ) -> Self {
        Self {
            ok: true,
            result: ScriptValueLiteral::Invalid { invalid: true },
            trap: Some(message),
            error_class: ScriptErrorClassLiteral::NonFatal,
            error_category: category,
            invocation_aborted: false,
            navigation_intent,
            requires_refresh,
        }
    }

    pub(crate) fn fatal(message: String, category: ScriptErrorCategoryLiteral) -> Self {
        Self {
            ok: false,
            result: ScriptValueLiteral::Invalid { invalid: true },
            trap: Some(message),
            error_class: ScriptErrorClassLiteral::Fatal,
            error_category: category,
            invocation_aborted: true,
            navigation_intent: ScriptNavigationIntentLiteral::None,
            requires_refresh: false,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ScriptErrorClassLiteral {
    None,
    NonFatal,
    Fatal,
}

impl ScriptErrorClassLiteral {
    pub(crate) fn as_str(&self) -> &'static str {
        match self {
            Self::None => "none",
            Self::NonFatal => "non-fatal",
            Self::Fatal => "fatal",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ScriptErrorCategoryLiteral {
    None,
    Computational,
    Integrity,
    Resource,
    HostBinding,
}

impl ScriptErrorCategoryLiteral {
    pub(crate) fn as_str(&self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Computational => "computational",
            Self::Integrity => "integrity",
            Self::Resource => "resource",
            Self::HostBinding => "host-binding",
        }
    }
}

pub(crate) fn classify_vm_trap_outcome(
    trap: VmTrap,
    navigation_intent: ScriptNavigationIntentLiteral,
    requires_refresh: bool,
) -> ScriptExecutionOutcome {
    let class = classify_vm_trap(&trap);
    let category = classify_vm_trap_category(&trap);
    let message = format_vm_trap(trap);
    match class {
        ScriptErrorClassLiteral::NonFatal => ScriptExecutionOutcome::non_fatal(
            message,
            category,
            navigation_intent,
            requires_refresh,
        ),
        ScriptErrorClassLiteral::None => ScriptExecutionOutcome::ok(
            ScriptValueLiteral::Invalid { invalid: true },
            navigation_intent,
            requires_refresh,
        ),
        ScriptErrorClassLiteral::Fatal => ScriptExecutionOutcome::fatal(message, category),
    }
}

pub(crate) fn classify_vm_trap(trap: &VmTrap) -> ScriptErrorClassLiteral {
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

pub(crate) fn classify_vm_trap_category(trap: &VmTrap) -> ScriptErrorCategoryLiteral {
    match trap {
        VmTrap::TypeError(_) | VmTrap::StackUnderflow => ScriptErrorCategoryLiteral::Computational,
        VmTrap::EmptyUnit
        | VmTrap::InvalidEntryPoint { .. }
        | VmTrap::UnsupportedOpcode(_)
        | VmTrap::TruncatedImmediate { .. }
        | VmTrap::InvalidLocalIndex { .. }
        | VmTrap::InvalidCallTarget { .. }
        | VmTrap::Utf8ImmediateDecode => ScriptErrorCategoryLiteral::Integrity,
        VmTrap::StackOverflow { .. }
        | VmTrap::CallDepthExceeded { .. }
        | VmTrap::ExecutionLimitExceeded { .. } => ScriptErrorCategoryLiteral::Resource,
        VmTrap::HostCallUnavailable { .. } | VmTrap::HostCallError { .. } => {
            ScriptErrorCategoryLiteral::HostBinding
        }
        VmTrap::ReturnFromRootFrame => ScriptErrorCategoryLiteral::Integrity,
    }
}

impl ScriptInvocationOutcome {
    pub(crate) fn from_execution(outcome: &ScriptExecutionOutcome) -> Self {
        Self {
            navigation_intent: outcome.navigation_intent.clone(),
            requires_refresh: outcome.requires_refresh,
            result: outcome.result.clone(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ScriptNavigationIntentLiteral {
    None,
    Go { href: String },
    Prev,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ScriptValueLiteral {
    Bool(bool),
    Number(f64),
    String(String),
    Invalid { invalid: bool },
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum ScriptCallArgLiteral {
    Bool(bool),
    Number(f64),
    String(String),
    Invalid { invalid: bool },
}

pub(crate) fn convert_script_call_args(args: &[ScriptCallArgLiteral]) -> Vec<ScriptValue> {
    args.iter()
        .map(|arg| match arg {
            ScriptCallArgLiteral::Bool(value) => ScriptValue::Bool(*value),
            ScriptCallArgLiteral::Number(value) => {
                if value.fract() == 0.0 && *value >= i32::MIN as f64 && *value <= i32::MAX as f64 {
                    ScriptValue::Int32(*value as i32)
                } else {
                    ScriptValue::Float64(*value)
                }
            }
            ScriptCallArgLiteral::String(value) => ScriptValue::String(value.clone()),
            ScriptCallArgLiteral::Invalid { invalid } => {
                if *invalid {
                    ScriptValue::Invalid
                } else {
                    ScriptValue::String(String::new())
                }
            }
        })
        .collect()
}

pub(crate) fn is_valid_var_name(name: &str) -> bool {
    if name.is_empty() {
        return false;
    }
    let mut chars = name.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    if !(first.is_ascii_alphabetic() || first == '_') {
        return false;
    }
    chars.all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '.' || ch == '-')
}

pub(crate) fn script_nav_intent_to_literal(
    intent: &ScriptNavigationIntent,
) -> ScriptNavigationIntentLiteral {
    match intent {
        ScriptNavigationIntent::None => ScriptNavigationIntentLiteral::None,
        ScriptNavigationIntent::Go(href) => {
            ScriptNavigationIntentLiteral::Go { href: href.clone() }
        }
        ScriptNavigationIntent::Prev => ScriptNavigationIntentLiteral::Prev,
    }
}

pub(crate) fn script_dialog_request_to_literal(
    request: &ScriptDialogRequest,
) -> ScriptDialogRequestLiteral {
    match request {
        ScriptDialogRequest::Alert { message } => ScriptDialogRequestLiteral::Alert {
            message: message.clone(),
        },
        ScriptDialogRequest::Confirm { message } => ScriptDialogRequestLiteral::Confirm {
            message: message.clone(),
        },
        ScriptDialogRequest::Prompt {
            message,
            default_value,
        } => ScriptDialogRequestLiteral::Prompt {
            message: message.clone(),
            default_value: default_value.clone(),
        },
    }
}

pub(crate) fn script_timer_request_to_literal(
    request: &ScriptTimerRequest,
) -> ScriptTimerRequestLiteral {
    match request {
        ScriptTimerRequest::Schedule { delay_ms, token } => ScriptTimerRequestLiteral::Schedule {
            delay_ms: *delay_ms,
            token: token.clone(),
        },
        ScriptTimerRequest::Cancel { token } => ScriptTimerRequestLiteral::Cancel {
            token: token.clone(),
        },
    }
}
