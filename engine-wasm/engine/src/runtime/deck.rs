use crate::runtime::card::{
    Card, CardEventBinding, CardEventBindingIdentity, CardEventBindingKind, CardTaskAction,
};
use std::collections::{HashMap, HashSet};
use url::Url;

/// Deck-level access control from a WML `<head><access domain=".." path=".."/></head>`
/// element (WML-C-21, section 11.3.1). Values are stored exactly as authored, including
/// the distinction between an omitted attribute and an explicitly empty CDATA value.
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
    pub language: Option<String>,
    pub template_bindings: Vec<CardEventBinding>,
    pub access_control: Option<DeckAccessControl>,
    pub metadata: Vec<DeckMeta>,
    id_index: HashMap<String, usize>,
}

impl Deck {
    pub fn with_template(
        cards: Vec<Card>,
        language: Option<String>,
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
            language,
            template_bindings,
            access_control,
            metadata,
            id_index,
        }
    }

    pub fn card_index(&self, id: &str) -> Option<usize> {
        self.id_index.get(id).copied()
    }

    pub fn card_language(&self, card_idx: usize) -> Option<&str> {
        self.cards
            .get(card_idx)
            .and_then(|card| card.language.as_deref())
            .or(self.language.as_deref())
    }

    /// Evaluate the WML 1.3 referring-deck access policy before a destination
    /// deck replaces the active runtime state. A missing referring URI denotes
    /// a host/user initiated context and therefore has no referring deck to
    /// restrict.
    pub fn allows_referring_uri(
        &self,
        destination_uri: &str,
        referring_uri: Option<&str>,
    ) -> Result<bool, String> {
        let Some(access) = &self.access_control else {
            return Ok(true);
        };
        let Some(referring_uri) = referring_uri.filter(|value| !value.trim().is_empty()) else {
            return Ok(true);
        };
        let destination = Url::parse(destination_uri)
            .map_err(|_| "Deck access policy requires a valid destination URI".to_string())?;
        let referring = Url::parse(referring_uri)
            .map_err(|_| "Deck access policy received an invalid referring URI".to_string())?;
        let destination_domain = destination
            .host_str()
            .ok_or_else(|| "Deck access policy requires a destination domain".to_string())?;
        let referring_domain = referring
            .host_str()
            .ok_or_else(|| "Deck access policy requires a referring domain".to_string())?;

        let allowed_domain = access.domain.as_deref().unwrap_or(destination_domain);
        let allowed_path = match access.path.as_deref() {
            None => "/".to_string(),
            Some("") => String::new(),
            Some(path) if path.starts_with('/') => path.to_string(),
            Some(path) => destination
                .join(path)
                .map_err(|_| "Deck access policy contains an invalid relative path".to_string())?
                .path()
                .to_string(),
        };

        Ok(domain_suffix_matches(referring_domain, allowed_domain)
            && path_prefix_matches(referring.path(), &allowed_path))
    }

    /// Resolve the active event set for one card in deterministic UI order.
    ///
    /// Card bindings retain their document order and precede unshadowed
    /// template bindings, which WML 1.3 treats as occurring at the end of the
    /// card text flow for inline presentation. A card binding shadows a
    /// template binding by identity even when the card task is `noop`; inactive
    /// `noop` bindings are never returned. The Class C reference profile also
    /// exercises the WML permission to omit explicitly optional `do` actions,
    /// so those bindings remain parsed but are excluded from this active set.
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
            .filter(|binding| !binding.is_noop() && !binding.is_optional_do())
            .chain(self.template_bindings.iter().filter(|binding| {
                !binding.is_noop()
                    && !binding.is_optional_do()
                    && !card_identities.contains(&binding.identity())
            }))
            .collect()
    }

    pub fn active_do_bindings(&self, card_idx: usize) -> Vec<&CardEventBinding> {
        self.active_event_bindings(card_idx)
            .into_iter()
            .filter(|binding| matches!(binding.kind, CardEventBindingKind::Do { .. }))
            .collect()
    }

    pub fn active_do_action(&self, card_idx: usize, do_type: &str) -> Option<&CardTaskAction> {
        self.active_do_bindings(card_idx)
            .into_iter()
            .find(|binding| binding.matches_do_type(do_type))
            .map(|binding| &binding.action)
    }

    #[cfg(test)]
    pub fn active_do_action_by_name(&self, card_idx: usize, name: &str) -> Option<&CardTaskAction> {
        self.active_do_bindings(card_idx)
            .into_iter()
            .find(|binding| {
                matches!(
                    &binding.kind,
                    CardEventBindingKind::Do {
                        name: binding_name,
                        ..
                    } if binding_name == name
                )
            })
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

fn domain_suffix_matches(candidate: &str, restriction: &str) -> bool {
    let candidate = candidate.trim_end_matches('.').to_ascii_lowercase();
    let restriction = restriction
        .trim()
        .trim_end_matches('.')
        .to_ascii_lowercase();
    restriction.is_empty()
        || candidate == restriction
        || candidate.ends_with(&format!(".{restriction}"))
}

fn path_prefix_matches(candidate: &str, restriction: &str) -> bool {
    if restriction.is_empty() || restriction == "/" || candidate == restriction {
        return true;
    }
    if restriction.ends_with('/') {
        return candidate.starts_with(restriction);
    }
    candidate
        .strip_prefix(restriction)
        .is_some_and(|suffix| suffix.starts_with('/'))
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
                    language: None,
                    new_context: false,
                    ordered: true,
                    nodes: vec![],
                    event_bindings: vec![],
                    timer_value_ds: None,
                },
                Card {
                    id: "dup".to_string(),
                    language: None,
                    new_context: false,
                    ordered: true,
                    nodes: vec![],
                    event_bindings: vec![],
                    timer_value_ds: None,
                },
            ],
            None,
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
                language: None,
                new_context: false,
                ordered: true,
                nodes: vec![],
                event_bindings: vec![],
                timer_value_ds: None,
            }],
            None,
            vec![],
            None,
            vec![],
        );

        assert_eq!(deck.card_index("missing"), None);
    }
}
