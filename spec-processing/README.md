# Docling Spec Processing Runbook

Date: 2026-03-02  
Scope: canonical source PDFs under `spec-processing/source-material/` and finalized cleaned outputs under `spec-processing/source-material/parsed-markdown/docling-cleaned/`.

## Purpose

Provide a reproducible, deterministic workflow for:

1. Parsing selected PDF waves with Docling.
2. Promoting final cleaned markdown artifacts into canonical repo storage.
3. Capturing provenance metadata.
4. Running a lightweight quality gate.

## Prerequisites (fish shell)

```fish
cd <repo-root>
source .venv/bin/activate.fish
```

Docling must be available in the venv (`command -q docling`).

## Deterministic profile

Shared profile source:

- `spec-processing/scripts/docling-profile.fish`

Profile flags:

- `--from pdf --to md`
- `--image-export-mode placeholder`
- `--no-ocr --no-force-ocr`
- `--pdf-backend dlparse_v4`

## Parse waves

Base wave:

```fish
./spec-processing/parse-pdf.fish
```

Remaining wave:

```fish
./spec-processing/parse-pdf-remaining.fish
```

Outputs are written to:

- `tmp/docling-rerun/{core,ext}`
- `tmp/docling-rerun-remaining/{core,ext}`

## Promote final cleaned artifacts

```fish
./spec-processing/scripts/promote-docling-cleaned.fish
```

Canonical destination:

- `spec-processing/source-material/parsed-markdown/docling-cleaned/`

## Generate provenance snapshot

```bash
./spec-processing/scripts/generate-docling-provenance.sh 2026-03-02
```

Generated artifacts:

- `docs/waves/SOURCE_CLEAN_PROVENANCE_MANIFEST.md` (append-only snapshots)
- `docs/waves/provenance/docling-provenance-2026-03-02.csv` (per-file metadata)

## Run quality gate

Advisory mode:

```bash
./spec-processing/scripts/check-docling-cleaned-quality.sh
```

Strict mode (non-zero exit on warnings):

```bash
./spec-processing/scripts/check-docling-cleaned-quality.sh --strict
```

## Notes

- Known detector false-positive: `WAP-191_104` `Table 1` (resolved manually, tracked in rerun delta report).
- Canonical planning/compliance docs should reference canonical cleaned corpus and provenance artifacts, not temporary `tmp/` paths.
