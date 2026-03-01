# Documentation Index

## Primary Entry Points

- `wap-test-environment/README.md`: legacy stack setup and real-world validation runbook
- `browser-emulator/README.md`: browser emulator build track (transport + WASM engine + host harness)
- `development-prerequisites.md`: canonical prerequisite matrix + local bootstrap workflow

## Cross-Layer Architecture

- `modern-wap-browser-architecture.md`: current layer boundaries and contract expectations
- `waves/TECHNICAL_ARCHITECTURE.md`: Waves runtime-first architecture direction (Tauri host + Python sidecar strategy)
- `waves/WORK_ITEMS.md`: Waves browser integration execution board and ticket queue
- `waves/WAVESCRIPT_VM_ARCHITECTURE.md`: WaveScript VM/runtime design and milestone plan
- `waves/WMLSCRIPT_SPEC_TRACEABILITY.md`: WMLScript spec-derived requirements and acceptance-criteria traceability matrix
- `waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`: WML/WBXML runtime-markup requirements and acceptance-criteria traceability matrix
- `waves/WAE_SPEC_TRACEABILITY.md`: WAE/WAEMT spec-derived requirements and acceptance-criteria traceability matrix
- `waves/TRANSPORT_SPEC_TRACEABILITY.md`: WSP/WTP/WDP transport spec-derived requirements and acceptance-criteria traceability matrix
- `waves/TRANSPORT_RUST_PHASE_PLAN.md`: active phased implementation plan for `transport-rust` (FFI decode, streaming, protocol, and WTLS stages)
- `waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`: HTTP/TCP/HTTPSM/WCMP transport-adjacent requirements and interoperability-boundary traceability
- `waves/SECURITY_BOUNDARY_TRACEABILITY.md`: WTLS/TLS/end-to-end security traceability and Waves boundary policy mapping
- `waves/SECURITY_PKI_SPEC_TRACEABILITY.md`: WAPCert/WPKI/WIM trust and PKI-profile boundary traceability
- `waves/ARCHITECTURE_CONTEXT_SPEC_REVIEW.md`: architecture-context constraints and non-runtime conformance guardrails
- `waves/DEFERRED_CAPABILITY_SPEC_TRACEABILITY.md`: reviewed deferred capabilities (WMLScript crypto, UAProf) and explicit defer decisions
- `waves/OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md`: reviewed out-of-scope spec families with explicit defer posture and future activation AC
- `waves/CONTRACT_REQUIREMENTS_MAPPING.md`: contract-field to requirement-ID mapping across engine, transport, and browser interfaces
- `waves/SPEC_TEST_COVERAGE.md`: requirement-group test coverage matrix across engine/host/transport/browser
- `waves/SPEC_COVERAGE_DASHBOARD.md`: current cross-domain spec coverage and remaining gap register
- `waves/SOURCE_MATERIAL_MASTER_AUDIT.md`: full source-material audit scope, precedence, and gap-tracking plan
- `waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`: per-file review ledger for all canonical source PDFs

## Engineering Standards

- `agents/AGENT_STANDARDS.md`: multi-language contributor/agent standards
- `agents/RUST_STEERING.md`: Rust-specific steering for WaveNav engine development
- `agents/PYTHON_STEERING.md`: Python transport implementation steering and quality rules

## WaveNav Engine Documentation Set

Authoritative implementation set:

- `wml-engine/README.md`: engine docs entrypoint and read order
- `wml-engine/source-material-review.md`: extracted normative notes from reviewed local subset PDFs
- `wml-engine/requirements-matrix.md`: requirement to module/test traceability
- `wml-engine/architecture.md`: maintainable internal module architecture
- `wml-engine/ticket-plan.md`: active phased implementation backlog
- `wml-engine/work-items.md`: PR-sized execution board for current implementation cycle
- `wml-engine/test-strategy.md`: fixture and verification strategy
- `wml-engine/wavescript-security.md`: WaveScript VM sandbox and security guardrails

Supporting context docs:

- `wml-engine/spec-derived-requirements.md`: compact semantic checklist derived from WML 1.1/WAE
- `wml-engine/source-material-triage.md`: full source-material triage and relevance scope

Historical (non-authoritative):

- `wml-engine/implementation-tickets.md`: earlier backlog draft, retained for history only
- `wml-1.1-engine-support-plan.md`: earlier support-plan draft superseded by `wml-engine/` docs
