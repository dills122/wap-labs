//! Shared lookup helpers for named `<input>`/`<select>` controls on a card.
//!
//! Every runtime accessor that reads or mutates a control by name walks the
//! same `Card -> Node::Paragraph -> InlineNode` tree. The traversal lives here
//! once so callers keep only their own "what to do with the match" logic, and
//! so lookup order stays deterministic (document order, first match wins).

use crate::runtime::card::Card;
use crate::runtime::input_mask::InputMask;
use crate::runtime::node::{InlineNode, Node, SelectOption};

/// Borrowed view of an [`InlineNode::Input`].
pub(crate) struct InputRef<'a> {
    pub(crate) name: &'a str,
    pub(crate) value: &'a str,
    pub(crate) max_length: Option<usize>,
    pub(crate) mask: &'a InputMask,
    pub(crate) empty_ok: bool,
}

/// Mutably borrowed view of an [`InlineNode::Input`].
pub(crate) struct InputMut<'a> {
    pub(crate) name: &'a str,
    pub(crate) value: &'a mut String,
    pub(crate) default_value: &'a Option<String>,
    pub(crate) mask: &'a InputMask,
    pub(crate) empty_ok: bool,
}

/// Borrowed view of an [`InlineNode::Select`], identified by `control_id`.
///
/// `control_id` defaults to `name` (or `iname`, or a parser-assigned
/// `select-N` ordinal) when `name` is absent, and is what every runtime
/// accessor keys lookups on — `name`/`iname` may be `None` or duplicated
/// across sibling selects per WML-204 semantics, so they are not usable as a
/// lookup key on their own.
pub(crate) struct SelectRef<'a> {
    pub(crate) control_id: &'a str,
    pub(crate) name: Option<&'a str>,
    pub(crate) iname: Option<&'a str>,
    pub(crate) multiple: bool,
    pub(crate) options: &'a [SelectOption],
    pub(crate) selected_indices: &'a [usize],
}

/// Mutably borrowed view of an [`InlineNode::Select`], identified by `control_id`.
pub(crate) struct SelectMut<'a> {
    pub(crate) control_id: &'a str,
    pub(crate) name: Option<&'a str>,
    pub(crate) iname: Option<&'a str>,
    pub(crate) default_value: Option<&'a str>,
    pub(crate) default_index_value: Option<&'a str>,
    pub(crate) multiple: bool,
    pub(crate) options: &'a [SelectOption],
    pub(crate) selected_indices: &'a mut Vec<usize>,
}

/// First input named `input_name`, in document order.
pub(crate) fn find_input<'a>(card: &'a Card, input_name: &str) -> Option<InputRef<'a>> {
    inline_nodes(card)
        .filter_map(as_input)
        .find(|input| input.name == input_name)
}

/// First input named `input_name`, in document order, for mutation.
pub(crate) fn find_input_mut<'a>(card: &'a mut Card, input_name: &str) -> Option<InputMut<'a>> {
    inputs_mut(card).find(|input| input.name == input_name)
}

/// Every input on the card, in document order, for mutation.
pub(crate) fn inputs_mut<'a>(card: &'a mut Card) -> impl Iterator<Item = InputMut<'a>> + 'a {
    inline_nodes_mut(card).filter_map(as_input_mut)
}

/// First select with `control_id`, in document order.
pub(crate) fn find_select<'a>(card: &'a Card, control_id: &str) -> Option<SelectRef<'a>> {
    inline_nodes(card)
        .filter_map(as_select)
        .find(|select| select.control_id == control_id)
}

/// Every select on the card, in document order.
pub(crate) fn selects<'a>(card: &'a Card) -> impl Iterator<Item = SelectRef<'a>> + 'a {
    inline_nodes(card).filter_map(as_select)
}

/// Every select on the card, in document order, for mutation.
pub(crate) fn selects_mut<'a>(card: &'a mut Card) -> impl Iterator<Item = SelectMut<'a>> + 'a {
    inline_nodes_mut(card).filter_map(as_select_mut)
}

/// Every select with `control_id`, in document order, for mutation.
///
/// `control_id` defaults to `name` when present, so sibling `<select>`
/// elements sharing a `name` also share a `control_id`. Callers that only
/// accept a match satisfying an extra condition (an in-range option index,
/// for example) keep scanning later same-id selects, so this returns the
/// full sequence instead of just the first match.
pub(crate) fn selects_with_control_id_mut<'a>(
    card: &'a mut Card,
    control_id: &'a str,
) -> impl Iterator<Item = SelectMut<'a>> + 'a {
    inline_nodes_mut(card)
        .filter_map(as_select_mut)
        .filter(move |select| select.control_id == control_id)
}

fn inline_nodes(card: &Card) -> impl Iterator<Item = &InlineNode> + '_ {
    card.nodes
        .iter()
        .filter_map(|node| match node {
            Node::Paragraph(items) => Some(items.iter()),
            Node::Break => None,
        })
        .flatten()
}

fn inline_nodes_mut(card: &mut Card) -> impl Iterator<Item = &mut InlineNode> + '_ {
    card.nodes
        .iter_mut()
        .filter_map(|node| match node {
            Node::Paragraph(items) => Some(items.iter_mut()),
            Node::Break => None,
        })
        .flatten()
}

fn as_input(item: &InlineNode) -> Option<InputRef<'_>> {
    match item {
        InlineNode::Input {
            name,
            value,
            max_length,
            mask,
            empty_ok,
            ..
        } => Some(InputRef {
            name,
            value,
            max_length: *max_length,
            mask,
            empty_ok: *empty_ok,
        }),
        InlineNode::Text(_)
        | InlineNode::Break
        | InlineNode::Link { .. }
        | InlineNode::Select { .. } => None,
    }
}

fn as_input_mut(item: &mut InlineNode) -> Option<InputMut<'_>> {
    match item {
        InlineNode::Input {
            name,
            value,
            default_value,
            mask,
            empty_ok,
            ..
        } => Some(InputMut {
            name: name.as_str(),
            value,
            default_value: &*default_value,
            mask: &*mask,
            empty_ok: *empty_ok,
        }),
        InlineNode::Text(_)
        | InlineNode::Break
        | InlineNode::Link { .. }
        | InlineNode::Select { .. } => None,
    }
}

fn as_select(item: &InlineNode) -> Option<SelectRef<'_>> {
    match item {
        InlineNode::Select {
            control_id,
            name,
            iname,
            multiple,
            options,
            selected_indices,
            ..
        } => Some(SelectRef {
            control_id,
            name: name.as_deref(),
            iname: iname.as_deref(),
            multiple: *multiple,
            options,
            selected_indices,
        }),
        InlineNode::Text(_)
        | InlineNode::Break
        | InlineNode::Link { .. }
        | InlineNode::Input { .. } => None,
    }
}

fn as_select_mut(item: &mut InlineNode) -> Option<SelectMut<'_>> {
    match item {
        InlineNode::Select {
            control_id,
            name,
            iname,
            default_value,
            default_index_value,
            multiple,
            options,
            selected_indices,
            ..
        } => Some(SelectMut {
            control_id: control_id.as_str(),
            name: name.as_deref(),
            iname: iname.as_deref(),
            default_value: default_value.as_deref(),
            default_index_value: default_index_value.as_deref(),
            multiple: *multiple,
            options: options.as_slice(),
            selected_indices,
        }),
        InlineNode::Text(_)
        | InlineNode::Break
        | InlineNode::Link { .. }
        | InlineNode::Input { .. } => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input_node(name: &str, value: &str) -> InlineNode {
        InlineNode::Input {
            name: name.to_string(),
            value: value.to_string(),
            default_value: None,
            is_password: false,
            max_length: None,
            mask: InputMask::default(),
            empty_ok: true,
        }
    }

    fn select_node(control_id: &str, option_labels: &[&str], selected_index: usize) -> InlineNode {
        InlineNode::Select {
            control_id: control_id.to_string(),
            name: Some(control_id.to_string()),
            iname: None,
            title: None,
            default_value: None,
            default_index_value: None,
            multiple: false,
            options: option_labels
                .iter()
                .map(|label| SelectOption {
                    label: (*label).to_string(),
                    value: (*label).to_string(),
                    onpick: None,
                })
                .collect(),
            selected_indices: vec![selected_index],
        }
    }

    fn card_with(nodes: Vec<Node>) -> Card {
        Card {
            id: "card".to_string(),
            language: None,
            new_context: false,
            ordered: true,
            nodes,
            event_bindings: vec![],
            timer_value_ds: None,
        }
    }

    #[test]
    fn find_input_returns_first_match_across_paragraphs() {
        let card = card_with(vec![
            Node::Paragraph(vec![InlineNode::Text("label".to_string())]),
            Node::Break,
            Node::Paragraph(vec![input_node("name", "first")]),
            Node::Paragraph(vec![input_node("name", "second")]),
        ]);

        let input = find_input(&card, "name").expect("input should be found");
        assert_eq!(input.name, "name");
        assert_eq!(input.value, "first");
        assert_eq!(input.max_length, None);
        assert!(input.empty_ok);
    }

    #[test]
    fn find_input_returns_none_for_unknown_name() {
        let card = card_with(vec![Node::Paragraph(vec![input_node("name", "value")])]);

        assert!(find_input(&card, "other").is_none());
    }

    #[test]
    fn find_input_ignores_same_named_select() {
        let card = card_with(vec![Node::Paragraph(vec![select_node(
            "choice",
            &["a", "b"],
            0,
        )])]);

        assert!(find_input(&card, "choice").is_none());
    }

    #[test]
    fn find_input_mut_mutates_only_first_match() {
        let mut card = card_with(vec![Node::Paragraph(vec![
            input_node("name", "first"),
            input_node("name", "second"),
        ])]);

        let input = find_input_mut(&mut card, "name").expect("input should be found");
        *input.value = "updated".to_string();

        let values: Vec<String> = inputs_mut(&mut card)
            .map(|input| input.value.clone())
            .collect();
        assert_eq!(values, vec!["updated".to_string(), "second".to_string()]);
    }

    #[test]
    fn inputs_mut_yields_every_input_in_document_order() {
        let mut card = card_with(vec![
            Node::Paragraph(vec![
                input_node("a", "1"),
                InlineNode::Link {
                    text: "link".to_string(),
                    href: "#next".to_string(),
                },
            ]),
            Node::Break,
            Node::Paragraph(vec![select_node("c", &["x"], 0), input_node("b", "2")]),
        ]);

        let names: Vec<String> = inputs_mut(&mut card)
            .map(|input| input.name.to_string())
            .collect();
        assert_eq!(names, vec!["a".to_string(), "b".to_string()]);
    }

    #[test]
    fn find_select_returns_first_match_and_ignores_other_node_types() {
        let card = card_with(vec![
            Node::Paragraph(vec![input_node("choice", "typed")]),
            Node::Paragraph(vec![select_node("choice", &["a", "b"], 1)]),
            Node::Paragraph(vec![select_node("choice", &["c"], 0)]),
        ]);

        let select = find_select(&card, "choice").expect("select should be found");
        assert_eq!(select.control_id, "choice");
        assert_eq!(select.name, Some("choice"));
        assert_eq!(select.selected_indices, &[1]);
        assert_eq!(select.options.len(), 2);
        assert!(find_select(&card, "missing").is_none());
    }

    #[test]
    fn selects_with_control_id_mut_yields_every_same_id_select() {
        let mut card = card_with(vec![
            Node::Paragraph(vec![select_node("choice", &["a"], 0)]),
            Node::Paragraph(vec![select_node("other", &["a", "b"], 0)]),
            Node::Paragraph(vec![select_node("choice", &["a", "b", "c"], 0)]),
        ]);

        let option_counts: Vec<usize> = selects_with_control_id_mut(&mut card, "choice")
            .map(|select| select.options.len())
            .collect();
        assert_eq!(option_counts, vec![1, 3]);

        for select in selects_with_control_id_mut(&mut card, "choice") {
            if 2 < select.options.len() {
                *select.selected_indices = vec![2];
                break;
            }
        }

        let indexes: Vec<Vec<usize>> = selects_with_control_id_mut(&mut card, "choice")
            .map(|select| select.selected_indices.clone())
            .collect();
        assert_eq!(indexes, vec![vec![0], vec![2]]);
    }

    #[test]
    fn selects_mut_yields_every_select_in_document_order() {
        let mut card = card_with(vec![
            Node::Paragraph(vec![
                select_node("a", &["x"], 0),
                input_node("typed", "value"),
            ]),
            Node::Break,
            Node::Paragraph(vec![select_node("b", &["y", "z"], 0)]),
        ]);

        let ids: Vec<String> = selects_mut(&mut card)
            .map(|select| select.control_id.to_string())
            .collect();
        assert_eq!(ids, vec!["a".to_string(), "b".to_string()]);
    }
}
