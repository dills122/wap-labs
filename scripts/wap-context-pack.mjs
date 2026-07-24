#!/usr/bin/env node

import process from 'node:process';

import {
  buildKnowledgeGraph,
  renderContextPack
} from '../spec-processing/scripts/generate-wap-knowledge-graph.mjs';

const target = process.argv[2];
if (!target) {
  console.error(
    'Usage: node scripts/wap-context-pack.mjs WML-2|WML-201|WML-202|WML-203|WML-204|WML-205'
  );
  process.exit(1);
}

const supportedWorkItems = new Set(['WML-201', 'WML-202', 'WML-203', 'WML-204', 'WML-205']);
if (target !== 'WML-2' && !supportedWorkItems.has(target)) {
  console.error(
    `Unsupported context target: ${target}. Use WML-2 or one of ${[...supportedWorkItems].join(
      ', '
    )}.`
  );
  process.exit(1);
}

const graph = buildKnowledgeGraph(process.cwd(), 'WML-2');
process.stdout.write(renderContextPack(graph, target === 'WML-2' ? null : target));
