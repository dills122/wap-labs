#!/usr/bin/env node

import process from 'node:process';

import {
  buildKnowledgeGraph,
  renderContextPack
} from '../spec-processing/scripts/generate-wap-knowledge-graph.mjs';

const target = process.argv[2];
if (!target) {
  console.error(
    'Usage: node scripts/wap-context-pack.mjs TRN-7|TRN-702|TRN-703|TRN-706|TRN-707|TRN-708|TRN-710|WML-2|WML-201|WML-202|WML-203|WML-204|WML-205|WML-3|WML-301|WML-302|WML-303|WML-304|WML-305|WML-306|WML-307|WML-309|WSP-8|WSP-801|WSP-802|WSP-805|WMLS-5|WMLS-501|WMLS-502'
  );
  process.exit(1);
}

const targetSprints = new Map([
  ['TRN-7', 'TRN-7'],
  ['TRN-702', 'TRN-7'],
  ['TRN-703', 'TRN-7'],
  ['TRN-706', 'TRN-7'],
  ['TRN-707', 'TRN-7'],
  ['TRN-708', 'TRN-7'],
  ['TRN-710', 'TRN-7'],
  ['WML-2', 'WML-2'],
  ['WML-201', 'WML-2'],
  ['WML-202', 'WML-2'],
  ['WML-203', 'WML-2'],
  ['WML-204', 'WML-2'],
  ['WML-205', 'WML-2'],
  ['WML-3', 'WML-3'],
  ['WML-301', 'WML-3'],
  ['WML-302', 'WML-3'],
  ['WML-303', 'WML-3'],
  ['WML-304', 'WML-3'],
  ['WML-305', 'WML-3'],
  ['WML-306', 'WML-3'],
  ['WML-307', 'WML-3'],
  ['WML-309', 'WML-3'],
  ['WSP-8', 'WSP-8'],
  ['WSP-801', 'WSP-8'],
  ['WSP-802', 'WSP-8'],
  ['WSP-805', 'WSP-8'],
  ['WMLS-5', 'WMLS-5'],
  ['WMLS-501', 'WMLS-5'],
  ['WMLS-502', 'WMLS-5']
]);
const sprint = targetSprints.get(target);
if (!sprint) {
  console.error(
    `Unsupported context target: ${target}. Use one of ${[...targetSprints.keys()].join(', ')}.`
  );
  process.exit(1);
}

const graph = buildKnowledgeGraph(process.cwd(), sprint);
process.stdout.write(renderContextPack(graph, target === sprint ? null : target));
