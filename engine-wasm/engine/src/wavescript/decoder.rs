use std::collections::HashSet;

pub const MAX_COMPILATION_UNIT_BYTES: usize = 64 * 1024;

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
pub struct DecodeLimits {
    pub max_unit_bytes: usize,
    pub max_local_index: usize,
    pub max_call_arg_count: usize,
    pub max_call_local_count: usize,
    pub max_call_frame_locals: usize,
    pub max_host_arg_count: usize,
}

impl Default for DecodeLimits {
    fn default() -> Self {
        Self {
            max_unit_bytes: MAX_COMPILATION_UNIT_BYTES,
            max_local_index: 255,
            max_call_arg_count: 64,
            max_call_local_count: 64,
            max_call_frame_locals: 128,
            max_host_arg_count: 64,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DecodeError {
    EmptyUnit,
    UnitTooLarge {
        size: usize,
        limit: usize,
    },
    UnsupportedOpcode {
        pc: usize,
        opcode: u8,
    },
    TruncatedImmediate {
        pc: usize,
        opcode: u8,
    },
    InvalidLocalIndex {
        pc: usize,
        index: usize,
        limit: usize,
    },
    InvalidCallArity {
        pc: usize,
        arg_count: usize,
        local_count: usize,
        frame_locals: usize,
        limit: usize,
    },
    InvalidHostArgCount {
        pc: usize,
        arg_count: usize,
        limit: usize,
    },
    InvalidCallTarget {
        pc: usize,
        target: usize,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecodedUnit {
    bytes: Vec<u8>,
    instruction_starts: HashSet<usize>,
}

impl DecodedUnit {
    pub fn bytes(&self) -> &[u8] {
        &self.bytes
    }

    pub fn is_instruction_boundary(&self, pc: usize) -> bool {
        self.instruction_starts.contains(&pc)
    }
}

pub fn decode_compilation_unit(bytes: &[u8]) -> Result<DecodedUnit, DecodeError> {
    decode_compilation_unit_with_limits(bytes, DecodeLimits::default())
}

pub fn decode_compilation_unit_with_limits(
    bytes: &[u8],
    limits: DecodeLimits,
) -> Result<DecodedUnit, DecodeError> {
    if bytes.is_empty() {
        return Err(DecodeError::EmptyUnit);
    }

    if bytes.len() > limits.max_unit_bytes {
        return Err(DecodeError::UnitTooLarge {
            size: bytes.len(),
            limit: limits.max_unit_bytes,
        });
    }

    let instruction_starts = verify_unit_structure(bytes, limits)?;

    Ok(DecodedUnit {
        bytes: bytes.to_vec(),
        instruction_starts,
    })
}

fn verify_unit_structure(
    bytes: &[u8],
    limits: DecodeLimits,
) -> Result<HashSet<usize>, DecodeError> {
    let mut pc = 0usize;
    let mut starts = HashSet::new();
    let mut call_targets: Vec<(usize, usize)> = Vec::new();

    while pc < bytes.len() {
        starts.insert(pc);
        let op_pc = pc;
        let opcode = bytes[pc];
        pc += 1;

        match opcode {
            HALT_OPCODE | ADD_I32_OPCODE | RET_OPCODE => {}
            PUSH_INT8_OPCODE => {
                read_u8(bytes, &mut pc, op_pc, opcode)?;
            }
            STORE_LOCAL_OPCODE | LOAD_LOCAL_OPCODE => {
                let index = usize::from(read_u8(bytes, &mut pc, op_pc, opcode)?);
                if index > limits.max_local_index {
                    return Err(DecodeError::InvalidLocalIndex {
                        pc: op_pc,
                        index,
                        limit: limits.max_local_index,
                    });
                }
            }
            PUSH_STRING8_OPCODE => {
                let len = usize::from(read_u8(bytes, &mut pc, op_pc, opcode)?);
                read_bytes(bytes, &mut pc, len, op_pc, opcode)?;
            }
            CALL_OPCODE => {
                let target = usize::from(read_u8(bytes, &mut pc, op_pc, opcode)?);
                let arg_count = usize::from(read_u8(bytes, &mut pc, op_pc, opcode)?);
                let local_count = usize::from(read_u8(bytes, &mut pc, op_pc, opcode)?);
                let frame_locals = arg_count.saturating_add(local_count);
                if arg_count > limits.max_call_arg_count
                    || local_count > limits.max_call_local_count
                    || frame_locals > limits.max_call_frame_locals
                {
                    return Err(DecodeError::InvalidCallArity {
                        pc: op_pc,
                        arg_count,
                        local_count,
                        frame_locals,
                        limit: limits.max_call_frame_locals,
                    });
                }
                call_targets.push((op_pc, target));
            }
            CALL_HOST_OPCODE => {
                read_u8(bytes, &mut pc, op_pc, opcode)?; // function_id
                let arg_count = usize::from(read_u8(bytes, &mut pc, op_pc, opcode)?); // arg_count
                if arg_count > limits.max_host_arg_count {
                    return Err(DecodeError::InvalidHostArgCount {
                        pc: op_pc,
                        arg_count,
                        limit: limits.max_host_arg_count,
                    });
                }
            }
            _ => {
                return Err(DecodeError::UnsupportedOpcode { pc: op_pc, opcode });
            }
        }
    }

    for (op_pc, target) in call_targets {
        if !starts.contains(&target) {
            return Err(DecodeError::InvalidCallTarget { pc: op_pc, target });
        }
    }

    Ok(starts)
}

fn read_u8(bytes: &[u8], pc: &mut usize, op_pc: usize, opcode: u8) -> Result<u8, DecodeError> {
    let Some(value) = bytes.get(*pc) else {
        return Err(DecodeError::TruncatedImmediate { pc: op_pc, opcode });
    };
    *pc += 1;
    Ok(*value)
}

fn read_bytes(
    bytes: &[u8],
    pc: &mut usize,
    len: usize,
    op_pc: usize,
    opcode: u8,
) -> Result<(), DecodeError> {
    if bytes.len().saturating_sub(*pc) < len {
        return Err(DecodeError::TruncatedImmediate { pc: op_pc, opcode });
    }
    *pc += len;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        decode_compilation_unit, decode_compilation_unit_with_limits, DecodeError, DecodeLimits,
        DecodedUnit, HALT_OPCODE, MAX_COMPILATION_UNIT_BYTES,
    };

    #[test]
    fn decode_rejects_empty_input() {
        let err = decode_compilation_unit(&[]).expect_err("empty unit must be rejected");
        assert_eq!(err, DecodeError::EmptyUnit);
    }

    #[test]
    fn decode_rejects_oversized_input() {
        let bytes = vec![0; MAX_COMPILATION_UNIT_BYTES + 1];
        let err = decode_compilation_unit(&bytes).expect_err("oversized unit must fail");
        assert_eq!(
            err,
            DecodeError::UnitTooLarge {
                size: MAX_COMPILATION_UNIT_BYTES + 1,
                limit: MAX_COMPILATION_UNIT_BYTES,
            }
        );
    }

    #[test]
    fn decode_preserves_valid_bytes() {
        let expected = vec![0x10, 0x20, 0x00];
        let decoded = decode_compilation_unit(&expected).expect("valid bytes should decode");
        assert_eq!(
            decoded,
            DecodedUnit {
                bytes: expected.clone(),
                instruction_starts: [0usize, 2usize].into_iter().collect(),
            }
        );
        assert_eq!(decoded.bytes(), expected.as_slice());
        assert!(decoded.is_instruction_boundary(0));
        assert!(decoded.is_instruction_boundary(2));
        assert!(!decoded.is_instruction_boundary(1));
    }

    #[test]
    fn decode_accepts_unit_at_exact_size_limit() {
        let bytes = vec![HALT_OPCODE; MAX_COMPILATION_UNIT_BYTES];
        let decoded = decode_compilation_unit(&bytes).expect("max-sized unit should decode");
        assert_eq!(decoded.bytes().len(), MAX_COMPILATION_UNIT_BYTES);
    }

    #[test]
    fn decode_respects_custom_bounds() {
        let limits = DecodeLimits {
            max_unit_bytes: 3,
            ..DecodeLimits::default()
        };

        let ok = decode_compilation_unit_with_limits(&[0x00, 0x00, 0x00], limits)
            .expect("unit at custom limit should decode");
        assert_eq!(ok.bytes(), &[0x00, 0x00, 0x00]);

        let err = decode_compilation_unit_with_limits(&[0x00, 0x00, 0x00, 0x00], limits)
            .expect_err("unit above custom limit should fail");
        assert_eq!(err, DecodeError::UnitTooLarge { size: 4, limit: 3 });
    }

    #[test]
    fn decode_rejects_unknown_opcode() {
        let err = decode_compilation_unit(&[0xff]).expect_err("unknown opcode must fail");
        assert_eq!(
            err,
            DecodeError::UnsupportedOpcode {
                pc: 0,
                opcode: 0xff
            }
        );
    }

    #[test]
    fn decode_rejects_truncated_immediate() {
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
    fn decode_rejects_call_target_not_on_instruction_boundary() {
        // 0: CALL target=2 arg=0 locals=0
        // 4: HALT
        // target 2 points into the middle of CALL immediates.
        let err = decode_compilation_unit(&[0x12, 0x02, 0x00, 0x00, 0x00])
            .expect_err("misaligned call target must fail");
        assert_eq!(err, DecodeError::InvalidCallTarget { pc: 0, target: 2 });
    }

    #[test]
    fn decode_accepts_call_target_on_instruction_boundary() {
        // 0: CALL target=4 arg=0 locals=0
        // 4: HALT
        let decoded = decode_compilation_unit(&[0x12, 0x04, 0x00, 0x00, 0x00])
            .expect("valid call target should decode");
        assert!(decoded.is_instruction_boundary(0));
        assert!(decoded.is_instruction_boundary(4));
    }

    #[test]
    fn decode_rejects_local_index_above_limit() {
        let limits = DecodeLimits {
            max_local_index: 0,
            ..DecodeLimits::default()
        };
        let err = decode_compilation_unit_with_limits(&[0x10, 0x01, 0x00], limits)
            .expect_err("local index above configured limit must fail");
        assert_eq!(
            err,
            DecodeError::InvalidLocalIndex {
                pc: 0,
                index: 1,
                limit: 0
            }
        );
    }

    #[test]
    fn decode_rejects_call_arity_above_limits() {
        // 0: CALL target=4 arg=65 locals=0, 4: HALT
        let err = decode_compilation_unit(&[0x12, 0x04, 0x41, 0x00, 0x00])
            .expect_err("call arity above decoder limits must fail");
        assert_eq!(
            err,
            DecodeError::InvalidCallArity {
                pc: 0,
                arg_count: 65,
                local_count: 0,
                frame_locals: 65,
                limit: 128,
            }
        );
    }

    #[test]
    fn decode_rejects_host_call_arg_count_above_limit() {
        let limits = DecodeLimits {
            max_host_arg_count: 0,
            ..DecodeLimits::default()
        };
        let err = decode_compilation_unit_with_limits(&[0x20, 0x01, 0x01, 0x00], limits)
            .expect_err("host arg count above configured limit must fail");
        assert_eq!(
            err,
            DecodeError::InvalidHostArgCount {
                pc: 0,
                arg_count: 1,
                limit: 0
            }
        );
    }
}
