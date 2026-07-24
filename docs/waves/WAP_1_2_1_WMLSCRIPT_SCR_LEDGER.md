# WAP 1.2.1 WMLScript SCR Ledger

Version: v0.1
Status: effective SCR extracted; Class C applied; nested-clause audit pending

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
| Partial | 23 |
| Missing | 18 |
| Direct normative tests | 0 |
| Provisional local-test links | 23 |

These counts describe exact selected SCR rows, not a compliance percentage.
“Partial” means related behavior exists but the repository has not proved the
complete WAP-193 requirement. No selected row is marked implemented while the
binary format and nested clauses remain unverified.

### Partial foundations

- a bounded decoder rejects unknown/truncated project-specific instructions;
- a small VM supports local call/return frames, integer addition, strings,
  locals, a host-call boundary, and execution limits;
- scalar values and one string-coercion helper exist;
- fatal/non-fatal host-visible outcomes and recovery tests exist.

This is useful architecture and safety evidence. It is not evidence for a
WAP-193 compilation unit:

- the VM recognizes only nine project-specific opcodes;
- operands use fixed one-byte fields rather than the effective binary format;
- the WAP header, constant pool, pragma pool, and function pool are absent;
- most control-flow, arithmetic, bitwise, comparison, logical, stack, operand,
  and debug instructions are absent;
- URL-based external invocation, fragments, relative resolution, pragmas, and
  access control are absent;
- the complete conversion and chapter 12 error rules are not proven;
- there is no source-derived conforming `.wmlsc` fixture corpus.

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

The next implementation pass must start with source-derived binary fixtures
and the actual WAP-193 data structures. Extending the current custom bytecode
without a WAP compatibility boundary would deepen the gap.

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
