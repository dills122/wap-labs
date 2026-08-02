# WAP 1.2.1 / WML 1.3 Static Conformance Ledger

Version: v0.3
Status: source extraction complete; mandatory implementation audit complete;
WAP-215 Class C profile applied; selected nested clauses planned;
optional-capability assessment pending

## Purpose

This is the first line-item conformance increment for the WAP 1.2.1 / WML
1.3 compatibility target. It converts the effective WML static conformance
statement into a machine-checkable obligation ledger without claiming that
the project already implements or tests those obligations.

Machine-readable authority:

- `spec-processing/source-manifests/wap-1.2.1-wml-scr.json`
- `spec-processing/source-manifests/wap-1.2.1-class-conformance.json`
- `spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json`

Validation:

```sh
node scripts/check-wap-conformance-ledger.mjs
node scripts/check-wap-selected-normative-clauses.mjs
node scripts/wap-context-pack.mjs WML-201
pnpm wap-graph:check
```

The generated WML-201 projection treats this ledger as the direct 76-row
matrix authority. Every row retains its spec anchor and one conservative
evidence state: 34 `direct-test-linked`, 14 `gap-work-item-mapped`, or 28
`optional-not-assessed`. All 175 selected WML clauses directly map to
`WML-201`; the graph does not infer implementation from family ownership or
prose.

## Effective source chain

The ledger applies the locked WML family precedence:

1. `WAP-191-WML`
2. `WAP-191_102-WML`
3. `WAP-191_104-WML`
4. `WAP-191_105-WML`

`WAP-191_104` is the effective WML 1.3 publication containing the 75-row
section 15 statement. `WAP-191_105` section 3.3 adds optional
`WML-C-76` (`tabindex support`) to section 15.1.5.

Both extraction-source hashes are checked against the release lock and
effective-spec graph. Recovered PDFs and extracted text remain outside Git
under the repository's metadata-only redistribution policy.

## Result

| Actor named by the SCR | Items | Mandatory | Optional |
|---|---:|---:|---:|
| WML user agent | 61 | 39 | 22 |
| WML encoder | 4 | 2 | 2 |
| WML document — server | 6 | 6 | 0 |
| WML document — client | 5 | 0 | 5 |
| **Total** | **76** | **47** | **29** |

The commonly used shorthand `WML-C-01..WML-C-76` is inaccurate. The effective
identifier sequence is:

- `WML-C-01..WML-C-59`;
- `WML-S-60..WML-S-69`;
- `WML-C-70..WML-C-76`.

The `C` and `S` prefixes distinguish client and server-side conformance
actors. They are not WAP device Class C/Class S labels.

Applying WAP-215 `CCR-CLASSC-C-001` and its `WML:MCF` dependency produces the
selected browser scope:

| Selected Class C disposition | Rows | Meaning |
|---|---:|---|
| Required | 39 | Mandatory WML user-agent rows |
| Optional, not required | 27 | 22 optional user-agent rows plus 5 optional client-document rows |
| Not applicable to client | 10 | 4 encoder rows plus 6 server-document rows |

## Accounted fields

Every obligation records:

- exact SCR identifier and ordinal;
- actor, feature, referenced clause, and mandatory/optional status;
- source document and static-conformance subsection;
- dependency expression;
- strict disposition and a separate Class C applicability state;
- implementation domain and owning project layers;
- existing `RQ-*` groups and additive Phase R work items;
- implementation status, code symbol, exact test/command, and evidence state.

The source table contains one explicit SCR dependency:
`WML-C-32` (`img`) depends on `WML-C-54` (display of the `alt` attribute).

## Current disposition

- Mandatory rows are `required-for-claimed-actor`.
- Optional rows must be explicitly declared implemented or deferred.
- Mandatory user-agent rows are `required-by-class-c-client-mcf`.
- Optional user-agent and client-document rows are
  `optional-not-required-by-class-c-client`.
- Encoder and server-document rows are
  `not-applicable-to-class-c-client`.
- Enhancements are never allowed to replace strict behavior.
- Every mandatory row maps to a substantive implementation work item in
  addition to `R0-01`.
- Direct executable evidence is linked for `34/76` rows. Existing thematic
  tests are counted only when their path, test name, command, code symbol, and
  limitation are reviewed against the exact SCR feature.

### Mandatory implementation audit

| Assessment | Mandatory rows | Meaning |
|---|---:|---|
| `implemented` | 23 | Direct code/test evidence covers the SCR feature; profile applicability and release gates still apply |
| `partial` | 10 | Direct behavior exists, but the cited clause has known uncovered semantics |
| `missing` | 14 | No conforming implementation path exists; a substantive Phase R work item is attached |

The 23 implemented rows are `WML-C-07`, `WML-C-08`, `WML-C-09`, `WML-C-10`,
`WML-C-11`, `WML-C-12`, `WML-C-13`, `WML-C-14`, `WML-C-16`, `WML-C-18`,
`WML-C-21`, `WML-C-24`, `WML-C-25`, `WML-C-29`, `WML-C-30`, `WML-C-35`,
`WML-C-37`, `WML-C-38`, `WML-C-39`, `WML-C-42`, `WML-C-47`, `WML-C-48`,
and `WML-C-53`. WML-304 closes the selected `go` and `postfield` request
serialization behavior with byte-exact form-urlencoded and multipart transport
evidence. Across the 39 required Class C client rows, the audit currently records
23 implemented, 10 partial, and 6 missing. This is not a compliance percentage: nested normative
clauses, optional capabilities, cross-target parity, and release evidence
still have separate gates.

The first `CONF-003` slice now expands all 39 selected WML rows into 175
deduplicated, section-hash-anchored clauses. Every clause has an inherited
owner/work mapping and a direct fixture plan. The WML family now has 143
implemented clause fixtures with reviewed direct evidence, including the
completed WML-202 through WML-205 slices and the WML-302/WML-303 runtime
slices plus WML-305 timer, WML-301 context/history/card-table closure, the ten directly
assessed WML-304 request-serialization clauses including multipart per-part typing, typed POST-history replay, and WML-309
frame-affordance closure; shared clauses are deduplicated. The other 32 clauses stay
`not-assessed`, and the parent-row implementation audit remains conservative.

Outside the 39 required Class C rows, `WML-C-34` (`meta`) behavior and the
`WML-C-72` mutually exclusive property identity rule now have parser tests.
Their ledger states remain `optional-not-assessed` until the separate
capability-declaration pass activates the broader optional-profile gate.

The 6 missing required Class C client rows are:

- task/structure: `WML-C-20`, `WML-C-52`;
- rendering/media: `WML-C-32`, `WML-C-49`, `WML-C-50`,
  `WML-C-54`;

`WML-C-46` is now partial: table structure and card-edge line boundaries are
directly tested, while exact column normalization, alignment designators, and
non-zero gutter layout remain explicit gaps.

The source-wide mandatory audit additionally tracks eight missing
encoder/server requirements (`WML-S-60`, `WML-S-61`, and `WML-S-64..69`).
They remain in the ledger for complete WML source coverage but do not count
toward the selected Class C client profile.

This means source-level WML SCR coverage and the first mandatory code-evidence
audit are complete, but implementation and release conformance are not.

## Next pass

1. Implement and review the 175 source-derived direct clause fixtures.
2. Add cross-target and cross-layer strict-mode outcomes to the linked tests.
3. Split broad Phase R work items only where a required clause lacks a
   deterministic acceptance lane.
4. Assess the 27 optional client rows and publish the capability declaration.
5. Carry the selected WAP-215 profile mapping into the remaining release
   families.
