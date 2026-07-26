use std::collections::HashSet;
use std::fmt::Write as _;

pub(crate) const WML13_DECODER_ID: &str = "lowband-wml13-wbxml/0.3.0";

const SUPPORTED_WBXML_VERSIONS: &[u8] = &[0x01, 0x02, 0x03];
const WML_1_3_PUBLIC_ID: u32 = 0x0a;
const WML_1_3_PUBLIC_ID_TEXT: &str = "-//WAPFORUM//DTD WML 1.3//EN";
const MAX_NESTING_DEPTH: usize = 128;

const SWITCH_PAGE: u8 = 0x00;
const END: u8 = 0x01;
const ENTITY: u8 = 0x02;
const STR_I: u8 = 0x03;
const LITERAL: u8 = 0x04;
const EXT_I_0: u8 = 0x40;
const EXT_I_1: u8 = 0x41;
const EXT_I_2: u8 = 0x42;
const PI: u8 = 0x43;
const LITERAL_C: u8 = 0x44;
const EXT_T_0: u8 = 0x80;
const EXT_T_1: u8 = 0x81;
const EXT_T_2: u8 = 0x82;
const STR_T: u8 = 0x83;
const LITERAL_A: u8 = 0x84;
const EXT_0: u8 = 0xc0;
const EXT_1: u8 = 0xc1;
const EXT_2: u8 = 0xc2;
const OPAQUE: u8 = 0xc3;
const LITERAL_AC: u8 = 0xc4;
const IMPLEMENTATION_SPECIFIC_CODE_PAGE: u8 = 0xff;

#[derive(Clone, Copy)]
enum Charset {
    Ascii,
    Latin1,
    Utf8,
}

impl Charset {
    fn from_mib_enum(value: u32) -> Result<Self, String> {
        match value {
            3 => Ok(Self::Ascii),
            4 => Ok(Self::Latin1),
            106 => Ok(Self::Utf8),
            0 => Err("charset MIBenum 0 is unknown".to_string()),
            _ => Err(format!("unsupported charset MIBenum {value}")),
        }
    }

    fn from_mime_name(value: &str) -> Result<Self, String> {
        match value.trim().to_ascii_lowercase().as_str() {
            "us-ascii" | "ascii" => Ok(Self::Ascii),
            "iso-8859-1" | "latin1" => Ok(Self::Latin1),
            "utf-8" | "utf8" => Ok(Self::Utf8),
            _ => Err(format!("unsupported carrying-protocol charset {value:?}")),
        }
    }

    fn decode(self, bytes: &[u8]) -> Result<String, String> {
        match self {
            Self::Ascii => {
                if bytes.iter().any(|byte| !byte.is_ascii()) {
                    return Err("non-ASCII octet in US-ASCII string".to_string());
                }
                String::from_utf8(bytes.to_vec())
                    .map_err(|error| format!("invalid US-ASCII string: {error}"))
            }
            Self::Latin1 => Ok(bytes.iter().map(|byte| char::from(*byte)).collect()),
            Self::Utf8 => String::from_utf8(bytes.to_vec())
                .map_err(|error| format!("invalid UTF-8 string: {error}")),
        }
    }
}

struct Header<'a> {
    charset: Charset,
    string_table: &'a [u8],
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct CodePage(u8);

impl CodePage {
    const ZERO: Self = Self(0);

    fn index(self) -> u8 {
        self.0
    }
}

#[derive(Clone, Copy)]
struct RegisteredCodePage<T> {
    page: CodePage,
    table: T,
}

type TagTokenTable = fn(u8) -> Option<&'static str>;

#[derive(Clone, Copy)]
struct AttributeTokenTable {
    start: fn(u8) -> Option<(&'static str, &'static str)>,
    value: fn(u8) -> Option<&'static str>,
}

const WML13_TAG_CODE_PAGES: &[RegisteredCodePage<TagTokenTable>] = &[RegisteredCodePage {
    page: CodePage::ZERO,
    table: page_zero_tag_name,
}];
const WML13_ATTRIBUTE_CODE_PAGES: &[RegisteredCodePage<AttributeTokenTable>] =
    &[RegisteredCodePage {
        page: CodePage::ZERO,
        table: AttributeTokenTable {
            start: page_zero_attribute_start,
            value: page_zero_attribute_value,
        },
    }];

struct Wml13TokenRegistry;

const WML13_TOKEN_REGISTRY: Wml13TokenRegistry = Wml13TokenRegistry;

impl Wml13TokenRegistry {
    fn tag_name(&self, page: CodePage, token: u8) -> Result<Option<&'static str>, String> {
        let table = self.table(CodeSpace::Tag, page, WML13_TAG_CODE_PAGES)?;
        Ok((table)(token))
    }

    fn attribute_start(
        &self,
        page: CodePage,
        token: u8,
    ) -> Result<Option<(&'static str, &'static str)>, String> {
        let table = self.table(CodeSpace::Attribute, page, WML13_ATTRIBUTE_CODE_PAGES)?;
        Ok((table.start)(token))
    }

    fn attribute_value(&self, page: CodePage, token: u8) -> Result<Option<&'static str>, String> {
        let table = self.table(CodeSpace::Attribute, page, WML13_ATTRIBUTE_CODE_PAGES)?;
        Ok((table.value)(token))
    }

    fn table<'a, T>(
        &self,
        code_space: CodeSpace,
        page: CodePage,
        pages: &'a [RegisteredCodePage<T>],
    ) -> Result<&'a T, String> {
        if let Some(registered) = pages.iter().find(|registered| registered.page == page) {
            return Ok(&registered.table);
        }
        if page.index() == IMPLEMENTATION_SPECIFIC_CODE_PAGE {
            return Err(format!(
                "implementation-specific WML {} code page 255 is not registered",
                code_space.label()
            ));
        }
        Err(format!(
            "unassigned WML {} code page {}",
            code_space.label(),
            page.index()
        ))
    }
}

struct Decoder<'a> {
    bytes: &'a [u8],
    position: usize,
    charset: Charset,
    string_table: &'a [u8],
    tag_page: CodePage,
    attribute_page: CodePage,
    output: String,
    max_output_bytes: usize,
    external_charset: Option<Charset>,
}

#[cfg(test)]
pub(crate) fn decode_wml13(payload: &[u8], max_output_bytes: usize) -> Result<String, String> {
    decode_wml13_with_charset(payload, max_output_bytes, None)
}

pub(crate) fn decode_wml13_with_charset(
    payload: &[u8],
    max_output_bytes: usize,
    external_charset: Option<&str>,
) -> Result<String, String> {
    if payload.is_empty() {
        return Err(decode_error("empty payload"));
    }
    if max_output_bytes == 0 {
        return Err(decode_error("decoded output limit is zero"));
    }

    let mut decoder = Decoder {
        bytes: payload,
        position: 0,
        charset: Charset::Utf8,
        string_table: &[],
        tag_page: CodePage::ZERO,
        attribute_page: CodePage::ZERO,
        output: String::new(),
        max_output_bytes,
        external_charset: external_charset
            .map(Charset::from_mime_name)
            .transpose()
            .map_err(|error| decode_error(&error))?,
    };
    decoder.decode_document().map_err(|error| {
        if error.starts_with("WBXML decode failed:") {
            error
        } else {
            decode_error(&error)
        }
    })
}

impl<'a> Decoder<'a> {
    fn decode_document(&mut self) -> Result<String, String> {
        let header = self.decode_header()?;
        self.charset = header.charset;
        self.string_table = header.string_table;

        while self.peek() == Some(PI) {
            self.decode_processing_instruction()?;
        }
        if self.peek().is_none() {
            return Err("document body is missing its root element".to_string());
        }
        self.decode_element(0)?;
        while self.peek() == Some(PI) {
            self.decode_processing_instruction()?;
        }
        if self.position != self.bytes.len() {
            return Err(format!(
                "trailing token 0x{:02x} after document root at byte {}",
                self.bytes[self.position], self.position
            ));
        }
        if self.output.len() > self.max_output_bytes {
            return Err(format!(
                "output exceeds {}-byte limit",
                self.max_output_bytes
            ));
        }
        Ok(std::mem::take(&mut self.output))
    }

    fn decode_header(&mut self) -> Result<Header<'a>, String> {
        let version = self.read_byte("version")?;
        if !SUPPORTED_WBXML_VERSIONS.contains(&version) {
            return Err(format!(
                "unsupported WBXML version byte 0x{version:02x}; expected 0x01, 0x02, or 0x03"
            ));
        }

        let public_id = self.read_mb_u_int32("public identifier")?;
        let public_id_index = if public_id == 0 {
            Some(self.read_mb_u_int32("public identifier string-table index")?)
        } else {
            None
        };
        let charset_value = self.read_mb_u_int32("charset")?;
        let charset = match self.external_charset {
            Some(charset) => charset,
            None => Charset::from_mib_enum(charset_value)?,
        };
        let string_table_length = self.read_mb_u_int32("string-table length")? as usize;
        let table_start = self.position;
        let table_end = table_start
            .checked_add(string_table_length)
            .ok_or_else(|| "string-table length overflows address space".to_string())?;
        if table_end > self.bytes.len() {
            return Err(format!(
                "truncated string table: declared {string_table_length} bytes, only {} remain",
                self.bytes.len().saturating_sub(table_start)
            ));
        }
        let string_table = &self.bytes[table_start..table_end];
        self.position = table_end;

        if let Some(index) = public_id_index {
            let identifier = decode_table_string(charset, string_table, index)?;
            if identifier != WML_1_3_PUBLIC_ID_TEXT {
                return Err(format!(
                    "unsupported literal public identifier {identifier:?}"
                ));
            }
        } else if public_id != WML_1_3_PUBLIC_ID {
            return Err(format!(
                "unsupported numeric public identifier {public_id}; expected WML 1.3 identifier {WML_1_3_PUBLIC_ID}"
            ));
        }

        Ok(Header {
            charset,
            string_table,
        })
    }

    fn decode_element(&mut self, depth: usize) -> Result<(), String> {
        if depth >= MAX_NESTING_DEPTH {
            return Err(format!(
                "element nesting exceeds {MAX_NESTING_DEPTH}-level limit"
            ));
        }
        self.consume_page_switches(ParserState::Tag)?;
        let token = self.read_byte("tag token")?;
        let (name, has_attributes, has_content) = match token {
            LITERAL | LITERAL_C | LITERAL_A | LITERAL_AC => {
                let index = self.read_mb_u_int32("literal tag string-table index")?;
                let name = self.table_string(index)?;
                validate_xml_name(&name)?;
                (
                    name,
                    matches!(token, LITERAL_A | LITERAL_AC),
                    matches!(token, LITERAL_C | LITERAL_AC),
                )
            }
            _ => {
                if is_global_token(token) {
                    return Err(format!(
                        "global token 0x{token:02x} cannot begin an element"
                    ));
                }
                let identity = token & 0x3f;
                let name = WML13_TOKEN_REGISTRY
                    .tag_name(self.tag_page, identity)?
                    .ok_or_else(|| {
                        format!(
                            "unknown WML tag token 0x{identity:02x} on code page {}",
                            self.tag_page.index()
                        )
                    })?
                    .to_string();
                (name, token & 0x80 != 0, token & 0x40 != 0)
            }
        };

        self.push_output("<")?;
        self.push_output(&name)?;
        let mut present_attributes = HashSet::new();
        if has_attributes {
            let attributes = self.decode_attributes()?;
            if attributes.is_empty() {
                return Err(format!(
                    "tag {name:?} sets the attribute bit but encodes no attributes"
                ));
            }
            for (attribute_name, value) in attributes {
                if !present_attributes.insert(attribute_name.clone()) {
                    return Err(format!(
                        "duplicate attribute {attribute_name:?} on element {name:?}"
                    ));
                }
                self.write_attribute(&attribute_name, &value)?;
            }
        }
        for (attribute_name, value) in default_attributes(&name) {
            if present_attributes.insert((*attribute_name).to_string()) {
                self.write_attribute(attribute_name, value)?;
            }
        }

        if has_content {
            self.push_output(">")?;
            self.decode_content(depth + 1)?;
            self.push_output("</")?;
            self.push_output(&name)?;
            self.push_output(">")?;
        } else {
            self.push_output("/>")?;
        }
        Ok(())
    }

    fn decode_attributes(&mut self) -> Result<Vec<(String, String)>, String> {
        let mut attributes = Vec::new();
        loop {
            self.consume_page_switches(ParserState::Attribute)?;
            match self.peek() {
                Some(END) => {
                    self.position += 1;
                    return Ok(attributes);
                }
                None => return Err("truncated attribute list; END is missing".to_string()),
                Some(_) => {}
            }

            let token = self.read_byte("attribute-start token")?;
            let (name, mut value) = if token == LITERAL {
                let index = self.read_mb_u_int32("literal attribute string-table index")?;
                let name = self.table_string(index)?;
                validate_xml_name(&name)?;
                (name, String::new())
            } else {
                if token >= 0x80 || is_global_token(token) {
                    return Err(format!("token 0x{token:02x} cannot begin a WML attribute"));
                }
                let (name, prefix) = WML13_TOKEN_REGISTRY
                    .attribute_start(self.attribute_page, token)?
                    .ok_or_else(|| {
                        format!(
                            "unknown WML attribute-start token 0x{token:02x} on code page {}",
                            self.attribute_page.index()
                        )
                    })?;
                (name.to_string(), prefix.to_string())
            };

            loop {
                match self.peek() {
                    Some(END) | Some(LITERAL) => break,
                    Some(SWITCH_PAGE) => {
                        self.consume_page_switches(ParserState::Attribute)?;
                        match self.peek() {
                            Some(next) if is_attribute_start_candidate(next) => break,
                            Some(_) => {}
                            None => {
                                return Err(
                                    "truncated attribute value after code-page switch".to_string()
                                )
                            }
                        }
                    }
                    Some(next) if is_attribute_start_candidate(next) => break,
                    Some(_) => self.decode_attribute_value(&mut value)?,
                    None => return Err("truncated attribute value; END is missing".to_string()),
                }
            }
            attributes.push((name, value));
        }
    }

    fn decode_attribute_value(&mut self, value: &mut String) -> Result<(), String> {
        let token = self.read_byte("attribute-value token")?;
        match token {
            STR_I => value.push_str(&self.read_term_string("inline attribute string")?),
            STR_T => {
                let index = self.read_mb_u_int32("attribute string-table index")?;
                value.push_str(&self.table_string(index)?);
            }
            ENTITY => {
                let entity = self.read_mb_u_int32("attribute entity")?;
                push_entity(value, entity)?;
            }
            EXT_I_0 | EXT_I_1 | EXT_I_2 => {
                let name = self.read_term_string("inline variable name")?;
                value.push_str(&variable_reference(token, &name)?);
            }
            EXT_T_0 | EXT_T_1 | EXT_T_2 => {
                let index = self.read_mb_u_int32("variable string-table index")?;
                let name = self.table_string(index)?;
                value.push_str(&variable_reference(token, &name)?);
            }
            EXT_0 | EXT_1 | EXT_2 => {
                return Err(format!(
                    "reserved WML extension token 0x{token:02x} is unsupported"
                ))
            }
            OPAQUE => {
                self.skip_opaque()?;
                return Err("OPAQUE attribute data has no WML 1.3 mapping".to_string());
            }
            LITERAL_A | LITERAL_AC | LITERAL_C | PI => {
                return Err(format!(
                    "global token 0x{token:02x} is invalid in an attribute value"
                ))
            }
            _ if token >= 0x80 => {
                let fragment = WML13_TOKEN_REGISTRY
                    .attribute_value(self.attribute_page, token)?
                    .ok_or_else(|| {
                        format!(
                            "unknown WML attribute-value token 0x{token:02x} on code page {}",
                            self.attribute_page.index()
                        )
                    })?;
                value.push_str(fragment);
            }
            _ => {
                return Err(format!(
                    "token 0x{token:02x} is invalid in an attribute value"
                ))
            }
        }
        Ok(())
    }

    fn decode_content(&mut self, depth: usize) -> Result<(), String> {
        loop {
            match self.peek() {
                Some(END) => {
                    self.position += 1;
                    return Ok(());
                }
                Some(SWITCH_PAGE) => self.consume_page_switches(ParserState::Tag)?,
                Some(STR_I) => {
                    self.position += 1;
                    let text = self.read_term_string("inline content string")?;
                    self.push_escaped(&text, false)?;
                }
                Some(STR_T) => {
                    self.position += 1;
                    let index = self.read_mb_u_int32("content string-table index")?;
                    let text = self.table_string(index)?;
                    self.push_escaped(&text, false)?;
                }
                Some(ENTITY) => {
                    self.position += 1;
                    let entity = self.read_mb_u_int32("content entity")?;
                    let mut encoded = String::new();
                    push_entity(&mut encoded, entity)?;
                    self.push_output(&encoded)?;
                }
                Some(EXT_I_0 | EXT_I_1 | EXT_I_2) => {
                    let token = self.read_byte("inline extension token")?;
                    let name = self.read_term_string("inline variable name")?;
                    let reference = variable_reference(token, &name)?;
                    self.push_escaped(&reference, false)?;
                }
                Some(EXT_T_0 | EXT_T_1 | EXT_T_2) => {
                    let token = self.read_byte("table extension token")?;
                    let index = self.read_mb_u_int32("variable string-table index")?;
                    let name = self.table_string(index)?;
                    let reference = variable_reference(token, &name)?;
                    self.push_escaped(&reference, false)?;
                }
                Some(EXT_0 | EXT_1 | EXT_2) => {
                    let token = self.read_byte("extension token")?;
                    return Err(format!(
                        "reserved WML extension token 0x{token:02x} is unsupported"
                    ));
                }
                Some(OPAQUE) => {
                    self.position += 1;
                    self.skip_opaque()?;
                    return Err("OPAQUE content has no WML 1.3 mapping".to_string());
                }
                Some(PI) => self.decode_processing_instruction()?,
                Some(LITERAL | LITERAL_C | LITERAL_A | LITERAL_AC) => self.decode_element(depth)?,
                Some(token) if !is_global_token(token) && token >= 0x05 => {
                    self.decode_element(depth)?
                }
                Some(token) => {
                    return Err(format!("token 0x{token:02x} is invalid in element content"))
                }
                None => return Err("truncated element content; END is missing".to_string()),
            }
        }
    }

    fn decode_processing_instruction(&mut self) -> Result<(), String> {
        let token = self.read_byte("processing-instruction token")?;
        if token != PI {
            return Err(format!(
                "expected processing-instruction token, found 0x{token:02x}"
            ));
        }
        let attributes = self.decode_attributes()?;
        if attributes.len() != 1 {
            return Err(
                "processing instruction must encode exactly one target/value pair".to_string(),
            );
        }
        let (target, value) = &attributes[0];
        validate_xml_name(target)?;
        if target.eq_ignore_ascii_case("xml") {
            return Err("processing-instruction target must not be XML".to_string());
        }
        self.push_output("<?")?;
        self.push_output(target)?;
        if !value.is_empty() {
            self.push_output(" ")?;
            self.push_output(value)?;
        }
        self.push_output("?>")?;
        Ok(())
    }

    fn consume_page_switches(&mut self, state: ParserState) -> Result<(), String> {
        while self.peek() == Some(SWITCH_PAGE) {
            self.position += 1;
            let page = CodePage(self.read_byte("code-page index")?);
            match state {
                ParserState::Tag => self.tag_page = page,
                ParserState::Attribute => self.attribute_page = page,
            }
        }
        Ok(())
    }

    fn skip_opaque(&mut self) -> Result<(), String> {
        let length = self.read_mb_u_int32("OPAQUE length")? as usize;
        let end = self
            .position
            .checked_add(length)
            .ok_or_else(|| "OPAQUE length overflows address space".to_string())?;
        if end > self.bytes.len() {
            return Err(format!(
                "truncated OPAQUE payload: declared {length} bytes, only {} remain",
                self.bytes.len().saturating_sub(self.position)
            ));
        }
        self.position = end;
        Ok(())
    }

    fn write_attribute(&mut self, name: &str, value: &str) -> Result<(), String> {
        self.push_output(" ")?;
        self.push_output(name)?;
        self.push_output("=\"")?;
        self.push_escaped(value, true)?;
        self.push_output("\"")
    }

    fn push_escaped(&mut self, value: &str, attribute: bool) -> Result<(), String> {
        let mut escaped = String::with_capacity(value.len());
        for character in value.chars() {
            match character {
                '&' => escaped.push_str("&amp;"),
                '<' => escaped.push_str("&lt;"),
                '>' => escaped.push_str("&gt;"),
                '"' if attribute => escaped.push_str("&quot;"),
                '\'' if attribute => escaped.push_str("&apos;"),
                _ => escaped.push(character),
            }
        }
        self.push_output(&escaped)
    }

    fn push_output(&mut self, value: &str) -> Result<(), String> {
        let next_length = self
            .output
            .len()
            .checked_add(value.len())
            .ok_or_else(|| "decoded output length overflows address space".to_string())?;
        if next_length > self.max_output_bytes {
            return Err(format!(
                "output exceeds {}-byte limit",
                self.max_output_bytes
            ));
        }
        self.output.push_str(value);
        Ok(())
    }

    fn table_string(&self, index: u32) -> Result<String, String> {
        decode_table_string(self.charset, self.string_table, index)
    }

    fn read_term_string(&mut self, label: &str) -> Result<String, String> {
        let start = self.position;
        let relative_end = self.bytes[start..]
            .iter()
            .position(|byte| *byte == 0)
            .ok_or_else(|| format!("unterminated {label} at byte {start}"))?;
        let end = start + relative_end;
        self.position = end + 1;
        self.charset
            .decode(&self.bytes[start..end])
            .map_err(|error| format!("{label}: {error}"))
    }

    fn read_mb_u_int32(&mut self, label: &str) -> Result<u32, String> {
        let start = self.position;
        let mut value = 0u32;
        let mut octets = 0usize;
        let mut first_group = 0u8;
        loop {
            let octet = self.read_byte(label)?;
            octets += 1;
            if octets > 5 {
                return Err(format!("{label} at byte {start} exceeds five octets"));
            }
            if octets == 1 {
                first_group = octet & 0x7f;
            }
            if octets == 5 && first_group > 0x0f {
                return Err(format!(
                    "{label} at byte {start} has non-zero unused high bits"
                ));
            }
            value = value
                .checked_mul(128)
                .and_then(|shifted| shifted.checked_add(u32::from(octet & 0x7f)))
                .ok_or_else(|| format!("{label} at byte {start} overflows u32"))?;
            if octet & 0x80 == 0 {
                return Ok(value);
            }
        }
    }

    fn read_byte(&mut self, label: &str) -> Result<u8, String> {
        let byte = self
            .bytes
            .get(self.position)
            .copied()
            .ok_or_else(|| format!("truncated {label} at byte {}", self.position))?;
        self.position += 1;
        Ok(byte)
    }

    fn peek(&self) -> Option<u8> {
        self.bytes.get(self.position).copied()
    }
}

#[derive(Clone, Copy)]
enum ParserState {
    Tag,
    Attribute,
}

#[derive(Clone, Copy)]
enum CodeSpace {
    Tag,
    Attribute,
}

impl CodeSpace {
    fn label(self) -> &'static str {
        match self {
            Self::Tag => "tag",
            Self::Attribute => "attribute",
        }
    }
}

fn decode_table_string(
    charset: Charset,
    string_table: &[u8],
    index: u32,
) -> Result<String, String> {
    let start = usize::try_from(index)
        .map_err(|_| format!("string-table offset {index} does not fit address space"))?;
    if start >= string_table.len() {
        return Err(format!(
            "string-table offset {index} is outside {}-byte table",
            string_table.len()
        ));
    }
    let relative_end = string_table[start..]
        .iter()
        .position(|byte| *byte == 0)
        .ok_or_else(|| format!("string-table string at offset {index} is unterminated"))?;
    charset
        .decode(&string_table[start..start + relative_end])
        .map_err(|error| format!("string-table string at offset {index}: {error}"))
}

fn is_attribute_start_candidate(token: u8) -> bool {
    token == LITERAL || ((0x05..0x80).contains(&token) && !is_global_token(token))
}

fn is_global_token(token: u8) -> bool {
    matches!(
        token,
        SWITCH_PAGE
            | END
            | ENTITY
            | STR_I
            | LITERAL
            | EXT_I_0
            | EXT_I_1
            | EXT_I_2
            | PI
            | LITERAL_C
            | EXT_T_0
            | EXT_T_1
            | EXT_T_2
            | STR_T
            | LITERAL_A
            | EXT_0
            | EXT_1
            | EXT_2
            | OPAQUE
            | LITERAL_AC
    )
}

fn page_zero_tag_name(token: u8) -> Option<&'static str> {
    match token {
        0x1b => Some("pre"),
        0x1c => Some("a"),
        0x1d => Some("td"),
        0x1e => Some("tr"),
        0x1f => Some("table"),
        0x20 => Some("p"),
        0x21 => Some("postfield"),
        0x22 => Some("anchor"),
        0x23 => Some("access"),
        0x24 => Some("b"),
        0x25 => Some("big"),
        0x26 => Some("br"),
        0x27 => Some("card"),
        0x28 => Some("do"),
        0x29 => Some("em"),
        0x2a => Some("fieldset"),
        0x2b => Some("go"),
        0x2c => Some("head"),
        0x2d => Some("i"),
        0x2e => Some("img"),
        0x2f => Some("input"),
        0x30 => Some("meta"),
        0x31 => Some("noop"),
        0x32 => Some("prev"),
        0x33 => Some("onevent"),
        0x34 => Some("optgroup"),
        0x35 => Some("option"),
        0x36 => Some("refresh"),
        0x37 => Some("select"),
        0x38 => Some("small"),
        0x39 => Some("strong"),
        0x3b => Some("template"),
        0x3c => Some("timer"),
        0x3d => Some("u"),
        0x3e => Some("setvar"),
        0x3f => Some("wml"),
        _ => None,
    }
}

fn page_zero_attribute_start(token: u8) -> Option<(&'static str, &'static str)> {
    match token {
        0x05 => Some(("accept-charset", "")),
        0x06 => Some(("align", "bottom")),
        0x07 => Some(("align", "center")),
        0x08 => Some(("align", "left")),
        0x09 => Some(("align", "middle")),
        0x0a => Some(("align", "right")),
        0x0b => Some(("align", "top")),
        0x0c => Some(("alt", "")),
        0x0d => Some(("content", "")),
        0x0f => Some(("domain", "")),
        0x10 => Some(("emptyok", "false")),
        0x11 => Some(("emptyok", "true")),
        0x12 => Some(("format", "")),
        0x13 => Some(("height", "")),
        0x14 => Some(("hspace", "")),
        0x15 => Some(("ivalue", "")),
        0x16 => Some(("iname", "")),
        0x18 => Some(("label", "")),
        0x19 => Some(("localsrc", "")),
        0x1a => Some(("maxlength", "")),
        0x1b => Some(("method", "get")),
        0x1c => Some(("method", "post")),
        0x1d => Some(("mode", "nowrap")),
        0x1e => Some(("mode", "wrap")),
        0x1f => Some(("multiple", "false")),
        0x20 => Some(("multiple", "true")),
        0x21 => Some(("name", "")),
        0x22 => Some(("newcontext", "false")),
        0x23 => Some(("newcontext", "true")),
        0x24 => Some(("onpick", "")),
        0x25 => Some(("onenterbackward", "")),
        0x26 => Some(("onenterforward", "")),
        0x27 => Some(("ontimer", "")),
        0x28 => Some(("optional", "false")),
        0x29 => Some(("optional", "true")),
        0x2a => Some(("path", "")),
        0x2e => Some(("scheme", "")),
        0x2f => Some(("sendreferer", "false")),
        0x30 => Some(("sendreferer", "true")),
        0x31 => Some(("size", "")),
        0x32 => Some(("src", "")),
        0x33 => Some(("ordered", "true")),
        0x34 => Some(("ordered", "false")),
        0x35 => Some(("tabindex", "")),
        0x36 => Some(("title", "")),
        0x37 => Some(("type", "")),
        0x38 => Some(("type", "accept")),
        0x39 => Some(("type", "delete")),
        0x3a => Some(("type", "help")),
        0x3b => Some(("type", "password")),
        0x3c => Some(("type", "onpick")),
        0x3d => Some(("type", "onenterbackward")),
        0x3e => Some(("type", "onenterforward")),
        0x3f => Some(("type", "ontimer")),
        0x45 => Some(("type", "options")),
        0x46 => Some(("type", "prev")),
        0x47 => Some(("type", "reset")),
        0x48 => Some(("type", "text")),
        0x49 => Some(("type", "vnd.")),
        0x4a => Some(("href", "")),
        0x4b => Some(("href", "http://")),
        0x4c => Some(("href", "https://")),
        0x4d => Some(("value", "")),
        0x4e => Some(("vspace", "")),
        0x4f => Some(("width", "")),
        0x50 => Some(("xml:lang", "")),
        0x52 => Some(("align", "")),
        0x53 => Some(("columns", "")),
        0x54 => Some(("class", "")),
        0x55 => Some(("id", "")),
        0x56 => Some(("forua", "false")),
        0x57 => Some(("forua", "true")),
        0x58 => Some(("src", "http://")),
        0x59 => Some(("src", "https://")),
        0x5a => Some(("http-equiv", "")),
        0x5b => Some(("http-equiv", "Content-Type")),
        0x5c => Some(("content", "application/vnd.wap.wmlc;charset=")),
        0x5d => Some(("http-equiv", "Expires")),
        0x5e => Some(("accesskey", "")),
        0x5f => Some(("enctype", "")),
        0x60 => Some(("enctype", "application/x-www-form-urlencoded")),
        0x61 => Some(("enctype", "multipart/form-data")),
        0x62 => Some(("xml:space", "preserve")),
        0x63 => Some(("xml:space", "default")),
        0x64 => Some(("cache-control", "no-cache")),
        _ => None,
    }
}

fn page_zero_attribute_value(token: u8) -> Option<&'static str> {
    match token {
        0x85 => Some(".com/"),
        0x86 => Some(".edu/"),
        0x87 => Some(".net/"),
        0x88 => Some(".org/"),
        0x89 => Some("accept"),
        0x8a => Some("bottom"),
        0x8b => Some("clear"),
        0x8c => Some("delete"),
        0x8d => Some("help"),
        0x8e => Some("http://"),
        0x8f => Some("http://www."),
        0x90 => Some("https://"),
        0x91 => Some("https://www."),
        0x93 => Some("middle"),
        0x94 => Some("nowrap"),
        0x95 => Some("onpick"),
        0x96 => Some("onenterbackward"),
        0x97 => Some("onenterforward"),
        0x98 => Some("ontimer"),
        0x99 => Some("options"),
        0x9a => Some("password"),
        0x9b => Some("reset"),
        0x9d => Some("text"),
        0x9e => Some("top"),
        0x9f => Some("unknown"),
        0xa0 => Some("wrap"),
        0xa1 => Some("www."),
        _ => None,
    }
}

fn default_attributes(tag: &str) -> &'static [(&'static str, &'static str)] {
    match tag {
        "card" => &[("newcontext", "false"), ("ordered", "true")],
        "do" => &[("optional", "false")],
        "meta" => &[("forua", "false")],
        "go" => &[
            ("sendreferer", "false"),
            ("method", "get"),
            ("enctype", "application/x-www-form-urlencoded"),
        ],
        "select" => &[("multiple", "false")],
        "input" => &[("type", "text")],
        "img" => &[("vspace", "0"), ("hspace", "0"), ("align", "bottom")],
        "p" => &[("align", "left")],
        "pre" => &[("xml:space", "preserve")],
        _ => &[],
    }
}

fn variable_reference(token: u8, name: &str) -> Result<String, String> {
    if name.is_empty()
        || !name.chars().enumerate().all(|(index, character)| {
            character == '_'
                || character.is_ascii_alphabetic()
                || (index > 0 && character.is_ascii_digit())
        })
    {
        return Err(format!("invalid WML variable name {name:?}"));
    }
    let conversion = match token {
        EXT_I_0 | EXT_T_0 => ":escape",
        EXT_I_1 | EXT_T_1 => ":unesc",
        EXT_I_2 | EXT_T_2 => "",
        _ => return Err(format!("token 0x{token:02x} is not a WML variable token")),
    };
    Ok(format!("$({name}{conversion})"))
}

fn push_entity(output: &mut String, value: u32) -> Result<(), String> {
    let character =
        char::from_u32(value).ok_or_else(|| format!("entity U+{value:04X} is not valid UCS-4"))?;
    if !is_xml_character(character) {
        return Err(format!("entity U+{value:04X} is not permitted in XML 1.0"));
    }
    write!(output, "&#{value};").map_err(|error| format!("format entity: {error}"))
}

fn is_xml_character(character: char) -> bool {
    matches!(character, '\u{9}' | '\u{a}' | '\u{d}')
        || ('\u{20}'..='\u{d7ff}').contains(&character)
        || ('\u{e000}'..='\u{fffd}').contains(&character)
        || ('\u{10000}'..='\u{10ffff}').contains(&character)
}

fn validate_xml_name(name: &str) -> Result<(), String> {
    let mut characters = name.chars();
    let first = characters
        .next()
        .ok_or_else(|| "literal XML name is empty".to_string())?;
    if !(first.is_ascii_alphabetic() || matches!(first, '_' | ':')) {
        return Err(format!("invalid literal XML name {name:?}"));
    }
    if characters.any(|character| {
        !(character.is_ascii_alphanumeric() || matches!(character, '_' | ':' | '-' | '.'))
    }) {
        return Err(format!("invalid literal XML name {name:?}"));
    }
    Ok(())
}

fn decode_error(detail: &str) -> String {
    format!("WBXML decode failed: {detail}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wml13_decoder_accepts_supported_wbxml_envelope_versions() {
        for version in SUPPORTED_WBXML_VERSIONS {
            let payload = [*version, WML_1_3_PUBLIC_ID as u8, 0x6a, 0x00, 0x3f];
            assert_eq!(
                decode_wml13(&payload, 1024).as_deref(),
                Ok("<wml/>"),
                "WBXML version byte 0x{version:02x}"
            );
        }
    }

    #[test]
    fn wml13_decoder_rejects_unknown_wbxml_envelope_version() {
        let error = decode_wml13(&[0x00, 0x0a, 0x6a, 0x00, 0x3f], 1024)
            .expect_err("WBXML version 1.0 must remain unsupported");
        assert!(error.contains("expected 0x01, 0x02, or 0x03"));
    }

    #[test]
    fn wml13_registry_classifies_all_256_pages_per_code_space() {
        let mut registered = 0;
        let mut unassigned = 0;
        let mut implementation_specific = 0;

        for page_index in 0..=u8::MAX {
            let page = CodePage(page_index);
            for result in [
                WML13_TOKEN_REGISTRY
                    .table(CodeSpace::Tag, page, WML13_TAG_CODE_PAGES)
                    .map(|_| ()),
                WML13_TOKEN_REGISTRY
                    .table(CodeSpace::Attribute, page, WML13_ATTRIBUTE_CODE_PAGES)
                    .map(|_| ()),
            ] {
                match (page_index, result) {
                    (0, Ok(())) => registered += 1,
                    (IMPLEMENTATION_SPECIFIC_CODE_PAGE, Err(error))
                        if error.contains("implementation-specific") =>
                    {
                        implementation_specific += 1;
                    }
                    (1..=254, Err(error)) if error.contains("unassigned") => {
                        unassigned += 1;
                    }
                    (_, outcome) => {
                        panic!("unexpected code-page classification for {page_index}: {outcome:?}")
                    }
                }
            }
        }

        assert_eq!(registered, 2, "page zero is registered in both code spaces");
        assert_eq!(
            unassigned, 508,
            "pages 1 through 254 are unassigned in both code spaces"
        );
        assert_eq!(
            implementation_specific, 2,
            "page 255 is reserved in both code spaces"
        );
    }
}
