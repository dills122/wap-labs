# WAP 1.2.1 WMLScript SCR Ledger

Version: v0.3
Status: effective SCR extracted; Class C applied; 107 nested clauses planned

## Purpose

Define the exact WMLScript interpreter obligations selected by the WAP 1.2.1
Class C data-client profile and prevent the current WaveScript skeleton from
being mistaken for WAP-193 bytecode compliance.

The machine-readable authority is:

- `spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json`

Validate it with:

```sh
node scripts/check-wap-wmlscript-conformance-ledger.mjs
node scripts/check-wap-conformance-ledger.mjs
```

## Effective authority

The normative sequence is:

1. `WAP-193-WMLScript-20001025-a`
2. `WAP-193_101-WMLScript-20010928-a`, applied afterward

WAP-193_101 is a consolidated effective specification. Its section 15 adds
explicit `-S-` and `-C-` actor delimiters and separates floating-point SCRs.
It supplies the effective 112-row table used by the ledger.

The selected profile is:

- WAP-215 target: `CCR-CLASSC-C-001`
- selected feature group: `WMLScript:MCF`
- WAP-221 meaning: every mandatory client/interpreter feature in the SCR

## Effective totals

| Scope | Count |
|---|---:|
| All WMLScript SCR rows | 112 |
| Mandatory rows, all actors | 108 |
| Optional rows, all actors | 4 |
| Encoder rows | 68 |
| Interpreter rows | 44 |
| Class C-required interpreter rows | 41 |
| Optional interpreter rows | 3 |

The optional interpreter rows are `WMLS-C-071` (floating-point size),
`WMLS-C-074` (conversion to floating point), and `WMLS-C-112`
(floating-point operations). The earlier active-doc claim that
`WMLS-C-069..111` are all mandatory is incorrect.

## Selected implementation audit

| Result | Rows |
|---|---:|
| Implemented | 0 |
| Partial | 32 |
| Missing | 9 |
| Direct normative test links | 22 |
| Provisional local-test links | 10 |

These counts describe exact selected SCR rows, not a compliance percentage.
“Partial” means related behavior exists but the repository has not proved the
complete WAP-193 requirement. No selected row is marked implemented. All 41
selected rows now map to 107 deduplicated normative clauses: 105 required and
two recommended.

### Partial foundations

- a bounded strict decoder parses the WAP-193 header, multibyte fields, constant,
  pragma, and function pools, and every effective instruction encoding;
- structural verification rejects malformed/truncated/reserved encodings and invalid
  local, constant, local-function, standard-library/function, function-boundary, and jump
  references;
- reachable whole-function stack dataflow validates instruction effects, merge consistency,
  balanced loops, terminal and implicit returns, underflow, and the bounded overflow limit;
- source-pinned byte-exact fixtures have native/WASM parity coverage, including recovery and
  serialized error/trace stability;
- registered WAP units are fully decoded and verified before external name lookup; the bounded
  executor returns the WAP `RETURN_ES` empty string and reports all other valid instructions as
  deterministic typed unsupported-execution failures;
- a small VM supports local call/return frames, integer addition, strings,
  locals, a host-call boundary, and execution limits;
- scalar values and one string-coercion helper exist;
- fatal/non-fatal host-visible outcomes and recovery tests exist.

This is direct structural WAP-193 evidence, but it is not full WMLScript execution evidence:

- the VM recognizes only nine project-specific opcodes;
- the project-specific nine-opcode VM remains separate behind explicit manual-PC fixture metadata
  and is not normative WAP-193 evidence;
- only `RETURN_ES` is executable from a WAP unit; the other return form and opcode execution
  semantics are not implemented;
- verified standard-library identifiers and arities do not implement the corresponding library
  functions;
- URL-based external invocation, fragments, relative resolution, pragmas, and
  access control are absent;
- the complete conversion and chapter 12 error rules are not proven;
- the fixture corpus is intentionally minimal and needs compiler-produced additions.

## Work closure

The ledger maps every row to existing requirement and sprint lanes:

- `WMLS-501` / `W1-02`: real compilation-unit decoder, pools, instruction
  set, integrity checks, and runtime validity;
- `WMLS-502` / `W1-04`: types, conversions, calls, locals, returns, and
  operation semantics;
- `WMLS-503` / `W1-03` / `W0-08`: extern functions, URL invocation, pragmas,
  and access control;
- `WMLS-505` / `W1-06` / `W1-07`: exact fatal/non-fatal behavior;
- `WMLS-506` / `W1-01`: WMLScript media types and cross-layer handoff;
- `W1-05`: machine-ledger and CI closure.

The additive B1 closure adds direct evidence to `WMLS-C-107`, `WMLS-C-108`, and `WMLS-C-110`
and source-linked partial evidence across the instruction-family rows without promoting a broad
execution row to implemented. The exact machine-ledger assessments remain authoritative.

The B2 baton is `WMLS-502`: add bounded WAP-193 operator/conversion execution on top of this
verified CFG and stack model, preserve native/WASM outcomes and serialized traces, and leave
standard-library behavior (`WMLS-504`) plus URL/access invocation (`WMLS-503`) in their own lanes.

## Enhancement policy

Modern resource bounds, safer parsing, richer diagnostics, caching, debugging,
and JIT/AOT internals may improve the runtime. They cannot change strict
WAP-visible types, bytecode acceptance, instruction outcomes, URL/access
rules, or error behavior. Project extensions require an explicit capability
mode and must not replace the strict interpreter path.

## Source handling

The WAP-193 PDFs and private text extractions remain outside Git pending
redistribution approval. The repository stores source identities, hashes,
normalized requirements, and implementation/test mappings only.
