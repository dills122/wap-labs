use super::*;

#[test]
fn enter_navigates_to_fragment_card() {
    let mut engine = WmlEngine::new();
    engine.load_deck(SAMPLE).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should succeed");

    assert_eq!(
        engine.active_card_id().expect("active card should exist"),
        "next"
    );
}

#[test]
fn load_deck_returns_structured_error_for_invalid_root() {
    let mut engine = WmlEngine::new();
    let msg = engine
        .load_deck("<card id=\"home\"><p>Hello</p></card>")
        .expect_err("missing wml root must fail");
    assert!(msg.contains("<wml>"), "unexpected error message: {msg}");
}

#[test]
fn load_deck_rejects_excessive_nested_markup_depth() {
    let mut engine = WmlEngine::new();
    let depth = 200usize;
    let wrappers = "<x>".repeat(depth);
    let closes = "</x>".repeat(depth);
    let xml = format!("<wml><card id=\"home\">{wrappers}<p>deep</p>{closes}</card></wml>");

    let err = engine
        .load_deck(&xml)
        .expect_err("excessive nesting must fail deterministically");
    assert!(
        err.contains("Parse limit exceeded: nesting depth"),
        "unexpected error message: {err}"
    );
}

#[test]
fn load_deck_accepts_unknown_tags() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <experimental>
            <ignored/>
          </experimental>
          <card id="home">
            <p>Hello</p>
          </card>
        </wml>
        "#;

    engine
        .load_deck(xml)
        .expect("unknown tags should be ignored, not rejected");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}

#[test]
fn down_enter_fragment_navigation_resets_focus() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Next</a>
            <a href="#third">Third</a>
          </card>
          <card id="next">
            <p>Second</p>
          </card>
          <card id="third">
            <p>Third</p>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("down".to_string())
        .expect("down should succeed");
    assert_eq!(engine.focused_link_index(), 1);
    engine
        .handle_key("enter".to_string())
        .expect("enter should navigate");

    assert_eq!(engine.active_card_id().expect("active card"), "third");
    assert_eq!(engine.focused_link_index(), 0);
}

#[test]
fn enter_normalizes_out_of_range_focus_for_external_link_cards() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="http://example.test/one.wml">One</a>
            <a href="http://example.test/two.wml">Two</a>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine.focused_link_idx = 99;

    engine
        .handle_key_internal("enter")
        .expect("enter should resolve focused external link");

    assert_eq!(engine.focused_link_idx, 1);
    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://example.test/two.wml".to_string())
    );
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("focused=true:href=http://example.test/two.wml:text=Two")));
}

#[test]
fn missing_fragment_returns_error_and_preserves_state() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#missing">Broken</a>
          </card>
          <card id="next">
            <p>Second</p>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    let err = engine
        .handle_key_internal("enter")
        .expect_err("missing fragment should return error");
    assert!(
        err.contains("Card id not found"),
        "unexpected error message: {err}"
    );
    assert_eq!(engine.active_card_idx, 0);
    assert_eq!(engine.focused_link_idx, 0);
    assert!(engine.nav_stack.is_empty());
}

#[test]
fn field_example_01_loads_and_fragment_navigation_works() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(FIELD_EXAMPLE_01)
        .expect("field fixture should load");
    assert_eq!(engine.active_card_id().expect("active card"), "main");

    engine
        .handle_key("enter".to_string())
        .expect("enter should move to #content");
    assert_eq!(engine.active_card_id().expect("active card"), "content");
    assert_eq!(engine.external_navigation_intent(), None);
}

#[test]
fn enter_on_external_link_sets_intent_without_mutating_card() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="next.wml?foo=1">Load</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;

    engine
        .load_deck_context(
            xml,
            "http://local.test/dir/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");

    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://local.test/dir/next.wml?foo=1".to_string())
    );
    assert!(engine.nav_stack.is_empty());
}

#[test]
fn clear_external_navigation_intent_removes_intent() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="https://example.org/path">Load</a>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");
    assert_eq!(
        engine.external_navigation_intent(),
        Some("https://example.org/path".to_string())
    );

    engine.clear_external_navigation_intent();
    assert_eq!(engine.external_navigation_intent(), None);
}

#[test]
fn enter_on_focused_input_does_not_trigger_navigation_intent() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: AHMED]")));

    engine
        .handle_key("enter".to_string())
        .expect("input enter should be handled");
    assert_eq!(engine.external_navigation_intent(), None);
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}

#[test]
fn focused_input_edit_commit_updates_render_and_runtime_var() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should start input edit");
    assert_eq!(
        engine.focused_input_edit_name(),
        Some("UserName".to_string())
    );
    assert_eq!(engine.focused_input_edit_value(), Some("AHMED".to_string()));

    assert!(engine.set_focused_input_edit_draft("BOB".to_string()));
    let pending_lines = render_snapshot_lines(&engine);
    assert!(pending_lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: BOB]")));

    assert!(engine
        .commit_focused_input_edit()
        .expect("commit should succeed"));
    assert_eq!(engine.focused_input_edit_name(), None);
    assert_eq!(
        engine.get_var("UserName".to_string()),
        Some("BOB".to_string())
    );
    let committed_lines = render_snapshot_lines(&engine);
    assert!(committed_lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: BOB]")));
}

#[test]
fn focused_input_edit_cancel_keeps_original_value() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="UserName" value="AHMED" type="text"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_input_edit()
        .expect("begin edit should return result");
    assert!(engine.set_focused_input_edit_draft("BOB".to_string()));
    assert!(engine.cancel_focused_input_edit());
    assert_eq!(engine.focused_input_edit_name(), None);
    assert_eq!(
        engine.get_var("UserName".to_string()),
        Some("AHMED".to_string())
    );
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: AHMED]")));
}

#[test]
fn wml_fx_input_maxlength_limits_draft_and_committed_value() {
    // WML-CL-INPUT-MAXLENGTH / WAP-191_104-WML section 11.6.3.
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="pin" value="" type="text" maxlength="4"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_input_edit()
        .expect("begin edit should return result");
    assert!(engine.set_focused_input_edit_draft("123456".to_string()));
    assert_eq!(engine.focused_input_edit_value(), Some("1234".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("truncated draft should commit"));
    assert_eq!(engine.get_var("pin".to_string()), Some("1234".to_string()));
}

#[test]
fn wml_fx_input_mask_commit_preserves_literals_and_rejection_is_atomic() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="Phone" value="12345-123" format="NNNNN\-3N"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    assert!(engine.set_var("Phone".to_string(), "12345-123".to_string()));
    engine
        .begin_focused_input_edit()
        .expect("begin edit should succeed");
    assert!(engine.set_focused_input_edit_draft("54321987".to_string()));
    let err = engine
        .commit_focused_input_edit()
        .expect_err("value without the mask literal must be rejected");
    assert_eq!(
        err,
        "Input 'Phone' rejected: value does not conform to format mask"
    );
    assert_eq!(
        engine.get_var("Phone".to_string()),
        Some("12345-123".to_string())
    );
    assert_eq!(
        engine.focused_input_edit_value(),
        Some("54321987".to_string())
    );
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("href=input:Phone:text=[Phone: 54321987]")));

    assert!(engine.set_focused_input_edit_draft("54321-987".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("corrected value should commit"));
    assert_eq!(
        engine.get_var("Phone".to_string()),
        Some("54321-987".to_string())
    );
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("href=input:Phone:text=[Phone: 54321-987]")));
}

#[test]
fn wml_fx_input_empty_commit_applies_format_and_emptyok_precedence() {
    let cases = [
        ("format-required", r#"format="N""#, false),
        ("format-allows-empty", r#"format="*N""#, true),
        (
            "explicitly-allows-empty",
            r#"format="N" emptyok="true""#,
            true,
        ),
        (
            "explicitly-requires-input",
            r#"format="*N" emptyok="false""#,
            false,
        ),
        ("implied-default-mask", "", true),
    ];

    for (name, attrs, accepts_empty) in cases {
        let mut engine = WmlEngine::new();
        let xml =
            format!(r#"<wml><card id="home"><input name="Value" value="7" {attrs}/></card></wml>"#);
        engine.load_deck(&xml).expect("deck should load");
        engine
            .begin_focused_input_edit()
            .expect("begin edit should succeed");
        assert!(engine.set_focused_input_edit_draft(String::new()));
        let result = engine.commit_focused_input_edit();

        if accepts_empty {
            assert_eq!(result, Ok(true), "case {name}");
            assert_eq!(
                engine.get_var("Value".to_string()),
                Some(String::new()),
                "case {name}"
            );
            assert_eq!(engine.focused_input_edit_name(), None, "case {name}");
        } else {
            assert_eq!(
                result,
                Err("Input 'Value' rejected: empty value is not allowed".to_string()),
                "case {name}"
            );
            assert_eq!(
                engine.get_var("Value".to_string()),
                Some("7".to_string()),
                "case {name}"
            );
            assert_eq!(
                engine.focused_input_edit_value(),
                Some(String::new()),
                "case {name}"
            );
        }
    }
}

#[test]
fn invalid_input_format_is_ignored_in_favor_of_default_mask() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(r#"<wml><card id="home"><input name="Value" value="" format="*"/></card></wml>"#)
        .expect("invalid format is ignored rather than rejecting the deck");
    engine
        .begin_focused_input_edit()
        .expect("begin edit should succeed");
    assert!(engine.set_focused_input_edit_draft("Any value 42!".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("default mask should accept general text"));
    assert_eq!(
        engine.get_var("Value".to_string()),
        Some("Any value 42!".to_string())
    );
}

#[test]
fn wml_fx_input_initialization_prefers_existing_valid_name_value() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r##"
            <wml>
              <card id="home"><a href="#form">Form</a></card>
              <card id="form"><input name="Pin" value="1234" format="4N"/></card>
            </wml>
            "##,
        )
        .expect("deck should load");
    assert!(engine.set_var("Pin".to_string(), "4321".to_string()));

    engine
        .navigate_to_card("form".to_string())
        .expect("form card should initialize");

    assert_eq!(engine.get_var("Pin".to_string()), Some("4321".to_string()));
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("href=input:Pin:text=[Pin: 4321]")));
}

#[test]
fn wml_fx_input_invalid_initial_value_unsets_name_and_uses_valid_default() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r##"
            <wml>
              <card id="home"><a href="#form">Form</a></card>
              <card id="form"><input name="Pin" value="1234" format="4N"/></card>
            </wml>
            "##,
        )
        .expect("deck should load");
    assert!(engine.set_var("Pin".to_string(), "abcd".to_string()));

    engine
        .navigate_to_card("form".to_string())
        .expect("form card should initialize");

    assert_eq!(engine.get_var("Pin".to_string()), Some("1234".to_string()));
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("href=input:Pin:text=[Pin: 1234]")));
}

#[test]
fn wml_fx_input_initialization_evaluates_vdata_default_in_document_order() {
    // WML-CL-INPUT-INITIALIZATION / WAP-191_104-WML section 11.6.3.
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml>
              <card id="form">
                <input name="DefaultPin" value="4321" format="4N"/>
                <input name="Pin" value="$(DefaultPin)" format="4N"/>
              </card>
            </wml>
            "#,
        )
        .expect("deck should load");

    assert_eq!(engine.get_var("Pin".to_string()), Some("4321".to_string()));
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("href=input:Pin:text=[Pin: 4321]")));
}

#[test]
fn invalid_input_default_leaves_variable_unset_and_control_empty() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"<wml><card id="form"><input name="Pin" value="abcd" format="4N"/></card></wml>"#,
        )
        .expect("deck should load with invalid default ignored");

    assert_eq!(engine.get_var("Pin".to_string()), None);
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("href=input:Pin:text=[Pin: ]")));
}

#[test]
fn wml_fx_input_password_display_conceals_entry_and_preserves_variable() {
    // WML-CL-INPUT-PASSWORD-DISPLAY and WML-CL-INPUT-FORMAT-LITERALS,
    // WAP-191_104-WML section 11.6.3.
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml>
              <card id="form">
                <input
                  name="PhonePin"
                  type="password"
                  value="12345-123"
                  format="NNNNN\-3N"
                />
              </card>
            </wml>
            "#,
        )
        .expect("deck should load");

    engine.set_viewport_cols(80).expect("valid viewport");
    assert_eq!(
        engine.get_var("PhonePin".to_string()),
        Some("12345-123".to_string())
    );
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:PhonePin:text=[PhonePin: *****-***]")));
    assert!(lines.iter().all(|line| !line.contains("12345-123")));
}

#[test]
fn input_initialization_runs_in_document_order() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml>
              <card id="form">
                <input name="Shared" value="12" format="2N"/>
                <input name="Shared" value="AB" format="2A"/>
                <input name="Shared" value="34" format="2N"/>
              </card>
            </wml>
            "#,
        )
        .expect("deck should load");

    assert_eq!(engine.get_var("Shared".to_string()), Some("34".to_string()));
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:Shared:text=[Shared: 12]")));
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:Shared#2:text=[Shared: AB]")));
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:Shared#3:text=[Shared: 34]")));
}

#[test]
fn wml_204_input_vdata_conversions_preserve_source_variable() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r##"
            <wml>
              <card id="start"><a href="#form">Form</a></card>
              <card id="form">
                <input name="DefaultNoesc" value="$(Raw)"/>
                <input name="ExplicitNoesc" value="$(Raw:noesc)"/>
                <input name="Escaped" value="$(Raw:escape)"/>
                <input name="Unescaped" value="$(Encoded:unesc)"/>
                <input name="EntityFirst" value="&#36;(Raw:escape)"/>
                <input name="LiteralDollar" value="$$(Raw)"/>
                <input name="Undefined" value="pre$(Missing)post"/>
                <input name="CaseSensitive" value="$(raw)"/>
              </card>
            </wml>
            "##,
        )
        .expect("deck should load");
    let raw = "A B/C?D=E&F";
    let escaped = "A%20B%2FC%3FD%3DE%26F";
    assert!(engine.set_var("Raw".to_string(), raw.to_string()));
    assert!(engine.set_var("Encoded".to_string(), escaped.to_string()));

    engine
        .navigate_to_card("form".to_string())
        .expect("form controls should initialize");

    assert_eq!(
        engine.get_var("DefaultNoesc".to_string()).as_deref(),
        Some(raw)
    );
    assert_eq!(
        engine.get_var("ExplicitNoesc".to_string()).as_deref(),
        Some(raw)
    );
    assert_eq!(
        engine.get_var("Escaped".to_string()).as_deref(),
        Some(escaped)
    );
    assert_eq!(
        engine.get_var("Unescaped".to_string()).as_deref(),
        Some(raw)
    );
    assert_eq!(
        engine.get_var("EntityFirst".to_string()).as_deref(),
        Some(escaped)
    );
    assert_eq!(
        engine.get_var("LiteralDollar".to_string()).as_deref(),
        Some("$(Raw)")
    );
    assert_eq!(
        engine.get_var("Undefined".to_string()).as_deref(),
        Some("prepost")
    );
    assert_eq!(
        engine.get_var("CaseSensitive".to_string()).as_deref(),
        Some("")
    );
    assert_eq!(engine.get_var("Raw".to_string()).as_deref(), Some(raw));
    assert_eq!(
        engine.get_var("Encoded".to_string()).as_deref(),
        Some(escaped)
    );
}

#[test]
fn wml_204_input_vdata_preserves_exact_cdata() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"<wml><card id="form"><input name="Exact" value="  leading  middle   trailing  "/></card></wml>"#,
        )
        .expect("deck should load");

    assert_eq!(
        engine.get_var("Exact".to_string()).as_deref(),
        Some("  leading  middle   trailing  ")
    );
}

#[test]
fn wml_204_same_name_inputs_keep_independent_control_state() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml><card id="home">
              <input name="Shared" value="first"/>
              <input name="Shared" value="second"/>
            </card></wml>
            "#,
        )
        .expect("deck should load");
    engine.set_viewport_cols(80).expect("valid viewport");
    engine
        .handle_key("down".to_string())
        .expect("focus should move to the second input");
    assert!(engine
        .begin_focused_input_edit()
        .expect("second input edit should begin"));
    assert!(engine.set_focused_input_edit_draft("changed".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("second input should commit"));

    let lines = render_snapshot_lines(&engine);
    let first = lines
        .iter()
        .position(|line| line.contains("[Shared: first]"))
        .expect("first input should retain its displayed value");
    let changed = lines
        .iter()
        .position(|line| line.contains("[Shared: changed]"))
        .expect("second input should display its committed value");
    assert!(first < changed, "the later focused control must be updated");
    assert_eq!(
        engine.get_var("Shared".to_string()).as_deref(),
        Some("changed")
    );
}

#[test]
fn select_control_renders_first_option_by_default() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <select name="Country" title="Country">
              <option value="Jordan">Jordan</option>
              <option value="France">France</option>
              <option value="Germany">Germany</option>
            </select>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=select:Country:text=[Country: Jordan]")));
}

#[test]
fn wml_204_control_validation_simulator_example_loads_and_renders() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(WML_204_CONTROL_VALIDATION_EXAMPLE)
        .expect("WML-204 simulator example should load");

    assert_eq!(engine.active_card_id().expect("active card"), "controls");
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:UserName:text=[UserName: AHMED]")));
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:Pin:text=[Pin: ****]")));
    assert!(lines
        .iter()
        .any(|line| line.contains("href=select:Country:text=[Country: Jordan]")));
}

#[test]
fn focused_select_edit_cycle_commit_updates_render_and_runtime_var() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <select name="Country" title="Country">
              <option value="Jordan">Jordan</option>
              <option value="France">France</option>
              <option value="Germany">Germany</option>
            </select>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("enter should start select edit");
    assert_eq!(
        engine.focused_select_edit_name(),
        Some("Country".to_string())
    );
    assert_eq!(
        engine.focused_select_edit_value(),
        Some("Jordan".to_string())
    );

    engine
        .handle_key("down".to_string())
        .expect("down should cycle");
    assert_eq!(
        engine.focused_select_edit_value(),
        Some("France".to_string())
    );
    let pending_lines = render_snapshot_lines(&engine);
    assert!(pending_lines
        .iter()
        .any(|line| line.contains("href=select:Country:text=[Country: France]")));

    engine
        .commit_focused_select_edit()
        .expect("commit should succeed");
    assert_eq!(engine.focused_select_edit_name(), None);
    assert_eq!(
        engine.get_var("Country".to_string()),
        Some("France".to_string())
    );
    let committed_lines = render_snapshot_lines(&engine);
    assert!(committed_lines
        .iter()
        .any(|line| line.contains("href=select:Country:text=[Country: France]")));
}

#[test]
fn focused_select_edit_cancel_keeps_original_value() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <select name="Country" title="Country">
              <option value="Jordan">Jordan</option>
              <option value="France">France</option>
            </select>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_select_edit()
        .expect("begin edit should return result");
    assert!(engine.move_focused_select_edit(1));
    assert_eq!(
        engine.focused_select_edit_value(),
        Some("France".to_string())
    );
    assert!(engine.cancel_focused_select_edit());
    assert_eq!(engine.focused_select_edit_name(), None);
    assert_eq!(
        engine.get_var("Country".to_string()),
        Some("Jordan".to_string())
    );
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=select:Country:text=[Country: Jordan]")));
}

#[test]
fn moving_focus_down_exits_current_edit_and_allows_editing_next_input() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home">
            <input name="username" value="AHMED" type="text"/>
            <input name="pin" value="" type="password"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_input_edit()
        .expect("begin edit should return result");
    assert_eq!(
        engine.focused_input_edit_name(),
        Some("username".to_string())
    );
    assert!(engine.set_focused_input_edit_draft("dylan".to_string()));
    engine
        .handle_key("down".to_string())
        .expect("down should commit username edit and move focus");
    assert_eq!(engine.focused_input_edit_name(), None);
    assert_eq!(
        engine.get_var("username".to_string()),
        Some("dylan".to_string())
    );

    engine
        .begin_focused_input_edit()
        .expect("begin pin edit should return result");
    assert_eq!(engine.focused_input_edit_name(), Some("pin".to_string()));
    assert!(engine.set_focused_input_edit_draft("1234".to_string()));
    assert!(engine
        .commit_focused_input_edit()
        .expect("pin commit should succeed"));
    assert_eq!(engine.get_var("pin".to_string()), Some("1234".to_string()));
}

#[test]
fn external_navigation_query_only_uses_base_document() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="?q=1">Query</a>
          </card>
        </wml>
        "##;

    engine
        .load_deck_context(
            xml,
            "http://local.test/dir/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://local.test/dir/start.wml?q=1".to_string())
    );
}

#[test]
fn external_navigation_parent_segment_resolves() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="../next.wml">Parent</a>
          </card>
        </wml>
        "##;

    engine
        .load_deck_context(
            xml,
            "http://local.test/dir/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://local.test/next.wml".to_string())
    );
}

#[test]
fn external_navigation_scheme_relative_inherits_base_scheme() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="//cdn.example.org/deck.wml">CDN</a>
          </card>
        </wml>
        "##;

    engine
        .load_deck_context(
            xml,
            "http://local.test/dir/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("external enter should succeed");

    assert_eq!(
        engine.external_navigation_intent(),
        Some("http://cdn.example.org/deck.wml".to_string())
    );
}

#[test]
fn load_deck_sets_default_metadata_values() {
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

    assert_eq!(engine.base_url(), "");
    assert_eq!(engine.content_type(), "text/vnd.wap.wml");
}

#[test]
fn load_deck_context_overrides_metadata_values() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck_context(
            r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#,
            "http://local.test/path/start.wml",
            "application/vnd.wap.wmlc",
            Some("AQID".to_string()),
        )
        .expect("deck should load");

    assert_eq!(engine.base_url(), "http://local.test/path/start.wml");
    assert_eq!(engine.content_type(), "application/vnd.wap.wmlc");
}

#[test]
fn load_deck_context_rejects_oversized_wml_payload() {
    let mut engine = WmlEngine::new();
    let inner = "a".repeat(MAX_DECK_WML_XML_BYTES + 1);
    let xml = format!("<wml><card id=\"home\"><p>{inner}</p></card></wml>");

    let err = engine
        .load_deck_context(
            &xml,
            "http://local.test/start.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect_err("oversized deck should be rejected");
    assert!(
        err.contains("Deck payload exceeds"),
        "unexpected error message: {err}"
    );
}

#[test]
fn load_deck_context_rejects_oversized_raw_payload() {
    let mut engine = WmlEngine::new();
    let raw = "A".repeat(MAX_DECK_RAW_BYTES_BASE64_BYTES + 1);

    let err = engine
        .load_deck_context(
            "<wml><card id=\"home\"><p>ok</p></card></wml>",
            "http://local.test/start.wml",
            "application/vnd.wap.wmlc",
            Some(raw),
        )
        .expect_err("oversized raw payload should be rejected");
    assert!(
        err.contains("Raw deck payload exceeds"),
        "unexpected error message: {err}"
    );
}

#[test]
fn load_deck_compat_path_resets_metadata_to_defaults() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "#;
    engine
        .load_deck_context(
            xml,
            "http://local.test/path/start.wml",
            "application/vnd.wap.wmlc",
            Some("AQID".to_string()),
        )
        .expect("deck should load");
    assert_eq!(engine.base_url(), "http://local.test/path/start.wml");
    assert_eq!(engine.content_type(), "application/vnd.wap.wmlc");

    engine
        .load_deck(xml)
        .expect("loadDeck should remain functional");
    assert_eq!(engine.base_url(), "");
    assert_eq!(engine.content_type(), "text/vnd.wap.wml");
}
