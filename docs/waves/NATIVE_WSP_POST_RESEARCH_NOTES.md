# Native WSP POST Research Notes

Date: 2026-03-07

Scope:

- connectionless WSP `POST` behavior for native desktop/Kannel interop
- WML `go`/`postfield` submission semantics relevant to `T0-30`
- implementation guidance for the current pre-alpha MVP slice

## Why this note exists

The native desktop `GET` lane is already working against Kannel. The next feature, native form `POST`, exposed a wire-level interop gap. This note records the relevant source findings so the implementation is driven by spec text and observed gateway behavior instead of trial-and-error packet layout changes.

## Primary source findings

### 1. Connectionless WSP `Post` PDU layout

Canonical source:

- [OMA-WAP-TS-WSP-V1_0-20020920-C.cleaned.md](/Users/dsteele/repos/wap-labs/spec-processing/source-material/parsed-markdown/docling-cleaned/OMA-WAP-TS-WSP-V1_0-20020920-C.cleaned.md)

The key connectionless `Post` layout is:

- `TID | PDU | UriLen | HeadersLen | Uri | ContentType | Headers | Data`

Important details from the source text:

- `UriLen` is a `uintvar`
- `HeadersLen` is a `uintvar`
- `HeadersLen` covers `ContentType + Headers`
- `Uri` must not include a null terminator
- `Data` starts immediately after the header block and runs to the end of the SDU

Why this matters:

- earlier local encoder experiments assumed the wrong field ordering and boundary markers
- Kannel failures that looked like malformed URLs or shifted bodies are consistent with a bad split between `Uri`, `ContentType`, `Headers`, and `Data`

### 2. Connectionless WSP `Get` PDU layout remains the control case

Canonical source:

- [OMA-WAP-TS-WSP-V1_0-20020920-C.cleaned.md](/Users/dsteele/repos/wap-labs/spec-processing/source-material/parsed-markdown/docling-cleaned/OMA-WAP-TS-WSP-V1_0-20020920-C.cleaned.md)

The `Get` layout is:

- `TID | PDU | URILen | URI | Headers`

This is already proven live in the native desktop path and should remain the comparison baseline while fixing `POST`.

### 3. WML `go`/`postfield` submission behavior

Canonical sources:

- [WAP-191_105-WML-20020212-a.cleaned.md](/Users/dsteele/repos/wap-labs/spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-191_105-WML-20020212-a.cleaned.md)
- [WAP-238-WML-20010911-a.cleaned.md](/Users/dsteele/repos/wap-labs/spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-238-WML-20010911-a.cleaned.md)

Relevant rules:

- substitute variables before submission
- choose submission charset from `accept-charset`, or fall back to document encoding
- preserve `postfield` order
- URI-escape names and values for `application/x-www-form-urlencoded`
- for `method="post"`, send the payload in the HTTP POST body
- `Content-Type` must include a `charset` parameter when required by the submitted content
- same-document/same-deck navigation must ignore `postfield` unless `cache-control="no-cache"`

For this MVP slice, the most important rules are:

- field ordering
- variable substitution timing
- `application/x-www-form-urlencoded` body generation
- same-deck suppression semantics

### 4. WMLScript is not the transport pivot here

Relevant source set:

- [WAP-193-WMLScript-20001025-a.cleaned.md](/Users/dsteele/repos/wap-labs/spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-193-WMLScript-20001025-a.cleaned.md)
- [WAP-193_101-WMLScript-20010928-a.cleaned.md](/Users/dsteele/repos/wap-labs/spec-processing/source-material/parsed-markdown/docling-cleaned/WAP-193_101-WMLScript-20010928-a.cleaned.md)

Conclusion:

- WMLScript may influence form values indirectly through variables
- the actual submission semantics still live in WML task execution plus transport encoding
- `T0-30` should stay focused on `go`/`postfield` plumbing and WSP request shaping, not WMLScript-specific transport behavior

## Local codebase findings

### Engine/runtime status

Relevant path:

- [navigation.rs](/Users/dsteele/repos/wap-labs/engine-wasm/engine/src/engine_runtime_internal/navigation.rs)

Current state:

- the engine now preserves `method="post"` and `postfield` metadata
- it serializes the body as `application/x-www-form-urlencoded`
- it currently emits `postContext` with content type `application/x-www-form-urlencoded`

Gap still to keep in mind:

- charset handling is not yet surfaced in emitted content type

### Transport/runtime status

Relevant paths:

- [fetch_runtime.rs](/Users/dsteele/repos/wap-labs/transport-rust/src/fetch_runtime.rs)
- [native_fetch.rs](/Users/dsteele/repos/wap-labs/transport-rust/src/native_fetch.rs)

Current state:

- transport selection already supports native handling for `wap://` `GET`
- current `POST` work is additive and uses the same stable entrypoint
- the live blocker is wire framing, not the high-level request-policy contract

### Kannel environment assumptions

Relevant path:

- [kannel.conf](/Users/dsteele/repos/wap-labs/docker/kannel/kannel.conf)

Current lab mapping:

- gateway HTTP base resolves through Kannel on `localhost:13002`
- Kannel rewrites gateway-facing URLs to `http://wml-server:3000/*`
- the desktop native lane should continue targeting this stack via WSP/WDP, not by adding more direct HTTP shortcuts

## Observed gateway behavior

Observed from local Kannel logs during native `POST` debugging:

- Kannel recognized the request as a connectionless `Post` attempt
- malformed requests caused URI/header/body boundary corruption
- symptoms included:
  - malformed target URI
  - truncated or shifted `Content-Type`
  - request body bytes being interpreted as part of the path

Interpretation:

- Kannel behavior strongly supports the spec reading that the problem is PDU layout, especially the ordering and sizing of `UriLen`, `HeadersLen`, and the `ContentType` block

## External source cross-checks

Useful external references consulted:

- [Open Mobile Alliance release directory](https://www.openmobilealliance.org/release/WSP/)
- [Kannel User Guide 1.4.0](https://www.kannel.org/download/1.4.0/userguide-1.4.0/userguide.html)
- [Kannel project site](https://www.kannel.org/)
- [Wireshark WSP wiki](https://wiki.wireshark.org/Wireless%20Session%20Protocol)

What these contributed:

- Kannel references confirmed the gateway role and expected HTTP-bridging behavior after WSP decode
- Wireshark references are useful for protocol naming and packet sanity checks
- the OMA corpus remains the authoritative source for exact PDU field order

Limitations of this pass:

- exact Kannel and Wireshark source files were not reliably retrievable through the web tool in this pass
- implementation guidance therefore relies on:
  - canonical local OMA/WAP specs in the repo
  - local repo code
  - live Kannel behavior already observed in the dev environment

## Implementation guidance for `T0-30`

### Immediate next step

Fix the connectionless `POST` encoder to follow:

- `TID | PDU | UriLen | HeadersLen | Uri | ContentType | Headers | Data`

before changing broader transport behavior.

### Scope to keep

- `application/x-www-form-urlencoded` only
- ASCII-safe lab payloads first
- login/register training-environment flows only
- native connectionless mode only

### Scope to defer

- `multipart/form-data`
- connection-oriented WSP session work
- broader WTP session/client state
- browser-side protocol logic
- non-ASCII charset edge cases beyond the first explicit charset plumbing pass

### Practical implementation order

1. Correct the wire layout for native connectionless `POST`.
2. Re-run transport-level ignored Kannel smoke until register/login succeed.
3. Add charset-aware `Content-Type` plumbing once the ASCII baseline is stable.
4. Expand host/browser smokes on top of the validated transport path.

## Decisions reinforced by this research

- do not add another HTTP workaround for desktop `wap://` navigation
- keep native `POST` additive under the existing transport entrypoint
- treat Kannel interop logs as a validation aid, not as the source of truth over the OMA/WAP specs
- keep `T0-30` narrowly focused on form submission, not full session architecture
