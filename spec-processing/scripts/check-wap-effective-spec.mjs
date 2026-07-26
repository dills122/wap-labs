#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const generatorPath = 'spec-processing/scripts/generate-wap-effective-spec.mjs';
const generatedInputPaths = {
  release: 'spec-processing/source-manifests/wap-1.2.1-release.json',
  classConformance: 'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
  ingestion: 'spec-processing/source-manifests/wap-1.2.1-ingestion-status.json',
  externalDependencies: 'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json',
  externalIngestion: 'spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json'
};
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
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
    path.join(root, 'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'),
    'utf8'
  )
);
const externalDependencies = JSON.parse(
  fs.readFileSync(path.join(root, generatedInputPaths.externalDependencies), 'utf8')
);

const failures = [];
const regenerationCheck = spawnSync(process.execPath, [path.join(root, generatorPath), '--check'], {
  cwd: root,
  encoding: 'utf8'
});
if (regenerationCheck.status !== 0) {
  failures.push(
    `generated output does not match canonical inputs:\n${[
      regenerationCheck.stdout,
      regenerationCheck.stderr
    ]
      .filter(Boolean)
      .join('')
      .trim()}`
  );
}
const membersById = new Map(manifest.members.map((member) => [member.documentId, member]));
const seenDocuments = new Set();
const dispositionCounts = {};

if (graph.schemaVersion !== 2) {
  failures.push(`schemaVersion=${graph.schemaVersion}; expected 2`);
}
if (graph.releaseId !== manifest.release.id) {
  failures.push(`releaseId=${graph.releaseId}; expected ${manifest.release.id}`);
}
if (
  graph.governingClassProfileDocument !== classConformance.authority?.documentId ||
  graph.classProfileLedger !== 'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
) {
  failures.push('effective graph class-profile authority is missing or stale');
}
if (graph.generatedFrom?.generator !== generatorPath) {
  failures.push('effective graph generator identity is missing or stale');
}
for (const [key, relativePath] of Object.entries(generatedInputPaths)) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  if (
    graph.generatedFrom?.inputs?.[key]?.path !== relativePath ||
    graph.generatedFrom?.inputs?.[key]?.sha256 !== sha256(source)
  ) {
    failures.push(`${key}: canonical input path/hash is missing or stale`);
  }
}

const strictTransport = graph.strictTransportProfile;
const rfc792 = externalDependencies.dependencies?.find((dependency) => dependency.id === 'rfc-792');
if (
  strictTransport?.profileId !== classConformance.selectedTarget?.identifier ||
  strictTransport?.deviceRole !== classConformance.selectedTarget?.deviceRole ||
  strictTransport?.deviceClass !== classConformance.selectedTarget?.deviceClass ||
  strictTransport?.selectedBearer?.id !== 'cdpd-ipv4' ||
  strictTransport?.selectedBearer?.networkProtocol !== 'ipv4' ||
  strictTransport?.selectedBearer?.datagramProtocol !== 'udp' ||
  strictTransport?.families?.wdp?.selectedPath !== 'udp-over-ipv4' ||
  strictTransport?.families?.wcmp?.selectedPath !== 'rfc-792-icmpv4' ||
  strictTransport?.families?.wcmp?.sourceDocument !== 'WAP-202-WCMP' ||
  strictTransport?.families?.wcmp?.sourceSection !== '5.3' ||
  strictTransport?.families?.wcmp?.normativeDependency !== 'rfc-792' ||
  strictTransport?.families?.wcmp?.generalWcmpDisposition !== 'capability-gated-non-ip-bearer' ||
  strictTransport?.families?.wsp?.selectedPath !== 'connectionless' ||
  strictTransport?.families?.wtp?.selected !== false ||
  rfc792?.applicability !== 'conditional-ip-control'
) {
  failures.push(
    'strict CDPD/IPv4 transport applicability must select UDP, RFC 792 ICMP, and connectionless WSP while capability-gating general WCMP and WTP'
  );
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
  if (JSON.stringify(family.historicalDocuments) !== JSON.stringify(historicalIds)) {
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
      !familyDocuments.some((document) => document.documentId === relationship.from)
    ) {
      failures.push(`${family.family}: relationship source is unknown`);
    }
    if (!familyDocuments.some((document) => document.documentId === relationship.to)) {
      failures.push(`${family.family}: relationship target is unknown`);
    }
  }
}

const wmlFamily = graph.families?.find((family) => family.family === 'wml');
if (
  wmlFamily?.scrExtraction?.status !== 'line-item-ledger-complete-class-c-applied' ||
  wmlFamily?.scrExtraction?.governingClassProfileDocument !==
    classConformance.authority?.documentId ||
  wmlFamily?.scrExtraction?.classProfileLedger !== graph.classProfileLedger
) {
  failures.push('WML family must apply the selected WAP-215 Class C profile');
}
const waeFamily = graph.families?.find((family) => family.family === 'wae');
if (
  waeFamily?.scrExtraction?.status !== 'line-item-ledger-complete-class-c-applied' ||
  waeFamily?.scrExtraction?.governingClassProfileDocument !==
    classConformance.authority?.documentId ||
  waeFamily?.scrExtraction?.classProfileLedger !== graph.classProfileLedger ||
  waeFamily?.scrExtraction?.selectedFeatureGroup !== 'WAESpec:MCF' ||
  waeFamily?.successorEvidence?.find((source) => source.documentId === 'WAP-236-WAESpec-20020207-a')
    ?.deltaStatus !== 'selected-profile-delta-complete'
) {
  failures.push(
    'WAE family must apply the selected WAP-215 Class C profile and retain the completed WAP-236 selected-profile delta'
  );
}
const wbxmlFamily = graph.families?.find((family) => family.family === 'wbxml');
if (
  wbxmlFamily?.scrExtraction?.status !== 'line-item-ledger-complete-class-c-applied' ||
  wbxmlFamily?.scrExtraction?.governingClassProfileDocument !==
    classConformance.authority?.documentId ||
  wbxmlFamily?.scrExtraction?.classProfileLedger !== graph.classProfileLedger ||
  wbxmlFamily?.scrExtraction?.selectedFeatureGroup !== 'WBXML:MCF'
) {
  failures.push('WBXML family must apply the selected WAP-215 Class C profile');
}
for (const [familyName, selectedFeatureGroup] of [
  ['caching', 'WAPCachingMod:MCF'],
  ['wdp', 'WDP:MCF'],
  ['wcmp', 'WCMP:MCF'],
  ['wsp', 'WSP:MCF'],
  ['wmlscript', 'WMLScript:MCF'],
  ['wmlscript-libraries', 'WMLScriptLibs:MCF']
]) {
  const family = graph.families?.find((entry) => entry.family === familyName);
  if (
    family?.scrExtraction?.status !== 'line-item-ledger-complete-class-c-applied' ||
    family?.scrExtraction?.governingClassProfileDocument !==
      classConformance.authority?.documentId ||
    family?.scrExtraction?.classProfileLedger !== graph.classProfileLedger ||
    family?.scrExtraction?.selectedFeatureGroup !== selectedFeatureGroup
  ) {
    failures.push(
      `${familyName} family must apply ${selectedFeatureGroup} from the selected WAP-215 Class C profile`
    );
  }
  if (
    ['wdp', 'wcmp', 'wsp'].includes(familyName) &&
    (family?.scrExtraction?.applicability?.profile !== '#/strictTransportProfile' ||
      family?.scrExtraction?.applicability?.family !==
        `#/strictTransportProfile/families/${familyName}`)
  ) {
    failures.push(
      `${familyName} family must reference the generated strict transport applicability`
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
console.log('PASS canonical-input regeneration is byte-identical');
console.log('PASS strict CDPD/IPv4 selects RFC 792 ICMP and capability-gates general WCMP');
