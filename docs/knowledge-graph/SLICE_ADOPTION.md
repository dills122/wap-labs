# Knowledge Graph Slice-Adoption Direction

Status: accepted

Date: 2026-07-24

## Direction

Expand the WAP compliance knowledge graph incrementally when an implementation slice begins.
Do not run a separate bulk migration of the complete compliance program.

The canonical specifications, manifests, ledgers, compliance program, source code, fixtures, and
test results remain authoritative. The graph is a generated connective and retrieval layer over
those inputs.

This rollout does not reopen the completed source/spec planning baseline for the selected WAP
1.2.1 Class C profile. It projects that baseline incrementally and can expose a mapping or
evidence gap that must be corrected before the affected slice proceeds.

The operating flow is:

```text
canonical sources and plans
  -> slice-scoped graph projection
  -> focused agent context
  -> implementation and tests
  -> recorded evidence and regenerated projection
```

## Starting a compliance slice

Before implementation begins:

1. Identify the compliance sprint and work-item IDs.
2. Confirm the selected profile, effective source order, applicable SCR parents, and nested
   normative clauses in the canonical manifests.
3. Add generator support for the sprint or work item if it is not already a supported retrieval
   target.
4. Map its source families, source documents, requirements, owner layers, planned fixtures,
   dependencies, and explicit coverage gaps.
5. Generate the graph projections and retrieve the narrowest context pack.
6. Run the graph checks and applicable family validators.

A missing relationship must remain an explicit gap. Broad family ownership, nearby work, or an
unrelated clause must not be used to infer direct coverage.

## Definition of ready

A compliance implementation slice is ready when:

- its strict or optional profile boundary is explicit;
- authoritative sources and effective amendment order are identified;
- selected obligations are mapped to work or reported as unresolved mapping gaps;
- owner layers, fixture targets, and evidence commands are present;
- a bounded sprint or work-item context pack can be generated; and
- graph and family-specific validators pass.

If the graph does not support the slice yet, making it support the slice is the first planning
subtask rather than a separate repository-wide migration project.

## Definition of done

A compliance implementation slice is not done until:

- implementation and direct fixtures are linked to the applicable obligations;
- test or inspection evidence is recorded in the canonical planning inputs;
- conservative implementation and evidence states are updated;
- generated JSON, context-pack, and Obsidian projections are refreshed;
- graph drift checks and the relevant implementation/family validators pass; and
- unresolved requirements remain visible and are not converted into optimistic completion
  claims.

## Boundaries

- Do not manually edit generated graph, context-pack, or vault artifacts.
- Do not make Obsidian or a graph database a required runtime dependency.
- Do not place the complete source corpus into routine agent context.
- Do not delay unrelated implementation to graph optional or deferred profiles that have not
  been activated.
- Activating an optional profile also activates its source, obligation, fixture, implementation,
  and release-evidence gates.

The current `WML-2` pilot is the first supported slice. Each later sprint must extend the same
schema and generators when its build-out begins.
