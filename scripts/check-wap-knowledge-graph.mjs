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
  'uses-context',
  'verified-by'
]);

const root = process.cwd();
const artifacts = buildGeneratedArtifacts(root, 'WML-2');
const trnArtifacts = buildGeneratedArtifacts(root, 'TRN-7');
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
  const directScrRows = graph.nodes.filter(
    (node) =>
      node.type === 'scr-row' &&
      node.properties.matrixWorkItems?.includes(workItem.key)
  );
  if (
    graph.summary.directScrRowCountsByWorkItem[workItem.key] !==
    directScrRows.length
  ) {
    failures.push(`${workItem.key}: direct SCR-row summary count drift`);
  }
  const evidenceStates = {};
  for (const row of directScrRows) {
    const state = row.properties.evidenceState;
    if (state) {
      evidenceStates[state] = (evidenceStates[state] ?? 0) + 1;
    }
  }
  const sortedEvidenceStates = Object.fromEntries(Object.entries(evidenceStates).sort());
  if (
    JSON.stringify(graph.summary.directScrRowEvidenceStatesByWorkItem[workItem.key]) !==
    JSON.stringify(sortedEvidenceStates)
  ) {
    failures.push(`${workItem.key}: direct SCR-row evidence-state summary drift`);
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

const wml201Rows = graph.nodes
  .filter(
    (node) =>
      node.type === 'scr-row' &&
      node.properties.matrixWorkItems?.includes('WML-201')
  )
  .sort((left, right) => left.properties.ordinal - right.properties.ordinal);
const expectedWml201RowIds = Array.from({ length: 76 }, (_, index) => {
  const ordinal = index + 1;
  const actorPrefix = ordinal >= 60 && ordinal <= 69 ? 'S' : 'C';
  return `WML-${actorPrefix}-${String(ordinal).padStart(2, '0')}`;
});
const wml201Pack = renderContextPack(graph, 'WML-201');
if (
  JSON.stringify(wml201Rows.map((row) => row?.key)) !==
    JSON.stringify(expectedWml201RowIds) ||
  wml201Rows.some(
    (row) =>
      !row?.properties.sourceAnchor?.documentId ||
      !row.properties.referencedSection ||
      !row.properties.evidenceState ||
      !row.properties.assessmentNote
  ) ||
  JSON.stringify(graph.summary.directScrRowEvidenceStatesByWorkItem['WML-201']) !==
    JSON.stringify({
      'direct-test-linked': 29,
      'gap-work-item-mapped': 18,
      'optional-not-assessed': 29
    }) ||
  graph.summary.directClauseCountsByWorkItem['WML-201'] !== 177 ||
  JSON.stringify(graph.summary.directClauseFamiliesByWorkItem['WML-201']) !==
    JSON.stringify(['wae', 'wml']) ||
  graph.summary.unmappedNormativeFamiliesByWorkItem['WML-201'] ||
  !wml201Pack.includes('- Direct SCR rows: 76') ||
  !wml201Pack.includes('- Direct normative clauses: 177') ||
  !wml201Pack.includes('29 `direct-test-linked`') ||
  !wml201Pack.includes('18 `gap-work-item-mapped`') ||
  !wml201Pack.includes('29 `optional-not-assessed`') ||
  !wml201Pack.includes('**WML-C-01**') ||
  !wml201Pack.includes('**WML-C-76**')
) {
  failures.push(
    'WML-201 must expose the exact 76-row SCR matrix, all 177 direct WAE/WML clauses, and conservative direct-evidence states without a declared-family gap'
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
failures.push(...checkGeneratedArtifacts(root, trnArtifacts));

const trnGraph = trnArtifacts.graph;
const trnNodeIds = new Set(trnGraph.nodes.map((node) => node.id));
const selectedWcmpRows = [
  'WCMP-C-001',
  'WCMP-SP-C-001'
];
if (
  trnGraph.target.sprint !== 'TRN-7' ||
  trnGraph.target.profile !== 'CCR-CLASSC-C-001' ||
  !trnNodeIds.has('work-item:TRN-702') ||
  !trnNodeIds.has('work-item:TRN-703') ||
  !trnNodeIds.has('work-item:TRN-706') ||
  !trnNodeIds.has('work-item:TRN-707') ||
  !trnNodeIds.has('work-item:TRN-708')
) {
  failures.push(
    'TRN-7 target must retain the selected Class C profile and adopted TRN-702/TRN-703/TRN-706/TRN-707/TRN-708 work items'
  );
}
for (const row of selectedWcmpRows) {
  if (!trnNodeIds.has(`scr-row:${row}`)) {
    failures.push(`TRN-7 graph is missing selected WCMP row ${row}`);
  }
}
const trn703Pack = renderContextPack(trnGraph, 'TRN-703');
if (
  !trn703Pack.startsWith('# TRN-703 AI Context Pack') ||
  !trn703Pack.includes('### TRN-703:') ||
  trn703Pack.includes('### TRN-701:') ||
  !trn703Pack.includes('- Direct normative clauses: 0') ||
  !trn703Pack.includes('`TRN-703` has no direct clause mapping') ||
  JSON.stringify(trnGraph.summary.unmappedNormativeFamiliesByWorkItem['TRN-703']) !==
    JSON.stringify(['wcmp'])
) {
  failures.push(
    'TRN-703 context rendering must preserve its completed non-IP capability history as an explicit selected-profile mapping gap'
  );
}
const trn702Pack = renderContextPack(trnGraph, 'TRN-702');
if (
  !trn702Pack.startsWith('# TRN-702 AI Context Pack') ||
  !trn702Pack.includes('### TRN-702:') ||
  trn702Pack.includes('### TRN-701:') ||
  !trn702Pack.includes('- Direct normative clauses: 9') ||
  trnGraph.summary.workItemsWithoutDirectClauses.includes('TRN-702') ||
  trnGraph.summary.unmappedNormativeFamiliesByWorkItem['TRN-702']
) {
  failures.push(
    'TRN-702 context rendering must remain bounded to its nine adopted WDP clauses without a declared-family gap'
  );
}
const trn706Pack = renderContextPack(trnGraph, 'TRN-706');
if (
  !trn706Pack.startsWith('# TRN-706 AI Context Pack') ||
  !trn706Pack.includes('### TRN-706:') ||
  trn706Pack.includes('### TRN-703:') ||
  !trn706Pack.includes('- Direct normative clauses: 11') ||
  trnGraph.summary.workItemsWithoutDirectClauses.includes('TRN-706') ||
  JSON.stringify(trnGraph.summary.unmappedNormativeFamiliesByWorkItem['TRN-706']) !==
    JSON.stringify(['wtp'])
) {
  failures.push(
    'TRN-706 context rendering must remain bounded to its eleven selected WDP clauses and preserve the conditional WTP family gap'
  );
}
const trn707Pack = renderContextPack(trnGraph, 'TRN-707');
if (
  !trn707Pack.startsWith('# TRN-707 AI Context Pack') ||
  !trn707Pack.includes('### TRN-707:') ||
  trn707Pack.includes('### TRN-706:') ||
  !trn707Pack.includes('- Direct normative clauses: 9') ||
  !trn707Pack.includes('`WAP-259-WDP-20010614-a`') ||
  !trn707Pack.includes('TRN-708 closes') ||
  trnGraph.summary.workItemsWithoutDirectClauses.includes('TRN-707') ||
  JSON.stringify(trnGraph.summary.directClauseFamiliesByWorkItem['TRN-707']) !==
    JSON.stringify(['wcmp', 'wdp']) ||
  JSON.stringify(trnGraph.summary.unmappedNormativeFamiliesByWorkItem['TRN-707']) !==
    JSON.stringify(['wtp'])
) {
  failures.push(
    'TRN-707 context rendering must expose nine WDP/WCMP comparison clauses, WAP-259 context, and the conditional WTP family gap'
  );
}

const trn708Pack = renderContextPack(trnGraph, 'TRN-708');
if (
  !trn708Pack.startsWith('# TRN-708 AI Context Pack') ||
  !trn708Pack.includes('### TRN-708:') ||
  trn708Pack.includes('### TRN-707:') ||
  !trn708Pack.includes('- Direct normative clauses: 13') ||
  !trn708Pack.includes('`rfc-792`') ||
  !trn708Pack.includes('WCMP-CL-CDPD-USES-ICMP') ||
  trnGraph.summary.workItemsWithoutDirectClauses.includes('TRN-708') ||
  JSON.stringify(trnGraph.summary.directClauseFamiliesByWorkItem['TRN-708']) !==
    JSON.stringify(['wcmp', 'wdp']) ||
  trnGraph.summary.unmappedNormativeFamiliesByWorkItem['TRN-708']
) {
  failures.push(
    'TRN-708 context rendering must expose thirteen direct WDP/ICMP clauses, RFC 792, and no declared-family gap'
  );
}

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
