# Waves Architecture Context Spec Review

Version: v0.1  
Status: S0-09 complete (initial extraction + docling rerun validation pass)

## Purpose

Capture architectural-context specs that constrain naming, identity, and layering assumptions around Waves, without directly defining engine runtime execution behavior.

## Source set reviewed (S0-09)

- `docs/source-material/WAP-210-WAPArch-20010712-a.pdf`
- `docs/source-material/WAP-196-ClientID-20010409-a.pdf`
- `docs/source-material/WAP-188-WAPGenFormats-20010710-a.pdf`

## Findings

### RQ-ARC-001 Layering and conformance context

- Requirement:
  - Use WAP layered model and SCR conventions consistently when mapping protocol behavior claims.
- Spec:
  - `WAP-210` architecture and conformance framing sections
- AC:
  - [ ] Waves docs continue to separate runtime, transport, and host responsibilities.
  - [ ] Conformance claims are tied to explicit requirement IDs and not broad marketing statements.

### RQ-ARC-002 Client-ID format constraints (if used)

- Requirement:
  - If Client-ID is represented or forwarded, encoding and identifier choice rules follow the WAP client-ID profile.
- Spec:
  - `WAP-196` section 5/6
- AC:
  - [ ] Any client-id field in contracts is either disabled/deferred or clearly encoded per profile.
  - [ ] Fallback behavior is defined when assigned client-id is unavailable.

### RQ-ARC-003 General format interoperability references

- Requirement:
  - Generic format references are treated as interoperability context, not runtime feature commitments by default.
- Spec:
  - `WAP-188`
- AC:
  - [ ] Features derived only from `WAP-188` remain explicitly non-binding until linked to implementation-layer requirements.

## Notes

- These specs are context-setting and do not currently add direct must-implement runtime features for Waves MVP.
- They remain important as consistency checks when contract mapping starts (S0-05).
