use super::*;

#[test]
fn non_fatal_execution_outcome_contract_shape() {
    // WMLS-C-111 (non-fatal handling): `classify_vm_trap` maps every current
    // `VmTrap` variant to Fatal, so no VM opcode can reach this branch of
    // `classify_vm_trap_outcome` yet (see `execute_script_unit_stack_underflow_is_fatal_bytecode_error`
    // and `execute_script_unit_type_mismatch_is_fatal_bytecode_error`). This
    // pins the `ScriptExecutionOutcome::non_fatal` contract shape so it stays
    // correct for a future computational-error opcode (e.g. integer divide)
    // without depending on one existing yet.
    let outcome = crate::ScriptExecutionOutcome::non_fatal(
        "vm: divide by zero".to_string(),
        super::ScriptErrorCategoryLiteral::Computational,
        super::ScriptNavigationIntentLiteral::None,
        false,
    );

    assert!(outcome.ok);
    assert!(!outcome.invocation_aborted);
    assert_eq!(
        outcome.error_class,
        super::ScriptErrorClassLiteral::NonFatal
    );
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Computational
    );
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
}

#[test]
fn execute_script_unit_halt_bytecode_returns_ok() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0x00]);
    assert!(outcome.ok);
    assert!(outcome.trap.is_none());
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::String(String::new())
    );
}

#[test]
fn execute_script_unit_empty_bytecode_returns_decode_trap() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[]);
    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, super::ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Integrity
    );
    assert!(outcome.invocation_aborted);
    assert_eq!(
        outcome.trap.as_deref(),
        Some("decode: empty compilation unit")
    );
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
}

#[test]
fn execute_script_unit_unknown_opcode_returns_decode_fatal() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0xff]);
    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, super::ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Integrity
    );
    assert!(outcome.invocation_aborted);
    assert_eq!(
        outcome.trap.as_deref(),
        Some("decode: unsupported opcode 0xff at pc=0")
    );
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
}

#[test]
fn execute_script_unit_addition_returns_ok() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0x01, 4, 0x01, 8, 0x02, 0x00]);
    assert!(outcome.ok);
    assert!(outcome.trap.is_none());
    assert_eq!(outcome.result, super::ScriptValueLiteral::Number(12.0));
}

#[test]
fn execute_script_unit_truncated_immediate_returns_decode_fatal() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0x01]);
    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, super::ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Integrity
    );
    assert!(outcome.invocation_aborted);
    assert_eq!(
        outcome.trap.as_deref(),
        Some("decode: truncated immediate for opcode 0x01 at pc=0")
    );
}

#[test]
fn execute_script_unit_type_mismatch_is_fatal_bytecode_error() {
    // WAP-193_101 12.3.1.7: a runtime type mismatch on a verified unit is a
    // "compiler generated bad code" condition, the same class as Stack
    // Underflow, and is Fatal per chapter 12.3 rather than a Non-fatal
    // Computational Error (12.4.1) the VM has no opcodes to produce yet.
    let engine = WmlEngine::new();
    let outcome = engine.execute_script_unit_internal(&[0x03, 1, b'x', 0x01, 1, 0x02, 0x00]);

    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, super::ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Integrity
    );
    assert!(outcome.invocation_aborted);
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
    assert_eq!(
        outcome.trap.as_deref(),
        Some("vm: type error (expected int32)")
    );
}

#[test]
fn execute_script_unit_return_from_root_reports_vm_trap() {
    let engine = WmlEngine::new();

    let outcome = engine.execute_script_unit_internal(&[0x13]);
    assert!(!outcome.ok);
    assert_eq!(outcome.trap.as_deref(), Some("vm: return from root frame"));
}

#[test]
fn execute_script_unit_stack_underflow_is_fatal_bytecode_error() {
    // WAP-193_101 12.3.1.7 classifies Stack Underflow as Fatal ("[o]nly
    // generated if compiler generates bad code"), not Non-fatal.
    let engine = WmlEngine::new();
    let outcome = engine.execute_script_unit_internal(&[0x02, 0x00]);

    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, super::ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        super::ScriptErrorCategoryLiteral::Integrity
    );
    assert!(outcome.invocation_aborted);
    assert_eq!(
        outcome.result,
        super::ScriptValueLiteral::Invalid { invalid: true }
    );
    assert_eq!(outcome.trap.as_deref(), Some("vm: stack underflow"));
}

#[test]
fn registered_wap_unit_selects_named_function_and_invokes_return_es() {
    let mut engine = WmlEngine::new();
    engine.register_script_unit(
        "minimal.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_MINIMAL_UNIT),
    );

    let executed =
        engine.execute_script_ref_function("minimal.wmlsc".to_string(), "main".to_string());
    assert!(executed.ok);
    assert_eq!(executed.result, ScriptValueLiteral::String(String::new()));
    assert_eq!(executed.error_class, ScriptErrorClassLiteral::None);
    assert_eq!(executed.error_category, ScriptErrorCategoryLiteral::None);

    let invoked = engine
        .invoke_script_ref_function("minimal.wmlsc".to_string(), "main".to_string())
        .expect("verified RETURN_ES function should invoke");
    assert_eq!(invoked.result, ScriptValueLiteral::String(String::new()));
}

#[test]
fn registered_wap_unit_reports_named_lookup_and_unsupported_execution_failures() {
    let mut engine = WmlEngine::new();
    engine.register_script_unit(
        "named.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_NAMED_UNIT),
    );

    let missing =
        engine.execute_script_ref_function("named.wmlsc".to_string(), "missing".to_string());
    assert!(!missing.ok);
    assert_eq!(missing.error_class, ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        missing.error_category,
        ScriptErrorCategoryLiteral::HostBinding
    );
    assert_eq!(
        missing.trap.as_deref(),
        Some("wap runtime: external function not found (named.wmlsc#missing)")
    );

    let unsupported =
        engine.execute_script_ref_function("named.wmlsc".to_string(), "todo".to_string());
    assert!(!unsupported.ok);
    assert_eq!(unsupported.error_class, ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        unsupported.error_category,
        ScriptErrorCategoryLiteral::HostBinding
    );
    assert_eq!(
        unsupported.trap.as_deref(),
        Some("wap runtime: unsupported execution opcode 0x14 in function 1 at pc=0")
    );
}

#[test]
fn registered_wap_unit_verifies_every_function_before_selected_execution() {
    let mut engine = WmlEngine::new();
    engine.register_script_unit(
        "invalid-ref.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_INVALID_FUNCTION_REF_UNIT),
    );

    let outcome =
        engine.execute_script_ref_function("invalid-ref.wmlsc".to_string(), "main".to_string());
    assert!(!outcome.ok);
    assert_eq!(outcome.error_class, ScriptErrorClassLiteral::Fatal);
    assert_eq!(
        outcome.error_category,
        ScriptErrorCategoryLiteral::Integrity
    );
    assert_eq!(
        outcome.trap.as_deref(),
        Some("wap decode: invalid function reference 2 in function 1 at pc=0")
    );

    let invocation_error = engine
        .invoke_script_ref_function("invalid-ref.wmlsc".to_string(), "main".to_string())
        .expect_err("whole-unit verification failure must abort invocation");
    assert_eq!(
        invocation_error,
        "wap decode: invalid function reference 2 in function 1 at pc=0"
    );
}

#[test]
fn registered_wap_action_records_success_trace_taxonomy() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck(
            r##"<wml><card id="home"><a href="script:minimal.wmlsc#main">Run</a></card></wml>"##,
        )
        .expect("deck should load");
    engine.register_script_unit(
        "minimal.wmlsc".to_string(),
        wmls_501_fixture_bytes(WMLS_501_MINIMAL_UNIT),
    );

    engine
        .handle_key("enter".to_string())
        .expect("verified WAP action should execute");

    assert_trace_kinds_subsequence(&engine, &["ACTION_SCRIPT", "SCRIPT_OK"]);
    let trace = engine
        .trace_entries()
        .into_iter()
        .find(|entry| entry.kind == "SCRIPT_OK")
        .expect("SCRIPT_OK trace should be present");
    assert_eq!(trace.script_ok, Some(true));
    assert_eq!(
        trace.script_error_class,
        Some(ScriptErrorClassLiteral::None)
    );
    assert_eq!(
        trace.script_error_category,
        Some(ScriptErrorCategoryLiteral::None)
    );
    assert_eq!(trace.script_trap, None);
}

#[test]
fn vm_trap_classification_matrix_is_explicit() {
    fn expected_class(trap: &VmTrap) -> ScriptErrorClassLiteral {
        match trap {
            VmTrap::EmptyUnit
            | VmTrap::InvalidEntryPoint { .. }
            | VmTrap::UnsupportedOpcode(_)
            | VmTrap::TruncatedImmediate { .. }
            | VmTrap::StackOverflow { .. }
            | VmTrap::StackUnderflow
            | VmTrap::TypeError(_)
            | VmTrap::InvalidLocalIndex { .. }
            | VmTrap::InvalidCallTarget { .. }
            | VmTrap::CallDepthExceeded { .. }
            | VmTrap::ReturnFromRootFrame
            | VmTrap::ExecutionLimitExceeded { .. }
            | VmTrap::Utf8ImmediateDecode
            | VmTrap::HostCallUnavailable { .. }
            | VmTrap::HostCallError { .. } => ScriptErrorClassLiteral::Fatal,
        }
    }

    let matrix = vec![
        VmTrap::EmptyUnit,
        VmTrap::InvalidEntryPoint { entry_pc: 1 },
        VmTrap::UnsupportedOpcode(0xff),
        VmTrap::TruncatedImmediate { opcode: 0x01 },
        VmTrap::StackOverflow { limit: 1 },
        VmTrap::StackUnderflow,
        VmTrap::TypeError("expected int32"),
        VmTrap::InvalidLocalIndex { index: 0 },
        VmTrap::InvalidCallTarget { target: 0 },
        VmTrap::CallDepthExceeded { limit: 1 },
        VmTrap::ReturnFromRootFrame,
        VmTrap::ExecutionLimitExceeded { limit: 1 },
        VmTrap::Utf8ImmediateDecode,
        VmTrap::HostCallUnavailable { function_id: 1 },
        VmTrap::HostCallError {
            function_id: 1,
            message: "x".to_string(),
        },
    ];

    for trap in matrix {
        let expected = expected_class(&trap);
        assert_eq!(
            classify_vm_trap(&trap),
            expected,
            "trap class mismatch for {trap:?}"
        );
    }
}

#[test]
fn vm_trap_error_category_matrix_is_explicit() {
    fn expected_category(trap: &VmTrap) -> ScriptErrorCategoryLiteral {
        match trap {
            VmTrap::EmptyUnit
            | VmTrap::InvalidEntryPoint { .. }
            | VmTrap::UnsupportedOpcode(_)
            | VmTrap::TruncatedImmediate { .. }
            | VmTrap::StackUnderflow
            | VmTrap::TypeError(_)
            | VmTrap::InvalidLocalIndex { .. }
            | VmTrap::InvalidCallTarget { .. }
            | VmTrap::Utf8ImmediateDecode
            | VmTrap::ReturnFromRootFrame => ScriptErrorCategoryLiteral::Integrity,
            VmTrap::StackOverflow { .. }
            | VmTrap::CallDepthExceeded { .. }
            | VmTrap::ExecutionLimitExceeded { .. } => ScriptErrorCategoryLiteral::Resource,
            VmTrap::HostCallUnavailable { .. } | VmTrap::HostCallError { .. } => {
                ScriptErrorCategoryLiteral::HostBinding
            }
        }
    }

    let matrix = vec![
        VmTrap::EmptyUnit,
        VmTrap::InvalidEntryPoint { entry_pc: 1 },
        VmTrap::UnsupportedOpcode(0xff),
        VmTrap::TruncatedImmediate { opcode: 0x01 },
        VmTrap::StackOverflow { limit: 1 },
        VmTrap::StackUnderflow,
        VmTrap::TypeError("expected int32"),
        VmTrap::InvalidLocalIndex { index: 0 },
        VmTrap::InvalidCallTarget { target: 0 },
        VmTrap::CallDepthExceeded { limit: 1 },
        VmTrap::ReturnFromRootFrame,
        VmTrap::ExecutionLimitExceeded { limit: 1 },
        VmTrap::Utf8ImmediateDecode,
        VmTrap::HostCallUnavailable { function_id: 1 },
        VmTrap::HostCallError {
            function_id: 1,
            message: "x".to_string(),
        },
    ];

    for trap in matrix {
        let expected = expected_category(&trap);
        assert_eq!(
            classify_vm_trap_category(&trap),
            expected,
            "trap category mismatch for {trap:?}"
        );
    }
}

#[test]
fn execute_script_ref_reports_missing_unit() {
    let mut engine = WmlEngine::new();
    let outcome = engine.execute_script_ref_internal("missing.wmlsc", "main");
    engine.last_script_outcome = Some(outcome);
    assert_eq!(engine.last_script_execution_ok(), Some(false));
    assert_eq!(
        engine.last_script_execution_trap().as_deref(),
        Some("loader: script unit not registered (missing.wmlsc)")
    );
}

#[test]
fn script_link_executes_registered_unit_without_external_navigation() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:calc.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    register_legacy_script_fixture(
        &mut engine,
        "calc.wmlsc",
        vec![0x01, 4, 0x01, 5, 0x02, 0x00],
    );

    engine
        .handle_key("enter".to_string())
        .expect("script execution should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.external_navigation_intent(), None);
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
}

#[test]
fn script_link_returns_error_when_unit_is_missing() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:missing.wmlsc#main">Run</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let err = engine
        .handle_key_internal("enter")
        .expect_err("missing script unit should fail");
    assert_eq!(err, "loader: script unit not registered (missing.wmlsc)");
    assert_eq!(
        engine.last_script_execution_trap().as_deref(),
        Some("loader: script unit not registered (missing.wmlsc)")
    );
}

#[test]
fn clear_script_units_removes_registered_units() {
    let mut engine = WmlEngine::new();
    engine.register_script_unit("unit.wmlsc".to_string(), vec![0x00]);
    engine.clear_script_units();

    let outcome = engine
        .execute_script_ref_internal("unit.wmlsc", "main")
        .trap
        .expect("missing unit should trap");
    assert_eq!(outcome, "loader: script unit not registered (unit.wmlsc)");
}

#[test]
fn parse_script_href_extracts_source_before_fragment() {
    assert!(matches!(
        parse_script_href("script:calc.wmlsc#main"),
        Some(ParsedScriptRef {
            src: "calc.wmlsc",
            function_name: Some("main")
        })
    ));
    assert!(matches!(
        parse_script_href("script:calc.wmlsc"),
        Some(ParsedScriptRef {
            src: "calc.wmlsc",
            function_name: None
        })
    ));
    assert_eq!(parse_script_href("script:#main"), None);
    assert_eq!(parse_script_href("#next"), None);
}

#[test]
fn execute_script_ref_function_uses_registered_entry_point() {
    let mut engine = WmlEngine::new();
    register_legacy_script_fixture(
        &mut engine,
        "multi.wmlsc",
        vec![0x01, 1, 0x00, 0x01, 9, 0x00],
    );
    engine.register_script_entry_point("multi.wmlsc".to_string(), "alt".to_string(), 3);

    let outcome = engine.execute_script_ref_internal("multi.wmlsc", "alt");
    assert!(outcome.ok);
    assert_eq!(outcome.result, super::ScriptValueLiteral::Number(9.0));
    assert_eq!(outcome.trap, None);
}

#[test]
fn execute_script_ref_function_missing_entry_point_traps() {
    let mut engine = WmlEngine::new();
    register_legacy_script_fixture(&mut engine, "multi.wmlsc", vec![0x01, 1, 0x00]);

    let outcome = engine.execute_script_ref_internal("multi.wmlsc", "missing");
    assert!(!outcome.ok);
    assert_eq!(
        outcome.trap.as_deref(),
        Some("loader: function entry point not registered (multi.wmlsc#missing)")
    );
}

#[test]
fn script_link_function_dispatch_uses_registered_entry_point() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:multi.wmlsc#alt">Run alt</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    register_legacy_script_fixture(
        &mut engine,
        "multi.wmlsc",
        vec![0x01, 1, 0x00, 0x01, 9, 0x00],
    );
    engine.register_script_entry_point("multi.wmlsc".to_string(), "alt".to_string(), 3);

    engine
        .handle_key("enter".to_string())
        .expect("script alt entrypoint should execute");
    assert_eq!(engine.last_script_execution_ok(), Some(true));
    assert_eq!(engine.last_script_execution_trap(), None);
}

#[test]
fn execute_script_ref_call_passes_args_into_function_locals() {
    let mut engine = WmlEngine::new();
    register_legacy_script_fixture(&mut engine, "sum.wmlsc", vec![0x11, 0, 0x11, 1, 0x02, 0x00]);
    engine.register_script_entry_point("sum.wmlsc".to_string(), "sum".to_string(), 0);

    let outcome = engine.execute_script_ref_call_internal(
        "sum.wmlsc",
        "sum",
        &[ScriptValue::Int32(10), ScriptValue::Int32(32)],
    );
    assert!(outcome.ok);
    assert_eq!(outcome.result, ScriptValueLiteral::Number(42.0));
    assert_eq!(outcome.trap, None);
}

#[test]
fn wmlbrowser_setvar_getvar_lifecycle_and_coercion() {
    let mut engine = WmlEngine::new();
    assert!(engine.set_var("alpha".to_string(), "1".to_string()));
    assert_eq!(engine.get_var("alpha".to_string()).as_deref(), Some("1"));
    assert!(!engine.set_var("9bad".to_string(), "x".to_string()));

    let mut unit = Vec::new();
    push_string(&mut unit, "score");
    unit.push(0x01);
    unit.push(7);
    unit.push(0x20);
    unit.push(0x02);
    unit.push(0x02);
    push_string(&mut unit, "score");
    unit.push(0x20);
    unit.push(0x01);
    unit.push(0x01);
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "vars.wmlsc", unit);

    let outcome = engine.execute_script_ref_internal("vars.wmlsc", "main");
    assert!(outcome.ok);
    assert_eq!(outcome.result, ScriptValueLiteral::String("7".to_string()));
    assert_eq!(engine.get_var("score".to_string()).as_deref(), Some("7"));
    assert!(outcome.requires_refresh);
    assert_eq!(
        outcome.navigation_intent,
        ScriptNavigationIntentLiteral::None
    );
}

#[test]
fn wmlbrowser_get_current_card_returns_fragment_when_context_exists() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine
        .load_deck_context(
            xml,
            "http://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");

    let unit = vec![
        0x20, 0x0B, // getCurrentCard()
        0x00, 0x00,
    ];
    register_legacy_script_fixture(&mut engine, "current-card.wmlsc", unit);

    let outcome = engine.execute_script_ref_internal("current-card.wmlsc", "main");
    assert!(outcome.ok);
    assert_eq!(
        outcome.result,
        ScriptValueLiteral::String("#home".to_string())
    );
}

#[test]
fn wmlbrowser_get_current_card_returns_invalid_without_context() {
    let mut engine = WmlEngine::new();
    let unit = vec![
        0x20, 0x0B, // getCurrentCard()
        0x00, 0x00,
    ];
    register_legacy_script_fixture(&mut engine, "current-card-noctx.wmlsc", unit);

    let outcome = engine.execute_script_ref_internal("current-card-noctx.wmlsc", "main");
    assert!(outcome.ok);
    assert_eq!(
        outcome.result,
        ScriptValueLiteral::Invalid { invalid: true }
    );
}

#[test]
fn wmlbrowser_new_context_clears_vars_and_history_and_prev_has_no_effect() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#mid">To middle</a>
          </card>
          <card id="mid">
            <a href="#next">To next</a>
          </card>
          <card id="next">
            <a href="script:ctx.wmlsc#main">Run context reset</a>
          </card>
        </wml>
        "##;
    engine
        .load_deck_context(
            xml,
            "http://example.test/deck.wml",
            "text/vnd.wap.wml",
            None,
        )
        .expect("deck should load");

    engine
        .handle_key("enter".to_string())
        .expect("home enter should navigate to mid");
    engine
        .handle_key("enter".to_string())
        .expect("mid enter should navigate to next");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(engine.nav_stack.len(), 2);

    let mut unit = Vec::new();
    push_string(&mut unit, "session");
    push_string(&mut unit, "abc");
    unit.push(0x20);
    unit.push(0x02); // setVar(name, value)
    unit.push(0x02);
    unit.push(0x20);
    unit.push(0x04); // prev()
    unit.push(0x00);
    unit.push(0x20);
    unit.push(0x0A); // newContext()
    unit.push(0x00);
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "ctx.wmlsc", unit);

    engine.clear_trace_entries();
    engine
        .handle_key("enter".to_string())
        .expect("script context reset should succeed");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert!(
        engine.nav_stack.is_empty(),
        "newContext should clear history stack"
    );
    assert_eq!(
        engine.get_var("session".to_string()),
        None,
        "newContext should clear vars"
    );
    assert!(
        !engine.navigate_back(),
        "back should be empty after newContext"
    );
    let traces = engine.trace_entries();
    assert!(traces.iter().any(|entry| entry.kind == "ACTION_NEWCONTEXT"));
    assert!(
        traces.iter().all(|entry| entry.kind != "ACTION_BACK"),
        "prev request should have no effect after newContext"
    );
}

#[test]
fn execute_script_ref_is_raw_and_does_not_apply_navigation_effects() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01);
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "raw-nav.wmlsc", unit);

    let outcome = engine.execute_script_ref_internal("raw-nav.wmlsc", "main");
    assert!(outcome.ok);
    assert_eq!(
        outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Go {
            href: "#next".to_string()
        }
    );
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}

#[test]
fn execute_script_ref_does_not_publish_dialog_or_timer_effects() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "hello");
    unit.push(0x20);
    unit.push(0x05);
    unit.push(0x01); // alert(message)
    unit.push(0x01);
    unit.push(25);
    push_string(&mut unit, "otp");
    unit.push(0x20);
    unit.push(0x08);
    unit.push(0x02); // setTimer(delay, token)
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "raw-effects.wmlsc", unit);

    let outcome = engine.execute_script_ref_internal("raw-effects.wmlsc", "main");
    assert!(outcome.ok);
    assert!(engine.last_script_dialog_requests().is_empty());
    assert!(engine.last_script_timer_requests().is_empty());
}

#[test]
fn invoke_script_ref_applies_effects_and_returns_invocation_outcome() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let mut unit = Vec::new();
    push_string(&mut unit, "nextCard");
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x02);
    unit.push(0x02); // setVar
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "invoke-nav.wmlsc", unit);

    let outcome = engine
        .invoke_script_ref_internal("invoke-nav.wmlsc", "main", &[])
        .expect("invoke should succeed");
    assert_eq!(
        outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Go {
            href: "#next".to_string()
        }
    );
    assert!(outcome.requires_refresh);
    assert_eq!(
        engine.get_var("nextCard".to_string()).as_deref(),
        Some("#next")
    );
    assert_eq!(engine.active_card_id().expect("active card"), "next");
    assert_eq!(engine.last_script_requires_refresh(), Some(true));
}

#[test]
fn invoke_script_ref_trap_does_not_apply_deferred_navigation() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #next
    unit.push(0xff); // trap
    register_legacy_script_fixture(&mut engine, "trap-nav.wmlsc", unit);

    let err = engine
        .invoke_script_ref_internal("trap-nav.wmlsc", "main", &[])
        .expect_err("invoke should trap");
    assert!(err.contains("unsupported opcode"));
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.last_script_execution_ok(), Some(false));
}

#[test]
fn invoke_script_ref_fatal_type_error_aborts_invocation() {
    // WAP-193_101 12.3.1.7 classifies this "compiler generated bad code"
    // condition as Fatal, not Non-fatal: the type mismatch aborts the
    // invocation rather than yielding an `invalid` result.
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    register_legacy_script_fixture(
        &mut engine,
        "type-error.wmlsc",
        vec![0x03, 1, b'x', 0x01, 1, 0x02, 0x00],
    );

    let err = engine
        .invoke_script_ref_internal("type-error.wmlsc", "main", &[])
        .expect_err("fatal type error should abort invocation");
    assert!(err.contains("type error"));
    assert_eq!(engine.last_script_execution_ok(), Some(false));
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("fatal")
    );
    assert_eq!(
        engine.last_script_execution_error_category().as_deref(),
        Some("integrity")
    );
}

#[test]
fn invoke_script_ref_fatal_trap_after_go_discards_deferred_navigation_effects() {
    // A fatal trap after a `go()` call must abort the whole invocation
    // (WAP-193_101 12.2: "cause the program to abort"), so the navigation
    // intent deferred before the trap must not take effect.
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
          <card id="next"><p>Next</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go("#next")
    unit.push(0x02); // add => fatal: host call result is not an int32 operand
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "fatal-nav.wmlsc", unit);

    let err = engine
        .invoke_script_ref_internal("fatal-nav.wmlsc", "main", &[])
        .expect_err("fatal trap should abort invocation");
    assert!(err.contains("type error"));
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("fatal")
    );
    assert_eq!(
        engine.last_script_execution_error_category().as_deref(),
        Some("integrity")
    );
}

#[test]
fn invoke_script_ref_go_to_missing_card_reports_failure_not_stale_success() {
    // The VM itself halts cleanly here (no trap) — the failure is entirely in
    // applying the deferred `go()` navigation effect against a target that
    // doesn't exist. `last_script_outcome` must reflect that failure, not the
    // script's own successful execution, or `lastScriptExecutionOk()` would
    // contradict the `Err` this call returns.
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "#missing");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go("#missing")
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "bad-nav.wmlsc", unit);

    let err = engine
        .invoke_script_ref_internal("bad-nav.wmlsc", "main", &[])
        .expect_err("navigation to a missing card must surface as a failure");
    assert!(err.contains("Card id not found"));
    assert_eq!(engine.active_card_id().expect("active card"), "home");
    assert_eq!(engine.last_script_execution_ok(), Some(false));
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("fatal")
    );
    assert_eq!(
        engine.last_script_execution_trap().as_deref(),
        Some("Card id not found")
    );
}

#[test]
fn fatal_invocation_failure_keeps_engine_recoverable() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    register_legacy_script_fixture(&mut engine, "fatal.wmlsc", vec![0xff]);
    register_legacy_script_fixture(
        &mut engine,
        "good.wmlsc",
        vec![0x01, 2, 0x01, 3, 0x02, 0x00],
    );

    let err = engine
        .invoke_script_ref_internal("fatal.wmlsc", "main", &[])
        .expect_err("fatal decode error should abort invocation");
    assert!(err.contains("unsupported opcode"));
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("fatal")
    );
    assert_eq!(
        engine.last_script_execution_error_category().as_deref(),
        Some("integrity")
    );

    let outcome = engine
        .invoke_script_ref_internal("good.wmlsc", "main", &[])
        .expect("engine should stay recoverable after fatal invocation");
    assert_eq!(outcome.result, ScriptValueLiteral::Number(5.0));
    assert_eq!(
        engine.last_script_execution_error_class().as_deref(),
        Some("none")
    );
    assert_eq!(
        engine.last_script_execution_error_category().as_deref(),
        Some("none")
    );
}

#[test]
fn invoke_script_ref_records_dialog_and_timer_effect_traces() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home"><p>Home</p></card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");

    let mut unit = Vec::new();
    push_string(&mut unit, "wake up");
    unit.push(0x20);
    unit.push(0x05);
    unit.push(0x01); // alert(message)
    unit.push(0x01);
    unit.push(25); // delay ms
    push_string(&mut unit, "otp");
    unit.push(0x20);
    unit.push(0x08);
    unit.push(0x02); // setTimer(delayMs, token)
    push_string(&mut unit, "otp");
    unit.push(0x20);
    unit.push(0x09);
    unit.push(0x01); // clearTimer(token)
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "effects.wmlsc", unit);

    let outcome = engine
        .invoke_script_ref_internal("effects.wmlsc", "main", &[])
        .expect("invoke should succeed");
    assert!(outcome.result != ScriptValueLiteral::Invalid { invalid: true });

    let traces = engine.trace_entries();
    assert!(
        traces.iter().any(|entry| entry.kind == "DIALOG_ALERT"),
        "missing dialog trace"
    );
    assert!(
        traces.iter().any(|entry| entry.kind == "TIMER_SCHEDULE"),
        "missing timer schedule trace"
    );
    assert!(
        traces.iter().any(|entry| entry.kind == "TIMER_CANCEL"),
        "missing timer cancel trace"
    );

    assert_eq!(
        engine.last_script_dialog_requests(),
        vec![ScriptDialogRequestLiteral::Alert {
            message: "wake up".to_string(),
        }]
    );
    assert_eq!(
        engine.last_script_timer_requests(),
        vec![
            ScriptTimerRequestLiteral::Schedule {
                delay_ms: 25,
                token: Some("otp".to_string()),
            },
            ScriptTimerRequestLiteral::Cancel {
                token: "otp".to_string(),
            },
        ]
    );
}

#[test]
fn wmlbrowser_script_go_fragment_applies_at_post_invocation_boundary() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="script:nav.wmlsc#main">Script go</a>
          </card>
          <card id="next">
            <p>Next</p>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01);
    unit.push(0x00);
    register_legacy_script_fixture(&mut engine, "nav.wmlsc", unit);

    engine
        .handle_key("enter".to_string())
        .expect("script go should apply post invocation");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
}

#[test]
fn wmlbrowser_script_prev_applies_post_invocation() {
    let mut engine = WmlEngine::new();
    let xml = r##"
        <wml>
          <card id="home">
            <a href="#next">Go next</a>
          </card>
          <card id="next">
            <a href="script:nav.wmlsc#back">Back via script</a>
          </card>
        </wml>
        "##;
    engine.load_deck(xml).expect("deck should load");
    engine
        .handle_key("enter".to_string())
        .expect("fragment nav should work");
    assert_eq!(engine.active_card_id().expect("active"), "next");

    register_legacy_script_fixture(&mut engine, "nav.wmlsc", vec![0x20, 0x04, 0x00, 0x00]);
    engine.register_script_entry_point("nav.wmlsc".to_string(), "back".to_string(), 0);
    engine
        .handle_key("enter".to_string())
        .expect("script prev should apply");
    assert_eq!(engine.active_card_id().expect("active"), "home");
}

#[test]
fn wmlbrowser_navigation_last_call_wins_matrix() {
    let mut engine = WmlEngine::new();
    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #next
    unit.push(0x20);
    unit.push(0x04);
    unit.push(0x00); // prev
    unit.push(0x00);
    let go_prev = unit.clone();

    let mut unit = Vec::new();
    unit.push(0x20);
    unit.push(0x04);
    unit.push(0x00); // prev
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #next
    unit.push(0x00);
    let prev_go = unit.clone();

    let mut unit = Vec::new();
    push_string(&mut unit, "#next");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go #next
    push_string(&mut unit, "");
    unit.push(0x20);
    unit.push(0x03);
    unit.push(0x01); // go ""
    unit.push(0x00);
    let go_cancel = unit.clone();

    register_legacy_script_fixture(&mut engine, "go_prev.wmlsc", go_prev);
    register_legacy_script_fixture(&mut engine, "prev_go.wmlsc", prev_go);
    register_legacy_script_fixture(&mut engine, "go_cancel.wmlsc", go_cancel);

    let go_prev_outcome = engine.execute_script_ref_internal("go_prev.wmlsc", "main");
    assert!(go_prev_outcome.ok);
    assert_eq!(
        go_prev_outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Prev
    );

    let prev_go_outcome = engine.execute_script_ref_internal("prev_go.wmlsc", "main");
    assert!(prev_go_outcome.ok);
    assert_eq!(
        prev_go_outcome.navigation_intent,
        ScriptNavigationIntentLiteral::Go {
            href: "#next".to_string()
        }
    );

    let go_cancel_outcome = engine.execute_script_ref_internal("go_cancel.wmlsc", "main");
    assert!(go_cancel_outcome.ok);
    assert_eq!(
        go_cancel_outcome.navigation_intent,
        ScriptNavigationIntentLiteral::None
    );
}

#[test]
fn convert_script_call_args_maps_number_to_int_when_whole() {
    let args = vec![
        ScriptCallArgLiteral::Number(7.0),
        ScriptCallArgLiteral::Number(7.5),
        ScriptCallArgLiteral::Bool(true),
        ScriptCallArgLiteral::String("x".to_string()),
        ScriptCallArgLiteral::Invalid { invalid: true },
    ];
    let converted = convert_script_call_args(&args);
    assert_eq!(
        converted,
        vec![
            ScriptValue::Int32(7),
            ScriptValue::Float64(7.5),
            ScriptValue::Bool(true),
            ScriptValue::String("x".to_string()),
            ScriptValue::Invalid
        ]
    );
}

#[test]
fn convert_script_call_args_maps_invalid_false_to_empty_string() {
    let args = vec![ScriptCallArgLiteral::Invalid { invalid: false }];
    let converted = convert_script_call_args(&args);
    assert_eq!(converted, vec![ScriptValue::String(String::new())]);
}

#[test]
fn format_decode_error_covers_every_variant() {
    use crate::wavescript::decoder::DecodeError;

    assert_eq!(
        super::super::format_decode_error(DecodeError::EmptyUnit),
        "decode: empty compilation unit"
    );
    assert_eq!(
        super::super::format_decode_error(DecodeError::UnitTooLarge { size: 10, limit: 5 }),
        "decode: unit too large (size=10, limit=5)"
    );
    assert_eq!(
        super::super::format_decode_error(DecodeError::UnsupportedOpcode {
            pc: 1,
            opcode: 0xff
        }),
        "decode: unsupported opcode 0xff at pc=1"
    );
    assert_eq!(
        super::super::format_decode_error(DecodeError::TruncatedImmediate {
            pc: 2,
            opcode: 0x03
        }),
        "decode: truncated immediate for opcode 0x03 at pc=2"
    );
    assert_eq!(
        super::super::format_decode_error(DecodeError::InvalidLocalIndex {
            pc: 3,
            index: 9,
            limit: 4
        }),
        "decode: invalid local index 9 at pc=3 (limit=4)"
    );
    assert_eq!(
        super::super::format_decode_error(DecodeError::InvalidCallArity {
            pc: 4,
            arg_count: 2,
            local_count: 1,
            frame_locals: 3,
            limit: 8
        }),
        "decode: invalid call arity at pc=4 (args=2, locals=1, frame=3, limit=8)"
    );
    assert_eq!(
        super::super::format_decode_error(DecodeError::InvalidHostArgCount {
            pc: 5,
            arg_count: 6,
            limit: 4
        }),
        "decode: invalid host arg count at pc=5 (args=6, limit=4)"
    );
    assert_eq!(
        super::super::format_decode_error(DecodeError::InvalidCallTarget { pc: 6, target: 99 }),
        "decode: invalid call target 99 from pc=6"
    );
}

#[test]
fn format_vm_trap_covers_every_variant() {
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::EmptyUnit),
        "vm: empty unit"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::InvalidEntryPoint { entry_pc: 7 }),
        "vm: invalid entry point (7)"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::UnsupportedOpcode(0xab)),
        "vm: unsupported opcode 0xab"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::TruncatedImmediate { opcode: 0x02 }),
        "vm: truncated immediate for opcode 0x02"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::StackOverflow { limit: 64 }),
        "vm: stack overflow (limit=64)"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::InvalidLocalIndex { index: 3 }),
        "vm: invalid local index (3)"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::InvalidCallTarget { target: 12 }),
        "vm: invalid call target (12)"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::CallDepthExceeded { limit: 8 }),
        "vm: call depth exceeded (limit=8)"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::ExecutionLimitExceeded { limit: 1000 }),
        "vm: execution step limit exceeded (1000)"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::Utf8ImmediateDecode),
        "vm: invalid utf-8 string immediate"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::HostCallUnavailable { function_id: 4 }),
        "vm: host call unavailable (function=4)"
    );
    assert_eq!(
        crate::engine_script_types::format_vm_trap(VmTrap::HostCallError {
            function_id: 5,
            message: "boom".to_string()
        }),
        "vm: host call error (function=5, message=boom)"
    );
}

#[test]
fn script_dialog_request_to_literal_maps_confirm_and_prompt() {
    use crate::runtime::events::ScriptDialogRequest;

    assert_eq!(
        super::super::script_dialog_request_to_literal(&ScriptDialogRequest::Confirm {
            message: "sure?".to_string()
        }),
        ScriptDialogRequestLiteral::Confirm {
            message: "sure?".to_string()
        }
    );
    assert_eq!(
        super::super::script_dialog_request_to_literal(&ScriptDialogRequest::Prompt {
            message: "name?".to_string(),
            default_value: Some("anon".to_string())
        }),
        ScriptDialogRequestLiteral::Prompt {
            message: "name?".to_string(),
            default_value: Some("anon".to_string())
        }
    );
}

#[test]
fn is_valid_var_name_rejects_empty_and_bad_leading_char() {
    assert!(!super::super::is_valid_var_name(""));
    assert!(!super::super::is_valid_var_name("1abc"));
    assert!(super::super::is_valid_var_name("_abc"));
    assert!(super::super::is_valid_var_name("a.b-c"));
}
