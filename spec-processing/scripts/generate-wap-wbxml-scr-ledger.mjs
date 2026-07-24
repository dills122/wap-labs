#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const wbxmlSinTextPath = option('--wbxml-sin-text');
const creqTextPath = option('--creq-text');
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json';

if (!wbxmlSinTextPath || !creqTextPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-wbxml-scr-ledger.mjs ' +
      '--wbxml-sin-text /absolute/path/WAP-192_105-WBXML-20011015-a.txt ' +
      '--creq-text /absolute/path/WAP-221-CREQ-20010425-a.txt ' +
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
    'WBXML:MCF'
  )
) {
  throw new Error(
    'WAP-215 class ledger must select CCR-CLASSC-C-001 with WBXML:MCF'
  );
}

const wbxmlFamily = effectiveSpec.families.find(
  (family) => family.family === 'wbxml'
);
if (!wbxmlFamily) {
  throw new Error('Effective-spec graph does not contain the WBXML family');
}

const expectedSequence = ['WAP-192-WBXML', 'WAP-192_105-WBXML'];
if (
  JSON.stringify(wbxmlFamily.effectiveSequence) !==
  JSON.stringify(expectedSequence)
) {
  throw new Error('Effective WBXML source sequence has drifted');
}

const sourceById = new Map(
  wbxmlFamily.documents.map((document) => [document.documentId, document])
);
const wbxmlSinText = fs.readFileSync(wbxmlSinTextPath, 'utf8');
const creqText = fs.readFileSync(creqTextPath, 'utf8');
const sinIngestion = ingestion.members.find(
  (member) => member.documentId === 'WAP-192_105-WBXML'
);
const sinTextSha256 = crypto
  .createHash('sha256')
  .update(wbxmlSinText)
  .digest('hex');
if (sinTextSha256 !== sinIngestion?.parsedText?.sha256) {
  throw new Error(
    'WAP-192_105 text extraction hash does not match ingestion lock'
  );
}

for (const marker of [
  'Correct SCRs in WBXML V1.3',
  'Static Conformance Requirements',
  'WBXML-C-001',
  'WBXML-C-010',
  'WBXML-C-011'
]) {
  if (!wbxmlSinText.includes(marker)) {
    throw new Error(`WAP-192_105 extraction is missing marker: ${marker}`);
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

const rows = [
  [
    'WBXML-S-001',
    'wbxml-server-encoder',
    'binary-structure',
    '9.1',
    'Binary XML Structure',
    '5',
    'M'
  ],
  [
    'WBXML-C-001',
    'wbxml-client-decoder',
    'binary-structure',
    '9.1',
    'Binary XML Structure',
    '5',
    'M'
  ],
  [
    'WBXML-S-002',
    'wbxml-server-encoder',
    'document-tokenisation',
    '9.2',
    'Conversion of all XML mark-up, excluding unparsed entities, into tokens',
    '6.1',
    'M'
  ],
  [
    'WBXML-S-003',
    'wbxml-server-encoder',
    'document-tokenisation',
    '9.2',
    'Removal of Processing Instructions intended for the tokeniser',
    '6.1',
    'O'
  ],
  [
    'WBXML-S-004',
    'wbxml-server-encoder',
    'document-tokenisation',
    '9.2',
    'Removal of all comments, the XML declaration, and the document type declaration',
    '6.1',
    'M'
  ],
  [
    'WBXML-S-005',
    'wbxml-server-encoder',
    'document-tokenisation',
    '9.2',
    'Conversion of all text into String or Entity tokens',
    '6.1',
    'M'
  ],
  [
    'WBXML-S-006',
    'wbxml-server-encoder',
    'document-tokenisation',
    '9.2',
    'Conversion of all XML parsed entities into string or entity tokens',
    '6.1',
    'M'
  ],
  [
    'WBXML-S-007',
    'wbxml-server-encoder',
    'document-tokenisation',
    '9.2',
    'Conversion of all XML unparsed entities into string or entity tokens',
    '6.1',
    'O'
  ],
  [
    'WBXML-S-008',
    'wbxml-server-encoder',
    'document-structure-conformance',
    '9.2',
    'Checking that document is well-formed',
    '6.2',
    'M'
  ],
  [
    'WBXML-S-009',
    'wbxml-server-encoder',
    'document-structure-conformance',
    '9.2',
    'Document validation',
    '6.2',
    'O'
  ],
  [
    'WBXML-S-010',
    'wbxml-server-encoder',
    'default-attribute-values',
    '9.2',
    'Encoding default attribute values',
    '6.3',
    'O'
  ],
  [
    'WBXML-C-010',
    'wbxml-client-decoder',
    'default-attribute-values',
    '9.2',
    'Encoding default attribute values',
    '6.3',
    'M'
  ],
  [
    'WBXML-S-012',
    'wbxml-server-encoder',
    'document-tokenisation',
    '9.2',
    'Preservation of Processor Instructions NOT intended for the tokeniser',
    '6.1',
    'M'
  ],
  [
    'WBXML-S-013',
    'wbxml-server-encoder',
    'document-tokenisation',
    '9.2',
    'Encoding of attribute names as an attribute start token or a single LITERAL token',
    '6.1',
    'M'
  ],
  [
    'WBXML-C-011',
    'wbxml-client-decoder',
    'token-value-association',
    '9.3',
    'Support both the binary token value and the literal value for all tags, attribute names, and attribute values',
    '6.4',
    'M'
  ]
];

const selectedAudit = new Map([
  [
    'WBXML-C-001',
    {
      status: 'partial',
      note:
        'WMLC payloads reach a bounded external decoder subprocess, but the repository neither pins a conforming decoder nor tests the WBXML 1.3 binary structure and token grammar directly.',
      workItems: ['WML-203', 'R0-08', 'T0-07'],
      implementationEvidence: [
        {
          path: 'transport-rust/src/wbxml.rs',
          symbol: 'decode_wmlc_with_tool_limits'
        },
        {
          path: 'transport-rust/src/responses.rs',
          symbol: 'map_success_payload_response'
        }
      ],
      testEvidence: [
        {
          path: 'transport-rust/src/tests/wbxml_env.rs',
          test: 'transport_decode_wmlc_uses_subprocess_backend',
          command:
            'cd transport-rust && cargo test --lib transport_decode_wmlc_uses_subprocess_backend',
          limitation:
            'The fake decoder emits fixed XML and does not validate the input token stream.'
        }
      ],
      evidenceState: 'boundary-test-linked'
    }
  ],
  [
    'WBXML-C-010',
    {
      status: 'missing',
      note:
        'No source-pinned decoder behavior or fixture proves the effective section 6.3 default-attribute-value requirement.',
      workItems: ['WML-203', 'R0-08'],
      implementationEvidence: [],
      testEvidence: [],
      evidenceState: 'gap-work-item-mapped'
    }
  ],
  [
    'WBXML-C-011',
    {
      status: 'missing',
      note:
        'No direct fixture proves equivalent decoding of binary and literal tokens for tags, attribute names, and attribute values; the permissive corpus and fake subprocess tests are insufficient.',
      workItems: ['WML-203', 'R0-08', 'T0-07'],
      implementationEvidence: [],
      testEvidence: [],
      evidenceState: 'gap-work-item-mapped'
    }
  ]
]);

const obligations = rows.map(
  (
    [
      id,
      actor,
      group,
      staticConformanceSection,
      feature,
      referencedSection,
      status
    ],
    index
  ) => {
    const isClient = actor === 'wbxml-client-decoder';
    const isSelected = isClient && status === 'M';
    const audit = selectedAudit.get(id);
    if (isSelected && !audit) {
      throw new Error(`Selected WBXML:MCF row lacks an audit mapping: ${id}`);
    }

    return {
      id,
      ordinal: index + 1,
      actor,
      group,
      feature,
      referencedSection,
      specificationStatus: status === 'M' ? 'mandatory' : 'optional',
      dependencyExpression: {
        type: 'none',
        scrIds: []
      },
      sourceAnchor: {
        documentId: 'WAP-192_105-WBXML',
        staticConformanceSection,
        changeSection: '3.3'
      },
      disposition: {
        strict:
          status === 'M'
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
        implementationDomain: group,
        ownerLayers: ['transport-rust'],
        requirementIds: isClient
          ? ['RQ-RMK-007', 'RQ-RMK-010']
          : ['RQ-RMK-010'],
        workItems: audit?.workItems ?? ['R0-08'],
        implementationStatus: audit?.status ?? 'not-assessed',
        assessmentNote:
          audit?.note ??
          'Server/encoder SCR row is preserved for source completeness and is outside the selected Class C client profile.',
        implementationEvidence: audit?.implementationEvidence ?? [],
        testEvidence: audit?.testEvidence ?? [],
        evidenceState:
          audit?.evidenceState ?? 'outside-selected-client-profile'
      }
    };
  }
);

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

const ledger = {
  schemaVersion: 1,
  releaseId: release.release.id,
  family: 'wbxml',
  recordedOn,
  target: {
    stack: 'WAP 1.2.1',
    markup: 'WML 1.3',
    classProfile: 'WAP-215 Class C client (CCR-CLASSC-C-001)'
  },
  authority: {
    effectiveSequence: wbxmlFamily.effectiveSequence,
    extractionSources: expectedSequence.map((documentId) => {
      const document = sourceById.get(documentId);
      return {
        documentId,
        filename: document.filename,
        sha256: document.sha256,
        role:
          documentId === 'WAP-192_105-WBXML'
            ? 'effective-scr-correction'
            : document.documentRole,
        ...(documentId === 'WAP-192_105-WBXML'
          ? {
              textExtractionBytes: Buffer.byteLength(wbxmlSinText),
              textExtractionSha256: sinTextSha256
            }
          : {})
      };
    }),
    governingSource: {
      documentId: governingSource.documentId,
      sha256: governingSource.sha256,
      selectedDefinition:
        'MCF = all mandatory client features of the specification SCR',
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
      selectedRequirement: 'WBXML:MCF',
      ledger:
        'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
    },
    interpretation:
      'Apply WAP-192_105 to WAP-192. The approved SIN supplies corrected actor-specific SCR rows and restores changes omitted from WAP-192.101. WAP-221 defines WBXML:MCF as the three effective mandatory client rows; server/encoder rows remain outside the selected Class C client profile.',
    extractionMethod:
      'Tracked-change-aware normalized transcription checked against SIN page images; source PDFs, full text, and page images remain outside Git.'
  },
  summary: {
    itemCount: obligations.length,
    mandatoryCount: mandatory.length,
    optionalCount: optional.length,
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
    selectedDirectNormativeTestEvidenceCount: 0,
    selectedBoundaryTestEvidenceCount: selectedRequired.filter(
      (obligation) => obligation.mapping.testEvidence.length > 0
    ).length
  },
  obligations
};

fs.mkdirSync(new URL('../source-manifests/', import.meta.url), {
  recursive: true
});
fs.writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`);

console.log(
  `Wrote ${outputPath}: ${obligations.length} WBXML SCR rows, ${selectedRequired.length} Class C-required client rows`
);
