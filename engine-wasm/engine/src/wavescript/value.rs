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

    // Reserved introspection helper: no WaveScript opcode surfaces a `typeof`
    // or type-checking operation yet, so nothing in-crate calls this today.
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
}
