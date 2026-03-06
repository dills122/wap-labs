use crate::runtime::card::Card;
use crate::runtime::deck::Deck;

mod actions;
mod nodes;
mod xml;

use actions::parse_card_actions;
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

#[cfg(test)]
use actions::{
    parse_do_accept_action, parse_first_task_action, parse_onevent_action, parse_timer_value_ds,
};
#[cfg(test)]
use nodes::{parse_card_nodes, parse_inline_nodes};
#[cfg(test)]
use xml::extract_wml_body;

pub fn parse_wml(xml: &str) -> Result<Deck, String> {
    let root = parse_xml_root(xml).map_err(map_xml_parse_error)?;
    if root.name != "wml" {
        return Err("Missing required <wml> root element".to_string());
    }

    let mut cards = Vec::new();
    let mut budget = ParseBudget::default();
    for node in &root.children {
        let XmlNode::Element(card) = node else {
            continue;
        };
        if card.name != "card" {
            continue;
        }

        let id = card
            .attr("id")
            .map(str::to_string)
            .unwrap_or_else(|| format!("card-{}", cards.len() + 1));
        let (
            accept_action,
            onenterforward_action,
            onenterbackward_action,
            ontimer_action,
            timer_value_ds,
        ) = parse_card_actions(card, &mut budget)?;
        let nodes = parse_card_nodes_xml(card, &mut budget)?;
        cards.push(Card {
            id,
            nodes,
            accept_action,
            onenterforward_action,
            onenterbackward_action,
            ontimer_action,
            timer_value_ds,
        });
    }

    if cards.is_empty() {
        return Err("No <card> elements found".to_string());
    }

    Ok(Deck::new(cards))
}

fn map_xml_parse_error(err: String) -> String {
    if err.contains("expected `</card>`") {
        return "Missing closing </card> tag".to_string();
    }
    err
}

#[cfg(test)]
mod tests;
