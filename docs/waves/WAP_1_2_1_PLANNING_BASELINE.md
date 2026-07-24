# WAP 1.2.1 / WML 1.3 Planning Baseline

Version: v1.0

Planning status: complete for the selected strict profile

Implementation status: pre-conformance

## Purpose

This document is the closure checkpoint for source ingestion, specification
selection, obligation extraction, implementation mapping, and work planning.
It does not claim that the browser is compliant.

The target is the exact WAP-215 Class C data-client profile
`CCR-CLASSC-C-001`, with WAP 1.2.1 and WML 1.3 observable behavior as the
strict compatibility floor. Modern internals and additive features are
allowed only when they preserve strict results or are isolated behind an
explicit capability/mode.

## Planning closure

| Control plane | Closed planning state |
|---|---|
| Release source | 97/97 technical members have verified private PDFs and non-empty text extractions; 21 are already canonical and 76 remain outside Git pending redistribution guidance |
| Class selection | WAP-215's six Class A/B/C client/server graphs are extracted; `CCR-CLASSC-C-001` is the declared first-release profile |
| Effective specifications | Every selected family has an ordered base/SIN chain and successor sources cannot silently replace the target release |
| Selected obligations | 712 effective source rows reduce to 201 selected parent rows across nine mandatory families |
| Nested clauses | The 201 parents expand into 781 clauses: 738 required, 31 recommended, and 12 permitted |
| Crosswalk | Every selected parent has source anchors, strict disposition, requirement IDs, owner layers, work items, and an evidence state |
| Fixtures | All 781 planned clause fixtures have target locations; 0 clauses have direct conformance assessment |
| Successor delta | All 201 selected rows are classified; 17 have successor-derived foundations, with 2 compatible and 15 requiring strict correction |
| External dependencies | 43 authority-locked dependencies have 48 private artifacts; 60 residual labels are explicitly non-blocking for Class C and profile-activated |
| Execution program | 13 dependency-ordered sprints contain 78 unique work items with machine-checked rollups |

`SRC-006` is the only blocked source item. It prevents public promotion of
recovered source binaries/derivatives, not internal evidence use,
implementation, or fixture construction.

## Conservative implementation snapshot

Parent-level status is an audit snapshot, not a compliance percentage:

| Family | Selected parents | Clauses | Implemented | Partial | Missing |
|---|---:|---:|---:|---:|---:|
| WML | 39 | 174 | 2 | 23 | 14 |
| WAE | 11 | 39 | 5 | 3 | 3 |
| WBXML | 3 | 48 | 0 | 1 | 2 |
| WMLScript | 41 | 107 | 0 | 23 | 18 |
| WMLScript Libraries | 80 | 211 | 0 | 14 | 66 |
| Caching | 5 | 68 | 0 | 3 | 2 |
| WDP | 9 | 49 | 0 | 9 | 0 |
| WCMP | 5 | 28 | 0 | 0 | 5 |
| WSP | 8 | 57 | 0 | 8 | 0 |
| **Total** | **201** | **781** | **7** | **84** | **110** |

Even the seven parent rows marked implemented still require direct
source-derived clause evidence. Until the 781 clause fixtures are implemented
and assessed, the project must remain `pre-conformance`.

## Work-program state

The 78 work items currently roll up to:

- 12 done (source/profile/governance planning);
- 1 blocked (`SRC-006`, external redistribution permission);
- 11 in progress (existing runtime, WAE, transport, and WSP foundations);
- 54 todo.

New completion claims should follow the machine dependency graph:

1. Run `WML-2` and `TRN-7` in parallel after the completed `CONF-1` planning
   gate.
2. Complete `WML-3` after `WML-2`.
3. Complete `REN-4` and `WMLS-5` after `WML-3`.
4. Complete `WAE-6` after runtime, rendering, and script dependencies.
5. Complete `WSP-8` after both `TRN-7` and `WAE-6`.
6. Close native/WASM/end-to-end evidence in `INT-9`.
7. Apply the strict compatibility and build gate in `REL-10`.
8. Activate `OPT-11` profiles and `ENH-12` improvements only after the strict
   release gate, unless work is isolated research that cannot alter strict
   behavior.

Existing work in a downstream sprint may provide a foundation, but the sprint
cannot be declared complete before its upstream gates.

## Intentional non-blocking queues

These are bounded activation gates, not missing selected-profile planning:

- 60 residual external citations: 3 optional/informative content or language
  labels, 45 non-selected bearer/radio labels, and 12 optional WTLS crypto
  labels;
- WAP-237 optional media and later OMA follow-on successor deltas;
- effective WTP extraction and evidence, activated only when
  connection-oriented WSP is claimed;
- optional WTLS, WIM, Push, WTA/WTAI, UAProf, WMLScript Crypto, and other
  declared capability profiles;
- public source promotion after explicit redistribution/derivative approval.

Activating one of these capabilities must activate its source, obligation,
fixture, and release-evidence gates. It must not silently expand the Class C
claim.

## Remaining implementation outcome

The remaining build work is now measurable:

1. close or correct the 84 partial and 110 missing parent rows;
2. implement and assess all 781 direct clause fixtures;
3. correct the 15 successor-derived foundations that are not yet proven
   strict-target compatible;
4. preserve native Rust/WASM behavior parity and generated contract
   boundaries;
5. pass runtime, transport, host, integration, production-build, and release
   evidence gates before making a compatibility claim.

## Authority and validation

The machine authorities are:

- `spec-processing/source-manifests/wap-1.2.1-release.json`
- `spec-processing/source-manifests/wap-1.2.1-effective-spec.json`
- `spec-processing/source-manifests/wap-1.2.1-class-conformance.json`
- the nine `wap-1.2.1-*-scr.json` family ledgers
- `spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json`
- `spec-processing/source-manifests/wap-1.2.1-successor-delta.json`
- `docs/waves/wap-1.2.1-compliance-program.json`

Run the planning gate with:

```sh
node spec-processing/scripts/check-wap-release-manifest.mjs
node spec-processing/scripts/check-wap-ingestion-status.mjs
node spec-processing/scripts/check-wap-effective-spec.mjs
node spec-processing/scripts/check-wap-class-conformance.mjs
node scripts/check-wap-external-dependencies.mjs
node spec-processing/scripts/check-wap-external-ingestion-status.mjs
node scripts/check-wap-conformance-ledger.mjs
node scripts/check-wap-selected-normative-clauses.mjs
node scripts/check-wap-delta-register.mjs
node scripts/check-wap-compliance-program.mjs
node scripts/check-requirement-status-drift.mjs
```

Human rollups are explanatory. If a rollup conflicts with the machine
authorities, fix the rollup and its drift check rather than changing the
evidence to match prose.
