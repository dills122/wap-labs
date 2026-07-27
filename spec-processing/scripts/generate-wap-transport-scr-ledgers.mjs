#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const sourceRoot = option('--source-root');
const creqTextPath = option('--creq-text');
const recordedOn = option('--recorded-on');
const outputRoot =
  option('--output-root') ?? 'spec-processing/source-manifests';
const refreshSelectedEvidence = args.includes('--refresh-selected-evidence');

if (refreshSelectedEvidence) {
  const outputPath = path.join(
    outputRoot,
    'wap-1.2.1-wsp-scr.json'
  );
  const manifest = readJson(outputPath);
  let refreshed = 0;
  for (const obligation of manifest.obligations) {
    if (
      obligation.disposition?.classCProfile !==
      'required-by-selected-class-c-transport-path'
    ) {
      continue;
    }
    const evidence = selectedEvidence('wsp', obligation.id);
    obligation.mapping.implementationStatus = selectedImplementationStatus(
      'wsp',
      obligation.id
    );
    obligation.mapping.assessmentNote = assessmentNote('wsp', obligation.id);
    obligation.mapping.implementationEvidence =
      evidence.implementationEvidence;
    obligation.mapping.testEvidence = evidence.testEvidence;
    obligation.mapping.evidenceState = evidence.testEvidence.some(
      (item) => item.evidenceClass === 'direct-normative'
    )
      ? 'direct-normative-test-linked'
      : 'provisional-non-normative-test-linked';
    obligation.reviewState = evidence.testEvidence.some(
      (item) => item.evidenceClass === 'direct-normative'
    )
      ? 'source-extracted-class-c-path-implemented-direct-evidence'
      : 'source-extracted-class-c-path-applied-mapping-provisional';
    refreshed += 1;
  }
  const selectedRows = manifest.obligations.filter(
    (obligation) =>
      obligation.disposition?.classCProfile ===
      'required-by-selected-class-c-transport-path'
  );
  manifest.summary.selectedImplementationStatus = countBy(
    selectedRows,
    (row) => row.mapping.implementationStatus
  );
  manifest.summary.selectedDirectNormativeTestEvidenceCount =
    selectedRows.filter((row) =>
      row.mapping.testEvidence.some(
        (evidence) => evidence.evidenceClass === 'direct-normative'
      )
    ).length;
  manifest.summary.selectedProvisionalTestEvidenceCount =
    selectedRows.filter(
      (row) =>
        row.mapping.testEvidence.length > 0 &&
        !row.mapping.testEvidence.some(
          (evidence) => evidence.evidenceClass === 'direct-normative'
        )
    ).length;
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `Refreshed ${refreshed} selected WSP evidence mappings in ${outputPath}`
  );
  process.exit(0);
}

if (!sourceRoot || !creqTextPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-transport-scr-ledgers.mjs ' +
      '--source-root /absolute/path/to/wap-1.2.1-text ' +
      '--creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt ' +
      '--recorded-on YYYY-MM-DD [--output-root path]'
  );
  process.exit(2);
}

const release = readJson(
  'spec-processing/source-manifests/wap-1.2.1-release.json'
);
const ingestion = readJson(
  'spec-processing/source-manifests/wap-1.2.1-ingestion-status.json'
);
const effectiveSpec = readJson(
  'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'
);
const externalDependencies = readJson(
  'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json'
);
const externalIngestion = readJson(
  'spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json'
);
const classConformance = readJson(
  'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
);

const configs = [
  {
    family: 'wdp',
    prefix: 'WDP',
    selectedExpression: 'WDP:MCF',
    tableDocumentId: 'WAP-200_005-WDP',
    tableFilename: 'WAP-200_005-WDP-20010718-a.txt',
    expectedSequence: [
      'WAP-200-WDP',
      'WAP-200_001-WDP',
      'WAP-200_002-WDP',
      'WAP-200_003-WDP',
      'WAP-200_004-WDP',
      'WAP-200_005-WDP'
    ],
    expectedCounts: {
      itemCount: 146,
      mandatoryCount: 14,
      optionalCount: 132,
      clientCount: 71,
      serverCount: 75
    },
    selectedIds: [
      'WDP-C-001',
      'WDP-CORE-C-001',
      'WDP-PF-C-001',
      'WDP-PF-C-002',
      'WDP-NA-C-000',
      'WDP-NA-C-003',
      'WDP-NA-C-006',
      'WDP-NA-C-007',
      'WDP-CT-C-002'
    ],
    selectedPath:
      'All seven mandatory client rows plus the CDPD WDP-over-UDP/IP bearer alternative WDP-CT-C-002 and IPv4 addressing alternative WDP-NA-C-003.',
    markers: [
      'E.1. Protocol Functions',
      'WDP-C-001',
      'WDP-CORE-C-001',
      'WDP-NA-C-000',
      'WDP-FLEX-S-002'
    ]
  },
  {
    family: 'wcmp',
    prefix: 'WCMP',
    selectedExpression: 'WCMP:MCF',
    tableDocumentId: 'WAP-202-WCMP',
    tableFilename: 'WAP-202-WCMP-20010624-a.txt',
    expectedSequence: ['WAP-202-WCMP'],
    expectedCounts: {
      itemCount: 62,
      mandatoryCount: 2,
      optionalCount: 60,
      clientCount: 31,
      serverCount: 31
    },
    selectedIds: [
      'WCMP-C-001',
      'WCMP-SP-C-001'
    ],
    selectedPath:
      'WCMP-C-001 plus the RFC 792 ICMP alternative WCMP-SP-C-001 for the selected CDPD/IPv4 bearer. The sections 5.1/5.2/5.5 general-WCMP alternative WCMP-SP-C-002 remains implemented only as an explicit non-IP bearer capability; bearer encapsulations in sections 5.4.1-.7 remain deferred.',
    markers: [
      'Appendix A.',
      'Static Conformance Requirements',
      'WCMP-C-001',
      'WCMP-SP-C-002',
      'WCMP-GEN-S-026'
    ]
  },
  {
    family: 'wsp',
    prefix: 'WSP',
    selectedExpression: 'WSP:MCF',
    tableDocumentId: 'WAP-203_003-WSP',
    tableFilename: 'WAP-203_003-WSP-20001218-a.txt',
    expectedSequence: [
      'WAP-203-WSP',
      'WAP-203_001-WSP',
      'WAP-203_003-WSP',
      'WAP-203_005-WSP'
    ],
    expectedCounts: {
      itemCount: 109,
      mandatoryCount: 39,
      optionalCount: 70,
      clientCount: 56,
      serverCount: 53
    },
    selectedIds: [
      'WSP-C-001',
      'WSP-CL-C-001',
      'WSP-CL-C-003',
      'WSP-CL-C-004',
      'WSP-CL-C-005',
      'WSP-CL-C-006',
      'WSP-CL-C-007',
      'WSP-CL-C-020'
    ],
    selectedPath:
      'Resolve mandatory WSP-C-001 through the connectionless WSP-CL-C-001 alternative. Connection-oriented rows remain conditional and activate WTP:MCF.',
    markers: [
      'Appendix D Static Conformance Requirements',
      'WSP-C-001',
      'WSP-CL-C-001',
      'WSP-CO-C-001',
      'WSP-CL-S-020'
    ]
  }
];

const generalWcmpCapabilityIds = new Set([
  'WCMP-SP-C-002',
  'WCMP-GEN-C-001',
  'WCMP-GEN-C-003',
  'WCMP-GEN-C-006'
]);

if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001'
) {
  throw new Error('Class-conformance target has drifted from CCR-CLASSC-C-001');
}

const selectedExpressions = new Set(
  classConformance.selectedTarget.requirementExpressions
);
const creqText = fs.readFileSync(creqTextPath, 'utf8');
for (const marker of [
  'All mandatory client features',
  'FeatureType = “MCF” / “OCF” / “MSF” / “OSF”',
  'AND has higher precedence than OR'
]) {
  if (!creqText.includes(marker)) {
    throw new Error(`WAP-221 extraction is missing marker: ${marker}`);
  }
}

for (const config of configs) {
  if (!selectedExpressions.has(config.selectedExpression)) {
    throw new Error(
      `Class-conformance ledger does not select ${config.selectedExpression}`
    );
  }

  const family = effectiveSpec.families.find(
    (entry) => entry.family === config.family
  );
  if (
    JSON.stringify(family?.effectiveSequence) !==
    JSON.stringify(config.expectedSequence)
  ) {
    throw new Error(`${config.family}: effective source sequence drift`);
  }

  const tableTextPath = path.join(sourceRoot, config.tableFilename);
  const tableText = fs.readFileSync(tableTextPath, 'utf8');
  for (const marker of config.markers) {
    if (!tableText.includes(marker)) {
      throw new Error(
        `${config.family}: effective table extraction is missing ${marker}`
      );
    }
  }

  const parsedRows = parseRows(tableText, config.prefix);
  if (config.family === 'wsp') {
    const finalSinText = fs.readFileSync(
      path.join(sourceRoot, 'WAP-203_005-WSP-20010717-a.txt'),
      'utf8'
    );
    for (const marker of [
      'Editorial Correction of SCR entry WSP-CO-C-012',
      'WTP:MCF AND',
      'WTP-C-013'
    ]) {
      if (!finalSinText.includes(marker)) {
        throw new Error(`wsp: SIN 005 extraction is missing ${marker}`);
      }
    }
    const correctedRow = parsedRows.find(
      (row) => row.id === 'WSP-CO-C-012'
    );
    correctedRow.dependencyExpression = 'WTP:MCF AND WTP-C-013';
  }
  validateParsedRows(parsedRows, config);
  const selected = new Set(config.selectedIds);
  const obligations = parsedRows.map((row, index) =>
    buildObligation(config, row, index + 1, selected)
  );
  const extractionSources = family.documents.map((document) => {
    const member = release.members.find(
      (entry) => entry.documentId === document.documentId
    );
    const ingestionMember = ingestion.members.find(
      (entry) => entry.documentId === document.documentId
    );
    const textFilename = member.filename.replace(/\.pdf$/i, '.txt');
    const textPath = path.join(sourceRoot, textFilename);
    const text = fs.readFileSync(textPath, 'utf8');
    const textSha256 = sha256(text);
    if (textSha256 !== ingestionMember?.parsedText?.sha256) {
      throw new Error(
        `${document.documentId}: private text extraction hash drift`
      );
    }
    return {
      documentId: document.documentId,
      filename: member.filename,
      sha256: member.sha256,
      role: document.documentRole,
      repositoryState: document.localState,
      textExtractionBytes: Buffer.byteLength(text),
      textExtractionSha256: textSha256
    };
  });

  const selectedRows = obligations.filter(
    (row) =>
      row.disposition.classCProfile ===
      'required-by-selected-class-c-transport-path'
  );
  const selectedStatus = countBy(
    selectedRows,
    (row) => row.mapping.implementationStatus
  );
  const summary = {
    itemCount: obligations.length,
    mandatoryCount: obligations.filter(
      (row) => row.specificationStatus === 'mandatory'
    ).length,
    optionalCount: obligations.filter(
      (row) => row.specificationStatus === 'optional'
    ).length,
    clientCount: obligations.filter((row) => row.actor === 'client').length,
    serverCount: obligations.filter((row) => row.actor === 'server').length,
    mandatoryClientCount: obligations.filter(
      (row) =>
        row.actor === 'client' && row.specificationStatus === 'mandatory'
    ).length,
    selectedClassCTransportPathCount: selectedRows.length,
    selectedImplementationStatus: selectedStatus,
    selectedDirectNormativeTestEvidenceCount: selectedRows.filter((row) =>
      row.mapping.testEvidence.some(
        (evidence) => evidence.evidenceClass === 'direct-normative'
      )
    ).length,
    selectedProvisionalTestEvidenceCount: selectedRows.filter(
      (row) =>
        row.mapping.testEvidence.length > 0 &&
        !row.mapping.testEvidence.some(
          (evidence) => evidence.evidenceClass === 'direct-normative'
        )
    ).length,
    orderedIdsSha256: sha256(
      obligations.map((row) => row.id).join('\n') + '\n'
    )
  };

  for (const [key, expected] of Object.entries(config.expectedCounts)) {
    if (summary[key] !== expected) {
      throw new Error(
        `${config.family}: expected ${key}=${expected}, got ${summary[key]}`
      );
    }
  }

  const governing = release.governingDependencies.find(
    (entry) => entry.documentId === 'WAP-221-CREQ-20010425-a'
  );
  const manifest = {
    schemaVersion: 1,
    releaseId: 'wap-1.2.1',
    family: config.family,
    recordedOn,
    target: {
      stack: 'WAP 1.2.1',
      markup: 'WML 1.3',
      classProfile: 'WAP-215 Class C client (CCR-CLASSC-C-001)',
      selectedRequirement: config.selectedExpression,
      transportPath: config.selectedPath
    },
    authority: {
      effectiveSequence: config.expectedSequence,
      effectiveTableDocument: config.tableDocumentId,
      extractionSources,
      selectedExternalDependencies:
        config.family === 'wdp'
          ? [
              externalDependencySnapshot('rfc-768'),
              externalDependencySnapshot('rfc-791'),
              externalDependencySnapshot('tiaeia-is-732-cdpd-set')
            ]
          : config.family === 'wcmp'
            ? [selectedWcmpRfc792Snapshot()]
            : [],
      governingSource: {
        documentId: governing.documentId,
        sha256: governing.sha256,
        selectedDefinition:
          'MCF = all mandatory client features of the specification SCR',
        dependencyGrammar:
          'SCR requirement expressions use AND/OR with AND taking precedence'
      },
      classProfileSource: {
        documentId: 'WAP-215-ClassConform-20001213-a',
        sha256: release.governingDependencies.find(
          (entry) =>
            entry.documentId === 'WAP-215-ClassConform-20001213-a'
        ).sha256,
        selectedIdentifier: 'CCR-CLASSC-C-001',
        selectedRequirement: config.selectedExpression,
        ledger:
          'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
      },
      extractionMethod:
        'Row identifiers, first-line feature labels, status, actor, order, and dependency expressions were parsed from the hash-locked effective SCR table text. Private PDFs and full text remain outside Git.'
    },
    summary,
    obligations
  };

  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(
    outputRoot,
    `wap-1.2.1-${config.family}-scr.json`
  );
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `Wrote ${outputPath}: ${summary.itemCount} rows, ` +
      `${summary.selectedClassCTransportPathCount} selected transport-path rows`
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function countBy(values, keyFor) {
  return Object.fromEntries(
    [...values.reduce((counts, value) => {
      const key = keyFor(value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return counts;
    }, new Map())].sort(([left], [right]) => left.localeCompare(right))
  );
}

function externalDependencySnapshot(id) {
  const metadata = externalDependencies.dependencies.find(
    (entry) => entry.id === id
  );
  const acquisition = externalIngestion.dependencies.find(
    (entry) => entry.dependencyId === id
  );
  if (!metadata || !acquisition) {
    throw new Error(`${id}: external dependency lock is missing`);
  }
  return {
    id,
    title: metadata.title,
    sourceUrl: metadata.sourceUrl,
    referenceDisposition: metadata.referenceDisposition,
    acquisitionState: acquisition.acquisitionState,
    artifacts: acquisition.artifacts.map((artifact) => ({
      id: artifact.id,
      sourceUrl: artifact.sourceUrl,
      bytes: artifact.bytes,
      sha256: artifact.sha256
    }))
  };
}

function selectedWcmpRfc792Snapshot() {
  const snapshot = externalDependencySnapshot('rfc-792');
  const metadata = externalDependencies.dependencies.find(
    (entry) => entry.id === 'rfc-792'
  );
  const acquisition = externalIngestion.dependencies.find(
    (entry) => entry.dependencyId === 'rfc-792'
  );
  return {
    ...snapshot,
    version: metadata.version,
    authority: metadata.authority,
    authorityRecordUrl: acquisition.authorityRecordUrl,
    applicability: 'selected-ip-control'
  };
}

function parseRows(text, prefix) {
  const lines = text.split(/\r?\n/);
  const rowStart = new RegExp(`^(${prefix}-[A-Z0-9-]+-\\d{3})\\s+`);
  const starts = [];
  for (const [index, line] of lines.entries()) {
    const match = line.match(rowStart);
    if (match) {
      starts.push({ index, id: match[1] });
    }
  }

  return starts.map((start, rowIndex) => {
    const end = starts[rowIndex + 1]?.index ?? lines.length;
    const segmentLines = lines.slice(start.index, end);
    const headerParts = segmentLines[0].trim().split(/\s{2,}/);
    const statusIndex = headerParts.findIndex(
      (part, index) => index > 0 && (part === 'M' || part === 'O')
    );
    if (statusIndex === -1) {
      throw new Error(`${start.id}: could not parse M/O status`);
    }
    const feature = headerParts[1]?.trim();
    if (!feature) {
      throw new Error(`${start.id}: could not parse feature label`);
    }
    const reference =
      statusIndex > 2
        ? headerParts.slice(2, statusIndex).join(' | ')
        : statusIndex === 2
          ? headerParts[1] === feature
            ? null
            : headerParts[1]
          : null;
    const dependencyTokenPattern =
      /(?:WDP|WCMP|WSP|WTP)(?::\s*(?:MCF|OCF|MSF|OSF)|-[A-Z0-9-]+-\d{3})|\b(?:AND|OR)\b|[()]/g;
    const dependencyTokens = segmentLines.flatMap((line, lineIndex) => {
      const withoutOwnId = lineIndex === 0 ? line.replace(start.id, '') : line;
      const tokens = withoutOwnId.match(dependencyTokenPattern) ?? [];
      return tokens.some((token) => /^(?:WDP|WCMP|WSP|WTP)/.test(token))
        ? tokens
        : [];
    });
    const dependencyExpression = dependencyTokens
      .join(' ')
      .replace(/:\s+/g, ':')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')');
    return {
      id: start.id,
      actor: actorFor(start.id, prefix),
      group: groupFor(start.id, prefix),
      feature,
      reference,
      status: headerParts[statusIndex],
      dependencyExpression: dependencyExpression || null
    };
  });
}

function actorFor(id, prefix) {
  if (
    id.startsWith(`${prefix}-C-`) ||
    id.includes('-C-')
  ) {
    return 'client';
  }
  if (
    id.startsWith(`${prefix}-S-`) ||
    id.includes('-S-')
  ) {
    return 'server';
  }
  throw new Error(`${id}: actor cannot be derived`);
}

function groupFor(id, prefix) {
  const remainder = id.slice(prefix.length + 1);
  const actorMarker = remainder.search(/-(?:C|S)-\d{3}$/);
  if (actorMarker === -1) {
    return 'top-level';
  }
  return remainder.slice(0, actorMarker).toLowerCase() || 'top-level';
}

function validateParsedRows(rows, config) {
  if (rows.length !== config.expectedCounts.itemCount) {
    throw new Error(
      `${config.family}: expected ${config.expectedCounts.itemCount} rows, got ${rows.length}`
    );
  }
  const ids = rows.map((row) => row.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${config.family}: duplicate SCR row identifier`);
  }
  for (const id of config.selectedIds) {
    if (!ids.includes(id)) {
      throw new Error(`${config.family}: selected row ${id} is missing`);
    }
  }
}

function buildObligation(config, row, ordinal, selected) {
  const isSelected = selected.has(row.id);
  const isGeneralWcmpCapability =
    config.family === 'wcmp' && generalWcmpCapabilityIds.has(row.id);
  const selectedStatus = selectedImplementationStatus(config.family, row.id);
  const evidence = isSelected || isGeneralWcmpCapability
    ? selectedEvidence(config.family, row.id)
    : { implementationEvidence: [], testEvidence: [] };
  return {
    id: row.id,
    ordinal,
    actor: row.actor,
    group: row.group,
    feature: row.feature,
    referencedSection: row.reference,
    specificationStatus: row.status === 'M' ? 'mandatory' : 'optional',
    dependencyExpression: row.dependencyExpression,
    sourceAnchor: {
      documentId: config.tableDocumentId,
      staticConformanceSection:
        config.family === 'wdp'
          ? 'Appendix E'
          : config.family === 'wcmp'
            ? 'Appendix A'
            : 'Appendix D'
    },
    disposition: {
      strict: isSelected
        ? 'required-for-selected-transport-path'
        : isGeneralWcmpCapability
          ? 'optional-non-ip-bearer-capability'
        : row.actor === 'server'
          ? 'not-applicable-to-client'
          : conditionalDisposition(config.family, row),
      classCProfile: isSelected
        ? 'required-by-selected-class-c-transport-path'
        : isGeneralWcmpCapability
          ? 'capability-gated-non-ip-bearer'
        : row.actor === 'server'
          ? 'server-only'
          : conditionalDisposition(config.family, row),
      enhancementMayReplaceStrictBehavior: false
    },
    reviewState: isSelected || isGeneralWcmpCapability
      ? selectedStatus === 'implemented'
        ? 'source-extracted-class-c-path-implemented-direct-evidence'
        : 'source-extracted-class-c-path-applied-mapping-provisional'
      : 'source-extracted-not-selected-path',
    mapping: {
      implementationDomain: implementationDomain(config.family, row),
      ownerLayers: ['transport-rust'],
      requirementIds: requirementIds(config.family, row.id),
      workItems: workItems(config.family, row.id),
      implementationStatus:
        isSelected || isGeneralWcmpCapability ? selectedStatus : 'not-assessed',
      assessmentNote: isSelected || isGeneralWcmpCapability
        ? assessmentNote(config.family, row.id)
        : 'Preserved for source completeness; implementation is assessed when its optional, server, bearer, or alternate-mode capability is selected.',
      implementationEvidence: evidence.implementationEvidence,
      testEvidence: evidence.testEvidence,
      evidenceState: isSelected || isGeneralWcmpCapability
        ? selectedStatus === 'missing'
          ? 'no-implementation-or-test-evidence'
          : evidence.testEvidence.some(
                (item) => item.evidenceClass === 'direct-normative'
              )
            ? 'direct-normative-test-linked'
            : 'provisional-non-normative-test-linked'
        : 'not-assessed'
    }
  };
}

function conditionalDisposition(family, row) {
  if (family === 'wsp' && row.id.startsWith('WSP-CO-C-')) {
    return 'conditional-on-connection-oriented-wsp-and-wtp';
  }
  if (family === 'wsp' && row.id.startsWith('WSP-CL-C-')) {
    return 'optional-connectionless-feature';
  }
  if (family === 'wdp') {
    return 'optional-or-required-by-selected-bearer-address-dependency';
  }
  if (family === 'wcmp') {
    if (generalWcmpCapabilityIds.has(row.id)) {
      return 'capability-gated-non-ip-bearer';
    }
    return 'optional-or-alternate-wcmp-protocol-path';
  }
  return 'optional-client-capability';
}

function implementationDomain(family, row) {
  if (family === 'wdp') {
    if (row.id.includes('-PF-')) return 'wdp-service-primitives';
    if (row.id.includes('-NA-')) return 'wdp-addressing-and-ports';
    return 'wdp-client-profile';
  }
  if (family === 'wcmp') {
    if (id === 'WCMP-C-001' || id === 'WCMP-SP-C-001') {
      return ['RQ-TRX-006', 'RQ-TRX-007', 'RQ-TRX-008'];
    }
    if (row.id.includes('-GEN-')) return 'wcmp-message-types';
    return 'wcmp-client-profile';
  }
  if (row.id.includes('-CL-')) return 'wsp-connectionless';
  if (row.id.includes('-CO-')) return 'wsp-connection-oriented';
  return 'wsp-mode-profile';
}

function requirementIds(family, id) {
  if (family === 'wdp') {
    if (id === 'WDP-CT-C-002') return ['RQ-TRN-002'];
    return id.includes('-NA-') ? ['RQ-TRN-003'] : ['RQ-TRN-001'];
  }
  if (family === 'wcmp') {
    if (id === 'WCMP-GEN-C-003') return ['RQ-TRX-007'];
    if (id === 'WCMP-GEN-C-006') return ['RQ-TRX-008'];
    return ['RQ-TRX-006'];
  }
  if (id === 'WSP-C-001' || id === 'WSP-CL-C-001') {
    return ['RQ-TRN-010'];
  }
  if (id === 'WSP-CL-C-003' || id === 'WSP-CL-C-020') {
    return ['RQ-TRN-014'];
  }
  return ['RQ-TRN-012'];
}

function workItems(family, id) {
  if (family === 'wdp') return ['TRN-701', 'T0-19'];
  if (family === 'wcmp') {
    return id === 'WCMP-C-001' || id === 'WCMP-SP-C-001'
      ? ['TRN-708']
      : ['TRN-703', 'T0-17'];
  }
  if (id === 'WSP-C-001' || id === 'WSP-CL-C-001') {
    return ['WSP-801', 'T0-09'];
  }
  if (id === 'WSP-CL-C-003' || id === 'WSP-CL-C-020') {
    return ['WSP-802', 'T0-20'];
  }
  return ['WSP-801', 'WSP-804', 'WSP-805', 'T0-27', 'T0-30'];
}

function selectedImplementationStatus(family, id) {
  if (family === 'wdp' || family === 'wcmp') return 'implemented';
  return 'implemented';
}

function assessmentNote(family, id) {
  if (family === 'wdp') {
    if (id === 'WDP-C-001') {
      return 'The selected Class C client path declares the CDPD/IPv4 bearer alternative and exposes a connectionless WDP datagram service over bounded UDP/IPv4 codec and primitive boundaries.';
    }
    if (id === 'WDP-CORE-C-001') {
      return 'The transport-owned WDP profile preserves service data, addresses, and ports while enforcing source-derived UDP/IPv4 header, length, checksum, and deterministic failure rules.';
    }
    if (id.startsWith('WDP-PF-C-')) {
      return 'Typed T-DUnitdata request and indication structures preserve the exact selected address, port, and user-data parameters without connection state or content mutation.';
    }
    if (id === 'WDP-CT-C-002') {
      return 'The selected AMPS/CDPD/IPv4 profile declares bearer value 0x0D and maps WDP directly to UDP protocol 17; the informative TIA/EIA-732 payload remains metadata-only and uncredited.';
    }
    return 'The selected IPv4 dependency uses four-octet source and destination addresses, both 16-bit port fields, and the exact WAP Appendix B registered service-port table with direct fixtures.';
  }
  if (family === 'wcmp') {
    if (id === 'WCMP-C-001') {
      return 'The strict CDPD/IPv4 profile routes WDP control traffic through RFC 792 ICMP while the general-WCMP codec is reachable only through an explicit non-IP bearer profile.';
    }
    if (id === 'WCMP-SP-C-001') {
      return 'The RFC 792 codec maps type 3 codes 3 and 4 plus echo at the WDP error boundary; RFC 1191 clarifies the code 4 Next-Hop MTU field.';
    }
    if (id === 'WCMP-SP-C-002') {
      return 'The general WCMP Type/Code/data structure remains implemented and directly evidenced for explicitly selected non-IP bearers only.';
    }
    if (id === 'WCMP-GEN-C-001') {
      return 'Destination Unreachable type 51 and selected codes retain byte-exact evidence for explicit non-IP bearers only.';
    }
    if (id === 'WCMP-GEN-C-003') {
      return 'Message Too Big type 60 code 0 retains byte-exact evidence for explicit non-IP bearers only.';
    }
    return 'Echo Reply type 179 code 0 retains byte-exact evidence for explicit non-IP bearers only.';
  }
  if (id === 'WSP-C-001' || id === 'WSP-CL-C-001') {
    return 'The strict Class C connectionless profile maps role-legal non-confirmed WSP primitives directly to one Unitdata request and one canonical transaction-ID-prefixed PDU without WSP session state.';
  }
  if (id === 'WSP-CL-C-003' || id === 'WSP-CL-C-020') {
    return id === 'WSP-CL-C-003'
      ? 'The WSP-801 byte-exact matrix and WSP-802 header fixture jointly close integer order, Content-Type seams, generic header framing, the effective registry, code pages, and fallback policy.'
      : 'The WSP-802 header fixture directly closes Encoding-Version defaults, selection, extension pages, caching, hop-by-hop behavior, and compatible retry policy.';
  }
  return 'The canonical WAP-203 connectionless codec and stateless primitive adapter provide source-linked GET, POST, Reply, transaction, status, URI, body, header-byte preservation, and endpoint-role evidence.';
}

function selectedEvidence(family, id) {
  if (family === 'wcmp') {
    const evidenceById = {
      'WCMP-C-001': {
        path: 'transport-rust/src/network/wcmp/profile.rs',
        symbol: 'pub enum WdpControlProfile'
      },
      'WCMP-SP-C-001': {
        path: 'transport-rust/src/network/wcmp/icmpv4.rs',
        symbol: 'pub fn decode_icmpv4'
      },
      'WCMP-SP-C-002': {
        path: 'transport-rust/src/network/wcmp/codec.rs',
        symbol: 'pub fn decode_wcmp'
      },
      'WCMP-GEN-C-001': {
        path: 'transport-rust/src/network/wcmp/handler.rs',
        symbol: 'WcmpGenerationFailure::PortUnreachable'
      },
      'WCMP-GEN-C-003': {
        path: 'transport-rust/src/network/wcmp/handler.rs',
        symbol: 'WcmpGenerationFailure::FirstSegmentExceedsReassemblyBuffer'
      },
      'WCMP-GEN-C-006': {
        path: 'transport-rust/src/network/wcmp/handler.rs',
        symbol: 'WcmpMessage::EchoReply'
      }
    };
    const testById = {
      'WCMP-C-001':
        'general_wcmp_is_available_only_with_the_explicit_non_ip_profile',
      'WCMP-SP-C-001':
        'destination_port_unreachable_maps_at_the_wdp_boundary',
      'WCMP-SP-C-002':
        'selected_messages_preserve_exact_wap_1_2_1_bytes_and_roundtrip',
      'WCMP-GEN-C-001':
        'generation_maps_port_and_buffer_failures_to_selected_messages',
      'WCMP-GEN-C-003':
        'generation_maps_port_and_buffer_failures_to_selected_messages',
      'WCMP-GEN-C-006':
        'echo_request_generates_exact_reply_and_preserves_correlation'
    };
    const strictSelected = id === 'WCMP-C-001' || id === 'WCMP-SP-C-001';
    return {
      implementationEvidence: [evidenceById[id]],
      testEvidence: [
        {
          path: strictSelected
            ? 'transport-rust/tests/wcmp_cdpd_icmp_profile.rs'
            : 'transport-rust/src/network/wcmp/tests.rs',
          test: testById[id],
          fixture: strictSelected
            ? 'transport-rust/tests/fixtures/transport/wcmp_cdpd_icmp_profile/icmp_fixture.json'
            : 'transport-rust/tests/fixtures/transport/wcmp_core_mapped/wcmp_fixture.json',
          evidenceClass: 'direct-normative',
          limitation: strictSelected
            ? 'Covers the selected client-side strict CDPD/IPv4 boundary; no WCMP server claim is made.'
            : 'Closes only the capability-gated non-IP general-WCMP branch; it does not satisfy or execute in the strict CDPD/IPv4 profile.'
        }
      ]
    };
  }
  if (family === 'wdp') {
    const evidenceById = {
      'WDP-C-001': {
        path: 'transport-rust/src/network/wdp/profile.rs',
        symbol: 'pub struct CdpdIpv4Profile'
      },
      'WDP-CORE-C-001': {
        path: 'transport-rust/src/network/wdp/ipv4_udp.rs',
        symbol: 'pub fn decode_cdpd_ipv4_udp'
      },
      'WDP-PF-C-001': {
        path: 'transport-rust/src/network/wdp/primitive.rs',
        symbol: 'pub struct TDUnitdataRequest'
      },
      'WDP-PF-C-002': {
        path: 'transport-rust/src/network/wdp/primitive.rs',
        symbol: 'pub struct TDUnitdataIndication'
      },
      'WDP-CT-C-002': {
        path: 'transport-rust/src/network/wdp/profile.rs',
        symbol: 'WDP_CDPD_IPV4_BEARER_TYPE'
      },
      'WDP-NA-C-000': {
        path: 'transport-rust/src/network/wdp/datagram.rs',
        symbol: 'pub struct WdpAddress'
      },
      'WDP-NA-C-003': {
        path: 'transport-rust/src/network/wdp/ipv4_udp.rs',
        symbol: 'WDP_UDP_IPV4_PROTOCOL_NUMBER'
      },
      'WDP-NA-C-006': {
        path: 'transport-rust/src/network/wdp/datagram.rs',
        symbol: 'pub enum WdpServicePort'
      },
      'WDP-NA-C-007': {
        path: 'transport-rust/src/network/wdp/primitive.rs',
        symbol: 'pub source_port'
      }
    };
    const testById = {
      'WDP-C-001':
        'source_derived_fixture_covers_selected_class_c_rows_and_clauses',
      'WDP-CORE-C-001':
        'selected_cdpd_ipv4_profile_preserves_exact_udp_ipv4_bytes',
      'WDP-PF-C-001':
        'td_unitdata_request_and_indication_preserve_address_port_and_payload_semantics',
      'WDP-PF-C-002':
        'td_unitdata_request_and_indication_preserve_address_port_and_payload_semantics',
      'WDP-CT-C-002': 'registered_port_and_bearer_profile_are_exact',
      'WDP-NA-C-000':
        'td_unitdata_request_and_indication_preserve_address_port_and_payload_semantics',
      'WDP-NA-C-003':
        'selected_cdpd_ipv4_profile_preserves_exact_udp_ipv4_bytes',
      'WDP-NA-C-006': 'registered_port_and_bearer_profile_are_exact',
      'WDP-NA-C-007':
        'udp_source_port_zero_and_computed_zero_checksum_follow_rfc_768_encoding'
    };
    return {
      implementationEvidence: [evidenceById[id]],
      testEvidence: [
        {
          path: 'transport-rust/src/network/wdp/tests.rs',
          test: testById[id],
          fixture:
            'transport-rust/tests/fixtures/transport/wdp_cdpd_ipv4_mapped/wdp_fixture.json',
          evidenceClass: 'direct-normative',
          limitation:
            'Closes only the nine selected CDPD/IPv4 WDP client rows and their mapped TRN-701 clauses at SCR-row level; TRN-702 separately closes its adopted constrained-payload clause subset without widening row selection. Alternate bearers, server rows, and optional services remain unclaimed.'
        }
      ]
    };
  }

  if (id === 'WSP-C-001' || id === 'WSP-CL-C-001') {
    return {
      implementationEvidence: [
        {
          path: 'transport-rust/src/wsp_connectionless_primitive_profile.rs',
          symbol: 'pub fn primitive_request_to_unitdata'
        },
        {
          path: 'transport-rust/src/network/wsp/connectionless.rs',
          symbol: 'pub enum WspConnectionlessPdu'
        }
      ],
      testEvidence: [
        {
          path: 'transport-rust/tests/wsp_connectionless_matrix.rs',
          test: 'primitives_map_one_to_one_through_both_unitdata_saps',
          fixture: 'transport-rust/tests/fixtures/transport/wsp_connectionless_matrix/matrix_fixture.json',
          evidenceClass: 'direct-normative',
          limitation:
            'Closes only the selected non-confirmed Class C connectionless primitive/PDU path; connection-oriented WSP and WTP remain inactive.'
        }
      ]
    };
  }
  if (id === 'WSP-CL-C-003') {
    return {
      implementationEvidence: [
        {
          path: 'transport-rust/src/network/wsp/connectionless.rs',
          symbol: 'pub fn encode_connectionless_pdu'
        },
        {
          path: 'transport-rust/src/network/wsp/header_block.rs',
          symbol: 'encode_header_block'
        }
      ],
      testEvidence: [
        {
          path: 'transport-rust/tests/wsp_connectionless_matrix.rs',
          test: 'source_linked_get_post_and_reply_pdus_are_byte_exact_roundtrips',
          fixture: 'transport-rust/tests/fixtures/transport/wsp_connectionless_matrix/matrix_fixture.json',
          evidenceClass: 'direct-normative',
          limitation:
            'Preserves the completed WSP-801 byte-exact PDU and Content-Type framing evidence.'
        },
        {
          path: 'transport-rust/tests/wsp_header_grammar.rs',
          test: 'effective_default_header_registry_is_complete_and_versioned',
          fixture: 'transport-rust/tests/fixtures/transport/wsp_header_grammar_mapped/header_fixture.json',
          evidenceClass: 'direct-normative',
          limitation:
            'Detailed Content-Type media and charset ownership remains on the shared WML-304 seam.'
        }
      ]
    };
  }
  if (id === 'WSP-CL-C-020') {
    return {
      implementationEvidence: [
        {
          path: 'transport-rust/src/network/wsp/header_block.rs',
          symbol: 'encode_header_block'
        },
        {
          path: 'transport-rust/src/network/wsp/encoding_version.rs',
          symbol: 'WspEncodingVersionPolicy'
        }
      ],
      testEvidence: [
        {
          path: 'transport-rust/tests/wsp_header_grammar.rs',
          test: 'mapped_header_sections_decode_with_explicit_unknown_policy',
          fixture: 'transport-rust/tests/fixtures/transport/wsp_header_grammar_mapped/header_fixture.json',
          evidenceClass: 'direct-normative',
          limitation:
            'Connection-oriented capability negotiation remains WSP-803 ownership.'
        }
      ]
    };
  }
  return {
    implementationEvidence: [
      {
        path: 'transport-rust/src/network/wsp/connectionless.rs',
        symbol: 'pub fn encode_connectionless_pdu'
      },
      {
        path: 'transport-rust/src/wsp_connectionless_primitive_profile.rs',
        symbol: 'pub fn unitdata_indication_to_primitive'
      }
    ],
    testEvidence: [
      {
        path: 'transport-rust/tests/wsp_connectionless_matrix.rs',
        test: 'source_linked_get_post_and_reply_pdus_are_byte_exact_roundtrips',
        fixture: 'transport-rust/tests/fixtures/transport/wsp_connectionless_matrix/matrix_fixture.json',
        evidenceClass: 'direct-normative',
        limitation:
          'Closes only the selected WSP-801 GET/POST/Reply and primitive matrix; header registry/version closure remains WSP-802 and no connection-oriented path is claimed.'
      }
    ]
  };
}
