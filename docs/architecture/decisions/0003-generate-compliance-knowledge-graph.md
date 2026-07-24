# ADR 0003: Generate the Compliance Knowledge Graph from Canonical Manifests

Date: 2026-07-24
Status: accepted

## Context

The WAP 1.2.1 planning baseline now connects:

- authoritative source documents and effective amendment sequences;
- the selected WAP-215 Class C client profile;
- 201 selected SCR parent rows and 781 nested normative clauses;
- dependency-ordered sprints and implementation work items;
- owner layers, requirements, planned fixtures, and evidence commands.

These relationships are distributed across machine-readable manifests and
human-readable planning documents. A developer or AI agent should be able to
retrieve the bounded subgraph for one work item without loading the entire source corpus or
mistaking missing links for completed scope.

Obsidian is useful as a human explorer because its Graph view visualizes internal links between
notes, its Properties feature stores small machine-readable values in YAML, and its Bases feature
can build local database-like views over Markdown properties:

- https://obsidian.md/help/plugins/graph
- https://obsidian.md/help/properties
- https://obsidian.md/help/bases

Obsidian does not supply the project's source authority or compliance semantics. A manually
maintained vault would become a competing source of truth.

## Decision

Adopt a repository-derived knowledge graph with three generated projections.

1. Existing release, effective-spec, class-profile, SCR, normative-clause, and compliance-program
   manifests remain canonical.
2. A deterministic Node script generates a typed node/edge graph from those inputs.
3. The same graph generates an Obsidian-compatible Markdown vault for human navigation.
4. The same graph generates bounded AI context packs for a named sprint or work item.
5. Every relationship has an explicit type such as `depends-on`, `planned-by`, `refines`,
   `sourced-from`, or `verified-by`.
6. Missing direct mappings remain visible at both work-item and declared-family levels. The
   generator must not infer that a broad family assignment or a clause from another family proves
   coverage.
7. Generated artifacts contain project-authored metadata and clause synopses only. They do not
   promote or duplicate restricted source payloads.
8. Generated graph and vault artifacts are committed because they are reviewable planning
   products; drift checks compare them with canonical inputs.
9. The initial pilot is limited to `WML-2`. Later coverage is added when its implementation slice
   begins, following `docs/knowledge-graph/SLICE_ADOPTION.md`; the project will not run a separate
   speculative bulk migration.

## Why

- The repository already contains structured identifiers and relationships, so a new graph
  database would add operational cost before proving retrieval value.
- One graph builder keeps JSON, Obsidian, and AI projections semantically aligned.
- Typed edges preserve meaning that Obsidian's visual links alone cannot express.
- Bounded context packs reduce token load while retaining source, profile, dependency, fixture,
  and evidence constraints.
- Explicit gaps prevent AI agents from converting absent evidence into optimistic compliance
  claims.

## Consequences

Positive:

- developers can inspect the same dependency chain visually or as structured JSON;
- AI agents can request one reproducible context pack instead of scanning the full repository;
- source and implementation drift becomes machine-checkable;
- modern enhancements can later use typed `enhances` or `deviates-from` relations without
  replacing strict obligations.

Costs:

- generated Markdown creates many small files;
- graph schema changes require regeneration and review;
- current source mappings may expose incomplete work-item coverage that needs follow-up planning;
- Obsidian displays relationships but does not enforce their semantics.

## Rejected alternatives

### Make an Obsidian vault canonical

Rejected because hand-edited backlinks and YAML properties would duplicate the release and
compliance manifests and could silently drift from them.

### Add Neo4j, RDF, or another graph service immediately

Rejected for the pilot because the current graph fits comfortably in deterministic JSON and
local Markdown. A service may be reconsidered only if multi-hop query performance or
cross-repository federation proves that files are insufficient.

### Put every source document into AI context

Rejected because it is unbounded, expensive, and incompatible with the metadata-only
redistribution policy.

### Infer clause coverage from owner layer or source family

Rejected because broad ownership is not direct normative evidence. The `WML-2` pilot already
shows work items with family ownership but no direct nested-clause mapping.

## Acceptance conditions

- [x] The graph is generated from canonical repository manifests.
- [x] The graph uses stable, typed nodes and edges.
- [x] The pilot emits an Obsidian-compatible vault.
- [x] The pilot emits a bounded `WML-2` AI context pack.
- [x] A checker validates graph integrity and generated-artifact drift.
- [x] Work items without direct clause mappings are reported explicitly.
- [x] Incremental, implementation-coupled expansion is approved after the pilot review.
- [ ] A real implementation task uses the context pack and records whether retrieval was
      sufficient.
