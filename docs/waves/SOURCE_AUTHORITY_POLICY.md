# Waves Source Authority Policy

Version: v0.1
Status: active

## Purpose

Define source precedence so requirement and implementation decisions remain grounded in canonical material.

## Source classes

1. `normative`
- Canonical WAP/OMA specs under `spec-processing/source-material/` used by traceability docs.
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

1. at least one canonical `normative` source anchor (spec + section/SCR), and
2. an AC entry with concrete evidence targets (tests/fixtures/commands).

If only supplemental evidence exists, create an open question or a candidate fixture note, not a new `RQ-*`.

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
