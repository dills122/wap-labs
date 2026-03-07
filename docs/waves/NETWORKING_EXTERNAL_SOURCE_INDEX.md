# Networking External Source Index

Status: active  
Updated: 2026-03-06  
Ticket: `T0-23`

## Purpose

Catalog external and supplemental networking references that may inform fixture design, replay realism, and implementation interpretation without changing normative source precedence.

Canonical machine-readable source:

- [spec-processing/external-source-index.json](/Users/dsteele/repos/wap-labs/spec-processing/external-source-index.json)

Source authority policy:

- [docs/waves/SOURCE_AUTHORITY_POLICY.md](/Users/dsteele/repos/wap-labs/docs/waves/SOURCE_AUTHORITY_POLICY.md)

## Current indexed entries

| ID | Family | Status | Source Class | Path | Mapped `RQ-*` IDs | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `supplemental-wap-slide-deck` | `supplemental-context` | `present` | `heuristic` | [spec-processing/source-material/WAP.pdf](/Users/dsteele/repos/wap-labs/spec-processing/source-material/WAP.pdf) | `RQ-TRN-010`, `RQ-TRN-012`, `RQ-TRN-014` | Slide-deck context only; useful for terminology reinforcement. |
| `supplemental-wiley-tech-brief` | `supplemental-context` | `present` | `heuristic` | [spec-processing/source-material/vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf](/Users/dsteele/repos/wap-labs/spec-processing/source-material/vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf) | `RQ-TRN-001`, `RQ-TRN-006`, `RQ-TRN-010` | Historical context only; cannot redefine transport requirements. |
| `supplemental-emulator-notes` | `supplemental-context` | `present` | `heuristic` | [spec-processing/external-parsed/wap_emulator_spec_notes.md](/Users/dsteele/repos/wap-labs/spec-processing/external-parsed/wap_emulator_spec_notes.md) | `RQ-TRN-007`, `RQ-TRN-012`, `RQ-TRN-014` | Candidate-fixture and triage aid only. |
| `interop-kannel-networking-sources` | `kannel` | `planned` | `interop-reference` | not yet ingested | `RQ-TRN-005`, `RQ-TRN-007`, `RQ-TRN-010`, `RQ-TRN-012` | Target family for future external ingestion. |
| `interop-wireshark-dissectors` | `wireshark` | `planned` | `interop-reference` | not yet ingested | `RQ-TRN-001`, `RQ-TRN-007`, `RQ-TRN-012`, `RQ-TRN-014`, `RQ-SEC-004` | Target family for future external ingestion. |

## Provenance contract

Each indexed entry now records:

1. `origin`
2. `licenseStatus`
3. `ingestedAt`
4. `behaviorNotes`

Each `behaviorNote` must:

1. map to existing local `RQ-*` only
2. name at least one implementation lane
3. stay descriptive rather than normative

This keeps the index useful for replay and fixture planning without letting external material redefine transport requirements.

## Intake landing zone

Future Kannel and Wireshark drops should land under:

- [spec-processing/new-source-material/external-networking/README.md](/Users/dsteele/repos/wap-labs/spec-processing/new-source-material/external-networking/README.md)

## Current conclusion

1. Supplemental context sources are present and now explicitly classified as `heuristic`.
2. Desired interop-reference families for Kannel and Wireshark are not yet locally ingested.
3. `T0-23` therefore closes the indexing/classification and intake-contract gap, but not the future acquisition of those external artifacts.

## Practical use

Use this index to:

1. justify whether a source may influence fixture design
2. prevent heuristic text from redefining `RQ-*`
3. track which interop-reference families are still missing before replay realism work expands

## Validation

Run:

```bash
node scripts/check-networking-source-index.mjs
```

The check verifies:

1. required source families are present in the index
2. `present` entries point at real files
3. all entries carry valid provenance fields and a valid source class
4. every entry and behavior note maps to at least one existing `RQ-*` ID
5. every required family has at least one indexed behavior note
