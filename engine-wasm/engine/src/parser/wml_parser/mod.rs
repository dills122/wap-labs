use crate::runtime::card::Card;
use crate::runtime::deck::Deck;

mod actions;
mod head;
mod nodes;
mod xml;

use actions::{parse_card_bindings, parse_template_bindings};
use head::parse_deck_head;
use nodes::parse_card_nodes_xml;
use xml::{parse_xml_root, XmlNode};

const MAX_PARSE_TREE_DEPTH: usize = 128;
const MAX_PARSE_VISITED_NODES: usize = 50_000;

#[derive(Default)]
pub(super) struct ParseBudget {
    visited_nodes: usize,
}

impl ParseBudget {
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
}

pub fn parse_wml(xml: &str) -> Result<Deck, String> {
    let root = parse_xml_root(xml).map_err(map_xml_parse_error)?;
    if root.name != "wml" {
        return Err("Missing required <wml> root element".to_string());
    }

    let mut cards = Vec::new();
    let mut template_bindings = Vec::new();
    let mut access_control = None;
    let mut metadata = Vec::new();
    let mut seen_head = false;
    let mut seen_template = false;
    let mut seen_card = false;
    let mut budget = ParseBudget::default();
    for node in &root.children {
        let element = match node {
            XmlNode::Text(text) if text.trim().is_empty() => continue,
            XmlNode::Text(_) => {
                return Err("Invalid <wml>: text content is not allowed".to_string())
            }
            XmlNode::Element(element) => element,
        };
        if element.name == "head" {
            if seen_head {
                return Err("Invalid <wml>: only one <head> element is allowed".to_string());
            }
            if seen_card {
                return Err(
                    "Invalid <wml>: <head> must precede <template> and all <card> elements"
                        .to_string(),
                );
            }
            if seen_template {
                return Err("Invalid <wml>: <head> must precede <template>".to_string());
            }
            seen_head = true;
            let parsed_head = parse_deck_head(element)?;
            access_control = parsed_head.access_control;
            metadata = parsed_head.metadata;
            continue;
        }
        if element.name == "template" {
            if seen_template {
                return Err("Invalid <wml>: only one <template> element is allowed".to_string());
            }
            if seen_card {
                return Err(
                    "Invalid <wml>: <template> must precede all <card> elements".to_string()
                );
            }
            seen_template = true;
            template_bindings = parse_template_bindings(element, &mut budget)?;
            continue;
        }
        if element.name != "card" {
            // WML-C-17 requires forward-compatible handling of unknown markup.
            // Unknown deck-level elements do not participate in the recognized
            // `head?, template?, card+` ordering model.
            continue;
        }
        seen_card = true;
        let card = element;

        let id = card
            .attr("id")
            .map(str::to_string)
            .unwrap_or_else(|| format!("card-{}", cards.len() + 1));
        let (event_bindings, timer_value_ds) = parse_card_bindings(card, &mut budget)?;
        let nodes = parse_card_nodes_xml(card, &mut budget)?;
        cards.push(Card {
            id,
            nodes,
            event_bindings,
            timer_value_ds,
        });
    }

    if cards.is_empty() {
        return Err("No <card> elements found".to_string());
    }

    Ok(Deck::with_template(
        cards,
        template_bindings,
        access_control,
        metadata,
    ))
}

fn map_xml_parse_error(err: String) -> String {
    if err.contains("expected `</card>`") {
        return "Missing closing </card> tag".to_string();
    }
    err
}

#[cfg(test)]
mod tests;
