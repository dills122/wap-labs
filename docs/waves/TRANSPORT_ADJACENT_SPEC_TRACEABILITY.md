# Waves Transport-Adjacent Spec Traceability

Version: v0.1  
Status: S0-06 complete (initial extraction + docling rerun validation pass)

## Purpose

Capture transport-adjacent requirements that affect Waves interoperability boundaries, but are not part of the core WSP/WTP/WDP rewrite loop.

## Source Authority Policy

- See `docs/waves/SOURCE_AUTHORITY_POLICY.md` for normative vs supplemental source precedence and citation rules.

## Source set reviewed (S0-06)

- `spec-processing/source-material/WAP-229-HTTP-20010329-a.pdf`
- `spec-processing/source-material/WAP-229_001-HTTP-20011031-a.pdf`
- `spec-processing/source-material/WAP-223-HTTPSM-20001213-a.pdf`
- `spec-processing/source-material/WAP-223_101-HTTPSM-20010928-a.pdf`
- `spec-processing/source-material/WAP-225-TCP-20010331-a.pdf`
- `spec-processing/source-material/WAP-202-WCMP-20010624-a.pdf`
- `spec-processing/source-material/WAP-159-WDPWCMPAdapt-20010713-a.pdf`

## Normative precedence

1. `WAP-229` defines Wireless Profiled HTTP baseline.
2. `WAP-229_001` applies SIN corrections to SCR appendix semantics (including TLS support status correction).
3. `WAP-223` defines HTTP state management and WAP-specific proxy-cookie headers.
4. `WAP-223_101` is editorial-only SIN (no substantive behavior change).
5. `WAP-225` defines Wireless Profiled TCP optimization profile.
6. `WAP-202` defines WCMP behavior and message semantics.
7. `WAP-159` defines WDP/WCMP adaptation over SMPP tunnels (gateway integration profile).

## Requirements matrix

Legend:

- `M` = mandatory
- `O` = optional

### RQ-TRX-001 Wireless Profiled HTTP method baseline

- Requirement:
  - WAP terminal HTTP client supports `GET` and `POST`.
  - `CONNECT` is required only when TLS support is present.
  - WAP proxy HTTP server supports `GET`, `HEAD`, `POST`, and `CONNECT`.
- Spec:
  - `WAP-229` section 5.1.1, 5.2.2, 5.4.1
  - `WAP-229_001` section 3.2/3.3 (TLS mandatory clerical correction in SCR interpretation)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Method support matrix is explicit in transport profile docs and code contracts.
  - [ ] TLS-disabled profile does not require `CONNECT` from terminal client path.

### RQ-TRX-002 HTTP content-coding behavior

- Requirement:
  - Proxy content-coding support should include `deflate` when encoding is enabled.
  - Proxy should avoid recompressing already-encoded or pre-optimized payloads.
- Spec:
  - `WAP-229` section 5.3.1
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Profile toggles explicitly define whether proxy encoding is active.
  - [ ] Compression policy includes a skip path for pre-encoded bodies/content types.

### RQ-TRX-003 Cookie-proxy pass-through baseline

- Requirement:
  - Cookie proxy must support pass-through mode.
  - If cookie-management mode is implemented, WAP-specific headers govern behavior and filtering rules.
- Spec:
  - `WAP-223` section 9.1, 9.2
  - `WAP-223_101` section 2.5 (editorial-only SIN note)
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Pass-through behavior is available and treated as default-safe mode.
  - [ ] Managed mode processing of `X-Wap-Proxy-Cookie` choices is deterministic and test-listed.

### RQ-TRX-004 Cookie-proxy state/error signaling and isolation

- Requirement:
  - Proxy includes `X-Wap-Proxy-Set-Cookie: state|error` under defined conditions.
  - Proxy must isolate cookie storage per authenticated client and must not serve anonymous clients.
- Spec:
  - `WAP-223` section 7.2, 9.2, 9.3
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Response signaling rules for `state` and `error` are documented with fixtures.
  - [ ] Storage keying model is bound to authenticated client identity.

### RQ-TRX-005 User-agent HTTP state minimums

- Requirement:
  - User agent implements RFC2109 HTTP state management.
  - User agent supports at least four cookies of up to 125 bytes each.
- Spec:
  - `WAP-223` section 10.1
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] UA/cookie-capability policy is declared (implemented, delegated, or deferred).
  - [ ] If delegated to host/proxy, the fallback behavior remains spec-consistent.

### RQ-TRX-006 WCMP error generation constraints

- Requirement:
  - WCMP error is not generated in response to another WCMP error.
  - WCMP error is not generated for congestion drops.
  - Port unreachable path generates destination-unreachable code 4.
- Spec:
  - `WAP-202` section 5.1, 5.5.3.1
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Error-generation guardrails are enforced in WCMP handling logic.
  - [ ] Destination-unreachable code mapping includes code `4` for missing listener.

### RQ-TRX-007 WCMP parameter/error and MTU signaling

- Requirement:
  - Parameter-problem handling discards invalid packets and should notify source with index semantics.
  - Message-too-big is used for first-fragment buffer-limit conditions.
- Spec:
  - `WAP-202` section 5.5.3.2, 5.5.3.3
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Parameter-problem emission includes correct index behavior (`0` when unknown).
  - [ ] Message-too-big path is covered in segmentation/reassembly tests.

### RQ-TRX-008 WCMP echo diagnostics

- Requirement:
  - WDP node must implement WCMP echo request/reply behavior.
  - Echo reply must return request data unmodified except path-MTU truncation cases.
- Spec:
  - `WAP-202` section 5.5.3.5
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] Echo request/reply interop fixture exists with payload round-trip assertions.
  - [ ] Path-MTU truncation behavior is explicitly handled.

### RQ-TRX-009 Wireless Profiled TCP optimization baseline

- Requirement:
  - TCP implementation conforms to RFC793/RFC1122/RFC2581 baseline.
  - Support for SACK is mandatory.
  - Split and end-to-end modes are supported.
  - Window-scale requirement is mandatory when window >= 64KB.
- Spec:
  - `WAP-225` section 5, 5.3, 5.8, 6, 7
- AC:
  - Evidence: [x] `transport-rust/src/tcp_profile.rs`, `transport-rust/tests/fixtures/transport/wireless_profiled_tcp_policy_mapped/policy_fixture.json`; command: `cd transport-rust && cargo test --lib tcp_profile::tests::wireless_profiled_tcp_posture_matches_declared_policy_fixture`
  - [x] Transport profile declares which TCP optimizations are enabled, delegated, or deferred.
  - [x] SACK + mode behavior are represented in explicit dependency declarations with fixture-backed drift checks.

### RQ-TRX-010 WDP/WCMP over SMPP adaptation profile (gateway-side)

- Requirement:
  - SMPP adaptation uses `data_sm` for WDP/WCMP payload carriage with required parameter semantics.
  - WCMP payload type signaling and SAR parameter rules follow selected adaptation mode.
- Spec:
  - `WAP-159` section 5.1.4, 5.1.5, 5.1.6, 5.2.1
- AC:
  - Evidence: [ ] Link concrete tests/fixtures, file paths, and commands proving this requirement.
  - [ ] If SMPP adaptation is in scope for gateway integration, `data_sm` parameter mapping is fixed in adapter tests.
  - [ ] If SMPP adaptation is out-of-scope, docs explicitly mark it deferred and non-blocking for Waves MVP.

## Boundary notes for Waves

- These requirements primarily impact `transport-rust/` gateway compatibility and policy decisions, not the core deterministic WML runtime loop.
- `WAP-223` cookie-proxy behavior is relevant when HTTP-state delegation to network proxies is supported; otherwise mark as explicit non-goal.
- `WAP-159` is gateway adaptation-specific (SMPP tunnel path) and is deferred until `T0-13` scope decision.

## Scope policy alignment

1. GSM/USSD and cache-adjacent transport siblings (`WAP-204*`, `WAP-120*`) are reviewed as adjacent context but not part of the core transport rewrite milestone.
2. Any ticket introducing these paths must add a scope decision to transport profile gating and `T0-17`.
3. Current implementation posture remains valid if these areas stay explicit deferments in `OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md`.

## Migration coupling

- `RQ-TRX-009` posture declaration is recorded via `T0-12`; protocol-level implementation beyond delegated/deferred posture remains gated by `T0-14` profile decisions.
- `RQ-TRX-010` requires explicit `T0-13` scope selection before any implementation-path behavior is introduced.
- `T0-17` remains the final scope lock so adjacent behavior cannot enter profile migration without explicit ticketing.
