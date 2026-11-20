use super::*;

const WML_203_DTD_FAMILY: &str = include_str!("../../../examples/source/wml-203-dtd-family.wml");
const STRICT_WML_CONTENT_TYPE: &str = "text/vnd.wap.wml; validation=strict";

fn canonical_wml(body: &str) -> String {
    format!(
        "<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML 1.3//EN\" \"http://www.wapforum.org/DTD/wml13.dtd\">\n{body}"
    )
}

fn load_strict(source: &str) -> Result<WmlEngine, String> {
    let mut engine = WmlEngine::new();
    engine.load_deck_context(
        source,
        "http://example.test/apps/wml-203.wml",
        STRICT_WML_CONTENT_TYPE,
        None,
    )?;
    Ok(engine)
}

fn strict_error(source: &str, context: &str) -> String {
    match load_strict(source) {
        Ok(_) => panic!("{context}"),
        Err(error) => error,
    }
}

#[test]
fn wml_203_text_requires_xml_and_doctype_prologue_components() {
    let no_prologue = "<wml><card id=\"main\"><p>Missing</p></card></wml>";
    assert_eq!(
        strict_error(no_prologue, "XML declaration must be mandatory"),
        "Invalid WML prologue: missing required XML declaration"
    );

    let xml_only = "<?xml version=\"1.0\"?><wml><card id=\"main\"><p>Missing</p></card></wml>";
    assert_eq!(
        strict_error(xml_only, "DOCTYPE must be mandatory"),
        "Invalid WML prologue: missing required DOCTYPE declaration"
    );
}

#[test]
fn wml_203_full_selected_dtd_family_loads_and_renders() {
    let engine = load_strict(WML_203_DTD_FAMILY)
        .expect("the source-derived selected WML 1.3 family should load");

    assert_eq!(engine.active_card_id().as_deref(), Ok("main"));
    let text = render_snapshot_lines(&engine).join("\n");
    for expected in ["Family", "Cell", "One", "Pre"] {
        assert!(
            text.contains(expected),
            "render omitted {expected:?}: {text}"
        );
    }
}

#[test]
fn wml_203_text_and_normalized_wbxml_share_selected_dtd_validation() {
    let text_engine = load_strict(WML_203_DTD_FAMILY).expect("strict text should load");
    let tokenized_xml = WML_203_DTD_FAMILY
        .split_once("<wml")
        .map(|(_, body)| format!("<wml{body}"))
        .expect("fixture should contain a WML root");
    let mut wbxml_engine = WmlEngine::new();
    wbxml_engine
        .load_deck_context(
            &tokenized_xml,
            "http://example.test/apps/wml-203.wml",
            "application/vnd.wap.wmlc",
            None,
        )
        .expect("normalized WBXML should use its transport header as the prologue");

    assert_eq!(wbxml_engine.active_card_id(), text_engine.active_card_id());
    assert_eq!(
        render_snapshot_lines(&wbxml_engine),
        render_snapshot_lines(&text_engine)
    );
}

#[test]
fn wml_fx_a_go_equivalence() {
    let links = [
        ("a", r##"<a href="#target">Next</a>"##),
        (
            "anchor with go",
            r##"<anchor>Next<go href="#target"/></anchor>"##,
        ),
    ];

    for (label, link) in links {
        let source = canonical_wml(&format!(
            r#"<wml>
                <card id="start"><p>{link}</p></card>
                <card id="target"><p>Arrived: $sentinel</p></card>
            </wml>"#
        ));
        let mut engine = load_strict(&source).expect("link deck should load");
        assert_eq!(engine.active_card_id().as_deref(), Ok("start"), "{label}");
        assert!(engine.set_var("sentinel".to_string(), "preserved".to_string()));
        let history_before = engine.history_push_sequence();

        engine
            .handle_key("enter".to_string())
            .expect("activate link");

        assert_eq!(engine.active_card_id().as_deref(), Ok("target"), "{label}");
        assert_eq!(
            engine.history_push_sequence(),
            history_before + 1,
            "{label}"
        );
        assert_eq!(
            engine.get_var("sentinel".to_string()).as_deref(),
            Some("preserved"),
            "{label}"
        );
    }
}

#[test]
fn wml_fx_a_go_equivalence_resolves_literal_dollar_once_on_keyboard_and_frame_paths() {
    for (link, typed) in [
        (r#"<a href="price$$.wml">Price</a>"#, false),
        (r#"<anchor>Price<go href="price$$.wml"/></anchor>"#, false),
        (
            r#"<anchor>Price<go href="price$$.wml"><setvar name="flag" value="typed"/></go></anchor>"#,
            true,
        ),
    ] {
        let source = canonical_wml(&format!(
            r#"<wml><card id="start"><p>{link}</p></card></wml>"#
        ));
        let mut keyed = load_strict(&source).expect("key test deck");
        let mut clicked = load_strict(&source).expect("click test deck");
        let frame = clicked.render_frame().expect("frame for click");
        let region = &frame.hit_regions[0];
        keyed.handle_key("enter".to_string()).expect("keyed go");
        clicked
            .handle_input(crate::EngineInputEvent::Click {
                frame_id: frame.frame_id,
                x: region.x,
                y: region.y,
            })
            .expect("clicked go");
        for engine in [keyed, clicked] {
            assert_eq!(
                engine.external_navigation_intent().as_deref(),
                Some("http://example.test/apps/price$.wml")
            );
            assert_eq!(
                engine.get_var("flag".to_string()).as_deref(),
                typed.then_some("typed")
            );
        }
    }
}

#[test]
fn wml_fx_anchor_empty_resolved_labels_have_visible_hit_targets() {
    let source = canonical_wml(
        r##"<wml><card id="start"><p>
        <a href="#target">$(missing)</a>
        <anchor>$(missing)<go href="#target"/></anchor>
        <anchor>$(missing)<refresh/></anchor>
    </p></card><card id="target"><p>Target</p></card></wml>"##,
    );
    let mut engine = load_strict(&source).expect("anchor deck");
    for (index, label) in ["#target", "#target", "Refresh"].into_iter().enumerate() {
        let frame = engine.render_frame().expect("anchor frame");
        assert_eq!(frame.hit_regions.len(), 3);
        assert_eq!(frame.hit_regions[index].action_id, format!("focus:{index}"));
        assert_eq!(frame.affordances[0].label, label);
        engine.handle_key("down".to_string()).expect("move focus");
    }
}

#[test]
fn wml_fx_anchor_fallback_activates_without_wrapping_oversized_authored_label() {
    let label = "$(missing)".repeat(500);
    let source = canonical_wml(&format!(
        r#"<wml><card id="start"><p>
        <anchor>{label}<refresh><setvar name="stage" value="activated"/></refresh></anchor>
    </p></card></wml>"#
    ));
    for mode in ["key", "action", "click"] {
        let mut engine = load_strict(&source).expect("anchor deck");
        engine.set_viewport_cols(1).expect("one-column viewport");
        let frame = engine.render_frame().expect("resolved fallback fits");
        let action = &frame.affordances[0];
        assert_eq!(action.action_id, "focus:0");
        assert_eq!(action.label.replace(' ', ""), "Refresh");
        let hit = &frame.hit_regions[0];
        match mode {
            "key" => engine.handle_key("enter".to_string()),
            "action" => engine.handle_input(crate::EngineInputEvent::ActivateAction {
                frame_id: frame.frame_id,
                action_id: action.action_id.clone(),
            }),
            "click" => engine.handle_input(crate::EngineInputEvent::Click {
                frame_id: frame.frame_id,
                x: hit.x,
                y: hit.y,
            }),
            _ => unreachable!("test dispatch modes are exhaustive"),
        }
        .expect("visible fallback should dispatch");
        assert_eq!(
            engine.get_var("stage".to_string()).as_deref(),
            Some("activated"),
            "{mode}"
        );
    }
}

#[test]
fn wml_fx_anchor_activation() {
    let source = canonical_wml(
        r##"<wml>
        <card id="start">
            <p><anchor>Go<go href="#tasks"><setvar name="stage" value="went"/></go></anchor></p>
        </card>
        <card id="tasks"><p>
            Stage: $(stage)
            <anchor>Refresh<refresh><setvar name="stage" value="refreshed"/></refresh></anchor>
            <anchor>Return<prev/></anchor>
        </p></card>
    </wml>"##,
    );
    let mut engine = load_strict(&source).expect("anchor deck should load");

    engine.handle_key("enter".to_string()).expect("go");
    assert_eq!(engine.active_card_id().as_deref(), Ok("tasks"));
    assert_eq!(engine.get_var("stage".to_string()).as_deref(), Some("went"));
    let history = engine.history_push_sequence();

    let frame = engine.render_frame().expect("anchor frame");
    let action = frame
        .affordances
        .iter()
        .find(|action| action.action_id == "focus:0")
        .expect("refresh must be available as a frame action");
    assert_eq!(action.label, "Refresh");
    engine
        .handle_input(crate::EngineInputEvent::ActivateAction {
            frame_id: frame.frame_id,
            action_id: action.action_id.clone(),
        })
        .expect("refresh");
    assert_eq!(engine.active_card_id().as_deref(), Ok("tasks"));
    assert_eq!(engine.history_push_sequence(), history);
    assert!(render_snapshot_lines(&engine)
        .iter()
        .any(|line| line.ends_with(":Stage: refreshed")));

    let frame = engine.render_frame().expect("refreshed frame");
    let hit = frame
        .hit_regions
        .iter()
        .find(|hit| hit.action_id == "focus:1")
        .expect("prev anchor must be clickable");
    assert_eq!(hit.target_kind, crate::EngineFocusTargetKind::Link);
    engine
        .handle_input(crate::EngineInputEvent::Click {
            frame_id: frame.frame_id,
            x: hit.x,
            y: hit.y,
        })
        .expect("prev");
    assert_eq!(engine.active_card_id().as_deref(), Ok("start"));
    assert!(
        !engine
            .render_frame()
            .expect("restored frame")
            .back_available
    );
    assert_trace_kinds_subsequence(
        &engine,
        &[
            "ACTION_FRAGMENT",
            "ACTION_REFRESH",
            "ACTION_PREV",
            "ACTION_BACK",
        ],
    );
}

#[test]
fn wml_fx_anchor_label_preserves_line_break_and_shared_hit_target() {
    let source = canonical_wml(
        r##"<wml>
        <card id="start"><p><anchor>First<br/>Second<go href="#target"/></anchor></p></card>
        <card id="target"><p>Target</p></card>
    </wml>"##,
    );
    let mut engine = load_strict(&source).expect("anchor deck");
    let frame = engine.render_frame().expect("anchor frame");
    let rows = frame
        .hit_regions
        .iter()
        .map(|hit| (hit.y, hit.action_id.as_str()))
        .collect::<Vec<_>>();
    assert_eq!(rows, [(0, "focus:0"), (2, "focus:0")]);
    assert_eq!(frame.affordances[0].label, "First Second");
    engine
        .handle_input(crate::EngineInputEvent::Click {
            frame_id: frame.frame_id,
            x: 0,
            y: 2,
        })
        .expect("both anchor rows should activate one task");
    assert_eq!(engine.active_card_id().as_deref(), Ok("target"));
}

#[test]
fn wml_fx_anchor_go_preserves_external_request_metadata() {
    let source = canonical_wml(
        r#"<wml><card id="main"><p>
        <anchor>Submit<go href="submit.wml" method="post" sendreferer="true">
            <postfield name="answer" value="42"/>
        </go></anchor>
    </p></card></wml>"#,
    );
    let mut engine = load_strict(&source).expect("request deck should load");
    engine.handle_key("enter".to_string()).expect("go");
    assert_eq!(
        engine.external_navigation_intent().as_deref(),
        Some("http://example.test/apps/submit.wml")
    );
    let policy = engine
        .external_navigation_request_policy()
        .expect("anchor request policy");
    assert_eq!(
        policy.referer_url.as_deref(),
        Some("http://example.test/apps/wml-203.wml")
    );
    let intent = policy.request_intent.expect("request intent");
    assert_eq!(intent.method, crate::ScriptNavigationMethodLiteral::Post);
    assert_eq!(intent.post_fields.len(), 1);
    assert_eq!(intent.post_fields[0].name, "answer");
    assert_eq!(intent.post_fields[0].value, "42");
}

#[test]
fn wml_203_invalid_content_model_mutations_are_rejected_deterministically() {
    let cases = [
        ("unknown element", "<wml><card id=\"main\"><p><blink>bad</blink></p></card></wml>"),
        ("card flow order", "<wml><card id=\"main\"><a href=\"#main\">bad</a></card></wml>"),
        ("empty table", "<wml><card id=\"main\"><p><table columns=\"1\"/></p></card></wml>"),
        ("empty row", "<wml><card id=\"main\"><p><table columns=\"1\"><tr/></table></p></card></wml>"),
        ("multiple do tasks", "<wml><card id=\"main\"><do type=\"accept\"><noop/><prev/></do><p>bad</p></card></wml>"),
        ("empty select", "<wml><card id=\"main\"><p><select name=\"s\"/></p></card></wml>"),
        ("anchor without task", "<wml><card id=\"main\"><p><anchor>bad</anchor></p></card></wml>"),
        ("anchor with multiple tasks", "<wml><card id=\"main\"><p><anchor>bad<prev/><refresh/></anchor></p></card></wml>"),
        ("missing image source", "<wml><card id=\"main\"><p><img alt=\"bad\"/></p></card></wml>"),
        ("nested table", "<wml><card id=\"main\"><p><table columns=\"1\"><tr><td><em><table columns=\"1\"><tr><td>bad</td></tr></table></em></td></tr></table></p></card></wml>"),
        ("unexpected attribute", "<wml bogus=\"x\"><card id=\"main\"><p>bad</p></card></wml>"),
        ("duplicate ID", "<wml><card id=\"same\"><p id=\"same\">bad</p></card></wml>"),
        ("pre space mode", "<wml><card id=\"main\"><pre xml:space=\"default\">bad</pre></card></wml>"),
        ("nonempty noop", "<wml><card id=\"main\"><do type=\"accept\"><noop>bad</noop></do><p>bad</p></card></wml>"),
    ];

    for (label, body) in cases {
        let source = canonical_wml(body);
        let first = strict_error(&source, label);
        let second = strict_error(&source, label);
        assert_eq!(first, second, "{label} rejection changed across loads");
    }
}
