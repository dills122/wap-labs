use crate::runtime::deck::DeckAccessControl;

use super::xml::{XmlElement, XmlNode};

/// Parses a deck's `<head>` element (WML-C-30, section 11.3) for its `<access>`
/// child (WML-C-21, section 11.3.1). `<meta>` children (WML-C-34, optional) are
/// not yet represented and are silently skipped, matching this parser's existing
/// tolerant handling of unimplemented optional elements.
///
/// Per section 11.3.1, "It is an error for a deck to contain more than one
/// access element" - that specific case is rejected. Multiple `<head>` elements
/// at the deck level are not valid per the `wml = (head?, template?, card+)`
/// content model; this parser tolerates them and honors only the first, for
/// consistency with the existing first-wins duplicate-id handling elsewhere.
pub(super) fn parse_deck_access_control(
    head: &XmlElement,
) -> Result<Option<DeckAccessControl>, String> {
    let mut access_control = None;

    for child in &head.children {
        let XmlNode::Element(element) = child else {
            continue;
        };
        if element.name != "access" {
            continue;
        }
        if access_control.is_some() {
            return Err(
                "Malformed WML deck: <head> must not contain more than one <access> element"
                    .to_string(),
            );
        }
        access_control = Some(DeckAccessControl {
            domain: element
                .attr("domain")
                .map(str::to_string)
                .filter(|value| !value.is_empty()),
            path: element
                .attr("path")
                .map(str::to_string)
                .filter(|value| !value.is_empty()),
        });
    }

    Ok(access_control)
}

#[cfg(test)]
mod tests {
    use super::parse_deck_access_control;
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

        let access_control = parse_deck_access_control(&head)
            .expect("access control should parse")
            .expect("access control should be present");

        assert_eq!(access_control.domain.as_deref(), Some("wapforum.org"));
        assert_eq!(access_control.path.as_deref(), Some("/cbb"));
    }

    #[test]
    fn missing_access_element_yields_no_access_control() {
        let head = head_element(
            r#"<wml><head><meta name="x" content="y"/></head><card id="c"><p>x</p></card></wml>"#,
        );

        assert_eq!(
            parse_deck_access_control(&head).expect("should parse"),
            None
        );
    }

    #[test]
    fn empty_domain_and_path_attributes_are_treated_as_unset() {
        let head = head_element(
            r#"<wml><head><access domain="" path=""/></head><card id="c"><p>x</p></card></wml>"#,
        );

        let access_control = parse_deck_access_control(&head)
            .expect("access control should parse")
            .expect("access control should be present");

        assert_eq!(access_control.domain, None);
        assert_eq!(access_control.path, None);
    }

    #[test]
    fn more_than_one_access_element_is_a_parse_error() {
        let head = head_element(
            r#"<wml><head><access domain="a.com"/><access domain="b.com"/></head><card id="c"><p>x</p></card></wml>"#,
        );

        let err = parse_deck_access_control(&head).expect_err("duplicate access should error");
        assert!(err.contains("more than one <access>"));
    }
}
