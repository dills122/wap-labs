# Waves Runtime Markup Spec Traceability

Version: v0.3
Status: WML/WBXML feature and nested-clause ledgers complete; direct evidence in progress (WML-202 30/30 complete, WML-203 68/68 complete, WML-204 23/23 complete, WML-304 request path 14/15 complete)

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
  - Evidence: [x] WML-203 strict native validation in `engine-wasm/engine/src/engine_tests/wml_203_validation.rs`, WASM parity in `engine-wasm/engine/src/engine_wasm_bindings_tests.rs`, and `wml-203-dtd-family.wml` cover the mandatory prologue and every selected WML 1.3 DTD element family; run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_203`, `wasm-pack test --node engine-wasm/engine`, and `pnpm test:story WML-203`.
  - Evidence: [x] Template grammar and ordering: `wml_202_parses_template_and_card_bindings_independently` and `wml_202_rejects_invalid_template_structure_deterministically` in `engine-wasm/engine/src/parser/wml_parser/tests.rs`; `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_202`.
  - Evidence: [x] Root/head ordering, access uniqueness/retention, and ordered meta validation/retention: `wml_202_retains_access_and_ordered_meta_for_the_whole_deck`, `wml_202_rejects_invalid_wml_root_structure_deterministically`, and `wml_202_rejects_invalid_head_access_and_meta_structure_deterministically`; WASM boundary parity: `wasm_wml_202_head_metadata_parser_matches_native_boundary_behavior`.
  - Evidence: [x] Card collection and onevent/timer/content grammar plus language/context defaults: `wml_202_retains_root_and_card_language_context_metadata_with_defaults` and `wml_202_enforces_card_event_timer_content_order`.
  - [x] Parser accepts valid deck structure and rejects invalid root/card omissions.
  - [x] Runtime activation and source card-content order are deterministic: `wml_202_card_content_order_is_preserved_in_render_output`.

### RQ-RMK-002 Task model support and execution

- Requirement:
  - Support `%task` model (`go`, `prev`, `noop`, `refresh`) and deterministic runtime effects.
  - `do` and `onevent` task containers map to the same execution model.
- Spec:
  - `WAP-191*` task model and `do`/`onevent` DTD usage
- AC:
  - Evidence: [x] WML-303 task identity, optional/noop filtering, card/template shadowing, intrinsic conflicts/scope, BACK/accept precedence, entry order, and rollback are covered in `engine-wasm/engine/src/engine_tests/wml_303_actions.rs`, the native/WASM host boundary suites, and `engine-wasm/examples/source/wml-303-actions-softkeys.flow.json`; run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_303`, `wasm-pack test --node engine-wasm/engine`, and `pnpm test:story WML-303`.
  - Evidence: [x] WML-309 exposes every active non-optional `do` exactly once in the canonical engine frame, uses evaluated authored labels with deterministic type fallback, omits optional/noop-masked actions, and activates advertised action IDs only against the current frame. Evidence is synchronized across `engine-wasm/engine/src/engine_tests/wml_309_frame.rs`, native/WASM serialized-contract tests, Tauri host tests, and `engine-wasm/examples/source/wml-309-frame-affordances.flow.json`; run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_309`, `wasm-pack test --node engine-wasm/engine`, `cargo test --manifest-path browser/src-tauri/Cargo.toml`, and `pnpm test:story WML-309`.
  - Evidence: [x] WML-302 setvar task snapshot, assignment, target-resolution, prev, refresh, and rollback ordering is covered in `engine-wasm/engine/src/engine_tests/wml_302_variables.rs`, WASM parity, and `engine-wasm/examples/source/wml-302-variable-substitution.flow.json`; run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_302`, `wasm-pack test --node engine-wasm/engine`, and `pnpm test:story WML-302`.
  - Evidence: [x] WML-304 publishes a typed GET/POST request intent with ordered resolved postfields, `sendreferer`, no-cache, enctype, accept-charset, and same-deck classification across native/WASM/Tauri serialization; transport consumes that intent in `transport-rust/src/request_serialization.rs` with byte-exact mapped fixtures and browser/Tauri handoff tests. Run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_304`, `cargo test --manifest-path transport-rust/Cargo.toml request_serialization`, and `pnpm test:story WML-304`.
  - [x] Each task path has explicit runtime behavior and observable state transitions.
  - [x] Unsupported task attributes fail deterministically without host/runtime crash.
  - Dynamic do visibility, labels, and widget exposure remain planned for the WBP-06 frame/affordance gate after the completed D0-01 contract sequence; WML-302 closes variable/setvar task ordering without changing the host-visible engine contract.

### RQ-RMK-003 Card context and navigation semantics

- Requirement:
  - Respect card `id` fragment targeting and history semantics (`go` push, `prev` pop).
  - Parse/retain card context attributes (`newcontext`, `ordered`) with spec-aligned defaults.
- Spec:
  - `WAP-191*` card attributes + navigation semantics
- AC:
  - Evidence: [x] `engine-wasm/engine/src/engine_tests/wml_202_residual.rs` proves newcontext defaults, go-only variable/history/private-state reset, direct-navigation exclusion, and rollback-safe state; `pnpm test:story WML-202` proves empty history after the stable newcontext flow.
  - Evidence: [x] WML-301 closes card-id selection, missing-fragment first-card fallback, forward/backward/reload entry order, context preservation/reset, duplicate explicit history pushes, context-initialization-before-history order, and source-required card/table line boundaries in `engine-wasm/engine/src/engine_tests/wml_301_context_history.rs`, `engine-wasm/engine/src/engine_wasm_bindings_tests.rs`, browser history tests, `engine-wasm/examples/source/wml-301-context-history.flow.json`, and `engine-wasm/examples/source/wml-301-card-table-boundaries.flow.json`; run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_301`, `wasm-pack test --node engine-wasm/engine`, `pnpm --dir browser/frontend test`, and `pnpm test:story WML-301`.
  - Evidence: [x] WML-302 resolves WML-authored target data before same-deck history insertion or external navigation handoff. `HISTORY-RESOLVES-VARIABLES` remains owned by WML-302; WML-304 defines the typed request identity, R0-06/WSP-805 serializes it through the desktop fetch handoff, and Request A2 replays the retained typed POST values when Back must refetch a prior deck.
  - [x] A monotonic engine context epoch makes newcontext and independent-navigation replacement observable so the host discards the old history without moving runtime semantics out of Rust.

### RQ-RMK-004 Event and timer lifecycle

- Requirement:
  - Support intrinsic card lifecycle events including enter-forward, enter-backward, and timer dispatch.
  - Timer model follows card-bound lifecycle and tenths-of-second value semantics.
- Spec:
  - `WAP-191*` event and timer model
- AC:
  - Evidence: [x] WML-303 covers intrinsic attribute/element equivalence, same-scope conflict rejection, illegal-parent ignoring, card-over-template precedence, forward/backward entry order, and the entry-handler-before-timer boundary in `engine-wasm/engine/src/engine_tests/wml_303_actions.rs` plus the existing `actions_timers.rs` suite.
  - [x] Enter events are dispatched in deterministic order before the entered card timer/display boundary.
  - Evidence: [x] WML-305 covers single-timer validation, named-value precedence, tenths units, invalid/zero disabling, entry start, exit persistence/stop, refresh stop-update-resume, start-before-display ordering, one-to-zero dispatch, and exact host wakeups in `wml_305_timers.rs`, the WASM boundary suite, browser timer-runtime tests, and `pnpm test:story WML-305`.
  - [x] Timer start/stop/expiry behavior is card-scoped and target-parity tested without reopening WML-303.

### RQ-RMK-005 Variable substitution behavior

- Requirement:
  - Perform variable substitution in WML-defined contexts after XML parsing.
  - Undefined variable substitution yields empty string.
- Spec:
  - `WAP-191*` variable/substitution semantics
- AC:
  - Evidence: [x] The bounded WML-204 input/select/option lane is covered by `wml_204_input_vdata_conversions_preserve_source_variable`, `wml_204_control_initialization_interleaves_selects_and_inputs_in_document_order`, `wml_204_option_vdata_defaults_to_noesc_and_href_defaults_to_escape`, and `wml_204_invalid_control_variable_references_reject_load_atomically`; run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_204` and `pnpm test:story WML-204`.
  - Evidence: [x] WASM boundary parity and load-failure atomicity are covered by `wasm_wml_204_invalid_variable_reference_rejection_is_atomic` and `wasm_wml_204_conversion_order_empty_option_and_href_match_native`; run `wasm-pack test --node engine-wasm/engine`.
  - Evidence: [x] WML-302 fixes substitution after XML/entity parsing and before render/task use, including text, vdata/HREF defaults, conversions, undefined variables, `$$`, invalid-reference rejection, task snapshots, and resolved link/go targets in `engine-wasm/engine/src/engine_tests/wml_302_variables.rs` plus WASM/story parity.
  - [x] Substitution timing is fixed in runtime pipeline (post-parse, pre-render/task use).
  - [x] Undefined-variable behavior is covered for control and ordinary text/link contexts.
  - Request serialization/postfields are directly covered by WML-304 without reopening WML-302.

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
  - `WAP-191_104` sections 9.3 and 9.5.1, as amended by `WAP-191_105` section 4.3
  - `WAP-203-WSP` sections 6.4 and 8.2.3 for the connectionless method/header handoff
- AC:
  - Evidence: [x] `engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs`, native/WASM/Tauri contract tests, and `engine-wasm/examples/source/wml-304-request-intent.flow.json` prove the parser/runtime request-intent boundary; run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_304`, `wasm-pack test --node engine-wasm/engine`, and `pnpm test:story WML-304`.
  - [x] Navigation/request metadata includes method, ordered postfields, enctype, accept-charset, referer opt-in, no-cache, and same-deck classification.
  - [x] Same-deck postfield suppression is documented and fixture-scoped.
  - [x] Native transport serialization, charset/body construction, smallest-relative referer emission, and no-cache application have direct byte-exact fixture, browser adapter, Tauri HTTP handoff, and native WSP header evidence.
  - [x] Request A2 retains and replays semantic POST input without treating legacy `postContext` bytes as the authoritative identity.
  - [ ] Multipart part Content-Type construction remains the final WML-304 gap.

### RQ-RMK-009 WML2 reference-behavior compatibility guardrails

- Requirement:
  - Preserve deterministic handling for user-agent history/task/event/timer behaviors aligned with WML2 reference processing where applicable.
  - Unknown elements/attributes and mixed-content handling remain non-crashing and deterministic.
- Spec:
  - `WAP-238` section 5.1-5.11 and conformance sections
  - `spec-wml-19990616` reference-processing lineage
- AC:
  - Evidence: [x] WML-203 canonical/alternate-DTD classification and unknown-wrapper preservation tests remain paired with strict canonical DTD enforcement; run `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_203`.
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
  - [x] Every declared WML element has an invalid-form rejection fixture, with additional
    case-sensitive name, literal-only, length, table, task, event, variable, prologue, and
    structure enforcement.
  - [x] Fetch and access-control task failures notify at the host boundary while preserving the
    invoking card, context, pending external intent/task data, focus/event state, committed
    session metadata, and history; the production-WASM story covers both paths.

## Notes

- This traceability pass is derived from direct local-spec review plus existing deep extraction notes in `docs/wml-engine/source-material-review.md`.
- The exact WBXML SCR/profile/evidence mapping is maintained in
  `docs/waves/WAP_1_2_1_WBXML_SCR_LEDGER.md`.
- Full WAP-191 implementation-gap and execution planning follow-up is tracked in:
  - `docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md`
  - Phase R tickets in `docs/waves/WORK_ITEMS.md`
