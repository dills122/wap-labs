# Waves Maintenance Work Items

Purpose: track maintenance, quality, and technical-debt work that should be folded into normal delivery.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

## How To Use

1. Keep items scoped and testable.
2. Link each item to concrete files and acceptance checks.
3. Prefer pairing one maintenance item with each feature/contract ticket when feasible.

## Current Queue

### M1-00 Architecture hardening sprint (next in line)

1. `Status`: `todo`
2. `Scope`:
- `browser/`
- `engine-wasm/`
- `transport-rust/`
3. `Build`:
- Execute remaining `M1-*` items as the active maintenance sprint before new feature expansion.
4. `Accept`:
- Sprint checklist and status are reflected in:
- `docs/waves/WORK_ITEMS.md`
- `browser/README.md`
- `engine-wasm/README.md`
- `transport-rust/README.md`

### M1-01 Contract-source unification in browser host/frontend

1. `Status`: `done`
2. `Files`:
- `browser/frontend/src/main.ts`
- `browser/contracts/engine.ts`
- `browser/contracts/transport.ts`
3. `Build`:
- Remove duplicated local runtime/engine type shapes from frontend code where contract imports already exist.
- Keep browser host/frontend typed from shared contract files only.
4. `Tests`:
- `pnpm --dir browser/frontend build`
5. `Accept`:
- Browser frontend compiles with contract imports as single source of truth for engine/transport shapes.
6. `Notes`:
- Completed by consolidating frontend engine/transport typing through shared contract imports and generated host clients.

### M1-02 Engine native/wasm parity regression suite for critical flows

1. `Status`: `done`
2. `Files`:
- `engine-wasm/engine/src/engine_public_api.rs`
- `engine-wasm/engine/src/engine_wasm_bindings.rs`
- `engine-wasm/engine/src/engine_tests.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `docs/waves/SPEC_TEST_COVERAGE.md`
3. `Build`:
- Add parity-critical tests for `loadDeckContext`, `handleKey`, `navigateBack`, `render`, and script invocation outcomes.
4. `Tests`:
- `cd engine-wasm/engine && cargo test`
- `cd engine-wasm/engine && cargo clippy --all-targets --all-features -- -D warnings`
- `cd engine-wasm/engine && wasm-pack test --node`
5. `Accept`:
- Parity-critical behavior is covered by deterministic tests and mapped in coverage docs.
6. `Notes`:
- Initial public-API regression coverage landed for `loadDeckContext`, `handleKey`, `navigateBack`, `render`, and script invocation outcomes in `engine-wasm/engine/src/engine_tests.rs`.
- Added explicit ingestion-surface parity assertions (`loadDeck` vs `loadDeckContext`) and stable invocation error-surface checks via `m1_02_*` tests.
- Added wasm-boundary regression tests for wrapper methods in `engine-wasm/engine/src/engine_wasm_bindings_tests.rs` (`wasm-bindgen-test`) and validated execution in node lane (`3 passed`) via `wasm-pack test --node`.

### M1-03 Engine API generator design and bootstrap (non-priority)

1. `Status`: `todo`
2. `Files`:
- `engine-wasm/contracts/wml-engine.ts`
- `browser/contracts/engine.ts`
- `scripts/` (new generator entrypoint)
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
3. `Build`:
- Add a generator path that can emit TypeScript engine API/types/facade scaffolding from engine-owned source metadata.
- Keep this item as non-priority within the sprint (design/prototype unless explicitly promoted).
4. `Tests`:
- Generator dry-run in CI or local script check.
5. `Accept`:
- Manual engine API sync burden is reduced with a documented generate path and prototype output.

### M1-04 Transport module decomposition and mapping isolation

1. `Status`: `done`
2. `Files`:
- `transport-rust/src/lib.rs`
- `transport-rust/src/*` (new internal modules)
3. `Build`:
- Extract request validation, gateway mapping, payload decode, and error mapping into dedicated internal modules.
4. `Tests`:
- `make test-rust-transport`
5. `Accept`:
- Transport behavior remains unchanged while module boundaries become explicit and reviewable.
6. `Notes`:
- Landed in `a4f6a36` with extracted boundary modules (`gateway`, `wbxml`, `responses`, `request_meta`) while preserving existing transport behavior contracts.

### M1-05 Browser frontend navigation state-machine test automation

1. `Status`: `done`
2. `Files`:
- `browser/frontend/src/*`
- `docs/waves/SPEC_TEST_COVERAGE.md`
3. `Build`:
- Add automated checks for load-state transitions, external-intent follow loop, and hybrid engine/host back behavior.
4. `Tests`:
- Deterministic scripted assertions integrated into browser/frontend checks.
5. `Accept`:
- Browser interaction regressions are caught without relying only on manual checks.
6. `Notes`:
- Completed with deterministic navigation-state and presenter/controller regression tests in `browser/frontend/src/app/*.test.ts`.

### M1-06 CI guardrails for contract drift and worklist drift

1. `Status`: `done`
2. `Files`:
- `scripts/check-transport-contract-parity.mjs`
- `scripts/` (new engine contract parity check)
- `.github/workflows/*`
3. `Build`:
- Enforce transport and engine contract parity checks in CI.
- Add a lightweight docs drift check for next-slice pointers in active readmes/worklists.
4. `Tests`:
- `node scripts/check-transport-contract-parity.mjs`
- `node scripts/check-engine-contract-parity.mjs`
- `node scripts/check-worklist-drift.mjs`
5. `Accept`:
- Contract/docs drift is blocked before merge.
6. `Notes`:
- Added `scripts/check-engine-contract-parity.mjs` to enforce key and `loadDeckContext` request-shape parity between engine-owned and browser-generated contracts.
- Added `scripts/check-worklist-drift.mjs` to validate next-slice pointers across active readmes/worklists against `M1-*` status entries.
- Wired both checks into `.github/workflows/ci.yml` `repo-hygiene` job.

### M1-07 Parser robustness hardening without feature-scope expansion

1. `Status`: `done`
2. `Files`:
- `engine-wasm/engine/src/parser/wml_parser/mod.rs`
- `engine-wasm/engine/src/parser/wml_parser/xml.rs`
- `engine-wasm/engine/src/parser/wml_parser/actions.rs`
- `engine-wasm/engine/src/parser/wml_parser/nodes.rs`
- `engine-wasm/engine/tests/fixtures/*`
3. `Build`:
- Replace manual tag scanning with an existing Rust XML parser/tokenizer backend.
- Keep WML deck/card/action semantics in a WaveNav-owned mapper layer on top of XML tokens.
- Improve malformed-tag/attribute robustness while keeping MVP semantics and deterministic behavior.
- Keep parsing ownership in `engine-wasm` (no host-side WML parsing fallback).
4. `Tests`:
- Parser regression coverage remains green with XML backend split:
  - `cd engine-wasm/engine && cargo test --lib`
5. `Accept`:
- Parser error behavior is deterministic and robust for expanded fixture coverage.
- Parser boundary is split into `XML parse/tokenize` + `WML semantic mapping` and documented in engine architecture notes.
6. `Notes`:
- Implemented with `quick-xml` backend in `xml.rs` and WaveNav-owned semantic mapping in `actions.rs` and `nodes.rs`.
- `parse_wml` now maps XML parse failures to stable parser-facing errors for existing behavior-sensitive tests (e.g. missing `</card>`).

### M1-08 Split high-churn files into boundary modules

1. `Status`: `in-progress`
2. `Files`:
- `engine-wasm/engine/src/lib.rs` (done)
- `engine-wasm/engine/src/engine_runtime_internal.rs` + `engine_runtime_internal/*` (done)
- `engine-wasm/engine/src/parser/wml_parser/*` (done)
- `browser/frontend/src/main.ts`
- `browser/src-tauri/src/lib.rs`
- `transport-rust/src/lib.rs`
3. `Build`:
- Move code into boundary modules (`api`, `state`, `actions`, `mapping`, `ui`) without broad behavior changes.
4. `Tests`:
- Existing project test/build commands remain green.
5. `Accept`:
- High-churn files are reduced and responsibilities are easier to review.
6. `Notes`:
- Engine-side decomposition has landed and merged.
- Remaining M1-08 scope is browser + transport boundary decomposition.

### M1-09 Engine-host frame interface migration execution

1. `Status`: `todo`
2. `Files`:
- `docs/waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`
- `docs/waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`
- `engine-wasm/contracts/wml-engine.ts`
- `browser/src-tauri/src/contract_types.rs`
- `browser/contracts/generated/engine-host.ts`
3. `Build`:
- Execute the `F0-F4` migration program to move active hosts onto structured frame/input contracts.
- Keep migration additive and parity-gated until legacy path retirement.
4. `Tests`:
- `cd engine-wasm/engine && cargo test`
- `cd browser/src-tauri && cargo test`
- `pnpm --dir browser/frontend test`
- `pnpm --dir browser/frontend build`
5. `Accept`:
- Active host paths use `EngineFrame` + `EngineInputEvent`.
- Contract and coverage docs are updated in the same migration PRs.

### M0-01 Parser tag-boundary hardening (`<prev/>` false-positive)

1. `Status`: `done`
2. `Files`:
- `engine-wasm/engine/src/parser/wml_parser/xml.rs`
3. `Build`:
- Enforce strict tag-boundary checks so `<prev/>` is not parsed as `<p...>`.
4. `Tests`:
- Regression test for `<do type="prev"><prev/></do>` parsing.
5. `Accept`:
- WML with `<prev/>` parses and renders without `Missing closing </p> tag`.

### M0-02 Browser keyboard handler guardrails

1. `Status`: `done`
2. `Files`:
- `browser/frontend/src/main.ts`
3. `Build`:
- Ensure global key bindings do not fire while typing in text-entry fields.
4. `Tests`:
- Manual keyboard checks in address bar and dev raw WML textarea.
5. `Accept`:
- `ArrowUp/ArrowDown/Enter/Backspace` only drive runtime when focus is outside text-entry controls.

### M0-03 Hybrid back behavior across deck boundaries

1. `Status`: `done`
2. `Files`:
- `browser/frontend/src/main.ts`
- `browser/frontend/src/session-history.ts`
3. `Build`:
- Back should use engine card history first, then host URL history fallback with card restore metadata.
4. `Tests`:
- Manual flow: `home -> menu -> /login -> back` restores `menu`.
5. `Accept`:
- Browser back behavior is deterministic for mixed in-deck and cross-deck navigation.

### M0-04 Frontend history/session logic extraction

1. `Status`: `done`
2. `Files`:
- `browser/frontend/src/session-history.ts`
- `browser/frontend/src/main.ts`
3. `Build`:
- Move stack operations into a dedicated helper module.
4. `Tests`:
- Build/type check via `pnpm --dir browser/frontend build`.
5. `Accept`:
- History mutations are centralized and no longer hand-coded inline.

### M0-05 Browser regression automation for keyboard/back

1. `Status`: `todo`
2. `Files`:
- `browser/frontend/src/*`
- `docs/waves/SPEC_TEST_COVERAGE.md`
3. `Build`:
- Add automated checks for keyboard navigation + hybrid back behavior.
4. `Tests`:
- Deterministic scripted assertions for focused-link movement, fragment back, and host-history back restore.
5. `Accept`:
- CI catches regressions in browser keyboard/back interaction semantics.

### M0-06 Documentation drift guardrails

1. `Status`: `todo`
2. `Files`:
- `browser/README.md`
- `docs/waves/WORK_ITEMS.md`
- `docs/waves/SPEC_TEST_COVERAGE.md`
3. `Build`:
- Add lightweight checklist to keep board status and README checklist synchronized.
4. `Tests`:
- Manual docs consistency pass as part of maintenance PR template.
5. `Accept`:
- No stale “next slice” or checklist entries after implementation merges.
