# Ticket Plan (Spec-Referenced)

This is the actionable backlog for implementation without overengineering.

Traceability linkage:

- Engine requirements map to Waves IDs in `docs/wml-engine/requirements-matrix.md`.
- Cross-project contract/test alignment is tracked in:
  - `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
  - `docs/waves/SPEC_TEST_COVERAGE.md`

## Phase A: Lock MVP Runtime (P0)

### A1. Parser baseline hardening
- Build:
1. Enforce `wml -> card+` invariant.
2. Preserve card order and ids.
3. Support MVP nodes: `p`, `br`, `a[href]`.
4. Ignore unsupported tags without panic.
- Sources:
`WAP-191_104` DTD deck/card and `a` element sections.
- Accept:
1. Unit tests for malformed/unknown tags.
2. Golden parse snapshots for two-card fixtures.

### A2. Navigation + history baseline
- Build:
1. Internal fragment nav (`#cardId`).
2. External nav intent emission.
3. History push/pop for card transitions.
- Sources:
`WAP-191*` go/prev semantics and history descriptions.
- Accept:
1. Key-sequence integration tests.
2. Deterministic state snapshots.

### A3. Render determinism
- Build:
1. Deterministic text wrapping by viewport cols.
2. Deterministic focus indexing per logical link.
3. Stable draw command order.
- Sources:
WML card ordering guidance (`ordered` as hint, not strict layout algorithm).
- Accept:
1. Snapshot tests at multiple viewport widths.

### A4. Boundary metadata stability
- Build:
1. Keep `loadDeckContext(wmlXml, baseUrl, contentType, rawBytesBase64?)` primary.
2. Preserve backwards-compatible `loadDeck(xml)`.
- Sources:
WML/WBXML media-type and transport-normalization boundary.
- Accept:
1. Contract tests in host sample.

## Phase B: Spec Semantics Additions (P1)

### B1. Card metadata semantics
- Build:
1. Parse/store `newcontext`, `ordered`, `title`, card intrinsic event attrs.
2. Parse/store `head/template/access/meta` minimally.
- Sources:
`WAP-191_104` DTD and card/template/head/access definitions.
- Accept:
1. Metadata getter tests.

### B2. Task model (`do` + `%task`)
- Build:
1. Parse `do` and nested `go|prev|noop|refresh`.
2. Softkey/task activation map.
3. Task executor pipeline.
- Sources:
`WAP-191_104` sections 9.5, 9.6 and DTD `%task`.
- Accept:
1. One integration test per task type.

### B3. Variable substitution
- Build:
1. Variable store.
2. Substitution in text + `%vdata` + `%HREF`.
3. Undefined variable -> empty string.
4. Correct substitution timing in action pipeline.
- Sources:
`WAP-191_104` variable semantics and substitution processing order.
- Accept:
1. Substitution fixture matrix, including nested navigation + setvar.

### B4. Timer + intrinsic events
- Build:
1. Parse timer element and attributes.
2. Start/stop/expire behavior hooks.
3. `ontimer` dispatch via onevent/task path.
- Sources:
`WAP-191_104` section 11.7 + intrinsic event table.
- Accept:
1. Deterministic simulated-clock tests.

## Phase C: Forms and Request Semantics (P2)

### C1. Field model
- Build:
1. Add input/select/option/fieldset representations.
2. Focus/edit semantics in constrained viewport.
- Sources:
`WAP-191*` field and option/form sections.
- Accept:
1. Form navigation/edit snapshots.

### C2. Request payload semantics
- Build:
1. Implement postfield serialization order and encoding pipeline.
2. Implement go method/enctype/accept-charset behavior.
- Sources:
`WAP-191_104` and `WAP-191_105` go/postfield clarifications.
- Accept:
1. Payload generation fixture tests (GET + POST + multipart metadata behavior).

## Phase D: Deferred Advanced Features

- WMLScript (`WAP-193*`, `WAP-194*`)
- Styling (`WAP-239*`)
- Transform features (`WAP-244`)

These remain intentionally deferred to avoid overengineering early phases.

## Cross-Cutting Quality Tickets

### Q1. Error taxonomy
- Add stable parse/runtime/nav error codes exposed to host.

### Q2. Requirement traceability
- For each implemented requirement id from `requirements-matrix.md`, add test id mapping.

### Q3. Conformance fixtures
- Build fixture deck corpus from subset specs and maintain expected outputs under version control.
