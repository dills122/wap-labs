## Specification Information Note WAP-194\_103-WMLSL-20020318-a

Version 18-Mar-2002

for

Wireless Application Protocol WAP-194-WMLSL-20000925-a WMLScript Standard Libraries Specification Version 25-SEP-2000

You may use this document or any part of the document for internal or educational purposes only, provided you do not modify, edit or take out of context the information in this document in any manner. You may not use this document in any other manner without the prior written permission of the WAP Forum™. The WAP Forum authorises you to copy this document, provided that you retain all copyright and other proprietary notices contained in the original materials on any copies of the materials and that you comply strictly with these terms. This copyright permission does not constitute an endorsement of the products or services offered by you .

The WAP Forum™ assumes no responsibility for errors or omissions in this document. In no event shall the WAP Forum be liable for any special, indirect or consequential damages or any damages whatsoever arising out of or in connection with the use of this information .

WAP Forum™ members have agreed to use reasonable endeavors to disclose in a timely manner to the WAP Forum the existence of all intellectual property rights (IPR's) essential to the present document. The members do not have an obligation to conduct IPR searches. This information is publicly available to members and non-members of the WAP Forum and may be found on the "WAP IPR Declarations" list at http://www.wapforum.org/what/ipr.htm. Essential IPR is available for license on the basis set out in the schedule to the WAP Forum Application Form.

Comments regarding this document can be submitted to the WAP Forum ™ in the manner published at http://www.wapforum.org/.

## 1. Scope

This document provides changes and corrections to the following document file:

- -WAP-194-WMLSL-20000925-a

It includes changes from the following change requests:

- -CR-NOKIA-WMLSL-20020131-1

## 2. Notation

In the subsections describing the changes new text is underlined. Removed text has strikethrough marks. The presented text is copied from the specification. Text that is not presented is not affected at all. The change descriptions may also include editor's notes similar to the one below. The notes are not part of the actual changes and must not be included in the changed text.

## 3. Add SCR for Immediate refresh

## 3.1 Change Classification

Class 2 - Bug Fixes

## 3.2 Change Summary

Problem Report 2418 requests an SCR for the optional functionality specified in section 11.7 of the WMLScript Standard Library specification.  Specifically, since support for immediate refresh is optional (that is a user agent may not support immediate refresh) a new SCR is added for this optional functionality.

A new table labeled Miscellaneous is added to the end of section 12.5.

## 3.3 Change Description

Section 12.5 - WMLScript Bytecode Interpreter Capabilities

…

## Miscellaneous

| Identifier   | Function                                           |   Reference | Status   | Requirement   |
|--------------|----------------------------------------------------|-------------|----------|---------------|
| WMLSSL-C-095 | WMLBrowser.refresh - support for immediate refresh |        11.7 | O        |               |
