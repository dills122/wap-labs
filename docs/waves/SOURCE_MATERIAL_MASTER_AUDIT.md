# Waves Source Material Master Audit

Version: v0.2
Status: WAP 2.0-era local corpus reviewed; WAP 1.2.1 target-source recovery and effective-spec remapping in progress

## Goal

Run a repeatable, deep audit over all local source specs and ensure Waves requirements, contracts, and acceptance criteria are fully captured from normative material.

Primary compatibility target: WAP 1.2.1 with WML 1.3. See
`docs/waves/WAP_1_2_1_SOURCE_BASELINE.md`.

## Corpus snapshot

Current repository corpus under `spec-processing/source-material`:

- `98` PDF files total (canonical root-level corpus)
- `0` duplicate mirror folders in active use (`sub-set/`, `WMLScript/` removed from canonical tree)

Canonical per-file ledger:

- `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`

Historical duplicate mirrors were removed during repository cleanup; canonical root-level PDFs are now the only supported source paths.

The local corpus is primarily the later WAP 2.0 technical bundle. It is not a
definition of the WAP 1.2.1 target release. The authoritative target inventory
is `spec-processing/source-manifests/wap-1.2.1-release.json`:

- 97 official release members
- 21 byte-exact local members
- 4 same-name but byte-different local variants
- 72 members absent from the canonical local corpus
- 27 missing plus 3 byte-different members in the 42-member
  core/dependency/conditional subset

Private research ingestion is now complete for all 97 technical members:

- all 97 PDFs match release-lock byte sizes and SHA-256 values;
- all 97 text extractions are non-empty and hash-locked;
- 2,270 PDF pages are represented;
- 76 members remain outside canonical promotion because redistribution review
  is separate from research availability.

See `spec-processing/source-manifests/wap-1.2.1-ingestion-status.json` and
`docs/waves/WAP_SOURCE_RECOVERY_AND_PERMISSION.md`.

The release-governing WAP-215 source is also recovered and hash-locked outside
Git. Its six exact Class A/B/C client/server graphs and the selected Class C
client profile are recorded in
`spec-processing/source-manifests/wap-1.2.1-class-conformance.json`.

## Canonical-source rule

For audit and traceability, use root-level files in `spec-processing/source-material/` as canonical.  
Do not reintroduce foldered mirror duplicates (`sub-set/`, `WMLScript/`) unless explicitly required and documented.

Supplemental-source precedence:

- Non-forum contextual sources (for example `WAP.pdf` and `vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf`) are allowed for interop/context reinforcement.
- They must not create or redefine normative requirement IDs without an anchor in canonical WAP/OMA specs already tracked in traceability docs.

## Waves-focused domain map

### D0 Runtime markup/execution semantics (must capture)

- WML 1.3 core and SIN lineage (`WAP-191*`)
- WAE 1.2.1 semantics (`WAP-190*`, with `WAP-195*` overview context)
- WMLScript core + libraries (`WAP-193*`, `WAP-194*`)
- WBXML (`WAP-192*`)
- Later WML/WAE documents (`WAP-238`, `WAP-236`, `WAP-237`) are successor
  delta/context sources, not strict-target replacements

### D1 Transport/protocol rewrite targets (must capture before each migration phase)

- WSP (`WAP-203*`)
- WTP (`WAP-201*`, including SIN `003`)
- WDP/WCMP (`WAP-200*`, `WAP-202`, `WAP-159`)
- Later WSP/WTP/WDP documents (`WAP-230`, `WAP-224*`, `WAP-259`) are
  successor delta/context sources

### D2 Security parity/simulation boundary (capture for policy decisions)

- WTLS and release SIN lineage (`WAP-199*`)
- cert/PKI/WIM references (`WAP-211*`, `WAP-217*`, `WAP-260*`, OMA SINs)
- end-to-end transport security context (`WAP-187*`)
- WAP 2.0 WTLS/TLS documents (`WAP-261*`, `WAP-219*`) are successor or
  adjacent profile evidence

### D3 Out-of-scope or deferred for current Waves MVP

- Push/provisioning (`WAP-235*`, `WAP-247*`, `WAP-249*`, `WAP-250`, `WAP-251`, `WAP-182..186`)
- MMS/sync/service indication/load (`WAP-205`, `WAP-206`, `WAP-209`, `WAP-234`, `WAP-167*`, `WAP-168*`, `WAP-175*`)
- WTAI/telephony (`WAP-266`, `WAP-268`, `WAP-228`, `WAP-255`, `WAP-269`, `WAP-270`)
- XHTML MP (`WAP-277`) unless project scope expands to WAP 2 rendering modes

### D4 Supplemental context sources (non-normative precedence)

- `WAP.pdf` (slide-deck summary; transport/session/context terminology reinforcement)
- `vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf` (historical context; includes embedded WML text that must be treated as contextual duplicate, not source-of-truth override)

## Existing capture status

### Already captured well

- WML extraction for engine from canonical corpus: `docs/wml-engine/source-material-review.md`
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
- Supplemental context-source gap audit:
  - `docs/waves/archive/reports/SUPPLEMENTAL_SOURCE_CONTEXT_GAP_AUDIT_2026-03-05.md`
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

### Partially converted into target requirements artifacts

- WAP-215 Class A/B/C profile mapping is complete; WAP-221 conformance grammar
  still needs to be carried into the remaining family ledgers
- one-to-one mandatory/optional obligation ledgers for the WAP 1.2.1 target
  (WML 1.3, WAE, WBXML, WMLScript, WMLScript Libraries, and caching complete at
  SCR/source-work-item level; remaining families, nested clauses, and direct
  test evidence pending)
- WAP 1.2.1-to-WAP 2.0 delta records for areas implemented from successor
  documents (selected WAE Class C concepts complete; broader/other-family
  deltas pending)

The family-level WAP 1.2.1 base/SIN precedence graph now exists at
`spec-processing/source-manifests/wap-1.2.1-effective-spec.json`. It establishes
source order. The exact class graph exists at
`spec-processing/source-manifests/wap-1.2.1-class-conformance.json`. The first
line-item SCR ledgers now exist at
`spec-processing/source-manifests/wap-1.2.1-wml-scr.json`,
`spec-processing/source-manifests/wap-1.2.1-wae-scr.json`, and
`spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json`,
`spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json`, and
`spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json`, and
`spec-processing/source-manifests/wap-1.2.1-caching-scr.json`; three other
selected family SCRs and all nested normative-clause ledgers remain pending.
WTP is additionally conditional on connection-mode WSP.

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
  - `transport-rust` public request/response/error models
  - `browser/contracts/transport.ts`

### Stage D: AC + tests

- Add AC checklists and test IDs for each requirement.
- Identify uncovered requirements as explicit follow-up tickets.

## Immediate next audit tasks

1. Keep `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md` synced with contract changes.
2. Finish metadata-locking unresolved external dependencies and obtain
   redistribution guidance for recovered WAP sources and DTDs.
3. Replace successor-spec assumptions with an explicit base + SIN + delta
   graph.
4. Generate additive strict-mode work items from uncovered WAP 1.2.1
   obligations; do not rewrite completed ticket history.
5. Promote `planned` entries in `docs/waves/SPEC_TEST_COVERAGE.md` into
   implemented tests in each project backlog.

## Quality gates

- No requirement entry without source section reference.
- No ticket without a `Spec` field referencing traceability entries.
- No “M” status spec requirement left without AC checklist.
- Optional (`O`) items must be flagged as feature-gated, deferred, or explicitly out-of-scope.
- Corpus counts in ledger/dashboard/master audit remain aligned with canonical source-material via `scripts/check-source-corpus-drift.mjs`.
- WAP 1.2.1 release membership, hashes, classifications, and local-state
  comparisons pass
  `node spec-processing/scripts/check-wap-release-manifest.mjs`.
- WAP-215 source identity and all six class dependency graphs pass
  `node spec-processing/scripts/check-wap-class-conformance.mjs`.
