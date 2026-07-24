# WAP 1.2.1 Selected-Profile Successor Delta Register

Version: v0.1
Status: `CONF-007` complete for the selected Class C profile

## Purpose

Keep successor-era specifications useful without allowing them to redefine the
WAP 1.2.1 / WML 1.3 compatibility floor. The register classifies all
201/201 selected rows and distinguishes actual successor-derived implementation
foundations from target-era, version-neutral, missing, and successor-only
behavior.

Machine-readable authority:

- `spec-processing/source-manifests/wap-1.2.1-successor-delta.json`

Validation:

```sh
node scripts/check-wap-delta-register.mjs
node scripts/check-requirement-status-drift.mjs
```

Regeneration uses the selected family and clause ledgers plus the four local,
hash-locked successor authorities:

```sh
node spec-processing/scripts/generate-wap-delta-register.mjs \
  --recorded-on YYYY-MM-DD
```

## Result

The register identifies 17 successor-derived implementation foundations:

| Disposition | Selected rows | Meaning |
|---|---:|---|
| Compatible | 2 | Successor mapping preserves the target behavior, subject to direct target-fixture proof |
| Strict correction required | 15 | Current successor-oriented behavior cannot close the target row without target-era correction and fixtures |
| Not successor-derived | 184 | Missing, target-era, or version-neutral behavior; no successor substitution is claimed |
| **Total** | **201** | **Every selected Class C row** |

Of the 17 successor-derived foundations, 15 require strict correction and two
are compatible planning classifications.

This is a planning classification, not conformance evidence. Clause
implementation remains `not-assessed` until direct target-era fixtures and
code/test review establish the strict outcome.

## Family posture

- WAE: 8 implemented/partial foundations are cross-checked against the
  existing WAP-236 delta. Two preserved/subsumed mappings are compatible; six
  expanded, split, relaxed, or decomposed mappings require strict correction.
- WML: `WML-C-17` uses WML2 compatibility behavior and requires WML 1.3
  correction/proof. The other selected rows have no identified
  successor-derived implementation basis.
- WSP: all eight selected partial rows use successor-oriented tables or
  synthetic cases and require correction against effective WAP-203/SIN
  clauses.
- WDP and WCMP: WAP-259 remains family delta context. Existing WDP UDP/IP
  foundations are target-version-neutral; selected WCMP behavior is missing.
- WBXML, WMLScript, WMLScript Libraries, and caching: no selected-row
  successor-derived implementation basis is currently identified.

## Successor-only boundary

The register separately records five successor-only capability examples. They
cannot satisfy strict rows and require an explicit successor or extension
capability. This includes WAP-236-only WAE capabilities, WSP assigned numbers
or defaults absent from WAP-203, and WML2-only markup/processing behavior.

## Authority and enhancement policy

WAP-236, WAP-238, WAP-259, and WAP-230 are cryptographically locked as
delta-evidence-only sources. Target-era specifications and SIN precedence
remain normative.

Modern internals, richer behavior, and successor capabilities are welcome
when they preserve strict observable behavior or are isolated behind an
explicit capability. They may not replace a strict requirement merely because
the later design is safer, broader, or more convenient.
