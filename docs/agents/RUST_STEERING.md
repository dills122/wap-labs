# Rust Steering (WaveNav Engine)

Purpose: project-specific Rust rules for contributors and coding agents working on the WaveNav engine (`engine-wasm/engine`).

This file is intentionally prescriptive. When there is a conflict between "clever" and "predictable", choose predictable.

## 1. Scope

Applies to:

- `engine-wasm/engine/**`
- Rust-facing parts of `engine-wasm/pkg` generation flow
- Rust-related CI and quality gates

Does not apply to:

- Python transport layer (`transport-python/`)
- Electron/TypeScript host logic (except contract alignment concerns)

## 2. Canonical External Standards

Use these as normative references before introducing custom patterns:

1. Rust Reference (`doc.rust-lang.org/reference/`)
2. Rust API Guidelines checklist (`rust-lang.github.io/api-guidelines/checklist.html`)
3. Rust Style Guide + style editions (`doc.rust-lang.org/style-guide/`)
4. Clippy usage and lint groups (`doc.rust-lang.org/clippy/usage.html`)
5. Cargo Book (commands, workspaces, resolver, profiles)
6. Rustdoc Book (docs tests and lint behavior)
7. Rust Book chapter on panic vs Result (`ch09-03`)

Project rule: if an internal convention conflicts with these references, prefer the official Rust guidance unless it breaks explicit repository architecture constraints.

## 3. Language and Toolchain Policy

1. Edition:

- Keep crate edition explicit in `Cargo.toml`.
- Do not bump edition in incidental PRs.

2. Toolchain:

- CI uses stable Rust.
- Prefer `cargo` subcommands over ad-hoc scripts.

3. Formatting:

- Use `cargo fmt`.
- CI gate is `cargo fmt --check`.
- Avoid custom rustfmt style overrides unless there is a concrete readability or diff-stability reason.

4. Linting:

- Use `cargo clippy` for advisories, but avoid enabling broad deny-all lint policies without team agreement.
- If a lint is intentionally not followed, use narrow `#[allow(...)]` at the smallest scope with a short rationale comment.

## 4. Architecture Rules for This Repo

1. Rust engine owns:

- WML parse/runtime/layout/focus/navigation semantics.

2. Rust engine does not own:

- Network access
- WSP/WBXML decode
- Transport retries/session protocols

3. WASM boundary:

- Export only stable, host-oriented methods via `#[wasm_bindgen]`.
- Keep rich internal logic in non-exported helpers returning Rust-native types (`Result<T, String>` or typed errors).
- Convert to `JsValue` at boundary edges only.

4. Public contract alignment:

- Any boundary behavior change must update:
- `engine-wasm/contracts/wml-engine.ts`
- related docs under `docs/wml-engine/`

## 5. API Design Rules

Follow Rust API Guidelines directly for naming, traits, docs, predictability:

1. Naming:

- Types/traits: `UpperCamelCase`
- functions/methods/modules: `snake_case`
- constants/statics: `SCREAMING_SNAKE_CASE`

2. Method naming:

- Use idiomatic names (`new`, `from_*`, `as_*`, `to_*`, `into_*`) consistently.
- Do not invent one-off naming patterns for conversions.

3. Predictability:

- Prefer methods when there is a clear receiver.
- Keep word order consistent across related methods/types.

4. Trait derivations:

- Derive common traits where semantically correct (`Debug`, `Clone`, `PartialEq`, `Eq`, etc.).
- Avoid deriving traits that can mislead semantics (example: `Copy` for large or stateful types).

5. Type exposure:

- Prefer private fields + constructor/helper methods over broad public mutable structs, unless the struct is intentionally a plain data model.

## 6. Error Handling Policy

1. Default:

- Return `Result` for recoverable failures.

2. Panic usage:

- `panic!` is acceptable for impossible internal invariants and test scaffolding.
- Avoid panic paths in normal runtime/host input flows.

3. WASM edge:

- Internal functions should return Rust errors.
- Map to `JsValue` only in exported API methods.

4. Error messages:

- Keep messages stable and concise for integration tests.
- Prefer deterministic text to aid snapshot/contract checks.

## 7. State and Mutability

1. Keep runtime state transitions explicit.

2. For nav/focus/history:

- Update one concern at a time.
- Preserve deterministic ordering.
- Write tests for state before and after each transition.

3. Avoid hidden side effects:

- Do not mutate unrelated state in parse/layout functions.

## 8. WASM-Specific Guidance

1. Minimize `wasm_bindgen` surface area.

2. Keep data crossing boundary simple and serializable.

3. Avoid passing complex internal structs directly to JS when a stable view model is sufficient.

4. Keep host compatibility:

- Do not break existing exported method names/signatures in incidental refactors.
- If breaking, do it intentionally with contract and docs updates in the same change.

## 9. Testing and TDD Rules

1. Mandatory workflow:

- Red (failing test) -> Green (minimal fix) -> Refactor.

2. Minimum tests for behavior changes:

- Unit tests for parser/runtime helper logic.
- Integration-style tests for key-sequence and state transitions.

3. Required validation commands for Rust-only PRs:

- `cargo fmt --check`
- `cargo test`

4. Preferred test qualities:

- Deterministic assertions on state (`active_card_idx`, focus index, nav stack behavior).
- Avoid brittle assertions on incidental formatting unless snapshot intent is explicit.

5. Documentation tests:

- Add doctests for public APIs where useful.
- Keep examples runnable when possible.

## 10. Performance and Allocation Guidance

1. Optimize for correctness first, but avoid obvious unnecessary allocations in hot paths (layout, key handling).

2. Do not introduce complex caching until there is measured need.

3. When optimizing:

- Benchmark or at least compare before/after behavior and complexity.
- Keep readability unless perf gain is meaningful.

## 11. Unsafe and FFI Policy

1. `unsafe` is disallowed by default in this crate.

2. If `unsafe` becomes necessary:

- Isolate to minimal module/function.
- Document invariants and why safe alternatives are insufficient.
- Add targeted tests for boundary assumptions.

3. No direct FFI expansion without explicit design review.

## 12. CI/Quality Gates (Rust)

Current required Rust gates:

1. `cargo fmt --check`
2. `cargo test`

Optional/disabled gates (enable intentionally later):

1. `cargo clippy --all-targets --all-features -- -D warnings`
2. rustdoc lint escalation (for public crate hardening)

## 13. PR Checklist (Rust Changes)

Before merge, verify:

1. Behavior change is covered by tests (preferably added first).
2. No wasm boundary signature drift without contract/doc updates.
3. `cargo fmt --check` passes.
4. `cargo test` passes.
5. Relevant `docs/wml-engine/*` updated when semantics changed.
6. No generated artifacts committed unless intentionally required.

## 14. Common Anti-Patterns to Avoid

1. Parsing shortcuts that accept invalid deck roots silently.
2. Swallowing navigation errors at internal layers.
3. Panicking on user-provided deck content.
4. Coupling parser/runtime internals directly to JS error handling.
5. Expanding scope into transport/network behavior from Rust engine code.

## 15. Repo-Specific Command Quick Reference

From repo root:

```bash
cd engine-wasm/engine
cargo fmt --check
cargo test
wasm-pack build --target web --out-dir ../pkg
```

Host sample sanity (requires built pkg):

```bash
pnpm --dir engine-wasm/host-sample run build
```

## 16. Source References

- Rust Reference: https://doc.rust-lang.org/reference/
- Rust API Guidelines: https://rust-lang.github.io/api-guidelines/
- API Checklist: https://rust-lang.github.io/api-guidelines/checklist.html
- Naming guidelines: https://rust-lang.github.io/api-guidelines/naming.html
- Rust Style Guide: https://doc.rust-lang.org/style-guide/
- Style editions: https://doc.rust-lang.org/stable/style-guide/editions.html
- Clippy usage: https://doc.rust-lang.org/stable/clippy/usage.html
- Cargo test: https://doc.rust-lang.org/cargo/commands/cargo-test.html
- Cargo resolver/workspaces: https://doc.rust-lang.org/nightly/cargo/reference/resolver.html
- Rustdoc doctests: https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html
- Rustdoc lints: https://doc.rust-lang.org/rustdoc/lints.html
- Panic vs Result (Rust Book): https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html
