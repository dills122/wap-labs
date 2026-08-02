# WML-3 AI Context Pack

> Generated from the WAP 1.2.1 knowledge graph slice. Canonical manifests remain authoritative.

## Retrieval contract

- Target: `WML-3`
- Release/profile: WAP 1.2.1, WML 1.3, `CCR-CLASSC-C-001`
- Compatibility floor: `strict-historical-observable-behavior`
- Selection rule: include the target sprint, its direct dependency/downstream neighbors, all target work items, their explicitly mapped normative clauses, and separately labeled aggregate regression/delegate context.
- Safety rule: absence from this pack does not mean a requirement is optional, implemented, or out of scope.
- Enhancement rule: additive behavior may extend strict behavior but may not replace a selected historical obligation.

## Graph summary

- Nodes: 362
- Edges: 963
- Selected work items: 9
- Direct SCR rows: 13
- Direct normative clauses: 129
- Aggregate regression/delegate context clauses: 7
- Work items without direct clause mappings: 1
- Work items with unmapped declared normative families: 2

## Execution target

### WML-3: WML state, tasks, events, forms, and navigation

- Status: `in-progress`
- Goal: Close the observable runtime mechanics that define historical WML browser behavior.
- Depends on: `WML-2`
- Direct downstream sprints: `INT-9`, `REN-4`, `WAE-6`, `WMLS-5`

Exit gates:

- Mandatory WML runtime SCR lines are covered by deterministic tests.
- Form/network effects cross contracts without host-side semantic reimplementation.
- Native and WASM outcomes are equivalent.

## Work items

### WML-301: Deck/card context, history, newcontext, inter-card process order, and card/table boundary closure

- Status: `in-progress`
- Owner layers: `engine-wasm`, `browser`, `qa`
- Source families: `wml`, `wae`
- Existing tickets: `R0-02`, `R0-03`, `A5-01`
- Direct SCR rows: 0
- Selected SCR parents: 7 (`WML-C-07`, `WML-C-10`, `WML-C-13`, `WML-C-18`, `WML-C-25`, `WML-C-29`, `WML-C-46`)
- Direct normative clauses: 13
- Aggregate regression/delegate context: 7 (4 additional parents: `WAESpec-C-015`, `WAESpec-C-016`, `WAESpec-C-017`, `WML-C-11`)
- Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-003`, `RQ-WAE-016`
- Spec references: `WAP-191_104-WML sections 9.2, 10.1, 10.4, 11.5.2, 12.5, and 12.5.1`
- Follow-up work items: None
- Depends on: None

Outputs:

- Deck/card context, history, newcontext, inter-card process order, and card/table boundary closure

Acceptance:

- Forward, backward, reload, failure rollback, context reset, and source-required table boundaries match strict ordering and layout across native and WASM adapters.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`
- `cargo test --manifest-path browser/src-tauri/Cargo.toml`
- `pnpm --dir browser/frontend test`
- `wasm-pack test --node engine-wasm/engine`
- `pnpm test:story WML-301`
- `node scripts/wap-context-pack.mjs WML-301`
- `pnpm wap-compliance:check`
- `pnpm wap-graph:check`

### WML-302: Variable store and substitution closure

- Status: `done`
- Owner layers: `engine-wasm`, `qa`
- Source families: `wml`
- Existing tickets: `C5-04`
- Direct SCR rows: 0
- Selected SCR parents: 9 (`WML-C-07`, `WML-C-12`, `WML-C-18`, `WML-C-29`, `WML-C-33`, `WML-C-38`, `WML-C-42`, `WML-C-43`, `WML-C-52`)
- Direct normative clauses: 20
- Aggregate regression/delegate context: 0
- Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-005`, `RQ-WAE-016`
- Spec references: `WAP-191_104-WML sections 9.2, 9.4, 10.3 through 10.3.5, and 12.5.1, 12.5.2, and 12.5.4`
- Follow-up work items: `WML-301`, `WML-304`, `WML-305`
- Depends on: None

Outputs:

- Variable store and substitution closure

Acceptance:

- Initialization, escaping modes, substitution contexts, setvar ordering, and invalid references match effective WML rules.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_302`
- `wasm-pack test --node engine-wasm/engine`
- `pnpm test:story WML-302`
- `node scripts/wap-context-pack.mjs WML-302`
- `pnpm wap-compliance:check`
- `pnpm wap-graph:check`

### WML-303: do/onevent/task shadowing and softkey precedence closure

- Status: `done`
- Owner layers: `engine-wasm`, `browser`, `qa`
- Source families: `wml`
- Existing tickets: `R0-04`, `R0-09`, `C5-04`
- Direct SCR rows: 0
- Selected SCR parents: 12 (`WML-C-07`, `WML-C-08`, `WML-C-09`, `WML-C-16`, `WML-C-18`, `WML-C-26`, `WML-C-29`, `WML-C-35`, `WML-C-38`, `WML-C-39`, `WML-C-42`, `WML-C-47`)
- Direct normative clauses: 27
- Aggregate regression/delegate context: 0
- Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-004`, `RQ-RMK-012`, `RQ-WAE-016`
- Spec references: `WAP-191_104-WML sections 9.2, 9.5, 9.6, 9.7, 9.10, 11.4, and 12.5`, `RQ-WAE-017 / WAP-236 section 7.11.2 (successor delta evidence only)`
- Follow-up work items: `WML-302`, `WML-304`, `WML-305`
- Depends on: None

Outputs:

- do/onevent/task shadowing and softkey precedence closure

Acceptance:

- go, prev, refresh, noop, intrinsic events, template/card shadowing, BACK availability, and activation order are deterministic.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`
- `wasm-pack test --node engine-wasm/engine`
- `cargo test --manifest-path browser/src-tauri/Cargo.toml`
- `pnpm --dir browser/frontend test`
- `pnpm test:story WML-303`
- `node scripts/wap-context-pack.mjs WML-303`
- `pnpm wap-compliance:check`
- `pnpm wap-graph:check`

### WML-304: GET/POST/postfield/form commit pipeline

- Status: `in-progress`
- Owner layers: `engine-wasm`, `transport-rust`, `browser`, `qa`
- Source families: `wml`
- Existing tickets: `R0-06`, `T0-30`, `C5-05`
- Direct SCR rows: 5 (5 `direct-test-linked`)
- Selected SCR parents: 5 (`WML-C-07`, `WML-C-14`, `WML-C-29`, `WML-C-37`, `WML-C-38`)
- Direct normative clauses: 15
- Aggregate regression/delegate context: 0
- Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-011`, `RQ-WAE-016`
- Spec references: `WAP-191_104-WML sections 9.2, 9.3, and 9.5.1 as amended by WAP-191_105-WML section 4.3`
- Follow-up work items: None
- Depends on: None

Outputs:

- GET/POST/postfield/form commit pipeline

Acceptance:

- Field commit, postfield generation, same-deck suppression, accept-charset, URL encoding, multipart optionality, referer, and no-cache behavior follow SIN 105.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_304`
- `wasm-pack test --node engine-wasm/engine`
- `pnpm --dir engine-wasm/host-sample run contracts:check`
- `pnpm test:story WML-304`
- `node scripts/wap-context-pack.mjs WML-304`
- `pnpm wap-compliance:check`
- `pnpm wap-graph:check`

### WML-305: Native WML timer lifecycle

- Status: `done`
- Owner layers: `engine-wasm`, `browser`, `qa`
- Source families: `wml`
- Existing tickets: `A5-03`, `W0-05`
- Direct SCR rows: 0
- Selected SCR parents: 5 (`WML-C-09`, `WML-C-18`, `WML-C-29`, `WML-C-42`, `WML-C-48`)
- Direct normative clauses: 10
- Aggregate regression/delegate context: 0
- Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-004`
- Spec references: `WAP-191_104-WML sections 11.7, 12.5.1, and 12.5.4`
- Follow-up work items: `WML-301`, `WML-304`, `WML-306`
- Depends on: None

Outputs:

- Native WML timer lifecycle

Acceptance:

- Timer start, stop, resume, expiry, invalid values, ontimer dispatch, and host wakeups are deterministic and target-parity tested.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_305`
- `wasm-pack test --node engine-wasm/engine`
- `cargo test --manifest-path browser/src-tauri/Cargo.toml`
- `pnpm --dir browser/frontend test`
- `pnpm test:story WML-305`
- `node scripts/wap-context-pack.mjs WML-305`
- `pnpm wap-compliance:check`
- `pnpm wap-graph:check`

### WML-306: Access control, low-memory, and runtime error policy

- Status: `done`
- Owner layers: `engine-wasm`, `browser`, `qa`
- Source families: `wml`
- Existing tickets: `R0-07`
- Direct SCR rows: 8 (8 `direct-test-linked`)
- Selected SCR parents: 8 (`WML-C-14`, `WML-C-15`, `WML-C-16`, `WML-C-17`, `WML-C-18`, `WML-C-21`, `WML-C-29`, `WML-C-38`)
- Direct normative clauses: 18
- Aggregate regression/delegate context: 0
- Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-009`, `RQ-RMK-011`, `RQ-RMK-012`
- Spec references: `WAP-191_104-WML sections 11.3.1, 12.1 through 12.4, and 12.5.5`
- Follow-up work items: None
- Depends on: None

Outputs:

- Access control, low-memory, and runtime error policy

Acceptance:

- Deck access checks, low-memory behavior, unknown DTDs, task failures, and user-visible errors have strict deterministic policies.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_306`
- `wasm-pack test --node engine-wasm/engine`
- `cargo test --manifest-path browser/src-tauri/Cargo.toml`
- `pnpm --dir browser/frontend test`
- `pnpm test:story WML-306`
- `node scripts/wap-context-pack.mjs WML-306`
- `pnpm wap-compliance:check`
- `pnpm wap-graph:check`

### WML-307: Additive WML character-processing and generic WBXML residual closure

- Status: `todo`
- Owner layers: `engine-wasm`, `transport-rust`, `qa`
- Source families: `wml`, `wbxml`
- Existing tickets: `C5-06`
- Direct SCR rows: 0
- Selected SCR parents: 0
- Direct normative clauses: 0
- Aggregate regression/delegate context: 0
- Requirements: None
- Spec references: None
- Follow-up work items: None
- Depends on: None

Outputs:

- Additive WML character-processing and generic WBXML residual closure

Acceptance:

- WML-C-05 and WML-C-06 receive complete source-derived encoding/entity evidence, and WBXML-C-001, WBXML-C-010, and WBXML-C-011 close non-WML token-table, implied-default, and generic-routing gaps without reopening WML-203.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`
- `cargo test --manifest-path transport-rust/Cargo.toml`
- `node scripts/check-wap-conformance-ledger.mjs`

### WML-308: Additive form-control presentation and capability residual closure

- Status: `todo`
- Owner layers: `engine-wasm`, `browser`, `qa`
- Source families: `wml`, `wae`
- Existing tickets: `R0-04`, `R0-05`
- Direct SCR rows: 0
- Selected SCR parents: 5 (`WML-C-09`, `WML-C-12`, `WML-C-33`, `WML-C-41`, `WML-C-43`)
- Direct normative clauses: 23
- Aggregate regression/delegate context: 0
- Requirements: `RQ-RMK-001`, `RQ-RMK-003`, `RQ-RMK-004`, `RQ-RMK-005`
- Spec references: None
- Follow-up work items: None
- Depends on: None

Outputs:

- Additive form-control presentation and capability residual closure

Acceptance:

- Input, option, select, and optgroup presentation metadata and optional capability behavior are source-aligned without moving frame policy into the engine.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`
- `pnpm --dir browser/frontend test`
- `pnpm test:story WML-308`

### WML-309: Engine-owned frame and affordance contract for active WML do actions

- Status: `done`
- Owner layers: `engine-wasm`, `browser`, `qa`
- Source families: `wml`
- Existing tickets: `WBP-06`, `F0-01`
- Direct SCR rows: 0
- Selected SCR parents: 1 (`WML-C-26`)
- Direct normative clauses: 3
- Aggregate regression/delegate context: 0
- Requirements: `RQ-RMK-002`
- Spec references: `WAP-191_104-WML section 9.7`
- Follow-up work items: None
- Depends on: None

Outputs:

- Engine-owned frame and affordance contract for active WML do actions

Acceptance:

- Every active non-optional do is represented once with stable activation identity and best-effort authored labelling without assuming a vendor-specific physical widget.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_309`
- `wasm-pack test --node engine-wasm/engine`
- `cargo test --manifest-path browser/src-tauri/Cargo.toml`
- `pnpm test:story WML-309`
- `node scripts/wap-context-pack.mjs WML-309`
- `pnpm wap-compliance:check`
- `pnpm wap-graph:check`

## Direct SCR evidence

### WML-304

- **WML-C-07** — History
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §9.2 (SCR §15.1.2)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#navigate_back_internal`, `browser/frontend/src/session-history.ts#cloneRequestPolicy`, `browser/frontend/src/app/navigation-state.ts#navigateBackWithFallback`
  - Tests: `engine-wasm/engine/src/engine_tests/actions_timers.rs::navigate_back_restores_previous_card` (`cd engine-wasm/engine && cargo test navigate_back_restores_previous_card`), `browser/frontend/src/app/navigation-state.history.test.ts::replays typed POST values when history back must refetch the prior deck` (`pnpm --dir browser/frontend test -- src/app/navigation-state.history.test.ts src/session-history.test.ts`)
  - Work items: `R0-01`, `R0-03`, `WML-304`
  - Assessment note: WML-301 closes request-shaped ordered history, duplicate access, content exclusion, and context-aware push/pop. WML-304 replays the original typed POST values through the transport boundary when Back must refetch a prior deck.
- **WML-C-14** — Deck access control
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §12.1 (SCR §15.1.4)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/runtime/deck.rs#allows_referring_uri`, `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#wml_go_request_policy`, `transport-rust/src/request_serialization.rs#smallest_usable_referer`
  - Tests: `engine-wasm/engine/src/engine_tests/wml_202_residual.rs::wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules` (`cd engine-wasm/engine && cargo test wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules`), `engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs::wml_304_post_intent_carries_request_attributes_without_constructing_multipart` (`cd engine-wasm/engine && cargo test wml_304_post_intent_carries_request_attributes_without_constructing_multipart`), `engine-wasm/engine/src/engine_tests/wml_306_policy.rs::wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable` (`cd engine-wasm/engine && cargo test wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable`), `transport-rust/src/request_serialization/tests.rs::mapped_fixture_is_byte_exact_and_rejects_invalid_combinations` (`cargo test --manifest-path transport-rust/Cargo.toml mapped_fixture_is_byte_exact_and_rejects_invalid_combinations`)
  - Work items: `R0-01`, `R0-07`, `WML-304`, `WML-306`
  - Assessment note: Deck access domain/path checks run before commit, WML-304 preserves sendreferer opt-in in the request intent, and the transport request boundary emits the smallest usable relative referer. WML-306 adds direct atomic-denial and safe host-presentation evidence.
- **WML-C-29** — go
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §9.5.1 (SCR §15.1.5)
  - Assessment: `partial`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#wml_go_request_policy`, `engine-wasm/engine/src/parser/wml_parser/actions.rs#parse_go_request_xml`
  - Tests: `engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs::wml_304_get_intent_preserves_order_without_claiming_query_merge` (`cd engine-wasm/engine && cargo test wml_304_get_intent_preserves_order_without_claiming_query_merge`), `engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs::wml_304_post_intent_carries_request_attributes_without_constructing_multipart` (`cd engine-wasm/engine && cargo test wml_304_post_intent_carries_request_attributes_without_constructing_multipart`)
  - Work items: `R0-01`, `R0-02`, `R0-06`, `WML-304`, `WML-306`
  - Assessment note: The parser and runtime publish a typed GET/POST request intent with ordered postfields, referer opt-in, no-cache, enctype, charset, and same-deck classification; wire construction, origin reload, and replay remain open.
- **WML-C-37** — postfield
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §9.3 (SCR §15.1.5)
  - Assessment: `partial`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/parser/wml_parser/actions.rs#collect_post_fields_xml`, `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#resolve_post_fields`
  - Tests: `engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs::wml_304_get_intent_preserves_order_without_claiming_query_merge` (`cd engine-wasm/engine && cargo test wml_304_get_intent_preserves_order_without_claiming_query_merge`)
  - Work items: `R0-01`, `R0-02`, `R0-06`, `WML-304`
  - Assessment note: Postfield name/value vdata is resolved in document order into the request intent and the compatibility form payload; charset transcoding and final transport serialization remain open.
- **WML-C-38** — prev
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §9.5.2 (SCR §15.1.5)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#CardTaskAction::Prev`, `browser/frontend/src/app/navigation-state.ts#navigateBackWithFallback`
  - Tests: `engine-wasm/engine/src/engine_tests/actions_timers.rs::enter_accept_prev_action_navigates_back_when_history_exists` (`cd engine-wasm/engine && cargo test enter_accept_prev_action_navigates_back_when_history_exists`), `browser/frontend/src/app/navigation-state.history.test.ts::replays typed POST values when history back must refetch the prior deck` (`pnpm --dir browser/frontend test -- src/app/navigation-state.history.test.ts src/session-history.test.ts`)
  - Work items: `R0-01`, `R0-02`, `WML-304`, `WML-306`
  - Assessment note: Prev pops request-shaped card history, executes variable assignments and backward-entry behavior, and replays typed POST values when the prior deck must be fetched again.

### WML-306

- **WML-C-14** — Deck access control
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §12.1 (SCR §15.1.4)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/runtime/deck.rs#allows_referring_uri`, `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#wml_go_request_policy`, `transport-rust/src/request_serialization.rs#smallest_usable_referer`
  - Tests: `engine-wasm/engine/src/engine_tests/wml_202_residual.rs::wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules` (`cd engine-wasm/engine && cargo test wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules`), `engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs::wml_304_post_intent_carries_request_attributes_without_constructing_multipart` (`cd engine-wasm/engine && cargo test wml_304_post_intent_carries_request_attributes_without_constructing_multipart`), `engine-wasm/engine/src/engine_tests/wml_306_policy.rs::wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable` (`cd engine-wasm/engine && cargo test wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable`), `transport-rust/src/request_serialization/tests.rs::mapped_fixture_is_byte_exact_and_rejects_invalid_combinations` (`cargo test --manifest-path transport-rust/Cargo.toml mapped_fixture_is_byte_exact_and_rejects_invalid_combinations`)
  - Work items: `R0-01`, `R0-07`, `WML-304`, `WML-306`
  - Assessment note: Deck access domain/path checks run before commit, WML-304 preserves sendreferer opt-in in the request intent, and the transport request boundary emits the smallest usable relative referer. WML-306 adds direct atomic-denial and safe host-presentation evidence.
- **WML-C-15** — Low-memory behaviour
  - Actor/status/profile: `wml-user-agent`; `optional`; `optional-not-required-by-class-c-client`
  - Spec: `WAP-191_104-WML` §12.2 (SCR §15.1.4)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#execute_card_task_action`, `browser/frontend/src/session-history.ts#HOST_HISTORY_ENTRY_CAPACITY`, `browser/frontend/src/app/browser-presenter.ts#announceRuntimeFailure`
  - Tests: `engine-wasm/engine/src/engine_tests/wml_306_policy.rs::wml_306_low_memory_reclaims_history_resets_context_and_retries_atomically` (`cd engine-wasm/engine && cargo test wml_306_low_memory_reclaims_history_resets_context_and_retries_atomically`), `browser/frontend/src/session-history.test.ts::implements the WML-306 optional low-memory history policy as bounded LRU` (`pnpm --dir browser/frontend test -- src/session-history.test.ts`)
  - Work items: `R0-01`, `R0-07`, `WML-306`
  - Assessment note: The optional Class C low-memory capability uses a 32-entry host LRU window (above the recommended minimum of ten), reclaims engine and host history before failure, resets the browser context to an empty predictable state when variable storage remains exhausted, retries the pending task once, and publishes bounded host-owned notification copy.
- **WML-C-16** — Error handling
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §12.3 (SCR §15.1.4)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/parser/wml_parser/validation.rs#validate_wml13_document`, `engine-wasm/engine/src/parser/wml_parser/xml.rs#start_to_element`, `browser/frontend/src/app/navigation-state.ts#loadTransportUrl`
  - Tests: `engine-wasm/engine/src/engine_tests/wml_load_errors.rs::wml_205_rejects_an_invalid_form_of_every_declared_wml_element_atomically` (`cd engine-wasm/engine && cargo test wml_205_rejects_an_invalid_form_of_every_declared_wml_element_atomically`), `engine-wasm/engine/src/engine_tests/wml_load_errors.rs::wml_205_enforces_case_literal_length_and_cross_attribute_error_conditions` (`cd engine-wasm/engine && cargo test wml_205_enforces_case_literal_length_and_cross_attribute_error_conditions`)
  - Work items: `R0-01`, `R0-07`, `WML-306`
  - Assessment note: Strict WML 1.3 loads preserve XML case sensitivity, reject an invalid form of every declared element, enforce the specification-defined literal, length, table, task, event, variable, prologue, and structural error conditions, and publish deterministic diagnostics without replacing the active deck. Host fetch and destination access failures notify the user while preserving the invoking engine state, pending external intent, committed deck session, and history.
- **WML-C-17** — Unknown DTD handling
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §12.4 (SCR §15.1.4)
  - Assessment: `partial`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/parser/wml_parser/nodes.rs#map_inline_nodes_recursive`, `engine-wasm/engine/src/parser/wml_parser/xml.rs#classify_wml_doctype`
  - Tests: `engine-wasm/engine/src/parser/wml_parser/tests.rs::parses_mixed_inline_text_links_break_and_unknown_wrappers` (`cd engine-wasm/engine && cargo test parses_mixed_inline_text_links_break_and_unknown_wrappers`), `engine-wasm/engine/src/parser/wml_parser/tests.rs::wml_203_alternate_doctype_ignores_unknown_markup_and_preserves_known_content` (`cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_203_alternate_doctype_ignores_unknown_markup_and_preserves_known_content`)
  - Work items: `R0-01`, `R0-07`, `WML-203`, `WML-306`
  - Assessment note: Canonical WML 1.3 and alternate external DTD identities are classified without fetching a DTD; alternate-DTD unknown wrappers and attributes are ignored while recognized child content is retained. Strict prologue-presence enforcement, internal subsets, and full DTD validation remain open.
- **WML-C-18** — Inter-card navigation
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §12.5 (SCR §15.1.4)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#execute_card_task_action`
  - Tests: `engine-wasm/engine/src/engine_tests/actions_timers.rs::fixture_accept_go_trace_order_is_deterministic` (`cd engine-wasm/engine && cargo test fixture_accept_go_trace_order_is_deterministic`)
  - Work items: `R0-01`, `R0-02`, `WML-306`
  - Assessment note: WML-202/301/302/303/305 jointly provide direct evidence for access, newcontext, variables, go/prev/refresh ordering, fetched-deck fragment selection, timers, and rollback across every nested inter-card clause.
- **WML-C-21** — access
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §11.3.1 (SCR §15.1.5)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/parser/wml_parser/head.rs#parse_access`, `engine-wasm/engine/src/runtime/deck.rs#allows_referring_uri`, `browser/frontend/src/app/navigation-state.ts#loadTransportUrl`
  - Tests: `engine-wasm/engine/src/parser/wml_parser/tests.rs::wml_202_retains_access_and_ordered_meta_for_the_whole_deck` (`cd engine-wasm/engine && cargo test wml_202_retains_access_and_ordered_meta_for_the_whole_deck`), `engine-wasm/engine/src/engine_tests/wml_202_residual.rs::wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules` (`cd engine-wasm/engine && cargo test wml_202_access_policy_applies_defaults_components_relative_paths_and_url_case_rules`), `engine-wasm/engine/src/engine_tests/wml_306_policy.rs::wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable` (`cd engine-wasm/engine && cargo test wml_306_access_denial_is_atomic_and_unknown_dtd_content_remains_renderable`)
  - Work items: `C5-03`, `R0-01`, `R0-04`, `WML-306`
  - Assessment note: The access element is parsed and retained, its grammar and uniqueness are enforced, and the engine applies defaults, component-aware domain/path matching, relative-path resolution, and URL case rules against the host-supplied referring URI before committing a deck transition. WML-306 adds direct atomic-denial and safe host-presentation evidence; WML-304 separately owns go sendreferer request intent.
- **WML-C-29** — go
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §9.5.1 (SCR §15.1.5)
  - Assessment: `partial`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#wml_go_request_policy`, `engine-wasm/engine/src/parser/wml_parser/actions.rs#parse_go_request_xml`
  - Tests: `engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs::wml_304_get_intent_preserves_order_without_claiming_query_merge` (`cd engine-wasm/engine && cargo test wml_304_get_intent_preserves_order_without_claiming_query_merge`), `engine-wasm/engine/src/engine_tests/wml_304_request_intent.rs::wml_304_post_intent_carries_request_attributes_without_constructing_multipart` (`cd engine-wasm/engine && cargo test wml_304_post_intent_carries_request_attributes_without_constructing_multipart`)
  - Work items: `R0-01`, `R0-02`, `R0-06`, `WML-304`, `WML-306`
  - Assessment note: The parser and runtime publish a typed GET/POST request intent with ordered postfields, referer opt-in, no-cache, enctype, charset, and same-deck classification; wire construction, origin reload, and replay remain open.
- **WML-C-38** — prev
  - Actor/status/profile: `wml-user-agent`; `mandatory`; `required-by-class-c-client-mcf`
  - Spec: `WAP-191_104-WML` §9.5.2 (SCR §15.1.5)
  - Assessment: `implemented`; evidence `direct-test-linked`
  - Code: `engine-wasm/engine/src/engine_runtime_internal/navigation.rs#CardTaskAction::Prev`, `browser/frontend/src/app/navigation-state.ts#navigateBackWithFallback`
  - Tests: `engine-wasm/engine/src/engine_tests/actions_timers.rs::enter_accept_prev_action_navigates_back_when_history_exists` (`cd engine-wasm/engine && cargo test enter_accept_prev_action_navigates_back_when_history_exists`), `browser/frontend/src/app/navigation-state.history.test.ts::replays typed POST values when history back must refetch the prior deck` (`pnpm --dir browser/frontend test -- src/app/navigation-state.history.test.ts src/session-history.test.ts`)
  - Work items: `R0-01`, `R0-02`, `WML-304`, `WML-306`
  - Assessment note: Prev pops request-shaped card history, executes variable assignments and backward-entry behavior, and replays typed POST values when the prior deck must be fetched again.

## Direct normative obligations

### WML-301

- **WML-CL-CARD-ID-FRAGMENT** — Use a card id as its fragment-navigation anchor.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.5.2 (11.5.2 The Card Element)
  - Parents: `WML-C-25`, `WML-C-18`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-003`
  - Fixture: `WML-FX-CARD-ID-FRAGMENT` (`state-machine`, `implemented`)
- **WML-CL-CARD-TABLE-BOUNDARIES** — Insert table boundary line breaks unless the table is respectively the first or last significant card content.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.5.2 (11.5.2 The Card Element)
  - Parents: `WML-C-25`, `WML-C-46`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-CARD-TABLE-BOUNDARIES` (`rendering`, `implemented`)
- **WML-CL-CONTEXT-SINGLE-SCOPE** — Store WML runtime state in one browser-context scope.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.1 (10.1 The Browser Context)
  - Parents: `WML-C-10`
  - Requirements: `RQ-RMK-003`
  - Fixture: `WML-FX-CONTEXT-SINGLE-SCOPE` (`state-machine`, `implemented`)
- **WML-CL-CONTEXT-STATE-MEMBERS** — Keep variables, navigation history, and implementation-dependent session state in the browser context.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.1 (10.1 The Browser Context)
  - Parents: `WML-C-10`
  - Requirements: `RQ-RMK-003`
  - Fixture: `WML-FX-CONTEXT-STATE-MEMBERS` (`state-machine`, `implemented`)
- **WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT** — Establish a new browser context when navigation is initiated independently of the current content.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.4 (10.4 Context Restrictions)
  - Parents: `WML-C-13`
  - Requirements: `RQ-RMK-003`
  - Fixture: `WML-FX-EXTERNAL-NAVIGATION-NEW-CONTEXT` (`state-machine`, `implemented`)
- **WML-CL-EXTERNAL-NAVIGATION-OLD-CONTEXT** — The user agent may terminate the old context before establishing a context for external navigation.
  - Family: `wml`; force: `explicit-may`; level: `permitted`
  - Source: `WAP-191_104-WML` §10.4 (10.4 Context Restrictions)
  - Parents: `WML-C-13`
  - Requirements: `RQ-RMK-003`
  - Fixture: `WML-FX-EXTERNAL-NAVIGATION-OLD-CONTEXT` (`state-machine`, `implemented`)
- **WML-CL-GO-FRAGMENT-FALLBACK** — Choose the named card when a fragment matches; otherwise choose the first card in the fetched deck.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.1 (12.5.1 The Go Task)
  - Parents: `WML-C-18`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`
  - Fixture: `WML-FX-GO-FRAGMENT-FALLBACK` (`state-machine`, `implemented`)
- **WML-CL-GO-HISTORY-PUSH** — Push the destination request identity onto history after destination context initialization.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.1 (12.5.1 The Go Task)
  - Parents: `WML-C-07`, `WML-C-18`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-WAE-016`
  - Fixture: `WML-FX-GO-HISTORY-PUSH` (`state-machine`, `implemented`)
- **WML-CL-HISTORY-DUPLICATE-PUSH** — Push an entry for each explicit card access even when it duplicates the newest history entry.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.2 (9.2 History)
  - Parents: `WML-C-07`
  - Requirements: `RQ-RMK-003`, `RQ-WAE-016`
  - Fixture: `WML-FX-HISTORY-DUPLICATE-PUSH` (`state-machine`, `implemented`)
- **WML-CL-HISTORY-ENTRY-FIELDS** — Record the absolute card URL, request method, submitted fields, and request headers in each history entry.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.2 (9.2 History)
  - Parents: `WML-C-07`
  - Requirements: `RQ-RMK-003`, `RQ-WAE-016`
  - Fixture: `WML-FX-HISTORY-ENTRY-FIELDS` (`state-machine`, `implemented`)
- **WML-CL-HISTORY-EXCLUDES-CONTENT** — Do not store card content in history entries.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.2 (9.2 History)
  - Parents: `WML-C-07`
  - Requirements: `RQ-RMK-003`, `RQ-WAE-016`
  - Fixture: `WML-FX-HISTORY-EXCLUDES-CONTENT` (`state-machine`, `implemented`)
- **WML-CL-HISTORY-STACK-MODEL** — Maintain navigational history as an ordered stack of visited card request identities.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.2 (9.2 History)
  - Parents: `WML-C-07`
  - Requirements: `RQ-RMK-003`, `RQ-WAE-016`
  - Fixture: `WML-FX-HISTORY-STACK-MODEL` (`state-machine`, `implemented`)
- **WML-CL-NAVIGATION-REFERENCE-MODEL** — Implement inter-card traversal with behavior indistinguishable from the WML reference process.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5 (12.5 Reference Processing Behaviour - Inter-card Navigation)
  - Parents: `WML-C-18`
  - Requirements: `RQ-RMK-003`
  - Fixture: `WML-FX-NAVIGATION-REFERENCE-MODEL` (`state-machine`, `implemented`)

### WML-302

- **WML-CL-GO-ASSIGNMENT-ORDER** — Apply temporary setvar assignments before newcontext processing and history insertion.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.1 (12.5.1 The Go Task)
  - Parents: `WML-C-18`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`
  - Fixture: `WML-FX-GO-ASSIGNMENT-ORDER` (`state-machine`, `implemented`)
- **WML-CL-GO-SETVAR-SNAPSHOT** — For go, resolve setvar names and values into temporary assignments before fetching or changing context.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.1 (12.5.1 The Go Task)
  - Parents: `WML-C-18`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`
  - Fixture: `WML-FX-GO-SETVAR-SNAPSHOT` (`state-machine`, `implemented`)
- **WML-CL-GO-TARGET-RESOLUTION** — Resolve variables in the go target URI before fetching it.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.1 (12.5.1 The Go Task)
  - Parents: `WML-C-18`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`
  - Fixture: `WML-FX-GO-TARGET-RESOLUTION` (`transport-boundary`, `implemented`)
- **WML-CL-HISTORY-RESOLVES-VARIABLES** — Resolve variable references before request data is stored in history.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.2 (9.2 History)
  - Parents: `WML-C-07`
  - Requirements: `RQ-RMK-003`, `RQ-WAE-016`
  - Fixture: `WML-FX-HISTORY-RESOLVES-VARIABLES` (`state-machine`, `implemented`)
- **WML-CL-PREV-ASSIGNMENT-ORDER** — For prev, snapshot setvar values, pop history, locate the destination, and then apply assignments.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.2 (12.5.2 The Prev Task)
  - Parents: `WML-C-18`, `WML-C-38`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`
  - Fixture: `WML-FX-PREV-ASSIGNMENT-ORDER` (`state-machine`, `implemented`)
- **WML-CL-REFRESH-ASSIGNMENTS** — For refresh, resolve and apply every setvar assignment without changing cards.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.4 (12.5.4 The Refresh Task)
  - Parents: `WML-C-18`, `WML-C-42`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`
  - Fixture: `WML-FX-REFRESH-ASSIGNMENTS` (`state-machine`, `implemented`)
- **WML-CL-SETVAR-INVALID-NAME-IGNORED** — Ignore a setvar whose evaluated name is not a legal WML variable name.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.4 (9.4 The Setvar Element)
  - Parents: `WML-C-52`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-SETVAR-INVALID-NAME-IGNORED` (`runtime`, `implemented`)
- **WML-CL-SETVAR-STRUCTURE** — Require setvar name and value attributes and no child content.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §9.4 (9.4 The Setvar Element)
  - Parents: `WML-C-52`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-SETVAR-STRUCTURE` (`parser`, `implemented`)
- **WML-CL-SETVAR-TASK-SIDE-EFFECT** — Apply a valid setvar assignment only as a side effect of executing its containing task.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.4 (9.4 The Setvar Element)
  - Parents: `WML-C-52`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-SETVAR-TASK-SIDE-EFFECT` (`state-machine`, `implemented`)
- **WML-CL-VARIABLE-COMMIT-BEFORE-TASK** — Commit input and selection variables before invoking any task.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.4 (10.3.4 Setting Variables)
  - Parents: `WML-C-12`, `WML-C-33`, `WML-C-43`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-COMMIT-BEFORE-TASK` (`runtime`, `implemented`)
- **WML-CL-VARIABLE-CONVERSION-MODES** — Implement no-escape, URL-escape, and URL-unescape substitution conversions without mutating the stored value.
  - Family: `wml`; force: `table`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.1 (10.3.1 Variable Substitution)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-CONVERSION-MODES` (`runtime`, `implemented`)
- **WML-CL-VARIABLE-DEFAULT-CONVERSION** — Default HREF substitutions to URL escaping and other substitution contexts to no conversion.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.1 (10.3.1 Variable Substitution)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-DEFAULT-CONVERSION` (`runtime`, `implemented`)
- **WML-CL-VARIABLE-DOLLAR-ESCAPE** — Interpret two consecutive dollar signs as one literal dollar sign in WML text and CDATA values.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.3 (10.3.3 The Dollar-sign Character)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-DOLLAR-ESCAPE` (`parser`, `implemented`)
- **WML-CL-VARIABLE-NAME-GRAMMAR** — Enforce the WML variable-name grammar and case sensitivity.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.1 (10.3.1 Variable Substitution)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-NAME-GRAMMAR` (`parser`, `implemented`)
- **WML-CL-VARIABLE-PARSE-PRECEDENCE** — Parse XML and entity syntax before parsing WML variable-substitution syntax.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.2 (10.3.2 Parsing the Variable Substitution Syntax)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-PARSE-PRECEDENCE` (`parser`, `implemented`)
- **WML-CL-VARIABLE-REFERENCE-VALIDATION** — Reject a deck when a variable reference has invalid syntax or appears outside a permitted text or attribute location.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.5 (10.3.5 Validation)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-REFERENCE-VALIDATION` (`error-policy`, `implemented`)
- **WML-CL-VARIABLE-SET-DEFINITION** — Treat a variable as set only when its current value is known and non-empty.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3 (10.3 Variables)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-SET-DEFINITION` (`runtime`, `implemented`)
- **WML-CL-VARIABLE-SUBSTITUTION-LOCATIONS** — Allow runtime variable substitution in card text and in attributes typed as vdata or HREF, but not as markup.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.1 (10.3.1 Variable Substitution)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-SUBSTITUTION-LOCATIONS` (`parser`, `implemented`)
- **WML-CL-VARIABLE-TASK-SNAPSHOT** — Evaluate task setvar names and values before applying the resulting assignments to the browser context.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.4 (10.3.4 Setting Variables)
  - Parents: `WML-C-12`, `WML-C-18`, `WML-C-29`, `WML-C-38`, `WML-C-42`, `WML-C-52`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-TASK-SNAPSHOT` (`state-machine`, `implemented`)
- **WML-CL-VARIABLE-UNDEFINED-EMPTY** — Substitute an empty string for a referenced variable that is unset or undefined.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.1 (10.3.1 Variable Substitution)
  - Parents: `WML-C-12`
  - Requirements: `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-UNDEFINED-EMPTY` (`runtime`, `implemented`)

### WML-303

- **WML-CL-DO-ACTIVATION** — Execute the bound task when the user activates a presented do action.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-ACTIVATION` (`runtime`, `implemented`)
- **WML-CL-DO-EFFECTIVE-NAME** — Use the declared do name for binding identity and default a missing name to the type value.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`, `WML-C-08`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-EFFECTIVE-NAME` (`runtime`, `implemented`)
- **WML-CL-DO-INACTIVE-HIDDEN** — Do not expose an inactive do in a form the user can activate.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`, `WML-C-08`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-INACTIVE-HIDDEN` (`rendering`, `implemented`)
- **WML-CL-DO-OPTIONAL-PERMISSION** — The user agent may omit a do explicitly marked optional.
  - Family: `wml`; force: `explicit-may`; level: `permitted`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-OPTIONAL-PERMISSION` (`rendering`, `implemented`)
- **WML-CL-DO-STRUCTURE** — Parse do as exactly one task with a required type and optional label, name, optionality, and language metadata.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-STRUCTURE` (`parser`, `implemented`)
- **WML-CL-DO-TYPE-ACCEPTANCE** — Accept every do type and treat an unrecognized type as unknown when no specialized mapping exists.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-TYPE-ACCEPTANCE` (`runtime`, `implemented`)
- **WML-CL-GO-ENTRY-EVENT-PRECEDENCE** — Run a destination forward-entry handler before starting its timer or displaying the card, and stop the current traversal when it runs.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.1 (12.5.1 The Go Task)
  - Parents: `WML-C-09`, `WML-C-18`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-004`
  - Fixture: `WML-FX-GO-ENTRY-EVENT-PRECEDENCE` (`state-machine`, `implemented`)
- **WML-CL-GO-STRUCTURE** — Parse go with a required target, declared request attributes, and zero or more postfield or setvar children.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-STRUCTURE` (`parser`, `implemented`)
- **WML-CL-HISTORY-PREV-POP** — A prev task pops the current entry and returns to the prior history entry.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.2 (9.2 History)
  - Parents: `WML-C-07`, `WML-C-38`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-WAE-016`
  - Fixture: `WML-FX-HISTORY-PREV-POP` (`state-machine`, `implemented`)
- **WML-CL-INTRINSIC-ATTRIBUTE-EQUIVALENCE** — Treat intrinsic-event attributes as abbreviated onevent bindings with equivalent go-task behavior.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.10 (9.10 Intrinsic Events)
  - Parents: `WML-C-09`, `WML-C-39`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-004`
  - Fixture: `WML-FX-INTRINSIC-ATTRIBUTE-EQUIVALENCE` (`runtime`, `implemented`)
- **WML-CL-INTRINSIC-CARD-OVERRIDES-TEMPLATE** — Give a card-level forward-entry, backward-entry, or timer handler precedence over a template handler regardless of syntax.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.10.2 (9.10.2 Card/Deck Intrinsic Events)
  - Parents: `WML-C-08`, `WML-C-09`, `WML-C-47`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-004`
  - Fixture: `WML-FX-INTRINSIC-CARD-OVERRIDES-TEMPLATE` (`runtime`, `implemented`)
- **WML-CL-INTRINSIC-CONFLICT-ERROR** — Treat conflicting bindings for the same intrinsic event within one element as a deck error.
  - Family: `wml`; force: `error-condition`; level: `required`
  - Source: `WAP-191_104-WML` §9.10 (9.10 Intrinsic Events)
  - Parents: `WML-C-09`
  - Requirements: `RQ-RMK-004`
  - Fixture: `WML-FX-INTRINSIC-CONFLICT-ERROR` (`error-policy`, `implemented`)
- **WML-CL-INTRINSIC-EVENT-TYPES** — Recognize timer, forward-entry, backward-entry, and option-pick intrinsic events on their defined elements.
  - Family: `wml`; force: `table`; level: `required`
  - Source: `WAP-191_104-WML` §9.10 (9.10 Intrinsic Events)
  - Parents: `WML-C-09`
  - Requirements: `RQ-RMK-004`
  - Fixture: `WML-FX-INTRINSIC-EVENT-TYPES` (`runtime`, `implemented`)
- **WML-CL-INTRINSIC-ILLEGAL-PARENT** — Ignore onevent bindings whose event type is not legal for the immediately enclosing element.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.10.1 (9.10.1 The Onevent Element)
  - Parents: `WML-C-09`, `WML-C-39`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-004`
  - Fixture: `WML-FX-INTRINSIC-ILLEGAL-PARENT` (`error-policy`, `implemented`)
- **WML-CL-INTRINSIC-SCOPE** — Keep an intrinsic event binding active only within the element where it is declared.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.10 (9.10 Intrinsic Events)
  - Parents: `WML-C-09`, `WML-C-39`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-004`
  - Fixture: `WML-FX-INTRINSIC-SCOPE` (`runtime`, `implemented`)
- **WML-CL-NOOP-NO-PROCESSING** — Perform no processing for a noop task.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.3 (12.5.3 The Noop Task)
  - Parents: `WML-C-35`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-NOOP-NO-PROCESSING` (`runtime`, `implemented`)
- **WML-CL-ONEVENT-SINGLE-TASK** — Parse onevent as exactly one go, prev, noop, or refresh task associated with its immediately enclosing element.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §9.10.1 (9.10.1 The Onevent Element)
  - Parents: `WML-C-39`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-004`
  - Fixture: `WML-FX-ONEVENT-SINGLE-TASK` (`parser`, `implemented`)
- **WML-CL-PREV-EMPTY-HISTORY** — Stop prev processing without a transition when the history stack has no prior card.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.2 (12.5.2 The Prev Task)
  - Parents: `WML-C-18`, `WML-C-38`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`
  - Fixture: `WML-FX-PREV-EMPTY-HISTORY` (`state-machine`, `implemented`)
- **WML-CL-PREV-ENTRY-EVENT-PRECEDENCE** — Run a backward-entry handler before starting the restored card timer or displaying the card.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.2 (12.5.2 The Prev Task)
  - Parents: `WML-C-09`, `WML-C-18`, `WML-C-38`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-004`
  - Fixture: `WML-FX-PREV-ENTRY-EVENT-PRECEDENCE` (`state-machine`, `implemented`)
- **WML-CL-REFRESH-REDISPLAY** — Redisplay the current card from the updated variable state even when refresh contains no setvar elements.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.4 (12.5.4 The Refresh Task)
  - Parents: `WML-C-18`, `WML-C-42`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`
  - Fixture: `WML-FX-REFRESH-REDISPLAY` (`rendering`, `implemented`)
- **WML-CL-SHADOW-ACTIVE-SET** — Build the active event set from non-noop card bindings plus unshadowed non-noop template bindings.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.6 (9.6 Card/Deck Task Shadowing)
  - Parents: `WML-C-08`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-SHADOW-ACTIVE-SET` (`runtime`, `implemented`)
- **WML-CL-SHADOW-CARD-PRECEDENCE** — A matching card-level event binding overrides its template-level binding.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.6 (9.6 Card/Deck Task Shadowing)
  - Parents: `WML-C-08`, `WML-C-47`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-002`
  - Fixture: `WML-FX-SHADOW-CARD-PRECEDENCE` (`runtime`, `implemented`)
- **WML-CL-SHADOW-MATCHING** — Match card and template onevent bindings by event type and do bindings by effective name for shadowing.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.6 (9.6 Card/Deck Task Shadowing)
  - Parents: `WML-C-08`, `WML-C-47`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-002`
  - Fixture: `WML-FX-SHADOW-MATCHING` (`runtime`, `implemented`)
- **WML-CL-SHADOW-NOOP-MASK** — A noop binding masks its event without exposing an activatable action or producing task side effects.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.6 (9.6 Card/Deck Task Shadowing)
  - Parents: `WML-C-08`, `WML-C-35`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-SHADOW-NOOP-MASK` (`runtime`, `implemented`)
- **WML-CL-TASK-FAILURE-ATOMICITY** — On fetch or access-control failure, notify the user and preserve the invoking card, context, pending assignments, and event state.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.5 (12.5.5 Task Execution Failure)
  - Parents: `WML-C-16`, `WML-C-18`, `WML-C-29`, `WML-C-38`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-012`
  - Fixture: `WML-FX-TASK-FAILURE-ATOMICITY` (`error-policy`, `implemented`)
- **WML-CL-TEMPLATE-APPLIES-ALL-CARDS** — Apply each template event binding as though it were declared in every card unless shadowed.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.4 (11.4 The Template Element)
  - Parents: `WML-C-47`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-TEMPLATE-APPLIES-ALL-CARDS` (`runtime`, `implemented`)
- **WML-CL-TEMPLATE-STRUCTURE** — Parse template as zero or more do or onevent bindings plus card-event attributes.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §11.4 (11.4 The Template Element)
  - Parents: `WML-C-47`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-TEMPLATE-STRUCTURE` (`parser`, `implemented`)

### WML-304

- **WML-CL-GO-ACCEPT-CHARSET** — Encode submitted field names and values using an accepted charset, falling back to the deck encoding when unspecified or unknown.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-ACCEPT-CHARSET` (`transport-boundary`, `implemented`)
- **WML-CL-GO-ENCTYPE-SUPPORT** — Support form-urlencoded submission and the declared multipart form-data behavior for POST requests.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-ENCTYPE-SUPPORT` (`transport-boundary`, `implemented`)
- **WML-CL-GO-FORM-URLENCODING** — URI-escape form field names and values, join each name to its value with equals, and join pairs with ampersands.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`, `WML-C-37`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-FORM-URLENCODING` (`transport-boundary`, `implemented`)
- **WML-CL-GO-GET-QUERY-MERGE** — For form-urlencoded GET, combine encoded fields with any existing query into a valid query component.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-GET-QUERY-MERGE` (`transport-boundary`, `implemented`)
- **WML-CL-GO-INTERNAL-POSTFIELD-SUPPRESSION** — Ignore go postfields for same-deck card navigation unless no-cache is explicitly requested.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-INTERNAL-POSTFIELD-SUPPRESSION` (`runtime`, `implemented`)
- **WML-CL-GO-METHOD** — Map get and post method values to the corresponding request operation.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-METHOD` (`transport-boundary`, `implemented`)
- **WML-CL-GO-NO-CACHE** — For cache-control no-cache, reload from the origin and send the matching request cache-control value.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-NO-CACHE` (`transport-boundary`, `implemented`)
- **WML-CL-GO-PART-CONTENT-TYPE** — Provide a content type for each multipart part and a charset when its content is not US-ASCII.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-PART-CONTENT-TYPE` (`transport-boundary`, `planned`)
- **WML-CL-GO-POST-CONTENT-TYPE-CHARSET** — For form-urlencoded POST, send encoded fields in the body and include the submission charset in Content-Type.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-POST-CONTENT-TYPE-CHARSET` (`transport-boundary`, `implemented`)
- **WML-CL-GO-REFERER** — When sendreferer is true, transmit the smallest usable relative URI for the referring deck.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-14`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-011`
  - Fixture: `WML-FX-GO-REFERER` (`transport-boundary`, `implemented`)
- **WML-CL-GO-STRUCTURE** — Parse go with a required target, declared request attributes, and zero or more postfield or setvar children.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-STRUCTURE` (`parser`, `implemented`)
- **WML-CL-GO-SUBMISSION-ORDER** — Substitute variables, transcode fields, then serialize postfields in document order.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`, `WML-C-37`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-SUBMISSION-ORDER` (`transport-boundary`, `implemented`)
- **WML-CL-HISTORY-POST-REPLAY** — When a prior deck must be fetched again, replay the original POST data values associated with that history entry.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.2 (9.2 History)
  - Parents: `WML-C-07`, `WML-C-38`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-WAE-016`
  - Fixture: `WML-FX-HISTORY-POST-REPLAY` (`transport-boundary`, `implemented`)
- **WML-CL-POSTFIELD-REQUEST-PAIR** — Submit each postfield as a name/value pair using the encoding selected by the enclosing go task.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.3 (9.3 The Postfield Element)
  - Parents: `WML-C-37`, `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-POSTFIELD-REQUEST-PAIR` (`transport-boundary`, `implemented`)
- **WML-CL-POSTFIELD-STRUCTURE** — Require postfield name and value attributes and treat both as variable-bearing data.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §9.3 (9.3 The Postfield Element)
  - Parents: `WML-C-37`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-POSTFIELD-STRUCTURE` (`parser`, `implemented`)

### WML-305

- **WML-CL-GO-TIMER-THEN-DISPLAY** — If no forward-entry handler diverts processing, start the destination timer before rendering with current variables.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.1 (12.5.1 The Go Task)
  - Parents: `WML-C-18`, `WML-C-29`, `WML-C-48`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-004`
  - Fixture: `WML-FX-GO-TIMER-THEN-DISPLAY` (`state-machine`, `implemented`)
- **WML-CL-REFRESH-TIMER-RESTART** — Restart the current card timer during refresh after context updates.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.4 (12.5.4 The Refresh Task)
  - Parents: `WML-C-18`, `WML-C-42`, `WML-C-48`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-004`
  - Fixture: `WML-FX-REFRESH-TIMER-RESTART` (`state-machine`, `implemented`)
- **WML-CL-TIMER-EVENT-TRANSITION** — Dispatch ontimer when a running timer transitions from one to zero while its card remains active.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.7 (11.7 The Timer Element)
  - Parents: `WML-C-48`, `WML-C-09`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-TIMER-EVENT-TRANSITION` (`state-machine`, `implemented`)
- **WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE** — Initialize a named timer from its set variable, otherwise from value; always use value when no name is declared.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.7 (11.7 The Timer Element)
  - Parents: `WML-C-48`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-TIMER-INITIAL-VALUE-PRECEDENCE` (`state-machine`, `implemented`)
- **WML-CL-TIMER-INVALID-VALUE** — Ignore a timer whose resolved timeout is not a non-negative integer, with zero disabling it.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.7 (11.7 The Timer Element)
  - Parents: `WML-C-48`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-TIMER-INVALID-VALUE` (`runtime`, `implemented`)
- **WML-CL-TIMER-NAME-PERSISTENCE** — Store the current timer value in its name variable on card exit or expiration.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.7 (11.7 The Timer Element)
  - Parents: `WML-C-48`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-TIMER-NAME-PERSISTENCE` (`state-machine`, `implemented`)
- **WML-CL-TIMER-REFRESH-RESUME** — Treat refresh as timer exit and re-entry: stop and persist the current value, update context, then resume.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.7 (11.7 The Timer Element)
  - Parents: `WML-C-48`, `WML-C-42`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-002`, `RQ-RMK-004`
  - Fixture: `WML-FX-TIMER-REFRESH-RESUME` (`state-machine`, `implemented`)
- **WML-CL-TIMER-SINGLE-PER-CARD** — Reject a card containing more than one timer element.
  - Family: `wml`; force: `error-condition`; level: `required`
  - Source: `WAP-191_104-WML` §11.7 (11.7 The Timer Element)
  - Parents: `WML-C-48`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-TIMER-SINGLE-PER-CARD` (`parser`, `implemented`)
- **WML-CL-TIMER-START-STOP** — Initialize and start the timer on card entry and stop it on card exit.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.7 (11.7 The Timer Element)
  - Parents: `WML-C-48`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-TIMER-START-STOP` (`state-machine`, `implemented`)
- **WML-CL-TIMER-UNITS** — Interpret timer values in tenths of a second without requiring a particular scheduling resolution.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.7 (11.7 The Timer Element)
  - Parents: `WML-C-48`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-TIMER-UNITS` (`runtime`, `implemented`)

### WML-306

- **WML-CL-ACCESS-ABSENT-ALLOWS** — When no access element is present, allow referrals from any deck.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.3.1 (11.3.1 The Access Element)
  - Parents: `WML-C-21`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-ACCESS-ABSENT-ALLOWS` (`security-policy`, `implemented`)
- **WML-CL-ACCESS-COMPONENT-MATCH** — Match domains by complete suffix components and paths by complete prefix components.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.3.1 (11.3.1 The Access Element)
  - Parents: `WML-C-21`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-ACCESS-COMPONENT-MATCH` (`security-policy`, `implemented`)
- **WML-CL-ACCESS-DEFAULTS** — Default an omitted access domain to the current deck domain and an omitted path to slash.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.3.1 (11.3.1 The Access Element)
  - Parents: `WML-C-21`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-ACCESS-DEFAULTS` (`security-policy`, `implemented`)
- **WML-CL-ACCESS-REFERRER-MATCH** — Require a referring URI to satisfy each declared domain and path restriction.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.3.1 (11.3.1 The Access Element)
  - Parents: `WML-C-21`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-ACCESS-REFERRER-MATCH` (`security-policy`, `implemented`)
- **WML-CL-ACCESS-RELATIVE-PATH** — Resolve a relative access path to an absolute path before applying the prefix check.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.3.1 (11.3.1 The Access Element)
  - Parents: `WML-C-21`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-ACCESS-RELATIVE-PATH` (`security-policy`, `implemented`)
- **WML-CL-ACCESS-SINGLE-ELEMENT** — Reject a deck containing more than one access element.
  - Family: `wml`; force: `error-condition`; level: `required`
  - Source: `WAP-191_104-WML` §11.3.1 (11.3.1 The Access Element)
  - Parents: `WML-C-21`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-ACCESS-SINGLE-ELEMENT` (`parser`, `implemented`)
- **WML-CL-ACCESS-URL-CASE-RULES** — Apply URL component capitalization rules when evaluating domain and path restrictions.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.3.1 (11.3.1 The Access Element)
  - Parents: `WML-C-21`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-ACCESS-URL-CASE-RULES` (`security-policy`, `implemented`)
- **WML-CL-DECK-ACCESS-REQUIRED** — Enforce deck-level access control using access, sendreferer, domain, and path semantics.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.1 (12.1 Deck Access Control)
  - Parents: `WML-C-14`, `WML-C-21`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-011`
  - Fixture: `WML-FX-DECK-ACCESS-REQUIRED` (`security-policy`, `implemented`)
- **WML-CL-ERROR-ENFORCEMENT** — Enforce every error condition defined by WML.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.3 (12.3 Error Handling)
  - Parents: `WML-C-16`
  - Requirements: `RQ-RMK-012`
  - Fixture: `WML-FX-ERROR-ENFORCEMENT` (`error-policy`, `implemented`)
- **WML-CL-ERROR-NO-INTENT-INFERENCE** — Do not hide invalid decks by guessing author or origin-server intent.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.3 (12.3 Error Handling)
  - Parents: `WML-C-16`
  - Requirements: `RQ-RMK-012`
  - Fixture: `WML-FX-ERROR-NO-INTENT-INFERENCE` (`error-policy`, `implemented`)
- **WML-CL-GO-ACCESS-BEFORE-TRANSITION** — Evaluate destination-deck access control before committing the card transition.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.1 (12.5.1 The Go Task)
  - Parents: `WML-C-14`, `WML-C-18`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-011`
  - Fixture: `WML-FX-GO-ACCESS-BEFORE-TRANSITION` (`security-policy`, `implemented`)
- **WML-CL-LOW-MEMORY-CONTEXT-FAILURE-RESET** — If reclamation cannot satisfy the context limit, notify the user and reset the context to a documented predictable state.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Applicability: `optional-class-c-client-capability`
  - Source: `WAP-191_104-WML` §12.2.2 (12.2.2 Limited Browser Context Size)
  - Parents: `WML-C-15`
  - Requirements: None
  - Fixture: `WML-FX-LOW-MEMORY-CONTEXT-FAILURE-RESET` (`error-policy`, `implemented`)
- **WML-CL-LOW-MEMORY-CONTEXT-RECLAIM** — Before declaring browser-context memory exhaustion, reclaim cache and oldest history memory and retry the pending context update.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Applicability: `optional-class-c-client-capability`
  - Source: `WAP-191_104-WML` §12.2.2 (12.2.2 Limited Browser Context Size)
  - Parents: `WML-C-15`
  - Requirements: None
  - Fixture: `WML-FX-LOW-MEMORY-CONTEXT-RECLAIM` (`error-policy`, `implemented`)
- **WML-CL-LOW-MEMORY-HISTORY-LRU** — When a configured history limit is exhausted, delete the least-recently-used history information first.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Applicability: `optional-class-c-client-capability`
  - Source: `WAP-191_104-WML` §12.2.1 (12.2.1 Limited History)
  - Parents: `WML-C-15`
  - Requirements: None
  - Fixture: `WML-FX-LOW-MEMORY-HISTORY-LRU` (`state-machine`, `implemented`)
- **WML-CL-LOW-MEMORY-HISTORY-MINIMUM** — Provide a default history capacity of at least ten entries when the low-memory policy is enabled.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Applicability: `optional-class-c-client-capability`
  - Source: `WAP-191_104-WML` §12.2.1 (12.2.1 Limited History)
  - Parents: `WML-C-15`
  - Requirements: None
  - Fixture: `WML-FX-LOW-MEMORY-HISTORY-MINIMUM` (`state-machine`, `implemented`)
- **WML-CL-TASK-FAILURE-ATOMICITY** — On fetch or access-control failure, notify the user and preserve the invoking card, context, pending assignments, and event state.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §12.5.5 (12.5.5 Task Execution Failure)
  - Parents: `WML-C-16`, `WML-C-18`, `WML-C-29`, `WML-C-38`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-003`, `RQ-RMK-012`
  - Fixture: `WML-FX-TASK-FAILURE-ATOMICITY` (`error-policy`, `implemented`)
- **WML-CL-UNKNOWN-CONTENT-PRESERVED** — Continue rendering recognized content nested inside an unrecognized element.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-191_104-WML` §12.4 (12.4 Unknown DTD)
  - Parents: `WML-C-17`
  - Requirements: `RQ-RMK-009`
  - Fixture: `WML-FX-UNKNOWN-CONTENT-PRESERVED` (`rendering`, `implemented`)
- **WML-CL-UNKNOWN-MARKUP-IGNORED** — For an alternate DTD, ignore unrecognized element tags and attributes during presentation.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-191_104-WML` §12.4 (12.4 Unknown DTD)
  - Parents: `WML-C-17`
  - Requirements: `RQ-RMK-009`
  - Fixture: `WML-FX-UNKNOWN-MARKUP-IGNORED` (`parser`, `implemented`)

### WML-308

- **WML-CL-INPUT-EMPTY-COMMIT** — Accept an empty committed input only when the effective mask and emptyok rules allow it.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-EMPTY-COMMIT` (`runtime`, `implemented`)
- **WML-CL-INPUT-FORMAT-LITERALS** — Preserve escaped literal characters that form part of an accepted formatted input value.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-FORMAT-LITERALS` (`runtime`, `implemented`)
- **WML-CL-INPUT-INITIALIZATION** — Initialize each input from a valid existing name variable or a valid default value, then preload the control.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-INITIALIZATION` (`runtime`, `implemented`)
- **WML-CL-INPUT-INVALID-INITIAL-VALUE** — Unset an existing name value that violates the mask before attempting the declared default.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-INVALID-INITIAL-VALUE` (`runtime`, `implemented`)
- **WML-CL-INPUT-MASK-COMMIT** — At commit, accept only values conforming to the effective input mask.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-MASK-COMMIT` (`runtime`, `implemented`)
- **WML-CL-INPUT-MAXLENGTH** — Limit committed text to maxlength when that attribute is present.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-MAXLENGTH` (`runtime`, `implemented`)
- **WML-CL-INPUT-PASSWORD-DISPLAY** — Conceal the entered value when input type is password while preserving the actual variable value.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-PASSWORD-DISPLAY` (`rendering`, `implemented`)
- **WML-CL-INPUT-REJECTION-ATOMICITY** — On invalid input, notify the user, preserve the original variable value, and allow another entry attempt.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-REJECTION-ATOMICITY` (`runtime`, `implemented`)
- **WML-CL-INPUT-STRUCTURE** — Require an input variable name and constrain input attributes to the declared text-entry grammar.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-STRUCTURE` (`parser`, `implemented`)
- **WML-CL-OPTION-ONPICK-MULTI** — For multiple selection, dispatch onpick whenever the option is selected or deselected.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.2 (11.6.2.2 The Option Element)
  - Parents: `WML-C-41`, `WML-C-09`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-OPTION-ONPICK-MULTI` (`runtime`, `implemented`)
- **WML-CL-OPTION-ONPICK-SINGLE** — For single selection, dispatch onpick for the newly selected option but not for implicit deselection.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.2 (11.6.2.2 The Option Element)
  - Parents: `WML-C-41`, `WML-C-09`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-OPTION-ONPICK-SINGLE` (`runtime`, `implemented`)
- **WML-CL-OPTION-VALUE-EVALUATION** — Evaluate option value variable references before assigning the containing select name variable.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.2 (11.6.2.2 The Option Element)
  - Parents: `WML-C-41`, `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-OPTION-VALUE-EVALUATION` (`runtime`, `implemented`)
- **WML-CL-SELECT-DEFAULT-PRECEDENCE** — Choose initial selections in iname, ivalue, name, value, then single/multiple fallback order.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-DEFAULT-PRECEDENCE` (`runtime`, `implemented`)
- **WML-CL-SELECT-INDEX-VALIDATION** — Validate selection indices by removing non-integers, out-of-range entries, and duplicates.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-INDEX-VALIDATION` (`runtime`, `implemented`)
- **WML-CL-SELECT-INIT-ORDER** — Initialize input and select controls in document order when entering the card.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`, `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-INIT-ORDER` (`runtime`, `implemented`)
- **WML-CL-SELECT-MULTI-SERIALIZATION** — Serialize multiple results as semicolon-delimited lists with unique indices, duplicate non-empty values preserved, and no empty value entries.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-MULTI-SERIALIZATION` (`runtime`, `implemented`)
- **WML-CL-SELECT-NO-IMPLICIT-REFRESH** — Do not create display side effects from select-variable updates without an explicit refresh task.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-NO-IMPLICIT-REFRESH` (`rendering`, `implemented`)
- **WML-CL-SELECT-PRESELECTION** — Deselect all options and then select every positive validated default index.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-PRESELECTION` (`runtime`, `implemented`)
- **WML-CL-SELECT-SINGLE-MULTI-MODE** — Allow one selected option by default and multiple selections only when multiple is true.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-SINGLE-MULTI-MODE` (`runtime`, `implemented`)
- **WML-CL-SELECT-STRUCTURE** — Require one or more option or optgroup children in each select element.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-STRUCTURE` (`parser`, `implemented`)
- **WML-CL-SELECT-USER-UPDATE** — Update name and iname after user selection changes and again before every task invocation.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-USER-UPDATE` (`runtime`, `implemented`)
- **WML-CL-SELECT-VARIABLE-INITIALIZATION** — Initialize name from selected option values and iname from the validated selected indices.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-VARIABLE-INITIALIZATION` (`runtime`, `implemented`)
- **WML-CL-VARIABLE-COMMIT-BEFORE-TASK** — Commit input and selection variables before invoking any task.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.4 (10.3.4 Setting Variables)
  - Parents: `WML-C-12`, `WML-C-33`, `WML-C-43`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-COMMIT-BEFORE-TASK` (`runtime`, `implemented`)

### WML-309

- **WML-CL-DO-ACTIVE-VISIBILITY** — Make every active, non-optional do accessible for user activation.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-ACTIVE-VISIBILITY` (`rendering`, `implemented`)
- **WML-CL-DO-LABEL-BEST-EFFORT** — Make a best-effort to use a supplied do label when the interface action can be labeled.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-LABEL-BEST-EFFORT` (`rendering`, `implemented`)
- **WML-CL-DO-UNIQUE-WIDGET** — Expose an active non-optional do as a uniquely activatable interface action without assuming a particular physical widget.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.7 (9.7 The Do Element)
  - Parents: `WML-C-26`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-DO-UNIQUE-WIDGET` (`rendering`, `implemented`)

## Aggregate regression and delegate context

### WML-301

- **WAE-CL-WML-LANGUAGE-DELEGATE** — Process Wireless Markup Language using the effective selected WML 1.3 family ledger and its Class C user-agent requirements.
  - Family: `wae`; force: `implicit-must`; level: `required`
  - Source: `WAP-190-WAESpec` §5.1.5 (5.1.5 Wireless Markup Language)
  - Parents: `WAESpec-C-015`, `WAESpec-C-017`
  - Requirements: `RQ-RMK-001`, `RQ-WAE-002`, `RQ-WAE-016`, `RQ-WAE-017`
  - Fixture: `WAE-FX-WML-LANGUAGE-DELEGATE` (`runtime`, `planned`)
- **WAE-CL-WML-USER-AGENT-COMPOSITION** — Compose the WML and WMLScript requirements and guidelines into one WML user agent without moving network fetch behavior into the language runtime.
  - Family: `wae`; force: `implicit-must`; level: `required`
  - Source: `WAP-190-WAESpec` §5.1.7.2 (5.1.7.2 WML User Agent)
  - Parents: `WAESpec-C-017`
  - Requirements: `RQ-WAE-002`, `RQ-WAE-016`, `RQ-WAE-017`
  - Fixture: `WAE-FX-WML-USER-AGENT-COMPOSITION` (`runtime`, `planned`)
- **WAE-CL-WMLSCRIPT-LANGUAGE-DELEGATE** — Process WMLScript using the effective selected WMLScript family ledger and its Class C interpreter requirements.
  - Family: `wae`; force: `implicit-must`; level: `required`
  - Source: `WAP-190-WAESpec` §5.1.6 (5.1.6 WMLScript)
  - Parents: `WAESpec-C-016`, `WAESpec-C-017`
  - Requirements: `RQ-WAE-002`, `RQ-WAE-003`, `RQ-WAE-016`, `RQ-WAE-017`, `RQ-WMLS-001`
  - Fixture: `WAE-FX-WMLSCRIPT-LANGUAGE-DELEGATE` (`runtime`, `planned`)
- **WML-CL-CARD-COLLECTION** — Represent a WML deck as a collection containing at least one card.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.5 (11.5 The Card Element)
  - Parents: `WML-C-25`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-CARD-COLLECTION` (`parser`, `implemented`)
- **WML-CL-CARD-CONTENT-ORDER** — Preserve significant card element order during presentation.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-191_104-WML` §11.5.2 (11.5.2 The Card Element)
  - Parents: `WML-C-25`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-CARD-CONTENT-ORDER` (`rendering`, `implemented`)
- **WML-CL-CARD-CONTEXT-ATTRIBUTE** — Apply the card newcontext flag when entering through the defined go process.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.5.2 (11.5.2 The Card Element)
  - Parents: `WML-C-25`, `WML-C-11`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-003`
  - Fixture: `WML-FX-CARD-CONTEXT-ATTRIBUTE` (`state-machine`, `implemented`)
- **WML-CL-CARD-STRUCTURE** — Enforce card child ordering: event handlers, optional timer, then declared action or flow content.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §11.5.2 (11.5.2 The Card Element)
  - Parents: `WML-C-25`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-CARD-STRUCTURE` (`parser`, `implemented`)

## Explicit mapping gaps

- `WML-307` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.

Declared-family gaps:

- `WML-307` declares `wbxml`, `wml` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.
- `WML-308` declares `wae` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.

## Effective source order

- `wae`: `WAP-190-WAESpec` -> `WAP-190_101-WAESpec` -> `WAP-190_102-WAESpec` -> `WAP-190_103-WAESpec` -> `WAP-190_104-WAE-Spec`
- `wbxml`: `WAP-192-WBXML` -> `WAP-192_105-WBXML`
- `wml`: `WAP-191-WML` -> `WAP-191_102-WML` -> `WAP-191_104-WML` -> `WAP-191_105-WML`

## Source documents

- `WAP-190_101-WAESpec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190_101-WAESpec-20001213-a.pdf
- `WAP-190_102-WAESpec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190_102-WAESpec-20001213-a.pdf
- `WAP-190_103-WAESpec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190_103-WAESpec-20001213-a.pdf
- `WAP-190_104-WAE-Spec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190_104-WAE-Spec-20010731-a.pdf
- `WAP-190-WAESpec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190-WAESpec-20000329-a.pdf
- `WAP-191_102-WML`: Wireless Markup Language 1.3 — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-191_102-WML-20001213-a.pdf
- `WAP-191_104-WML`: Wireless Markup Language 1.3 — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-191_104-WML-20010718-a.pdf
- `WAP-191_105-WML`: Wireless Markup Language 1.3 — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-191_105-WML-20020212-a.pdf
- `WAP-191-WML`: Wireless Markup Language 1.3 — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-191-WML-20000219-a.pdf
- `WAP-192_105-WBXML`: Binary XML Content Format — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-192_105-WBXML-20011015-a.pdf
- `WAP-192-WBXML`: Binary XML Content Format — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-192-WBXML-20010725-a.pdf
- `WAP-215-ClassConform-20001213-a`: Class Conformance Requirements — https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf
- `WAP-236-WAESpec-20020207-a`: Wireless Application Environment Specification
