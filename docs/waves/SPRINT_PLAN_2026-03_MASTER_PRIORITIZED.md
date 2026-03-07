# Master Prioritized Sprint Plan (March 2026)

Status: active  
Effective date: 2026-03-06  
Planning horizon: 3 consecutive sprints

This plan is the cross-lane source of truth for "what is next" and resolves priority collisions between runtime compliance, networking closure, and maintenance.

## Priority Model

1. P0: unblock and close committed bedrock compliance tickets already in the active sprint lane.
2. P0: close networking dependency chain required before protocol-native implementation blockers can move.
3. P1: execute networking protocol-core blockers (`T0-19`, `T0-18`, `T0-20`) and replay promotion gate (`T0-22`).
4. P2: run WTLS minimum lane (`T0-21`) only after P0/P1 gates are stable.
5. P2: run maintenance in parallel only when it does not starve P0/P1.

## Canonical Sources

- `docs/waves/WORK_ITEMS.md`
- `docs/waves/NETWORKING_GAP_MASTER.md`
- `docs/waves/SPRINT_PLAN_2026-03_BEDROCK_COMPLIANCE.md`
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- `docs/wml-engine/work-items.md`

## Sprint 1 Activation Snapshot (as of 2026-03-06)

This snapshot is the operational kickoff view for Sprint 1 planning and standups.

| Ticket | Lane | Current status | Immediate dependency action |
| --- | --- | --- | --- |
| `A5-01` | engine/runtime | `done` | keep regression coverage current in `SPEC_TEST_COVERAGE` |
| `R0-02` | engine + browser + transport | `done` | closed with deterministic host/runtime request-fidelity coverage |
| `R0-03` | engine + browser | `done` | closed with history/context fidelity integration evidence |
| `W0-06` | engine/wavescript | `done` | baseline structural verification gates landed; strict closure continues in `W1-02` |
| `T0-10` | transport | `done` | assigned-number fixture and unknown-policy lane is now regression-backed |
| `T0-11` | transport | `done` | capability merge and bounds fixtures landed with deterministic abort-mapping behavior |
| `T0-12` | transport + spec | `done` | Wireless Profiled TCP posture declaration and drift checks are in place |
| `T0-13` | transport + docs | `done` | SMPP adaptation scope is explicitly deferred with fixture-backed guardrails |
| `T0-14` | cross-layer decision gate | `done` | canonical profile decision record + machine-checkable promotion gate are in place |
| `T0-08` | transport | `done` | replay-window policy alignment and table-driven fixture closure |
| `T0-09` | transport | `done` | WSP connectionless primitive-profile matrix and validation is fixture-backed |
| `T0-16` | spec-processing | `done` | execute immediately after `T0-14` |

## Sprint 1 (2026-03-09 to 2026-03-20): Bedrock + Networking Unblockers

### Goal

Close committed bedrock compliance work while unblocking networking P0 blockers through dependency tickets.

### Must Complete (P0)

1. `A5-01` history entry fidelity.
2. `R0-02` inter-card process-order conformance.
3. `R0-03` history/context fidelity completion.
4. `W0-06` bytecode verification gates follow-up.
5. `T0-10` WSP assigned-number registry conformance fixtures.
6. `T0-11` WSP capability-bound and negotiation-limit enforcement.
7. `T0-12` Wireless Profiled TCP compatibility profile declaration.
8. `T0-13` SMPP adaptation scope gate and fixture baseline.
9. `T0-14` networking profile decision record and migration gates.
10. `T0-08` WTP replay-window conformance follow-up.
11. `T0-09` WSP connectionless primitive-profile conformance.
12. `T0-16` spec queue canonicalization follow-up.

### Stretch (only if all P0 are green)

1. `W1-02` bytecode structural verification closure.
2. `M1-08` remaining browser/transport decomposition slices.

### Exit Gates

1. Bedrock tickets `A5-01`, `R0-02`, `R0-03`, `W0-06` are `done` with mapped tests in `docs/waves/SPEC_TEST_COVERAGE.md`.
2. Networking unblockers `T0-10`, `T0-11`, `T0-12`, `T0-13`, `T0-14`, `T0-08`, `T0-09`, `T0-16` are `done`.
3. No P0 ticket is left in `blocked` due to unresolved dependency chain.

## Sprint 2 (2026-03-23 to 2026-04-03): Networking Protocol-Core Blockers

### Goal

Close protocol-native transport P0 blockers and make replay harness work executable.

### Must Complete (P1)

1. `T0-19` WDP datagram trait + UDP port mapping baseline.
2. `T0-18` WTP retransmission/NACK hold-off policy implementation.
3. `T0-20` WSP header registry completion and unknown-token policy.

### Follow-on (same sprint if capacity allows)

1. `T0-22` networking interop replay harness and golden event corpus.

### Exit Gates

1. `T0-19`, `T0-18`, `T0-20` are `done` with deterministic fixture coverage.
2. `T0-22` is at least `in-progress` with runnable replay scaffold; target `done` if capacity permits.
3. Promotion-gate preconditions in `docs/waves/networking-migration-readiness-checklist.md` are updated with current evidence.

## Sprint 3 (2026-04-06 to 2026-04-17): Promotion Hardening + WTLS Boundary

### Goal

Finalize replay-driven promotion evidence and close explicit WTLS boundary posture.

### Must Complete

1. `T0-22` (if not already done in Sprint 2).
2. `T0-21` WTLS phase boundary and minimal handshake reliability lane (default disabled).

### Optional

1. `T0-24` PCAP seed corpus spike.
2. `T0-25` external conformance/vector source sweep.
3. `M1-09` frame migration kickoff (`F0-*` only) if P0/P1 lanes are stable.

### Exit Gates

1. Networking promotion gate rule from `docs/waves/NETWORKING_GAP_MASTER.md` is fully satisfiable by committed evidence.
2. WTLS posture is explicit, default-safe, and test-backed (`no-op` vs minimal active mode).

## Capacity and WIP Rules

1. Max two concurrent P0/P1 tickets per lane (`engine`, `transport`, `browser`).
2. Never start P2 work when any P0/P1 ticket is `blocked` without an owner-assigned unblock action.
3. Maintenance tickets may run in parallel only when they do not delay P0/P1 acceptance gates.

## Weekly Operating Cadence

1. Monday planning sync: confirm active ticket set and dependency risks.
2. Mid-week gate check: verify test evidence and cross-board status sync.
3. Friday closeout: update `WORK_ITEMS.md`, `SPEC_TEST_COVERAGE.md`, and this plan in the same PR(s).

## Change-Control Rule

If a new high-priority ticket appears, insert it into this plan by explicit priority tier and dependency impact; do not bypass current P0/P1 gates without documented reason.

## Merge Readiness Checklist

1. `docs/waves/WORK_ITEMS.md` points to this file as canonical sprint ordering.
2. `docs/waves/MAINTENANCE_WORK_ITEMS.md` and `docs/wml-engine/work-items.md` reference this file for active sprint priority.
3. Sprint 1 tickets are tracked with current status fields on their source boards before code execution starts.
