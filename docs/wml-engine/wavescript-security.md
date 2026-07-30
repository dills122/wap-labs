# WaveScript VM Security & Sandbox Guardrails

Purpose: define mandatory safety controls for executing WaveScript bytecode in `engine-wasm/engine`.

## Threat Model (Current Scope)

1. Untrusted deck/script input tries to crash host/runtime.
2. Script execution attempts unbounded CPU or memory growth.
3. Script attempts to escape engine ownership boundaries (network/filesystem/host logic).
4. Malformed bytecode attempts undefined behavior.
5. Untrusted deck navigation graph (`onenterforward`/`onenterbackward`/`<go>`/`<prev>`,
   including cycles re-entered via `WMLBrowser.go()`) attempts unbounded recursion.

## Mandatory Guardrails

1. Verification before execution
- Registered WAP-193 units are decoded and fully verified before external name lookup or bounded
  execution. Verification includes reference domains, standard-library/function identifiers,
  reachable instruction stack effects, branch-merge depth consistency, and return boundaries. A
  structural failure in any function quarantines the complete unit.
- Manual entry-point PCs explicitly select the legacy nine-opcode fixture decoder/VM; that
  compatibility lane is not normative WAP-193 evidence.
- Empty/oversized units fail deterministically.

2. Bounded execution
- Instruction step limit.
- Operand stack limit (64 values for both the strict WAP verifier and legacy bounded fixture VM).
- Call-depth limit (`max_call_depth` is the true maximum total call-frame
  count, including the root frame; the boundary check traps at
  `frames.len() >= max_call_depth`, not one frame later).
- Navigation dispatch-depth limit (`MAX_NAV_DISPATCH_DEPTH` in
  `engine-wasm/engine/src/lib.rs`): bounds recursive re-entry into
  navigation via `onenterforward`/`onenterbackward` actions and
  `WMLBrowser.go()`/`prev()` script effects, so a cyclic deck (e.g. two
  cards whose `onenterforward` actions target each other) traps with a
  typed error instead of recursing until the stack overflows. Mirrors the
  existing `MAX_TIMER_DISPATCH_DEPTH` guard for `<timer>`/`ontimer`
  re-entry.
- Deterministic traps on overflow/underflow.

3. Panic containment at public entrypoints
- Public entrypoints most exposed to untrusted deck/script content
  (`loadDeckContext`, `render`, `handleKey`, `navigateToCard`, `navigateBack`,
  `advanceTimeMs`, focused-edit session methods, and the
  `executeScriptRef*`/`invokeScriptRef*` family) run against an isolated engine
  candidate and commit it only after the boundary returns. A panic therefore
  cannot expose partially-mutated live engine state.
- Native targets use `std::panic::catch_unwind`. Stable
  `wasm32-unknown-unknown` cannot unwind, so the WASM implementation invokes
  the candidate operation through a JavaScript re-entry boundary and converts
  its WebAssembly trap into the same deterministic
  `engine: internal panic contained` error. The wasm-target test suite
  deliberately panics inside this boundary, verifies the typed error and state
  rollback, and then reuses the engine instance.
- Platform limitation: allocating/cloning the isolated candidate and creating
  the JavaScript callback happen before the trap boundary. An allocation
  failure while establishing that boundary still aborts on
  `wasm32-unknown-unknown`; bounded deck, script, and variable state remains
  the primary protection for that class of failure.

4. Runtime-owned side effects only
- `WMLBrowser` mutations happen only in engine runtime state.
- Host never decides script semantics.
- Navigation/refresh effects apply only at post-invocation boundary.

5. Host binding hard limits
- Variable name validation + max name length.
- Variable value max length.
- `go()` href max length.
- Unknown host functions trap deterministically.

6. No capability escalation
- No network fetch in WaveScript VM/runtime core.
- No filesystem access from script runtime.
- No WBXML parsing in script/host adapter layers.

## Test Expectations

Required recurring checks:

1. Decode/VM trap matrix
- empty unit
- unsupported opcode
- truncated immediates
- execution limit exceeded

2. Host binding safety matrix
- invalid variable name rejected
- oversized variable value rejected without mutation
- unknown host function traps

3. Invocation boundary matrix
- `executeScriptRef*` is raw (no deferred nav apply)
- `invokeScriptRef*` applies deferred nav/refresh at boundary
- trap during invoke does not apply deferred navigation side effects

4. Recursion/panic-containment matrix
- cyclic `onenterforward`/`onenterbackward` deck navigation traps with a
  typed error (nav dispatch-depth guard) instead of overflowing the stack
- deeply-nested-but-well-formed WML tag trees are rejected during parse
  (parse-tree depth budget), not only in the later semantic walkers
- native and wasm panic boundaries convert a deliberate panic into the same
  typed error, preserve the pre-call engine state, and leave the instance
  usable for subsequent operations

## Operational Commands

Run from repo root:

```bash
make test-rust
```

Optional coverage gate:

```bash
make coverage-rust
# requires: cargo install cargo-llvm-cov
```

Optional pre-push coverage hook:

```bash
WAP_ENABLE_RUST_COVERAGE_HOOKS=1 \
WAP_RUST_COVERAGE_MIN=90 \
WAP_RUST_FUNCTION_COVERAGE_MIN=85 \
git push
```
