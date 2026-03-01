# Waves WMLScript Runtime + VM Architecture

Version: v0.1  
Status: Planning (no implementation started)

Companion tracking matrix:

- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`

## Scope

This document defines how WMLScript support should be integrated into Waves, aligned with:

- runtime-first architecture
- Tauri host model
- Python sidecar transport (temporary)
- deterministic behavior gates before protocol rewrite

Primary source references:

- `docs/source-material/WMLScript/WAP-193-WMLScript-20001025-a.pdf`
- `docs/source-material/WMLScript/WAP-193_101-WMLScript-20010928-a.pdf`
- `docs/source-material/WMLScript/WAP-194-WMLScriptLibraries-20000925-a.pdf`
- `docs/source-material/WMLScript/WAP-194_103-WMLScriptLibraries-20020318-a.pdf`

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

## Non-goals (initial)

- Full WTAI/telephony/device-specific behavior parity.
- Full vendor quirk parity across all historical microbrowsers.
- In-engine `.wmls` source compiler (assume compiled bytecode path first).

## Architecture

### Components

1. WMLScript loader  
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

## Repository module targets (planned)

- `engine-wasm/engine/src/wmlscript/decoder.rs`
- `engine-wasm/engine/src/wmlscript/vm.rs`
- `engine-wasm/engine/src/wmlscript/value.rs`
- `engine-wasm/engine/src/wmlscript/stdlib/*`
- `engine-wasm/engine/src/runtime/events.rs`
- `engine-wasm/engine/src/runtime/softkeys.rs`

## Notes

- This plan intentionally assumes transport CLI viability and substantial runtime maturity.
- It does not authorize implementation start by itself; start remains gated by project kickoff.
