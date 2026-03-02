09-April-2001

## Wireless Application Protocol Client ID Specification

## Disclaimer:

You may use this document or any part of the document for internal or educational purposes only, provided you do not modify, edit or take out of context the information in this document in any m anner. You may not use this document in any other manner without the prior written permission of the WAP Forum™. The WAP Forum authorises you to copy this document, provided that you retain all copyright and other proprietary notices contained in the original materials on any copies of the materials and that you comply strictly with these terms. This copyright permission does not constitute an endorsement of the products or services offered by you .

The WAP Forum™ assumes no responsibility for errors or omis sions in this document. In no event shall the WAP Forum be liable for any special, indirect or consequential damages or any damages whatsoever arising out of or in connection with the use of this information .

WAP Forum™ members have agreed to use reasonable endeavors to disclose in a timely manner to the WAP Forum the existence of all intellectual property rights (IPR's) essential to the present document. The members do not have an obligation to conduct IPR searches. This information is publicly available to members and non-members of the WAP Forum and may be found on the "WAP IPR Declarations" list at http://www.wapforum.org/what/ipr.htm. Essential IPR is available for license on the basis set out in the schedule to the WAP Forum Application Form.

## 1. Scope

Wireless  Application  Protocol  (WAP)  is  a  result  of  continuous  work  to  define  an  industry  wide  specification  for developing applications that operate over wireless communication networks. The scope for the WAP Forum is to define a set of specifications to be used by service applications. The wireless market is growing very quickly and reaching new customers  and  providing  new  services.  To  enable  operators  and  manufacturers  to  meet  the  challenges  in  advanced services, differentiation, and fast/flexible service creation, WAP defines a set of protocols in transport, session and application  layers.  For  additional  information  on  the  WAP  architecture,  refer  to  ' Wireless  Application  Protocol Architecture Specification' [WAP].

This  specification  defines  identifiers  for  WAP  clients,  the Client  ID ,  which  provide  a  means  for  a  WAP  client  to identify  itself  to  the  WAP  proxy.  The  goal  of  this  specification  is  to  define  the  format  for  the  Client  ID.  This specification does not define a means for authentication, but it simply defines an identifier format for a device.

## 2. Document Status

This document is available online in the following formats:

- PDF format at http://www.wapforum.org/.

## 2.1.  Copyright Notice

© Copyright Wireless Application Forum Ltd,  2001.

## 2.2.  Errata

## 2.3.  Comments

Comments regarding this document can be submitted to the WAP Forum in the manner published at http://www.wapforum.org/.

## 3. References

## 3.1.  Normative references

| [ABNF]    | 'Augmented BNF for Syntax Specification: ABNF", D. Crocker, Ed., P. Overell. November 1997, URL:http://www.ietf.org/rfc/rfc2234.txt                                               |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [CREQ]    | 'Specification of WAP Conformance Requirements', WAP Forum, WAP-221-CREQ, URL: http://www.wapforum.org/                                                                           |
| [GSM1111] | ETSI European Digital cellular telecommunications system (Phase 2+): Specification of the Subscriber Identity Module - Mobile Equipment(SIM - ME) interface (GSM 11.11)           |
| [GSM0303] | ETSI European Digital cellular telecommunications system (Phase 2+) Numbering, addressing and identification (GSM 03.03)                                                          |
| [MIS]     | Mobitex Interface Specification (MIS), R4A, document number LZY 232 105, http://www.ericsson.se/wireless/products/mobsys/mobitex/subpage/mdown/mdownmi.shtml                      |
| [RFC791]  | 'IP: Internet Protocol', J. Postel, RFC791, September 1981, URL: http://www.ietf.org/rfc/rfc791.txt                                                                               |
| [RFC2119] | "Key words for use in RFCs to Indicate Requirement Levels", S. Bradner, March 1997, URL: http://www.ietf.org/rfc/rfc2119.txt                                                      |
| [RFC2486] | "The Network Access Identifier", B. Aboba, M. Beadles, January 1999, URL: http://www.ietf.org/rfc/rfc2486.txt                                                                     |
| [RFC2373] | "IP Version 6 Addressing Architecture", R. Hinden, S. Deering, July 1998, URL: http://www.ietf.org/rfc/rfc2373.txt                                                                |
| [TETRA]   | ETSI Radio Equipment and System (RES); Terrestial Trunked Radio (TETRA); Voice plus Data (V+D); Part 2: Air Interface (AI) (ETS 300 392-2)                                        |
| [TIA136B] | TIA/EIA-136, Rev B, TDMA Cellular PCS (ANSI/TIA/EIA-136, Rev B-2000). URL: http://www.tiaonline.org/                                                                              |
| [TIA95B]  | TIA/EIA-95-B Mobile Station - Base Station Compatibility Standard for Wideband Spread Spectrum Systems (ANSI/TIA/EIA-95-B-99) , URL: http://www.tiaonline.org/                    |
| [TIAESN]  | 'ESN Assignment Guidelines and Procedures,' Engineering Committee TR-45, Telecommunications Industry Association (TIA), June 5, 1998. URL: http://www.tiaonline.org/standards/esn |
| [WPUSH]   | "Push Proxy Gateway Service Specification", WAP Forum, WAP-151-PPGService, June 2000, URL: http://www.wapforum.org/                                                               |

## 3.2.  Informative references

| [WAP]   | 'Wireless Application Protocol Architecture Specification', WAPForum, WAP-210-WAPArch, Draft Version 17-October-2000 , URL: http://www.wapforum.org/   |
|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| [WSP]   | "Wireless Session Protocol Specification", WAPForum, WAP-203-WSP, June 2000, URL: http://www.wapforum.org/                                             |
| [WTLS]  | "Wireless Transport Layer Security Specification", WAP Forum, WAP-199-WTLS, June 2000, URL:http://www.wapforum.org/                                    |

## 4. Definitions and Abbreviations

## 4.1.  Definitions

The following are terms and conventions used throughout this specification.

The key words 'MUST', 'MUST NOT', 'REQUIRED', 'SHALL', 'SHALL NOT', 'SHOULD',  'SHOULD NOT', 'RECOMMENDED',  'MAY', and 'OPTIONAL' in this document are to be interpreted as described by [RFC2119].

Application - A value-added data service provided to a WAP Client.

Assigned Client ID - A Client ID which is assigned by an operator of a WAP proxy according to its identifier plan.

Client - A device which initiates a request to a server for content or service. See also 'device'.

Client ID - An identifier for a WAP client.

Device - A network entity that is capable of sending and/or receiving packets of information and has a unique device address or identifier.  A device can act as either a client or a server, but in the context of this specification, the device is assumed as a client unless otherwise indicated.

Native Client ID - A Client ID which is constructed by utilizing the available identifiers in a device.

User - A person who interacts with a user agent to use rendered contents. Also referred to as end-user.

User agent - Any software or device that interprets contents and provides a means to interact with a user.

Trusted Domain - a set of trusted proxies, including origin servers, pull and push proxies.

## 4.2.  Abbreviations

For the purposes of this specification, the following abbreviations apply.

| ABNF   | Augmented Backus-Naur Form                            |
|--------|-------------------------------------------------------|
| ESN    | Electronic Serial Number                              |
| HTTP   | Hypertext Transfer Protocol                           |
| IANA   | Internet Assigned Numbers Authority                   |
| IPv4   | Internet Protocol Address Version 4 (32 bit address)  |
| IPv6   | Internet Protocol Address Version 6 (128 bit address) |
| ITSI   | Individual TETRA Subscriber Identity                  |
| MIN    | Mobile Identification Number                          |
| MSISDN | Mobile Subscriber ISDN                                |
| MAN    | Mobile Subscription Number                            |
| RFC    | Request For Comments                                  |
| URI    | Uniform Resource Identifier                           |
| URL    | Uniform Resource Locator                              |
| WAP    | Wireless Application Protocol                         |
| WDP    | Wireless Datagram Protocol                            |
| WSP    | Wireless Session Protocol                             |
| WINA   | WAPInterim Naming Authority                           |

WTLS Wireless Transport Layer Security

## 5. Introduction

The Client ID provides a means to identify a WAP client. The Client ID may be a ssigned by the operator of a WAP proxy,  or  may  be  formed  by  using  the  identifiers  available  in  the  device  according  to  the  syntax  defined  in  this specification. If a Client ID is assigned by an operator, it is typically provisioned into the device. If a Client ID is native, it is formed by using the available identifiers in the device such as ICCID and MIN.

The assigned Client ID is used if it is required and available in the device. This provides flexibility for an operator to administrate its own identifier name space to meet its requirements for subscriber management. However, if an operator chooses not to take the responsibility of administrate Client Ids, it may use the appropriate native Client Ids as defined for the given network.

Client ID, as defined in this specification, is not the only means for identifying a WAP client. It provides an alternative to identify a WAP client and does not exclude any other applicable alternatives for client identification.

## 6.  Client ID Format

This section defines the format of Client ID. The Client ID based on assigned-client-id MUST be used if it is available in a client. One of the Client IDs based on native-client-id MUST be used if assigned Client ID is not available.

If an implementation does not recognise a Client ID type, that is the first octet of the Client ID, it should be treated as a sequence of opaque octets.

## 6.1.  Syntax

The syntactical format of Client ID is defined using ABNF [ABNF] as the following.

```
client-id = assigned-client-id / native-client-id assigned-client-id = assigned-type assigned-identifier native-client-id = ( iccid-type iccid-identifier ) / ( min-type min-identifier ) / ( esn-type esn-identifier ) / ( imsi-type imsi-identifier ) / ( msisdn-type msisdn-identifier ) / ( ipv4-type ipv4-identifier ) / ( ipv6-type ipv6-identifier ) / ( itsi-type itsi-identifier ) / ( man-type man-identifier ) assigned-type = '0' assigned-subtype-operator = '0' assigned-subtype-nai = '1' assigned-subtype-push = '2' assigned-identifier = (assigned-subtype-operator assigned-operator-identifier) /   (assigned-subtype-nai assigned-nai-identifier) /   (assigned-subtype-push assigned-push-identifier) assigned-operator-identifier = identifier-string "_" domain-name identifier-string = 1*64 ( DIGIT / ALPHA / "+" / "-" ) ;an identifier string unique to the domain as identified by domain-name. ;It can be a sequential number, a random number, an encrypted value for ;native-client-id, or any other unique identifiers. domain-name = 1*VCHAR ;the public domain name of the operator. It conforms to the Internet domain ;name conventions and is globally unique. assigned-nai-identifier = 1*(VCHAR except DQUOTE, including SP) ;NAI as the identifier as defined in RFC 2486 [RFC2486] assigned-push-identifier = 1* (VCHAR except DQUOTE, including SP) ;push address as the identifier as defined in WAP Push [WPUSH] iccid-type = '1'
```

```
iccid-identifier = 1*20DIGIT ;use ICCID as the primary native identifier for GSM network [GSM1111] min-type = '2' min-identifier = 1*15DIGIT ;use MIN as the primary native identifier for AMPS, PHS, and PDC network ;and alternative native identifier for IS-136 [TIA136B] esn-type = '3' esn-identifier = 8*12HEXDIG ;use ESN/EESN as the primary native identifier for IS-136, CDMA, ;and CDPD [TIAESN] msisdn-type = '4' msisdn-identifier = 1*15DIGIT ;use MSISDN as the alternative native identifier for GSM network [GSM0303] imsi-type = '5' imsi-identifier = 1*15DIGIT ;use IMSI as the alternative native identifier for CDMA network [TIA95B] ipv4-type = '6' ipv4-identifier = 3DIGIT 3(3DIGIT) ;use IPv4 address [RFC791], '0' must be prepended if less than 3 digits ;in an octet of an IPv4 address; ipv4-type is used as the primary native ;identifier for IPv4 bearers with static globally unique IPv4 address ipv6-type = '7' ipv6-identifier = Text Representation of Address[RFC2373] ;ipv6-type is used as the primary ;native identifier for IPv6 bearers with static IPv6 address itsi-type = "8" itsi-identifier = 1*15DIGIT ;use ITSI as the primary native identifier for a TETRA network[TETRA]. man-type = "9" man-identifier = 1*8DIGIT ;use MAN as the primary native identifier for a Mobitex network [MIS].
```

## 6.2.  Client ID Encoding

The Common Encoding rule defined in [ABNF] MUST be applied. According to the rule, the 7-bit US-ASCII character set is used to encode the client ID.

## 6.3.  Client ID Examples

Use the assigned identifiers:

```
00123xdr3F_foo.com
```

```
;the gateway unique ID is '123xdr3F' and 'foo.com' is the domain name 01joe_doe@foo.com ;formed by using the NAI [RFC2486] 02wappush=47397547589/type=user@carrier.com ;formed by using the WAP push address [WPUSH] Use the native identifiers: 1165012322222 ;ICCID is 165012322222 2165012322222 ;MIN is 165012322222 3AA3B214C ;ESN is 0xAA3B214C 4165012322222 ;MSISDN is 165012322222 5165012322222 ;IMSI is 165012322222 6123123002040 ;IPv4 address is 123.123.2.40 72D::1234:1111 ;IPv6 address is 2D:0:0:0:0:0:1234:1111
```

## 6.4.  Security and Privacy Considerations

This section is informative.

Unless the appropriate authentication mechanisms are properly used, the Client ID is not authenticated. The followings are examples for authenticating Client Id,

- Client ID is transported in the WTLS shared secret handshake and is authenticated by the shared secret [WTLS].
- Client  ID  is  transported  in  the  WSP  proxy  authentication  as  the  user  name  and    is  authenticated  by  the  secret password [WSP].

The implementation should examine the security impact carefully when unauthenticated Client ID is used.

Under certain circumstances, the Client ID may be considered as the private information. Exposing Client ID to an arbitrary application may violate privacy. Therefore, the implementation should examine the privacy impact carefully if Client ID is directly exposed to an application.  The implementation (eg, WAP proxy and/or user agent) should have a privacy policy which controls the exposure of Client ID to an application or a WAP proxy.  User control of ClientID exposure is an example. The native client IDs should only be used between the client and the trusted domains.

## Appendix A  Static Conformance Requirements

This static conformance clause defines a minimum set of features that should be implemented to support WAP Client ID. A feature can be optional (O), mandatory (M) [CREQ].

## A.1 Features

| Item           | Functionality                                                                             |   Reference | Status   | Requirement   |
|----------------|-------------------------------------------------------------------------------------------|-------------|----------|---------------|
| ClientID-C-001 | Use Common Encoding                                                                       |         6.2 | M        |               |
| ClientID-C-002 | Use assigned Client ID, if available                                                      |         6   | M        |               |
| ClientID-C-003 | Use the native Client IDs defined for the network, if Assigned Client ID is not available |         6   | M        |               |
| ClientID-C-004 | Assigned type                                                                             |         6.1 | O        |               |
| ClientID-C-005 | Primary native type ICCID for GSM                                                         |         6.1 | O        |               |
| ClientID-C-006 | Primary native type ESN for IS- 136, CDMA, and CDPD                                       |         6.1 | O        |               |
| ClientID-C-007 | Primary native type MIN for AMPS, PHS, and PDC                                            |         6.1 | O        |               |
| ClientID-C-008 | Primary native type IPv4 for IPv4 bearer with static IPv4 address                         |         6.1 | O        |               |
| ClientID-C-009 | Primary native type IPv6 for IPv6 bearer with static IPv6 address                         |         6.1 | O        |               |
| ClientID-C-010 | Primary native type ITSI for TETRA                                                        |         6.1 | O        |               |
| ClientID-C-011 | Primary native type MANfor Mobitex                                                        |         6.1 | O        |               |

## Appendix B  History and Contact Information

| Document history                                                              | Document history                                                              | Document history                                                                                                                       |
|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Date                                                                          | Status                                                                        | Comment                                                                                                                                |
| 22-Jan-2001                                                                   | Draft                                                                         | Frozen for formal architecture consistency review.                                                                                     |
| 01-Mar-2001                                                                   | Draft                                                                         | Incorporated the CR to address the issues from the architecture consistency review and the CRto add the native identifier for Mobitex. |
| 08-Mar-2001                                                                   | Draft                                                                         | Minor editorial changes on use of normative references.                                                                                |
| 20-Mar-2001                                                                   | Draft                                                                         | Minor editorial changes.                                                                                                               |
| 09-Apr-2001                                                                   | Draft                                                                         | Minor editorial changes.                                                                                                               |
| 08-May-2001                                                                   | Proposed                                                                      | Minor editorial changes for Proposed status                                                                                            |
| 22-Jun-2001                                                                   | Approved                                                                      | Minor editorial changes for Approved status                                                                                            |
| Contact Information http://www.wapforum.org . technical-comments@wapforum.org | Contact Information http://www.wapforum.org . technical-comments@wapforum.org | Contact Information http://www.wapforum.org . technical-comments@wapforum.org                                                          |
