# C4 Container View: Runtime and Delivery Units

Date: 2026-07-24
Status: target architecture

This diagram shows independently running or deployed units. Lowband and WaveNav libraries are
shown in the component view because embedded libraries are not C4 containers.

```mermaid
C4Container
  title Container Diagram - WAP/WML Runtime and Delivery Units

  Person(wmlUser, "WML Browser User", "Browses WML resources")
  Person(sdkOperator, "SDK Operator", "Runs standalone network tooling")

  System_Boundary(wavesSystem, "Waves Browser") {
    Container(wavesUi, "Waves UI", "TypeScript in Tauri WebView", "Navigation, settings, rendering surface, and diagnostics")
    Container(wavesHost, "Waves Host", "Rust and Tauri 2 executable", "Orchestrates embedded transport and engine libraries")
    ContainerDb(localState, "Browser State", "Versioned local files and OS keychain", "Profiles, cookies, cache, history, and credentials")
  }

  System_Boundary(lowbandTools, "Optional Lowband Delivery Adapters") {
    Container(lowbandCli, "Lowband CLI", "Rust executable", "Fetch, trace, replay, and conformance tool")
    Container(lowbandService, "Lowband Service", "Rust service executable", "Optional process API for non-embedding customers")
  }

  System_Ext(wmlOrigin, "WML Origin Server", "HTTP server hosting WML content")
  System_Ext(wapGateway, "WAP Proxy or Gateway", "Classic WAP protocol peer")
  System_Ext(osPlatform, "Desktop OS Platform", "Network stack, trust store, keychain, and filesystem")
  System_Ext(consumerApp, "Customer Application", "Embeds Lowband and/or WaveNav SDK libraries")

  Rel(wmlUser, wavesUi, "Navigates and interacts through")
  Rel(wavesUi, wavesHost, "Invokes browser commands", "Tauri IPC")
  Rel(wavesHost, localState, "Reads and writes profiles and state")
  Rel(wavesHost, osPlatform, "Uses platform capabilities through", "Native APIs")
  Rel(wavesHost, wmlOrigin, "Fetches direct-route WML from", "HTTP/HTTPS")
  Rel(wavesHost, wapGateway, "Fetches classic-route WML through", "WSP/WTP/WTLS over UDP")

  Rel(sdkOperator, lowbandCli, "Runs diagnostics with")
  Rel(lowbandCli, wmlOrigin, "Fetches direct-route resources from", "HTTP/HTTPS")
  Rel(lowbandCli, wapGateway, "Exercises classic WAP against", "WSP/WTP/WTLS over UDP")
  Rel(lowbandService, wmlOrigin, "Fetches direct-route resources from", "HTTP/HTTPS")
  Rel(lowbandService, wapGateway, "Exercises classic WAP against", "WSP/WTP/WTLS over UDP")
  Rel(consumerApp, lowbandService, "Optionally requests transport through", "Versioned IPC or HTTP API")

  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

## Container responsibilities

### Waves UI

- address and navigation controls;
- profile/settings management;
- render surface and input events;
- user-visible transport, content, and security state;
- diagnostic and trace export.

It does not parse WBXML or construct WAP packets.

### Waves Host

- owns Lowband and WaveNav instances in-process;
- applies authoritative host policy;
- schedules blocking transport work off the UI loop;
- maps Lowband deck payloads into WaveNav load calls;
- mediates local state and OS capabilities.

The browser remains one installable application even though its core libraries are separately
releasable products.

### Browser State

The state store is logically one container but uses fit-for-purpose platform storage:

- non-secret versioned data for history, bookmarks, gateway profiles, and cache metadata;
- OS keychain for proxy/origin credentials and sensitive tokens;
- bounded cache files for response bodies and decoded decks.

### Lowband CLI and Service

Both are thin delivery adapters over the Lowband public API:

- the CLI is the primary diagnostics and conformance surface;
- the service is optional for customers who need a process boundary or non-Rust integration;
- neither owns a separate codec or state-machine implementation.

The service is not part of the default desktop deployment.
