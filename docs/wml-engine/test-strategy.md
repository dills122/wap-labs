# Test Strategy

## 1. Test Layers

1. Parser unit tests
- deck/card extraction
- attribute parsing
- unknown tag handling
- malformed XML error paths

2. Runtime/navigation tests
- focus up/down wrap
- `#cardId` transitions
- history push/pop behavior
- external href handoff behavior

3. Layout/render tests
- wrapping across viewport widths
- focused link highlighting
- stable draw command ordering

4. Contract tests (host <-> wasm)
- `loadDeckContext` metadata propagation
- WML load diagnostic class/code/outcome parity and failed-load state preservation
- render payload shape compatibility
- raw execution vs invocation boundary behavior (`executeScriptRef*` vs `invokeScriptRef*`)

## 2. Golden Fixtures

Create fixtures under `engine-wasm/engine/tests/fixtures/`:

- `basic-two-card.wml`
- `mixed-inline-text-links.wml`
- `link-wrap.wml`
- `missing-fragment.wml`
- `do-go-prev-refresh.wml` (phase 2)
- `variables-substitution.wml` (phase 3)

Current implemented fixture set lives under `engine-wasm/engine/tests/fixtures/phase-a/` and is validated by snapshot/state regression tests in `engine-wasm/engine/src/engine_tests.rs`.

Each fixture stores expected:

- active card after actions
- focus state after key sequence
- render list snapshots

## 3. End-to-End Harness Validation

Use `engine-wasm/host-sample` for manual or story-driven automated smoke:

1. Load fixture text.
2. Execute key sequence.
3. Verify screen output and status.

Executable acceptance flows are optional `engine-wasm/examples/source/*.flow.json` companions to
the canonical WML examples. Run `pnpm test:story <work-item-or-spec-id>` from the repository root,
or use `list`, `host-sample`, `waves`, or `all`. The runner owns each production Vite server
lifecycle, uses ephemeral ports and unique temporary build directories, asserts structured runtime
state and ordered trace evidence, and writes failure artifacts under
`engine-wasm/host-sample/test-results/story/`.

The Waves target composes the real frontend with the real WASM engine in an ordinary browser. It
covers representative fragment/external-intent, history-back/error, and merged input/select
behavior using semantic render/runtime evidence. Network-mode stories use deterministic canonical
fixture fetching; native Tauri behavior and the Rust transport stack remain outside this lane.

## 4. Definition of Done for Each Ticket

- Unit tests for changed module
- Updated fixture/snapshot if behavior changed
- API/doc updates if contract changed
- No panic across wasm boundary

## 5. Coverage and Safety Gates

1. Rust baseline checks
- `cargo fmt --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`

2. Coverage checker (optional local + CI-ready)
- `make coverage-rust` (uses `cargo-llvm-cov`)
- install once: `cargo install cargo-llvm-cov`
- default local thresholds: lines `90`, functions `85`

3. Optional pre-push coverage hook
- enable: `WAP_ENABLE_RUST_COVERAGE_HOOKS=1`
- line threshold override: `WAP_RUST_COVERAGE_MIN=90`
- function threshold override: `WAP_RUST_FUNCTION_COVERAGE_MIN=85`

## 6. Cross-Project Alignment

- Keep test IDs and fixture coverage in sync with:
  - `docs/waves/SPEC_TEST_COVERAGE.md`
  - `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- When a requirement group moves from `planned` to `covered`, update both docs in the same change.
