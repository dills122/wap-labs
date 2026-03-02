# Docling Rerun Base Delta Report (2026-03-02)

## Scope

Input set processed from `tmp/docling-rerun`:

- `6` core files
- `7` ext files

Total: `13` markdown files.

## Cleaning output

Companion cleaned files were generated next to each input:

- `<original>.cleaned.md`

Batch cleanup report:

- `tmp/docling-rerun/cleanup-report.txt`

## Cleanup summary

From `cleanup-report.txt`:

- Files cleaned: `13`
- Raw lines: `21371`
- Cleaned lines: `19959`
- Removed artifact lines: `1334`
- `Table N.` captions detected: `38`
- Captions with normalized markdown tables near caption: `38`

## Compliance/work-item delta impact

Result of this base 13-file rerun wave:

- Net-new high-impact compliance misses discovered: none beyond currently tracked closure lanes.
- Existing closure lanes remain correct:
  - Transport: `T0-08..T0-14`
  - WMLScript: `W0-06..W1-05`
  - WML full-stack: `R0-01..R0-08`

This pass materially improved source-cleaning confidence for the core transport + WMLScript set and removed table-normalization ambiguity for this wave.

## Notes

- This base rerun report complements:
  - `docs/waves/DOCLING_RERUN_REMAINING_DELTA_REPORT_2026-03-02.md`
- Together, the two rerun waves cover all currently in-scope high-value source families.
- Follow-up governance and promotion work is tracked in `docs/waves/WORK_ITEMS.md` Phase `S1` (`S1-01`..`S1-06`).
