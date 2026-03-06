#![no_main]

use libfuzzer_sys::fuzz_target;
use wavenav_engine::WmlEngine;

fn map_key(op: u8) -> &'static str {
    match op % 6 {
        0 => "up",
        1 => "down",
        2 => "left",
        3 => "right",
        4 => "select",
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
