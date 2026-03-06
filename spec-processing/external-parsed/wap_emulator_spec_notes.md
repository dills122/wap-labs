# WAP Emulator Implementation Notes

Derived from WAP specifications and common explanations found in early
WAP technical literature (e.g., Wiley WAP technical briefs and similar
texts).

------------------------------------------------------------------------

# 1. WAP Architecture Overview

The WAP (Wireless Application Protocol) stack was designed to allow
low‑bandwidth mobile devices to access internet content efficiently over
unreliable wireless networks.

## Layered Architecture

WAP follows a layered architecture similar to TCP/IP.

  -----------------------------------------------------------------------
  Layer                               Purpose
  ----------------------------------- -----------------------------------
  WAE                                 Wireless Application Environment
                                      (WML, WMLScript runtime)

  WSP                                 Wireless Session Protocol
                                      (HTTP‑like request/response session
                                      layer)

  WTP                                 Wireless Transaction Protocol
                                      (reliable transactions over
                                      unreliable networks)

  WTLS                                Wireless Transport Layer Security

  WDP                                 Wireless Datagram Protocol
                                      (UDP‑like abstraction)

  Bearer                              GSM SMS, CSD, GPRS etc
  -----------------------------------------------------------------------

Each layer abstracts the complexity of the layer below it.

------------------------------------------------------------------------

# 2. WML Rendering Model

## Decks and Cards

WML content is structured into **decks** containing **cards**.

### Deck

A deck is the **unit of transmission** between server and device.

### Card

A card represents a **single interaction screen**.

Example:

``` xml
<wml>
  <card id="menu" title="Menu">
     <p>Select option</p>
     <do type="accept" label="Next">
       <go href="#second"/>
     </do>
  </card>

  <card id="second">
     <p>Hello world</p>
  </card>
</wml>
```

### Deck Behavior

1.  Entire deck downloaded in one request
2.  Navigation between cards occurs locally
3.  No additional network request required unless external URL
    referenced

Implication for emulator:

Decks should be cached in memory:

    DeckCache
      cards[]
      variableState
      navigationStack

------------------------------------------------------------------------

# 3. WSP (Wireless Session Protocol)

WSP provides an HTTP‑like session protocol optimized for wireless
networks.

## Request Methods

Typical WSP methods include:

  Method   Equivalent
  -------- ------------
  GET      HTTP GET
  POST     HTTP POST
  HEAD     HTTP HEAD

## Header Tokenization

WSP replaces verbose HTTP headers with compact tokens.

Example token mapping:

  Token   Header
  ------- -----------------
  0x01    Accept
  0x02    Accept-Charset
  0x03    Accept-Encoding
  0x04    Accept-Language
  0x11    Content-Type
  0x17    User-Agent

Binary header encoding significantly reduces bandwidth.

------------------------------------------------------------------------

# 4. WTP (Wireless Transaction Protocol)

WTP is a lightweight transaction protocol optimized for high latency
wireless networks.

## Transaction Classes

  Class     Behavior
  --------- ----------------------------
  Class 0   Unreliable one‑way message
  Class 1   Reliable one‑way
  Class 2   Reliable request/response

Class 2 is most commonly used for WSP operations.

## Simplified Transaction State Machine

    IDLE
     ↓
    REQUEST_SENT
     ↓
    WAIT_ACK
     ↓
    ACK_RECEIVED
     ↓
    RESPONSE_RECEIVED
     ↓
    COMPLETE

### Retransmission

If acknowledgement not received:

    retryCount++
    timeout = exponential_backoff()
    retransmit()

Duplicate detection occurs via transaction IDs.

------------------------------------------------------------------------

# 5. WDP (Wireless Datagram Protocol)

WDP provides a uniform datagram service across different bearer
networks.

Conceptually similar to UDP.

Responsibilities:

-   port addressing
-   bearer abstraction
-   datagram delivery

Example mapping:

    WDP port 9201 → WSP service
    WDP port 9200 → connectionless WAP

------------------------------------------------------------------------

# 6. WTLS (Wireless TLS)

WTLS is a TLS‑like protocol designed for low bandwidth environments.

Main differences from TLS:

-   compressed handshake
-   smaller certificates
-   optimized record structure

Basic handshake flow:

    ClientHello
    ServerHello
    ServerCertificate
    ServerKeyExchange
    ClientKeyExchange
    Finished

Many early deployments terminated WTLS at the gateway rather than the
origin server.

------------------------------------------------------------------------

# 7. WAP Gateway Behavior

A WAP gateway translates between WAP protocols and HTTP.

Typical flow:

    Phone → WSP Request
    Gateway → HTTP Request
    Server → HTTP Response (WML)
    Gateway → WBXML Encoding
    Gateway → WSP Reply
    Phone → Render WML

Responsibilities of gateway:

-   protocol translation
-   WBXML encoding
-   compression
-   caching
-   TLS termination (in some deployments)

------------------------------------------------------------------------

# 8. WBXML Encoding

WML is transmitted using WBXML (binary XML).

Purpose:

-   reduce payload size
-   reduce parsing complexity

Example:

    <tag token>
    attribute token
    string table reference

Binary encoding reduces payload size by 50‑80%.

------------------------------------------------------------------------

# 9. Emulator Architecture Implications

Suggested architecture for a WAP emulator or browser:

    Transport Layer (Rust / Network)
          ↓
    WDP Implementation
          ↓
    WTP Transactions
          ↓
    WSP Session
          ↓
    WBXML Decoder
          ↓
    WML Parser
          ↓
    Rendering Engine

Renderer responsibilities:

-   card navigation
-   variable state
-   form input
-   timers
-   softkey mapping

------------------------------------------------------------------------

# 10. Useful Test Cases

Example deck navigation test:

    deck_navigation.wml

Example form submission:

    login_form.wml

Example menu system:

    menu_cards.wml

These should be used as rendering and navigation test fixtures.

------------------------------------------------------------------------

# 11. Implementation Checklist

## Networking

-   WDP datagram abstraction
-   WTP transaction manager
-   WSP request/response parsing

## Content Processing

-   WBXML decoding
-   WML parsing
-   variable context handling

## Rendering

-   card layout
-   navigation
-   input controls
-   timers

------------------------------------------------------------------------

# 12. Key Engineering Observations

1.  WAP optimized bandwidth aggressively.
2.  Binary encodings replaced verbose formats.
3.  Entire deck transfers minimized network requests.
4.  Gateway translation was fundamental to early deployments.

------------------------------------------------------------------------

# End Document
