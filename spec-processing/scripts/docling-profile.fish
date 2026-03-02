#!/usr/bin/env fish

# Shared Docling profile used by all spec parsing runs.
# Keep this centralized so reruns are deterministic.
set -g DOCLING_PROFILE_FLAGS \
    --from pdf \
    --to md \
    --image-export-mode placeholder \
    --no-ocr \
    --no-force-ocr \
    --pdf-backend dlparse_v4
