#[derive(Debug, Clone, PartialEq)]
pub enum ScriptValue {
    Bool(bool),
    Int32(i32),
    Float64(f64),
    String(String),
    Invalid,
}

impl ScriptValue {
    pub fn empty_string() -> Self {
        Self::String(String::new())
    }

    // Reserved host-facing introspection helper. The WAP executor implements
    // TYPEOF with numeric type codes at the bytecode boundary.
    #[allow(dead_code)]
    pub fn type_name(&self) -> &'static str {
        match self {
            Self::Bool(_) => "bool",
            Self::Int32(_) => "int",
            Self::Float64(_) => "float",
            Self::String(_) => "string",
            Self::Invalid => "invalid",
        }
    }

    pub(crate) fn to_boolean(&self) -> Option<bool> {
        match self {
            Self::Bool(value) => Some(*value),
            Self::Int32(value) => Some(*value != 0),
            Self::Float64(value) if value.is_finite() => Some(*value != 0.0),
            Self::Float64(_) | Self::Invalid => None,
            Self::String(value) => Some(!value.is_empty()),
        }
    }

    pub(crate) fn to_integer(&self) -> Option<i32> {
        match self {
            Self::Int32(value) => Some(*value),
            Self::Bool(value) => Some(i32::from(*value)),
            Self::String(value) => parse_wml_integer(value),
            Self::Float64(_) | Self::Invalid => None,
        }
    }

    pub(crate) fn to_float(&self) -> Option<f64> {
        match self {
            Self::Float64(value) if value.is_finite() => Some(*value),
            Self::Float64(_) | Self::Invalid => None,
            Self::Int32(value) => Some(f64::from(*value)),
            Self::Bool(value) => Some(if *value { 1.0 } else { 0.0 }),
            Self::String(value) => parse_wml_float(value),
        }
    }

    pub(crate) fn to_wml_string(&self) -> Option<String> {
        match self {
            Self::Bool(value) => Some(value.to_string()),
            Self::Int32(value) => Some(value.to_string()),
            Self::Float64(value) if value.is_finite() => {
                let mut rendered = value.to_string();
                if !rendered.contains(['.', 'e', 'E']) {
                    rendered.push_str(".0");
                }
                Some(rendered)
            }
            Self::Float64(_) | Self::Invalid => None,
            Self::String(value) => Some(value.clone()),
        }
    }
}

fn trim_wml_whitespace(value: &str) -> &str {
    value.trim_matches(['\t', '\u{000b}', '\u{000c}', ' ', '\n', '\r'])
}

fn strip_sign(value: &str) -> &str {
    value
        .strip_prefix('+')
        .or_else(|| value.strip_prefix('-'))
        .unwrap_or(value)
}

fn parse_wml_integer(value: &str) -> Option<i32> {
    let value = trim_wml_whitespace(value);
    let digits = strip_sign(value);
    if digits.is_empty() || !digits.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    value.parse().ok()
}

fn parse_wml_float(value: &str) -> Option<f64> {
    let value = trim_wml_whitespace(value);
    let unsigned = strip_sign(value);
    if unsigned.is_empty() {
        return None;
    }

    let (mantissa, exponent) = match unsigned.find(['e', 'E']) {
        Some(index) => {
            if unsigned[index + 1..].contains(['e', 'E']) {
                return None;
            }
            (&unsigned[..index], Some(&unsigned[index + 1..]))
        }
        None => (unsigned, None),
    };
    if let Some(exponent) = exponent {
        let digits = strip_sign(exponent);
        if digits.is_empty() || !digits.bytes().all(|byte| byte.is_ascii_digit()) {
            return None;
        }
    }

    let valid_mantissa = match mantissa.split_once('.') {
        Some(("", fraction)) => {
            !fraction.is_empty() && fraction.bytes().all(|byte| byte.is_ascii_digit())
        }
        Some((whole, fraction)) => {
            whole.bytes().all(|byte| byte.is_ascii_digit())
                && fraction.bytes().all(|byte| byte.is_ascii_digit())
        }
        None => mantissa.bytes().all(|byte| byte.is_ascii_digit()),
    };
    if !valid_mantissa || mantissa.is_empty() {
        return None;
    }

    value
        .parse::<f64>()
        .ok()
        .filter(|number| number.is_finite())
}

#[cfg(test)]
mod tests {
    use super::ScriptValue;

    #[test]
    fn empty_string_constructor_produces_string_variant() {
        assert_eq!(
            ScriptValue::empty_string(),
            ScriptValue::String(String::new())
        );
    }

    #[test]
    fn type_name_matches_variant() {
        assert_eq!(ScriptValue::Bool(true).type_name(), "bool");
        assert_eq!(ScriptValue::Int32(1).type_name(), "int");
        assert_eq!(ScriptValue::Float64(1.5).type_name(), "float");
        assert_eq!(ScriptValue::String("x".to_string()).type_name(), "string");
        assert_eq!(ScriptValue::Invalid.type_name(), "invalid");
    }

    #[test]
    fn wmlscript_conversions_follow_the_effective_numeric_grammar() {
        assert_eq!(
            ScriptValue::String(" +42\r\n".into()).to_integer(),
            Some(42)
        );
        assert_eq!(ScriptValue::String("4.2e1".into()).to_integer(), None);
        assert_eq!(ScriptValue::Float64(42.0).to_integer(), None);
        assert_eq!(ScriptValue::Bool(false).to_integer(), Some(0));

        assert_eq!(
            ScriptValue::String(" -.5e2 ".into()).to_float(),
            Some(-50.0)
        );
        assert_eq!(ScriptValue::String("1.".into()).to_float(), Some(1.0));
        assert_eq!(ScriptValue::String("1e".into()).to_float(), None);
        assert_eq!(ScriptValue::String("NaN".into()).to_float(), None);
        assert_eq!(ScriptValue::String("1e9999".into()).to_float(), None);
        assert_eq!(ScriptValue::String("1e-9999".into()).to_float(), Some(0.0));

        assert_eq!(ScriptValue::String(String::new()).to_boolean(), Some(false));
        assert_eq!(ScriptValue::String("0".into()).to_boolean(), Some(true));
        assert_eq!(ScriptValue::Float64(-0.0).to_boolean(), Some(false));
        assert_eq!(ScriptValue::Invalid.to_boolean(), None);
    }

    #[test]
    fn wmlscript_string_conversion_is_deterministic_and_invalid_safe() {
        assert_eq!(
            ScriptValue::Int32(-12).to_wml_string().as_deref(),
            Some("-12")
        );
        assert_eq!(
            ScriptValue::Float64(1.0).to_wml_string().as_deref(),
            Some("1.0")
        );
        assert_eq!(
            ScriptValue::Float64(-0.0).to_wml_string().as_deref(),
            Some("-0.0")
        );
        assert_eq!(
            ScriptValue::Bool(true).to_wml_string().as_deref(),
            Some("true")
        );
        assert_eq!(ScriptValue::Invalid.to_wml_string(), None);
    }
}
