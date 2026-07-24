# WAP Compliance Knowledge Graph

This directory contains the human and AI projections of the repository-derived WAP compliance
knowledge graph.

The graph is not a new source of truth. Canonical facts remain in:

- `docs/waves/wap-1.2.1-compliance-program.json`;
- `spec-processing/source-manifests/wap-1.2.1-release.json`;
- `spec-processing/source-manifests/wap-1.2.1-effective-spec.json`;
- `spec-processing/source-manifests/wap-1.2.1-class-conformance.json`;
- the family SCR ledgers;
- `spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json`.

See
[`docs/architecture/decisions/0003-generate-compliance-knowledge-graph.md`](../architecture/decisions/0003-generate-compliance-knowledge-graph.md)
for the decision and boundaries.

The operational expansion policy is
[`docs/knowledge-graph/SLICE_ADOPTION.md`](SLICE_ADOPTION.md): extend the graph when a compliance
implementation slice begins, not through a separate bulk migration.

## WML-2 pilot

The pilot selects the `WML-2` compliance sprint and generates:

- `spec-processing/source-manifests/wap-1.2.1-wml-2-knowledge-graph.json`:
  typed, machine-readable nodes and edges;
- `docs/knowledge-graph/vault/`: an Obsidian-compatible Markdown vault;
- `docs/knowledge-graph/context-packs/WML-2.md`: a bounded AI context bundle.

The current graph contains the target sprint, its direct dependency/downstream sprints, five
work items, source families/documents, directly mapped SCR rows and clauses, planned fixtures,
requirements, owner layers, and legacy ticket links.

The pilot intentionally reports two gap levels:

- `WML-202`, `WML-204`, and `WML-205` do not yet have any direct nested-clause mappings;
- all five work items declare WML scope without directly mapped WML clauses, even though
  `WML-201` has WAE clauses and `WML-203` has WBXML clauses.

Broad family ownership and cross-family clauses remain valid planning context, but neither is
treated as direct clause coverage for a different family.

## Commands

Generate all committed projections:

```sh
node spec-processing/scripts/generate-wap-knowledge-graph.mjs
```

Validate graph integrity and generated drift:

```sh
node scripts/check-wap-knowledge-graph.mjs
```

Print a fresh AI context pack to standard output:

```sh
node scripts/wap-context-pack.mjs WML-2
```

For implementation or review of one pilot work item, request a focused pack:

```sh
node scripts/wap-context-pack.mjs WML-203
```

The supported retrieval targets are `WML-2` and `WML-201` through `WML-205`. A work-item target
keeps sprint dependencies and conformance governance in view while limiting work-item details,
direct obligations, mapping gaps, and source documents to the selected slice. Other targets
remain rejected until their implementation slice starts, so graph expansion is explicit and
reviewable.

## Graph contract

Every node has:

- a globally stable ID in `<type>:<key>` form;
- a stable domain key such as `WML-203` or `WBXML-C-001`;
- a controlled node type;
- a title and source-derived properties.

Every edge has:

- an ID derived from its endpoints and relationship;
- an existing `from` node;
- a controlled relationship type;
- an existing `to` node;
- one or more canonical repository source references where applicable.

The pilot relationships include:

- `contains` and `depends-on` for execution order;
- `covers-family`, `owned-by`, and `relates-to` for planning ownership;
- `planned-by` and `refines` for normative work allocation;
- `sourced-from` and `effective-document` for authority;
- `verified-by` and `maps-to` for fixture/requirement traceability;
- `selected-from`, `targets-profile`, and `requires-family` for WAP-215 profile governance.

## Obsidian use

Open `docs/knowledge-graph/vault/` as an Obsidian vault. Start at `_index.md`, then use local
Graph view around `sprints/WML-2.md` or an individual work item.

All notes in that directory are generated. Do not edit them directly. Obsidian configuration,
personal layouts, and plugin state should remain local rather than being committed with the
compliance projection.

## AI retrieval rules

The generated context pack follows four rules:

1. include the target, its direct execution neighbors, and its work items;
2. include only clauses with explicit work-item mappings;
3. include the applicable profile, source documents, fixtures, requirements, and evidence
   commands;
4. report both zero-clause and declared-family mapping gaps rather than inferring completion or
   non-applicability.

This keeps the pack bounded while retaining the information needed to challenge compliance
claims.

Codex discovers this workflow through the repository `AGENTS.md`. Claude Code discovers the same
rules through the root `CLAUDE.md`, which imports `AGENTS.md` and
`docs/agents/COMPLIANCE_CONTEXT_RETRIEVAL.md`.
