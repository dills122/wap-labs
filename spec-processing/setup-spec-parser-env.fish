#!/usr/bin/env fish

set -l ROOT (cd (dirname (status --current-filename))/..; and pwd)
cd $ROOT
set -l VENV "$ROOT/.venv"
set -l REQUIREMENTS "$ROOT/spec-processing/requirements-docling.txt"

set -l PYTHON_BIN
if command -q python3
    set PYTHON_BIN python3
else if command -q python
    set PYTHON_BIN python
else
    echo "Python 3 is required but was not found in PATH."
    exit 1
end

if not test -d $VENV
    echo "Creating Python environment at $VENV"
    $PYTHON_BIN -m venv $VENV
    or begin
        echo "Failed to create .venv"
        exit 1
    end
end

source $VENV/bin/activate.fish

if not command -q pip
    echo "pip is unavailable in the created virtual environment."
    exit 1
end

pip install --quiet --upgrade pip
pip install --quiet --requirement $REQUIREMENTS

source $ROOT/spec-processing/scripts/require-docling.fish
or exit 1

echo "Spec parser environment ready at $VENV."
