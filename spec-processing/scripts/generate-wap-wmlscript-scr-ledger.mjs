#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const effectiveTextPath = option('--wmlscript-effective-text');
const creqTextPath = option('--creq-text');
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json';

if (!effectiveTextPath || !creqTextPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-wmlscript-scr-ledger.mjs ' +
      '--wmlscript-effective-text /absolute/path/WAP-193_101-WMLScript-20010928-a.txt ' +
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
  'WAP-193-WMLScript',
  'WAP-193_101-WMLScript'
];
const family = effectiveSpec.families.find(
  (entry) => entry.family === 'wmlscript'
);
if (
  JSON.stringify(family?.effectiveSequence) !==
  JSON.stringify(expectedSequence)
) {
  throw new Error('Effective WMLScript source sequence has drifted');
}
if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001' ||
  !classConformance.selectedTarget?.requirementExpressions?.includes(
    'WMLScript:MCF'
  )
) {
  throw new Error(
    'WAP-215 class ledger must select CCR-CLASSC-C-001 with WMLScript:MCF'
  );
}

const effectiveText = fs.readFileSync(effectiveTextPath, 'utf8');
const creqText = fs.readFileSync(creqTextPath, 'utf8');
const effectiveIngestion = ingestion.members.find(
  (member) => member.documentId === 'WAP-193_101-WMLScript'
);
const effectiveTextSha256 = crypto
  .createHash('sha256')
  .update(effectiveText)
  .digest('hex');
if (effectiveTextSha256 !== effectiveIngestion?.parsedText?.sha256) {
  throw new Error(
    'WAP-193_101 text extraction hash does not match ingestion lock'
  );
}
for (const marker of [
  '15. STATIC CONFORMANCE REQUIREMENTS',
  'WMLS-S-001',
  'WMLS-S-068',
  'WMLS-C-069',
  'WMLS-C-112'
]) {
  if (!effectiveText.includes(marker)) {
    throw new Error(`WAP-193_101 extraction is missing marker: ${marker}`);
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
  'Support for floating-point-capable and integer-only devices',
  'WMLScript Standard Libraries',
  'Case-sensitive language',
  'Whitespace and line breaks between program tokens',
  'Semicolon statement termination',
  'Multi-line and single-line comments',
  'Nested comments are disallowed',
  'Integer literals',
  'Floating-point literals',
  'Single- and double-quoted string literals',
  'String escape sequences',
  'Boolean literals',
  'Invalid literal',
  'Identifier syntax',
  'Variable scope and lifetime',
  'Integer size',
  'Floating-point size',
  'Assignment operators',
  'Arithmetic operators',
  'Logical operators',
  'String operators',
  'Comparison operators',
  'Array operators',
  'Comma operator',
  'Conditional operator',
  'typeof operator',
  'isvalid operator',
  'Expression bindings',
  'Function declaration',
  'Local script function calls',
  'External function calls',
  'Library function calls',
  'Default function return value',
  'Empty statement',
  'Block statement',
  'Variable statement',
  'if statement',
  'while statement',
  'for statement',
  'break statement',
  'continue statement',
  'return statement',
  'External compilation-unit pragma',
  'Access-control pragma',
  'Meta-information pragma',
  'Function argument passing',
  'Allocation of variable indexes',
  'Automatic function return value',
  'Variable initialization',
  'Binary-format data types',
  'Multi-byte integer format',
  'Character encoding',
  'Bytecode header',
  'Constant pool',
  'Pragma pool',
  'Function pool',
  'Control-flow instructions',
  'Function-call instructions',
  'Variable access and manipulation',
  'Access to constants',
  'Arithmetic instructions',
  'Bitwise instructions',
  'Comparison instructions',
  'Logical instructions',
  'Stack instructions',
  'Access to operand type',
  'Function-return instructions',
  'Debug instruction',
  'Interpret WMLScript bytecode',
  'WMLScript Standard Libraries',
  'Floating-point size',
  'Conversions to String',
  'Conversions to Integer',
  'Conversions to Floating-Point',
  'Conversions to Boolean',
  'Conversions to Invalid',
  'Operator data-type conversion rules',
  'URL schemes',
  'Fragment anchors',
  'URL-call syntax',
  'URL-call parameter passing',
  'Relative URLs',
  'Function argument passing',
  'Allocation of variable indexes',
  'Automatic function return value',
  'Variable initialization',
  'Access control',
  'Binary-format data types',
  'Multi-byte integer format',
  'Character encoding',
  'Bytecode header',
  'Constant pool',
  'Pragma pool',
  'Function pool',
  'Control-flow instructions',
  'Function-call instructions',
  'Variable access and manipulation',
  'Access to constants',
  'Arithmetic instructions',
  'Bitwise instructions',
  'Comparison instructions',
  'Logical instructions',
  'Stack instructions',
  'Access to operand type',
  'Function-return instructions',
  'Debug instruction',
  'Bytecode integrity verification',
  'Runtime validity checks',
  'General error handling',
  'Fatal error handling',
  'Non-fatal error handling',
  'Floating-point operations'
];

if (features.length !== 112) {
  throw new Error(`Expected 112 WMLScript features; found ${features.length}`);
}

const optionalOrdinals = new Set([68, 71, 74, 112]);
const partialSelectedOrdinals = new Set([
  69, 70, 72, 77, 83, 84, 85, 86, 88, 90, 95, 96, 97, 98, 99, 103,
  104, 105, 107, 108, 109, 110, 111
]);

function sectionFor(ordinal) {
  if (ordinal <= 2) return ['15.1.1', 'encoder-core-capabilities'];
  if (ordinal <= 45) return ['15.1.2', 'encoder-language-core'];
  if (ordinal <= 49) return ['15.1.3', 'encoder-function-calls'];
  if (ordinal <= 56) return ['15.1.4', 'encoder-binary-format'];
  if (ordinal <= 68) return ['15.1.5', 'encoder-instruction-set'];
  if (ordinal <= 70) return ['15.2.1', 'interpreter-core-capabilities'];
  if (ordinal <= 77) return ['15.2.2', 'automatic-data-conversion'];
  if (ordinal <= 87) return ['15.2.3', 'interpreter-function-calls'];
  if (ordinal <= 94) return ['15.2.4', 'interpreter-binary-format'];
  if (ordinal <= 106) return ['15.2.5', 'interpreter-instruction-set'];
  if (ordinal <= 111) return ['15.2.6', 'error-handling'];
  return ['15.2.7', 'floating-point-support'];
}

function traceabilityFor(ordinal) {
  if (ordinal === 70) {
    return {
      requirementIds: ['RQ-WMLS-012'],
      workItems: ['WMLS-504', 'W1-05']
    };
  }
  if (ordinal >= 71 && ordinal <= 77) {
    return {
      requirementIds: ['RQ-WMLS-006', 'RQ-WMLS-007'],
      workItems: ['WMLS-502', 'W1-04']
    };
  }
  if (ordinal >= 78 && ordinal <= 82) {
    return {
      requirementIds: ['RQ-WMLS-001', 'RQ-WMLS-003'],
      workItems: ['WMLS-503', 'W1-03', 'W0-08']
    };
  }
  if (ordinal >= 83 && ordinal <= 86) {
    return {
      requirementIds: ['RQ-WMLS-004', 'RQ-WMLS-005'],
      workItems: ['WMLS-502', 'W1-04']
    };
  }
  if (ordinal === 87) {
    return {
      requirementIds: ['RQ-WMLS-001', 'RQ-WMLS-002'],
      workItems: ['WMLS-503', 'W1-03', 'W0-08']
    };
  }
  if (ordinal >= 88 && ordinal <= 106) {
    return {
      requirementIds: ['RQ-WMLS-008'],
      workItems: ['WMLS-501', 'W1-02']
    };
  }
  if (ordinal === 107 || ordinal === 108) {
    return {
      requirementIds: ['RQ-WMLS-009'],
      workItems: ['WMLS-501', 'W1-02']
    };
  }
  if (ordinal >= 109 && ordinal <= 111) {
    return {
      requirementIds: ['RQ-WMLS-010'],
      workItems: ['WMLS-505', 'W1-06', 'W1-07']
    };
  }
  if (ordinal === 112) {
    return {
      requirementIds: ['RQ-WMLS-007'],
      workItems: ['WMLS-504', 'W1-05']
    };
  }
  return {
    requirementIds: ['RQ-WMLS-008'],
    workItems: ['WMLS-501', 'W1-05']
  };
}

function evidenceFor(ordinal) {
  if (!partialSelectedOrdinals.has(ordinal)) {
    return { implementationEvidence: [], testEvidence: [] };
  }
  if (ordinal === 70) {
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
          test: 'set_and_get_var_roundtrip',
          limitation:
            'Only a project-specific WMLBrowser/Dialog subset exists; the six WAP standard libraries and identifiers are not complete.'
        }
      ]
    };
  }
  if (ordinal === 72 || ordinal === 77) {
    return {
      implementationEvidence: [
        {
          path: 'engine-wasm/engine/src/wavescript/stdlib/wmlbrowser.rs',
          symbol: 'coerce_to_string'
        },
        {
          path: 'engine-wasm/engine/src/wavescript/value.rs',
          symbol: 'ScriptValue'
        }
      ],
      testEvidence: [
        {
          path:
            'engine-wasm/engine/src/wavescript/stdlib/wmlbrowser_tests.rs',
          test: 'string_coercion_is_deterministic_for_scalars',
          limitation:
            'The test covers a local helper, not the complete WAP-193 conversion table.'
        }
      ]
    };
  }
  if (ordinal >= 83 && ordinal <= 86) {
    return {
      implementationEvidence: [
        {
          path: 'engine-wasm/engine/src/wavescript/vm.rs',
          symbol: 'Vm::execute_from_pc_with_locals_and_host'
        }
      ],
      testEvidence: [
        {
          path: 'engine-wasm/engine/src/wavescript/vm_tests.rs',
          test: 'execute_call_and_return_with_arg_local_flow',
          limitation:
            'The project-specific frame model has not been proven against WAP function metadata and exact arity rules.'
        }
      ]
    };
  }
  if (ordinal >= 109) {
    return {
      implementationEvidence: [
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
            'The deterministic local taxonomy is not yet mapped exhaustively to WAP-193 chapter 12 outcomes.'
        }
      ]
    };
  }
  return {
    implementationEvidence: [
      {
        path: 'engine-wasm/engine/src/wavescript/decoder.rs',
        symbol: 'decode_compilation_unit_with_limits'
      },
      {
        path: 'engine-wasm/engine/src/wavescript/vm.rs',
        symbol: 'Vm'
      }
    ],
    testEvidence: [
      {
        path: 'engine-wasm/engine/src/wavescript/decoder.rs',
        test: 'decode_rejects_unknown_opcode',
        limitation:
          'The decoder verifies a project-specific nine-opcode skeleton, not the WAP-193 header, pools, multi-byte fields, or instruction encoding.'
      }
    ]
  };
}

const obligations = features.map((feature, index) => {
  const ordinal = index + 1;
  const isClient = ordinal >= 69;
  const specificationStatus = optionalOrdinals.has(ordinal)
    ? 'optional'
    : 'mandatory';
  const isSelected = isClient && specificationStatus === 'mandatory';
  const [staticConformanceSection, group] = sectionFor(ordinal);
  const traceability = traceabilityFor(ordinal);
  const evidence = evidenceFor(ordinal);
  const implementationStatus = isSelected
    ? partialSelectedOrdinals.has(ordinal)
      ? 'partial'
      : 'missing'
    : 'not-assessed';

  return {
    id: `WMLS-${isClient ? 'C' : 'S'}-${String(ordinal).padStart(3, '0')}`,
    ordinal,
    actor: isClient ? 'wmlscript-interpreter' : 'wmlscript-encoder',
    group,
    feature,
    referencedSection: feature,
    specificationStatus,
    dependencyExpression:
      ordinal === 112
        ? {
            type: 'source-expression',
            raw: 'WMLS-C-17 AND WMLS-C-73',
            note:
              'Preserved exactly from the effective SCR even though the printed identifiers omit the three-digit form.'
          }
        : { type: 'none', scrIds: [] },
    sourceAnchor: {
      documentId: 'WAP-193_101-WMLScript',
      staticConformanceSection
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
      requirementIds: traceability.requirementIds,
      workItems: traceability.workItems,
      implementationStatus,
      assessmentNote: isSelected
        ? implementationStatus === 'partial'
          ? 'Related local behavior exists, but the evidence does not yet prove the complete WAP-193 requirement and effective binary format.'
          : 'No implementation and direct normative test evidence currently closes this selected WAP-193 interpreter requirement.'
        : isClient
          ? 'Optional interpreter SCR retained for an explicit capability decision; it is not selected by WMLScript:MCF.'
          : 'Encoder SCR retained for source completeness and a future compiler/encoder module; it is outside the selected Class C client profile.',
      ...evidence,
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

const ledger = {
  schemaVersion: 1,
  releaseId: release.release.id,
  family: 'wmlscript',
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
      return {
        documentId,
        filename: document.filename,
        sha256: document.sha256,
        role:
          documentId === 'WAP-193_101-WMLScript'
            ? 'effective-consolidated-scr'
            : document.documentRole,
        ...(documentId === 'WAP-193_101-WMLScript'
          ? {
              textExtractionBytes: Buffer.byteLength(effectiveText),
              textExtractionSha256: effectiveTextSha256
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
      selectedRequirement: 'WMLScript:MCF',
      ledger:
        'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
    },
    interpretation:
      'WAP-193_101 is the consolidated effective WMLScript specification after WAP-193 and supplies the actor-delimited 112-row SCR. WAP-221 applies WMLScript:MCF to the 41 mandatory interpreter rows; encoder and optional interpreter rows remain outside the selected Class C client profile.',
    extractionMethod:
      'Normalized row transcription from the hash-locked effective text; source PDFs and full text remain outside Git.'
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
  `Wrote ${outputPath}: ${obligations.length} WMLScript SCR rows, ${selectedRequired.length} Class C-required interpreter rows`
);
