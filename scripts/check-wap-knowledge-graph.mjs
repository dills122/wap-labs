#!/usr/bin/env node

import process from 'node:process';

import {
  buildGeneratedArtifacts,
  checkGeneratedArtifacts,
  renderContextPack
} from '../spec-processing/scripts/generate-wap-knowledge-graph.mjs';

const allowedNodeTypes = new Set([
  'clause',
  'fixture',
  'legacy-ticket',
  'owner-layer',
  'profile',
  'requirement',
  'scr-row',
  'source-document',
  'source-family',
  'sprint',
  'work-item'
]);
const allowedRelations = new Set([
  'amended-by',
  'applied-before',
  'belongs-to',
  'contains',
  'covers-family',
  'depends-on',
  'effective-document',
  'maps-to',
  'owned-by',
  'planned-by',
  'refines',
  'relates-to',
  'requires-family',
  'selected-from',
  'sourced-from',
  'targets-profile',
  'verified-by'
]);

const root = process.cwd();
const artifacts = buildGeneratedArtifacts(root, 'WML-2');
const { graph } = artifacts;
const failures = [];
const nodeIds = new Set(graph.nodes.map((node) => node.id));
const edgeIds = new Set(graph.edges.map((edge) => edge.id));

if (graph.schemaVersion !== 1) {
  failures.push(`schemaVersion=${graph.schemaVersion}; expected 1`);
}
if (
  graph.target.release !== 'WAP 1.2.1' ||
  graph.target.markup !== 'WML 1.3' ||
  graph.target.sprint !== 'WML-2' ||
  graph.target.profile !== 'CCR-CLASSC-C-001'
) {
  failures.push('pilot target must remain WAP 1.2.1 / WML 1.3 / WML-2 / Class C');
}
if (nodeIds.size !== graph.nodes.length) {
  failures.push('node IDs must be unique');
}
if (edgeIds.size !== graph.edges.length) {
  failures.push('edge IDs must be unique');
}
if (
  JSON.stringify(graph.nodes.map((node) => node.id)) !==
  JSON.stringify([...nodeIds].sort((left, right) => left.localeCompare(right)))
) {
  failures.push('nodes must use deterministic ID ordering');
}
if (
  JSON.stringify(graph.edges.map((edge) => edge.id)) !==
  JSON.stringify([...edgeIds].sort((left, right) => left.localeCompare(right)))
) {
  failures.push('edges must use deterministic ID ordering');
}

for (const node of graph.nodes) {
  if (!allowedNodeTypes.has(node.type)) {
    failures.push(`${node.id}: unsupported node type=${node.type}`);
  }
}
for (const edge of graph.edges) {
  if (!allowedRelations.has(edge.relation)) {
    failures.push(`${edge.id}: unsupported relation=${edge.relation}`);
  }
  if (!nodeIds.has(edge.from)) {
    failures.push(`${edge.id}: missing from node ${edge.from}`);
  }
  if (!nodeIds.has(edge.to)) {
    failures.push(`${edge.id}: missing to node ${edge.to}`);
  }
}

const nodeCounts = Object.fromEntries(
  [...allowedNodeTypes]
    .map((type) => [type, graph.nodes.filter((node) => node.type === type).length])
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
);
if (JSON.stringify(nodeCounts) !== JSON.stringify(graph.summary.nodesByType)) {
  failures.push('summary.nodesByType does not match graph nodes');
}
if (
  graph.summary.nodeCount !== graph.nodes.length ||
  graph.summary.edgeCount !== graph.edges.length
) {
  failures.push('summary node/edge totals do not match graph contents');
}

const workItemNodes = graph.nodes.filter((node) => node.type === 'work-item');
for (const workItem of workItemNodes) {
  const directClauseEdges = graph.edges.filter(
    (edge) =>
      edge.relation === 'planned-by' && edge.to === workItem.id && edge.from.startsWith('clause:')
  );
  const directClauseCount = directClauseEdges.length;
  if (graph.summary.directClauseCountsByWorkItem[workItem.key] !== directClauseCount) {
    failures.push(`${workItem.key}: direct-clause summary count drift`);
  }
  const listedAsGap = graph.summary.workItemsWithoutDirectClauses.includes(workItem.key);
  if (listedAsGap !== (directClauseCount === 0)) {
    failures.push(`${workItem.key}: direct-clause gap classification drift`);
  }
  const directFamilies = [
    ...new Set(
      directClauseEdges
        .map((edge) => graph.nodes.find((node) => node.id === edge.from)?.properties.family)
        .filter(Boolean)
    )
  ].sort((left, right) => left.localeCompare(right));
  if (
    JSON.stringify(graph.summary.directClauseFamiliesByWorkItem[workItem.key]) !==
    JSON.stringify(directFamilies)
  ) {
    failures.push(`${workItem.key}: direct-clause family summary drift`);
  }
  for (const family of graph.summary.unmappedNormativeFamiliesByWorkItem[workItem.key] ?? []) {
    if (directFamilies.includes(family)) {
      failures.push(`${workItem.key}: family ${family} cannot be both mapped and unmapped`);
    }
  }
}
if (!graph.summary.workItemsWithoutDirectClauses.length) {
  failures.push('pilot must expose work items that lack direct normative-clause mappings');
}
if (!Object.keys(graph.summary.unmappedNormativeFamiliesByWorkItem).length) {
  failures.push('pilot must expose declared normative families without direct clause mappings');
}

for (const clause of graph.nodes.filter((node) => node.type === 'clause')) {
  const relations = graph.edges.filter((edge) => edge.from === clause.id);
  for (const requiredRelation of ['planned-by', 'refines', 'sourced-from', 'verified-by']) {
    if (!relations.some((edge) => edge.relation === requiredRelation)) {
      failures.push(`${clause.id}: missing ${requiredRelation} edge`);
    }
  }
}

const focusedPack = renderContextPack(graph, 'WML-203');
if (
  !focusedPack.startsWith('# WML-203 AI Context Pack') ||
  !focusedPack.includes('### WML-203:') ||
  focusedPack.includes('### WML-202:') ||
  !focusedPack.includes('- Selected work items: 1')
) {
  failures.push(
    'focused work-item context rendering must remain bounded to the selected work item'
  );
}
try {
  renderContextPack(graph, 'WML-999');
  failures.push('unknown work-item context targets must be rejected');
} catch (error) {
  if (!error.message.includes('is not part of')) {
    failures.push(`unexpected unknown work-item error: ${error.message}`);
  }
}

failures.push(...checkGeneratedArtifacts(root, artifacts));

if (failures.length) {
  console.error('WAP knowledge graph check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const directClauseCount = graph.nodes.filter((node) => node.type === 'clause').length;
console.log(
  `WAP knowledge graph check OK (${graph.summary.nodeCount} nodes, ${
    graph.summary.edgeCount
  } edges, ${directClauseCount} direct clauses, ${
    graph.summary.workItemsWithoutDirectClauses.length
  } zero-clause gaps, ${
    Object.keys(graph.summary.unmappedNormativeFamiliesByWorkItem).length
  } family gaps)`
);
