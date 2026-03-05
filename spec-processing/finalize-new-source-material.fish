#!/usr/bin/env fish

set -l ROOT (cd (dirname (status --current-filename))/..; and pwd)
cd $ROOT

set -l NEW_DIR "$ROOT/spec-processing/new-source-material"
set -l SOURCE_DIR "$ROOT/spec-processing/source-material"
set -l CLEANED_DIR "$ROOT/spec-processing/source-material/parsed-markdown/docling-cleaned"
set -l TMP_DIR "$ROOT/tmp/docling-new-source-material/core"

set -l DRY_RUN 0
set -l VERIFY 1
set -l FORCE 0
set -l COPY_MODE 0
set -l PROMOTE_CLEANED 1

for arg in $argv
    switch $arg
        case --dry-run
            set DRY_RUN 1
        case --skip-verify
            set VERIFY 0
        case --skip-promote
            set PROMOTE_CLEANED 0
        case --force
            set FORCE 1
        case --copy
            set COPY_MODE 1
        case --help -h
            echo "Usage: finalize-new-source-material.fish [--dry-run] [--skip-verify] [--skip-promote] [--force] [--copy] [--help]"
            echo ""
            echo "Moves verified PDFs from spec-processing/new-source-material/ into spec-processing/source-material/."
            echo " --dry-run      Show planned moves only"
            echo " --skip-verify  Skip cleaned-output verification checks"
            echo " --skip-promote Skip promotion step into canonical cleaned corpus"
            echo " --force        Continue on non-blocking conflicts"
            echo " --copy         Copy instead of move"
            echo " --help         Show this message"
            exit 0
        case '*'
            echo "Unknown argument: $arg"
            exit 1
    end
end

if not test -d "$NEW_DIR"
    echo "Expected new-source queue missing: $NEW_DIR"
    exit 1
end

if not test -d "$SOURCE_DIR"
    echo "Expected source-material dir missing: $SOURCE_DIR"
    exit 1
end

if not test -d "$CLEANED_DIR"
    echo "Expected canonical cleaned dir missing: $CLEANED_DIR"
    exit 1
end

set -l NEW_FILES
for f in $NEW_DIR/*.pdf $NEW_DIR/*.PDF
    if test -f "$f"
        set NEW_FILES $NEW_FILES $f
    end
end

if test (count $NEW_FILES) -eq 0
    echo "No PDFs found in new-source queue."
    exit 0
end

set -l missing
if test "$VERIFY" -eq 1
    for f in $NEW_FILES
        set stem (path basename "$f")
        set stem_no_ext (string replace -r '\\.[^.]+$' '' -- $stem)
        set expected (string lower -- "$stem_no_ext.cleaned.md")

        set -l found_clean 0
        for cleaned in \
            $TMP_DIR/"$stem_no_ext.cleaned.md" \
            $CLEANED_DIR/"$stem_no_ext.cleaned.md" \
            $TMP_DIR/*.cleaned.md \
            $CLEANED_DIR/*.cleaned.md
            if test -f "$cleaned"
                set cleaned_base (string lower -- (path basename "$cleaned"))
                if test "$cleaned_base" = "$expected"
                    set found_clean 1
                    break
                end
            end
        end

        if test "$found_clean" -eq 0
            set missing "$missing $stem"
        end
    end

    if test (count $missing) -gt 0
        echo "Verification failed. Missing cleaned outputs for:"
        for m in $missing
            echo " - $m"
        end
        if test "$FORCE" -eq 0
            exit 1
        end
    end
end

set -l action "move"
if test "$COPY_MODE" -eq 1
    set action "copy"
end

if test "$DRY_RUN" -eq 1
    echo "Dry run: planned $action operations"
else
    if test "$PROMOTE_CLEANED" -eq 1
        echo "Promoting cleaned outputs into canonical corpus"
        ./spec-processing/scripts/promote-docling-cleaned.fish
    end
    echo "Executing $action operations"
end

for f in $NEW_FILES
    set base (path basename "$f")
    set -l target "$SOURCE_DIR/$base"
    set -l target_base "$base"

    # Detect case-insensitive existing match in canonical source dir.
    for existing in $SOURCE_DIR/*.pdf $SOURCE_DIR/*.PDF
        if test -f "$existing"
            if test (string lower -- (path basename "$existing")) = (string lower -- "$base")
                set target "$existing"
                set target_base (path basename "$target")
                break
            end
        end
    end

    if test -f "$target"
        if cmp -s "$f" "$target"
            echo "Already exists, identical; skipping: $base"
            continue
        else
            echo "Conflict: target exists with different content: $base -> $target_base"
            if test "$FORCE" -eq 0
                echo "Use --force to continue."
                exit 1
            else
                echo "Skipping due to conflict with --force: $base"
                continue
            end
        end
    end

    if test "$DRY_RUN" -eq 1
        echo "[dry-run] $action $f -> $target"
        continue
    end

    if test "$COPY_MODE" -eq 1
        cp "$f" "$target"
    else
        mv "$f" "$target"
    end
    echo "$action complete: $base -> $target_base"
end

set -l remaining_count 0
for f in $NEW_DIR/*.pdf $NEW_DIR/*.PDF
    if test -f "$f"
        set remaining_count (math $remaining_count + 1)
    end
end

echo "Done."
if test "$DRY_RUN" -eq 0
    echo "Canonical source material now has: $SOURCE_DIR"
end
echo "Remaining files in new-source queue: $remaining_count"
