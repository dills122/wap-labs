# Waves Spec Coverage Dashboard

Version: v0.1  
Status: Active

## Coverage status

### Corpus ledger

- Doc: `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`
- Scope: all canonical root-level source PDFs under `docs/source-material` (94 files)
- Status: all 94 canonical PDFs are `deep-extracted`

### Completed traceability domains

1. Runtime-markup (WML/WBXML)
- Doc: `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-191*` (WML + SIN lineage)
  - `WAP-192*` (WBXML + SIN lineage)

2. WMLScript runtime/VM
- Doc: `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-193-WMLScript-20001025-a`
  - `WAP-193_101-WMLScript-20010928-a`
  - `WAP-194-WMLScriptLibraries-20000925-a`
  - `WAP-194_103-WMLScriptLibraries-20020318-a`

3. WAE user-agent behavior and media framework
- Doc: `docs/waves/WAE_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-236-WAESpec-20020207-a`
  - `WAP-237-WAEMT-20010515-a`

4. Transport rewrite stack
- Doc: `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- Sources:
  - `WAP-230-WSP-20010705-a`
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

## Open coverage gaps

0. WAP-191 full-stack conformance closure (`WML-01..75`)
- Status: in progress (planned execution lane created)
- Deliverables:
  - `docs/waves/WML_191_FULL_STACK_COMPLIANCE_AUDIT.md`
  - Phase R tickets in `docs/waves/WORK_ITEMS.md` (`R0-01`..`R0-08`)

1. WMLScript bedrock conformance closure (`WAP-193_101` + `WAP-194/194_103`)
- Status: in progress (active implementation, bedrock-first closure lane added)
- Deliverables:
  - `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md` (active baseline + bedrock priority groups)
  - Phase W/W1 tickets in `docs/waves/WORK_ITEMS.md` (`W0-05`..`W0-08`, `W1-01`..`W1-05`)
- Priority closure focus:
  - bytecode structural verification gates
  - external-call/pragma/access-control conformance
  - content-type routing for WMLScript payloads
  - core function/local/conversion/error semantics

2. Transport bedrock conformance closure (`WAP-259`, `WAP-224`, `WAP-230`)
- Status: in progress (cleaned-source table-grounded closure lane added)
- Deliverables:
  - `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md` (`RQ-TRN-016`..`RQ-TRN-019`)
  - Phase T tickets in `docs/waves/WORK_ITEMS.md` (`T0-08`..`T0-11`)
- Priority closure focus:
  - WTP TID/MPL replay-window behavior
  - WSP connectionless primitive-profile gating
  - WSP assigned-number registry fidelity (PDU/abort/header/parameter maps)
  - WSP capability negotiation and bounds enforcement

3. Contract-level requirement mapping
- Status: complete
- Deliverable:
  - `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`

4. AC-to-test inventory
- Status: complete (initial matrix)
- Deliverable:
  - `docs/waves/SPEC_TEST_COVERAGE.md`
- Remaining work:
  - promote `planned` rows into implemented tests per project backlog


## Quality gate summary

1. Every new ticket must include a `Spec` field with section refs/SCR IDs.
2. Every `M` requirement must have AC checklist items.
3. Optional (`O`) requirements must be marked as:
- feature-gated
- deferred
- intentionally out-of-scope

## Navigation

1. Master audit plan:
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
2. Work items:
- `docs/waves/WORK_ITEMS.md`
3. Contract mapping:
- `docs/waves/CONTRACT_REQUIREMENTS_MAPPING.md`
4. Test coverage matrix:
- `docs/waves/SPEC_TEST_COVERAGE.md`
