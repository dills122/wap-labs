# Waves WaveScript VM Architecture

Version: v0.1  
Status: Active (Phase W execution in progress)

Companion tracking matrix:

- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`

## Scope

This document defines how WaveScript VM support should be integrated into Waves, aligned with:

- runtime-first architecture
- Tauri host model
- Rust in-process transport
- deterministic behavior gates before protocol rewrite

Primary source references:

- `spec-processing/source-material/WAP-193-WMLScript-20001025-a.pdf`
- `spec-processing/source-material/WAP-193_101-WMLScript-20010928-a.pdf`
- `spec-processing/source-material/WAP-194-WMLScriptLibraries-20000925-a.pdf`
- `spec-processing/source-material/WAP-194_103-WMLScriptLibraries-20020318-a.pdf`

Secondary implementation reference (tutorial material):

- https://www.developershome.com/wap/wmlscript/

## Goals

- Execute WMLScript bytecode units inside `engine-wasm` runtime.
- Support runtime integration points used by decks:
  - softkey actions (`<do>`)
  - intrinsic event handlers (`<onevent>`, `ontimer`, `onenter*`, `onpick`)
  - `WMLBrowser.*` APIs (vars, nav, timers)
- Keep strict separation between:
  - VM core (bytecode execution)
  - runtime host bindings (navigation/vars/dialogs/timers)
- Roll out incrementally with a usable MVP before completeness.

## Kickoff decisions

- VM/interpreter execution live in `engine-wasm` (not in `browser/`).
- Host integrations are limited to side effects: dialogs, timer wake/tick, and optional script fetch for cache misses.
- First runnable host path is `engine-wasm/host-sample`; Waves browser integration follows later.
- `WMLBrowser.refresh()` baseline is deferred refresh semantics first; immediate refresh stays feature-gated.

## W0-01 Contract Baseline (Implemented)

`engine-wasm/contracts/wml-engine.ts` now defines the script invocation model used by Phase W work:

- `ScriptInvocationContext`: runtime-owned call-site metadata (`callSite`, `cardId`, optional `sourceHref`).
- `ScriptInvocationRef`: script reference plus invocation context and args.
- Script execution and invocation outcomes expose deterministic `navigationIntent` and
  `requiresRefresh` fields directly in their serialized shape.
- `ScriptHostCapabilities`: host side-effect adapters only (`dialogs`, `timers`, optional `scriptFetch`).

This contract keeps VM/interpreter semantics in `engine-wasm` while limiting host responsibilities to side effects.
The Rust serde DTOs are now the serialized source of truth through the narrow additive M1-03
follow-up; the complete native/WASM method facade remains handwritten.

Contract-level fixture coverage for W0-01 is tracked with host-sample decks:

- `engine-wasm/host-sample/examples/wmlbrowser-var-nav.wml`
- `engine-wasm/host-sample/examples/wavescript-nav-order.wml`
- `engine-wasm/host-sample/examples/wavescript-go-cancel.wml`
- `engine-wasm/host-sample/examples/wavescript-refresh-policy.wml`

## External implementation references (modern browser architecture)

These references are used as architecture guidance only (not behavior spec authority):

- Chromium process model and site isolation:
  - https://chromium.googlesource.com/chromium/src/+/main/docs/process_model_and_site_isolation.md
  - https://www.chromium.org/developers/design-documents/site-isolation/
- WebKit multi-process architecture:
  - https://docs.webkit.org/Deep%20Dive/Architecture/WebKit2.html
- Event loop and navigation processing model:
  - https://html.spec.whatwg.org/multipage/webappapis.html#event-loops
  - https://html.spec.whatwg.org/multipage/browsing-the-web.html
- Execution safety model reference:
  - https://webassembly.org/docs/security/

Derived implementation standards for Waves WaveScript VM runtime:

1. Runtime semantics authority stays in engine:
- Script decode/verify/execute semantics are resolved in `engine-wasm`, not in host UI layers.
2. Host interface is capability-minimal:
- Host only performs side effects requested by engine (dialogs/timer wake/script fetch on miss).
3. Verification before execution:
- Bytecode unit structure and limits are validated before instruction execution.
4. Bounded execution by default:
- Step, stack, call-depth, and memory growth limits are required in MVP.
5. Trap, do not crash:
- Script failures surface as deterministic runtime errors and do not terminate host process.
6. Deferred side-effect application:
- Navigation intents raised in script are applied by runtime at deterministic boundaries (post invocation).

## Non-goals (initial)

- Full WTAI/telephony/device-specific behavior parity.
- Full vendor quirk parity across all historical microbrowsers.
- In-engine `.wmls` source compiler (assume compiled bytecode path first).

## Architecture

### WMLS-501 registered-unit routing boundary

- `registerScriptUnit` stores raw bytes. When invoked without manual PC metadata, the engine
  decodes the bytes with `decode_wap_compilation_unit`, verifies every pool/function/reference,
  resolves the requested external name from the decoded function-name table, and only then enters
  the bounded WAP executor.
- The bounded executor currently implements only WAP-193 `RETURN_ES`. Structurally valid but
  unsupported opcodes return fatal/host-binding outcomes; verification failures return
  fatal/integrity outcomes. Both remain observable through native/WASM invocation and trace state.
- Before execution, the verifier validates WAP-194 Appendix A library/function identifiers and
  their arities, then propagates source-defined stack effects through reachable control flow.
  Underflow, a depth above 64, and inconsistent branch merges fail deterministically; balanced
  loops, unreachable regions, and implicit/explicit return boundaries remain well-defined.
- `registerScriptEntryPoint` is the explicit compatibility opt-in for the project-specific
  nine-opcode fixture VM. Manual PCs are not part of the WAP-193 function-name model and must not
  be treated as normative evidence.
- This slice does not implement WMLS-502 operators/conversions, WMLS-504 standard-library
  behavior, access control, URL fetch, or complete chapter 12 behavior.

### Components

1. WaveScript loader  
Resolves script URL/function references to loaded bytecode units and function IDs.

2. Bytecode decoder  
Parses and validates compilation units into an internal representation.

3. VM core (stack machine)  
Runs instruction streams with bounded stacks/frames/PC and deterministic traps.

4. Runtime host bindings  
Implements runtime-facing library behavior (`WMLBrowser`, dialogs, vars, timers, URL utilities).

5. Engine integration layer  
Connects script invocation into existing navigation/event/softkey runtime flow.

### Boundary split

Inside Rust/WASM:

- decoder
- VM core
- pure stdlib utilities (`Lang`, `String`, `URL`, `Float`)
- runtime state mutation logic

In host (`browser/`):

- dialog UI presentation
- optional timer scheduling hostcalls
- script fetch hostcalls (if not cached in runtime)

## Data model

### Values

Recommended tagged union:

- `Bool`
- `Int32`
- `Float64`
- `String`
- `Url` (string wrapper)
- `Invalid` / sentinel (optional)

All coercion rules must be centralized and deterministic.

### VM state

- operand stack
- call frames
- PC
- current unit/function

### Runtime context

- active deck/card identity
- navigation stack
- string-keyed variable store
- timer queue
- pending navigation intent

## Instruction strategy

Phase 1 recommendation:

- decode and execute close to spec opcode model first
- optional internal IR translation later for optimization and maintainability

## Standard library rollout

### Tier 0 (MVP-critical)

- `Lang` (coercions/checks)
- `String` (basic operations)
- `WMLBrowser` subset:
  - `getVar`
  - `setVar`
  - `go`
  - history/back behavior (subset)
  - timer subset (as adopted)

### Tier 1

- `URL` helpers
- `Dialogs` (`alert`, `confirm`, `prompt`) via host or runtime UI layer

### Tier 2

- broader `Float` coverage and compatibility refinements

## Engine integration points

### Softkeys (`<do>`)

Action model should support script calls as first-class action type, not only `go`.

### Intrinsic events (`<onevent>`)

Handlers execute in deterministic order; scripts may mutate vars, set timers, or trigger navigation.

### Timers (`ontimer`)

Runtime should own deterministic timer semantics; host may provide wake/tick primitives.

### Navigation terminal behavior

Default policy (configurable): `go()` inside a handler is terminal for current handler chain.

Compatibility notes to validate against `WAP-193*`/`WAP-194*`:

- browser transition effects are applied when control returns from script execution
- multiple navigation calls in one invocation should collapse to the final effective navigation action
- repeated `prev()` in one invocation may only apply once in some user-agent behaviors

### Practical compatibility notes (tutorial-derived, validate against spec PDFs)

- callable entry points from WML should be treated as exported functions (`extern` usage pattern)
- WMLScript is linked externally from WML (`script.wmls#function()` form), not embedded inline
- `WMLBrowser.setVar()` updates often require explicit refresh behavior (`WMLBrowser.refresh()`) to surface UI changes on current card
- `WMLBrowser.go()` and `WMLBrowser.prev()` are commonly treated as returning success sentinel vs invalid on error in deployed tutorial examples

## WASM/Host calls

Minimum hostcall shape (if used):

- fetch script bytecode
- dialog operations
- timer schedule/cancel

Keep host API surface minimal and deterministic.

## Error model and safety

Traps should be runtime errors, not process crashes:

- bytecode format error
- stack underflow
- type error
- unknown library function
- invalid URL
- execution limit exceeded

Execution guardrails required from first runnable VM:

- max instruction steps
- max call depth
- max stack size
- bounded string growth

## Milestones

### M-A Script-aware runtime (no execution)

- parse and resolve script bindings
- event/softkey call-site plumbing and trace logging

### M-B VM core executes minimal bytecode

- decoder skeleton
- stack/frame/return behavior
- arithmetic/branch baseline

### M-C `WMLBrowser` vars + `go`

- invoke scripts from softkey and `onenterforward`
- vars and navigation mutation path

### M-D Timers + dialogs

- timer scheduling and `ontimer` dispatch
- dialog host integration path

### M-E Compatibility and coverage expansion

- broader stdlib support
- coercion parity improvements
- corpus and fuzz-style robustness testing

## Testing strategy

1. Golden corpus:
- fixture decks + compiled units + expected outcomes

2. Deterministic VM unit tests:
- opcode behavior
- stdlib coercion/function tests

3. Integration tests:
- enter/event/script/navigation chains
- softkey script behavior
- multi-nav-in-single-invocation behavior (`go/go`, `go/prev`, `prev/prev`) for compatibility profiling

4. Optional differential testing:
- compare navigation/variable traces against reference emulators where feasible

## Repository module targets

- `engine-wasm/engine/src/wavescript/decoder.rs`
- `engine-wasm/engine/src/wavescript/vm.rs`
- `engine-wasm/engine/src/wavescript/wap_decoder.rs`
- `engine-wasm/engine/src/wavescript/wap_runtime.rs`
- `engine-wasm/engine/src/wavescript/value.rs`
- `engine-wasm/engine/src/wavescript/stdlib/*`
- `engine-wasm/engine/src/runtime/events.rs`
- `engine-wasm/engine/src/runtime/softkeys.rs`

## Notes

- This plan intentionally assumes transport CLI viability and substantial runtime maturity.
- It does not authorize implementation start by itself; start remains gated by project kickoff.
