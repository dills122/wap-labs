use super::*;

/// Runs `f` with the default panic hook suppressed, so a deliberately
/// triggered-and-caught panic in these tests doesn't spam stderr with a
/// backtrace on every test run. The panic is still caught and converted to
/// a `Result` by the native boundary either way; this only silences the
/// diagnostic print that the default hook performs before unwinding.
fn without_panic_hook_noise<T>(f: impl FnOnce() -> T) -> T {
    let previous_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(|_| {}));
    let result = f();
    std::panic::set_hook(previous_hook);
    result
}

#[test]
fn catch_engine_panic_passes_through_non_panicking_results() {
    let result: Result<Result<i32, String>, String> = catch_engine_panic(|| Ok(42));
    assert_eq!(result, Ok(Ok(42)));

    let result: Result<Result<i32, String>, String> =
        catch_engine_panic(|| Err("some engine error".to_string()));
    assert_eq!(result, Ok(Err("some engine error".to_string())));
}

#[test]
fn catch_engine_panic_converts_str_literal_panics_into_a_typed_error() {
    let result = without_panic_hook_noise(|| {
        catch_engine_panic(|| -> Result<(), String> { panic!("boom") })
    });

    let err = result.expect_err("a panic must be converted into a typed error, not propagate");
    assert_eq!(err, crate::CONTAINED_ENGINE_PANIC_ERROR);
}

#[test]
fn catch_engine_panic_converts_owned_string_panics_into_a_typed_error() {
    let result = without_panic_hook_noise(|| {
        catch_engine_panic(|| -> Result<(), String> {
            panic!("{}", format!("boom-{}", 7));
        })
    });

    let err = result.expect_err("a panic must be converted into a typed error, not propagate");
    assert_eq!(err, crate::CONTAINED_ENGINE_PANIC_ERROR);
}

#[test]
fn mutation_boundary_rolls_back_panicking_candidate_and_keeps_engine_usable() {
    let mut engine = WmlEngine::new();
    engine
        .load_deck("<wml><card id=\"home\"><p>Home</p></card></wml>")
        .expect("initial deck should load");
    assert!(engine.set_var("status".to_string(), "before".to_string()));

    let result = without_panic_hook_noise(|| engine.load_deck(crate::PANIC_BOUNDARY_TEST_WML));
    assert_eq!(
        result.expect_err("load panic must be contained"),
        crate::CONTAINED_ENGINE_PANIC_ERROR
    );
    assert_eq!(
        engine.get_var("status".to_string()).as_deref(),
        Some("before")
    );
    assert_eq!(engine.active_card_id().as_deref(), Ok("home"));
    assert_eq!(
        engine
            .get_var("panic-boundary-probe".to_string())
            .as_deref(),
        None
    );

    engine
        .load_deck("<wml><card id=\"next\"><p>Next</p></card></wml>")
        .expect("engine must remain usable after a contained panic");
    assert_eq!(engine.active_card_id().expect("active card"), "next");
}
