#!/usr/bin/env fish

set -l ROOT (cd (dirname (status --current-filename))/../..; and pwd)
set -l DEST $ROOT/spec-processing/source-material/parsed-markdown/docling-cleaned

set -l SRC_DIRS \
    $ROOT/tmp/docling-rerun/core \
    $ROOT/tmp/docling-rerun/ext \
    $ROOT/tmp/docling-rerun-remaining/core \
    $ROOT/tmp/docling-rerun-remaining/ext

mkdir -p $DEST

set -l copied 0
for d in $SRC_DIRS
    if test -d $d
        for f in (find $d -type f -name '*.cleaned.md')
            cp $f $DEST/
            set copied (math $copied + 1)
        end
    end
end

set -l final_count (find $DEST -type f -name '*.cleaned.md' | wc -l | tr -d ' ')

echo "Copied cleaned files: $copied"
echo "Canonical cleaned corpus:"
echo "  $DEST"
echo "Final cleaned file count: $final_count"
