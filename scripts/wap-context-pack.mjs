#!/usr/bin/env node

import process from 'node:process';

import {
  buildKnowledgeGraph,
  renderContextPack
} from '../spec-processing/scripts/generate-wap-knowledge-graph.mjs';

const target = process.argv[2];
if (!target) {
  console.error(
    'Usage: node scripts/wap-context-pack.mjs TRN-7|TRN-702|TRN-703|TRN-706|TRN-707|WML-2|WML-201|WML-202|WML-203|WML-204|WML-205'
  );
  process.exit(1);
}

const targetSprints = new Map([
  ['TRN-7', 'TRN-7'],
  ['TRN-702', 'TRN-7'],
  ['TRN-703', 'TRN-7'],
  ['TRN-706', 'TRN-7'],
  ['TRN-707', 'TRN-7'],
  ['WML-2', 'WML-2'],
  ['WML-201', 'WML-2'],
  ['WML-202', 'WML-2'],
  ['WML-203', 'WML-2'],
  ['WML-204', 'WML-2'],
  ['WML-205', 'WML-2']
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
