#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-release.json'
);
const sourceDir = path.join(root, 'spec-processing/source-material');
const expectedClasses = new Set([
  'core-mandatory',
  'core-optional',
  'profile-optional',
  'dependency',
  'historical',
  'explicitly-deferred'
]);
const expectedArchiveSha256 =
  '382b7991701f99bc88e61c33aca740440044381788ba4b87591242a3a5e11cae';

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function increment(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function stableObject(value) {
  return Object.fromEntries(Object.entries(value).sort());
}

const failures = [];
if (!fs.existsSync(manifestPath)) {
  console.error(`WAP release manifest check failed: missing ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const members = manifest.members ?? [];
const filenames = new Set();
const checksums = new Set();
const classCounts = {};
const localStateCounts = {};

if (manifest.schemaVersion !== 1) {
  failures.push(`schemaVersion=${manifest.schemaVersion}; expected 1`);
}
if (manifest.release?.id !== 'wap-1.2.1') {
  failures.push(`release.id=${manifest.release?.id}; expected wap-1.2.1`);
}
if (manifest.release?.memberCount !== 97 || members.length !== 97) {
  failures.push(
    `release membership=${manifest.release?.memberCount}/${members.length}; expected 97/97`
  );
}
if (manifest.release?.archiveBytes !== 7817993) {
  failures.push(
    `release.archiveBytes=${manifest.release?.archiveBytes}; expected 7817993`
  );
}
if (manifest.release?.archiveSha256 !== expectedArchiveSha256) {
  failures.push('release.archiveSha256 does not match the verified OMA archive');
}
if (manifest.redistribution?.repositoryPolicy !== 'metadata-only') {
  failures.push('redistribution.repositoryPolicy must remain metadata-only pending review');
}

for (const member of members) {
  if (filenames.has(member.filename)) {
    failures.push(`duplicate filename: ${member.filename}`);
  }
  filenames.add(member.filename);

  if (!/^[a-f0-9]{64}$/.test(member.sha256 ?? '')) {
    failures.push(`${member.filename}: invalid SHA-256`);
  }
  checksums.add(member.sha256);

  if (!expectedClasses.has(member.sourceClass)) {
    failures.push(`${member.filename}: unexpected sourceClass=${member.sourceClass}`);
  }
  if (!member.individualSourceUrl?.startsWith(
    'https://www.openmobilealliance.org/tech/affiliates/wap/'
  )) {
    failures.push(`${member.filename}: member URL is not pinned to OMA`);
  }
  if (!['base', 'sin'].includes(member.documentRole)) {
    failures.push(`${member.filename}: unexpected documentRole=${member.documentRole}`);
  }
  if (!['approved', 'proposed', 'candidate'].includes(member.publicationStatus)) {
    failures.push(
      `${member.filename}: unexpected publicationStatus=${member.publicationStatus}`
    );
  }
  if (!Number.isInteger(member.bytes) || member.bytes <= 0) {
    failures.push(`${member.filename}: invalid byte size`);
  }

  increment(classCounts, member.sourceClass);

  const localPath = member.local?.path
    ? path.join(root, member.local.path)
    : path.join(sourceDir, member.filename);
  const localExists = fs.existsSync(localPath);
  let expectedLocalState = 'missing';
  let localSha256 = null;
  if (localExists) {
    localSha256 = sha256(fs.readFileSync(localPath));
    expectedLocalState =
      localSha256 === member.sha256 ? 'canonical-exact' : 'canonical-content-differs';
  }

  if (member.local?.state !== expectedLocalState) {
    failures.push(
      `${member.filename}: manifest local state=${member.local?.state}; ` +
        `actual=${expectedLocalState}`
    );
  }
  if ((member.local?.sha256 ?? null) !== localSha256) {
    failures.push(`${member.filename}: local SHA-256 drift`);
  }
  if (localExists && !member.local?.path) {
    failures.push(`${member.filename}: local path missing from manifest`);
  }

  increment(localStateCounts, expectedLocalState);
}

if (checksums.size !== members.length) {
  failures.push('member SHA-256 values are not unique');
}
if (
  JSON.stringify(stableObject(manifest.summary?.bySourceClass ?? {})) !==
  JSON.stringify(stableObject(classCounts))
) {
  failures.push('summary.bySourceClass does not match member classifications');
}
if (
  JSON.stringify(stableObject(manifest.summary?.byLocalState ?? {})) !==
  JSON.stringify(stableObject(localStateCounts))
) {
  failures.push('summary.byLocalState does not match the canonical source corpus');
}

const expectedAssociatedAssets = new Map([
  [
    'channel-1.2-dtd',
    {
      bytes: 892,
      sha256:
        '00baa80d3be6a4558b3115ebb1d6b3a58eea9cfb6bba0fd1f4ad73b993cfc31d',
      targetDisposition: 'not-required-by-selected-class-c'
    }
  ],
  [
    'wml13-dtd',
    {
      bytes: 9015,
      sha256:
        '764fe546974f15b40c1e49a0f3e954219e78f518c53a6d7d3956cab62be72dfb',
      targetDisposition: 'strict-baseline'
    }
  ],
  [
    'pap-1.0-dtd',
    {
      bytes: 8080,
      sha256:
        'bfcec60e17f07ed87b772004dfe784cda2bd88aaf8f211c4eafc68b1cb7a319a',
      targetDisposition: 'optional-push-profile'
    }
  ],
  [
    'service-indication-dtd',
    {
      bytes: 1676,
      sha256:
        'f71e1c657b501a49ba98dde685d29fe2c88107031f01e7d14781a36a669cf50b',
      targetDisposition: 'optional-push-profile'
    }
  ],
  [
    'service-loading-dtd',
    {
      bytes: 1025,
      sha256:
        '8393b66f4f9c30163613b553b765504d3f92dadd1eaca9775265b33d15c4f972',
      targetDisposition: 'optional-push-profile'
    }
  ],
  [
    'wta-wml-1.2-dtd',
    {
      bytes: 539,
      sha256:
        'dccd67a26526098adfae881a7826a21be34d69bd66cccd005a265e71a292a84c',
      targetDisposition: 'optional-wta-profile'
    }
  ]
]);
const associatedAssets = manifest.associatedAssets ?? [];
if (associatedAssets.length !== expectedAssociatedAssets.size) {
  failures.push('associated asset inventory must contain the exact six release DTDs');
}
for (const asset of associatedAssets) {
  if (!asset.sourceUrl?.startsWith('https://www.openmobilealliance.org/')) {
    failures.push(`${asset.id}: associated asset is not pinned to OMA`);
  }
  if (!/^[a-f0-9]{64}$/.test(asset.sha256 ?? '') || asset.bytes <= 0) {
    failures.push(`${asset.id}: associated asset hash/size is not verified`);
  }
  const expected = expectedAssociatedAssets.get(asset.id);
  if (
    !expected ||
    asset.bytes !== expected.bytes ||
    asset.sha256 !== expected.sha256 ||
    asset.targetDisposition !== expected.targetDisposition
  ) {
    failures.push(`${asset.id}: associated asset identity or disposition drift`);
  }
}

const governingDependencies = manifest.governingDependencies ?? [];
const governingIds = governingDependencies
  .map((dependency) => dependency.documentId)
  .sort();
if (
  JSON.stringify(governingIds) !==
  JSON.stringify([
    'WAP-215-ClassConform-20001213-a',
    'WAP-221-CREQ-20010425-a',
    'WAP-273-CertPolicy-20010831-a'
  ])
) {
  failures.push('governing dependency inventory must contain WAP-215/221/273');
}
for (const dependency of governingDependencies) {
  if (
    !dependency.sourceUrl?.startsWith(
      'https://www.openmobilealliance.org/tech/affiliates/wap/'
    ) &&
    !dependency.sourceUrl?.startsWith(
      'https://www1.wapforum.org/tech/documents/'
    ) &&
    !dependency.sourceUrl?.startsWith(
      'https://www.wapforum.org/tech/documents/'
    )
  ) {
    failures.push(
      `${dependency.documentId}: governing source is not pinned to WAP Forum/OMA`
    );
  }
  if (
    dependency.retrievalState === 'verified-temporary' &&
    (!/^[a-f0-9]{64}$/.test(dependency.sha256 ?? '') || dependency.bytes <= 0)
  ) {
    failures.push(`${dependency.documentId}: governing source hash/size is not verified`);
  }
  if (
    dependency.retrievalState !== 'verified-temporary' &&
    dependency.retrievalState !== 'officially-indexed-unretrieved'
  ) {
    failures.push(
      `${dependency.documentId}: unexpected retrievalState=${dependency.retrievalState}`
    );
  }
}

const wap215 = (manifest.governingDependencies ?? []).find(
  (dependency) => dependency.documentId === 'WAP-215-ClassConform-20001213-a'
);
if (
  wap215?.recoveryReviewedOn !== '2026-07-24' ||
  wap215?.retrievalState !== 'verified-temporary' ||
  wap215?.sourceUrl !==
    'https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf' ||
  wap215?.bytes !== 47936 ||
  wap215?.sha256 !==
    'af578cd57a7e043b693e0b0dd5ef59b27f8e778e481831ec8737337ee8e44f9d' ||
  wap215?.pageCount !== 16 ||
  wap215?.provenanceGrade !== 'A' ||
  wap215?.textExtraction?.bytes !== 35121 ||
  wap215?.textExtraction?.sha256 !==
    'd0b4cb2e7e1cb1340320845655176233f53b817bf29f93b102db6f49c030d00f' ||
  !wap215?.originalDownloadRoute?.includes(
    'terms.asp?doc=WAP-215-ClassConform-20001213-a.pdf'
  )
) {
  failures.push('WAP-215 official-domain recovery lock is missing or invalid');
}

const prototype = (manifest.historicalConformanceEvidence ?? []).find(
  (evidence) => evidence.documentId === 'PROTO-ClassConform-19990701'
);
if (
  prototype?.relationship !== 'non-normative-class-profile-lineage' ||
  prototype?.bytes !== 31825 ||
  prototype?.sha256 !==
    '8404b0686177616233755ce55cc4859efa8ae66cd6cd414ea2d809794eb478ad' ||
  !prototype?.sourceUrl?.startsWith('https://web.archive.org/web/')
) {
  failures.push('historical class-profile lineage evidence is missing or invalid');
}

if (failures.length > 0) {
  console.error('WAP release manifest check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 release manifest');
console.log(`PASS membership (${members.length} unique members)`);
console.log(
  `PASS canonical coverage (${localStateCounts['canonical-exact'] ?? 0} exact; ` +
    `${localStateCounts.missing ?? 0} missing; ` +
    `${localStateCounts['canonical-content-differs'] ?? 0} different)`
);
console.log('PASS classifications, hashes, associated assets, and metadata-only policy');
