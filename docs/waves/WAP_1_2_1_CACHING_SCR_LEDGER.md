# WAP 1.2.1 User-Agent Caching SCR Ledger

Version: v0.1
Status: effective SCR extracted; Class C applied; nested HTTP audit pending

## Purpose

Define the exact WAP-120 caching behavior required by the selected WAP 1.2.1
Class C data client, including the valid zero-byte-cache posture, history
interaction, intra-resource navigation, and cache security.

The machine-readable authority is:

- `spec-processing/source-manifests/wap-1.2.1-caching-scr.json`

Validate it with:

```sh
node scripts/check-wap-caching-conformance-ledger.mjs
node scripts/check-wap-conformance-ledger.mjs
```

## Effective authority

The family has one effective release member:

- `WAP-120-WAPCachingMod-20010413-a`

Its Appendix A supplies the 11 actor-specific SCR rows. The selected profile
is:

- WAP-215 target: `CCR-CLASSC-C-001`
- selected feature group: `WAPCachingMod:MCF`
- WAP-221 meaning: every mandatory client feature in the SCR

WAP-120 incorporates the HTTP/1.1 caching model from RFC 2616. Optional
time-of-day behavior also references RFC 1305. Both primary RFC text artifacts
are hash-locked in the private external-source ledger.

## Effective totals

| Scope | Count |
|---|---:|
| All caching SCR rows | 11 |
| Mandatory rows, all actors | 9 |
| Optional rows, all actors | 2 |
| User-agent/client rows | 6 |
| Gateway/server rows | 5 |
| Class C-required client rows | 5 |
| Optional client rows | 1 |

`UACache-C-005` (gateway time-base synchronization) is the optional client
row. `UACache-S-007..011` remain source-complete gateway requirements outside
the selected client profile.

## Selected Class C requirements

| SCR | Required behavior | Current status |
|---|---|---|
| `UACache-C-001` | HTTP/1.1 user-agent caching model | partial |
| `UACache-C-002` | stale + must-revalidate history replay | missing |
| `UACache-C-003` | stale without must-revalidate preserves cached view | missing |
| `UACache-C-004` | no revalidation for intra-deck/intra-script navigation | partial |
| `UACache-C-006` | protect cached contents | partial |

The selected audit is:

- implemented: 0
- partial: 3
- missing: 2
- direct normative tests: 0
- provisional local-test links: 3

## Zero-byte cache is valid, but must be explicit

WAP-120 states that the model applies to all WAP user agents, including a
user agent with a zero-byte cache. Therefore an all-in-one browser does not
need to ship a storage cache merely to claim the selected profile.

That does not make the requirements disappear:

- the runtime must declare and prove that no repository or host layer silently
  caches resources;
- history and task behavior must remain deterministic under the zero-byte
  policy;
- intra-resource transitions must not cause network revalidation;
- active deck/script/history data must have an explicit lifetime and
  confidentiality policy;
- adding a real cache later must activate the complete freshness,
  `must-revalidate`, original-request replay, and security rules.

The current code behaves approximately like an undeclared zero-byte cache:

- transport requests are issued through the host for external loads;
- explicit reload maps to `Cache-Control: no-cache` and `Pragma: no-cache`;
- history entries preserve URL, method, headers, and request-policy identity;
- external history back currently refetches the earlier request;
- intra-deck fragment navigation stays inside the loaded engine deck;
- registered script calls stay inside the engine runtime;
- there is no repository-owned HTTP response cache or freshness metadata.

This is not enough for full credit. In particular, no code parses response
freshness or `must-revalidate`, and external history back cannot choose between
the two mandatory stale-resource branches.

## Work closure

Existing open program item `WAE-603` is the canonical corrective lane.
Completed transport baseline `T0-15` remains historical evidence and is not
reopened.

`WAE-603` must close:

1. a machine-readable `zero-byte` versus `http-cache` capability declaration;
2. proof that strict zero-byte mode bypasses any hidden host/platform cache;
3. source-derived history fixtures for both `must-revalidate` branches,
   preserving the exact original method, entity, headers, and request policy;
4. WML intra-deck and WMLScript intra-compilation-unit no-fetch fixtures;
5. cache/data-retention threat modeling and tests;
6. RFC 2616 nested-clause extraction for the selected WAP-120 references;
7. migration gates for a future bounded cache implementation.

## Enhancement policy

A bounded cache, offline mode, prefetching, encrypted storage, diagnostics,
and modern eviction strategies are valid improvements. Strict mode must retain
the WAP-120 history, revalidation, intra-resource, and security outcomes.
Prefetch/offline behavior must be capability-declared and cannot replace the
zero-byte or compliant HTTP-cache paths.

## Source handling

The recovered WAP-120 PDF, private text extraction, and private RFC text
artifacts remain outside Git. The repository stores source identities, hashes,
normalized obligations, and audit mappings only.
