#![no_main]

use libfuzzer_sys::fuzz_target;
use wavenav_engine::WmlEngine;

fn map_key(op: u8) -> &'static str {
    // "enter" must be reachable: it is the only key that drives link/accept
    // navigation (`execute_action_href` / `navigate_to_card_internal`), so
    // without it the fuzzer can never exercise `onenterforward`/
    // `onenterbackward` cycles or any other navigation path at all. The
    // other three engine-recognized keys ("up"/"down" for focus movement)
    // and a couple of unrecognized values (exercised as a deliberate no-op
    // path through `handle_key_internal`'s `_ => {}` arm) round out the
    // input space.
    match op % 6 {
        0 => "up",
        1 => "down",
        2 => "enter",
        3 => "enter",
        4 => "unknown-key",
        _ => "clear",
    }
}

fuzz_target!(|data: &[u8]| {
    let mut engine = WmlEngine::new();
    let wml_xml = String::from_utf8_lossy(data).into_owned();

    let _ = engine.load_deck_context(&wml_xml, "", "text/vnd.wap.wml", None);
    let _ = engine.render();
    let _ = engine.active_card_id();

    for (idx, op) in data.iter().copied().take(128).enumerate() {
        let key = map_key(op);
        let _ = engine.handle_key(key.to_string());
        if idx % 5 == 0 {
            // Exercise `navigate_back`/`onenterbackward` re-entrancy
            // directly, in addition to whatever `<prev/>` actions the
            // deck itself may trigger via "enter".
            let _ = engine.navigate_back();
        }
        if idx % 7 == 0 {
            let _ = engine.render();
        }
        if idx % 17 == 0 {
            let _ = engine.advance_time_ms((op as u32) * 7);
            let _ = engine.render();
        }
    }

    let _ = engine.external_navigation_intent();
});
