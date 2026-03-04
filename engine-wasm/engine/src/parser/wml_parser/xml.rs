use quick_xml::events::{BytesStart, Event};
use quick_xml::Reader;
use std::collections::HashMap;

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

    loop {
        match reader.read_event() {
            Ok(Event::Start(start)) => {
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

fn start_to_element(start: &BytesStart<'_>) -> Result<XmlElement, String> {
    let name = String::from_utf8_lossy(start.name().as_ref()).to_ascii_lowercase();
    let mut attrs = HashMap::new();
    for attr in start.attributes().with_checks(false) {
        let attr = attr.map_err(|err| format!("Malformed XML attribute: {err}"))?;
        let key = String::from_utf8_lossy(attr.key.as_ref()).to_ascii_lowercase();
        let value = attr
            .unescape_value()
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

pub(super) fn extract_wml_body(xml: &str) -> Result<&str, String> {
    let open_start = find_tag_from(xml, "wml", 0)
        .ok_or_else(|| "Missing required <wml> root element".to_string())?;

    let open_end = xml[open_start..]
        .find('>')
        .map(|idx| open_start + idx)
        .ok_or_else(|| "Malformed <wml> opening tag".to_string())?;

    let close_start = xml[open_end + 1..]
        .find("</wml>")
        .map(|idx| open_end + 1 + idx)
        .ok_or_else(|| "Missing closing </wml> root element".to_string())?;

    Ok(&xml[open_end + 1..close_start])
}

pub(super) fn find_tag_from(xml: &str, tag_name: &str, from: usize) -> Option<usize> {
    let needle = format!("<{tag_name}");
    let mut search = from;
    while let Some(rel_idx) = xml[search..].find(&needle) {
        let idx = search + rel_idx;
        let next = xml[idx + needle.len()..].chars().next();
        match next {
            Some(ch) if ch.is_whitespace() || ch == '>' || ch == '/' => return Some(idx),
            _ => {
                search = idx + needle.len();
            }
        }
    }
    None
}

pub(super) fn starts_with_tag_at(xml: &str, from: usize, tag_name: &str) -> bool {
    if from >= xml.len() {
        return false;
    }
    let tail = &xml[from..];
    let needle = format!("<{tag_name}");
    let Some(rest) = tail.strip_prefix(&needle) else {
        return false;
    };
    match rest.chars().next() {
        Some(ch) => ch.is_whitespace() || ch == '>' || ch == '/',
        None => true,
    }
}

pub(super) fn extract_attr(tag: &str, attr: &str) -> Option<String> {
    let needle = format!("{attr}=\"");
    let start = tag.find(&needle)? + needle.len();
    let rest = &tag[start..];
    let end = rest.find('"')?;
    Some(rest[..end].to_string())
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
