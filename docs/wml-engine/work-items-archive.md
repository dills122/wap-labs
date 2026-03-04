# WaveNav Engine Work Items Archive

Purpose: preserve completed historical engine tickets moved out of the active board.

This file is archival. New work should be added to `docs/wml-engine/work-items.md` via new ticket IDs.

## Phase A Completed Queue (Archived)

## Phase A Implementation Queue

### A1-01 Enforce deck root/card invariant

1. `Requirement IDs`: `WML-R-001`, `WML-R-020`
2. `Status`: `done`
3. `Depends On`: none
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser/*`
- `engine-wasm/engine/src/runtime/deck.rs`
- `engine-wasm/engine/src/lib.rs`
5. `Build`:
- Parse must reject decks with zero cards.
- Parser must continue to ignore unsupported tags without panic.
6. `Tests`:
- Add parser unit tests for:
- missing `<card>`
- unknown tags under `<wml>` and `<card>`
7. `Accept`:
- `cargo test` passes.
- malformed fixtures return structured error across wasm boundary (no panic).
8. `Notes`:
- Implemented in parser by requiring `<wml>...</wml>` root and parsing cards only inside root body.
- Native `cargo test` coverage is in place; wasm-boundary error-path assertion is tracked under `A4-01` contract test work.

### A1-02 Preserve card order and id resolution map

1. `Requirement IDs`: `WML-R-002`, `WML-R-003`
2. `Status`: `done`
3. `Depends On`: `A1-01`
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser/*`
- `engine-wasm/engine/src/runtime/deck.rs`
- `engine-wasm/engine/src/lib.rs`
5. `Build`:
- Preserve source card ordering.
- Build deterministic lookup for `id -> index`.
6. `Tests`:
- Two-card and three-card fixture parse checks.
- Duplicate/missing `id` behavior test (defined deterministic fallback).
7. `Accept`:
- Card index and lookup behavior is deterministic and documented.
8. `Notes`:
- Added `Deck::card_index` with first-win behavior for duplicate ids.
- Navigation now resolves card ids through deck index instead of linear scan.
- Missing-id cards continue using deterministic fallback ids (`card-N`).

### A1-03 Parse inline anchors inside paragraphs deterministically

1. `Requirement IDs`: `WML-R-002`, `WML-R-005`
2. `Status`: `done`
3. `Depends On`: `A1-01`
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser/*`
- `engine-wasm/engine/src/runtime/node.rs`
5. `Build`:
- Preserve text order around `<a href>`.
- Keep one logical link node per anchor element.
6. `Tests`:
- `mixed-inline-text-links.wml` fixture.
- Unit tests for text-before-link, text-after-link, and adjacent links.
7. `Accept`:
- Output node stream preserves source order exactly.
8. `Notes`:
- Added parser test coverage for mixed text/link sequencing within a single paragraph.
- Verified one logical `InlineNode::Link` is emitted per anchor and source order is preserved.

### A2-01 Fragment navigation (`#cardId`) execution

1. `Requirement IDs`: `WML-R-003`, `WML-R-006`
2. `Status`: `done`
3. `Depends On`: `A1-02`, `A1-03`
4. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/nav/focus.rs`
- `engine-wasm/engine/src/runtime/deck.rs`
5. `Build`:
- On `enter`, focused fragment href activates target card.
- Missing fragment yields stable error result.
6. `Tests`:
- Integration key-sequence tests: `down,enter` transitions.
- Fixture for missing fragment id.
7. `Accept`:
- `activeCardId()` updates correctly on valid fragment nav.
8. `Notes`:
- Added integration tests for focused-link fragment navigation via key sequences.
- Added failure-path test ensuring missing fragment returns stable error and preserves runtime state.
- Introduced internal string-error navigation handlers to enable deterministic native testing without wasm error-path panics.

### A2-02 External navigation intent emission

1. `Requirement IDs`: `WML-R-007`
2. `Status`: `done`
3. `Depends On`: `A2-01`
4. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `engine-wasm/host-sample/renderer.ts`
5. `Build`:
- Activating non-fragment href records deterministic external navigation intent.
- Host can poll/read/clear current intent.
6. `Tests`:
- Contract test from TS host sample against wasm API.
- Integration test for fragment vs external branch behavior.
7. `Accept`:
- External href does not mutate active card.
- Intent payload includes resolved URL string.
8. `Notes`:
- Added wasm API getters for `externalNavigationIntent` and `clearExternalNavigationIntent`.
- `enter` on non-fragment links now emits a resolved external URL intent without changing active card.
- Added Rust tests for external-intent emission, fragment branch non-emission, and intent clearing.
- Added host-sample example `external-navigation-intent.wml` to demo external-intent vs fragment behavior.

### A2-03 History stack baseline

1. `Requirement IDs`: `WML-R-008`
2. `Status`: `done`
3. `Depends On`: `A2-01`
4. `Files`:
- `engine-wasm/engine/src/runtime/deck.rs`
- `engine-wasm/engine/src/lib.rs`
5. `Build`:
- Push history entries on fragment transitions.
- Add explicit runtime API for back navigation call from host.
6. `Tests`:
- Transition sequence tests (home -> next -> back).
- Empty history behavior tests.
7. `Accept`:
- Back call restores prior card deterministically.
8. `Notes`:
- Added `navigateBack()` wasm API in engine contract/runtime for explicit host-triggered back navigation.
- Fragment transitions now have tested push/pop history behavior (`home -> next -> back`) and empty-history no-op behavior.
- Added host-sample fixture `history-back-stack.wml` and Back control wiring for deterministic manual verification.

### A3-01 Deterministic wrapping at viewport width

1. `Requirement IDs`: `WML-R-004`
2. `Status`: `done`
3. `Depends On`: `A1-03`
4. `Files`:
- `engine-wasm/engine/src/layout/flow_layout.rs`
- `engine-wasm/engine/src/render/render_list.rs`
5. `Build`:
- Wrap text by char width only.
- Ensure stable line-break strategy independent of host timing.
6. `Tests`:
- Snapshot tests for widths `16`, `20`, `24`.
- Fixture: `link-wrap.wml`.
7. `Accept`:
- Draw command sequence stable across repeated runs.
8. `Notes`:
- Added phase-A golden fixture snapshots at viewport widths `16`, `20`, and `24` using `link-wrap.wml`.
- Snapshot assertions now lock expected draw command sequences for deterministic wrapping behavior.

### A3-02 Focus index stability for wrapped links

1. `Requirement IDs`: `WML-R-005`
2. `Status`: `done`
3. `Depends On`: `A3-01`
4. `Files`:
- `engine-wasm/engine/src/nav/focus.rs`
- `engine-wasm/engine/src/layout/flow_layout.rs`
5. `Build`:
- One focus index per logical link, not per wrapped segment.
- Up/down navigation order follows source order.
6. `Tests`:
- Focus traversal snapshots with wrapped/unwrapped links.
7. `Accept`:
- `focusedLinkIndex()` is deterministic for identical key sequences.
8. `Notes`:
- Added wrapped-link focus stability snapshots confirming one logical focus index per link across wrapped segments.
- Added key-sequence assertions for focus traversal from wrapped to unwrapped links.

### A4-01 Metadata boundary contract hardening

1. `Requirement IDs`: `WML-R-009`, `WBXML-R-001`, `WBXML-R-002`
2. `Status`: `done`
3. `Depends On`: none
4. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `engine-wasm/host-sample/renderer.ts`
- `engine-wasm/README.md`
5. `Build`:
- `loadDeckContext` remains primary.
- `loadDeck` compatibility path remains functional.
- Keep `baseUrl`, `contentType` getters stable.
6. `Tests`:
- wasm contract tests for metadata propagation and defaults.
7. `Accept`:
- Host sample works using both APIs.
8. `Notes`:
- Added metadata regression tests for `loadDeck` defaults and `loadDeckContext` overrides.
- Added compatibility-path test ensuring `loadDeck` remains functional and resets to default metadata semantics.

### A4-02 Golden fixture harness in Rust tests

1. `Requirement IDs`: supports all Phase A requirements
2. `Status`: `done`
3. `Depends On`: `A1-01`
4. `Files`:
- `engine-wasm/engine/tests/fixtures/*`
- `engine-wasm/engine/tests/*`
- `docs/wml-engine/test-strategy.md`
5. `Build`:
- Introduce fixture loader and snapshot assertions.
- Store expected render + state results by key sequence.
6. `Tests`:
- `basic-two-card.wml`
- `mixed-inline-text-links.wml`
- `link-wrap.wml`
- `missing-fragment.wml`
7. `Accept`:
- Regression tests fail on unintended behavior changes.
8. `Notes`:
- Added fixture corpus under `engine-wasm/engine/tests/fixtures/phase-a/`.
- Added fixture-driven snapshot/state regression tests in `engine-wasm/engine/src/lib.rs` test module.


## Compliance Follow-up Completed Tickets (Archived)

### A5-02 Inter-card task pipeline conformance follow-up

1. `Requirement IDs`: `WML-R-012`, `WML-R-015`, `WML-R-017`, `WML-R-019`
2. `Status`: `done`
3. `Depends On`: `A2-01`, `A2-03`
4. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/parser/wml_parser/*`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Implement spec-ordered `go/prev/refresh` pipeline semantics, including setvar substitution ordering, deterministic event/timer sequencing, and failure rollback behavior.
6. `Tests`:
- Add `go`, `prev`, and `refresh` process-order fixtures with expected trace snapshots.
- Add task-failure fixtures asserting “invoking card remains current” and no partial context mutation.
7. `Accept`:
- Runtime task execution is indistinguishable from reference process ordering for covered flows.
8. `Notes`:
- Additive conformance hardening over Phase A navigation baseline.
- Landed in `90a14f5` with deterministic `go/prev/refresh` process-order fixtures and rollback fidelity coverage.
