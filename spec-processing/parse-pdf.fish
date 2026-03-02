#!/usr/bin/env fish

set -l ROOT (cd (dirname (status --current-filename))/..; and pwd)
cd $ROOT

if not test -f .venv/bin/activate.fish
    echo "Missing .venv/bin/activate.fish"
    exit 1
end

source .venv/bin/activate.fish

if not command -q docling
    echo "docling is not available in the active environment"
    exit 1
end

# Shared deterministic Docling profile
source $ROOT/spec-processing/scripts/docling-profile.fish
set DOCFLAGS $DOCLING_PROFILE_FLAGS

# Core analysis set (WML + WMLScript + transport core)
set CORE_FILES \
$ROOT/spec-processing/source-material/WAP-191-WML-20000219-a.pdf \
$ROOT/spec-processing/source-material/WMLScript/WAP-193_101-WMLScript-20010928-a.pdf \
$ROOT/spec-processing/source-material/WAP-259-WDP-20010614-a.pdf \
$ROOT/spec-processing/source-material/WAP-224-WTP-20010710-a.pdf \
$ROOT/spec-processing/source-material/OMA-WAP-224_002-WTP-SIN-20020827-a.PDF \
$ROOT/spec-processing/source-material/WAP-230-WSP-20010705-a.pdf

# Extended networking set (adjacent but important)
set EXT_FILES \
$ROOT/spec-processing/source-material/WAP-202-WCMP-20010624-a.pdf \
$ROOT/spec-processing/source-material/WAP-159-WDPWCMPAdapt-20010713-a.pdf \
$ROOT/spec-processing/source-material/WAP-229-HTTP-20010329-a.pdf \
$ROOT/spec-processing/source-material/WAP-229_001-HTTP-20011031-a.pdf \
$ROOT/spec-processing/source-material/WAP-223-HTTPSM-20001213-a.pdf \
$ROOT/spec-processing/source-material/WAP-223_101-HTTPSM-20010928-a.pdf \
$ROOT/spec-processing/source-material/WAP-225-TCP-20010331-a.pdf

mkdir -p $ROOT/tmp/docling-rerun/core
mkdir -p $ROOT/tmp/docling-rerun/ext

for f in $CORE_FILES
    echo "Parsing CORE: $f"
    docling $f $DOCFLAGS --output $ROOT/tmp/docling-rerun/core
    or begin
        echo "Failed CORE parse: $f"
        exit 1
    end
end

for f in $EXT_FILES
    echo "Parsing EXT: $f"
    docling $f $DOCFLAGS --output $ROOT/tmp/docling-rerun/ext
    or begin
        echo "Failed EXT parse: $f"
        exit 1
    end
end

echo "Done. Outputs in:"
echo "  $ROOT/tmp/docling-rerun/core"
echo "  $ROOT/tmp/docling-rerun/ext"
