# Code Generation Audit and Target Standard

- Status: active architecture guidance; prioritized remediation batch landed
- Audited baseline: `origin/main` at `258454e073fb98502823fd93a28c833d577a02d3`
- Implementation checkpoint: `origin/main` at `afef6125b2808a3c2e97e8f23979a1b951a1dd7c`
- Scope: active repository paths only; archived and date-stamped historical snapshots are non-normative

## Executive Summary

WAP Labs has several useful and correctly scoped generation pipelines, but enforcement quality is
uneven. Browser transport contracts, executable-example manifests, and knowledge-graph projections
are deterministic and meaningfully drift-checked. The handwritten WaveNav TypeScript contract,
compliance-derivative generation, source-clean provenance, and Tauri-owned generated assets have
weaker source-of-truth or reproducibility controls.

At the audited baseline, the audit found three defects that existing checks did not catch:

1. `ScriptExecutionOutcome` and `ScriptInvocationOutcome` are serialized by Rust with flat
   `navigationIntent` and `requiresRefresh` fields, while the handwritten TypeScript engine contract
   and host sample expect them under `effects`. Generated wasm declarations expose these results as
   `any`, so TypeScript checks do not detect the runtime incompatibility.
2. The effective-spec generator still emits the obsolete general-WCMP interpretation for the strict
   CDPD/IP profile. Regenerating the committed artifact would overwrite its newer RFC 792 ICMP
   correction, while the existing effective-spec checker still passes.
3. The committed Docling provenance covers 48 of 52 canonical cleaned sources, contains a duplicated
   run snapshot, and is produced by a non-idempotent append path. The strict cleaned-corpus quality
   check currently fails on 43 DTD-token findings in the Wiley source.

The original broad `M1-03` engine-API generator remains non-preemptive. A narrow additive correction
for engine-owned serialized DTO generation is now justified and should be treated as the first
code-generation remediation slice.

## Implementation Checkpoint (2026-07-26)

The seven prioritized slices below have landed on current `main`. Preserve their original ordering
and acceptance criteria as audit history; use additive follow-ups for any newly discovered gaps.

| Slice                                | Landing evidence   | Current result                                                                                                    |
| ------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Engine serialized DTO parity         | `#361` / `abd99e2` | Engine-owned serialized runtime DTOs are generated and parity-tested.                                             |
| Effective-spec regeneration guard    | `#360` / `ce9564e` | Canonical regeneration is deterministic, write-free checks reject drift, and strict CDPD/IP retains RFC 792 ICMP. |
| Source-clean provenance repair       | `#359` / `7e32d86` | Docling provenance is policy-driven, complete for canonical cleaned sources, and strict checks are reproducible.  |
| Derived compliance-fact surface      | `#360` / `ce9564e` | Active counts and strict-profile claims are checked against ledger and graph data.                                |
| Tauri command-descriptor unification | `#363` / `afef612` | Rust-owned command metadata generates the client contract and rejects registration drift.                         |
| Atlas manifest schema validation     | `#362` / `01042da` | Atlas validates all four source manifests before repository projection or build.                                  |
| Icon and Tauri-schema policy         | `#363` / `afef612` | Pinned tooling, allowlisted icon outputs, and committed Tauri schemas have explicit drift policy.                 |

The broad `M1-03` facade-generator umbrella remains `todo` and non-preemptive; these landed slices
do not imply that the whole handwritten engine method facade should be generated.

## Generation Map

| Surface | Canonical source | Generator and outputs | Policy and enforcement | Audit result |
|---|---|---|---|---|
| Browser transport contract | Exported Rust types in `transport-rust` | `pnpm --dir browser run contracts:codegen`; `ts-rs` through `browser/src-tauri/src/bin/generate_contracts.rs`, followed by the TypeScript AST wrapper generator. Emits committed `transport-host.ts` and `transport.ts`. | Generated headers, CI `contracts:check`, Rust generator tests. | Deterministic; clean regeneration produced no tracked drift. |
| Browser engine-host DTOs | Host-facing Rust DTOs in `browser/src-tauri/src/contract_types.rs`, with explicit conversions from engine types | Same Rust generator; emits committed `engine-host.ts` and generated `engine.ts`. | Generated headers and CI drift check. | Deterministic, but the immediate type source is a Tauri-owned mirror rather than engine-owned serialization metadata. |
| Tauri client and host facades | Generated contract export sets plus handwritten method descriptors in `browser/scripts/generate-contract-wrappers.mjs` | Emits committed `tauri-host-client.ts`; appends `EngineHostClient` and `TransportClient`; emits thin wrapper modules. | AST output and CI drift check. | Current command inventory matches Rust registration, but correspondence is not derived or directly tested. |
| Canonical WaveNav engine API | Rust public methods and serde serialization are behavioral truth; `engine-wasm/contracts/wml-engine.ts` is handwritten | No repository generator. `wasm-bindgen` separately emits ignored package declarations whose `JsValue` results are typed as `any`. | Native/WASM behavior tests exist, but no complete serialized-shape parity check. | Material runtime contract drift exists. |
| WASM package | `engine-wasm/engine` Rust crate | `wasm-pack build --target web --out-dir ../pkg`; output is ignored. | CI pins wasm-pack `0.13.1`. | Correctly treated as build packaging, not committed source generation. Local bootstrap does not pin the same tool version. |
| Executable examples and stories | Reviewed `engine-wasm/examples/source/*.wml` metadata and optional adjacent `*.flow.json` | `pnpm --dir engine-wasm/host-sample run examples:generate`; emits committed `engine-wasm/examples/generated/examples.ts`. | Generated header, write-free `--check`, strict input validation, focused unit tests, host build and story CI. | Strong pipeline; 34 examples on the audited baseline and zero drift. |
| Docling source-clean corpus | Committed source PDFs plus the shared Docling parsing profile | Fish parsing and promotion scripts emit 52 committed cleaned Markdown files. `generate-docling-provenance.sh` emits a committed CSV and appends to a manifest. | Spec-processing policy keeps checks manual. Tool version is not pinned. | Provenance incomplete and duplicate; strict quality check fails. |
| Release, class, and ingestion locks | Official archive/PDFs, private text extractions or external cache, and explicit dates | Node generators emit committed release, class, ingestion, and external-ingestion JSON. | Hash and size locks; invariant checkers; optional private-cache rehashing. | Strong provenance fields, but private inputs prevent clean-checkout regeneration. |
| SCR ledgers | Hash-locked private source text plus project-authored interpretation and evidence mappings | Family generators emit committed WML, WAE, WBXML, WMLScript, WMLScript libraries, caching, WDP, WCMP, and WSP ledgers. | Family and aggregate invariant checkers. | Current checkers pass. Generator code contains reviewable human interpretation as well as extraction logic and has little direct unit coverage. |
| Effective-spec graph | Release manifest plus generator-owned family policy | `node spec-processing/scripts/generate-wap-effective-spec.mjs`; emits committed `wap-1.2.1-effective-spec.json`. | Structural checker only. | Generator and committed artifact disagree on strict WCMP semantics. |
| Selected clauses and successor delta | SCR/class/program manifests plus private source text or committed successor PDFs | Generators emit committed selected-clause and successor-delta JSON with explicit provenance. | Dedicated invariant checkers. | Current checks pass; successor delta regenerated without drift. |
| Knowledge graphs, context packs, and Obsidian vaults | Compliance program and canonical release/effective/class/SCR/clause/delta manifests | `generate-wap-knowledge-graph.mjs` emits two committed graphs, two committed broad context packs, and 766 committed vault notes. | Input hashes, deterministic ordering, complete file-inventory comparison, safe stale-note cleanup, generated markers, and CI check. | Strongest repository generation pipeline; zero drift. |
| Focused context packs | Generated graph | `node scripts/wap-context-pack.mjs <target>` prints a focused pack; output is not committed. | Narrow supported target set and graph checks. | Appropriate ephemeral generation. |
| Project Atlas | Active Markdown and four committed JSON manifests | Astro reads repository inputs directly at build time and emits ignored `docs-portal/dist`. | `astro check`, static build, graph validation, and transport-evidence validation in CI. | Documentation assembly rather than canonical code generation. Input types are handwritten casts without runtime schema validation. |
| Tauri schemas | Tauri configuration, capabilities, and dependency versions | `tauri_build::build()` refreshes four committed files under `browser/src-tauri/gen/schemas`. | No dedicated command, generated header, or scoped diff check. | Tool-owned output with weak repository policy and historical dependency-driven churn. |
| Application icons | `browser/src-tauri/icons/waves.svg` | `pnpm --dir browser run tauri:icons`; six derived binaries are committed. | Documented command only. | PNG and ICO outputs matched; `icon.icns` differed across consecutive same-tool runs, and the current CLI emits many additional undocumented files. |
| Coordinated repository version | Root `VERSION` | `node scripts/set-release-version.mjs <semver>` updates managed package, Cargo, lock, and Tauri files. | `version:check` in CI. | Correctly centralized and currently consistent. |

The 19 JSON files in `spec-processing/source-manifests` comprise 18 generated artifacts and the
handwritten `wap-1.2.1-external-dependencies.json` authority ledger. The compliance program is also
handwritten canonical planning data rather than generator output.

Fixtures, golden expectations, lockfiles, formatting, coverage output, `.codex` symlink setup, and
static-site/WASM build products are not code generation for the purposes of this policy.

## Findings

### P1: Engine TypeScript contract is wrong at runtime

`engine-wasm/contracts/wml-engine.ts` defines both script outcomes with a nested `effects` object.
`engine-wasm/engine/src/engine_script_types.rs` serializes `navigationIntent` and `requiresRefresh`
as flat camel-case fields. The WASM bindings use `serde_wasm_bindgen::to_value`, so no adapter adds
the missing nesting.

The host sample dereferences `outcome.effects.requiresRefresh` and
`outcome.effects.navigationIntent`. A direct WASM probe returned the flat keys and no `effects`
property. The generated wasm declaration types these results as `any`, allowing TypeScript and Vite
builds to pass. Rust WASM tests pin the flat representation, so this is a stale handwritten
cross-language contract rather than ambiguous runtime behavior.

Impact is concentrated in direct WASM script-invocation consumers rather than the native Tauri
browser path, but affected consumers can fail with a runtime `TypeError`.

### P1: Effective-spec regeneration would undo the strict WCMP correction

The committed WCMP family correctly states that strict CDPD/IP uses RFC 792 ICMP as required by
WAP-202 section 5.3. The generator still emits the previous general-WCMP interpretation. Running it
produced tracked semantic drift, but every existing effective-spec, transport, graph, and evidence
checker still passed.

The same obsolete statement remains in repeated WDP/WSP notes and active source-manifest prose.
This is a Class C evidence-integrity risk and demonstrates that structural snapshot checks are not
equivalent to generator reproducibility checks.

### P1/P2: Source-clean provenance is incomplete and non-idempotent

The canonical cleaned corpus contains 52 files, while the provenance CSV contains 48 rows. The four
unrecorded files are the WAP 2.0 WSP source, WTLS base source, `WAP.cleaned.md`, and the Wiley
technical brief. The manifest contains the same `2026-03-02` snapshot twice.

The generator overwrites a date-named CSV but unconditionally appends another Markdown section. A
rerun with the same date is therefore not idempotent and produces contradictory append-only
history. Docling itself is installed without a version constraint. The current strict quality check
also exits nonzero on 43 DTD-token findings in the Wiley source; those findings need an explicit
correction or reviewed allowlist disposition.

### P2: Generated truth and active prose repeatedly diverge

The generated WML-2 graph records 177 direct clauses for WML-201. Multiple active documents still
state 174, including engine work items, the knowledge-graph README, the source-manifest README, and
the specification coverage matrix. Recent history contains repeated manual planning/documentation
sync commits, demonstrating that volatile counts embedded across narrative files are a current
maintenance cost.

PR #345 is useful as the latest planning checkpoint but cannot establish present generated counts
or runtime correctness. Canonical manifests and executable checks remain authoritative.

### P2: Compliance checks often validate snapshots rather than generators

All audited compliance checkers passed. Most validate internal consistency, hashes, mappings, and
summary counts in the committed artifact. They do not reconstruct the output from generator inputs.

Full CI regeneration is inappropriate for ledgers that require private extracted text. Repo-only
derivatives such as effective spec and knowledge graphs can support write-free generation checks
without violating the metadata-only source policy.

### P2: Tauri command metadata remains duplicated

The registered Rust command list, the generated Tauri client descriptor, and the generated
`EngineHostClient` method list currently agree. They remain three hand-maintained inventories.
`contracts:check` proves deterministic reproduction of the JavaScript tables but not correspondence
with registered Rust commands or their signatures.

### P2/P3: Tool-owned binaries and schemas lack a stable policy

Tauri CLI `2.10.0` reproduced the committed PNG and ICO files. `icon.icns` differed between two
consecutive regenerations and from the committed file. The documented command also generated
additional Windows, iOS, and Android assets that are not committed or described.

Local bootstrap installs `tauri-cli` using `^2.0`, so output scope may change without a repository
change. Tauri-generated schemas similarly have no generated markers, explicit regeneration command,
or dedicated drift check. Contract codegen may refresh them through the Tauri build script while
excluding them from its final scoped diff.

### P3: Toolchain ergonomics are inconsistent

`.nvmrc` pins Node `22.21.1`, some active instructions refer to `22.22.1`, and CI floats Node `22`.
The audit initially found a Node 16 shell executing a pnpm installation from a Node 22 environment,
which failed before generator startup. `init-refresh.sh` verifies only command presence, not the
supported version.

CI pins wasm-pack `0.13.1`; local bootstrap installs unspecified latest. These are contributor
reproducibility issues rather than layer-boundary defects, but they make generation failures harder
to distinguish from code drift.

## M1-03 Decision

The broad `M1-03` proposal to generate the complete engine API and facade should remain
non-preemptive. Generating every method and target-specific adapter would create substantial churn
and could hide the intentionally different native/WASM boundary.

The narrower serialized-data problem is activated now. Its concrete activation evidence is:

- a Rust serde DTO changed shape;
- the handwritten TypeScript contract did not follow;
- a real consumer compiled successfully but can fail at runtime;
- current parity, build, and contract checks did not detect it.

Keep `M1-03` as an umbrella/design item and add a scoped corrective follow-up for engine-owned
serialized DTO generation. Track Tauri command-descriptor unification separately. Do not rewrite
completed `M1-23`; it remains useful evidence that small extensions to the existing Rust/TypeScript
pipeline are effective.

## Target Architecture and Policy

Use three one-way generator families:

1. Contract family:
   `engine/transport Rust serialization metadata -> generated wire DTOs -> explicit host adapters`.
2. Evidence family:
   `hash-locked source evidence -> canonical ledgers -> selected clauses -> graph/context/vault -> validated Atlas views`.
3. Content/package family:
   `reviewed WML/flow sources -> example index` and
   `canonical SVG -> pinned packaging assets`.

Every committed generated artifact should provide, as applicable:

- generator identity;
- canonical input paths and hashes;
- schema version;
- an explicit do-not-edit marker or documented equivalent for formats that cannot contain comments;
- a write-free check mode;
- deterministic ordering;
- stale-file inventory validation for multi-file outputs;
- a pinned runtime/tool version when bytes or output inventory depend on that tool.

Generated contracts, example manifests, graphs, context packs, and vault notes should be marked
`linguist-generated=true` in `.gitattributes` to improve reviewability without changing ownership.

Do not centralize all implementations into one generator. Keep generators layer-local and add a
small root orchestration command only for invoking their supported checks.

## Prioritized Implementation Slices

### 1. Engine serialized DTO parity (`P1`, medium)

Generate only serde-visible engine payload types from engine-owned Rust metadata. Keep the method
facade and native/WASM boundary documentation handwritten.

Acceptance criteria:

- `ScriptExecutionOutcome` and `ScriptInvocationOutcome` have one serialized source of truth.
- A JS/WASM test asserts exact runtime keys and representative union variants.
- Covered payloads no longer cross the host boundary as unchecked `any`, or an explicit typed
  boundary validates them before use.
- Changing a Rust field without regenerating fails CI.

Verification target:

```sh
cd engine-wasm/engine && cargo test
wasm-pack build --target web --out-dir ../pkg
pnpm --dir engine-wasm/host-sample run contracts:check
pnpm --dir engine-wasm/host-sample run typecheck
pnpm --dir engine-wasm/host-sample run build
pnpm test:story host-sample
```

### 2. Effective-spec regeneration guard (`P1`, small)

Make strict transport selection structured and generator-owned. Avoid repeating one prose
interpretation independently in WDP, WCMP, and WSP entries. Add a non-writing `--check` path.

Acceptance criteria:

- Regeneration preserves RFC 792 ICMP for strict CDPD/IP.
- Two consecutive generations are byte-identical.
- A stale output or stale strict-profile selection fails the checker.
- Dependent graph input hashes and projections regenerate cleanly.

Verification target:

```sh
node spec-processing/scripts/generate-wap-effective-spec.mjs --check
node spec-processing/scripts/check-wap-effective-spec.mjs
node scripts/check-wap-transport-conformance-ledgers.mjs
node spec-processing/scripts/generate-wap-knowledge-graph.mjs --check
pnpm wap-graph:check
git diff --exit-code
```

### 3. Source-clean provenance repair (`P1/P2`, medium)

Pin Docling, reconcile all canonical cleaned sources, and make snapshot creation collision-safe.

Acceptance criteria:

- Every canonical cleaned source has exactly one current provenance record.
- A duplicate date/run identifier refuses to append unless operating in exact verification mode.
- Tool version, profile, and input/output hashes are recorded.
- All current DTD-token findings receive a reviewed disposition.
- The strict quality check passes.

Verification target:

```sh
./spec-processing/scripts/check-docling-cleaned-quality.sh --strict
./spec-processing/scripts/generate-docling-provenance.sh --check YYYY-MM-DD
git diff --exit-code -- \
  spec-processing/source-material/parsed-markdown/docling-cleaned \
  docs/waves/provenance \
  docs/waves/SOURCE_CLEAN_PROVENANCE_MANIFEST.md
```

### 4. Derived compliance-fact surface (`P2`, medium)

Generate one compact active compliance summary from graph/ledger data, or remove volatile counts
from narrative documents and link to Atlas/graph. Do not generate whole narrative documents.

Acceptance criteria:

- Volatile direct-clause and evidence counts have one machine-derived publication point.
- Active documentation cannot assert contradictory counts or strict-profile selections.
- Archive paths and date-stamped historical snapshots remain excluded from enforcement.
- Atlas renders the same validated values.

Verification target:

```sh
pnpm wap-graph:check
node scripts/check-requirement-status-drift.mjs
node scripts/check-active-compliance-facts.mjs
pnpm --dir docs-portal run build
```

### 5. Tauri command-descriptor unification (`P2`, medium)

Use one typed descriptor to drive registered command names, generated Tauri client methods, and
`EngineHostClient`. First remove duplicate JavaScript tables; then move the canonical descriptor to
the Rust host boundary if that remains simpler and more reviewable than a parity-only check.

Acceptance criteria:

- Adding or removing a command in one canonical registry updates all generated client surfaces.
- A registered command without generated client metadata fails.
- Request and response shapes remain generated from Rust DTOs.
- No rendering or WML runtime semantics enter the host descriptor.

Verification target:

```sh
cargo test --manifest-path browser/src-tauri/Cargo.toml --bin generate_contracts
pnpm --dir browser run contracts:check
pnpm --dir browser/frontend run typecheck
cargo test --manifest-path browser/src-tauri/Cargo.toml --lib
```

### 6. Atlas manifest schema validation (`P2/P3`, medium)

Introduce runtime JSON Schema or equivalent validation for Atlas's four JSON inputs. Generating
TypeScript types from those schemas is optional; input validation is the primary requirement.

Acceptance criteria:

- Unknown schema versions, missing required fields, and invalid types fail before page generation.
- Atlas no longer relies solely on `JSON.parse(...) as T`.
- No copied Atlas data files are generated.

Verification target:

```sh
pnpm --dir docs-portal run check
pnpm --dir docs-portal run test:data
pnpm --dir docs-portal run build
```

### 7. Icon and Tauri-schema generation policy (`P3`, small/medium)

Pin Tauri CLI exactly and define whether derived platform assets are committed or generated only at
release time. Do not use raw ICNS byte equality until the selected encoder is deterministic.

Acceptance criteria:

- The icon command produces an allowlisted output set and leaves no extra files.
- Deterministic PNG/ICO outputs are checked.
- ICNS is either produced deterministically, semantically validated, or generated only during a
  pinned release build.
- Tauri schema refresh is documented and either drift-checked or explicitly tool-owned and ignored.

## Dependency Order and Conflict Risks

- Lane A: engine DTO parity, followed by Tauri command-descriptor work. Serialize these if both
  touch browser contract generation, package tasks, or CI.
- Lane B: effective-spec generator guard, followed by derived compliance-fact cleanup. One owner
  should handle graph regeneration because graph provenance and 766 vault notes create a large
  merge-conflict surface.
- Lane C: provenance repair is independent of runtime and browser work. It can run in parallel if
  it avoids the compliance program and source-manifest README.
- Lane D: Atlas validation can begin independently but should finalize after effective-spec schema
  assumptions settle.
- Lane E: icon/schema policy is browser-local and parallel-safe unless the Tauri command slice also
  changes `browser/package.json` or browser CI.

Highest-conflict files and paths:

- `browser/scripts/generate-contract-wrappers.mjs`
- `browser/package.json`
- `.github/workflows/ci.yml`
- `spec-processing/source-manifests/wap-1.2.1-effective-spec.json`
- `spec-processing/scripts/generate-wap-knowledge-graph.mjs`
- `docs/knowledge-graph/**`
- active compliance summary documents

## Where Code Generation Should Not Be Added

- Do not generate WML parser, runtime, navigation, focus, script, or layout behavior. Native/WASM
  parity comes from shared Rust implementation and direct tests.
- Keep `browser/contracts/transport-app.ts` handwritten; it is host application/session state, not
  a transport wire contract.
- Keep small Rust-to-host conversions explicit. Generated conversion logic would conceal policy.
- Keep WML decks, executable flow actions, and expected outcomes human-authored. Generating
  expectations from the implementation would make tests self-confirming.
- Do not generate compliance assessments or evidence claims from symbol names. Those are reviewed
  judgments; generate projections and validate references instead.
- Keep transport and engine fixtures independently source-derived. Only indexes or schemas should
  be generated.
- Do not generate Atlas page layout or narrative prose.
- Do not introduce a second contract generator alongside `ts-rs`, `wasm_bindgen`, and the existing
  TypeScript AST wrapper pipeline.
- Treat lockfiles, compiler outputs, WASM bundles, static-site output, snapshots, and formatting as
  packaging or tool output rather than repository code generation.

## Audit Verification Record

Passed on the audited baseline:

```sh
pnpm --dir browser run contracts:check
cargo test --manifest-path browser/src-tauri/Cargo.toml --bin generate_contracts
pnpm --dir engine-wasm/host-sample run examples:generate
pnpm --dir engine-wasm/host-sample run examples:check
pnpm --dir engine-wasm/host-sample run test:story:unit
pnpm --dir engine-wasm/host-sample run build
node spec-processing/scripts/generate-wap-knowledge-graph.mjs
pnpm wap-graph:check
node spec-processing/scripts/generate-wap-delta-register.mjs --recorded-on 2026-07-25
pnpm --dir docs-portal run build
pnpm run version:check
```

Release, effective-spec, class, ingestion, external-ingestion, compliance-program, aggregate
conformance, selected-clause, WAE, WBXML, WMLScript, caching, transport, delta,
external-dependency, requirement-status, source-corpus, and worklist checkers also passed.

Expected audit findings:

```sh
node spec-processing/scripts/generate-wap-effective-spec.mjs
# Produced tracked semantic drift; the audit-only change was restored.

./spec-processing/scripts/check-docling-cleaned-quality.sh --strict
# Exited 2 on 43 DTD-token findings.
```

WASM compilation succeeded and emitted an ignored package, but the local wasm-pack `0.14.0`
invocation exited while trying to install a fallback tool under the audit sandbox. The emitted
package was sufficient for a read-only runtime-shape probe that confirmed the flat script-outcome
fields.

Icon generation was run twice into temporary directories. PNG and ICO results matched; ICNS
results differed across consecutive runs.

No implementation, generated artifact, planning status, or public documentation was modified by
the audit itself.
