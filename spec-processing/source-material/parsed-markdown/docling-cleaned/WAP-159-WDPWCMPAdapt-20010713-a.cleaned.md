## WDP and WCMP Wireless Data Gateway Adaptation Version 13-Jul-2001

## Wireless Application Protocol WAP-159-WDPWCMPAdapt-20010713-a

© 2001, Wireless Application Protocol Forum, Ltd. All rights res erved.

You may use this document or any part of the document for internal or educational purposes only, provided you do not modify, edit or take out of context the information in this document in any manner. You may not use this document in any other manner without the prior written permission of the WAP Forum™. The WAP Forum authorises you to copy this document, provided that you retain all copyright and other proprietary notices contained in the original materials on any copies of the materials and that you comply strictly with these terms. This copyright permission does not constitute an endorsement of the products or services offered by you .

The WAP Forum™ assumes no responsibility for errors or omissions in this document. In no event shall the WAP Forum be liable for any special, indirect or consequential damages or any damages whatsoever arising out of or in connection with the use of this information .

WAP Forum™ members have agreed to use reasonable endeavors to disclose in a timely manner to the WAP Forum the existence of all intellectual property rights (IPR's) essential to the present document. The members do not have an obligation to conduct IPR searches. This information is publicly available to members and non-members of the WAP Forum and may be found on the "WAP IPR Declarations" list at http://www.wapforum.org/what/ipr.htm. Essential IPR is available for license on the basis set out in the schedule to the WAP Forum  Application Form.

No representations or warranties (whether express or implied) are made by the WAP Forum™ or any WAP Forum member or its affiliates regarding any of the IPR's represented on this list, including but not limited to the accuracy, completeness, validity or relevance of the information or whether or not such rights are essential or non-essential.

Comments regarding this document can be submitted to the WAP Forum™ in the manner published at http://www.wapforum.org/.

| Document History                    |          |
|-------------------------------------|----------|
| WAP-159-WDPWCMPAdpat-19991105-a     | Approved |
| WAP-159_001-WDPWCMPAdapt-20010712-a | SIN      |
| WAP-159_002-WDPWCMPAdapt-20010124-a | SIN      |
| WAP-159_003-WDPWCMPAdapt-20010713-a | SIN      |
| WAP-159-WDPWCMPAdapt-20010713-a     | Current  |

## 1. Scope

This document specifies the WDP and WCMP adaptation over the underlying access protocol between a WAP Proxy Server and a Wireless Data Gateway (such as an SMSC or a USSD server).

The tunnel protocol in the WAP architecture is based on a subset of the Short Message Peer-to-Peer Protocol (SMPP), version 3.4. SMPP includes support for the SMS bearer service (across the various network types) and the USSD bearer service (GSM network only).

This document details the elements of the SMPP protocol that are required and sufficient for carrying WDP and WCMP data units between a WAP Proxy Server and a Wireless Data Gateway. The Wireless Data Gateway is responsible  for relaying the WDP and WCMP data units to and from the WAP capable wireless device (such as a mobile station).

Figure 1.1 shows a general model of the WAP protocol architecture and how SMPP fits into that architecture.

Figure 1.1 SMPP Tunnel in the WAP Architecture

## 2. References

## 2.1. Normative References

[CREQ]

'Specification of WAP Conformance Requirements'. WAP Forum  WAP-221-CREQ-20010425-a. URL:http//www.wapforum.org/

.

[RFC2119]

'Key words for use in RFCs to Indicate Requirement Levels'. S. Bradner. March 1997. URL:http://www.ietf.org/rfc/rfc2119.txt

[SMPP34]

Short Message Peer-to-Peer Protocol (SMPP) Specification.  Version 3.4, Issue 1.2. http://www.smpp.org.

[WCMP]

"Wireless Control Message Protocol Specification", WAP Forum  , 14 May 1999. http://www.wapforum.org

[WDP]

"Wireless Datagram Protocol Specification", WAP Forum  , 14 May 1999. http://www.wapforum.org

## 2.2. Informative References

[WAE]

"Wireless Application Environment Specification", WAP Forum  , 16 June 1999. http://www.wapforum.org

[WAP]

'Wireless Application Protocol Architecture Specification', WAP Forum  , 30 April 1998. http://www.wapforum.org

[WTP]

"Wireless Transaction Protocol Specification, WAP Forum  , 11 June 1999. http://www.wapforum.org

## 3. Terminology and Conventions

## 3.1. Conventions

The key words 'MUST', 'MUST NOT', 'REQUIRED', 'SHALL', 'SHALL NOT', 'SHOULD', 'SHOULD NOT', 'RECOMMENDED', 'MAY', and 'OPTIONAL' in this document are to be interpreted as described in [RFC2119].

All sections and appendixes, except 'Scope' and 'General', are normative, unless they are explicitly indicated to be informative.

## 3.2. Definitions

None.

## 3.3. Abbreviations

CDMA

Code Division Multiple Access

DPF

Delivery Pending Flag

ETSI

European Telecommunication Standardisation Institute

GPRS

General Packet Radio System

GSM

Global System for Mobile Communication

iDEN

Integrated Digital Enhanced Network

IE

Information Element

IP

Internet Protocol

LSB

Least Significant Bits

MAP

Mobile Application Part

ME

Mobile Equipment

MMS

More Messages to Send

MO

Mobile Originated

MS

Mobile Station

MSB

Most Significant Bit

MSISDN

Mobile Subscriber ISDN (telephone number or address of device)

MT

Mobile Terminated

PDU

Protocol Data Unit

SAR

Segmentation and Reassembly

SME

Short Message Entity

SME-IF

Short Message Entity Interface

SMPP

Short Message Peer-to-Peer

SMS

Short Message Service

SMSC

Short Message Service Centre

TCP

Transmission Control Protocol

TDMA

Time Division Multiple Access

UDH

User-Data Header (see GSM 03.40)

UDHI

User-Data Header Indication (see GSM 03.40)

UDP

User Datagram Protocol

USSD

Unstructured Supplementary Service Data

WAP

Wireless Application Protocol

WCMP

Wireless Control Message Protocol

WDP

Wireless Datagram Protocol

WSP

Wireless Session Protocol

WTP

Wireless Transaction Protocol

## 4. General

The protocol between a WAP Proxy Server and a Wireless Data Gateway is required to be 'wireless network technology independent'. This assures a true isolation from the network type and device type used. It also assures the end-to-end nature of the Wireless Data Protocol (WDP) and Wireless Control Message Protocol (WCMP) that are 'tunnelled' between the WAP Proxy Server and the Mobile Station.

This document defines in an unambiguous manner how SMPP shall be implemented for a proper interworking in this context.

The following sections describe the protocol elements to be used, specific values of parameters to be used and recommends optional features.

## 5. SMPP Adaptation

Note:This section of the document defines those specific elements of SMPP v3.4 which are required for WAP applications. It is intended that this document be used in conjunction with SMPP Protocol Specification v3.4 [SMPP34] (available from http://www.smpp.org).

## 5.1. General WDP/WCMP adaptation requirements

## 5.1.1. Underlying transport protocol

The underlying transport protocol for access between a Wireless Data Gateway and a WAP Proxy Server is TCP/IP. TCP/IP provides a reliable connection-oriented transport. Other protocols supported by SMPP, such as X.25, may also be used for the underlying transport connection.

## 5.1.2. Support for More Messages to Send

Some wireless network technologies allow a Wireless Data Gateway to keep a short message transaction open between the Gateway MSC and the MS in the case where there are more messages waiting to be sent from the Wireless Data Gateway to the MS. This feature is commonly referred to as 'More Messages to Send'.

In a WAP system there are typically more than one mobile terminated message in the response from the WAP Proxy Server to the MS.  The capability for the WAP Proxy Server to indicate that there are further messages for the MS could crucially improve the response time perceived by the user.

SMPP allows WAP Proxy Servers to set a more\_msgs\_to\_send indicator on a per message basis. Independently of this SMPP parameter setting, Wireless Data Gateway implementations may choose (as an implementation option) to intelligently set the MMS parameter on the air interface when a multiple-fragment WDP message is been sent to the MS, i.e. without a specific indication from the WAP Proxy Server to set it.

## 5.1.3. Support for 'non Store-and-Forward' messages

Traditionally Wireless Data Gateways securely stored messages to a non-volatile disk file system before delivering them. Many interactive WAP applications do not require this feature and indeed the increased latency incurred may be undesirable, and perhaps even prohibitive, in many applications.

SMPP allows the WAP Proxy Server to send a datagram message using the data\_sm PDU.  Wireless Data Gateways implementations MAY choose not to securely store the WDP/WCMP datagram. A WAP Proxy Server requests datagram mode by setting the esm\_class parameter in data\_sm to the value corresponding to 'datagram mode'.

## 5.1.4. Support for transferring binary data

WDP and WCMP messages are encoded in binary format. The adaptation layers in the Wireless Data Gateway and WAP Proxy Server MUST set the SMPP data\_coding parameter to '8 -bit binary' (0x04).

Some WAP Proxy Servers may encode WDP datagrams in textual format. In this case, the WAP Proxy Server MAY set the SMPP data\_coding parameter to another character coding set scheme (e.g. IA5/ASCII).

## 5.1.5. Segmentation and Reassembly (SAR)

The WDP Tunnel Requirements allows various options for the Segmentation and Reassembly of WDP datagrams.

## 1. The WAP Proxy Server is performing Segmentation and Reassembly

When sending a WDP datagram to the wireless device, the WAP Proxy Server segments the WDP datagram prior to tunnelling it over the SMPP connection to the Wireless Data Gateway.  Each of the segments is transmitted in a separate data\_sm PDU to the Wireless Data Gateway.  In this case, the WAP Proxy Server MUST include the sar\_msg\_ref\_num, sar\_total\_segments and the sar\_segment\_seqnum parameters in the data\_sm PDU.

When a WAP Proxy Server is receiving a WDP datagram from the wireless device, it can receive it in the form of a number of segments.  Each segment is sent by the Wireless Data Gateway as message payload in separate data\_sm PDUs.  In this case, the Wireless Data Gateway MUST include the sar\_msg\_ref\_num, sar\_total\_segments and the sar\_segment\_seqnu m parameters in the data\_sm PDU. The WAP Proxy Server reassembles the complete WDP datagram once it has received all segments.

## 2. The Wireless Data Gateway implements a Segmentation and Reassembly function for WDP Datagrams.

When sending a WDP datagram to the wireless device, the WAP Proxy Server sends a complete datagram in a single data\_sm PDU to the Wireless Data Gateway.  In this case, the WAP Proxy Server MUST not include the sar\_msg\_ref\_num, sar\_total\_segments and the sar\_segment\_seqnu m parameters in the data\_sm PDU.

When a WAP Proxy Server is receiving a WDP datagram from the wireless device, it will receive it as a complete datagram from the Wireless Data Gateway.  In this case, the Wireless Data Gateway MUST not include the sar\_msg\_ref\_num, sar\_total\_segments and the sar\_segment\_seqnum parameters in the data\_sm PDU.

## 3. Dual Segmentation and Reassembly

This is a special case of SAR where both the WAP Proxy Server and the Wireless Data Gateway perform the Segmentation and Reassembly of a WDP datagram. In this scenario, the WAP Proxy Server transmits the WDP datagram as a sequence of segments over the SMPP tunnel to the Wireless Data Gateway. As an implementation option, the Wireless Data Gateway then reassembles the segments back into one complete WDP datagram, before it forwards the WDP datagram over the wireless interface. Depending on the technology of the wireless device, the Wireless Data Gateway may have to re-segment the datagram for transmission over the wireless interface.

Similarly, the Wireless Data Gateway may reassemble a WDP datagram received as a series of segments over the wireless interface and then re-segment the WDP datagram for delivery over the SMPP tunnel to the WAP Proxy Server.

The adaptation for the transmission of the WDP datagram segments over the SMPP tunnel is exactly the same as option 1 above for both directions of WDP datagram flow.  In essence, the Dual Segmentation and Reassembly is an implementation option for the Wireless Data Gateway and no extra special adaptation is required.

## 5.1.6. WCMP Support

When sending a WCMP message to the MS, the WAP Proxy Server MUST indicate this to the Wireless Data Gateway by setting the payload\_type parameter in data\_sm to 'WCMP' (0x01). The WCMP message is carried in the message\_payload parameter.  On receiving a data\_sm with payload\_type set to 'WCMP', the Wireless Data Gateway will transmit the WCMP messages to the wireless device using the network dependent mechanism as defined in [WCMP].

The Wireless Data Gateway can also relay a WCMP message from the wireless device to the WAP Proxy Server. In this case, the Wireless Data Gateway MUST set the payload\_type parameter in data\_sm to 'WCMP' (0x01). The WCMP message is carried in the message\_payload parameter.

## 5.1.7. Alert Notification

A WAP Proxy Server can request that the Wireless Data Gateway set a Delivery Pending Flag (DPF) for the delivery failure of a WDP datagram over the wireless interface. The exact delivery failure conditions are technology dependent (e.g. GSM allows a DPF to be set for 'memory capacity exceeded') and Wireless Data Gateway implementation specific. However, in general the failure condition can be characterised as being a 'device unavailable' failure.

SMPP allows the WAP proxy server to request this setting on a per-datagram basis using the set\_dpf parameter in the data\_sm PDU .

The Wireless Data Gateway SHOULD then send an alert notification to the WAP Proxy Server when it or the wireless network infrastructure (e.g. HLR) detects that device has become available. It should be noted that the Wireless Data Gateway only sends this alert when the DPF setting for the wireless device had been requested in a previous data\_sm operation.

The alert\_notification PDU is used to send the alert to the WAP Proxy Server.

## 5.2. Mandatory SMPP PDUs

This section documents the SMPP PDUs that are mandatory for WDP/WCMP data tunnelling between a WAP Proxy Server and a Wireless Data Gateway.

## 5.2.1. DATA\_SM

The data\_sm PDU is used to carry WDP and WCMP datagrams. The type of payload is indicated via the payload\_typ e parameter.   Both the Wireless Data Gateway and the WAP Proxy Server MUST be capable of sending the data\_sm PDU.

A WAP Proxy Server MAY select a delivery mode when tunnelling datagrams to the Wireless Data Gateway. The delivery mode indicates to the Wireless Data Gateway the mechanism to be used for delivering the datagram to the wireless device. The delivery mode is indicated in the esm\_class parameter (message mode settings). The delivery modes available in data\_sm for WAP datagrams are as follows:

1. Store and Forward

This mode allows the WAP Proxy Server to request the Wireless Data Gateway to securely store the datagram until it is delivered or until it expires. This mode may be used for 'push' applications.  The WAP Proxy Server can control the expiration time by specifying the qos\_time\_to\_live parameter in the data\_sm PDU.

2. Datagram

This mode allows the WAP Proxy Server to request the Wireless Data Gateway to relay the datagram to the MS, without necessarily securing the datagram for long-term storage. This mode is designed for 'interactive applications'. The WAP Proxy Server can control the lifetime of the datagram in the Wireless Data Gateway by specifying the qos\_time\_to\_live parameter in the data\_sm PDU.

The data\_sm PDU also supports the various options for location of the Segmentation and Reassembly function in the WAP network. See section 5.1.5.

Section  5.4.7 details the individual parameter settings for the data\_sm PDU for both the 'mobile terminated' and 'mobile originated' directions.

## 5.2.2. GENERIC\_NACK

The GENERIC\_NACK PDU is sent by the Wireless Data Gateway or the WAP Proxy Server to indicate the following SMPP protocol error conditions encountered when processing an SMPP request PDU.

- Invalid command\_length. The length of the SMPP request PDU is not correct .
- Unknown command\_id . The SMPP request PDU is either unknown or not supported.
- Corrupted SMPP PDU. The SMPP request PDU is detected to be corrupt.

## 5.2.3. BIND

The WAP Proxy Server must establish an SMPP session with a Wireless Data Gateway prior to the transmission of WDP/WCMP messages over the link. There are two mechanisms for setting up SMPP sessions. At least one mechanism MUST be supported by a WAP Proxy Server.

The first mechanism allows the WAP Proxy Server to issue both a bind\_transmitter PDU and/or a bind\_receiver PDU to set up distinct SMPP sessions for the different directions of WDP message flow.

The second mechanism allows a WAP Proxy Server to set up a single SMPP session for two-way WDP datagram flow using the bind\_transceiver PDU.

## 5.2.3.1. BIND\_TRANSCEIVER

The bind\_transceiver PDU is used to establish a duplex messaging session between a WAP Proxy Server and a Wireless Data Gateway.  The WAP Proxy Server can send datagrams to a wireless device (e.g. MS) and should be able to receive datagrams from a wireless device over a transceiver session.

The WAP Proxy Server provides identification and authentication information as part of the session establishment. See 5.4.1 for more details.

As an option, Wireless Data Gateways MAY allow trusted WAP Proxy Servers to establish an SMPP session without providing a password.

## 5.2.3.2. BIND\_TRANSMITTER

The bind\_transmitter PDU is used to establish a one way messaging session between a WAP Proxy Server and a Wireless Data Gateway.  The WAP Proxy Server can only send datagrams to a wireless device (e.g. MS) over a transmitter session.

The WAP Proxy Server provides identification and authentication information as part of the session establishment. See 5.4.2 for more details.

As an option, Wireless Data Gateways MAY allow trusted WAP Proxy Servers to establish an SMPP session without providing a password.

## 5.2.3.3. BIND\_RECEIVER

The bind\_receiver PDU is used to establish a one-way messaging session between a WAP Proxy Server and a Wireless Data Gateway.  The WAP Proxy Server will only receive datagrams originated from a wireless device (e.g. MS) over an SMPP receiver session.

The WAP Proxy Server provides identification and authentication information as part of the se ssion establishment. See 5.4.3 for more details.

As an option, Wireless Data Gateways MAY allow trusted WAP Proxy Servers to establish an SMPP session without providing a password.

## 5.2.4. UNBIND

The UNBIND PDU is used by either the WAP Proxy Server or the Wireless Data Gateway to terminate the SMPP session. Thereafter the node should disconnect the link at TCP level.

## 5.3. Optional SMPP PDUs

This section documents the SMPP PDUs that are implementation options for WDP/WCMP data tunnelling between a WAP Proxy Server and a Wireless Data Gateway.

## 5.3.1. ENQUIRE\_LINK

This PDU can be used by both the WAP Proxy Server and the Wireless Data Gateway to test the peer to peer communications and sanity level of an SMPP link.  When implemented, the node sending the enquire\_link PDU should note the following:

- The enquire\_link PDU need only be sent after a certain idle (i.e. inactivity) period has been detected on the link. This period is defined using the SMPP enquire\_link\_timer.
- If a response is not received within a certain time period (defined by the SMPP response\_timer ), the node should disconnect the link at TCP/IP level.

## 5.3.2. ALERT\_NOTIFICATION

This PDU is used by the Wireless Data Gateway to send an alert notification to the WAP Proxy Server.  A Wireless Data Gateway sends an alert notification when it detects that a wireless device has become available and for which a DPF setting had been previously requested (by the WAP Proxy Server) in a failed datagram delivery to that wireless device.

The alert\_notification PDU contains the address of the wireless device and the originating WDP entity address in the datagram which requested the DPF setting.

## 5.4. Detailed Parameter Value Recommendations

This section provides the recommended parameter values for the subset of the SMPP PDUs that are required for WDP and WCMP data tunnelling. Only those SMPP parameters that are mandatory or optional for WAP application are documented in this section.

Note:This section of the document defines those specific elements of SMPP Protocol Specification v3.4 which are required for WAP applications. This section does not document generic SMPP details such as the SMPP header format. The reader should refer to the SMPP specification [SMPP34] for this generic information.

## 5.4.1. BIND\_TRANSCEIVER

The bind\_transceiver operation is used by a WAP Proxy Server to establish a duplex messaging session to a Wireless Data Gateway. The following tables provide the recommended parameter settings for the request and response PDUs.

## 5.4.1.1. BIND\_TRANSCEIVER Request

| Parameter         | M/O   | Size (bytes)   | Recommended Value               | Comment                                                                                                                                                                                    |
|-------------------|-------|----------------|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| system_id         | M     | 1 - 15         | identification string           | Identifies the WAP Proxy Server                                                                                                                                                            |
| password          | M     | 1 - 9          | any character string            | Trusted WAP Proxy Servers that do not need to send a password can set this parameter to NULL.                                                                                              |
| system_type       | M     | 1 - 12         | 'WAP'                           | Indicates that the connecting system is a WAP Proxy Server.                                                                                                                                |
| interface_version | M     | 1              | 0x34                            | Identifies the version of the SMPP protocol supported by the ESME.                                                                                                                         |
| addr_ton          | M     | 1              | Any                             | TON for WAP Proxy Server address                                                                                                                                                           |
| addr_npi          | M     | 1              | Any.                            | NPI for WAP Proxy Server address                                                                                                                                                           |
| address_range     | M     | 1 - 40         | WAP Proxy Server address digits | A single address which identifies the WAP Proxy Server. This could be for example an IP address or a short code telephone number assigned to the WAP Proxy Server by the service provider. |

## 5.4.1.2. BIND\_TRANSCEIVER Response

| Parameter            | M/O   | Size (bytes)   | Recommended Value     | Comment                                                              |
|----------------------|-------|----------------|-----------------------|----------------------------------------------------------------------|
| system_id            | M     | 1 - 15         | identification string | Identifies the Wireless Data Gateway                                 |
| sc_interface_version | M     | 1              | 0x34                  | Wireless Data Gateways should set the SMPP protocol version to v3.4. |

## 5.4.2. BIND\_TRANSMITTER

The bind\_transmitter operation is used by a WAP Proxy Server to establish a one way messaging session to a Wireless Data Gateway. The following tables provide the recommended parameter settings for the request and resp onse PDUs.

## 5.4.2.1. BIND\_TRANSMITTER Request

| Parameter         | M/O   | Size (bytes)   | Recommended Value               | Comment                                                                                                                                                                                    |
|-------------------|-------|----------------|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| system_id         | M     | 1 - 15         | identification string           | Identifies the WAP Proxy Server                                                                                                                                                            |
| password          | M     | 1 - 9          | password character string       | Trusted WAP Proxy Servers that do not need to send a password can set this parameter to NULL.                                                                                              |
| system_type       | M     | 1 - 12         | 'WAP'                           | Indicates that the connecting system is a WAP Proxy Server.                                                                                                                                |
| interface_version | M     | 1              | 0x34                            | Identifies the version of the SMPP protocol supported by the ESME.                                                                                                                         |
| addr_ton          | M     | 1              | Any                             | TON for WAP Proxy Server address                                                                                                                                                           |
| addr_npi          | M     | 1              | Any.                            | NPI for WAP Proxy Server address                                                                                                                                                           |
| address_range     | M     | 1 - 40         | WAP Proxy Server address digits | A single address which identifies the WAP Proxy Server. This could be for example an IP address or a short code telephone number assigned to the WAP Proxy Server by the service provider. |

## 5.4.2.2. BIND\_TRANSMITTER Response

| Parameter            | M/O   | Size (bytes)   | Recommended Value     | Comment                                                            |
|----------------------|-------|----------------|-----------------------|--------------------------------------------------------------------|
| system_id            | M     | 1 - 15         | identification string | Identifies the Wireless Data Gateway                               |
| sc_interface_version | M     | 1              | 0x34                  | Wireless Data Gateways MUST set the SMPP protocol version to v3.4. |

## 5.4.3. BIND\_RECEIVER

The bind\_receiver operation establishes a one way messaging session to a Wireless Data Gateway for receiving WDP and WCMP datagrams originated by wireless devices. The following tables provide the recommended parameter settings for the request and response PDUs.

## 5.4.3.1. BIND\_RECEIVER Request

| Parameter         | M/O   | Size (bytes)   | Recommended Value               | Comment                                                                                                                                                                                    |
|-------------------|-------|----------------|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| system_id         | M     | 1 - 15         | Identification string           | Identifies the WAP Proxy Server                                                                                                                                                            |
| password          | M     | 1 - 9          | password character string       | Trusted WAP Proxy Servers that do not need to send a password can set this parameter to NULL.                                                                                              |
| system_type       | M     | 1 -12          | 'WAP'                           | Indicates that the connecting system is a WAP Proxy Server.                                                                                                                                |
| interface_version | M     | 1              | 0x34                            | Identifies the version of the SMPP protocol supported by the ESME.                                                                                                                         |
| addr_ton          | M     | 1              | Any                             | TON for WAP Proxy Server address                                                                                                                                                           |
| addr_npi          | M     | 1              | Any.                            | NPI for WAP Proxy Server address                                                                                                                                                           |
| address_range     | M     | 1 - 40         | WAP Proxy Server address digits | A single address which identifies the WAP Proxy Server. This could be for example an IP address or a short code telephone number assigned to the WAP Proxy Server by the service provider. |

## 5.4.3.2. BIND\_RECEIVER Response

| Parameter            | M/O   | Size (bytes)   | Recommended Value     | Comment                                                            |
|----------------------|-------|----------------|-----------------------|--------------------------------------------------------------------|
| system_id            | M     | 1 - 15         | identification string | Identifies the Wireless Data Gateway                               |
| sc_interface_version | M     | 1              | 0x34                  | Wireless Data Gateways MUST set the SMPP protocol version to v3.4. |

## 5.4.4. UNBIND

The unbind operation clears down an SMPP session between a WAP Proxy Server and a Wireless Data Gateway.

Both t he unbind and unbind\_resp PDUs only contain an SMPP header part.

## 5.4.5. ENQUIRE\_LINK

The enquire\_link operation is used by a WAP Proxy Server and a Wireless Data Gateway to test the peer to peer communications and sanity level of an SMPP session.

Both the enquire\_link and enquire\_link\_resp PDUs only contain an SMPP header part.

## 5.4.6. DATA\_SM (WAP Proxy Server Initiated)

A WAP Proxy Server uses the data\_sm PDU to send a WDP or a WCMP message to a Wireless Data Gateway. The Wireless Data Gateway should return a data\_sm\_resp PDU once it has accepted the message.

## 5.4.6.1. DATA\_SM (WAP Proxy Server -&gt; Wireless Data Gateway)

The following table provides the recommended values to be used by a WAP Proxy Server when sending a data\_sm .

| Parameter           | M/O   | Size (bytes)   | Recommended Value                     | Comment                                                                                                                          |
|---------------------|-------|----------------|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| service_type        | M     | 5              | 'WAP'                                 | Indicates SMS application service is WAP                                                                                         |
| source_addr_ton     | M     | 1              | 0x00 (Unknown)                        | International directory number                                                                                                   |
| source_addr_npi     | M     | 1              | 0x00 (Unknown) 0x01 (E.164) 0x0E (IP) | WAP Proxy Server can indicate the associated numbering plan of its own address.                                                  |
| source_addr         | M     | 0 - 64         | Address digits                        | address digits of WAP Proxy Server                                                                                               |
| dest_addr_ton       | M     | 1              | 0x01                                  | International directory number                                                                                                   |
| dest_addr_npi       | M     | 1              | 0x01                                  | E164 numbering plan                                                                                                              |
| dest_addr           | M     | 1 - 64         | Directory number digits               | This is the MSISDN of the MS                                                                                                     |
| esm_class           | M     | 1              | 0x00 0x01 0x03                        | Default mode Datagram mode Store and Forward mode                                                                                |
| registered_delivery | M     | 1              | 0x00 0x01                             | No SMSC receipt requested SMSC Delivery Receipt requested                                                                        |
| data_coding         | M     | 1              | 0x04 0x00 - 0x0F                      | 8-bit binary other character sets.                                                                                               |
| source_port         | O     | 2              | 0 - 65535                             | UDP port of originating WDP entity. This parameter MUST be present for a WDP message and SHOULD NOT be used for a WCMP message.. |
| dest_port           | O     | 2              | 0 - 65535                             | UDP port of destination WDP entity. This parameter MUST be present for a WDP message and SHOULD NOT be used for a WCMP message.. |
| sar_msg_ref_num     | O     | 2              | 0 - 65535                             | MUST be present if WAP Proxy Server is segmenting the WDP message.                                                               |
| sar_total_segments  | O     | 1              | 2 - 255                               | MUST be present if WAP Proxy Server is segmenting the WDP message                                                                |
| sar_segment_seqnum  | O     | 1              | 1 - 255                               | MUST be present if WAP Proxy Server is segmenting the WDP message                                                                |
| more_msgs_to_send   | O     | 1              | 0x01                                  | SHOULD be present if WAP Proxy Server has further WDP (segments) to send.                                                        |
| dest_addr_subunit   | O     | 1              | 0x00 (unknown) 0x02 (ME)              | WAP Proxy Server MAY include this parameter to direct the WDP/WCMP within the MS                                                 |
| dest_network_type   | O     | 1              | Any                                   | WAP Proxy Server MAY include this parameter to direct the WDP/WCMP to a particular wireless network type                         |
| dest_bearer_type    | O     | 1              | Any                                   | WAP Proxy Server MAY include this parameter to request the Wireless Data Gateway to select a particular bearer for the WDP/WCMP. |

| Parameter        | M/O   | Size (bytes)   | Recommended Value      | Comment                                                                                                                            |
|------------------|-------|----------------|------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| qos_time_to_live | O     | 4              | Any                    | MAYbe used to request the period of time that the Wireless Data Gateway should retain the WDP message if it fails to get delivered |
| payload_type     | O     | 1              | 0x00 (WDP) 0x01 (WCMP) | This parameter MUST be present and set to 0x01 for a WCMP message                                                                  |
| message_payload  | M     | 1 - 65535      | user data              | WDP or WCMP content                                                                                                                |
| set_dpf          | O     | 1              | 0x00 or 0x01           | Do not set DPF Setting of DPF requested.                                                                                           |

## 5.4.6.2. DATA\_SM\_Resp (Wireless Data Gateway -&gt; WAP Proxy Server)

The following table provides the recommended values to be used by a Wireless Data Gateway when returning a data\_sm\_resp .

| Parameter                   | M/O   | Size (bytes)   | Recommended Value   | Comment                                                                                                           |
|-----------------------------|-------|----------------|---------------------|-------------------------------------------------------------------------------------------------------------------|
| message_id                  | M     | 1 - 64         | Any                 | The message ID is the Wireless Data Gateway's handle to the datagram. It should be considered as an opaque value. |
| additional_status_info_text | O     | 1 - 255        | Textual string      | A Wireless Data Gateway may include a diagnostic text string for failure scenarios                                |

## 5.4.7. DATA\_SM (Wireless Data Gateway Initiated)

A Wireless Data Gateway uses the data\_sm operation to send a WDP or a WCMP message to a WAP Proxy Server.

## 5.4.7.1. DATA\_SM (Wireless Data Gateway -&gt; WAP Proxy Server)

The following table provides the recommended values to be used by a Wireless Data Gat eway when sending a data\_sm .

| Parameter           | M/O   | Size (bytes)   | Recommended Value                      | Comment                                                                                                                          |
|---------------------|-------|----------------|----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| service_type        | M     | 5              | 'WAP'                                  | Indicates SMS application service is WAP                                                                                         |
| source_addr_ton     | M     | 1              | 0x01 (Int.)                            | International directory number                                                                                                   |
| source_addr_npi     | M     | 1              | 0x01 (E.164)                           | all MS's have E.164 directory numbers                                                                                            |
| source_addr         | M     | 0 - 64         | address digits                         | directory number digits of wireless device                                                                                       |
| dest_addr_ton       | M     | 1              | 0x00 (unknown)                         | International directory number                                                                                                   |
| dest_addr_npi       | M     | 1              | 0x00 (unknown) 0x01 (E.164 ) 0x0E (IP) | WAP Proxy Server can either be addressed via an IP address or a telephone number address. Otherwise set to 'unknown'             |
| dest_addr           | M     | 1 - 64         | address digits                         | Address digits of WAP Proxy Server                                                                                               |
| esm_class           | M     | 1              | 0x00                                   | no special message mode                                                                                                          |
| registered_delivery | M     | 1              | 0x00                                   | no acknowledgements/receipts                                                                                                     |
| data_coding         | M     | 1              | 0x04 0x00 - 0x0F                       | 8-bit binary Other character sets.                                                                                               |
| source_port         | O     | 2              | 0 - 65535                              | UDP port of originating WDP entity. This parameter MUST be present for a WDP message and SHOULD NOT be used for a WCMP message.. |
| dest_port           | O     | 2              | 0 - 65535                              | UDP port of destination WDP entity. This parameter MUST be present for a WDP message and SHOULD NOT be used for a WCMP message.. |
| sar_msg_ref_num     | O     | 2              | 0 - 65535                              | MUST be present if WAP Proxy Server is reassembling the WDP message.                                                             |
| sar_total_segments  | O     | 1              | 2 - 255                                | MUST be present if WAP Proxy Server is reassembling the WDP message                                                              |
| sar_segment_seqnum  | O     | 1              | 1 - 255                                | MUST be present if WAP Proxy Server is reassembling the WDP message                                                              |
| source_network_type | O     | 1              | Any                                    | Wireless Data Gateway MAYinclude this parameter to indicate the type of wireless interface over which the datagram was received. |
| source_bearer_type  | O     | 1              | Any                                    | Wireless Data Gateway MAYinclude this parameter to indicate the type of wireless bearer over which the datagram was received.    |
| payload_type        | O     | 1              | 0x00 (WDP) 0x01 (WCMP)                 | This parameter MUST be present and set to 0x01 for a WCMP message.                                                               |
| message_payload     | M     | 1 - 65535      | user data                              | WDP or WCMP content                                                                                                              |

## 5.4.7.2. DATA\_SM\_Resp (WAP Proxy Server -&gt; Wireless Data Gateway)

The following table provides the recommended values  to be used by a WAP Proxy Server when returning a data\_sm\_resp .

| Parameter                   | M/O   | Size (bytes)   | Recommended Value   | Comment                                                                       |
|-----------------------------|-------|----------------|---------------------|-------------------------------------------------------------------------------|
| message_id                  | M     | 1 - 64         | 0x00 (NULL)         | The Wireless Data Gateway does not need a handle to the WDP or WCMP datagram. |
| additional_status_info_text | O     | 1 - 255        | Textual string      | A WAP Proxy Server may include a diagnostic text string for failure scenarios |

## 5.4.8. DATA\_SM (Delivery Receipt from Wireless Data Gateway)

A Wireless Data Gateway uses the data\_sm operation to send a final delivery receipt to the WAP Proxy Server.

## 5.4.8.1. DATA\_SM (Wireless Data Gateway -&gt; WAP Proxy Server)

The following table provides the recommended values to be used by a Wireless Data Gateway when sending a Delivery Receipt.

| Parameter            | M/O   | Size (bytes)   | Recommended Value                      | Comment                                                                                                                                                                                                        |
|----------------------|-------|----------------|----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| service_type         | M     | 5              | 'WAP'                                  | Indicates SMS application service is WAP                                                                                                                                                                       |
| source_addr_ton      | M     | 1              | 0x01 (Int.)                            |                                                                                                                                                                                                                |
| source_addr_npi      | M     | 1              | 0x01 (E.164)                           | all MS's have E.164 directory numbers                                                                                                                                                                          |
| source_addr          | M     | 0 - 64         | address digits                         | directory number digits of wireless device to which the receipt pertains                                                                                                                                       |
| dest_addr_ton        | M     | 1              | 0x00 (unknown)                         |                                                                                                                                                                                                                |
| dest_addr_npi        | M     | 1              | 0x00 (unknown) 0x01 (E.164 ) 0x0E (IP) | WAP Proxy Server can either be addressed via an IP address or a telephone number address. Otherwise set to 'unknown'                                                                                           |
| dest_addr            | M     | 1 - 64         | address digits                         | Address digits of WAP Proxy Server                                                                                                                                                                             |
| esm_class            | M     | 1              | 0x04                                   | indicates that data_sm contains a delivery receipt                                                                                                                                                             |
| registered_delivery  | M     | 1              | 0x00                                   | no acknowledgements                                                                                                                                                                                            |
| data_coding          | M     | 1              | 0x00 (default) 0x01 (ASCII)            | Should be set to 0x01 when providing an ASCII text string (in the message payload) that further describes the delivery receipt. Otherwise set to 0x00 if a text string is not included in the message payload. |
| receipted_message_id | M     | 1 - 64         | Any                                    | The Wireless Data Gateway's handle to the original WDP message. See 5.4.6.2                                                                                                                                    |
| message_state        | M     | 1              | Any                                    | Indicates state of the WDP message being receipted.                                                                                                                                                            |
| network_error_code   | O     | 3              | network specific error code            | MAY be included by the Wireless Data Gateway to provide further information for a WDP, which failed due to a wireless network error.                                                                           |
| message_payload      | O     | 1 - 255        | text string                            | Descriptive textual string for delivery receipt. MAY be included for informational purposes.                                                                                                                   |

## 5.4.8.2. DATA\_SM Response PDU

The following table provides the recommended values to be used by a WAP Proxy Server when returning a data\_sm response for a Delivery Receipt.

| Parameter   | M/O   | Size (bytes)   | Recommended Value   | Comment                                    |
|-------------|-------|----------------|---------------------|--------------------------------------------|
| message_id  | M     | 1 - 64         | 0x00 (NULL)         | No handle required for a Delivery Receipt. |

## 5.4.9. ALERT\_NOTIFICATION

A Wireless Data Gat eway uses the alert\_notification operation to send an alert to the WAP Proxy Server indicating that the wireless device has become available.

## 5.4.9.1. ALERT\_NOTIFICATION PDU

The following table provides the recommended values to be used by a Wireless Data Gateway when sending an alert.

| Parameter              | M/O   | Size (bytes)   | Recommended Value   | Comment                                                              |
|------------------------|-------|----------------|---------------------|----------------------------------------------------------------------|
| source_addr_ton        | M     | 1              | 0x01 (Int.)         |                                                                      |
| source_addr_npi        | M     | 1              | 0x01 (E.164)        | all MS's have E.164 directory numbers                                |
| source_addr            | M     | 0 - 64         | address digits      | directory number digits of wireless device that has become available |
| esme_addr_ton          | M     | 1              | any                 | TON for the source address in the original datagram ( data_sm )      |
| esme_addr_npi          | M     | 1              | any                 | TON for the source address in the original datagram ( data_sm ).     |
| esme_addr              | M     | 1 - 64         | address digits      | Address digits of WAP Proxy Server                                   |
| ms_availability_status | O     | 1              | 0x00 (available)    | The availability status of the wireless device                       |

## Appendix A. Static Conformance Requirements (Normative)

The notation used in this appendix is specified in [CREQ].

## A.1 WAP proxy/server support

| Item               | Function                                                                                                                 | Reference                      | Status   | Requirement                              |
|--------------------|--------------------------------------------------------------------------------------------------------------------------|--------------------------------|----------|------------------------------------------|
| WDPWCMPAdapt-S-001 | Datagram transmission (binary encoded using data_sm , data_sm_resp and generic_nack PDUs)                                | 5.2.1, 5.2.2, 5.4.6            | M        |                                          |
| WDPWCMPAdapt-S-002 | Datagram reception (binary encoded using data_sm , data_sm_resp and generic_nack PDUs)                                   | 5.2.1, 5.2.2, 5.4.7            | M        |                                          |
| WDPWCMPAdapt-S-003 | WCMPtransmission using payload_type parameter                                                                            | 5.1.6, 5.4.6.1                 | O        |                                          |
| WDPWCMPAdapt-S-004 | WCMPreception using payload_type parameter                                                                               | 5.1.6, 5.4.7.1                 | O        |                                          |
| WDPWCMPAdapt-S-005 | Bind Transceiver using bind_transceiver and bind_transceiver_resp PDUs                                                   | 5.2.3.1, 5.4.1                 | O        |                                          |
| WDPWCMPAdapt-S-006 | Bind Transmitter &Bind Receiver using bind_transmitter , bind_transmitter_resp , bind_receiver , bind_receiver_resp PDUs | 5.2.3.2, 5.2.3.3, 5.4.2, 5.4.3 | O        |                                          |
| WDPWCMPAdapt-S-007 | Unbind using unbind and unbind_resp PDUs                                                                                 | 5.2.4                          | M        |                                          |
| WDPWCMPAdapt-S-008 | Enquire Link using enquire_link and enquire_link_resp PDUs                                                               | 5.3.1                          | O        |                                          |
| WDPWCMPAdapt-S-009 | Text-based encoding of WDP and WCMP messages using data_coding parameter                                                 | 5.1.4, 5.4.6.1, 5.4.7.1        | O        |                                          |
| WDPWCMPAdapt-S-010 | Use of more_msgs_to_send parameter                                                                                       | 5.1.2, 5.4.6.1                 | O        |                                          |
| WDPWCMPAdapt-S-011 | Request Store and Forward mode using esm_class parameter                                                                 | 5.2.1, 5.4.6.1                 | O        |                                          |
| WDPWCMPAdapt-S-012 | Request Datagram mode using esm_class parameter                                                                          | 5.2.1, 5.4.6.1                 | M        |                                          |
| WDPWCMPAdapt-S-013 | Segmentation and re-assembly using SAR parameters                                                                        | 5.1.5, 5.4.6.1, 5.4.7.1        | O        |                                          |
| WDPWCMPAdapt-S-014 | Request SMSC Delivery Report using registered_delivery parameter                                                         | 5.4.6.1                        | O        | WDPWCMPAdapt-S-015                       |
| WDPWCMPAdapt-S-015 | Receive SMSC Deliver Report using esm_class, receipted_message_id and message_state parameters                           | 5.4.8                          | O        |                                          |
| WDPWCMPAdapt-S-016 | Specification of network type for peer wireless device using dest_network_type , source_network_type parameters          | 5.4.6.1, 5.4.7.1               | O        |                                          |
| WDPWCMPAdapt-S-017 | Specification of bearer type for peer wireless device using dest_bearer_type , source_bearer_type parameters             | 5.4.6.1, 5.4.7.1               | O        |                                          |
| WDPWCMPAdapt-S-018 | Specification of validity period of individual messages using qos_time_to_live                                           | 5.4.6.1                        | O        |                                          |
| WDPWCMPAdapt-S-019 | DPF request and processing of Alert Notifications using alert_notification PUD and set_dpf parameter in data_sm PDU      | 5.1.7, 5.3.2, 5.4.6.1, 5.4.9   | O        |                                          |
| WDPWCMPAdapt-S-020 | BIND support                                                                                                             | 5.2.3                          | M        | WDPWCMPAdapt-S-005 OR WDPWCMPAdapt-S-006 |

## Appendix B. Change History

## (Informative)

| Type of Change                      | Date        | Section                            | Description                                                                                                                                                           |
|-------------------------------------|-------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Class 0                             | 23-Jul-1999 |                                    | The initial version of this document.                                                                                                                                 |
| Class 2                             | 27-Jul-1999 | App A                              | Added SCR tables. John Murtagh (johnm@aldiscon.ie)                                                                                                                    |
| Class2&3                            | 29-Jul-1999 |                                    | Updates following review in WAPMessage Centre Protocol DCteleconference 28-Jul-1999. John Murtagh (johnm@aldiscon.ie)                                                 |
| Class2&3                            | 03-Aug-1999 |                                    | Updates following review in WAPMessage Centre Protocol DCteleconference 28-Jul-1999. John Doyle (johnd@aldiscon.ie.)                                                  |
| WAP-159-WDPWCMPAdapt-19991105-d     | 05-Nov-1999 | 7.4.2.1, 7.4.2.2, 7.4.3.1, 7.4.3.2 | ChangerequestWDPWCMP WDGAdapt 9-Sept-1999: Inclusion of the 'interface_version' parameter in BIND_TRANSMITTER and BIND_RECEIVER.                                      |
| WAP-159-WDPWCMPAdapt-19991105-a     | 05-Nov-1999 | 3.4, 7.4.1.1                       | Change request WDPWCMPAdapt22-Oct-1999: Inclusionn of 'interface_version' parameter in BIND_TRANSCEIVER to reflect a similar correction made in SMPP 3.4 (Issue 1.2). |
| WAP-159_001-WDPWCMPAdapt-20010712-a | 07-Jul-2001 |                                    | Correct SCR tables.                                                                                                                                                   |
| WAP-159_002-WDPWCMPAdapt-20010124-a | 24-Jan-2001 |                                    | Fix values of esm_class. Encourage omission of redundant port information when message type is WCMP.                                                                  |
| WAP-159_003-WDPWCMPAdapt-20010713-a | 13-Jul-2001 | 2                                  | Label appropriate references as informative. Add trademark.                                                                                                           |
| WAP-159-WDPWCMPAdapt-20010713-a     | 13-Jul-2001 | All                                | Editorial roll-up of SINs. Conversion to currenttemplate, which changed section numbering: 3-> 2 &7->5.                                                               |
