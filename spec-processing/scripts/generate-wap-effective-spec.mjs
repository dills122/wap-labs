#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-release.json'
);
const outputPath = path.join(
  root,
  'spec-processing/source-manifests/wap-1.2.1-effective-spec.json'
);

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

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Missing release manifest: ${manifestPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
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

    const approved = documents.filter(
      (document) => document.publicationStatus === 'approved'
    );
    const historical = documents.filter(
      (document) => document.publicationStatus !== 'approved'
    );
    const bases = approved.filter((document) => document.documentRole === 'base');
    const sins = approved.filter((document) => document.documentRole === 'sin');
    const relationships = [];

    for (let i = 1; i < approved.length; i += 1) {
      relationships.push({
        from: approved[i - 1].documentId,
        to: approved[i].documentId,
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
        'Start with each approved base and apply approved SINs in effectiveSequence order. ' +
        'A SIN changes only the identified text unless it explicitly supplies a replacement.',
      effectiveSequence: approved.map((document) => document.documentId),
      baseDocuments: bases.map((document) => document.documentId),
      sinDocuments: sins.map((document) => document.documentId),
      historicalDocuments: historical.map((document) => document.documentId),
      relationships,
      scrExtraction:
        ['wdp', 'wcmp', 'wsp'].includes(family)
          ? {
              status: 'line-item-ledger-complete-class-c-applied',
              governingDocument: 'WAP-221-CREQ-20010425-a',
              governingClassProfileDocument:
                'WAP-215-ClassConform-20001213-a',
              ledger:
                `spec-processing/source-manifests/wap-1.2.1-${family}-scr.json`,
              classProfileLedger:
                'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
              selectedProfile: 'CCR-CLASSC-C-001',
              selectedFeatureGroup:
                ({ wdp: 'WDP:MCF', wcmp: 'WCMP:MCF', wsp: 'WSP:MCF' })[
                  family
                ],
              note:
                'The effective actor-specific SCR is source-extracted with exact dependency expressions. ' +
                'The selected Class C transport path resolves WDP through CDPD-shaped UDP/IPv4, WCMP through the general message structure, and WSP through the connectionless mode; connection-oriented WSP and WTP remain conditional.'
            }
          : family === 'caching'
          ? {
              status: 'line-item-ledger-complete-class-c-applied',
              governingDocument: 'WAP-221-CREQ-20010425-a',
              governingClassProfileDocument:
                'WAP-215-ClassConform-20001213-a',
              ledger:
                'spec-processing/source-manifests/wap-1.2.1-caching-scr.json',
              classProfileLedger:
                'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
              selectedProfile: 'CCR-CLASSC-C-001',
              selectedFeatureGroup: 'WAPCachingMod:MCF',
              note:
                'WAP-120 Appendix A supplies eleven actor-specific caching SCR rows. ' +
                'The selected Class C client applies WAPCachingMod:MCF to the five mandatory user-agent rows; zero-byte cache remains a valid but explicit behavior profile.'
            }
          : family === 'wml'
          ? {
              status: 'line-item-ledger-complete-class-c-applied',
              governingDocument: 'WAP-221-CREQ-20010425-a',
              governingClassProfileDocument:
                'WAP-215-ClassConform-20001213-a',
              ledger:
                'spec-processing/source-manifests/wap-1.2.1-wml-scr.json',
              classProfileLedger:
                'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
              note:
                'All 76 effective WML 1.3 SCR rows are source-extracted and mapped to work items. ' +
                'The mandatory implementation audit records 2 implemented, 23 partial, and 22 missing rows, ' +
                'with direct tests linked to 25 rows. WAP-215 CCR-CLASSC-C-001 selects the 39 mandatory ' +
                'WML user-agent rows for the Class C client profile.'
            }
          : family === 'wae'
            ? {
                status: 'line-item-ledger-complete-class-c-applied',
                governingDocument: 'WAP-221-CREQ-20010425-a',
                governingClassProfileDocument:
                  'WAP-215-ClassConform-20001213-a',
                ledger:
                  'spec-processing/source-manifests/wap-1.2.1-wae-scr.json',
                classProfileLedger:
                  'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
                selectedProfile: 'CCR-CLASSC-C-001',
                selectedFeatureGroup: 'WAESpec:MCF',
                note:
                  'WAP-190_104 section 4.3 supplies the resulting tracked-change SCR table after the approved WAE SIN chain. ' +
                  'The selected Class C client applies WAESpec:MCF to the eleven effective mandatory client rows.'
              }
          : family === 'wbxml'
            ? {
                status: 'line-item-ledger-complete-class-c-applied',
                governingDocument: 'WAP-221-CREQ-20010425-a',
                governingClassProfileDocument:
                  'WAP-215-ClassConform-20001213-a',
                ledger:
                  'spec-processing/source-manifests/wap-1.2.1-wbxml-scr.json',
                classProfileLedger:
                  'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
                selectedProfile: 'CCR-CLASSC-C-001',
                selectedFeatureGroup: 'WBXML:MCF',
                note:
                  'WAP-192_105 corrects the actor-specific WBXML 1.3 SCR and restores omitted WAP-192.101 changes. ' +
                  'The selected Class C client applies WBXML:MCF to the three effective mandatory client rows.'
              }
            : family === 'wmlscript'
              ? {
                  status: 'line-item-ledger-complete-class-c-applied',
                  governingDocument: 'WAP-221-CREQ-20010425-a',
                  governingClassProfileDocument:
                    'WAP-215-ClassConform-20001213-a',
                  ledger:
                    'spec-processing/source-manifests/wap-1.2.1-wmlscript-scr.json',
                  classProfileLedger:
                    'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
                  selectedProfile: 'CCR-CLASSC-C-001',
                  selectedFeatureGroup: 'WMLScript:MCF',
                  note:
                    'WAP-193_101 supplies the consolidated actor-specific 112-row WMLScript SCR. ' +
                    'The selected Class C client applies WMLScript:MCF to the 41 effective mandatory interpreter rows.'
                }
              : family === 'wmlscript-libraries'
                ? {
                    status: 'line-item-ledger-complete-class-c-applied',
                    governingDocument: 'WAP-221-CREQ-20010425-a',
                    governingClassProfileDocument:
                      'WAP-215-ClassConform-20001213-a',
                    ledger:
                      'spec-processing/source-manifests/wap-1.2.1-wmlscript-libraries-scr.json',
                    classProfileLedger:
                      'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
                    selectedProfile: 'CCR-CLASSC-C-001',
                    selectedFeatureGroup: 'WMLScriptLibs:MCF',
                    note:
                      'WAP-194 supplies 94 SCR rows and WAP-194_103 adds optional immediate-refresh row WMLSSL-C-095. ' +
                      'The selected Class C client applies WMLScriptLibs:MCF to the 80 effective mandatory interpreter rows.'
                  }
                : {
                    status: 'pending-line-item-ledger',
                    governingDocument: 'WAP-221-CREQ-20010425-a',
                    note:
                      'SCR tables and SIN changes require line-item extraction; this graph establishes ' +
                      'source precedence only.'
                  },
      successorEvidence: (successorEvidence.get(family) ?? []).map(
        (documentId) => ({
          documentId,
          role: 'delta-evidence-only',
          deltaStatus:
            [
              'WAP-236-WAESpec-20020207-a',
              'WAP-238-WML-20010911-a',
              'WAP-259-WDP-20010614-a',
              'WAP-230-WSP-20010705-a'
            ].includes(documentId)
              ? 'selected-profile-delta-complete'
              : family === 'wae' &&
                  documentId === 'WAP-237-WAEMT-20010515-a'
                ? 'optional-media-delta-pending'
                : 'pending'
        })
      ),
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
  schemaVersion: 1,
  releaseId: manifest.release.id,
  generatedFrom: 'spec-processing/source-manifests/wap-1.2.1-release.json',
  governingConformanceDocument: 'WAP-221-CREQ-20010425-a',
  governingClassProfileDocument: 'WAP-215-ClassConform-20001213-a',
  classProfileLedger:
    'spec-processing/source-manifests/wap-1.2.1-class-conformance.json',
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
    byTargetDisposition: Object.fromEntries(
      Object.entries(dispositionCounts).sort()
    )
  },
  families
};

fs.writeFileSync(outputPath, `${JSON.stringify(graph, null, 2)}\n`);
console.log('==> WAP 1.2.1 effective-spec graph');
console.log(`PASS derived ${families.length} specification families`);
console.log(`PASS wrote ${path.relative(root, outputPath)}`);
