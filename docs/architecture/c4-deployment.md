# C4 Deployment View: All-in-One Browser and Optional SDK Delivery

Date: 2026-07-24
Status: target production topology

The default deployment is one signed application bundle. A local Kannel process, Lowband daemon,
or separately installed WBXML decoder is not part of that topology.

```mermaid
C4Deployment
  title Deployment Diagram - Production All-in-One Browser

  Deployment_Node(userDesktop, "User Desktop", "macOS, Windows, or Linux", "End-user workstation") {
    Deployment_Node(appBundle, "Signed Waves Application Bundle", "Tauri 2 installer", "Versioned and independently updatable") {
      Container(wavesUi, "Waves UI", "TypeScript WebView", "Navigation and render surface")
      Container(wavesHost, "Waves Host", "Native Rust executable", "Embeds Lowband and WaveNav libraries")
    }
    Deployment_Node(osStorage, "OS Storage Services", "Keychain and local files", "Credentials, profiles, cache, and history") {
      ContainerDb(localState, "Browser State", "Versioned local data", "Persistent browser state")
    }
  }

  Deployment_Node(publicNetwork, "IP Network", "Internet or private lab", "Carries direct and classic WAP routes") {
    Deployment_Node(originNode, "Origin Host", "HTTP server", "Serves WML resources") {
      Container(wmlOrigin, "WML Origin Server", "HTTP/HTTPS", "WML, WMLC, scripts, and assets")
    }
    Deployment_Node(gatewayNode, "Gateway Host", "WAP proxy or gateway", "Optional classic WAP peer") {
      Container(wapGateway, "WAP Proxy or Gateway", "WSP/WTP/WTLS and HTTP", "Translates classic WAP to origin requests")
    }
  }

  Rel(wavesUi, wavesHost, "Invokes browser operations", "Tauri IPC")
  Rel(wavesHost, localState, "Reads and writes", "OS APIs")
  Rel(wavesHost, wmlOrigin, "Uses direct route", "HTTP/HTTPS")
  Rel(wavesHost, wapGateway, "Uses classic WAP route", "WSP/WTP/WTLS over WDP/UDP")
  Rel(wapGateway, wmlOrigin, "Fetches resource URI", "HTTP/HTTPS")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Deployment variants

### Default all-in-one browser

- one signed Tauri bundle;
- Lowband and WaveNav statically or natively linked into the host;
- a native WBXML codec, or a version-pinned sidecar included inside the same signed bundle;
- no localhost HTTP API and no local WAP gateway;
- optional connection to a remote WAP gateway profile.

### Rust SDK consumer

- customer application links `lowband-client`, `wavenav-engine`, or both;
- customer chooses its host UI and persistence adapters;
- SDK conformance behavior remains identical to Waves.

### Non-Rust SDK consumer

- preferred mobile path: generated language bindings around the stable facade;
- broad process-boundary path: optional Lowband service deployed by the customer;
- a service is never required solely because the full browser uses Tauri.

### Development and interoperability lab

- Kannel and the local WML server run in containers;
- the production Lowband SDK connects to Kannel as an external peer;
- packet capture, replay, and conformance artifacts are retained;
- lab containers are not shipped with the desktop installer.

## Production packaging gates

1. Tauri bundling is active for every supported target.
2. Every bundled executable/resource has a recorded version, source, checksum, and license.
3. Clean-machine tests prove no package-manager or PATH dependency.
4. The application starts and can browse textual WML even if an optional decoder backend fails.
5. Code signing/notarization, updater signatures, rollback, and SBOM checks are automated.
6. No WAP/OMA specification PDF is included in customer application artifacts.
