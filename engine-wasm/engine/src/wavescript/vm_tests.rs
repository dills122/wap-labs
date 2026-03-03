use super::{pop_int32, ExecutionLimits, Vm, VmHost, VmTrap};
use crate::wavescript::decoder::{decode_compilation_unit, DecodeError};
use crate::wavescript::value::ScriptValue;

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
    let err = decode_compilation_unit(&[0xff]).expect_err("unknown opcode should fail at decode");
    assert_eq!(
        err,
        DecodeError::UnsupportedOpcode {
            pc: 0,
            opcode: 0xff
        }
    );
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
        .execute_from_pc_with_locals(&unit, 0, vec![ScriptValue::Int32(3), ScriptValue::Int32(4)])
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
    let err = decode_compilation_unit(&[0x01]).expect_err("missing immediate must fail");
    assert_eq!(
        err,
        DecodeError::TruncatedImmediate {
            pc: 0,
            opcode: 0x01
        }
    );
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
fn execute_return_without_value_uses_deterministic_empty_string() {
    let vm = Vm::default();
    // main: call fn@5 args=0 locals=0; halt
    // fn@5: ret (no pushed value)
    let unit = decode_compilation_unit(&[0x12, 5, 0, 0, 0x00, 0x13]).expect("unit decode");

    let value = vm
        .execute(&unit)
        .expect("return without value should still complete");
    assert_eq!(value, ScriptValue::empty_string());
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
    let err = decode_compilation_unit(&[0x12, 255, 0, 0]).expect_err("invalid target must fail");
    assert_eq!(err, DecodeError::InvalidCallTarget { pc: 0, target: 255 });
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

#[test]
fn execute_trap_is_recoverable_for_subsequent_runs() {
    let vm = Vm::default();
    let trap_unit = decode_compilation_unit(&[0x02, 0x00]).expect("trap unit decode");
    let ok_unit = decode_compilation_unit(&[0x01, 7, 0x00]).expect("ok unit decode");

    let err = vm.execute(&trap_unit).expect_err("first run must trap");
    assert_eq!(err, VmTrap::StackUnderflow);

    let value = vm
        .execute(&ok_unit)
        .expect("subsequent execution must remain functional");
    assert_eq!(value, ScriptValue::Int32(7));
}
