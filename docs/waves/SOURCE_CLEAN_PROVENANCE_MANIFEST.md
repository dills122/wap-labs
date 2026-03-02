# Source-Clean Provenance Manifest

Append-only log for spec extraction/cleanup provenance snapshots.
Each run snapshot records source markdown path, canonical source PDF path,
cleaned artifact paths, line deltas, table-caption outcomes, and parse profile.

## Run Snapshot 2026-03-02

- Profile: `docling:dlparse_v4,no-ocr,image-placeholder`
- Source cleanup reports:
  - `tmp/docling-rerun/cleanup-report.txt`
  - `tmp/docling-rerun-remaining/cleanup-report.txt`
- Generated per-file provenance CSV:
  - `docs/waves/provenance/docling-provenance-2026-03-02.csv`
- Snapshot totals:
  - Files: `48`
  - Raw lines: `55486`
  - Cleaned lines: `51442`
  - Removed artifact lines: `3926`
  - Table captions: `70`
  - Normalized tables (automated detector): `69`
  - Canonical cleaned corpus file count: `48`
- Notes:
  - Automated detector false-positive for `WAP-191_104` `Table 1` is manually resolved in `docs/waves/DOCLING_RERUN_REMAINING_DELTA_REPORT_2026-03-02.md`.

## Run Snapshot 2026-03-02

- Profile: `docling:dlparse_v4,no-ocr,image-placeholder`
- Source cleanup reports:
  - `tmp/docling-rerun/cleanup-report.txt`
  - `tmp/docling-rerun-remaining/cleanup-report.txt`
- Generated per-file provenance CSV:
  - `docs/waves/provenance/docling-provenance-2026-03-02.csv`
- Snapshot totals:
  - Files: `48`
  - Raw lines: `55486`
  - Cleaned lines: `51442`
  - Removed artifact lines: `3926`
  - Table captions: `70`
  - Normalized tables (automated detector): `69`
  - Canonical cleaned corpus file count: `48`
- Notes:
  - Automated detector false-positive for `WAP-191_104` `Table 1` is manually resolved in `docs/waves/DOCLING_RERUN_REMAINING_DELTA_REPORT_2026-03-02.md`.
