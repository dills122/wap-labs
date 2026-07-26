#!/usr/bin/env fish

# Source this after activating the repository-root virtual environment.
set -l ROOT (cd (dirname (status --current-filename))/../..; and pwd)
set -l REQUIREMENTS "$ROOT/spec-processing/requirements-docling.txt"

if not command -q docling
    echo "Docling is unavailable. Run spec-processing/setup-spec-parser-env.fish first."
    return 1
end

if not command -q python
    echo "Python is unavailable in the active Docling environment."
    return 1
end

set -l requirement (string match -r '^docling==[^[:space:]#]+$' < "$REQUIREMENTS")
if test (count $requirement) -ne 1
    echo "Expected one exact docling==<version> pin in $REQUIREMENTS"
    return 1
end
set -l expected (string replace 'docling==' '' -- $requirement)
set -l actual (python -c 'from importlib.metadata import version; print(version("docling"))')
or begin
    echo "Unable to read the installed Docling version."
    return 1
end

if test "$actual" != "$expected"
    echo "Docling version mismatch: required $expected, found $actual"
    echo "Run spec-processing/setup-spec-parser-env.fish to refresh the environment."
    return 1
end
