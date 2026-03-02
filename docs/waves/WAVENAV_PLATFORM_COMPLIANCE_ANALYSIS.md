# WaveNav Platform Compliance Analysis (WAP UA Runtime)

Date: 2026-03-02  
Scope: canonical root-level `docs/source-material/` corpus plus in-repo backlog/work tracking.

## Implementation Requirements Matrix

| Req ID | Domain | Requirement Description | Source Document | Page | Normative Language | Plain-English Runtime Obligation | Suggested Engine Module Responsible | Complexity | Existing Work Item Mapping | Implementation Status | Spec Accuracy Check | Backlog Correction Recommendation |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|
| UA-RQ-001 | A | Deck/card model must include navigable card set (`wml -> card+`) with deterministic reference processing behavior. | `WAP-191_104-WML-20010718-a.pdf` | 67, 70 | MUST | Parser/runtime must reject deck without cards and execute inter-card traversal in spec-equivalent order. | `engine-wasm/parser`, `engine-wasm/runtime` | Medium | `A1-01` (`done`), `WML-R-001` | Partially Implemented | Backlog captures parse invariant, but under-specifies full traversal algorithm. | Extend `A1` acceptance to include 12.5 step-order parity fixtures (newcontext/timer/event order). |
| UA-RQ-002 | B/H | UA must implement history stack; each entry must record absolute URL, method, postfields, and request headers. | `WAP-191_104-WML-20010718-a.pdf` | 21 | MUST | History entries cannot be only card indices; they need request identity/state to support spec-correct back behavior. | `engine-wasm/runtime`, `browser/session-history` | High | `A2-03` (`done`), `WML-R-008`, `RQ-WAE-016` | Incorrect Implementation Suspected | Existing item says baseline done but implementation stores only card index stack. | Re-open `A2-03` scope or add P0 fix ticket for history-entry schema expansion. |
| UA-RQ-003 | B/L | `prev` must pop history and return user to previous card; pop semantics apply deterministically. | `WAP-191_104-WML-20010718-a.pdf` | 21, 25, 68 | MUST | Back navigation must be true `prev` semantics, not generic host back fallback only. | `engine-wasm/runtime/nav`, `browser` | Medium | `A2-03` (`done`), `RQ-WAE-017` (`partial`) | Partially Implemented | Current behavior pops internal stack but lacks full request-context restore semantics. | Add parity AC for method/postfield/header restoration on back. |
| UA-RQ-004 | D/J | For same-deck targets, UA must ignore `postfield` unless `cache-control="no-cache"`. | `WAP-191_104-WML-20010718-a.pdf` | 23 | MUST | Intra-deck `go` must not submit fields unless explicit no-cache reload path is requested. | `engine-wasm/task executor`, `transport-rust` | Medium | `WML-R-019` (`P2 planned`) | Not Implemented | Backlog defers forms; no guard for this mandatory behavior path. | Promote minimal `go/postfield` suppression semantics to P1. |
| UA-RQ-005 | J/F | `cache-control=no-cache` on `go` requires origin reload and corresponding HTTP header propagation. | `WAP-191_104-WML-20010718-a.pdf` | 23 | MUST | Task execution must force network reload and preserve cache-control intent in outbound request. | `engine-wasm` + `browser/contracts/transport.ts` + `transport-rust` | High | No direct work item | Not Implemented | Gap: no runtime field for `cache-control` task intent. | Add cross-layer contract ticket (engine task metadata -> transport request policy). |
| UA-RQ-006 | F/E | `sendreferer=true` requires referring deck URI; smallest relative URI when possible. | `WAP-191_104-WML-20010718-a.pdf` | 23 | MUST / SHALL | Runtime must emit referer policy metadata; transport/host must serialize it. | `engine-wasm`, `transport-rust` | Medium | No direct work item | Not Implemented | Not represented in active queue. | Add P1 request-metadata work item (`go` referer semantics). |
| UA-RQ-007 | L | UA must ignore illegal `onevent` type for enclosing element. | `WAP-191_104-WML-20010718-a.pdf` | 33 | MUST | Invalid intrinsic-event bindings cannot crash or execute; must be ignored deterministically. | `engine-wasm/parser/runtime` | Low | `WML-R-013` (planned), parser partial behavior | Partially Implemented | Parser currently only extracts `onenterforward`; behavior for full intrinsic set not covered. | Expand parser event matrix and illegal-event ignore tests. |
| UA-RQ-008 | L/H | Inter-card traversal process is normative and must be indistinguishable from reference model. | `WAP-191_104-WML-20010718-a.pdf` | 67-68 | MUST | Execute `go`/`prev`/`refresh` in mandated step order (setvar substitution, access, destination, history, events, timer, render). | `engine-wasm/task runtime` | High | `B2`, `B3`, `B4` (`planned`) | Not Implemented | Existing phased plan defers core mandatory process edges. | Introduce P0 conformance fixture harness for 12.5 step pipeline. |
| UA-RQ-009 | I | On task execution failure, UA must notify user and preserve invoking card/context (no partial state mutation). | `WAP-191_104-WML-20010718-a.pdf` | 68 | MUST | Failures must be surfaced to UI and rollback pending state/event effects. | `engine-wasm/error model`, `browser UI` | Medium | `Q1` error taxonomy (`planned`) | Partially Implemented | Errors bubble as strings; no explicit rollback/error class contract to host. | Add structured task-failure error code + rollback assertion tests. |
| UA-RQ-010 | D/H | Input commit must enforce mask validity; invalid input must not commit and must notify user. | `WAP-191_104-WML-20010718-a.pdf` | 52 | MUST | Form editor must validate and block invalid commit without mutating backing variable. | `engine-wasm/forms/input` | High | `C1` (`planned`) | Not Implemented | Correctly planned but currently out of active scope despite mandatory UA behavior in WML mode. | Split minimal `input` conformance subset into earlier phase. |
| UA-RQ-011 | D/G | Invalid masks ignored; UA must support ASCII graphic chars at minimum. | `WAP-191_104-WML-20010718-a.pdf` | 53 | MUST | Validation engine must tolerate bad masks and enforce baseline char support. | `engine-wasm/forms` | Medium | `C1` (`planned`) | Not Implemented | Edge-case behavior absent from backlog AC text. | Add explicit mask-failure + ASCII baseline AC to C1. |
| UA-RQ-012 | L/J | Timer lifecycle: start on entry, stop on exit, ontimer dispatch; invalid timeout ignored. | `WAP-191_104-WML-20010718-a.pdf` | 56-57 | MUST | Card timer must be runtime-owned with deterministic scheduling semantics tied to card lifecycle. | `engine-wasm/runtime/events` + host timer adapter | High | `B4` (`planned`), `W0-05` (`in-progress`, script timers only) | Partially Implemented | Current timer plumbing is script-hostcall effects, not WML `<timer>` lifecycle semantics. | Add dedicated WML timer execution ticket separate from script timer hostcalls. |
| UA-RQ-013 | A/I | Unknown/alternate DTD handling: render as if unknown tags absent; content inside unknown elements should render. | `WAP-191_104-WML-20010718-a.pdf` | 67 | SHOULD / SHOULD | Parser must degrade gracefully and preserve textual content through unknown wrappers. | `engine-wasm/parser` | Medium | `A1-01`, `WML-R-020` | Partially Implemented | Unknown tags are skipped; content-preservation guarantees are not comprehensively tested. | Add unknown-wrapper content-preservation regression fixtures. |
| UA-RQ-014 | G | Tokenisation must validate variable reference syntax in `%vdata`/`%HREF`. | `WAP-191_104-WML-20010718-a.pdf` | 78 | MUST | Encoding pipeline (gateway/tooling) must reject malformed variable references before runtime. | `transport-rust` / gateway boundary | Medium | `RQ-RMK-007` docs only | Planned | Requirement exists in docs but not mapped to executable checks. | Add transport-side tokenisation validation tests or explicit delegated-gateway contract AC. |
| UA-RQ-015 | E/F | UA must use MIME media type as component of content data-type determination. | `WAP-236-WAESpec-20020207-a.pdf` | 21 | MUST | Load path must route by content type, not URL extension heuristics. | `transport-rust`, `browser host` | Low | `T0-02` (`done`), `RQ-WAE-001` | Implemented | Mapping is accurate and implemented in normalization contract. | None. |
| UA-RQ-016 | H/E | WML context (history + vars) must be maintained across XHTMLMP/WML navigation as single UA semantics. | `WAP-236-WAESpec-20020207-a.pdf` | 23 | MUST | If mixed-language mode exists, state continuity must remain intact. | `browser/session-state`, `engine-wasm` | High | `RQ-WAE-002` traceability only | Not Implemented | No active item establishes cross-language state continuity policy/tests. | Add explicit deferred/disabled mode flag or implement continuity contract. |
| UA-RQ-017 | C/G | UA must support WMLScript + standard libs (text and/or bytecode forms). | `WAP-236-WAESpec-20020207-a.pdf` | 25, 44 | MUST | Engine must expose conformant WMLScript execution mode and stdlib surface (or declare non-conformant mode). | `engine-wasm/wavescript` | High | `W0-01..W0-05` | Partially Implemented | Work exists; backlog status overstates conformance for verification/stdlib breadth. | Reclassify current WaveScript as subset profile until full RQ-WMLS coverage lands. |
| UA-RQ-018 | J/F | UA must support WAP caching model. | `WAP-236-WAESpec-20020207-a.pdf` | 46 | MUST | Fetch path needs deterministic cache policy/invalidation semantics for decks/scripts/media. | `transport-rust`, `browser` | High | No concrete active ticket | Not Implemented | Identified in traceability but no executable backlog item. | Add P0/P1 cache policy ticket with invalidation triggers. |
| UA-RQ-019 | F | Minimum URI length handling (1024 octets) and HTTP/HTTPS routing profile requirements. | `WAP-236-WAESpec-20020207-a.pdf` | 46 | MUST | Parser/transport must accept and forward 1024-octet URIs with deterministic failure beyond bounds. | `transport-rust` | Medium | `RQ-WAE-010` in docs; no explicit test item | Partially Implemented | Not explicitly asserted in tests/backlog acceptance. | Add boundary URI fixture tests and explicit error mapping. |
| UA-RQ-020 | G/F | UA/proxy must support UTF-8 and UTF-16 and RFC3023 character-encoding treatment for XML content. | `WAP-236-WAESpec-20020207-a.pdf` | 36, 47, 50 | MUST | Decode path must correctly process UTF-8/UTF-16 and emit deterministic encoding errors. | `transport-rust`, `engine-wasm input boundary` | Medium | `RQ-WAE-012` traced; tests marked planned | Partially Implemented | Coverage matrix still shows missing deterministic encoding-path tests. | Add encoding conformance fixture pack (UTF-16, invalid BOM, mismatched charset). |
| UA-RQ-021 | E/F | UA capability advertising must use Accept/Accept-Charset/Accept-Encoding/Accept-Language headers. | `WAP-236-WAESpec-20020207-a.pdf` | 37 | MUST | Transport requests from UA profile must include capability headers when advertising enabled. | `transport-rust`, `browser host` | Medium | `RQ-WAE-013` traced only | Not Implemented | No evidence of outbound capability header policy in active implementation tickets. | Add feature-gated UA header emission policy and tests. |
| UA-RQ-022 | E/B/L | BACK key must always be available; BACK pop; WML1 BACK executes `prev`; `do type=prev` first in doc-order overrides. | `WAP-236-WAESpec-20020207-a.pdf` | 42, 48 | MUST / MUST / MUST | Host UI + runtime action resolution must preserve hard BACK semantics and WML override precedence. | `browser frontend`, `engine-wasm parser/task resolver` | High | `M0-03` (`done`), `RQ-WAE-017` partial | Partially Implemented | Hybrid back exists, but `do type=prev` override precedence across full task model is not complete. | Add explicit `BACK` precedence conformance tests in browser + engine. |
| UA-RQ-023 | C/G | Textual WMLScript must be compiled to bytecode before interpreter execution. | `WAP-193_101-WMLScript-20010928-a.pdf` | 69 | MUST | Script ingestion path must either compile text->bytecode or reject unsupported text form deterministically. | `transport/gateway` + `engine-wasm` | Medium | `W0-02` (`done`, skeleton only) | Partially Implemented | Bytecode execution exists; text compilation path and mode negotiation not implemented. | Add explicit text-form policy and compile/delegate behavior ticket. |
| UA-RQ-024 | C/L | External-call semantics: only `extern` functions externally callable; access checks before call; URL fragment parsing rules apply. | `WAP-193_101-WMLScript-20010928-a.pdf` | 32-33, 41, 73, 75 | MUST | Invocation resolver must enforce external visibility, access-control pragma, and strict call syntax/arity. | `engine-wasm/wavescript loader+resolver` | High | `W0-01`, `W0-04` | Partially Implemented | Existing script href parsing is simplified and does not enforce pragma/access model. | Add call-resolution gate with `use url/access` metadata validation. |
| UA-RQ-025 | G | Bytecode verification and structural validity checks must run before execution. | `WAP-193_101-WMLScript-20010928-a.pdf` | 121, 136 | MUST | Decoder must verify header/pools/index bounds/jump targets prior to VM run. | `engine-wasm/wavescript/decoder` | High | `W0-02` (`done`) | Incorrect Implementation Suspected | `W0-02` marked done but currently checks only empty/size bounds. | Re-open `W0-02` as baseline-only; add `W0-02b` verification-gates implementation. |
| UA-RQ-026 | I | Fatal errors abort current invocation and signal caller; non-fatal computational errors yield `invalid` value semantics. | `WAP-193_101-WMLScript-20010928-a.pdf` | 121-124, 136 | MUST | VM must map fatal/non-fatal taxonomy deterministically and preserve host liveness. | `engine-wasm/wavescript/vm` | High | `W0-03` (`done`) | Partially Implemented | Trap model exists but spec-complete fatal/non-fatal categories are not implemented. | Add explicit error-class matrix and conformance tests per chapter 12. |
| UA-RQ-027 | C/H/J | WMLBrowser `go/prev` deferred semantics: last call wins; `go("")` cancels pending nav; fatal abort cancels pending nav. | `WAP-194-WMLScriptLibraries-20000925-a.pdf` | 45-46 | MUST | Runtime must queue nav intent until script return and enforce cancellation rules. | `engine-wasm/runtime/events`, `wavescript stdlib` | Medium | `W0-04` (`done`) | Implemented | This specific subset is well reflected and tested. | None. |
| UA-RQ-028 | C/H | `newContext()` must clear vars/history except current card; prev has no effect; go unaffected. | `WAP-194-WMLScriptLibraries-20000925-a.pdf` | 47 | MUST | WMLBrowser stdlib must expose and execute context-reset semantics exactly. | `wavescript/stdlib/wmlbrowser` + runtime context | High | `W0-04` (`done`, mapped to `RQ-WMLS-019`) | Incorrect Implementation Suspected | `W0-04` status says done, but `newContext` API/behavior is absent in implementation. | Correct `W0-04` status to partial and add explicit `newContext` implementation item. |
| UA-RQ-029 | C/B | `getCurrentCard()` must return smallest relative URL when same base; absolute otherwise; invalid if no current card. | `WAP-194-WMLScriptLibraries-20000925-a.pdf` | 47 | MUST | Script stdlib must expose current-card URI with base-aware formatting. | `wavescript/stdlib/wmlbrowser`, runtime URL model | Medium | `W0-04` (`done`, mapped to `RQ-WMLS-020`) | Incorrect Implementation Suspected | API not present in hostcall function table. | Add `getCurrentCard` hostcall and fixture tests; adjust backlog status. |
| UA-RQ-030 | C/J | Immediate `WMLBrowser.refresh` support is optional and must be feature-gated. | `WAP-194_103-WMLScriptLibraries-20020318-a.pdf` | 5 | OPTIONAL (O) | Refresh immediate mode should be explicit capability flag; deferred baseline is acceptable. | `wavescript stdlib`, runtime capabilities | Low | `W0-01` policy note, `W0-05` in progress | Planned | Backlog stance matches spec optionality. | Keep as feature gate with explicit capability reporting. |
| UA-RQ-031 | G | WBXML tokenisation must convert XML markup to tokens; remove comments/XML declaration/doctype; preserve non-tokenizer PI; treat text tokens as CDATA. | `WAP-192-WBXML-20010725-a.pdf` | 19 | MUST | Decode/encode boundary must preserve WBXML semantics exactly before handing XML/WML upward. | `transport-rust` / gateway decoder | High | `T0-02` boundary ticket | Partially Implemented | Current boundary owns decode, but conformance-to-tokenisation semantics is not fully asserted. | Add WBXML conformance fixtures targeting section 6.1 rules. |
| UA-RQ-032 | G/F | MIME type must associate WBXML token values; decoder must support both binary token and literal forms for tags/attrs/values. | `WAP-192-WBXML-20010725-a.pdf` | 20-21, 30 | MUST | Content negotiation and decoder must handle mixed token/literal streams across versions. | `transport-rust` decoder integration | Medium | `RQ-RMK-007`, `T0-02` | Planned | Requirement is documented but test inventory incomplete. | Add decoder compatibility tests for binary vs literal token paths. |

## Runtime Compliance GAP Report

### Critical P0 compliance gaps

1. History model is structurally non-compliant with WML/WAE requirements (`UA-RQ-002`, `UA-RQ-003`).
2. WML task execution semantics (go/prev/refresh pipeline, failure rollback, cache-control) are incomplete (`UA-RQ-004`, `UA-RQ-005`, `UA-RQ-008`, `UA-RQ-009`).
3. WMLScript backlog marks verification/context APIs as done while implementation is subset only (`UA-RQ-025`, `UA-RQ-028`, `UA-RQ-029`).
4. WAP caching model and invalidation behavior is not implemented (`UA-RQ-018`).

### High-impact P1 gaps

1. Form/input constraints and mask semantics are absent (`UA-RQ-010`, `UA-RQ-011`).
2. WML timer lifecycle (`<timer>`) is distinct from script timer hostcalls and is missing (`UA-RQ-012`).
3. Capability headers and URI boundary/charset conformance lack strong tests (`UA-RQ-019`, `UA-RQ-020`, `UA-RQ-021`).
4. WMLScript external-call and access-control semantics are incomplete (`UA-RQ-024`).

### Already strong/low-gap areas

1. MIME-based content routing boundary is in place (`UA-RQ-015`).
2. Deferred script navigation intent (`go/prev` last-call-wins) is implemented (`UA-RQ-027`).
3. Unknown-tag non-crash robustness exists as baseline, but content-preservation coverage should expand (`UA-RQ-013`).

## Backlog Validation + Accuracy Report

### Accurate backlog mappings

1. `A1-01/A2-01/A2-02/A3-*` correctly capture parser/navigation/render determinism baseline.
2. `T0-02` correctly models WBXML decode ownership boundary (`engine` should not decode WBXML).
3. `W0-01` architecture constraints (VM in engine, host side-effects only) are aligned with spec intent.

### Inaccurate or over-claimed backlog items

1. `W0-02` marked `done` against `RQ-WMLS-009` (verification gates), but decoder performs only empty/size checks.
2. `W0-04` marked `done` against `RQ-WMLS-019` (`newContext`) and `RQ-WMLS-020` (`getCurrentCard`), but these functions are absent.
3. `W0-03` claims broad `RQ-WMLS-006` type/conversion semantics done; VM is still a minimal opcode subset and does not implement full conversion/error rules.
4. `docs/wml-engine/ticket-plan.md` still frames WMLScript as deferred Phase D, while `docs/waves/WORK_ITEMS.md` and code have active W0 execution.
5. `A2-03` “history baseline done” is accurate only for MVP UX, not for standards-compliant history entry semantics.

## Required Work Items Backlog (Missing Only)

1. **P0 - Spec-Complete History Entry Model**
- Description: Replace index-only history with entry records containing absolute URL, method, postfields snapshot, request headers, and variable-substitution-resolved fields.
- Affected Engine Subsystem: `engine-wasm/runtime`, `browser/frontend/session-history`, `browser/contracts/transport.ts`
- Spec Source Reference: `WAP-191_104` p21; `WAP-236` p41-42
- Priority: `P0`

2. **P0 - WML Inter-card Task Pipeline Conformance (12.5)**
- Description: Implement spec-ordered `go/prev/refresh` execution pipeline including setvar substitution timing, newcontext processing, intrinsic-event hooks, timer start, and deterministic rollback on failure.
- Affected Engine Subsystem: `engine-wasm/task runtime`, parser action model
- Spec Source Reference: `WAP-191_104` p67-68
- Priority: `P0`

3. **P0 - WMLScript Verification Gates**
- Description: Add bytecode structural verification (header, pools, bounds, jump targets, indexes) before VM execution.
- Affected Engine Subsystem: `engine-wasm/engine/src/wavescript/decoder.rs`
- Spec Source Reference: `WAP-193_101` p121, p136 (`WMLS-C-107`, `WMLS-C-108`)
- Priority: `P0`

4. **P0 - Correct WMLBrowser Context APIs (`newContext`, `getCurrentCard`)**
- Description: Implement missing stdlib functions and exact behavior for context reset and current-card URL derivation.
- Affected Engine Subsystem: `engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs`, runtime URL/context state
- Spec Source Reference: `WAP-194` p47
- Priority: `P0`

5. **P1 - Cache-Control and Deck Reload Semantics**
- Description: Support `cache-control=no-cache` task metadata propagation and origin reload behavior, including intra-deck postfield suppression rules.
- Affected Engine Subsystem: `engine-wasm` action model + `transport-rust` request pipeline
- Spec Source Reference: `WAP-191_104` p23; `WAP-236` p46 (`WAESpec-HTS-C-004`)
- Priority: `P1`

6. **P1 - WML Input/Form Constraint Engine (Minimum Conformance Subset)**
- Description: Add input mask enforcement, commit blocking, initialization order, and invalid-mask ignore behavior.
- Affected Engine Subsystem: `engine-wasm/forms`
- Spec Source Reference: `WAP-191_104` p52-53
- Priority: `P1`

7. **P1 - WML `<timer>` Lifecycle Runtime**
- Description: Implement card timer initialization/start/stop/resume and ontimer dispatch independent of script-host timer calls.
- Affected Engine Subsystem: `engine-wasm/runtime/events`
- Spec Source Reference: `WAP-191_104` p56-57
- Priority: `P1`

8. **P1 - WMLScript External Access-Control Semantics**
- Description: Enforce `extern` visibility and `use access` domain/path checks for external function invocation.
- Affected Engine Subsystem: `engine-wasm/wavescript invocation resolver`
- Spec Source Reference: `WAP-193_101` p32-33, p41, p75
- Priority: `P1`

9. **P1 - UA Capability Header Emission + Validation**
- Description: Add profile-driven Accept header emission (`Accept`, `Accept-Charset`, `Accept-Encoding`, `Accept-Language`) and negotiation tests.
- Affected Engine Subsystem: `browser host`, `transport-rust`
- Spec Source Reference: `WAP-236` p37
- Priority: `P1`

10. **P2 - WBXML Token/Literal Compatibility Fixture Suite**
- Description: Add decoder conformance tests for literal-vs-token paths and section 6.1 tokenization semantics.
- Affected Engine Subsystem: `transport-rust`
- Spec Source Reference: `WAP-192` p19-21, p30
- Priority: `P2`

## Backlog Correction Recommendations

1. Keep `W0-02` as historical `done` and track verification scope via additive follow-up ticket `W0-06`.
2. Keep `W0-04` as historical `done` and close missing `newContext`/`getCurrentCard` semantics via additive follow-up ticket `W0-07`.
3. Keep `W0-03` as historical `done` and track broader conversion/access-control completeness via additive follow-up tickets (`W0-08` and subsequent conformance tickets).
4. Update `docs/wml-engine/ticket-plan.md` to remove stale “WMLScript deferred” statement or explicitly scope it to non-W0 engine plan only.
5. Reclassify `A2-03` as “MVP history baseline done” and add standards-compliance follow-up for mandatory entry fields.
6. Add explicit AC in `C1/C2` for page-52/53 mask/commit semantics and page-23 postfield/cache-control behavior.

## Spec Coverage Confidence Summary

- **High confidence**: WML navigation/history core obligations, WAE BACK/history obligations, WMLScript deferred-nav semantics (`go/prev`), and decoder/VM status mismatch findings.
- **Medium confidence**: Transport-adjacent capability header and caching assertions (traceability exists, implementation evidence is partial and distributed).
- **Residual risk**: Some normative obligations are represented through conformance tables/SCR references rather than complete algorithm text in current backlog; additional fixture-level verification is still required for full conformance evidence.

## Current Status Snapshot (2026-03-02)

### Overall project posture

- Platform is in a strong pre-alpha foundation state: deterministic deck loading/navigation loop exists, WBXML decode boundary ownership is explicit, and WaveScript runtime lane is active.
- Compliance work is now concentrated in defined closure lanes instead of broad unknowns:
  - WML full-stack closure (`R0-*`)
  - WMLScript bedrock closure (`W0-06..08`, `W1-01..05`)
  - Transport bedrock closure (`T0-08..11`)

### Near-sprint feasibility (few working days)

- Achievable in one focused sprint:
  - move WMLScript and transport lanes from broad `partial/planned` to materially improved conformance posture by landing early bedrock tickets and fixture packs.
- Not achievable in one sprint:
  - full protocol-complete WAP transport replacement with broad bearer/profile parity.

### Sprint-ready bedrock slice (implementation ticket cut)

- `W1-02`: bytecode structural verification gates.
- `W1-06`: fatal/non-fatal script error taxonomy and `invalid` semantics.
- `R0-03`: history entry schema + context fidelity closure.
- `R0-06`: runtime-to-transport request-policy plumbing (`cache-control`, `sendreferer`, postfield context).
- `T0-15`: WAP caching baseline and invalidation semantics.
- `R0-09`: BACK hard-availability + `do type=prev` precedence behavior.

Expected sprint outcome:

- High-priority misses for `UA-RQ-002/003/005/018/026` materially reduced with test-backed acceptance criteria.

### Remaining architecture-level unresolved item

- The primary unresolved cross-cutting decision is networking target profile and migration gates:
  - current behavior: gateway-bridged HTTP path with WAP URL translation and WBXML normalization
  - target behavior: deeper in-process WDP/WTP/WSP protocol semantics
- This is now explicitly tracked as `T0-14` in `docs/waves/WORK_ITEMS.md` and linked in coverage/test planning docs.

### Rerun delta check (remaining 35-file wave)

- Net-new high-impact compliance misses discovered: none beyond currently tracked closure lanes.
- Outcome of this pass is confidence uplift and source-validation tightening across:
  - runtime-markup lineage (`WAP-191*`, `WAP-192*`, `WAP-238`, `spec-wml-19990616`)
  - WMLScript lineage (`WAP-193`, `WAP-194`, `WAP-194_103`)
  - WAE lineage (`WAP-236`, `WAP-237`)
  - security/security-PKI/architecture/deferred families

### Rerun delta check (base 13-file wave)

- Net-new high-impact compliance misses discovered: none beyond currently tracked closure lanes.
- Table-normalization check for this wave reported no unresolved table-caption ambiguities (`38/38` normalized in `tmp/docling-rerun/cleanup-report.txt`).
