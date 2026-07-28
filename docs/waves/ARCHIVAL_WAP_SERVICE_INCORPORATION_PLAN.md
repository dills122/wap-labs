# Archival WAP Research Incorporation Plan

Planning status: implementation handoff; no archive acquisition, third-party content import, or
public museum deployment is authorized by this document

Research checkpoint: 2026-07-27

## Outcome

Use the useful behavior inventory and preservation lessons from the externally supplied
`waves-wap-archive-kit` research package to improve Waves' first-party public WAP lab without
importing its untrusted tooling, server configuration, audit output, or third-party material.

The immediate result should be a richer deterministic service matrix behind the existing public
lab profiles:

```text
home.<domain>     -> period-style first-party navigation and service gallery
forms.<domain>    -> bounded input, selection, GET/POST, and disposable-state cases
interop.<domain>  -> versioned protocol, MIME, cache, size, error, and malformed-input cases
```

An actual historical museum remains a separate future product decision. It requires source-level
rights evidence, privacy review, a dedicated threat model, and separately authorized hosting.

## Trust and evidence boundary

The external package was reviewed as untrusted, read-only research input. It is not tracked in
this repository and is not a normative WAP source.

The review established that:

- the package is a text-only research kit rather than a recovered corpus;
- its internal file hashes were consistent, but its origin and authorship were not independently
  authenticated;
- its MIT declaration covers only package-authored material and explicitly excludes third-party
  captures, brands, artwork, text, and named software;
- its research claims and candidate licenses were not independently verified;
- its acquisition/audit scripts and server configuration are unsuitable for execution or direct
  adoption without a separate hardening effort; and
- its bundled reports and prose do not establish WML, WAP, security, or implementation
  compliance.

Treat the package as an idea and source-lead inventory. Canonical specifications, compliance
manifests, active work items, repository tests, and independently verified source licenses remain
authoritative.

## Architecture boundaries

All implementation derived from this plan must preserve the existing layer map.

| Concern | Owner | Incorporation rule |
| --- | --- | --- |
| First-party WML routes, response headers, bounded fake state | `wml-server/` | Add exact, deterministic routes and golden HTTP tests. |
| WAP gateway adaptation and public host allowlisting | `gateway-kannel/`, `docker/kannel/`, production gateway work | Keep exact-host fail-closed routing; do not add arbitrary URL forwarding. |
| WSP/WBXML encode/decode and constrained payload behavior | `transport-rust/` | Reuse the supported Rust codecs; do not encode or decode WBXML in the origin or TypeScript. |
| WML parsing, runtime behavior, focus, navigation, timers, rendering | `engine-wasm/` | Add or reuse canonical examples and executable stories; keep the engine network-free. |
| Desktop profile, safety messaging, and diagnostics | `browser/` | Keep gateway endpoint and resource URI distinct; never imply encryption or WTLS support. |
| Public infrastructure and operations | separate `GW-*`, `INF-*`, `OPS-*`, and `PRE-*` work | This plan supplies content/test requirements only and does not authorize deployment changes. |

## What to incorporate

### 1. Historical behavior taxonomy

Use these observed period patterns to choose test cases and first-party demonstrations:

- small multi-card decks and fragment navigation;
- deck and card softkeys using `do`, `go`, `prev`, `noop`, and templates;
- variables, `setvar`, substitution conversions, and URL/form escaping;
- inputs, password-shaped controls, selects, option groups, GET, POST, and `postfield`;
- timers and `ontimer` using WML tenths-of-a-second semantics;
- tables, text styles, alignment, wrapping, and compact information hierarchy;
- WBMP success, missing-image, invalid-image, and alternate-text behavior;
- relative, root-relative, fragment, absolute, and rejected external destinations;
- WML 1.1, WML 1.2, and WML 1.3 document identities;
- correct and intentionally incorrect MIME/header combinations;
- small, boundary-sized, oversized, and malformed-but-observed decks;
- WMLScript and compiled-content references only where the active WMLScript work program has
  established a safe executable boundary; and
- JAD/JAR descriptors as a deferred download-interoperability case, not as an invitation to run
  recovered binaries.

The archive kit's suggested 1,400-byte and 3,000-byte thresholds are research heuristics, not
normative limits. Any adopted thresholds must be reconciled with the current transport constraints
and recorded as named fixture parameters.

### 2. Safe first-party service patterns

The following period applications are useful as interaction models. Recreate only the behavior,
using project-authored WML and deterministic synthetic data.

| Pattern | Proposed demonstration | Required safety boundary |
| --- | --- | --- |
| Portal/directory/search | Local service directory and search over the known first-party route catalog | No arbitrary URL input, crawling, or proxying |
| Nagios/Xymon/Monit status | Synthetic host and service status cards with pagination and compact severity indicators | No real infrastructure data, ping, traceroute, commands, or admin controls |
| Dictionary | Local dictionary lookup backed by an approved open dataset | Fixed local dataset; no arbitrary `dictd` or network target |
| Weather | Deterministic synthetic forecast or explicitly timestamped fixture | Never present stale data as current safety information |
| Mail | Scripted fake inbox, folders, paging, and message detail | No real credentials, IMAP, POP3, SMTP, NNTP, or outbound messaging |
| RSS/news | Build-time fixture feed with paging and categories | No runtime external feed fetch; no unlicensed article republication |
| Bookmark catalog | Read-only local links to first-party lab cases | Exact target allowlist and escaped labels/URLs |
| Guestbook/chat | Do not include in the first public release | Requires a separate moderation, abuse, retention, and privacy design |

### 3. Preservation and provenance concepts

If a later rights-cleared corpus is accepted, retain the following model after rewriting it as a
Waves-owned schema and policy:

```text
raw/       immutable acquired bytes, never publicly served
deploy/    reviewed, transformed, sanitized derivative
reports/   reproducible audit and transformation evidence
```

Every accepted external artifact must record at least:

- stable source identifier and exact original URL;
- source version or capture timestamp;
- acquisition timestamp and named tool version;
- archive/source digest and local SHA-256;
- byte length and independently sniffed content type;
- exact license identifier and retained license text, or a permission record;
- trademark, artwork, translation, user-content, and personal-data review state;
- transformation steps from raw to deployable derivative;
- reviewer and public-deployment approval;
- non-impersonation label, capture date, affiliation disclaimer, and takedown route; and
- explicit statements that credentials, outbound actions, server code, trackers, and personal data
  were removed or disabled.

## What not to incorporate

Do not copy, execute, or promote:

- the package's Wayback harvester or corpus auditor;
- its Makefile, Docker Compose file, Nginx fragment, or Apache fragment;
- its generated reports as verification evidence;
- its candidate or seed rows as verified facts;
- captured PHP, CGI, Perl, ASP, JSP, Java server code, shell scripts, or monitoring binaries;
- recovered WMLScript, WMLC, WMLSC, JAD, JAR, installer, or archive files before specialized
  review;
- branded captures, logos, editorial content, translations, or user submissions without exact
  rights evidence;
- real credential, payment, booking, trading, mail, telephone, SMS, WAP Push, administration,
  monitoring-control, or arbitrary-fetch behavior; or
- any network or parsing behavior inside `engine-wasm/`.

The package's six WML 1.1 files should not be copied into the canonical example corpus. Their
feature ideas already overlap stronger repository examples and lack adjacent executable stories.

## Existing coverage to reuse

Before adding a fixture, check the current canonical corpus and extend an existing story when it
already owns the behavior. Relevant examples include:

- `engine-wasm/examples/source/wml-203-dtd-family.wml`;
- `engine-wasm/examples/source/wml-204-control-validation.wml`;
- `engine-wasm/examples/source/wml-204-select-semantics.wml`;
- `engine-wasm/examples/source/wml-302-variable-substitution.wml`;
- `engine-wasm/examples/source/wml-304-request-intent.wml`;
- `engine-wasm/examples/source/wml-305-timer-lifecycle.wml`;
- `engine-wasm/examples/source/forms-text-submit-local.wml`;
- `engine-wasm/examples/source/forms-select-local.wml`;
- `engine-wasm/examples/source/timer-host-clock-lifecycle.wml`; and
- `wml-server/internal/origin/routes/index.wml`.

The public lab currently supports deterministic WML origin behavior and selectable WML 1.1,
1.2, or 1.3 document identity at configuration time. The implementation handoff must decide
whether the interop matrix needs route-specific complete documents or separate test deployments;
it must not silently change the global default used by existing smoke tests.

## Proposed public service matrix

### `home.<domain>`

Purpose: an attractive, period-correct first-party entry surface rather than a third-party museum.

Proposed cases:

- multi-card home/menu/about navigation;
- service directory grouped by Forms, Interop, Status, Dictionary, Weather, and Mail Demo;
- template/card softkey precedence demonstrations;
- compact two-column table and WBMP icon gallery;
- deterministic multilingual sample deck using project-authored strings; and
- explicit notice that the service is a modern compatibility lab, not a restored historical
  operator.

### `forms.<domain>`

Purpose: bounded form and request behavior using disposable fake data.

Proposed cases:

- text, numeric, password-display, maxlength, format-mask, and empty-value cases;
- single and multiple select, option group, initialization, and commit-order cases;
- GET query generation and POST form encoding;
- ordered and duplicate `postfield` behavior where supported by the active compliance slice;
- redirect-after-POST and deterministic validation errors;
- session expiry and bounded in-memory state; and
- a persistent warning never to enter real credentials or personal data.

### `interop.<domain>`

Purpose: machine-checkable protocol and content-boundary behavior.

Proposed route families:

| Family | Cases |
| --- | --- |
| Document identity | Equivalent valid WML 1.1, 1.2, and 1.3 decks |
| MIME | Correct WML/WBMP/JAD types; wrong, absent, parameterized, and unsupported types |
| Cache | `no-store`, cacheable fixture, expired response, and no-cache request behavior |
| Status | Deterministic 200, redirect, 400, 404, 405, 413, 415, and 500-shaped test responses |
| Size | Named small, legacy-boundary, transport-boundary, and rejected oversized responses |
| Encoding | UTF-8 baseline plus only the additional encodings supported by current transport evidence |
| Images | Valid WBMP, missing target, invalid bytes, and `alt` fallback |
| Structure | Multi-card, table, variable, timer, form, and external-intent decks |
| Malformed | Versioned invalid XML/WML cases with an explicit expected failure stage |
| Routing | Allowed hosts succeed; unknown hosts and arbitrary target requests fail closed |

Compiled WML/WMLScript and JAR downloads remain deferred until their active security/compliance
lanes define safe fixture production and handling. A descriptor-only JAD case may be added first
if it cannot initiate a download outside the first-party allowlist.

## Proposed implementation work items

These identifiers are proposed handoff units. They are not active merely because this planning
document exists.

### LAB-102A Historical interoperability fixture matrix

1. `Status`: proposed
2. `Depends On`: `LAB-101`; coordinate with active `WML-304` and transport evidence
3. `Owner`: `wml-server`, `transport-rust`, `engine-wasm`, `qa`
4. `Build`:
   - define versioned `interop` case identifiers and expected HTTP, transport, decode, and engine
     outcomes;
   - add only missing first-party fixtures from the proposed matrix;
   - reuse canonical engine examples instead of copying archive-kit decks;
   - keep origin generation, transport adaptation, and engine semantics in their owning layers;
   - add exact-host and arbitrary-target negative cases.
5. `Tests`:
   - Go golden/header/status tests;
   - relevant native/WASM executable stories;
   - transport WSP/WBXML parity tests where the case crosses that boundary;
   - local Kannel smoke for stable end-to-end cases.
6. `Accept`:
   - every route has a stable identifier, documented expected outcome, and owning test;
   - WML-version and size cases name their exact fixture parameters;
   - unknown hosts and arbitrary external targets fail closed;
   - no claim exceeds the current compliance ledgers.

### LAB-102B Safe period-service gallery

1. `Status`: proposed
2. `Depends On`: `LAB-102A`; `PRE-004` before public exposure
3. `Owner`: `wml-server`, `browser`, `qa`
4. `Build`:
   - add a first-party home directory and selected synthetic Status, Dictionary, Weather, Mail,
     RSS, and Bookmark demonstrations;
   - use deterministic local data and exact routes;
   - label all accounts, messages, status, and weather as synthetic;
   - exclude guestbook/chat, arbitrary URL entry, real authentication, and external feeds.
5. `Tests`:
   - route/method denial and golden response tests;
   - body, state-count, and session-TTL bounds;
   - escaping and redaction checks;
   - packaged desktop navigation smoke after `DESK-201`.
6. `Accept`:
   - the gallery demonstrates period interaction patterns without third-party content;
   - no route can contact or control an external system;
   - public safety messaging forbids real credentials and identifies the unencrypted preview.

### ARC-001 Archive intake and rights policy

1. `Status`: proposed
2. `Depends On`: owner decision to pursue an archive lane
3. `Owner`: product, legal/rights reviewer, security, documentation
4. `Build`:
   - define source classes, required license/permission evidence, raw/deploy separation,
     transformation records, PII review, takedown process, and non-impersonation rules;
   - define rejection criteria for ambiguous, branded, executable, user-generated, and sensitive
     material;
   - define where approved research metadata lives without making external content normative.
5. `Accept`:
   - no artifact can reach a deploy tree without named rights, privacy, security, and product
     approvals;
   - clean-room reconstruction criteria are explicit;
   - completed compliance tickets are not reopened to accommodate museum content.

### ARC-002 Offline corpus acquisition and audit design

1. `Status`: proposed
2. `Depends On`: `ARC-001`
3. `Owner`: security, tooling, documentation
4. `Build`:
   - design or select supported tooling with maximum bytes/files, redirect and host policy,
     immutable per-capture paths, no-symlink writes, archive/binary scanning, structured errors,
     spreadsheet-safe reports, and reproducible tool/version records;
   - run acquisition only in an explicitly authorized, egress-restricted environment;
   - separate discovery, acquisition, quarantine, transformation, and deployment approvals.
5. `Accept`:
   - hostile paths, redirects, oversized bodies, symlinks, archive bombs, mislabeled types, and
     repeated captures have deterministic safe outcomes;
   - the workflow cannot write outside its selected quarantine root;
   - no acquired executable is run during inspection.

### ARC-003 Rights-cleared WML 1.1 compatibility pilot

1. `Status`: proposed
2. `Depends On`: `ARC-001`, `ARC-002`
3. `Owner`: product, `engine-wasm`, `wml-server`, qa
4. `Build`:
   - select one exact, independently license-cleared source artifact;
   - preserve its raw bytes outside deployable service content;
   - derive the smallest useful project fixture or clean-room reconstruction;
   - add an executable story and provenance record without claiming broader compatibility.
5. `Accept`:
   - exact source, version, hash, license, transformation, and reviewer evidence is recorded;
   - the deployed derivative contains no live endpoint, personal data, tracker, credential field,
     or executable server behavior;
   - the fixture adds coverage not already present in the canonical corpus.

### ARC-004 Public museum product and threat decision

1. `Status`: proposed
2. `Depends On`: `ARC-003`, `PRE-004`, separate hosting authorization
3. `Owner`: product, security, operations, rights reviewer
4. `Decide`:
   - local-only research collection versus publicly hosted museum;
   - domain and path separation from the first-party interoperability lab;
   - content review, moderation, logging, takedown, incident, and lifecycle ownership;
   - whether public hosting creates unacceptable impersonation or archive-service risk.
5. `Accept`:
   - a written go/no-go decision exists;
   - public hosting, if chosen, has its own threat model, runbook, disable path, and infrastructure
     scope;
   - the network-preview host is not reused by implication.

## Dependency order

```text
Existing public lab:
LAB-101 -> LAB-102A -> LAB-102B -> DESK-201/202 and QA-201 integration
                  \
                   -> reuse by later rights-cleared fixtures

Optional archive lane:
owner decision -> ARC-001 -> ARC-002 -> ARC-003 -> ARC-004
                     |          |          |          |
                  rights     tooling     pilot     museum go/no-go
```

`LAB-102A` can proceed with entirely project-authored content. It must not wait for or silently
activate the archive lane. `LAB-102B` requires the public preview's accepted data/threat policy
before exposure because it adds more stateful and account-shaped interactions.

## Implementation handoff checklist

Before starting a proposed item:

- refresh from current `origin/main` and reconcile the active public-lab and compliance plans;
- retrieve the narrowest required WML/WSP/transport context pack;
- confirm whether the item is first-party lab work or rights-governed archive work;
- identify the exact layer and contract surfaces before implementation;
- search the canonical example corpus for existing coverage;
- name fixture IDs, expected stages, size limits, and error outcomes before writing routes;
- add graph support first if the implementation begins a compliance slice not represented in the
  knowledge graph;
- preserve WML 1.3 as the compatibility target while labeling WML 1.1/1.2 cases accurately;
- avoid edits to `infra/network-preview/` unless the separately owned infrastructure task
  explicitly requests them; and
- keep all third-party acquisition and deployment disabled unless the `ARC-*` gates are accepted.

Expected verification for implemented first-party lab cases:

```sh
make lint-go
make test-go
pnpm test:story <work-item-or-spec-id>
pnpm --dir browser run contracts:check
./scripts/transport-wap-smoke.sh
```

Run only the commands relevant to the touched layers. Public network checks, cloud operations, and
external acquisition require their own explicit authorization and are not implied by this plan.

## Success criteria

This research has been incorporated successfully when:

1. the public lab covers a deliberate, machine-checkable set of historically useful behaviors;
2. new cases reuse canonical engine and transport implementations rather than duplicate them;
3. all public data and interactions are first-party, deterministic, bounded, and visibly fake;
4. unknown hosts, arbitrary destinations, real credentials, external actions, and oversized input
   fail closed;
5. WML 1.1/1.2 cases are labeled compatibility fixtures and never substitute for WML 1.3 evidence;
6. no archive-kit tool, server configuration, report, or third-party content has entered the
   runtime by convenience; and
7. any later historical museum advances through additive `ARC-*` decisions without competing with
   the public WAP service workstream.
