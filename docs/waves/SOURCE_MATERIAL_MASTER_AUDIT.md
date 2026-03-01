# Waves Source Material Master Audit

Version: v0.1  
Status: Source audit extraction complete; initial contract/test mapping complete

## Goal

Run a repeatable, deep audit over all local source specs and ensure Waves requirements, contracts, and acceptance criteria are fully captured from normative material.

## Corpus snapshot

Current repository corpus under `docs/source-material`:

- `105` PDF files total
- `11` duplicated filenames across convenience folders (`sub-set/`, `WMLScript/`) and root

Canonical per-file ledger:

- `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`

Duplicate filename set:

- `WAP-191-WML-20000219-a.pdf`
- `WAP-191_102-WML-20001213-a.pdf`
- `WAP-191_104-WML-20010718-a.pdf`
- `WAP-191_105-WML-20020212-a.pdf`
- `WAP-192-WBXML-20010725-a.pdf`
- `WAP-192_105-WBXML-20011015-a.pdf`
- `WAP-193-WMLScript-20001025-a.pdf`
- `WAP-193_101-WMLScript-20010928-a.pdf`
- `WAP-194-WMLScriptLibraries-20000925-a.pdf`
- `WAP-194_103-WMLScriptLibraries-20020318-a.pdf`
- `WAP-196-ClientID-20010409-a.pdf`

## Canonical-source rule

For audit and traceability, use root-level files in `docs/source-material/` as canonical.  
Foldered duplicates (`sub-set/`, `WMLScript/`) are convenience mirrors only.

## Waves-focused domain map

### D0 Runtime markup/execution semantics (must capture)

- WML core and SIN lineage (`WAP-191*`, `WAP-238`, `spec-wml-19990616`)
- WAE semantics (`WAP-236`, `WAP-237`)
- WMLScript core + libraries (`WAP-193*`, `WAP-194*`)
- WBXML (`WAP-192*`)

### D1 Transport/protocol rewrite targets (must capture before each migration phase)

- WSP (`WAP-230`)
- WTP (`WAP-224`, `OMA-WAP-224_002`)
- WDP/WCMP (`WAP-259`, `WAP-202`, `WAP-159`)
- HTTP/TCP mappings where applicable (`WAP-229*`, `WAP-223*`, `WAP-225`)

### D2 Security parity/simulation boundary (capture for policy decisions)

- WTLS/TLS and related SIN (`WAP-261*`, `WAP-219*`)
- cert/PKI/WIM references (`WAP-211*`, `WAP-217*`, `WAP-260*`, OMA SINs)
- end-to-end transport security context (`WAP-187*`)

### D3 Out-of-scope or deferred for current Waves MVP

- Push/provisioning (`WAP-235*`, `WAP-247*`, `WAP-249*`, `WAP-250`, `WAP-251`, `WAP-182..186`)
- MMS/sync/service indication/load (`WAP-205`, `WAP-206`, `WAP-209`, `WAP-234`, `WAP-167*`, `WAP-168*`, `WAP-175*`)
- WTAI/telephony (`WAP-266`, `WAP-268`, `WAP-228`, `WAP-255`, `WAP-269`, `WAP-270`)
- XHTML MP (`WAP-277`) unless project scope expands to WAP 2 rendering modes

## Existing capture status

### Already captured well

- WML subset extraction for engine: `docs/wml-engine/source-material-review.md`
- corpus triage: `docs/wml-engine/source-material-triage.md`
- WMLScript architecture and traceability:
  - `docs/waves/WAVESCRIPT_VM_ARCHITECTURE.md`
  - `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
- Runtime-markup traceability:
  - `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
- WAE baseline traceability:
  - `docs/waves/WAE_SPEC_TRACEABILITY.md`
- Transport baseline traceability:
  - `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- Transport-adjacent traceability:
  - `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- Security boundary traceability:
  - `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`
- Security PKI/WIM traceability:
  - `docs/waves/SECURITY_PKI_SPEC_TRACEABILITY.md`
- Architecture-context review:
  - `docs/waves/ARCHITECTURE_CONTEXT_SPEC_REVIEW.md`
- Deferred capability traceability:
  - `docs/waves/DEFERRED_CAPABILITY_SPEC_TRACEABILITY.md`
- Coverage dashboard:
  - `docs/waves/SPEC_COVERAGE_DASHBOARD.md`
- Contract requirements mapping:
  - `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
- Spec test coverage matrix:
  - `docs/waves/SPEC_TEST_COVERAGE.md`
- Full per-file review ledger:
  - `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`
- Out-of-scope family review:
  - `docs/waves/OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md`

### Partially captured / needs deep extraction

- explicit version/SIN precedence matrix for every spec family used by Waves

### Not yet converted into requirements artifacts

- none (initial mapping artifacts now exist)

## Audit deliverables (what “done” looks like)

1. Source inventory index with canonical precedence and domain ownership.
2. Spec precedence matrix (`base spec + SIN overlays`) for every in-scope domain.
3. Requirement traceability docs per domain:
- runtime/markup
- script/vm
- transport
- security boundary
4. Ticket linkage:
- each work item includes exact spec sections and SCR/CR identifiers.
5. AC coverage report:
- every requirement has testable AC and target test location.

## Execution plan

### Stage A: Inventory + precedence (short)

- Normalize canonical file list and duplicate handling rules.
- Define precedence chain per spec family (e.g., `WAP-224` + `OMA-WAP-224_002`).

### Stage B: Domain extraction (deep)

- Extract normative clauses into domain traceability docs.
- Separate mandatory vs optional behavior.

### Stage C: Contract alignment

- Map extracted requirements to contracts:
  - `engine-wasm/contracts/wml-engine.ts`
  - `transport-python/api/openapi.yaml`
  - `browser/contracts/transport.ts`

### Stage D: AC + tests

- Add AC checklists and test IDs for each requirement.
- Identify uncovered requirements as explicit follow-up tickets.

## Immediate next audit tasks

1. Keep `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md` synced with contract changes.
2. Promote `planned` entries in `docs/waves/SPEC_TEST_COVERAGE.md` into implemented tests in each project backlog.

## Quality gates

- No requirement entry without source section reference.
- No ticket without a `Spec` field referencing traceability entries.
- No “M” status spec requirement left without AC checklist.
- Optional (`O`) items must be flagged as feature-gated, deferred, or explicitly out-of-scope.
