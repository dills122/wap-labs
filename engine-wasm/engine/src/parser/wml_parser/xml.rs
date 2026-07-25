use quick_xml::events::{BytesStart, Event};
use quick_xml::Reader;
use quick_xml::XmlVersion;
use std::collections::HashMap;

use super::MAX_PARSE_TREE_DEPTH;

const WML_1_3_PUBLIC_ID: &str = "-//WAPFORUM//DTD WML 1.3//EN";
const WML_1_3_SYSTEM_ID: &str = "http://www.wapforum.org/DTD/wml13.dtd";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum WmlDocumentType {
    Wml13,
    Alternate,
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

pub(super) fn parse_xml_root(xml: &str) -> Result<XmlElement, String> {
    let mut reader = Reader::from_str(xml);
    let mut stack: Vec<XmlElement> = Vec::new();
    let mut root: Option<XmlElement> = None;
    let mut document_type = None;

    loop {
        match reader.read_event() {
            Ok(Event::Start(start)) => {
                // Enforce the nesting-depth budget while the tree is being
                // built, not only afterward in the semantic walkers
                // (`parse_card_actions`/`parse_card_nodes_xml`). Bailing out
                // here means a pathologically deep-but-well-formed tag tree
                // is never fully constructed, which also prevents the
                // compiler-derived recursive `Drop` on `XmlElement`/`XmlNode`
                // from overflowing the stack when the tree goes out of scope.
                if stack.len() >= MAX_PARSE_TREE_DEPTH {
                    return Err(format!(
                        "Parse limit exceeded: nesting depth in xml tree traversal (max {MAX_PARSE_TREE_DEPTH})"
                    ));
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
                    return Err("Malformed XML: multiple DOCTYPE declarations".to_string());
                }
                if root.is_some() || !stack.is_empty() {
                    return Err(
                        "Malformed XML: DOCTYPE declaration must precede the root element"
                            .to_string(),
                    );
                }
                let raw = std::str::from_utf8(value.as_ref())
                    .map_err(|_| "Malformed XML: DOCTYPE declaration is not UTF-8".to_string())?;
                document_type = Some(classify_wml_doctype(raw)?);
            }
            Ok(Event::End(_)) => {
                let Some(element) = stack.pop() else {
                    return Err("Malformed XML: unexpected closing tag".to_string());
                };
                attach_node(&mut stack, &mut root, XmlNode::Element(element))?;
            }
            Ok(Event::Eof) => break,
            Ok(_) => {}
            Err(err) => return Err(format!("Malformed XML: {err}")),
        }
    }

    if !stack.is_empty() {
        return Err("Malformed XML: unclosed tag".to_string());
    }

    root.ok_or_else(|| "Missing required <wml> root element".to_string())
}

fn classify_wml_doctype(raw: &str) -> Result<WmlDocumentType, String> {
    let (root_name, remainder) =
        take_word(raw).ok_or_else(|| "Malformed XML: DOCTYPE declaration is empty".to_string())?;
    if !root_name.eq_ignore_ascii_case("wml") {
        return Err(format!(
            "Malformed XML: DOCTYPE root {root_name:?} does not match <wml>"
        ));
    }

    let (kind, remainder) = take_word(remainder)
        .ok_or_else(|| "Malformed XML: DOCTYPE external identifier is missing".to_string())?;
    match kind {
        "PUBLIC" => {
            let (public_id, remainder) = take_quoted(remainder)
                .ok_or_else(|| "Malformed XML: DOCTYPE public identifier is missing".to_string())?;
            let (system_id, trailing) = take_quoted(remainder)
                .ok_or_else(|| "Malformed XML: DOCTYPE system identifier is missing".to_string())?;
            reject_doctype_trailing_data(trailing)?;

            if public_id == WML_1_3_PUBLIC_ID {
                if system_id != WML_1_3_SYSTEM_ID {
                    return Err(format!(
                        "Malformed XML: WML 1.3 system identifier must be {WML_1_3_SYSTEM_ID:?}"
                    ));
                }
                Ok(WmlDocumentType::Wml13)
            } else {
                Ok(WmlDocumentType::Alternate)
            }
        }
        "SYSTEM" => {
            let (_, trailing) = take_quoted(remainder)
                .ok_or_else(|| "Malformed XML: DOCTYPE system identifier is missing".to_string())?;
            reject_doctype_trailing_data(trailing)?;
            Ok(WmlDocumentType::Alternate)
        }
        _ => Err(format!(
            "Malformed XML: unsupported DOCTYPE external identifier {kind:?}"
        )),
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

fn reject_doctype_trailing_data(value: &str) -> Result<(), String> {
    if value.trim().is_empty() {
        return Ok(());
    }
    Err("Malformed XML: DOCTYPE internal subsets are outside the supported WML policy".to_string())
}

fn start_to_element(start: &BytesStart<'_>) -> Result<XmlElement, String> {
    let name = String::from_utf8_lossy(start.name().as_ref()).to_ascii_lowercase();
    let mut attrs = HashMap::new();
    for attr in start.attributes().with_checks(false) {
        let attr = attr.map_err(|err| format!("Malformed XML attribute: {err}"))?;
        let key = String::from_utf8_lossy(attr.key.as_ref()).to_ascii_lowercase();
        let value = attr
            .normalized_value(XmlVersion::Implicit1_0)
            .map_err(|err| format!("Malformed XML attribute value: {err}"))?
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
) -> Result<(), String> {
    if let Some(parent) = stack.last_mut() {
        parent.children.push(node);
        return Ok(());
    }

    match node {
        XmlNode::Element(element) => {
            if root.is_some() {
                return Err("Malformed XML: multiple root elements".to_string());
            }
            *root = Some(element);
            Ok(())
        }
        XmlNode::Text(text) => {
            if text.trim().is_empty() {
                return Ok(());
            }
            Err("Malformed XML: text outside root element".to_string())
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
    match token {
        "lt" => "<".to_string(),
        "gt" => ">".to_string(),
        "amp" => "&".to_string(),
        "quot" => "\"".to_string(),
        "apos" | "#39" => "'".to_string(),
        _ => raw.to_string(),
    }
}
