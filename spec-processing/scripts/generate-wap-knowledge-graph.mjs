#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const KNOWLEDGE_GRAPH_OUTPUT =
  'spec-processing/source-manifests/wap-1.2.1-wml-2-knowledge-graph.json';
export const CONTEXT_PACK_OUTPUT = 'docs/knowledge-graph/context-packs/WML-2.md';
export const OBSIDIAN_VAULT_OUTPUT = 'docs/knowledge-graph/vault';

const INPUT_PATHS = {
  classConformance: 'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
  clauses: 'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json',
  effectiveSpec: 'spec-processing/source-manifests/wap-1.2.1-effective-spec.json',
  program: 'docs/waves/wap-1.2.1-compliance-program.json',
  release: 'spec-processing/source-manifests/wap-1.2.1-release.json'
};

const NODE_FOLDERS = {
  clause: 'clauses',
  fixture: 'fixtures',
  'legacy-ticket': 'legacy-tickets',
  'owner-layer': 'owner-layers',
  profile: 'profiles',
  requirement: 'requirements',
  'scr-row': 'scr-rows',
  'source-document': 'source-documents',
  'source-family': 'source-families',
  sprint: 'sprints',
  'work-item': 'work-items'
};

function readInput(root, relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  return {
    data: JSON.parse(source),
    sha256: crypto.createHash('sha256').update(source).digest('hex')
  };
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function compact(value) {
  if (Array.isArray(value)) {
    return value.map(compact);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, compact(item)])
  );
}

function countBy(values) {
  const counts = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))
  );
}

function nodeId(type, key) {
  return `${type}:${key}`;
}

function safeFilename(value) {
  return value.replaceAll('/', '__').replaceAll('\\', '__');
}

function markdownList(values) {
  if (!values?.length) {
    return '- None';
  }
  return values.map((value) => `- ${value}`).join('\n');
}

function codeList(values) {
  return markdownList(values.map((value) => `\`${value}\``));
}

function parseArgs(argv) {
  const result = {
    check: false,
    target: 'WML-2'
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') {
      result.check = true;
      continue;
    }
    if (argument === '--target') {
      result.target = argv[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return result;
}

export function buildKnowledgeGraph(root = process.cwd(), targetId = 'WML-2') {
  if (targetId !== 'WML-2') {
    throw new Error(`The pilot currently supports WML-2 only; received ${targetId}`);
  }

  const inputs = Object.fromEntries(
    Object.entries(INPUT_PATHS).map(([key, relativePath]) => [
      key,
      {
        relativePath,
        ...readInput(root, relativePath)
      }
    ])
  );
  const program = inputs.program.data;
  const effectiveSpec = inputs.effectiveSpec.data;
  const release = inputs.release.data;
  const classConformance = inputs.classConformance.data;
  const clauseManifest = inputs.clauses.data;
  const targetSprint = program.sprints.find((sprint) => sprint.id === targetId);
  if (!targetSprint) {
    throw new Error(`Unknown compliance-program sprint: ${targetId}`);
  }

  const targetWorkItemIds = new Set(targetSprint.workItems.map((workItem) => workItem.id));
  const allClauses = clauseManifest.families.flatMap((family) =>
    family.clauses.map((clause) => ({
      ...clause,
      manifestFamily: family.family
    }))
  );
  const selectedClauses = allClauses.filter((clause) =>
    clause.mapping.workItems.some((workItem) => targetWorkItemIds.has(workItem))
  );
  const selectedParentIds = new Set(selectedClauses.flatMap((clause) => clause.parentRows));
  const selectedParents = clauseManifest.families.flatMap((family) =>
    family.parents
      .filter((parent) => selectedParentIds.has(parent.id))
      .map((parent) => ({
        ...parent,
        family: family.family
      }))
  );
  const familyIds = new Set([
    ...targetSprint.workItems.flatMap((workItem) => workItem.sourceFamilies),
    ...selectedClauses.map((clause) => clause.family)
  ]);
  const effectiveFamilies = new Map(
    effectiveSpec.families.map((family) => [family.family, family])
  );
  const releaseMembers = new Map(release.members.map((member) => [member.documentId, member]));
  const nodes = new Map();
  const edges = new Map();

  function addNode(type, key, title, properties = {}) {
    const id = nodeId(type, key);
    const node = compact({
      id,
      key,
      type,
      title,
      properties
    });
    const existing = nodes.get(id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(node)) {
      throw new Error(`Conflicting node definitions for ${id}`);
    }
    nodes.set(id, node);
    return id;
  }

  function addEdge(from, relation, to, sourceRefs = []) {
    const id = `${from}|${relation}|${to}`;
    const edge = compact({
      id,
      from,
      relation,
      to,
      sourceRefs: sortedUnique(sourceRefs)
    });
    const existing = edges.get(id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(edge)) {
      throw new Error(`Conflicting edge definitions for ${id}`);
    }
    edges.set(id, edge);
    return id;
  }

  const programRef = INPUT_PATHS.program;
  const clauseRef = INPUT_PATHS.clauses;
  const effectiveRef = INPUT_PATHS.effectiveSpec;
  const releaseRef = INPUT_PATHS.release;
  const classRef = INPUT_PATHS.classConformance;
  const targetSprintNode = addNode('sprint', targetSprint.id, targetSprint.title, {
    status: targetSprint.status,
    goal: targetSprint.goal,
    dependsOn: targetSprint.dependsOn,
    exitGates: targetSprint.exitGates,
    source: programRef
  });

  const adjacentSprintIds = new Set(targetSprint.dependsOn);
  for (const sprint of program.sprints) {
    if (sprint.dependsOn.includes(targetSprint.id)) {
      adjacentSprintIds.add(sprint.id);
    }
  }
  for (const sprintId of adjacentSprintIds) {
    const sprint = program.sprints.find((candidate) => candidate.id === sprintId);
    if (!sprint) {
      throw new Error(`${targetSprint.id}: unknown sprint dependency ${sprintId}`);
    }
    addNode('sprint', sprint.id, sprint.title, {
      status: sprint.status,
      goal: sprint.goal,
      source: programRef
    });
  }
  for (const dependency of targetSprint.dependsOn) {
    addEdge(targetSprintNode, 'depends-on', nodeId('sprint', dependency), [programRef]);
  }
  for (const sprint of program.sprints) {
    if (sprint.dependsOn.includes(targetSprint.id)) {
      addEdge(nodeId('sprint', sprint.id), 'depends-on', targetSprintNode, [programRef]);
    }
  }

  const selectedProgramProfile = program.profiles.find(
    (profile) => profile.id === 'class-c-data-client'
  );
  if (!selectedProgramProfile) {
    throw new Error('Missing selected class-c-data-client program profile');
  }
  const profileKey = classConformance.selectedTarget.identifier;
  const profileNode = addNode('profile', profileKey, 'WAP-215 Class C data client', {
    status: selectedProgramProfile.status,
    role: selectedProgramProfile.role,
    summary: selectedProgramProfile.summary,
    deviceRole: classConformance.selectedTarget.deviceRole,
    deviceClass: classConformance.selectedTarget.deviceClass,
    requirementExpressions: classConformance.selectedTarget.requirementExpressions,
    effectiveFamilies: classConformance.selectedTarget.effectiveFamilies,
    sourceDocumentId: classConformance.authority.documentId,
    source: classRef
  });
  addEdge(targetSprintNode, 'targets-profile', profileNode, [programRef, classRef]);

  const classDocumentNode = addNode(
    'source-document',
    classConformance.authority.documentId,
    classConformance.authority.title,
    {
      family: 'conformance-governance',
      publicationStatus: classConformance.authority.publicationStatus,
      publishedOn: classConformance.authority.approvedOn,
      authorityUrl: classConformance.authority.sourceUrl,
      sha256: classConformance.authority.sha256,
      repositoryState: classConformance.authority.repositoryState,
      source: classRef
    }
  );
  addEdge(profileNode, 'selected-from', classDocumentNode, [classRef]);

  for (const familyId of [...familyIds].sort()) {
    const family = effectiveFamilies.get(familyId);
    addNode(
      'source-family',
      familyId,
      family?.title ?? familyId,
      family
        ? {
            sourceClass: family.sourceClass,
            targetDisposition: family.targetDisposition,
            ownerLayers: family.ownerLayers,
            completeness: family.completeness,
            effectiveSequence: family.effectiveSequence,
            source: effectiveRef
          }
        : {
            targetDisposition: 'strict-supporting',
            source: releaseRef
          }
    );
    if (classConformance.selectedTarget.effectiveFamilies.includes(familyId)) {
      addEdge(profileNode, 'requires-family', nodeId('source-family', familyId), [classRef]);
    }
  }

  for (const familyId of [...familyIds].sort()) {
    const family = effectiveFamilies.get(familyId);
    if (!family) {
      continue;
    }
    for (const document of family.documents) {
      const releaseMember = releaseMembers.get(document.documentId);
      const documentNode = addNode(
        'source-document',
        document.documentId,
        releaseMember?.title ?? document.filename,
        {
          family: familyId,
          filename: document.filename,
          role: document.documentRole,
          publicationStatus: document.publicationStatus,
          publishedOn: document.publishedOn,
          sha256: document.sha256,
          localState: document.localState,
          authorityUrl: releaseMember?.individualSourceUrl,
          source: effectiveRef
        }
      );
      addEdge(nodeId('source-family', familyId), 'effective-document', documentNode, [
        effectiveRef
      ]);
    }
    for (const relationship of family.relationships) {
      if (
        nodes.has(nodeId('source-document', relationship.from)) &&
        nodes.has(nodeId('source-document', relationship.to))
      ) {
        addEdge(
          nodeId('source-document', relationship.from),
          relationship.type,
          nodeId('source-document', relationship.to),
          [effectiveRef]
        );
      }
    }
  }

  if (familyIds.has('associated-assets')) {
    for (const asset of release.associatedAssets.filter(
      (candidate) => candidate.targetDisposition === 'strict-baseline'
    )) {
      const assetNode = addNode('source-document', asset.id, asset.title, {
        family: 'associated-assets',
        role: 'associated-asset',
        targetDisposition: asset.targetDisposition,
        retrievalState: asset.retrievalState,
        redistributionStatus: asset.redistributionStatus,
        sha256: asset.sha256,
        authorityUrl: asset.sourceUrl,
        source: releaseRef
      });
      addEdge(nodeId('source-family', 'associated-assets'), 'effective-document', assetNode, [
        releaseRef
      ]);
    }
  }

  for (const workItem of targetSprint.workItems) {
    const workItemNode = addNode('work-item', workItem.id, workItem.outputs[0], {
      status: workItem.status,
      ownerLayers: workItem.ownerLayers,
      sourceFamilies: workItem.sourceFamilies,
      existingTickets: workItem.existingTickets,
      outputs: workItem.outputs,
      acceptance: workItem.acceptance,
      evidence: workItem.evidence,
      source: programRef
    });
    addEdge(targetSprintNode, 'contains', workItemNode, [programRef]);
    for (const family of workItem.sourceFamilies) {
      addEdge(workItemNode, 'covers-family', nodeId('source-family', family), [programRef]);
    }
    for (const layer of workItem.ownerLayers) {
      const layerNode = addNode('owner-layer', layer, layer, {
        source: programRef
      });
      addEdge(workItemNode, 'owned-by', layerNode, [programRef]);
    }
    for (const ticket of workItem.existingTickets) {
      const ticketNode = addNode('legacy-ticket', ticket, ticket, {
        source: programRef
      });
      addEdge(workItemNode, 'relates-to', ticketNode, [programRef]);
    }
  }

  for (const parent of selectedParents) {
    const parentNode = addNode('scr-row', parent.id, parent.feature, {
      family: parent.family,
      referencedSection: parent.referencedSection,
      sourceAnchor: parent.sourceAnchor,
      implementationStatus: parent.implementationStatus,
      ownerLayers: parent.ownerLayers,
      workItems: parent.workItems,
      source: clauseRef
    });
    addEdge(parentNode, 'belongs-to', nodeId('source-family', parent.family), [clauseRef]);
    for (const workItem of parent.workItems.filter((candidate) =>
      targetWorkItemIds.has(candidate)
    )) {
      addEdge(parentNode, 'planned-by', nodeId('work-item', workItem), [clauseRef]);
    }
  }

  for (const clause of selectedClauses) {
    const clauseNode = addNode('clause', clause.id, clause.obligationSynopsis, {
      family: clause.family,
      parentRows: clause.parentRows,
      sourceAnchor: clause.sourceAnchor,
      normativeForce: clause.normativeForce,
      obligationLevel: clause.obligationLevel,
      obligationSynopsis: clause.obligationSynopsis,
      workItems: clause.mapping.workItems,
      ownerLayers: clause.mapping.ownerLayers,
      requirementIds: clause.mapping.requirementIds,
      implementationStatus: clause.mapping.clauseImplementationStatus,
      evidenceGate: clause.mapping.evidenceGate,
      source: clauseRef
    });
    for (const workItem of clause.mapping.workItems.filter((candidate) =>
      targetWorkItemIds.has(candidate)
    )) {
      addEdge(clauseNode, 'planned-by', nodeId('work-item', workItem), [clauseRef]);
    }
    for (const parent of clause.parentRows) {
      addEdge(clauseNode, 'refines', nodeId('scr-row', parent), [clauseRef]);
    }
    const sourceDocumentId = clause.sourceAnchor.documentId;
    if (!nodes.has(nodeId('source-document', sourceDocumentId))) {
      const releaseMember = releaseMembers.get(sourceDocumentId);
      addNode('source-document', sourceDocumentId, releaseMember?.title ?? sourceDocumentId, {
        family: clause.family,
        filename: releaseMember?.filename,
        publicationStatus: releaseMember?.publicationStatus,
        publishedOn: releaseMember?.publishedOn,
        sha256: releaseMember?.sha256,
        authorityUrl: releaseMember?.individualSourceUrl,
        source: releaseRef
      });
    }
    addEdge(clauseNode, 'sourced-from', nodeId('source-document', sourceDocumentId), [clauseRef]);
    const fixtureNode = addNode('fixture', clause.fixturePlan.id, clause.fixturePlan.assertion, {
      kind: clause.fixturePlan.kind,
      status: clause.fixturePlan.status,
      assertion: clause.fixturePlan.assertion,
      source: clauseRef
    });
    addEdge(clauseNode, 'verified-by', fixtureNode, [clauseRef]);
    for (const requirement of clause.mapping.requirementIds) {
      const requirementNode = addNode('requirement', requirement, requirement, {
        source: clauseRef
      });
      addEdge(clauseNode, 'maps-to', requirementNode, [clauseRef]);
    }
  }

  const orderedNodes = [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id));
  const orderedEdges = [...edges.values()].sort((left, right) => left.id.localeCompare(right.id));
  const directClauseCountsByWorkItem = Object.fromEntries(
    targetSprint.workItems.map((workItem) => [
      workItem.id,
      orderedEdges.filter(
        (edge) =>
          edge.relation === 'planned-by' &&
          edge.to === nodeId('work-item', workItem.id) &&
          edge.from.startsWith('clause:')
      ).length
    ])
  );
  const directClauseFamiliesByWorkItem = Object.fromEntries(
    targetSprint.workItems.map((workItem) => [
      workItem.id,
      sortedUnique(
        orderedEdges
          .filter(
            (edge) =>
              edge.relation === 'planned-by' &&
              edge.to === nodeId('work-item', workItem.id) &&
              edge.from.startsWith('clause:')
          )
          .map((edge) => nodes.get(edge.from)?.properties.family)
          .filter(Boolean)
      )
    ])
  );
  const normativeFamilyIds = new Set(clauseManifest.families.map((family) => family.family));
  const unmappedNormativeFamiliesByWorkItem = Object.fromEntries(
    targetSprint.workItems
      .map((workItem) => [
        workItem.id,
        workItem.sourceFamilies
          .filter((family) => normativeFamilyIds.has(family))
          .filter((family) => !directClauseFamiliesByWorkItem[workItem.id].includes(family))
          .sort((left, right) => left.localeCompare(right))
      ])
      .filter(([, families]) => families.length > 0)
  );
  const workItemsWithoutDirectClauses = Object.entries(directClauseCountsByWorkItem)
    .filter(([, count]) => count === 0)
    .map(([id]) => id);

  return {
    schemaVersion: 1,
    graphId: 'wap-1.2.1-wml-2-pilot',
    target: {
      release: program.target.release,
      markup: program.target.markup,
      profile: profileKey,
      sprint: targetSprint.id,
      compatibilityFloor: program.target.compatibilityFloor
    },
    generatedFrom: {
      recordedOn: clauseManifest.generatedFrom.recordedOn,
      generator: 'spec-processing/scripts/generate-wap-knowledge-graph.mjs',
      inputs: Object.fromEntries(
        Object.values(inputs)
          .map((input) => [
            input.relativePath,
            {
              sha256: input.sha256
            }
          ])
          .sort(([left], [right]) => left.localeCompare(right))
      ),
      policy:
        'Canonical manifests remain authoritative; this graph and its Obsidian/context projections are generated views.'
    },
    summary: {
      nodeCount: orderedNodes.length,
      edgeCount: orderedEdges.length,
      nodesByType: countBy(orderedNodes.map((node) => node.type)),
      edgesByRelation: countBy(orderedEdges.map((edge) => edge.relation)),
      directClauseCountsByWorkItem,
      directClauseFamiliesByWorkItem,
      unmappedNormativeFamiliesByWorkItem,
      workItemsWithoutDirectClauses
    },
    nodes: orderedNodes,
    edges: orderedEdges
  };
}

function edgesFor(graph, node, direction) {
  const field = direction === 'outgoing' ? 'from' : 'to';
  return graph.edges.filter((edge) => edge[field] === node.id);
}

function findNode(graph, id) {
  const node = graph.nodes.find((candidate) => candidate.id === id);
  if (!node) {
    throw new Error(`Graph references missing node ${id}`);
  }
  return node;
}

function vaultNotePath(node) {
  const folder = NODE_FOLDERS[node.type];
  if (!folder) {
    throw new Error(`No Obsidian folder registered for ${node.type}`);
  }
  return `${folder}/${safeFilename(node.key)}.md`;
}

function vaultLink(node) {
  return `[[${vaultNotePath(node).slice(0, -3)}|${node.key}]]`;
}

function yamlScalar(value) {
  return JSON.stringify(value);
}

function renderVaultNode(graph, node) {
  const outgoing = edgesFor(graph, node, 'outgoing');
  const incoming = edgesFor(graph, node, 'incoming');
  const status = node.properties.status ? `status: ${yamlScalar(node.properties.status)}\n` : '';
  const relationshipLines = [
    ...outgoing.map((edge) => {
      const target = findNode(graph, edge.to);
      return `- \`${edge.relation}\` → ${vaultLink(target)}`;
    }),
    ...incoming.map((edge) => {
      const source = findNode(graph, edge.from);
      return `- \`${edge.relation}\` ← ${vaultLink(source)}`;
    })
  ].sort((left, right) => left.localeCompare(right));
  return `---
id: ${yamlScalar(node.id)}
key: ${yamlScalar(node.key)}
type: ${yamlScalar(node.type)}
generated: true
pilot: "WML-2"
${status}tags:
  - "wap-knowledge-graph"
  - "wap-knowledge-graph/${node.type}"
---

# ${node.title}

> Generated from canonical repository manifests. Do not edit this note directly.

## Relationships

${relationshipLines.length ? relationshipLines.join('\n') : '- None'}

## Data

\`\`\`json
${JSON.stringify(node.properties, null, 2)}
\`\`\`
`;
}

export function renderObsidianVault(graph) {
  const files = new Map();
  const targetSprint = findNode(graph, nodeId('sprint', graph.target.sprint));
  const nodeTypeLines = Object.entries(graph.summary.nodesByType).map(
    ([type, count]) => `- \`${type}\`: ${count}`
  );
  const gapLines = graph.summary.workItemsWithoutDirectClauses.map((id) => {
    const node = findNode(graph, nodeId('work-item', id));
    return `- ${vaultLink(node)}`;
  });
  const familyGapLines = Object.entries(graph.summary.unmappedNormativeFamiliesByWorkItem).map(
    ([id, families]) => {
      const node = findNode(graph, nodeId('work-item', id));
      return `- ${vaultLink(node)}: ${families.map((family) => `\`${family}\``).join(', ')}`;
    }
  );
  files.set(
    '_index.md',
    `---
id: "wap-1.2.1-wml-2-pilot"
type: "graph-index"
generated: true
tags:
  - "wap-knowledge-graph"
---

# WAP 1.2.1 WML-2 Knowledge Graph Pilot

> Generated from canonical repository manifests. Do not edit generated notes directly.

Target: ${vaultLink(targetSprint)}

## Graph summary

- Nodes: ${graph.summary.nodeCount}
- Edges: ${graph.summary.edgeCount}

${nodeTypeLines.join('\n')}

## Work items without direct normative-clause mappings

${gapLines.length ? gapLines.join('\n') : '- None'}

## Declared normative families without direct clause mappings

${familyGapLines.length ? familyGapLines.join('\n') : '- None'}
`
  );
  for (const node of graph.nodes) {
    files.set(vaultNotePath(node), renderVaultNode(graph, node));
  }
  return files;
}

function directClausesForWorkItem(graph, workItemId) {
  const clauseIds = graph.edges
    .filter(
      (edge) =>
        edge.relation === 'planned-by' &&
        edge.to === nodeId('work-item', workItemId) &&
        edge.from.startsWith('clause:')
    )
    .map((edge) => edge.from);
  return clauseIds
    .map((id) => findNode(graph, id))
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function renderContextPack(graph, focusWorkItemId = null) {
  const sprint = findNode(graph, nodeId('sprint', graph.target.sprint));
  const allWorkItems = graph.edges
    .filter((edge) => edge.from === sprint.id && edge.relation === 'contains')
    .map((edge) => findNode(graph, edge.to))
    .sort((left, right) => left.key.localeCompare(right.key));
  const focusedWorkItem = focusWorkItemId
    ? allWorkItems.find((workItem) => workItem.key === focusWorkItemId)
    : undefined;
  if (focusWorkItemId && !focusedWorkItem) {
    throw new Error(
      `Work item ${focusWorkItemId} is not part of the ${graph.target.sprint} knowledge graph`
    );
  }
  const workItems = focusedWorkItem ? [focusedWorkItem] : allWorkItems;
  const dependencyNodes = graph.edges
    .filter((edge) => edge.from === sprint.id && edge.relation === 'depends-on')
    .map((edge) => findNode(graph, edge.to));
  const downstreamNodes = graph.edges
    .filter((edge) => edge.to === sprint.id && edge.relation === 'depends-on')
    .map((edge) => findNode(graph, edge.from));
  const selectedFamilies = new Set(
    workItems.flatMap((workItem) => [
      ...workItem.properties.sourceFamilies,
      ...directClausesForWorkItem(graph, workItem.key).map((clause) => clause.properties.family)
    ])
  );
  const sourceDocuments = graph.nodes
    .filter((node) => node.type === 'source-document')
    .filter(
      (node) =>
        !focusedWorkItem ||
        selectedFamilies.has(node.properties.family) ||
        node.properties.family === 'conformance-governance'
    )
    .sort((left, right) => left.key.localeCompare(right.key));
  const workItemSections = workItems.map((workItem) => {
    const directClauses = directClausesForWorkItem(graph, workItem.key);
    return `### ${workItem.key}: ${workItem.title}

- Status: \`${workItem.properties.status}\`
- Owner layers: ${workItem.properties.ownerLayers.map((item) => `\`${item}\``).join(', ')}
- Source families: ${workItem.properties.sourceFamilies.map((item) => `\`${item}\``).join(', ')}
- Existing tickets: ${
      workItem.properties.existingTickets.map((item) => `\`${item}\``).join(', ') || 'None'
    }
- Direct normative clauses: ${directClauses.length}

Outputs:

${markdownList(workItem.properties.outputs)}

Acceptance:

${markdownList(workItem.properties.acceptance)}

Evidence commands:

${codeList(workItem.properties.evidence)}
`;
  });
  const obligationSections = workItems
    .map((workItem) => {
      const clauses = directClausesForWorkItem(graph, workItem.key);
      if (!clauses.length) {
        return '';
      }
      const lines = clauses.map((clause) => {
        const fixtureEdge = graph.edges.find(
          (edge) => edge.from === clause.id && edge.relation === 'verified-by'
        );
        const fixture = fixtureEdge ? findNode(graph, fixtureEdge.to) : undefined;
        return `- **${clause.key}** — ${clause.properties.obligationSynopsis}
  - Family: \`${clause.properties.family}\`; force: \`${
          clause.properties.normativeForce
        }\`; level: \`${clause.properties.obligationLevel}\`
  - Source: \`${clause.properties.sourceAnchor.documentId}\` §${
          clause.properties.sourceAnchor.section
        } (${clause.properties.sourceAnchor.heading})
  - Parents: ${clause.properties.parentRows.map((item) => `\`${item}\``).join(', ')}
  - Requirements: ${
    clause.properties.requirementIds.map((item) => `\`${item}\``).join(', ') || 'None'
  }
  - Fixture: ${
    fixture
      ? `\`${fixture.key}\` (\`${fixture.properties.kind}\`, \`${fixture.properties.status}\`)`
      : 'Missing'
  }`;
      });
      return `### ${workItem.key}

${lines.join('\n')}
`;
    })
    .filter(Boolean);
  const selectedWorkItemIds = new Set(workItems.map((workItem) => workItem.key));
  const workItemsWithoutDirectClauses = graph.summary.workItemsWithoutDirectClauses.filter(
    (workItem) => selectedWorkItemIds.has(workItem)
  );
  const unmappedNormativeFamiliesByWorkItem = Object.fromEntries(
    Object.entries(graph.summary.unmappedNormativeFamiliesByWorkItem).filter(([workItem]) =>
      selectedWorkItemIds.has(workItem)
    )
  );
  const gapLines = workItemsWithoutDirectClauses.map(
    (workItem) =>
      `- \`${workItem}\` has no direct clause mapping in the canonical nested-clause manifest. Treat this as a planning/evidence gap, not as zero normative scope.`
  );
  const familyGapLines = Object.entries(unmappedNormativeFamiliesByWorkItem).map(
    ([workItem, families]) =>
      `- \`${workItem}\` declares ${families
        .map((family) => `\`${family}\``)
        .join(
          ', '
        )} scope without a direct clause mapping from that family. Clauses from another family do not close this gap.`
  );
  const sourceLines = sourceDocuments.map((document) => {
    const url = document.properties.authorityUrl ? ` — ${document.properties.authorityUrl}` : '';
    return `- \`${document.key}\`: ${document.title}${url}`;
  });

  const directClauseCount = workItems.reduce(
    (sum, workItem) => sum + directClausesForWorkItem(graph, workItem.key).length,
    0
  );
  const focusLine = focusedWorkItem ? `- Focus work item: \`${focusedWorkItem.key}\`\n` : '';
  const selectionRule = focusedWorkItem
    ? 'include the target sprint, its direct dependency/downstream neighbors, the focused work item, and only normative clauses explicitly mapped to that work item.'
    : 'include the target sprint, its direct dependency/downstream neighbors, all target work items, and only normative clauses explicitly mapped to those work items.';

  return `# ${focusedWorkItem?.key ?? 'WML-2'} AI Context Pack

> Generated from the WAP 1.2.1 knowledge graph pilot. Canonical manifests remain authoritative.

## Retrieval contract

- Target: \`${graph.target.sprint}\`
${focusLine}- Release/profile: ${graph.target.release}, ${graph.target.markup}, \`${
    graph.target.profile
  }\`
- Compatibility floor: \`${graph.target.compatibilityFloor}\`
- Selection rule: ${selectionRule}
- Safety rule: absence from this pack does not mean a requirement is optional, implemented, or out of scope.
- Enhancement rule: additive behavior may extend strict behavior but may not replace a selected historical obligation.

## Graph summary

- Nodes: ${graph.summary.nodeCount}
- Edges: ${graph.summary.edgeCount}
- Selected work items: ${workItems.length}
- Direct normative clauses: ${directClauseCount}
- Work items without direct clause mappings: ${workItemsWithoutDirectClauses.length}
- Work items with unmapped declared normative families: ${
    Object.keys(unmappedNormativeFamiliesByWorkItem).length
  }

## Execution target

### ${sprint.key}: ${sprint.title}

- Status: \`${sprint.properties.status}\`
- Goal: ${sprint.properties.goal}
- Depends on: ${dependencyNodes.map((node) => `\`${node.key}\``).join(', ') || 'None'}
- Direct downstream sprints: ${
    downstreamNodes.map((node) => `\`${node.key}\``).join(', ') || 'None'
  }

Exit gates:

${markdownList(sprint.properties.exitGates)}

## Work items

${workItemSections.join('\n')}
## Direct normative obligations

${
  obligationSections.length
    ? obligationSections.join('\n')
    : '- None directly mapped for this selection. Treat the explicit mapping gaps below as unresolved.'
}
## Explicit mapping gaps

${gapLines.length ? gapLines.join('\n') : '- None'}

Declared-family gaps:

${familyGapLines.length ? familyGapLines.join('\n') : '- None'}

## Source documents

${sourceLines.join('\n')}
`;
}

export function buildGeneratedArtifacts(root = process.cwd(), targetId = 'WML-2') {
  const graph = buildKnowledgeGraph(root, targetId);
  return {
    graph,
    graphSource: `${JSON.stringify(graph, null, 2)}\n`,
    contextPack: renderContextPack(graph),
    vaultFiles: renderObsidianVault(graph)
  };
}

function listMarkdownFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.relative(root, absolute));
      }
    }
  }
  visit(root);
  return files.sort((left, right) => left.localeCompare(right));
}

function writeArtifacts(root, artifacts) {
  const graphPath = path.join(root, KNOWLEDGE_GRAPH_OUTPUT);
  const contextPath = path.join(root, CONTEXT_PACK_OUTPUT);
  const vaultRoot = path.join(root, OBSIDIAN_VAULT_OUTPUT);
  fs.mkdirSync(path.dirname(graphPath), { recursive: true });
  fs.mkdirSync(path.dirname(contextPath), { recursive: true });
  fs.mkdirSync(vaultRoot, { recursive: true });
  fs.writeFileSync(graphPath, artifacts.graphSource);
  fs.writeFileSync(contextPath, artifacts.contextPack);

  const expectedVaultFiles = new Set(artifacts.vaultFiles.keys());
  for (const existing of listMarkdownFiles(vaultRoot)) {
    if (expectedVaultFiles.has(existing)) {
      continue;
    }
    const absolute = path.join(vaultRoot, existing);
    const source = fs.readFileSync(absolute, 'utf8');
    if (source.includes('generated: true') && source.includes('wap-knowledge-graph')) {
      fs.unlinkSync(absolute);
    }
  }
  for (const [relativePath, source] of artifacts.vaultFiles) {
    const absolute = path.join(vaultRoot, relativePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, source);
  }
}

export function checkGeneratedArtifacts(root, artifacts) {
  const failures = [];
  const compareFile = (relativePath, expected) => {
    const absolute = path.join(root, relativePath);
    if (!fs.existsSync(absolute)) {
      failures.push(`${relativePath}: missing generated artifact`);
      return;
    }
    if (fs.readFileSync(absolute, 'utf8') !== expected) {
      failures.push(`${relativePath}: generated content is stale`);
    }
  };
  compareFile(KNOWLEDGE_GRAPH_OUTPUT, artifacts.graphSource);
  compareFile(CONTEXT_PACK_OUTPUT, artifacts.contextPack);

  const vaultRoot = path.join(root, OBSIDIAN_VAULT_OUTPUT);
  const expectedFiles = [...artifacts.vaultFiles.keys()].sort((left, right) =>
    left.localeCompare(right)
  );
  const actualFiles = listMarkdownFiles(vaultRoot);
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    failures.push(`${OBSIDIAN_VAULT_OUTPUT}: generated note inventory is stale`);
  }
  for (const [relativePath, source] of artifacts.vaultFiles) {
    compareFile(path.join(OBSIDIAN_VAULT_OUTPUT, relativePath), source);
  }
  return failures;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const artifacts = buildGeneratedArtifacts(root, args.target);
  if (args.check) {
    const failures = checkGeneratedArtifacts(root, artifacts);
    if (failures.length) {
      console.error('WAP knowledge graph generation check failed.');
      for (const failure of failures) {
        console.error(`- ${failure}`);
      }
      process.exit(1);
    }
    console.log(
      `WAP knowledge graph generation check OK (${artifacts.graph.summary.nodeCount} nodes, ${artifacts.graph.summary.edgeCount} edges)`
    );
    return;
  }
  writeArtifacts(root, artifacts);
  console.log(
    `Generated ${KNOWLEDGE_GRAPH_OUTPUT}, ${CONTEXT_PACK_OUTPUT}, and ${artifacts.vaultFiles.size} Obsidian notes`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
