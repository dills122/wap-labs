use std::collections::HashSet;

use crate::runtime::variable::{validate as validate_vdata, validate_literal_only};

use super::nodes::{is_decimal_number, is_xml_name, validate_nmtoken};
use super::xml::{XmlElement, XmlNode};

/// Validate the complete element/attribute grammar declared by the selected
/// WML 1.3 DTD. Alternate DTDs intentionally bypass this validator and retain
/// the forward-compatible WML-C-17 path in the semantic parser.
pub(super) fn validate_wml13_document(root: &XmlElement) -> Result<(), String> {
    let mut ids = HashSet::new();
    validate_element(root, &mut ids, 0)
}

fn validate_element(
    element: &XmlElement,
    ids: &mut HashSet<String>,
    table_depth: usize,
) -> Result<(), String> {
    if element.name == "table" && table_depth > 0 {
        return Err("Invalid <table>: nested tables are prohibited by WML 1.3".to_string());
    }
    validate_attributes(element, ids)?;
    validate_content_model(element)?;
    for child in &element.children {
        if let XmlNode::Text(text) = child {
            validate_vdata(text).map_err(|error| {
                format!(
                    "Invalid <{}>: text contains an invalid variable reference: {error}",
                    element.name
                )
            })?;
        }
    }
    let child_table_depth = table_depth + usize::from(element.name == "table");
    for child in &element.children {
        if let XmlNode::Element(child) = child {
            validate_element(child, ids, child_table_depth)?;
        }
    }
    Ok(())
}

fn validate_attributes(element: &XmlElement, ids: &mut HashSet<String>) -> Result<(), String> {
    let specific = specific_attributes(&element.name)
        .ok_or_else(|| format!("Invalid WML 1.3 DTD: undeclared element <{}>", element.name))?;
    let mut unexpected = element
        .attrs
        .keys()
        .filter(|name| {
            !matches!(name.as_str(), "id" | "class") && !specific.contains(&name.as_str())
        })
        .collect::<Vec<_>>();
    unexpected.sort();
    if let Some(name) = unexpected.first() {
        return Err(format!(
            "Invalid <{}>: unexpected attribute '{}' for WML 1.3 DTD",
            element.name, name
        ));
    }

    if let Some(id) = element.attr("id") {
        if !is_xml_name(id) {
            return Err(format!(
                "Invalid <{}>: attribute 'id' must be an XML Name",
                element.name
            ));
        }
        if !ids.insert(id.to_string()) {
            return Err(format!("Invalid WML 1.3 DTD: duplicate ID '{id}'"));
        }
    }
    if let Some(class) = element.attr("class") {
        validate_literal_only(class).map_err(|error| {
            format!(
                "Invalid <{}>: attribute 'class' contains an invalid variable reference: {error}",
                element.name
            )
        })?;
    }

    match element.name.as_str() {
        "wml" => nmtokens(element, &["xml:lang"]),
        "card" => {
            vdata(
                element,
                &["title", "onenterforward", "onenterbackward", "ontimer"],
            )?;
            enums(
                element,
                &[
                    ("newcontext", &["true", "false"]),
                    ("ordered", &["true", "false"]),
                ],
            )?;
            nmtokens(element, &["xml:lang"])
        }
        "do" => {
            required(element, &["type"])?;
            literal(element, &["type"])?;
            vdata(element, &["label"])?;
            nmtokens(element, &["name", "xml:lang"])?;
            enums(element, &[("optional", &["true", "false"])])
        }
        "onevent" => {
            required(element, &["type"])?;
            literal(element, &["type"])
        }
        "template" => vdata(element, &["onenterforward", "onenterbackward", "ontimer"]),
        "access" => literal(element, &["domain", "path"]),
        "head" | "tr" | "br" | "noop" => Ok(()),
        "meta" => {
            required(element, &["content"])?;
            literal(element, &["http-equiv", "name", "content", "scheme"])?;
            enums(element, &[("forua", &["true", "false"])])
        }
        "go" => {
            required(element, &["href"])?;
            vdata(element, &["href", "enctype"])?;
            literal(element, &["accept-charset"])?;
            enums(
                element,
                &[
                    ("sendreferer", &["true", "false"]),
                    ("method", &["post", "get"]),
                    ("cache-control", &["no-cache"]),
                ],
            )?;
            validate_go_method_enctype(element)
        }
        "prev" | "refresh" => Ok(()),
        "postfield" | "setvar" => {
            required(element, &["name", "value"])?;
            vdata(element, &["name", "value"])
        }
        "select" => {
            vdata(element, &["title", "value", "ivalue"])?;
            nmtokens(element, &["name", "iname", "xml:lang"])?;
            numbers(element, &["tabindex"])?;
            enums(element, &[("multiple", &["true", "false"])])
        }
        "optgroup" => {
            vdata(element, &["title"])?;
            nmtokens(element, &["xml:lang"])
        }
        "option" => {
            vdata(element, &["value", "title", "onpick"])?;
            nmtokens(element, &["xml:lang"])
        }
        "input" => {
            required(element, &["name"])?;
            nmtokens(element, &["name", "xml:lang"])?;
            vdata(element, &["value", "title", "accesskey"])?;
            literal(element, &["format"])?;
            numbers(element, &["size", "maxlength", "tabindex"])?;
            enums(
                element,
                &[
                    ("type", &["text", "password"]),
                    ("emptyok", &["true", "false"]),
                ],
            )
        }
        "fieldset" => {
            vdata(element, &["title"])?;
            nmtokens(element, &["xml:lang"])
        }
        "timer" => {
            required(element, &["value"])?;
            vdata(element, &["value"])?;
            nmtokens(element, &["name"])
        }
        "img" => {
            required(element, &["alt", "src"])?;
            vdata(element, &["alt", "src", "localsrc"])?;
            lengths(element, &["vspace", "hspace", "height", "width"])?;
            nmtokens(element, &["xml:lang"])?;
            enums(element, &[("align", &["top", "middle", "bottom"])])
        }
        "anchor" => {
            vdata(element, &["title", "accesskey"])?;
            nmtokens(element, &["xml:lang"])
        }
        "a" => {
            required(element, &["href"])?;
            vdata(element, &["href", "title", "accesskey"])?;
            nmtokens(element, &["xml:lang"])
        }
        "table" => {
            required(element, &["columns"])?;
            vdata(element, &["title"])?;
            numbers(element, &["columns"])?;
            if element.attr("columns") == Some("0") {
                return Err("Invalid <table>: attribute 'columns' must not be zero".to_string());
            }
            literal(element, &["align"])?;
            nmtokens(element, &["xml:lang"])
        }
        "td" | "em" | "strong" | "i" | "b" | "u" | "big" | "small" => {
            nmtokens(element, &["xml:lang"])
        }
        "p" => {
            nmtokens(element, &["xml:lang"])?;
            enums(
                element,
                &[
                    ("align", &["left", "right", "center"]),
                    ("mode", &["wrap", "nowrap"]),
                ],
            )
        }
        "pre" => enums(element, &[("xml:space", &["preserve"])]),
        _ => unreachable!("specific_attributes rejects undeclared elements"),
    }
}

fn specific_attributes(name: &str) -> Option<&'static [&'static str]> {
    Some(match name {
        "wml" => &["xml:lang"],
        "card" => &[
            "title",
            "newcontext",
            "ordered",
            "xml:lang",
            "onenterforward",
            "onenterbackward",
            "ontimer",
        ],
        "do" => &["type", "label", "name", "optional", "xml:lang"],
        "onevent" => &["type"],
        "head" => &[],
        "template" => &["onenterforward", "onenterbackward", "ontimer"],
        "access" => &["domain", "path"],
        "meta" => &["http-equiv", "name", "forua", "content", "scheme"],
        "go" => &[
            "href",
            "sendreferer",
            "method",
            "enctype",
            "cache-control",
            "accept-charset",
        ],
        "prev" | "refresh" | "noop" => &[],
        "postfield" | "setvar" => &["name", "value"],
        "select" => &[
            "title", "name", "value", "iname", "ivalue", "multiple", "tabindex", "xml:lang",
        ],
        "optgroup" => &["title", "xml:lang"],
        "option" => &["value", "title", "onpick", "xml:lang"],
        "input" => &[
            "name",
            "type",
            "value",
            "format",
            "emptyok",
            "size",
            "maxlength",
            "tabindex",
            "title",
            "accesskey",
            "xml:lang",
        ],
        "fieldset" => &["title", "xml:lang"],
        "timer" => &["name", "value"],
        "img" => &[
            "alt", "src", "localsrc", "vspace", "hspace", "align", "height", "width", "xml:lang",
        ],
        "anchor" => &["title", "accesskey", "xml:lang"],
        "a" => &["href", "title", "accesskey", "xml:lang"],
        "table" => &["title", "align", "columns", "xml:lang"],
        "tr" | "br" => &[],
        "td" | "em" | "strong" | "i" | "b" | "u" | "big" | "small" => &["xml:lang"],
        "p" => &["align", "mode", "xml:lang"],
        "pre" => &["xml:space"],
        _ => return None,
    })
}

fn required(element: &XmlElement, names: &[&str]) -> Result<(), String> {
    for name in names {
        if element.attr(name).is_none() {
            return Err(format!(
                "Invalid <{}>: missing required '{}' attribute",
                element.name, name
            ));
        }
    }
    Ok(())
}

fn vdata(element: &XmlElement, names: &[&str]) -> Result<(), String> {
    for name in names {
        if let Some(value) = element.attr(name) {
            validate_vdata(value).map_err(|error| {
                format!(
                    "Invalid <{}>: attribute '{}' contains an invalid variable reference: {error}",
                    element.name, name
                )
            })?;
        }
    }
    Ok(())
}

fn literal(element: &XmlElement, names: &[&str]) -> Result<(), String> {
    for name in names {
        if let Some(value) = element.attr(name) {
            validate_literal_only(value).map_err(|error| {
                format!(
                    "Invalid <{}>: attribute '{}' contains an invalid variable reference: {error}",
                    element.name, name
                )
            })?;
        }
    }
    Ok(())
}

fn nmtokens(element: &XmlElement, names: &[&str]) -> Result<(), String> {
    for name in names {
        if let Some(value) = element.attr(name) {
            validate_nmtoken(&element.name, name, value)?;
        }
    }
    Ok(())
}

fn numbers(element: &XmlElement, names: &[&str]) -> Result<(), String> {
    for name in names {
        if let Some(value) = element.attr(name) {
            if !is_decimal_number(value) {
                return Err(format!(
                    "Invalid <{}>: attribute '{}' must contain decimal digits",
                    element.name, name
                ));
            }
        }
    }
    Ok(())
}

fn lengths(element: &XmlElement, names: &[&str]) -> Result<(), String> {
    for name in names {
        if let Some(value) = element.attr(name) {
            let magnitude = value.strip_suffix('%').unwrap_or(value);
            if !is_decimal_number(magnitude) {
                return Err(format!(
                    "Invalid <{}>: attribute '{}' must be decimal digits with an optional percent suffix",
                    element.name, name
                ));
            }
        }
    }
    Ok(())
}

fn validate_go_method_enctype(element: &XmlElement) -> Result<(), String> {
    let method = element.attr("method").unwrap_or("get");
    if method == "get" && element.attr("enctype") == Some("multipart/form-data") {
        return Err(
            "Invalid <go>: method 'get' cannot use enctype 'multipart/form-data'".to_string(),
        );
    }
    Ok(())
}

fn enums(element: &XmlElement, rules: &[(&str, &[&str])]) -> Result<(), String> {
    for (name, allowed) in rules {
        if let Some(value) = element.attr(name) {
            if !allowed.contains(&value) {
                let expected = allowed
                    .iter()
                    .map(|value| format!("'{value}'"))
                    .collect::<Vec<_>>()
                    .join(" or ");
                return Err(format!(
                    "Invalid <{}>: attribute '{}' must be {expected}",
                    element.name, name
                ));
            }
        }
    }
    Ok(())
}

fn validate_content_model(element: &XmlElement) -> Result<(), String> {
    match element.name.as_str() {
        "wml" => validate_wml_children(element),
        "card" => validate_card_children(element),
        "do" | "onevent" => exactly_one_element(element, &["go", "prev", "noop", "refresh"]),
        "head" => allowed_children(element, &["access", "meta"], false, 1),
        "template" => allowed_children(element, &["do", "onevent"], false, 0),
        "access" | "meta" | "noop" | "postfield" | "setvar" | "input" | "timer" | "img" | "br" => {
            empty(element)
        }
        "go" => allowed_children(element, &["postfield", "setvar"], false, 0),
        "prev" | "refresh" => allowed_children(element, &["setvar"], false, 0),
        "select" | "optgroup" => allowed_children(element, &["optgroup", "option"], false, 1),
        "option" => allowed_children(element, &["onevent"], true, 0),
        "fieldset" | "p" => allowed_children(element, field_children(), true, 0),
        "anchor" => validate_anchor_children(element),
        "a" => allowed_children(element, &["br", "img"], true, 0),
        "table" => allowed_children(element, &["tr"], false, 1),
        "tr" => allowed_children(element, &["td"], false, 1),
        "td" => allowed_children(
            element,
            &[
                "em", "strong", "b", "i", "u", "big", "small", "br", "img", "anchor", "a",
            ],
            true,
            0,
        ),
        "em" | "strong" | "b" | "i" | "u" | "big" | "small" => {
            allowed_children(element, flow_children(), true, 0)
        }
        "pre" => allowed_children(
            element,
            &[
                "a", "anchor", "do", "u", "br", "i", "b", "em", "strong", "input", "select",
            ],
            true,
            0,
        ),
        _ => Ok(()),
    }
}

fn validate_anchor_children(element: &XmlElement) -> Result<(), String> {
    allowed_children(element, &["br", "img", "go", "prev", "refresh"], true, 0)?;
    let task_count = element
        .children
        .iter()
        .filter(|child| {
            matches!(
                child,
                XmlNode::Element(child)
                    if matches!(child.name.as_str(), "go" | "prev" | "refresh")
            )
        })
        .count();
    if task_count != 1 {
        return Err("Invalid <anchor>: expected exactly one go, prev, or refresh task".to_string());
    }
    Ok(())
}

fn validate_wml_children(element: &XmlElement) -> Result<(), String> {
    let names = significant_child_names(element)?;
    let mut index = 0;
    if names.get(index) == Some(&"head") {
        index += 1;
    }
    if names.get(index) == Some(&"template") {
        index += 1;
    }
    if names[index..].is_empty() || names[index..].iter().any(|name| *name != "card") {
        return Err("Invalid <wml>: expected head?, template?, card+ in that order".to_string());
    }
    Ok(())
}

fn validate_card_children(element: &XmlElement) -> Result<(), String> {
    let names = significant_child_names(element)?;
    let mut index = 0;
    while names.get(index) == Some(&"onevent") {
        index += 1;
    }
    if names.get(index) == Some(&"timer") {
        index += 1;
    }
    if names[index..]
        .iter()
        .any(|name| !matches!(*name, "do" | "p" | "pre"))
    {
        return Err(
            "Invalid <card>: expected onevent*, timer?, then zero or more do, p, or pre elements"
                .to_string(),
        );
    }
    Ok(())
}

fn exactly_one_element(element: &XmlElement, allowed: &[&str]) -> Result<(), String> {
    let names = significant_child_names(element)?;
    if names.len() != 1 || !allowed.contains(&names[0]) {
        return Err(format!(
            "Invalid <{}>: expected exactly one go, prev, noop, or refresh task",
            element.name
        ));
    }
    Ok(())
}

fn allowed_children(
    element: &XmlElement,
    allowed: &[&str],
    allow_text: bool,
    minimum_elements: usize,
) -> Result<(), String> {
    let mut elements = 0usize;
    for child in &element.children {
        match child {
            XmlNode::Text(text) if allow_text || text.trim().is_empty() => {}
            XmlNode::Text(_) => {
                return Err(format!(
                    "Invalid <{}>: text content is not allowed by the WML 1.3 DTD",
                    element.name
                ))
            }
            XmlNode::Element(child) if allowed.contains(&child.name.as_str()) => {
                elements = elements.saturating_add(1);
            }
            XmlNode::Element(child) => {
                return Err(format!(
                    "Invalid <{}>: unexpected child <{}> for WML 1.3 DTD",
                    element.name, child.name
                ))
            }
        }
    }
    if elements < minimum_elements {
        return Err(format!(
            "Invalid <{}>: expected at least {minimum_elements} declared child element(s)",
            element.name
        ));
    }
    Ok(())
}

fn significant_child_names(element: &XmlElement) -> Result<Vec<&str>, String> {
    let mut names = Vec::new();
    for child in &element.children {
        match child {
            XmlNode::Text(text) if text.trim().is_empty() => {}
            XmlNode::Text(_) => {
                return Err(format!(
                    "Invalid <{}>: text content is not allowed by the WML 1.3 DTD",
                    element.name
                ))
            }
            XmlNode::Element(child) => names.push(child.name.as_str()),
        }
    }
    Ok(names)
}

fn empty(element: &XmlElement) -> Result<(), String> {
    if element.children.is_empty() {
        Ok(())
    } else {
        Err(format!(
            "Invalid <{}>: element must be EMPTY under the WML 1.3 DTD",
            element.name
        ))
    }
}

fn flow_children() -> &'static [&'static str] {
    &[
        "em", "strong", "b", "i", "u", "big", "small", "br", "img", "anchor", "a", "table",
    ]
}

fn field_children() -> &'static [&'static str] {
    &[
        "em", "strong", "b", "i", "u", "big", "small", "br", "img", "anchor", "a", "table",
        "input", "select", "fieldset", "do",
    ]
}
