use std::collections::{HashSet, VecDeque};
use std::fmt;

pub const WAP_BYTECODE_VERSION: u8 = 0x01;
pub const MAX_WAP_COMPILATION_UNIT_BYTES: usize = 64 * 1024;
/// Deterministic strict-mode resource ceiling for a WAP operand stack.
///
/// WAP-193_101 section 12.3.3.1 permits an interpreter-defined stack
/// exhaustion boundary. Keeping that boundary in the strict decoder makes a
/// statically provable overflow fail before execution on both native and WASM.
pub const MAX_WAP_OPERAND_STACK_DEPTH: usize = 64;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WapDecodeError {
    EmptyUnit,
    UnitTooLarge {
        size: usize,
        limit: usize,
    },
    Truncated {
        offset: usize,
        field: &'static str,
    },
    InvalidMultiByteInteger {
        offset: usize,
        field: &'static str,
    },
    UnsupportedVersion {
        version: u8,
    },
    CodeSizeMismatch {
        declared: usize,
        actual: usize,
    },
    UnsupportedConstantType {
        offset: usize,
        constant_type: u8,
    },
    InvalidUtf8 {
        offset: usize,
        field: &'static str,
    },
    UnsupportedPragmaType {
        offset: usize,
        pragma_type: u8,
    },
    DuplicateAccessPragma {
        pragma_type: u8,
    },
    InvalidConstantIndex {
        offset: usize,
        index: usize,
    },
    InvalidConstantType {
        offset: usize,
        index: usize,
    },
    InvalidFunctionNameCount {
        count: usize,
    },
    InvalidFunctionIndex {
        offset: usize,
        index: usize,
    },
    FunctionNamesOutOfOrder {
        offset: usize,
        previous: usize,
        index: usize,
    },
    InvalidFunctionName {
        offset: usize,
    },
    InvalidFrameSize {
        function: usize,
        size: usize,
    },
    TrailingBytes {
        offset: usize,
        count: usize,
    },
    UnsupportedOpcode {
        function: usize,
        pc: usize,
        opcode: u8,
    },
    TruncatedInstruction {
        function: usize,
        pc: usize,
        opcode: u8,
    },
    InvalidVariableIndex {
        function: usize,
        pc: usize,
        index: usize,
        limit: usize,
    },
    InvalidConstantReference {
        function: usize,
        pc: usize,
        index: usize,
    },
    InvalidFunctionReference {
        function: usize,
        pc: usize,
        index: usize,
    },
    InvalidLibraryIndex {
        function: usize,
        pc: usize,
        index: usize,
    },
    InvalidLibraryFunctionIndex {
        function: usize,
        pc: usize,
        library_index: usize,
        function_index: usize,
    },
    InvalidJumpTarget {
        function: usize,
        pc: usize,
        target: usize,
    },
    StackUnderflow {
        function: usize,
        pc: usize,
        required: usize,
        available: usize,
    },
    StackOverflow {
        function: usize,
        pc: usize,
        depth: usize,
        limit: usize,
    },
    InconsistentStackDepth {
        function: usize,
        pc: usize,
        expected: usize,
        actual: usize,
    },
}

impl WapDecodeError {
    /// WAP-193_101 classifies stack overflow as a resource-exhaustion error;
    /// all other strict decoding/dataflow failures in this type are bytecode
    /// integrity errors.
    pub fn is_resource_exhaustion(&self) -> bool {
        matches!(self, Self::StackOverflow { .. })
    }
}

impl fmt::Display for WapDecodeError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyUnit => write!(formatter, "empty compilation unit"),
            Self::UnitTooLarge { size, limit } => {
                write!(formatter, "unit too large (size={size}, limit={limit})")
            }
            Self::Truncated { offset, field } => {
                write!(formatter, "truncated {field} at offset={offset}")
            }
            Self::InvalidMultiByteInteger { offset, field } => {
                write!(formatter, "invalid multi-byte integer for {field} at offset={offset}")
            }
            Self::UnsupportedVersion { version } => {
                write!(formatter, "unsupported version 0x{version:02x}")
            }
            Self::CodeSizeMismatch { declared, actual } => {
                write!(formatter, "code size mismatch (declared={declared}, actual={actual})")
            }
            Self::UnsupportedConstantType {
                offset,
                constant_type,
            } => write!(
                formatter,
                "unsupported constant type {constant_type} at offset={offset}"
            ),
            Self::InvalidUtf8 { offset, field } => {
                write!(formatter, "invalid UTF-8 for {field} at offset={offset}")
            }
            Self::UnsupportedPragmaType {
                offset,
                pragma_type,
            } => write!(
                formatter,
                "unsupported pragma type {pragma_type} at offset={offset}"
            ),
            Self::DuplicateAccessPragma { pragma_type } => {
                write!(formatter, "duplicate access pragma type {pragma_type}")
            }
            Self::InvalidConstantIndex { offset, index } => {
                write!(formatter, "invalid constant index {index} at offset={offset}")
            }
            Self::InvalidConstantType { offset, index } => write!(
                formatter,
                "invalid constant type at index {index} referenced from offset={offset}"
            ),
            Self::InvalidFunctionNameCount { count } => {
                write!(formatter, "invalid function-name count {count}")
            }
            Self::InvalidFunctionIndex { offset, index } => {
                write!(formatter, "invalid function index {index} at offset={offset}")
            }
            Self::FunctionNamesOutOfOrder {
                offset,
                previous,
                index,
            } => write!(
                formatter,
                "function names out of order at offset={offset} (previous={previous}, index={index})"
            ),
            Self::InvalidFunctionName { offset } => {
                write!(formatter, "invalid function name at offset={offset}")
            }
            Self::InvalidFrameSize { function, size } => {
                write!(formatter, "invalid frame size {size} in function {function}")
            }
            Self::TrailingBytes { offset, count } => {
                write!(formatter, "{count} trailing bytes at offset={offset}")
            }
            Self::UnsupportedOpcode {
                function,
                pc,
                opcode,
            } => write!(
                formatter,
                "unsupported opcode 0x{opcode:02x} in function {function} at pc={pc}"
            ),
            Self::TruncatedInstruction {
                function,
                pc,
                opcode,
            } => write!(
                formatter,
                "truncated instruction 0x{opcode:02x} in function {function} at pc={pc}"
            ),
            Self::InvalidVariableIndex {
                function,
                pc,
                index,
                limit,
            } => write!(
                formatter,
                "invalid variable index {index} in function {function} at pc={pc} (limit={limit})"
            ),
            Self::InvalidConstantReference {
                function,
                pc,
                index,
            } => write!(
                formatter,
                "invalid constant reference {index} in function {function} at pc={pc}"
            ),
            Self::InvalidFunctionReference {
                function,
                pc,
                index,
            } => write!(
                formatter,
                "invalid function reference {index} in function {function} at pc={pc}"
            ),
            Self::InvalidLibraryIndex {
                function,
                pc,
                index,
            } => write!(
                formatter,
                "invalid standard-library index {index} in function {function} at pc={pc}"
            ),
            Self::InvalidLibraryFunctionIndex {
                function,
                pc,
                library_index,
                function_index,
            } => write!(
                formatter,
                "invalid standard-library function index {function_index} for library {library_index} in function {function} at pc={pc}"
            ),
            Self::InvalidJumpTarget {
                function,
                pc,
                target,
            } => write!(
                formatter,
                "invalid jump target {target} in function {function} at pc={pc}"
            ),
            Self::StackUnderflow {
                function,
                pc,
                required,
                available,
            } => write!(
                formatter,
                "stack underflow in function {function} at pc={pc} (required={required}, available={available})"
            ),
            Self::StackOverflow {
                function,
                pc,
                depth,
                limit,
            } => write!(
                formatter,
                "stack overflow in function {function} at pc={pc} (depth={depth}, limit={limit})"
            ),
            Self::InconsistentStackDepth {
                function,
                pc,
                expected,
                actual,
            } => write!(
                formatter,
                "inconsistent stack depth in function {function} at pc={pc} (expected={expected}, actual={actual})"
            ),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WapConstant {
    Integer8(i8),
    Integer16(i16),
    Integer32(i32),
    Float32Bits(u32),
    Utf8String(Vec<u8>),
    EmptyString,
    ExternalString(Vec<u8>),
}

impl WapConstant {
    fn is_string(&self) -> bool {
        matches!(
            self,
            Self::Utf8String(_) | Self::EmptyString | Self::ExternalString(_)
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WapPragma {
    AccessDomain(u16),
    AccessPath(u16),
    UserAgentProperty {
        name: u16,
        content: u16,
    },
    UserAgentPropertyAndScheme {
        name: u16,
        content: u16,
        scheme: u16,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WapFunctionName {
    pub function_index: u8,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WapInstruction {
    pub offset: usize,
    pub opcode: u8,
    pub operands: Vec<u8>,
}

impl WapInstruction {
    pub(crate) fn variable_index(&self) -> Option<usize> {
        match self.opcode {
            0xe0..=0xff => Some(usize::from(self.opcode & 0x1f)),
            0x40..=0x4f => Some(usize::from(self.opcode & 0x0f)),
            0x70..=0x77 => Some(usize::from(self.opcode & 0x07)),
            0x0e..=0x11 | 0x1d | 0x1e => self.operands.first().copied().map(usize::from),
            _ => None,
        }
    }

    pub(crate) fn constant_index(&self) -> Option<usize> {
        match self.opcode {
            0x50..=0x5f => Some(usize::from(self.opcode & 0x0f)),
            0x12 => self.operands.first().copied().map(usize::from),
            0x13 if self.operands.len() == 2 => Some(usize::from(u16::from_be_bytes([
                self.operands[0],
                self.operands[1],
            ]))),
            _ => None,
        }
    }

    pub(crate) fn local_function_index(&self) -> Option<usize> {
        match self.opcode {
            0x60..=0x67 => Some(usize::from(self.opcode & 0x07)),
            0x09 => self.operands.first().copied().map(usize::from),
            _ => None,
        }
    }

    pub(crate) fn jump_target(&self) -> Option<usize> {
        jump_target(self)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WapFunction {
    pub argument_count: u8,
    pub local_count: u8,
    pub code: Vec<u8>,
    pub instructions: Vec<WapInstruction>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WapCompilationUnit {
    pub version: u8,
    pub charset_mib_enum: u16,
    pub constants: Vec<WapConstant>,
    pub pragmas: Vec<WapPragma>,
    pub function_names: Vec<WapFunctionName>,
    pub functions: Vec<WapFunction>,
}

pub fn decode_wap_compilation_unit(bytes: &[u8]) -> Result<WapCompilationUnit, WapDecodeError> {
    if bytes.is_empty() {
        return Err(WapDecodeError::EmptyUnit);
    }
    if bytes.len() > MAX_WAP_COMPILATION_UNIT_BYTES {
        return Err(WapDecodeError::UnitTooLarge {
            size: bytes.len(),
            limit: MAX_WAP_COMPILATION_UNIT_BYTES,
        });
    }

    let mut cursor = Cursor::new(bytes);
    let version = cursor.read_u8("version")?;
    let supported_major = WAP_BYTECODE_VERSION >> 4;
    let supported_minor = WAP_BYTECODE_VERSION & 0x0f;
    if version >> 4 != supported_major || version & 0x0f > supported_minor {
        return Err(WapDecodeError::UnsupportedVersion { version });
    }

    let declared_size = cursor.read_mb_u32("code size")? as usize;
    let actual_size = bytes.len().saturating_sub(cursor.offset());
    if declared_size != actual_size {
        return Err(WapDecodeError::CodeSizeMismatch {
            declared: declared_size,
            actual: actual_size,
        });
    }

    let constant_count = usize::from(cursor.read_mb_u16("constant count")?);
    let charset_mib_enum = cursor.read_mb_u16("constant-pool charset")?;
    let mut constants = Vec::with_capacity(constant_count);
    for _ in 0..constant_count {
        constants.push(decode_constant(&mut cursor)?);
    }

    let pragma_count = usize::from(cursor.read_mb_u16("pragma count")?);
    let mut pragmas = Vec::with_capacity(pragma_count);
    let mut access_domain_seen = false;
    let mut access_path_seen = false;
    for _ in 0..pragma_count {
        let offset = cursor.offset();
        let pragma_type = cursor.read_u8("pragma type")?;
        let pragma = match pragma_type {
            0 => {
                if access_domain_seen {
                    return Err(WapDecodeError::DuplicateAccessPragma { pragma_type });
                }
                access_domain_seen = true;
                let index = cursor.read_mb_u16("access-domain constant index")?;
                verify_string_index(&constants, usize::from(index), offset)?;
                WapPragma::AccessDomain(index)
            }
            1 => {
                if access_path_seen {
                    return Err(WapDecodeError::DuplicateAccessPragma { pragma_type });
                }
                access_path_seen = true;
                let index = cursor.read_mb_u16("access-path constant index")?;
                verify_string_index(&constants, usize::from(index), offset)?;
                WapPragma::AccessPath(index)
            }
            2 => {
                let name = cursor.read_mb_u16("property-name constant index")?;
                let content = cursor.read_mb_u16("property-content constant index")?;
                verify_string_index(&constants, usize::from(name), offset)?;
                verify_string_index(&constants, usize::from(content), offset)?;
                WapPragma::UserAgentProperty { name, content }
            }
            3 => {
                let name = cursor.read_mb_u16("property-name constant index")?;
                let content = cursor.read_mb_u16("property-content constant index")?;
                let scheme = cursor.read_mb_u16("property-scheme constant index")?;
                verify_string_index(&constants, usize::from(name), offset)?;
                verify_string_index(&constants, usize::from(content), offset)?;
                verify_string_index(&constants, usize::from(scheme), offset)?;
                WapPragma::UserAgentPropertyAndScheme {
                    name,
                    content,
                    scheme,
                }
            }
            _ => {
                return Err(WapDecodeError::UnsupportedPragmaType {
                    offset,
                    pragma_type,
                });
            }
        };
        pragmas.push(pragma);
    }

    let function_count = usize::from(cursor.read_u8("function count")?);
    let function_name_count = usize::from(cursor.read_u8("function-name count")?);
    if function_name_count == 0 || function_name_count > function_count {
        return Err(WapDecodeError::InvalidFunctionNameCount {
            count: function_name_count,
        });
    }
    let mut function_names = Vec::with_capacity(function_name_count);
    let mut previous_index = None;
    for _ in 0..function_name_count {
        let offset = cursor.offset();
        let function_index = cursor.read_u8("function-name index")?;
        if usize::from(function_index) >= function_count {
            return Err(WapDecodeError::InvalidFunctionIndex {
                offset,
                index: usize::from(function_index),
            });
        }
        if let Some(previous) = previous_index {
            if function_index <= previous {
                return Err(WapDecodeError::FunctionNamesOutOfOrder {
                    offset,
                    previous: usize::from(previous),
                    index: usize::from(function_index),
                });
            }
        }
        previous_index = Some(function_index);
        let name_size = usize::from(cursor.read_u8("function-name size")?);
        let name_offset = cursor.offset();
        let name_bytes = cursor.read_bytes(name_size, "function name")?;
        let name = std::str::from_utf8(name_bytes).map_err(|_| WapDecodeError::InvalidUtf8 {
            offset: name_offset,
            field: "function name",
        })?;
        if !is_valid_function_name(name) {
            return Err(WapDecodeError::InvalidFunctionName {
                offset: name_offset,
            });
        }
        function_names.push(WapFunctionName {
            function_index,
            name: name.to_owned(),
        });
    }

    let mut functions = Vec::with_capacity(function_count);
    for function_index in 0..function_count {
        let argument_count = cursor.read_u8("function argument count")?;
        let local_count = cursor.read_u8("function local count")?;
        let frame_size = usize::from(argument_count) + usize::from(local_count);
        if frame_size > 256 {
            return Err(WapDecodeError::InvalidFrameSize {
                function: function_index,
                size: frame_size,
            });
        }
        let function_size = cursor.read_mb_u32("function size")? as usize;
        let code = cursor.read_bytes(function_size, "function code")?.to_vec();
        functions.push(WapFunction {
            argument_count,
            local_count,
            code,
            instructions: Vec::new(),
        });
    }

    if cursor.offset() != bytes.len() {
        return Err(WapDecodeError::TrailingBytes {
            offset: cursor.offset(),
            count: bytes.len() - cursor.offset(),
        });
    }

    let function_argument_counts: Vec<u8> = functions
        .iter()
        .map(|function| function.argument_count)
        .collect();
    for (function_index, function) in functions.iter_mut().enumerate() {
        function.instructions = verify_instruction_stream(
            function_index,
            &function.code,
            usize::from(function.argument_count) + usize::from(function.local_count),
            &constants,
            &function_argument_counts,
        )?;
        verify_stack_dataflow(
            function_index,
            &function.code,
            &function.instructions,
            &function_argument_counts,
        )?;
    }

    Ok(WapCompilationUnit {
        version,
        charset_mib_enum,
        constants,
        pragmas,
        function_names,
        functions,
    })
}

fn decode_constant(cursor: &mut Cursor<'_>) -> Result<WapConstant, WapDecodeError> {
    let offset = cursor.offset();
    let constant_type = cursor.read_u8("constant type")?;
    match constant_type {
        0 => Ok(WapConstant::Integer8(cursor.read_u8("int8 constant")? as i8)),
        1 => Ok(WapConstant::Integer16(i16::from_be_bytes(
            cursor.read_array("int16 constant")?,
        ))),
        2 => Ok(WapConstant::Integer32(i32::from_be_bytes(
            cursor.read_array("int32 constant")?,
        ))),
        3 => Ok(WapConstant::Float32Bits(u32::from_be_bytes(
            cursor.read_array("float32 constant")?,
        ))),
        4 => {
            let length = cursor.read_mb_u32("UTF-8 string length")? as usize;
            let string_offset = cursor.offset();
            let value = cursor.read_bytes(length, "UTF-8 string")?;
            std::str::from_utf8(value).map_err(|_| WapDecodeError::InvalidUtf8 {
                offset: string_offset,
                field: "UTF-8 string",
            })?;
            Ok(WapConstant::Utf8String(value.to_vec()))
        }
        5 => Ok(WapConstant::EmptyString),
        6 => {
            let length = cursor.read_mb_u32("external string length")? as usize;
            Ok(WapConstant::ExternalString(
                cursor.read_bytes(length, "external string")?.to_vec(),
            ))
        }
        _ => Err(WapDecodeError::UnsupportedConstantType {
            offset,
            constant_type,
        }),
    }
}

fn verify_string_index(
    constants: &[WapConstant],
    index: usize,
    offset: usize,
) -> Result<(), WapDecodeError> {
    let Some(constant) = constants.get(index) else {
        return Err(WapDecodeError::InvalidConstantIndex { offset, index });
    };
    if !constant.is_string() {
        return Err(WapDecodeError::InvalidConstantType { offset, index });
    }
    Ok(())
}

fn verify_instruction_stream(
    function: usize,
    code: &[u8],
    variable_count: usize,
    constants: &[WapConstant],
    function_argument_counts: &[u8],
) -> Result<Vec<WapInstruction>, WapDecodeError> {
    let mut pc = 0usize;
    let mut starts = HashSet::new();
    let mut instructions = Vec::new();
    let mut jumps = Vec::new();

    while pc < code.len() {
        let op_pc = pc;
        starts.insert(op_pc);
        let opcode = code[pc];
        pc += 1;
        let operand_start = pc;

        match opcode {
            0x80..=0x9f => jumps.push((op_pc, pc + usize::from(opcode & 0x1f))),
            0xa0..=0xbf => jumps.push((
                op_pc,
                op_pc.checked_sub(usize::from(opcode & 0x1f)).ok_or(
                    WapDecodeError::InvalidJumpTarget {
                        function,
                        pc: op_pc,
                        target: usize::MAX,
                    },
                )?,
            )),
            0xc0..=0xdf => jumps.push((op_pc, pc + usize::from(opcode & 0x1f))),
            0xe0..=0xff => {
                verify_variable(function, op_pc, usize::from(opcode & 0x1f), variable_count)?;
            }
            0x40..=0x4f | 0x70..=0x77 => {
                verify_variable(function, op_pc, usize::from(opcode & 0x0f), variable_count)?;
            }
            0x50..=0x5f => {
                verify_constant(function, op_pc, usize::from(opcode & 0x0f), constants)?;
            }
            0x60..=0x67 => {
                verify_function(
                    function,
                    op_pc,
                    usize::from(opcode & 0x07),
                    function_argument_counts.len(),
                )?;
            }
            0x68..=0x6f => {
                let library_index =
                    usize::from(read_instruction_u8(code, &mut pc, function, op_pc, opcode)?);
                verify_library_function(
                    function,
                    op_pc,
                    library_index,
                    usize::from(opcode & 0x07),
                )?;
            }
            0x01 | 0x05 => {
                let offset =
                    usize::from(read_instruction_u8(code, &mut pc, function, op_pc, opcode)?);
                jumps.push((op_pc, pc + offset));
            }
            0x02 | 0x06 => {
                let offset = usize::from(read_instruction_u16(
                    code, &mut pc, function, op_pc, opcode,
                )?);
                jumps.push((op_pc, pc + offset));
            }
            0x03 | 0x07 => {
                let offset =
                    usize::from(read_instruction_u8(code, &mut pc, function, op_pc, opcode)?);
                jumps.push((
                    op_pc,
                    op_pc
                        .checked_sub(offset)
                        .ok_or(WapDecodeError::InvalidJumpTarget {
                            function,
                            pc: op_pc,
                            target: usize::MAX,
                        })?,
                ));
            }
            0x04 | 0x08 => {
                let offset = usize::from(read_instruction_u16(
                    code, &mut pc, function, op_pc, opcode,
                )?);
                jumps.push((
                    op_pc,
                    op_pc
                        .checked_sub(offset)
                        .ok_or(WapDecodeError::InvalidJumpTarget {
                            function,
                            pc: op_pc,
                            target: usize::MAX,
                        })?,
                ));
            }
            0x09 => {
                let index =
                    usize::from(read_instruction_u8(code, &mut pc, function, op_pc, opcode)?);
                verify_function(function, op_pc, index, function_argument_counts.len())?;
            }
            0x0a => {
                let operands = read_instruction_bytes(code, &mut pc, 2, function, op_pc, opcode)?;
                verify_library_function(
                    function,
                    op_pc,
                    usize::from(operands[1]),
                    usize::from(operands[0]),
                )?;
            }
            0x0b => {
                let operands = read_instruction_bytes(code, &mut pc, 3, function, op_pc, opcode)?;
                verify_library_function(
                    function,
                    op_pc,
                    usize::from(u16::from_be_bytes([operands[1], operands[2]])),
                    usize::from(operands[0]),
                )?;
            }
            0x0c => {
                let operands = read_instruction_bytes(code, &mut pc, 3, function, op_pc, opcode)?;
                verify_url_call_constants(
                    function,
                    op_pc,
                    usize::from(operands[0]),
                    usize::from(operands[1]),
                    constants,
                )?;
            }
            0x0d => {
                let operands = read_instruction_bytes(code, &mut pc, 5, function, op_pc, opcode)?;
                verify_url_call_constants(
                    function,
                    op_pc,
                    usize::from(u16::from_be_bytes([operands[0], operands[1]])),
                    usize::from(u16::from_be_bytes([operands[2], operands[3]])),
                    constants,
                )?;
            }
            0x0e..=0x11 | 0x1d | 0x1e => {
                let index =
                    usize::from(read_instruction_u8(code, &mut pc, function, op_pc, opcode)?);
                verify_variable(function, op_pc, index, variable_count)?;
            }
            0x12 => {
                let index =
                    usize::from(read_instruction_u8(code, &mut pc, function, op_pc, opcode)?);
                verify_constant(function, op_pc, index, constants)?;
            }
            0x13 => {
                let index = usize::from(read_instruction_u16(
                    code, &mut pc, function, op_pc, opcode,
                )?);
                verify_constant(function, op_pc, index, constants)?;
            }
            0x14..=0x1c | 0x1f..=0x3c => {}
            _ => {
                return Err(WapDecodeError::UnsupportedOpcode {
                    function,
                    pc: op_pc,
                    opcode,
                });
            }
        }

        instructions.push(WapInstruction {
            offset: op_pc,
            opcode,
            operands: code[operand_start..pc].to_vec(),
        });
    }

    for (pc, target) in jumps {
        if target >= code.len() || !starts.contains(&target) {
            return Err(WapDecodeError::InvalidJumpTarget {
                function,
                pc,
                target,
            });
        }
    }

    Ok(instructions)
}

fn verify_variable(
    function: usize,
    pc: usize,
    index: usize,
    limit: usize,
) -> Result<(), WapDecodeError> {
    if index >= limit {
        return Err(WapDecodeError::InvalidVariableIndex {
            function,
            pc,
            index,
            limit,
        });
    }
    Ok(())
}

fn verify_constant(
    function: usize,
    pc: usize,
    index: usize,
    constants: &[WapConstant],
) -> Result<(), WapDecodeError> {
    if index >= constants.len() {
        return Err(WapDecodeError::InvalidConstantReference {
            function,
            pc,
            index,
        });
    }
    Ok(())
}

fn verify_function(
    function: usize,
    pc: usize,
    index: usize,
    function_count: usize,
) -> Result<(), WapDecodeError> {
    if index >= function_count {
        return Err(WapDecodeError::InvalidFunctionReference {
            function,
            pc,
            index,
        });
    }
    Ok(())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct StandardLibraryFunction {
    argument_count: usize,
    returns_value: bool,
}

const fn library_function(argument_count: usize) -> StandardLibraryFunction {
    StandardLibraryFunction {
        argument_count,
        returns_value: true,
    }
}

const fn terminating_library_function(argument_count: usize) -> StandardLibraryFunction {
    StandardLibraryFunction {
        argument_count,
        returns_value: false,
    }
}

// WAP-194 Appendix A fixes library IDs 0..=5 and the per-library function
// domains. Argument counts come from the corresponding function signatures.
// This is verifier metadata only; execution remains in the WMLS-502/504 lanes.
const LANG_LIBRARY: &[StandardLibraryFunction] = &[
    library_function(1),
    library_function(2),
    library_function(2),
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(0),
    library_function(0),
    library_function(0),
    terminating_library_function(1), // exit
    terminating_library_function(1), // abort
    library_function(1),
    library_function(1),
    library_function(0),
];
const FLOAT_LIBRARY: &[StandardLibraryFunction] = &[
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(2),
    library_function(1),
    library_function(1),
    library_function(0),
    library_function(0),
];
const STRING_LIBRARY: &[StandardLibraryFunction] = &[
    library_function(1),
    library_function(1),
    library_function(2),
    library_function(3),
    library_function(2),
    library_function(3),
    library_function(2),
    library_function(3),
    library_function(3),
    library_function(4),
    library_function(4),
    library_function(1),
    library_function(1),
    library_function(2),
    library_function(1),
    library_function(2),
];
const URL_LIBRARY: &[StandardLibraryFunction] = &[
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(1),
    library_function(0),
    library_function(0),
    library_function(2),
    library_function(1),
    library_function(1),
    library_function(2),
];
const WMLBROWSER_LIBRARY: &[StandardLibraryFunction] = &[
    library_function(1),
    library_function(2),
    library_function(1),
    library_function(0),
    library_function(0),
    library_function(0),
    library_function(0),
];
const DIALOGS_LIBRARY: &[StandardLibraryFunction] = &[
    library_function(2),
    library_function(3),
    library_function(1),
];
const STANDARD_LIBRARIES: &[&[StandardLibraryFunction]] = &[
    LANG_LIBRARY,
    FLOAT_LIBRARY,
    STRING_LIBRARY,
    URL_LIBRARY,
    WMLBROWSER_LIBRARY,
    DIALOGS_LIBRARY,
];

fn standard_library_function(
    library_index: usize,
    function_index: usize,
) -> Option<StandardLibraryFunction> {
    STANDARD_LIBRARIES
        .get(library_index)
        .and_then(|library| library.get(function_index))
        .copied()
}

fn verify_library_function(
    function: usize,
    pc: usize,
    library_index: usize,
    function_index: usize,
) -> Result<(), WapDecodeError> {
    let Some(library) = STANDARD_LIBRARIES.get(library_index) else {
        return Err(WapDecodeError::InvalidLibraryIndex {
            function,
            pc,
            index: library_index,
        });
    };
    if function_index >= library.len() {
        return Err(WapDecodeError::InvalidLibraryFunctionIndex {
            function,
            pc,
            library_index,
            function_index,
        });
    }
    Ok(())
}

#[derive(Debug, Clone, Copy)]
struct StackEffect {
    pops: usize,
    pushes: usize,
    terminal: bool,
}

impl StackEffect {
    const fn new(pops: usize, pushes: usize) -> Self {
        Self {
            pops,
            pushes,
            terminal: false,
        }
    }

    const fn terminal(pops: usize) -> Self {
        Self {
            pops,
            pushes: 0,
            terminal: true,
        }
    }
}

fn verify_stack_dataflow(
    function: usize,
    code: &[u8],
    instructions: &[WapInstruction],
    function_argument_counts: &[u8],
) -> Result<(), WapDecodeError> {
    if code.is_empty() {
        return Ok(()); // WAP-193_101 8.4.3 implicit empty-string return.
    }

    let mut instruction_indexes = vec![None; code.len()];
    for (index, instruction) in instructions.iter().enumerate() {
        instruction_indexes[instruction.offset] = Some(index);
    }

    let mut depths = vec![None; code.len()];
    depths[0] = Some(0);
    let mut queue = VecDeque::from([(0usize, 0usize)]);

    while let Some((pc, depth)) = queue.pop_front() {
        let instruction_index = instruction_indexes[pc]
            .expect("structural verification records every instruction boundary");
        let instruction = &instructions[instruction_index];

        if matches!(instruction.opcode, 0x34 | 0x35) {
            verify_stack_available(function, instruction.offset, depth, 1)?;
            let alternate_depth = depth + 1;
            verify_stack_limit(function, instruction.offset, alternate_depth)?;
            let next = next_instruction_offset(instruction);

            // SCAND/SCOR deliberately have value-dependent stack heights. The
            // compiler form pairs them with TJUMP: the fall-through consumes
            // the converted true value, while the taken edge preserves the
            // false/invalid result. Treating that pair as one dataflow step
            // preserves both source-specified effects without inventing an
            // operator execution kernel.
            if let Some(next_index) = instruction_index_at(&instruction_indexes, next) {
                let next_instruction = &instructions[next_index];
                if is_conditional_jump(next_instruction.opcode) {
                    let target = jump_target(next_instruction)
                        .expect("conditional instructions have verified jump targets");
                    enqueue_stack_depth(
                        function,
                        code.len(),
                        target,
                        depth,
                        &mut depths,
                        &mut queue,
                    )?;
                    enqueue_stack_depth(
                        function,
                        code.len(),
                        next_instruction_offset(next_instruction),
                        depth - 1,
                        &mut depths,
                        &mut queue,
                    )?;
                    continue;
                }
            }

            enqueue_stack_depth(function, code.len(), next, depth, &mut depths, &mut queue)?;
            enqueue_stack_depth(
                function,
                code.len(),
                next,
                alternate_depth,
                &mut depths,
                &mut queue,
            )?;
            continue;
        }

        let effect = instruction_stack_effect(instruction, function_argument_counts);
        verify_stack_available(function, instruction.offset, depth, effect.pops)?;
        let next_depth = depth - effect.pops + effect.pushes;
        verify_stack_limit(function, instruction.offset, next_depth)?;
        if effect.terminal {
            continue;
        }

        let fallthrough = next_instruction_offset(instruction);
        if is_unconditional_jump(instruction.opcode) {
            let target = jump_target(instruction).expect("jump instructions have verified targets");
            enqueue_stack_depth(
                function,
                code.len(),
                target,
                next_depth,
                &mut depths,
                &mut queue,
            )?;
        } else if is_conditional_jump(instruction.opcode) {
            enqueue_stack_depth(
                function,
                code.len(),
                fallthrough,
                next_depth,
                &mut depths,
                &mut queue,
            )?;
            let target = jump_target(instruction).expect("jump instructions have verified targets");
            enqueue_stack_depth(
                function,
                code.len(),
                target,
                next_depth,
                &mut depths,
                &mut queue,
            )?;
        } else {
            enqueue_stack_depth(
                function,
                code.len(),
                fallthrough,
                next_depth,
                &mut depths,
                &mut queue,
            )?;
        }
    }

    Ok(())
}

fn instruction_stack_effect(
    instruction: &WapInstruction,
    function_argument_counts: &[u8],
) -> StackEffect {
    match instruction.opcode {
        0x80..=0xbf | 0x01..=0x04 | 0x10 | 0x11 | 0x3c | 0x70..=0x77 => StackEffect::new(0, 0),
        0xc0..=0xdf | 0x05..=0x08 => StackEffect::new(1, 0),
        0xe0..=0xff | 0x0e | 0x12..=0x1a | 0x50..=0x5f => StackEffect::new(0, 1),
        0x40..=0x4f | 0x0f | 0x1d | 0x1e | 0x37 => StackEffect::new(1, 0),
        0x1b | 0x1c | 0x1f | 0x29 | 0x33 | 0x36 | 0x38 | 0x39 => StackEffect::new(1, 1),
        0x20..=0x28 | 0x2a..=0x32 => StackEffect::new(2, 1),
        0x60..=0x67 => {
            let index = usize::from(instruction.opcode & 0x07);
            StackEffect::new(usize::from(function_argument_counts[index]), 1)
        }
        0x09 => {
            let index = usize::from(instruction.operands[0]);
            StackEffect::new(usize::from(function_argument_counts[index]), 1)
        }
        0x68..=0x6f | 0x0a | 0x0b => {
            let (library_index, function_index) = library_call_indexes(instruction);
            let library_function = standard_library_function(library_index, function_index)
                .expect("library references were structurally verified");
            if library_function.returns_value {
                StackEffect::new(library_function.argument_count, 1)
            } else {
                StackEffect::terminal(library_function.argument_count)
            }
        }
        0x0c | 0x0d => StackEffect::new(
            usize::from(*instruction.operands.last().expect("CALL_URL has args")),
            1,
        ),
        0x3a => StackEffect::terminal(1),
        0x3b => StackEffect::terminal(0),
        0x34 | 0x35 => unreachable!("SCAND/SCOR are handled as value-dependent effects"),
        _ => unreachable!("unsupported opcodes fail structural verification"),
    }
}

fn library_call_indexes(instruction: &WapInstruction) -> (usize, usize) {
    match instruction.opcode {
        0x68..=0x6f => (
            usize::from(instruction.operands[0]),
            usize::from(instruction.opcode & 0x07),
        ),
        0x0a => (
            usize::from(instruction.operands[1]),
            usize::from(instruction.operands[0]),
        ),
        0x0b => (
            usize::from(u16::from_be_bytes([
                instruction.operands[1],
                instruction.operands[2],
            ])),
            usize::from(instruction.operands[0]),
        ),
        _ => unreachable!("not a standard-library call"),
    }
}

fn next_instruction_offset(instruction: &WapInstruction) -> usize {
    instruction.offset + 1 + instruction.operands.len()
}

fn instruction_index_at(indexes: &[Option<usize>], pc: usize) -> Option<usize> {
    indexes.get(pc).copied().flatten()
}

fn is_unconditional_jump(opcode: u8) -> bool {
    matches!(opcode, 0x01..=0x04 | 0x80..=0xbf)
}

fn is_conditional_jump(opcode: u8) -> bool {
    matches!(opcode, 0x05..=0x08 | 0xc0..=0xdf)
}

fn jump_target(instruction: &WapInstruction) -> Option<usize> {
    let pc = instruction.offset;
    match instruction.opcode {
        0x80..=0x9f | 0xc0..=0xdf => {
            Some(next_instruction_offset(instruction) + usize::from(instruction.opcode & 0x1f))
        }
        0xa0..=0xbf => pc.checked_sub(usize::from(instruction.opcode & 0x1f)),
        0x01 | 0x05 => {
            Some(next_instruction_offset(instruction) + usize::from(instruction.operands[0]))
        }
        0x02 | 0x06 => Some(
            next_instruction_offset(instruction)
                + usize::from(u16::from_be_bytes([
                    instruction.operands[0],
                    instruction.operands[1],
                ])),
        ),
        0x03 | 0x07 => pc.checked_sub(usize::from(instruction.operands[0])),
        0x04 | 0x08 => pc.checked_sub(usize::from(u16::from_be_bytes([
            instruction.operands[0],
            instruction.operands[1],
        ]))),
        _ => None,
    }
}

fn verify_stack_available(
    function: usize,
    pc: usize,
    available: usize,
    required: usize,
) -> Result<(), WapDecodeError> {
    if available < required {
        return Err(WapDecodeError::StackUnderflow {
            function,
            pc,
            required,
            available,
        });
    }
    Ok(())
}

fn verify_stack_limit(function: usize, pc: usize, depth: usize) -> Result<(), WapDecodeError> {
    if depth > MAX_WAP_OPERAND_STACK_DEPTH {
        return Err(WapDecodeError::StackOverflow {
            function,
            pc,
            depth,
            limit: MAX_WAP_OPERAND_STACK_DEPTH,
        });
    }
    Ok(())
}

fn enqueue_stack_depth(
    function: usize,
    code_len: usize,
    pc: usize,
    depth: usize,
    depths: &mut [Option<usize>],
    queue: &mut VecDeque<(usize, usize)>,
) -> Result<(), WapDecodeError> {
    if pc == code_len {
        return Ok(()); // WAP-193_101 8.4.3 implicit empty-string return.
    }
    match depths[pc] {
        Some(expected) if expected != depth => Err(WapDecodeError::InconsistentStackDepth {
            function,
            pc,
            expected,
            actual: depth,
        }),
        Some(_) => Ok(()),
        None => {
            depths[pc] = Some(depth);
            queue.push_back((pc, depth));
            Ok(())
        }
    }
}

fn verify_url_call_constants(
    function: usize,
    pc: usize,
    url_index: usize,
    function_name_index: usize,
    constants: &[WapConstant],
) -> Result<(), WapDecodeError> {
    verify_constant(function, pc, url_index, constants)?;
    verify_constant(function, pc, function_name_index, constants)?;
    if !constants[url_index].is_string()
        || !matches!(constants[function_name_index], WapConstant::Utf8String(_))
    {
        return Err(WapDecodeError::InvalidConstantType {
            offset: pc,
            index: if !constants[url_index].is_string() {
                url_index
            } else {
                function_name_index
            },
        });
    }
    if let WapConstant::Utf8String(name) = &constants[function_name_index] {
        let valid = std::str::from_utf8(name).is_ok_and(is_valid_function_name);
        if !valid {
            return Err(WapDecodeError::InvalidFunctionName { offset: pc });
        }
    }
    Ok(())
}

fn read_instruction_u8(
    code: &[u8],
    pc: &mut usize,
    function: usize,
    op_pc: usize,
    opcode: u8,
) -> Result<u8, WapDecodeError> {
    Ok(read_instruction_bytes(code, pc, 1, function, op_pc, opcode)?[0])
}

fn read_instruction_u16(
    code: &[u8],
    pc: &mut usize,
    function: usize,
    op_pc: usize,
    opcode: u8,
) -> Result<u16, WapDecodeError> {
    let bytes = read_instruction_bytes(code, pc, 2, function, op_pc, opcode)?;
    Ok(u16::from_be_bytes([bytes[0], bytes[1]]))
}

fn read_instruction_bytes<'a>(
    code: &'a [u8],
    pc: &mut usize,
    length: usize,
    function: usize,
    op_pc: usize,
    opcode: u8,
) -> Result<&'a [u8], WapDecodeError> {
    let end = pc
        .checked_add(length)
        .filter(|end| *end <= code.len())
        .ok_or(WapDecodeError::TruncatedInstruction {
            function,
            pc: op_pc,
            opcode,
        })?;
    let value = &code[*pc..end];
    *pc = end;
    Ok(value)
}

fn is_valid_function_name(name: &str) -> bool {
    let mut bytes = name.bytes();
    let Some(first) = bytes.next() else {
        return false;
    };
    if !first.is_ascii_alphabetic() && first != b'_' {
        return false;
    }
    if !bytes.all(|byte| byte.is_ascii_alphanumeric() || byte == b'_') {
        return false;
    }
    !RESERVED_WORDS.contains(&name)
}

const RESERVED_WORDS: &[&str] = &[
    "access", "agent", "break", "case", "catch", "class", "const", "continue", "debugger",
    "default", "delete", "do", "enum", "equiv", "export", "extends", "false", "finally", "for",
    "function", "import", "in", "invalid", "lib", "meta", "name", "new", "null", "path", "private",
    "public", "return", "sizeof", "struct", "super", "switch", "this", "throw", "true", "try",
    "url", "void", "while", "with",
];

struct Cursor<'a> {
    bytes: &'a [u8],
    offset: usize,
}

impl<'a> Cursor<'a> {
    fn new(bytes: &'a [u8]) -> Self {
        Self { bytes, offset: 0 }
    }

    fn offset(&self) -> usize {
        self.offset
    }

    fn read_u8(&mut self, field: &'static str) -> Result<u8, WapDecodeError> {
        Ok(self.read_bytes(1, field)?[0])
    }

    fn read_array<const N: usize>(
        &mut self,
        field: &'static str,
    ) -> Result<[u8; N], WapDecodeError> {
        self.read_bytes(N, field)?
            .try_into()
            .map_err(|_| unreachable!("slice length was checked"))
    }

    fn read_bytes(
        &mut self,
        length: usize,
        field: &'static str,
    ) -> Result<&'a [u8], WapDecodeError> {
        let start = self.offset;
        let end = start
            .checked_add(length)
            .filter(|end| *end <= self.bytes.len())
            .ok_or(WapDecodeError::Truncated {
                offset: start,
                field,
            })?;
        self.offset = end;
        Ok(&self.bytes[start..end])
    }

    fn read_mb_u16(&mut self, field: &'static str) -> Result<u16, WapDecodeError> {
        self.read_multibyte(16, 3, field).map(|value| value as u16)
    }

    fn read_mb_u32(&mut self, field: &'static str) -> Result<u32, WapDecodeError> {
        self.read_multibyte(32, 5, field)
    }

    fn read_multibyte(
        &mut self,
        bits: u32,
        max_octets: usize,
        field: &'static str,
    ) -> Result<u32, WapDecodeError> {
        let start = self.offset;
        let mut value = 0u32;
        let max_value = if bits == 32 {
            u32::MAX
        } else {
            (1u32 << bits) - 1
        };
        for _ in 0..max_octets {
            let octet = self.read_u8(field)?;
            let payload = u32::from(octet & 0x7f);
            if value > (max_value >> 7)
                || (value == (max_value >> 7) && payload > (max_value & 0x7f))
            {
                return Err(WapDecodeError::InvalidMultiByteInteger {
                    offset: start,
                    field,
                });
            }
            value = (value << 7) | payload;
            if octet & 0x80 == 0 {
                return Ok(value);
            }
        }
        Err(WapDecodeError::InvalidMultiByteInteger {
            offset: start,
            field,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MINIMAL_UNIT_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-minimal-return-es.wmlsc.hex");
    const VALID_LIBRARY_REFS_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-valid-library-refs.wmlsc.hex");
    const INVALID_LIBRARY_INDEX_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-invalid-library-index.wmlsc.hex");
    const INVALID_LIBRARY_FUNCTION_INDEX_HEX: &str = include_str!(
        "../../tests/fixtures/wmlscript/wap-193-invalid-library-function-index.wmlsc.hex"
    );
    const STACK_UNDERFLOW_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-stack-underflow.wmlsc.hex");
    const STACK_OVERFLOW_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-stack-overflow.wmlsc.hex");
    const INCONSISTENT_MERGE_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-inconsistent-merge.wmlsc.hex");
    const BALANCED_LOOP_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-balanced-loop.wmlsc.hex");
    const UNREACHABLE_REGION_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-unreachable-region.wmlsc.hex");
    const IMPLICIT_RETURN_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-implicit-return.wmlsc.hex");
    const EXPLICIT_RETURN_HEX: &str =
        include_str!("../../tests/fixtures/wmlscript/wap-193-explicit-return.wmlsc.hex");

    fn fixture_bytes_from(fixture: &str) -> Vec<u8> {
        fixture
            .split_ascii_whitespace()
            .filter(|token| !token.starts_with('#'))
            .map(|token| u8::from_str_radix(token, 16).expect("fixture must contain hex bytes"))
            .collect()
    }

    fn fixture_bytes() -> Vec<u8> {
        fixture_bytes_from(MINIMAL_UNIT_HEX)
    }

    fn unit_with_code(code: &[u8], arguments: u8, locals: u8) -> Vec<u8> {
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

        let mut body = vec![
            0x00, 0x6a, 0x00, 0x01, 0x01, 0x00, 0x04, b'm', b'a', b'i', b'n', arguments, locals,
        ];
        body.extend(multibyte(code.len()));
        body.extend_from_slice(code);
        let mut unit = vec![0x01];
        unit.extend(multibyte(body.len()));
        unit.extend(body);
        unit
    }

    fn unit_with_pools_and_calls() -> Vec<u8> {
        let mut body = vec![
            0x03, // constants
            0x6a, // UTF-8 MIBenum
            0x04, 0x03, b'u', b'r', b'l', // UTF-8 constant 0
            0x04, 0x04, b'f', b'u', b'n', b'c', // UTF-8 constant 1
            0x00, 0x07, // int8 constant 2
            0x01, // pragmas
            0x02, 0x00, 0x01, // user-agent property
            0x01, // functions
            0x01, 0x00, 0x04, b'm', b'a', b'i', b'n', // name table
            0x01, 0x01, // arguments and locals
            0x0b, // function size
        ];
        body.extend_from_slice(&[
            0xe0, // LOAD_VAR_S 0
            0x40, // STORE_VAR_S 0
            0x50, // LOAD_CONST_S 0
            0x60, // CALL_S 0
            0x68, 0x00, // CALL_LIB_S 0, library 0 (library validation deferred)
            0x0c, 0x00, 0x01, 0x00, // CALL_URL constant 0, name 1, no args
            0x3b, // RETURN_ES
        ]);
        let mut unit = vec![
            WAP_BYTECODE_VERSION,
            u8::try_from(body.len()).expect("test body must fit one-byte code size"),
        ];
        unit.extend(body);
        unit
    }

    fn wrap_body(body: Vec<u8>) -> Vec<u8> {
        let mut unit = vec![
            WAP_BYTECODE_VERSION,
            u8::try_from(body.len()).expect("test body must fit one-byte code size"),
        ];
        unit.extend(body);
        unit
    }

    #[test]
    fn decodes_deterministic_wap_193_fixture() {
        let decoded = decode_wap_compilation_unit(&fixture_bytes()).expect("fixture must decode");
        assert_eq!(decoded.version, WAP_BYTECODE_VERSION);
        assert_eq!(decoded.charset_mib_enum, 106);
        assert!(decoded.constants.is_empty());
        assert!(decoded.pragmas.is_empty());
        assert_eq!(decoded.function_names[0].name, "main");
        assert_eq!(decoded.functions[0].code, [0x3b]);
        assert_eq!(decoded.functions[0].instructions[0].offset, 0);
    }

    #[test]
    fn source_pinned_library_and_stack_dataflow_fixtures_are_deterministic() {
        assert!(decode_wap_compilation_unit(&fixture_bytes_from(VALID_LIBRARY_REFS_HEX)).is_ok());
        assert_eq!(
            decode_wap_compilation_unit(&fixture_bytes_from(INVALID_LIBRARY_INDEX_HEX)),
            Err(WapDecodeError::InvalidLibraryIndex {
                function: 0,
                pc: 0,
                index: 6,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&fixture_bytes_from(INVALID_LIBRARY_FUNCTION_INDEX_HEX)),
            Err(WapDecodeError::InvalidLibraryFunctionIndex {
                function: 0,
                pc: 0,
                library_index: 5,
                function_index: 7,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&fixture_bytes_from(STACK_UNDERFLOW_HEX)),
            Err(WapDecodeError::StackUnderflow {
                function: 0,
                pc: 0,
                required: 1,
                available: 0,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&fixture_bytes_from(STACK_OVERFLOW_HEX)),
            Err(WapDecodeError::StackOverflow {
                function: 0,
                pc: MAX_WAP_OPERAND_STACK_DEPTH,
                depth: MAX_WAP_OPERAND_STACK_DEPTH + 1,
                limit: MAX_WAP_OPERAND_STACK_DEPTH,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&fixture_bytes_from(INCONSISTENT_MERGE_HEX)),
            Err(WapDecodeError::InconsistentStackDepth {
                function: 0,
                pc: 3,
                expected: 0,
                actual: 1,
            })
        );
        for fixture in [
            BALANCED_LOOP_HEX,
            UNREACHABLE_REGION_HEX,
            IMPLICIT_RETURN_HEX,
            EXPLICIT_RETURN_HEX,
        ] {
            decode_wap_compilation_unit(&fixture_bytes_from(fixture))
                .expect("valid source-pinned dataflow fixture must verify");
        }

        // Decoder state is per-call: a failed verification cannot poison a
        // later valid unit, and retrying the failed unit is byte-for-byte stable.
        assert!(decode_wap_compilation_unit(&fixture_bytes_from(VALID_LIBRARY_REFS_HEX)).is_ok());
        assert_eq!(
            decode_wap_compilation_unit(&fixture_bytes_from(STACK_UNDERFLOW_HEX))
                .expect_err("underflow remains invalid")
                .to_string(),
            "stack underflow in function 0 at pc=0 (required=1, available=0)"
        );
    }

    #[test]
    fn decodes_constant_pragma_function_and_instruction_pools() {
        let decoded =
            decode_wap_compilation_unit(&unit_with_pools_and_calls()).expect("unit must decode");
        assert_eq!(
            decoded.constants,
            vec![
                WapConstant::Utf8String(b"url".to_vec()),
                WapConstant::Utf8String(b"func".to_vec()),
                WapConstant::Integer8(7),
            ]
        );
        assert_eq!(
            decoded.pragmas,
            vec![WapPragma::UserAgentProperty {
                name: 0,
                content: 1,
            }]
        );
        assert_eq!(decoded.functions[0].argument_count, 1);
        assert_eq!(decoded.functions[0].local_count, 1);
        assert_eq!(decoded.functions[0].instructions.len(), 7);
    }

    #[test]
    fn decodes_every_constant_representation_in_network_order() {
        let body = vec![
            0x07, 0x6a, // constant count and charset
            0x00, 0xff, // int8 -1
            0x01, 0xff, 0xfe, // int16 -2
            0x02, 0xff, 0xff, 0xff, 0xfd, // int32 -3
            0x03, 0x3f, 0x80, 0x00, 0x00, // float32 1.0 bits
            0x04, 0x03, b'a', 0x00, b'b', // UTF-8 with embedded null
            0x05, // empty string
            0x06, 0x02, 0xff, 0x00, // externally encoded bytes
            0x00, // pragmas
            0x01, 0x01, 0x00, 0x04, b'm', b'a', b'i', b'n', // function/name table
            0x00, 0x00, 0x01, 0x3b, // function
        ];
        let decoded = decode_wap_compilation_unit(&wrap_body(body)).expect("unit must decode");
        assert_eq!(
            decoded.constants,
            vec![
                WapConstant::Integer8(-1),
                WapConstant::Integer16(-2),
                WapConstant::Integer32(-3),
                WapConstant::Float32Bits(0x3f80_0000),
                WapConstant::Utf8String(vec![b'a', 0, b'b']),
                WapConstant::EmptyString,
                WapConstant::ExternalString(vec![0xff, 0]),
            ]
        );
    }

    #[test]
    fn recognizes_the_complete_effective_opcode_encoding_matrix() {
        let mut code = vec![
            0x01, 0x00, 0x02, 0x00, 0x00, 0x03, 0x00, 0x04, 0x00, 0x00, 0x05, 0x00, 0x06, 0x00,
            0x00, 0x07, 0x00, 0x08, 0x00, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x00, 0x0b, 0x00, 0x00,
            0x00, 0x0c, 0x00, 0x01, 0x00, 0x0d, 0x00, 0x00, 0x00, 0x01, 0x00, 0x0e, 0x00, 0x0f,
            0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x00, 0x00,
        ];
        code.extend(0x14..=0x1c);
        code.extend_from_slice(&[0x1d, 0x00, 0x1e, 0x00]);
        code.extend(0x1f..=0x3c);
        code.extend_from_slice(&[
            0x40, 0x50, 0x60, 0x68, 0x00, 0x70, 0x80, 0xa0, 0xc0, 0xe0, 0x3b,
        ]);
        let constants = vec![
            WapConstant::Utf8String(b"url".to_vec()),
            WapConstant::Utf8String(b"func".to_vec()),
        ];
        let instructions = verify_instruction_stream(0, &code, 1, &constants, &[0])
            .expect("every effective opcode encoding must be recognized");
        assert!(instructions.len() > 60);
    }

    #[test]
    fn rejects_malformed_truncated_and_reserved_units() {
        assert_eq!(
            decode_wap_compilation_unit(&[]),
            Err(WapDecodeError::EmptyUnit)
        );

        let mut truncated = fixture_bytes();
        truncated.pop();
        assert!(matches!(
            decode_wap_compilation_unit(&truncated),
            Err(WapDecodeError::CodeSizeMismatch { .. })
        ));

        let reserved = unit_with_code(&[0x78], 0, 0);
        assert!(matches!(
            decode_wap_compilation_unit(&reserved),
            Err(WapDecodeError::UnsupportedOpcode { opcode: 0x78, .. })
        ));

        let truncated_instruction = unit_with_code(&[0x02, 0x00], 0, 0);
        assert!(matches!(
            decode_wap_compilation_unit(&truncated_instruction),
            Err(WapDecodeError::TruncatedInstruction { opcode: 0x02, .. })
        ));

        let reserved_constant = wrap_body(vec![0x01, 0x6a, 0x07]);
        assert!(matches!(
            decode_wap_compilation_unit(&reserved_constant),
            Err(WapDecodeError::UnsupportedConstantType {
                constant_type: 0x07,
                ..
            })
        ));

        let reserved_pragma = wrap_body(vec![0x00, 0x6a, 0x01, 0x04]);
        assert!(matches!(
            decode_wap_compilation_unit(&reserved_pragma),
            Err(WapDecodeError::UnsupportedPragmaType {
                pragma_type: 0x04,
                ..
            })
        ));
    }

    #[test]
    fn rejects_invalid_local_constant_function_and_jump_references() {
        assert!(matches!(
            decode_wap_compilation_unit(&unit_with_code(&[0x0e, 0x00], 0, 0)),
            Err(WapDecodeError::InvalidVariableIndex { index: 0, .. })
        ));
        assert!(matches!(
            decode_wap_compilation_unit(&unit_with_code(&[0x12, 0x00], 0, 0)),
            Err(WapDecodeError::InvalidConstantReference { index: 0, .. })
        ));
        assert!(matches!(
            decode_wap_compilation_unit(&unit_with_code(&[0x09, 0x01], 0, 0)),
            Err(WapDecodeError::InvalidFunctionReference { index: 1, .. })
        ));
        assert!(matches!(
            decode_wap_compilation_unit(&unit_with_code(&[0x01, 0x01, 0x02, 0x00, 0x00], 0, 0)),
            Err(WapDecodeError::InvalidJumpTarget { target: 3, .. })
        ));
    }

    #[test]
    fn validates_every_standard_library_and_function_index_with_source_arity() {
        for (library_index, library) in STANDARD_LIBRARIES.iter().enumerate() {
            for (function_index, library_function) in library.iter().enumerate() {
                let mut code = vec![0x14; library_function.argument_count];
                if function_index <= 7 {
                    code.extend_from_slice(&[
                        0x68 | u8::try_from(function_index).expect("short function index"),
                        u8::try_from(library_index).expect("library index"),
                    ]);
                } else {
                    code.extend_from_slice(&[
                        0x0a,
                        u8::try_from(function_index).expect("function index"),
                        u8::try_from(library_index).expect("library index"),
                    ]);
                }
                if library_function.returns_value {
                    code.push(0x3a);
                }

                decode_wap_compilation_unit(&unit_with_code(&code, 0, 0)).unwrap_or_else(|error| {
                    panic!("library {library_index} function {function_index} must verify: {error}")
                });
            }
        }
    }

    #[test]
    fn rejects_invalid_standard_library_reference_domains() {
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x68, 0x06], 0, 0)),
            Err(WapDecodeError::InvalidLibraryIndex {
                function: 0,
                pc: 0,
                index: 6,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x6f, 0x05], 0, 0)),
            Err(WapDecodeError::InvalidLibraryFunctionIndex {
                function: 0,
                pc: 0,
                library_index: 5,
                function_index: 7,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x0b, 0x00, 0x01, 0x00], 0, 0)),
            Err(WapDecodeError::InvalidLibraryIndex {
                function: 0,
                pc: 0,
                index: 256,
            })
        );
    }

    #[test]
    fn verifies_stack_effects_for_calls_and_instruction_families() {
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x6a, 0x00], 0, 0)),
            Err(WapDecodeError::StackUnderflow {
                function: 0,
                pc: 0,
                required: 2,
                available: 0,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x60], 1, 0)),
            Err(WapDecodeError::StackUnderflow {
                function: 0,
                pc: 0,
                required: 1,
                available: 0,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x0c, 0x00, 0x01, 0x02], 0, 0)),
            Err(WapDecodeError::InvalidConstantReference {
                function: 0,
                pc: 0,
                index: 0,
            })
        );

        let mut overflow = vec![0x14; MAX_WAP_OPERAND_STACK_DEPTH + 1];
        overflow.push(0x3b);
        let error = decode_wap_compilation_unit(&unit_with_code(&overflow, 0, 0))
            .expect_err("a statically provable stack overflow must fail");
        assert_eq!(
            error,
            WapDecodeError::StackOverflow {
                function: 0,
                pc: MAX_WAP_OPERAND_STACK_DEPTH,
                depth: MAX_WAP_OPERAND_STACK_DEPTH + 1,
                limit: MAX_WAP_OPERAND_STACK_DEPTH,
            }
        );
        assert!(error.is_resource_exhaustion());
    }

    #[test]
    fn verifies_branch_merges_loops_and_value_dependent_logical_pairs() {
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x19, 0xc1, 0x14, 0x3b], 0, 0)),
            Err(WapDecodeError::InconsistentStackDepth {
                function: 0,
                pc: 3,
                expected: 0,
                actual: 1,
            })
        );
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x14, 0xa1], 0, 0)),
            Err(WapDecodeError::InconsistentStackDepth {
                function: 0,
                pc: 0,
                expected: 0,
                actual: 1,
            })
        );
        decode_wap_compilation_unit(&unit_with_code(&[0x14, 0x37, 0xa2], 0, 0))
            .expect("balanced backward loop must verify");
        decode_wap_compilation_unit(&unit_with_code(&[0x19, 0x34, 0xc1, 0x14, 0x3a], 0, 0))
            .expect("SCAND/TJUMP pair must preserve source-specified path depths");
        assert_eq!(
            decode_wap_compilation_unit(&unit_with_code(&[0x19, 0x34, 0x3b], 0, 0)),
            Err(WapDecodeError::InconsistentStackDepth {
                function: 0,
                pc: 2,
                expected: 1,
                actual: 2,
            })
        );
    }

    #[test]
    fn accepts_unreachable_regions_and_implicit_or_explicit_returns() {
        decode_wap_compilation_unit(&unit_with_code(&[0x3b, 0x37], 0, 0))
            .expect("unreachable stack underflow is not a runtime path");
        decode_wap_compilation_unit(&unit_with_code(&[0x14], 0, 0))
            .expect("falling off the function end is an implicit empty return");
        decode_wap_compilation_unit(&unit_with_code(&[0x14, 0x3a, 0x37], 0, 0))
            .expect("explicit return terminates dataflow before unreachable bytes");
        decode_wap_compilation_unit(&unit_with_code(&[], 0, 0))
            .expect("an empty function immediately returns the implicit empty string");
    }

    #[test]
    fn verifier_recovers_after_deterministic_dataflow_failure() {
        let invalid = unit_with_code(&[0x37], 0, 0);
        let valid = unit_with_code(&[0x3b], 0, 0);
        assert!(matches!(
            decode_wap_compilation_unit(&invalid),
            Err(WapDecodeError::StackUnderflow { .. })
        ));
        assert!(decode_wap_compilation_unit(&valid).is_ok());
        assert_eq!(
            decode_wap_compilation_unit(&invalid),
            Err(WapDecodeError::StackUnderflow {
                function: 0,
                pc: 0,
                required: 1,
                available: 0,
            })
        );
    }

    #[test]
    fn accepts_forward_and_backward_jumps_to_instruction_boundaries() {
        let decoded =
            decode_wap_compilation_unit(&unit_with_code(&[0x14, 0x37, 0xa2, 0x80, 0x3b], 0, 0))
                .expect("jumps target instruction boundaries with consistent stack depth");
        assert_eq!(decoded.functions[0].instructions.len(), 5);
    }

    #[test]
    fn rejects_invalid_multibyte_integer_and_reserved_function_name() {
        let invalid_size = [0x01, 0x90, 0x80, 0x80, 0x80, 0x00];
        assert!(matches!(
            decode_wap_compilation_unit(&invalid_size),
            Err(WapDecodeError::InvalidMultiByteInteger { .. })
        ));

        let mut reserved_name = fixture_bytes();
        reserved_name[8] = 5;
        reserved_name.splice(9..13, b"while".iter().copied());
        reserved_name[1] += 1;
        assert!(matches!(
            decode_wap_compilation_unit(&reserved_name),
            Err(WapDecodeError::InvalidFunctionName { .. })
        ));
    }
}
