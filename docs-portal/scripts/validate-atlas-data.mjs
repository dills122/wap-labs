#!/usr/bin/env node

import { loadAtlasData } from '../src/lib/atlas-data.mjs';

const atlas = loadAtlasData();
const workItemCount = atlas.program.sprints.reduce(
  (count, sprint) => count + sprint.workItems.length,
  0
);

console.log(
  `Project Atlas data validation passed: ${atlas.program.sprints.length} sprints, ` +
    `${workItemCount} work items, ${atlas.releaseManifest.members.length} sources, ` +
    `${atlas.effectiveSpec.families.length} families, ` +
    `${atlas.clauseManifest.summary.clauseCount} clauses.`
);
