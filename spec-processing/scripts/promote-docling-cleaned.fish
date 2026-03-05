#!/usr/bin/env fish

set -l ROOT (cd (dirname (status --current-filename))/../..; and pwd)
set -l DEST $ROOT/spec-processing/source-material/parsed-markdown/docling-cleaned

set -l SRC_DIRS \
    $ROOT/tmp/docling-rerun/core \
    $ROOT/tmp/docling-rerun/ext \
    $ROOT/tmp/docling-rerun-remaining/core \
    $ROOT/tmp/docling-rerun-remaining/ext \
    $ROOT/tmp/docling-new-source-material/core \
    $ROOT/tmp/docling-new-source-material/ext

mkdir -p $DEST

set -l copied 0
for d in $SRC_DIRS
    if test -d $d
        for f in (find $d -type f \( -name '*.cleaned.md' -o -name '*.md' \))
            set src_base (basename $f)
            if string match -r '.*\.cleaned\.md$' -- $src_base >/dev/null
                set dst "$DEST/$src_base"
            else
                set dst "$DEST/"(string replace '.md' '.cleaned.md' $src_base)
            end
            cp "$f" "$dst"
            set copied (math $copied + 1)
        end
    end
end

set -l final_count (find $DEST -type f -name '*.cleaned.md' | wc -l | tr -d ' ')

echo "Copied cleaned files: $copied"
echo "Canonical cleaned corpus:"
echo "  $DEST"
echo "Final cleaned file count: $final_count"
