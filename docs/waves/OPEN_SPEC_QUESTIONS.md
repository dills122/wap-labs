# Waves Open Spec Questions

Status: active
Updated: 2026-03-05

## Purpose

Track unresolved policy choices where implementation behavior must remain explicit and deterministic.

## Questions

1. WSP unknown-token policy default
- Scope: `RQ-TRN-018`
- Status: resolved in `T0-20`
- Decision: default profile behavior is strict reject for unknown tokens and unsupported extension code pages; header-lenient profile may ignore unsupported extension-page tokens and use textual fallback for extension header encoding.

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

6. Unknown DTD host-policy completion
- Scope: WML 12.x policy lanes (`R0-07`, `WML-203`)
- Resolved parser policy: canonical WML 1.3 identity is recognized; alternate
  external DTDs use controlled section 12.4 fallback; malformed declarations
  fail deterministically; external DTDs are never fetched.
- Remaining decision: host-visible error class and recovery behavior for
  strict prologue/full-validation failures.

## Resolution protocol

For each question:

1. decide policy in one doc PR,
2. update affected `RQ-*` AC evidence lines,
3. update `WORK_ITEMS.md` ticket acceptance,
4. add/adjust fixture and command in `SPEC_TEST_COVERAGE.md`.
