use crate::{EngineInputEvent, WmlEngine, ENGINE_VIEWPORT_ROWS};

fn scroll_deck(row_count: usize) -> String {
    let paragraphs = (0..row_count)
        .map(|index| format!("<p>Row {index:02}</p>"))
        .collect::<String>();
    format!(r#"<wml><card id="home">{paragraphs}</card></wml>"#)
}

fn scroll(engine: &mut WmlEngine, delta_rows: i32) -> Result<(), String> {
    let frame = engine.render_frame().expect("frame should render");
    engine.handle_input(EngineInputEvent::Scroll {
        frame_id: frame.frame_id,
        delta_rows,
    })
}

fn visible_text(engine: &WmlEngine) -> Vec<String> {
    engine
        .render_frame()
        .expect("frame should render")
        .rows
        .iter()
        .flat_map(|row| row.segments.iter())
        .map(|segment| match segment {
            crate::EngineFrameSegment::Text { text, .. }
            | crate::EngineFrameSegment::Focusable { text, .. } => text.clone(),
        })
        .collect()
}

#[test]
fn f2_02_scroll_clamps_to_content_boundaries_and_projects_viewport_rows() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(&scroll_deck(ENGINE_VIEWPORT_ROWS as usize + 5))
        .expect("scroll deck should load");

    let initial = engine.render_frame().expect("initial frame");
    assert_eq!(initial.viewport.rows, ENGINE_VIEWPORT_ROWS);
    assert_eq!(initial.viewport.offset_row, 0);
    assert_eq!(initial.viewport.content_rows, ENGINE_VIEWPORT_ROWS + 5);
    assert_eq!(initial.rows.first().map(|row| row.index), Some(0));
    assert_eq!(initial.rows.last().map(|row| row.index), Some(19));

    scroll(&mut engine, 3).expect("forward scroll should succeed");
    let advanced = engine.render_frame().expect("advanced frame");
    assert_eq!(advanced.viewport.offset_row, 3);
    assert_eq!(advanced.rows.first().map(|row| row.index), Some(0));
    assert_eq!(advanced.rows.last().map(|row| row.index), Some(19));
    assert_eq!(
        visible_text(&engine).first().map(String::as_str),
        Some("Row 03")
    );

    scroll(&mut engine, i32::MAX).expect("bottom clamp should succeed");
    let bottom = engine.render_frame().expect("bottom frame");
    assert_eq!(bottom.viewport.offset_row, 5);
    assert_eq!(
        visible_text(&engine).first().map(String::as_str),
        Some("Row 05")
    );

    scroll(&mut engine, i32::MIN).expect("top clamp should succeed");
    assert_eq!(
        engine
            .render_frame()
            .expect("top frame")
            .viewport
            .offset_row,
        0
    );
}

#[test]
fn f2_02_identical_scroll_traces_produce_identical_visible_windows() {
    let mut first = WmlEngine::new();
    first
        .load_deck(&scroll_deck(ENGINE_VIEWPORT_ROWS as usize + 12))
        .expect("scroll deck should load");
    let mut second = first.clone();

    for delta in [1, 4, -2, 99, -3] {
        scroll(&mut first, delta).expect("first trace step");
        scroll(&mut second, delta).expect("second trace step");
        assert_eq!(
            first.render_frame().expect("first frame"),
            second.render_frame().expect("second frame")
        );
    }
}

#[test]
fn f2_02_scroll_rejects_stale_frames_without_mutation() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(&scroll_deck(ENGINE_VIEWPORT_ROWS as usize + 2))
        .expect("scroll deck should load");
    let initial = engine.render_frame().expect("initial frame");

    let error = engine
        .handle_input(EngineInputEvent::Scroll {
            frame_id: "stale-frame".to_string(),
            delta_rows: 1,
        })
        .expect_err("stale scroll must reject");

    assert_eq!(error, "Engine input references a stale frame");
    assert_eq!(engine.render_frame().expect("unchanged frame"), initial);
}

#[test]
fn f2_02_visible_hit_regions_are_viewport_relative() {
    let paragraphs = (0..ENGINE_VIEWPORT_ROWS)
        .map(|index| format!("<p>Row {index:02}</p>"))
        .collect::<String>();
    let deck = format!(
        r##"<wml><card id="home">{paragraphs}<p><a href="#next">Next</a></p></card><card id="next"><p>Done</p></card></wml>"##
    );
    let mut engine = WmlEngine::new();
    engine.load_deck(&deck).expect("link deck should load");

    scroll(&mut engine, 1).expect("scroll should expose link");
    let frame = engine.render_frame().expect("scrolled frame");
    assert_eq!(frame.viewport.offset_row, 1);
    assert_eq!(frame.hit_regions.len(), 1);
    assert_eq!(frame.hit_regions[0].y, ENGINE_VIEWPORT_ROWS - 1);

    engine
        .handle_input(EngineInputEvent::Click {
            frame_id: frame.frame_id,
            x: 0,
            y: ENGINE_VIEWPORT_ROWS - 1,
        })
        .expect("viewport-relative click should activate");
    assert_eq!(engine.active_card_id().as_deref(), Ok("next"));
}
