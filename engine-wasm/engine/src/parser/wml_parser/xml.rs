use quick_xml::errors::{Error as XmlError, IllFormedError};
use quick_xml::events::{BytesStart, Event};
use quick_xml::Reader;
use quick_xml::XmlVersion;
use std::collections::HashMap;

use super::MAX_PARSE_TREE_DEPTH;
use crate::WmlLoadDiagnostic;

const WML_1_3_PUBLIC_ID: &str = "-//WAPFORUM//DTD WML 1.3//EN";
const WML_1_3_SYSTEM_ID: &str = "http://www.wapforum.org/DTD/wml13.dtd";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum WmlDocumentType {
    Wml13,
    Alternate,
}

pub(super) struct XmlDocument {
    pub(super) root: XmlElement,
    pub(super) document_type: Option<WmlDocumentType>,
    pub(super) has_xml_declaration: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(super) enum XmlNode {
    Element(XmlElement),
    Text(String),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(super) struct XmlElement {
    pub(super) name: String,
    pub(super) attrs: HashMap<String, String>,
    pub(super) children: Vec<XmlNode>,
}

impl XmlElement {
    pub(super) fn attr(&self, key: &str) -> Option<&str> {
        self.attrs.get(key).map(String::as_str)
    }
}

#[cfg(test)]
pub(super) fn parse_xml_root(xml: &str) -> Result<XmlElement, String> {
    parse_xml_document(xml)
        .map(|document| document.root)
        .map_err(|diagnostic| diagnostic.message)
}

pub(super) fn parse_xml_document(xml: &str) -> Result<XmlDocument, WmlLoadDiagnostic> {
    let mut reader = Reader::from_str(xml);
    let mut stack: Vec<XmlElement> = Vec::new();
    let mut root: Option<XmlElement> = None;
    let mut document_type = None;
    let mut has_xml_declaration = false;

    loop {
        match reader.read_event() {
            Ok(Event::Decl(declaration)) => {
                if has_xml_declaration {
                    return Err(WmlLoadDiagnostic::malformed(
                        "Malformed XML: multiple XML declarations",
                    ));
                }
                if document_type.is_some() || root.is_some() || !stack.is_empty() {
                    return Err(WmlLoadDiagnostic::malformed(
                        "Malformed XML: XML declaration must precede the DOCTYPE and root element",
                    ));
                }
                let version = declaration.version().map_err(|err| {
                    WmlLoadDiagnostic::malformed(format!(
                        "Malformed XML: XML declaration version is invalid: {err}"
                    ))
                })?;
                if version.as_ref() != b"1.0" {
                    return Err(WmlLoadDiagnostic::invalid(
                        "Invalid WML prologue: XML declaration version must be '1.0'",
                    ));
                }
                has_xml_declaration = true;
            }
            Ok(Event::Start(start)) => {
                // Enforce the nesting-depth budget while the tree is being
                // built, not only afterward in the semantic walkers
                // (`parse_card_actions`/`parse_card_nodes_xml`). Bailing out
                // here means a pathologically deep-but-well-formed tag tree
                // is never fully constructed, which also prevents the
                // compiler-derived recursive `Drop` on `XmlElement`/`XmlNode`
                // from overflowing the stack when the tree goes out of scope.
                if stack.len() >= MAX_PARSE_TREE_DEPTH {
                    return Err(WmlLoadDiagnostic::invalid(format!(
                        "Parse limit exceeded: nesting depth in xml tree traversal (max {MAX_PARSE_TREE_DEPTH})"
                    )));
                }
                stack.push(start_to_element(&start)?);
            }
            Ok(Event::Empty(start)) => {
                let element = start_to_element(&start)?;
                attach_node(&mut stack, &mut root, XmlNode::Element(element))?;
            }
            Ok(Event::Text(text)) => {
                let raw = String::from_utf8_lossy(text.as_ref()).to_string();
                attach_node(&mut stack, &mut root, XmlNode::Text(decode_entities(&raw)))?;
            }
            Ok(Event::GeneralRef(reference)) => {
                let raw = String::from_utf8_lossy(reference.as_ref()).to_string();
                let decoded = decode_general_entity(&raw);
                attach_node(&mut stack, &mut root, XmlNode::Text(decoded))?;
            }
            Ok(Event::CData(text)) => {
                let raw = String::from_utf8_lossy(text.as_ref()).to_string();
                attach_node(&mut stack, &mut root, XmlNode::Text(raw))?;
            }
            Ok(Event::DocType(value)) => {
                if document_type.is_some() {
                    return Err(WmlLoadDiagnostic::malformed(
                        "Malformed XML: multiple DOCTYPE declarations",
                    ));
                }
                if root.is_some() || !stack.is_empty() {
                    return Err(WmlLoadDiagnostic::malformed(
                        "Malformed XML: DOCTYPE declaration must precede the root element",
                    ));
                }
                let raw = std::str::from_utf8(value.as_ref()).map_err(|_| {
                    WmlLoadDiagnostic::malformed("Malformed XML: DOCTYPE declaration is not UTF-8")
                })?;
                document_type = Some(classify_wml_doctype(raw)?);
            }
            Ok(Event::End(_)) => {
                let Some(element) = stack.pop() else {
                    return Err(WmlLoadDiagnostic::malformed(
                        "Malformed XML: unexpected closing tag",
                    ));
                };
                attach_node(&mut stack, &mut root, XmlNode::Element(element))?;
            }
            Ok(Event::Eof) => break,
            Ok(_) => {}
            Err(err) => return Err(map_reader_error(err)),
        }
    }

    if !stack.is_empty() {
        return Err(WmlLoadDiagnostic::malformed("Malformed XML: unclosed tag"));
    }

    let root =
        root.ok_or_else(|| WmlLoadDiagnostic::invalid("Missing required <wml> root element"))?;
    Ok(XmlDocument {
        root,
        document_type,
        has_xml_declaration,
    })
}

fn map_reader_error(err: XmlError) -> WmlLoadDiagnostic {
    match err {
        XmlError::IllFormed(IllFormedError::MismatchedEndTag { expected, .. })
            if expected == "card" =>
        {
            WmlLoadDiagnostic::malformed("Missing closing </card> tag")
        }
        other => WmlLoadDiagnostic::malformed(format!("Malformed XML: {other}")),
    }
}

fn classify_wml_doctype(raw: &str) -> Result<WmlDocumentType, WmlLoadDiagnostic> {
    let (root_name, remainder) = take_word(raw).ok_or_else(|| {
        WmlLoadDiagnostic::malformed("Malformed XML: DOCTYPE declaration is empty")
    })?;
    if !root_name.eq_ignore_ascii_case("wml") {
        return Err(WmlLoadDiagnostic::invalid(format!(
            "Malformed XML: DOCTYPE root {root_name:?} does not match <wml>"
        )));
    }

    let (kind, remainder) = take_word(remainder).ok_or_else(|| {
        WmlLoadDiagnostic::malformed("Malformed XML: DOCTYPE external identifier is missing")
    })?;
    match kind {
        "PUBLIC" => {
            let (public_id, remainder) = take_quoted(remainder).ok_or_else(|| {
                WmlLoadDiagnostic::malformed("Malformed XML: DOCTYPE public identifier is missing")
            })?;
            let (system_id, trailing) = take_quoted(remainder).ok_or_else(|| {
                WmlLoadDiagnostic::malformed("Malformed XML: DOCTYPE system identifier is missing")
            })?;
            reject_doctype_trailing_data(trailing)?;

            if public_id == WML_1_3_PUBLIC_ID {
                if system_id != WML_1_3_SYSTEM_ID {
                    return Err(WmlLoadDiagnostic::invalid(format!(
                        "Malformed XML: WML 1.3 system identifier must be {WML_1_3_SYSTEM_ID:?}"
                    )));
                }
                Ok(WmlDocumentType::Wml13)
            } else {
                Ok(WmlDocumentType::Alternate)
            }
        }
        "SYSTEM" => {
            let (_, trailing) = take_quoted(remainder).ok_or_else(|| {
                WmlLoadDiagnostic::malformed("Malformed XML: DOCTYPE system identifier is missing")
            })?;
            reject_doctype_trailing_data(trailing)?;
            Ok(WmlDocumentType::Alternate)
        }
        _ => Err(WmlLoadDiagnostic::invalid(format!(
            "Malformed XML: unsupported DOCTYPE external identifier {kind:?}"
        ))),
    }
}

fn take_word(value: &str) -> Option<(&str, &str)> {
    let value = value.trim_start();
    if value.is_empty() {
        return None;
    }
    let end = value.find(char::is_whitespace).unwrap_or(value.len());
    Some((&value[..end], &value[end..]))
}

fn take_quoted(value: &str) -> Option<(&str, &str)> {
    let value = value.trim_start();
    let quote = value.chars().next()?;
    if !matches!(quote, '\'' | '"') {
        return None;
    }
    let quoted = &value[quote.len_utf8()..];
    let end = quoted.find(quote)?;
    Some((&quoted[..end], &quoted[end + quote.len_utf8()..]))
}

fn reject_doctype_trailing_data(value: &str) -> Result<(), WmlLoadDiagnostic> {
    if value.trim().is_empty() {
        return Ok(());
    }
    Err(WmlLoadDiagnostic::invalid(
        "Malformed XML: DOCTYPE internal subsets are outside the supported WML policy",
    ))
}

fn start_to_element(start: &BytesStart<'_>) -> Result<XmlElement, WmlLoadDiagnostic> {
    // WML inherits XML's case sensitivity. Preserving authored spelling here
    // ensures the strict WML validator rejects case-folded guesses instead of
    // silently turning <CARD> or HREF into declared WML names.
    let name = String::from_utf8_lossy(start.name().as_ref()).to_string();
    let mut attrs = HashMap::new();
    for attr in start.attributes() {
        let attr = attr.map_err(|err| {
            WmlLoadDiagnostic::malformed(format!("Malformed XML attribute: {err}"))
        })?;
        let key = String::from_utf8_lossy(attr.key.as_ref()).to_string();
        let value = attr
            .normalized_value(XmlVersion::Implicit1_0)
            .map_err(|err| {
                WmlLoadDiagnostic::malformed(format!("Malformed XML attribute value: {err}"))
            })?
            .into_owned();
        attrs.insert(key, decode_entities(&value));
    }
    Ok(XmlElement {
        name,
        attrs,
        children: Vec::new(),
    })
}

fn attach_node(
    stack: &mut [XmlElement],
    root: &mut Option<XmlElement>,
    node: XmlNode,
) -> Result<(), WmlLoadDiagnostic> {
    if let Some(parent) = stack.last_mut() {
        if let XmlNode::Text(text) = &node {
            if let Some(XmlNode::Text(previous)) = parent.children.last_mut() {
                previous.push_str(text);
                return Ok(());
            }
        }
        parent.children.push(node);
        return Ok(());
    }

    match node {
        XmlNode::Element(element) => {
            if root.is_some() {
                return Err(WmlLoadDiagnostic::malformed(
                    "Malformed XML: multiple root elements",
                ));
            }
            *root = Some(element);
            Ok(())
        }
        XmlNode::Text(text) => {
            if text.trim().is_empty() {
                return Ok(());
            }
            Err(WmlLoadDiagnostic::malformed(
                "Malformed XML: text outside root element",
            ))
        }
    }
}

pub(super) fn normalize_text(input: &str) -> String {
    let mut out = String::new();
    let mut saw_whitespace = false;

    for ch in decode_entities(input).chars() {
        if ch.is_whitespace() {
            if !saw_whitespace {
                out.push(' ');
                saw_whitespace = true;
            }
        } else {
            out.push(ch);
            saw_whitespace = false;
        }
    }

    out.trim().to_string()
}

fn decode_entities(input: &str) -> String {
    input
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
}

fn decode_general_entity(raw: &str) -> String {
    let token = raw.trim_start_matches('&').trim_end_matches(';');
    let numeric = token
        .strip_prefix("#x")
        .or_else(|| token.strip_prefix("#X"))
        .and_then(|value| u32::from_str_radix(value, 16).ok())
        .or_else(|| {
            token
                .strip_prefix('#')
                .and_then(|value| value.parse::<u32>().ok())
        })
        .and_then(char::from_u32);
    if let Some(ch) = numeric {
        return ch.to_string();
    }
    match token {
        "lt" => "<".to_string(),
        "gt" => ">".to_string(),
        "amp" => "&".to_string(),
        "quot" => "\"".to_string(),
        "apos" | "#39" => "'".to_string(),
        _ => raw.to_string(),
    }
}
