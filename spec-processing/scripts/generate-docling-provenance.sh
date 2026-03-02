#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
DATE_TAG="${1:-2026-03-02}"
PROFILE_TAG="docling:dlparse_v4,no-ocr,image-placeholder"

BASE_REPORT="$ROOT/tmp/docling-rerun/cleanup-report.txt"
REM_REPORT="$ROOT/tmp/docling-rerun-remaining/cleanup-report.txt"
DEST_DIR="$ROOT/spec-processing/source-material/parsed-markdown/docling-cleaned"
CSV_OUT="$ROOT/docs/waves/provenance/docling-provenance-${DATE_TAG}.csv"
MANIFEST="$ROOT/docs/waves/SOURCE_CLEAN_PROVENANCE_MANIFEST.md"
TMP_TSV="$(mktemp)"

if [[ ! -f "$BASE_REPORT" || ! -f "$REM_REPORT" ]]; then
  echo "Missing cleanup reports under tmp/docling-rerun*"
  exit 1
fi

if [[ ! -d "$DEST_DIR" ]]; then
  echo "Missing canonical cleaned dir: $DEST_DIR"
  exit 1
fi

parse_report() {
  local wave="$1"
  local report="$2"
  awk -v wave="$wave" '
    function flush_record() {
      if (file == "") return
      base = out
      sub(/^.*\//, "", base)
      sub(/\.cleaned\.md$/, "", base)
      printf "%s\t%s\t%s\t%s\t%d\t%d\t%d\t%d\t%d\n", wave, file, out, base, raw, cleaned, removed, table_caps, normalized
      file=""
      out=""
      raw=0
      cleaned=0
      removed=0
      table_caps=0
      normalized=0
    }
    /^FILE: / {
      flush_record()
      file = substr($0, 7)
      next
    }
    /^OUT: / {
      out = substr($0, 6)
      next
    }
    /^LINES: / {
      if (match($0, /raw=[0-9]+/)) {
        raw = substr($0, RSTART + 4, RLENGTH - 4) + 0
      }
      if (match($0, /cleaned=[0-9]+/)) {
        cleaned = substr($0, RSTART + 8, RLENGTH - 8) + 0
      }
      if (match($0, /removed_artifacts=[0-9]+/)) {
        removed = substr($0, RSTART + 18, RLENGTH - 18) + 0
      }
      next
    }
    /^TABLE: / {
      if ($0 ~ /none/) next
      table_caps++
      if ($0 ~ /normalized=yes/) normalized++
      next
    }
    END {
      flush_record()
    }
  ' "$report"
}

{
  parse_report "base" "$BASE_REPORT"
  parse_report "remaining" "$REM_REPORT"
} > "$TMP_TSV"

{
  echo "run_date,wave,source_markdown_path,source_pdf_path,cleaned_tmp_path,cleaned_canonical_path,raw_lines,cleaned_lines,removed_artifact_lines,table_captions,normalized_tables,profile"
  while IFS=$'\t' read -r wave source_md cleaned_tmp base raw cleaned removed table_caps normalized; do
    source_pdf="$ROOT/spec-processing/source-material/${base}.pdf"
    if [[ ! -f "$source_pdf" ]]; then
      upper_pdf="$ROOT/spec-processing/source-material/${base}.PDF"
      if [[ -f "$upper_pdf" ]]; then
        source_pdf="$upper_pdf"
      else
        source_pdf="UNRESOLVED:${base}.pdf"
      fi
    fi
    cleaned_canonical="$DEST_DIR/${base}.cleaned.md"
    echo "${DATE_TAG},${wave},${source_md},${source_pdf},${cleaned_tmp},${cleaned_canonical},${raw},${cleaned},${removed},${table_caps},${normalized},${PROFILE_TAG}"
  done < "$TMP_TSV"
} > "$CSV_OUT"

total_rows=$(awk 'END {print NR-1}' "$CSV_OUT")
total_raw=$(awk -F',' 'NR>1 {s+=$7} END {print s+0}' "$CSV_OUT")
total_cleaned=$(awk -F',' 'NR>1 {s+=$8} END {print s+0}' "$CSV_OUT")
total_removed=$(awk -F',' 'NR>1 {s+=$9} END {print s+0}' "$CSV_OUT")
total_caps=$(awk -F',' 'NR>1 {s+=$10} END {print s+0}' "$CSV_OUT")
total_norm=$(awk -F',' 'NR>1 {s+=$11} END {print s+0}' "$CSV_OUT")
canonical_count=$(find "$DEST_DIR" -type f -name '*.cleaned.md' | wc -l | tr -d ' ')

if [[ ! -f "$MANIFEST" ]]; then
  cat > "$MANIFEST" <<EOF
# Source-Clean Provenance Manifest

Append-only log for spec extraction/cleanup provenance snapshots.
Each run snapshot records source markdown path, canonical source PDF path,
cleaned artifact paths, line deltas, table-caption outcomes, and parse profile.
EOF
fi

cat >> "$MANIFEST" <<EOF

## Run Snapshot ${DATE_TAG}

- Profile: \`${PROFILE_TAG}\`
- Source cleanup reports:
  - \`tmp/docling-rerun/cleanup-report.txt\`
  - \`tmp/docling-rerun-remaining/cleanup-report.txt\`
- Generated per-file provenance CSV:
  - \`docs/waves/provenance/$(basename "$CSV_OUT")\`
- Snapshot totals:
  - Files: \`${total_rows}\`
  - Raw lines: \`${total_raw}\`
  - Cleaned lines: \`${total_cleaned}\`
  - Removed artifact lines: \`${total_removed}\`
  - Table captions: \`${total_caps}\`
  - Normalized tables (automated detector): \`${total_norm}\`
  - Canonical cleaned corpus file count: \`${canonical_count}\`
- Notes:
  - Automated detector false-positive for \`WAP-191_104\` \`Table 1\` is manually resolved in \`docs/waves/DOCLING_RERUN_REMAINING_DELTA_REPORT_2026-03-02.md\`.
EOF

rm -f "$TMP_TSV"
echo "Generated: $CSV_OUT"
echo "Updated:   $MANIFEST"
