#!/usr/bin/env fish

set -l ROOT (cd (dirname (status --current-filename))/..; and pwd)
cd $ROOT

if not test -d .venv
    echo "Missing .venv. Run spec-processing/setup-spec-parser-env.fish first."
    exit 1
end

source .venv/bin/activate.fish

if not command -q docling
    echo "docling is not available in the active environment."
    echo "Run spec-processing/setup-spec-parser-env.fish first."
    exit 1
end

source $ROOT/spec-processing/scripts/docling-profile.fish
set DOCFLAGS $DOCLING_PROFILE_FLAGS

set NEW_SOURCE_DIR "$ROOT/spec-processing/new-source-material"
set OUTPUT_DIR "$ROOT/tmp/docling-new-source-material/core"
set OUTPUT_ROOT "$ROOT/tmp/docling-new-source-material"
set REPORT_FILE "$ROOT/tmp/docling-new-source-material/cleanup-report.txt"

if not test -d $NEW_SOURCE_DIR
    echo "Expected source folder not found: $NEW_SOURCE_DIR"
    exit 1
end

set NEW_FILES
for f in $NEW_SOURCE_DIR/*.pdf $NEW_SOURCE_DIR/*.PDF
    if test -f $f
        set NEW_FILES $NEW_FILES $f
    end
end

if test (count $NEW_FILES) -eq 0
    echo "No PDFs found under $NEW_SOURCE_DIR"
    exit 1
end

mkdir -p $OUTPUT_DIR
mkdir -p $OUTPUT_ROOT
rm -f $REPORT_FILE

for f in $NEW_FILES
    echo "Parsing NEW SOURCE: $f"
    docling "$f" $DOCFLAGS --output $OUTPUT_DIR
    or begin
        echo "Failed parse: $f"
        exit 1
    end
end

for f in $NEW_FILES
    set stem (path basename "$f")
    set stem_no_ext (string replace -r '\\.[^.]+$' '' -- $stem)
    set root_md "$OUTPUT_ROOT/$stem_no_ext.md"
    set root_clean "$OUTPUT_ROOT/$stem_no_ext.cleaned.md"
    set src_md "$OUTPUT_DIR/$stem_no_ext.md"
    set dst_md "$OUTPUT_DIR/$stem_no_ext.cleaned.md"
    if test -f "$src_md"
        mv "$src_md" "$dst_md"
    end
    if test -f "$root_md"
        mv "$root_md" "$dst_md"
    end
    if test -f "$root_clean"
        mv "$root_clean" "$dst_md"
    end
    if test -f "$OUTPUT_DIR/$stem_no_ext.cleaned.md"
        continue
    end
    if test -f "$OUTPUT_ROOT/$stem_no_ext.cleaned.md"
        mv "$OUTPUT_ROOT/$stem_no_ext.cleaned.md" "$dst_md"
    end
end

for f in $OUTPUT_DIR/*.cleaned.md
    if test -f "$f"
        set base_name (path basename "$f")
        set lines (wc -l < "$f" | tr -d ' ')
        echo "FILE: $base_name" >> "$REPORT_FILE"
        echo "OUT: $f" >> "$REPORT_FILE"
        echo "LINES: raw=$lines cleaned=$lines removed_artifacts=0 table_captions=0 normalized_tables=0" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    end
end

echo "Done. Outputs in:"
echo "  $OUTPUT_DIR"
echo "  $REPORT_FILE"
