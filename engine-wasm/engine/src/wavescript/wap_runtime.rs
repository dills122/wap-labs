use super::value::ScriptValue;
use super::wap_decoder::WapCompilationUnit;

const RETURN_ES_OPCODE: u8 = 0x3b;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum WapRuntimeError {
    ExternalFunctionNotFound {
        function_name: String,
    },
    InvalidFunctionIndex {
        index: usize,
    },
    InvalidArgumentCount {
        function: usize,
        expected: usize,
        actual: usize,
    },
    UnsupportedExecutionOpcode {
        function: usize,
        pc: usize,
        opcode: u8,
    },
    UnsupportedImplicitReturn {
        function: usize,
    },
}

/// Execute the intentionally tiny WMLS-501 routing subset.
///
/// The strict decoder has already verified every function and reference in
/// the compilation unit before this function is called. This follow-on only
/// selects an externally named function, enforces its call arity, and
/// executes WAP-193 `RETURN_ES`. All remaining instruction semantics stay
/// explicit typed failures for WMLS-502 and later slices.
pub(crate) fn execute_named_function(
    unit: &WapCompilationUnit,
    function_name: &str,
    args: &[ScriptValue],
) -> Result<ScriptValue, WapRuntimeError> {
    let named = unit
        .function_names
        .iter()
        .find(|entry| entry.name == function_name)
        .ok_or_else(|| WapRuntimeError::ExternalFunctionNotFound {
            function_name: function_name.to_string(),
        })?;
    let function_index = usize::from(named.function_index);
    let function =
        unit.functions
            .get(function_index)
            .ok_or(WapRuntimeError::InvalidFunctionIndex {
                index: function_index,
            })?;
    let expected = usize::from(function.argument_count);
    if args.len() != expected {
        return Err(WapRuntimeError::InvalidArgumentCount {
            function: function_index,
            expected,
            actual: args.len(),
        });
    }

    let Some(instruction) = function.instructions.first() else {
        return Err(WapRuntimeError::UnsupportedImplicitReturn {
            function: function_index,
        });
    };
    if instruction.opcode == RETURN_ES_OPCODE {
        return Ok(ScriptValue::empty_string());
    }

    Err(WapRuntimeError::UnsupportedExecutionOpcode {
        function: function_index,
        pc: instruction.offset,
        opcode: instruction.opcode,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wavescript::wap_decoder::decode_wap_compilation_unit;

    const NAMED_UNIT_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-named-functions.wmlsc.hex");

    fn fixture_bytes() -> Vec<u8> {
        NAMED_UNIT_HEX
            .split_ascii_whitespace()
            .map(|token| u8::from_str_radix(token, 16).expect("fixture must contain hex bytes"))
            .collect()
    }

    #[test]
    fn selects_external_name_and_bounds_execution_subset() {
        let unit = decode_wap_compilation_unit(&fixture_bytes()).expect("fixture must verify");
        assert_eq!(
            execute_named_function(&unit, "main", &[]),
            Ok(ScriptValue::empty_string())
        );
        assert_eq!(
            execute_named_function(&unit, "missing", &[]),
            Err(WapRuntimeError::ExternalFunctionNotFound {
                function_name: "missing".to_string(),
            })
        );
        assert_eq!(
            execute_named_function(&unit, "todo", &[]),
            Err(WapRuntimeError::UnsupportedExecutionOpcode {
                function: 1,
                pc: 0,
                opcode: 0x14,
            })
        );
    }
}
