mod engine_adapter;
mod engine_commands;

// `engine_commands` reaches these directly via `super::engine_adapter::{...}`
// rather than through this re-export, so which names count as "used" here
// depends on which of `src/tests/{mod,engine_wrappers,engine_flow}.rs` are
// compiled: a subset is used only by the plain lib target, a different
// subset only by the test target, so no fixed narrower split of this list is
// warning-free across both `cargo build` and `cargo test`. `AppState` below
// is the one name always used regardless of target and doesn't need this.
#[cfg(test)]
pub(crate) use engine_adapter::force_next_frame_failure;
#[allow(unused_imports)]
pub use engine_adapter::{
    apply_advance_time_ms, apply_advance_time_ms_frame, apply_begin_focused_input_edit,
    apply_begin_focused_input_edit_frame, apply_begin_focused_select_edit,
    apply_begin_focused_select_edit_frame, apply_cancel_focused_input_edit,
    apply_cancel_focused_input_edit_frame, apply_cancel_focused_select_edit,
    apply_cancel_focused_select_edit_frame, apply_clear_external_navigation_intent,
    apply_clear_external_navigation_intent_frame, apply_commit_focused_input_edit,
    apply_commit_focused_input_edit_frame, apply_commit_focused_select_edit,
    apply_commit_focused_select_edit_frame, apply_engine_snapshot, apply_handle_input_frame,
    apply_handle_key, apply_handle_key_frame, apply_load_deck, apply_load_deck_context,
    apply_load_deck_context_frame, apply_move_focused_select_edit,
    apply_move_focused_select_edit_frame, apply_navigate_back, apply_navigate_back_frame,
    apply_navigate_to_card, apply_navigate_to_card_frame, apply_render, apply_render_frame,
    apply_set_focused_input_edit_draft, apply_set_focused_input_edit_draft_frame,
    apply_set_viewport_cols, AppState,
};
pub use engine_commands::{
    command_engine_advance_time_ms, command_engine_advance_time_ms_frame,
    command_engine_begin_focused_input_edit, command_engine_begin_focused_input_edit_frame,
    command_engine_begin_focused_select_edit, command_engine_begin_focused_select_edit_frame,
    command_engine_cancel_focused_input_edit, command_engine_cancel_focused_input_edit_frame,
    command_engine_cancel_focused_select_edit, command_engine_cancel_focused_select_edit_frame,
    command_engine_clear_external_navigation_intent,
    command_engine_clear_external_navigation_intent_frame,
    command_engine_commit_focused_input_edit, command_engine_commit_focused_input_edit_frame,
    command_engine_commit_focused_select_edit, command_engine_commit_focused_select_edit_frame,
    command_engine_handle_input_frame, command_engine_handle_key, command_engine_handle_key_frame,
    command_engine_load_deck, command_engine_load_deck_context,
    command_engine_load_deck_context_frame, command_engine_move_focused_select_edit,
    command_engine_move_focused_select_edit_frame, command_engine_navigate_back,
    command_engine_navigate_back_frame, command_engine_navigate_to_card,
    command_engine_navigate_to_card_frame, command_engine_render, command_engine_render_frame,
    command_engine_set_focused_input_edit_draft, command_engine_set_focused_input_edit_draft_frame,
    command_engine_set_viewport_cols, command_engine_snapshot,
};
