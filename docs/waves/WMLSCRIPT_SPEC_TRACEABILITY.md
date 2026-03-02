# Waves WMLScript Spec Traceability

Version: v0.1  
Status: Active implementation baseline (incremental conformance closure + docling rerun validation pass)

## Purpose

This document captures WMLScript requirements and acceptance criteria (AC) directly from the source specs so Waves can track implementation and test coverage against normative items.

## Source set reviewed (full pass)

- `spec-processing/source-material/WAP-193-WMLScript-20001025-a.pdf`
- `spec-processing/source-material/WAP-193_101-WMLScript-20010928-a.pdf`
- `spec-processing/source-material/WAP-194-WMLScriptLibraries-20000925-a.pdf`
- `spec-processing/source-material/WAP-194_103-WMLScriptLibraries-20020318-a.pdf`

## Normative precedence for Waves

1. Use `WAP-193_101` as the primary WMLScript core baseline (same core content, updated SCR formatting and split encoder/interpreter IDs).
2. Use `WAP-194` as the standard library baseline.
3. Apply `WAP-194_103` on top of `WAP-194` for immediate-refresh conformance clarification (section 11.7 / SCR addition).

## Compliance target and prioritization

- Target: achieve and maintain approximately `90-95%` practical WMLScript/WMLSL conformance for in-scope Waves runtime behavior.
- Strategy: close bedrock compliance gaps first, then broaden library/function coverage.
- Bedrock-first requirement groups:
  - `RQ-WMLS-001`, `RQ-WMLS-002`, `RQ-WMLS-003` (external callable model, pragmas, URL/script invocation ownership)
  - `RQ-WMLS-004`, `RQ-WMLS-005`, `RQ-WMLS-006` (function semantics, locals/initialization, conversion/type behavior)
  - `RQ-WMLS-008`, `RQ-WMLS-009`, `RQ-WMLS-010` (bytecode structure verification and trap model)
  - `RQ-WMLS-011` (WMLScript content-type routing/handoff)
- Full closure of optional/profile-gated items (`O`) remains explicitly staged behind mandatory (`M`) bedrock behavior.

## Current implementation posture

- Waves has active WaveScript/WMLScript runtime implementation in `engine-wasm/engine/src/wavescript/*`.
- Existing implementation is a conformance progression baseline, not yet full section `9/10/11` binary-format parity.
- Work-plan source of truth for closure sequencing:
  - `docs/waves/WORK_ITEMS.md` (`Phase W`, `Phase W1`)
  - `docs/waves/SPEC_TEST_COVERAGE.md`

## Requirement matrix

Legend:

- `M` = mandatory in spec conformance tables
- `O` = optional in spec conformance tables

### RQ-WMLS-001: External callable model

- Requirement:
  - Only `extern` functions are callable externally.
  - Compilation units used from WML/external calls must resolve function by URL + fragment function name.
- Spec references:
  - `WAP-193_101` 6.4.1, 6.4.2.2, 8.3.2, 8.3.4, 8.5
  - SCRs: `WMLS-S-031 (M)`, `WMLS-C-079 (M)`, `WMLS-C-080 (M)`, `WMLS-C-087 (M)`
- AC:
  - [ ] External call to non-`extern` function is rejected.
  - [ ] URL fragment resolution selects target function deterministically.
  - [ ] External call path enforces access control before execution.

### RQ-WMLS-002: Pragma handling and unit metadata

- Requirement:
  - Support `use url`, `use access`, and `use meta` pragma semantics per grammar and processing rules.
- Spec references:
  - `WAP-193_101` 6.7.1, 6.7.2, 6.7.3
  - SCRs: `WMLS-S-043 (M)`, `WMLS-S-044 (M)`, `WMLS-S-045 (M)`, `WMLS-C-087 (M)`
- AC:
  - [ ] `use url` name mapping works for external calls.
  - [ ] More than one access pragma is rejected as error.
  - [ ] Access domain/path matching follows suffix/prefix element rules.

### RQ-WMLS-003: URL handling for script invocation

- Requirement:
  - Implement WAE URL schemes, fragment anchor handling, relative URL resolution against current compilation unit base.
- Spec references:
  - `WAP-193_101` 8.3.1, 8.3.2, 8.3.6
  - SCRs: `WMLS-C-078 (M)`, `WMLS-C-079 (M)`, `WMLS-C-082 (M)`
- AC:
  - [ ] Relative URL unit references resolve to expected absolute URL.
  - [ ] Invalid URL references fail with deterministic non-fatal error mapping.

### RQ-WMLS-004: Function call and return semantics

- Requirement:
  - Exact arity matching, pass-by-value arguments, automatic empty-string return when function ends without explicit return.
- Spec references:
  - `WAP-193_101` 6.4.1, 6.4.2.1, 6.4.3, 8.4.1, 8.4.3
  - SCRs: `WMLS-S-030..033 (M)`, `WMLS-C-083..086 (M)`
- AC:
  - [ ] Wrong-arity calls fail deterministically.
  - [ ] Implicit return value is `""` with no undefined behavior.
  - [ ] Arguments appear in callee locals in declared order.

### RQ-WMLS-005: Variable indexing and initialization

- Requirement:
  - Allocate argument/local indexes exactly per spec and initialize locals to empty string when not explicitly initialized.
- Spec references:
  - `WAP-193_101` 8.4.2, 8.4.4
  - SCRs: `WMLS-S-047 (M)`, `WMLS-S-049 (M)`, `WMLS-C-084 (M)`, `WMLS-C-086 (M)`
- AC:
  - [ ] Index assignment for args/locals matches section 8.4.2 rules.
  - [ ] Uninitialized locals read as empty string.

### RQ-WMLS-006: Type system and conversion rules

- Requirement:
  - Enforce `Boolean`, `Integer`, `Float`, `String`, `Invalid` semantics and automatic conversion rules.
- Spec references:
  - `WAP-193_101` 6.8, 6.9, 6.10
  - SCRs: `WMLS-C-072 (M)`, `WMLS-C-073 (M)`, `WMLS-C-075 (M)`, `WMLS-C-076 (M)`, `WMLS-C-077 (M)`, `WMLS-C-071 (O)`, `WMLS-C-074 (O)`
- AC:
  - [ ] Conversion behavior matches per-type legal conversions.
  - [ ] Invalid-conversion cases return `invalid` consistently.
  - [ ] Floating-point optionality is configurable and testable.

### RQ-WMLS-007: Integer-only mode behavior

- Requirement:
  - Support integer-only behavior profile when float operations are unsupported.
- Spec references:
  - `WAP-193_101` 13
  - `WAP-194` 6.4
  - SCRs: `WMLS-C-112 (O)`, `WMLSSL-017 (O)`
- AC:
  - [ ] Float-related conversions/operations follow integer-only rules.
  - [ ] Float library calls return `invalid` in integer-only mode.
  - [ ] `Lang.float()` and `Lang.parseFloat()` behavior matches spec for integer-only mode.

### RQ-WMLS-008: Bytecode binary format support

- Requirement:
  - Decode and validate header, constant pool, pragma pool, function pool, and instruction stream structures.
- Spec references:
  - `WAP-193_101` 9.2..9.6, 10
  - SCRs: `WMLS-C-088..094 (M)`, `WMLS-C-095..106 (M)`
- AC:
  - [ ] Known-good `.wmlsc` fixtures decode to stable internal representation.
  - [ ] Unsupported/reserved types fail verification before execution.
  - [ ] Function boundaries and instruction boundaries are validated.

### RQ-WMLS-009: Bytecode verification gates

- Requirement:
  - Perform integrity checks and runtime validity checks per chapter 11.
- Spec references:
  - `WAP-193_101` 11.1, 11.2
  - SCRs: `WMLS-C-107 (M)`, `WMLS-C-108 (M)`
- AC:
  - [ ] Version/size/pool-count checks enforced.
  - [ ] Jump targets verified to instruction boundaries within function bounds.
  - [ ] Invalid local/constant/library/function indexes trap deterministically.

### RQ-WMLS-010: Error detection and handling model

- Requirement:
  - Runtime must distinguish and handle fatal/non-fatal errors per chapter 12 without process crash.
- Spec references:
  - `WAP-193_101` 12
  - SCRs: `WMLS-C-109 (M)`, `WMLS-C-110 (M)`, `WMLS-C-111 (M)`
- AC:
  - [ ] Non-fatal errors return defined error/invalid results where applicable.
  - [x] Fatal errors terminate current script invocation safely.
  - [x] Host remains alive and recoverable after script failure.
  - Note (`2026-03-02`): VM computational `TypeError` and `StackUnderflow` traps are now classified as non-fatal and returned as `invalid`; a regression test matrix now asserts explicit fatal/non-fatal trap class mappings. Broader chapter-12 non-fatal class coverage remains tracked under `W1-06`.

### RQ-WMLS-011: Content-type handling

- Requirement:
  - Recognize textual and compiled WMLScript content types.
- Spec references:
  - `WAP-193_101` 14
- AC:
  - [ ] `text/vnd.wap.wmlscript` and `application/vnd.wap.wmlscriptc` are routed to correct path.

### RQ-WMLS-012: Standard library compliance baseline

- Requirement:
  - Implement standard library behavior and error conventions from WMLSL.
- Spec references:
  - `WAP-194` 6.1, 6.2, 6.3
  - SCRs: `WMLSSL-014 (M)`, `WMLSSL-015 (M)`, `WMLSSL-016 (M)`
- AC:
  - [ ] Invalid args return `invalid` with no side effects unless explicitly documented otherwise.
  - [ ] Argument coercions follow WMLScript conversion rules.

### RQ-WMLS-013: Lang library coverage

- Requirement:
  - Support Lang library function set and IDs.
- Spec references:
  - `WAP-194` section 7, Appendix A/B
  - SCRs: `WMLSSL-018 (M)`, `WMLSSL-031..045 (M)`
- AC:
  - [ ] Unit tests cover each Lang function behavior and edge cases.

### RQ-WMLS-014: Float library coverage

- Requirement:
  - Support Float library function set where float mode is enabled.
- Spec references:
  - `WAP-194` section 8, Appendix A/B
  - SCRs: `WMLSSL-019 (M)`, `WMLSSL-046..054 (M)`, `WMLSSL-017 (O)`
- AC:
  - [ ] Unit tests cover each Float function in float-capable mode.
  - [ ] Integer-only mode returns `invalid` per section 6.4.

### RQ-WMLS-015: String library coverage

- Requirement:
  - Support String library function set and IDs.
- Spec references:
  - `WAP-194` section 9, Appendix A/B
  - SCRs: `WMLSSL-020 (M)`, `WMLSSL-055..070 (M)`
- AC:
  - [ ] Unit tests cover each String function including bounds and invalid inputs.

### RQ-WMLS-016: URL library coverage

- Requirement:
  - Support URL library function set and IDs.
- Spec references:
  - `WAP-194` section 10, Appendix A/B
  - SCRs: `WMLSSL-021 (M)`, `WMLSSL-071..084 (M)`
- AC:
  - [ ] Unit tests cover parse, resolve, escape/unescape, and load-string behavior.

### RQ-WMLS-017: WMLBrowser context contract

- Requirement:
  - WMLBrowser functions operate only with valid WML browser context; otherwise return `invalid`.
  - WMLBrowser accessors/mutators without required context must not mutate runtime state.
- Spec references:
  - `WAP-194` chapter 11 preface and 11.1..11.7
  - SCRs: `WMLSSL-022 (M)`, `WMLSSL-085..091 (M)`
- AC:
  - [ ] Hostless/no-context invocation returns `invalid`.
  - [ ] `getVar`/`setVar` validation follows WML naming/value constraints.

### RQ-WMLS-018: Deferred navigation semantics (`go`/`prev`)

- Requirement:
  - `go`/`prev` requests are deferred until control returns to browser.
  - Multiple calls override each other; last call wins.
  - `go("")` cancels pending go/prev requests.
  - Fatal abort cancels pending navigation request.
- Spec references:
  - `WAP-194` 11.3, 11.4
  - SCRs: `WMLSSL-087 (M)`, `WMLSSL-088 (M)`
- AC:
  - [ ] In single invocation, `go/go`, `go/prev`, `prev/go`, `prev/prev` produce last-call behavior.
  - [ ] `go("")` yields no navigation.
  - [ ] `Lang.abort()` clears pending navigation intent.

### RQ-WMLS-019: `newContext` and history/vars reset semantics

- Requirement:
  - `newContext` clears WML vars and navigation history except current card.
  - `newContext` does not override a go request; prev request has no effect.
- Spec references:
  - `WAP-194` 11.5
  - SCRs: `WMLSSL-089 (M)`
- AC:
  - [ ] Post-`newContext`, previous vars/history are cleared per spec.
  - [ ] Interaction with pending go/prev follows section 11.5 semantics.

### RQ-WMLS-020: `getCurrentCard` semantics

- Requirement:
  - Return smallest relative URL when same base applies, otherwise absolute URL.
  - Return `invalid` when no current card exists.
- Spec references:
  - `WAP-194` 11.6
  - SCRs: `WMLSSL-090 (M)`
- AC:
  - [ ] Relative/absolute return mode covered by fixtures.
  - [ ] No-current-card case returns `invalid`.

### RQ-WMLS-021: `refresh` semantics and immediate-refresh optionality

- Requirement:
  - If immediate refresh is supported, execute refresh steps without restarting suspended timer and block until completion.
  - If immediate refresh unsupported, return `invalid`; browser still refreshes when control returns to UA.
- Spec references:
  - `WAP-194` 11.7
  - `WAP-194_103` section 3.3 (`WMLBrowser.refresh` immediate refresh support SCR, status `O`)
  - SCRs: `WMLSSL-091 (M)` and `WMLSSL-C-095 (O, SIN clarification)`
- AC:
  - [ ] Immediate-refresh-supported mode returns `""` or non-empty failure string and updates current card.
  - [ ] Immediate-refresh-unsupported mode returns `invalid` and deferred card refresh still occurs on return.
  - [ ] Suspended timer is not restarted by `refresh`.

### RQ-WMLS-022: Dialogs library contract

- Requirement:
  - Support `prompt`, `confirm`, `alert` behavior and IDs.
- Spec references:
  - `WAP-194` chapter 12
  - SCRs: `WMLSSL-023 (M)`, `WMLSSL-092..094 (M)`
- AC:
  - [ ] Dialog calls are exposed through host boundary with deterministic return mapping.
  - [ ] UI interaction paths covered by integration tests in host harness.

## SCR tracking summary for Waves milestones

These groups should be tracked explicitly in tickets and tests:

1. WaveScript VM mandatory SCRs:
- `WMLS-C-069..111` (all `M`)
2. WMLScript optional SCRs to gate by feature flags:
- `WMLS-C-071`, `WMLS-C-074`, `WMLS-C-112`
3. WMLScript libraries mandatory SCRs:
- `WMLSSL-014..016`, `WMLSSL-018..094` (all `M` except integer-only/float optionality handling as specified)
4. WMLScript libraries optional SCRs:
- `WMLSSL-017 (O)`
- `WMLSSL-C-095 (O)` from `WAP-194_103`

## Implementation tracking rule

For each implementation ticket in `docs/waves/WORK_ITEMS.md`, include:

- `Spec`: list of section refs and SCR IDs touched
- `AC`: checklist copied or derived from the relevant `RQ-WMLS-*` entries above
- `Tests`: explicit fixture/test IDs mapped to the same spec refs
