#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const waeSinTextPath = option('--wae-sin-text');
const creqTextPath = option('--creq-text');
const successorTextPath = option('--successor-text');
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-wae-scr.json';

if (!waeSinTextPath || !creqTextPath || !successorTextPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-wae-scr-ledger.mjs ' +
      '--wae-sin-text /absolute/path/WAP-190_104-WAE-Spec-20010731-a.txt ' +
      '--creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt ' +
      '--successor-text /absolute/path/WAP-236-WAESpec-20020207-a.txt ' +
      '--recorded-on YYYY-MM-DD [--output path]'
  );
  process.exit(2);
}

const release = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-release.json',
    'utf8'
  )
);
const ingestion = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-ingestion-status.json',
    'utf8'
  )
);
const effectiveSpec = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-effective-spec.json',
    'utf8'
  )
);
const classConformance = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
    'utf8'
  )
);

if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001' ||
  !classConformance.selectedTarget?.requirementExpressions?.includes(
    'WAESpec:MCF'
  )
) {
  throw new Error(
    'WAP-215 class ledger must select CCR-CLASSC-C-001 with WAESpec:MCF'
  );
}

const waeFamily = effectiveSpec.families.find(
  (family) => family.family === 'wae'
);
if (!waeFamily) {
  throw new Error('Effective-spec graph does not contain the WAE family');
}

const sourceById = new Map(
  waeFamily.documents.map((document) => [document.documentId, document])
);
const expectedSequence = [
  'WAP-190-WAESpec',
  'WAP-190_101-WAESpec',
  'WAP-190_102-WAESpec',
  'WAP-190_103-WAESpec',
  'WAP-190_104-WAE-Spec'
];
if (
  JSON.stringify(waeFamily.effectiveSequence) !==
  JSON.stringify(expectedSequence)
) {
  throw new Error('Effective WAE source sequence has drifted');
}

const waeSinText = fs.readFileSync(waeSinTextPath, 'utf8');
const creqText = fs.readFileSync(creqTextPath, 'utf8');
const successorText = fs.readFileSync(successorTextPath, 'utf8');
const waeIngestion = ingestion.members.find(
  (member) => member.documentId === 'WAP-190_104-WAE-Spec'
);
const waeTextSha256 = crypto
  .createHash('sha256')
  .update(waeSinText)
  .digest('hex');
if (waeTextSha256 !== waeIngestion?.parsedText?.sha256) {
  throw new Error('WAP-190_104 text extraction hash does not match ingestion lock');
}

for (const marker of [
  'The following represents the resulting new SCR table.',
  'Appendix B: Static Conformance Requirements',
  'WAESpec-C-002',
  'WAESpec-WBMP-C-000',
  'WAESpec-WVDT-C-021',
  'WAESpec-WCHH-CS-'
]) {
  if (!waeSinText.includes(marker)) {
    throw new Error(`WAP-190_104 extraction is missing marker: ${marker}`);
  }
}
for (const marker of [
  'All mandatory client features',
  'FeatureType = “MCF” / “OCF” / “MSF” / “OSF”'
]) {
  if (!creqText.includes(marker)) {
    throw new Error(`WAP-221 extraction is missing marker: ${marker}`);
  }
}
for (const marker of [
  'Appendix A. Static Conformance Requirements (Normative)',
  'WAESpec-MT-C-001',
  'WAESpec-WMLS-C-',
  'WAESpec-UAB-C-002'
]) {
  if (!successorText.includes(marker)) {
    throw new Error(`WAP-236 extraction is missing marker: ${marker}`);
  }
}

const rows = [];

function addRows(actor, group, staticConformanceSection, values) {
  for (const [id, feature, referencedSection, status, expression = null] of values) {
    rows.push({
      id,
      actor,
      group,
      staticConformanceSection,
      feature,
      referencedSection,
      status,
      expression
    });
  }
}

addRows('wae-user-agent', 'general-wae-features', 'Appendix B 1.1', [
  ['WAESpec-C-002', 'Basic HTTP 1.1 authentication', '5.1.2', 'M'],
  ['WAESpec-C-003', 'http: URL scheme', '5.1.3', 'M'],
  ['WAESpec-C-005', 'Character set / encoding', '5.1.4', 'M'],
  ['WAESpec-C-006', 'Language', '5.1.4', 'M'],
  ['WAESpec-C-007', 'Media type', '5.1.4', 'M'],
  ['WAESpec-C-015', 'Wireless Markup Language', '5.1.5', 'M'],
  ['WAESpec-C-016', 'WMLScript', '5.1.6', 'M'],
  ['WAESpec-C-017', 'WML user agent', '5.1.7.2', 'M'],
  ['WAESpec-C-018', 'WTA user agent', '5.1.7.1', 'O'],
  [
    'WAESpec-C-019',
    'application/vnd.wap.wbxml media type',
    '5.1.8.1',
    'M'
  ],
  [
    'WAESpec-C-020',
    'application/vnd.wap.wmlc media type',
    '5.1.8.1',
    'M'
  ],
  [
    'WAESpec-C-021',
    'application/vnd.wap.wmlscriptc media type',
    '5.1.8.2',
    'M'
  ],
  ['WAESpec-C-022', 'text/x-vCard media type', '5.1.8.3', 'O'],
  ['WAESpec-C-023', 'text/x-vCalendar media type', '5.1.8.4', 'O'],
  ['WAESpec-C-025', 'image/vnd.wap.wbmp', '5.1.8.5', 'O'],
  [
    'WAESpec-C-026',
    'application/vnd.wap.multipart.mixed',
    '5.1.8.6',
    'O'
  ],
  [
    'WAESpec-C-027',
    'application/vnd.wap.multipart.related',
    '5.1.8.6',
    'O'
  ],
  [
    'WAESpec-C-028',
    'application/vnd.wap.multipart.alternative',
    '5.1.8.6',
    'O'
  ],
  [
    'WAESpec-C-029',
    'application/vnd.wap.multipart.form-data',
    '5.1.8.6',
    'O'
  ],
  ['WAESpec-C-030', 'Channels', '5.1.8.7', 'O'],
  ['WAESpec-C-031', 'Service Indication', '5.1.9', 'O']
]);

addRows('wae-user-agent', 'graphics', 'Appendix B 1.2', [
  [
    'WAESpec-WGRAPHICS-C-001',
    'Graphic image support',
    '6.1',
    'O',
    'WAESpec-WBMP-C-000 AND WML-C-32'
  ]
]);

addRows('wae-user-agent', 'wbmp', 'Appendix B 1.3', [
  [
    'WAESpec-WBMP-C-000',
    'Wireless bitmap support',
    '6.1',
    'O',
    'WAESpec-C-025 AND WAESpec-WBMP-C-001 AND WAESpec-WBMP-C-002 AND WAESpec-WBMP-C-003 AND WAESpec-WBMP-C-004 AND WAESpec-WBMP-C-005 AND WAESpec-WBMP-C-006 AND WAESpec-WBMP-C-007'
  ],
  [
    'WAESpec-WBMP-C-001',
    'image/vnd.wap.wbmp; level=0',
    '6.1',
    'O'
  ],
  ['WAESpec-WBMP-C-002', 'WBMP syntax', '6.2', 'O'],
  ['WAESpec-WBMP-C-003', 'Multi-byte integer values', '6.3.1', 'O'],
  ['WAESpec-WBMP-C-004', 'Header parts', '6.3.2', 'O'],
  ['WAESpec-WBMP-C-005', 'Extension headers', '6.3.2', 'O'],
  [
    'WAESpec-WBMP-C-006',
    'Data structures for supported image types',
    '6.4',
    'O'
  ],
  ['WAESpec-WBMP-C-007', 'WBMP type 0 support', '6.5', 'O']
]);

addRows('wae-user-agent', 'calendar-and-phone-book', 'Appendix B 1.4', [
  [
    'WAESpec-WVDT-C-001',
    'vCard support',
    '7.1',
    'O',
    'WAESpec-C-022 AND WAESpec-WVDT-C-014'
  ],
  [
    'WAESpec-WVDT-C-002',
    'vCalendar support',
    '7.1',
    'O',
    'WAESpec-C-023 AND WAESpec-WVDT-C-015'
  ],
  [
    'WAESpec-WVDT-C-003',
    'vCard data using WDP datagrams',
    '7.2',
    'O',
    'WAESpec-WVDT-C-009'
  ],
  [
    'WAESpec-WVDT-C-004',
    'vCalendar data using WDP datagrams',
    '7.2',
    'O',
    'WAESpec-WVDT-C-021'
  ],
  [
    'WAESpec-WVDT-C-005',
    'vCard data using WSP requests',
    '7.2',
    'O',
    'WAESpec-WVDT-C-010'
  ],
  [
    'WAESpec-WVDT-C-006',
    'vCalendar data using WSP requests',
    '7.2',
    'O',
    'WAESpec-WVDT-C-011'
  ],
  ['WAESpec-WVDT-C-007', 'vCard data using Push', '7.2', 'O'],
  ['WAESpec-WVDT-C-008', 'vCalendar data using Push', '7.2', 'O'],
  [
    'WAESpec-WVDT-C-009',
    'Correct vCard WDP port and datagram format',
    '7.2.1',
    'O',
    '(WDP-RP-C-003 AND WDP:MCF) OR (WDP-RP-C-005 AND WDP:MCF AND WTLS:MCF)'
  ],
  ['WAESpec-WVDT-C-010', 'text/x-vCard WSP exchange', '7.2.2', 'O'],
  ['WAESpec-WVDT-C-011', 'text/x-vCalendar WSP exchange', '7.2.2', 'O'],
  ['WAESpec-WVDT-C-012', '.vcf extension', '7.2.2', 'O'],
  ['WAESpec-WVDT-C-013', '.vcs extension', '7.2.2', 'O'],
  [
    'WAESpec-WVDT-C-014',
    'vCard formats for sending phone-book data',
    '7.3',
    'O',
    'WAESpec-WVDT-C-017 AND WAESpec-WVDT-C-018'
  ],
  [
    'WAESpec-WVDT-C-015',
    'vCalendar formats for sending calendar information',
    '7.3',
    'O',
    'WAESpec-WVDT-C-020'
  ],
  [
    'WAESpec-WVDT-C-016',
    'Phone-book data exchange',
    '7.3',
    'O',
    'WAESpec-WVDT-C-017 AND WAESpec-WVDT-C-018 AND WAESpec-WVDT-C-009'
  ],
  [
    'WAESpec-WVDT-C-017',
    'Display vCard Name and Telephone Number',
    '7.3',
    'O'
  ],
  [
    'WAESpec-WVDT-C-018',
    'Support vCard Name and Telephone Number properties',
    '7.3',
    'O'
  ],
  [
    'WAESpec-WVDT-C-019',
    'Calendar data exchange',
    '7.3',
    'O',
    'WAESpec-WVDT-C-020 AND WAESpec-WVDT-C-021'
  ],
  ['WAESpec-WVDT-C-020', 'Display vEvent object to user', '7.3', 'O'],
  [
    'WAESpec-WVDT-C-021',
    'Correct vCalendar WDP port and datagram format',
    '7.2.1',
    'O',
    '(WDP-RP-C-004 AND WDP:MCF) OR (WDP-RP-C-006 AND WDP:MCF AND WTLS:MCF)'
  ]
]);

addRows('wae-server', 'general-wae-features', 'Appendix B 2.1', [
  ['WAESpec-S-002', 'Basic HTTP 1.1 authentication', '5.1.2', 'M'],
  ['WAESpec-S-003', 'http: URL scheme', '5.1.3', 'M'],
  ['WAESpec-S-005', 'Character set / encoding', '5.1.4', 'M'],
  ['WAESpec-S-006', 'Language', '5.1.4', 'M'],
  ['WAESpec-S-007', 'Media type', '5.1.4', 'M'],
  ['WAESpec-S-015', 'Wireless Markup Language', '5.1.5', 'M'],
  ['WAESpec-S-016', 'WMLScript', '5.1.6', 'M'],
  ['WAESpec-S-017', 'WML user agent', '5.1.7.2', 'M'],
  ['WAESpec-S-018', 'WTA user agent', '5.1.7.1', 'O'],
  [
    'WAESpec-S-019',
    'application/vnd.wap.wbxml media type',
    '5.1.8.1',
    'M'
  ],
  [
    'WAESpec-S-020',
    'application/vnd.wap.wmlc media type',
    '5.1.8.1',
    'M'
  ],
  [
    'WAESpec-S-021',
    'application/vnd.wap.wmlscriptc media type',
    '5.1.8.2',
    'M'
  ],
  ['WAESpec-S-022', 'text/x-vCard media type', '5.1.8.3', 'O'],
  ['WAESpec-S-023', 'text/x-vCalendar media type', '5.1.8.4', 'O'],
  ['WAESpec-S-025', 'image/vnd.wap.wbmp', '5.1.8.5', 'M'],
  [
    'WAESpec-S-026',
    'application/vnd.wap.multipart.mixed',
    '5.1.8.6',
    'O'
  ],
  [
    'WAESpec-S-027',
    'application/vnd.wap.multipart.related',
    '5.1.8.6',
    'O'
  ],
  [
    'WAESpec-S-028',
    'application/vnd.wap.multipart.alternative',
    '5.1.8.6',
    'O'
  ],
  [
    'WAESpec-S-029',
    'application/vnd.wap.multipart.form-data',
    '5.1.8.6',
    'M'
  ],
  ['WAESpec-S-030', 'Channels', '5.1.8.7', 'O'],
  ['WAESpec-S-031', 'Service Indication', '5.1.9', 'O']
]);

addRows('wae-server', 'client-header-handling', 'Appendix B 2.2', [
  [
    'WAESpec-WCHH-S-001',
    'Cached request headers in WSP connect service primitive',
    '8',
    'M'
  ],
  [
    'WAESpec-WCHH-S-002',
    'Cached request headers in WSP resume service primitive',
    '8',
    'O',
    'WSP_CO_S008'
  ]
]);

addRows('wae-server', 'calendar-and-phone-book', 'Appendix B 2.3', [
  [
    'WAESpec-WVDT-S-001',
    'vCard support',
    '7.1',
    'O',
    'WAESpec-S-022'
  ],
  [
    'WAESpec-WVDT-S-002',
    'vCalendar support',
    '7.1',
    'O',
    'WAESpec-S-023'
  ],
  [
    'WAESpec-WVDT-S-003',
    'vCard data using WDP datagrams',
    '7.2',
    'O',
    'WAESpec-WVDT-S-009'
  ],
  [
    'WAESpec-WVDT-S-004',
    'vCalendar data using WDP datagrams',
    '7.2',
    'O',
    'WAESpec-WVDT-S-021'
  ],
  [
    'WAESpec-WVDT-S-005',
    'vCard data using WSP requests',
    '7.2',
    'O',
    'WAESpec-WVDT-S-010'
  ],
  [
    'WAESpec-WVDT-S-006',
    'vCalendar data using WSP requests',
    '7.2',
    'O',
    'WAESpec-WVDT-S-011'
  ],
  ['WAESpec-WVDT-S-007', 'vCard data using Push', '7.2', 'O'],
  ['WAESpec-WVDT-S-008', 'vCalendar data using Push', '7.2', 'O'],
  [
    'WAESpec-WVDT-S-009',
    'Correct vCard WDP port and datagram format',
    '7.2.1',
    'O',
    '(WDP-RP-C-003 AND WDP:MCF) OR (WDP-RP-C-005 AND WDP:MCF AND WTLS:MCF)'
  ],
  ['WAESpec-WVDT-S-010', 'text/x-vCard WSP exchange', '7.2.2', 'O'],
  ['WAESpec-WVDT-S-011', 'text/x-vCalendar WSP exchange', '7.2.2', 'O'],
  [
    'WAESpec-WVDT-S-021',
    'Correct vCalendar WDP port and datagram format',
    '7.2.1',
    'O',
    '(WDP-RP-C-004 AND WDP:MCF) OR (WDP-RP-C-006 AND WDP:MCF AND WTLS:MCF)'
  ]
]);

const removedRows = [
  ['WAESpec-C-001', 'wae-user-agent', 'WSP', 'CCR-only reference'],
  [
    'WAESpec-C-004',
    'wae-user-agent',
    'UAProf characteristics reporting',
    'Removed from the WAE 1.1 SCR'
  ],
  ['WAESpec-C-008', 'wae-user-agent', 'WML version', 'Removed from the WAE 1.1 SCR'],
  [
    'WAESpec-C-009',
    'wae-user-agent',
    'WMLScript version and floating-point support',
    'Removed from the WAE 1.1 SCR'
  ],
  [
    'WAESpec-C-010',
    'wae-user-agent',
    'Standard libraries supported',
    'Removed from the WAE 1.1 SCR'
  ],
  ['WAESpec-C-011', 'wae-user-agent', 'WTA version', 'Removed from the WAE 1.1 SCR'],
  [
    'WAESpec-C-012',
    'wae-user-agent',
    'WTAI Basic version',
    'Removed from the WAE 1.1 SCR'
  ],
  [
    'WAESpec-C-013',
    'wae-user-agent',
    'WTAI Public version',
    'Removed from the WAE 1.1 SCR'
  ],
  [
    'WAESpec-C-014',
    'wae-user-agent',
    'WTAI network-specific versions and libraries',
    'Removed from the WAE 1.1 SCR'
  ],
  [
    'WAESpec-C-024',
    'wae-user-agent',
    'image/png',
    'Removed by approved WAP-190_102'
  ],
  ['WAESpec-S-001', 'wae-server', 'WSP', 'CCR-only reference'],
  [
    'WAESpec-S-004',
    'wae-server',
    'UAProf characteristics reporting',
    'Removed from the WAE 1.1 SCR'
  ],
  ['WAESpec-S-008', 'wae-server', 'WML version', 'Removed from the WAE 1.1 SCR'],
  [
    'WAESpec-S-009',
    'wae-server',
    'WMLScript version and floating-point support',
    'Removed from the WAE 1.1 SCR'
  ],
  [
    'WAESpec-S-010',
    'wae-server',
    'Standard libraries supported',
    'Removed from the WAE 1.1 SCR'
  ],
  ['WAESpec-S-011', 'wae-server', 'WTA version', 'Removed from the WAE 1.1 SCR'],
  [
    'WAESpec-S-012',
    'wae-server',
    'WTAI Basic version',
    'Removed from the WAE 1.1 SCR'
  ],
  [
    'WAESpec-S-013',
    'wae-server',
    'WTAI Public version',
    'Removed from the WAE 1.1 SCR'
  ],
  [
    'WAESpec-S-014',
    'wae-server',
    'WTAI network-specific versions and libraries',
    'Removed from the WAE 1.1 SCR'
  ],
  [
    'WAESpec-S-024',
    'wae-server',
    'image/png',
    'Removed by approved WAP-190_102'
  ],
  [
    'WAESpec-WVDT-S-012',
    'wae-server',
    '.vcf extension',
    'Removed in the updated server SCR'
  ],
  [
    'WAESpec-WVDT-S-013',
    'wae-server',
    '.vcs extension',
    'Removed in the updated server SCR'
  ]
].map(([id, actor, feature, reason]) => ({
  id,
  actor,
  feature,
  effectiveDisposition: 'removed-by-approved-sin',
  reason,
  sourceAnchor: {
    documentId: 'WAP-190_104-WAE-Spec',
    changeSection: '4.2-4.3'
  }
}));

function dependencyExpression(expression) {
  if (!expression) {
    return { type: 'none', expression: null, references: [] };
  }
  const references = [
    ...new Set(
      expression.match(
        /[A-Za-z][A-Za-z0-9_-]*(?::(?:MCF|OCF|MSF|OSF)|[-_][A-Za-z0-9_-]*\d{2,3})/g
      ) ?? []
    )
  ];
  let type = 'reference';
  if (expression.includes(' AND ') && expression.includes(' OR ')) {
    type = 'mixed';
  } else if (expression.includes(' AND ')) {
    type = 'all-of';
  } else if (expression.includes(' OR ')) {
    type = 'any-of';
  }
  return { type, expression, references };
}

function codeEvidence(path, symbol) {
  return { path, symbol };
}

function testEvidence(path, test, command) {
  return { path, test, command };
}

const selectedAudit = new Map([
  [
    'WAESpec-C-002',
    {
      domain: 'authentication',
      ownerLayers: ['transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-014'],
      workItems: ['WAE-607'],
      status: 'missing',
      note:
        'WSP header names include Authorization and WWW-Authenticate, but no end-to-end HTTP Basic challenge, credential, retry, or user-facing flow was found.',
      implementationEvidence: [],
      testEvidence: []
    }
  ],
  [
    'WAESpec-C-003',
    {
      domain: 'uri-and-transport-policy',
      ownerLayers: ['transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-010'],
      workItems: ['WAE-602', 'T0-06'],
      status: 'implemented',
      note:
        'The fetch boundary recognizes the http scheme and rejects unsupported schemes deterministically.',
      implementationEvidence: [
        codeEvidence(
          'transport-rust/src/fetch_policy.rs',
          'validate_fetch_destination'
        )
      ],
      testEvidence: [
        testEvidence(
          'transport-rust/src/tests/fetch_mapping.rs',
          'transport_fetch_accepts_url_at_1024_octet_boundary',
          'cd transport-rust && cargo test --lib transport_fetch_accepts_url_at_1024_octet_boundary'
        )
      ]
    }
  ],
  [
    'WAESpec-C-005',
    {
      domain: 'capability-advertisement',
      ownerLayers: ['transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-012', 'RQ-WAE-013'],
      workItems: ['WAE-602', 'T0-05', 'T0-06'],
      status: 'implemented',
      note:
        'The WAP baseline request policy emits Accept-Charset and keeps caller overrides deterministic.',
      implementationEvidence: [
        codeEvidence(
          'transport-rust/src/fetch_policy.rs',
          'apply_ua_capability_headers'
        )
      ],
      testEvidence: [
        testEvidence(
          'transport-rust/src/tests/request_gateway_policy.rs',
          'apply_request_policy_wap_baseline_profile_adds_capability_headers',
          'cd transport-rust && cargo test --lib apply_request_policy_wap_baseline_profile_adds_capability_headers'
        )
      ]
    }
  ],
  [
    'WAESpec-C-006',
    {
      domain: 'capability-advertisement',
      ownerLayers: ['transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-013'],
      workItems: ['WAE-602', 'T0-05'],
      status: 'implemented',
      note:
        'The WAP baseline request policy emits Accept-Language and preserves caller language overrides.',
      implementationEvidence: [
        codeEvidence(
          'transport-rust/src/fetch_policy.rs',
          'apply_ua_capability_headers'
        )
      ],
      testEvidence: [
        testEvidence(
          'transport-rust/src/tests/request_gateway_policy.rs',
          'apply_request_policy_wap_baseline_profile_keeps_existing_capability_headers',
          'cd transport-rust && cargo test --lib apply_request_policy_wap_baseline_profile_keeps_existing_capability_headers'
        )
      ]
    }
  ],
  [
    'WAESpec-C-007',
    {
      domain: 'capability-advertisement',
      ownerLayers: ['transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-001', 'RQ-WAE-013'],
      workItems: ['WAE-602', 'T0-05'],
      status: 'implemented',
      note:
        'The WAP baseline request policy emits the WML/WMLC/WBMP Accept media list and preserves explicit overrides.',
      implementationEvidence: [
        codeEvidence(
          'transport-rust/src/fetch_policy.rs',
          'apply_ua_capability_headers'
        )
      ],
      testEvidence: [
        testEvidence(
          'transport-rust/src/tests/request_gateway_policy.rs',
          'apply_request_policy_wap_baseline_profile_adds_capability_headers',
          'cd transport-rust && cargo test --lib apply_request_policy_wap_baseline_profile_adds_capability_headers'
        )
      ]
    }
  ],
  [
    'WAESpec-C-015',
    {
      domain: 'wml-runtime-integration',
      ownerLayers: ['engine-wasm', 'transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-002', 'RQ-RMK-001'],
      workItems: ['WML-201', 'WML-301', 'R0-01'],
      status: 'partial',
      note:
        'Deck loading and a substantial WML runtime exist, but the effective WML SCR ledger still records mandatory parser, task, form, rendering, and policy gaps.',
      implementationEvidence: [
        codeEvidence('engine-wasm/engine/src/lib.rs', 'pub struct WmlEngine')
      ],
      testEvidence: [
        testEvidence(
          'engine-wasm/engine/src/engine_tests/traces_public_api.rs',
          'm1_02_load_deck_context_public_api_sets_metadata_and_state',
          'cd engine-wasm/engine && cargo test m1_02_load_deck_context_public_api_sets_metadata_and_state'
        )
      ]
    }
  ],
  [
    'WAESpec-C-016',
    {
      domain: 'wmlscript-runtime-integration',
      ownerLayers: ['engine-wasm', 'browser'],
      requirementIds: ['RQ-WAE-003', 'RQ-WMLS-001'],
      workItems: ['WMLS-501', 'WMLS-502', 'W1-02', 'W1-04'],
      status: 'partial',
      note:
        'A bytecode decoder, VM, invocation surface, and library subset exist; the WMLScript and library conformance sprints retain structural, semantic, access-control, and coverage gaps.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_public_api.rs',
          'execute_script_unit'
        )
      ],
      testEvidence: [
        testEvidence(
          'engine-wasm/engine/src/engine_tests/script_runtime.rs',
          'execute_script_unit_addition_returns_ok',
          'cd engine-wasm/engine && cargo test execute_script_unit_addition_returns_ok'
        )
      ]
    }
  ],
  [
    'WAESpec-C-017',
    {
      domain: 'wml-user-agent-composition',
      ownerLayers: ['engine-wasm', 'transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-002', 'RQ-WAE-016', 'RQ-WAE-017'],
      workItems: ['WAE-601', 'WML-201', 'WML-301', 'WMLS-501'],
      status: 'partial',
      note:
        'The host, WML runtime, and script runtime compose into a functioning user agent, but the selected WML/WMLScript ledgers and nested WAE behavior map are not yet closed.',
      implementationEvidence: [
        codeEvidence('engine-wasm/engine/src/lib.rs', 'pub struct WmlEngine')
      ],
      testEvidence: [
        testEvidence(
          'engine-wasm/engine/src/engine_tests/traces_public_api.rs',
          'm1_02_load_deck_and_load_deck_context_have_matching_runtime_behavior',
          'cd engine-wasm/engine && cargo test m1_02_load_deck_and_load_deck_context_have_matching_runtime_behavior'
        )
      ]
    }
  ],
  [
    'WAESpec-C-019',
    {
      domain: 'media-type-routing',
      ownerLayers: ['transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-001', 'RQ-WAE-005'],
      workItems: ['WAE-602', 'R0-08'],
      status: 'missing',
      note:
        'The generic application/vnd.wap.wbxml media type is absent from the supported content-type matrix; WMLC-specific WBXML decoding does not satisfy this separate row.',
      implementationEvidence: [],
      testEvidence: []
    }
  ],
  [
    'WAESpec-C-020',
    {
      domain: 'media-type-routing',
      ownerLayers: ['transport-rust', 'browser'],
      requirementIds: ['RQ-WAE-001', 'RQ-WAE-005'],
      workItems: ['WAE-602', 'T0-07', 'R0-08'],
      status: 'implemented',
      note:
        'The transport recognizes application/vnd.wap.wmlc, decodes it through the WBXML boundary, and preserves its source media type in the engine payload.',
      implementationEvidence: [
        codeEvidence(
          'transport-rust/src/responses.rs',
          'map_success_payload_response'
        )
      ],
      testEvidence: [
        testEvidence(
          'transport-rust/src/tests/fetch_mapping.rs',
          'transport_map_success_payload_wmlc_decode_success_maps_ok',
          'cd transport-rust && cargo test --lib transport_map_success_payload_wmlc_decode_success_maps_ok'
        )
      ]
    }
  ],
  [
    'WAESpec-C-021',
    {
      domain: 'script-media-type-routing',
      ownerLayers: ['transport-rust', 'engine-wasm', 'browser'],
      requirementIds: ['RQ-WAE-003', 'RQ-WMLS-011'],
      workItems: ['WMLS-503', 'W1-01'],
      status: 'missing',
      note:
        'The VM accepts registered bytecode, but transport/host routing for application/vnd.wap.wmlscriptc remains an explicit open work item.',
      implementationEvidence: [],
      testEvidence: []
    }
  ]
]);

const domainByGroup = {
  'general-wae-features': 'wae-feature-policy',
  graphics: 'graphics-capability',
  wbmp: 'wbmp-format',
  'calendar-and-phone-book': 'calendar-contact-capability',
  'client-header-handling': 'wsp-client-header-cache'
};
const workByGroup = {
  'general-wae-features': ['WAE-601'],
  graphics: ['WAE-604'],
  wbmp: ['WAE-604'],
  'calendar-and-phone-book': ['OPT-1101'],
  'client-header-handling': ['WSP-803']
};
const ownersByGroup = {
  'general-wae-features': ['engine-wasm', 'transport-rust', 'browser'],
  graphics: ['engine-wasm', 'browser'],
  wbmp: ['engine-wasm', 'transport-rust', 'browser'],
  'calendar-and-phone-book': ['engine-wasm', 'transport-rust', 'browser'],
  'client-header-handling': ['transport-rust']
};

const obligations = rows.map((row, index) => {
  const isClient = row.actor === 'wae-user-agent';
  const isSelected = isClient && row.status === 'M';
  const audit = selectedAudit.get(row.id);
  if (isSelected && !audit) {
    throw new Error(`Selected WAESpec:MCF row lacks an audit mapping: ${row.id}`);
  }
  const implementationStatus = audit?.status ?? 'not-assessed';
  return {
    id: row.id,
    ordinal: index + 1,
    actor: row.actor,
    group: row.group,
    feature: row.feature,
    referencedSection: row.referencedSection,
    specificationStatus: row.status === 'M' ? 'mandatory' : 'optional',
    dependencyExpression: dependencyExpression(row.expression),
    sourceAnchor: {
      documentId: 'WAP-190_104-WAE-Spec',
      staticConformanceSection: row.staticConformanceSection,
      changeSection: '4.3'
    },
    disposition: {
      strict:
        row.status === 'M'
          ? 'required-for-claimed-actor'
          : 'declare-implemented-or-deferred',
      classCProfile: isSelected
        ? 'required-by-class-c-client-mcf'
        : isClient
          ? 'optional-not-required-by-class-c-client'
          : 'not-applicable-to-class-c-client',
      enhancementMayReplaceStrictBehavior: false
    },
    reviewState: 'source-extracted-class-c-applied-mapping-provisional',
    mapping: {
      implementationDomain: audit?.domain ?? domainByGroup[row.group],
      ownerLayers: audit?.ownerLayers ?? ownersByGroup[row.group],
      requirementIds: audit?.requirementIds ?? [],
      workItems: audit?.workItems ?? workByGroup[row.group],
      implementationStatus,
      assessmentNote:
        audit?.note ??
        (isClient
          ? 'Optional WAE capability is deferred to the capability-declaration pass.'
          : 'Server/proxy SCR row is preserved for source completeness and is outside the selected client profile.'),
      implementationEvidence: audit?.implementationEvidence ?? [],
      testEvidence: audit?.testEvidence ?? [],
      evidenceState: audit
        ? implementationStatus === 'missing'
          ? 'gap-work-item-mapped'
          : 'direct-test-linked'
        : isClient
          ? 'optional-not-assessed'
          : 'outside-selected-client-profile'
    }
  };
});

const successorDeltaEntries = [
  {
    targetId: 'WAESpec-C-002',
    successorIds: ['WAESpec-SEC-C-001'],
    classification: 'preserved-renamed',
    note: 'Basic authentication remains mandatory under the successor security group.'
  },
  {
    targetId: 'WAESpec-C-003',
    successorIds: ['WAESpec-URI-C-002'],
    classification: 'preserved-renamed',
    note: 'The mandatory http URL scheme is retained under the successor URI group.'
  },
  {
    targetId: 'WAESpec-C-005',
    successorIds: [
      'WAESpec-I18N-C-001',
      'WAESpec-I18N-C-002',
      'WAESpec-I18N-C-003',
      'WAESpec-UAC-C-002'
    ],
    classification: 'expanded-and-split',
    note:
      'The broad charset/encoding row is split into mandatory UTF/XML processing plus optional Accept-Charset advertising.'
  },
  {
    targetId: 'WAESpec-C-006',
    successorIds: ['WAESpec-UAC-C-004'],
    classification: 'status-relaxed-and-reframed',
    note:
      'Language advertising becomes an optional Accept-Language capability in the WAP-236 SCR.'
  },
  {
    targetId: 'WAESpec-C-007',
    successorIds: ['WAESpec-MT-C-001', 'WAESpec-UAC-C-001'],
    classification: 'expanded-and-split',
    note:
      'Media-type handling stays mandatory while explicit Accept advertising is separated as optional.'
  },
  {
    targetId: 'WAESpec-C-015',
    successorIds: [
      'WAESpec-ML-C-001',
      'WAESpec-ML-C-002',
      'WAESpec-ML-C-003',
      'WAESpec-ML-C-004'
    ],
    classification: 'expanded-profile-choice',
    note:
      'The successor introduces XHTML/WML1 versus WML2 profile choices and an explicit context-continuity row.'
  },
  {
    targetId: 'WAESpec-C-016',
    successorIds: ['WAESpec-WMLS-C-001', 'WAESpec-WMLS-C-002'],
    classification: 'expanded-and-split',
    note:
      'WMLScript becomes separate mandatory execution and standard-library obligations with cross-spec dependencies.'
  },
  {
    targetId: 'WAESpec-C-017',
    successorIds: [
      'WAESpec-ML-C-001',
      'WAESpec-ML-C-004',
      'WAESpec-UAB-C-001',
      'WAESpec-UAB-C-002',
      'WAESpec-UAB-C-003',
      'WAESpec-UAB-C-004',
      'WAESpec-UAB-C-005'
    ],
    classification: 'decomposed-into-behaviors',
    note:
      'The broad WML user-agent row is decomposed into markup/context and explicit navigation/BACK behavior.'
  },
  {
    targetId: 'WAESpec-C-019',
    successorIds: [],
    classification: 'removed-from-wae-scr-and-delegated',
    note:
      'WAP-236 has no standalone generic WBXML media-type SCR row and delegates WBXML conformance to format-specific specifications.'
  },
  {
    targetId: 'WAESpec-C-020',
    successorIds: ['WAESpec-ML-C-002'],
    classification: 'subsumed-by-profile',
    note:
      'Binary/text WML1 support is expressed through the successor markup profile choice.'
  },
  {
    targetId: 'WAESpec-C-021',
    successorIds: ['WAESpec-WMLS-C-001'],
    classification: 'subsumed-by-profile',
    note:
      'The WMLScript bytecode media behavior is subsumed by execution support and WMLS:MCF.'
  }
];

const mandatory = obligations.filter(
  (obligation) => obligation.specificationStatus === 'mandatory'
);
const optional = obligations.filter(
  (obligation) => obligation.specificationStatus === 'optional'
);
const selectedRequired = obligations.filter(
  (obligation) =>
    obligation.disposition.classCProfile ===
    'required-by-class-c-client-mcf'
);
const selectedOptional = obligations.filter(
  (obligation) =>
    obligation.disposition.classCProfile ===
    'optional-not-required-by-class-c-client'
);
const selectedNotApplicable = obligations.filter(
  (obligation) =>
    obligation.disposition.classCProfile ===
    'not-applicable-to-class-c-client'
);

function countBy(values, key) {
  const counts = {};
  for (const value of values) {
    const name = value[key];
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort());
}

const governingSource = release.governingDependencies.find(
  (source) => source.documentId === 'WAP-221-CREQ-20010425-a'
);
const classSource = release.governingDependencies.find(
  (source) => source.documentId === 'WAP-215-ClassConform-20001213-a'
);
const successorPdfPath =
  'spec-processing/source-material/WAP-236-WAESpec-20020207-a.pdf';
const successorPdfSha256 = crypto
  .createHash('sha256')
  .update(fs.readFileSync(successorPdfPath))
  .digest('hex');

const ledger = {
  schemaVersion: 1,
  releaseId: release.release.id,
  family: 'wae',
  recordedOn,
  target: {
    stack: 'WAP 1.2.1',
    markup: 'WML 1.3',
    classProfile: 'WAP-215 Class C client (CCR-CLASSC-C-001)'
  },
  authority: {
    effectiveSequence: waeFamily.effectiveSequence,
    extractionSources: expectedSequence.map((documentId) => {
      const document = sourceById.get(documentId);
      return {
        documentId,
        filename: document.filename,
        sha256: document.sha256,
        role:
          documentId === 'WAP-190_104-WAE-Spec'
            ? 'resulting-updated-scr-table'
            : document.documentRole
      };
    }),
    governingSource: {
      documentId: governingSource.documentId,
      sha256: governingSource.sha256,
      selectedDefinition: 'MCF = all mandatory client features of the specification SCR',
      textExtractionBytes: Buffer.byteLength(creqText),
      textExtractionSha256: crypto
        .createHash('sha256')
        .update(creqText)
        .digest('hex')
    },
    classProfileSource: {
      documentId: classSource.documentId,
      sha256: classSource.sha256,
      selectedIdentifier: 'CCR-CLASSC-C-001',
      selectedRequirement: 'WAESpec:MCF',
      ledger:
        'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
    },
    interpretation:
      'Apply WAP-190 SINs in effective order. WAP-190_104 section 4.3 supplies the resulting tracked-change SCR table; deleted text/rows are excluded and added text is normalized. WAP-221 defines WAESpec:MCF as the eleven effective mandatory client rows. WAP-236 is successor delta evidence only.',
    extractionMethod:
      'Tracked-change-aware normalized transcription, independently checked against page images; source PDFs and full text remain outside Git.'
  },
  summary: {
    itemCount: obligations.length,
    mandatoryCount: mandatory.length,
    optionalCount: optional.length,
    removedBySinCount: removedRows.length,
    selectedClassCRequiredCount: selectedRequired.length,
    selectedClassCOptionalCount: selectedOptional.length,
    selectedClassCNotApplicableCount: selectedNotApplicable.length,
    byActor: countBy(obligations, 'actor'),
    byGroup: countBy(obligations, 'group'),
    selectedImplementationStatus: countBy(
      selectedRequired.map((obligation) => ({
        status: obligation.mapping.implementationStatus
      })),
      'status'
    ),
    selectedDirectTestEvidenceCount: selectedRequired.filter(
      (obligation) => obligation.mapping.testEvidence.length > 0
    ).length
  },
  obligations,
  removedRows,
  successorDelta: {
    authority: {
      documentId: 'WAP-236-WAESpec-20020207-a',
      filename: 'WAP-236-WAESpec-20020207-a.pdf',
      sha256: successorPdfSha256,
      role: 'delta-evidence-only',
      targetNormative: false
    },
    status: 'selected-mcf-concept-delta-complete',
    policy:
      'Successor behavior is not imported into strict WAP 1.2.1 mode unless the target-era source independently requires it. Compatible improvements remain allowed behind explicit strict-preserving or successor capability gates.',
    selectedMandatoryMappings: successorDeltaEntries,
    successorOnlyMandatoryExamples: [
      {
        successorId: 'WAESpec-HTS-C-004',
        feature: 'Caching model',
        targetDisposition:
          'Resolve from the separately selected CacheMod:MCF target family, not from WAP-236.'
      },
      {
        successorId: 'WAESpec-URI-C-003',
        feature: 'HTTPS URL scheme',
        targetDisposition:
          'Successor/secure capability; not an implicit WAESpec:MCF target obligation.'
      },
      {
        successorId: 'WAESpec-UAB-C-001',
        feature: 'Navigation history',
        targetDisposition:
          'Useful clarifying successor evidence; strict target behavior remains grounded in WML/WAE target-era clauses.'
      }
    ]
  }
};

fs.mkdirSync(new URL('../source-manifests/', import.meta.url), {
  recursive: true
});
fs.writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`);

console.log(
  `Wrote ${outputPath}: ${obligations.length} active WAE SCR rows, ${removedRows.length} SIN-removed rows, ${selectedRequired.length} Class C-required client rows`
);
