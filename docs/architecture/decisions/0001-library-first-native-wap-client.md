# ADR 0001: Use a Library-First Native WAP Client

Date: 2026-07-24
Status: proposed

## Context

Waves currently embeds Lowband and WaveNav in the Tauri host, but repository smoke tests use a
local Kannel proxy/gateway. The live Lowband native path supports a constrained connectionless
WSP exchange, while broader WSP/WTP/WTLS modules remain incomplete or disconnected from
production fetch execution.

The desired product family must support:

- one installable WML browser with no local server administration;
- a separately consumable network/transport product;
- a separately consumable WML engine;
- historical WAP/WML compliance with modern behavior above the compatibility boundary.

## Decision

Adopt a library-first modular monolith.

1. Waves embeds Lowband and WaveNav in-process.
2. Lowband owns every HTTP, WAP, security, bearer, and WBXML concern.
3. WaveNav remains network-free and consumes normalized textual WML.
4. The host owns application orchestration, platform policy, state adapters, and UI integration.
5. The same Lowband facade may be wrapped by an optional CLI or service.
6. Kannel remains an external test and interoperability peer, not an embedded production
   dependency.
7. Resource URI and WAP gateway endpoint become separate contract values.
8. Direct HTTP/HTTPS and classic WAP become selectable routes behind one transport response
   contract.

## Why

- It matches the repository's existing in-process Rust integration.
- It gives the desktop product one-process installation and failure behavior.
- It preserves independent Lowband and WaveNav product boundaries.
- It avoids localhost service lifecycle, port, authentication, and update complexity.
- It ensures the browser, CLI, and service use one protocol implementation.
- It supports historical proxy-based WAP topology without requiring a proxy on the user's
  machine.

## Consequences

Positive:

- no Kannel or Lowband daemon is required for ordinary installed-browser use;
- SDK and browser conformance share the same code;
- host/runtime/transport contracts remain explicit;
- delivery adapters can evolve without protocol forks.

Costs:

- Lowband's public facade and state ownership require deliberate API design;
- blocking network execution must remain isolated from UI threads until an async migration is
  justified;
- WTLS and WBXML remain substantial untrusted-input/security work;
- packaging must cover every native target and optional sidecar.

## Rejected alternatives

### Embed Kannel in the desktop application

Rejected because Kannel is a proxy/gateway server, not the missing client stack. Embedding it
would add process and configuration complexity while still leaving the browser dependent on a
loopback gateway translation.

### Make Lowband a mandatory localhost service

Rejected for the default product because the Tauri host already links Rust libraries directly.
A service remains an optional customer adapter for process isolation or non-Rust integration.

### Put protocol logic in the TypeScript/WebView layer

Rejected because it violates existing WBXML and transport ownership, duplicates the Rust stack,
and weakens deterministic/security boundaries.

### Let `wap://host/path` always identify the UDP peer

Rejected as the general routing model because classic WAP commonly sends a resource URI through
a separately selected proxy/gateway. Direct-peer behavior remains an explicit diagnostics
profile.

### Split every protocol layer into a public crate immediately

Rejected until production execution uses the shared codecs and state machines. Internal modules
or private workspace crates may be extracted first; public packages follow proven consumer
boundaries.

## Acceptance conditions

- [ ] Browser direct HTTP/HTTPS WML operation has no Kannel dependency.
- [ ] Classic WAP requests accept an explicit gateway endpoint distinct from resource URI.
- [ ] Waves, Lowband CLI, and optional service use one Lowband client facade.
- [ ] WaveNav remains free of network and WBXML dependencies.
- [ ] Clean-machine browser install has no external `wbxml2xml` prerequisite.
- [ ] Kannel remains in compatibility smoke and conformance documentation only.
