# WML Engine Work Items (Execution Board)

Purpose: convert the phase plan into PR-sized implementation tickets for immediate execution.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

## Current Execution Scope

Target scope is Phase A (`P0`) only:

- parser correctness for MVP tags
- deterministic render/focus behavior
- fragment/external navigation behavior
- stable wasm boundary metadata

No Phase B+ semantics should be added in this board unless explicitly promoted.

## Ticket Template

Use this shape for any new ticket:

1. `ID`: stable id (`A1-01`, `A2-02`, etc.)
2. `Requirement IDs`: links to `requirements-matrix.md`
3. `Status`
4. `Depends On`
5. `Files`
6. `Build`
7. `Tests`
8. `Accept`

## Phase A Implementation Queue

### A1-01 Enforce deck root/card invariant

1. `Requirement IDs`: `WML-R-001`, `WML-R-020`
2. `Status`: `done`
3. `Depends On`: none
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser.rs`
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
- `engine-wasm/engine/src/parser/wml_parser.rs`
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
- `engine-wasm/engine/src/parser/wml_parser.rs`
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
2. `Status`: `todo`
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

### A2-02 External navigation intent emission

1. `Requirement IDs`: `WML-R-007`
2. `Status`: `todo`
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

### A2-03 History stack baseline

1. `Requirement IDs`: `WML-R-008`
2. `Status`: `todo`
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

### A3-01 Deterministic wrapping at viewport width

1. `Requirement IDs`: `WML-R-004`
2. `Status`: `todo`
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

### A3-02 Focus index stability for wrapped links

1. `Requirement IDs`: `WML-R-005`
2. `Status`: `todo`
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

### A4-01 Metadata boundary contract hardening

1. `Requirement IDs`: `WML-R-009`, `WBXML-R-001`, `WBXML-R-002`
2. `Status`: `todo`
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

### A4-02 Golden fixture harness in Rust tests

1. `Requirement IDs`: supports all Phase A requirements
2. `Status`: `todo`
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

## Suggested First Sprint (7 tickets)

1. `A1-01`
2. `A1-02`
3. `A1-03`
4. `A2-01`
5. `A3-01`
6. `A3-02`
7. `A4-01`

This keeps scope in strict MVP while removing current implementation risk around parsing, focus, wrapping, and boundary behavior.

## Exit Criteria for Phase A

1. All `A*` tickets are `done`.
2. Requirement IDs `WML-R-001..009`, `WML-R-020`, `WBXML-R-001` have passing tests.
3. Host sample can:
- load a deck via `loadDeckContext`
- navigate via focus + `enter`
- execute `#cardId` transitions
- expose deterministic render output and metadata
