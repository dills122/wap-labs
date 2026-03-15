# Master Prioritized Sprint Plan (March 2026)

Status: active  
Effective date: 2026-03-15  
Planning horizon: 3 consecutive sprints

This plan is the cross-lane source of truth for "what is next" and resolves priority collisions between runtime compliance, networking closure, and maintenance.

## Priority Model

1. P0: unblock and close committed bedrock compliance tickets already in the active sprint lane.
2. P0: close networking dependency chain required before protocol-native implementation blockers can move.
3. P1: close already-active runtime/compliance work before starting fresh feature breadth.
4. P1: keep transport/security follow-up work limited to deferred depth or newly discovered blockers.
5. P2: run maintenance in parallel only when it does not starve P0/P1.

## Canonical Sources

- `docs/waves/WORK_ITEMS.md`
- `docs/waves/NETWORKING_GAP_MASTER.md`
- `docs/waves/SPRINT_PLAN_2026-03_BEDROCK_COMPLIANCE.md`
- `docs/waves/MAINTENANCE_WORK_ITEMS.md`
- `docs/wml-engine/work-items.md`

## Current Snapshot (as of 2026-03-15)

This snapshot replaces the original kickoff view and reflects the current post-transport-burn-down state.

| Ticket | Lane | Current status | Immediate dependency action |
| --- | --- | --- | --- |
| `A5-01` | engine/runtime | `in-progress` | finish request-shaped history entry fidelity and restore semantics |
| `A5-04` | engine + browser | `done` | viewport-editable text input baseline is closed |
| `A5-05` | engine + browser | `done` | select/option interaction baseline is closed |
| `A5-06` | engine + browser + transport | `done` | form-state submit hardening is closed for the active MVP lane |
| `A5-07` | browser | `done` | blocking startup/navigation/browser hot-path remediation landed in `#109/#110` |
| `R0-02` | engine + browser + transport | `done` | closed with deterministic host/runtime request-fidelity coverage |
| `R0-03` | engine + browser | `done` | closed with history/context fidelity integration evidence |
| `W0-05` | wavescript/runtime | `in-progress` | finish host capability plumbing and deterministic timer/dialog traces |
| `W0-06` | engine/wavescript | `done` | strict structural closure continues in `W1-02` |
| `W1-06` | wavescript/runtime | `in-progress` | finalize remaining fatal/non-fatal fixture classes and close checklist split |
| `D0-01` | engine + browser + docs | `todo` | next planning-ready contract/architecture slice after active runtime correctness work |
| `T0-18` | transport | `done` | retransmission/duplicate/NACK hold-off baseline is closed |
| `T0-19` | transport | `done` | WDP ingress and UDP mapping baseline is closed |
| `T0-20` | transport | `done` | WSP registry/header/session baseline is closed |
| `T0-21` | transport/security | `done` | explicit WTLS boundary and minimal reliability lane are now closed |
| `T0-22` | transport | `done` | replay promotion gate is closed and seed-backed |
| `T0-24` | transport/docs | `done` | seed corpus is formalized and promotion-gated |
| `T0-25` | docs/spec-processing | `done` | external vector adoption sweep is closed |
| `T0-26` | transport/browser/docs | `done` | local Kannel readiness gate is explicit and runnable |
| `M1-08` | maintenance | `in-progress` | browser/transport cleanup is residual only and should stay non-preemptive |
| `M1-16` | maintenance/security | `done` | payload-size guardrails are closed for the current transport/engine/browser boundary |

## Sprint 1 Review: Bedrock + Networking Unblockers

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
2. `M1-08` residual browser/transport cleanup only if new hot files emerge.

### Exit Gates

1. Bedrock tickets `A5-01`, `R0-02`, `R0-03`, `W0-06` are `done` with mapped tests in `docs/waves/SPEC_TEST_COVERAGE.md`.
2. Networking unblockers `T0-10`, `T0-11`, `T0-12`, `T0-13`, `T0-14`, `T0-08`, `T0-09`, `T0-16` are `done`.
3. No P0 ticket is left in `blocked` due to unresolved dependency chain.

Current result:

1. Transport/spec unblockers are complete.
2. `A5-01` is not actually `done`; it remains active on the engine board and should stay in the next sprint.
3. The original Sprint 1 snapshot overstated closure on at least one engine/runtime item and should not be used as the current source of truth.

## Sprint 2 Review: Networking Protocol-Core Blockers

### Goal

Close protocol-native transport P0 blockers and make replay harness work executable.

### Must Complete (P1)

1. `T0-19` WDP datagram trait + UDP port mapping baseline.
2. `T0-18` WTP retransmission/NACK hold-off policy implementation.
3. `T0-20` WSP header registry completion and unknown-token policy. `done`

### Follow-on (same sprint if capacity allows)

1. `T0-22` networking interop replay harness and golden event corpus.

### Exit Gates

1. `T0-19`, `T0-18`, `T0-20` are `done` with deterministic fixture coverage.
2. `T0-22` is `done`.
3. Promotion-gate preconditions in `docs/waves/networking-migration-readiness-checklist.md` are updated with current evidence.

Current result:

1. Sprint 2 transport goals are complete.
2. `T0-24`, `T0-25`, and `T0-26` also landed ahead of the original plan.

## Sprint 3 Review: Promotion Hardening + WTLS Boundary

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

Current result:

1. `T0-21`, `T0-24`, and `T0-25` are complete.
2. Networking protocol-policy closure is no longer the pacing constraint, but live desktop/browser ingress still needs a native fetch lane instead of the legacy HTTP gateway bridge.

## Targeted Sprint Recommendation: Runtime Fidelity + Debug Boundary Reset (2026-03-15 onward)

### Goal

Now that the interactive forms lane and browser responsiveness remediation are landed, shift the active sprint back toward runtime correctness closure and the next planning-ready boundary definition.

### Must Complete (P0/P1)

1. `A5-01` history entry fidelity follow-up.
2. `W0-05` timer/dialog integration baseline.
3. `D0-01` debug connector contract and architecture baseline.

### Follow-on (only if capacity remains)

1. `W1-06` fatal/non-fatal script error taxonomy closure.
2. `M1-09` frame migration kickoff (`F0-*` only).
3. residual `M1-08` cleanup if a new hotspot emerges during the active lane.

### Concrete commit-order recommendation

1. `fix(engine): close history entry fidelity gaps under request-shaped navigation`
2. `feat(runtime): finish timer/dialog host capability plumbing`
3. `docs(debug): lock engine debug connector contract and boundary rules`
4. `feat(host): start frame migration only after the above boundaries are stable`

Implementation reference:

- [NATIVE_WSP_POST_RESEARCH_NOTES.md](/Users/dsteele/repos/wap-labs/docs/waves/NATIVE_WSP_POST_RESEARCH_NOTES.md)

### Exit Gates

1. History/session fidelity gaps are reduced without reopening the now-stable form/browser responsiveness lane.
2. Timer/dialog runtime semantics are host-integrated and deterministic.
3. Debug connector architecture is contract-ready before another host-boundary migration starts.
4. A fresh planning cycle is only needed once those three items materially change the execution picture.

## Parallel Follow-on Sprint Recommendation

Current recommendation after this refresh:

1. `A5-01` history entry fidelity follow-up.
2. `W0-05` timer/dialog integration baseline.
3. `D0-01` debug connector contract baseline.
4. `W1-06` fatal/non-fatal script error taxonomy closure.

Completed this sprint:

1. interactive text-input and select-control viewport editing
2. native/browser submit hardening for the active form lane
3. browser responsiveness and UI-blocking remediation
4. transport/engine payload-size guardrails for active boundaries

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
