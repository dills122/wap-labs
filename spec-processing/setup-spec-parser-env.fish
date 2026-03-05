#!/usr/bin/env fish

set -l ROOT (cd (dirname (status --current-filename)); and pwd)
cd $ROOT

set -l PYTHON_BIN
if command -q python3
    set PYTHON_BIN python3
else if command -q python
    set PYTHON_BIN python
else
    echo "Python 3 is required but was not found in PATH."
    exit 1
end

if not test -d .venv
    echo "Creating Python environment at ./.venv"
    $PYTHON_BIN -m venv .venv
    or begin
        echo "Failed to create .venv"
        exit 1
    end
end

source .venv/bin/activate.fish

if not command -q pip
    echo "pip is unavailable in the created virtual environment."
    exit 1
end

pip install --quiet --upgrade pip
pip install --quiet docling

if not command -q docling
    echo "docling installation did not complete successfully."
    exit 1
end

echo "Spec parser environment ready."
