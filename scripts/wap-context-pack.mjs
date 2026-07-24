#!/usr/bin/env node

import process from 'node:process';

import {
  buildKnowledgeGraph,
  renderContextPack
} from '../spec-processing/scripts/generate-wap-knowledge-graph.mjs';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/wap-context-pack.mjs WML-2');
  process.exit(1);
}

const graph = buildKnowledgeGraph(process.cwd(), target);
process.stdout.write(renderContextPack(graph));
