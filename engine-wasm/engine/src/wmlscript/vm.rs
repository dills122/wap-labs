use super::decoder::DecodedUnit;
use super::value::ScriptValue;

const HALT_OPCODE: u8 = 0x00;
const PUSH_INT8_OPCODE: u8 = 0x01;
const ADD_I32_OPCODE: u8 = 0x02;
const STORE_LOCAL_OPCODE: u8 = 0x10;
const LOAD_LOCAL_OPCODE: u8 = 0x11;
const CALL_OPCODE: u8 = 0x12;
const RET_OPCODE: u8 = 0x13;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ExecutionLimits {
    pub max_steps: usize,
    pub max_stack_size: usize,
    pub max_call_depth: usize,
}

impl Default for ExecutionLimits {
    fn default() -> Self {
        Self {
            max_steps: 512,
            max_stack_size: 64,
            max_call_depth: 16,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VmTrap {
    EmptyUnit,
    UnsupportedOpcode(u8),
    TruncatedImmediate { opcode: u8 },
    StackOverflow { limit: usize },
    StackUnderflow,
    TypeError(&'static str),
    InvalidLocalIndex { index: usize },
    InvalidCallTarget { target: usize },
    CallDepthExceeded { limit: usize },
    ReturnFromRootFrame,
    ExecutionLimitExceeded { limit: usize },
}

#[derive(Debug, Clone)]
pub struct Vm {
    limits: ExecutionLimits,
}

#[derive(Debug, Clone)]
struct CallFrame {
    return_pc: Option<usize>,
    locals: Vec<ScriptValue>,
}

impl Default for Vm {
    fn default() -> Self {
        Self::new(ExecutionLimits::default())
    }
}

impl Vm {
    pub fn new(limits: ExecutionLimits) -> Self {
        Self { limits }
    }

    pub fn execute(&self, unit: &DecodedUnit) -> Result<ScriptValue, VmTrap> {
        if unit.bytes().is_empty() {
            return Err(VmTrap::EmptyUnit);
        }

        let mut pc = 0usize;
        let mut steps = 0usize;
        let mut stack: Vec<ScriptValue> = Vec::new();
        let mut frames = vec![CallFrame {
            return_pc: None,
            locals: Vec::new(),
        }];

        while pc < unit.bytes().len() {
            if steps >= self.limits.max_steps {
                return Err(VmTrap::ExecutionLimitExceeded {
                    limit: self.limits.max_steps,
                });
            }
            steps += 1;

            let opcode = unit.bytes()[pc];
            pc += 1;

            match opcode {
                HALT_OPCODE => {
                    return Ok(stack.pop().unwrap_or_else(ScriptValue::empty_string));
                }
                PUSH_INT8_OPCODE => {
                    let next = read_u8(unit.bytes(), &mut pc, opcode)?;

                    push_stack(
                        &mut stack,
                        ScriptValue::Int32(i32::from(next as i8)),
                        self.limits.max_stack_size,
                    )?;
                }
                ADD_I32_OPCODE => {
                    let rhs = pop_int32(&mut stack)?;
                    let lhs = pop_int32(&mut stack)?;
                    push_stack(
                        &mut stack,
                        ScriptValue::Int32(lhs.saturating_add(rhs)),
                        self.limits.max_stack_size,
                    )?;
                }
                STORE_LOCAL_OPCODE => {
                    let idx = usize::from(read_u8(unit.bytes(), &mut pc, opcode)?);
                    let value = stack.pop().ok_or(VmTrap::StackUnderflow)?;
                    let current = current_frame_mut(&mut frames);
                    let local = current
                        .locals
                        .get_mut(idx)
                        .ok_or(VmTrap::InvalidLocalIndex { index: idx })?;
                    *local = value;
                }
                LOAD_LOCAL_OPCODE => {
                    let idx = usize::from(read_u8(unit.bytes(), &mut pc, opcode)?);
                    let current = current_frame(&frames);
                    let value = current
                        .locals
                        .get(idx)
                        .cloned()
                        .ok_or(VmTrap::InvalidLocalIndex { index: idx })?;
                    push_stack(&mut stack, value, self.limits.max_stack_size)?;
                }
                CALL_OPCODE => {
                    let target = usize::from(read_u8(unit.bytes(), &mut pc, opcode)?);
                    let arg_count = usize::from(read_u8(unit.bytes(), &mut pc, opcode)?);
                    let local_count = usize::from(read_u8(unit.bytes(), &mut pc, opcode)?);

                    if target >= unit.bytes().len() {
                        return Err(VmTrap::InvalidCallTarget { target });
                    }
                    if frames.len() > self.limits.max_call_depth {
                        return Err(VmTrap::CallDepthExceeded {
                            limit: self.limits.max_call_depth,
                        });
                    }

                    let mut args = Vec::with_capacity(arg_count);
                    for _ in 0..arg_count {
                        let value = stack.pop().ok_or(VmTrap::StackUnderflow)?;
                        args.push(value);
                    }
                    args.reverse();

                    let mut locals = args;
                    locals.resize(arg_count + local_count, ScriptValue::empty_string());
                    frames.push(CallFrame {
                        return_pc: Some(pc),
                        locals,
                    });
                    pc = target;
                }
                RET_OPCODE => {
                    if frames.len() == 1 {
                        return Err(VmTrap::ReturnFromRootFrame);
                    }
                    let return_value = stack.pop().unwrap_or_else(ScriptValue::empty_string);
                    let frame = frames.pop().ok_or(VmTrap::ReturnFromRootFrame)?;
                    pc = frame.return_pc.ok_or(VmTrap::ReturnFromRootFrame)?;
                    push_stack(&mut stack, return_value, self.limits.max_stack_size)?;
                }
                _ => {
                    return Err(VmTrap::UnsupportedOpcode(opcode));
                }
            }
        }

        Ok(stack.pop().unwrap_or_else(ScriptValue::empty_string))
    }
}

fn read_u8(bytes: &[u8], pc: &mut usize, opcode: u8) -> Result<u8, VmTrap> {
    let Some(value) = bytes.get(*pc) else {
        return Err(VmTrap::TruncatedImmediate { opcode });
    };
    *pc += 1;
    Ok(*value)
}

fn current_frame(frames: &[CallFrame]) -> &CallFrame {
    frames
        .last()
        .expect("vm must always contain at least root call frame")
}

fn current_frame_mut(frames: &mut [CallFrame]) -> &mut CallFrame {
    frames
        .last_mut()
        .expect("vm must always contain at least root call frame")
}

fn push_stack(
    stack: &mut Vec<ScriptValue>,
    value: ScriptValue,
    max_stack_size: usize,
) -> Result<(), VmTrap> {
    if stack.len() >= max_stack_size {
        return Err(VmTrap::StackOverflow {
            limit: max_stack_size,
        });
    }
    stack.push(value);
    Ok(())
}

fn pop_int32(stack: &mut Vec<ScriptValue>) -> Result<i32, VmTrap> {
    let Some(value) = stack.pop() else {
        return Err(VmTrap::StackUnderflow);
    };

    match value {
        ScriptValue::Int32(value) => Ok(value),
        _ => Err(VmTrap::TypeError("expected int32")),
    }
}

#[cfg(test)]
mod tests {
    use super::{pop_int32, ExecutionLimits, Vm, VmTrap};
    use crate::wmlscript::decoder::decode_compilation_unit;
    use crate::wmlscript::value::ScriptValue;

    #[test]
    fn execute_returns_empty_string_on_halt_opcode() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x00]).expect("unit must decode");

        let value = vm.execute(&unit).expect("halt-only unit must execute");
        assert_eq!(value, ScriptValue::empty_string());
    }

    #[test]
    fn execute_rejects_unknown_opcode() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0xff]).expect("unit must decode");

        let err = vm
            .execute(&unit)
            .expect_err("unknown opcode should trap deterministically");
        assert_eq!(err, VmTrap::UnsupportedOpcode(0xff));
    }

    #[test]
    fn execute_push_and_add_returns_expected_sum() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x01, 5, 0x01, 7, 0x02, 0x00]).expect("unit decode");

        let value = vm.execute(&unit).expect("unit should execute");
        assert_eq!(value, ScriptValue::Int32(12));
    }

    #[test]
    fn execute_add_without_operands_traps_underflow() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x02, 0x00]).expect("unit decode");

        let err = vm.execute(&unit).expect_err("must trap on underflow");
        assert_eq!(err, VmTrap::StackUnderflow);
    }

    #[test]
    fn execute_traps_on_truncated_push_immediate() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x01]).expect("unit decode");

        let err = vm.execute(&unit).expect_err("missing immediate must trap");
        assert_eq!(err, VmTrap::TruncatedImmediate { opcode: 0x01 });
    }

    #[test]
    fn execute_traps_on_stack_overflow() {
        let vm = Vm::new(ExecutionLimits {
            max_steps: 8,
            max_stack_size: 1,
            max_call_depth: 16,
        });
        let unit = decode_compilation_unit(&[0x01, 2, 0x01, 3, 0x00]).expect("unit decode");

        let err = vm.execute(&unit).expect_err("overflow should trap");
        assert_eq!(err, VmTrap::StackOverflow { limit: 1 });
    }

    #[test]
    fn pop_int32_traps_on_type_mismatch() {
        let mut stack = vec![ScriptValue::String("x".to_string())];
        let err = pop_int32(&mut stack).expect_err("non-int value must trap");
        assert_eq!(err, VmTrap::TypeError("expected int32"));
    }

    #[test]
    fn execute_enforces_step_limit() {
        let vm = Vm::new(ExecutionLimits {
            max_steps: 0,
            max_stack_size: 64,
            max_call_depth: 16,
        });
        let unit = decode_compilation_unit(&[0x00]).expect("unit must decode");

        let err = vm.execute(&unit).expect_err("step limit should trap");
        assert_eq!(err, VmTrap::ExecutionLimitExceeded { limit: 0 });
    }

    #[test]
    fn execute_call_and_return_with_arg_local_flow() {
        let vm = Vm::default();
        // main:
        // push 5
        // call fn@7 args=1 locals=1
        // halt
        // fn@7:
        // load local0 (arg)
        // push 1
        // add
        // store local1
        // load local1
        // ret
        let unit = decode_compilation_unit(&[
            0x01, 5, 0x12, 7, 1, 1, 0x00, 0x11, 0, 0x01, 1, 0x02, 0x10, 1, 0x11, 1, 0x13,
        ])
        .expect("unit decode");

        let value = vm.execute(&unit).expect("call should execute");
        assert_eq!(value, ScriptValue::Int32(6));
    }

    #[test]
    fn execute_call_depth_limit_traps() {
        let vm = Vm::new(ExecutionLimits {
            max_steps: 32,
            max_stack_size: 16,
            max_call_depth: 1,
        });
        // main call fn@7, fn@7 immediately calls fn@7 again.
        let unit = decode_compilation_unit(&[0x12, 7, 0, 0, 0x00, 0x00, 0x00, 0x12, 7, 0, 0, 0x13])
            .expect("unit decode");

        let err = vm.execute(&unit).expect_err("depth must trap");
        assert_eq!(err, VmTrap::CallDepthExceeded { limit: 1 });
    }

    #[test]
    fn execute_invalid_local_index_traps() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x11, 0, 0x00]).expect("unit decode");

        let err = vm.execute(&unit).expect_err("missing local must trap");
        assert_eq!(err, VmTrap::InvalidLocalIndex { index: 0 });
    }

    #[test]
    fn execute_invalid_call_target_traps() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x12, 255, 0, 0]).expect("unit decode");

        let err = vm.execute(&unit).expect_err("invalid target must trap");
        assert_eq!(err, VmTrap::InvalidCallTarget { target: 255 });
    }

    #[test]
    fn execute_return_from_root_traps() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x13]).expect("unit decode");

        let err = vm.execute(&unit).expect_err("return from root must trap");
        assert_eq!(err, VmTrap::ReturnFromRootFrame);
    }
}
