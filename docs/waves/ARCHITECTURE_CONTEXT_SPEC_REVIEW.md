# Waves Architecture Context Spec Review

Version: v0.1  
Status: S0-09 complete (initial extraction + docling rerun validation pass) + supplemental context pass (`2026-03-05`)

## Purpose

Capture architectural-context specs that constrain naming, identity, and layering assumptions around Waves, without directly defining engine runtime execution behavior.

## Source Authority Policy

- See `docs/waves/SOURCE_AUTHORITY_POLICY.md` for normative vs supplemental source precedence and citation rules.

## Source set reviewed (S0-09)

- `spec-processing/source-material/WAP-210-WAPArch-20010712-a.pdf`
- `spec-processing/source-material/WAP-196-ClientID-20010409-a.pdf`
- `spec-processing/source-material/WAP-188-WAPGenFormats-20010710-a.pdf`
- `spec-processing/source-material/WAP.pdf` (supplemental context source)
- `spec-processing/source-material/vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf` (supplemental context source)

## Findings

### RQ-ARC-001 Layering and conformance context

- Requirement:
  - Use WAP layered model and SCR conventions consistently when mapping protocol behavior claims.
- Spec:
  - `WAP-210` architecture and conformance framing sections
- AC:
  - Evidence: [ ] Link concrete docs/tests/commands that demonstrate layering and requirement-ID conformance.
  - [ ] Waves docs continue to separate runtime, transport, and host responsibilities.
  - [ ] Conformance claims are tied to explicit requirement IDs and not broad marketing statements.

### RQ-ARC-002 Client-ID format constraints (if used)

- Requirement:
  - If Client-ID is represented or forwarded, encoding and identifier choice rules follow the WAP client-ID profile.
- Spec:
  - `WAP-196` section 5/6
- AC:
  - Evidence: [ ] Link contract fields/tests or explicit deferral notes for Client-ID behavior.
  - [ ] Any client-id field in contracts is either disabled/deferred or clearly encoded per profile.
  - [ ] Fallback behavior is defined when assigned client-id is unavailable.

### RQ-ARC-003 General format interoperability references

- Requirement:
  - Generic format references are treated as interoperability context, not runtime feature commitments by default.
- Spec:
  - `WAP-188`
- AC:
  - Evidence: [ ] Link requirement/ticket mappings proving non-binding context-only usage.
  - [ ] Features derived only from `WAP-188` remain explicitly non-binding until linked to implementation-layer requirements.

### RQ-ARC-004 Supplemental-source precedence and requirement authority

- Requirement:
  - Supplemental/context sources may reinforce implementation priorities but cannot create or redefine normative requirements without canonical WAP/OMA anchors.
- Spec:
  - Governance rule derived from local corpus policy and architecture-context review process.
- AC:
  - Evidence: [ ] Link ticket/docs showing supplemental-source claims mapped to canonical `RQ-*` before implementation.
  - [ ] Supplemental-source claims map to existing `RQ-*` IDs before they influence scope/tickets.
  - [ ] No ticket or contract change cites supplemental sources as sole normative authority.

### Supplemental context mapping pass (`2026-03-05`)

- `WAP.pdf` and the Wiley brief reinforce, but do not expand, existing requirement sets:
  - deck/card and constrained-device navigation/input themes -> `RQ-RMK-001`, `RQ-RMK-003`, `RQ-WAE-016`, `RQ-WAE-017`
  - caching/low-bandwidth/limited-resource behavior -> `RQ-WAE-008`, `T0-04`, `R0-03`
  - WSP session lifecycle (`suspend/resume`) and capability negotiation -> `RQ-TRN-011`, `RQ-TRN-013`, `RQ-TRN-019` (`T0-11`)
  - WSP header token/registry behavior -> `RQ-TRN-014`, `RQ-TRN-018` (`T0-20`)
  - WTP reliability/retransmission framing -> `RQ-TRN-007`, `RQ-TRN-016` (`T0-18`)
  - WDP/UDP abstraction framing -> `RQ-TRN-001`, `RQ-TRN-002`, `RQ-TRN-003` (`T0-19`)
- Additional note: Wiley source includes embedded WML normative text excerpts; canonical authority remains `WAP-191*` + `spec-wml-19990616` in runtime traceability.

## Notes

- These specs are context-setting and do not currently add direct must-implement runtime features for Waves MVP.
- They remain important as consistency checks when contract mapping starts (S0-05).
