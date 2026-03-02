# Waves Runtime Markup Spec Traceability

Version: v0.1  
Status: S0-07 complete (initial extraction + docling rerun validation pass)

## Purpose

Capture WML/WBXML runtime-markup requirements that govern deterministic deck/card execution in Waves.

## Source set reviewed (S0-07)

- `docs/source-material/WAP-191-WML-20000219-a.pdf`
- `docs/source-material/WAP-191_102-WML-20001213-a.pdf`
- `docs/source-material/WAP-191_104-WML-20010718-a.pdf`
- `docs/source-material/WAP-191_105-WML-20020212-a.pdf`
- `docs/source-material/WAP-238-WML-20010911-a.pdf`
- `docs/source-material/spec-wml-19990616.pdf`
- `docs/source-material/WAP-192-WBXML-20010725-a.pdf`
- `docs/source-material/WAP-192_105-WBXML-20011015-a.pdf`

## Normative precedence

1. `WAP-191_104` is the main runtime structure/semantics baseline.
2. `WAP-191_105` provides later SIN clarifications and takes precedence where applicable.
3. `WAP-238` provides WML2 user-agent reference behavior relevant for compatibility guidance.
4. `spec-wml-19990616` is early lineage reference for historical behavior wording.
5. `WAP-191_102` and `WAP-191` are legacy lineage references.
6. `WAP-192` defines WBXML baseline structure.
7. `WAP-192_105` applies SIN corrections/clarifications to WBXML conformance framing.

## Requirements matrix

Legend:

- `M` = mandatory
- `O` = optional

### RQ-RMK-001 Deck/card grammar baseline

- Requirement:
  - Parse deck root and card structure with WML card-centric model.
  - Require at least one card in a deck and preserve source card order.
- Spec:
  - `WAP-191*` DTD lineage (`wml`, `card`, task-bearing content model)
- AC:
  - [ ] Parser accepts valid deck/card structure and rejects invalid root/card omissions.
  - [ ] Runtime activation is deterministic for first-card selection and card ordering.

### RQ-RMK-002 Task model support and execution

- Requirement:
  - Support `%task` model (`go`, `prev`, `noop`, `refresh`) and deterministic runtime effects.
  - `do` and `onevent` task containers map to the same execution model.
- Spec:
  - `WAP-191*` task model and `do`/`onevent` DTD usage
- AC:
  - [ ] Each task path has explicit runtime behavior and observable state transitions.
  - [ ] Unsupported task attributes fail deterministically without host/runtime crash.

### RQ-RMK-003 Card context and navigation semantics

- Requirement:
  - Respect card `id` fragment targeting and history semantics (`go` push, `prev` pop).
  - Parse/retain card context attributes (`newcontext`, `ordered`) with spec-aligned defaults.
- Spec:
  - `WAP-191*` card attributes + navigation semantics
- AC:
  - [ ] `#cardId` resolution is deterministic and missing target handling is explicit.
  - [ ] History behavior is stable across forward/back transitions and refresh paths.

### RQ-RMK-004 Event and timer lifecycle

- Requirement:
  - Support intrinsic card lifecycle events including enter-forward, enter-backward, and timer dispatch.
  - Timer model follows card-bound lifecycle and tenths-of-second value semantics.
- Spec:
  - `WAP-191*` event and timer model
- AC:
  - [ ] Enter/timer events are dispatched in deterministic order.
  - [ ] Timer start/stop/expiry behavior is card-scoped and test-checklisted.

### RQ-RMK-005 Variable substitution behavior

- Requirement:
  - Perform variable substitution in WML-defined contexts after XML parsing.
  - Undefined variable substitution yields empty string.
- Spec:
  - `WAP-191*` variable/substitution semantics
- AC:
  - [ ] Substitution timing is fixed in runtime pipeline (post-parse, pre-render/task use).
  - [ ] Undefined-variable behavior is covered by parser/runtime fixtures.

### RQ-RMK-006 Anchor shorthand semantics

- Requirement:
  - `<a>` semantics are equivalent to shorthand anchor-go behavior without embedded `setvar`.
  - Invalid nested anchor usage is handled as invalid content.
- Spec:
  - `WAP-191_104` anchor semantics
- AC:
  - [ ] Link activation behavior matches equivalent `go` navigation semantics.
  - [ ] Invalid nesting path is deterministic and non-crashing.

### RQ-RMK-007 WBXML boundary and decode ownership

- Requirement:
  - WBXML decode remains outside engine runtime in current architecture boundary.
  - Engine receives textual WML (or normalized deck input) and does not perform network decode.
- Spec:
  - `WAP-192*` binary tokenized representation + code-page model
  - Waves architecture boundary decisions
- AC:
  - [ ] Engine contracts do not require WBXML parser in WASM runtime for MVP.
  - [ ] Transport/host boundary declares WBXML normalization responsibilities explicitly.

### RQ-RMK-008 `go` encoding and post behavior clarifications

- Requirement:
  - Apply later SIN clarifications around `go` method/encoding behavior (`post`, `enctype`, charset handling).
- Spec:
  - `WAP-191_105` SIN clarifications
- AC:
  - [ ] Navigation/request metadata model includes method + encoding attributes.
  - [ ] Same-deck vs external execution behavior is documented and fixture-scoped.

### RQ-RMK-009 WML2 reference-behavior compatibility guardrails

- Requirement:
  - Preserve deterministic handling for user-agent history/task/event/timer behaviors aligned with WML2 reference processing where applicable.
  - Unknown elements/attributes and mixed-content handling remain non-crashing and deterministic.
- Spec:
  - `WAP-238` section 5.1-5.11 and conformance sections
  - `spec-wml-19990616` reference-processing lineage
- AC:
  - [ ] Runtime compatibility notes identify where Waves follows WML 1.x strict behavior vs WML2-style compatibility handling.
  - [ ] Parser/runtime behavior for unknown markup and timer/task lifecycle remains deterministic under fixture tests.

## Notes

- This traceability pass is derived from direct local-spec review plus existing deep extraction notes in `docs/wml-engine/source-material-review.md`.
- Full WAP-191 implementation-gap and execution planning follow-up is tracked in:
  - `docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md`
  - Phase R tickets in `docs/waves/WORK_ITEMS.md`
