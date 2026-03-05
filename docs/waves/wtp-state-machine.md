# WTP State Machine (Draft)

Status: `DRAFT` (source-grounding in progress)
Date: `2026-03-04`

This draft defines the transaction-layer state machine contract for WTP rewrite work.
Exact timer values, opcode details, and optional extensions are pending source confirmation.

Source grounding:
- `spec-processing/source-material/WAP-224-WTP-20010710-a.pdf`
- `spec-processing/source-material/OMA-WAP-224_002-WTP-SIN-20020827-a.PDF`

## 1) Transaction classes

| Class | Reliability model | Scope in MVP | Notes |
| ----- | ----------------- | ------------ | ----- |
| 0 | Unreliable invoke | Deferred | No retransmission |
| 1 | Reliable one-way | Partial | Ack required, no result |
| 2 | Reliable request/response | Primary | Ack + result path |

## 2) Core states

- `IDLE`
- `INVOKE_SENT`
- `WAIT_ACK`
- `RESULT_RECEIVED`
- `COMPLETE`
- `ABORTED`
- `TIMED_OUT`

## 3) Core transition table (class 2 baseline)

| From | Event | Guard | To | Side effects |
| ---- | ----- | ----- | -- | ------------ |
| IDLE | `send_invoke(req)` | valid request, tid available | INVOKE_SENT | serialize invoke + start retransmit timer |
| INVOKE_SENT | `tx_success` | none | WAIT_ACK | update tx state |
| WAIT_ACK | `rx_ack` | ack tid matches | RESULT_RECEIVED | stop timer; await result |
| WAIT_ACK | `timer_expired` | retries remaining | INVOKE_SENT | retransmit + decrement retry budget |
| WAIT_ACK | `timer_expired` | no retries | TIMED_OUT | raise timeout event |
| RESULT_RECEIVED | `rx_result` | tid matches | COMPLETE | emit result payload |
| RESULT_RECEIVED | `timer_expired` | late result not expected | COMPLETE | emit stale-result warning (policy-defined) |
| any | `rx_duplicate` | known tid/window | unchanged | deduplicate + optional ack |
| any | `abort` | local cancel | ABORTED | emit abort event |

## 4) Class-specific behavior

### Class 0
- Build invoke and emit without response expectation
- Duplicate filter can still be useful to avoid local loops

### Class 1
- Treat ack as completion event
- No result handling state needed beyond ack

### Class 2
- Track both ack and result ordering
- Ensure result is rejected if ack never completes and transaction has timed out

## 5) Deterministic FSM contract

For every transition, implementation should define:

- previous state
- triggering event
- preconditions
- next state
- event record written to trace log

No state mutation in parser functions. Parser functions return a `ParsedPdu` only.

## 6) Retry strategy (policy placeholder)

- fixed initial retry interval: confirm from spec
- exponential backoff: confirm from source
- max retry count: confirm from source

Implement retry strategy in `RetransmissionPolicy` so behavior can be tested deterministically via deterministic clocks.

## 7) Duplicate suppression model

- Track `(peer, transaction_id, opcode)` window
- Keep short-lived seen map with bounded capacity
- On duplicate:
  - suppress duplicate invoke side effects
  - emit idempotent ack/result if needed by protocol semantics
