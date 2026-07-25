# WML-2 AI Context Pack

> Generated from the WAP 1.2.1 knowledge graph pilot. Canonical manifests remain authoritative.

## Retrieval contract

- Target: `WML-2`
- Release/profile: WAP 1.2.1, WML 1.3, `CCR-CLASSC-C-001`
- Compatibility floor: `strict-historical-observable-behavior`
- Selection rule: include the target sprint, its direct dependency/downstream neighbors, all target work items, and only normative clauses explicitly mapped to those work items.
- Safety rule: absence from this pack does not mean a requirement is optional, implemented, or out of scope.
- Enhancement rule: additive behavior may extend strict behavior but may not replace a selected historical obligation.

## Graph summary

- Nodes: 214
- Edges: 540
- Selected work items: 5
- Direct normative clauses: 76
- Work items without direct clause mappings: 2
- Work items with unmapped declared normative families: 3

## Execution target

### WML-2: WML parser, deck model, and validation baseline

- Status: `todo`
- Goal: Make effective WML 1.3 structure and validation deterministic before closing higher-order runtime behavior.
- Depends on: `CONF-1`
- Direct downstream sprints: `REN-4`, `WML-3`

Exit gates:

- All strict WML structures parse or fail deterministically.
- Text and WBXML input parity is fixture-backed.
- The 76-item SCR matrix has no unmapped mandatory parser obligation.

## Work items

### WML-201: Effective 76-item WML SCR matrix

- Status: `todo`
- Owner layers: `engine-wasm`, `qa`
- Source families: `wml`
- Existing tickets: `R0-01`
- Direct normative clauses: 3

Outputs:

- Effective 76-item WML SCR matrix

Acceptance:

- The exact WML-C-01..59, WML-S-60..69, and WML-C-70..76 sequence retains source identity, actor, M/O status, profile applicability, and evidence mapping.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`
- `node scripts/check-wap-conformance-ledger.mjs`

### WML-202: Complete deck/head/template/card/access/meta parser model

- Status: `todo`
- Owner layers: `engine-wasm`, `qa`
- Source families: `wml`
- Existing tickets: `R0-04`, `C5-03`
- Direct normative clauses: 0

Outputs:

- Complete deck/head/template/card/access/meta parser model

Acceptance:

- Grammar, uniqueness, ordering, template inheritance, and metadata retention match effective WML 1.3 with deterministic errors.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`

### WML-203: WML 1.3 DTD validation policy

- Status: `todo`
- Owner layers: `engine-wasm`, `transport-rust`, `qa`
- Source families: `wml`, `wbxml`, `associated-assets`
- Existing tickets: `R0-08`, `T0-07`
- Direct normative clauses: 50

Outputs:

- WML 1.3 DTD validation policy
- Text/WBXML structural parity fixtures
- Direct conformance evidence for the three WBXML:MCF client rows

Acceptance:

- Text WML and WBXML-derived WML reach equivalent deck models; strict DTD identity and unknown-DTD behavior are explicit.
- WBXML-C-001, WBXML-C-010, and WBXML-C-011 are fixture-backed against a pinned decoder; fake fixed-output and either-result fixtures do not satisfy this gate.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`
- `cargo test --manifest-path transport-rust/Cargo.toml`
- `node scripts/check-wap-wbxml-conformance-ledger.mjs`

### WML-204: Complete field/control syntax and attribute validation

- Status: `todo`
- Owner layers: `engine-wasm`, `qa`
- Source families: `wml`
- Existing tickets: `R0-04`, `B5-01`, `C5-05`
- Direct normative clauses: 23

Outputs:

- Complete field/control syntax and attribute validation
- Source-derived select initialization, selection, serialization, and onpick runtime evidence

Acceptance:

- Input/select/option/optgroup/fieldset constraints, masks, defaults, and validation failures are deterministic.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`
- `pnpm test:story WML-204`

### WML-205: WML parse/error taxonomy

- Status: `todo`
- Owner layers: `engine-wasm`, `qa`
- Source families: `wml`
- Existing tickets: `R0-07`
- Direct normative clauses: 0

Outputs:

- WML parse/error taxonomy

Acceptance:

- Malformed XML, invalid WML, unsupported optional constructs, and recoverable content errors have spec-shaped deterministic outcomes.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`

## Direct normative obligations

### WML-201

- **WAE-CL-WML-LANGUAGE-DELEGATE** — Process Wireless Markup Language using the effective selected WML 1.3 family ledger and its Class C user-agent requirements.
  - Family: `wae`; force: `implicit-must`; level: `required`
  - Source: `WAP-190-WAESpec` §5.1.5 (5.1.5 Wireless Markup Language)
  - Parents: `WAESpec-C-015`, `WAESpec-C-017`
  - Requirements: `RQ-RMK-001`, `RQ-WAE-002`, `RQ-WAE-016`, `RQ-WAE-017`
  - Fixture: `WAE-FX-WML-LANGUAGE-DELEGATE` (`runtime`, `planned`)
- **WAE-CL-WML-USER-AGENT-COMPOSITION** — Compose the WML and WMLScript requirements and guidelines into one WML user agent without moving network fetch behavior into the language runtime.
  - Family: `wae`; force: `implicit-must`; level: `required`
  - Source: `WAP-190-WAESpec` §5.1.7.2 (5.1.7.2 WML User Agent)
  - Parents: `WAESpec-C-017`
  - Requirements: `RQ-WAE-002`, `RQ-WAE-016`, `RQ-WAE-017`
  - Fixture: `WAE-FX-WML-USER-AGENT-COMPOSITION` (`runtime`, `planned`)
- **WAE-CL-WMLSCRIPT-LANGUAGE-DELEGATE** — Process WMLScript using the effective selected WMLScript family ledger and its Class C interpreter requirements.
  - Family: `wae`; force: `implicit-must`; level: `required`
  - Source: `WAP-190-WAESpec` §5.1.6 (5.1.6 WMLScript)
  - Parents: `WAESpec-C-016`, `WAESpec-C-017`
  - Requirements: `RQ-WAE-002`, `RQ-WAE-003`, `RQ-WAE-016`, `RQ-WAE-017`, `RQ-WMLS-001`
  - Fixture: `WAE-FX-WMLSCRIPT-LANGUAGE-DELEGATE` (`runtime`, `planned`)

### WML-203

- **WBXML-CL-ATTRIBUTE-LITERAL-VALUE-PROHIBITION** — Do not interpret LITERAL as encoding any portion of an attribute value.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.3 (5.8.3. Attribute Code Space (ATTRSTART and ATTRVALUE))
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-ATTRIBUTE-LITERAL-VALUE-PROHIBITION` (`binary-decoder`, `implemented`)
- **WBXML-CL-ATTRIBUTE-SEQUENCE** — Start every encoded attribute with one attribute-start token and terminate its value at the next start, literal, or END token.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.3 (5.8.3. Attribute Code Space (ATTRSTART and ATTRVALUE))
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-ATTRIBUTE-SEQUENCE` (`binary-decoder`, `implemented`)
- **WBXML-CL-ATTRIBUTE-START-RANGE** — Interpret non-global attribute tokens below 128 as attribute starts that may include a value prefix.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.3 (5.8.3. Attribute Code Space (ATTRSTART and ATTRVALUE))
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-ATTRIBUTE-START-RANGE` (`binary-decoder`, `implemented`)
- **WBXML-CL-ATTRIBUTE-VALUE-RANGE** — Interpret non-global attribute tokens at or above 128 only as known attribute-value fragments.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.3 (5.8.3. Attribute Code Space (ATTRSTART and ATTRVALUE))
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-ATTRIBUTE-VALUE-RANGE` (`binary-decoder`, `implemented`)
- **WBXML-CL-BINARY-LITERAL-EQUIVALENCE** — Decode both assigned binary tokens and literal encodings for every tag name, attribute name, and attribute value.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §6.4 (6.4. Associating XML Documents with WBXML Token Values)
  - Parents: `WBXML-C-011`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-BINARY-LITERAL-EQUIVALENCE` (`binary-decoder`, `planned`)
- **WBXML-CL-CHARSET-EXTERNAL-PRECEDENCE** — When external and internal charset metadata coexist, apply the precedence and conflict policy of the carrying protocol.
  - Family: `wbxml`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-192-WBXML` §5.2 (5.2. Character Encoding)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-CHARSET-EXTERNAL-PRECEDENCE` (`transport-boundary`, `planned`)
- **WBXML-CL-CHARSET-INTERNAL-DEFAULT** — Without external charset metadata, present strings using the encoding named by the WBXML charset field.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.2 (5.2. Character Encoding)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-CHARSET-INTERNAL-DEFAULT` (`binary-decoder`, `implemented`)
- **WBXML-CL-CHARSET-MIBENUM** — Interpret the charset field as an IANA MIBenum value, with zero meaning unknown.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.6 (5.6. Charset)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-CHARSET-MIBENUM` (`binary-decoder`, `implemented`)
- **WBXML-CL-CHARSET-STRING-TERMINATION** — Detect string termination according to the selected character encoding rather than assuming a one-byte terminator.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.2 (5.2. Character Encoding)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-CHARSET-STRING-TERMINATION` (`binary-decoder`, `implemented`)
- **WBXML-CL-CHARSET-UNREPRESENTABLE-NAME** — Treat a tag or attribute name that cannot be represented in the target character set as a tokenization error.
  - Family: `wbxml`; force: `error-condition`; level: `required`
  - Source: `WAP-192-WBXML` §5.2 (5.2. Character Encoding)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-CHARSET-UNREPRESENTABLE-NAME` (`binary-decoder`, `planned`)
- **WBXML-CL-DEFAULT-ATTRIBUTES-OMITTED** — Accept tokenized elements that omit attributes equal to declared default, fixed, or applicable implied values.
  - Family: `wbxml`; force: `explicit-may`; level: `permitted`
  - Source: `WAP-192-WBXML` §6.3 (6.3. Encoding Default Attribute Values)
  - Parents: `WBXML-C-010`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-DEFAULT-ATTRIBUTES-OMITTED` (`binary-decoder`, `implemented`)
- **WBXML-CL-DEFAULT-ATTRIBUTES-RECONSTRUCTED** — Reconstruct omitted attribute values from the version-appropriate document-type defaults before presenting the decoded XML model.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §6.3 (6.3. Encoding Default Attribute Values)
  - Parents: `WBXML-C-010`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-DEFAULT-ATTRIBUTES-RECONSTRUCTED` (`binary-decoder`, `implemented`)
- **WBXML-CL-DOCUMENT-BODY-GRAMMAR** — Enforce the WBXML element, attribute, content, string, entity, processing-instruction, extension, and opaque-data grammar.
  - Family: `wbxml`; force: `grammar`; level: `required`
  - Source: `WAP-192-WBXML` §5.3 (5.3. BNF for Document Structure)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-DOCUMENT-BODY-GRAMMAR` (`binary-decoder`, `implemented`)
- **WBXML-CL-DOCUMENT-HEADER-ORDER** — Decode each document in version, public identifier, charset, string-table, then body order.
  - Family: `wbxml`; force: `grammar`; level: `required`
  - Source: `WAP-192-WBXML` §5.3 (5.3. BNF for Document Structure)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-DOCUMENT-HEADER-ORDER` (`binary-decoder`, `implemented`)
- **WBXML-CL-EMPTY-ATTRIBUTE-STRING** — Recognize an explicitly encoded empty string in attribute-value contexts where the application defines no other encoding.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.1 (5.8.4.1. Strings)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-EMPTY-ATTRIBUTE-STRING` (`binary-decoder`, `implemented`)
- **WBXML-CL-END-TOKEN** — Use END to terminate the current attribute list or element as determined by parser state.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.7.1 (5.8.4.7.1. END Token)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-END-TOKEN` (`binary-decoder`, `implemented`)
- **WBXML-CL-ENTITY-UCS4** — Decode ENTITY followed by a multi-byte UCS-4 character value with XML numeric-entity semantics.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.3 (5.8.4.3. Character Entity)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-ENTITY-UCS4` (`binary-decoder`, `implemented`)
- **WBXML-CL-EXTENSION-SWITCH-CONTEXT** — Apply a switch preceding an extension to the tag page in content and the attribute page in an attribute list.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.2 (5.8.4.2. Global Extension Tokens)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-EXTENSION-SWITCH-CONTEXT` (`binary-decoder`, `implemented`)
- **WBXML-CL-EXTENSION-TOKEN-FORMS** — Decode single-byte, inline-string, and inline-integer extension token forms.
  - Family: `wbxml`; force: `grammar`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.2 (5.8.4.2. Global Extension Tokens)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-EXTENSION-TOKEN-FORMS` (`binary-decoder`, `implemented`)
- **WBXML-CL-EXTERNAL-TOKEN-TYPING** — Use an external typing system to associate an XML document family with its WBXML token values.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §6.4 (6.4. Associating XML Documents with WBXML Token Values)
  - Parents: `WBXML-C-011`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-EXTERNAL-TOKEN-TYPING` (`transport-boundary`, `planned`)
- **WBXML-CL-GLOBAL-TOKEN-INVARIANCE** — Give each global token the same structure and meaning in every code space and page.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4 (5.8.4. Global Tokens)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-GLOBAL-TOKEN-INVARIANCE` (`binary-decoder`, `implemented`)
- **WBXML-CL-INLINE-STRING** — Decode STR_I as encoding-dependent terminated inline character data.
  - Family: `wbxml`; force: `grammar`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.1 (5.8.4.1. Strings)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-INLINE-STRING` (`binary-decoder`, `implemented`)
- **WBXML-CL-LITERAL-NAME-STATE** — Interpret a LITERAL name as a tag or attribute according to parser state and resolve its name through the string table.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.5 (5.8.4.5. Literal Tag or Attribute Name)
  - Parents: `WBXML-C-001`, `WBXML-C-011`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-LITERAL-NAME-STATE` (`binary-decoder`, `implemented`)
- **WBXML-CL-LITERAL-TAG-FLAGS** — Honor the attribute and content flags encoded by LITERAL_A, LITERAL_C, and LITERAL_AC.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.5 (5.8.4.5. Literal Tag or Attribute Name)
  - Parents: `WBXML-C-001`, `WBXML-C-011`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-LITERAL-TAG-FLAGS` (`binary-decoder`, `implemented`)
- **WBXML-CL-MIME-TOKEN-TYPING** — For WSP, HTTP, or SMTP transport, use the MIME media type as the token-value association key.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §6.4 (6.4. Associating XML Documents with WBXML Token Values)
  - Parents: `WBXML-C-011`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-MIME-TOKEN-TYPING` (`transport-boundary`, `planned`)
- **WBXML-CL-MULTIBYTE-CONTINUATION** — Decode a multi-byte integer from seven-bit groups whose high bit marks every non-final octet.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.1 (5.1. Multi-byte Integers)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-MULTIBYTE-CONTINUATION` (`binary-decoder`, `implemented`)
- **WBXML-CL-MULTIBYTE-GROUP-ORDER** — Combine multi-byte integer groups in most-significant-group-first order.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.1 (5.1. Multi-byte Integers)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-MULTIBYTE-GROUP-ORDER` (`binary-decoder`, `implemented`)
- **WBXML-CL-MULTIBYTE-UNUSED-ZERO** — Require unused value bits in the initial multi-byte integer octet to be zero.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.1 (5.1. Multi-byte Integers)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-MULTIBYTE-UNUSED-ZERO` (`binary-decoder`, `implemented`)
- **WBXML-CL-NETWORK-BYTE-ORDER** — Decode multi-byte fields and bit fields using the specified most-significant-first network ordering.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5 (5. Binary XML Content Structure)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-NETWORK-BYTE-ORDER` (`binary-decoder`, `implemented`)
- **WBXML-CL-OPAQUE-LENGTH** — Decode OPAQUE as a multi-byte length followed by exactly that many application-specific bytes.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.6 (5.8.4.6. Opaque Data)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-OPAQUE-LENGTH` (`binary-decoder`, `implemented`)
- **WBXML-CL-PARSER-STATE-PAGES** — Maintain separate current code pages for tag and attribute parser states, each initialized to page zero.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.1 (5.8.1. Parser State Machine)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-PARSER-STATE-PAGES` (`binary-decoder`, `implemented`)
- **WBXML-CL-PARSER-SWITCH-PERSISTENCE** — Keep a selected code page active for its parser state until another switch in that state or document end.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.1 (5.8.1. Parser State Machine)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-PARSER-SWITCH-PERSISTENCE` (`binary-decoder`, `implemented`)
- **WBXML-CL-PROCESSING-INSTRUCTION** — Decode PI target and optional value using attribute-start/value syntax terminated by END.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.4 (5.8.4.4. Processing Instruction)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-PROCESSING-INSTRUCTION` (`binary-decoder`, `implemented`)
- **WBXML-CL-PUBLIC-ID-NUMERIC** — Accept a positive multi-byte numeric public identifier for a known document type.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.5 (5.5. Document Public Identifier)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-PUBLIC-ID-NUMERIC` (`binary-decoder`, `implemented`)
- **WBXML-CL-PUBLIC-ID-STRING-TABLE** — When public identifier is zero, resolve its following index through the string table.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.5 (5.5. Document Public Identifier)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-PUBLIC-ID-STRING-TABLE` (`binary-decoder`, `implemented`)
- **WBXML-CL-STRING-TABLE-LENGTH** — Treat string-table length as its byte count excluding the encoded length field.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.7 (5.7. String Table)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-STRING-TABLE-LENGTH` (`binary-decoder`, `implemented`)
- **WBXML-CL-STRING-TABLE-OFFSETS** — Resolve string-table references as byte offsets from the first table byte.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.7 (5.7. String Table)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-STRING-TABLE-OFFSETS` (`binary-decoder`, `implemented`)
- **WBXML-CL-STRING-TABLE-REQUIRED** — Read a string-table length immediately after charset even when the table is empty.
  - Family: `wbxml`; force: `explicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.7 (5.7. String Table)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-STRING-TABLE-REQUIRED` (`binary-decoder`, `implemented`)
- **WBXML-CL-SWITCH-PAGE-TOKEN** — Decode SWITCH_PAGE and its following page byte for the current parser state.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.7.2 (5.8.4.7.2. Code Page Switch Token)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-SWITCH-PAGE-TOKEN` (`binary-decoder`, `implemented`)
- **WBXML-CL-TABLE-STRING** — Decode STR_T as a multi-byte byte offset into the string table.
  - Family: `wbxml`; force: `grammar`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.4.1 (5.8.4.1. Strings)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-TABLE-STRING` (`binary-decoder`, `implemented`)
- **WBXML-CL-TAG-ATTRIBUTE-BIT** — Use tag bit seven to determine whether an END-terminated attribute list follows.
  - Family: `wbxml`; force: `table`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.2 (5.8.2. Tag Code Space)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-TAG-ATTRIBUTE-BIT` (`binary-decoder`, `implemented`)
- **WBXML-CL-TAG-ATTRIBUTES-BEFORE-CONTENT** — When a tag has attributes and content, decode the complete attribute list before content.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.2 (5.8.2. Tag Code Space)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-TAG-ATTRIBUTES-BEFORE-CONTENT` (`binary-decoder`, `implemented`)
- **WBXML-CL-TAG-CONTENT-BIT** — Use tag bit six to determine whether content and its terminating END follow.
  - Family: `wbxml`; force: `table`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.2 (5.8.2. Tag Code Space)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-TAG-CONTENT-BIT` (`binary-decoder`, `implemented`)
- **WBXML-CL-TAG-IDENTITY-BITS** — Use tag bits zero through five as the application tag identity.
  - Family: `wbxml`; force: `table`; level: `required`
  - Source: `WAP-192-WBXML` §5.8.2 (5.8.2. Tag Code Space)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-TAG-IDENTITY-BITS` (`binary-decoder`, `implemented`)
- **WBXML-CL-TOKEN-CODE-PAGES** — Support 256 code pages per code space and reserve page 255 for implementation-specific use.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8 (5.8. Token Structure)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-TOKEN-CODE-PAGES` (`binary-decoder`, `planned`)
- **WBXML-CL-TOKEN-GLOBAL-APPLICATION-SPACES** — Distinguish fixed global tokens from context-dependent application tokens.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8 (5.8. Token Structure)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-TOKEN-GLOBAL-APPLICATION-SPACES` (`binary-decoder`, `implemented`)
- **WBXML-CL-TOKEN-TAG-ATTRIBUTE-SPACES** — Interpret application token values in separate tag and attribute code spaces.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.8 (5.8. Token Structure)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-TOKEN-TAG-ATTRIBUTE-SPACES` (`binary-decoder`, `implemented`)
- **WBXML-CL-VERSION-BYTE** — Decode the initial version byte as major-minus-one in the high nibble and minor version in the low nibble.
  - Family: `wbxml`; force: `implicit-must`; level: `required`
  - Source: `WAP-192-WBXML` §5.4 (5.4. Version Number)
  - Parents: `WBXML-C-001`
  - Requirements: `RQ-RMK-007`, `RQ-RMK-010`
  - Fixture: `WBXML-FX-VERSION-BYTE` (`binary-decoder`, `implemented`)
- **WML-CL-UNKNOWN-CONTENT-PRESERVED** — Continue rendering recognized content nested inside an unrecognized element.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-191_104-WML` §12.4 (12.4 Unknown DTD)
  - Parents: `WML-C-17`
  - Requirements: `RQ-RMK-009`
  - Fixture: `WML-FX-UNKNOWN-CONTENT-PRESERVED` (`rendering`, `implemented`)
- **WML-CL-UNKNOWN-MARKUP-IGNORED** — For an alternate DTD, ignore unrecognized element tags and attributes during presentation.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-191_104-WML` §12.4 (12.4 Unknown DTD)
  - Parents: `WML-C-17`
  - Requirements: `RQ-RMK-009`
  - Fixture: `WML-FX-UNKNOWN-MARKUP-IGNORED` (`parser`, `implemented`)

### WML-204

- **WML-CL-INPUT-EMPTY-COMMIT** — Accept an empty committed input only when the effective mask and emptyok rules allow it.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-EMPTY-COMMIT` (`runtime`, `implemented`)
- **WML-CL-INPUT-FORMAT-LITERALS** — Preserve escaped literal characters that form part of an accepted formatted input value.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-FORMAT-LITERALS` (`runtime`, `implemented`)
- **WML-CL-INPUT-INITIALIZATION** — Initialize each input from a valid existing name variable or a valid default value, then preload the control.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-INITIALIZATION` (`runtime`, `implemented`)
- **WML-CL-INPUT-INVALID-INITIAL-VALUE** — Unset an existing name value that violates the mask before attempting the declared default.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-INVALID-INITIAL-VALUE` (`runtime`, `implemented`)
- **WML-CL-INPUT-MASK-COMMIT** — At commit, accept only values conforming to the effective input mask.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-MASK-COMMIT` (`runtime`, `implemented`)
- **WML-CL-INPUT-MAXLENGTH** — Limit committed text to maxlength when that attribute is present.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-MAXLENGTH` (`runtime`, `implemented`)
- **WML-CL-INPUT-PASSWORD-DISPLAY** — Conceal the entered value when input type is password while preserving the actual variable value.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-PASSWORD-DISPLAY` (`rendering`, `implemented`)
- **WML-CL-INPUT-REJECTION-ATOMICITY** — On invalid input, notify the user, preserve the original variable value, and allow another entry attempt.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-REJECTION-ATOMICITY` (`runtime`, `implemented`)
- **WML-CL-INPUT-STRUCTURE** — Require an input variable name and constrain input attributes to the declared text-entry grammar.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.3 (11.6.3 The Input Element)
  - Parents: `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-INPUT-STRUCTURE` (`parser`, `implemented`)
- **WML-CL-OPTION-ONPICK-MULTI** — For multiple selection, dispatch onpick whenever the option is selected or deselected.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.2 (11.6.2.2 The Option Element)
  - Parents: `WML-C-41`, `WML-C-09`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-OPTION-ONPICK-MULTI` (`runtime`, `implemented`)
- **WML-CL-OPTION-ONPICK-SINGLE** — For single selection, dispatch onpick for the newly selected option but not for implicit deselection.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.2 (11.6.2.2 The Option Element)
  - Parents: `WML-C-41`, `WML-C-09`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-004`
  - Fixture: `WML-FX-OPTION-ONPICK-SINGLE` (`runtime`, `implemented`)
- **WML-CL-OPTION-VALUE-EVALUATION** — Evaluate option value variable references before assigning the containing select name variable.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.2 (11.6.2.2 The Option Element)
  - Parents: `WML-C-41`, `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-OPTION-VALUE-EVALUATION` (`runtime`, `implemented`)
- **WML-CL-SELECT-DEFAULT-PRECEDENCE** — Choose initial selections in iname, ivalue, name, value, then single/multiple fallback order.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-DEFAULT-PRECEDENCE` (`runtime`, `implemented`)
- **WML-CL-SELECT-INDEX-VALIDATION** — Validate selection indices by removing non-integers, out-of-range entries, and duplicates.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-INDEX-VALIDATION` (`runtime`, `implemented`)
- **WML-CL-SELECT-INIT-ORDER** — Initialize input and select controls in document order when entering the card.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`, `WML-C-33`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-INIT-ORDER` (`runtime`, `implemented`)
- **WML-CL-SELECT-MULTI-SERIALIZATION** — Serialize multiple results as semicolon-delimited lists with unique indices, duplicate non-empty values preserved, and no empty value entries.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-MULTI-SERIALIZATION` (`runtime`, `implemented`)
- **WML-CL-SELECT-NO-IMPLICIT-REFRESH** — Do not create display side effects from select-variable updates without an explicit refresh task.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-NO-IMPLICIT-REFRESH` (`rendering`, `implemented`)
- **WML-CL-SELECT-PRESELECTION** — Deselect all options and then select every positive validated default index.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-PRESELECTION` (`runtime`, `implemented`)
- **WML-CL-SELECT-SINGLE-MULTI-MODE** — Allow one selected option by default and multiple selections only when multiple is true.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-SINGLE-MULTI-MODE` (`runtime`, `implemented`)
- **WML-CL-SELECT-STRUCTURE** — Require one or more option or optgroup children in each select element.
  - Family: `wml`; force: `grammar`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-STRUCTURE` (`parser`, `implemented`)
- **WML-CL-SELECT-USER-UPDATE** — Update name and iname after user selection changes and again before every task invocation.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-USER-UPDATE` (`runtime`, `implemented`)
- **WML-CL-SELECT-VARIABLE-INITIALIZATION** — Initialize name from selected option values and iname from the validated selected indices.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §11.6.2.1 (11.6.2.1 The Select Element)
  - Parents: `WML-C-43`
  - Requirements: `RQ-RMK-001`
  - Fixture: `WML-FX-SELECT-VARIABLE-INITIALIZATION` (`runtime`, `implemented`)
- **WML-CL-VARIABLE-COMMIT-BEFORE-TASK** — Commit input and selection variables before invoking any task.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §10.3.4 (10.3.4 Setting Variables)
  - Parents: `WML-C-12`, `WML-C-33`, `WML-C-43`
  - Requirements: `RQ-RMK-001`, `RQ-RMK-003`, `RQ-RMK-005`
  - Fixture: `WML-FX-VARIABLE-COMMIT-BEFORE-TASK` (`runtime`, `implemented`)

## Explicit mapping gaps

- `WML-202` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.
- `WML-205` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.

Declared-family gaps:

- `WML-201` declares `wml` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.
- `WML-202` declares `wml` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.
- `WML-205` declares `wml` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.

## Source documents

- `WAP-190_101-WAESpec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190_101-WAESpec-20001213-a.pdf
- `WAP-190_102-WAESpec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190_102-WAESpec-20001213-a.pdf
- `WAP-190_103-WAESpec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190_103-WAESpec-20001213-a.pdf
- `WAP-190_104-WAE-Spec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190_104-WAE-Spec-20010731-a.pdf
- `WAP-190-WAESpec`: Wireless Application Environment — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-190-WAESpec-20000329-a.pdf
- `WAP-191_102-WML`: Wireless Markup Language 1.3 — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-191_102-WML-20001213-a.pdf
- `WAP-191_104-WML`: Wireless Markup Language 1.3 — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-191_104-WML-20010718-a.pdf
- `WAP-191_105-WML`: Wireless Markup Language 1.3 — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-191_105-WML-20020212-a.pdf
- `WAP-191-WML`: Wireless Markup Language 1.3 — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-191-WML-20000219-a.pdf
- `WAP-192_105-WBXML`: Binary XML Content Format — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-192_105-WBXML-20011015-a.pdf
- `WAP-192-WBXML`: Binary XML Content Format — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-192-WBXML-20010725-a.pdf
- `WAP-215-ClassConform-20001213-a`: Class Conformance Requirements — https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf
- `wml13-dtd`: WML 1.3 Document Type Definition — https://www.openmobilealliance.org/tech/dtd/wml13.dtd
