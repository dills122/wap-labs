#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
STRICT=0
if [[ "${1:-}" == "--strict" ]]; then
  STRICT=1
fi

CLEANED_DIR="$ROOT/spec-processing/source-material/parsed-markdown/docling-cleaned"
BASE_REPORT="$ROOT/tmp/docling-rerun/cleanup-report.txt"
REM_REPORT="$ROOT/tmp/docling-rerun-remaining/cleanup-report.txt"

warn=0

echo "Docling cleaned quality check"
echo "Cleaned dir: $CLEANED_DIR"

if [[ ! -d "$CLEANED_DIR" ]]; then
  echo "ERROR: cleaned directory missing"
  exit 1
fi

file_count=$(find "$CLEANED_DIR" -type f -name '*.cleaned.md' | wc -l | tr -d ' ')
echo "Cleaned files: $file_count"
if [[ "$file_count" -lt 40 ]]; then
  echo "WARN: cleaned corpus count is lower than expected baseline (40)"
  warn=$((warn + 1))
fi

ff_count=$( (rg -n $'\f' "$CLEANED_DIR" -g '*.cleaned.md' || true) | wc -l | tr -d ' ' )
echo "Form-feed artifacts: $ff_count"
if [[ "$ff_count" -gt 0 ]]; then
  echo "WARN: form-feed artifacts detected"
  warn=$((warn + 1))
fi

hash_count=$( (rg -n '(^|[^\\])#(REQUIRED|IMPLIED)\b' "$CLEANED_DIR" -g '*.cleaned.md' || true) | wc -l | tr -d ' ' )
echo "Unescaped DTD token hits (#REQUIRED/#IMPLIED): $hash_count"
if [[ "$hash_count" -gt 0 ]]; then
  echo "WARN: unescaped DTD tokens detected"
  warn=$((warn + 1))
fi

if [[ -f "$BASE_REPORT" && -f "$REM_REPORT" ]]; then
  raw_unresolved=$( (cat "$BASE_REPORT" "$REM_REPORT" | rg -n 'TABLE: .*normalized=no' || true) | wc -l | tr -d ' ' )
  # Known detector false-positive, resolved by manual review.
  allowlist=$( (cat "$BASE_REPORT" "$REM_REPORT" | rg -n 'WAP-191_104-WML-20010718-a|TABLE: Table 1\. normalized=no' || true) | wc -l | tr -d ' ' )
  unresolved=$raw_unresolved
  if [[ "$raw_unresolved" -gt 0 && "$allowlist" -gt 0 ]]; then
    unresolved=$((raw_unresolved - 1))
  fi
  if [[ "$unresolved" -lt 0 ]]; then
    unresolved=0
  fi
  echo "Table captions flagged non-normalized (after allowlist): $unresolved"
  if [[ "$unresolved" -gt 0 ]]; then
    echo "WARN: unresolved table-caption normalization remains"
    warn=$((warn + 1))
  fi
else
  echo "WARN: cleanup reports missing under tmp/docling-rerun*"
  warn=$((warn + 1))
fi

echo "Warnings: $warn"
if [[ "$STRICT" -eq 1 && "$warn" -gt 0 ]]; then
  exit 2
fi
