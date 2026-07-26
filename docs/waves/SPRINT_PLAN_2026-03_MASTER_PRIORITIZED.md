# Master Prioritized Sprint Plan (March 2026)

Status: active for already-in-flight cross-lane work; WAP 1.2.1 completion is governed by the compliance program

Effective date: 2026-03-15

Planning horizon: 3 consecutive sprints

This plan resolves priority collisions for work already in flight. For new
WAP 1.2.1 work and any completion/conformance claim, the dependency authority
is `docs/waves/wap-1.2.1-compliance-program.json`, summarized by
`docs/waves/WAP_1_2_1_PLANNING_BASELINE.md`.

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
- `docs/waves/WAP_1_2_1_PLANNING_BASELINE.md`
- `docs/waves/wap-1.2.1-compliance-program.json`

## WAP Compliance Rebase (2026-07-24)

Source/spec planning for the selected WAP-215 Class C profile is complete:
198 selected parent rows, 762 planned clause fixtures, and a
13-sprint/81-item execution program plus the `TRN-7-CL-C` selected-profile
transport gate. The conservative implementation snapshot
is 24 implemented, 76 partial, and 98 missing parent rows; clause-level
assessment is 176/762.

Use this order for new completion work:

1. Preserve the completed `WML-2` baseline while `TRN-7` continues.
2. Advance the unlocked `WML-3` baton through `WML-303`, `WML-302`, and
   `WML-305`.
3. `REN-4` and `WMLS-5` follow `WML-3`.
4. `WAE-6` follows runtime, rendering, and script closure.
5. The selected connectionless `WSP-8` path follows completed gate
   `TRN-7-CL-C` and `WAE-6`; the whole `TRN-7` sprint remains open only for
   separately activated capabilities and their evidence.
6. `INT-9` and then `REL-10` close cross-layer and release evidence.
7. `OPT-11` and `ENH-12` remain post-`REL-10` capability lanes.

Existing downstream work may continue as an isolated foundation, but it
cannot close its sprint or satisfy an upstream obligation early. The blocked
source item `SRC-006` gates public redistribution only and does not block
internal implementation or evidence work.

## Current Snapshot (as of 2026-07-25)

This snapshot replaces the original kickoff view and reflects the current post-transport-burn-down state.

| Ticket | Lane | Current status | Immediate dependency action |
| --- | --- | --- | --- |
| `A5-01` | engine/runtime | `done` | request-shaped history fidelity and deterministic restore semantics are covered |
| `A5-04` | engine + browser | `done` | viewport-editable text input baseline is closed |
| `A5-05` | engine + browser | `done` | select/option interaction baseline is closed |
| `A5-06` | engine + browser + transport | `done` | form-state submit hardening is closed for the active MVP lane |
| `A5-07` | browser | `done` | blocking startup/navigation/browser hot-path remediation landed in `#109/#110` |
| `R0-02` | engine + browser + transport | `done` | closed with deterministic host/runtime request-fidelity coverage |
| `R0-03` | engine + browser | `done` | closed with history/context fidelity integration evidence |
| `W0-05` | wavescript/runtime | `done` | timer→script→dialog host capability ordering is executable and deterministic; strict Dialogs/WMLS-5 remains downstream |
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
| `M1-08` | maintenance | `done` | boundary-module decomposition is complete; new hotspots require additive tickets |
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
2. Add a new maintenance ticket only if active work exposes a concrete
   high-churn hotspot.

### Exit Gates

1. Bedrock tickets `A5-01`, `R0-02`, `R0-03`, `W0-06` are `done` with mapped tests in `docs/waves/SPEC_TEST_COVERAGE.md`.
2. Networking unblockers `T0-10`, `T0-11`, `T0-12`, `T0-13`, `T0-14`, `T0-08`, `T0-09`, `T0-16` are `done`.
3. No P0 ticket is left in `blocked` due to unresolved dependency chain.

Current result:

1. Transport/spec unblockers are complete.
2. `A5-01` is now closed by engine history/back evidence plus browser request-shaped host-history coverage.
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

1. `D0-01` debug connector contract and architecture baseline.
2. `W1-06` fatal/non-fatal script error taxonomy closure.

Completed foundation:

- `W0-05` timer/dialog integration baseline.

### Follow-on (only if capacity remains)

1. `W1-06` fatal/non-fatal script error taxonomy closure.
2. `M1-09` frame migration kickoff (`F0-*` only).
3. additive hotspot cleanup only when active work identifies a specific
   boundary problem.

### Concrete commit-order recommendation

1. `docs(debug): lock engine debug connector contract and boundary rules`
2. `fix(runtime): close remaining fatal/non-fatal script taxonomy gaps`
3. `feat(host): start frame migration only after the above boundaries are stable`

Implementation reference:

- [NATIVE_WSP_POST_RESEARCH_NOTES.md](../../docs/waves/NATIVE_WSP_POST_RESEARCH_NOTES.md)

### Exit Gates

1. History/session fidelity gaps are reduced without reopening the now-stable form/browser responsiveness lane.
2. Timer/dialog runtime semantics are host-integrated and deterministic.
3. Debug connector architecture is contract-ready before another host-boundary migration starts.
4. A fresh planning cycle is only needed once those three items materially change the execution picture.

## Parallel Follow-on Sprint Recommendation

Current recommendation after all merged implementation workstreams:

1. **Mapping/evidence lane:** preserve `WML-201`'s completed 76-row evidence
   projection and 175/175 direct WML-clause mapping.
2. **Engine lane, first:** preserve completed `WML-202` access-policy,
   root-language, and card-context evidence (30/30 direct clauses) and completed
   `WML-204` vdata/HREF conversion and field/control validation evidence (23/23
   direct clauses) without reopening either history.
3. **Engine lane, next:** preserve completed `WML-203` mandatory prologue,
   selected DTD content-model, text/WBXML parity, and document-family evidence
   (68/68 direct clauses), plus completed `WML-205` exhaustive invalid-WML and
   atomic fetch/access failure evidence (3/3), then advance `WML-303`,
   `WML-302`, and `WML-305`.
4. **Transport lane:** preserve the completed schema-v2 selected WDP replay
   boundary for `TRN-706` and keep its WTP family gap explicit under additive
   `TRN-704`/`TRN-705` follow-ups. Do not activate WTP or connection-oriented
   WSP to manufacture completion. Use completed gate `TRN-7-CL-C` for the
   selected connectionless profile, and track the zero-direct-clause
   `TRN-703` gap additively in `TRN-710` without reopening TRN-703.
5. **Browser lane:** preserve the completed `WBP-00` through additive `WBP-05A`
   accessibility evidence closure without reopening `WBP-05`. Keep `WBP-06` inactive until `WML-2`,
   `WML-303`, and the overlapping `D0-01` contract sequence satisfy the gate
   recorded in the browser implementation plan.

`W1-06`, `D0-01`, frame migration, and general maintenance remain
non-preemptive until these upstream Class C gates materially change.
`WSP-801`/`WSP-802` may continue on the selected connectionless path because
`TRN-7-CL-C` is complete; `WSP-8` still cannot close before `WAE-6` and its own
remaining gates. Connection-oriented WSP continues to require the dormant WTP
work retained in `TRN-7`.

Completed this sprint:

1. interactive text-input and select-control viewport editing
2. native/browser submit hardening for the active form lane
3. browser responsiveness and UI-blocking remediation
4. transport/engine payload-size guardrails for active boundaries
5. story-driven host-sample and Waves-browser acceptance harnesses
6. WML-204 input/select direct evidence and acceptance closure (23/23 clauses)
7. WML-203 WML/WBXML, prologue, and selected DTD evidence tranche (68/68 clauses)
8. TRN-701 WDP, TRN-702 constrained payload, and TRN-703 WCMP direct evidence
9. WML-203 schema-v2 WDP SDU -> fetch/WBXML decode -> native engine parity,
   paired with executable WASM text-deck rendering evidence
10. WML-201 direct SCR/clause evidence projection and declared-family mapping
11. WML-202 root/head/access/meta retention and deterministic parser evidence
12. WML-205 structured diagnostics, exhaustive invalid-WML enforcement, and
    atomic production-WASM fetch/access failure recovery (3/3 clauses), closing WML-2
13. WML-204 grouped-control syntax validation and executable story coverage
14. Waves desktop product direction plus the first WBP-01 shell component seams

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
