#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestDirectory = 'spec-processing/source-manifests';
const inputPaths = {
  release: `${manifestDirectory}/wap-1.2.1-release.json`,
  classConformance: `${manifestDirectory}/wap-1.2.1-class-conformance.json`,
  ingestion: `${manifestDirectory}/wap-1.2.1-ingestion-status.json`,
  externalDependencies: `${manifestDirectory}/wap-1.2.1-external-dependencies.json`,
  externalIngestion: `${manifestDirectory}/wap-1.2.1-external-ingestion-status.json`
};
const outputRelativePath = `${manifestDirectory}/wap-1.2.1-effective-spec.json`;
const outputPath = path.join(root, outputRelativePath);
const generatorPath = 'spec-processing/scripts/generate-wap-effective-spec.mjs';

const args = new Set(process.argv.slice(2));
for (const arg of args) {
  if (arg !== '--check') {
    throw new Error(`Unknown argument: ${arg}`);
  }
}
const checkOnly = args.has('--check');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readInput(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing canonical input: ${absolutePath}`);
  }
  const source = fs.readFileSync(absolutePath, 'utf8');
  return {
    source,
    value: JSON.parse(source)
  };
}

const inputs = Object.fromEntries(
  Object.entries(inputPaths).map(([key, relativePath]) => [key, readInput(relativePath)])
);
const manifest = inputs.release.value;
const classConformance = inputs.classConformance.value;
const ingestion = inputs.ingestion.value;
const externalDependencies = inputs.externalDependencies.value;
const externalIngestion = inputs.externalIngestion.value;

for (const [name, input] of Object.entries({
  classConformance,
  ingestion,
  externalDependencies,
  externalIngestion
})) {
  if (input.releaseId !== manifest.release.id) {
    throw new Error(`${name} releaseId=${input.releaseId}; expected ${manifest.release.id}`);
  }
}

const selectedTarget = classConformance.selectedTarget;
const selectedProfile = classConformance.actors
  .flatMap((actor) =>
    actor.profiles.map((profile) => ({
      ...profile,
      deviceRole: actor.deviceRole
    }))
  )
  .find((profile) => profile.identifier === selectedTarget.identifier);
if (!selectedProfile) {
  throw new Error(
    `Selected class profile ${selectedTarget.identifier} is not present in the class ledger`
  );
}
if (
  selectedProfile.deviceRole !== selectedTarget.deviceRole ||
  selectedProfile.deviceClass !== selectedTarget.deviceClass
) {
  throw new Error('Selected class target does not match its actor/profile record');
}

const selectedRequirements = new Map(
  selectedProfile.requirements.map((requirement) => [requirement.effectiveFamily, requirement])
);
if (
  JSON.stringify([...selectedRequirements.keys()]) !==
    JSON.stringify(selectedTarget.effectiveFamilies) ||
  JSON.stringify(
    [...selectedRequirements.values()].map((requirement) => requirement.expression)
  ) !== JSON.stringify(selectedTarget.requirementExpressions)
) {
  throw new Error('Selected class target summary does not match its canonical requirement graph');
}

const ingestionByDocument = new Map(ingestion.members.map((member) => [member.documentId, member]));
for (const member of manifest.members) {
  const ingested = ingestionByDocument.get(member.documentId);
  if (
    !ingested ||
    ingested.family !== member.family ||
    ingested.releaseMember?.sha256 !== member.sha256 ||
    !ingested.parsedText?.sha256
  ) {
    throw new Error(
      `${member.documentId}: release and ingestion locks are incomplete or inconsistent`
    );
  }
}

const externalById = new Map(
  externalDependencies.dependencies.map((dependency) => [dependency.id, dependency])
);
const externalIngestionById = new Map(
  externalIngestion.dependencies.map((dependency) => [dependency.dependencyId, dependency])
);
for (const dependencyId of ['rfc-768', 'rfc-791', 'rfc-792', 'tiaeia-is-732-cdpd-set']) {
  if (!externalById.has(dependencyId) || !externalIngestionById.has(dependencyId)) {
    throw new Error(`${dependencyId}: missing external authority or ingestion lock`);
  }
}
if (externalById.get('rfc-792').applicability !== 'conditional-ip-control') {
  throw new Error('RFC 792 must remain classified as conditional IP control');
}

const familyOwners = new Map([
  ['architecture', ['cross-layer']],
  ['caching', ['engine-wasm', 'transport-rust']],
  ['push-message', ['gateway-kannel', 'transport-rust']],
  ['push-proxy-gateway', ['gateway-kannel']],
  ['wdp-wcmp-adaptation', ['transport-rust']],
  ['wmlscript-crypto', ['engine-wasm', 'browser']],
  ['push-access-protocol', ['gateway-kannel']],
  ['push-architecture', ['gateway-kannel', 'transport-rust']],
  ['service-indication', ['engine-wasm', 'transport-rust']],
  ['service-loading', ['engine-wasm', 'transport-rust']],
  ['wta', ['engine-wasm', 'browser']],
  ['wtai', ['engine-wasm', 'browser']],
  ['wtai-gsm', ['browser']],
  ['wtai-is136', ['browser']],
  ['wtai-pdc', ['browser']],
  ['user-agent-profile', ['browser', 'transport-rust']],
  ['cache-operation', ['engine-wasm', 'transport-rust']],
  ['general-formats', ['cross-layer']],
  ['push-over-the-air', ['gateway-kannel', 'transport-rust']],
  ['wae', ['engine-wasm', 'browser']],
  ['wml', ['engine-wasm']],
  ['wbxml', ['transport-rust']],
  ['wmlscript', ['engine-wasm']],
  ['wmlscript-libraries', ['engine-wasm']],
  ['wae-overview', ['cross-layer']],
  ['wim', ['transport-rust', 'browser']],
  ['wtls', ['transport-rust']],
  ['wdp', ['transport-rust']],
  ['wtp', ['transport-rust']],
  ['wcmp', ['transport-rust']],
  ['wsp', ['transport-rust']],
  ['wap-over-gsm-ussd', ['gateway-kannel', 'transport-rust']],
  ['interoperability-pictograms', ['engine-wasm']],
  ['persistent-storage', ['engine-wasm', 'browser']],
  ['external-functionality-interface', ['engine-wasm', 'browser']]
]);

const successorEvidence = new Map([
  ['architecture', ['WAP-210-WAPArch-20010712-a']],
  ['wae', ['WAP-236-WAESpec-20020207-a', 'WAP-237-WAEMT-20010515-a']],
  ['wml', ['WAP-238-WML-20010911-a']],
  ['wdp', ['WAP-259-WDP-20010614-a']],
  ['wtp', ['WAP-224-WTP-20010710-a', 'OMA-WAP-224_002-WTP-SIN-20020827-a']],
  ['wsp', ['WAP-230-WSP-20010705-a', 'OMA-WAP-TS-WSP-V1_0-20020920-C']],
  ['wtls', ['WAP-261-WTLS-20010406-a', 'WAP-261_100-WTLS-20010926-a']],
  ['wim', ['WAP-260-WIM-20010712-a']]
]);

const strictTransportProfile = {
  profileId: selectedTarget.identifier,
  deviceRole: selectedTarget.deviceRole,
  deviceClass: selectedTarget.deviceClass,
  selectedBearer: {
    id: 'cdpd-ipv4',
    networkProtocol: 'ipv4',
    datagramProtocol: 'udp',
    sourceDocument: 'WAP-200-WDP',
    sourceSection: '5.4.3',
    externalContext: 'tiaeia-is-732-cdpd-set'
  },
  families: {
    wdp: {
      selectedFeatureGroup: selectedRequirements.get('wdp')?.expression,
      selectedPath: 'udp-over-ipv4',
      sourceDocuments: ['WAP-200-WDP', 'rfc-768', 'rfc-791']
    },
    wcmp: {
      selectedFeatureGroup: selectedRequirements.get('wcmp')?.expression,
      selectedPath: 'rfc-792-icmpv4',
      sourceDocument: 'WAP-202-WCMP',
      sourceSection: '5.3',
      normativeDependency: 'rfc-792',
      generalWcmpDisposition: 'capability-gated-non-ip-bearer'
    },
    wsp: {
      selectedFeatureGroup: selectedRequirements.get('wsp')?.expression,
      selectedPath: 'connectionless',
      sourceDocument: 'WAP-203-WSP',
      connectionOrientedDisposition: 'conditional-capability'
    },
    wtp: {
      selected: false,
      activationCondition: 'connection-oriented-wsp-selected'
    }
  }
};
for (const family of ['wdp', 'wcmp', 'wsp']) {
  if (!strictTransportProfile.families[family].selectedFeatureGroup) {
    throw new Error(`${family}: selected Class C feature group is missing`);
  }
}

function disposition(sourceClass) {
  return {
    'core-mandatory': 'strict-baseline',
    dependency: 'strict-supporting',
    'core-optional': 'strict-conditional',
    'profile-optional': 'optional-profile',
    historical: 'historical-only',
    'explicitly-deferred': 'explicitly-deferred'
  }[sourceClass];
}

const ledgerConfig = new Map([
  [
    'caching',
    {
      ledger: 'wap-1.2.1-caching-scr.json',
      note: 'WAP-120 Appendix A supplies the actor-specific caching SCR. The selected Class C requirement is recorded structurally; zero-byte cache remains a valid but explicit behavior profile.'
    }
  ],
  [
    'wml',
    {
      ledger: 'wap-1.2.1-wml-scr.json',
      note: 'The effective WML 1.3 SCR is source-extracted and mapped to work items. The selected Class C requirement and feature group are recorded structurally; current totals and evidence states remain derived in the family ledger and knowledge graph.'
    }
  ],
  [
    'wae',
    {
      ledger: 'wap-1.2.1-wae-scr.json',
      note: 'WAP-190_104 section 4.3 supplies the resulting tracked-change SCR table after the approved WAE SIN chain. The selected Class C requirement and feature group are recorded structurally.'
    }
  ],
  [
    'wbxml',
    {
      ledger: 'wap-1.2.1-wbxml-scr.json',
      note: 'WAP-192_105 corrects the actor-specific WBXML 1.3 SCR and restores omitted WAP-192.101 changes. The selected Class C requirement and feature group are recorded structurally.'
    }
  ],
  [
    'wmlscript',
    {
      ledger: 'wap-1.2.1-wmlscript-scr.json',
      note: 'WAP-193_101 supplies the consolidated actor-specific WMLScript SCR. The selected Class C requirement and feature group are recorded structurally.'
    }
  ],
  [
    'wmlscript-libraries',
    {
      ledger: 'wap-1.2.1-wmlscript-libraries-scr.json',
      note: 'WAP-194 supplies the base SCR and WAP-194_103 adds optional immediate-refresh row WMLSSL-C-095. The selected Class C requirement and feature group are recorded structurally.'
    }
  ],
  ['wdp', { ledger: 'wap-1.2.1-wdp-scr.json' }],
  ['wcmp', { ledger: 'wap-1.2.1-wcmp-scr.json' }],
  ['wsp', { ledger: 'wap-1.2.1-wsp-scr.json' }]
]);

function scrExtraction(family) {
  const config = ledgerConfig.get(family);
  if (!config) {
    return {
      status: 'pending-line-item-ledger',
      governingDocument: 'WAP-221-CREQ-20010425-a',
      note: 'SCR tables and SIN changes require line-item extraction; this graph establishes source precedence only.'
    };
  }

  const requirement = selectedRequirements.get(family);
  if (!requirement) {
    throw new Error(`${family}: ledger exists without a selected class requirement`);
  }
  const extraction = {
    status: 'line-item-ledger-complete-class-c-applied',
    governingDocument: 'WAP-221-CREQ-20010425-a',
    governingClassProfileDocument: classConformance.authority.documentId,
    ledger: `${manifestDirectory}/${config.ledger}`,
    classProfileLedger: inputPaths.classConformance,
    selectedProfile: selectedTarget.identifier,
    selectedFeatureGroup: requirement.expression
  };
  if (strictTransportProfile.families[family]) {
    extraction.applicability = {
      profile: '#/strictTransportProfile',
      family: `#/strictTransportProfile/families/${family}`
    };
    extraction.note =
      'Strict transport applicability is defined once by strictTransportProfile; the family ledger retains row-level dispositions and evidence.';
  } else {
    extraction.note = config.note;
  }
  return extraction;
}

const grouped = new Map();
for (const member of manifest.members) {
  const entries = grouped.get(member.family) ?? [];
  entries.push(member);
  grouped.set(member.family, entries);
}

const families = [...grouped.entries()]
  .map(([family, documents]) => {
    documents.sort((left, right) => {
      const dateOrder = left.publishedOn.localeCompare(right.publishedOn);
      if (dateOrder !== 0) {
        return dateOrder;
      }
      if (left.documentRole !== right.documentRole) {
        return left.documentRole === 'base' ? -1 : 1;
      }
      return left.documentId.localeCompare(right.documentId);
    });

    const approved = documents.filter((document) => document.publicationStatus === 'approved');
    const historical = documents.filter((document) => document.publicationStatus !== 'approved');
    const bases = approved.filter((document) => document.documentRole === 'base');
    const sins = approved.filter((document) => document.documentRole === 'sin');
    const relationships = [];

    for (let index = 1; index < approved.length; index += 1) {
      relationships.push({
        from: approved[index - 1].documentId,
        to: approved[index].documentId,
        type: 'applied-before'
      });
    }
    for (const sin of sins) {
      for (const base of bases) {
        relationships.push({
          from: base.documentId,
          to: sin.documentId,
          type: 'amended-by'
        });
      }
    }

    const sourceClass = documents[0].sourceClass;
    return {
      family,
      title: documents[0].title,
      sourceClass,
      targetDisposition: disposition(sourceClass),
      ownerLayers: familyOwners.get(family) ?? ['unassigned'],
      completeness:
        sins.length > 0 && bases.length === 0
          ? 'release-carried-sin-without-base'
          : 'release-member-chain-complete',
      interpretationRule:
        'Start with each approved base and apply approved SINs in effectiveSequence order. A SIN changes only the identified text unless it explicitly supplies a replacement.',
      effectiveSequence: approved.map((document) => document.documentId),
      baseDocuments: bases.map((document) => document.documentId),
      sinDocuments: sins.map((document) => document.documentId),
      historicalDocuments: historical.map((document) => document.documentId),
      relationships,
      scrExtraction: scrExtraction(family),
      successorEvidence: (successorEvidence.get(family) ?? []).map((documentId) => ({
        documentId,
        role: 'delta-evidence-only',
        deltaStatus: [
          'WAP-236-WAESpec-20020207-a',
          'WAP-238-WML-20010911-a',
          'WAP-259-WDP-20010614-a',
          'WAP-230-WSP-20010705-a'
        ].includes(documentId)
          ? 'selected-profile-delta-complete'
          : family === 'wae' && documentId === 'WAP-237-WAEMT-20010515-a'
            ? 'optional-media-delta-pending'
            : 'pending'
      })),
      documents: documents.map((document) => ({
        documentId: document.documentId,
        filename: document.filename,
        documentRole: document.documentRole,
        publicationStatus: document.publicationStatus,
        publishedOn: document.publishedOn,
        sha256: document.sha256,
        localState: document.local.state
      }))
    };
  })
  .sort((left, right) => left.family.localeCompare(right.family));

const dispositionCounts = {};
for (const family of families) {
  dispositionCounts[family.targetDisposition] =
    (dispositionCounts[family.targetDisposition] ?? 0) + 1;
}

const graph = {
  schemaVersion: 2,
  releaseId: manifest.release.id,
  generatedFrom: {
    generator: generatorPath,
    inputs: Object.fromEntries(
      Object.entries(inputPaths).map(([key, relativePath]) => [
        key,
        {
          path: relativePath,
          sha256: sha256(inputs[key].source)
        }
      ])
    )
  },
  governingConformanceDocument: 'WAP-221-CREQ-20010425-a',
  governingClassProfileDocument: classConformance.authority.documentId,
  classProfileLedger: inputPaths.classConformance,
  strictTransportProfile,
  graphStatus: 'source-precedence-complete-scr-extraction-pending',
  semantics: {
    effectiveSequence:
      'Approved documents only, ordered by publication date with base before SIN on ties.',
    proposedDocuments:
      'Retained as historical evidence and excluded from the normative effective sequence.',
    laterSpecifications:
      'Successor WAP 2.0 material is delta evidence and cannot override strict WAP 1.2.1 behavior.'
  },
  summary: {
    familyCount: families.length,
    byTargetDisposition: Object.fromEntries(Object.entries(dispositionCounts).sort())
  },
  families
};

const rendered = `${JSON.stringify(graph, null, 2)}\n`;
console.log('==> WAP 1.2.1 effective-spec graph');
if (checkOnly) {
  if (!fs.existsSync(outputPath)) {
    console.error(`FAIL missing generated output: ${outputRelativePath}`);
    process.exit(1);
  }
  if (fs.readFileSync(outputPath, 'utf8') !== rendered) {
    console.error(`FAIL generated output drift: ${outputRelativePath}`);
    console.error(`Run: node ${generatorPath}`);
    process.exit(1);
  }
  console.log(`PASS ${outputRelativePath} matches canonical inputs`);
} else {
  fs.writeFileSync(outputPath, rendered);
  console.log(`PASS derived ${families.length} specification families`);
  console.log(`PASS wrote ${outputRelativePath}`);
}
