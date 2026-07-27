use std::collections::HashSet;
use std::fmt;

pub const WAP_BYTECODE_VERSION: u8 = 0x01;
pub const MAX_WAP_COMPILATION_UNIT_BYTES: usize = 64 * 1024;

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
    InvalidJumpTarget {
        function: usize,
        pc: usize,
        target: usize,
    },
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
            Self::InvalidJumpTarget {
                function,
                pc,
                target,
            } => write!(
                formatter,
                "invalid jump target {target} in function {function} at pc={pc}"
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

    for (function_index, function) in functions.iter_mut().enumerate() {
        function.instructions = verify_instruction_stream(
            function_index,
            &function.code,
            usize::from(function.argument_count) + usize::from(function.local_count),
            &constants,
            function_count,
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
    function_count: usize,
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
                verify_function(function, op_pc, usize::from(opcode & 0x07), function_count)?;
            }
            0x68..=0x6f => {
                read_instruction_bytes(code, &mut pc, 1, function, op_pc, opcode)?;
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
                verify_function(function, op_pc, index, function_count)?;
            }
            0x0a => {
                read_instruction_bytes(code, &mut pc, 2, function, op_pc, opcode)?;
            }
            0x0b => {
                read_instruction_bytes(code, &mut pc, 3, function, op_pc, opcode)?;
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

    fn fixture_bytes() -> Vec<u8> {
        MINIMAL_UNIT_HEX
            .split_ascii_whitespace()
            .filter(|token| !token.starts_with('#'))
            .map(|token| u8::from_str_radix(token, 16).expect("fixture must contain hex bytes"))
            .collect()
    }

    fn unit_with_code(code: &[u8], arguments: u8, locals: u8) -> Vec<u8> {
        let mut unit = vec![
            0x01,
            u8::try_from(14 + code.len()).expect("test code size must fit one byte"),
            0x00,
            0x6a,
            0x00,
            0x01,
            0x01,
            0x00,
            0x04,
            b'm',
            b'a',
            b'i',
            b'n',
            arguments,
            locals,
            u8::try_from(code.len()).expect("test function size must fit one byte"),
        ];
        unit.extend_from_slice(code);
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
        let instructions = verify_instruction_stream(0, &code, 1, &constants, 1)
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
    fn accepts_forward_and_backward_jumps_to_instruction_boundaries() {
        let decoded = decode_wap_compilation_unit(&unit_with_code(&[0x14, 0xa1, 0x80, 0x3b], 0, 0))
            .expect("jumps target instruction boundaries");
        assert_eq!(decoded.functions[0].instructions.len(), 4);
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
