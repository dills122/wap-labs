# ADR 0005: Use a Standalone Lowband WAP CLI

Date: 2026-07-29
Status: accepted

## Context

Developers repeatedly need to send bounded WAP requests, preserve response bytes, inspect WMLC,
and report protocol/decode failures without starting the desktop UI. Existing repository tools
cover Docker/Kannel smoke paths and library tests, but there is no small general-purpose client.

The implementation must keep WSP, WDP, and WBXML behavior in `transport-rust`, reuse the same
fetch policy and codecs as Waves, remain deterministic in CI, and distinguish a resource URL from
the selected WAP proxy/gateway endpoint.

## Repository inventory

- `transport-rust` already owns `fetch_deck_in_process`, the `gateway-bridged` and
  `wap-net-core` profiles, connectionless WSP/WDP, destination policy, response bounds, and the
  pinned WML 1.3 WBXML decoder. The browser host calls this same facade.
- Canonical byte fixtures live in `transport-rust/wbxml_samples/` and
  `transport-rust/tests/fixtures/transport/`; focused WSP/WDP replays live under
  `transport-rust/tests/network/interop/`.
- `scripts/transport-wap-smoke.sh`, `make smoke-transport-wap`, the ignored Kannel Rust smoke
  tests, and `scripts/native-tauri-kannel-e2e.sh` exercise progressively larger local stacks.
  They are valuable release checks, but are not a general request inspector.
- The desktop transport contract is generated from exported Rust types into
  `browser/contracts/transport.ts` and `browser/contracts/generated/transport-host.ts`.
  A CLI-only routing option should remain Rust-only unless the desktop contract also needs it.
- The public preview resources are `wap://home.wap.shrimpworks.dev/`,
  `wap://forms.wap.shrimpworks.dev/`, and `wap://interop.wap.shrimpworks.dev/`; the established
  static deep link is `wap://home.wap.shrimpworks.dev/examples/index.wml`. Their WDP/WSP peer is
  configured separately as `159.89.254.0:9200`.
- Ordinary contributor verification is already available through `make lint-rust-transport`,
  `make test-rust-transport`, `pnpm --dir browser run contracts:check`, and
  `pnpm verify:change`.

## Curl investigation

As of 2026-07-29, curl's documented URL schemes are protocols compiled into a curl/libcurl build;
an unsupported scheme returns `CURLE_UNSUPPORTED_PROTOCOL`. The public libcurl API exposes
transfer handles, callbacks, and supported-protocol discovery, but not a protocol-handler
registration ABI:

- [curl URL syntax](https://curl.se/docs/url-syntax.html)
- [libcurl error codes](https://curl.se/libcurl/c/libcurl-errors.html)
- [`curl_version_info`](https://curl.se/libcurl/c/curl_version_info.html)

Curl's official guidance for adding a protocol describes contributing protocol code, tests, and
documentation to curl itself, with an expectation of wide public use and long-term curl-project
maintenance. It does not describe a loadable plugin:

- [Adding a new protocol to curl](https://curl.se/dev/new-protocol.html)

`CURLOPT_OPENSOCKETFUNCTION` can replace socket creation or supply a connected socket, but
libcurl still executes one of its built-in protocol implementations. It cannot delegate WSP,
WDP, or WBXML semantics to Lowband:

- [`CURLOPT_OPENSOCKETFUNCTION`](https://curl.se/libcurl/c/CURLOPT_OPENSOCKETFUNCTION.html)

Therefore, a true `wap://` curl integration would currently mean carrying a curl fork or pursuing
an upstream protocol implementation. A wrapper that rewrites `wap://` to HTTP would only exercise
the repository's gateway bridge and would conceal the native WSP/WDP path.

## Options considered

| Criterion                  | Curl/libcurl protocol implementation                                   | Curl wrapper                     | Standalone Rust CLI over Lowband                                       |
| -------------------------- | ---------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| Protocol fidelity          | Potentially high, but duplicates or tightly adapts Lowband inside curl | Low; bridge-only                 | High; calls the production Lowband facade                              |
| Raw-byte visibility        | Possible after substantial curl integration                            | HTTP-side bytes only             | Existing successful normalized response retains original payload bytes |
| Existing codec reuse       | Awkward across curl's C internals                                      | Decode would need a second tool  | Direct reuse of WSP/WBXML Rust code                                    |
| Portability/install weight | Custom curl build and distribution                                     | Requires curl plus wrapper/tool  | One Rust binary; no new runtime dependency                             |
| CI testability             | Requires curl's protocol harness plus repository harness               | Easy but incomplete              | Deterministic local fixture servers                                    |
| Security/policy parity     | Separate policy implementation risk                                    | Curl policy differs from Waves   | Existing destination policy, limits, and error taxonomy                |
| Maintenance                | Curl fork/upstream maintenance                                         | Small, but misleading capability | Small Rust adapter maintained with transport                           |

## Decision

Build `wapcurl`, a deliberately curl-like standalone Rust binary in `transport-rust`.

The binary is a thin adapter:

1. Parse a bounded GET-only command contract.
2. Select native `wap-net-core`, HTTP, or the explicit gateway bridge.
3. Call `fetch_deck_in_process_with_options`.
4. Render metadata, decoded inspection, raw bytes, hex, a file, or JSON.
5. Map Lowband's stable error taxonomy to documented nonzero exit codes.

The Rust facade now accepts `FetchTransportOptions`, which keeps the resource URL separate from
an optional gateway endpoint. This is a Rust-only seam and does not change the generated browser
contract. The browser, deployment, and engine surfaces are unchanged.

## Safety and scope

- Default destination policy remains `PublicOnly`; local/private targets require
  `--allow-private`.
- The default is one attempt. `--retry` is capped at two additional attempts.
- Whole-request timeout is 5 seconds by default and constrained to 100–30,000 milliseconds.
- HTTP redirects remain capped at 10 and payloads at 524,288 bytes by the shared transport.
- There is no automatic native-to-bridge fallback.
- Verbose trace goes to stderr and redacts credentials, sensitive query values, authorization,
  proxy authorization, and cookies.
- `waps://` does not imply working WTLS; existing Lowband warnings and limitations remain.
- The CLI is a developer probe, not an interactive browser, crawler, cookie jar, or deployment
  tool.

## Consequences

Positive:

- CLI and desktop diagnostics share one protocol implementation and error taxonomy.
- Native public services and deterministic local HTTP/gateway fixtures are both testable.
- No curl fork, plugin ABI, new parser, async runtime, or external decoder is introduced.
- Machine-readable output remains clean because protocol trace is on stderr and opt-in.

Costs and limitations:

- GET is the only CLI method in this slice, even though native Lowband also has constrained POST
  support.
- Raw response bytes are available after a successful normalized fetch; failure responses do not
  currently retain rejected payload bytes in the public response contract.
- Native WAP is the existing constrained connectionless WSP/WDP profile, not full WSP
  connection-mode, WTP, or WTLS.
- Custom per-invocation payload and redirect limits are not yet exposed; the shared safe fixed
  limits apply.

## Rejected alternatives

### Carry a curl fork

Rejected because it creates a second protocol integration and distribution stream while the
repository already has the required Rust codecs and policy. Upstream curl support could be
revisited only if WAP use and long-term maintainers satisfy curl's protocol-admission bar.

### Ship a shell wrapper around curl

Rejected because it can only exercise an HTTP bridge, cannot speak native WSP/WDP, and would
either omit WBXML inspection or invoke a parallel decoder.

### Add protocol logic to TypeScript

Rejected because it violates the repository's layer contract and would duplicate untrusted-input
handling outside Lowband.
