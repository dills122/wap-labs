use crate::runtime::card::Card;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Deck {
    pub cards: Vec<Card>,
}
