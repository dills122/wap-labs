use super::*;
use crate::{EngineFrameSegment, EnginePresentationFrame, EngineSelectionState};

pub(crate) const EXAMPLE: &str = include_str!("../../../examples/source/wml-308-input-title.wml");
pub(crate) const URL: &str = "http://example.test/apps/wml-308-input-title.wml";
pub(crate) const CONTENT_TYPE: &str = "text/vnd.wap.wml; validation=strict";

pub(crate) fn frame_text(frame: &EnginePresentationFrame) -> Vec<&str> {
    frame
        .rows
        .iter()
        .flat_map(|row| &row.segments)
        .map(|segment| match segment {
            EngineFrameSegment::Text { text, .. } | EngineFrameSegment::Focusable { text, .. } => {
                text.as_str()
            }
        })
        .collect()
}

#[test]
fn wml_308_input_title_is_resolved_for_frames_without_changing_edit_identity() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(EXAMPLE, URL, CONTENT_TYPE, None)
        .expect("strict input-title deck should load");

    let initial = engine.render_output().expect("initial input frame");
    let rendered = frame_text(&initial.presentation);
    assert_eq!(
        rendered,
        [
            "[Caption: City]",
            "[City: Oslo]",
            "[Access code: ****]",
            "[Fallback: ]",
            "[Plain: ]"
        ]
    );
    let legacy = initial
        .render
        .draw
        .iter()
        .map(|command| match command {
            DrawCmd::Text { text, .. } | DrawCmd::Link { text, .. } => text.as_str(),
        })
        .collect::<Vec<_>>();
    assert_eq!(legacy, rendered);

    assert!(engine.set_var("Caption".to_string(), "District".to_string()));
    engine.handle_key("down".to_string()).expect("focus Place");
    assert!(engine.begin_focused_input_edit().expect("edit Place"));
    assert!(engine.set_focused_input_edit_draft("Bergen".to_string()));
    let draft = engine.render_frame().expect("draft input frame");
    assert_ne!(draft.frame_id, initial.presentation.frame_id);
    assert!(frame_text(&draft).contains(&"[District: Bergen]"));
    assert!(matches!(
        draft.selection,
        EngineSelectionState::Input { ref name, editing: true, .. } if name == "Place"
    ));
    assert!(engine.commit_focused_input_edit().expect("commit Place"));
    assert_eq!(
        engine.get_var("Place".to_string()).as_deref(),
        Some("Bergen")
    );
    assert_eq!(engine.get_var("District".to_string()), None);
    assert_eq!(engine.get_var("Pin".to_string()).as_deref(), Some("1234"));
}
