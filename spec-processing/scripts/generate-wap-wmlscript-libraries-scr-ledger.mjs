#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const baseTextPath = option('--libraries-base-text');
const sinTextPath = option('--libraries-sin-text');
const creqTextPath = option('--creq-text');
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json';

if (!baseTextPath || !sinTextPath || !creqTextPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-wmlscript-libraries-scr-ledger.mjs ' +
      '--libraries-base-text /absolute/path/WAP-194-WMLScriptLibraries-20000925-a.txt ' +
      '--libraries-sin-text /absolute/path/WAP-194_103-WMLScriptLibraries-20020318-a.txt ' +
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

const expectedSequence = [
  'WAP-194-WMLScriptLibraries',
  'WAP-194_103-WMLScriptLibraries'
];
const family = effectiveSpec.families.find(
  (entry) => entry.family === 'wmlscript-libraries'
);
if (
  JSON.stringify(family?.effectiveSequence) !==
  JSON.stringify(expectedSequence)
) {
  throw new Error('Effective WMLScript Libraries source sequence has drifted');
}
if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001' ||
  !classConformance.selectedTarget?.requirementExpressions?.includes(
    'WMLScriptLibs:MCF'
  )
) {
  throw new Error(
    'WAP-215 class ledger must select CCR-CLASSC-C-001 with WMLScriptLibs:MCF'
  );
}

const baseText = fs.readFileSync(baseTextPath, 'utf8');
const sinText = fs.readFileSync(sinTextPath, 'utf8');
const creqText = fs.readFileSync(creqTextPath, 'utf8');

function verifyText(documentId, text) {
  const ingestionMember = ingestion.members.find(
    (member) => member.documentId === documentId
  );
  const sha256 = crypto.createHash('sha256').update(text).digest('hex');
  if (sha256 !== ingestionMember?.parsedText?.sha256) {
    throw new Error(`${documentId} text extraction hash drift`);
  }
  return sha256;
}

const baseTextSha256 = verifyText('WAP-194-WMLScriptLibraries', baseText);
const sinTextSha256 = verifyText(
  'WAP-194_103-WMLScriptLibraries',
  sinText
);

for (const marker of [
  'Appendix B. Static Conformance Requirements',
  'WMLSSL-001',
  'WMLSSL048',
  'WMLSSL-094'
]) {
  if (!baseText.includes(marker)) {
    throw new Error(`WAP-194 extraction is missing marker: ${marker}`);
  }
}
for (const marker of [
  'Add SCR for Immediate refresh',
  'WMLSSL-C-095',
  'support for immediate refresh'
]) {
  if (!sinText.includes(marker)) {
    throw new Error(`WAP-194_103 extraction is missing marker: ${marker}`);
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

const features = [
  'Supports Lang library and all functions',
  'Supports Float library and all functions',
  'Supports String library and all functions',
  'Supports URL library and all functions',
  'Supports WMLBrowser library and all functions',
  'Supports Dialogs library and all functions',
  'Supports all standard-library identifiers',
  'Supports Lang function identifiers',
  'Supports Float function identifiers',
  'Supports String function identifiers',
  'Supports URL function identifiers',
  'Supports WMLBrowser function identifiers',
  'Supports Dialogs function identifiers',
  'Supports integer, boolean, string, invalid, and float data types',
  'Supports automatic type conversions',
  'Supports error handling',
  'Supports floating-point operations',
  'Supports Lang library',
  'Supports Float library',
  'Supports String library',
  'Supports URL library',
  'Supports WMLBrowser library',
  'Supports Dialogs library',
  'Supports all standard-library identifiers',
  'Supports Lang function identifiers',
  'Supports Float function identifiers',
  'Supports String function identifiers',
  'Supports URL function identifiers',
  'Supports WMLBrowser function identifiers',
  'Supports Dialogs function identifiers',
  'Lang.abs',
  'Lang.min',
  'Lang.max',
  'Lang.parseInt',
  'Lang.parseFloat',
  'Lang.isInt',
  'Lang.isFloat',
  'Lang.maxInt',
  'Lang.minInt',
  'Lang.float',
  'Lang.exit',
  'Lang.abort',
  'Lang.random',
  'Lang.seed',
  'Lang.characterSet',
  'Float functions return invalid when floating point is unsupported',
  'Float.int',
  'Float.floor',
  'Float.ceil',
  'Float.pow',
  'Float.round',
  'Float.sqrt',
  'Float.maxFloat',
  'Float.minFloat',
  'String.length',
  'String.isEmpty',
  'String.charAt',
  'String.subString',
  'String.find',
  'String.replace',
  'String.elements',
  'String.elementAt',
  'String.removeAt',
  'String.replaceAt',
  'String.insertAt',
  'String.squeeze',
  'String.trim',
  'String.compare',
  'String.toString',
  'String.format',
  'URL.isValid',
  'URL.getScheme',
  'URL.getHost',
  'URL.getPort',
  'URL.getPath',
  'URL.getParameters',
  'URL.getQuery',
  'URL.getFragment',
  'URL.getBase',
  'URL.getReferer',
  'URL.resolve',
  'URL.escapeString',
  'URL.unescapeString',
  'URL.loadString',
  'WMLBrowser.getVar',
  'WMLBrowser.setVar',
  'WMLBrowser.go',
  'WMLBrowser.prev',
  'WMLBrowser.newContext',
  'WMLBrowser.getCurrentCard',
  'WMLBrowser.refresh',
  'Dialogs.prompt',
  'Dialogs.confirm',
  'Dialogs.alert',
  'WMLBrowser.refresh immediate-refresh support'
];

if (features.length !== 95) {
  throw new Error(
    `Expected 95 WMLScript Libraries features; found ${features.length}`
  );
}

const optionalOrdinals = new Set([17, 95]);
const partialSelectedOrdinals = new Set([
  14, 15, 16, 22, 23, 85, 86, 87, 88, 89, 90, 92, 93, 94
]);

function sourceIdFor(ordinal) {
  if (ordinal === 48) return 'WMLSSL048';
  if (ordinal === 95) return 'WMLSSL-C-095';
  return `WMLSSL-${String(ordinal).padStart(3, '0')}`;
}

function sectionFor(ordinal) {
  if (ordinal <= 13) return ['12.4', 'encoder-capabilities'];
  if (ordinal <= 30) return ['12.5', 'interpreter-capabilities'];
  if (ordinal <= 45) return ['12.5', 'lang-library'];
  if (ordinal <= 54) return ['12.5', 'float-library'];
  if (ordinal <= 70) return ['12.5', 'string-library'];
  if (ordinal <= 84) return ['12.5', 'url-library'];
  if (ordinal <= 91) return ['12.5', 'wmlbrowser-library'];
  if (ordinal <= 94) return ['12.5', 'dialogs-library'];
  return ['12.5 / WAP-194_103 3.3', 'miscellaneous'];
}

function traceabilityFor(ordinal) {
  if (
    ordinal === 17 ||
    ordinal === 19 ||
    (ordinal >= 46 && ordinal <= 54)
  ) {
    return ['RQ-WMLS-014', 'RQ-WMLS-007'];
  }
  if (ordinal === 18 || ordinal === 25 || (ordinal >= 31 && ordinal <= 45)) {
    return ['RQ-WMLS-013'];
  }
  if (ordinal === 20 || ordinal === 27 || (ordinal >= 55 && ordinal <= 70)) {
    return ['RQ-WMLS-015'];
  }
  if (ordinal === 21 || ordinal === 28 || (ordinal >= 71 && ordinal <= 84)) {
    return ['RQ-WMLS-016'];
  }
  if (ordinal === 87 || ordinal === 88) return ['RQ-WMLS-018'];
  if (ordinal === 89) return ['RQ-WMLS-019'];
  if (ordinal === 90) return ['RQ-WMLS-020'];
  if (ordinal === 91 || ordinal === 95) return ['RQ-WMLS-021'];
  if (
    ordinal === 23 ||
    ordinal === 30 ||
    (ordinal >= 92 && ordinal <= 94)
  ) {
    return ['RQ-WMLS-022'];
  }
  if (
    ordinal === 22 ||
    ordinal === 24 ||
    ordinal === 29 ||
    (ordinal >= 85 && ordinal <= 91)
  ) {
    return ['RQ-WMLS-017'];
  }
  return ['RQ-WMLS-012'];
}

function workItemsFor(ordinal) {
  if (ordinal >= 85 && ordinal <= 90) {
    return ['WMLS-504', 'WMLS-505', 'W1-05', 'W0-07'];
  }
  if (ordinal >= 92 && ordinal <= 94) {
    return ['WMLS-504', 'WMLS-505', 'W1-05', 'W0-05'];
  }
  return ['WMLS-504', 'W1-05'];
}

function evidenceFor(ordinal) {
  if (!partialSelectedOrdinals.has(ordinal)) {
    return { implementationEvidence: [], testEvidence: [] };
  }
  if (ordinal <= 16) {
    return {
      implementationEvidence: [
        {
          path: 'engine-wasm/engine/src/wavescript/value.rs',
          symbol: 'ScriptValue'
        },
        {
          path: 'engine-wasm/engine/src/engine_script_types.rs',
          symbol: 'ScriptExecutionOutcome'
        }
      ],
      testEvidence: [
        {
          path: 'engine-wasm/engine/src/engine_tests/script_runtime.rs',
          test: 'vm_trap_error_category_matrix_is_explicit',
          limitation:
            'Local types and traps are not yet proven against the complete WMLScript Library conversion and error conventions.'
        }
      ]
    };
  }
  if (ordinal === 22 || ordinal === 23) {
    return {
      implementationEvidence: [
        {
          path: 'engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs',
          symbol: 'WmlBrowserHost'
        }
      ],
      testEvidence: [
        {
          path:
            'engine-wasm/engine/src/wavescript/stdlib/wmlbrowser_tests.rs',
          test: 'dialog_calls_record_requests_with_deterministic_return_values',
          limitation:
            'Only a subset is exposed through project-specific host IDs; full library/function-ID conformance is absent.'
        }
      ]
    };
  }
  if (ordinal >= 85 && ordinal <= 90) {
    const tests = {
      85: 'set_and_get_var_roundtrip',
      86: 'set_and_get_var_roundtrip',
      87: 'go_and_prev_update_deferred_navigation_intent',
      88: 'go_and_prev_update_deferred_navigation_intent',
      89: 'new_context_requests_context_reset_when_context_is_valid',
      90: 'get_current_card_returns_fragment_for_current_context'
    };
    return {
      implementationEvidence: [
        {
          path: 'engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs',
          symbol: features[ordinal - 1]
        }
      ],
      testEvidence: [
        {
          path:
            'engine-wasm/engine/src/wavescript/stdlib/wmlbrowser_tests.rs',
          test: tests[ordinal],
          limitation:
            'Behavior is useful implementation evidence, but nested normative clauses and standard library/function identifiers are not fully verified.'
        }
      ]
    };
  }
  return {
    implementationEvidence: [
      {
        path: 'engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs',
        symbol: features[ordinal - 1]
      },
      {
        path: 'engine-wasm/engine/src/wavescript/stdlib/dialogs.rs',
        symbol: 'deterministic placeholder result'
      }
    ],
    testEvidence: [
      {
        path:
          'engine-wasm/engine/src/wavescript/stdlib/wmlbrowser_tests.rs',
        test: 'dialog_calls_record_requests_with_deterministic_return_values',
        limitation:
          'The host records requests but returns placeholder results without complete interactive host integration.'
      }
    ]
  };
}

const obligations = features.map((feature, index) => {
  const ordinal = index + 1;
  const isClient = ordinal >= 14;
  const specificationStatus = optionalOrdinals.has(ordinal)
    ? 'optional'
    : 'mandatory';
  const isSelected = isClient && specificationStatus === 'mandatory';
  const [staticConformanceSection, group] = sectionFor(ordinal);
  const implementationStatus = isSelected
    ? partialSelectedOrdinals.has(ordinal)
      ? 'partial'
      : 'missing'
    : 'not-assessed';
  const sourceId = sourceIdFor(ordinal);

  return {
    id: sourceId,
    ...(ordinal === 48 ? { normalizedAlias: 'WMLSSL-048' } : {}),
    ordinal,
    actor: isClient
      ? 'wmlscript-library-interpreter'
      : 'wmlscript-library-encoder',
    group,
    feature,
    referencedSection:
      ordinal === 95 ? '11.7' : feature.replace(/^[^.]+\\./, ''),
    specificationStatus,
    dependencyExpression:
      ordinal === 17
        ? {
            type: 'source-expression',
            raw: 'WMLS-111',
            note:
              'Preserved from the base SCR; cross-spec identifier normalization remains a source erratum question.'
          }
        : { type: 'none', scrIds: [] },
    sourceAnchor: {
      documentId:
        ordinal === 95
          ? 'WAP-194_103-WMLScriptLibraries'
          : 'WAP-194-WMLScriptLibraries',
      staticConformanceSection,
      ...(ordinal === 95 ? { changeSection: '3.3' } : {})
    },
    disposition: {
      strict:
        specificationStatus === 'mandatory'
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
      ownerLayers: ['engine-wasm'],
      requirementIds: traceabilityFor(ordinal),
      workItems: workItemsFor(ordinal),
      implementationStatus,
      assessmentNote: isSelected
        ? implementationStatus === 'partial'
          ? 'Related local behavior exists, but exact WAP-194 semantics, identifiers, and nested clauses are not fully proven.'
          : 'No implementation and direct normative test evidence currently closes this selected WAP-194 interpreter requirement.'
        : isClient
          ? 'Optional interpreter SCR retained for an explicit capability decision; it is not selected by WMLScriptLibs:MCF.'
          : 'Encoder SCR retained for source completeness and a future compiler/encoder module; it is outside the selected Class C client profile.',
      ...evidenceFor(ordinal),
      evidenceState: isSelected
        ? implementationStatus === 'partial'
          ? 'provisional-non-normative-test-linked'
          : 'gap-work-item-mapped'
        : 'outside-selected-client-profile'
    }
  };
});

function countBy(values, key) {
  const counts = {};
  for (const value of values) {
    const name = value[key];
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort());
}

const selectedRequired = obligations.filter(
  (obligation) =>
    obligation.disposition.classCProfile ===
    'required-by-class-c-client-mcf'
);
const sourceById = new Map(
  family.documents.map((document) => [document.documentId, document])
);
const governingSource = release.governingDependencies.find(
  (source) => source.documentId === 'WAP-221-CREQ-20010425-a'
);
const classSource = release.governingDependencies.find(
  (source) => source.documentId === 'WAP-215-ClassConform-20001213-a'
);
const textByDocument = new Map([
  [
    'WAP-194-WMLScriptLibraries',
    { text: baseText, sha256: baseTextSha256 }
  ],
  [
    'WAP-194_103-WMLScriptLibraries',
    { text: sinText, sha256: sinTextSha256 }
  ]
]);

const ledger = {
  schemaVersion: 1,
  releaseId: release.release.id,
  family: 'wmlscript-libraries',
  recordedOn,
  target: {
    stack: 'WAP 1.2.1',
    markup: 'WML 1.3',
    classProfile: 'WAP-215 Class C client (CCR-CLASSC-C-001)'
  },
  authority: {
    effectiveSequence: family.effectiveSequence,
    extractionSources: expectedSequence.map((documentId) => {
      const document = sourceById.get(documentId);
      const extraction = textByDocument.get(documentId);
      return {
        documentId,
        filename: document.filename,
        sha256: document.sha256,
        role:
          documentId === 'WAP-194_103-WMLScriptLibraries'
            ? 'immediate-refresh-scr-addition'
            : document.documentRole,
        textExtractionBytes: Buffer.byteLength(extraction.text),
        textExtractionSha256: extraction.sha256
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
      selectedRequirement: 'WMLScriptLibs:MCF',
      ledger:
        'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
    },
    interpretation:
      'Apply WAP-194_103 after the 94-row WAP-194 SCR. The SIN adds optional WMLSSL-C-095 for immediate refresh. WAP-221 applies WMLScriptLibs:MCF to 80 mandatory interpreter rows; encoder and optional interpreter rows remain outside the selected Class C client profile.',
    extractionMethod:
      'Normalized row transcription from hash-locked text plus visual inspection of the canonical base SCR page; source PDFs, full text, and temporary page images remain outside Git.',
    sourceAnomalies: [
      {
        sourceId: 'WMLSSL048',
        normalizedAlias: 'WMLSSL-048',
        documentId: 'WAP-194-WMLScriptLibraries',
        page: '56(59)',
        note:
          'The canonical PDF visibly omits the hyphen in the Float.floor SCR identifier; the ledger preserves the printed ID and exposes a normalized alias for planning/search.'
      }
    ]
  },
  summary: {
    itemCount: obligations.length,
    mandatoryCount: obligations.filter(
      (obligation) => obligation.specificationStatus === 'mandatory'
    ).length,
    optionalCount: obligations.filter(
      (obligation) => obligation.specificationStatus === 'optional'
    ).length,
    selectedClassCRequiredCount: selectedRequired.length,
    selectedClassCOptionalCount: obligations.filter(
      (obligation) =>
        obligation.disposition.classCProfile ===
        'optional-not-required-by-class-c-client'
    ).length,
    selectedClassCNotApplicableCount: obligations.filter(
      (obligation) =>
        obligation.disposition.classCProfile ===
        'not-applicable-to-class-c-client'
    ).length,
    byActor: countBy(obligations, 'actor'),
    byGroup: countBy(obligations, 'group'),
    selectedImplementationStatus: countBy(
      selectedRequired.map((obligation) => ({
        status: obligation.mapping.implementationStatus
      })),
      'status'
    ),
    selectedDirectNormativeTestEvidenceCount: 0,
    selectedProvisionalTestEvidenceCount: selectedRequired.filter(
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
  `Wrote ${outputPath}: ${obligations.length} WMLScript Libraries SCR rows, ${selectedRequired.length} Class C-required interpreter rows`
);
