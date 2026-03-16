# Waves WAE Spec Traceability

Version: v0.1  
Status: S0-01 complete (initial extraction + docling rerun validation pass)

## Purpose

Capture WAE normative requirements relevant to Waves and map them to implementation-facing acceptance criteria.

## Source Authority Policy

- See `docs/waves/SOURCE_AUTHORITY_POLICY.md` for normative vs supplemental source precedence and citation rules.

## Source set reviewed (S0-01)

- `spec-processing/source-material/WAP-236-WAESpec-20020207-a.pdf`
- `spec-processing/source-material/WAP-237-WAEMT-20010515-a.pdf`

## Normative precedence

1. `WAP-236-WAESpec-20020207-a` (includes `WAP-236_101` SIN in the rollup).
2. `WAP-237-WAEMT-20010515-a` for WBMP/media-type specifics referenced by WAE.

## Requirements matrix

Legend:

- `M` = mandatory
- `O` = optional

### RQ-WAE-001 Media type determination

- Requirement:
  - User Agent must use MIME media type as one component in content type determination.
- Spec:
  - `WAP-236` 6.1.1
  - SCR: `WAESpec-MT-C-001 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Content routing path uses MIME type in final type decision logic.

### RQ-WAE-002 Markup capability baseline and context continuity

- Requirement:
  - User Agent must support either:
    - XHTML MP text + WML1 text and/or binary, or
    - WML2 text.
  - WML context (history + vars) must persist across XHTMLMP/WML navigation as single UA semantics.
- Spec:
  - `WAP-236` 6.2.4
  - SCRs: `WAESpec-ML-C-001 (M)`, `WAESpec-ML-C-002 (M)`, `WAESpec-ML-C-003 (M)`, `WAESpec-ML-C-004 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Cross-language navigation preserves history and variable context.
  - [ ] Capability profile is explicit in host/runtime conformance mode docs.

### RQ-WAE-003 WMLScript support in UA

- Requirement:
  - UA must support WMLScript + standard libraries in text and/or bytecode form.
- Spec:
  - `WAP-236` 6.4.2
  - SCRs: `WAESpec-WMLS-C-001 (M)`, `WAESpec-WMLS-C-002 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Runtime accepts configured script form(s) and executes stdlib surface.
  - [ ] Script support mode is advertised in compatibility matrix.

### RQ-WAE-004 WMLScript proxy compile behavior

- Requirement:
  - Proxy must transform WMLScript to bytecode when UA prefers binary.
  - On compile error, proxy should report HTTP 502.
- Spec:
  - `WAP-236` 6.4.2
  - SCRs: `WAESpec-WMLS-S-001 (M)`, `WAESpec-WMLS-S-002 (O)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Transport layer exposes compile path or equivalent behavior contract.
  - [ ] Compile errors map to deterministic error response (502 where HTTP semantics apply).

### RQ-WAE-005 WBXML role and boundary

- Requirement:
  - WBXML support requirements come through format-specific specs; no standalone WBXML conformance in WAE.
- Spec:
  - `WAP-236` 6.5
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] WBXML decode/encode stays in transport boundary; engine consumes decoded runtime inputs.

### RQ-WAE-006 Graphical image/WBMP requirement gating

- Requirement:
  - UA may support graphical images.
  - If it supports graphical images, WBMP support is required.
- Spec:
  - `WAP-236` 6.6.2
  - SCRs: `WAESpec-IMG-C-001 (O)`, `WAESpec-IMG-C-002 (O)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] If image support flag is enabled, WBMP decode/render path exists and is tested.
  - [ ] If disabled, behavior is documented as out-of-scope for current milestone.

### RQ-WAE-007 Hypermedia transfer service support

- Requirement:
  - UA and proxy must support Hypermedia Transfer Service.
  - UA/proxy must support WSP or Wireless Profiled HTTP.
- Spec:
  - `WAP-236` 7.1.1.2
  - SCRs: `WAESpec-HTS-C-001 (M)`, `WAESpec-HTS-S-001 (M)`, `WAESpec-HTS-C-002 (O)`, `WAESpec-HTS-C-003 (O)`, `WAESpec-HTS-S-002 (O)`, `WAESpec-HTS-S-003 (O)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Waves transport profile declares active stack(s) (currently Rust transport-backed).
  - [ ] Unsupported stack path returns explicit capability error.

### RQ-WAE-008 Cache model support

- Requirement:
  - UA must support WAP caching model per spec.
- Spec:
  - `WAP-236` 7.1.2.2
  - SCR: `WAESpec-HTS-C-004 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Cache behavior policy exists for deck/script/media retrieval and invalidation.
  - [ ] Integration tests verify deterministic cache hit/miss expectations.

### RQ-WAE-009 WSP client-header caching in proxy

- Requirement:
  - Proxy must implement cached request-header behavior for WSP connect/resume primitives.
- Spec:
  - `WAP-236` 7.1.4
  - SCRs: `WAESpec-HTS-S-004 (O)`, `WAESpec-HTS-S-005 (O)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Sidecar/proxy contract includes connect/resume header cache semantics.
  - [ ] Accept/Accept-* override behavior matches section 7.1.4 examples.

### RQ-WAE-010 URI handling baseline

- Requirement:
  - UA/proxy must handle URIs at least 1024 octets.
  - UA must retrieve `http:` resources via WSP and/or W-HTTP.
- Spec:
  - `WAP-236` 7.2, 7.2.1
  - SCRs: `WAESpec-URI-C-001 (M)`, `WAESpec-URI-S-001 (M)`, `WAESpec-URI-C-002 (M)`, `WAESpec-URI-S-002 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [x] Long-URI parsing/forwarding tests pass at 1024-octet boundary.
  - [ ] HTTP scheme routing aligns with supported transport profiles.
  - Progress note: `transport-rust` now enforces deterministic reject behavior beyond 1024 octets and includes fixture coverage (`uri_too_long_1025`) plus boundary unit tests.

### RQ-WAE-011 HTTPS secure-session/error semantics

- Requirement:
  - UA/proxy must support HTTPS URI scheme and profile-specific secure-session behavior.
  - On secure-session establishment failure: UA reports error; proxy reports HTTP 502.
- Spec:
  - `WAP-236` 7.2.2
  - SCRs: `WAESpec-URI-C-003 (M)`, `WAESpec-URI-S-003 (M)`, `WAESpec-URI-C-004 (O)`, `WAESpec-URI-S-004 (O)`, `WAESpec-URI-C-005 (O)`, `WAESpec-URI-S-005 (O)`, `WAESpec-URI-C-006 (M)`, `WAESpec-URI-S-006 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Secure-session failure path has deterministic user-visible error and proxy error mapping.
  - [ ] Profile-specific behavior is feature-gated/documented where not yet implemented.

### RQ-WAE-012 Internationalization baseline

- Requirement:
  - UA/proxy must support UTF-8 and UTF-16.
  - XML character encoding must be treated per RFC3023; unknown chars must produce user-visible error.
  - Proxy may transform unsupported encodings.
- Spec:
  - `WAP-236` 7.4.1
  - SCRs: `WAESpec-I18N-C-001 (M)`, `WAESpec-I18N-C-002 (M)`, `WAESpec-I18N-C-003 (M)`, `WAESpec-I18N-S-001 (O)`, `WAESpec-I18N-S-002 (M)`, `WAESpec-I18N-S-003 (M)`, `WAESpec-I18N-S-004 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] UTF-8/UTF-16 deck/script decoding verified.
  - [x] Encoding error paths return deterministic errors.
  - Progress note: `transport-rust` textual WML decode path now handles UTF-16 BOM decode and maps malformed UTF-16 payloads to deterministic `PROTOCOL_ERROR`, with mapped fixtures covering UTF-16 success/error boundaries.

### RQ-WAE-013 User-agent capability advertising

- Requirement:
  - UA advertising characteristics must at least use Accept, Accept-Charset, Accept-Encoding, Accept-Language.
  - Proxy must interpret those headers per HTTP semantics.
- Spec:
  - `WAP-236` 7.5.1
  - SCRs: `WAESpec-UAC-C-001 (O)`, `WAESpec-UAC-C-002 (O)`, `WAESpec-UAC-C-003 (O)`, `WAESpec-UAC-C-004 (O)`, `WAESpec-UAC-S-001 (M)`, `WAESpec-UAC-S-002 (M)`, `WAESpec-UAC-S-003 (M)`, `WAESpec-UAC-S-004 (M)`, `WAESpec-UAC-S-005 (M)`, `WAESpec-UAC-S-006 (O)`, `WAESpec-UAC-S-007 (O)`, `WAESpec-UAC-S-008 (O)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Sidecar/proxy negotiation path uses Accept headers consistently.
  - [ ] Media-type transformation obeys declared preference/quality behavior.

### RQ-WAE-014 Basic authentication requirement

- Requirement:
  - UA must implement HTTP/1.1 Basic authentication.
- Spec:
  - `WAP-236` 7.10.1
  - SCR: `WAESpec-SEC-C-001 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Authentication challenge flow is represented in host/transport behavior contract.

### RQ-WAE-015 WMLScript crypto compile support in proxy

- Requirement:
  - Proxy supporting WMLScript compilation must compile units referring to Crypto library.
- Spec:
  - `WAP-236` 7.10.3.2
  - SCR: `WAESpec-SEC-S-001 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Sidecar compile behavior documents/handles crypto-library references.

### RQ-WAE-016 Navigation history model

- Requirement:
  - UA must implement history stack model with at least push/pop operations.
  - Entries should include absolute URL and method.
- Spec:
  - `WAP-236` 7.11.1
  - SCR: `WAESpec-UAB-C-001 (M)`
- AC:
  - Evidence: [x] Engine evidence in `engine-wasm/engine/src/engine_tests/actions_timers.rs` (`navigate_back_restores_previous_card`, `navigate_back_returns_false_when_history_empty`) and `engine-wasm/engine/src/engine_tests/traces_public_api.rs` (`m1_02_handle_key_render_and_navigate_back_public_api_flow`); browser request-shaped host-history evidence in `browser/frontend/src/session-history.test.ts`, `browser/frontend/src/app/navigation-state.load.test.ts`, and `browser/frontend/src/app/navigation-state.history.test.ts`. Commands: `cd engine-wasm/engine && cargo test navigate_back_ && cargo test m1_02_handle_key_render_and_navigate_back_public_api_flow` and `pnpm --dir browser/frontend test -- --runInBand session-history.test.ts navigation-state.load.test.ts navigation-state.history.test.ts`
  - [x] Forward navigation performs push, backward performs pop.
  - [x] History entry stores request identity fields required for deterministic back behavior.

### RQ-WAE-017 BACK key behavior

- Requirement:
  - UA must provide end-user BACK access at all times.
  - BACK triggers pop.
  - In WML1 mode, BACK executes `prev`; `do type="prev"` override applies with first-in-document-order precedence.
- Spec:
  - `WAP-236` 7.11.2
  - SCRs: `WAESpec-UAB-C-002 (M)`, `WAESpec-UAB-C-003 (M)`, `WAESpec-UAB-C-004 (O)`, `WAESpec-UAB-C-005 (O)`
- AC:
  - Evidence: [x] Engine back-pop semantics are covered in `engine-wasm/engine/src/engine_tests/actions_timers.rs` and `engine-wasm/engine/src/engine_tests/traces_public_api.rs`; browser fallback and deterministic restore behavior are covered in `browser/frontend/src/app/navigation-state.history.test.ts` and `browser/frontend/src/app/navigation-state.load.test.ts`.
  - [ ] UI always exposes BACK action path.
  - [x] BACK-to-pop behavior verified in runtime integration tests.
  - [ ] WML1-specific prev/override semantics covered in fixture tests.

### RQ-WAE-018 WBMP baseline format support

- Requirement:
  - Any WBMP-supporting system must support WBMP type 0.
  - UA advertising WBMP support must report supported WBMP types via Accept header.
  - WBMP multi-byte integers must use smallest encoding.
  - Type 0 extension headers must not be present.
- Spec:
  - `WAP-237` 4.1, 4.3.1, 4.5.1, Appendix A
  - SCRs: `WAEMT-WBMP-C-001 (M)`, `WAEMT-WBMP-C-002 (M)`
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Type 0 decode/validation fixtures pass.
  - [ ] Invalid multi-byte-integer encodings are rejected.
  - [ ] Accept header emission includes `image/vnd.wap.wbmp; level=0` when WBMP is advertised.

## Waves implementation mapping

- `engine-wasm/`:
  - `RQ-WAE-001`, `RQ-WAE-002`, `RQ-WAE-003`, `RQ-WAE-016`, `RQ-WAE-017`
- `transport-rust/` (current proxy/transport role):
  - `RQ-WAE-004`, `RQ-WAE-007`..`RQ-WAE-015`, `RQ-WAE-018` (as needed for image transformations/media handling)
- `browser/` host:
  - UI-level behavior for `BACK` access and error surfacing (`RQ-WAE-011`, `RQ-WAE-017`)

## Notes

- This extraction is scoped to WAE requirements that directly affect Waves runtime/host/transport behavior.
- Deferred optional areas (Push/vCard/vCalendar/multipart variants beyond immediate roadmap) remain tracked but not yet scheduled for implementation.
