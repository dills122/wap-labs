use crate::runtime::deck::{DeckAccessControl, DeckMeta, DeckMetaProperty};

use super::nodes::{validate_allowed_attributes, validate_optional_enum};
use super::xml::{XmlElement, XmlNode};

#[derive(Debug, PartialEq, Eq)]
pub(super) struct ParsedDeckHead {
    pub(super) access_control: Option<DeckAccessControl>,
    pub(super) metadata: Vec<DeckMeta>,
}

/// Parse and validate WML 1.3's `head = (access | meta)+` content model.
pub(super) fn parse_deck_head(head: &XmlElement) -> Result<ParsedDeckHead, String> {
    validate_allowed_attributes(head, &["class", "id"])?;
    let mut access_control = None;
    let mut metadata = Vec::new();
    let mut recognized_child_count = 0usize;

    for child in &head.children {
        let element = match child {
            XmlNode::Text(text) if text.trim().is_empty() => continue,
            XmlNode::Text(_) => {
                return Err("Invalid <head>: text content is not allowed".to_string())
            }
            XmlNode::Element(element) => element,
        };
        match element.name.as_str() {
            "access" => {
                recognized_child_count += 1;
                if access_control.is_some() {
                    return Err(
                        "Malformed WML deck: <head> must not contain more than one <access> element"
                            .to_string(),
                    );
                }
                access_control = Some(parse_access(element)?);
            }
            "meta" => {
                recognized_child_count += 1;
                metadata.push(parse_meta(element)?);
            }
            // WML-C-17 requires unknown markup to be ignored. It does not
            // satisfy the recognized `(access | meta)+` head content model.
            _ => {}
        }
    }

    if recognized_child_count == 0 {
        return Err(
            "Invalid <head>: expected at least one <access> or <meta> child element".to_string(),
        );
    }

    Ok(ParsedDeckHead {
        access_control,
        metadata,
    })
}

fn parse_access(element: &XmlElement) -> Result<DeckAccessControl, String> {
    validate_allowed_attributes(element, &["class", "domain", "id", "path"])?;
    if !element.children.is_empty() {
        return Err("Invalid <access>: <access> element must be empty".to_string());
    }
    Ok(DeckAccessControl {
        domain: element.attr("domain").map(str::to_string),
        path: element.attr("path").map(str::to_string),
    })
}

fn parse_meta(element: &XmlElement) -> Result<DeckMeta, String> {
    validate_allowed_attributes(
        element,
        &[
            "class",
            "content",
            "forua",
            "http-equiv",
            "id",
            "name",
            "scheme",
        ],
    )?;
    if !element.children.is_empty() {
        return Err("Invalid <meta>: <meta> element must be empty".to_string());
    }

    let property = match (element.attr("name"), element.attr("http-equiv")) {
        (Some(name), None) => DeckMetaProperty::Name(name.to_string()),
        (None, Some(http_equiv)) => DeckMetaProperty::HttpEquiv(http_equiv.to_string()),
        _ => {
            return Err(
                "Invalid <meta>: expected exactly one of 'name' or 'http-equiv'".to_string(),
            )
        }
    };
    let content = element
        .attr("content")
        .ok_or_else(|| "Invalid <meta>: missing required 'content' attribute".to_string())?;
    validate_optional_enum(element, "forua", &["true", "false"])?;

    Ok(DeckMeta {
        property,
        content: content.to_string(),
        for_user_agent: element.attr("forua") == Some("true"),
        scheme: element.attr("scheme").map(str::to_string),
    })
}

#[cfg(test)]
mod tests {
    use super::parse_deck_head;
    use crate::parser::wml_parser::xml::parse_xml_root;

    fn head_element(wml: &str) -> super::XmlElement {
        let root = parse_xml_root(wml).expect("wml should parse");
        root.children
            .into_iter()
            .find_map(|node| match node {
                super::XmlNode::Element(element) if element.name == "head" => Some(element),
                _ => None,
            })
            .expect("wml should contain a <head> element")
    }

    #[test]
    fn parses_domain_and_path_from_access_element() {
        let head = head_element(
            r#"<wml><head><access domain="wapforum.org" path="/cbb"/></head><card id="c"><p>x</p></card></wml>"#,
        );

        let access_control = parse_deck_head(&head)
            .expect("head should parse")
            .access_control
            .expect("access control should be present");

        assert_eq!(access_control.domain.as_deref(), Some("wapforum.org"));
        assert_eq!(access_control.path.as_deref(), Some("/cbb"));
    }

    #[test]
    fn missing_access_element_yields_no_access_control() {
        let head = head_element(
            r#"<wml><head><meta name="x" content="y"/></head><card id="c"><p>x</p></card></wml>"#,
        );

        let parsed = parse_deck_head(&head).expect("should parse");
        assert_eq!(parsed.access_control, None);
        assert_eq!(parsed.metadata.len(), 1);
    }

    #[test]
    fn empty_domain_and_path_attributes_are_preserved_as_authored() {
        let head = head_element(
            r#"<wml><head><access domain="" path=""/></head><card id="c"><p>x</p></card></wml>"#,
        );

        let access_control = parse_deck_head(&head)
            .expect("head should parse")
            .access_control
            .expect("access control should be present");

        assert_eq!(access_control.domain.as_deref(), Some(""));
        assert_eq!(access_control.path.as_deref(), Some(""));
    }

    #[test]
    fn more_than_one_access_element_is_a_parse_error() {
        let head = head_element(
            r#"<wml><head><access domain="a.com"/><access domain="b.com"/></head><card id="c"><p>x</p></card></wml>"#,
        );

        let err = parse_deck_head(&head).expect_err("duplicate access should error");
        assert!(err.contains("more than one <access>"));
    }
}
