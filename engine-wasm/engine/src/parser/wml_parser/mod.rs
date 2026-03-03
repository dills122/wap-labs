use crate::runtime::card::Card;
use crate::runtime::deck::Deck;

mod actions;
mod nodes;
mod xml;

use actions::parse_card_actions;
use nodes::parse_card_nodes;
use xml::{extract_attr, extract_wml_body, find_tag_from};

#[cfg(test)]
use actions::{
    parse_do_accept_action, parse_first_task_action, parse_onevent_action, parse_timer_value_ds,
};
#[cfg(test)]
use nodes::parse_inline_nodes;

pub fn parse_wml(xml: &str) -> Result<Deck, String> {
    let wml_body = extract_wml_body(xml)?;
    let mut cards = Vec::new();
    let mut cursor = 0usize;

    while let Some(start) = find_tag_from(wml_body, "card", cursor) {
        let open_end = wml_body[start..]
            .find('>')
            .map(|idx| start + idx)
            .ok_or_else(|| "Malformed <card> opening tag".to_string())?;

        let open_tag = &wml_body[start..=open_end];
        let id =
            extract_attr(open_tag, "id").unwrap_or_else(|| format!("card-{}", cards.len() + 1));

        let close_start = wml_body[open_end + 1..]
            .find("</card>")
            .map(|idx| open_end + 1 + idx)
            .ok_or_else(|| format!("Missing closing </card> for card {id}"))?;

        let card_body = &wml_body[open_end + 1..close_start];
        let (
            accept_action,
            onenterforward_action,
            onenterbackward_action,
            ontimer_action,
            timer_value_ds,
        ) = parse_card_actions(card_body)?;
        let nodes = parse_card_nodes(card_body)?;
        cards.push(Card {
            id,
            nodes,
            accept_action,
            onenterforward_action,
            onenterbackward_action,
            ontimer_action,
            timer_value_ds,
        });

        cursor = close_start + "</card>".len();
    }

    if cards.is_empty() {
        return Err("No <card> elements found".to_string());
    }

    Ok(Deck::new(cards))
}

#[cfg(test)]
mod tests;
