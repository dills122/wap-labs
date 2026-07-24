# WAP 1.2.1 WMLScript Libraries SCR Ledger

Version: v0.1
Status: effective SCR extracted; Class C applied; nested-clause audit pending

## Purpose

Define the exact WMLScript Standard Libraries surface required by the selected
WAP 1.2.1 Class C data client, including the WAP-194_103 immediate-refresh
addition and current implementation gaps.

The machine-readable authority is:

- `spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json`

Validate it with:

```sh
node scripts/check-wap-wmlscript-conformance-ledger.mjs
node scripts/check-wap-conformance-ledger.mjs
```

## Effective authority

The normative sequence is:

1. `WAP-194-WMLScriptLibraries-20000925-a`
2. `WAP-194_103-WMLScriptLibraries-20020318-a`, applied afterward

The base Appendix B contains 94 encoder/interpreter rows. WAP-194_103 adds
`WMLSSL-C-095`, optional support for immediate `WMLBrowser.refresh` behavior.

The selected profile is:

- WAP-215 target: `CCR-CLASSC-C-001`
- selected feature group: `WMLScriptLibs:MCF`
- WAP-221 meaning: every mandatory client/interpreter feature in the SCR

## Effective totals

| Scope | Count |
|---|---:|
| All effective library SCR rows | 95 |
| Mandatory rows, all actors | 93 |
| Optional rows, all actors | 2 |
| Encoder rows | 13 |
| Interpreter rows | 82 |
| Class C-required interpreter rows | 80 |
| Optional interpreter rows | 2 |

The optional rows are base `WMLSSL-017` (floating-point operations) and SIN
row `WMLSSL-C-095` (immediate refresh).

## Historical identifier anomaly

The canonical base PDF visibly prints the mandatory Float.floor identifier as
`WMLSSL048` on page `56(59)`. This is not an extraction artifact. The ledger:

- preserves `WMLSSL048` as the source-exact ID;
- exposes `WMLSSL-048` as a normalized search/planning alias;
- does not silently rewrite the historical table.

The base table otherwise uses `WMLSSL-NNN`; only the SIN-added row uses the
later `WMLSSL-C-095` form. Actor is therefore a separate ledger field derived
from sections 12.4 and 12.5.

## Selected implementation audit

| Result | Rows |
|---|---:|
| Implemented | 0 |
| Partial | 14 |
| Missing | 66 |
| Direct normative tests | 0 |
| Provisional local-test links | 14 |

Related behavior exists for:

- the five scalar value variants and a limited conversion/error boundary;
- a subset of WMLBrowser behavior: `getVar`, `setVar`, `go`, `prev`,
  `newContext`, and `getCurrentCard`;
- placeholder Dialogs request recording for `prompt`, `confirm`, and `alert`.

Those rows remain partial because exact argument conversion, error semantics,
context rules, identifiers, side effects, and nested clauses are not fully
proven.

The principal missing areas are:

- Lang library and all 15 function rows;
- Float library and all required function rows;
- String library and all 16 function rows;
- URL library and all 14 function rows;
- standard library IDs and per-library function IDs;
- `WMLBrowser.refresh`;
- complete Dialogs host/UI result integration.

The current host constants combine WMLBrowser, Dialogs, and non-WAP timer
extensions into a project-specific ID space. That is an internal prototype
boundary, not the standard library/function identifier scheme.

## Work closure

All effective rows map to `WMLS-504` and `W1-05`; existing specialist lanes
remain linked where applicable:

- `WMLS-502` / `W1-04`: shared type and conversion rules;
- `WMLS-503`: URL loading and invocation boundaries;
- `WMLS-505` / `W0-05`: Dialogs and host capability behavior;
- historical `W0-07`: provisional `newContext` and `getCurrentCard` evidence.

`W1-05` is no longer merely an instruction to create a matrix: the exact
matrix and validator now exist. It remains open for implementation, nested
clause extraction, direct fixtures, CI wiring, and release-grade evidence.

## Enhancement policy

The runtime may add richer dialogs, safer string/URL handling, better random
sources, asynchronous host integration, timers, and other named extensions.
Strict mode must still expose the WAP library IDs, conversion rules, return
values, side effects, and error behavior. Non-WAP functions must occupy an
explicit extension namespace/capability mode.

## Source handling

The WAP-194 PDFs, private text extractions, and temporary page image used to
verify `WMLSSL048` remain outside Git pending redistribution approval. The
repository stores identities, hashes, normalized requirements, and audit
evidence only.
