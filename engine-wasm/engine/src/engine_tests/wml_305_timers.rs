use super::*;

fn timer_deck(timer: &str, timed_content: &str) -> String {
    format!(
        r##"
        <wml>
          <card id="home">
            <a href="#timed">Start</a>
          </card>
          <card id="timed">
            <onevent type="ontimer"><go href="#expired"/></onevent>
            {timer}
            {timed_content}
          </card>
          <card id="expired"><p>Expired</p></card>
          <card id="manual"><p>Manual</p></card>
        </wml>
        "##
    )
}

#[test]
fn wml_305_named_timer_uses_existing_variable_then_falls_back_to_value() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <do type="accept">
              <go href="#timed"><setvar name="remaining" value="2"/></go>
            </do>
          </card>
          <card id="timed">
            <timer name="remaining" value="5"/>
            <p>Timed</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("named timer card should open");
    assert_eq!(engine.next_timer_wakeup_ms(), Some(200));

    let mut fallback = WmlEngine::new();
    fallback
        .load_deck(&timer_deck(
            r#"<timer name="remaining" value="5"/>"#,
            "<p>Timed</p>",
        ))
        .expect("deck should load");
    fallback
        .handle_key("enter".to_string())
        .expect("timer card should open");
    assert_eq!(fallback.next_timer_wakeup_ms(), Some(500));
}

#[test]
fn wml_305_unnamed_timer_uses_value_and_tenths_of_a_second_units() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(&timer_deck(r#"<timer value="7"/>"#, "<p>Timed</p>"))
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("timer card should open");

    assert_eq!(engine.next_timer_wakeup_ms(), Some(700));
}

#[test]
fn wml_305_invalid_and_zero_values_disable_the_timer() {
    for timer in [
        r#"<timer value="invalid"/>"#,
        r#"<timer value="-1"/>"#,
        r#"<timer value="0"/>"#,
    ] {
        let mut engine = WmlEngine::new();
        engine
            .load_deck(&timer_deck(timer, "<p>Timed</p>"))
            .expect("invalid timer values should be ignored");
        engine
            .handle_key("enter".to_string())
            .expect("timer card should open");
        assert_eq!(engine.active_card_id().expect("active card"), "timed");
        assert_eq!(engine.next_timer_wakeup_ms(), None);
        engine
            .advance_time_ms(10_000)
            .expect("disabled timer advance should no-op");
        assert_eq!(engine.active_card_id().expect("active card"), "timed");
    }

    let mut named = WmlEngine::new();
    let named_xml = r##"
        <wml>
          <card id="home">
            <do type="accept">
              <go href="#timed"><setvar name="remaining" value="invalid"/></go>
            </do>
          </card>
          <card id="timed">
            <onevent type="ontimer"><go href="#expired"/></onevent>
            <timer name="remaining" value="5"/>
            <p>Timed</p>
          </card>
          <card id="expired"><p>Expired</p></card>
        </wml>
        "##;
    named.load_deck(named_xml).expect("deck should load");
    named
        .handle_key("enter".to_string())
        .expect("timer card should open");
    assert_eq!(named.next_timer_wakeup_ms(), None);
}

#[test]
fn wml_305_exit_stops_and_persists_named_timer_before_reentry() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(&timer_deck(
            r#"<timer name="remaining" value="5"/>"#,
            r##"<p><a href="#manual">Leave</a></p>"##,
        ))
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("timer card should open");
    engine
        .advance_time_ms(250)
        .expect("timer should advance deterministically");
    assert_eq!(engine.next_timer_wakeup_ms(), Some(250));

    engine
        .handle_key("enter".to_string())
        .expect("manual navigation should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "manual");
    assert_eq!(
        engine.get_var("remaining".to_string()).as_deref(),
        Some("3")
    );
    assert_eq!(engine.next_timer_wakeup_ms(), None);

    assert!(engine.navigate_back());
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    assert_eq!(engine.next_timer_wakeup_ms(), Some(300));
}

#[test]
fn wml_305_refresh_stops_updates_and_resumes_named_timer() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><a href="#timed">Start</a></card>
          <card id="timed">
            <onevent type="ontimer"><go href="#expired"/></onevent>
            <timer name="remaining" value="5"/>
            <do type="accept">
              <refresh><setvar name="remaining" value="4"/></refresh>
            </do>
            <p>Timed</p>
          </card>
          <card id="expired"><p>Expired</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("timer card should open");
    engine.advance_time_ms(200).expect("timer should advance");
    engine.clear_trace_entries();

    engine
        .handle_key("enter".to_string())
        .expect("refresh should succeed");

    assert_eq!(
        engine.get_var("remaining".to_string()).as_deref(),
        Some("4")
    );
    assert_eq!(engine.next_timer_wakeup_ms(), Some(400));
    assert_trace_kinds_subsequence(&engine, &["ACTION_REFRESH", "TIMER_STOP", "TIMER_START"]);
}

#[test]
fn wml_305_dispatches_only_when_positive_timer_transitions_to_zero() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(&timer_deck(
            r#"<timer name="remaining" value="1"/>"#,
            "<p>Timed</p>",
        ))
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("timer card should open");

    engine.advance_time_ms(99).expect("timer should advance");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    assert_eq!(engine.next_timer_wakeup_ms(), Some(1));
    engine.advance_time_ms(1).expect("timer should expire");
    assert_eq!(engine.active_card_id().expect("active card"), "expired");
    assert_eq!(
        engine.get_var("remaining".to_string()).as_deref(),
        Some("0")
    );
    assert_eq!(
        engine
            .trace_entries()
            .iter()
            .filter(|entry| entry.kind == "ACTION_ONTIMER")
            .count(),
        1
    );
}

#[test]
fn wml_305_go_starts_destination_timer_before_host_render_boundary() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(&timer_deck(r#"<timer value="1"/>"#, "<p>Timed</p>"))
        .expect("deck should load");
    engine.clear_trace_entries();

    engine
        .handle_key("enter".to_string())
        .expect("timer card should open");

    assert_eq!(engine.next_timer_wakeup_ms(), Some(100));
    engine.render().expect("destination should render");
    assert_trace_kinds_subsequence(&engine, &["ACTION_FRAGMENT", "TIMER_START"]);
}
