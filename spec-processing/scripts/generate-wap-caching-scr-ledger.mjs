#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const cachingTextPath = option('--caching-text');
const creqTextPath = option('--creq-text');
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-caching-scr.json';

if (!cachingTextPath || !creqTextPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-caching-scr-ledger.mjs ' +
      '--caching-text /absolute/path/WAP-120-WAPCachingMod-20010413-a.txt ' +
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
const externalDependencies = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-external-dependencies.json',
    'utf8'
  )
);
const externalIngestion = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-external-ingestion-status.json',
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

const family = effectiveSpec.families.find(
  (entry) => entry.family === 'caching'
);
if (
  JSON.stringify(family?.effectiveSequence) !==
  JSON.stringify(['WAP-120-WAPCachingMod'])
) {
  throw new Error('Effective caching source sequence has drifted');
}
if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001' ||
  !classConformance.selectedTarget?.requirementExpressions?.includes(
    'WAPCachingMod:MCF'
  )
) {
  throw new Error(
    'WAP-215 class ledger must select CCR-CLASSC-C-001 with WAPCachingMod:MCF'
  );
}

const cachingText = fs.readFileSync(cachingTextPath, 'utf8');
const creqText = fs.readFileSync(creqTextPath, 'utf8');
const cachingIngestion = ingestion.members.find(
  (member) => member.documentId === 'WAP-120-WAPCachingMod'
);
const cachingTextSha256 = crypto
  .createHash('sha256')
  .update(cachingText)
  .digest('hex');
if (cachingTextSha256 !== cachingIngestion?.parsedText?.sha256) {
  throw new Error('WAP-120 text extraction hash drift');
}
for (const marker of [
  'Appendix A. Static Conformance Requirements',
  'UACache-C-001',
  'UACache-C-006',
  'UACache-S-007',
  'UACache-S-011'
]) {
  if (!cachingText.includes(marker)) {
    throw new Error(`WAP-120 extraction is missing marker: ${marker}`);
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
    'UACache-C-001',
    'wml-user-agent-cache',
    'http-cache-model',
    'Implement HTTP caching model as described in RFC 2616',
    '4.1',
    'M'
  ],
  [
    'UACache-C-002',
    'wml-user-agent-cache',
    'history-revalidation',
    'Revalidate a stale cached resource on history back when Cache-Control includes must-revalidate',
    '4.1.1',
    'M'
  ],
  [
    'UACache-C-003',
    'wml-user-agent-cache',
    'history-revalidation',
    'Do not revalidate a stale cached resource on history back without must-revalidate',
    '4.1.1',
    'M'
  ],
  [
    'UACache-C-004',
    'wml-user-agent-cache',
    'intra-resource-navigation',
    'Do not revalidate WML intra-deck or WMLScript intra-compilation-unit navigation',
    '4.1.2',
    'M'
  ],
  [
    'UACache-C-005',
    'wml-user-agent-cache',
    'time-of-day',
    'Synchronize the user-agent time base with the gateway',
    '5.2',
    'O'
  ],
  [
    'UACache-C-006',
    'wml-user-agent-cache',
    'cache-security',
    'Protect cached contents from malicious or unintended access',
    '6',
    'M'
  ],
  [
    'UACache-S-007',
    'wap-gateway-cache',
    'http-cache-model',
    'Implement HTTP proxy caching model as described in RFC 2616',
    '4.2',
    'M'
  ],
  [
    'UACache-S-008',
    'wap-gateway-cache',
    'time-of-day',
    'Synchronize the gateway time base with NTP',
    '4.2.1',
    'O'
  ],
  [
    'UACache-S-009',
    'wap-gateway-cache',
    'gateway-response-cache',
    'Cache WSP responses using HTTP proxy semantics',
    '4.2.2',
    'M'
  ],
  [
    'UACache-S-010',
    'wap-gateway-cache',
    'time-of-day',
    'Support x-wap-tod in WSP requests',
    '5.1',
    'M'
  ],
  [
    'UACache-S-011',
    'wap-gateway-cache',
    'cache-security',
    'Obey RFC 2616 caching security considerations',
    '6',
    'M'
  ]
];

const selectedAudit = new Map([
  [
    'UACache-C-001',
    {
      status: 'partial',
      note:
        'The current fetch path has no repository-owned HTTP response cache and behaves like an implicit zero-byte cache, but that profile and the absence of hidden host caching are not declared or directly tested against WAP-120/RFC 2616.',
      evidence: [
        {
          path: 'transport-rust/src/fetch_policy.rs',
          symbol: 'apply_request_policy'
        },
        {
          path: 'browser/frontend/src/app/navigation-state.ts',
          symbol: 'loadTransportUrl'
        }
      ],
      tests: [
        {
          path: 'browser/frontend/src/app/navigation-state.load.test.ts',
          test: 'maps reload source to no-cache request policy',
          limitation:
            'Proves an explicit reload header mapping, not the complete zero-byte HTTP cache model.'
        }
      ]
    }
  ],
  [
    'UACache-C-002',
    {
      status: 'missing',
      note:
        'No response-cache metadata model parses freshness or must-revalidate, and history back cannot conditionally reproduce the original request for stale cached content.',
      evidence: [],
      tests: []
    }
  ],
  [
    'UACache-C-003',
    {
      status: 'missing',
      note:
        'History back currently refetches an earlier external resource because there is no cached entity/freshness model; no behavior preserves a stale cached representation when must-revalidate is absent.',
      evidence: [],
      tests: []
    }
  ],
  [
    'UACache-C-004',
    {
      status: 'partial',
      note:
        'Intra-deck fragment navigation stays inside the loaded engine deck, and registered script calls stay inside the engine, but direct WAP-120 fixtures do not yet prove both required intra-resource cases.',
      evidence: [
        {
          path: 'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          symbol: 'navigate_to_card_internal'
        },
        {
          path: 'engine-wasm/engine/src/engine_runtime_internal.rs',
          symbol: 'invoke_script_ref_internal'
        }
      ],
      tests: [
        {
          path: 'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          test: 'enter_navigates_to_fragment_card',
          limitation:
            'Proves in-deck navigation without transport fetch but is not a complete WAP-120 cache fixture.'
        },
        {
          path: 'engine-wasm/engine/src/engine_tests/script_runtime.rs',
          test: 'script_link_executes_registered_unit_without_external_navigation',
          limitation:
            'Uses the project-specific script runtime rather than a WAP-193 compilation-unit fixture.'
        }
      ]
    }
  ],
  [
    'UACache-C-006',
    {
      status: 'partial',
      note:
        'No repository-owned persistent HTTP cache is present, reducing the stored-cache attack surface, but the zero-byte policy and sensitive deck/script/history retention boundaries are not explicitly security-tested.',
      evidence: [
        {
          path: 'browser/frontend/src/session-history.ts',
          symbol: 'HostHistoryEntry'
        }
      ],
      tests: [
        {
          path: 'browser/frontend/src/session-history.test.ts',
          test: 'keeps separate entries when request policy metadata differs',
          limitation:
            'History determinism is not a cache confidentiality/access-control test.'
        }
      ]
    }
  ]
]);

function externalDependency(id) {
  const metadata = externalDependencies.dependencies.find(
    (entry) => entry.id === id
  );
  const acquisition = externalIngestion.dependencies.find(
    (entry) => entry.dependencyId === id
  );
  if (!metadata || !acquisition) {
    throw new Error(`Missing external dependency lock for ${id}`);
  }
  return {
    id,
    title: metadata.title,
    version: metadata.version,
    authority: metadata.authority,
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

const obligations = rows.map(
  ([id, actor, group, feature, referencedSection, status], index) => {
    const isClient = actor === 'wml-user-agent-cache';
    const isSelected = isClient && status === 'M';
    const audit = selectedAudit.get(id);
    if (isSelected && !audit) {
      throw new Error(`Selected WAPCachingMod:MCF row lacks audit: ${id}`);
    }

    return {
      id,
      ordinal: index + 1,
      actor,
      group,
      feature,
      referencedSection,
      specificationStatus: status === 'M' ? 'mandatory' : 'optional',
      dependencyExpression:
        [1, 7, 11].includes(index + 1)
          ? { type: 'external-standard', dependencyIds: ['rfc-2616'] }
          : index + 1 === 8
            ? { type: 'external-standard', dependencyIds: ['rfc-1305'] }
            : { type: 'none', dependencyIds: [] },
      sourceAnchor: {
        documentId: 'WAP-120-WAPCachingMod',
        staticConformanceSection: 'Appendix A'
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
        ownerLayers: isClient
          ? ['transport-rust', 'browser', 'engine-wasm']
          : ['gateway-kannel', 'transport-rust'],
        requirementIds: ['RQ-WAE-008'],
        workItems: isClient
          ? ['WAE-603', 'T0-15']
          : ['WAE-603'],
        implementationStatus: audit?.status ?? 'not-assessed',
        assessmentNote:
          audit?.note ??
          (isClient
            ? 'Optional client capability retained for explicit declaration and is outside WAPCachingMod:MCF.'
            : 'Gateway/server SCR retained for source completeness and is outside the selected Class C client profile.'),
        implementationEvidence: audit?.evidence ?? [],
        testEvidence: audit?.tests ?? [],
        evidenceState: isSelected
          ? audit.status === 'partial'
            ? 'provisional-non-normative-test-linked'
            : 'gap-work-item-mapped'
          : 'outside-selected-client-profile'
      }
    };
  }
);

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
const source = family.documents[0];
const governingSource = release.governingDependencies.find(
  (entry) => entry.documentId === 'WAP-221-CREQ-20010425-a'
);
const classSource = release.governingDependencies.find(
  (entry) => entry.documentId === 'WAP-215-ClassConform-20001213-a'
);

const ledger = {
  schemaVersion: 1,
  releaseId: release.release.id,
  family: 'caching',
  recordedOn,
  target: {
    stack: 'WAP 1.2.1',
    markup: 'WML 1.3',
    classProfile: 'WAP-215 Class C client (CCR-CLASSC-C-001)',
    cacheProfile: 'strict behavior with zero-byte cache allowed by WAP-120'
  },
  authority: {
    effectiveSequence: family.effectiveSequence,
    extractionSources: [
      {
        documentId: source.documentId,
        filename: source.filename,
        sha256: source.sha256,
        role: source.documentRole,
        repositoryState: source.localState,
        textExtractionBytes: Buffer.byteLength(cachingText),
        textExtractionSha256: cachingTextSha256
      }
    ],
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
      selectedRequirement: 'WAPCachingMod:MCF',
      ledger:
        'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
    },
    externalDependencies: [
      externalDependency('rfc-2616'),
      externalDependency('rfc-1305')
    ],
    interpretation:
      'WAP-120 supplies an 11-row actor-specific SCR. WAP-221 applies WAPCachingMod:MCF to the five mandatory user-agent rows; optional TOD synchronization and all gateway rows remain outside the selected Class C client profile. WAP-120 explicitly permits a zero-byte cache but still governs observable history, intra-resource, and security behavior.',
    extractionMethod:
      'Normalized transcription from the hash-locked release-member text; recovered PDF and full text remain outside Git.'
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
  `Wrote ${outputPath}: ${obligations.length} caching SCR rows, ${selectedRequired.length} Class C-required client rows`
);
