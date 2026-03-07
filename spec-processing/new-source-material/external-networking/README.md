# External Networking Intake

Status: active  
Updated: 2026-03-06  
Ticket: `T0-23`

## Purpose

Provide a deterministic landing zone for future external networking reference intake without mixing those artifacts into canonical normative source material.

## Intended layout

```text
spec-processing/new-source-material/external-networking/
  kannel/
  wireshark/
```

Use the folders above for candidate external implementation references such as:

1. Kannel protocol source snapshots or extracted implementation notes
2. Wireshark dissector source snapshots or curated protocol decode notes

## Intake rules

1. Do not place newly ingested external files in `spec-processing/source-material/` unless they are canonical normative specs.
2. Every new external artifact must be added to:
   - `spec-processing/external-source-index.json`
   - `docs/waves/NETWORKING_EXTERNAL_SOURCE_INDEX.md`
3. Each ingested entry must record:
   - `origin`
   - `licenseStatus`
   - `ingestedAt`
   - at least one `behaviorNote` mapped to existing `RQ-*`
4. External sources may be classified only as:
   - `interop-reference`
   - `heuristic`
   unless backed by canonical WAP/OMA normative material already recognized by local traceability docs.
5. External sources may not create or redefine `RQ-*` requirements.

## Validation

After updating the index, run:

```bash
node scripts/check-networking-source-index.mjs
```

## Current state

No Kannel or Wireshark source snapshots are checked in yet. The tracked planned families remain visible in:

- `spec-processing/external-source-index.json`
- `docs/waves/NETWORKING_EXTERNAL_SOURCE_INDEX.md`
