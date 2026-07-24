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
      'WCMP-SP-C-002',
      'WCMP-GEN-C-001',
      'WCMP-GEN-C-003',
      'WCMP-GEN-C-006'
    ],
    selectedPath:
      'WCMP-C-001 plus the general WCMP message-structure alternative WCMP-SP-C-002 and its three dependency rows. The RFC ICMP alternative remains capability-declared but unselected.',
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
    selectedDirectNormativeTestEvidenceCount: 0,
    selectedProvisionalTestEvidenceCount: selectedRows.filter(
      (row) => row.mapping.testEvidence.length > 0
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
  const selectedStatus = selectedImplementationStatus(config.family, row.id);
  const evidence = isSelected
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
        : row.actor === 'server'
          ? 'not-applicable-to-client'
          : conditionalDisposition(config.family, row),
      classCProfile: isSelected
        ? 'required-by-selected-class-c-transport-path'
        : row.actor === 'server'
          ? 'server-only'
          : conditionalDisposition(config.family, row),
      enhancementMayReplaceStrictBehavior: false
    },
    reviewState: isSelected
      ? 'source-extracted-class-c-path-applied-mapping-provisional'
      : 'source-extracted-not-selected-path',
    mapping: {
      implementationDomain: implementationDomain(config.family, row),
      ownerLayers: ['transport-rust'],
      requirementIds: requirementIds(config.family, row.id),
      workItems: workItems(config.family, row.id),
      implementationStatus: isSelected ? selectedStatus : 'not-assessed',
      assessmentNote: isSelected
        ? assessmentNote(config.family, row.id)
        : 'Preserved for source completeness; implementation is assessed when its optional, server, bearer, or alternate-mode capability is selected.',
      implementationEvidence: evidence.implementationEvidence,
      testEvidence: evidence.testEvidence,
      evidenceState: isSelected
        ? selectedStatus === 'missing'
          ? 'no-implementation-or-test-evidence'
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
  if (family === 'wcmp') return ['TRN-703', 'T0-17'];
  if (id === 'WSP-C-001' || id === 'WSP-CL-C-001') {
    return ['WSP-801', 'T0-09'];
  }
  if (id === 'WSP-CL-C-003' || id === 'WSP-CL-C-020') {
    return ['WSP-802', 'T0-20'];
  }
  return ['WSP-801', 'WSP-804', 'WSP-805', 'T0-27', 'T0-30'];
}

function selectedImplementationStatus(family) {
  return family === 'wcmp' ? 'missing' : 'partial';
}

function assessmentNote(family, id) {
  if (family === 'wdp') {
    if (id === 'WDP-C-001') {
      return 'A WDP datagram/UDP path exists, but no historical bearer alternative is capability-selected and proven against the WAP-200 dependency closure.';
    }
    if (id === 'WDP-CORE-C-001') {
      return 'The Rust datagram model composes send/receive and address/port fields, but the complete WAP-200 abstract-service contract lacks source-derived fixtures.';
    }
    if (id.startsWith('WDP-PF-C-')) {
      return 'Send/receive operations exist behind DatagramTransport, but exact T-DUnitdata primitive semantics and error boundaries are not tested from WAP-200 vectors.';
    }
    if (id === 'WDP-CT-C-002') {
      return 'The UDP/IP adapter matches the WAP-200 CDPD transport shape, but the CDPD capability is not declared and the cited TIA/EIA-732 authority remains an open external-source record.';
    }
    return 'IPv4/IPv6 and source/destination port fields exist, but the mandatory addressing dependency choice and exact WAP-200 port semantics are not yet declared and proven.';
  }
  if (family === 'wcmp') {
    return 'No WCMP or ICMP implementation exists in transport-rust; the selected general-WCMP dependency path has no codec, state, or executable fixtures.';
  }
  if (id === 'WSP-C-001' || id === 'WSP-CL-C-001') {
    return 'Native fetch and session types support a connectionless path, but the strict Class C mode capability and its WDP dependency closure are not yet machine-declared.';
  }
  if (id === 'WSP-CL-C-003' || id === 'WSP-CL-C-020') {
    return 'Header and encoding-version modules provide substantial behavior, but their tables/defaults are successor-oriented and lack WAP-203 effective-source vectors.';
  }
  return 'Native connectionless GET/POST/REPLY encoding exists with synthetic tests, but exact WAP-203 PDU, primitive, status, and assigned-number coverage is incomplete.';
}

function selectedEvidence(family, id) {
  if (family === 'wcmp') {
    return { implementationEvidence: [], testEvidence: [] };
  }
  if (family === 'wdp') {
    if (id === 'WDP-PF-C-001') {
      return {
        implementationEvidence: [
          {
            path: 'transport-rust/src/network/wdp/transport_trait.rs',
            symbol: 'fn send(&mut self'
          }
        ],
        testEvidence: [
          {
            path: 'transport-rust/src/network/wdp/udp_adapter.rs',
            test: 'udp_send_and_receive_roundtrip_with_known_service_ports',
            limitation:
              'Synthetic UDP round trip; not a source-derived T-DUnitdata request vector.'
          }
        ]
      };
    }
    if (id === 'WDP-PF-C-002') {
      return {
        implementationEvidence: [
          {
            path: 'transport-rust/src/network/wdp/transport_trait.rs',
            symbol: 'fn receive(&mut self'
          }
        ],
        testEvidence: [
          {
            path: 'transport-rust/src/network/wdp/udp_adapter.rs',
            test: 'udp_send_and_receive_roundtrip_with_known_service_ports',
            limitation:
              'Synthetic UDP round trip; not a source-derived T-DUnitdata indication vector.'
          }
        ]
      };
    }
    const symbol =
      id === 'WDP-NA-C-000'
        ? 'WdpAddress'
        : id === 'WDP-CT-C-002'
          ? 'UdpDatagramTransport'
        : id === 'WDP-NA-C-006'
          ? 'pub dst_port'
          : id === 'WDP-NA-C-007'
            ? 'pub src_port'
            : 'WdpDatagram';
    return {
      implementationEvidence: [
        {
          path:
            id === 'WDP-CT-C-002'
              ? 'transport-rust/src/network/wdp/udp_adapter.rs'
              : 'transport-rust/src/network/wdp/datagram.rs',
          symbol
        }
      ],
      testEvidence: [
        {
          path: 'transport-rust/src/network/wdp/udp_adapter.rs',
          test: 'udp_send_and_receive_roundtrip_with_known_service_ports',
          limitation:
            'Synthetic transport evidence; does not close the WAP-200 bearer/address dependency choice.'
        }
      ]
    };
  }

  if (id === 'WSP-C-001' || id === 'WSP-CL-C-001') {
    return {
      implementationEvidence: [
        {
          path: 'transport-rust/src/network/wsp/session.rs',
          symbol: 'WspSessionMode::Connectionless'
        },
        {
          path: 'transport-rust/src/native_fetch.rs',
          symbol: 'execute_native_wap_request_with_transport'
        }
      ],
      testEvidence: [
        {
          path: 'transport-rust/tests/fixtures/transport/wsp_connectionless_primitive_profile_mapped/primitive_profile_fixture.json',
          test: 'connectionless-mode-gating-and-sequence',
          limitation:
            'Project-authored fixture; not derived from the WAP-203 effective table or protocol vectors.'
        }
      ]
    };
  }
  if (id === 'WSP-CL-C-003' || id === 'WSP-CL-C-020') {
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
          path: 'transport-rust/tests/fixtures/transport/wsp_pdu_baseline_mapped/pdu_fixture.json',
          test: 'reply-encoding-version-header-and-body',
          limitation:
            'Synthetic fixture; WAP-203/SIN-005 header-table identity is not proven.'
        }
      ]
    };
  }
  return {
    implementationEvidence: [
      {
        path: 'transport-rust/src/native_fetch.rs',
        symbol: 'encode_connectionless_request'
      },
      {
        path: 'transport-rust/src/native_fetch.rs',
        symbol: 'decode_connectionless_wsp_reply'
      }
    ],
    testEvidence: [
      {
        path: 'transport-rust/src/native_fetch.rs',
        test:
          id === 'WSP-CL-C-006' || id === 'WSP-CL-C-007'
            ? 'native_connectionless_post_wire_format_encodes_header_block_and_body'
            : 'native_connectionless_wire_format_prefixes_transaction_id',
        limitation:
          'Synthetic local wire test; not a source-derived WAP-203 conformance vector.'
      }
    ]
  };
}
