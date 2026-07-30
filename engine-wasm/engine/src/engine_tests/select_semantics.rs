use super::*;

#[test]
fn wml_fx_select_init_order_precedence_validation_and_serialization() {
    // WML-CL-SELECT-INIT-ORDER, WML-CL-SELECT-DEFAULT-PRECEDENCE,
    // WML-CL-SELECT-INDEX-VALIDATION, WML-CL-SELECT-VARIABLE-INITIALIZATION,
    // WML-CL-SELECT-PRESELECTION, and WML-CL-SELECT-MULTI-SERIALIZATION.
    // WAP-191_104-WML section 11.6.2.1.
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="start">
            <p>Start</p>
          </card>
          <card id="controls">
            <input name="default_index" value="3;2"/>
            <select
              name="choices"
              iname="choice-indexes"
              value="fallback"
              ivalue="$(default_index)"
              multiple="true"
              title="Choices"
            >
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
              <option value="gamma">Gamma</option>
            </select>
            <select
              name="ordered-choices"
              iname="ordered-indexes"
              ivalue="$(default_index)"
              multiple="true"
            >
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
              <option value="gamma">Gamma</option>
            </select>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    assert!(engine.set_var("choice-indexes".to_string(), "bad;2;2;8;1".to_string()));
    assert!(engine.set_var("choices".to_string(), "gamma".to_string()));
    engine
        .navigate_to_card("controls".to_string())
        .expect("controls should initialize");

    assert_eq!(
        engine.get_var("choice-indexes".to_string()),
        Some("2;1".to_string())
    );
    assert_eq!(
        engine.get_var("choices".to_string()),
        Some("beta;alpha".to_string())
    );
    assert_eq!(
        engine.get_var("ordered-indexes".to_string()),
        Some("3;2".to_string())
    );
    assert_eq!(
        engine.get_var("ordered-choices".to_string()),
        Some("gamma;beta".to_string())
    );

    engine.set_viewport_cols(80).expect("valid viewport");
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=select:choices:text=[Choices: Beta; Alpha]")));
}

#[test]
fn wml_fx_select_value_and_ivalue_references_are_evaluated_before_assignment() {
    // WML-CL-OPTION-VALUE-EVALUATION and WML-CL-SELECT-DEFAULT-PRECEDENCE,
    // WAP-191_104-WML sections 11.6.2.1-11.6.2.2.
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="start"><p>Start</p></card>
          <card id="controls">
            <select
              name="values"
              iname="indexes"
              ivalue="$(initial_indexes)"
              multiple="true"
            >
              <option value="$(shared_value)">First</option>
              <option value="$(shared_value)">Second</option>
              <option value="">Empty</option>
            </select>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    assert!(engine.set_var("initial_indexes".to_string(), "1;2;3".to_string()));
    assert!(engine.set_var("shared_value".to_string(), "duplicate".to_string()));
    engine
        .navigate_to_card("controls".to_string())
        .expect("controls should initialize");

    assert_eq!(
        engine.get_var("indexes".to_string()),
        Some("1;2;3".to_string())
    );
    assert_eq!(
        engine.get_var("values".to_string()),
        Some("duplicate;duplicate".to_string())
    );
}

#[test]
fn wml_204_control_initialization_interleaves_selects_and_inputs_in_document_order() {
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="start"><p>Start</p></card>
          <card id="controls">
            <select name="BeforeInput" value="$(Later)">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
            <input name="Later" value="beta"/>
            <select name="Selected" value="beta">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
            <input name="Copied" value="$(Selected)"/>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    engine
        .navigate_to_card("controls".to_string())
        .expect("controls should initialize in source order");

    assert_eq!(
        engine.get_var("BeforeInput".to_string()).as_deref(),
        Some("alpha")
    );
    assert_eq!(engine.get_var("Later".to_string()).as_deref(), Some("beta"));
    assert_eq!(
        engine.get_var("Selected".to_string()).as_deref(),
        Some("beta")
    );
    assert_eq!(
        engine.get_var("Copied".to_string()).as_deref(),
        Some("beta")
    );
}

#[test]
fn wml_204_absent_option_value_is_empty_while_label_remains_visible() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml>
              <card id="home">
                <select name="Choice" iname="ChoiceIndex" ivalue="1">
                  <option>Visible label</option>
                </select>
              </card>
            </wml>
            "#,
        )
        .expect("deck should load");

    assert_eq!(engine.get_var("Choice".to_string()), None);
    assert_eq!(
        engine.get_var("ChoiceIndex".to_string()).as_deref(),
        Some("1")
    );
    engine.set_viewport_cols(80).expect("valid viewport");
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("href=select:Choice:text=[Choice: Visible label]")));
}

#[test]
fn wml_204_option_vdata_preserves_exact_cdata() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml>
              <card id="home">
                <select name="ExactChoice" iname="ExactIndex" ivalue="1">
                  <option value="  leading  middle   trailing  ">Exact label</option>
                </select>
              </card>
            </wml>
            "#,
        )
        .expect("deck should load");

    assert_eq!(
        engine.get_var("ExactChoice".to_string()).as_deref(),
        Some("  leading  middle   trailing  ")
    );
}

#[test]
fn wml_204_option_vdata_defaults_to_noesc_and_href_defaults_to_escape() {
    let mut engine = WmlEngine::new();
    let raw = "A B/C?D=E&F";
    engine
        .load_deck_context(
            r##"
            <wml>
              <card id="start"><a href="#controls">Controls</a></card>
              <card id="controls">
                <select name="Choice">
                  <option value="$(Raw)" onpick="/choose/$(Raw)">Choose raw value</option>
                </select>
              </card>
            </wml>
            "##,
            "https://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");
    assert!(engine.set_var("Raw".to_string(), raw.to_string()));
    engine
        .navigate_to_card("controls".to_string())
        .expect("controls should initialize");

    assert_eq!(engine.get_var("Choice".to_string()).as_deref(), Some(raw));
    engine
        .begin_focused_select_edit()
        .expect("select edit should begin");
    engine
        .commit_focused_select_edit()
        .expect("onpick navigation should succeed");

    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("https://example.test/choose/A%20B%2FC%3FD%3DE%26F")
    );
    assert_eq!(engine.get_var("Raw".to_string()).as_deref(), Some(raw));
}

#[test]
fn wml_204_same_name_selects_keep_independent_control_state() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml><card id="home">
              <select name="Shared">
                <option value="a1">A1</option><option value="a2">A2</option>
              </select>
              <select name="Shared">
                <option value="b1">B1</option><option value="b2">B2</option>
              </select>
            </card></wml>
            "#,
        )
        .expect("deck should load");
    engine.set_viewport_cols(80).expect("valid viewport");
    engine
        .handle_key("down".to_string())
        .expect("focus should move to the second select");
    assert!(engine
        .begin_focused_select_edit()
        .expect("second select edit should begin"));
    assert!(engine.move_focused_select_edit(1));
    assert!(engine
        .commit_focused_select_edit()
        .expect("second select should commit"));

    let lines = render_snapshot_lines(&engine);
    assert!(lines.iter().any(|line| line.contains("[Shared: A1]")));
    assert!(lines.iter().any(|line| line.contains("[Shared: B2]")));
    assert_eq!(engine.get_var("Shared".to_string()).as_deref(), Some("b2"));
}

#[test]
fn empty_select_has_no_selected_index_or_edit_session() {
    let mut engine = engine_with_empty_select();

    assert_eq!(engine.select_selected_index_on_active_card("Empty"), None);
    assert!(!engine
        .begin_focused_select_edit()
        .expect("empty select must be handled without panicking"));
    assert_eq!(engine.focused_select_edit_name(), None);
    assert_eq!(engine.focused_select_edit_value(), None);
}

#[test]
fn non_empty_unselected_multi_select_still_edits_first_option() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r#"
            <wml><card id="home">
              <select name="Choices" multiple="true">
                <option value="alpha">Alpha</option>
                <option value="beta">Beta</option>
              </select>
            </card></wml>
            "#,
        )
        .expect("multi-select deck should load");

    assert_eq!(
        engine.select_selected_index_on_active_card("Choices"),
        Some(0)
    );
    assert!(engine
        .begin_focused_select_edit()
        .expect("non-empty multi-select edit should begin"));
    assert_eq!(engine.focused_select_edit_value().as_deref(), Some("alpha"));
    assert!(engine
        .commit_focused_select_edit()
        .expect("first option should toggle on"));
    assert_eq!(
        engine.get_var("Choices".to_string()).as_deref(),
        Some("alpha")
    );
}

#[test]
fn wml_fx_select_default_precedence_covers_every_source_and_fallback() {
    // WML-CL-SELECT-DEFAULT-PRECEDENCE and WML-CL-SELECT-INDEX-VALIDATION,
    // WAP-191_104-WML section 11.6.2.1 step 1.
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="start"><p>Start</p></card>
          <card id="controls">
            <input name="default_value" value="beta"/>
            <select name="from-iname" iname="index-a" ivalue="2" value="alpha">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
              <option value="gamma">Gamma</option>
            </select>
            <select name="from-ivalue" iname="index-b" ivalue="2" value="alpha">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
            <select name="from-name" value="alpha">
              <option value="alpha">Alpha</option>
              <option value="gamma">Gamma</option>
            </select>
            <select name="from-value" value="$(default_value)">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
            <select name="single-fallback">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
            <select name="multi-fallback" iname="multi-index" multiple="true">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    assert!(engine.set_var("index-a".to_string(), "3".to_string()));
    assert!(engine.set_var("from-iname".to_string(), "alpha".to_string()));
    assert!(engine.set_var("index-b".to_string(), "1;2".to_string()));
    assert!(engine.set_var("from-ivalue".to_string(), "alpha".to_string()));
    assert!(engine.set_var("from-name".to_string(), "gamma".to_string()));
    engine
        .navigate_to_card("controls".to_string())
        .expect("controls should initialize");

    assert_eq!(
        engine.get_var("from-iname".to_string()),
        Some("gamma".to_string())
    );
    assert_eq!(engine.get_var("index-a".to_string()), Some("3".to_string()));
    assert_eq!(
        engine.get_var("from-ivalue".to_string()),
        Some("beta".to_string())
    );
    assert_eq!(engine.get_var("index-b".to_string()), Some("2".to_string()));
    assert_eq!(
        engine.get_var("from-name".to_string()),
        Some("gamma".to_string())
    );
    assert_eq!(
        engine.get_var("from-value".to_string()),
        Some("beta".to_string())
    );
    assert_eq!(
        engine.get_var("single-fallback".to_string()),
        Some("alpha".to_string())
    );
    assert_eq!(engine.get_var("multi-fallback".to_string()), None);
    assert_eq!(
        engine.get_var("multi-index".to_string()),
        Some("0".to_string())
    );
}

#[test]
fn wml_fx_select_variables_are_resynchronized_before_link_task_execution() {
    // WML-CL-SELECT-USER-UPDATE and WML-CL-VARIABLE-COMMIT-BEFORE-TASK,
    // WAP-191_104-WML sections 10.3.4 and 11.6.2.1.
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="controls">
            <select name="choice" iname="choice-index">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
            <a href="/submit">Submit</a>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    assert!(engine.set_var("choice".to_string(), "tampered".to_string()));
    assert!(engine.set_var("choice-index".to_string(), "99".to_string()));
    engine
        .handle_key("down".to_string())
        .expect("focus should move to the task");
    engine
        .handle_key("enter".to_string())
        .expect("link task should execute");

    assert_eq!(
        engine.get_var("choice".to_string()),
        Some("alpha".to_string())
    );
    assert_eq!(
        engine.get_var("choice-index".to_string()),
        Some("1".to_string())
    );
    assert_eq!(
        engine.external_navigation_intent(),
        Some("/submit".to_string())
    );
}

#[test]
fn wml_fx_select_variable_updates_do_not_implicitly_refresh_other_controls() {
    // WML-CL-SELECT-NO-IMPLICIT-REFRESH / WAP-191_104-WML section 11.6.2.1.
    let mut engine = WmlEngine::new();
    let xml = r#"
        <wml>
          <card id="controls">
            <input name="choice" value="seed"/>
            <select name="choice" iname="choice-index">
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
          </card>
        </wml>
        "#;

    engine.load_deck(xml).expect("deck should load");
    assert_eq!(
        engine.get_var("choice".to_string()),
        Some("alpha".to_string())
    );
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.contains("href=input:choice:text=[choice: seed]")));

    engine
        .handle_key("down".to_string())
        .expect("focus should move to select");
    engine
        .begin_focused_select_edit()
        .expect("select edit should begin");
    assert!(engine.move_focused_select_edit(1));
    engine
        .commit_focused_select_edit()
        .expect("select commit should succeed");

    assert_eq!(
        engine.get_var("choice".to_string()),
        Some("beta".to_string())
    );
    let lines = render_snapshot_lines(&engine);
    assert!(lines
        .iter()
        .any(|line| line.contains("href=input:choice:text=[choice: seed]")));
    assert!(lines
        .iter()
        .any(|line| line.contains("href=select:choice:text=[choice: Beta]")));
    assert!(engine
        .trace_entries()
        .iter()
        .all(|entry| entry.kind != "ACTION_REFRESH"));
}

#[test]
fn wml_fx_option_onpick_single_updates_state_before_only_selected_task() {
    // WML-CL-SELECT-USER-UPDATE and WML-CL-OPTION-ONPICK-SINGLE,
    // WAP-191_104-WML sections 11.6.2.1-11.6.2.2.
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="controls">
            <select name="choice" iname="choice-index" ivalue="1">
              <option value="alpha" onpick="#wrong">Alpha</option>
              <option value="beta" onpick="#picked">Beta</option>
            </select>
          </card>
          <card id="wrong"><p>Wrong</p></card>
          <card id="picked"><p>Picked</p></card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_select_edit()
        .expect("select edit should begin");
    assert!(engine.move_focused_select_edit(1));
    engine
        .commit_focused_select_edit()
        .expect("select commit and onpick should succeed");

    assert_eq!(engine.active_card_id().expect("active card"), "picked");
    assert_eq!(
        engine.get_var("choice".to_string()),
        Some("beta".to_string())
    );
    assert_eq!(
        engine.get_var("choice-index".to_string()),
        Some("2".to_string())
    );
}

#[test]
fn wml_fx_option_onpick_multi_fires_for_deselection_after_state_update() {
    // WML-CL-SELECT-SINGLE-MULTI-MODE, WML-CL-SELECT-USER-UPDATE, and
    // WML-CL-OPTION-ONPICK-MULTI, WAP-191_104-WML sections 11.6.2.1-11.6.2.2.
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="controls">
            <select
              name="choices"
              iname="choice-indexes"
              ivalue="1"
              multiple="true"
            >
              <option value="alpha" onpick="#toggled">Alpha</option>
              <option value="beta">Beta</option>
            </select>
          </card>
          <card id="toggled"><p>Toggled</p></card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_select_edit()
        .expect("select edit should begin");
    engine
        .commit_focused_select_edit()
        .expect("deselect and onpick should succeed");

    assert_eq!(engine.active_card_id().expect("active card"), "toggled");
    assert_eq!(engine.get_var("choices".to_string()), None);
    assert_eq!(
        engine.get_var("choice-indexes".to_string()),
        Some("0".to_string())
    );
}

#[test]
fn wml_fx_option_onpick_failure_is_deterministic_after_committing_user_state() {
    // WML-CL-SELECT-USER-UPDATE and WML-CL-OPTION-ONPICK-SINGLE.
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="controls">
            <select name="choice" iname="choice-index" ivalue="1">
              <option value="alpha">Alpha</option>
              <option value="beta" onpick="#missing">Beta</option>
            </select>
          </card>
        </wml>
        "##;

    engine.load_deck(xml).expect("deck should load");
    engine
        .begin_focused_select_edit()
        .expect("select edit should begin");
    assert!(engine.move_focused_select_edit(1));
    assert_eq!(
        engine.commit_focused_select_edit(),
        Err("Card id not found".to_string())
    );

    assert_eq!(engine.active_card_id().expect("active card"), "controls");
    assert_eq!(engine.focused_select_edit_name(), None);
    assert_eq!(
        engine.get_var("choice".to_string()),
        Some("beta".to_string())
    );
    assert_eq!(
        engine.get_var("choice-index".to_string()),
        Some("2".to_string())
    );
}
