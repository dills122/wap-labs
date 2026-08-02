use super::*;
use crate::render::frame::{EngineRenderError, EngineRenderLimits, EngineRenderResource};
use crate::{
    ENGINE_MAX_DRAW_COMMANDS, ENGINE_MAX_LAYOUT_ROWS, ENGINE_MAX_LAYOUT_SEGMENTS,
    ENGINE_VIEWPORT_ROWS,
};

fn deck_with_text_rows(count: usize) -> String {
    format!(
        "<wml><card id=\"limits\"><p>{}</p></card></wml>",
        "a ".repeat(count)
    )
}

fn loaded_engine(wml: &str) -> WmlEngine {
    let mut engine = WmlEngine::new();
    engine
        .set_viewport_cols(1)
        .expect("viewport should be valid");
    engine.load_deck(wml).expect("limit fixture should load");
    engine
}

fn assert_limit(
    error: EngineRenderError,
    expected_resource: EngineRenderResource,
    expected_limit: usize,
) {
    assert!(matches!(
        error,
        EngineRenderError::ResourceLimit {
            resource,
            limit,
            observed,
            ..
        } if resource == expected_resource
            && limit == expected_limit
            && observed == expected_limit + 1
    ));
}

#[test]
fn production_structural_limits_accept_exact_output_and_reject_one_more_row() {
    assert_eq!(ENGINE_MAX_LAYOUT_ROWS, ENGINE_MAX_LAYOUT_SEGMENTS);
    assert_eq!(ENGINE_MAX_LAYOUT_ROWS, ENGINE_MAX_DRAW_COMMANDS);

    let exact = loaded_engine(&deck_with_text_rows(ENGINE_MAX_LAYOUT_ROWS));
    let output = exact
        .render_output()
        .expect("exact production output limits should render");
    assert_eq!(
        output.presentation.rows.len(),
        ENGINE_VIEWPORT_ROWS as usize
    );
    assert_eq!(
        output.presentation.viewport.content_rows,
        ENGINE_MAX_LAYOUT_ROWS as u32
    );
    assert_eq!(output.render.draw.len(), ENGINE_MAX_DRAW_COMMANDS);
    assert_eq!(
        output
            .presentation
            .rows
            .iter()
            .map(|row| row.segments.len())
            .sum::<usize>(),
        ENGINE_VIEWPORT_ROWS as usize
    );

    let one_over = loaded_engine(&deck_with_text_rows(ENGINE_MAX_LAYOUT_ROWS + 1));
    assert_limit(
        one_over
            .render_output()
            .expect_err("one over production row limit must fail"),
        EngineRenderResource::LayoutRows,
        ENGINE_MAX_LAYOUT_ROWS,
    );
}

#[test]
fn native_engine_checks_each_budget_at_limit_and_one_over() {
    let exact = loaded_engine(&deck_with_text_rows(3));
    let one_over = loaded_engine(&deck_with_text_rows(4));

    let segment_limits = EngineRenderLimits {
        rows: 4,
        segments: 3,
        draw_commands: 4,
        serialized_bytes: usize::MAX,
    };
    exact
        .render_output_with_limits(segment_limits)
        .expect("exact segment limit should render");
    assert_limit(
        one_over
            .render_output_with_limits(segment_limits)
            .expect_err("one over segment limit should fail"),
        EngineRenderResource::LayoutSegments,
        3,
    );

    let draw_limits = EngineRenderLimits {
        rows: 4,
        segments: 4,
        draw_commands: 3,
        serialized_bytes: usize::MAX,
    };
    exact
        .render_output_with_limits(draw_limits)
        .expect("exact draw limit should render");
    assert_limit(
        one_over
            .render_output_with_limits(draw_limits)
            .expect_err("one over draw limit should fail"),
        EngineRenderResource::DrawCommands,
        3,
    );

    let exact_rows = loaded_engine("<wml><card id=\"limits\"><br/><br/><br/></card></wml>");
    let one_over_rows = loaded_engine("<wml><card id=\"limits\"><br/><br/><br/><br/></card></wml>");
    let row_limits = EngineRenderLimits {
        rows: 3,
        segments: 0,
        draw_commands: 0,
        serialized_bytes: usize::MAX,
    };
    exact_rows
        .render_output_with_limits(row_limits)
        .expect("exact row limit should render");
    assert_limit(
        one_over_rows
            .render_output_with_limits(row_limits)
            .expect_err("one over row limit should fail"),
        EngineRenderResource::LayoutRows,
        3,
    );

    let unlimited_serialization = EngineRenderLimits {
        serialized_bytes: usize::MAX,
        ..EngineRenderLimits::default()
    };
    let serialized_output = exact
        .render_output_with_limits(unlimited_serialization)
        .expect("fixture should render without a byte limit");
    let serialized_len = serde_json::to_vec(&serialized_output)
        .expect("render output should serialize")
        .len();
    exact
        .render_output_with_limits(EngineRenderLimits {
            serialized_bytes: serialized_len,
            ..EngineRenderLimits::default()
        })
        .expect("exact serialized-byte limit should render");
    assert_limit(
        exact
            .render_output_with_limits(EngineRenderLimits {
                serialized_bytes: serialized_len - 1,
                ..EngineRenderLimits::default()
            })
            .expect_err("one over serialized-byte limit should fail"),
        EngineRenderResource::SerializedBytes,
        serialized_len - 1,
    );
}

#[test]
fn rejected_pathological_render_preserves_state_and_known_good_deck_renders_next() {
    let mut engine = loaded_engine(&deck_with_text_rows(ENGINE_MAX_LAYOUT_ROWS + 1));
    let active_before = engine
        .active_card_id()
        .expect("pathological deck should be active");
    assert_limit(
        engine
            .render_output()
            .expect_err("pathological output should be rejected"),
        EngineRenderResource::LayoutRows,
        ENGINE_MAX_LAYOUT_ROWS,
    );
    assert_eq!(
        engine.active_card_id().as_deref(),
        Ok(active_before.as_str())
    );

    engine
        .load_deck("<wml><card id=\"recovered\"><p>Ready</p></card></wml>")
        .expect("known-good deck should load after rejection");
    let recovered = engine
        .render_output()
        .expect("known-good deck should render after rejection");
    assert_eq!(recovered.presentation.card.id, "recovered");
    assert!(!recovered.render.draw.is_empty());
}
