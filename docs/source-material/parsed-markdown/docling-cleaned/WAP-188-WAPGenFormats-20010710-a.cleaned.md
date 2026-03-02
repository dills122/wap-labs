## WAP General Formats Document WAP-188-WAPGenFormats Version 10-Jul-2001

## Wireless Application Protocol General Formats Document

## Disclaimer:

You may use this document or any part of the document for internal or educational purposes only, provided you do not modify, edit or take out of context the information in this document in any manner. You may not use this document in any other manner without the prior written permission of the WAP Forum™. The WAP Forum authorises you to copy this document, provided that you retain all copyright and other proprietary notices contained in the original materials on any copies of the materials and that you comply strictly with these terms. This copyright permission does not constitute an endorsement of the products or services offered by you .

The WAP Forum™ assumes no responsibility for errors or omissions in this document. In no event shall the WAP Forum be liable for any special, indirect or consequential damages or any damages whatsoever arising out of or in connection with the use of this information .

WAP Forum TM members have agreed to use reasonable endeavors to disclose in a timely manner to the WAP Forum the existence of all intellectual property rights (IPR's) essential to the present document.  The members do not have an obligation to conduct IPR searches.  This information is publicly available to members and non-members of the WAP Forum and may be found on the 'WAP IPR Declarations' list at http://www.wapforum.org/what/ipr.htm .  Essential IPR is available for license on the basis set out in the schedule to the WAP Forum Application Form.

Comments regarding this document can be submitted to the WAP Forum™ in the manner published at http://www.wapforum.org/.

## 1. Scope

Wireless  Application  Protocol  (WAP)  is  a  result  of  continuous  work  to  define  an  industry  wide  specification  for developing applications that operate over wireless communication networks. The scope for the WAP Forum is to define a set of specifications to be used by service applications. The wireless market is growing very quickly and reaching new customers  and  providing  new  services.  To  enable  operators  and  manufacturers  to  meet  the  challenges  in  advanced services, differentiation, and fast/flexible service creation, WAP defines a set of protocols in transport, session and application  layers.  For  additional  information  on  the  WAP  architecture,  refer  to  ' Wireless  Application  Protocol Architecture Specification' [WAP].

This document defines a number of common formats that are used throughout the WAP specifications. Defining these formats  in  one  document  means  that  their  use  will  be  consistent  throughout  the  specification,  and  simplifies  the updating of formats.

## 2. Documents Status

This document is available online in the following formats:

PDF format at URL, http://www.wapforum.org/.

## 2.1 Copyright Notice

© Copyright Wireless Application Forum Ltd, 2000. Terms and conditions of use are available from the Wireless Application Protocol Forum Ltd. web site at http://www.wapforum.org/docs/copyright.htm.

## 2.2 Errata

## 2.3 Comments

Comments regarding this document can be submitted WAP in the manner published at http://www.wapforum.org/.

## 3. References

## 3.1 Normative references

| [EBNF]       | W3C, 'REC-xml-19980210: Extensible Mark-up Language (xml) 1.0', February 10, 1998                                                                            |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [GSM02.90]   | ETSI European Digital Cellular Telecommunication Systems (phase 2): Unstructured Supplementary Service Data (USSD) - stage 1 (GSM 02.90)                     |
| [GSM03.03]   | "Digital cellular telecommunications system (Phase 2+); Numbering, addressing and identification", (GSM 03.03 version 7.3.0 Release 1998)                    |
| [ITU-T Q.23] | 'ITU-T Recommendation Q.23: Technical Features of Push-Button Telephone Sets', Copyright ITU 1988, 1993                                                      |
| [RFC2119]    | "Key words for use in RFCs to Indicate Requirement Levels", S. Bradner, March 1997. URL: http://www.ietf.org/rfc/rfc2119.txt                                 |
| [RFC2396]    | "Uniform Resource Identifiers (URI): Generic Syntax." T. Berners-Lee, R. Fielding, L. Masinter, et al., August 1998. URL:http://www.ietf.org/rfc/rfc2396.txt |

## 3.2 Informative references

- [ITUE164] 'The International Public Telecommunication Numbering Plan', ITU-T Recommendation E.164,

May 1997

## 4. Definitions and Abbreviations

All non-trivial abbreviations and definitions used in this document are listed in the following sections. The definition section  includes  description of general concepts that may be fully defined in other documents. The purpose of this section is to advise the reader on the terminology used in the document.

## 4.1 Definitions

The following are terms and conventions used throughout this specification.

The key words 'MUST', 'MUST NOT', 'REQUIRED', 'SHALL', 'SHALL NOT', 'SHOULD',  'SHOULD NOT', 'RECOMMENDED',  'MAY', and 'OPTIONAL' in this document are to be interpreted as described by [RFC2119].

## 4.2 Abbreviations

For the purposes of this specification, the follo wing abbreviations apply.

EBNF

Extended Backus-Naur Form

DTMF

Dual Tone Multi-Frequency

WAP

Wireless Application Protocol

## 5. Introduction

This document provides definitions of various formats that are used repeatedly throughout the WAP specifications. Specifying all these formats in one place makes the specifications clearer, more consistent and simplifies updating these formats.

To date, the only formats specified within this document are telephone numbers, DTMF sequences, and address strings (all specified in section 6.1).

In the future other formats may be added.

## 6. Formats definition

This chapter contains the actual definitions of the various general formats.

## 6.1 Syntax Definitions

This section defines a general format for telephone numbers, DTMF-sequences, dial strings, and address strings. The format is given using EBNF [EBNF].  EBNF reserves the hyphen character and does not capitalize non-terminal variables by convention.  These rules are followed in the syntax definitions below. Outside of this specification, however, one may refer to variables using capital letters and with hyphens instead of underscores unambiguously, as these devices are not used to distinguish between variables in the definitions.

```
address_string ::=  ( phone_number | dtmf_sequence | pause )* | <GPRS_APN> | ss_string phone_number ::=  international_phone_number | national_phone_number international_phone_number ::= global_international_phone_number | local_international_phone_number global_international_phone_number ::= global_international_extension national_phone_number global_international_extension ::= '+' country_code country_code ::=  <one element of the country code list> local_international_phone_number ::= local_international_extension national_phone_number local_international_extension ::= DIGIT+ country_code DIGIT ::=  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' national_phone_number ::= DIGIT+ dtmf_sequence ::=  dtmf_digit+ dtmf_digit ::=  DIGIT | '*' | '#' | 'A' | 'B' | 'C' | 'D' pause ::=  one_second_pause one_second_pause ::=  ',' ss_string ::=  service_code supplementary_information service_code ::=  start sc start ::=  START_DIGIT? | START_DIGIT START_DIGIT | START_DIGIT START_DIGIT START_DIGIT START_DIGIT ::=  '*' | '#' sc ::=  DIGIT DIGIT | DIGIT DIGIT DIGIT supplementary_information ::= '#' | si_list '#' si_list ::=  si | si si | si si si si ::=  '*' | '*' si_element
```

```
si_element ::=  <directory number> | <basic service group> | <no reply condition timer> | <uus required option> | <password> dialstring ::=  pause* ( phone_number | dtmf_sequence ) ( pause | phone_number | dtmf_sequence )* tone_sequence ::=  ( pause | dtmf_sequence )*
```

## Notes:

1. The definition of GPRS\_APN can be found in [GSM03.03].
2. In the definition of 'country\_code': 'one element of the country code list' is left undefined in this document.
3. In the definition of 'si\_element': 'directory number', 'basic service group', 'no reply condition timer',  'uus required option', and 'password' are left undefined in this document.
4. DTMF digits and characters in a 'dtmf\_sequence' correspond to the digits and characters along with their associated frequency pairs as defined in [ITU-T Q.23].

## Appendix A Specification-track Document History

Document:

WAP General Formats Document

Document Identifier:

WAP-188

Base Specification Approval Date:

February 17 th , 2000

## SINs Incorporated in this baseline document:

| SIN Approval Date   | SIN Document Identifier   |
|---------------------|---------------------------|
| August, 2000        | WAP-188_100               |
| April, 2001         | WAP-188_101               |
