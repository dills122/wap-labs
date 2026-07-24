# ADR 0004: Build a canonical-data-driven project atlas

- Status: Accepted
- Date: 2026-07-24

## Context

WAP Labs now has a deep standards corpus, an effective-spec graph, class-profile and normative
clause ledgers, a dependency-ordered compliance program, active implementation documents, and a
generated knowledge graph. Repository files remain useful to contributors and agents, but no
single surface explains the project at multiple levels of detail.

The project needs a public-facing route from:

1. product purpose and compatibility target;
2. current progress and next gates;
3. source and effective-spec provenance;
4. sprints and individual work items;
5. active long-form and graph-projected documentation.

## Decision

Build `docs-portal/` as a statically generated Astro application called **WAP Labs Atlas**.

The portal is a projection, not a new source of truth:

- source records come from `spec-processing/source-manifests/`;
- target, profile, sprint, and work-item records come from
  `docs/waves/wap-1.2.1-compliance-program.json`;
- long-form content comes from active Markdown under `docs/`;
- archive folders, archive ledgers, and date-stamped historical snapshots are excluded by default.

Stable detail routes expose sources, sprints, work items, and documents. Search and filters use
small browser-native scripts; the content remains navigable without a client framework runtime.

## Reference patterns

The design combines four primary-source patterns:

- [Astro Starlight](https://astro.build/themes/details/starlight/) for accessible documentation
  navigation and readable technical content;
- [Rust Project Goals](https://rust-lang.github.io/rust-project-goals/2026/index.html) for a clear
  path from project direction to roadmap goals and detailed tracking;
- [W3C Technical Reports](https://www.w3.org/TR/) for a searchable standards catalog with explicit
  status, dates, groups, and document history;
- [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)
  for multiple high-level and detailed views over the same underlying work items.

Custom Astro layouts are used instead of adopting Starlight wholesale because the atlas is equally
a project-status, source-provenance, and delivery-program interface. Starlight remains an option if
the long-form documentation surface later needs its full navigation or search ecosystem.

## Consequences

- Repository changes appear in the portal on the next static build.
- There is no second planning database to reconcile.
- The static output can be hosted below `/wap-labs/atlas`.
- Broken canonical schemas fail visibly at type-check or build time.
- Full-text search, graph visualization, deployment automation, and Git-history-derived progress
  are follow-on slices; they must also remain projections over canonical repository evidence.
