# Networking Gap Master (Consolidated)

Status: active
Updated: 2026-03-05

This document consolidates prior networking gap docs into one execution-oriented reference.

Supersedes:

- `docs/waves/archive/networking/networking-gap-analysis.md`
- `docs/waves/archive/networking/networking-strict-gap-audit.md`
- `docs/waves/archive/networking/networking-gap-to-source-map.md`

## Scope

WAP protocol-native transport closure for:

- WDP
- WTP
- WSP
- WTLS (phase-gated, default disabled)

## P0 Blockers

1. WTP reliability core (`RQ-TRN-005..009`, `RQ-TRN-016`)
- Missing: deterministic retransmission policy, duplicate/TID window handling, NACK hold-off profile behavior.
- Ticket lane: `T0-18`

2. WDP datagram/UDP contract (`RQ-TRN-001..004`)
- Missing: concrete protocol-native datagram trait as ingress boundary, deterministic malformed/MTU/SAR profile behavior.
- Ticket lane: `T0-19`

3. WSP registry and unknown-token behavior (`RQ-TRN-014`, `RQ-TRN-018`)
- Missing: full assigned-number coverage in active profile with deterministic unknown-token/page policy.
- Ticket lane: `T0-20`

## P1 Critical Next

1. WTLS phase boundary (`RQ-SEC-004`, `RQ-SEC-005`)
- Explicit no-op vs minimal-active mode; no implicit activation.
- Ticket lane: `T0-21`

2. Replay/interop promotion gates (`RQ-TRN-005..019`)
- CONNECT/GET/REPLY + retransmit/duplicate fixture corpus required for profile promotion.
- Ticket lane: `T0-22`

## P2 Hardening

1. Adjacent-profile source classification and scope lock (`RQ-TRX-*`)
- Ticket lanes: `T0-12`, `T0-13`, `T0-23`
- Current index/evidence source:
  - `docs/waves/NETWORKING_EXTERNAL_SOURCE_INDEX.md`
  - `spec-processing/external-source-index.json`
  - `spec-processing/new-source-material/external-networking/README.md`

2. Canonical source-pipeline quality controls
- Keep parse/promote governance aligned with spec-processing flow and drift checks.

3. External vector adoption ranking (`RQ-TRN-*`, `RQ-SEC-*`)
- Ticket lane: `T0-25`
- Current adoption register:
  - `docs/waves/NETWORKING_VECTOR_ADOPTION_SWEEP.md`
  - `docs/waves/networking-vector-adoption.json`

## Source anchors

Primary requirement sources:

- `docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`
- `docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`
- `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`

Execution sources:

- `docs/waves/WORK_ITEMS.md`
- `docs/waves/networking-implementation-checklist.md`
- `docs/waves/networking-migration-readiness-checklist.md`
- `docs/waves/networking-layer-definition.md`

## Promotion gate rule

Do not promote from `gateway-bridged` to `wap-net-core` until:

1. `T0-18`, `T0-19`, `T0-20`, `T0-22` are green.
2. `T0-21` posture is explicit and default-safe.
3. profile gates in `docs/waves/networking-migration-readiness-checklist.md` are satisfied.
