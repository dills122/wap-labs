# WaveNav Engine Work Items (Execution Board)

Purpose: convert the phase plan into PR-sized implementation tickets for immediate execution.

Status keys:

- `todo`
- `in-progress`
- `blocked`
- `done`

Archive:

- `docs/wml-engine/work-items-archive.md`

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

## Committed Sprint Alignment (2026-03-04)

Current committed sequence for engine-impacting compliance work:

1. `A5-01` history entry fidelity.
2. `R0-02` inter-card process-order conformance support.
3. `R0-03` history/context fidelity closure support.
4. `W0-06` bytecode verification gates.
5. Stretch: `W1-02` structural verification closure.

Execution plan reference:

- `docs/waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md` (cross-lane canonical priority plan)
- `docs/waves/SPRINT_PLAN_2026-03_BEDROCK_COMPLIANCE.md`

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

Completed Phase A (`A1` through `A4`) tickets are archived in:

- `docs/wml-engine/work-items-archive.md`

## Compliance Follow-up Queue (Additive; Do Not Reopen `done` Tickets)

Completed compliance follow-up ticket `A5-02` is archived in:

- `docs/wml-engine/work-items-archive.md`

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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
- `engine-wasm/engine/src/parser/wml_parser/*`
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
