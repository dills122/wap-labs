use super::*;

#[test]
fn enter_triggers_accept_do_action_when_no_links_exist() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <do type="accept">
              <go href="script:calc.wmlsc#main"/>
            </do>
            <p>No focusable links on this card.</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.register_script_unit("calc.wmlsc".to_string(), vec![0x01, 2, 0x01, 3, 0x02, 0x00]);

    engine
        .handle_key("enter".to_string())
        .expect("enter should execute accept action script");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
}

#[test]
fn enter_accept_post_action_sets_external_navigation_post_context() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <do type="accept">
              <go method="post" href="/login">
                <postfield name="username" value="$(alias)"/>
                <postfield name="pin" value="0000"/>
              </go>
            </do>
            <p>Submit login.</p>
          </card>
        </wml>
        "##;
    engine
        .load_deck_context(xml, "wap://localhost/", "text/vnd.wap.wml", None)
        .expect("deck should load");
    assert!(engine.set_var("alias".to_string(), "alice".to_string()));

    engine
        .handle_key("enter".to_string())
        .expect("enter should emit post navigation intent");
    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("wap://localhost/login")
    );
    let policy = engine
        .external_navigation_request_policy()
        .expect("post action should emit request policy");
    assert_eq!(policy.referer_url.as_deref(), Some("wap://localhost/"));
    let post_context = policy
        .post_context
        .expect("post action should populate post context");
    assert_eq!(post_context.same_deck, Some(false));
    assert_eq!(
        post_context.content_type.as_deref(),
        Some("application/x-www-form-urlencoded")
    );
    assert_eq!(
        post_context.payload.as_deref(),
        Some("username=alice&pin=0000")
    );
}

#[test]
fn focused_input_commit_feeds_accept_postfield_payload_resolution() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
            <do type="accept">
              <go method="post" href="/login">
                <postfield name="username" value="$(UserName)"/>
              </go>
            </do>
          </card>
        </wml>
        "##;
    engine
        .load_deck_context(xml, "wap://localhost/", "text/vnd.wap.wml", None)
        .expect("deck should load");

    engine
        .begin_focused_input_edit()
        .expect("begin focused input edit should succeed");
    assert!(engine.set_focused_input_edit_draft("BOB".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("commit focused input should succeed"));

    let accept_action = engine
        .active_card_internal()
        .expect("active card")
        .accept_action
        .clone()
        .expect("accept action should exist");
    engine
        .execute_card_task_action(&accept_action)
        .expect("accept action execution should succeed");

    let policy = engine
        .external_navigation_request_policy()
        .expect("post action should emit request policy");
    let post_context = policy
        .post_context
        .expect("post action should populate post context");
    assert_eq!(post_context.payload.as_deref(), Some("username=BOB"));
}

#[test]
fn enter_on_input_with_accept_action_submits_post_context_payload() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
            <do type="accept">
              <go method="post" href="/login">
                <postfield name="username" value="$(UserName)"/>
              </go>
            </do>
          </card>
        </wml>
        "##;
    engine
        .load_deck_context(xml, "wap://localhost/", "text/vnd.wap.wml", None)
        .expect("deck should load");

    engine
        .begin_focused_input_edit()
        .expect("begin focused input edit should succeed");
    assert!(engine.set_focused_input_edit_draft("BOB".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("commit focused input should succeed"));

    engine
        .handle_key("enter".to_string())
        .expect("enter should submit accept action");
    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("wap://localhost/login")
    );
    let policy = engine
        .external_navigation_request_policy()
        .expect("post action should emit request policy");
    let post_context = policy
        .post_context
        .expect("post action should populate post context");
    assert_eq!(post_context.payload.as_deref(), Some("username=BOB"));
}

#[test]
fn enter_while_input_edit_active_commits_and_submits_accept_in_one_keypress() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
            <do type="accept">
              <go method="post" href="/login">
                <postfield name="username" value="$(UserName)"/>
              </go>
            </do>
          </card>
        </wml>
        "##;
    engine
        .load_deck_context(xml, "wap://localhost/", "text/vnd.wap.wml", None)
        .expect("deck should load");

    engine
        .begin_focused_input_edit()
        .expect("begin focused input edit should succeed");
    assert!(engine.set_focused_input_edit_draft("dylan".to_string()));

    engine
        .handle_key("enter".to_string())
        .expect("single enter should commit draft and submit accept action");

    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("wap://localhost/login")
    );
    assert_eq!(
        engine.get_var("UserName".to_string()),
        Some("dylan".to_string())
    );
    let policy = engine
        .external_navigation_request_policy()
        .expect("post action should emit request policy");
    let post_context = policy
        .post_context
        .expect("post action should populate post context");
    assert_eq!(post_context.payload.as_deref(), Some("username=dylan"));
}

#[test]
fn two_input_focus_move_and_submit_preserves_username_and_pin_payload() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="login">
            <p>User: <input name="username" value="" type="text"/></p>
            <p>PIN: <input name="pin" value="" type="password"/></p>
            <do type="accept">
              <go method="post" href="/login">
                <postfield name="username" value="$(username)"/>
                <postfield name="pin" value="$(pin)"/>
              </go>
            </do>
          </card>
        </wml>
        "##;
    engine
        .load_deck_context(xml, "wap://localhost/login", "text/vnd.wap.wml", None)
        .expect("deck should load");

    engine
        .begin_focused_input_edit()
        .expect("begin username edit should succeed");
    assert!(engine.set_focused_input_edit_draft("dylan".to_string()));
    engine
        .handle_key("down".to_string())
        .expect("moving to pin should commit username");

    engine
        .begin_focused_input_edit()
        .expect("begin pin edit should succeed");
    assert!(engine.set_focused_input_edit_draft("1234".to_string()));
    engine
        .handle_key("enter".to_string())
        .expect("enter should commit pin and submit accept");

    let policy = engine
        .external_navigation_request_policy()
        .expect("post action should emit request policy");
    let post_context = policy
        .post_context
        .expect("post action should populate post context");
    assert_eq!(
        post_context.payload.as_deref(),
        Some("username=dylan&pin=1234")
    );
}

#[test]
fn submit_uses_card_input_values_when_postfield_vars_are_unset() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="login">
            <p>User: <input name="username" value="usern1220" type="text"/></p>
            <p>PIN: <input name="pin" value="1220" type="password"/></p>
            <do type="accept">
              <go method="post" href="/login">
                <postfield name="username" value="$(username)"/>
                <postfield name="pin" value="$(pin)"/>
              </go>
            </do>
          </card>
        </wml>
        "##;
    engine
        .load_deck_context(xml, "wap://localhost/login", "text/vnd.wap.wml", None)
        .expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("enter should submit accept action");

    let policy = engine
        .external_navigation_request_policy()
        .expect("post action should emit request policy");
    let post_context = policy
        .post_context
        .expect("post action should populate post context");
    assert_eq!(
        post_context.payload.as_deref(),
        Some("username=usern1220&pin=1220")
    );
}

#[test]
fn enter_accept_prev_action_navigates_back_when_history_exists() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <do type="accept"><prev/></do>
            <p>Accept should trigger prev.</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");

    engine
        .handle_key("enter".to_string())
        .expect("accept prev should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    let traces = engine.trace_entries();
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_ACCEPT"));
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_PREV"));
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_BACK"));
}

#[test]
fn enter_accept_refresh_action_keeps_current_card_and_history() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <do type="accept"><refresh/></do>
            <p>Accept should refresh without navigation.</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);

    engine
        .handle_key("enter".to_string())
        .expect("accept refresh should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);
    let traces = engine.trace_entries();
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_ACCEPT"));
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_REFRESH"));
}

#[test]
fn enter_accept_noop_action_keeps_current_card_and_history() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <do type="accept"><noop/></do>
            <p>Accept should noop without navigation.</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("accept noop should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_NOOP"]);
}

#[test]
fn fixture_accept_go_trace_order_is_deterministic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_TASK_ACTION_ORDER)
        .expect("task-action fixture should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to accept-go");
    assert_eq!(engine.active_card_id().expect("active card"), "accept-go");

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("accept go should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "target");
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_FRAGMENT"]);
}

#[test]
fn fixture_accept_prev_trace_order_is_deterministic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_TASK_ACTION_ORDER)
        .expect("task-action fixture should load");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-prev link");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to accept-prev");
    assert_eq!(engine.active_card_id().expect("active card"), "accept-prev");

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("accept prev should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_trace_kinds_subsequence(
        &engine,
        &["KEY", "ACTION_ACCEPT", "ACTION_PREV", "ACTION_BACK"],
    );
}

#[test]
fn fixture_accept_refresh_trace_order_is_deterministic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_TASK_ACTION_ORDER)
        .expect("task-action fixture should load");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-prev link");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-refresh link");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to accept-refresh");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "accept-refresh"
    );

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("accept refresh should succeed");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "accept-refresh"
    );
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_REFRESH"]);
}

#[test]
fn fixture_accept_failure_rolls_back_and_trace_order_is_deterministic() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIXTURE_TASK_ACTION_ORDER)
        .expect("task-action fixture should load");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-prev link");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-refresh link");
    engine
        .handle_key("down".to_string())
        .expect("down should focus accept-broken link");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to accept-broken");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "accept-broken"
    );
    assert_eq!(engine.nav_stack.len(), 1);

    engine.clear_trace_entries();
    let err = engine
        .handle_key("enter".to_string())
        .expect_err("accept go #missing should fail");
    assert!(err.contains("Card id not found"));
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "accept-broken"
    );
    assert_eq!(engine.nav_stack.len(), 1);
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_ACCEPT", "ACTION_FRAGMENT"]);
}

#[test]
fn onenterforward_failure_rolls_back_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterforward"><go href="#missing"/></onevent>
            <p>Middle</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let err = engine
        .handle_key("enter".to_string())
        .expect_err("onenterforward failure should bubble");
    assert!(err.contains("Card id not found"));
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);
    assert!(engine.nav_stack.is_empty());
}

#[test]
fn onenterforward_noop_keeps_deterministic_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterforward"><noop/></onevent>
            <p>Middle</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine.clear_trace_entries();

    engine
        .handle_key("enter".to_string())
        .expect("onenterforward noop should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "mid");
    assert_eq!(engine.nav_stack.len(), 1);
    assert_trace_kinds_subsequence(&engine, &["KEY", "ACTION_FRAGMENT", "ACTION_NOOP"]);
}

#[test]
fn ontimer_zero_dispatches_immediately_on_card_entry() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="0"/>
            <onevent type="ontimer"><go href="#next"/></onevent>
            <p>Timed card</p>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("fragment nav should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_trace_kinds_subsequence(
        &engine,
        &[
            "ACTION_FRAGMENT",
            "TIMER_START",
            "ACTION_ONTIMER",
            "ACTION_FRAGMENT",
        ],
    );
}

#[test]
fn ontimer_failure_on_entry_rolls_back_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="0"/>
            <onevent type="ontimer"><go href="#missing"/></onevent>
            <p>Timed card</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let err = engine
        .handle_key("enter".to_string())
        .expect_err("ontimer missing fragment should fail");
    assert!(err.contains("Card id not found"));
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert!(engine.nav_stack.is_empty());
}

#[test]
fn timer_non_zero_expires_after_deterministic_advance() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="5"/>
            <onevent type="ontimer"><go href="#next"/></onevent>
            <p>Timed card</p>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("fragment nav should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");

    engine
        .advance_time_ms(400)
        .expect("advance should decrement timer");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    engine
        .advance_time_ms(100)
        .expect("advance should expire timer");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_trace_kinds_subsequence(
        &engine,
        &[
            "TIMER_START",
            "TIMER_TICK",
            "TIMER_TICK",
            "TIMER_EXPIRE",
            "ACTION_ONTIMER",
        ],
    );
}

#[test]
fn timer_large_single_tick_expires_once_for_host_coarse_clock() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="5"/>
            <onevent type="ontimer"><go href="#next"/></onevent>
            <p>Timed card</p>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("fragment nav should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");

    engine
        .advance_time_ms(5_000)
        .expect("coarse tick should expire timer");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    let expire_count_after_first_tick = engine
        .trace_entries()
        .iter()
        .filter(|entry| entry.kind == "TIMER_EXPIRE")
        .count();
    assert_eq!(expire_count_after_first_tick, 1);

    engine
        .advance_time_ms(5_000)
        .expect("further ticks after expiry should no-op");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    let expire_count_after_second_tick = engine
        .trace_entries()
        .iter()
        .filter(|entry| entry.kind == "TIMER_EXPIRE")
        .count();
    assert_eq!(expire_count_after_second_tick, 1);
}

#[test]
fn timer_stops_on_card_exit() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="10"/>
            <onevent type="ontimer"><go href="#timer-target"/></onevent>
            <a href="#manual-next">Manual next</a>
          </card>
          <card id="manual-next"><p>Manual next</p></card>
          <card id="timer-target"><p>Timer target</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to timed");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate to manual-next");
    assert_eq!(engine.active_card_id().expect("active card"), "manual-next");

    engine
        .advance_time_ms(5_000)
        .expect("advance with stopped timer should no-op");
    assert_eq!(engine.active_card_id().expect("active card"), "manual-next");
    assert!(
        !engine
            .trace_entries()
            .iter()
            .any(|entry| entry.kind == "ACTION_ONTIMER"
                && entry.active_card_id.as_deref() == Some("timer-target")),
        "timer should not fire after card exit"
    );
}

#[test]
fn timer_refresh_resumes_remaining_time() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#timed">To timed</a>
          </card>
          <card id="timed">
            <timer value="5"/>
            <onevent type="ontimer"><go href="#next"/></onevent>
            <do type="accept"><refresh/></do>
            <p>Refresh should resume timer.</p>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to timed");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");

    engine.advance_time_ms(300).expect("advance should work");
    engine
        .handle_key("enter".to_string())
        .expect("accept refresh should resume timer");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    engine.advance_time_ms(100).expect("advance should work");
    assert_eq!(engine.active_card_id().expect("active card"), "timed");
    engine
        .advance_time_ms(100)
        .expect("remaining timer should expire");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_trace_kinds_subsequence(
        &engine,
        &[
            "TIMER_START",
            "TIMER_TICK",
            "ACTION_ACCEPT",
            "ACTION_REFRESH",
            "TIMER_RESUME",
            "TIMER_TICK",
            "TIMER_TICK",
            "TIMER_EXPIRE",
            "ACTION_ONTIMER",
        ],
    );
}

#[test]
fn navigate_runs_onenterforward_action() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterforward">
              <go href="#next"/>
            </onevent>
            <p>Middle</p>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate and run onenterforward");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
}

#[test]
fn navigate_back_runs_onenterbackward_action() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterbackward">
              <go href="#rewind"/>
            </onevent>
            <a href="#next">To next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
          <card id="rewind">
            <p>Rewind</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    engine
        .handle_key("enter".to_string())
        .expect("middle enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");

    let handled = engine.navigate_back();
    assert!(handled, "back should pop existing history entry");
    assert_eq!(engine.active_card_id().expect("active card"), "rewind");
    let traces = engine.trace_entries();
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_BACK"));
    assert!(traces
        .iter()
        .any(|entry| entry.kind == "ACTION_FRAGMENT" && entry.detail == "rewind"));
}

#[test]
fn navigate_back_runs_onenterbackward_prev_action() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterbackward"><prev/></onevent>
            <a href="#next">To next</a>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    engine
        .handle_key("enter".to_string())
        .expect("middle enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");

    assert!(engine.navigate_back(), "back should pop next -> mid");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "home",
        "mid onenterbackward prev should immediately rewind one more entry"
    );
}

#[test]
fn onenterbackward_failure_rolls_back_back_navigation_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterbackward"><go href="#missing"/></onevent>
            <a href="#next">To next</a>
          </card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    engine
        .handle_key("enter".to_string())
        .expect("middle enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(engine.nav_stack.len(), 2);

    let handled = engine.navigate_back();
    assert!(handled, "back should report handled when history exists");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "next",
        "failed onenterbackward action should roll back back-navigation state"
    );
    assert_eq!(engine.nav_stack.len(), 2);
    let traces = engine.trace_entries();
    assert!(traces
        .iter()
        .any(|entry| entry.kind == "ACTION_ONENTERBACKWARD_ERROR"));
}

#[test]
fn navigate_back_runs_onenterbackward_script_action() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <onevent type="onenterbackward">
              <go href="script:nav.wmlsc#main"/>
            </onevent>
            <a href="#next">To next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
          <card id="rewind">
            <p>Rewind</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "#rewind");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #rewind
    unit.push(0x00); // halt
    engine.register_script_unit("nav.wmlsc".to_string(), unit);

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to middle");
    engine
        .handle_key("enter".to_string())
        .expect("middle enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");

    let handled = engine.navigate_back();
    assert!(handled, "back should pop existing history entry");
    assert_eq!(engine.active_card_id().expect("active card"), "rewind");
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
    let traces = engine.trace_entries();
    assert!(traces
        .iter()
        .any(|entry| entry.kind == "ACTION_SCRIPT" && entry.detail == "nav.wmlsc#main"));
    assert!(traces.iter().any(
        |entry| entry.kind == "SCRIPT_OK" && entry.active_card_id.as_deref() == Some("rewind")
    ));
}

#[test]
fn navigate_back_onenterbackward_script_navigation_last_call_wins() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid-go-prev">Flow A</a>
            <a href="#mid-prev-go">Flow B</a>
          </card>
          <card id="mid-go-prev">
            <onevent type="onenterbackward">
              <go href="script:nav.wmlsc#goThenPrev"/>
            </onevent>
            <a href="#next-a">To next-a</a>
          </card>
          <card id="mid-prev-go">
            <onevent type="onenterbackward">
              <go href="script:nav.wmlsc#prevThenGo"/>
            </onevent>
            <a href="#next-b">To next-b</a>
          </card>
          <card id="next-a"><p>Next A</p></card>
          <card id="next-b"><p>Next B</p></card>
          <card id="rewind"><p>Rewind</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    let go_then_prev_pc = unit.len();
    push_string(&mut unit, "#rewind");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #rewind
    unit.push(0x20);
    unit.push(0x04);
    unit.push(0x00); // prev
    unit.push(0x00); // halt
    let prev_then_go_pc = unit.len();
    unit.push(0x20);
    unit.push(0x04);
    unit.push(0x00); // prev
    push_string(&mut unit, "#rewind");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #rewind
    unit.push(0x00); // halt
    engine.register_script_unit("nav.wmlsc".to_string(), unit);
    engine.register_script_entry_point(
        "nav.wmlsc".to_string(),
        "goThenPrev".to_string(),
        go_then_prev_pc,
    );
    engine.register_script_entry_point(
        "nav.wmlsc".to_string(),
        "prevThenGo".to_string(),
        prev_then_go_pc,
    );

    engine
        .handle_key("enter".to_string())
        .expect("flow A should enter mid-go-prev");
    engine
        .handle_key("enter".to_string())
        .expect("flow A should enter next-a");
    assert_eq!(engine.active_card_id().expect("active card"), "next-a");
    assert!(engine.navigate_back(), "flow A back should be handled");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "home",
        "goThenPrev should resolve to prev at invocation boundary"
    );

    engine
        .handle_key("down".to_string())
        .expect("move focus to flow B link");
    engine
        .handle_key("enter".to_string())
        .expect("flow B should enter mid-prev-go");
    engine
        .handle_key("enter".to_string())
        .expect("flow B should enter next-b");
    assert_eq!(engine.active_card_id().expect("active card"), "next-b");
    assert!(engine.navigate_back(), "flow B back should be handled");
    assert_eq!(
        engine.active_card_id().expect("active card"),
        "rewind",
        "prevThenGo should resolve to go at invocation boundary"
    );
}

#[test]
fn navigate_back_restores_previous_card() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate");
    assert_eq!(engine.active_card_id().expect("active card"), "next");

    let handled = engine.navigate_back();
    assert!(handled, "back should pop existing history entry");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.focused_link_index(), 0);
}

#[test]
fn navigate_back_returns_false_when_history_empty() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
        )
        .expect("deck should load");

    let handled = engine.navigate_back();
    assert!(!handled, "back should report false with empty history");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}
