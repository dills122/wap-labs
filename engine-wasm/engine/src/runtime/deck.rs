use crate::runtime::card::Card;
use std::collections::HashMap;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Deck {
    pub cards: Vec<Card>,
    id_index: HashMap<String, usize>,
}

impl Deck {
    pub fn new(cards: Vec<Card>) -> Deck {
        let mut id_index = HashMap::new();
        for (idx, card) in cards.iter().enumerate() {
            // First card wins for duplicate ids to keep navigation deterministic.
            id_index.entry(card.id.clone()).or_insert(idx);
        }
        Deck { cards, id_index }
    }

    pub fn card_index(&self, id: &str) -> Option<usize> {
        self.id_index.get(id).copied()
    }
}

#[cfg(test)]
mod tests {
    use super::Deck;
    use crate::runtime::card::Card;

    #[test]
    fn first_duplicate_card_id_wins_in_index() {
        let deck = Deck::new(vec![
            Card {
                id: "dup".to_string(),
                nodes: vec![],
                accept_action_href: None,
                onenterforward_href: None,
                onenterbackward_href: None,
            },
            Card {
                id: "dup".to_string(),
                nodes: vec![],
                accept_action_href: None,
                onenterforward_href: None,
                onenterbackward_href: None,
            },
        ]);

        assert_eq!(deck.card_index("dup"), Some(0));
    }

    #[test]
    fn card_index_returns_none_for_unknown_id() {
        let deck = Deck::new(vec![Card {
            id: "home".to_string(),
            nodes: vec![],
            accept_action_href: None,
            onenterforward_href: None,
            onenterbackward_href: None,
        }]);

        assert_eq!(deck.card_index("missing"), None);
    }
}
