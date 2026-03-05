# WTP State Machine

Status: `ACTIVE`
Date: `2026-03-04`

Defines the transaction-layer contract for implementation and test.

Source grounding:
- `spec-processing/source-material/WAP-224-WTP-20010710-a.pdf`
- `spec-processing/source-material/OMA-WAP-224_002-WTP-SIN-20020827-a.PDF`

## 1) Transaction classes

| Class | Reliability model | MVP scope | Key protocol obligations |
| ----- | ----------------- | --------- | ------------------------ |
| 0 | Unreliable invoke | Deferred (parsing support first) | no retransmission |
| 1 | Reliable one-way | Implemented | `Invoke` + ACK path |
| 2 | Reliable request/response | Primary | `Invoke -> ACK -> RESULT` |

## 2) Core state model

- `Idle`
- `InvokeSent`
- `AwaitingAck`
- `AwaitingResult`
- `Completed`
- `Aborted`
- `TimedOut`
- `Closed`

## 3) Class-specific transitions

### Class 0 (unreliable invoke)

| From | Event | To | Side effects |
| ---- | ----- | -- | ----------- |
| `Idle` | `send_invoke` | `Completed` | emit invoke; no ack/result handling |

### Class 1 (reliable one-way)

| From | Event | Guard | To | Side effects |
| ---- | ----- | ----- | -- | ------------ |
| `Idle` | `send_invoke` | valid TID, encoding complete | `InvokeSent` | send invoke; start retransmission |
| `InvokeSent` | `rx_ack` | tid/session match | `Completed` | stop retransmission; notify success |
| `InvokeSent` | `rx_nack` | transport accepted negative ack | `Completed` | surface protocol fault |
| `InvokeSent` | `timer_expired` | retries remaining | `InvokeSent` | resend invoke |
| `InvokeSent` | `timer_expired` | no retries | `TimedOut` | timeout event and user-facing error |

### Class 2 (reliable request/response)

| From | Event | Guard | To | Side effects |
| ---- | ----- | ----- | -- | ------------ |
| `Idle` | `send_invoke` | valid TID, encoding complete | `InvokeSent` | send invoke; start retransmission |
| `InvokeSent` | `tx_fragment` | transport layer accepts | `AwaitingAck` | transaction remains queued |
| `AwaitingAck` | `rx_ack` | tid/session match | `AwaitingResult` | stop invoke retry timers |
| `AwaitingAck` | `rx_result` | no reliable ordering requirement in this layer | `AwaitingResult` | allow optimistic result handling |
| `AwaitingResult` | `rx_result` | tid/session match | `Completed` | emit response payload |
| `AwaitingResult` | `timer_expired` | result timeout policy met | `TimedOut` | timeout and finalize |
| `AwaitingAck`/`AwaitingResult` | `abort` | user cancel or peer abort primitive | `Aborted` | generate abort result |
  
## 4) Duplicate handling and idempotency

- Track `(peer, tid, opcode)` window.
- If duplicate invoke is detected and transaction is already pending, emit idempotent acknowledgement when required.
- If completed/closed duplicate carries a terminal side effect, return/replay terminal outcome only.
- If duplicate is observed from unknown opcode, emit PROTOERR path per profile.

## 5) Deterministic contract rules

For every transition:

- previous state
- triggering event
- preconditions
- next state
- event record written to trace log

No state mutation in parser functions. Parser functions return a `ParsedPdu` only.

## 6) Retransmission and timer policy

- Use deterministic timer profile per bearer (per spec-defined defaults in WTP conformance text).
- Retry loop is bounded by a configured max attempts and explicit stop-on-success.
- Use a deterministic clock in tests for reproducibility.

Implement in `RetransmissionPolicy` with a simple stateful policy object:

```rust
pub struct RetransmissionPolicy {
    pub initial_ms: u64,
    pub max_retries: u8,
    pub backoff: BackoffKind,
    pub max_timeout_ms: u64,
}
```

## 7) TID policy and replay windows

- Maintain separate pools for client and server roles.
- Enforce valid incoming TID ranges and window policy.
- TID allocation is deterministic and supports wrap behavior.
- responder side should detect stale/duplicate TIDs and reply according to the profile-defined policy (including retransmitting cached terminal outcomes).

## 8) SAR/ESAR scope (optional)

Selective acknowledgment and retransmission can be enabled on top of class-2 where profile requires:

- packet grouping,
- per-group NACK and hold-off behavior,
- selective replay of missed segments.

Current profile defaults to off unless explicitly enabled by transport configuration.
