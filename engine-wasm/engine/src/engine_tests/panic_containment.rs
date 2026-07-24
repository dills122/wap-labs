use super::*;

/// Runs `f` with the default panic hook suppressed, so a deliberately
/// triggered-and-caught panic in these tests doesn't spam stderr with a
/// backtrace on every test run. The panic is still caught and converted to
/// a `Result` by `catch_engine_panic` either way; this only silences the
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
    // Regression coverage for the panic-containment boundary: this crate
    // has no `[profile.release] panic = "abort"`, so `catch_unwind` is
    // expected to actually catch here rather than the process aborting.
    let result = without_panic_hook_noise(|| {
        catch_engine_panic(|| -> Result<(), String> { panic!("boom") })
    });

    let err = result.expect_err("a panic must be converted into a typed error, not propagate");
    assert!(
        err.contains("engine: internal panic contained"),
        "unexpected message: {err}"
    );
    assert!(err.contains("boom"), "unexpected message: {err}");
}

#[test]
fn catch_engine_panic_converts_owned_string_panics_into_a_typed_error() {
    let result = without_panic_hook_noise(|| {
        catch_engine_panic(|| -> Result<(), String> {
            panic!("{}", format!("boom-{}", 7));
        })
    });

    let err = result.expect_err("a panic must be converted into a typed error, not propagate");
    assert!(
        err.contains("engine: internal panic contained"),
        "unexpected message: {err}"
    );
    assert!(err.contains("boom-7"), "unexpected message: {err}");
}

#[test]
fn catch_engine_panic_keeps_the_caller_usable_afterward() {
    // A caught panic must not leave the process/thread in a state where
    // further work is impossible: subsequent calls (including ones that
    // exercise the same engine instance's normal public API) must keep
    // working. This is the behavior the WASM host boundary depends on:
    // one contained panic should not brick the instance.
    let mut engine = WmlEngine::new();
    let _ = without_panic_hook_noise(|| {
        catch_engine_panic(|| -> Result<(), String> { panic!("boom") })
    });

    engine
        .load_deck("<wml><card id=\"home\"><p>Home</p></card></wml>")
        .expect("engine must remain usable after an unrelated caught panic");
    assert_eq!(engine.active_card_id().expect("active card"), "home");
}
