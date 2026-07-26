#!/usr/bin/env node
// Advisory check (never fails the build): reports engine-wasm/examples/source
// *.wml files that have no adjacent *.flow.json executable story. Per
// docs/agents/AGENT_STANDARDS.md, a stable host-visible example with a
// deterministic testing-ac should get a story, and a gap should be "left
// explicit rather than inferring coverage from prose testing-ac" -- this
// script is that explicit signal. It intentionally reports rather than
// fails: every current example's testing-ac is schema-required (see
// parseExampleMetadata in generate-example-manifest.mjs), so there's no
// existing way to distinguish a deliberately story-less "exploratory"
// example from a genuine gap. If one is ever added on purpose, the right
// fix is an explicit opt-out marker in the frontmatter schema (e.g. a
// `story: manual-only` key) that this script would then honor -- not
// something to build speculatively before any example actually needs it.

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES_SOURCE_DIR = path.resolve(SCRIPT_DIR, '..', '..', 'examples', 'source');

const entries = readdirSync(EXAMPLES_SOURCE_DIR);
const wmlBases = new Set(
  entries.filter((name) => name.endsWith('.wml')).map((name) => name.replace(/\.wml$/, ''))
);
const flowBases = new Set(
  entries
    .filter((name) => name.endsWith('.flow.json'))
    .map((name) => name.replace(/\.flow\.json$/, ''))
);

const missing = [...wmlBases].filter((base) => !flowBases.has(base)).sort();

if (missing.length === 0) {
  console.log(`Story coverage OK: all ${wmlBases.size} examples have an executable story.`);
  process.exit(0);
}

console.log(
  `Story coverage advisory: ${missing.length} of ${wmlBases.size} examples have no *.flow.json:`
);
for (const base of missing) {
  console.log(`  - ${base}.wml`);
}
console.log(
  'Not a build failure. If any of these are intentionally story-less, that should still be' +
    ' left explicit (see docs/agents/AGENT_STANDARDS.md) rather than silently assumed covered.'
);
