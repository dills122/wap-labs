# C4 System Context: Modular WAP/WML Product Suite

Date: 2026-07-24
Status: target architecture

This view shows the separately consumable products and their external network relationships.
Lowband and WaveNav are software products that are embedded into a consuming application; they
are not remote services in the all-in-one browser.

```mermaid
C4Context
  title System Context - Modular WAP/WML Product Suite

  Person(wmlUser, "WML Browser User", "Browses WML 1.3 sites and local decks")
  Person(sdkDeveloper, "SDK Developer", "Builds WAP transport or WML runtime products")
  Person(protocolTester, "Protocol Tester", "Runs conformance and interoperability suites")

  Enterprise_Boundary(productSuite, "WaveNav Product Suite") {
    System(wavesBrowser, "Waves Browser", "Installable WML-only desktop browser")
    System(lowbandSdk, "Lowband Client SDK", "HTTP and WAP client transport product")
    System(wavenavSdk, "WaveNav Engine SDK", "Network-free WML runtime and renderer")
    System(interopKit, "Lowband Interop Kit", "CLI, captures, fixtures, and gateway tests")
  }

  System_Ext(wmlOrigin, "WML Origin Server", "Hosts textual WML, WMLC, scripts, and assets")
  System_Ext(wapGateway, "WAP Proxy or Gateway", "Translates classic WAP requests to origin protocols")
  System_Ext(kannel, "Kannel Test Gateway", "Reference peer used by repository smoke tests")
  System_Ext(osServices, "Desktop OS Services", "Trust store, keychain, filesystem, and networking")

  Rel(wmlUser, wavesBrowser, "Browses WML content with")
  Rel(sdkDeveloper, lowbandSdk, "Embeds transport capabilities from")
  Rel(sdkDeveloper, wavenavSdk, "Embeds WML runtime capabilities from")
  Rel(protocolTester, interopKit, "Runs protocol evidence with")

  Rel(wavesBrowser, lowbandSdk, "Embeds for resource fetching and decode")
  Rel(wavesBrowser, wavenavSdk, "Embeds for deck execution and rendering")
  Rel(wavesBrowser, osServices, "Stores secrets and uses platform services through")

  Rel(lowbandSdk, wmlOrigin, "Fetches WML directly from", "HTTP/HTTPS")
  Rel(lowbandSdk, wapGateway, "Exchanges classic WAP traffic with", "WSP/WTP/WTLS over WDP/UDP")
  Rel(wapGateway, wmlOrigin, "Fetches resources from", "HTTP/HTTPS")
  Rel(interopKit, kannel, "Exercises interoperability against", "WAP and HTTP test interfaces")
  Rel(kannel, wmlOrigin, "Fetches test resources from", "HTTP")

  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

## Context decisions

1. A normal installed browser embeds both SDKs and does not start a local transport server.
2. Direct HTTP/HTTPS and classic WAP are peer routes behind one Lowband client contract.
3. A classic WAP route targets a configured proxy/gateway; the resource origin remains a
   separate identity.
4. Kannel is a test and compatibility peer, not a product runtime requirement.
5. The interop kit is not a second protocol implementation. It wraps the same Lowband SDK.

## Scope boundary

The first complete product profile supports desktop IP networking:

- direct HTTP/HTTPS;
- WSP connectionless over WDP/UDP;
- WSP connection-mode over WTP/WDP/UDP;
- WTLS only when the secure compatibility profile is complete;
- WML 1.3 and WMLC/WBXML 1.3 content.

SMS, USSD, SMPP, and carrier-specific bearer adaptations remain separately gated adapters.
