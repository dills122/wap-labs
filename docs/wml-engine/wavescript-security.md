# WaveScript VM Security & Sandbox Guardrails

Purpose: define mandatory safety controls for executing WaveScript bytecode in `engine-wasm/engine`.

## Threat Model (Current Scope)

1. Untrusted deck/script input tries to crash host/runtime.
2. Script execution attempts unbounded CPU or memory growth.
3. Script attempts to escape engine ownership boundaries (network/filesystem/host logic).
4. Malformed bytecode attempts undefined behavior.

## Mandatory Guardrails

1. Verification before execution
- Bytecode decode gate runs before VM execute.
- Empty/oversized units fail deterministically.

2. Bounded execution
- Instruction step limit.
- Operand stack limit.
- Call-depth limit.
- Deterministic traps on overflow/underflow.

3. Runtime-owned side effects only
- `WMLBrowser` mutations happen only in engine runtime state.
- Host never decides script semantics.
- Navigation/refresh effects apply only at post-invocation boundary.

4. Host binding hard limits
- Variable name validation + max name length.
- Variable value max length.
- `go()` href max length.
- Unknown host functions trap deterministically.

5. No capability escalation
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
