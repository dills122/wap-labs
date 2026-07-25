use crate::runtime::card::Card;
use crate::runtime::deck::Deck;
use crate::WmlLoadDiagnostic;

mod actions;
mod head;
mod nodes;
mod xml;

use actions::{parse_card_bindings, parse_template_bindings};
use head::parse_deck_head;
use nodes::parse_card_nodes_xml;
#[cfg(test)]
use xml::parse_xml_root;
use xml::{parse_xml_document, WmlDocumentType, XmlNode};

const MAX_PARSE_TREE_DEPTH: usize = 128;
const MAX_PARSE_VISITED_NODES: usize = 50_000;

pub(super) struct ParseBudget {
    visited_nodes: usize,
    alternate_dtd: bool,
    diagnostics: Vec<WmlLoadDiagnostic>,
}

impl ParseBudget {
    fn new(document_type: Option<WmlDocumentType>) -> Self {
        Self {
            visited_nodes: 0,
            alternate_dtd: document_type == Some(WmlDocumentType::Alternate),
            diagnostics: Vec::new(),
        }
    }

    pub(super) fn enter_scope(&self, depth: usize, context: &str) -> Result<(), String> {
        if depth > MAX_PARSE_TREE_DEPTH {
            return Err(format!(
                "Parse limit exceeded: nesting depth in {context} (max {MAX_PARSE_TREE_DEPTH})"
            ));
        }
        Ok(())
    }

    pub(super) fn visit_node(&mut self, context: &str) -> Result<(), String> {
        self.visited_nodes = self.visited_nodes.saturating_add(1);
        if self.visited_nodes > MAX_PARSE_VISITED_NODES {
            return Err(format!(
                "Parse limit exceeded: node budget in {context} (max {MAX_PARSE_VISITED_NODES})"
            ));
        }
        Ok(())
    }

    pub(super) fn note_alternate_dtd_unknown(&mut self, element_name: &str) {
        if self.alternate_dtd && !is_known_wml_element(element_name) {
            self.diagnostics.push(WmlLoadDiagnostic::unsupported(format!(
                "Unsupported alternate-DTD element <{element_name}> was ignored while preserving recognized content"
            )));
        }
    }

    pub(super) fn note_recoverable(&mut self, message: impl Into<String>) {
        self.diagnostics
            .push(WmlLoadDiagnostic::recoverable(message));
    }
}

fn is_known_wml_element(name: &str) -> bool {
    matches!(
        name,
        "wml"
            | "head"
            | "access"
            | "meta"
            | "template"
            | "card"
            | "do"
            | "onevent"
            | "go"
            | "prev"
            | "refresh"
            | "noop"
            | "timer"
            | "postfield"
            | "setvar"
            | "p"
            | "br"
            | "a"
            | "anchor"
            | "input"
            | "select"
            | "option"
            | "optgroup"
            | "fieldset"
            | "b"
            | "big"
            | "em"
            | "i"
            | "small"
            | "strong"
            | "u"
            | "img"
            | "table"
            | "tr"
            | "td"
            | "pre"
    )
}

pub(crate) struct ParsedWml {
    pub(crate) deck: Deck,
    pub(crate) diagnostics: Vec<WmlLoadDiagnostic>,
}

#[cfg(test)]
pub fn parse_wml(xml: &str) -> Result<Deck, String> {
    parse_wml_report(xml)
        .map(|parsed| parsed.deck)
        .map_err(|diagnostic| diagnostic.message)
}

pub(crate) fn parse_wml_report(xml: &str) -> Result<ParsedWml, WmlLoadDiagnostic> {
    let document = parse_xml_document(xml)?;
    let root = document.root;
    if root.name != "wml" {
        return Err(WmlLoadDiagnostic::invalid(
            "Missing required <wml> root element",
        ));
    }

    let mut cards = Vec::new();
    let mut template_bindings = Vec::new();
    let mut access_control = None;
    let mut metadata = Vec::new();
    let mut seen_head = false;
    let mut seen_template = false;
    let mut seen_card = false;
    let mut budget = ParseBudget::new(document.document_type);
    for node in &root.children {
        let element = match node {
            XmlNode::Text(text) if text.trim().is_empty() => continue,
            XmlNode::Text(_) => {
                return Err(WmlLoadDiagnostic::invalid(
                    "Invalid <wml>: text content is not allowed",
                ))
            }
            XmlNode::Element(element) => element,
        };
        if element.name == "head" {
            if seen_head {
                return Err(WmlLoadDiagnostic::invalid(
                    "Invalid <wml>: only one <head> element is allowed",
                ));
            }
            if seen_card {
                return Err(WmlLoadDiagnostic::invalid(
                    "Invalid <wml>: <head> must precede <template> and all <card> elements",
                ));
            }
            if seen_template {
                return Err(WmlLoadDiagnostic::invalid(
                    "Invalid <wml>: <head> must precede <template>",
                ));
            }
            seen_head = true;
            let parsed_head = parse_deck_head(element).map_err(WmlLoadDiagnostic::invalid)?;
            access_control = parsed_head.access_control;
            metadata = parsed_head.metadata;
            continue;
        }
        if element.name == "template" {
            if seen_template {
                return Err(WmlLoadDiagnostic::invalid(
                    "Invalid <wml>: only one <template> element is allowed",
                ));
            }
            if seen_card {
                return Err(WmlLoadDiagnostic::invalid(
                    "Invalid <wml>: <template> must precede all <card> elements",
                ));
            }
            seen_template = true;
            template_bindings = parse_template_bindings(element, &mut budget)
                .map_err(WmlLoadDiagnostic::invalid)?;
            continue;
        }
        if element.name != "card" {
            // WML-C-17 requires forward-compatible handling of unknown markup.
            // Unknown deck-level elements do not participate in the recognized
            // `head?, template?, card+` ordering model.
            budget.note_alternate_dtd_unknown(&element.name);
            continue;
        }
        seen_card = true;
        let card = element;

        let id = card
            .attr("id")
            .map(str::to_string)
            .unwrap_or_else(|| format!("card-{}", cards.len() + 1));
        let (event_bindings, timer_value_ds) =
            parse_card_bindings(card, &mut budget).map_err(WmlLoadDiagnostic::invalid)?;
        let nodes = parse_card_nodes_xml(card, &mut budget).map_err(WmlLoadDiagnostic::invalid)?;
        cards.push(Card {
            id,
            nodes,
            event_bindings,
            timer_value_ds,
        });
    }

    if cards.is_empty() {
        return Err(WmlLoadDiagnostic::invalid("No <card> elements found"));
    }

    Ok(ParsedWml {
        deck: Deck::with_template(cards, template_bindings, access_control, metadata),
        diagnostics: budget.diagnostics,
    })
}

#[cfg(test)]
mod tests;
