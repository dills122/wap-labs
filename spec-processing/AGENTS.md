# AGENTS (spec-processing)

Subproject steering for `spec-processing/`.

## Scope

- Canonical source corpus: `spec-processing/source-material/`
- Parse entrypoints: `spec-processing/parse-pdf.fish`, `spec-processing/parse-pdf-remaining.fish`
- Processing scripts: `spec-processing/scripts/*`
- Provenance artifacts: `docs/waves/SOURCE_CLEAN_PROVENANCE_MANIFEST.md`, `docs/waves/provenance/*`

## Rules

1. Keep processing deterministic:
- Use `spec-processing/scripts/docling-profile.fish` as the single profile source.

2. Keep checks manual:
- Do not add CI/workflow coupling for spec-processing quality checks unless explicitly requested.

3. Canonical-source policy:
- Use root-level files in `spec-processing/source-material/`.
- Do not reintroduce mirror folders (`WMLScript/`, `sub-set/`) unless explicitly justified.

4. Promotion policy:
- Treat `spec-processing/source-material/parsed-markdown/docling-cleaned/` as the canonical cleaned corpus.
- Temporary outputs in `tmp/` are staging artifacts only.

5. Provenance policy:
- Update provenance via `spec-processing/scripts/generate-docling-provenance.sh`.
- Keep `docs/waves/SOURCE_CLEAN_PROVENANCE_MANIFEST.md` append-only.
