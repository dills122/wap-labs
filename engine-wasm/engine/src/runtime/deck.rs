use crate::runtime::card::{Card, CardEventBinding, CardEventBindingIdentity, CardTaskAction};
use std::collections::{HashMap, HashSet};

/// Deck-level access control from a WML `<head><access domain=".." path=".."/></head>`
/// element (WML-C-21, section 11.3.1). Values are stored exactly as authored, including
/// the distinction between an omitted attribute and an explicitly empty CDATA value.
/// Resolving defaults and enforcing the referring-URI policy remain the separate R0-07
/// host-boundary slice.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DeckAccessControl {
    pub domain: Option<String>,
    pub path: Option<String>,
}

/// The mutually exclusive property-name forms accepted by WML `<meta>`.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DeckMetaProperty {
    Name(String),
    HttpEquiv(String),
}

/// Ordered deck metadata retained from `<head><meta .../></head>`.
///
/// WML 1.3 does not define property interpretation. The engine therefore preserves the
/// authored semantic fields without applying header or application-specific side effects.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DeckMeta {
    pub property: DeckMetaProperty,
    pub content: String,
    pub for_user_agent: bool,
    pub scheme: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Deck {
    pub cards: Vec<Card>,
    pub template_bindings: Vec<CardEventBinding>,
    pub access_control: Option<DeckAccessControl>,
    pub metadata: Vec<DeckMeta>,
    id_index: HashMap<String, usize>,
}

impl Deck {
    pub fn with_template(
        cards: Vec<Card>,
        template_bindings: Vec<CardEventBinding>,
        access_control: Option<DeckAccessControl>,
        metadata: Vec<DeckMeta>,
    ) -> Deck {
        let mut id_index = HashMap::new();
        for (idx, card) in cards.iter().enumerate() {
            // First card wins for duplicate ids to keep navigation deterministic.
            id_index.entry(card.id.clone()).or_insert(idx);
        }
        Deck {
            cards,
            template_bindings,
            access_control,
            metadata,
            id_index,
        }
    }

    pub fn card_index(&self, id: &str) -> Option<usize> {
        self.id_index.get(id).copied()
    }

    /// Resolve the active event set for one card in deterministic UI order.
    ///
    /// Card bindings retain their document order and precede unshadowed
    /// template bindings, which WML 1.3 treats as occurring at the end of the
    /// card text flow for inline presentation. A card binding shadows a
    /// template binding by identity even when the card task is `noop`; inactive
    /// `noop` bindings are never returned.
    pub fn active_event_bindings(&self, card_idx: usize) -> Vec<&CardEventBinding> {
        let Some(card) = self.cards.get(card_idx) else {
            return Vec::new();
        };
        let card_identities: HashSet<CardEventBindingIdentity> = card
            .event_bindings
            .iter()
            .map(CardEventBinding::identity)
            .collect();
        card.event_bindings
            .iter()
            .filter(|binding| !binding.is_noop())
            .chain(self.template_bindings.iter().filter(|binding| {
                !binding.is_noop() && !card_identities.contains(&binding.identity())
            }))
            .collect()
    }

    pub fn active_do_action(&self, card_idx: usize, do_type: &str) -> Option<&CardTaskAction> {
        self.active_event_bindings(card_idx)
            .into_iter()
            .find(|binding| binding.matches_do_type(do_type))
            .map(|binding| &binding.action)
    }

    pub fn active_onevent_action(
        &self,
        card_idx: usize,
        event_type: &str,
    ) -> Option<&CardTaskAction> {
        self.active_event_bindings(card_idx)
            .into_iter()
            .find(|binding| binding.matches_onevent_type(event_type))
            .map(|binding| &binding.action)
    }
}

#[cfg(test)]
mod tests {
    use super::Deck;
    use crate::runtime::card::Card;

    #[test]
    fn first_duplicate_card_id_wins_in_index() {
        let deck = Deck::with_template(
            vec![
                Card {
                    id: "dup".to_string(),
                    nodes: vec![],
                    event_bindings: vec![],
                    timer_value_ds: None,
                },
                Card {
                    id: "dup".to_string(),
                    nodes: vec![],
                    event_bindings: vec![],
                    timer_value_ds: None,
                },
            ],
            vec![],
            None,
            vec![],
        );

        assert_eq!(deck.card_index("dup"), Some(0));
    }

    #[test]
    fn card_index_returns_none_for_unknown_id() {
        let deck = Deck::with_template(
            vec![Card {
                id: "home".to_string(),
                nodes: vec![],
                event_bindings: vec![],
                timer_value_ds: None,
            }],
            vec![],
            None,
            vec![],
        );

        assert_eq!(deck.card_index("missing"), None);
    }
}
