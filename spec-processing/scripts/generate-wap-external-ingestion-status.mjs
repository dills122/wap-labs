#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function usage() {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-external-ingestion-status.mjs ' +
      '--cache-dir <directory> --retrieved-on <YYYY-MM-DD> [--output <json>]'
  );
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i];
    if (!argument.startsWith('--') || i + 1 >= argv.length) {
      usage();
      process.exit(2);
    }
    parsed[argument.slice(2)] = argv[i + 1];
    i += 1;
  }
  return parsed;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function increment(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

const specialArtifacts = new Map([
  [
    'xml-1.0-19980210',
    [
      {
        id: 'w3c-xml-1.0-html',
        relativePath: 'w3c/xml-1.0-19980210.html',
        sourceUrl: 'https://www.w3.org/TR/1998/REC-xml-19980210',
        mediaType: 'text/html'
      }
    ]
  ],
  [
    'html-4.0-19971218',
    [
      {
        id: 'w3c-html-4.0-pdf',
        relativePath: 'w3c/html-4.0-19971218.pdf',
        sourceUrl: 'https://www.w3.org/TR/REC-html40-971218/html40.pdf',
        mediaType: 'application/pdf'
      }
    ]
  ],
  [
    'ecma-262-1',
    [
      {
        id: 'ecma-262-first-edition-pdf',
        relativePath: 'ecma/ecma-262-1.pdf',
        sourceUrl:
          'https://ecma-international.org/wp-content/uploads/ECMA-262_1st_edition_june_1997.pdf',
        mediaType: 'application/pdf'
      }
    ]
  ],
  [
    'iana-character-sets',
    [
      {
        id: 'iana-character-sets-current-xml',
        relativePath: 'iana/character-sets.xml',
        sourceUrl:
          'https://www.iana.org/assignments/character-sets/character-sets.xml',
        mediaType: 'application/xml'
      }
    ]
  ],
  [
    'unicode-2.0.0',
    [
      {
        id: 'unicode-2.0.0-components',
        relativePath: 'unicode/components-2.0.0.html',
        sourceUrl: 'https://www.unicode.org/versions/components-2.0.0.html',
        mediaType: 'text/html'
      },
      ...[
        'UnicodeData-2.0.14.txt',
        'ReadMe-2.0.14.txt',
        'ArabicShaping-1.txt',
        'Blocks-1.txt',
        'Jamo-1.txt',
        'Unihan-1.txt',
        'Props-2.0.14.txt',
        'PropList-2.0.14.txt',
        'Index-1.txt',
        'NamesList-1.txt'
      ].map((filename) => ({
        id: `unicode-${filename.replace(/\.[^.]+$/, '').toLowerCase()}`,
        relativePath: `unicode/${filename}`,
        sourceUrl: `https://www.unicode.org/Public/2.0-Update/${filename}`,
        mediaType: 'text/plain'
      }))
    ]
  ]
]);

const metadataOnlyDependencies = new Map([
  [
    'ieee-754-1985',
    'The historical IEEE standard payload is not publicly available from the authority page.'
  ],
  [
    'iso-10646-1-1993',
    'The historical ISO standard payload requires licensed standards access.'
  ],
  [
    'iso-8879-1986',
    'The historical ISO standard payload requires licensed standards access.'
  ],
  [
    'iso-tr-8509-1987',
    'The historical ISO technical-report payload requires licensed standards access.'
  ]
]);

const partialDependencies = new Map([
  [
    'iana-character-sets',
    'The current registry is preserved for research, but the WBXML-era historical registry snapshot remains open.'
  ],
  [
    'unicode-2.0.0',
    'The paper Unicode 2.0 standard is not online; the official component catalog and versioned UCD files are preserved.'
  ]
]);

const args = parseArgs(process.argv.slice(2));
if (!args['cache-dir'] || !args['retrieved-on']) {
  usage();
  process.exit(2);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(args['retrieved-on'])) {
  throw new Error('--retrieved-on must use YYYY-MM-DD');
}

const root = process.cwd();
const dependencyManifestPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json'
);
const cacheDir = path.resolve(args['cache-dir']);
const outputPath = path.resolve(
  args.output ??
    'spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json'
);
for (const requiredPath of [dependencyManifestPath, cacheDir]) {
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`Required input not found: ${requiredPath}`);
  }
}

const dependencyManifest = JSON.parse(
  fs.readFileSync(dependencyManifestPath, 'utf8')
);
const stateCounts = {};
let artifactCount = 0;
let artifactBytesTotal = 0;

const dependencies = (dependencyManifest.dependencies ?? []).map((dependency) => {
  let artifactDefinitions = [];
  if (/^rfc-\d+$/.test(dependency.id)) {
    const number = dependency.id.slice(4);
    artifactDefinitions = [
      {
        id: `rfc-${number}-text`,
        relativePath: `rfc/rfc${number}.txt`,
        sourceUrl: `https://www.rfc-editor.org/rfc/rfc${number}.txt`,
        mediaType: 'text/plain'
      }
    ];
  } else {
    artifactDefinitions = specialArtifacts.get(dependency.id) ?? [];
  }

  let acquisitionState = 'verified-private-full-artifact';
  let note =
    'A primary artifact is hash-locked in the private research cache; repository promotion is not implied.';
  if (metadataOnlyDependencies.has(dependency.id)) {
    acquisitionState = 'metadata-only-licensed-payload';
    note = metadataOnlyDependencies.get(dependency.id);
  } else if (partialDependencies.has(dependency.id)) {
    acquisitionState = 'verified-private-partial-artifact';
    note = partialDependencies.get(dependency.id);
  }

  const artifacts = artifactDefinitions.map((definition) => {
    const artifactPath = path.join(cacheDir, definition.relativePath);
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`${dependency.id}: missing ${definition.relativePath}`);
    }
    const buffer = fs.readFileSync(artifactPath);
    if (buffer.length === 0) {
      throw new Error(`${dependency.id}: empty ${definition.relativePath}`);
    }
    artifactCount += 1;
    artifactBytesTotal += buffer.length;
    return {
      id: definition.id,
      sourceUrl: definition.sourceUrl,
      mediaType: definition.mediaType,
      retrievedOn: args['retrieved-on'],
      state: 'verified-temporary',
      cacheRef:
        `private-research-cache/wap-1.2.1/external/` +
        definition.relativePath,
      bytes: buffer.length,
      sha256: sha256(buffer),
      checksumAlgorithm: 'sha256'
    };
  });

  if (
    acquisitionState === 'metadata-only-licensed-payload' &&
    artifacts.length !== 0
  ) {
    throw new Error(`${dependency.id}: metadata-only source has cached artifacts`);
  }
  if (
    acquisitionState !== 'metadata-only-licensed-payload' &&
    artifacts.length === 0
  ) {
    throw new Error(`${dependency.id}: expected at least one cached artifact`);
  }

  increment(stateCounts, acquisitionState);
  return {
    dependencyId: dependency.id,
    title: dependency.title,
    version: dependency.version,
    authority: dependency.authority,
    authorityRecordUrl: dependency.sourceUrl,
    acquisitionState,
    note,
    artifacts
  };
});

const manifest = {
  schemaVersion: 1,
  releaseId: 'wap-1.2.1',
  sourceManifest:
    'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json',
  recordedOn: args['retrieved-on'],
  status: 'external-source-acquisition-in-progress',
  policy: {
    repositoryMode: 'metadata-only',
    researchCacheCommitted: false,
    cacheRefsAreLogicalIdentifiers: true,
    note:
      'Hashes prove research acquisition only. Artifact licenses and the project ' +
      'redistribution policy must be reviewed before repository promotion.'
  },
  summary: {
    dependencyCount: dependencies.length,
    artifactCount,
    artifactBytesTotal,
    byAcquisitionState: Object.fromEntries(Object.entries(stateCounts).sort())
  },
  dependencies
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log('==> WAP 1.2.1 external source acquisition');
console.log(
  `PASS ${dependencies.length} dependencies represented by ${artifactCount} cached artifacts`
);
console.log(
  `PASS ${stateCounts['verified-private-full-artifact'] ?? 0} full; ` +
    `${stateCounts['verified-private-partial-artifact'] ?? 0} partial; ` +
    `${stateCounts['metadata-only-licensed-payload'] ?? 0} metadata-only`
);
console.log(`PASS wrote ${path.relative(root, outputPath)}`);
