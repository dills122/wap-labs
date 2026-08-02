use super::value::ScriptValue;
use super::wap_decoder::{
    WapCompilationUnit, WapConstant, WapFunction, WapInstruction, MAX_WAP_OPERAND_STACK_DEPTH,
};
use std::fmt;

const DEFAULT_MAX_STEPS: usize = 512;
const DEFAULT_MAX_CALL_DEPTH: usize = 16;
const DEFAULT_MAX_ALLOCATED_STRING_BYTES: usize = 64 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct WapRuntimeLimits {
    pub max_steps: usize,
    pub max_stack_size: usize,
    pub max_call_depth: usize,
    pub max_allocated_string_bytes: usize,
}

impl Default for WapRuntimeLimits {
    fn default() -> Self {
        Self {
            max_steps: DEFAULT_MAX_STEPS,
            max_stack_size: MAX_WAP_OPERAND_STACK_DEPTH,
            max_call_depth: DEFAULT_MAX_CALL_DEPTH,
            max_allocated_string_bytes: DEFAULT_MAX_ALLOCATED_STRING_BYTES,
        }
    }
}

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
    InvalidVariableIndex {
        function: usize,
        pc: usize,
        index: usize,
    },
    StackUnderflow {
        function: usize,
        pc: usize,
    },
    StackLimitExceeded {
        limit: usize,
    },
    CallDepthExceeded {
        limit: usize,
    },
    ExecutionLimitExceeded {
        limit: usize,
    },
    AllocationLimitExceeded {
        limit: usize,
    },
    UnsupportedExecutionOpcode {
        function: usize,
        pc: usize,
        opcode: u8,
    },
}

impl WapRuntimeError {
    pub(crate) fn is_resource_exhaustion(&self) -> bool {
        matches!(
            self,
            Self::StackLimitExceeded { .. }
                | Self::CallDepthExceeded { .. }
                | Self::ExecutionLimitExceeded { .. }
                | Self::AllocationLimitExceeded { .. }
        )
    }
}

impl fmt::Display for WapRuntimeError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ExternalFunctionNotFound { function_name } => {
                write!(formatter, "external function not found ({function_name})")
            }
            Self::InvalidFunctionIndex { index } => write!(formatter, "invalid function index {index}"),
            Self::InvalidArgumentCount {
                function,
                expected,
                actual,
            } => write!(
                formatter,
                "invalid argument count for function {function} (expected={expected}, actual={actual})"
            ),
            Self::InvalidVariableIndex {
                function,
                pc,
                index,
            } => write!(
                formatter,
                "invalid variable index {index} in function {function} at pc={pc}"
            ),
            Self::StackUnderflow { function, pc } => {
                write!(formatter, "stack underflow in function {function} at pc={pc}")
            }
            Self::StackLimitExceeded { limit } => {
                write!(formatter, "stack limit exceeded (limit={limit})")
            }
            Self::CallDepthExceeded { limit } => {
                write!(formatter, "call depth exceeded (limit={limit})")
            }
            Self::ExecutionLimitExceeded { limit } => {
                write!(formatter, "execution limit exceeded (limit={limit})")
            }
            Self::AllocationLimitExceeded { limit } => {
                write!(formatter, "allocation limit exceeded (limit={limit})")
            }
            Self::UnsupportedExecutionOpcode {
                function,
                pc,
                opcode,
            } => write!(
                formatter,
                "unsupported execution opcode 0x{opcode:02x} in function {function} at pc={pc}"
            ),
        }
    }
}

#[derive(Debug, Clone)]
struct CallFrame {
    function_index: usize,
    instruction_index: usize,
    variables: Vec<ScriptValue>,
}

#[derive(Debug, Clone, Copy)]
struct AllocationBudget {
    used: usize,
    limit: usize,
}

impl AllocationBudget {
    fn new(limit: usize) -> Self {
        Self { used: 0, limit }
    }

    fn charge(&mut self, value: &ScriptValue) -> Result<(), WapRuntimeError> {
        let ScriptValue::String(value) = value else {
            return Ok(());
        };
        self.used = self
            .used
            .checked_add(value.len())
            .filter(|used| *used <= self.limit)
            .ok_or(WapRuntimeError::AllocationLimitExceeded { limit: self.limit })?;
        Ok(())
    }
}

/// Execute one externally named function from a verified WAP-193 compilation unit.
///
/// Structural decoding, reference validation, jump-boundary checks, and stack
/// dataflow have already completed in `wap_decoder`. This executor consumes the
/// decoded instruction representation directly and adds only bounded runtime
/// state and language semantics.
pub(crate) fn execute_named_function(
    unit: &WapCompilationUnit,
    function_name: &str,
    args: &[ScriptValue],
) -> Result<ScriptValue, WapRuntimeError> {
    execute_named_function_with_limits(unit, function_name, args, WapRuntimeLimits::default())
}

fn execute_named_function_with_limits(
    unit: &WapCompilationUnit,
    function_name: &str,
    args: &[ScriptValue],
    limits: WapRuntimeLimits,
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
    verify_argument_count(function_index, function, args.len())?;

    let mut allocations = AllocationBudget::new(limits.max_allocated_string_bytes);
    for value in args {
        allocations.charge(value)?;
    }
    let mut variables = args.to_vec();
    variables.resize(
        usize::from(function.argument_count) + usize::from(function.local_count),
        ScriptValue::empty_string(),
    );

    let mut frames = vec![CallFrame {
        function_index,
        instruction_index: 0,
        variables,
    }];
    let mut stack = Vec::new();
    let mut steps = 0usize;

    loop {
        if steps >= limits.max_steps {
            return Err(WapRuntimeError::ExecutionLimitExceeded {
                limit: limits.max_steps,
            });
        }

        let active_function = frames
            .last()
            .expect("the root frame is returned directly rather than popped")
            .function_index;
        let function =
            unit.functions
                .get(active_function)
                .ok_or(WapRuntimeError::InvalidFunctionIndex {
                    index: active_function,
                })?;
        let instruction_index = frames
            .last()
            .expect("the root frame is returned directly rather than popped")
            .instruction_index;
        let Some(instruction) = function.instructions.get(instruction_index).cloned() else {
            if let Some(result) = return_from_frame(
                &mut frames,
                &mut stack,
                ScriptValue::empty_string(),
                limits.max_stack_size,
                &mut allocations,
            )? {
                return Ok(result);
            }
            continue;
        };

        steps += 1;
        frames
            .last_mut()
            .expect("an instruction always belongs to an active frame")
            .instruction_index += 1;
        match instruction.opcode {
            0x80..=0xbf | 0x01..=0x04 => jump(&mut frames, function, &instruction)?,
            0xc0..=0xdf | 0x05..=0x08 => {
                let value = pop(&mut stack, active_function, instruction.offset)?;
                if value.to_boolean() != Some(true) {
                    jump(&mut frames, function, &instruction)?;
                }
            }
            0x60..=0x67 | 0x09 => {
                let callee_index = instruction
                    .local_function_index()
                    .expect("verified local calls expose a function index");
                call_local_function(
                    unit,
                    callee_index,
                    &mut frames,
                    &mut stack,
                    limits.max_call_depth,
                )?;
            }
            0x68..=0x6f | 0x0a..=0x0d => {
                return Err(unsupported(active_function, &instruction));
            }
            0xe0..=0xff | 0x0e => {
                let index = instruction
                    .variable_index()
                    .expect("verified variable load exposes an index");
                let value = variable(&frames, active_function, instruction.offset, index)?.clone();
                push_new(&mut stack, value, limits.max_stack_size, &mut allocations)?;
            }
            0x40..=0x4f | 0x0f => {
                let index = instruction
                    .variable_index()
                    .expect("verified variable store exposes an index");
                let value = pop(&mut stack, active_function, instruction.offset)?;
                *variable_mut(&mut frames, active_function, instruction.offset, index)? = value;
            }
            0x70..=0x77 | 0x10 | 0x11 => {
                let index = instruction
                    .variable_index()
                    .expect("verified variable update exposes an index");
                let current =
                    variable(&frames, active_function, instruction.offset, index)?.clone();
                let delta = if instruction.opcode == 0x11 { -1 } else { 1 };
                *variable_mut(&mut frames, active_function, instruction.offset, index)? =
                    increment(current, delta);
            }
            0x50..=0x5f | 0x12 | 0x13 => {
                let index = instruction
                    .constant_index()
                    .expect("verified constant load exposes an index");
                let value = constant_value(&unit.constants[index]);
                push_new(&mut stack, value, limits.max_stack_size, &mut allocations)?;
            }
            0x14 => push_value(&mut stack, ScriptValue::Int32(0), limits.max_stack_size)?,
            0x15 => push_value(&mut stack, ScriptValue::Int32(1), limits.max_stack_size)?,
            0x16 => push_value(&mut stack, ScriptValue::Int32(-1), limits.max_stack_size)?,
            0x17 => push_new(
                &mut stack,
                ScriptValue::empty_string(),
                limits.max_stack_size,
                &mut allocations,
            )?,
            0x18 => push_value(&mut stack, ScriptValue::Invalid, limits.max_stack_size)?,
            0x19 => push_value(&mut stack, ScriptValue::Bool(true), limits.max_stack_size)?,
            0x1a => push_value(&mut stack, ScriptValue::Bool(false), limits.max_stack_size)?,
            0x1b | 0x1c | 0x1f | 0x29 | 0x33 | 0x36 | 0x38 | 0x39 => {
                let value = pop(&mut stack, active_function, instruction.offset)?;
                let result = match instruction.opcode {
                    0x1b => increment(value, 1),
                    0x1c => increment(value, -1),
                    0x1f => unary_minus(value),
                    0x29 => value
                        .to_integer()
                        .map(|value| ScriptValue::Int32(!value))
                        .unwrap_or(ScriptValue::Invalid),
                    0x33 => value
                        .to_boolean()
                        .map(|value| ScriptValue::Bool(!value))
                        .unwrap_or(ScriptValue::Invalid),
                    0x36 => value
                        .to_boolean()
                        .map(ScriptValue::Bool)
                        .unwrap_or(ScriptValue::Invalid),
                    0x38 => ScriptValue::Int32(type_code(&value)),
                    0x39 => ScriptValue::Bool(!matches!(value, ScriptValue::Invalid)),
                    _ => unreachable!(),
                };
                push_new(&mut stack, result, limits.max_stack_size, &mut allocations)?;
            }
            0x1d | 0x1e => {
                let index = instruction
                    .variable_index()
                    .expect("verified assignment exposes an index");
                let rhs = pop(&mut stack, active_function, instruction.offset)?;
                let lhs = variable(&frames, active_function, instruction.offset, index)?.clone();
                let result = if instruction.opcode == 0x1d {
                    add(lhs, rhs)
                } else {
                    numeric_binary(lhs, rhs, NumericOperation::Subtract)
                };
                allocations.charge(&result)?;
                *variable_mut(&mut frames, active_function, instruction.offset, index)? = result;
            }
            0x20..=0x28 | 0x2a..=0x32 => {
                let rhs = pop(&mut stack, active_function, instruction.offset)?;
                let lhs = pop(&mut stack, active_function, instruction.offset)?;
                let result = binary_operation(instruction.opcode, lhs, rhs);
                push_new(&mut stack, result, limits.max_stack_size, &mut allocations)?;
            }
            0x34 | 0x35 => {
                let value = pop(&mut stack, active_function, instruction.offset)?;
                short_circuit(instruction.opcode, value, &mut stack, limits.max_stack_size)?;
            }
            0x37 => {
                pop(&mut stack, active_function, instruction.offset)?;
            }
            0x3a => {
                let value = pop(&mut stack, active_function, instruction.offset)?;
                if let Some(result) = return_from_frame(
                    &mut frames,
                    &mut stack,
                    value,
                    limits.max_stack_size,
                    &mut allocations,
                )? {
                    return Ok(result);
                }
            }
            0x3b => {
                if let Some(result) = return_from_frame(
                    &mut frames,
                    &mut stack,
                    ScriptValue::empty_string(),
                    limits.max_stack_size,
                    &mut allocations,
                )? {
                    return Ok(result);
                }
            }
            0x3c => {}
            _ => return Err(unsupported(active_function, &instruction)),
        }
    }
}

fn verify_argument_count(
    function_index: usize,
    function: &WapFunction,
    actual: usize,
) -> Result<(), WapRuntimeError> {
    let expected = usize::from(function.argument_count);
    if actual != expected {
        return Err(WapRuntimeError::InvalidArgumentCount {
            function: function_index,
            expected,
            actual,
        });
    }
    Ok(())
}

fn call_local_function(
    unit: &WapCompilationUnit,
    function_index: usize,
    frames: &mut Vec<CallFrame>,
    stack: &mut Vec<ScriptValue>,
    max_call_depth: usize,
) -> Result<(), WapRuntimeError> {
    if frames.len() >= max_call_depth {
        return Err(WapRuntimeError::CallDepthExceeded {
            limit: max_call_depth,
        });
    }
    let function =
        unit.functions
            .get(function_index)
            .ok_or(WapRuntimeError::InvalidFunctionIndex {
                index: function_index,
            })?;
    let argument_count = usize::from(function.argument_count);
    if stack.len() < argument_count {
        let caller = frames.last().expect("a local call has a caller");
        return Err(WapRuntimeError::StackUnderflow {
            function: caller.function_index,
            pc: function
                .instructions
                .first()
                .map_or(0, |instruction| instruction.offset),
        });
    }
    let mut variables = stack.split_off(stack.len() - argument_count);
    variables.resize(
        argument_count + usize::from(function.local_count),
        ScriptValue::empty_string(),
    );
    frames.push(CallFrame {
        function_index,
        instruction_index: 0,
        variables,
    });
    Ok(())
}

fn return_from_frame(
    frames: &mut Vec<CallFrame>,
    stack: &mut Vec<ScriptValue>,
    value: ScriptValue,
    max_stack_size: usize,
    _allocations: &mut AllocationBudget,
) -> Result<Option<ScriptValue>, WapRuntimeError> {
    if frames.len() == 1 {
        return Ok(Some(value));
    }
    frames.pop();
    push_value(stack, value, max_stack_size)?;
    Ok(None)
}

fn jump(
    frames: &mut [CallFrame],
    function: &WapFunction,
    instruction: &WapInstruction,
) -> Result<(), WapRuntimeError> {
    let target = instruction
        .jump_target()
        .expect("verified jump instructions expose a target");
    let instruction_index = function
        .instructions
        .binary_search_by_key(&target, |candidate| candidate.offset)
        .expect("verified jump targets are instruction boundaries");
    frames
        .last_mut()
        .expect("a jump belongs to an active frame")
        .instruction_index = instruction_index;
    Ok(())
}

fn variable(
    frames: &[CallFrame],
    function: usize,
    pc: usize,
    index: usize,
) -> Result<&ScriptValue, WapRuntimeError> {
    frames
        .last()
        .and_then(|frame| frame.variables.get(index))
        .ok_or(WapRuntimeError::InvalidVariableIndex {
            function,
            pc,
            index,
        })
}

fn variable_mut(
    frames: &mut [CallFrame],
    function: usize,
    pc: usize,
    index: usize,
) -> Result<&mut ScriptValue, WapRuntimeError> {
    frames
        .last_mut()
        .and_then(|frame| frame.variables.get_mut(index))
        .ok_or(WapRuntimeError::InvalidVariableIndex {
            function,
            pc,
            index,
        })
}

fn pop(
    stack: &mut Vec<ScriptValue>,
    function: usize,
    pc: usize,
) -> Result<ScriptValue, WapRuntimeError> {
    stack
        .pop()
        .ok_or(WapRuntimeError::StackUnderflow { function, pc })
}

fn push_value(
    stack: &mut Vec<ScriptValue>,
    value: ScriptValue,
    max_stack_size: usize,
) -> Result<(), WapRuntimeError> {
    if stack.len() >= max_stack_size {
        return Err(WapRuntimeError::StackLimitExceeded {
            limit: max_stack_size,
        });
    }
    stack.push(value);
    Ok(())
}

fn push_new(
    stack: &mut Vec<ScriptValue>,
    value: ScriptValue,
    max_stack_size: usize,
    allocations: &mut AllocationBudget,
) -> Result<(), WapRuntimeError> {
    allocations.charge(&value)?;
    push_value(stack, value, max_stack_size)
}

fn constant_value(constant: &WapConstant) -> ScriptValue {
    match constant {
        WapConstant::Integer8(value) => ScriptValue::Int32(i32::from(*value)),
        WapConstant::Integer16(value) => ScriptValue::Int32(i32::from(*value)),
        WapConstant::Integer32(value) => ScriptValue::Int32(*value),
        WapConstant::Float32Bits(bits) => {
            let value = f32::from_bits(*bits);
            if value.is_finite() {
                ScriptValue::Float64(f64::from(value))
            } else {
                ScriptValue::Invalid
            }
        }
        WapConstant::Utf8String(value) | WapConstant::ExternalString(value) => {
            String::from_utf8(value.clone())
                .map(ScriptValue::String)
                .unwrap_or(ScriptValue::Invalid)
        }
        WapConstant::EmptyString => ScriptValue::empty_string(),
    }
}

fn increment(value: ScriptValue, delta: i32) -> ScriptValue {
    match unary_numeric(value) {
        Some(NumericValue::Integer(value)) => value
            .checked_add(delta)
            .map(ScriptValue::Int32)
            .unwrap_or(ScriptValue::Invalid),
        Some(NumericValue::Float(value)) => finite_float(value + f64::from(delta)),
        None => ScriptValue::Invalid,
    }
}

fn unary_minus(value: ScriptValue) -> ScriptValue {
    match unary_numeric(value) {
        Some(NumericValue::Integer(value)) => value
            .checked_neg()
            .map(ScriptValue::Int32)
            .unwrap_or(ScriptValue::Invalid),
        Some(NumericValue::Float(value)) => finite_float(-value),
        None => ScriptValue::Invalid,
    }
}

#[derive(Debug, Clone, Copy)]
enum NumericValue {
    Integer(i32),
    Float(f64),
}

fn unary_numeric(value: ScriptValue) -> Option<NumericValue> {
    value
        .to_integer()
        .map(NumericValue::Integer)
        .or_else(|| value.to_float().map(NumericValue::Float))
}

fn numeric_pair(lhs: &ScriptValue, rhs: &ScriptValue) -> Option<(NumericValue, NumericValue)> {
    if matches!(lhs, ScriptValue::Float64(_)) || matches!(rhs, ScriptValue::Float64(_)) {
        return Some((
            NumericValue::Float(lhs.to_float()?),
            NumericValue::Float(rhs.to_float()?),
        ));
    }
    if let (Some(lhs), Some(rhs)) = (lhs.to_integer(), rhs.to_integer()) {
        return Some((NumericValue::Integer(lhs), NumericValue::Integer(rhs)));
    }
    Some((
        NumericValue::Float(lhs.to_float()?),
        NumericValue::Float(rhs.to_float()?),
    ))
}

#[derive(Debug, Clone, Copy)]
enum NumericOperation {
    Subtract,
    Multiply,
}

fn numeric_binary(lhs: ScriptValue, rhs: ScriptValue, operation: NumericOperation) -> ScriptValue {
    let Some((lhs, rhs)) = numeric_pair(&lhs, &rhs) else {
        return ScriptValue::Invalid;
    };
    match (lhs, rhs) {
        (NumericValue::Integer(lhs), NumericValue::Integer(rhs)) => {
            let value = match operation {
                NumericOperation::Subtract => lhs.checked_sub(rhs),
                NumericOperation::Multiply => lhs.checked_mul(rhs),
            };
            value
                .map(ScriptValue::Int32)
                .unwrap_or(ScriptValue::Invalid)
        }
        (NumericValue::Float(lhs), NumericValue::Float(rhs)) => finite_float(match operation {
            NumericOperation::Subtract => lhs - rhs,
            NumericOperation::Multiply => lhs * rhs,
        }),
        _ => unreachable!("numeric conversion produces matching operand types"),
    }
}

fn add(lhs: ScriptValue, rhs: ScriptValue) -> ScriptValue {
    if matches!(lhs, ScriptValue::String(_)) || matches!(rhs, ScriptValue::String(_)) {
        return match (lhs.to_wml_string(), rhs.to_wml_string()) {
            (Some(lhs), Some(rhs)) => ScriptValue::String(lhs + &rhs),
            _ => ScriptValue::Invalid,
        };
    }
    let Some((lhs, rhs)) = numeric_pair(&lhs, &rhs) else {
        return ScriptValue::Invalid;
    };
    match (lhs, rhs) {
        (NumericValue::Integer(lhs), NumericValue::Integer(rhs)) => lhs
            .checked_add(rhs)
            .map(ScriptValue::Int32)
            .unwrap_or(ScriptValue::Invalid),
        (NumericValue::Float(lhs), NumericValue::Float(rhs)) => finite_float(lhs + rhs),
        _ => unreachable!("numeric conversion produces matching operand types"),
    }
}

fn binary_operation(opcode: u8, lhs: ScriptValue, rhs: ScriptValue) -> ScriptValue {
    match opcode {
        0x20 => add(lhs, rhs),
        0x21 => numeric_binary(lhs, rhs, NumericOperation::Subtract),
        0x22 => numeric_binary(lhs, rhs, NumericOperation::Multiply),
        0x23 => divide(lhs, rhs),
        0x24 => integer_binary(lhs, rhs, |lhs, rhs| lhs.checked_div(rhs)),
        0x25 => integer_binary(lhs, rhs, |lhs, rhs| lhs.checked_rem(rhs)),
        0x26 => integer_binary(lhs, rhs, |lhs, rhs| Some(lhs & rhs)),
        0x27 => integer_binary(lhs, rhs, |lhs, rhs| Some(lhs | rhs)),
        0x28 => integer_binary(lhs, rhs, |lhs, rhs| Some(lhs ^ rhs)),
        0x2a => integer_binary(lhs, rhs, |lhs, rhs| {
            Some(lhs.wrapping_shl((rhs & 31) as u32))
        }),
        0x2b => integer_binary(lhs, rhs, |lhs, rhs| {
            Some(lhs.wrapping_shr((rhs & 31) as u32))
        }),
        0x2c => integer_binary(lhs, rhs, |lhs, rhs| {
            Some(((lhs as u32) >> ((rhs & 31) as u32)) as i32)
        }),
        0x2d..=0x32 => compare(opcode, lhs, rhs),
        _ => unreachable!("binary opcode family is exhaustive"),
    }
}

fn integer_binary(
    lhs: ScriptValue,
    rhs: ScriptValue,
    operation: impl FnOnce(i32, i32) -> Option<i32>,
) -> ScriptValue {
    match (lhs.to_integer(), rhs.to_integer()) {
        (Some(lhs), Some(rhs)) => operation(lhs, rhs)
            .map(ScriptValue::Int32)
            .unwrap_or(ScriptValue::Invalid),
        _ => ScriptValue::Invalid,
    }
}

fn divide(lhs: ScriptValue, rhs: ScriptValue) -> ScriptValue {
    let Some((lhs, rhs)) = numeric_pair(&lhs, &rhs) else {
        return ScriptValue::Invalid;
    };
    let (lhs, rhs) = match (lhs, rhs) {
        (NumericValue::Integer(lhs), NumericValue::Integer(rhs)) => {
            (f64::from(lhs), f64::from(rhs))
        }
        (NumericValue::Float(lhs), NumericValue::Float(rhs)) => (lhs, rhs),
        _ => unreachable!("numeric conversion produces matching operand types"),
    };
    if rhs == 0.0 {
        ScriptValue::Invalid
    } else {
        finite_float(lhs / rhs)
    }
}

fn compare(opcode: u8, lhs: ScriptValue, rhs: ScriptValue) -> ScriptValue {
    if matches!(lhs, ScriptValue::String(_)) || matches!(rhs, ScriptValue::String(_)) {
        return match (lhs.to_wml_string(), rhs.to_wml_string()) {
            (Some(lhs), Some(rhs)) => ScriptValue::Bool(compare_order(opcode, &lhs, &rhs)),
            _ => ScriptValue::Invalid,
        };
    }
    let Some((lhs, rhs)) = numeric_pair(&lhs, &rhs) else {
        return ScriptValue::Invalid;
    };
    let result = match (lhs, rhs) {
        (NumericValue::Integer(lhs), NumericValue::Integer(rhs)) => compare_order(opcode, lhs, rhs),
        (NumericValue::Float(lhs), NumericValue::Float(rhs)) => compare_order(opcode, lhs, rhs),
        _ => unreachable!("numeric conversion produces matching operand types"),
    };
    ScriptValue::Bool(result)
}

fn compare_order<T: PartialEq + PartialOrd>(opcode: u8, lhs: T, rhs: T) -> bool {
    match opcode {
        0x2d => lhs == rhs,
        0x2e => lhs <= rhs,
        0x2f => lhs < rhs,
        0x30 => lhs >= rhs,
        0x31 => lhs > rhs,
        0x32 => lhs != rhs,
        _ => unreachable!("comparison opcode family is exhaustive"),
    }
}

fn short_circuit(
    opcode: u8,
    value: ScriptValue,
    stack: &mut Vec<ScriptValue>,
    max_stack_size: usize,
) -> Result<(), WapRuntimeError> {
    let converted = value
        .to_boolean()
        .map(ScriptValue::Bool)
        .unwrap_or(ScriptValue::Invalid);
    match (opcode, &converted) {
        (0x34, ScriptValue::Bool(true)) => push_value(stack, converted, max_stack_size),
        (0x34, _) => {
            push_value(stack, converted, max_stack_size)?;
            push_value(stack, ScriptValue::Bool(false), max_stack_size)
        }
        (0x35, ScriptValue::Bool(false)) => {
            push_value(stack, ScriptValue::Bool(true), max_stack_size)
        }
        (0x35, _) => {
            push_value(stack, converted, max_stack_size)?;
            push_value(stack, ScriptValue::Bool(false), max_stack_size)
        }
        _ => unreachable!("short-circuit opcode family is exhaustive"),
    }
}

fn finite_float(value: f64) -> ScriptValue {
    if value.is_finite() {
        ScriptValue::Float64(value)
    } else {
        ScriptValue::Invalid
    }
}

fn type_code(value: &ScriptValue) -> i32 {
    match value {
        ScriptValue::Int32(_) => 0,
        ScriptValue::Float64(_) => 1,
        ScriptValue::String(_) => 2,
        ScriptValue::Bool(_) => 3,
        ScriptValue::Invalid => 4,
    }
}

fn unsupported(function: usize, instruction: &WapInstruction) -> WapRuntimeError {
    WapRuntimeError::UnsupportedExecutionOpcode {
        function,
        pc: instruction.offset,
        opcode: instruction.opcode,
    }
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

    fn multibyte(mut value: usize) -> Vec<u8> {
        let mut encoded = vec![u8::try_from(value & 0x7f).expect("seven-bit group")];
        value >>= 7;
        while value != 0 {
            encoded.push(u8::try_from(value & 0x7f).expect("seven-bit group") | 0x80);
            value >>= 7;
        }
        encoded.reverse();
        encoded
    }

    fn unit_with_functions(constants: &[WapConstant], functions: &[(u8, u8, &[u8])]) -> Vec<u8> {
        let mut body = Vec::new();
        body.extend(multibyte(constants.len()));
        body.push(0x6a);
        for constant in constants {
            match constant {
                WapConstant::Integer32(value) => {
                    body.push(2);
                    body.extend(value.to_be_bytes());
                }
                WapConstant::Float32Bits(value) => {
                    body.push(3);
                    body.extend(value.to_be_bytes());
                }
                WapConstant::Utf8String(value) => {
                    body.push(4);
                    body.extend(multibyte(value.len()));
                    body.extend(value);
                }
                _ => panic!("test builder supports only int32 and UTF-8 constants"),
            }
        }
        body.push(0); // pragma count
        body.push(u8::try_from(functions.len()).expect("function count"));
        body.push(1); // one external function name
        body.extend_from_slice(&[0, 4, b'm', b'a', b'i', b'n']);
        for (arguments, locals, code) in functions {
            body.extend_from_slice(&[*arguments, *locals]);
            body.extend(multibyte(code.len()));
            body.extend_from_slice(code);
        }
        let mut unit = vec![0x01];
        unit.extend(multibyte(body.len()));
        unit.extend(body);
        unit
    }

    fn execute(constants: &[WapConstant], functions: &[(u8, u8, &[u8])]) -> ScriptValue {
        let unit = decode_wap_compilation_unit(&unit_with_functions(constants, functions))
            .expect("test unit must verify");
        execute_named_function(&unit, "main", &[]).expect("test unit must execute")
    }

    #[test]
    fn selects_external_name_and_bounds_unsupported_standard_library_calls() {
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
            Ok(ScriptValue::empty_string())
        );

        let library = decode_wap_compilation_unit(&unit_with_functions(
            &[],
            &[(0, 0, &[0x14, 0x68, 0x00, 0x3a])],
        ))
        .expect("library call is structurally valid");
        assert_eq!(
            execute_named_function(&library, "main", &[]),
            Err(WapRuntimeError::UnsupportedExecutionOpcode {
                function: 0,
                pc: 1,
                opcode: 0x68,
            })
        );
    }

    #[test]
    fn executes_conversions_operators_and_nonfatal_invalid_results() {
        let constants = [
            WapConstant::Utf8String(b"12".to_vec()),
            WapConstant::Integer32(5),
        ];
        assert_eq!(
            execute(&constants, &[(0, 0, &[0x50, 0x51, 0x20, 0x3a])]),
            ScriptValue::String("125".to_string())
        );
        assert_eq!(
            execute(&[], &[(0, 0, &[0x15, 0x14, 0x24, 0x3a])]),
            ScriptValue::Invalid
        );
        assert_eq!(
            execute(&[], &[(0, 0, &[0x16, 0x16, 0x20, 0x3a])]),
            ScriptValue::Int32(-2)
        );
        assert_eq!(
            execute(&[], &[(0, 0, &[0x18, 0x33, 0x3a])]),
            ScriptValue::Invalid
        );
        assert_eq!(
            finite_float(f64::MIN_POSITIVE * f64::MIN_POSITIVE),
            ScriptValue::Float64(0.0)
        );
    }

    #[test]
    fn executes_the_effective_arithmetic_and_bitwise_instruction_matrices() {
        let constants = [
            WapConstant::Integer32(i32::MAX),
            WapConstant::Float32Bits(2.5f32.to_bits()),
            WapConstant::Utf8String(b"2.5".to_vec()),
        ];
        let cases: Vec<(Vec<u8>, ScriptValue)> = vec![
            (vec![0x15, 0x1b, 0x3a], ScriptValue::Int32(2)),
            (vec![0x15, 0x1c, 0x3a], ScriptValue::Int32(0)),
            (vec![0x15, 0x1f, 0x3a], ScriptValue::Int32(-1)),
            (vec![0x51, 0x15, 0x20, 0x3a], ScriptValue::Float64(3.5)),
            (vec![0x15, 0x16, 0x21, 0x3a], ScriptValue::Int32(2)),
            (vec![0x52, 0x15, 0x22, 0x3a], ScriptValue::Float64(2.5)),
            (vec![0x51, 0x15, 0x23, 0x3a], ScriptValue::Float64(2.5)),
            (vec![0x16, 0x15, 0x24, 0x3a], ScriptValue::Int32(-1)),
            (vec![0x16, 0x15, 0x25, 0x3a], ScriptValue::Int32(0)),
            (vec![0x50, 0x15, 0x20, 0x3a], ScriptValue::Invalid),
            (vec![0x15, 0x15, 0x26, 0x3a], ScriptValue::Int32(1)),
            (vec![0x15, 0x14, 0x27, 0x3a], ScriptValue::Int32(1)),
            (vec![0x15, 0x15, 0x28, 0x3a], ScriptValue::Int32(0)),
            (vec![0x14, 0x29, 0x3a], ScriptValue::Int32(-1)),
            (vec![0x15, 0x15, 0x2a, 0x3a], ScriptValue::Int32(2)),
            (vec![0x16, 0x15, 0x2b, 0x3a], ScriptValue::Int32(-1)),
            (vec![0x16, 0x15, 0x2c, 0x3a], ScriptValue::Int32(i32::MAX)),
        ];
        for (code, expected) in cases {
            assert_eq!(
                execute(&constants, &[(0, 0, &code)]),
                expected,
                "{code:02x?}"
            );
        }

        assert_eq!(
            execute(&[], &[(0, 1, &[0x15, 0x40, 0x15, 0x1d, 0x00, 0xe0, 0x3a])],),
            ScriptValue::Int32(2)
        );
        assert_eq!(
            execute(&[], &[(0, 1, &[0x15, 0x40, 0x15, 0x1e, 0x00, 0xe0, 0x3a])],),
            ScriptValue::Int32(0)
        );
    }

    #[test]
    fn executes_comparison_logical_stack_type_and_debug_instructions() {
        let comparison_cases = [
            (0x2d, true),
            (0x2e, true),
            (0x2f, false),
            (0x30, true),
            (0x31, false),
            (0x32, false),
        ];
        for (opcode, expected) in comparison_cases {
            assert_eq!(
                execute(&[], &[(0, 0, &[0x15, 0x15, opcode, 0x3a])]),
                ScriptValue::Bool(expected)
            );
        }
        assert_eq!(
            execute(&[], &[(0, 0, &[0x18, 0x15, 0x2d, 0x3a])]),
            ScriptValue::Invalid
        );
        assert_eq!(
            execute(&[], &[(0, 0, &[0x14, 0x33, 0x3a])]),
            ScriptValue::Bool(true)
        );
        assert_eq!(
            execute(&[], &[(0, 0, &[0x17, 0x36, 0x3a])]),
            ScriptValue::Bool(false)
        );
        assert_eq!(
            execute(&[], &[(0, 0, &[0x18, 0x39, 0x3a])]),
            ScriptValue::Bool(false)
        );
        assert_eq!(
            execute(&[], &[(0, 0, &[0x17, 0x38, 0x3c, 0x3a])]),
            ScriptValue::Int32(2)
        );
        assert_eq!(
            execute(&[], &[(0, 0, &[0x14, 0x15, 0x37, 0x3a])]),
            ScriptValue::Int32(0)
        );

        let scand = [0x1a, 0x34, 0xc2, 0x19, 0x3a, 0x3a];
        assert_eq!(execute(&[], &[(0, 0, &scand)]), ScriptValue::Bool(false));
        let scor = [0x19, 0x35, 0xc2, 0x1a, 0x3a, 0x3a];
        assert_eq!(execute(&[], &[(0, 0, &scor)]), ScriptValue::Bool(true));
    }

    #[test]
    fn executes_short_byte_and_word_access_and_control_variants() {
        let constants = [WapConstant::Integer32(7), WapConstant::Integer32(2)];
        let cases: &[&[u8]] = &[
            &[0x50, 0x3a],
            &[0x12, 0x00, 0x3a],
            &[0x13, 0x00, 0x00, 0x3a],
        ];
        for code in cases {
            assert_eq!(execute(&constants, &[(0, 0, code)]), ScriptValue::Int32(7));
        }

        assert_eq!(
            execute(&[], &[(0, 1, &[0x15, 0x40, 0xe0, 0x3a])]),
            ScriptValue::Int32(1)
        );
        assert_eq!(
            execute(&[], &[(0, 1, &[0x15, 0x0f, 0x00, 0x0e, 0x00, 0x3a])]),
            ScriptValue::Int32(1)
        );
        assert_eq!(
            execute(&[], &[(0, 1, &[0x15, 0x40, 0x70, 0xe0, 0x3a])]),
            ScriptValue::Int32(2)
        );
        assert_eq!(
            execute(&[], &[(0, 1, &[0x15, 0x40, 0x10, 0x00, 0xe0, 0x3a])]),
            ScriptValue::Int32(2)
        );
        assert_eq!(
            execute(&[], &[(0, 1, &[0x15, 0x40, 0x11, 0x00, 0xe0, 0x3a])]),
            ScriptValue::Int32(0)
        );

        let byte_jump = [0x01, 0x01, 0x14, 0x15, 0x3a];
        assert_eq!(execute(&[], &[(0, 0, &byte_jump)]), ScriptValue::Int32(1));
        let word_jump = [0x02, 0x00, 0x01, 0x14, 0x15, 0x3a];
        assert_eq!(execute(&[], &[(0, 0, &word_jump)]), ScriptValue::Int32(1));
        let byte_conditional = [0x1a, 0x05, 0x03, 0x14, 0x01, 0x01, 0x15, 0x3a];
        assert_eq!(
            execute(&[], &[(0, 0, &byte_conditional)]),
            ScriptValue::Int32(1)
        );
        let word_conditional = [0x1a, 0x06, 0x00, 0x03, 0x14, 0x01, 0x01, 0x15, 0x3a];
        assert_eq!(
            execute(&[], &[(0, 0, &word_conditional)]),
            ScriptValue::Int32(1)
        );

        let short_backward = [0x14, 0x40, 0x70, 0xe0, 0x51, 0x2f, 0xc1, 0xa5, 0xe0, 0x3a];
        assert_eq!(
            execute(&constants, &[(0, 1, &short_backward)]),
            ScriptValue::Int32(2)
        );
        let byte_backward = [
            0x14, 0x40, 0x70, 0xe0, 0x51, 0x2f, 0xc2, 0x03, 0x05, 0xe0, 0x3a,
        ];
        assert_eq!(
            execute(&constants, &[(0, 1, &byte_backward)]),
            ScriptValue::Int32(2)
        );
        let word_backward = [
            0x14, 0x40, 0x70, 0xe0, 0x51, 0x2f, 0xc3, 0x04, 0x00, 0x05, 0xe0, 0x3a,
        ];
        assert_eq!(
            execute(&constants, &[(0, 1, &word_backward)]),
            ScriptValue::Int32(2)
        );
        let byte_conditional_backward =
            [0x14, 0x40, 0x70, 0xe0, 0x51, 0x30, 0x07, 0x04, 0xe0, 0x3a];
        assert_eq!(
            execute(&constants, &[(0, 1, &byte_conditional_backward)]),
            ScriptValue::Int32(2)
        );
        let word_conditional_backward = [
            0x14, 0x40, 0x70, 0xe0, 0x51, 0x30, 0x08, 0x00, 0x04, 0xe0, 0x3a,
        ];
        assert_eq!(
            execute(&constants, &[(0, 1, &word_conditional_backward)]),
            ScriptValue::Int32(2)
        );
    }

    #[test]
    fn executes_local_calls_argument_order_locals_and_returns() {
        let main = [0x14, 0x15, 0x61, 0x3a];
        let callee = [0xe0, 0xe1, 0x21, 0x42, 0xe2, 0xe0, 0x20, 0x3a];
        assert_eq!(
            execute(&[], &[(0, 0, &main), (2, 1, &callee)]),
            ScriptValue::Int32(-1)
        );
        let wide_main = [0x14, 0x15, 0x09, 0x01, 0x3a];
        assert_eq!(
            execute(&[], &[(0, 0, &wide_main), (2, 1, &callee)]),
            ScriptValue::Int32(-1)
        );

        let implicit = [0x61, 0x3a];
        assert_eq!(
            execute(&[], &[(0, 0, &implicit), (0, 1, &[])]),
            ScriptValue::empty_string()
        );
    }

    #[test]
    fn executes_verified_control_flow_and_type_operations() {
        let code = [0x19, 0xc2, 0x14, 0x81, 0x15, 0x38, 0x3a];
        assert_eq!(execute(&[], &[(0, 0, &code)]), ScriptValue::Int32(0));

        let false_branch = [0x1a, 0xc2, 0x14, 0x81, 0x15, 0x38, 0x3a];
        assert_eq!(
            execute(&[], &[(0, 0, &false_branch)]),
            ScriptValue::Int32(0)
        );
    }

    #[test]
    fn preserves_step_call_depth_and_allocation_bounds() {
        let loop_unit = decode_wap_compilation_unit(&unit_with_functions(&[], &[(0, 0, &[0xa0])]))
            .expect("self loop verifies");
        assert_eq!(
            execute_named_function_with_limits(
                &loop_unit,
                "main",
                &[],
                WapRuntimeLimits {
                    max_steps: 3,
                    ..WapRuntimeLimits::default()
                },
            ),
            Err(WapRuntimeError::ExecutionLimitExceeded { limit: 3 })
        );

        let recursive =
            decode_wap_compilation_unit(&unit_with_functions(&[], &[(0, 0, &[0x60, 0x3a])]))
                .expect("recursive call verifies");
        assert_eq!(
            execute_named_function_with_limits(
                &recursive,
                "main",
                &[],
                WapRuntimeLimits {
                    max_call_depth: 2,
                    ..WapRuntimeLimits::default()
                },
            ),
            Err(WapRuntimeError::CallDepthExceeded { limit: 2 })
        );

        let allocation = decode_wap_compilation_unit(&unit_with_functions(
            &[WapConstant::Utf8String(b"abcd".to_vec())],
            &[(0, 0, &[0x50, 0x50, 0x20, 0x3a])],
        ))
        .expect("allocation fixture verifies");
        assert_eq!(
            execute_named_function_with_limits(
                &allocation,
                "main",
                &[],
                WapRuntimeLimits {
                    max_allocated_string_bytes: 8,
                    ..WapRuntimeLimits::default()
                },
            ),
            Err(WapRuntimeError::AllocationLimitExceeded { limit: 8 })
        );
    }
}
