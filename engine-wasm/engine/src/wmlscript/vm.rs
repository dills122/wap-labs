use super::decoder::DecodedUnit;
use super::value::ScriptValue;

const HALT_OPCODE: u8 = 0x00;
const PUSH_INT8_OPCODE: u8 = 0x01;
const ADD_I32_OPCODE: u8 = 0x02;
const PUSH_STRING8_OPCODE: u8 = 0x03;
const STORE_LOCAL_OPCODE: u8 = 0x10;
const LOAD_LOCAL_OPCODE: u8 = 0x11;
const CALL_OPCODE: u8 = 0x12;
const RET_OPCODE: u8 = 0x13;
const CALL_HOST_OPCODE: u8 = 0x20;

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
    InvalidEntryPoint { entry_pc: usize },
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
    Utf8ImmediateDecode,
    HostCallUnavailable { function_id: u8 },
    HostCallError { function_id: u8, message: String },
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

pub trait VmHost {
    fn call(&mut self, function_id: u8, args: &[ScriptValue]) -> Result<ScriptValue, VmTrap>;
}

#[derive(Default)]
struct NoopHost;

impl VmHost for NoopHost {
    fn call(&mut self, function_id: u8, _args: &[ScriptValue]) -> Result<ScriptValue, VmTrap> {
        Err(VmTrap::HostCallUnavailable { function_id })
    }
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
        let mut host = NoopHost;
        self.execute_from_pc_with_host(unit, 0, &mut host)
    }

    pub fn execute_with_host<H: VmHost>(
        &self,
        unit: &DecodedUnit,
        host: &mut H,
    ) -> Result<ScriptValue, VmTrap> {
        self.execute_from_pc_with_host(unit, 0, host)
    }

    pub fn execute_from_pc(
        &self,
        unit: &DecodedUnit,
        entry_pc: usize,
    ) -> Result<ScriptValue, VmTrap> {
        let mut host = NoopHost;
        self.execute_from_pc_with_locals_and_host(unit, entry_pc, Vec::new(), &mut host)
    }

    pub fn execute_from_pc_with_host<H: VmHost>(
        &self,
        unit: &DecodedUnit,
        entry_pc: usize,
        host: &mut H,
    ) -> Result<ScriptValue, VmTrap> {
        self.execute_from_pc_with_locals_and_host(unit, entry_pc, Vec::new(), host)
    }

    pub fn execute_from_pc_with_locals(
        &self,
        unit: &DecodedUnit,
        entry_pc: usize,
        initial_locals: Vec<ScriptValue>,
    ) -> Result<ScriptValue, VmTrap> {
        let mut host = NoopHost;
        self.execute_from_pc_with_locals_and_host(unit, entry_pc, initial_locals, &mut host)
    }

    pub fn execute_from_pc_with_locals_and_host<H: VmHost>(
        &self,
        unit: &DecodedUnit,
        entry_pc: usize,
        initial_locals: Vec<ScriptValue>,
        host: &mut H,
    ) -> Result<ScriptValue, VmTrap> {
        if unit.bytes().is_empty() {
            return Err(VmTrap::EmptyUnit);
        }
        if entry_pc >= unit.bytes().len() {
            return Err(VmTrap::InvalidEntryPoint { entry_pc });
        }

        let mut pc = entry_pc;
        let mut steps = 0usize;
        let mut stack: Vec<ScriptValue> = Vec::new();
        let mut frames = vec![CallFrame {
            return_pc: None,
            locals: initial_locals,
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
                PUSH_STRING8_OPCODE => {
                    let len = usize::from(read_u8(unit.bytes(), &mut pc, opcode)?);
                    let bytes = read_bytes(unit.bytes(), &mut pc, len, opcode)?;
                    let value = String::from_utf8(bytes.to_vec())
                        .map_err(|_| VmTrap::Utf8ImmediateDecode)?;
                    push_stack(
                        &mut stack,
                        ScriptValue::String(value),
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
                CALL_HOST_OPCODE => {
                    let function_id = read_u8(unit.bytes(), &mut pc, opcode)?;
                    let arg_count = usize::from(read_u8(unit.bytes(), &mut pc, opcode)?);

                    let mut args = Vec::with_capacity(arg_count);
                    for _ in 0..arg_count {
                        let value = stack.pop().ok_or(VmTrap::StackUnderflow)?;
                        args.push(value);
                    }
                    args.reverse();

                    let result = host.call(function_id, &args)?;
                    push_stack(&mut stack, result, self.limits.max_stack_size)?;
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

fn read_bytes<'a>(
    bytes: &'a [u8],
    pc: &mut usize,
    len: usize,
    opcode: u8,
) -> Result<&'a [u8], VmTrap> {
    if bytes.len().saturating_sub(*pc) < len {
        return Err(VmTrap::TruncatedImmediate { opcode });
    }
    let start = *pc;
    *pc += len;
    Ok(&bytes[start..start + len])
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
    use super::{pop_int32, ExecutionLimits, Vm, VmHost, VmTrap};
    use crate::wmlscript::decoder::decode_compilation_unit;
    use crate::wmlscript::value::ScriptValue;

    #[derive(Default)]
    struct EchoHost;

    impl VmHost for EchoHost {
        fn call(&mut self, function_id: u8, args: &[ScriptValue]) -> Result<ScriptValue, VmTrap> {
            match function_id {
                1 => Ok(args
                    .first()
                    .cloned()
                    .unwrap_or_else(ScriptValue::empty_string)),
                _ => Err(VmTrap::HostCallError {
                    function_id,
                    message: "unknown".to_string(),
                }),
            }
        }
    }

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
    fn execute_from_pc_uses_entry_point() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x01, 1, 0x00, 0x01, 9, 0x00]).expect("unit decode");

        let value = vm
            .execute_from_pc(&unit, 3)
            .expect("entry pc should execute second sequence");
        assert_eq!(value, ScriptValue::Int32(9));
    }

    #[test]
    fn execute_from_pc_rejects_invalid_entry_point() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x00]).expect("unit decode");

        let err = vm
            .execute_from_pc(&unit, 4)
            .expect_err("invalid entry should trap");
        assert_eq!(err, VmTrap::InvalidEntryPoint { entry_pc: 4 });
    }

    #[test]
    fn execute_from_pc_with_locals_uses_arguments() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x11, 0, 0x11, 1, 0x02, 0x00]).expect("unit decode");

        let value = vm
            .execute_from_pc_with_locals(
                &unit,
                0,
                vec![ScriptValue::Int32(3), ScriptValue::Int32(4)],
            )
            .expect("locals should be visible");
        assert_eq!(value, ScriptValue::Int32(7));
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

    #[test]
    fn execute_push_string_and_halt_returns_string() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x03, 5, b'h', b'e', b'l', b'l', b'o', 0x00])
            .expect("unit decode");

        let value = vm.execute(&unit).expect("string push should execute");
        assert_eq!(value, ScriptValue::String("hello".to_string()));
    }

    #[test]
    fn execute_host_call_without_host_traps() {
        let vm = Vm::default();
        let unit = decode_compilation_unit(&[0x20, 1, 0, 0x00]).expect("unit decode");

        let err = vm
            .execute(&unit)
            .expect_err("hostcall must trap without host");
        assert_eq!(err, VmTrap::HostCallUnavailable { function_id: 1 });
    }

    #[test]
    fn execute_host_call_with_host_returns_value() {
        let vm = Vm::default();
        let mut host = EchoHost;
        let unit = decode_compilation_unit(&[
            0x03, 2, b'o', b'k', // arg0
            0x20, 1, 1, // host fn 1 with 1 arg
            0x00,
        ])
        .expect("unit decode");

        let value = vm
            .execute_with_host(&unit, &mut host)
            .expect("hostcall should execute");
        assert_eq!(value, ScriptValue::String("ok".to_string()));
    }
}
