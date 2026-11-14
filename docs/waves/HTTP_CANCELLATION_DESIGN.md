# Direct HTTP cancellation and recovery

Status: implemented; native Linux pilot passed. Branch: `codex/http-cancellation-recovery`.

## Objective

Keep native Waves responsive when direct HTTP requests stall, preserving the last committed deck
and allowing Stop, Back and new-address recovery. Cancellation must not replay POST, weaken
destination/redirect policy, or allow background work to grow without bound.

## Execution index

| ID      | Work                                                         | Ownership                  | Dependencies   | Evidence                                                                            |
| ------- | ------------------------------------------------------------ | -------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| HTTP-C1 | Select cross-layer transport design, including DNS ownership | Research, lead integration | none           | Rust transport steering §9; focused WSP-805 and WML-301 context                     |
| HTTP-C2 | Reproduce stalled headers and stalled body cancellation      | Transport test lane        | none           | loopback integration tests that fail on current main                                |
| HTTP-C3 | Native desktop recovery scenarios                            | Desktop research lane      | fixture design | controlled HTTP origin, Back/Stop/replacement, stale response exclusion             |
| HTTP-C4 | Implement transport and host behavior                        | Lead integration           | C1, C2         | transport and host tests, destination policy and POST safety                        |
| HTTP-C5 | Verify, review and integrate                                 | Lead                       | C3, C4         | transport lint/tests, host/frontend checks, contracts and applicable desktop checks |

C1–C5 are implemented and verified. The native Linux pilot passed in
[GitHub Actions run 43629220429](https://github.com/dills122/wap-labs/actions/runs/43629220429). The desktop streaming fixture proves the server sent a partial
body; the transport loopback test separately exercises cancellation while the client reads it.

Ruflo records coordinate the research and testing lanes; Codex agents perform their actual work.
The lead owns architecture, shared files, integration, and final verification. Scope is direct
HTTP behavior; connectionless WSP and WDP semantics remain regression obligations.

## Chosen transport boundary

Keep the synchronous Lowband API and the host's existing `spawn_blocking` admission boundary.
Replace the HTTP request and body-read internals with cancellable asynchronous reqwest operations,
driven inside that boundary. Add a direct, narrowly featured Tokio dependency; reqwest and the
Tauri host already use Tokio, but Lowband will own the runtime it drives. No public request,
response or generated TypeScript shape is intended to change.

The existing OS DNS resolver blocks. Run it through a process-wide bounded admission mechanism,
keeping its permit in the blocking resolution job even if its caller cancels. Runtime shutdown must
not wait for a stuck OS resolver; the independent permit must continue to bound surviving DNS work.
If resolver capacity is exhausted, requests must still terminate on their deadline or cancellation.
Tokio's [`spawn_blocking` documentation](https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html)
states that a started blocking task cannot be aborted. Its
[`shutdown_background` documentation](https://docs.rs/tokio/latest/tokio/runtime/struct.Runtime.html#method.shutdown_background)
states that such work can continue after runtime shutdown. The separate permit accounts for that
work until the OS resolver returns.

Preserve destination and resolved-address validation, proxy behavior, redirect limits, response
bounds, timeouts, retry classification, request identity and single-attempt POST semantics. The
async migration must be accompanied by DNS-bound, HTTP timeout/size/policy/POST regression tests,
contract checks and measurements of local latency and repeated-cancellation work. The existing
connectionless WSP and WDP paths remain unchanged.

## Initial latency evidence

On 2026-11-14, the same debug-build loopback probe performed three runs of 20 sequential successful
HTTP GETs on merged main (`cf45a908`) and on the new transport implementation, with cancellation
tokens enabled. Baseline per-run p50 ranged from 0.821–1.063 ms and p95 from 1.070–1.361 ms;
the new implementation's p50 ranged from 0.760–1.235 ms and p95 from 0.996–1.782 ms. These small,
local samples show no obvious large regression but are not a production or network benchmark. This
probe does not measure the desktop path, TLS, or stalled operating-system DNS.
