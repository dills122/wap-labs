# Waves Runtime Markup Spec Traceability

Version: v0.3
Status: WML/WBXML feature and nested-clause ledgers complete; direct evidence in progress (WML-202 14/14, WML-204 23/23 mapped clauses, WML-203 49/49)

## Purpose

Capture WML/WBXML runtime-markup requirements that govern deterministic deck/card execution in Waves.

## Source Authority Policy

- See `docs/waves/SOURCE_AUTHORITY_POLICY.md` for normative vs supplemental source precedence and citation rules.

## Source set reviewed (S0-07)

- `spec-processing/source-material/WAP-191-WML-20000219-a.pdf`
- `spec-processing/source-material/WAP-191_102-WML-20001213-a.pdf`
- `spec-processing/source-material/WAP-191_104-WML-20010718-a.pdf`
- `spec-processing/source-material/WAP-191_105-WML-20020212-a.pdf`
- `spec-processing/source-material/WAP-238-WML-20010911-a.pdf`
- `spec-processing/source-material/spec-wml-19990616.pdf`
- `spec-processing/source-material/WAP-192-WBXML-20010725-a.pdf`
- `spec-processing/source-material/WAP-192_105-WBXML-20011015-a.pdf`

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
  - Evidence: [x] Template grammar and ordering: `wml_202_parses_template_and_card_bindings_independently` and `wml_202_rejects_invalid_template_structure_deterministically` in `engine-wasm/engine/src/parser/wml_parser/tests.rs`; `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_202`.
  - Evidence: [x] Root/head ordering, access uniqueness/retention, and ordered meta validation/retention: `wml_202_retains_access_and_ordered_meta_for_the_whole_deck`, `wml_202_rejects_invalid_wml_root_structure_deterministically`, and `wml_202_rejects_invalid_head_access_and_meta_structure_deterministically`; WASM boundary parity: `wasm_wml_202_head_metadata_parser_matches_native_boundary_behavior`.
  - [x] Parser accepts valid deck structure and rejects invalid root/card omissions.
  - [ ] Runtime activation is deterministic for first-card selection and card ordering.

### RQ-RMK-002 Task model support and execution

- Requirement:
  - Support `%task` model (`go`, `prev`, `noop`, `refresh`) and deterministic runtime effects.
  - `do` and `onevent` task containers map to the same execution model.
- Spec:
  - `WAP-191*` task model and `do`/`onevent` DTD usage
- AC:
  - Evidence: [x] Template/card binding identity, precedence, noop masking, and navigation persistence: `engine-wasm/engine/src/engine_tests/actions_timers.rs` plus `engine-wasm/examples/source/wml-202-template-shadowing.wml`; `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_202` and `pnpm test:story WML-202`.
  - [ ] Each task path has explicit runtime behavior and observable state transitions.
  - [ ] Unsupported task attributes fail deterministically without host/runtime crash.

### RQ-RMK-003 Card context and navigation semantics

- Requirement:
  - Respect card `id` fragment targeting and history semantics (`go` push, `prev` pop).
  - Parse/retain card context attributes (`newcontext`, `ordered`) with spec-aligned defaults.
- Spec:
  - `WAP-191*` card attributes + navigation semantics
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] `#cardId` resolution is deterministic and missing target handling is explicit.
  - [ ] History behavior is stable across forward/back transitions and refresh paths.

### RQ-RMK-004 Event and timer lifecycle

- Requirement:
  - Support intrinsic card lifecycle events including enter-forward, enter-backward, and timer dispatch.
  - Timer model follows card-bound lifecycle and tenths-of-second value semantics.
- Spec:
  - `WAP-191*` event and timer model
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Enter/timer events are dispatched in deterministic order.
  - [ ] Timer start/stop/expiry behavior is card-scoped and test-checklisted.

### RQ-RMK-005 Variable substitution behavior

- Requirement:
  - Perform variable substitution in WML-defined contexts after XML parsing.
  - Undefined variable substitution yields empty string.
- Spec:
  - `WAP-191*` variable/substitution semantics
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Substitution timing is fixed in runtime pipeline (post-parse, pre-render/task use).
  - [ ] Undefined-variable behavior is covered by parser/runtime fixtures.

### RQ-RMK-006 Anchor shorthand semantics

- Requirement:
  - `<a>` semantics are equivalent to shorthand anchor-go behavior without embedded `setvar`.
  - Invalid nested anchor usage is handled as invalid content.
- Spec:
  - `WAP-191_104` anchor semantics
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
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
  - Evidence: [x] `wml_203_reconstructed_wdp_sdu_matches_text_engine_behavior`
    consumes the schema-v2 WDP delivery payload, supplies
    `application/vnd.wap.wmlc` at the fetch boundary, and compares native
    engine state/rendering with the paired text deck.
  - [x] Engine contracts do not require a WBXML parser in the WASM runtime for MVP.
  - [x] Transport/host boundary declares WBXML normalization responsibilities explicitly.

### RQ-RMK-008 `go` encoding and post behavior clarifications

- Requirement:
  - Apply later SIN clarifications around `go` method/encoding behavior (`post`, `enctype`, charset handling).
- Spec:
  - `WAP-191_105` SIN clarifications
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
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
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Runtime compatibility notes identify where Waves follows WML 1.x strict behavior vs WML2-style compatibility handling.
  - [ ] Parser/runtime behavior for unknown markup and timer/task lifecycle remains deterministic under fixture tests.

### RQ-RMK-010 WBXML 1.3 client decoder conformance

- Requirement:
  - Accept the effective WBXML 1.3 binary structure required by
    `WBXML-C-001`.
  - Apply the section 6.3 default-attribute behavior identified by
    `WBXML-C-010`.
  - Treat binary and literal token values equivalently for tags, attribute
    names, and attribute values as required by `WBXML-C-011`.
- Spec:
  - `WAP-192-WBXML-20010725-a` sections 5, 6.3, and 6.4
  - `WAP-192_105-WBXML-20011015-a` section 3.3 and corrected section 9
  - `docs/waves/WAP_1_2_1_WBXML_SCR_LEDGER.md`
- Status:
  - `partial`: the pinned built-in decoder and direct source-derived corpus
    establish direct evidence for all three selected rows. The bounded tranche
    promotes all 47 client-applicable nested clauses. Carrying-protocol charset precedence,
    WMLC MIME typing, and exhaustive WML page-zero token/literal equivalence
    are direct-evidence-backed. Full-range code-page indices have deterministic
    assigned, unassigned, and implementation-specific outcomes; non-WML token
    tables and generic WBXML routing remain outside this tranche. The
    unrepresentable-name tokenisation error is preserved in the unselected
    server/encoder profile.
- AC:
  - Evidence: [x] `transport-rust/tests/fixtures/transport/wbxml_wml13/conformance.json`
    and the three exact `transport_wbxml_c_*` tests provide direct parent-row
    evidence.
  - [x] Decoder version/capability identity is pinned and available in the
    supported all-in-one packaging path.
  - [x] Header, multi-byte integer, supported-charset, string-table,
    parser-state/page-zero, global-token, literal, entity, PI, opaque,
    extension, and malformed-input behavior has deterministic fixed outcomes
    for the selected tranche.
  - [x] Every WML 1.3 DTD default/fixed attribute has direct reconstruction
    evidence.
  - [x] A canonical text-WML fixture and the exact textual output of the paired
    WBXML fixture reach equal engine `Deck` values.
  - [x] The exact WBXML service data unit reconstructed from the schema-v2 WDP
    delivery fixture reaches the native engine through `engineDeckInput` and
    produces the same state and render list as the paired canonical text deck.
  - [x] Strict decode remains in `transport-rust`; `engine-wasm` receives
    normalized textual WML.

### RQ-RMK-011 Deck access-control enforcement

- Requirement:
  - Enforce effective WML 1.3 deck access-domain, access-path, and
    `sendreferer` rules before exposing protected deck content.
- Spec:
  - `WAP-191_104` sections 11.4 and 12.1
  - SCR: `WML-C-14`
- AC:
  - Evidence: [ ] Link source-derived allow/deny fixtures and host-policy
    integration tests.
  - [ ] Domain and path comparisons use the strict WML rules.
  - [ ] Denied access cannot mutate card, history, variable, or render state.
  - [ ] Referrer disclosure follows the deck access policy.

### RQ-RMK-012 User-agent error handling

- Requirement:
  - Apply effective WML 1.3 user-agent error outcomes consistently across
    parsing, task execution, navigation, rendering, and resource handling.
- Spec:
  - `WAP-191_104` section 12.3
  - SCR: `WML-C-16`
- AC:
  - Evidence: [x] WML-205 native taxonomy and atomic parse-load tests in
    `engine-wasm/engine/src/engine_tests/wml_load_errors.rs`, WASM parity checks in
    `engine-wasm/engine/src/engine_wasm_bindings_tests.rs`, and executable recovery story
    `engine-wasm/examples/source/wml-205-error-recovery.wml`; run
    `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_205` and
    `pnpm test:story WML-205`.
  - [x] Malformed, invalid, unsupported, and recoverable WML load classes map to stable
    host-visible codes and rejected/ignored outcomes.
  - [x] Rejected parse and payload-boundary loads preserve the last successfully loaded deck and
    metadata.
  - [x] Strict load failures remain distinct from optional diagnostics and extension recovery.
  - [ ] Fetch/access-control task failures still need host-boundary notification and complete
    card/context/pending-assignment/event atomicity evidence.

## Notes

- This traceability pass is derived from direct local-spec review plus existing deep extraction notes in `docs/wml-engine/source-material-review.md`.
- The exact WBXML SCR/profile/evidence mapping is maintained in
  `docs/waves/WAP_1_2_1_WBXML_SCR_LEDGER.md`.
- Full WAP-191 implementation-gap and execution planning follow-up is tracked in:
  - `docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md`
  - Phase R tickets in `docs/waves/WORK_ITEMS.md`
