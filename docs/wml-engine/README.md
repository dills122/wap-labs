# WaveNav Engine Docs

Purpose: implementation-ready documentation for a maintainable WaveNav WASM WML engine based on WML 1.1 semantics.

## Canonical Docs

Use these as the current source of truth:

1. `source-material-review.md`
2. `requirements-matrix.md`
3. `architecture.md`
4. `ticket-plan.md`
5. `test-strategy.md`
6. `work-items.md`

Non-authoritative historical docs are retained only for context:

- `implementation-tickets.md`
- `../wml-1.1-engine-support-plan.md`

## Read Order

1. `spec-derived-requirements.md` (what must be true)
2. `source-material-review.md` (what was extracted from local subset PDFs)
3. `requirements-matrix.md` (normative requirement -> module -> tests)
4. `architecture.md` (how to structure the engine)
5. `ticket-plan.md` (step-by-step spec-referenced backlog)
6. `work-items.md` (execution-ready tickets for current build cycle)
7. `test-strategy.md` (how to verify behavior)
8. `source-material-triage.md` (full-corpus triage context)
9. `implementation-tickets.md` (older backlog draft; superseded by `ticket-plan.md`)

## Scope Philosophy

- Start with a strict MVP that renders and navigates cards correctly.
- Keep interfaces stable and internal modules replaceable.
- Add advanced semantics in phases (do/go/prev/refresh, variables, forms, timers/events).
