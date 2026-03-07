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

Quick bootstrap (first-time setup):

```fish
cd <repo-root>/spec-processing
./setup-spec-parser-env.fish
source ../.venv/bin/activate.fish
```

## Make targets (spec-specific)

All spec-processing tasks are available through:

```fish
make -C spec-processing -f Makefile.spec <target>
```

Networking-focused tasks can also be invoked via:

```fish
make -C spec-processing -f Makefile.networking <networking-target>
```

Or via `spec-processing/Makefile` compatibility wrapper:

```fish
cd spec-processing && make <target>
```

Common targets:

- `setup`  
  creates/refreshes the parser venv
- `parse-new`  
  parse `new-source-material` PDFs
- `finalize-new`  
  verify + move PDFs from `new-source-material` into `source-material`
- `parse-base`  
  base corpus rerun
- `parse-remaining`  
  parse remaining wave set
- `parse-all`  
  run base + new + remaining parses
- `promote`  
  copy cleaned outputs into canonical corpus
- `networking-ingest`  
  parse new-source queue and finalize canonical move (`parse-new` + `finalize-new`)
- `provenance`  
  generate provenance CSV + manifest
- `quality` / `quality-strict`  
  run docling cleaned checks

Networking helper targets (via `Makefile.networking`):

```fish
make -C spec-processing -f Makefile.networking networking-parse-only
make -C spec-processing -f Makefile.networking networking-verify
make -C spec-processing -f Makefile.networking networking-promote-only
make -C spec-processing -f Makefile.networking networking-ingest
make -C spec-processing -f Makefile.networking networking-dryrun
```

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

New source-folder wave:

```fish
./spec-processing/parse-new-source-material.fish
```
This parser writes into `tmp/docling-new-source-material/core` and emits
`tmp/docling-new-source-material/cleanup-report.txt` in the same legacy-compatible format.

Finalize and ingest new materials:

```fish
./spec-processing/finalize-new-source-material.fish
```

This will:

- verify each PDF in `spec-processing/new-source-material/` has a matching cleaned output in either:
  - `tmp/docling-new-source-material/core/*.cleaned.md`, or
  - `spec-processing/source-material/parsed-markdown/docling-cleaned/*.cleaned.md`
- move each source PDF into `spec-processing/source-material/` once verification passes
- keep duplicate names case-insensitively (skip identical file contents; fail on conflict by default)

Options:

```fish
./spec-processing/finalize-new-source-material.fish [--dry-run] [--skip-verify] [--skip-promote] [--force] [--copy]
```

Use `--copy` for non-destructive queue audits, and `--force` when you only want a soft-approval mode for conflicts.

Remaining wave:

```fish
./spec-processing/parse-pdf-remaining.fish
```

Outputs are written to (legacy-compatible):

- `tmp/docling-rerun/{core,ext}`
- `tmp/docling-rerun-remaining/{core,ext}`
- `tmp/docling-new-source-material/core`

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
- External/supplemental networking source classification is tracked separately in:
  - `spec-processing/external-source-index.json`
  - `docs/waves/NETWORKING_EXTERNAL_SOURCE_INDEX.md`
- Future Kannel/Wireshark external implementation snapshots should land under:
  - `spec-processing/new-source-material/external-networking/`
