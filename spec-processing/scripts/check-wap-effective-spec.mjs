#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, 'spec-processing/source-manifests/wap-1.2.1-release.json'),
    'utf8'
  )
);
const graph = JSON.parse(
  fs.readFileSync(
    path.join(root, 'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'),
    'utf8'
  )
);
const classConformance = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
    ),
    'utf8'
  )
);

const failures = [];
const membersById = new Map(
  manifest.members.map((member) => [member.documentId, member])
);
const seenDocuments = new Set();
const dispositionCounts = {};

if (graph.schemaVersion !== 1) {
  failures.push(`schemaVersion=${graph.schemaVersion}; expected 1`);
}
if (graph.releaseId !== manifest.release.id) {
  failures.push(`releaseId=${graph.releaseId}; expected ${manifest.release.id}`);
}
if (
  graph.governingClassProfileDocument !==
    classConformance.authority?.documentId ||
  graph.classProfileLedger !==
    'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
) {
  failures.push('effective graph class-profile authority is missing or stale');
}

for (const family of graph.families ?? []) {
  dispositionCounts[family.targetDisposition] =
    (dispositionCounts[family.targetDisposition] ?? 0) + 1;

  const familyDocuments = family.documents ?? [];
  const approvedIds = familyDocuments
    .filter((document) => document.publicationStatus === 'approved')
    .map((document) => document.documentId);
  const historicalIds = familyDocuments
    .filter((document) => document.publicationStatus !== 'approved')
    .map((document) => document.documentId);

  if (JSON.stringify(family.effectiveSequence) !== JSON.stringify(approvedIds)) {
    failures.push(`${family.family}: effective sequence does not match approved order`);
  }
  if (
    JSON.stringify(family.historicalDocuments) !== JSON.stringify(historicalIds)
  ) {
    failures.push(`${family.family}: historical sequence does not match source status`);
  }

  for (const document of familyDocuments) {
    if (seenDocuments.has(document.documentId)) {
      failures.push(`duplicate graph document: ${document.documentId}`);
    }
    seenDocuments.add(document.documentId);

    const member = membersById.get(document.documentId);
    if (!member) {
      failures.push(`${document.documentId}: not found in release manifest`);
      continue;
    }
    if (member.family !== family.family) {
      failures.push(
        `${document.documentId}: graph family=${family.family}; manifest=${member.family}`
      );
    }
    if (member.sha256 !== document.sha256) {
      failures.push(`${document.documentId}: SHA-256 drift from release manifest`);
    }
  }

  for (const relationship of family.relationships ?? []) {
    if (
      !seenDocuments.has(relationship.from) &&
      !familyDocuments.some(
        (document) => document.documentId === relationship.from
      )
    ) {
      failures.push(`${family.family}: relationship source is unknown`);
    }
    if (
      !familyDocuments.some((document) => document.documentId === relationship.to)
    ) {
      failures.push(`${family.family}: relationship target is unknown`);
    }
  }
}

const wmlFamily = graph.families?.find((family) => family.family === 'wml');
if (
  wmlFamily?.scrExtraction?.status !==
    'line-item-ledger-complete-class-c-applied' ||
  wmlFamily?.scrExtraction?.governingClassProfileDocument !==
    classConformance.authority?.documentId ||
  wmlFamily?.scrExtraction?.classProfileLedger !== graph.classProfileLedger
) {
  failures.push('WML family must apply the selected WAP-215 Class C profile');
}
const waeFamily = graph.families?.find((family) => family.family === 'wae');
if (
  waeFamily?.scrExtraction?.status !==
    'line-item-ledger-complete-class-c-applied' ||
  waeFamily?.scrExtraction?.governingClassProfileDocument !==
    classConformance.authority?.documentId ||
  waeFamily?.scrExtraction?.classProfileLedger !== graph.classProfileLedger ||
  waeFamily?.scrExtraction?.selectedFeatureGroup !== 'WAESpec:MCF' ||
  waeFamily?.successorEvidence?.find(
    (source) => source.documentId === 'WAP-236-WAESpec-20020207-a'
  )?.deltaStatus !== 'selected-mcf-concept-delta-complete'
) {
  failures.push(
    'WAE family must apply the selected WAP-215 Class C profile and retain the completed WAP-236 selected-concept delta'
  );
}
const wbxmlFamily = graph.families?.find(
  (family) => family.family === 'wbxml'
);
if (
  wbxmlFamily?.scrExtraction?.status !==
    'line-item-ledger-complete-class-c-applied' ||
  wbxmlFamily?.scrExtraction?.governingClassProfileDocument !==
    classConformance.authority?.documentId ||
  wbxmlFamily?.scrExtraction?.classProfileLedger !==
    graph.classProfileLedger ||
  wbxmlFamily?.scrExtraction?.selectedFeatureGroup !== 'WBXML:MCF'
) {
  failures.push(
    'WBXML family must apply the selected WAP-215 Class C profile'
  );
}
for (const [
  familyName,
  selectedFeatureGroup
] of [
  ['wmlscript', 'WMLScript:MCF'],
  ['wmlscript-libraries', 'WMLScriptLibs:MCF']
]) {
  const family = graph.families?.find(
    (entry) => entry.family === familyName
  );
  if (
    family?.scrExtraction?.status !==
      'line-item-ledger-complete-class-c-applied' ||
    family?.scrExtraction?.governingClassProfileDocument !==
      classConformance.authority?.documentId ||
    family?.scrExtraction?.classProfileLedger !== graph.classProfileLedger ||
    family?.scrExtraction?.selectedFeatureGroup !== selectedFeatureGroup
  ) {
    failures.push(
      `${familyName} family must apply ${selectedFeatureGroup} from the selected WAP-215 Class C profile`
    );
  }
}

if (seenDocuments.size !== manifest.members.length) {
  failures.push(
    `graph documents=${seenDocuments.size}; release members=${manifest.members.length}`
  );
}
if (graph.summary?.familyCount !== graph.families?.length) {
  failures.push('summary.familyCount does not match graph families');
}
if (
  JSON.stringify(graph.summary?.byTargetDisposition) !==
  JSON.stringify(Object.fromEntries(Object.entries(dispositionCounts).sort()))
) {
  failures.push('summary.byTargetDisposition does not match graph families');
}

if (failures.length > 0) {
  console.error('WAP effective-spec graph check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('==> WAP 1.2.1 effective-spec graph');
console.log(
  `PASS ${graph.families.length} families cover all ${seenDocuments.size} release members`
);
console.log('PASS approved/proposed precedence and release hashes are consistent');
