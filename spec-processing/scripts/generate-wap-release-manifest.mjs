#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const ARCHIVE_URL =
  'https://www.openmobilealliance.org/tech/affiliates/wap/Technical_June2000-20021106%5B1%5D.zip';
const CATALOG_URL =
  'https://www.openmobilealliance.org/specifications/affiliates/wap-forum/';
const TERMS_URL =
  'https://www.openmobilealliance.org/about/policies/use-agreement/';
const MEMBER_BASE_URL =
  'https://www.openmobilealliance.org/tech/affiliates/wap/';

const families = new Map([
  [100, ['architecture', 'Wireless Application Protocol Architecture', 'dependency']],
  [120, ['caching', 'WAP Caching Model', 'dependency']],
  [145, ['push-message', 'Push Message', 'profile-optional']],
  [151, ['push-proxy-gateway', 'Push Proxy Gateway Service', 'profile-optional']],
  [159, ['wdp-wcmp-adaptation', 'WDP/WCMP Wireless Data Gateway Adaptation', 'dependency']],
  [161, ['wmlscript-crypto', 'WMLScript Crypto API Library', 'profile-optional']],
  [164, ['push-access-protocol', 'Push Access Protocol', 'profile-optional']],
  [165, ['push-architecture', 'Push Architecture Overview', 'profile-optional']],
  [167, ['service-indication', 'Service Indication', 'profile-optional']],
  [168, ['service-loading', 'Service Loading', 'profile-optional']],
  [169, ['wta', 'Wireless Telephony Application', 'profile-optional']],
  [170, ['wtai', 'Wireless Telephony Application Interface', 'profile-optional']],
  [171, ['wtai-gsm', 'WTAI GSM Addendum', 'profile-optional']],
  [172, ['wtai-is136', 'WTAI IS-136 Addendum', 'profile-optional']],
  [173, ['wtai-pdc', 'WTAI PDC Addendum', 'profile-optional']],
  [174, ['user-agent-profile', 'User Agent Profile', 'profile-optional']],
  [175, ['cache-operation', 'Cache Operation', 'profile-optional']],
  [188, ['general-formats', 'WAP General Formats', 'dependency']],
  [189, ['push-over-the-air', 'Push OTA Protocol', 'profile-optional']],
  [190, ['wae', 'Wireless Application Environment', 'core-mandatory']],
  [191, ['wml', 'Wireless Markup Language 1.3', 'core-mandatory']],
  [192, ['wbxml', 'Binary XML Content Format', 'core-mandatory']],
  [193, ['wmlscript', 'WMLScript Language', 'core-mandatory']],
  [194, ['wmlscript-libraries', 'WMLScript Standard Libraries', 'core-mandatory']],
  [195, ['wae-overview', 'Wireless Application Environment Overview', 'dependency']],
  [198, ['wim', 'Wireless Identity Module', 'profile-optional']],
  [199, ['wtls', 'Wireless Transport Layer Security', 'core-optional']],
  [200, ['wdp', 'Wireless Datagram Protocol', 'core-mandatory']],
  [201, ['wtp', 'Wireless Transaction Protocol', 'core-mandatory']],
  [202, ['wcmp', 'Wireless Control Message Protocol', 'core-optional']],
  [203, ['wsp', 'Wireless Session Protocol', 'core-mandatory']],
  [204, ['wap-over-gsm-ussd', 'WAP over GSM USSD', 'profile-optional']],
  [213, ['interoperability-pictograms', 'WAP Interoperability Pictograms', 'historical']],
  [227, ['persistent-storage', 'Persistent Storage Interface', 'historical']],
  [231, ['external-functionality-interface', 'External Functionality Interface', 'profile-optional']]
]);

function usage() {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-release-manifest.mjs ' +
      '--archive <zip> --retrieved-on <YYYY-MM-DD> [--output <json>]'
  );
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i];
    if (!argument.startsWith('--') || i + 1 >= argv.length) {
      usage();
      process.exit(2);
    }
    parsed[argument.slice(2)] = argv[i + 1];
    i += 1;
  }
  return parsed;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function formatDate(compactDate) {
  return `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`;
}

function increment(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function classify(filename) {
  const numberMatch = filename.match(/(?:^|-)WAP-(\d+)/i);
  if (!numberMatch) {
    throw new Error(`Unable to parse WAP document number: ${filename}`);
  }

  const specificationNumber = Number.parseInt(numberMatch[1], 10);
  const family = families.get(specificationNumber);
  if (!family) {
    throw new Error(`No release classification for WAP-${specificationNumber}: ${filename}`);
  }

  const statusCode = filename.match(/-([apc])\.pdf$/i)?.[1].toLowerCase();
  const publicationStatus = {
    a: 'approved',
    p: 'proposed',
    c: 'candidate'
  }[statusCode];
  if (!publicationStatus) {
    throw new Error(`Unable to parse publication status: ${filename}`);
  }

  const revisionMatch = filename.match(/WAP-\d+_(\d+)/i);
  const explicitSin = /-SIN-/i.test(filename);
  const dateMatch = filename.match(/-?(\d{8})-[apc]\.pdf$/i);
  if (!dateMatch) {
    throw new Error(`Unable to parse publication date: ${filename}`);
  }

  let sourceClass = family[2];
  if (publicationStatus !== 'approved') {
    sourceClass = 'historical';
  }

  return {
    documentId: filename.replace(/-?\d{8}-[apc]\.pdf$/i, ''),
    specificationNumber,
    revision: revisionMatch?.[1] ?? null,
    documentRole: revisionMatch || explicitSin ? 'sin' : 'base',
    publicationStatus,
    publishedOn: formatDate(dateMatch[1]),
    family: family[0],
    title: family[1],
    sourceClass,
    ingestionPriority:
      sourceClass === 'core-mandatory' || sourceClass === 'dependency'
        ? 1
        : sourceClass === 'core-optional'
          ? 2
          : 3
  };
}

const args = parseArgs(process.argv.slice(2));
if (!args.archive || !args['retrieved-on']) {
  usage();
  process.exit(2);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(args['retrieved-on'])) {
  throw new Error('--retrieved-on must use YYYY-MM-DD');
}

const root = process.cwd();
const archivePath = path.resolve(args.archive);
const outputPath = path.resolve(
  args.output ?? 'spec-processing/source-manifests/wap-1.2.1-release.json'
);
const sourceDir = path.join(root, 'spec-processing/source-material');

if (!fs.existsSync(archivePath)) {
  throw new Error(`Archive not found: ${archivePath}`);
}
if (!fs.existsSync(sourceDir)) {
  throw new Error(`Run from the repository root; source directory not found: ${sourceDir}`);
}

execFileSync('unzip', ['-tq', archivePath], { stdio: 'pipe' });

const memberNames = execFileSync('unzip', ['-Z1', archivePath], {
  encoding: 'utf8'
})
  .split(/\r?\n/)
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right));

const localNames = fs
  .readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
  .map((entry) => entry.name);
const localByLowerName = new Map(localNames.map((name) => [name.toLowerCase(), name]));

const classCounts = {};
const localStateCounts = {};
const members = memberNames.map((filename) => {
  const content = execFileSync('unzip', ['-p', archivePath, filename], {
    maxBuffer: 32 * 1024 * 1024
  });
  const memberSha256 = sha256(content);
  const localFilename = localByLowerName.get(filename.toLowerCase()) ?? null;
  let localState = 'missing';
  let localSha256 = null;

  if (localFilename) {
    localSha256 = sha256(fs.readFileSync(path.join(sourceDir, localFilename)));
    localState =
      localSha256 === memberSha256 ? 'canonical-exact' : 'canonical-content-differs';
  }

  const classification = classify(filename);
  increment(classCounts, classification.sourceClass);
  increment(localStateCounts, localState);

  return {
    ...classification,
    filename,
    authority: 'WAP Forum',
    archiveMemberPath: filename,
    individualSourceUrl: `${MEMBER_BASE_URL}${encodeURIComponent(filename)}`,
    bytes: content.length,
    sha256: memberSha256,
    checksumAlgorithm: 'sha256',
    classificationBasis: 'release-family-planning-v1',
    classificationReview: 'preliminary',
    redistributionStatus: 'review-required',
    local: {
      state: localState,
      path: localFilename
        ? `spec-processing/source-material/${localFilename}`
        : null,
      sha256: localSha256
    }
  };
});

const archiveBuffer = fs.readFileSync(archivePath);
const manifest = {
  schemaVersion: 1,
  release: {
    id: 'wap-1.2.1',
    title: 'WAP 1.2.1 Specification Suite',
    releaseLabel: 'WAP 1.2.1 (June 2000)',
    authority: 'WAP Forum / Open Mobile Alliance',
    catalogUrl: CATALOG_URL,
    legacyReleaseCatalogUrl:
      'https://www.wapforum.org/what/technical_1_2_1.htm',
    archiveUrl: ARCHIVE_URL,
    archiveOriginalFilename: 'Technical_June2000-20021106[1].zip',
    archivePublishedSnapshot: '2002-11-06',
    retrievedOn: args['retrieved-on'],
    archiveBytes: archiveBuffer.length,
    archiveSha256: sha256(archiveBuffer),
    archiveChecksumAlgorithm: 'sha256',
    archiveIntegrity: 'unzip-test-passed',
    memberCount: members.length
  },
  targetPolicy: {
    compatibilityFloor: 'WAP 1.2.1 with WML 1.3',
    classificationStatus: 'preliminary-planning-classification',
    classificationRule:
      'The source class describes project planning scope, not an extracted WAP conformance verdict. ' +
      'SCR/CCR and effective-spec analysis may refine it.',
    strictBehavior:
      'Core observable mechanics must remain historically compliant. Enhancements must be ' +
      'behavior-preserving or explicitly separated from strict mode.'
  },
  redistribution: {
    termsUrl: TERMS_URL,
    status: 'review-required',
    repositoryPolicy: 'metadata-only',
    archiveCommitted: false,
    newlyRecoveredMembersCommitted: false,
    note:
      'Keep recovered binaries and parsed derivatives outside Git until public-repository ' +
      'redistribution is explicitly approved.'
  },
  associatedAssets: [
    {
      id: 'channel-1.2-dtd',
      title: 'Channel 1.2 Document Type Definition',
      sourceUrl: 'https://www.openmobilealliance.org/tech/dtd/channel12.dtd',
      relationship: 'associated-with-release',
      targetDisposition: 'not-required-by-selected-class-c',
      retrievedOn: args['retrieved-on'],
      retrievalState: 'verified-temporary',
      bytes: 892,
      sha256: '00baa80d3be6a4558b3115ebb1d6b3a58eea9cfb6bba0fd1f4ad73b993cfc31d',
      checksumAlgorithm: 'sha256',
      redistributionStatus: 'review-required'
    },
    {
      id: 'wml13-dtd',
      title: 'WML 1.3 Document Type Definition',
      sourceUrl: 'https://www.openmobilealliance.org/tech/dtd/wml13.dtd',
      relationship: 'associated-with-release',
      targetDisposition: 'strict-baseline',
      retrievedOn: args['retrieved-on'],
      retrievalState: 'verified-temporary',
      bytes: 9015,
      sha256: '764fe546974f15b40c1e49a0f3e954219e78f518c53a6d7d3956cab62be72dfb',
      checksumAlgorithm: 'sha256',
      redistributionStatus: 'review-required'
    },
    {
      id: 'pap-1.0-dtd',
      title: 'Push Access Protocol 1.0 Document Type Definition',
      sourceUrl: 'https://www.openmobilealliance.org/tech/dtd/pap_1.0.dtd',
      relationship: 'associated-with-release',
      targetDisposition: 'optional-push-profile',
      retrievedOn: args['retrieved-on'],
      retrievalState: 'verified-temporary',
      bytes: 8080,
      sha256: 'bfcec60e17f07ed87b772004dfe784cda2bd88aaf8f211c4eafc68b1cb7a319a',
      checksumAlgorithm: 'sha256',
      redistributionStatus: 'review-required'
    },
    {
      id: 'service-indication-dtd',
      title: 'Service Indication Document Type Definition',
      sourceUrl: 'https://www.openmobilealliance.org/tech/dtd/si.dtd',
      relationship: 'associated-with-release',
      targetDisposition: 'optional-push-profile',
      retrievedOn: args['retrieved-on'],
      retrievalState: 'verified-temporary',
      bytes: 1676,
      sha256: 'f71e1c657b501a49ba98dde685d29fe2c88107031f01e7d14781a36a669cf50b',
      checksumAlgorithm: 'sha256',
      redistributionStatus: 'review-required'
    },
    {
      id: 'service-loading-dtd',
      title: 'Service Loading Document Type Definition',
      sourceUrl: 'https://www.openmobilealliance.org/tech/dtd/sl.dtd',
      relationship: 'associated-with-release',
      targetDisposition: 'optional-push-profile',
      retrievedOn: args['retrieved-on'],
      retrievalState: 'verified-temporary',
      bytes: 1025,
      sha256: '8393b66f4f9c30163613b553b765504d3f92dadd1eaca9775265b33d15c4f972',
      checksumAlgorithm: 'sha256',
      redistributionStatus: 'review-required'
    },
    {
      id: 'wta-wml-1.2-dtd',
      title: 'WTA-WML 1.2 Document Type Definition',
      sourceUrl: 'https://www.openmobilealliance.org/tech/dtd/wta-wml12.dtd',
      relationship: 'associated-with-release',
      targetDisposition: 'optional-wta-profile',
      retrievedOn: args['retrieved-on'],
      retrievalState: 'verified-temporary',
      bytes: 539,
      sha256: 'dccd67a26526098adfae881a7826a21be34d69bd66cccd005a265e71a292a84c',
      checksumAlgorithm: 'sha256',
      redistributionStatus: 'review-required'
    }
  ],
  governingDependencies: [
    {
      documentId: 'WAP-215-ClassConform-20001213-a',
      title: 'WAP June 2000 Class Conformance Requirements',
      sourceUrl:
        'https://www.wapforum.org/tech/documents/WAP-215-ClassConform-20001213-a.pdf',
      catalogUrl: 'https://www.wapforum.org/what/technical_1_2_1.htm',
      technicalFaqUrl: 'https://www.wapforum.org/faqs/technicalfaq.htm',
      originalDownloadRoute:
        'http://www1.wapforum.org/tech/terms.asp?doc=WAP-215-ClassConform-20001213-a.pdf',
      relationship: 'release-class-conformance-requirements',
      publicationStatus: 'approved',
      publishedOn: '2000-12-13',
      retrievedOn: '2026-07-24',
      retrievalState: 'verified-temporary',
      bytes: 47936,
      sha256: 'af578cd57a7e043b693e0b0dd5ef59b27f8e778e481831ec8737337ee8e44f9d',
      checksumAlgorithm: 'sha256',
      pageCount: 16,
      mediaType: 'application/pdf',
      provenanceGrade: 'A',
      cacheRef:
        'private-research-cache/wap-1.2.1/governing/WAP-215-ClassConform-20001213-a.pdf',
      textExtraction: {
        cacheRef:
          'private-research-cache/wap-1.2.1/governing/WAP-215-ClassConform-20001213-a.txt',
        bytes: 35121,
        sha256: 'd0b4cb2e7e1cb1340320845655176233f53b817bf29f93b102db6f49c030d00f',
        checksumAlgorithm: 'sha256'
      },
      localState: 'missing',
      redistributionStatus: 'review-required',
      recoveryReviewedOn: '2026-07-24',
      recoveryStatus:
        'Recovered from the live original WAP Forum domain and independently verified by byte size, SHA-256, PDF metadata, page count, document identity, and table extraction.',
      note:
        'The catalog-visible filename omits one zero, but its legacy doc parameter, the ' +
        'technical FAQ, the live payload, and the document identity all use 20001213. ' +
        'The binary and parsed text remain outside Git pending redistribution approval.'
    },
    {
      documentId: 'WAP-221-CREQ-20010425-a',
      title: 'Specification of WAP Conformance Requirements',
      sourceUrl:
        'https://www.openmobilealliance.org/tech/affiliates/wap/WAP-221-CREQ-20010425-a.pdf',
      relationship: 'applies-to-conformance-releases-after-wap-1.1',
      retrievedOn: args['retrieved-on'],
      retrievalState: 'verified-temporary',
      bytes: 38934,
      sha256: 'd8713c9148db06d03365c361350eac8282f6b2f5ea6314ac80d728d57b8ac905',
      checksumAlgorithm: 'sha256',
      localState: 'missing',
      redistributionStatus: 'review-required'
    },
    {
      documentId: 'WAP-273-CertPolicy-20010831-a',
      title: 'WAP Conformance Process and Certification Policy',
      sourceUrl:
        'https://www.openmobilealliance.org/tech/affiliates/wap/WAP-273-CertPolicy-20010831-a.pdf',
      relationship: 'applies-to-conformance-releases-after-wap-1.1',
      retrievedOn: args['retrieved-on'],
      retrievalState: 'verified-temporary',
      bytes: 110965,
      sha256: '61b220887a860b57268dd122075dcaec5435e8fe5d0816a9c4e815b54d342e92',
      checksumAlgorithm: 'sha256',
      localState: 'missing',
      redistributionStatus: 'review-required'
    }
  ],
  historicalConformanceEvidence: [
    {
      documentId: 'PROTO-ClassConform-19990701',
      title: 'WAP Class Conformance Requirements',
      publicationStatus: 'prototype',
      baseline: 'WAP 1.1',
      publishedOn: '1999-07-01',
      sourceUrl:
        'https://web.archive.org/web/20000309180049id_/http://www.wapforum.org/what/technical/PROTO-ClassConform-19990701.pdf',
      relationship: 'non-normative-class-profile-lineage',
      retrievedOn: '2026-07-24',
      retrievalState: 'verified-temporary',
      bytes: 31825,
      sha256: '8404b0686177616233755ce55cc4859efa8ae66cd6cd414ea2d809794eb478ad',
      checksumAlgorithm: 'sha256',
      localState: 'missing',
      redistributionStatus: 'review-required',
      note:
        'Useful for the class-profile mechanism only; it cannot replace approved WAP-215.'
    }
  ],
  summary: {
    memberCount: members.length,
    bySourceClass: Object.fromEntries(Object.entries(classCounts).sort()),
    byLocalState: Object.fromEntries(Object.entries(localStateCounts).sort())
  },
  members
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`==> WAP 1.2.1 release manifest`);
console.log(`PASS archive integrity (${members.length} members)`);
console.log(
  `PASS local coverage (${localStateCounts['canonical-exact'] ?? 0} exact; ` +
    `${localStateCounts.missing ?? 0} missing; ` +
    `${localStateCounts['canonical-content-differs'] ?? 0} different)`
);
console.log(`PASS wrote ${path.relative(root, outputPath)}`);
