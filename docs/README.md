# Documentation Index

## Primary Entry Points

- `../docs-portal/README.md`: Astro project atlas for project state, standards sources, compliance, planning, work items, and active documentation
- `wap-test-environment/README.md`: legacy stack setup and real-world validation runbook
- `browser-emulator/README.md`: browser emulator build track (transport + WASM engine + host harness)
- `browser-emulator/TAURI_PROFESSIONAL_POLISH_EXPLORATION.md`: high-leverage desktop polish opportunities and prioritized next-cycle options
- `development-prerequisites.md`: canonical prerequisite matrix + local bootstrap workflow
- `../gateway-kannel/PARITY_PLAN.md`: Kannel baseline parity matrix and fixture format for embedded-gateway migration

## Cross-Layer Architecture

- `architecture/native-wap-browser-product-architecture.md`: Kannel-independent browser, modular SDK boundaries, gap assessment, and phased product work program
- `architecture/c4-context.md`: product-suite system context and external WAP/WML relationships
- `architecture/c4-containers.md`: runtime/deployment-unit view for Waves and optional Lowband adapters
- `architecture/c4-components.md`: in-process Waves Host, Lowband, and WaveNav component boundaries
- `architecture/c4-deployment.md`: all-in-one desktop and optional SDK delivery topology
- `architecture/wtls-modernization-research.md`: WAP-261 algorithm inventory, current Lowband audit, modern-default security profiles, downgrade policy, and deferred WTLS work program
- `architecture/decisions/0001-library-first-native-wap-client.md`: proposed library-first native WAP client decision
- `architecture/decisions/0002-separate-modern-security-from-wtls-compatibility.md`: proposed decision to keep modern TLS, historical WTLS, clear WAP, and any future DTLS route as explicit non-downgrading profiles
- `architecture/decisions/0003-generate-compliance-knowledge-graph.md`: accepted repository-derived graph, Obsidian projection, and bounded AI context decision
- `architecture/decisions/0004-build-a-canonical-data-driven-project-atlas.md`: accepted Astro portal and canonical-data projection decision
- `knowledge-graph/README.md`: WML-2 graph pilot, generated artifact contract, Obsidian entrypoint, and AI retrieval rules
- `knowledge-graph/SLICE_ADOPTION.md`: accepted incremental graph-expansion policy and compliance-slice ready/done gates
- `modern-wap-browser-architecture.md`: current layer boundaries and contract expectations
- `waves/TECHNICAL_ARCHITECTURE.md`: Waves runtime-first architecture direction (Tauri host + in-process Rust transport)
- `waves/WORK_ITEMS.md`: Waves browser integration execution board and ticket queue
- `waves/WORK_ITEMS_ARCHIVE.md`: archived/historical Waves integration tickets
- `waves/MAINTENANCE_WORK_ITEMS.md`: Waves maintenance and technical-debt board
- `waves/MAINTENANCE_WORK_ITEMS_ARCHIVE.md`: archived/historical Waves maintenance tickets
- `waves/WAVESCRIPT_VM_ARCHITECTURE.md`: WaveScript VM/runtime design and milestone plan
- `waves/WMLSCRIPT_SPEC_TRACEABILITY.md`: WMLScript spec-derived requirements and acceptance-criteria traceability matrix
- `waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`: WML/WBXML runtime-markup requirements and acceptance-criteria traceability matrix
- `waves/WAE_SPEC_TRACEABILITY.md`: WAE/WAEMT spec-derived requirements and acceptance-criteria traceability matrix
- `waves/TRANSPORT_SPEC_TRACEABILITY.md`: WSP/WTP/WDP transport spec-derived requirements and acceptance-criteria traceability matrix
- `waves/TRANSPORT_RUST_PHASE_PLAN.md`: active phased implementation plan for `transport-rust` (FFI decode, streaming, protocol, and WTLS stages)
- `waves/TRANSPORT_E2E_READINESS_SCORECARD.md`: measured readiness for local Kannel/WML end-to-end transport and browser smoke coverage
- `waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md`: canonical cross-lane, priority-ordered sprint plan for immediate and next-slice execution
- `waves/WAP_1_2_1_PLANNING_BASELINE.md`: closed WAP 1.2.1/WML 1.3 source, obligation, fixture, and implementation-planning checkpoint
- `waves/SPRINT_PLAN_2026-03_BEDROCK_COMPLIANCE.md`: committed dependency-ordered sprint plan for request-policy/history/process-order/bytecode verification closure
- `waves/ENGINE_HOST_FRAME_MIGRATION_PLAN.md`: canonical migration plan for EngineFrame-based host integration
- `waves/ENGINE_HOST_FRAME_WORK_ITEMS.md`: ticketized execution board for frame/input interface migration
- `waves/ENGINE_HOST_FRAME_WORK_ITEMS_ARCHIVE.md`: archived/historical frame migration tickets
- `waves/USER_ONBOARDING_EXPERIENCE_PLAN.md`: planning-ready first-run, help-hub, tutorial, and guided-tour design for Waves
- `waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`: HTTP/TCP/HTTPSM/WCMP transport-adjacent requirements and interoperability-boundary traceability
- `waves/SECURITY_BOUNDARY_TRACEABILITY.md`: WTLS/TLS/end-to-end security traceability and Waves boundary policy mapping
- `waves/SECURITY_PKI_SPEC_TRACEABILITY.md`: WAPCert/WPKI/WIM trust and PKI-profile boundary traceability
- `waves/ARCHITECTURE_CONTEXT_SPEC_REVIEW.md`: architecture-context constraints and non-runtime conformance guardrails
- `waves/DEFERRED_CAPABILITY_SPEC_TRACEABILITY.md`: reviewed deferred capabilities (WMLScript crypto, UAProf) and explicit defer decisions
- `waves/OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md`: reviewed out-of-scope spec families with explicit defer posture and future activation AC
- `waves/CONTRACT_REQUIREMENTS_MAPPING.md`: contract-field to requirement-ID mapping across engine, transport, and browser interfaces
- `waves/SPEC_TEST_COVERAGE.md`: requirement-group test coverage matrix across engine/host/transport/browser
- `waves/SPEC_COVERAGE_DASHBOARD.md`: current cross-domain spec coverage and remaining gap register
- `waves/NETWORKING_GAP_MASTER.md`: consolidated active networking gap register and migration-gate blockers
- `waves/NETWORKING_VECTOR_ADOPTION_SWEEP.md`: ranked external vector adoption guidance for WAP networking interop and conformance sources
- `waves/NETWORKING_EXTERNAL_SOURCE_INDEX.md`: indexed external and supplemental networking source families with source-class and `RQ-*` mappings
- `waves/SOURCE_MATERIAL_MASTER_AUDIT.md`: full source-material audit scope, precedence, and gap-tracking plan
- `waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`: per-file review ledger for all canonical source PDFs
- `waves/archive/README.md`: archive policy and layout for superseded/date-stamped Waves docs

## Engineering Standards

- `agents/AGENT_STANDARDS.md`: multi-language contributor/agent standards
- `agents/COMPLIANCE_CONTEXT_RETRIEVAL.md`: bounded knowledge-graph retrieval and trust rules for Codex, Claude Code, and other coding agents
- `agents/RUST_ENGINE_STEERING.md`: Rust-specific steering for WaveNav engine development
- `agents/RUST_TRANSPORT_STEERING.md`: Rust-specific steering for Lowband transport and protocol development
- `agents/SHELL_STEERING.md`: POSIX-first shell steering and Alpine portability rules
- `agents/SCRIPTING_STEERING.md`: reusable scripting policy and tool-reuse-first guidance
- `releases/VERSIONING.md`: pre-alpha semver policy, coordinated release-train guidance, and release workflow expectations
- `ci/RELEASE_BRANCH_RULESET.md`: GitHub ruleset guidance for immutable `release/v*` historical branches

## WaveNav Engine Documentation Set

Authoritative implementation set:

- `wml-engine/README.md`: engine docs entrypoint and read order
- `wml-engine/source-material-review.md`: extracted normative notes from reviewed canonical local PDFs
- `wml-engine/requirements-matrix.md`: requirement to module/test traceability
- `wml-engine/architecture.md`: maintainable internal module architecture
- `wml-engine/ticket-plan.md`: active phased implementation backlog
- `wml-engine/work-items.md`: PR-sized execution board for current implementation cycle
- `wml-engine/work-items-archive.md`: archived/historical engine execution tickets
- `wml-engine/test-strategy.md`: fixture and verification strategy
- `wml-engine/wavescript-security.md`: WaveScript VM sandbox and security guardrails

Supporting context docs:

- `wml-engine/spec-derived-requirements.md`: compact semantic checklist derived from WML 1.1/WAE
- `wml-engine/source-material-triage.md`: full source-material triage and relevance scope

Historical (non-authoritative):

- `wml-engine/implementation-tickets.md`: earlier backlog draft, retained for history only
- `wml-1.1-engine-support-plan.md`: earlier support-plan draft superseded by `wml-engine/` docs
