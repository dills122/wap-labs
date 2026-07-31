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

## WAP Compliance Rebase (2026-07-30)

Source/spec planning for the selected WAP-215 Class C profile is complete:
198 selected parent rows, 762 planned clause fixtures, and a
13-sprint/83-item execution program plus the `TRN-7-CL-C` selected-profile
transport gate. The conservative implementation snapshot
is 41 implemented, 78 partial, and 79 missing parent rows; clause-level
assessment is 317/762 after WML-301 closed 13 context/history/process-order/card-table clauses,
WML-309 closed three frame-affordance presentation clauses,
WML-302 closed 18 newly implemented clauses,
retained 2 already implemented shared clauses, WSP-801 directly closed its
35-clause connectionless matrix, WSP-802 added 22 net assessed header clauses,
WML-305 closed its 10 directly mapped timer clauses and completed parent row
WML-C-48, WML-304 added one net assessed request-intent clause while moving
WML-C-14 from missing to partial, WSP-805 preserved the merged request-serialization
evidence, and additive WMLS-501 added 15 library-index and stack-dataflow clauses
while moving seven library parent rows from missing to partial.

The July 28-30 bug-fix, desktop, and private-preview merges add regression and release-readiness
evidence. WML-309 and the additive WMLS-501 verifier tranche change the machine-backed evidence
state: Project Atlas now renders 30 `done`, 10 `in-progress`, 42 `todo`, and one `blocked` work
item with 317/762 clauses assessed. The WML-301 graph labels its seven inherited card/WAE clauses
as aggregate context rather than direct closure, while broader WMLScript execution and
standard-library claims remain partial.

Use this order for new completion work:

1. Preserve the completed `WML-2` baseline while `TRN-7` continues.
2. Preserve completed `WML-302`, `WML-303`, and `WML-305` evidence while
   advancing the remaining `WML-3` work.
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
internal implementation or evidence work: the 97-member private evidence set,
106-entry redistribution inventory, and request package are ready, while
maintainer approval to send and written permission remain open.

## Current Snapshot (as of 2026-07-30, `origin/main` `6cf1682a`)

This snapshot replaces the original kickoff view and reflects the current post-transport-burn-down state.

| Ticket          | Lane                         | Current status | Immediate dependency action                                                                                            |
| --------------- | ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `A5-01`         | engine/runtime               | `done`         | request-shaped history fidelity and deterministic restore semantics are covered                                        |
| `A5-04`         | engine + browser             | `done`         | viewport-editable text input baseline is closed                                                                        |
| `A5-05`         | engine + browser             | `done`         | select/option interaction baseline is closed                                                                           |
| `A5-06`         | engine + browser + transport | `done`         | form-state submit hardening is closed for the active MVP lane                                                          |
| `A5-07`         | browser                      | `done`         | blocking startup/navigation/browser hot-path remediation landed in `#109/#110`                                         |
| `R0-02`         | engine + browser + transport | `done`         | closed with deterministic host/runtime request-fidelity coverage                                                       |
| `R0-03`         | engine + browser             | `done`         | closed with history/context fidelity integration evidence                                                              |
| `W0-05`         | wavescript/runtime           | `done`         | timer→script→dialog host capability ordering is executable and deterministic; strict Dialogs/WMLS-5 remains downstream |
| `W0-06`         | engine/wavescript            | `done`         | strict structural closure continues in `W1-02`                                                                         |
| `W1-06`         | wavescript/runtime           | `in-progress`  | finalize remaining fatal/non-fatal fixture classes and close checklist split                                           |
| `D0-01`–`D0-03` | engine + browser + docs      | `done`         | additive debug DTOs, bounded masked engine events/snapshots, and the default-disabled host session bridge are settled  |
| `T0-18`         | transport                    | `done`         | retransmission/duplicate/NACK hold-off baseline is closed                                                              |
| `T0-19`         | transport                    | `done`         | WDP ingress and UDP mapping baseline is closed                                                                         |
| `T0-20`         | transport                    | `done`         | WSP registry/header/session baseline is closed                                                                         |
| `T0-21`         | transport/security           | `done`         | explicit WTLS boundary and minimal reliability lane are now closed                                                     |
| `T0-22`         | transport                    | `done`         | replay promotion gate is closed and seed-backed                                                                        |
| `T0-24`         | transport/docs               | `done`         | seed corpus is formalized and promotion-gated                                                                          |
| `T0-25`         | docs/spec-processing         | `done`         | external vector adoption sweep is closed                                                                               |
| `T0-26`         | transport/browser/docs       | `done`         | local Kannel readiness gate is explicit and runnable                                                                   |
| `M1-08`         | maintenance                  | `done`         | boundary-module decomposition is complete; new hotspots require additive tickets                                       |
| `M1-16`         | maintenance/security         | `done`         | payload-size guardrails are closed for the current transport/engine/browser boundary                                   |

Landed since the prior planning sync, without reopening completed tickets:

1. Engine/browser/transport/service bug fixes through PR #516 add bounded malformed-input,
   retransmission, context/variable/timer/input/select, navigation-concurrency, authentication,
   service-supervision, static-example-loop, terminal-intent quarantine, and atomic frame-command
   regression coverage.
2. `WBP-02A`, the second-pass visual refinement, and the redesigned shell/Developer Tools workspace
   are on `main`. They preserve the reference-handset boundary and are not `WBP-02B` or F1 renderer
   evidence.
3. `WML-309`/`WBP-06`/F0, WML-301's direct card-table tranche, WSP-805 request application, and the
   additive WMLS-501 verifier tranche are landed. Their aggregate work items remain conservative
   where the canonical program still records downstream or delegate gaps.
4. The hardened Kannel/Go deployment is healthy on the restricted preview host with Tailnet smoke,
   sealed-firewall reboot persistence, and retained rollback. Public DNS, UDP publication, and
   external probes remain gated and make no Class C contribution.

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

1. Preserve the completed `D0-01` debug connector contract and architecture baseline.
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

The six-task batch is retained as dispatch history. A1, B1, C1, and D1 are complete; A2 and B2 are
the active compliance batons. The desktop pre-release lane has additionally completed F1 host
rendering/navigation plus RSL-01 through RSL-05 containment. Order remains binding within a lane,
and lanes may run concurrently subject to the noted file ownership.

| Priority | Lane / task                                                                        | Dependency and overlap boundary                                                                                                                                                                                | Class C contribution                                                                                                         | First useful desktop pre-release contribution                                                  |
| -------: | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
|        1 | Request A1 — `WML-304` / `R0-06` / `WSP-805` native request application (complete) | Landed typed GET query/form-urlencoded POST construction, charset-bearing content type, referer/no-cache policy, and direct HTTP/native WSP handoff while preserving the transport/browser ownership boundary. | Brings WML-304 to 13/15 directly assessed clauses; multipart part content type and POST replay remain explicit follow-ups.   | Makes real network forms and request policy usable through the native desktop path.            |
|        2 | Script B1 — `WMLS-501` verifier scope (complete)                                   | Additively closed over the merged decoder/runtime-routing history; owns WAP decoder/verifier fixtures and `engine-wasm/engine/src/wavescript/*`.                                                               | Directly verifies standard-library indexes and stack dataflow while preserving broader partial SCR rows.                     | Prevents malformed script units from weakening a tester-facing desktop build.                  |
|        3 | Runtime C1 — `WML-301` card-table direct tranche (complete)                        | Landed rendering/mapping fixtures without taking ownership of request serialization or browser fetch handoff.                                                                                                  | Closes the planned direct card-table boundary while leaving the aggregate WAE delegates explicitly not assessed.             | Improves deterministic historical page presentation in the reference handset.                  |
|        4 | Desktop D1 — `WBP-06` / `F0-01` frame-and-affordance contract (complete)           | Landed the frame/input contract, generated projections, and drift gates while preserving the separate `EngineDebug*` namespace.                                                                                | Closes WML-309's three dynamic `do` presentation clauses; it does not itself close WML-3.                                    | Establishes the engine-owned frame and affordance spine required for a credible desktop alpha. |
|        5 | Request A2 — replayable POST history                                               | Starts after A1 fixes the serialized request shape; shares navigation/history structures with C1, so land after C1 or coordinate one owner.                                                                    | Directly targets `WML-CL-HISTORY-POST-REPLAY` and the remaining partial WML-C-07/WML-C-38 boundary.                          | Makes form navigation/back behavior predictable in public-lab scenarios.                       |
|        6 | Script B2 — bounded `WMLS-502` operator/conversion execution                       | Starts after B1 establishes stack dataflow; same files as B1, so it is sequential in lane B.                                                                                                                   | Begins converting the 32 partial / 9 missing WMLScript parents and 107 unassessed language clauses into executable evidence. | Expands the safe script behavior available to representative WAP decks.                        |

Desktop dispatch checkpoint: F1-01 through F1-03, RSL-01 through RSL-07, APP-STATE-01,
APP-FAV-01, APP-CMD-01, and D0-01 through D0-03 are complete. F2-01 and D0-04 remain independent
parallel slices; WBP-11 and APP-SHELL-01 follow on shared presenter/shell surfaces. RSL-07 bounds
retained history but leaves issue `#450`'s cross-deck same-card identity correction to its separate
follow-up.

Preserve completed WML, WBXML, WDP, WCMP, and WSP evidence; do not activate
connection-oriented WSP/WTP to manufacture completion. `REN-4` and full
`WMLS-5`/`WAE-6` closure remain downstream of `WML-3` even when isolated
foundations proceed early.

`WML-306` is the next compliance slice after this batch; its browser policy files overlap A1/A2,
so dispatching it now would create avoidable ownership conflict. The public-WAP-services workstream
is also deliberately not part of this batch. Its private host/application deployment, live
Tailnet smoke, and rollback work are already handled by that stream, while `PERF-101`, `OPS-101`,
and public publication remain blocked on access/decision gates and external evidence. None of that
changes Class C evidence.

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
