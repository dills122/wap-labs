# WaveNav Engine Work Items (Execution Board)

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

## Next In Line (Cross-Project Maintenance Alignment)

Before additional Phase B+ feature promotion, execute aligned maintenance tickets:

1. `M1-02` parity-critical native/wasm regression suite.
2. `M1-07` parser robustness hardening (no scope expansion) using an existing XML parser backend plus a WML semantic mapper layer.
3. `M1-08` high-churn file decomposition into boundary modules (engine scope complete; browser/transport follow-ups remain on the cross-project board).
4. `M1-03` engine API generator design/bootstrap (non-priority track).

Source of truth for these items:

- `docs/waves/MAINTENANCE_WORK_ITEMS.md`

## Demoability Requirement

For any newly implemented, demoable feature:

- add a new `engine-wasm/host-sample/examples/*.wml` fixture, or
- update an existing host-sample example that directly exercises the new behavior.

Every completed ticket with host-visible behavior should note which example covers it.
Each example metadata block must include:

- work item and/or spec IDs (`work-items`, `spec-items`)
- brief `description` and `goal`
- `testing-ac` checklist steps for deterministic manual verification

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

## Traceability Rule

- Every ticket must map its `Requirement IDs` to Waves requirement IDs using:
  - `docs/wml-engine/requirements-matrix.md` ("Waves Traceability Mapping")
  - `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
  - `docs/waves/WAE_SPEC_TRACEABILITY.md` (where applicable)
- Any contract-impacting ticket must also update:
  - `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
  - `docs/waves/SPEC_TEST_COVERAGE.md`

## Ticket Lifecycle Guardrail

- Do not rewrite `done` tickets to a non-done status during later audits.
- When spec gaps are discovered in previously completed areas, create additive follow-up tickets that reference the completed ticket in `Depends On` and notes.

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

## Compliance Follow-up Queue (Additive; Do Not Reopen `done` Tickets)

### A5-01 History entry fidelity follow-up

1. `Requirement IDs`: `WML-R-008`
2. `Status`: `todo`
3. `Depends On`: `A2-03`
4. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/runtime/*`
- `browser/frontend/src/session-history.ts`
- `engine-wasm/contracts/wml-engine.ts`
5. `Build`:
- Expand history entries from card-index-only behavior to spec-shaped request identity entries (absolute URL, method, post data, request metadata).
- Preserve deterministic back behavior across in-deck and fetched-deck transitions.
6. `Tests`:
- Add history fixture tests for repeated URL entries, method-aware back behavior, and deterministic restore snapshots.
7. `Accept`:
- Back behavior is deterministic and history entries preserve required request identity fields.
8. `Notes`:
- Compliance delta for `A2-03` without changing its completed status.

### A5-02 Inter-card task pipeline conformance follow-up

1. `Requirement IDs`: `WML-R-012`, `WML-R-015`, `WML-R-017`, `WML-R-019`
2. `Status`: `done`
3. `Depends On`: `A2-01`, `A2-03`
4. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/parser/wml_parser.rs`
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

### A5-03 WML timer lifecycle runtime follow-up

1. `Requirement IDs`: `WML-R-014`
2. `Status`: `todo`
3. `Depends On`: `A5-02`
4. `Files`:
- `engine-wasm/engine/src/runtime/events.rs`
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Implement `<timer>` lifecycle semantics (card-entry start, card-exit stop, refresh resume, ontimer dispatch, invalid timeout ignore).
- Keep timer ownership in runtime semantics; host only supplies timing capability plumbing.
6. `Tests`:
- Deterministic simulated clock tests for start/stop/resume/expire.
7. `Accept`:
- Timer behavior is deterministic and card-scoped under navigation and refresh paths.
8. `Notes`:
- Distinct from WaveScript timer hostcalls tracked in `docs/waves/WORK_ITEMS.md`.

### B5-01 Input mask and commit semantics conformance follow-up

1. `Requirement IDs`: `WML-R-019`
2. `Status`: `todo`
3. `Depends On`: `A5-02`
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/src/runtime/*`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Add minimum-conformance input object behavior: mask validation at commit, invalid commit rejection without variable mutation, deterministic initialization order.
6. `Tests`:
- Input mask fixture matrix including invalid-mask-ignore and empty-string commit rules.
7. `Accept`:
- Input/form commit flow is deterministic and spec-aligned for baseline text input semantics.
8. `Notes`:
- Additive follow-up over Phase C planning scope to close compliance-critical gaps earlier.

### B5-02 Inline flow layout conformance follow-up

1. `Requirement IDs`: `WML-R-021`, `WML-R-023`
2. `Status`: `todo`
3. `Depends On`: `A3-01`, `A3-02`, `M1-07`
4. `Files`:
- `engine-wasm/engine/src/layout/flow_layout.rs`
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/src/runtime/node.rs`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Remove forced line resets between inline text/link segments so mixed inline content composes in one flow stream.
- Represent inline `<br>` as a hard line-break token in inline layout (not a synthetic space).
- Preserve one logical focus index per link while allowing wrapped link chunks to span lines.
6. `Tests`:
- Add fixtures for mixed text/link/text on one line and overflow-wrap behavior.
- Add fixture where inline `<br>` appears inside `<p>` and assert mandatory line break.
7. `Accept`:
- Inline paragraph output matches spec-equivalent flow for mixed runs and `<br>` behavior.
8. `Notes`:
- Spec anchor refs: WAP-191 section `9.9` and section `11.8.4` (br line-break mandate).

### B5-03 Paragraph mode/alignment semantics follow-up

1. `Requirement IDs`: `WML-R-022`, `WML-R-026`
2. `Status`: `todo`
3. `Depends On`: `B5-02`
4. `Files`:
- `engine-wasm/engine/src/layout/flow_layout.rs`
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/src/runtime/card.rs`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Parse and retain paragraph `mode` and `align` attributes.
- Implement card-local default inheritance for wrap/alignment across significant paragraphs.
- Enforce `nowrap` behavior and add deterministic handling for `&nbsp;` and optional soft-hyphen break points.
6. `Tests`:
- Add paragraph-mode fixture matrix (`wrap`, `nowrap`, inherited mode, mixed significant/insignificant paragraphs).
- Add non-breaking-space and soft-hyphen fixtures.
7. `Accept`:
- Paragraph layout mode/alignment behavior is deterministic and matches section 11.8.3 expectations.
8. `Notes`:
- Spec anchor refs: WAP-191 section `11.8.3` (paragraph wrap/alignment + white-space break rules).

### C5-01 Table element rendering semantics follow-up

1. `Requirement IDs`: `WML-R-024`
2. `Status`: `todo`
3. `Depends On`: `M1-07`
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/src/runtime/node.rs`
- `engine-wasm/engine/src/layout/flow_layout.rs`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Parse `table`/`tr`/`td` structure with required `columns` attribute.
- Implement row normalization semantics: pad missing cells and aggregate overflow cells into the last column with single inter-word separator.
- Provide deterministic rendering fallback suitable for small displays.
6. `Tests`:
- Add table fixtures covering exact columns, underflow row padding, overflow row aggregation, and alignment designator handling.
7. `Accept`:
- Table behavior is deterministic and follows section 11.8.5-11.8.8 structure rules.
8. `Notes`:
- Spec anchor refs: WAP-191 section `11.8.5` through `11.8.8`.

### C5-02 Preformatted text semantics follow-up

1. `Requirement IDs`: `WML-R-025`
2. `Status`: `todo`
3. `Depends On`: `B5-03`
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/src/runtime/node.rs`
- `engine-wasm/engine/src/layout/flow_layout.rs`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Parse `<pre>` blocks and preserve preformatted text intent in runtime nodes.
- Implement best-effort preformatted rendering behavior: preserve internal whitespace and optionally disable auto-wrap.
6. `Tests`:
- Add `pre` fixtures with significant spacing and long-line behavior across viewport widths.
7. `Accept`:
- Preformatted content renders deterministically with preserved spacing semantics.
8. `Notes`:
- Spec anchor refs: WAP-191 section `11.8.9` (`xml:space="preserve"` and best-effort preformatted behavior).

### C5-03 Deck structure and metadata semantics completion

1. `Requirement IDs`: `WML-R-010`, `WML-R-018`
2. `Status`: `todo`
3. `Depends On`: `M1-07`
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/src/runtime/deck.rs`
- `engine-wasm/engine/src/runtime/card.rs`
- `engine-wasm/contracts/wml-engine.ts`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Parse and retain `head`, `template`, `access`, and `meta` structures needed for runtime semantics and host policy hooks.
- Parse/retain `card` context attributes (`newcontext`, `ordered`) with deterministic defaults and exposure paths.
- Enforce deterministic validation for duplicate/invalid `meta` constraints where applicable.
6. `Tests`:
- Fixture matrix for head/template inheritance, card context defaults, and meta constraint validation.
7. `Accept`:
- Deck metadata required for policy/navigation semantics is available and stable across native/wasm targets.
8. `Notes`:
- Spec anchor refs: WAP-191 section `11.3` through `11.5`, section `10.2`.

### C5-04 Task/event pipeline and variable-substitution conformance

1. `Requirement IDs`: `WML-R-011`, `WML-R-012`, `WML-R-013`, `WML-R-015`, `WML-R-016`, `WML-R-017`
2. `Status`: `todo`
3. `Depends On`: `A5-02`, `A5-03`
4. `Files`:
- `engine-wasm/engine/src/lib.rs`
- `engine-wasm/engine/src/runtime/*`
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Implement deterministic task/event pipeline semantics for `go|prev|noop|refresh` with onevent/do integration.
- Implement variable substitution in required contexts with proper timing, undefined-variable behavior, and conversion handling.
- Enforce event-binding/task conflict validation rules and deterministic failure behavior.
6. `Tests`:
- Add process-order fixtures for task execution and failure rollback.
- Add variable-substitution fixtures for text, href, and vdata contexts including conversion forms.
7. `Accept`:
- Task/event/variable behavior is deterministic and matches spec-driven ordering expectations for covered flows.
8. `Notes`:
- Spec anchor refs: WAP-191 section `9.5`, `9.10`, `10.3`, `12.5`.

### C5-05 Form controls and commit semantics completion

1. `Requirement IDs`: `WML-R-019`
2. `Status`: `todo`
3. `Depends On`: `B5-01`, `C5-04`
4. `Files`:
- `engine-wasm/engine/src/parser/wml_parser.rs`
- `engine-wasm/engine/src/runtime/*`
- `engine-wasm/engine/src/layout/*`
- `engine-wasm/engine/tests/fixtures/*`
5. `Build`:
- Complete select/option/optgroup/input/fieldset runtime semantics for initialization, selection state, and variable commit behavior.
- Implement minimum-conformance input-mask validation and deterministic invalid-entry handling.
6. `Tests`:
- Form fixture matrix for single-select, multi-select, input defaults, invalid commits, and deterministic variable updates.
7. `Accept`:
- Form/control behavior aligns with defined WML runtime semantics for implemented profile.
8. `Notes`:
- Spec anchor refs: WAP-191 section `11.6`.

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
