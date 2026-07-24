# WAP 1.2.1 / WML 1.3 Compliance Program

Version: v0.2
Status: active pre-conformance program

## Outcome

The primary target is a data-client implementation compatible with WAP 1.2.1
and WML 1.3 observable behavior. This is a compatibility target, not a claim
of historical WAP Forum certification.

The first strict profile is the exact WAP-215 Class C data client
`CCR-CLASSC-C-001`. Its mandatory client feature groups are WAE, WML, WBXML,
WMLScript, WMLScript libraries, caching, WSP, WDP, and WCMP. WTP becomes
mandatory only when connection-mode WSP is supported. WTLS, WIM, Push,
WTA/WTAI, UAProf, and WMLScript Crypto remain separately declared
capabilities.

The machine-readable execution authority is:

- `docs/waves/wap-1.2.1-compliance-program.json`

Validate it with:

```sh
node scripts/check-wap-compliance-program.mjs
node spec-processing/scripts/check-wap-class-conformance.mjs
node scripts/check-wap-conformance-ledger.mjs
node scripts/check-wap-wae-conformance-ledger.mjs
node scripts/check-wap-wbxml-conformance-ledger.mjs
node scripts/check-wap-wmlscript-conformance-ledger.mjs
node scripts/check-wap-caching-conformance-ledger.mjs
node scripts/check-wap-transport-conformance-ledgers.mjs
```

All nine selected Class C family increments are complete at SCR level:

- 76 effective WML 1.3 SCR rows are extracted;
- 47 are mandatory and 29 optional;
- the selected Class C client scope is 39 required, 27 optional, and 10
  server/encoder rows not applicable to the client;
- all four SCR actors and the `WML-C-32 -> WML-C-54` dependency are preserved;
- every mandatory row has an implementation work-item lane;
- the source-wide mandatory code audit finds 2 implemented, 23 partial, and
  22 missing; the selected 39-row client subset is 2 implemented, 23 partial,
  and 14 missing;
- 25 rows have direct code symbols and runnable test evidence.
- 86 effective WAE SCR rows are extracted after applying the WAP-190 SIN
  chain, with another 22 removed rows retained as historical change records;
- `WAESpec:MCF` selects 11 mandatory WAE client rows, while 40 optional client
  rows and 35 server rows remain explicitly separated;
- the selected WAE audit is 5 implemented, 3 partial, and 3 missing, with
  direct code/test evidence linked to 8 rows;
- all 11 selected WAE concepts are classified against WAP-236 as
  successor-delta evidence without changing the WAP 1.2.1 target.
- 15 effective WBXML 1.3 SCR rows are extracted after applying
  `WAP-192_105`, with 11 mandatory and 4 optional rows;
- `WBXML:MCF` selects exactly three mandatory client rows and leaves 12
  server/document/encoder rows outside the selected client profile;
- the selected WBXML audit is 0 implemented, 1 partial, and 2 missing; the
  single linked test proves the subprocess boundary rather than normative
  decode semantics, so direct normative evidence remains 0/3.
- 112 effective WMLScript rows are extracted from the consolidated
  WAP-193_101 table; `WMLScript:MCF` selects 41 mandatory interpreter rows;
- the selected WMLScript audit is 0 implemented, 23 partial, and 18 missing,
  with zero direct normative WAP bytecode tests;
- 95 effective WMLScript Libraries rows are extracted after adding optional
  `WMLSSL-C-095`; `WMLScriptLibs:MCF` selects 80 mandatory interpreter rows;
- the selected libraries audit is 0 implemented, 14 partial, and 66 missing,
  with zero direct normative library tests;
- source-exact `WMLSSL048` is preserved with normalized alias `WMLSSL-048`.
- 11 WAP-120 caching SCR rows are extracted; `WAPCachingMod:MCF` selects
  exactly five mandatory user-agent rows and leaves optional time
  synchronization plus all gateway rows outside the selected client profile;
- the selected caching audit is 0 implemented, 3 partial, and 2 missing, with
  zero direct normative WAP-120 tests; the current no-storage behavior is
  treated only as a provisional zero-byte-cache profile.
- 317 effective WDP/WCMP/WSP SCR rows are extracted with all actor, M/O,
  source-order, and dependency expressions preserved;
- the selected connectionless transport path resolves to 22 rows: 9 WDP
  using CDPD-shaped UDP/IPv4, 5 general-WCMP rows, and 8 connectionless WSP
  rows;
- the selected transport audit is 0 implemented, 17 partial, and 5 missing,
  with zero direct WAP-200/WAP-202/WAP-203 normative tests;
- connection-oriented WSP and WTP remain a separately activated capability;
  the selected CDPD `TIAEIA-732` citation remains an external-source
  normalization gap.

See `docs/waves/WAP_1_2_1_WML_SCR_LEDGER.md` and
`docs/waves/WAP_1_2_1_WAE_SCR_LEDGER.md`, and
`docs/waves/WAP_1_2_1_WBXML_SCR_LEDGER.md`,
`docs/waves/WAP_1_2_1_WMLSCRIPT_SCR_LEDGER.md`, and
`docs/waves/WAP_1_2_1_WMLSCRIPT_LIBRARIES_SCR_LEDGER.md`, and
`docs/waves/WAP_1_2_1_CACHING_SCR_LEDGER.md`, and
`docs/waves/WAP_1_2_1_TRANSPORT_SCR_LEDGERS.md`.

## Compatibility and enhancement policy

Strict conformance is the floor, not a ceiling.

- Core mechanics must match the selected release and profile.
- Modern implementations, safer internals, improved performance, better
  diagnostics, and modern host UX are encouraged.
- A behavior-preserving improvement must pass strict differential tests.
- A behavior-changing feature must be an explicit Waves capability or
  enhanced mode.
- An enhancement cannot satisfy, replace, or waive a strict obligation.
- Optional WAP profiles remain capability-gated and do not silently expand the
  first release claim.

## Evidence hierarchy

Compliance is accounted for from the source outward:

```text
release member -> effective base/SIN family -> CCR profile dependency
-> SCR feature -> normative clause -> implementation owner
-> ticket -> executable test/evidence -> release claim
```

Source-file counts, thematic requirement groups, completed ticket counts, or
passing unit tests alone are not a compliance percentage. Every mandatory
selected-profile obligation must ultimately have an exact source anchor and
executable evidence.

## Dependency-ordered program

The program contains 13 sprints and 77 unique work items. Existing completed
tickets remain historical facts; the program maps to them where relevant and
adds work only for uncovered obligations.

| Sprint | Scope | Depends on | Exit meaning |
|---|---|---|---|
| `SRC-0` | Authoritative release, assets, class sources, and redistribution posture | — | Source control plane is reproducible |
| `CONF-1` | CCR, SCR, and normative-clause ledgers | `SRC-0` | Selected-profile obligations are one-to-one accountable |
| `WML-2` | Parser, deck model, validation, and WML/WBXML input | `CONF-1` | WML input and deck structure meet strict fixtures |
| `WML-3` | State, tasks, events, forms, and navigation | `WML-2` | Runtime mechanics are deterministic and source-backed |
| `REN-4` | Historical layout, focus, keypad, and softkeys | `WML-2`, `WML-3` | Observable device interaction is reproducible |
| `WMLS-5` | WMLScript language, bytecode, VM, and libraries | `CONF-1`, `WML-3` | Script execution and failure behavior are bounded and compliant |
| `WAE-6` | WAE integration, caching, formats, and content behavior | `CONF-1`, `WML-3`, `REN-4`, `WMLS-5` | Browser-environment behavior closes across engine features |
| `TRN-7` | WDP, WCMP, and conditional WTP core | `CONF-1` | Protocol PDUs, state, bounds, and errors meet vectors |
| `WSP-8` | WSP session/connectionless behavior and host fetch | `CONF-1`, `TRN-7`, `WAE-6` | Native transport reaches the browser contract correctly |
| `INT-9` | Native/WASM parity and end-to-end interoperability | Runtime and transport sprints | Cross-layer strict scenarios have auditable evidence |
| `REL-10` | Strict Class C-compatible release gate | `INT-9` | No mandatory obligation is unmapped and all build gates pass |
| `OPT-11` | Security, Push, telephony, identity, and other optional profiles | `CONF-1`, `REL-10` | Optional capabilities are independently declared and tested |
| `ENH-12` | Behavior-preserving improvements and Waves extensions | `REL-10` | Modern features cannot regress or obscure strict behavior |

## Source acquisition status

Source Sprint `SRC-0` now has reproducible research-access evidence:

- 97/97 technical release PDFs and 97/97 text extractions are hash/size
  recorded in `wap-1.2.1-ingestion-status.json`;
- 39/39 locked external dependencies have acquisition records backed by 45
  artifacts;
- 33 external dependencies have full primary artifacts, two have partial
  historical evidence, and four licensed IEEE/ISO payloads remain
  metadata-only;
- the external open-label queue is reduced from 69 to 63.

WAP-215 has also been recovered from the official live WAP Forum directory,
hash-locked, and extracted into exact Class A/B/C client/server graphs. This
closes `SRC-004` without changing the redistribution boundary.

## Immediate execution order

1. Finish `SRC-0` by normalizing the selected `TIAEIA-732` bearer reference,
   locking remaining normative external dependencies, and resolving the
   redistribution blocker.
2. Treat `CONF-002` family-level SCR extraction as complete. Continue
   `CONF-003` nested-clause extraction across all nine selected families; add
   WTP only when connection-oriented WSP is claimed.
3. Continue the completed first-pass implementation audits into exact
   source-derived fixtures. Do not reopen completed tickets; add narrowly
   scoped gap work.
4. Refresh the master priority plan from the reconciled obligation ledger.
5. Execute the runtime and protocol sprints in dependency order, then close
   cross-layer and release evidence.
6. Start optional profiles and Waves enhancements only after their declared
   strict gates.

## Source blockers

One source action is intentionally blocked:

- `SRC-006`: promote recovered WAP PDFs, DTDs, or parsed derivatives into Git
  only after explicit redistribution approval.

This blocker does not prevent metadata locking, temporary internal extraction,
effective-family modeling, dependency research, or conformance-ledger design.
It prevents public-repository source promotion, not exact Class C profile
selection.

All 97 technical members are already available for private requirement
extraction. `SRC-006` is now blocked only on public promotion/derivative
permission and the subsequent canonical cleanup/provenance workflow, not on
research access.

The detailed WAP-215 recovery evidence, OMA contact route, permission draft,
and Wayback procedure are in
`docs/waves/WAP_SOURCE_RECOVERY_AND_PERMISSION.md`.

## Strict release gate

`REL-10` requires:

1. zero unmapped mandatory selected-profile obligations;
2. exact source, build, fixture, and test identity in the evidence bundle;
3. native Rust and WASM parity for parity-critical engine behavior;
4. passing engine, transport, host, frontend, contract, type, lint, WASM, and
   desktop production-build gates;
5. explicit optional-feature support statements and known deviations;
6. a compatibility statement that identifies `CCR-CLASSC-C-001`, discloses
   optional and conditional profiles, and does not imply formal certification.

The currently known frontend CSS-minification defect is an explicit release
work item (`REL-1004`), so a green unit-test count cannot conceal a red
production build.

## Planning relationship

This program defines target completeness and compliance dependencies.
`docs/waves/SPRINT_PLAN_2026-03_MASTER_PRIORITIZED.md` remains the current
ordering authority for work already in flight. After `CONF-1` reconciles the
selected-profile obligation ledger with existing tickets, the master plan
should be refreshed from that evidence.
