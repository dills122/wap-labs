# Waves Open Spec Questions

Status: active
Updated: 2026-03-05

## Purpose

Track unresolved policy choices where implementation behavior must remain explicit and deterministic.

## Questions

1. WSP unknown-token policy default
- Scope: `RQ-TRN-018`
- Options: strict reject vs permissive ignore by profile.
- Current lane: `T0-20`
- Needed decision: default profile behavior and error code mapping.

2. WSP suspend/resume default posture
- Scope: `RQ-TRN-011`
- Options: disable by default in MVP profile vs enable with bounded state model.
- Current lane: `T0-11`
- Needed decision: default mode + promotion gates.

3. Capability bounds overage behavior
- Scope: `RQ-TRN-019`
- Options: session abort vs deterministic downgrade.
- Current lane: `T0-11`
- Needed decision: per-capability overage handling matrix.

4. WTP NACK hold-off profile defaults
- Scope: `RQ-TRN-007`, `RQ-TRN-016`
- Options: conservative timer hold-off vs aggressive retransmit.
- Current lane: `T0-18`
- Needed decision: default retry/backoff values for MVP profile.

5. WAE cache eviction and low-memory semantics
- Scope: `RQ-WAE-008`, `RQ-WAE-016`
- Options: minimal deterministic LRU policy vs richer multi-tier cache policy.
- Current lane: `T0-04`, `R0-03`
- Needed decision: explicit eviction order and user-visible error/reset behavior.

6. Unknown DTD handling policy in host/runtime boundary
- Scope: WML 12.x policy lanes (`R0-07`)
- Options: hard reject vs controlled fallback mode.
- Current lane: `R0-07`
- Needed decision: deterministic error class and recovery behavior.

## Resolution protocol

For each question:

1. decide policy in one doc PR,
2. update affected `RQ-*` AC evidence lines,
3. update `WORK_ITEMS.md` ticket acceptance,
4. add/adjust fixture and command in `SPEC_TEST_COVERAGE.md`.
