# Waves Spec Coverage Dashboard

Version: v0.2
Status: Active

## Coverage status

### Corpus ledger

- Doc: `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`
- Scope: all canonical root-level source PDFs under `spec-processing/source-material` (98 files)
- Status: all 98 canonical PDFs are `deep-extracted`
- Primary target: WAP 1.2.1 with WML 1.3
- Target-source status: 21/97 byte-exact, 4/97 same-name/content-different,
  72/97 missing from the canonical PDF corpus
- Private target-source status: all 97 release members plus WAP-215 are
  byte/hash verified outside Git; public promotion remains permission-gated
- Selected profile: exact WAP-215 Class C client `CCR-CLASSC-C-001`
- Important: `deep-extracted` describes review of the current WAP 2.0-heavy
  local corpus. It is not evidence that the WAP 1.2.1 target source set or
  implementation is complete.
- Target source baseline:
  `docs/waves/WAP_1_2_1_SOURCE_BASELINE.md`
- Parsing validation: docling rerun parsing completed for all current high-value in-scope source families (`48` canonical files total across prior and remaining rerun waves) plus `2` supplemental context-source parses (`WAP.pdf`, Wiley tech brief)

### Completed traceability domains

1. Runtime-markup (WML/WBXML)
- Doc: `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-191*` (WML + SIN lineage)
  - `WAP-192*` (WBXML + SIN lineage)
- WBXML ledger:
  - `spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json`
  - 15 active rows and 3 selected Class C client rows
  - selected audit: 0 implemented, 1 partial, 2 missing
  - direct normative test evidence: 0/3; one subprocess-boundary test linked

2. WMLScript runtime/VM
- Doc: `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-193-WMLScript-20001025-a`
  - `WAP-193_101-WMLScript-20010928-a`
  - `WAP-194-WMLScriptLibraries-20000925-a`
  - `WAP-194_103-WMLScriptLibraries-20020318-a`
- Ledgers:
  - `spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json`
  - 112 rows and 41 selected Class C interpreter rows
  - selected audit: 0 implemented, 23 partial, 18 missing
  - `spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json`
  - 95 rows and 80 selected Class C interpreter rows
  - selected audit: 0 implemented, 14 partial, 66 missing
  - direct normative test evidence: 0/121 selected rows

3. WAE user-agent behavior and media framework
- Doc: `docs/waves/WAE_SPEC_TRACEABILITY.md`
- Strict-target sources:
  - `WAP-190-WAESpec-20000329-a`
  - `WAP-190_101`, `_102`, `_103`, and `_104` approved SINs
  - WAP-215 `WAESpec:MCF` Class C selection
- Ledger:
  - `spec-processing/source-manifests/wap-1.2.1-wae-scr.json`
  - 86 active rows, 22 SIN-removed rows, and 11 selected Class C client rows
  - selected audit: 5 implemented, 3 partial, 3 missing
- Caching ledger:
  - `spec-processing/source-manifests/wap-1.2.1-caching-scr.json`
  - 11 WAP-120 rows and 5 selected Class C user-agent rows
  - selected audit: 0 implemented, 3 partial, 2 missing
  - direct normative test evidence: 0/5
- Successor delta sources:
  - `WAP-236-WAESpec-20020207-a`
  - `WAP-237-WAEMT-20010515-a` (optional-media delta still pending)

4. Transport rewrite stack
- Doc: `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-230-WSP-20010705-a`
  - `OMA-WAP-TS-WSP-V1_0-20020920-C`
  - `WAP-224-WTP-20010710-a`
  - `OMA-WAP-224_002-WTP-SIN-20020827-a`
  - `WAP-259-WDP-20010614-a`

5. Transport-adjacent interoperability and adaptation boundaries
- Doc: `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-229*` (Wireless Profiled HTTP + SIN)
  - `WAP-223*` (HTTP state management + SIN)
  - `WAP-225` (Wireless Profiled TCP)
  - `WAP-202` (WCMP)
  - `WAP-159` (WDP/WCMP adaptation over SMPP)

6. Security boundary mapping
- Doc: `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`
- Sources:
  - `WAP-261*` (WTLS + SIN)
  - `WAP-199-WTLS-20000218-a.pdf` (legacy WTLS lineage)
  - `WAP-219*` (TLS profile + SIN)
  - `WAP-187*` (Transport E2E security + SIN)

7. Security PKI/WIM profile boundary
- Doc: `docs/waves/SECURITY_PKI_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-211*`, `OMA-WAP-211_105` (certificate profile)
  - `WAP-217*`, `OMA-WAP-217_105` (WPKI/trusted CA info)
  - `WAP-260*`, `OMA-WAP-260_100`, `OMA-WAP-260_101` (WIM profile)

8. Architecture-context review
- Doc: `docs/waves/ARCHITECTURE_CONTEXT_SPEC_REVIEW.md`
- Sources:
  - `WAP-210` (WAP architecture)
  - `WAP-196` (Client ID)
  - `WAP-188` (general formats context)

9. Deferred capability traceability
- Doc: `docs/waves/DEFERRED_CAPABILITY_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-161*` (WMLScript crypto library)
  - `WAP-248` (UAProf)

10. Out-of-scope domain review
- Doc: `docs/waves/OUT_OF_SCOPE_DOMAIN_SPEC_REVIEW.md`
- Sources:
  - push/provisioning/messaging-sync/wtai/presentation/xhtmlmp/misc families

11. Contract + test governance artifacts
- Docs:
  - `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
  - `docs/waves/SPEC_TEST_COVERAGE.md`

12. Supplemental context-source governance
- Doc: `docs/waves/ARCHITECTURE_CONTEXT_SPEC_REVIEW.md`
- Sources:
  - `WAP.pdf`
  - `vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf`
- Scope:
  - context reinforcement only; no new normative requirement authority without canonical WAP/OMA source anchoring

## Open coverage gaps

0. Effective WAP-191 full-stack conformance closure (76 actor-specific SCR IDs)
- Status: in progress (source ledger + mandatory code audit complete; clause,
  optional-capability, and release evidence pending)
- Selected-profile scope: 39 required Class C client rows, 27 optional client
  rows, and 10 server/encoder rows not applicable to the client
- Deliverables:
  - `spec-processing/source-manifests/wap-1.2.1-wml-scr.json`
  - `docs/waves/WAP_1_2_1_WML_SCR_LEDGER.md`
  - `docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md`
  - Phase R tickets in `docs/waves/WORK_ITEMS.md` (`R0-01`..`R0-08`)

0a. Effective WAP-192 WBXML conformance closure (15 actor-specific SCR IDs)
- Status: in progress (source ledger and selected-client code audit complete;
  nested clauses and direct normative fixtures pending)
- Selected-profile scope: 3 required Class C client rows and 12
  server/document/encoder rows outside the client profile
- Deliverables:
  - `spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json`
  - `docs/waves/WAP_1_2_1_WBXML_SCR_LEDGER.md`
  - `RQ-RMK-010` in `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
  - corrective fixture/tooling closure in `R0-08` and `WML-203`

0b. WAP-120 caching conformance closure (11 actor-specific SCR IDs)
- Status: in progress (source ledger and selected-client audit complete;
  explicit zero-byte-cache policy, normative fixtures, and implementation
  closure pending)
- Selected-profile scope: 5 required Class C user-agent rows; one optional
  user-agent row and all five gateway rows remain outside the selected client
  profile
- Deliverables:
  - `spec-processing/source-manifests/wap-1.2.1-caching-scr.json`
  - `docs/waves/WAP_1_2_1_CACHING_SCR_LEDGER.md`
  - `RQ-WAE-008` in `docs/waves/WAE_SPEC_TRACEABILITY.md`
  - corrective closure in `WAE-603`

1. WMLScript bedrock conformance closure (`WAP-193_101` + `WAP-194/194_103`)
- Status: in progress (exact source ledgers and implementation audit complete;
  nested clauses, direct fixtures, implementation, and CI closure pending)
- Deliverables:
  - `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md` (active baseline + bedrock priority groups)
  - `docs/waves/WAP_1_2_1_WMLSCRIPT_SCR_LEDGER.md`
  - `docs/waves/WAP_1_2_1_WMLSCRIPT_LIBRARIES_SCR_LEDGER.md`
  - `spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json`
  - `spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json`
  - Phase W/W1 tickets in `docs/waves/WORK_ITEMS.md` (`W0-05`..`W0-08`, `W1-01`..`W1-07`)
- Priority closure focus:
  - actual WAP-193 compilation-unit and instruction decoding
  - external-call/pragma/access-control conformance
  - content-type routing for WMLScript payloads
  - core function/local/conversion/error semantics
  - Lang, Float, String, URL, WMLBrowser, and Dialogs exact IDs/behavior

2. Transport bedrock conformance closure (`WAP-259`, `WAP-224`, `WAP-230`)
- Status: in progress (cleaned-source table-grounded closure lane added)
- Deliverables:
  - `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md` (`RQ-TRN-016`..`RQ-TRN-019`)
  - Phase T tickets in `docs/waves/WORK_ITEMS.md` (`T0-08`..`T0-11`, `T0-14`, `T0-15`)
- Priority closure focus:
  - WTP TID/MPL replay-window behavior
  - WSP connectionless primitive-profile gating
  - WSP assigned-number registry fidelity (PDU/abort/header/parameter maps)
  - WSP capability negotiation and bounds enforcement

3. Networking target-profile decision and migration gates (`gateway bridge` -> `in-process WAP transport`)
- Status: in progress (decision ticket added; implementation unchanged)
- Deliverables:
  - `docs/waves/TECHNICAL_ARCHITECTURE.md` profile decision update
  - `docs/waves/WORK_ITEMS.md` ticket `T0-14`
- Priority closure focus:
  - explicit near-term vs target-state profile declaration
  - contract stability rules across profile transitions
  - promotion gates tied to protocol fixture coverage

4. Contract-level requirement mapping
- Status: complete
- Deliverable:
  - `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`

5. AC-to-test inventory
- Status: complete (initial matrix)
- Deliverable:
  - `docs/waves/SPEC_TEST_COVERAGE.md`
- Remaining work:
  - promote `planned` rows into implemented tests per project backlog

6. Spec-processing quality governance
- Status: complete (manual governance lane implemented; no CI coupling)
- Deliverables:
  - Phase S1 tickets in `docs/waves/WORK_ITEMS.md` (`S1-01`..`S1-06`)
  - `docs/waves/archive/reports/DOCLING_RERUN_BASE_DELTA_REPORT_2026-03-02.md`
  - `docs/waves/archive/reports/DOCLING_RERUN_REMAINING_DELTA_REPORT_2026-03-02.md`
  - `spec-processing/README.md`
  - `docs/waves/SOURCE_CLEAN_PROVENANCE_MANIFEST.md`
  - `docs/waves/provenance/docling-provenance-2026-03-02.csv`
  - `docs/waves/archive/reports/DOCLING_CLEANED_QUALITY_REPORT_2026-03-02.md`
- Focus:
  - table-fidelity ambiguity resolution
  - cleaned-markdown stability and provenance tracking
  - extraction-noise regression visibility
- Current checkpoint:
  - All `S1` items (`S1-01`..`S1-06`) are closed.


## Quality gate summary

1. Every new ticket must include a `Spec` field with section refs/SCR IDs.
2. Every `M` requirement must have AC checklist items.
3. Optional (`O`) requirements must be marked as:
- feature-gated
- deferred
- intentionally out-of-scope
4. Every `RQ-*` entry must include an `Evidence` line pointing to tests/fixtures/commands.

## Navigation

1. Master audit plan:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
2. Work items:
- `docs/waves/WORK_ITEMS.md`
3. Contract mapping:
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
4. Test coverage matrix:
- `docs/waves/SPEC_TEST_COVERAGE.md`
5. Supplemental context audit:
- `docs/waves/archive/reports/SUPPLEMENTAL_SOURCE_CONTEXT_GAP_AUDIT_2026-03-05.md`
6. Source authority policy:
- `docs/waves/SOURCE_AUTHORITY_POLICY.md`
7. Requirement index:
- `docs/waves/REQUIREMENT_INDEX.md`
8. Open policy questions:
- `docs/waves/OPEN_SPEC_QUESTIONS.md`
