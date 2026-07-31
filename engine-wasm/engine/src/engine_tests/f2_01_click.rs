use crate::{
    EngineFocusTargetKind, EngineInputEvent, EngineSelectionState, WmlEngine,
    ENGINE_FRAME_CONTRACT_VERSION,
};

const CLICK_DECK: &str = r##"
<wml>
  <card id="home">
    <p>
      <a href="#wrapped">abcdefghijklmno</a>
      <input name="query" value="Ada"/>
      <select name="choice">
        <option value="one">One</option>
        <option value="two">Two</option>
      </select>
      <a href="#last">last</a>
    </p>
  </card>
  <card id="wrapped"><p>Wrapped destination</p></card>
  <card id="last"><p>Last destination</p></card>
</wml>
"##;

fn click_engine() -> WmlEngine {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(CLICK_DECK)
        .expect("click deck should load");
    engine.set_viewport_cols(10).expect("valid viewport");
    engine
}

fn click(engine: &mut WmlEngine, frame_id: &str, x: u32, y: u32) -> Result<(), String> {
    engine.handle_input(EngineInputEvent::Click {
        frame_id: frame_id.to_string(),
        x,
        y,
    })
}

#[test]
fn f2_01_frame_exposes_ordered_half_open_regions_for_wrapped_targets() {
    let engine = click_engine();
    let frame = engine.render_frame().expect("frame should render");

    assert_eq!(frame.contract_version, ENGINE_FRAME_CONTRACT_VERSION);
    assert_eq!(
        frame
            .hit_regions
            .iter()
            .map(|region| (
                region.x,
                region.y,
                region.width,
                region.height,
                region.action_id.as_str(),
                region.target_kind,
            ))
            .collect::<Vec<_>>(),
        vec![
            (0, 0, 10, 1, "focus:0", EngineFocusTargetKind::Link),
            (0, 1, 5, 1, "focus:0", EngineFocusTargetKind::Link),
            (0, 2, 7, 1, "focus:1", EngineFocusTargetKind::Input),
            (0, 3, 4, 1, "focus:1", EngineFocusTargetKind::Input),
            (0, 4, 8, 1, "focus:2", EngineFocusTargetKind::Select),
            (0, 5, 4, 1, "focus:2", EngineFocusTargetKind::Select),
            (0, 6, 4, 1, "focus:3", EngineFocusTargetKind::Link),
        ]
    );

    let first = &frame.hit_regions[0];
    assert!(first.contains(0, 0));
    assert!(first.contains(9, 0));
    assert!(!first.contains(10, 0));
    assert!(!first.contains(0, 1));
}

#[test]
fn f2_01_wrapped_link_click_and_keyboard_activation_have_equivalent_outcomes() {
    let mut clicked = click_engine();
    let mut keyed = click_engine();
    let frame = clicked.render_frame().expect("click frame should render");

    click(&mut clicked, &frame.frame_id, 4, 1).expect("wrapped link click should activate");
    keyed
        .handle_input(EngineInputEvent::Key {
            key: crate::EngineInputKey::Enter,
        })
        .expect("keyboard activation should succeed");

    assert_eq!(clicked.active_card_id(), keyed.active_card_id());
    assert_eq!(
        clicked.render_frame().expect("clicked frame"),
        keyed.render_frame().expect("keyed frame")
    );
}

#[test]
fn f2_01_click_resolves_input_and_select_like_keyboard_focus_then_enter() {
    let mut clicked_input = click_engine();
    let mut keyed_input = click_engine();
    let input_frame = clicked_input.render_frame().expect("input frame");

    click(&mut clicked_input, &input_frame.frame_id, 2, 2).expect("input click");
    keyed_input
        .handle_key("down".to_string())
        .expect("move to input");
    keyed_input
        .handle_key("enter".to_string())
        .expect("activate input");
    assert_eq!(clicked_input.focused_link_index(), 1);
    assert_eq!(
        clicked_input
            .render_frame()
            .expect("clicked input")
            .selection,
        keyed_input.render_frame().expect("keyed input").selection
    );
    assert!(matches!(
        clicked_input
            .render_frame()
            .expect("input selection")
            .selection,
        EngineSelectionState::Input { editing: true, .. }
    ));

    let mut clicked_select = click_engine();
    let mut keyed_select = click_engine();
    let select_frame = clicked_select.render_frame().expect("select frame");
    click(&mut clicked_select, &select_frame.frame_id, 1, 5).expect("wrapped select click");
    keyed_select
        .handle_key("down".to_string())
        .expect("to input");
    keyed_select
        .handle_key("down".to_string())
        .expect("to select");
    keyed_select
        .handle_key("enter".to_string())
        .expect("activate select");
    assert_eq!(clicked_select.focused_link_index(), 2);
    assert_eq!(
        clicked_select
            .render_frame()
            .expect("clicked select")
            .selection,
        keyed_select.render_frame().expect("keyed select").selection
    );
    assert!(matches!(
        clicked_select
            .render_frame()
            .expect("select selection")
            .selection,
        EngineSelectionState::Select { editing: true, .. }
    ));
}

#[test]
fn f2_01_empty_space_is_a_noop_and_frame_identity_is_mandatory() {
    let mut engine = click_engine();
    let frame = engine.render_frame().expect("frame should render");

    click(&mut engine, &frame.frame_id, 10, 0).expect("right boundary is excluded");
    click(&mut engine, &frame.frame_id, 9, 6).expect("empty in-row space is a no-op");
    click(&mut engine, &frame.frame_id, 0, 99).expect("empty row is a no-op");
    assert_eq!(
        engine.render_frame().expect("frame after empty clicks"),
        frame
    );

    let error =
        click(&mut engine, "mismatched-frame", 0, 0).expect_err("mismatched frame id must reject");
    assert_eq!(error, "Engine input references a stale frame");
    assert_eq!(
        engine.render_frame().expect("frame after rejected click"),
        frame
    );

    engine
        .handle_key("down".to_string())
        .expect("focus mutation should create a new frame");
    let error = click(&mut engine, &frame.frame_id, 0, 0)
        .expect_err("prior frame id must reject after focus changes");
    assert_eq!(error, "Engine input references a stale frame");
    assert_eq!(engine.focused_link_index(), 1);
}

#[test]
fn f2_01_identical_frame_and_coordinate_always_choose_the_same_target() {
    let mut first = click_engine();
    let mut second = first.clone();
    let frame = first.render_frame().expect("frame should render");

    click(&mut first, &frame.frame_id, 1, 6).expect("first click");
    click(&mut second, &frame.frame_id, 1, 6).expect("second click");

    assert_eq!(first.active_card_id(), second.active_card_id());
    assert_eq!(
        first.render_frame().expect("first result"),
        second.render_frame().expect("second result")
    );
}
