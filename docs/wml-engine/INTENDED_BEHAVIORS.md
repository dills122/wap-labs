# WaveNav Intended Behaviors

Purpose: record observable Waves behavior that can look like a defect during real-device-style
testing but is required by WML semantics or is an explicit product decision.

This is an active behavior reference. It is not the vendor-divergence catalogue in
[`HISTORICAL_QUIRKS.md`](HISTORICAL_QUIRKS.md), and it must not be used to excuse behavior that
contradicts the selected WML profile, a Waves contract, or a security boundary.

## Classification rule

Before adding an entry:

1. reproduce the behavior with a stable deck and interaction sequence;
2. identify the engine, browser, transport, or content-authoring contract that owns it;
3. cite normative or repository evidence for the intended result;
4. open a bug instead when the implementation contradicts that evidence; and
5. link nearby bugs so the intended core behavior is not confused with an incorrect presentation
   or interaction layered on top of it.

## IB-001: Form variables persist within a browser context

- **Status:** intended WML behavior
- **Observed:** 2026-07-28 during public login/register testing
- **Surface:** WaveNav variable state, input initialization, and navigation history
- **Applies to:** committed WML input values, including values reused by controls with the same
  variable name on another deck

### What happens

After a user commits an input value, navigating away and then returning can show that value in the
control again. Login and registration can also share a value when both decks use the same input
variable name, such as `username` or `pin`.

### Why it is intended

WML variables belong to the current browser context rather than to one rendered card. An input is
initialized from an existing valid variable before its authored default value is considered.
Normal `go` and Back navigation preserve the browser context, so returning to a form reuses its
committed variables.

WaveNav implements this deliberately:

- `WML-CL-INPUT-INITIALIZATION` requires existing valid name variables to initialize inputs;
- `WML-CL-VARIABLE-COMMIT-BEFORE-TASK` requires controls to commit their variables before a task;
- `RQ-RMK-003` requires deterministic history and context preservation; and
- `newcontext="true"` is the explicit WML mechanism that clears variables and history when entered
  through the defined `go` process.

Authors who do not want two forms to share values should use distinct variable names. Sensitive
values can be explicitly cleared by authored WML at the appropriate lifecycle boundary. Applying
`newcontext="true"` solely to clear one field is usually too broad because it also resets history
and the rest of the browser context.

### Boundaries that are bugs

Variable persistence does not permit the browser or deck to expose a secret incorrectly or make
editing ambiguous:

- [#480](https://github.com/dills122/wap-labs/issues/480) tracks the login/register decks omitting
  `type="password"` and therefore displaying PIN values as plaintext.
- [#481](https://github.com/dills122/wap-labs/issues/481) tracks Backspace falling through to
  history navigation when an input is visually focused but its edit session is inactive.

Those defects should be fixed without removing browser-context variable persistence.

### Verification evidence

- `node scripts/wap-context-pack.mjs WML-204`
- `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md` under `RQ-RMK-003` and `RQ-RMK-005`
- `engine-wasm/engine/src/engine_tests/wml_301_context_history.rs`
- `engine-wasm/engine/src/engine_tests/navigation_metadata.rs`
- `engine-wasm/examples/source/wml-204-control-validation.wml`

## IB-002: Failed WML tasks keep runtime state and expose bounded host copy

- **Status:** intended WML behavior
- **Observed:** 2026-08-02 during WML-306 policy closure
- **Surface:** task execution, low-memory recovery, native/WASM adapters, and browser presentation
- **Applies to:** failed card tasks and variable-store exhaustion during a task

### What happens

A failed task leaves its invoking card, focus, variables, event state, and history unchanged. Native
Rust callers still receive the technical error for diagnostics. WASM and Tauri host mutation
boundaries instead return the rolled-back frame with `lastRuntimeFailureCode` and safe
`lastRuntimeFailureMessage` fields. The browser maps only the recognized stable codes to
host-owned copy and never displays an arbitrary technical message from those fields.

When the configured variable-store limit is exhausted, the engine first clears its owned history
and retries. If that is insufficient, it resets the browser context to the documented empty state,
increments `browserContextEpoch` so the host clears request history, retries once, and publishes
`WML_CONTEXT_RESET`. The host history remains a bounded 32-entry LRU, above the WML recommended
minimum of ten.

### Boundaries that are bugs

- A failed task must not commit assignments, navigation, focus, event, or history state.
- A context reset must not leave the host's request history in the old epoch.
- Browser UI must not render raw parser offsets, variable names/values, or other technical error
  detail; unknown runtime failure codes are ignored by the presenter.
- The engine must not fetch resources, evict transport cache, or move WML semantics into the host.

### Verification evidence

- `node scripts/wap-context-pack.mjs WML-306`
- `engine-wasm/engine/tests/fixtures/wml-306/`
- `engine-wasm/engine/src/engine_tests/wml_306_policy.rs`
- `browser/src-tauri/src/tests/engine_wrappers.rs`
- `browser/frontend/src/app/browser-presenter.test.ts`
- `browser/frontend/src/session-history.test.ts`
- `engine-wasm/examples/source/wml-306-policy-recovery.flow.json`

## Entry template

New entries should include:

- a stable `IB-NNN` identifier and concise title;
- status and observation date;
- affected surface and reproduction summary;
- the reason the behavior is intended;
- its boundaries, including linked bugs for incorrect adjacent behavior; and
- direct specification, contract, implementation, and test evidence.
