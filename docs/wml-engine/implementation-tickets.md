# Implementation Tickets (Step-by-Step)

Status: historical draft. Use `ticket-plan.md` as the active implementation backlog.

This backlog is ordered for shipping value early while preserving future expansion.

## Phase 0: Stabilize Current MVP

### T0-1 Contract hardening
- Goal: freeze input/output types used by host.
- Tasks:
1. Keep `loadDeckContext` as primary ingestion API.
2. Document compatibility with `loadDeck`.
3. Add contract tests in TS host sample.
- Acceptance:
1. Host can load decks through both APIs.
2. `baseUrl()` and `contentType()` return expected values.

### T0-2 Parser robustness for current tags
- Goal: prevent crashes on malformed but common decks.
- Tasks:
1. Improve tag scanning for nested inline links in paragraphs.
2. Preserve text order around inline anchors.
3. Treat unknown tags as ignorable nodes.
- Acceptance:
1. No panic on unknown tags.
2. Snapshot tests stable across malformed inputs.

### T0-3 Render/focus determinism
- Goal: deterministic focus and draw output.
- Tasks:
1. Ensure each logical link maps to one focus index even when wrapped.
2. Lock y-coordinate and wrap behavior in tests.
- Acceptance:
1. Golden tests pass for multiple viewport widths.

## Phase 1: Spec-Driven Card Metadata

### T1-1 Card metadata parsing
- Goal: parse card attributes needed for semantics.
- Tasks:
1. Add title/newcontext/ordered parsing.
2. Add access metadata parsing (`domain`, `path`).
3. Expose metadata through debug getters.
- Acceptance:
1. Parsed card metadata is visible and unit-tested.

### T1-2 Navigation history policy
- Goal: align history transitions with WML context intent.
- Tasks:
1. Introduce runtime transition mode (push/replace/new context).
2. Persist card+url state in history entries.
- Acceptance:
1. Back navigation behaves per transition mode tests.

## Phase 2: Task Model (`do` + `go/prev/noop/refresh`)

### T2-1 Parse and store `do` blocks
- Goal: establish task bindings.
- Tasks:
1. Parse `do` position/name/type/label metadata.
2. Parse task child (`go|prev|noop|refresh`).
- Acceptance:
1. Task map available per card.

### T2-2 Host-visible softkey model
- Goal: surface usable softkeys to renderer host.
- Tasks:
1. Add softkey labels to render state.
2. Add key mapping for softkey activation.
- Acceptance:
1. Host can display and invoke task bindings.

### T2-3 Implement task execution
- Goal: execute task semantics.
- Tasks:
1. `go`: URL resolution + method + postfield payload event.
2. `prev`: history pop.
3. `noop`: no-op state update.
4. `refresh`: rerender with current state.
- Acceptance:
1. Integration tests cover each task path.

## Phase 3: Variables + Substitution

### T3-1 VariableStore core
- Goal: runtime variable persistence.
- Tasks:
1. Add variable store to runtime state.
2. Parse/update from setvar locations as supported.
- Acceptance:
1. Variables survive card transitions in same deck context.

### T3-2 Substitution engine
- Goal: replace variable references in text/attributes.
- Tasks:
1. Add substitution for text nodes.
2. Add substitution for href and task labels/targets.
3. Guard against recursive expansion loops.
- Acceptance:
1. Deterministic substitution tests pass.

## Phase 4: Forms and Request Payloads

### T4-1 Form controls model
- Goal: parse and render input/select/option structures.
- Tasks:
1. Add form node types.
2. Add focus/edit behavior.
- Acceptance:
1. Form controls render and can be edited.

### T4-2 Submit pipeline
- Goal: build request payloads for host transport.
- Tasks:
1. Serialize GET query and POST fields.
2. Emit structured navigation request event.
- Acceptance:
1. Host receives expected payload structure.

## Phase 5: Events and Timers (Controlled Scope)

### T5-1 onevent dispatch
- Goal: support deterministic event handlers.
- Tasks:
1. Parse onevent bindings.
2. Dispatch supported event types through task executor.
- Acceptance:
1. Event-trigger tests pass for supported types.

### T5-2 timer baseline
- Goal: safe timer support.
- Tasks:
1. Parse timer metadata/value.
2. Add host tick hook or monotonic timer callback.
- Acceptance:
1. Timer action triggers at expected intervals in tests.

## Cross-Cutting Tickets

### TX-1 Error taxonomy
- Define stable error codes for parse/nav/task/runtime failures.

### TX-2 Observability
- Add debug snapshot dump (`active card`, `focus index`, `links`, `metadata`).

### TX-3 Compatibility fixtures
- Build fixture corpus from spec-like decks and real-world samples.

### TX-4 Performance guardrails
- Add benchmark test for large decks and deep history.
