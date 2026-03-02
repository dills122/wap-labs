#!/usr/bin/env fish

set -l ROOT /Users/dsteele/repos/wap-labs
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

# Recommended docling profile (same one that worked in parse-pdf.fish)
set DOCFLAGS --from pdf --to md --image-export-mode placeholder --no-ocr --no-force-ocr --pdf-backend dlparse_v4

# Remaining high-impact core set
set CORE_FILES \
/Users/dsteele/repos/wap-labs/docs/source-material/spec-wml-19990616.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-191_102-WML-20001213-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-191_104-WML-20010718-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-191_105-WML-20020212-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-192-WBXML-20010725-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-192_105-WBXML-20011015-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-238-WML-20010911-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-193-WMLScript-20001025-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-194-WMLScriptLibraries-20000925-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-194_103-WMLScriptLibraries-20020318-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-236-WAESpec-20020207-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-237-WAEMT-20010515-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-188-WAPGenFormats-20010710-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-196-ClientID-20010409-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-210-WAPArch-20010712-a.pdf

# Remaining security/deferred set
set EXT_FILES \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-161-WMLScriptCrypto-20010620-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-161_101-WMLScriptCrypto-20010730-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-248-UAProf-20011020-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-187-TransportE2ESec-20010628-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-187_101-TransportE2ESec-20011009-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-219-TLS-20010411-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-219_100-TLS-20011029-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-261-WTLS-20010406-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-261_100-WTLS-20010926-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-261_101-WTLS-20011027-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-261_102-WTLS-20011027-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-211-WAPCert-20010522-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-211_104-WAPCert-20010928-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/OMA-WAP-211_105-WAPCert-SIN-20020520-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-217-WPKI-20010424-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-217_103-WPKI-20011102-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/OMA-WAP-217_105-WPKI-SIN-20020816-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/WAP-260-WIM-20010712-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/OMA-WAP-260_100-WIM-SIN-20010725-a.pdf \
/Users/dsteele/repos/wap-labs/docs/source-material/OMA-WAP-260_101-WIM-SIN-20020107-a.pdf

mkdir -p $ROOT/tmp/docling-rerun-remaining/core
mkdir -p $ROOT/tmp/docling-rerun-remaining/ext

for f in $CORE_FILES
    echo "Parsing CORE: $f"
    docling $f $DOCFLAGS --output $ROOT/tmp/docling-rerun-remaining/core
    or begin
        echo "Failed CORE parse: $f"
        exit 1
    end
end

for f in $EXT_FILES
    echo "Parsing EXT: $f"
    docling $f $DOCFLAGS --output $ROOT/tmp/docling-rerun-remaining/ext
    or begin
        echo "Failed EXT parse: $f"
        exit 1
    end
end

echo "Done. Outputs in:"
echo "  $ROOT/tmp/docling-rerun-remaining/core"
echo "  $ROOT/tmp/docling-rerun-remaining/ext"
