//! Single source of truth for WMLScript bytecode opcode values.
//!
//! Both the structural decoder (`super::decoder`) and the interpreter
//! (`super::vm`) dispatch on these numbers, so they are defined once here to
//! keep the two in lockstep.

pub(crate) const HALT_OPCODE: u8 = 0x00;
pub(crate) const PUSH_INT8_OPCODE: u8 = 0x01;
pub(crate) const ADD_I32_OPCODE: u8 = 0x02;
pub(crate) const PUSH_STRING8_OPCODE: u8 = 0x03;
pub(crate) const STORE_LOCAL_OPCODE: u8 = 0x10;
pub(crate) const LOAD_LOCAL_OPCODE: u8 = 0x11;
pub(crate) const CALL_OPCODE: u8 = 0x12;
pub(crate) const RET_OPCODE: u8 = 0x13;
pub(crate) const CALL_HOST_OPCODE: u8 = 0x20;
