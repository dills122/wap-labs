# Native WAP Browser and Modular Product Architecture

Date: 2026-07-24
Status: research recommendation
Compatibility target: WAP 1.2.1 with WML 1.3
Scope: Kannel-independent desktop operation plus separately distributable transport and engine products

## Executive answer

Yes, Waves can become an all-in-one WML browser without requiring a locally running Kannel process, while preserving Lowband and WaveNav as independently usable products.

The important correction is that this is not a greenfield transport integration:

1. The Tauri host already embeds `transport-rust` and `engine-wasm/engine` as Rust dependencies.
2. Direct HTTP/HTTPS WML `GET` requests already bypass Kannel.
3. `wap://` and `waps://` requests already select an in-process UDP/WSP connectionless path in the browser's default `auto` profile.
4. Kannel remains the repository's reference WAP proxy/gateway, local WML test route, interoperability peer, and legacy fallback. It is not the only possible runtime peer.

The existing native path is a constrained proof of the right architecture, not yet a complete WAP browser transport:

- it implements a narrow connectionless WSP `GET`/`POST` exchange over WDP/UDP;
- it does not run the fixture-tested `network::wsp` implementation on the live path;
- it does not run connection-mode WSP over WTP;
- it does not establish WTLS for `waps://`;
- it treats the URL host as the UDP WAP peer instead of separating the resource URL from the configured proxy/gateway endpoint;
- direct HTTP currently accepts `GET`, but not WML form `POST`;
- WBXML/WMLC decoding requires an external `wbxml2xml` executable at application startup;
- the Tauri bundle is disabled and no platform decoder binaries are present.

The recommended target is a **library-first modular monolith**:

- the full desktop product links Lowband and WaveNav in-process;
- Lowband is released as a transport/client SDK;
- WaveNav is released as a network-free WML engine SDK;
- optional Lowband CLI and service wrappers reuse the exact same client library;
- Kannel stays outside the product as an interoperability oracle and development fixture.

This preserves historical protocol fidelity without forcing desktop users to operate a local server.

## What Kannel is doing today

Kannel currently fills three distinct roles that should not be confused:

| Role                                                       | Required for the installed browser?                                   | Target disposition                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------- |
| Local reference WAP proxy/gateway and WML test environment | Yes for the repository's current real-WAP smoke path                  | Keep as a test/interop dependency             |
| Legacy `gateway-bridged` HTTP adapter                      | Only when that explicit profile or fallback is enabled                | Keep as rollback/compatibility mode           |
| Native `wap-net-core` peer used by local smoke tests       | The client needs a WAP peer; the checked-in peer happens to be Kannel | Support any compatible configured WAP gateway |

The browser host already chooses native transport automatically for WAP schemes in
[`fetch_host.rs`](../../browser/src-tauri/src/fetch_host.rs). Direct HTTP/HTTPS is handled by
Lowband's `reqwest` path in
[`fetch_runtime/execution.rs`](../../transport-rust/src/fetch_runtime/execution.rs).

The repository's real native smoke test still points that client at Kannel. That proves a narrow
client-to-gateway flow; it does not mean Kannel must be installed beside a production browser.

## Current implementation baseline

All three primary Rust packages are currently version `0.3.0`:

- Lowband uses Rust 2021, blocking `reqwest 0.12`, Rustls-backed HTTPS, and emits an `rlib`.
- WaveNav uses Rust 2021 and emits `rlib` plus `cdylib`, with optional WASM bindings.
- Waves uses Tauri 2 and links both packages in-process.
- The repository does not yet define a root Cargo workspace.

### Capability matrix

| Capability                               | Current state                                   | Evidence and consequence                                                                 |
| ---------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Host-to-transport integration            | Implemented in-process                          | Tauri calls Lowband with `spawn_blocking`; no local transport HTTP server is required    |
| Host-to-engine integration               | Implemented in-process                          | Tauri owns a native WaveNav engine instance                                              |
| HTTP/HTTPS WML `GET`                     | Implemented                                     | Direct resource fetch, redirect bound of 10, Rustls HTTPS                                |
| HTTP/HTTPS WML `POST`                    | Missing                                         | Non-WAP methods other than `GET` are rejected before HTTP execution                      |
| WSP connectionless `GET`/`POST` over UDP | Implemented, constrained                        | Live native path in `native_fetch.rs`; Kannel smoke coverage exists                      |
| Full WSP header/PDU codec                | Implemented as fixture-tested modules, not live | `network::wsp` is currently dead relative to native fetch; tracked by `M1-18`            |
| Connection-mode WSP                      | Fixture/prototype logic only                    | No production session lifecycle or method execution path                                 |
| WTP Classes 0/1/2                        | Policy/state-machine fixtures only              | No production WSP connection-mode composition                                            |
| WTLS                                     | Prototype boundary only                         | Current record/alert/handshake envelopes are not WAP-261 wire codecs and are not live    |
| `waps://`                                | Unsafe test placeholder                         | Selects UDP port 9202 and sends unprotected WSP; warn in development and fail in release |
| WMLC/WBXML decode                        | Functional only with external tool              | Browser startup fails if `wbxml2xml` is unavailable                                      |
| Cookie jar and HTTP state                | Missing                                         | A new `reqwest::Client` is built for each fetch; no persistent cookie state              |
| Cache                                    | Request directives only                         | `no-cache` headers exist, but there is no browser cache store                            |
| Authentication and credential storage    | Missing                                         | No origin/proxy authentication lifecycle                                                 |
| Bearer support                           | IP/UDP only                                     | No SMS, USSD, SMPP, or carrier-specific client bearer adapters                           |
| Installable all-in-one bundle            | Missing                                         | Tauri `bundle.active` is false; decoder resource folders contain only a README           |

### Documentation accuracy warning

Several active planning documents describe `wap-net-core` as a live
`WDP -> WTP -> WSP` path. The actual native fetch path is connectionless WSP directly over
WDP/UDP, which is a valid WSP mode, but it does not call the richer WSP or WTP modules. The
maintenance board correctly records this implementation drift in `M1-18`.

Until that work is closed, fixture coverage for `network::wsp` and `network::wtp` is evidence for
protocol design and regression intent, not end-to-end evidence for bytes sent by the browser.

## The target browser needs two network routes

WAP architecture permits the hypermedia transfer service to be provided by either HTTP or WSP.
It also describes WAP clients selecting a proxy or connecting directly to a service. A WAP proxy
translates the WAP 1.x stack to HTTP/TCP and resolves origin hosts on the client's behalf.

That leads to two first-class routes rather than one overloaded URL scheme.

### Route A: direct Web access

Use for `http://` and `https://` WML resources:

```text
Waves -> Lowband HTTP client -> WML origin
```

Requirements:

- `GET` and `POST`;
- HTTP redirects;
- HTTP state/cookies;
- authentication;
- HTTPS certificate validation;
- WML and WMLC content negotiation;
- WML-only content admission;
- cache and reload semantics;
- charset-aware request and response handling.

This route provides the most browser-like access to WML content hosted on ordinary web servers.
It is both historically valid and the practical default for reachable WML sites.

### Route B: classic WAP access

Use when a WAP gateway profile is selected:

```text
Waves -> Lowband WSP/WTP/WTLS client -> configured WAP gateway -> WML origin
```

A request needs two independent identities:

1. `resource_uri`: the WML resource requested by the user, normally an absolute HTTP/HTTPS URI
   carried in WSP;
2. `gateway_endpoint`: the address and well-known WAP service port of the proxy/gateway peer.

The current native path derives both from the `wap://` URL. That works for the local Kannel
fixture but is not a sufficient proxy-selection model. The route contract must separate them.

Recommended route types:

```rust
pub enum FetchRoute {
    Auto,
    DirectHttp,
    WapGateway {
        endpoint: GatewayEndpoint,
        mode: WspMode,
        security: WapSecurityMode,
        bearer: BearerProfile,
    },
}
```

`Auto` should resolve as follows:

- `http`/`https`: direct HTTP route;
- a saved WAP profile: WAP gateway route carrying the resource URI;
- the project-specific `wap`/`waps` schemes: compatibility aliases that require an explicit
  gateway profile, or an explicitly enabled direct-peer diagnostic mode;
- local deck/file mode: no network route.

Transport choice must not be inferred from content parsing inside the engine.

## Recommended product boundaries

### 1. Lowband Client SDK

Product form:

- Rust library as the canonical product;
- optional C-compatible or UniFFI facade after the Rust API stabilizes;
- optional CLI and service wrappers.

Owns:

- route selection and proxy/gateway profiles;
- HTTP/HTTPS;
- WDP and bearer adapters;
- WTP transactions;
- WSP connectionless and connection-mode sessions;
- WTLS compatibility profile;
- WBXML/WMLC decode and encode;
- content negotiation and normalization;
- cookies, authentication, cache, retries, timeouts, and destination policy;
- protocol/security traces and normalized errors.

Does not own:

- WML deck/card execution;
- rendering or focus;
- browser window/input behavior.

### 2. WaveNav Engine SDK

Product form:

- native Rust library;
- WASM package;
- optional UniFFI facade for mobile/native consumers.

Owns:

- textual WML parsing;
- deck/card/task/event/variable semantics;
- layout, focus, input, and render output;
- WMLScript execution and deterministic trace behavior.

Does not own:

- network access;
- HTTP/WSP/WBXML;
- credential, cookie, or proxy state;
- desktop UI.

The existing `WmlDeckInput`/`EngineDeckInputPayload` handoff is the correct architectural seam.

### 3. Waves Browser

Product form:

- signed Tauri desktop bundle for macOS, Windows, and Linux.

Owns:

- address field, tabs/windows if introduced, navigation controls, and settings;
- WAP gateway/profile management;
- history, bookmarks, downloads, and user-visible error/security state;
- OS keychain integration and local application state;
- orchestration of Lowband fetch results into WaveNav deck loads;
- updates, signing, crash diagnostics, and support tooling.

Does not own:

- protocol codecs;
- WBXML parsing;
- WML runtime semantics.

### 4. Optional Lowband tools

These are delivery adapters, not separate protocol implementations:

- `lowband-cli`: fetch/probe/trace and conformance diagnostics;
- `lowband-service`: optional HTTP/gRPC/IPC wrapper for customers that cannot embed Rust;
- `lowband-interop-kit`: Kannel configuration, fixtures, packet captures, and smoke tooling.

The CLI, service, and browser must call the same Lowband client facade. No wrapper may duplicate
WSP/WTP/WBXML behavior.

## Repository and package shape

Do not immediately split every WAP layer into a public crate. First make the existing Lowband
crate internally coherent and define the public client contract. Premature per-protocol crates
would freeze unstable internal seams and make coordinated protocol changes harder.

### Step 1: one workspace, stable product crates

```text
Cargo workspace
├── lowband-client          # current transport-rust evolved into public SDK
├── wavenav-engine          # current engine-wasm/engine
├── waves-browser-host      # current browser/src-tauri
├── lowband-cli             # optional executable
└── lowband-service         # optional executable, later
```

The existing paths can remain during the first migration. A root workspace can reference them
without a directory rename.

### Step 2: extract only proven internal seams

Candidates, after the live path uses them:

```text
lowband-client
├── lowband-protocol        # WDP/WTP/WSP/WTLS value types and state machines
├── lowband-wbxml           # bounded WML/WBXML codec
├── lowband-bearer-udp      # IP/UDP WDP adapter
└── lowband-http            # direct HTTP route
```

These can initially be private workspace crates. Publish them only if external users need those
lower-level APIs independently.

### Feature policy

Cargo features should be additive build capabilities:

- `http`;
- `wap-connectionless`;
- `wap-connection-mode`;
- `wtls-compat`;
- `wbxml-native`;
- `wbxml-sidecar`;
- `ffi`.

Runtime route and security choice should remain runtime configuration. Mutually exclusive
profiles implemented only as Cargo features become difficult to compose and test. Cargo's
feature guidance explicitly recommends additive features and runtime selection when feature
choices can coexist.

## Public contract direction

The current `fetch_deck` contract is browser-specific. Preserve it for compatibility, but build
the product API around a content-neutral transport request with a WML convenience facade.

```rust
pub trait TransportClient {
    fn fetch(&self, request: ResourceRequest) -> Result<ResourceResponse, TransportError>;
}

pub struct ResourceRequest {
    pub resource_uri: Url,
    pub method: Method,
    pub headers: HeaderMap,
    pub body: Option<Vec<u8>>,
    pub route: FetchRoute,
    pub policy: RequestPolicy,
}

pub struct ResourceResponse {
    pub final_uri: Url,
    pub status: u16,
    pub headers: HeaderMap,
    pub raw_body: Vec<u8>,
    pub route_trace: RouteTrace,
    pub security: SecurityOutcome,
}

pub struct DeckPayload {
    pub wml_xml: String,
    pub base_url: String,
    pub content_type: String,
    pub raw_bytes: Vec<u8>,
}
```

Rules:

1. `TransportClient` owns bytes and protocol state.
2. A Lowband deck-normalization adapter converts `ResourceResponse` to `DeckPayload`.
3. WaveNav consumes only `DeckPayload` values.
4. Host adapters translate `DeckPayload` to the existing generated TypeScript/native contract.
5. Protocol and security traces are optional diagnostic metadata, never engine input.
6. Public APIs use explicit versioning and do not expose internal state-machine structs until
   those structs are deliberately supported as an SDK surface.

Rust's native ABI has no stability guarantee, so a commercial binary SDK must use a deliberate
foreign ABI or generated binding layer rather than exposing arbitrary Rust symbols. UniFFI is a
reasonable later option for Kotlin, Swift, and Python; a C ABI remains the broadest low-level
integration surface.

## WBXML decision

The installed browser must not require users to install `wbxml2xml`.

### Near-term release bridge

Bundle a version-pinned `wbxml2xml` sidecar per target architecture:

- checksum and provenance every binary;
- retain the current timeout and output limits;
- include required LGPL notices and satisfy redistribution obligations;
- make the Tauri bundle active;
- add clean-machine installer tests;
- do not fail application startup for textual-WML-only use if the optional decoder is missing.

Tauri 2 officially supports architecture-specific embedded sidecars. This is the shortest path
to a single installer, but it leaves the standalone Rust SDK with a native tool dependency.

### Long-term SDK path

Implement a bounded WML 1.3 WBXML codec in Rust from `WAP-192` and the WML token tables:

- decode and encode global tokens, literals, string tables, code pages, entities, opaque data,
  extensions, tags, and attributes;
- enforce byte, nesting, string-table, token-count, and decoded-output limits;
- preserve unknown-token behavior according to an explicit conformance policy;
- use differential tests against libwbxml and captured WMLC fixtures;
- fuzz the decoder as an untrusted-input boundary;
- keep the sidecar backend temporarily available as a differential oracle.

Do not link libwbxml directly into the browser process merely to remove the subprocess. That
would trade an operational dependency for a larger unsafe native parsing boundary and still
carry licensing/packaging work.

## Historical compliance and improved behavior

The core policy remains:

- protocol-visible behavior must meet the selected WAP/WML conformance profile;
- modern improvements may exist outside or above the compatibility boundary;
- improvements must not silently change WML/WAP semantics.

Examples:

| Area                        | Compatibility behavior                         | Modern improvement                                            |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| Direct secure origin access | WAP-profiled HTTP/TLS semantics where selected | Modern TLS defaults and current trust store                   |
| WTLS                        | Exact WAP-261 compatibility profile, opt-in    | Separate modern TLS/DTLS routes; no silent security downgrade |
| Timeouts/retries            | Spec/profile timer behavior                    | User cancellation and better diagnostics                      |
| Rendering                   | WML deck/card semantics                        | Scaling, accessibility, inspect/debug tools                   |
| Cache/history               | WAP-observable rules                           | Persistence, privacy controls, export/clear UI                |
| Gateway selection           | Historical proxy profile behavior              | Auto profiles, health checks, and actionable setup errors     |

`waps://` must not claim a secure state until live WTLS or a separately identified secure route
has authenticated the peer and protected the payload. Pre-alpha testing may continue through an
explicit insecure test posture that displays an unavoidable no-WTLS warning and reports all
protection flags as false. Release profiles must reject that posture.

AES is not the obsolete WTLS cipher: WAP-261 does not define AES. Historical WTLS uses RC5,
DES/3DES, and IDEA CBC suites with SHA-1 or MD5 MAC variants. AES remains a current standard and
is used in modern TLS through AEAD modes such as AES-GCM. The detailed inventory, security
profiles, and downgrade policy are in
[`wtls-modernization-research.md`](wtls-modernization-research.md) and
[`ADR 0002`](decisions/0002-separate-modern-security-from-wtls-compatibility.md).

## Phased work program

The phases below are ordered by dependency. Calendar time can overlap where contracts are stable.
Estimates are engineering ranges, not delivery commitments.

### Phase NB0: truth, route, and contract foundation

Estimate: 2-4 engineer-weeks

Work:

- create an explicit conformance profile for direct HTTP, WSP connectionless, WSP
  connection-mode, WTLS, and optional bearer features;
- correct active docs so they distinguish the live connectionless path from fixture-only
  WSP/WTP modules;
- define `resource_uri` separately from `gateway_endpoint`;
- define route/security outcomes and profile configuration;
- preserve the current generated browser contract behind an adapter;
- create golden route-selection and no-fallback tests.

Exit gate:

- the browser never chooses a gateway peer solely because it is the resource host unless an
  explicit direct-peer diagnostic profile says to do so.

### Phase NB1: Kannel-free early-access desktop

Estimate: 6-10 engineer-weeks

Work:

- implement direct HTTP `POST` and WML form submission;
- add session-scoped cookie storage and the minimum WAP HTTP state profile;
- bundle the WBXML sidecar or finish a native WML/WBXML decoder;
- enable and validate Tauri bundles for target platforms;
- make decoder degradation request-scoped rather than an unconditional startup failure;
- add profile/settings UI and direct HTTP/HTTPS/WMLC clean-machine E2E tests;
- add user-visible certificate, content-type, and navigation errors.

Exit gate:

- a user installs Waves on a clean machine and browses HTTP/HTTPS WML/WMLC sites without
  Kannel or separately installed tools.

This is the first commercially demonstrable all-in-one build. It is not yet full native WAP 1.x
transport conformance.

### Phase NB2: live protocol-core convergence

Estimate: 8-14 engineer-weeks

Work:

- replace the hand-written native WSP codec with `network::wsp`;
- expand the production connectionless header/method/reply matrix;
- compose WSP connection-mode with live WTP Classes 0 and 2;
- implement session connect/disconnect and capability negotiation;
- implement production TID, retransmission, duplicate, abort, and timer behavior;
- keep Class 1 and push behind their declared profile gates;
- add configured WAP gateway endpoint and bearer abstraction;
- run packet-level interop against Kannel plus at least one independent oracle or capture set.

Exit gate:

- the bytes exercised by conformance fixtures and the bytes sent by the browser use the same
  codecs and state machines.

### Phase NB3: secure classic WAP

Estimate: 12-20 engineer-weeks

Work:

- apply the separate modern-default and historical-compatibility profile decision from
  [`ADR 0002`](decisions/0002-separate-modern-security-from-wtls-compatibility.md);
- complete the WTLS record, handshake, cipher, MAC, key exchange, alerts, replay, and trust
  paths required by the selected client profile;
- apply `WAP-261` SIN overlays and WAP certificate/PKI requirements;
- model secure connection state per address/port quadruplet;
- add secure connectionless and connection-mode routes on the correct ports;
- define supported legacy algorithms and disabled-by-default policy;
- add user-visible security identity, warning, and failure states;
- obtain independent cryptographic review before production claims.

Exit gate:

- release profiles cannot complete `waps://` without a verified protected `SecurityOutcome`;
- known-answer, negative, replay, packet-loss, and interoperability tests pass.

WTLS is the highest-risk and least predictable phase. Modern TLS is not a wire-compatible
substitute for WTLS over datagrams.

### Phase NB4: independently releasable SDKs

Estimate: 6-12 engineer-weeks

Work:

- establish a root Cargo workspace and product package boundaries;
- audit every public Rust type and error;
- add crate-level examples, changelogs, release notes, compatibility policy, and API tests;
- add `cargo package`/publish dry-run gates;
- version the engine and transport independently after the first stable contract;
- build a Lowband CLI using only public SDK APIs;
- add UniFFI or C ABI only after the Rust contract is stable;
- generate SBOM, license notices, provenance, and signed checksums for artifacts.

Exit gate:

- a sample external Rust application can consume Lowband without WaveNav or Waves;
- another sample can consume WaveNav without Lowband or Waves;
- Waves consumes the same published APIs without privileged internal access.

### Phase NB5: product hardening

Estimate: 8-16 engineer-weeks, partly parallel

Work:

- updater, signing/notarization, installer, rollback, and release channels;
- persistent cache/history/bookmarks and privacy controls;
- proxy/origin credentials via OS keychain;
- cancellation, offline mode, recovery, and diagnostic export;
- protocol and parser fuzzing;
- multi-platform performance and resource budgets;
- long-running session, packet-loss, DNS, redirect, and malformed-content campaigns;
- support matrix and conformance evidence bundle.

Exit gate:

- production release checklist and support runbooks pass on clean machines for all supported
  platforms.

## Delivery ranges

Assuming senior Rust/protocol engineers and the current codebase:

| Outcome                                                               | Likely effort               | What it does not claim                    |
| --------------------------------------------------------------------- | --------------------------- | ----------------------------------------- |
| Kannel-free installable WML browser                                   | 8-14 engineer-weeks         | Full connection-mode WAP or WTLS          |
| Credible WAP 1.2.1 client over IP/UDP, excluding production WTLS      | 6-10 engineer-months total  | Secure classic-WAP parity, non-IP bearers |
| Product-ready browser plus Lowband and WaveNav SDKs with WTLS profile | 12-20 engineer-months total | Every optional carrier/bearer adaptation  |

A practical team is two protocol/Rust engineers plus part-time desktop/QA/security support.
Two to three senior engineers could plausibly reach the full product range in roughly 6-10
calendar months, subject to WTLS interoperability and source/conformance ambiguity.

## Recommended first epic

Create `NB0 Native Browser Foundation` before adding more protocol features.

Suggested work items:

| ID     | Work item                                        | Primary output                                             |
| ------ | ------------------------------------------------ | ---------------------------------------------------------- |
| NB0-01 | Declare truthful route/profile capability matrix | Active architecture and machine-readable profile           |
| NB0-02 | Separate resource URI from WAP gateway endpoint  | Contract-first route types and tests                       |
| NB0-03 | Wire live native fetch to `network::wsp`         | One WSP codec on production and fixture paths              |
| NB0-04 | Choose WBXML release bridge and native end-state | Decision record, packaging spike, conformance plan         |
| NB0-05 | Add direct HTTP WML `POST`                       | Working form submission without Kannel                     |
| NB0-06 | Define state services                            | Cookie, cache, credential, and profile ownership contracts |
| NB0-07 | Establish clean-machine E2E                      | Text WML, WMLC, HTTP POST, and connectionless WSP lanes    |
| NB0-08 | Build SDK public-surface inventory               | Public/private API and package-release map                 |
| NB0-09 | Label test-only `waps://` and gate release       | Development warns/reports unprotected state; release fails |

Do not start WTLS implementation until `NB0-02`, `NB0-03`, and the WTP/WSP connection-mode
composition design are accepted.

## Key risks and controls

| Risk                                                  | Control                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Fixture-only modules mistaken for live conformance    | Require production-path coverage in every conformance claim                     |
| `waps://` implies security that is not present        | Unavoidable test warning and false protection state; reject in release profiles |
| WAP URL and gateway identity remain conflated         | Make route/profile explicit in the public contract                              |
| Unsafe/malformed WBXML compromises the host           | Keep strict limits, isolation fallback, differential tests, and fuzzing         |
| Obsolete WTLS crypto creates modern security exposure | Separate opt-in compatibility profile, suite allowlist, warning UX, review      |
| Automatic fallback permits downgrade                  | Secure failures are terminal; profile changes require explicit policy or action |
| One Kannel interop peer hides implementation bugs     | Use independent captures/oracles and byte-level golden suites                   |
| Public SDKs freeze unstable internals                 | Publish one facade first; extract protocol crates only after live use           |
| Spec PDFs are redistributed with commercial binaries  | Ship implementation and notices, not the source corpus; obtain legal review     |
| Rust ABI is exposed as a commercial binary contract   | Use versioned C ABI or generated language bindings                              |
| Optional bearer scope expands without limit           | Define IP/UDP as the first conformance profile; add bearer adapters separately  |

## Legal and source-material note

This is engineering guidance, not legal advice.

OMA's use agreement permits commercial use of information in clearly designated final approved
specifications, while placing separate restrictions on copying and publishing the documents.
The product build should therefore:

- implement from approved specifications and retained provenance;
- avoid bundling the specification PDFs in customer artifacts;
- preserve required notices for redistributed dependencies;
- review WAP/OMA essential-IPR disclosures and commercial distribution plans with counsel;
- review libwbxml's LGPL obligations before shipping its executable or library.

## Authoritative external references

- [WAP Architecture, WAP-210](https://www.openmobilealliance.org/tech/affiliates/wap/wap-210-waparch-20010712-a.pdf)
- [WML 1.3 SIN roll-up, WAP-191_104](https://www.openmobilealliance.org/tech/affiliates/wap/wap-191_104-wml-20010718-a.pdf)
- [WBXML 1.3, WAP-192](https://www.openmobilealliance.org/tech/affiliates/wap/wap-192-wbxml-20010725-a.pdf)
- [WSP, OMA-WAP-TS-WSP](https://www.openmobilealliance.org/release/Browser_Protocol_Stack/V2_1-20050204-C/OMA-WAP-TS-WSP-V1_0-20020920-C.pdf)
- [WTP, WAP-224](https://www.openmobilealliance.org/release/Browser_Protocol_Stack/V2_1-20050204-C/WAP-224-WTP-20020827-a.pdf)
- [WDP, WAP-259](https://www.openmobilealliance.org/release/Browser_Protocol_Stack/V2_1-20050204-C/WAP-259-WDP-20010614-a.pdf)
- [WTLS, WAP-261](https://www.openmobilealliance.org/tech/affiliates/wap/wap-261-wtls-20010406-a.pdf)
- [AES, FIPS 197-upd1](https://csrc.nist.gov/pubs/fips/197/final)
- [TLS 1.3, RFC 9846](https://www.rfc-editor.org/info/rfc9846/)
- [DTLS 1.3, RFC 9147](https://www.rfc-editor.org/info/rfc9147/)
- [Secure TLS/DTLS recommendations, RFC 9325](https://www.rfc-editor.org/rfc/rfc9325.html)
- [OMA WAP Forum specification archive](https://www.openmobilealliance.org/specifications/affiliates/wap-forum/)
- [OMA document use agreement](https://www.openmobilealliance.org/tech/affiliates/LicenseAgreement.asp)
- [Tauri 2 external binary bundling](https://v2.tauri.app/develop/sidecar/)
- [Cargo workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html)
- [Cargo features](https://doc.rust-lang.org/stable/cargo/reference/features.html)
- [Cargo publishing](https://doc.rust-lang.org/cargo/reference/publishing.html)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Rust foreign ABI reference](https://doc.rust-lang.org/reference/items/external-blocks.html)
- [UniFFI user guide](https://mozilla.github.io/uniffi-rs/latest/)
- [libwbxml project](https://github.com/libwbxml/libwbxml)

## Related repository evidence

- [`transport-rust/src/native_fetch.rs`](../../transport-rust/src/native_fetch.rs)
- [`transport-rust/src/network`](../../transport-rust/src/network)
- [`transport-rust/src/wbxml.rs`](../../transport-rust/src/wbxml.rs)
- [`browser/src-tauri/src/fetch_host.rs`](../../browser/src-tauri/src/fetch_host.rs)
- [`browser/src-tauri/src/bootstrap.rs`](../../browser/src-tauri/src/bootstrap.rs)
- [`browser/src-tauri/tauri.conf.json`](../../browser/src-tauri/tauri.conf.json)
- [`docs/waves/MAINTENANCE_WORK_ITEMS.md`](../waves/MAINTENANCE_WORK_ITEMS.md)
- [`docs/waves/TRANSPORT_SPEC_TRACEABILITY.md`](../waves/TRANSPORT_SPEC_TRACEABILITY.md)
- [`docs/waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md`](../waves/TRANSPORT_ADJACENT_SPEC_TRACEABILITY.md)
- [`docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`](../waves/SECURITY_BOUNDARY_TRACEABILITY.md)
- [`docs/architecture/wtls-modernization-research.md`](wtls-modernization-research.md)
- [`docs/architecture/decisions/0002-separate-modern-security-from-wtls-compatibility.md`](decisions/0002-separate-modern-security-from-wtls-compatibility.md)
