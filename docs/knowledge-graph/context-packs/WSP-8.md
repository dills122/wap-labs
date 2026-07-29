# WSP-8 AI Context Pack

> Generated from the WAP 1.2.1 knowledge graph slice. Canonical manifests remain authoritative.

## Retrieval contract

- Target: `WSP-8`
- Release/profile: WAP 1.2.1, WML 1.3, `CCR-CLASSC-C-001`
- Compatibility floor: `strict-historical-observable-behavior`
- Selection rule: include the target sprint, its direct dependency/downstream neighbors, all target work items, and only normative clauses explicitly mapped to those work items.
- Safety rule: absence from this pack does not mean a requirement is optional, implemented, or out of scope.
- Enhancement rule: additive behavior may extend strict behavior but may not replace a selected historical obligation.

## Graph summary

- Nodes: 202
- Edges: 577
- Selected work items: 6
- Direct SCR rows: 0
- Direct normative clauses: 123
- Work items without direct clause mappings: 2
- Work items with unmapped declared normative families: 4

## Execution target

### WSP-8: WSP session, connectionless, headers, and host fetch

- Status: `in-progress`
- Goal: Complete the WAP 1.2.1 session layer and make it the real desktop ingress path.
- Depends on: `CONF-1`, `WAE-6`
- Direct downstream sprints: `INT-9`

Exit gates:

- The eight-row selected connectionless WSP path has executable evidence.
- Connection-oriented WSP and WTP remain separately capability-gated.
- Desktop GET and POST use the native stack with explicit fallback.
- Generated Rust/TypeScript transport contracts have no drift.

## Work items

### WSP-801: Effective WSP PDU, primitive, and method matrix

- Status: `done`
- Owner layers: `transport-rust`, `qa`
- Source families: `wsp`
- Existing tickets: `T0-09`, `T0-11`, `T0-20`
- Direct SCR rows: 0
- Selected SCR parents: 7 (`WSP-C-001`, `WSP-CL-C-001`, `WSP-CL-C-003`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`)
- Direct normative clauses: 35
- Requirements: `RQ-TRN-010`, `RQ-TRN-012`, `RQ-TRN-014`
- Spec references: None
- Follow-up work items: None
- Depends on: None

Outputs:

- Effective WSP PDU, primitive, and method matrix
- transport-rust/tests/fixtures/transport/wsp_connectionless_matrix/matrix_fixture.json
- spec-processing/source-manifests/wap-1.2.1-wsp-scr.json

Acceptance:

- All 109 WSP rows retain exact source disposition; the 35 WSP-801 clauses and seven selected parents keep their byte-exact evidence, and WSP-802 closes the delegated WSP-CL-C-003 and WSP-CL-C-020 header residuals without changing that matrix.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml --test wsp_connectionless_matrix`
- `cargo test --manifest-path transport-rust/Cargo.toml`
- `node scripts/check-wap-transport-conformance-ledgers.mjs`
- `node scripts/wap-context-pack.mjs WSP-801`

### WSP-802: WSP header/assigned-number/encoding-version closure

- Status: `done`
- Owner layers: `transport-rust`, `qa`
- Source families: `wsp`
- Existing tickets: `T0-10`, `T0-20`
- Direct SCR rows: 0
- Selected SCR parents: 6 (`WSP-CL-C-001`, `WSP-CL-C-003`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`, `WSP-CL-C-020`)
- Direct normative clauses: 25
- Requirements: `RQ-TRN-010`, `RQ-TRN-012`, `RQ-TRN-014`
- Spec references: None
- Follow-up work items: None
- Depends on: None

Outputs:

- WSP header/assigned-number/encoding-version closure
- transport-rust/tests/fixtures/transport/wsp_header_grammar_mapped/header_fixture.json
- docs/waves/WSP_802_HEADER_ENCODING_EVIDENCE.md

Acceptance:

- Known tokens, code pages, text fallbacks, unknown policy, encoding versions, and round trips match the WAP 1.2.1 effective set.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml --test wsp_header_grammar`
- `cargo test --manifest-path transport-rust/Cargo.toml --test wsp_connectionless_matrix`
- `cargo test --manifest-path transport-rust/Cargo.toml`
- `node scripts/check-wap-transport-conformance-ledgers.mjs`
- `node scripts/wap-context-pack.mjs WSP-802`

### WSP-803: WSP capability negotiation and session lifecycle

- Status: `todo`
- Owner layers: `transport-rust`, `qa`
- Source families: `wsp`
- Existing tickets: `T0-11`, `T0-18`
- Direct SCR rows: 0
- Selected SCR parents: 0
- Direct normative clauses: 0
- Requirements: None
- Spec references: None
- Follow-up work items: None
- Depends on: None

Outputs:

- WSP capability negotiation and session lifecycle

Acceptance:

- Connect, capability bounds, suspend/resume, disconnect, re-establishment, and overage behavior are deterministic.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml`

### WSP-804: Native WAP transport desktop GET ingress

- Status: `in-progress`
- Owner layers: `transport-rust`, `browser`, `qa`
- Source families: `wsp`, `wdp`
- Existing tickets: `T0-27`, `T0-28`, `T0-29`
- Direct SCR rows: 0
- Selected SCR parents: 6 (`WSP-CL-C-001`, `WSP-CL-C-003`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`)
- Direct normative clauses: 26
- Requirements: `RQ-TRN-010`, `RQ-TRN-012`, `RQ-TRN-014`
- Spec references: None
- Follow-up work items: None
- Depends on: None

Outputs:

- Native WAP transport desktop GET ingress

Acceptance:

- Browser mode selection, native fetch, fallback policy, error mapping, and Kannel smoke behavior preserve the generated transport contract.

Evidence commands:

- `cargo test --manifest-path transport-rust/Cargo.toml`
- `cargo test --manifest-path browser/src-tauri/Cargo.toml`
- `./scripts/transport-wap-smoke.sh`

### WSP-805: Native WSP form POST ingress

- Status: `in-progress`
- Owner layers: `transport-rust`, `browser`, `engine-wasm`, `qa`
- Source families: `wsp`, `wdp`, `wml`, `wae`
- Existing tickets: `T0-30`, `R0-06`
- Direct SCR rows: 0
- Selected SCR parents: 9 (`WML-C-14`, `WML-C-29`, `WML-C-37`, `WSP-CL-C-001`, `WSP-CL-C-003`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`)
- Direct normative clauses: 37
- Requirements: `RQ-RMK-002`, `RQ-RMK-011`, `RQ-TRN-010`, `RQ-TRN-012`, `RQ-TRN-014`
- Spec references: `WAP-191_104-WML sections 9.3 and 9.5.1 as amended by WAP-191_105-WML section 4.3`, `WAP-203-WSP sections 6.4 and 8.2.3`
- Follow-up work items: None
- Depends on: None

Outputs:

- Native WSP form POST ingress

Acceptance:

- Effective WML form data crosses engine, host, connectionless WSP, and WDP with exact method/content/request-policy semantics; WTP is activated only for connection-oriented WSP.
- The focused WSP-805 context directly maps only selected WML request-serialization and WSP method/PDU clauses; unresolved WAE and WDP source-family mappings remain explicit gaps.

Evidence commands:

- `cargo test --manifest-path engine-wasm/engine/Cargo.toml`
- `transport-rust/tests/fixtures/transport/wml_request_serialization_mapped/request_fixture.json`
- `cargo test --manifest-path transport-rust/Cargo.toml request_serialization`
- `cargo test --manifest-path transport-rust/Cargo.toml`
- `cargo test --manifest-path browser/src-tauri/Cargo.toml fetch_deck_command_serializes_typed_post_intent_before_http_handoff`
- `cargo test --manifest-path browser/src-tauri/Cargo.toml`
- `pnpm --dir browser/frontend test`
- `node scripts/wap-context-pack.mjs WSP-805`
- `pnpm wap-graph:check`

### WSP-806: WAP 1.2.1-to-WAP 2.0 WSP delta register

- Status: `todo`
- Owner layers: `documentation`, `transport-rust`, `qa`
- Source families: `wsp`
- Existing tickets: None
- Direct SCR rows: 0
- Selected SCR parents: 0
- Direct normative clauses: 0
- Requirements: None
- Spec references: None
- Follow-up work items: None
- Depends on: None

Outputs:

- WAP 1.2.1-to-WAP 2.0 WSP delta register

Acceptance:

- WAP-230-derived behavior is classified as compatible, strict correction, or successor-only.

Evidence commands:

- `node scripts/check-wap-delta-register.mjs`

## Direct SCR evidence

- No direct SCR matrix rows are mapped for this selection.
## Direct normative obligations

### WSP-801

- **WSP-CL-COMMUNICATION-FAILURE-LOCAL** — Generate no peer indication when a request cannot be communicated and handle exceptional conditions as a local implementation matter.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.4 (6.4.4 Error Handling)
  - Parents: `WSP-CL-C-001`
  - Requirements: `RQ-TRN-010`
  - Fixture: `WSP-FX-COMMUNICATION-FAILURE-LOCAL` (`error-policy`, `implemented`)
- **WSP-CL-CONNECTIONLESS-METHOD-FACILITY** — Implement the connectionless method-invocation facility for selected GET and POST requests and replies.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.1 (6.4.1 Overview)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-CONNECTIONLESS-METHOD-FACILITY` (`transport-boundary`, `implemented`)
- **WSP-CL-CONNECTIONLESS-NONCONFIRMED** — Exchange method content through non-confirmed facilities and tolerate unreliable peer communication.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.1 (6.4.1 Overview)
  - Parents: `WSP-C-001`, `WSP-CL-C-001`
  - Requirements: `RQ-TRN-010`
  - Fixture: `WSP-FX-CONNECTIONLESS-NONCONFIRMED` (`transport-boundary`, `implemented`)
- **WSP-CL-CONNECTIONLESS-TID-REQUIRED** — Include the one-octet transaction identifier before the PDU type in every selected connectionless method or reply PDU.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-CONNECTIONLESS-TID-REQUIRED` (`binary-decoder`, `implemented`)
- **WSP-CL-DEVICE-CONNECTIONLESS-MODE** — Provide the selected connectionless WSP device mode without requiring connection-oriented WSP or WTP.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.1 (6.4.1 Overview)
  - Parents: `WSP-C-001`, `WSP-CL-C-001`
  - Requirements: `RQ-TRN-010`
  - Fixture: `WSP-FX-DEVICE-CONNECTIONLESS-MODE` (`transport-boundary`, `implemented`)
- **WSP-CL-GET-PDU-LAYOUT** — Encode Get contents as a uintvar URI length, exactly that many URI octets, then request headers through the end of the SDU.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-GET-PDU-METHOD** — Encode the selected HTTP GET method using the Get PDU format.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-PDU-METHOD` (`binary-decoder`, `implemented`)
- **WSP-CL-GET-URI-NO-NUL** — Exclude a storage string terminator from the length-delimited Get URI field.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-URI-NO-NUL` (`binary-decoder`, `implemented`)
- **WSP-CL-INTEGER-NETWORK-ORDER** — Encode multi-octet integer values in big-endian network octet order.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.1.1 (8.1.1 Primitive Data Types)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-014`
  - Fixture: `WSP-FX-INTEGER-NETWORK-ORDER` (`binary-decoder`, `implemented`)
- **WSP-CL-METHOD-BODY-CONSTRAINT** — Do not provide a request body when the invoked HTTP method does not permit an entity body.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-BODY-CONSTRAINT` (`error-policy`, `implemented`)
- **WSP-CL-METHOD-ERROR-BODY** — When a result status is an error, preserve any response body that supplies human-displayable error information.
  - Family: `wsp`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-ERROR-BODY` (`rendering`, `implemented`)
- **WSP-CL-METHOD-HTTP-SEMANTICS** — Represent the method, request headers, and request body with semantics equivalent to their HTTP/1.1 counterparts.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-HTTP-SEMANTICS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-INVOKE-PARAMETERS** — Carry server address, client address, transaction identifier, method, request URI, optional headers, and method-permitted request body.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-INVOKE-PARAMETERS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-INVOKE-TRANSPARENCY** — Preserve the addresses, transaction identifier, method, URI, headers, and body from request to peer indication.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-INVOKE-TRANSPARENCY` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-RESULT-HTTP-SEMANTICS** — Represent result status, response headers, and response body with semantics equivalent to HTTP/1.1.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-RESULT-HTTP-SEMANTICS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-RESULT-PARAMETERS** — Carry client address, server address, transaction identifier, status, optional response headers, and conditional response body in a method result.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-RESULT-PARAMETERS` (`transport-boundary`, `implemented`)
- **WSP-CL-OUT-OF-BAND-PARAMETERS** — Permit MRU and persistent-header settings to be agreed out of band, including by implication from a well-known server port.
  - Family: `wsp`; force: `explicit-may`; level: `permitted`
  - Source: `WAP-203-WSP` §7.2 (7.2 Connectionless WSP)
  - Parents: `WSP-CL-C-001`
  - Requirements: `RQ-TRN-010`
  - Fixture: `WSP-FX-OUT-OF-BAND-PARAMETERS` (`transport-boundary`, `implemented`)
- **WSP-CL-PDU-TYPE-DISPATCH** — Use the PDU type octet to select the function and type-specific remainder of the WSP PDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-PDU-TYPE-DISPATCH` (`binary-decoder`, `implemented`)
- **WSP-CL-PEER-INDICATION-DELIVERY** — Deliver an indication primitive when the corresponding peer request primitive is received.
  - Family: `wsp`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-203-WSP` §6.4.3 (6.4.3 Constraints on Using the Service Primitives)
  - Parents: `WSP-CL-C-001`
  - Requirements: `RQ-TRN-010`
  - Fixture: `WSP-FX-PEER-INDICATION-DELIVERY` (`transport-boundary`, `implemented`)
- **WSP-CL-POST-BODY-TO-SDU-END** — Treat every octet after the declared headers as request body data through the end of the transport SDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-BODY-TO-SDU-END` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-CONTENT-TYPE** — Encode the Post body media type using the WSP Content-Type field-value grammar before the remaining headers.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-012`, `RQ-TRN-014`
  - Fixture: `WSP-FX-POST-CONTENT-TYPE` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-PDU-LAYOUT** — Encode Post contents as URI length, combined Content-Type-plus-headers length, URI, Content-Type, headers, then body data.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-PDU-METHOD** — Encode the selected HTTP POST method using the Post PDU format.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-PDU-METHOD` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-URI-NO-NUL** — Exclude a storage string terminator from the length-delimited Post URI field.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-URI-NO-NUL` (`binary-decoder`, `implemented`)
- **WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS** — Allow clients to request method invocation and receive results while allowing servers to receive invocations and request results.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §6.4.3 (6.4.3 Constraints on Using the Service Primitives)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-PRIMITIVE-ROLE-RESTRICTIONS` (`transport-boundary`, `implemented`)
- **WSP-CL-REPLY-BODY-TO-SDU-END** — Treat every octet after the declared Reply headers as response body data through the end of the transport SDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-BODY-TO-SDU-END` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-CONTENT-TYPE** — Decode the Reply body media type before the remaining response headers.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-012`, `RQ-TRN-014`
  - Fixture: `WSP-FX-REPLY-CONTENT-TYPE` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-PDU-LAYOUT** — Encode Reply contents as status, combined Content-Type-plus-headers length, Content-Type, headers, then response data.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-STATUS-ASSIGNMENT** — Map HTTP/1.1 response statuses to and from every assigned single-octet WSP status in Table 36.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §appendix-a (Appendix A Assigned Numbers)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-STATUS-ASSIGNMENT` (`binary-decoder`, `implemented`)
- **WSP-CL-SELECTED-PDU-ASSIGNMENTS** — Use assigned PDU type 0x40 for GET, 0x60 for POST, and 0x04 for Reply.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §appendix-a (Appendix A Assigned Numbers)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-SELECTED-PDU-ASSIGNMENTS` (`binary-decoder`, `implemented`)
- **WSP-CL-TID-PEER-CORRELATION** — Pass the TID transparently through service primitives and use it to associate a reply with its connectionless request.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-TID-PEER-CORRELATION` (`state-machine`, `implemented`)
- **WSP-CL-TRANSPORT-ERROR-IGNORED** — Ignore underlying transport error indications at the connectionless WSP protocol layer.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §7.2 (7.2 Connectionless WSP)
  - Parents: `WSP-CL-C-001`
  - Requirements: `RQ-TRN-010`
  - Fixture: `WSP-FX-TRANSPORT-ERROR-IGNORED` (`error-policy`, `implemented`)
- **WSP-CL-UNITDATA-DIRECT-MAPPING** — Map each connectionless service request directly to one WSP PDU sent by an underlying Unitdata request, without a WSP state machine.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §7.2 (7.2 Connectionless WSP)
  - Parents: `WSP-C-001`, `WSP-CL-C-001`
  - Requirements: `RQ-TRN-010`
  - Fixture: `WSP-FX-UNITDATA-DIRECT-MAPPING` (`transport-boundary`, `implemented`)
- **WSP-CL-UNITDATA-RECEIVE-DISPATCH** — Dispatch received method and reply PDUs to their corresponding method-invoke and method-result indication primitives.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §7.2 (7.2 Connectionless WSP)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-UNITDATA-RECEIVE-DISPATCH` (`transport-boundary`, `implemented`)
- **WSP-CL-UNITDATA-SECURITY-EQUIVALENCE** — Preserve one-to-one primitive behavior whether Unitdata is supplied directly by WDP or by an optional security SAP.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §7.2 (7.2 Connectionless WSP)
  - Parents: `WSP-CL-C-001`
  - Requirements: `RQ-TRN-010`
  - Fixture: `WSP-FX-UNITDATA-SECURITY-EQUIVALENCE` (`transport-boundary`, `implemented`)

### WSP-802

- **WSP-CL-ENCODING-VERSION-ABSENT-DEFAULT** — When Encoding-Version is absent, assume only version 1.2-or-lower encodings for the default page and the lowest version for an extension page.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.2.70 (8.4.2.70 Encoding-Version field)
  - Parents: `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-ENCODING-VERSION-ABSENT-DEFAULT` (`binary-decoder`, `implemented`)
- **WSP-CL-ENCODING-VERSION-CLIENT-SELECTION** — Send the highest encoding version the client implements that does not exceed the known server maximum.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.2.70 (8.4.2.70 Encoding-Version field)
  - Parents: `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-ENCODING-VERSION-CLIENT-SELECTION` (`transport-boundary`, `implemented`)
- **WSP-CL-ENCODING-VERSION-EXTENSION-PAGES** — Send a dedicated Encoding-Version value for each used extended header code page.
  - Family: `wsp`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-203-WSP` §8.4.2.70 (8.4.2.70 Encoding-Version field)
  - Parents: `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-ENCODING-VERSION-EXTENSION-PAGES` (`transport-boundary`, `implemented`)
- **WSP-CL-ENCODING-VERSION-HOP-BY-HOP** — Treat Encoding-Version as hop-by-hop rather than forwarding it as an end-to-end application header.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.4 (8.4.4 End-to-end and Hop-by-hop Headers)
  - Parents: `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-ENCODING-VERSION-HOP-BY-HOP` (`transport-boundary`, `implemented`)
- **WSP-CL-ENCODING-VERSION-NO-OVERCLAIM** — Never advertise or emit a binary encoding version for which the sending peer is not compliant.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.2.70 (8.4.2.70 Encoding-Version field)
  - Parents: `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-ENCODING-VERSION-NO-OVERCLAIM` (`transport-boundary`, `implemented`)
- **WSP-CL-ENCODING-VERSION-PEER-CACHE** — Cache the server-supported encoding version and use it to choose compatible encodings on later requests.
  - Family: `wsp`; force: `explicit-may`; level: `permitted`
  - Source: `WAP-203-WSP` §8.4.2.70 (8.4.2.70 Encoding-Version field)
  - Parents: `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-ENCODING-VERSION-PEER-CACHE` (`state-machine`, `implemented`)
- **WSP-CL-ENCODING-VERSION-REQUIRED** — Include the hop-by-hop Encoding-Version header in every connectionless request and reply.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.2.70 (8.4.2.70 Encoding-Version field)
  - Parents: `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-ENCODING-VERSION-REQUIRED` (`transport-boundary`, `implemented`)
- **WSP-CL-ENCODING-VERSION-TEXT-FORM** — Encode textual Encoding-Version as an optional code-page identity plus major-dot-minor version using the defined text-value rules.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.4.3.1 (8.4.3.1 Encoding-Version field)
  - Parents: `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-ENCODING-VERSION-TEXT-FORM` (`binary-decoder`, `implemented`)
- **WSP-CL-EXPECT-SIN-ENCODING** — Apply the effective SIN 001 replacement grammar for the Expect header rather than the superseded base encoding.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203_001-WSP` §3.3 (3.3 Change)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-EXPECT-SIN-ENCODING` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-CODE-PAGE-RANGES** — Reserve code page 1 for defaults, 2 through 15 for WAP, 16 through 127 for applications, and 128 through 255 for future use.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1.1 (8.4.1.1 Field name)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-CODE-PAGE-RANGES` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-COMPACTION-FORMS** — Support well-known binary tokens, binary numeric/date/quality values, and mixed binary or text strings without losing header semantics.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1 (8.4.1 General)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-COMPACTION-FORMS` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-DEFAULT-PAGE** — Start every header set on default code page 1 and keep a shifted page active only through that header set.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1.1 (8.4.1.1 Field name)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-DEFAULT-PAGE` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-EXTENSION-PAGE-AGREEMENT** — Use application-page single-octet field names only after agreement; otherwise use Token-text field names.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1.1 (8.4.1.1 Field name)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-EXTENSION-PAGE-AGREEMENT` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-FIELD-ASSIGNMENTS** — Implement every default-page header name token and minimum encoding version in effective Table 39 without reusing deprecated assignments.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §appendix-a (Appendix A Assigned Numbers)
  - Parents: `WSP-CL-C-003`, `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-FIELD-ASSIGNMENTS` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-HTTP-COMPATIBILITY** — Encode WSP header fields as compact field-name/value pairs whose semantics remain compatible with HTTP/1.1.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1 (8.4.1 General)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-HTTP-COMPATIBILITY` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-LIST-EXPANSION** — Expand an HTTP comma-list header into ordered repeated WSP fields before applying the well-known field encoding rule.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1.3 (8.4.1.3 Encoding of list values)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-LIST-EXPANSION` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-NAME-VERSION-CHOICE** — Use a well-known field-name token only when its encoding version is supported; otherwise encode the field name as text.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1.1 (8.4.1.1 Field name)
  - Parents: `WSP-CL-C-003`, `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-NAME-VERSION-CHOICE` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-SYNTAX-REGISTRY** — Implement the complete effective WSP 8.4.2 header grammar registry, including the SIN-corrected Expect field encoding.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §8.4.2 (8.4.2 Header syntax)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-SYNTAX-REGISTRY` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-UNKNOWN-VALUE-SKIP** — Determine and skip an unrecognized field value from its generic length form without interpreting its detailed syntax.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1.2 (8.4.1.2 Field values)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-UNKNOWN-VALUE-SKIP` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-VALUE-ENCODING-CHOICE** — Use compact syntax for well-known binary field values and textual values whenever the field name is encoded as text.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1.2 (8.4.1.2 Field values)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-VALUE-ENCODING-CHOICE` (`binary-decoder`, `implemented`)
- **WSP-CL-HEADER-VALUE-LENGTH-PREFIX** — Interpret first-octet ranges as short length, uintvar-following length, NUL-terminated text, or terminal seven-bit encoded value.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §8.4.1.2 (8.4.1.2 Field values)
  - Parents: `WSP-CL-C-003`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-HEADER-VALUE-LENGTH-PREFIX` (`binary-decoder`, `implemented`)
- **WSP-CL-INTEGER-NETWORK-ORDER** — Encode multi-octet integer values in big-endian network octet order.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.1.1 (8.1.1 Primitive Data Types)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-014`
  - Fixture: `WSP-FX-INTEGER-NETWORK-ORDER` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-CONTENT-TYPE** — Encode the Post body media type using the WSP Content-Type field-value grammar before the remaining headers.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-012`, `RQ-TRN-014`
  - Fixture: `WSP-FX-POST-CONTENT-TYPE` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-CONTENT-TYPE** — Decode the Reply body media type before the remaining response headers.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-012`, `RQ-TRN-014`
  - Fixture: `WSP-FX-REPLY-CONTENT-TYPE` (`binary-decoder`, `implemented`)
- **WSP-CL-UNSUPPORTED-ENCODING-RETRY** — On a peer rejection of unsupported binary encoding, retry with textual encoding compatible with the returned supported-version information.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.4.2.70 (8.4.2.70 Encoding-Version field)
  - Parents: `WSP-CL-C-003`, `WSP-CL-C-020`
  - Requirements: `RQ-TRN-014`
  - Fixture: `WSP-FX-UNSUPPORTED-ENCODING-RETRY` (`error-policy`, `implemented`)

### WSP-804

- **WSP-CL-CONNECTIONLESS-METHOD-FACILITY** — Implement the connectionless method-invocation facility for selected GET and POST requests and replies.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.1 (6.4.1 Overview)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-CONNECTIONLESS-METHOD-FACILITY` (`transport-boundary`, `implemented`)
- **WSP-CL-CONNECTIONLESS-TID-REQUIRED** — Include the one-octet transaction identifier before the PDU type in every selected connectionless method or reply PDU.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-CONNECTIONLESS-TID-REQUIRED` (`binary-decoder`, `implemented`)
- **WSP-CL-GET-PDU-LAYOUT** — Encode Get contents as a uintvar URI length, exactly that many URI octets, then request headers through the end of the SDU.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-GET-PDU-METHOD** — Encode the selected HTTP GET method using the Get PDU format.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-PDU-METHOD` (`binary-decoder`, `implemented`)
- **WSP-CL-GET-URI-NO-NUL** — Exclude a storage string terminator from the length-delimited Get URI field.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-URI-NO-NUL` (`binary-decoder`, `implemented`)
- **WSP-CL-METHOD-BODY-CONSTRAINT** — Do not provide a request body when the invoked HTTP method does not permit an entity body.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-BODY-CONSTRAINT` (`error-policy`, `implemented`)
- **WSP-CL-METHOD-ERROR-BODY** — When a result status is an error, preserve any response body that supplies human-displayable error information.
  - Family: `wsp`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-ERROR-BODY` (`rendering`, `implemented`)
- **WSP-CL-METHOD-HTTP-SEMANTICS** — Represent the method, request headers, and request body with semantics equivalent to their HTTP/1.1 counterparts.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-HTTP-SEMANTICS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-INVOKE-PARAMETERS** — Carry server address, client address, transaction identifier, method, request URI, optional headers, and method-permitted request body.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-INVOKE-PARAMETERS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-INVOKE-TRANSPARENCY** — Preserve the addresses, transaction identifier, method, URI, headers, and body from request to peer indication.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-INVOKE-TRANSPARENCY` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-RESULT-HTTP-SEMANTICS** — Represent result status, response headers, and response body with semantics equivalent to HTTP/1.1.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-RESULT-HTTP-SEMANTICS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-RESULT-PARAMETERS** — Carry client address, server address, transaction identifier, status, optional response headers, and conditional response body in a method result.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-RESULT-PARAMETERS` (`transport-boundary`, `implemented`)
- **WSP-CL-PDU-TYPE-DISPATCH** — Use the PDU type octet to select the function and type-specific remainder of the WSP PDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-PDU-TYPE-DISPATCH` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-BODY-TO-SDU-END** — Treat every octet after the declared headers as request body data through the end of the transport SDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-BODY-TO-SDU-END` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-CONTENT-TYPE** — Encode the Post body media type using the WSP Content-Type field-value grammar before the remaining headers.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-012`, `RQ-TRN-014`
  - Fixture: `WSP-FX-POST-CONTENT-TYPE` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-PDU-LAYOUT** — Encode Post contents as URI length, combined Content-Type-plus-headers length, URI, Content-Type, headers, then body data.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-PDU-METHOD** — Encode the selected HTTP POST method using the Post PDU format.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-PDU-METHOD` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-URI-NO-NUL** — Exclude a storage string terminator from the length-delimited Post URI field.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-URI-NO-NUL` (`binary-decoder`, `implemented`)
- **WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS** — Allow clients to request method invocation and receive results while allowing servers to receive invocations and request results.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §6.4.3 (6.4.3 Constraints on Using the Service Primitives)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-PRIMITIVE-ROLE-RESTRICTIONS` (`transport-boundary`, `implemented`)
- **WSP-CL-REPLY-BODY-TO-SDU-END** — Treat every octet after the declared Reply headers as response body data through the end of the transport SDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-BODY-TO-SDU-END` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-CONTENT-TYPE** — Decode the Reply body media type before the remaining response headers.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-012`, `RQ-TRN-014`
  - Fixture: `WSP-FX-REPLY-CONTENT-TYPE` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-PDU-LAYOUT** — Encode Reply contents as status, combined Content-Type-plus-headers length, Content-Type, headers, then response data.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-STATUS-ASSIGNMENT** — Map HTTP/1.1 response statuses to and from every assigned single-octet WSP status in Table 36.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §appendix-a (Appendix A Assigned Numbers)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-STATUS-ASSIGNMENT` (`binary-decoder`, `implemented`)
- **WSP-CL-SELECTED-PDU-ASSIGNMENTS** — Use assigned PDU type 0x40 for GET, 0x60 for POST, and 0x04 for Reply.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §appendix-a (Appendix A Assigned Numbers)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-SELECTED-PDU-ASSIGNMENTS` (`binary-decoder`, `implemented`)
- **WSP-CL-TID-PEER-CORRELATION** — Pass the TID transparently through service primitives and use it to associate a reply with its connectionless request.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-TID-PEER-CORRELATION` (`state-machine`, `implemented`)
- **WSP-CL-UNITDATA-RECEIVE-DISPATCH** — Dispatch received method and reply PDUs to their corresponding method-invoke and method-result indication primitives.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §7.2 (7.2 Connectionless WSP)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-UNITDATA-RECEIVE-DISPATCH` (`transport-boundary`, `implemented`)

### WSP-805

- **WML-CL-GO-ACCEPT-CHARSET** — Encode submitted field names and values using an accepted charset, falling back to the deck encoding when unspecified or unknown.
  - Family: `wml`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-ACCEPT-CHARSET` (`transport-boundary`, `implemented`)
- **WML-CL-GO-ENCTYPE-SUPPORT** — Support form-urlencoded submission and the declared multipart form-data behavior for POST requests.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-ENCTYPE-SUPPORT` (`transport-boundary`, `implemented`)
- **WML-CL-GO-FORM-URLENCODING** — URI-escape form field names and values, join each name to its value with equals, and join pairs with ampersands.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`, `WML-C-37`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-FORM-URLENCODING` (`transport-boundary`, `implemented`)
- **WML-CL-GO-GET-QUERY-MERGE** — For form-urlencoded GET, combine encoded fields with any existing query into a valid query component.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-GET-QUERY-MERGE` (`transport-boundary`, `implemented`)
- **WML-CL-GO-METHOD** — Map get and post method values to the corresponding request operation.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-METHOD` (`transport-boundary`, `implemented`)
- **WML-CL-GO-NO-CACHE** — For cache-control no-cache, reload from the origin and send the matching request cache-control value.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-NO-CACHE` (`transport-boundary`, `implemented`)
- **WML-CL-GO-PART-CONTENT-TYPE** — Provide a content type for each multipart part and a charset when its content is not US-ASCII.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-PART-CONTENT-TYPE` (`transport-boundary`, `planned`)
- **WML-CL-GO-POST-CONTENT-TYPE-CHARSET** — For form-urlencoded POST, send encoded fields in the body and include the submission charset in Content-Type.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-POST-CONTENT-TYPE-CHARSET` (`transport-boundary`, `implemented`)
- **WML-CL-GO-REFERER** — When sendreferer is true, transmit the smallest usable relative URI for the referring deck.
  - Family: `wml`; force: `explicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-14`, `WML-C-29`
  - Requirements: `RQ-RMK-002`, `RQ-RMK-011`
  - Fixture: `WML-FX-GO-REFERER` (`transport-boundary`, `implemented`)
- **WML-CL-GO-SUBMISSION-ORDER** — Substitute variables, transcode fields, then serialize postfields in document order.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.5.1 (9.5.1 The Go Element)
  - Parents: `WML-C-29`, `WML-C-37`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-GO-SUBMISSION-ORDER` (`transport-boundary`, `implemented`)
- **WML-CL-POSTFIELD-REQUEST-PAIR** — Submit each postfield as a name/value pair using the encoding selected by the enclosing go task.
  - Family: `wml`; force: `implicit-must`; level: `required`
  - Source: `WAP-191_104-WML` §9.3 (9.3 The Postfield Element)
  - Parents: `WML-C-37`, `WML-C-29`
  - Requirements: `RQ-RMK-002`
  - Fixture: `WML-FX-POSTFIELD-REQUEST-PAIR` (`transport-boundary`, `implemented`)
- **WSP-CL-CONNECTIONLESS-METHOD-FACILITY** — Implement the connectionless method-invocation facility for selected GET and POST requests and replies.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.1 (6.4.1 Overview)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-CONNECTIONLESS-METHOD-FACILITY` (`transport-boundary`, `implemented`)
- **WSP-CL-CONNECTIONLESS-TID-REQUIRED** — Include the one-octet transaction identifier before the PDU type in every selected connectionless method or reply PDU.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-CONNECTIONLESS-TID-REQUIRED` (`binary-decoder`, `implemented`)
- **WSP-CL-GET-PDU-LAYOUT** — Encode Get contents as a uintvar URI length, exactly that many URI octets, then request headers through the end of the SDU.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-GET-PDU-METHOD** — Encode the selected HTTP GET method using the Get PDU format.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-PDU-METHOD` (`binary-decoder`, `implemented`)
- **WSP-CL-GET-URI-NO-NUL** — Exclude a storage string terminator from the length-delimited Get URI field.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.1 (8.2.3.1 Get)
  - Parents: `WSP-CL-C-004`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-GET-URI-NO-NUL` (`binary-decoder`, `implemented`)
- **WSP-CL-METHOD-BODY-CONSTRAINT** — Do not provide a request body when the invoked HTTP method does not permit an entity body.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-BODY-CONSTRAINT` (`error-policy`, `implemented`)
- **WSP-CL-METHOD-ERROR-BODY** — When a result status is an error, preserve any response body that supplies human-displayable error information.
  - Family: `wsp`; force: `explicit-should`; level: `recommended`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-ERROR-BODY` (`rendering`, `implemented`)
- **WSP-CL-METHOD-HTTP-SEMANTICS** — Represent the method, request headers, and request body with semantics equivalent to their HTTP/1.1 counterparts.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-HTTP-SEMANTICS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-INVOKE-PARAMETERS** — Carry server address, client address, transaction identifier, method, request URI, optional headers, and method-permitted request body.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-INVOKE-PARAMETERS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-INVOKE-TRANSPARENCY** — Preserve the addresses, transaction identifier, method, URI, headers, and body from request to peer indication.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.1 (6.4.2.1 S-Unit-MethodInvoke)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-INVOKE-TRANSPARENCY` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-RESULT-HTTP-SEMANTICS** — Represent result status, response headers, and response body with semantics equivalent to HTTP/1.1.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-RESULT-HTTP-SEMANTICS` (`transport-boundary`, `implemented`)
- **WSP-CL-METHOD-RESULT-PARAMETERS** — Carry client address, server address, transaction identifier, status, optional response headers, and conditional response body in a method result.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §6.4.2.2 (6.4.2.2 S-Unit-MethodResult)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-METHOD-RESULT-PARAMETERS` (`transport-boundary`, `implemented`)
- **WSP-CL-PDU-TYPE-DISPATCH** — Use the PDU type octet to select the function and type-specific remainder of the WSP PDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-PDU-TYPE-DISPATCH` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-BODY-TO-SDU-END** — Treat every octet after the declared headers as request body data through the end of the transport SDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-BODY-TO-SDU-END` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-CONTENT-TYPE** — Encode the Post body media type using the WSP Content-Type field-value grammar before the remaining headers.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-012`, `RQ-TRN-014`
  - Fixture: `WSP-FX-POST-CONTENT-TYPE` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-PDU-LAYOUT** — Encode Post contents as URI length, combined Content-Type-plus-headers length, URI, Content-Type, headers, then body data.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-PDU-METHOD** — Encode the selected HTTP POST method using the Post PDU format.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-PDU-METHOD` (`binary-decoder`, `implemented`)
- **WSP-CL-POST-URI-NO-NUL** — Exclude a storage string terminator from the length-delimited Post URI field.
  - Family: `wsp`; force: `explicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.2 (8.2.3.2 Post)
  - Parents: `WSP-CL-C-006`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-POST-URI-NO-NUL` (`binary-decoder`, `implemented`)
- **WSP-CL-PRIMITIVE-ROLE-RESTRICTIONS** — Allow clients to request method invocation and receive results while allowing servers to receive invocations and request results.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §6.4.3 (6.4.3 Constraints on Using the Service Primitives)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-PRIMITIVE-ROLE-RESTRICTIONS` (`transport-boundary`, `implemented`)
- **WSP-CL-REPLY-BODY-TO-SDU-END** — Treat every octet after the declared Reply headers as response body data through the end of the transport SDU.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-BODY-TO-SDU-END` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-CONTENT-TYPE** — Decode the Reply body media type before the remaining response headers.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`, `WSP-CL-C-003`
  - Requirements: `RQ-TRN-012`, `RQ-TRN-014`
  - Fixture: `WSP-FX-REPLY-CONTENT-TYPE` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-PDU-LAYOUT** — Encode Reply contents as status, combined Content-Type-plus-headers length, Content-Type, headers, then response data.
  - Family: `wsp`; force: `grammar`; level: `required`
  - Source: `WAP-203-WSP` §8.2.3.3 (8.2.3.3 Reply)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-PDU-LAYOUT` (`binary-decoder`, `implemented`)
- **WSP-CL-REPLY-STATUS-ASSIGNMENT** — Map HTTP/1.1 response statuses to and from every assigned single-octet WSP status in Table 36.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §appendix-a (Appendix A Assigned Numbers)
  - Parents: `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-REPLY-STATUS-ASSIGNMENT` (`binary-decoder`, `implemented`)
- **WSP-CL-SELECTED-PDU-ASSIGNMENTS** — Use assigned PDU type 0x40 for GET, 0x60 for POST, and 0x04 for Reply.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §appendix-a (Appendix A Assigned Numbers)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-SELECTED-PDU-ASSIGNMENTS` (`binary-decoder`, `implemented`)
- **WSP-CL-TID-PEER-CORRELATION** — Pass the TID transparently through service primitives and use it to associate a reply with its connectionless request.
  - Family: `wsp`; force: `implicit-must`; level: `required`
  - Source: `WAP-203-WSP` §8.2.1 (8.2.1 PDU Common Fields)
  - Parents: `WSP-CL-C-004`, `WSP-CL-C-005`, `WSP-CL-C-006`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-012`
  - Fixture: `WSP-FX-TID-PEER-CORRELATION` (`state-machine`, `implemented`)
- **WSP-CL-UNITDATA-RECEIVE-DISPATCH** — Dispatch received method and reply PDUs to their corresponding method-invoke and method-result indication primitives.
  - Family: `wsp`; force: `table`; level: `required`
  - Source: `WAP-203-WSP` §7.2 (7.2 Connectionless WSP)
  - Parents: `WSP-CL-C-001`, `WSP-CL-C-005`, `WSP-CL-C-007`
  - Requirements: `RQ-TRN-010`, `RQ-TRN-012`
  - Fixture: `WSP-FX-UNITDATA-RECEIVE-DISPATCH` (`transport-boundary`, `implemented`)

## Explicit mapping gaps

- `WSP-803` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.
- `WSP-806` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.

Declared-family gaps:

- `WSP-803` declares `wsp` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.
- `WSP-804` declares `wdp` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.
- `WSP-805` declares `wae`, `wdp` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.
- `WSP-806` declares `wsp` scope without a direct clause mapping from that family. Clauses from another family do not close this gap.

## Effective source order

- `wae`: `WAP-190-WAESpec` -> `WAP-190_101-WAESpec` -> `WAP-190_102-WAESpec` -> `WAP-190_103-WAESpec` -> `WAP-190_104-WAE-Spec`
- `wdp`: `WAP-200-WDP` -> `WAP-200_001-WDP` -> `WAP-200_002-WDP` -> `WAP-200_003-WDP` -> `WAP-200_004-WDP` -> `WAP-200_005-WDP`
- `wml`: `WAP-191-WML` -> `WAP-191_102-WML` -> `WAP-191_104-WML` -> `WAP-191_105-WML`
- `wsp`: `WAP-203-WSP` -> `WAP-203_001-WSP` -> `WAP-203_003-WSP` -> `WAP-203_005-WSP`

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
- `WAP-200_001-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_001-WDP-20001212-a.pdf
- `WAP-200_002-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_002-WDP-20001213-a.pdf
- `WAP-200_003-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_003-WDP-20010328-a.pdf
- `WAP-200_004-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_004-WDP-20010517-a.pdf
- `WAP-200_005-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200_005-WDP-20010718-a.pdf
- `WAP-200-WDP`: Wireless Datagram Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-200-WDP-20000219-a.pdf
- `WAP-203_001-WSP`: Wireless Session Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-203_001-WSP-20000620-a.pdf
- `WAP-203_003-WSP`: Wireless Session Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-203_003-WSP-20001218-a.pdf
- `WAP-203_005-WSP`: Wireless Session Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-203_005-WSP-20010717-a.pdf
- `WAP-203-WSP`: Wireless Session Protocol — https://www.openmobilealliance.org/tech/affiliates/wap/WAP-203-WSP-20000504-a.pdf
- `WAP-215-ClassConform-20001213-a`: Class Conformance Requirements — https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf
