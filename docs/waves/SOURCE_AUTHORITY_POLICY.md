# Waves Source Authority Policy

Version: v0.2
Status: active

## Purpose

Define source precedence so requirement and implementation decisions remain grounded in canonical material.

## Source classes

1. `normative`
- Official WAP/OMA release members and governing documents locked by authority
  URL, publication identity, and SHA-256.
- The WAP 1.2.1 target inventory is
  `spec-processing/source-manifests/wap-1.2.1-release.json`.
- The exact WAP-215 Class A/B/C graphs and selected Class C client profile are
  `spec-processing/source-manifests/wap-1.2.1-class-conformance.json`.
- Private acquisition evidence is recorded in
  `spec-processing/source-manifests/wap-1.2.1-ingestion-status.json` and
  `spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json`.
- Byte-exact root-level copies under `spec-processing/source-material/` are the
  preferred local cache, but the local directory does not define release
  membership.
- These are the only sources allowed to create or redefine `RQ-*` requirements.

2. `interop-reference`
- External implementation references (for example Kannel, Wireshark dissectors, captured interop traces).
- May inform fixture design and behavior interpretation, but cannot override normative specs.

3. `heuristic`
- Summaries, slide decks, tertiary books, LLM-parsed notes.
- Useful for context and candidate test ideas; not authoritative for requirement definition.

## Current supplemental source classification

- `spec-processing/source-material/WAP.pdf`: `heuristic`
- `spec-processing/source-material/vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf`: `heuristic`
- `spec-processing/external-parsed/wap_emulator_spec_notes.md`: `heuristic`

## Requirement creation/update rule

A new or changed `RQ-*` item must include:

1. at least one canonical `normative` source anchor (document ID + exact
   section/SCR and source-lock identity), and
2. an AC entry with concrete evidence targets (tests/fixtures/commands).

If only supplemental evidence exists, create an open question or a candidate fixture note, not a new `RQ-*`.

For a metadata-only normative source, the requirement must additionally record
the official URL and locked SHA-256. A local parsed derivative is not required
for authority and must not be committed without redistribution approval.

Research-ingestion state is not repository-promotion state. A logical private
cache reference and verified hash can prove availability for extraction
without authorizing a recovered binary or derivative to enter Git.

## Target release precedence

Strict compatibility requirements use WAP 1.2.1 with WML 1.3:

1. approved WAP 1.2.1 base specification;
2. approved release-carried SIN overlays in effective order;
3. governing WAP conformance requirements;
4. normatively cited W3C/IETF/ISO/Unicode dependencies;
5. later WAP/OMA successor specifications only as delta or clarification
   evidence.

The current local WAP 2.0-heavy corpus must not silently redefine the strict
target. See `docs/waves/WAP_1_2_1_SOURCE_BASELINE.md`.

## Citation rule

In traceability and work items:

1. cite normative source first,
2. cite interop-reference second (if used),
3. cite heuristic source last as context only.

## Conflict rule

When sources disagree:

1. canonical normative source wins,
2. note discrepancy in `docs/waves/OPEN_SPEC_QUESTIONS.md`,
3. create follow-up ticket only after normative anchor is confirmed.

## Enforcement points

- `docs/waves/*TRACEABILITY*.md`: per-requirement evidence lines and source policy link.
- `docs/waves/WORK_ITEMS.md`: ticket `Spec` field must reference `RQ-*` and canonical source sections.
- Drift checks:
  - `scripts/check-worklist-drift.mjs`
  - `scripts/check-source-corpus-drift.mjs`
  - `spec-processing/scripts/check-wap-release-manifest.mjs`
  - `spec-processing/scripts/check-wap-class-conformance.mjs`
  - `spec-processing/scripts/check-wap-ingestion-status.mjs`
  - `spec-processing/scripts/check-wap-external-ingestion-status.mjs`
