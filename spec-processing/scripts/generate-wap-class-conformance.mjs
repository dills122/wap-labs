#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const EXPECTED_PDF_BYTES = 47936;
const EXPECTED_PDF_SHA256 =
  'af578cd57a7e043b693e0b0dd5ef59b27f8e778e481831ec8737337ee8e44f9d';
const EXPECTED_TEXT_BYTES = 35121;
const EXPECTED_TEXT_SHA256 =
  'd0b4cb2e7e1cb1340320845655176233f53b817bf29f93b102db6f49c030d00f';
const SOURCE_URL =
  'https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf';

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const pdfPath = option('--wap-215-pdf');
const textPath = option('--wap-215-text');
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-class-conformance.json';

if (!pdfPath || !textPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-class-conformance.mjs ' +
      '--wap-215-pdf /absolute/path/WAP-215-ClassConform-20001213-a.pdf ' +
      '--wap-215-text /absolute/path/WAP-215-ClassConform-20001213-a.txt ' +
      '--recorded-on YYYY-MM-DD [--output path]'
  );
  process.exit(2);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const pdf = fs.readFileSync(pdfPath);
const text = fs.readFileSync(textPath, 'utf8');
const pdfSha256 = sha256(pdf);
const textBytes = Buffer.byteLength(text);
const textSha256 = sha256(Buffer.from(text));
if (pdf.length !== EXPECTED_PDF_BYTES || pdfSha256 !== EXPECTED_PDF_SHA256) {
  throw new Error(
    `WAP-215 PDF lock mismatch: ${pdf.length} bytes, SHA-256 ${pdfSha256}`
  );
}
if (
  textBytes !== EXPECTED_TEXT_BYTES ||
  textSha256 !== EXPECTED_TEXT_SHA256
) {
  throw new Error(
    `WAP-215 text lock mismatch: ${textBytes} bytes, SHA-256 ${textSha256}`
  );
}

const requiredIdentityMarkers = [
  'WAP-215-ClassConform-20001213-a',
  'Approved Version 13 December 2000',
  '7.2. Client device class conformance requirements',
  '7.3. Server device class conformance requirements',
  'Table 2 - WAP JUNE 2000 CONFORMANCE RELEASE BASELINE CLIENT DEVICE CLASS',
  'Table 3 - WAP JUNE 2000 CONFORMANCE RELEASE BASELINE SERVER DEVICE CLASS'
];
for (const marker of requiredIdentityMarkers) {
  if (!text.includes(marker)) {
    throw new Error(`WAP-215 text is missing identity marker: ${marker}`);
  }
}

const effectiveSpec = JSON.parse(
  fs.readFileSync(
    'spec-processing/source-manifests/wap-1.2.1-effective-spec.json',
    'utf8'
  )
);
const effectiveFamilies = new Set(
  effectiveSpec.families.map((family) => family.family)
);

const familyAliases = new Map([
  ['WAESpec', 'wae'],
  ['WAE', 'wae'],
  ['WML', 'wml'],
  ['WBXML', 'wbxml'],
  ['WMLScript', 'wmlscript'],
  ['WMLS', 'wmlscript'],
  ['WMLScriptLibs', 'wmlscript-libraries'],
  ['WMLScriptlibs', 'wmlscript-libraries'],
  ['WMLScriptSL', 'wmlscript-libraries'],
  ['WMLSSL', 'wmlscript-libraries'],
  ['WAPCachingMod', 'caching'],
  ['UAProf', 'user-agent-profile'],
  ['PPGService', 'push-proxy-gateway'],
  ['PushMessage', 'push-message'],
  ['PushOTA', 'push-over-the-air'],
  ['ServiceInd', 'service-indication'],
  ['ServiceLoad', 'service-loading'],
  ['PAP', 'push-access-protocol'],
  ['CacheOP', 'cache-operation'],
  ['WSP', 'wsp'],
  ['WTP', 'wtp'],
  ['WDP', 'wdp'],
  ['WAPOverGSMUSSD', 'wap-over-gsm-ussd'],
  ['WCMP', 'wcmp'],
  ['WTLS', 'wtls'],
  ['WIM', 'wim'],
  ['WMLScriptCrypto', 'wmlscript-crypto'],
  ['WTA', 'wta'],
  ['WTAI', 'wtai'],
  ['WTAIIS136', 'wtai-is136'],
  ['WTAIGSM', 'wtai-gsm'],
  ['WTAIPDC', 'wtai-pdc']
]);

const sections = [
  {
    role: 'client',
    start: '7.2. Client device class conformance requirements',
    end: '7.3. Server device class conformance requirements',
    rootIdentifier: 'CCR-WAPJ2K-C-001',
    profiles: [
      ['A', 'CCR-CLASSA-C-001', 50],
      ['B', 'CCR-CLASSB-C-001', 15],
      ['C', 'CCR-CLASSC-C-001', 9]
    ]
  },
  {
    role: 'server',
    start: '7.3. Server device class conformance requirements',
    end: 'Appendix A.',
    rootIdentifier: 'CCR-WAPJ2K-S-001',
    profiles: [
      ['A', 'CCR-CLASSA-S-001', 54],
      ['B', 'CCR-CLASSB-S-001', 18],
      ['C', 'CCR-CLASSC-S-001', 10]
    ]
  }
];

function extractSection(section) {
  const start = text.indexOf(section.start);
  const end = text.indexOf(section.end, start + section.start.length);
  if (start === -1 || end === -1) {
    throw new Error(`Unable to isolate WAP-215 ${section.role} table`);
  }
  const sectionText = text.slice(start, end);
  const profileOffsets = section.profiles.map(([, identifier]) =>
    sectionText.lastIndexOf(identifier)
  );
  if (profileOffsets.some((offset) => offset === -1)) {
    throw new Error(`Missing ${section.role} class identifier`);
  }

  return {
    deviceRole: section.role,
    rootIdentifier: section.rootIdentifier,
    rootRequirementType: 'one-of',
    profileIdentifiers: section.profiles.map(([, identifier]) => identifier),
    profiles: section.profiles.map(([deviceClass, identifier, expectedCount], index) => {
      const block = sectionText.slice(
        profileOffsets[index],
        profileOffsets[index + 1] ?? sectionText.length
      );
      const requirements = [
        ...block.matchAll(/\b([A-Za-z][A-Za-z0-9]*):(M|O)(C|S)F\b/g)
      ].map((match) => {
        const sourceAlias = match[1];
        const family = familyAliases.get(sourceAlias);
        if (!family || !effectiveFamilies.has(family)) {
          throw new Error(
            `${identifier}: unresolved source alias ${sourceAlias}`
          );
        }
        return {
          expression: match[0],
          sourceAlias,
          featureGroup: `${match[2]}${match[3]}F`,
          effectiveFamily: family
        };
      });

      if (requirements.length !== expectedCount) {
        throw new Error(
          `${identifier}: expected ${expectedCount} requirements, found ${requirements.length}`
        );
      }

      return {
        identifier,
        deviceClass,
        status: 'optional-alternative-under-root',
        requirements
      };
    })
  };
}

const actors = sections.map(extractSection);
const selectedProfile = actors
  .find((actor) => actor.deviceRole === 'client')
  .profiles.find((profile) => profile.deviceClass === 'C');

const expectedClassC = [
  'WAESpec:MCF',
  'WML:MCF',
  'WBXML:MCF',
  'WMLScript:MCF',
  'WMLScriptLibs:MCF',
  'WAPCachingMod:MCF',
  'WSP:MCF',
  'WDP:MCF',
  'WCMP:MCF'
];
if (
  JSON.stringify(selectedProfile.requirements.map((item) => item.expression)) !==
  JSON.stringify(expectedClassC)
) {
  throw new Error('Class C client dependency expression does not match WAP-215');
}

const ledger = {
  schemaVersion: 1,
  releaseId: 'wap-1.2.1',
  recordedOn,
  authority: {
    documentId: 'WAP-215-ClassConform-20001213-a',
    title: 'Class Conformance Requirements',
    publicationStatus: 'approved',
    approvedOn: '2000-12-13',
    sourceUrl: SOURCE_URL,
    catalogUrl: 'https://www.wapforum.org/what/technical_1_2_1.htm',
    bytes: pdf.length,
    sha256: pdfSha256,
    checksumAlgorithm: 'sha256',
    pageCount: 16,
    textExtraction: {
      bytes: textBytes,
      sha256: textSha256,
      checksumAlgorithm: 'sha256'
    },
    repositoryState: 'metadata-only-pending-redistribution-review',
    sourceSections: ['7.2', '7.3'],
    sourceTables: ['Table 2', 'Table 3']
  },
  selectedTarget: {
    deviceRole: 'client',
    deviceClass: 'C',
    identifier: selectedProfile.identifier,
    description: 'data profile client',
    requirementExpressions: selectedProfile.requirements.map(
      (requirement) => requirement.expression
    ),
    effectiveFamilies: selectedProfile.requirements.map(
      (requirement) => requirement.effectiveFamily
    )
  },
  interpretation: {
    featureGroupNotation:
      'MCF/OCF are mandatory/optional client features; MSF/OSF are mandatory/optional server features.',
    classAlternatives:
      'Each WAP June 2000 client or server profile selects exactly one of Class A, B, or C.',
    wtpClientCondition:
      'WTP is mandatory for a client only when that client supports connection-mode WSP.',
    classCOptionalProfiles:
      'WTLS, WIM, Push, WTA/WTAI, UAProf, and WMLScript Crypto are not required by CCR-CLASSC-C-001 and remain separately declared capabilities.'
  },
  actors,
  summary: {
    actorCount: actors.length,
    profileCount: actors.reduce(
      (count, actor) => count + actor.profiles.length,
      0
    ),
    profileGraphSha256: sha256(Buffer.from(JSON.stringify(actors))),
    selectedRequirementCount: selectedProfile.requirements.length
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`);

console.log('==> WAP 1.2.1 class conformance');
console.log(`PASS WAP-215 lock (${pdf.length} bytes; ${pdfSha256})`);
console.log('PASS extracted 6 Class A/B/C client/server profiles');
console.log('PASS selected CCR-CLASSC-C-001 with 9 effective families');
console.log(`PASS wrote ${outputPath}`);
