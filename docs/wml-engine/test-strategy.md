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
- render payload shape compatibility

## 2. Golden Fixtures

Create fixtures under `engine-wasm/engine/tests/fixtures/`:

- `basic-two-card.wml`
- `mixed-inline-text-links.wml`
- `link-wrap.wml`
- `missing-fragment.wml`
- `do-go-prev-refresh.wml` (phase 2)
- `variables-substitution.wml` (phase 3)

Current implemented fixture set lives under `engine-wasm/engine/tests/fixtures/phase-a/` and is validated by snapshot/state regression tests in `engine-wasm/engine/src/lib.rs`.

Each fixture stores expected:

- active card after actions
- focus state after key sequence
- render list snapshots

## 3. End-to-End Harness Validation

Use `engine-wasm/host-sample` for manual/automated smoke:

1. Load fixture text.
2. Execute key sequence.
3. Verify screen output and status.

## 4. Definition of Done for Each Ticket

- Unit tests for changed module
- Updated fixture/snapshot if behavior changed
- API/doc updates if contract changed
- No panic across wasm boundary

## 5. Cross-Project Alignment

- Keep test IDs and fixture coverage in sync with:
  - `docs/waves/SPEC_TEST_COVERAGE.md`
  - `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- When a requirement group moves from `planned` to `covered`, update both docs in the same change.
