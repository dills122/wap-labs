# Docling Rerun Remaining Delta Report (2026-03-02)

## Scope

Input set processed from `tmp/docling-rerun-remaining`:

- `15` core files (`runtime-markup`, `wmlscript`, `wae`, `architecture-context`)
- `20` ext files (`security`, `security-pki`, `deferred`)

Total: `35` markdown files.

## Cleaning output

Companion cleaned files were generated next to each input using the naming convention:

- `<original>.cleaned.md`

Example:

- `tmp/docling-rerun-remaining/core/WAP-191_104-WML-20010718-a.md`
- `tmp/docling-rerun-remaining/core/WAP-191_104-WML-20010718-a.cleaned.md`

Batch cleanup report:

- `tmp/docling-rerun-remaining/cleanup-report.txt`

## Cleanup summary

From `cleanup-report.txt`:

- Files cleaned: `35`
- Raw lines: `34115`
- Cleaned lines: `31483`
- Removed artifact lines: `2592`
- `Table N.` captions detected: `32`
- Captions with normalized markdown tables near caption: `31`

### Table normalization ambiguity

One caption remains flagged non-normalized by automated detection:

- `WAP-191_104-WML-20010718-a` -> `Table 1.`

Note: this appears to be a mixed prose/table region and may require manual spot-check against PDF if strict table fidelity is required for that section.

## Compliance/work-item delta impact

Result of this remaining 35-file rerun wave:

- Net-new high-impact compliance misses: `none` beyond currently tracked closure lanes.
- Existing closure lanes remain the correct execution plan:
  - Transport: `T0-08..T0-14`
  - WMLScript: `W0-06..W0-08`, `W1-01..W1-05`
  - WML full-stack: `R0-01..R0-08`

This pass increases confidence in extracted source fidelity but does not introduce additional bedrock tickets at this time.

## Updated documentation status

Rerun-validation status has been recorded in:

- `docs/waves/RUNTIME_MARKUP_SPEC_TRACEABILITY.md`
- `docs/waves/WMLSCRIPT_SPEC_TRACEABILITY.md`
- `docs/waves/WAE_SPEC_TRACEABILITY.md`
- `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`
- `docs/waves/SECURITY_PKI_SPEC_TRACEABILITY.md`
- `docs/waves/ARCHITECTURE_CONTEXT_SPEC_REVIEW.md`
- `docs/waves/DEFERRED_CAPABILITY_SPEC_TRACEABILITY.md`
- `docs/waves/SOURCE_MATERIAL_MASTER_AUDIT.md`
- `docs/waves/SOURCE_MATERIAL_REVIEW_LEDGER.md`
- `docs/waves/SPEC_COVERAGE_DASHBOARD.md`
- `docs/waves/WAVENAV_PLATFORM_COMPLIANCE_ANALYSIS.md`

