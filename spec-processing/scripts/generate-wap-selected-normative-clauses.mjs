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

const wmlTextPath = option('--wml-text');
const wbxmlTextPath = option('--wbxml-text');
const wbxmlSinTextPath = option('--wbxml-sin-text');
const waeTextPath = option('--wae-text');
const waeSin101TextPath = option('--wae-sin-101-text');
const waeSin103TextPath = option('--wae-sin-103-text');
const cachingTextPath = option('--caching-text');
const wcmpTextPath = option('--wcmp-text');
const wspTextPath = option('--wsp-text');
const wspSin001TextPath = option('--wsp-sin-001-text');
const wdpTextPath = option('--wdp-text');
const wmlscriptTextPath = option('--wmlscript-text');
const wmlscriptLibrariesTextPath = option('--wmlscript-libraries-text');
const rfc768TextPath = option('--rfc-768-text');
const rfc791TextPath = option('--rfc-791-text');
const rfc2396TextPath = option('--rfc-2396-text');
const rfc2616TextPath = option('--rfc-2616-text');
const rfc2617TextPath = option('--rfc-2617-text');
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json';

if (
  !wmlTextPath ||
  !wbxmlTextPath ||
  !wbxmlSinTextPath ||
  !waeTextPath ||
  !waeSin101TextPath ||
  !waeSin103TextPath ||
  !cachingTextPath ||
  !wcmpTextPath ||
  !wspTextPath ||
  !wspSin001TextPath ||
  !wdpTextPath ||
  !wmlscriptTextPath ||
  !wmlscriptLibrariesTextPath ||
  !rfc768TextPath ||
  !rfc791TextPath ||
  !rfc2396TextPath ||
  !rfc2616TextPath ||
  !rfc2617TextPath ||
  !recordedOn
) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-selected-normative-clauses.mjs ' +
      '--wml-text /absolute/path/WAP-191_104-WML-20010718-a.txt ' +
      '--wbxml-text /absolute/path/WAP-192-WBXML-20010725-a.txt ' +
      '--wbxml-sin-text /absolute/path/WAP-192_105-WBXML-20011015-a.txt ' +
      '--wae-text /absolute/path/WAP-190-WAESpec-20000329-a.txt ' +
      '--wae-sin-101-text /absolute/path/WAP-190_101-WAESpec-20001213-a.txt ' +
      '--wae-sin-103-text /absolute/path/WAP-190_103-WAESpec-20001213-a.txt ' +
      '--caching-text /absolute/path/WAP-120-WAPCachingMod-20010413-a.txt ' +
      '--wcmp-text /absolute/path/WAP-202-WCMP-20010624-a.txt ' +
      '--wsp-text /absolute/path/WAP-203-WSP-20000504-a.txt ' +
      '--wsp-sin-001-text /absolute/path/WAP-203_001-WSP-20000620-a.txt ' +
      '--wdp-text /absolute/path/WAP-200-WDP-20000219-a.txt ' +
      '--wmlscript-text /absolute/path/WAP-193_101-WMLScript-20010928-a.txt ' +
      '--wmlscript-libraries-text /absolute/path/WAP-194-WMLScriptLibraries-20000925-a.txt ' +
      '--rfc-768-text /absolute/path/rfc768.txt ' +
      '--rfc-791-text /absolute/path/rfc791.txt ' +
      '--rfc-2396-text /absolute/path/rfc2396.txt ' +
      '--rfc-2616-text /absolute/path/rfc2616.txt ' +
      '--rfc-2617-text /absolute/path/rfc2617.txt ' +
      '--recorded-on YYYY-MM-DD [--output path]'
  );
  process.exit(2);
}

const manifestDirectory = 'spec-processing/source-manifests';
const release = readJson(`${manifestDirectory}/wap-1.2.1-release.json`);
const ingestion = readJson(
  `${manifestDirectory}/wap-1.2.1-ingestion-status.json`
);
const externalIngestion = readJson(
  `${manifestDirectory}/wap-1.2.1-external-ingestion-status.json`
);
const effectiveSpec = readJson(
  `${manifestDirectory}/wap-1.2.1-effective-spec.json`
);
const classConformance = readJson(
  `${manifestDirectory}/wap-1.2.1-class-conformance.json`
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeSectionText(value) {
  return value
    .replace(/\f/g, '\n')
    .replace(
      /^WAP-\d+.*Page \d+.*$|^\s*.*$|^\s*All rights reserved\s*$/gm,
      ''
    )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const sourceInputs = new Map([
  [
    'WAP-191_104-WML',
    {
      path: wmlTextPath,
      text: fs.readFileSync(wmlTextPath, 'utf8')
    }
  ],
  [
    'WAP-192-WBXML',
    {
      path: wbxmlTextPath,
      text: fs.readFileSync(wbxmlTextPath, 'utf8')
    }
  ],
  [
    'WAP-192_105-WBXML',
    {
      path: wbxmlSinTextPath,
      text: fs.readFileSync(wbxmlSinTextPath, 'utf8')
    }
  ],
  [
    'WAP-190-WAESpec',
    {
      path: waeTextPath,
      text: fs.readFileSync(waeTextPath, 'utf8')
    }
  ],
  [
    'WAP-190_101-WAESpec',
    {
      path: waeSin101TextPath,
      text: fs.readFileSync(waeSin101TextPath, 'utf8')
    }
  ],
  [
    'WAP-190_103-WAESpec',
    {
      path: waeSin103TextPath,
      text: fs.readFileSync(waeSin103TextPath, 'utf8')
    }
  ],
  [
    'WAP-120-WAPCachingMod',
    {
      path: cachingTextPath,
      text: fs.readFileSync(cachingTextPath, 'utf8')
    }
  ],
  [
    'WAP-202-WCMP',
    {
      path: wcmpTextPath,
      text: fs.readFileSync(wcmpTextPath, 'utf8')
    }
  ],
  [
    'WAP-203-WSP',
    {
      path: wspTextPath,
      text: fs.readFileSync(wspTextPath, 'utf8')
    }
  ],
  [
    'WAP-203_001-WSP',
    {
      path: wspSin001TextPath,
      text: fs.readFileSync(wspSin001TextPath, 'utf8')
    }
  ],
  [
    'WAP-200-WDP',
    {
      path: wdpTextPath,
      text: fs.readFileSync(wdpTextPath, 'utf8')
    }
  ],
  [
    'WAP-193_101-WMLScript',
    {
      path: wmlscriptTextPath,
      text: fs.readFileSync(wmlscriptTextPath, 'utf8')
    }
  ],
  [
    'WAP-194-WMLScriptLibraries',
    {
      path: wmlscriptLibrariesTextPath,
      text: fs.readFileSync(wmlscriptLibrariesTextPath, 'utf8')
    }
  ],
  [
    'rfc-768',
    {
      path: rfc768TextPath,
      text: fs.readFileSync(rfc768TextPath, 'utf8'),
      externalDependencyId: 'rfc-768'
    }
  ],
  [
    'rfc-791',
    {
      path: rfc791TextPath,
      text: fs.readFileSync(rfc791TextPath, 'utf8'),
      externalDependencyId: 'rfc-791'
    }
  ],
  [
    'rfc-2396',
    {
      path: rfc2396TextPath,
      text: fs.readFileSync(rfc2396TextPath, 'utf8'),
      externalDependencyId: 'rfc-2396'
    }
  ],
  [
    'rfc-2616',
    {
      path: rfc2616TextPath,
      text: fs.readFileSync(rfc2616TextPath, 'utf8'),
      externalDependencyId: 'rfc-2616'
    }
  ],
  [
    'rfc-2617',
    {
      path: rfc2617TextPath,
      text: fs.readFileSync(rfc2617TextPath, 'utf8'),
      externalDependencyId: 'rfc-2617'
    }
  ]
]);
const ingestionById = new Map(
  ingestion.members.map((member) => [member.documentId, member])
);
const releaseById = new Map(
  release.members.map((member) => [member.documentId, member])
);
const externalIngestionById = new Map(
  externalIngestion.dependencies.map((dependency) => [
    dependency.dependencyId,
    dependency
  ])
);

for (const [documentId, source] of sourceInputs) {
  const externalArtifact = source.externalDependencyId
    ? externalIngestionById
        .get(source.externalDependencyId)
        ?.artifacts.find((artifact) => artifact.mediaType === 'text/plain')
    : undefined;
  const expectedTextHash = source.externalDependencyId
    ? externalArtifact?.sha256
    : ingestionById.get(documentId)?.parsedText?.sha256;
  const actualTextHash = sha256(source.text);
  if (!expectedTextHash || actualTextHash !== expectedTextHash) {
    throw new Error(
      `${documentId}: source-text SHA-256 ${actualTextHash} does not match ingestion lock ${expectedTextHash}`
    );
  }
  source.textSha256 = actualTextHash;
  source.externalArtifact = externalArtifact;
}

if (
  classConformance.selectedTarget?.identifier !== 'CCR-CLASSC-C-001'
) {
  throw new Error('WAP-215 Class C client must remain the selected target');
}

const sectionDefinitions = {
  wml: {
    sourceDocumentId: 'WAP-191_104-WML',
    ranges: {
      '6.1': ['6.1 Reference Processing Model', '6.2 Character Entities'],
      '6.2': ['6.2 Character Entities', '7. WML Syntax'],
      '9.2': ['9.2 History', '9.3 The Postfield Element'],
      '9.3': ['9.3 The Postfield Element', '9.4 The Setvar Element'],
      '9.4': ['9.4 The Setvar Element', '9.5 Tasks'],
      '9.5.1': ['9.5.1 The Go Element', '9.5.2 The Prev Element'],
      '9.5.2': ['9.5.2 The Prev Element', '9.5.3 The Refresh Element'],
      '9.5.3': ['9.5.3 The Refresh Element', '9.5.4 The Noop Element'],
      '9.5.4': ['9.5.4 The Noop Element', '9.6 Card/Deck Task Shadowing'],
      '9.6': ['9.6 Card/Deck Task Shadowing', '9.7 The Do Element'],
      '9.7': ['9.7 The Do Element', '9.8 The Anchor Element'],
      '9.8': ['9.8 The Anchor Element', '9.9 The A Element'],
      '9.9': ['9.9 The A Element', '9.10 Intrinsic Events'],
      '9.10': ['9.10 Intrinsic Events', '9.10.1 The Onevent Element'],
      '9.10.1': [
        '9.10.1 The Onevent Element',
        '9.10.2 Card/Deck Intrinsic Events'
      ],
      '9.10.2': ['9.10.2 Card/Deck Intrinsic Events', '10. The State Model'],
      '10.1': ['10.1 The Browser Context', '10.2 The Newcontext Attribute'],
      '10.2': ['10.2 The Newcontext Attribute', '10.3 Variables'],
      '10.3': ['10.3 Variables', '10.3.1 Variable Substitution'],
      '10.3.1': [
        '10.3.1 Variable Substitution',
        '10.3.2 Parsing the Variable Substitution Syntax'
      ],
      '10.3.2': [
        '10.3.2 Parsing the Variable Substitution Syntax',
        '10.3.3 The Dollar-sign Character'
      ],
      '10.3.3': [
        '10.3.3 The Dollar-sign Character',
        '10.3.4 Setting Variables'
      ],
      '10.3.4': ['10.3.4 Setting Variables', '10.3.5 Validation'],
      '10.3.5': ['10.3.5 Validation', '10.4 Context Restrictions'],
      '10.4': ['10.4 Context Restrictions', '11. The Structure of WML Decks'],
      '11.2': ['11.2 The WML Element', '11.2.1 A WML Example'],
      '11.3': ['11.3 The Head Element', '11.3.1 The Access Element'],
      '11.3.1': ['11.3.1 The Access Element', '11.3.2 The Meta Element'],
      '11.4': ['11.4 The Template Element', '11.5 The Card Element'],
      '11.5': ['11.5 The Card Element', '11.5.1 Card Intrinsic Events'],
      '11.5.1': ['11.5.1 Card Intrinsic Events', '11.5.2 The Card Element'],
      '11.5.2': ['11.5.2 The Card Element', '11.5.2.1 A Card Example'],
      '11.6.2.1': [
        '11.6.2.1 The Select Element',
        '11.6.2.2 The Option Element'
      ],
      '11.6.2.2': [
        '11.6.2.2 The Option Element',
        '11.6.2.3 The Optgroup Element'
      ],
      '11.6.3': ['11.6.3 The Input Element', '11.6.3.1 Input Element Examples'],
      '11.7': ['11.7 The Timer Element', '11.7.1 Timer Example'],
      '11.8.3': ['11.8.3 Paragraphs', '11.8.4 The Br Element'],
      '11.8.4': ['11.8.4 The Br Element', '11.8.5 The Table Element'],
      '11.8.5': ['11.8.5 The Table Element', '11.8.6 The Tr Element'],
      '11.8.6': ['11.8.6 The Tr Element', '11.8.7 The Td Element'],
      '11.8.7': ['11.8.7 The Td Element', '11.8.8 Table Example'],
      '11.9': ['11.9 Images', '12. User Agent Semantics'],
      '12.1': ['12.1 Deck Access Control', '12.2 Low-Memory Behaviour'],
      '12.3': ['12.3 Error Handling', '12.4 Unknown DTD'],
      '12.4': [
        '12.4 Unknown DTD',
        '12.5 Reference Processing Behaviour - Inter-card Navigation'
      ],
      '12.5': [
        '12.5 Reference Processing Behaviour - Inter-card Navigation',
        '12.5.1 The Go Task'
      ],
      '12.5.1': ['12.5.1 The Go Task', '12.5.2 The Prev Task'],
      '12.5.2': ['12.5.2 The Prev Task', '12.5.3 The Noop Task'],
      '12.5.3': ['12.5.3 The Noop Task', '12.5.4 The Refresh Task'],
      '12.5.4': ['12.5.4 The Refresh Task', '12.5.5 Task Execution Failure'],
      '12.5.5': [
        '12.5.5 Task Execution Failure',
        '13. WML Reference Information'
      ]
    }
  },
  wbxml: {
    sourceDocumentId: 'WAP-192-WBXML',
    ranges: {
      '5': ['5. Binary XML Content Structure', '5.1. Multi-byte Integers'],
      '5.1': ['5.1. Multi-byte Integers', '5.2. Character Encoding'],
      '5.2': ['5.2. Character Encoding', '5.3. BNF for Document Structure'],
      '5.3': ['5.3. BNF for Document Structure', '5.4. Version Number'],
      '5.4': ['5.4. Version Number', '5.5. Document Public Identifier'],
      '5.5': ['5.5. Document Public Identifier', '5.6. Charset'],
      '5.6': ['5.6. Charset', '5.7. String Table'],
      '5.7': ['5.7. String Table', '5.8. Token Structure'],
      '5.8': ['5.8. Token Structure', '5.8.1. Parser State Machine'],
      '5.8.1': ['5.8.1. Parser State Machine', '5.8.2. Tag Code Space'],
      '5.8.2': [
        '5.8.2. Tag Code Space',
        '5.8.3. Attribute Code Space (ATTRSTART and ATTRVALUE)'
      ],
      '5.8.3': [
        '5.8.3. Attribute Code Space (ATTRSTART and ATTRVALUE)',
        '5.8.4. Global Tokens'
      ],
      '5.8.4': ['5.8.4. Global Tokens', '5.8.4.1. Strings'],
      '5.8.4.1': ['5.8.4.1. Strings', '5.8.4.2. Global Extension Tokens'],
      '5.8.4.2': [
        '5.8.4.2. Global Extension Tokens',
        '5.8.4.3. Character Entity'
      ],
      '5.8.4.3': [
        '5.8.4.3. Character Entity',
        '5.8.4.4. Processing Instruction'
      ],
      '5.8.4.4': [
        '5.8.4.4. Processing Instruction',
        '5.8.4.5. Literal Tag or Attribute Name'
      ],
      '5.8.4.5': [
        '5.8.4.5. Literal Tag or Attribute Name',
        '5.8.4.6. Opaque Data'
      ],
      '5.8.4.6': [
        '5.8.4.6. Opaque Data',
        '5.8.4.7. Miscellaneous Control Codes'
      ],
      '5.8.4.7.1': [
        '5.8.4.7.1. END Token',
        '5.8.4.7.2. Code Page Switch Token'
      ],
      '5.8.4.7.2': [
        '5.8.4.7.2. Code Page Switch Token',
        '6. Encoding Semantics'
      ],
      '6.3': [
        '6.3. Encoding Default Attribute Values',
        '6.4. Associating XML Documents with WBXML Token Values'
      ],
      '6.4': [
        '6.4. Associating XML Documents with WBXML Token Values',
        '7. Numeric Constants'
      ]
    }
  },
  wae: {
    sourceDocumentId: 'WAP-190-WAESpec',
    ranges: {
      '5.1.2': ['5.1.2 Basic Authentication Scheme', '5.1.3 URL Schemes'],
      '5.1.3': ['5.1.3 URL Schemes', '5.1.4 User Agent Characteristics'],
      '5.1.4': [
        '5.1.4 User Agent Characteristics',
        '5.1.5 Wireless Markup Language'
      ],
      '5.1.5': ['5.1.5 Wireless Markup Language', '5.1.6 WMLScript'],
      '5.1.6': ['5.1.6 WMLScript', '5.1.7 WAE User Agents'],
      '5.1.7.2': ['5.1.7.2 WML User Agent', '5.1.8 WAE Media Types'],
      '5.1.8': ['5.1.8 WAE Media Types', '5.1.8.1 Encoded WML format'],
      '5.1.8.1': [
        '5.1.8.1 Encoded WML format',
        '5.1.8.2 Encoded WMLScript format'
      ],
      '5.1.8.2': [
        '5.1.8.2 Encoded WMLScript format',
        '5.1.8.3 The Electronic Business Card Format (vCard 2.1)'
      ]
    }
  },
  'wae-sin-101': {
    sourceDocumentId: 'WAP-190_101-WAESpec',
    ranges: {
      '3.3': ['3.3 Change Description', null]
    }
  },
  'wae-sin-103': {
    sourceDocumentId: 'WAP-190_103-WAESpec',
    ranges: {
      '3.3': ['3.3 Change Description', null]
    }
  },
  caching: {
    sourceDocumentId: 'WAP-120-WAPCachingMod',
    ranges: {
      '4': ['4. Caching Model', '4.1. WAP User Agent Responsibilities'],
      '4.1': [
        '4.1. WAP User Agent Responsibilities',
        '4.1.1.                Interaction with the User Agent History Mechanism'
      ],
      '4.1.1': [
        '4.1.1.                Interaction with the User Agent History Mechanism',
        '4.1.2.                Intra-Resource Navigation'
      ],
      '4.1.2': [
        '4.1.2.                Intra-Resource Navigation',
        '4.2. WAP Gateway Responsibilities'
      ],
      '6': [
        '6. Security Considerations',
        'Appendix A. Static Conformance Requirements'
      ]
    }
  },
  wcmp: {
    sourceDocumentId: 'WAP-202-WCMP',
    ranges: {
      '5.1': ['5.1. General', '5.2. WCMP Conformance'],
      '5.2': ['5.2. WCMP Conformance', '5.3. WCMP in IP Networks'],
      '5.4': ['5.4. WCMP in Non-IP Networks', '5.4.1. WCMP in GSM SMS'],
      '5.5.1': [
        '5.5.1. General Message Structure',
        '5.5.2. Address Information Formats'
      ],
      '5.5.3.1': [
        '5.5.3.1. Destination Unreachable',
        '5.5.3.2. Parameter Problem'
      ],
      '5.5.3.3': [
        '5.5.3.3. Message Too Big',
        '5.5.3.4. Reassembly Failure'
      ],
      '5.5.3.5': [
        '5.5.3.5. WCMP Echo Request/Reply',
        'Appendix A.               Static Conformance Requirements                                     (Normative)'
      ]
    }
  },
  wsp: {
    sourceDocumentId: 'WAP-203-WSP',
    ranges: {
      '6.4.1': ['6.4.1 Overview', '6.4.2 Service Primitives'],
      '6.4.2.1': ['6.4.2.1 S-Unit-MethodInvoke', '6.4.2.2 S-Unit-MethodResult'],
      '6.4.2.2': ['6.4.2.2 S-Unit-MethodResult', '6.4.2.3 S-Unit-Push'],
      '6.4.3': [
        '6.4.3 Constraints on Using the Service Primitives',
        '6.4.4 Error Handling'
      ],
      '6.4.4': ['6.4.4 Error Handling', '7 WSP Protocol Operations'],
      '7.2': ['7.2 Connectionless WSP', '8 WSP Data Unit Structure and Encoding'],
      '8.1.1': [
        '8.1.1 Primitive Data Types',
        '8.1.2 Variable Length Unsigned Integers'
      ],
      '8.2.1': ['8.2.1 PDU Common Fields', '8.2.2 Session Management Facility'],
      '8.2.3.1': ['8.2.3.1 Get', '8.2.3.2 Post'],
      '8.2.3.2': ['8.2.3.2 Post', '8.2.3.3 Reply'],
      '8.2.3.3': ['8.2.3.3 Reply', '8.2.3.4 Acknowledgement Headers'],
      '8.4.1': ['8.4.1 General', '8.4.1.1 Field name'],
      '8.4.1.1': ['8.4.1.1 Field name', '8.4.1.2 Field values'],
      '8.4.1.2': ['8.4.1.2 Field values', '8.4.1.3 Encoding of list values'],
      '8.4.1.3': ['8.4.1.3 Encoding of list values', '8.4.2 Header syntax'],
      '8.4.2': ['8.4.2 Header syntax', '8.4.3 Textual Header Syntax'],
      '8.4.2.70': [
        '8.4.2.70 Encoding-Version field',
        '8.4.3 Textual Header Syntax'
      ],
      '8.4.3.1': [
        '8.4.3.1 Encoding-Version field',
        '8.4.4 End-to-end and Hop-by-hop Headers'
      ],
      '8.4.4': [
        '8.4.4 End-to-end and Hop-by-hop Headers',
        '8.5 Multipart Data'
      ],
      'appendix-a': [
        'Appendix A Assigned Numbers',
        'Appendix B Header encoding examples'
      ]
    }
  },
  'wsp-sin-001': {
    sourceDocumentId: 'WAP-203_001-WSP',
    ranges: {
      '3.3': ['3.3 Change', null]
    }
  },
  wdp: {
    sourceDocumentId: 'WAP-200-WDP',
    ranges: {
      '5.1': ['5.1 Reference Model', '5.2 General Description of the WDP Protocol'],
      '5.2': ['5.2 General Description of the WDP Protocol', '5.2.1 WDP Management Entity'],
      '5.3': ['5.3 WDP Static Conformance Clause', '5.3.1 WDP Adaptation Layer Segmentation & Re-assembly'],
      '5.4.3': ['5.4.3 WDP over CDPD', '5.4.4 WDP over CDMA'],
      '6.3.1.1': ['6.3.1.1 T-DUnitdata', '6.3.1.2 T-DError'],
      '7.1': ['7.1 Introduction', '7.2 Mapping of WDP for IP'],
      '7.2': ['7.2 Mapping of WDP for IP', '7.3 Mapping of WDP for GSM SMS, ANSI-136 GHOST and'],
      'appendix-b': ['Appendix B: Port Number Definitions', 'Appendix C: Bearer Type Assignments'],
      'appendix-c': ['Appendix C: Bearer Type Assignments', 'Appendix D: Implementation Notes']
    }
  },
  wmlscript: {
    sourceDocumentId: 'WAP-193_101-WMLScript',
    ranges: {
      '6.6.1': ['6.6.1 Standard Libraries', '6.7 Pragmas'],
      '6.8.1': ['6.8.1 General Conversion Rules', '6.8.2 Conversions to String'],
      '6.8.2': ['6.8.2 Conversions to String', '6.8.3 Conversions to Integer'],
      '6.8.3': ['6.8.3 Conversions to Integer', '6.8.4 Conversions to Floating-Point'],
      '6.8.5': ['6.8.5 Conversions to Boolean', '6.8.6 Conversions to Invalid'],
      '6.8.6': ['6.8.6 Conversions to Invalid', '6.8.7 Summary'],
      '6.8.7': ['6.8.7 Summary', '6.9 Operator Data Type Conversion Rules'],
      '6.9': ['6.9 Operator Data Type Conversion Rules', '6.10 Summary of Operators and Conversions'],
      '8': ['8. WMLSCRIPT BYTECODE INTERPRETER', '8.1 Interpreter Architecture'],
      '8.1': ['8.1 Interpreter Architecture', '8.2 Character Set'],
      '8.2': ['8.2 Character Set', '8.3 WMLScript and URLs'],
      '8.3': ['8.3 WMLScript and URLs', '8.3.1 URL Schemes'],
      '8.3.1': ['8.3.1 URL Schemes', '8.3.2 Fragment Anchors'],
      '8.3.2': ['8.3.2 Fragment Anchors', '8.3.3 URL Call Syntax'],
      '8.3.3': ['8.3.3 URL Call Syntax', '8.3.4 URL Calls and Parameter Passing'],
      '8.3.4': ['8.3.4 URL Calls and Parameter Passing', '8.3.5 Character Escaping'],
      '8.3.5': ['8.3.5 Character Escaping', '8.3.6 Relative URLs'],
      '8.3.6': ['8.3.6 Relative URLs', '8.4 Bytecode Semantics'],
      '8.4.1': ['8.4.1 Passing of Function Arguments', '8.4.2 Allocation of Variable Indexes'],
      '8.4.2': ['8.4.2 Allocation of Variable Indexes', '8.4.3 Automatic Function Return Value'],
      '8.4.3': ['8.4.3 Automatic Function Return Value', '8.4.4 Initialisation of Variables'],
      '8.4.4': ['8.4.4 Initialisation of Variables', '8.5 Access Control'],
      '8.5': ['8.5 Access Control', '9. WMLSCRIPT BINARY FORMAT'],
      '9.1.1': ['9.1.1 Used Data Types', '9.1.2 Multi-byte Integer Format'],
      '9.1.2': ['9.1.2 Multi-byte Integer Format', '9.1.3 Character Encoding'],
      '9.1.3': ['9.1.3 Character Encoding', '9.1.4 Notational Conventions'],
      '9.2': ['9.2 WMLScript Bytecode', '9.3 Bytecode Header'],
      '9.3': ['9.3 Bytecode Header', '9.4 Constant Pool'],
      '9.4': ['9.4 Constant Pool', '9.5   Pragma Pool'],
      '9.5': ['9.5   Pragma Pool', '9.6 Function Pool'],
      '9.6': ['9.6 Function Pool', '9.7 Limitations'],
      '10.5.1': ['10.5.1 Control Flow Instructions', '10.5.2 Function Call Instructions'],
      '10.5.2': ['10.5.2 Function Call Instructions', '10.5.3 Variable Access and Manipulation'],
      '10.5.3': ['10.5.3 Variable Access and Manipulation', '10.5.4 Access To Constants'],
      '10.5.4': ['10.5.4 Access To Constants', '10.5.5 Arithmetic Instructions'],
      '10.5.5': ['10.5.5 Arithmetic Instructions', '10.5.6 Bitwise Instructions'],
      '10.5.6': ['10.5.6 Bitwise Instructions', '10.5.7 Comparison Instructions'],
      '10.5.7': ['10.5.7 Comparison Instructions', '10.5.8 Logical Instructions'],
      '10.5.8': ['10.5.8 Logical Instructions', '10.5.9 Stack Instructions'],
      '10.5.9': ['10.5.9 Stack Instructions', '10.5.10 Access to Operand Type'],
      '10.5.10': ['10.5.10 Access to Operand Type', '10.5.11 Function Return Instructions'],
      '10.5.11': ['10.5.11 Function Return Instructions', '10.5.12 Miscellaneous Instructions'],
      '10.5.12': ['10.5.12 Miscellaneous Instructions', '11. BYTECODE VERIFICATION'],
      '11.1': ['11.1 Integrity Check', '11.2 Runtime Validity Checks'],
      '11.2': ['11.2 Runtime Validity Checks', '12. RUN-TIME ERROR DETECTION AND HANDLING'],
      '12.1': ['12.1 Error Detection', '12.2 Error Handling'],
      '12.2': ['12.2 Error Handling', '12.3 Fatal Errors'],
      '12.3': ['12.3 Fatal Errors', '12.4 Non-Fatal Errors'],
      '12.4': ['12.4 Non-Fatal Errors', '12.5 Library Calls and Errors']
    }
  },
  'wmlscript-libraries': {
    sourceDocumentId: 'WAP-194-WMLScriptLibraries',
    ranges: {
      '6': ['6. WMLSCRIPT COMPLIANCE', '6.1 Supported Data Type'],
      '6.1': ['6.1 Supported Data Type', '6.2   Data Type Conversions'],
      '6.2': ['6.2   Data Type Conversions', '6.3   Error Handling'],
      '6.3': ['6.3   Error Handling', '6.4   Support for Integer-Only Devices'],
      '6.4': ['6.4   Support for Integer-Only Devices', '7.      LANG'],
      '7': ['7.      LANG', '7.1     abs'],
      '7.1': ['7.1     abs', '7.2     min'],
      '7.2': ['7.2     min', '7.3   max'],
      '7.3': ['7.3   max', '7.4   parseInt'],
      '7.4': ['7.4   parseInt', '7.5   parseFloat'],
      '7.5': ['7.5   parseFloat', '7.6   isInt'],
      '7.6': ['7.6   isInt', '7.7   isFloat'],
      '7.7': ['7.7   isFloat', '7.8   maxInt'],
      '7.8': ['7.8   maxInt', '7.9   minInt'],
      '7.9': ['7.9   minInt', '7.10 float'],
      '7.10': ['7.10 float', '7.11 exit'],
      '7.11': ['7.11 exit', '7.12 abort'],
      '7.12': ['7.12 abort', '7.13 random'],
      '7.13': ['7.13 random', '7.14 seed'],
      '7.14': ['7.14 seed', '7.15 characterSet'],
      '7.15': ['7.15 characterSet', '8.    FLOAT'],
      '8': ['8.    FLOAT', '8.1   int'],
      '8.1': ['8.1   int', '8.2   floor'],
      '8.2': ['8.2   floor', '8.3   ceil'],
      '8.3': ['8.3   ceil', '8.4   pow'],
      '8.4': ['8.4   pow', '8.5   round'],
      '8.5': ['8.5   round', '8.6   sqrt'],
      '8.6': ['8.6   sqrt', '8.7   maxFloat'],
      '8.7': ['8.7   maxFloat', '8.8   minFloat'],
      '8.8': ['8.8   minFloat', '9. STRING'],
      '9': ['9. STRING', '9.1   length'],
      '9.1': ['9.1   length', '9.2   isEmpty'],
      '9.2': ['9.2   isEmpty', '9.3   charAt'],
      '9.3': ['9.3   charAt', '9.4   subString'],
      '9.4': ['9.4   subString', '9.5   find'],
      '9.5': ['9.5   find', '9.6   replace'],
      '9.6': ['9.6   replace', '9.7   elements'],
      '9.7': ['9.7   elements', '9.8   elementAt'],
      '9.8': ['9.8   elementAt', '9.9   removeAt'],
      '9.9': ['9.9   removeAt', '9.10 replaceAt'],
      '9.10': ['9.10 replaceAt', '9.11 insertAt'],
      '9.11': ['9.11 insertAt', '9.12 squeeze'],
      '9.12': ['9.12 squeeze', '9.13 trim'],
      '9.13': ['9.13 trim', '9.14 compare'],
      '9.14': ['9.14 compare', '9.15 toString'],
      '9.15': ['9.15 toString', '9.16 format'],
      '9.16': ['9.16 format', '10.   URL'],
      '10': ['10.   URL', '10.1 isValid'],
      '10.1': ['10.1 isValid', '10.2 getScheme'],
      '10.2': ['10.2 getScheme', '10.3 getHost'],
      '10.3': ['10.3 getHost', '10.4 getPort'],
      '10.4': ['10.4 getPort', '10.5 getPath'],
      '10.5': ['10.5 getPath', '10.6 getParameters'],
      '10.6': ['10.6 getParameters', '10.7 getQuery'],
      '10.7': ['10.7 getQuery', '10.8 getFragment'],
      '10.8': ['10.8 getFragment', '10.9 getBase'],
      '10.9': ['10.9 getBase', '10.10   getReferer'],
      '10.10': ['10.10   getReferer', '10.11   resolve'],
      '10.11': ['10.11   resolve', '10.12   escapeString'],
      '10.12': ['10.12   escapeString', '10.13   unescapeString'],
      '10.13': ['10.13   unescapeString', '10.14   loadString'],
      '10.14': ['10.14   loadString', '11.   WMLBROWSER'],
      '11': ['11.   WMLBROWSER', '11.1 getVar'],
      '11.1': ['11.1 getVar', '11.2 setVar'],
      '11.2': ['11.2 setVar', '11.3 go'],
      '11.3': ['11.3 go', '11.4 prev'],
      '11.4': ['11.4 prev', '11.5 newContext'],
      '11.5': ['11.5 newContext', '11.6 getCurrentCard'],
      '11.6': ['11.6 getCurrentCard', '11.7 refresh'],
      '11.7': ['11.7 refresh', '12.   DIALOGS'],
      '12': ['12.   DIALOGS', '12.1 prompt'],
      '12.1': ['12.1 prompt', '12.2 confirm'],
      '12.2': ['12.2 confirm', '12.3 alert'],
      '12.3': ['12.3 alert', 'Appendix A. Library Summary'],
      'appendix-a': [
        'Appendix A. Library Summary',
        'Appendix B. Static Conformance Requirements'
      ]
    }
  },
  'rfc-768': {
    sourceDocumentId: 'rfc-768',
    ranges: {
      introduction: ['Introduction', 'Format'],
      format: ['Format', 'Fields'],
      fields: ['Fields', 'User Interface'],
      interface: ['User Interface', 'IP Interface'],
      'ip-interface': ['IP Interface', 'Protocol Application'],
      'protocol-number': ['Protocol Number', 'References']
    }
  },
  'rfc-791': {
    sourceDocumentId: 'rfc-791',
    ranges: {
      '1.4': ['1.4.  Operation', '2.1.  Relation to Other Protocols'],
      '2.3': ['2.3.  Function Description', '2.4.  Gateways'],
      '3.1': ['3.1.  Internet Header Format', '3.2.  Discussion'],
      '3.2': ['3.2.  Discussion', 'APPENDIX A:  Examples & Scenarios']
    }
  },
  'rfc-2396': {
    sourceDocumentId: 'rfc-2396',
    ranges: {
      '3': ['3. URI Syntactic Components', '3.1. Scheme Component'],
      '5.2': [
        '5.2. Resolving Relative References to Absolute Form',
        '6. URI Normalization and Equivalence'
      ]
    }
  },
  'rfc-2616': {
    sourceDocumentId: 'rfc-2616',
    ranges: {
      '3.2.2': ['3.2.2 http URL', '3.2.3 URI Comparison'],
      '3.2.3': ['3.2.3 URI Comparison', '3.3 Date/Time Formats'],
      '13': ['13 Caching in HTTP', '13.1.1 Cache Correctness'],
      '13.1.1': ['13.1.1 Cache Correctness', '13.1.2 Warnings'],
      '13.1.2': ['13.1.2 Warnings', '13.1.3 Cache-control Mechanisms'],
      '13.1.3': [
        '13.1.3 Cache-control Mechanisms',
        '13.1.4 Explicit User Agent Warnings'
      ],
      '13.1.4': [
        '13.1.4 Explicit User Agent Warnings',
        '13.1.5 Exceptions to the Rules and Warnings'
      ],
      '13.1.5': [
        '13.1.5 Exceptions to the Rules and Warnings',
        '13.1.6 Client-controlled Behavior'
      ],
      '13.1.6': ['13.1.6 Client-controlled Behavior', '13.2 Expiration Model'],
      '13.2.1': [
        '13.2.1 Server-Specified Expiration',
        '13.2.2 Heuristic Expiration'
      ],
      '13.2.2': ['13.2.2 Heuristic Expiration', '13.2.3 Age Calculations'],
      '13.2.3': ['13.2.3 Age Calculations', '13.2.4 Expiration Calculations'],
      '13.2.4': [
        '13.2.4 Expiration Calculations',
        '13.2.5 Disambiguating Expiration Values'
      ],
      '13.2.5': [
        '13.2.5 Disambiguating Expiration Values',
        '13.2.6 Disambiguating Multiple Responses'
      ],
      '13.2.6': [
        '13.2.6 Disambiguating Multiple Responses',
        '13.3 Validation Model'
      ],
      '13.3': ['13.3 Validation Model', '13.3.1 Last-Modified Dates'],
      '13.3.1': [
        '13.3.1 Last-Modified Dates',
        '13.3.2 Entity Tag Cache Validators'
      ],
      '13.3.2': [
        '13.3.2 Entity Tag Cache Validators',
        '13.3.3 Weak and Strong Validators'
      ],
      '13.3.3': [
        '13.3.3 Weak and Strong Validators',
        '13.3.4 Rules for When to Use Entity Tags and Last-Modified Dates'
      ],
      '13.3.4': [
        '13.3.4 Rules for When to Use Entity Tags and Last-Modified Dates',
        '13.3.5 Non-validating Conditionals'
      ],
      '13.3.5': [
        '13.3.5 Non-validating Conditionals',
        '13.4 Response Cacheability'
      ],
      '13.4': ['13.4 Response Cacheability', '13.5 Constructing Responses From Caches'],
      '13.5.1': [
        '13.5.1 End-to-end and Hop-by-hop Headers',
        '13.5.2 Non-modifiable Headers'
      ],
      '13.5.2': [
        '13.5.2 Non-modifiable Headers',
        '13.5.3 Combining Headers'
      ],
      '13.5.3': ['13.5.3 Combining Headers', '13.5.4 Combining Byte Ranges'],
      '13.5.4': ['13.5.4 Combining Byte Ranges', '13.6 Caching Negotiated Responses'],
      '13.6': ['13.6 Caching Negotiated Responses', '13.7 Shared and Non-Shared Caches'],
      '13.7': ['13.7 Shared and Non-Shared Caches', '13.8 Errors or Incomplete Response Cache Behavior'],
      '13.8': ['13.8 Errors or Incomplete Response Cache Behavior', '13.9 Side Effects of GET and HEAD'],
      '13.9': ['13.9 Side Effects of GET and HEAD', '13.10 Invalidation After Updates or Deletions'],
      '13.10': ['13.10 Invalidation After Updates or Deletions', '13.11 Write-Through Mandatory'],
      '13.11': ['13.11 Write-Through Mandatory', '13.12 Cache Replacement'],
      '13.12': ['13.12 Cache Replacement', '13.13 History Lists'],
      '13.13': ['13.13 History Lists', '14 Header Field Definitions'],
      '14.1': ['14.1 Accept', '14.2 Accept-Charset'],
      '14.2': ['14.2 Accept-Charset', '14.3 Accept-Encoding'],
      '14.4': ['14.4 Accept-Language', '14.5 Accept-Ranges'],
      '14.9': ['14.9 Cache-Control', '14.10 Connection']
    }
  },
  'rfc-2617': {
    sourceDocumentId: 'rfc-2617',
    ranges: {
      '1.2': ['1.2 Access Authentication Framework', '2 Basic Authentication Scheme'],
      '2': ['2 Basic Authentication Scheme', '3 Digest Access Authentication Scheme'],
      '4.1': [
        '4.1 Authentication of Clients using Basic Authentication',
        '4.2 Authentication of Clients using Digest Authentication'
      ]
    }
  }
};

function extractSection(anchorFamily, section) {
  const definition = sectionDefinitions[anchorFamily];
  const [startHeading, endHeading] = definition?.ranges?.[section] ?? [];
  if (!definition || !startHeading) {
    throw new Error(`${anchorFamily}/${section}: missing section range`);
  }
  const source = sourceInputs.get(definition.sourceDocumentId);
  const start = source.text.indexOf(`\n${startHeading}\n`);
  const end = endHeading
    ? source.text.indexOf(`\n${endHeading}\n`, start + 1)
    : source.text.length;
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `${anchorFamily}/${section}: cannot resolve ${startHeading} -> ${endHeading ?? 'EOF'}`
    );
  }
  const normalized = normalizeSectionText(
    source.text.slice(start + 1, end)
  );
  return {
    documentId: definition.sourceDocumentId,
    section,
    heading: startHeading,
    normalizedTextSha256: sha256(normalized)
  };
}

const sectionAnchors = new Map();
for (const [anchorFamily, definition] of Object.entries(sectionDefinitions)) {
  for (const section of Object.keys(definition.ranges)) {
    sectionAnchors.set(
      `${anchorFamily}:${section}`,
      extractSection(anchorFamily, section)
    );
  }
}

const clauseRows = [];

function clause(
  family,
  key,
  parentRows,
  section,
  normativeForce,
  fixtureKind,
  obligationSynopsis,
  anchorFamily = family
) {
  clauseRows.push({
    id: `${family.toUpperCase()}-CL-${key.toUpperCase().replaceAll('_', '-')}`,
    family,
    parentRows,
    sourceAnchor: sectionAnchors.get(`${anchorFamily}:${section}`),
    normativeForce,
    obligationLevel:
      normativeForce === 'explicit-should'
        ? 'recommended'
        : normativeForce === 'explicit-may'
          ? 'permitted'
          : 'required',
    obligationSynopsis,
    fixturePlan: {
      id: `${family.toUpperCase()}-FX-${key.toUpperCase().replaceAll('_', '-')}`,
      kind: fixtureKind,
      status: 'planned',
      assertion: obligationSynopsis
    }
  });
}

// WML 1.3 selected Class C user-agent clauses. Synopses are project-authored;
// source prose remains in the verified private extraction cache.
clause('wml', 'reference_encoding_detection', ['WML-C-05'], '6.1', 'implicit-must', 'parser', 'Determine textual WML character encoding using XML rules; do not use in-document meta fields as the encoding authority.');
clause('wml', 'reference_transcoding_loss', ['WML-C-05'], '6.1', 'explicit-must', 'transport-boundary', 'Avoid transcoding when the user agent supports the original encoding and conversion would lose information.');
clause('wml', 'reference_unicode_mapping', ['WML-C-05'], '6.1', 'explicit-must', 'parser', 'Map every character in each recognized source encoding to its Unicode character.');
clause('wml', 'reference_entity_charset', ['WML-C-05'], '6.1', 'implicit-must', 'parser', 'Process character entities in the document character set.');
clause('wml', 'reference_wbxml_precedence', ['WML-C-05'], '6.1', 'implicit-must', 'transport-boundary', 'When WML is carried in WBXML, determine character encoding using the WBXML rules.');
clause('wml', 'entity_forms', ['WML-C-06'], '6.2', 'implicit-must', 'parser', 'Accept named, decimal numeric, and hexadecimal numeric WML character references.');
clause('wml', 'entity_unicode_identity', ['WML-C-06'], '6.2', 'implicit-must', 'parser', 'Resolve numeric character references against Unicode independently of the document byte encoding.');
clause('wml', 'entity_required_names', ['WML-C-06'], '6.2', 'table', 'parser', 'Resolve the WML named entities for quotation mark, ampersand, apostrophe, less-than, greater-than, non-breaking space, and soft hyphen.');

clause('wml', 'history_stack_model', ['WML-C-07'], '9.2', 'explicit-must', 'state-machine', 'Maintain navigational history as an ordered stack of visited card request identities.');
clause('wml', 'history_duplicate_push', ['WML-C-07'], '9.2', 'explicit-must', 'state-machine', 'Push an entry for each explicit card access even when it duplicates the newest history entry.');
clause('wml', 'history_entry_fields', ['WML-C-07'], '9.2', 'explicit-must', 'state-machine', 'Record the absolute card URL, request method, submitted fields, and request headers in each history entry.');
clause('wml', 'history_excludes_content', ['WML-C-07'], '9.2', 'implicit-must', 'state-machine', 'Do not store card content in history entries.');
clause('wml', 'history_resolves_variables', ['WML-C-07'], '9.2', 'explicit-must', 'state-machine', 'Resolve variable references before request data is stored in history.');
clause('wml', 'history_prev_pop', ['WML-C-07', 'WML-C-38'], '9.2', 'explicit-must', 'state-machine', 'A prev task pops the current entry and returns to the prior history entry.');
clause('wml', 'history_post_replay', ['WML-C-07', 'WML-C-38'], '9.2', 'explicit-must', 'transport-boundary', 'When a prior deck must be fetched again, replay the original POST data values associated with that history entry.');

clause('wml', 'shadow_matching', ['WML-C-08', 'WML-C-47'], '9.6', 'implicit-must', 'runtime', 'Match card and template onevent bindings by event type and do bindings by effective name for shadowing.');
clause('wml', 'shadow_card_precedence', ['WML-C-08', 'WML-C-47'], '9.6', 'implicit-must', 'runtime', 'A matching card-level event binding overrides its template-level binding.');
clause('wml', 'shadow_active_set', ['WML-C-08'], '9.6', 'implicit-must', 'runtime', 'Build the active event set from non-noop card bindings plus unshadowed non-noop template bindings.');
clause('wml', 'shadow_noop_mask', ['WML-C-08', 'WML-C-35'], '9.6', 'implicit-must', 'runtime', 'A noop binding masks its event without exposing an activatable action or producing task side effects.');

clause('wml', 'intrinsic_event_types', ['WML-C-09'], '9.10', 'table', 'runtime', 'Recognize timer, forward-entry, backward-entry, and option-pick intrinsic events on their defined elements.');
clause('wml', 'intrinsic_attribute_equivalence', ['WML-C-09', 'WML-C-39'], '9.10', 'explicit-must', 'runtime', 'Treat intrinsic-event attributes as abbreviated onevent bindings with equivalent go-task behavior.');
clause('wml', 'intrinsic_scope', ['WML-C-09', 'WML-C-39'], '9.10', 'implicit-must', 'runtime', 'Keep an intrinsic event binding active only within the element where it is declared.');
clause('wml', 'intrinsic_illegal_parent', ['WML-C-09', 'WML-C-39'], '9.10.1', 'explicit-must', 'error-policy', 'Ignore onevent bindings whose event type is not legal for the immediately enclosing element.');
clause('wml', 'intrinsic_conflict_error', ['WML-C-09'], '9.10', 'error-condition', 'error-policy', 'Treat conflicting bindings for the same intrinsic event within one element as a deck error.');
clause('wml', 'intrinsic_card_overrides_template', ['WML-C-08', 'WML-C-09', 'WML-C-47'], '9.10.2', 'implicit-must', 'runtime', 'Give a card-level forward-entry, backward-entry, or timer handler precedence over a template handler regardless of syntax.');
clause('wml', 'onevent_single_task', ['WML-C-39'], '9.10.1', 'grammar', 'parser', 'Parse onevent as exactly one go, prev, noop, or refresh task associated with its immediately enclosing element.');

clause('wml', 'context_single_scope', ['WML-C-10'], '10.1', 'implicit-must', 'state-machine', 'Store WML runtime state in one browser-context scope.');
clause('wml', 'context_state_members', ['WML-C-10'], '10.1', 'implicit-must', 'state-machine', 'Keep variables, navigation history, and implementation-dependent session state in the browser context.');
clause('wml', 'newcontext_unset_variables', ['WML-C-11'], '10.2', 'explicit-must', 'state-machine', 'On newcontext initialization, remove all variables from the current browser context.');
clause('wml', 'newcontext_clear_history', ['WML-C-11'], '10.2', 'explicit-must', 'state-machine', 'On newcontext initialization, clear navigation history.');
clause('wml', 'newcontext_reset_private_state', ['WML-C-11'], '10.2', 'explicit-must', 'state-machine', 'On newcontext initialization, reset implementation-specific context state to a documented initial value.');
clause('wml', 'newcontext_go_only', ['WML-C-11', 'WML-C-18', 'WML-C-29'], '10.2', 'implicit-must', 'state-machine', 'Apply newcontext only during go-task navigation into the destination card.');

clause('wml', 'variable_set_definition', ['WML-C-12'], '10.3', 'implicit-must', 'runtime', 'Treat a variable as set only when its current value is known and non-empty.');
clause('wml', 'variable_substitution_locations', ['WML-C-12'], '10.3.1', 'implicit-must', 'parser', 'Allow runtime variable substitution in card text and in attributes typed as vdata or HREF, but not as markup.');
clause('wml', 'variable_undefined_empty', ['WML-C-12'], '10.3.1', 'implicit-must', 'runtime', 'Substitute an empty string for a referenced variable that is unset or undefined.');
clause('wml', 'variable_name_grammar', ['WML-C-12'], '10.3.1', 'grammar', 'parser', 'Enforce the WML variable-name grammar and case sensitivity.');
clause('wml', 'variable_conversion_modes', ['WML-C-12'], '10.3.1', 'table', 'runtime', 'Implement no-escape, URL-escape, and URL-unescape substitution conversions without mutating the stored value.');
clause('wml', 'variable_default_conversion', ['WML-C-12'], '10.3.1', 'implicit-must', 'runtime', 'Default HREF substitutions to URL escaping and other substitution contexts to no conversion.');
clause('wml', 'variable_parse_precedence', ['WML-C-12'], '10.3.2', 'implicit-must', 'parser', 'Parse XML and entity syntax before parsing WML variable-substitution syntax.');
clause('wml', 'variable_dollar_escape', ['WML-C-12'], '10.3.3', 'explicit-must', 'parser', 'Interpret two consecutive dollar signs as one literal dollar sign in WML text and CDATA values.');
clause('wml', 'variable_task_snapshot', ['WML-C-12', 'WML-C-18', 'WML-C-29', 'WML-C-38', 'WML-C-42', 'WML-C-52'], '10.3.4', 'implicit-must', 'state-machine', 'Evaluate task setvar names and values before applying the resulting assignments to the browser context.');
clause('wml', 'variable_commit_before_task', ['WML-C-12', 'WML-C-33', 'WML-C-43'], '10.3.4', 'explicit-must', 'runtime', 'Commit input and selection variables before invoking any task.');
clause('wml', 'variable_reference_validation', ['WML-C-12'], '10.3.5', 'explicit-must', 'error-policy', 'Reject a deck when a variable reference has invalid syntax or appears outside a permitted text or attribute location.');

clause('wml', 'external_navigation_new_context', ['WML-C-13'], '10.4', 'explicit-must', 'state-machine', 'Establish a new browser context when navigation is initiated independently of the current content.');
clause('wml', 'external_navigation_old_context', ['WML-C-13'], '10.4', 'explicit-may', 'state-machine', 'The user agent may terminate the old context before establishing a context for external navigation.');

clause('wml', 'deck_access_required', ['WML-C-14', 'WML-C-21'], '12.1', 'explicit-must', 'security-policy', 'Enforce deck-level access control using access, sendreferer, domain, and path semantics.');
clause('wml', 'access_single_element', ['WML-C-21'], '11.3.1', 'error-condition', 'parser', 'Reject a deck containing more than one access element.');
clause('wml', 'access_absent_allows', ['WML-C-21'], '11.3.1', 'implicit-must', 'security-policy', 'When no access element is present, allow referrals from any deck.');
clause('wml', 'access_referrer_match', ['WML-C-21'], '11.3.1', 'explicit-must', 'security-policy', 'Require a referring URI to satisfy each declared domain and path restriction.');
clause('wml', 'access_component_match', ['WML-C-21'], '11.3.1', 'explicit-must', 'security-policy', 'Match domains by complete suffix components and paths by complete prefix components.');
clause('wml', 'access_defaults', ['WML-C-21'], '11.3.1', 'implicit-must', 'security-policy', 'Default an omitted access domain to the current deck domain and an omitted path to slash.');
clause('wml', 'access_relative_path', ['WML-C-21'], '11.3.1', 'implicit-must', 'security-policy', 'Resolve a relative access path to an absolute path before applying the prefix check.');
clause('wml', 'access_url_case_rules', ['WML-C-21'], '11.3.1', 'implicit-must', 'security-policy', 'Apply URL component capitalization rules when evaluating domain and path restrictions.');

clause('wml', 'error_enforcement', ['WML-C-16'], '12.3', 'explicit-must', 'error-policy', 'Enforce every error condition defined by WML.');
clause('wml', 'error_no_intent_inference', ['WML-C-16'], '12.3', 'explicit-must', 'error-policy', 'Do not hide invalid decks by guessing author or origin-server intent.');
clause('wml', 'unknown_markup_ignored', ['WML-C-17'], '12.4', 'explicit-should', 'parser', 'For an alternate DTD, ignore unrecognized element tags and attributes during presentation.');
clause('wml', 'unknown_content_preserved', ['WML-C-17'], '12.4', 'explicit-should', 'rendering', 'Continue rendering recognized content nested inside an unrecognized element.');

clause('wml', 'navigation_reference_model', ['WML-C-18'], '12.5', 'explicit-must', 'state-machine', 'Implement inter-card traversal with behavior indistinguishable from the WML reference process.');
clause('wml', 'go_setvar_snapshot', ['WML-C-18', 'WML-C-29'], '12.5.1', 'implicit-must', 'state-machine', 'For go, resolve setvar names and values into temporary assignments before fetching or changing context.');
clause('wml', 'go_target_resolution', ['WML-C-18', 'WML-C-29'], '12.5.1', 'implicit-must', 'transport-boundary', 'Resolve variables in the go target URI before fetching it.');
clause('wml', 'go_access_before_transition', ['WML-C-14', 'WML-C-18', 'WML-C-29'], '12.5.1', 'implicit-must', 'security-policy', 'Evaluate destination-deck access control before committing the card transition.');
clause('wml', 'go_fragment_fallback', ['WML-C-18', 'WML-C-29'], '12.5.1', 'implicit-must', 'state-machine', 'Choose the named card when a fragment matches; otherwise choose the first card in the fetched deck.');
clause('wml', 'go_assignment_order', ['WML-C-18', 'WML-C-29'], '12.5.1', 'implicit-must', 'state-machine', 'Apply temporary setvar assignments before newcontext processing and history insertion.');
clause('wml', 'go_history_push', ['WML-C-07', 'WML-C-18', 'WML-C-29'], '12.5.1', 'implicit-must', 'state-machine', 'Push the destination request identity onto history after destination context initialization.');
clause('wml', 'go_entry_event_precedence', ['WML-C-09', 'WML-C-18', 'WML-C-29'], '12.5.1', 'implicit-must', 'state-machine', 'Run a destination forward-entry handler before starting its timer or displaying the card, and stop the current traversal when it runs.');
clause('wml', 'go_timer_then_display', ['WML-C-18', 'WML-C-29', 'WML-C-48'], '12.5.1', 'implicit-must', 'state-machine', 'If no forward-entry handler diverts processing, start the destination timer before rendering with current variables.');
clause('wml', 'prev_empty_history', ['WML-C-18', 'WML-C-38'], '12.5.2', 'implicit-must', 'state-machine', 'Stop prev processing without a transition when the history stack has no prior card.');
clause('wml', 'prev_assignment_order', ['WML-C-18', 'WML-C-38'], '12.5.2', 'implicit-must', 'state-machine', 'For prev, snapshot setvar values, pop history, locate the destination, and then apply assignments.');
clause('wml', 'prev_entry_event_precedence', ['WML-C-09', 'WML-C-18', 'WML-C-38'], '12.5.2', 'implicit-must', 'state-machine', 'Run a backward-entry handler before starting the restored card timer or displaying the card.');
clause('wml', 'noop_no_processing', ['WML-C-35'], '12.5.3', 'implicit-must', 'runtime', 'Perform no processing for a noop task.');
clause('wml', 'refresh_assignments', ['WML-C-18', 'WML-C-42'], '12.5.4', 'implicit-must', 'state-machine', 'For refresh, resolve and apply every setvar assignment without changing cards.');
clause('wml', 'refresh_timer_restart', ['WML-C-18', 'WML-C-42', 'WML-C-48'], '12.5.4', 'implicit-must', 'state-machine', 'Restart the current card timer during refresh after context updates.');
clause('wml', 'refresh_redisplay', ['WML-C-18', 'WML-C-42'], '12.5.4', 'implicit-must', 'rendering', 'Redisplay the current card from the updated variable state even when refresh contains no setvar elements.');
clause('wml', 'task_failure_atomicity', ['WML-C-16', 'WML-C-18', 'WML-C-29', 'WML-C-38'], '12.5.5', 'explicit-must', 'error-policy', 'On fetch or access-control failure, notify the user and preserve the invoking card, context, pending assignments, and event state.');

clause('wml', 'postfield_structure', ['WML-C-37'], '9.3', 'grammar', 'parser', 'Require postfield name and value attributes and treat both as variable-bearing data.');
clause('wml', 'postfield_request_pair', ['WML-C-37', 'WML-C-29'], '9.3', 'implicit-must', 'transport-boundary', 'Submit each postfield as a name/value pair using the encoding selected by the enclosing go task.');
clause('wml', 'setvar_structure', ['WML-C-52'], '9.4', 'grammar', 'parser', 'Require setvar name and value attributes and no child content.');
clause('wml', 'setvar_invalid_name_ignored', ['WML-C-52'], '9.4', 'explicit-must', 'runtime', 'Ignore a setvar whose evaluated name is not a legal WML variable name.');
clause('wml', 'setvar_task_side_effect', ['WML-C-52'], '9.4', 'implicit-must', 'state-machine', 'Apply a valid setvar assignment only as a side effect of executing its containing task.');

clause('wml', 'go_structure', ['WML-C-29'], '9.5.1', 'grammar', 'parser', 'Parse go with a required target, declared request attributes, and zero or more postfield or setvar children.');
clause('wml', 'go_internal_postfield_suppression', ['WML-C-29'], '9.5.1', 'explicit-must', 'runtime', 'Ignore go postfields for same-deck card navigation unless no-cache is explicitly requested.');
clause('wml', 'go_referer', ['WML-C-14', 'WML-C-29'], '9.5.1', 'explicit-must', 'transport-boundary', 'When sendreferer is true, transmit the smallest usable relative URI for the referring deck.');
clause('wml', 'go_method', ['WML-C-29'], '9.5.1', 'implicit-must', 'transport-boundary', 'Map get and post method values to the corresponding request operation.');
clause('wml', 'go_no_cache', ['WML-C-29'], '9.5.1', 'explicit-must', 'transport-boundary', 'For cache-control no-cache, reload from the origin and send the matching request cache-control value.');
clause('wml', 'go_enctype_support', ['WML-C-29'], '9.5.1', 'implicit-must', 'transport-boundary', 'Support form-urlencoded submission and the declared multipart form-data behavior for POST requests.');
clause('wml', 'go_part_content_type', ['WML-C-29'], '9.5.1', 'explicit-must', 'transport-boundary', 'Provide a content type for each multipart part and a charset when its content is not US-ASCII.');
clause('wml', 'go_accept_charset', ['WML-C-29'], '9.5.1', 'explicit-should', 'transport-boundary', 'Encode submitted field names and values using an accepted charset, falling back to the deck encoding when unspecified or unknown.');
clause('wml', 'go_submission_order', ['WML-C-29', 'WML-C-37'], '9.5.1', 'implicit-must', 'transport-boundary', 'Substitute variables, transcode fields, then serialize postfields in document order.');
clause('wml', 'go_get_query_merge', ['WML-C-29'], '9.5.1', 'explicit-must', 'transport-boundary', 'For form-urlencoded GET, combine encoded fields with any existing query into a valid query component.');
clause('wml', 'go_post_content_type_charset', ['WML-C-29'], '9.5.1', 'explicit-must', 'transport-boundary', 'For form-urlencoded POST, send encoded fields in the body and include the submission charset in Content-Type.');
clause('wml', 'go_form_urlencoding', ['WML-C-29', 'WML-C-37'], '9.5.1', 'explicit-must', 'transport-boundary', 'URI-escape form field names and values, join each name to its value with equals, and join pairs with ampersands.');

clause('wml', 'do_structure', ['WML-C-26'], '9.7', 'grammar', 'parser', 'Parse do as exactly one task with a required type and optional label, name, optionality, and language metadata.');
clause('wml', 'do_activation', ['WML-C-26'], '9.7', 'implicit-must', 'runtime', 'Execute the bound task when the user activates a presented do action.');
clause('wml', 'do_unique_widget', ['WML-C-26'], '9.7', 'implicit-must', 'rendering', 'Expose an active non-optional do as a uniquely activatable interface action without assuming a particular physical widget.');
clause('wml', 'do_type_acceptance', ['WML-C-26'], '9.7', 'explicit-must', 'runtime', 'Accept every do type and treat an unrecognized type as unknown when no specialized mapping exists.');
clause('wml', 'do_label_best_effort', ['WML-C-26'], '9.7', 'explicit-must', 'rendering', 'Make a best-effort to use a supplied do label when the interface action can be labeled.');
clause('wml', 'do_effective_name', ['WML-C-26', 'WML-C-08'], '9.7', 'implicit-must', 'runtime', 'Use the declared do name for binding identity and default a missing name to the type value.');
clause('wml', 'do_optional_permission', ['WML-C-26'], '9.7', 'explicit-may', 'rendering', 'The user agent may omit a do explicitly marked optional.');
clause('wml', 'do_active_visibility', ['WML-C-26'], '9.7', 'explicit-must', 'rendering', 'Make every active, non-optional do accessible for user activation.');
clause('wml', 'do_inactive_hidden', ['WML-C-26', 'WML-C-08'], '9.7', 'explicit-must', 'rendering', 'Do not expose an inactive do in a form the user can activate.');

clause('wml', 'anchor_structure', ['WML-C-20'], '9.8', 'grammar', 'parser', 'Parse anchor content with exactly one go, prev, or refresh task.');
clause('wml', 'anchor_activation', ['WML-C-20'], '9.8', 'implicit-must', 'runtime', 'Execute the task contained by an anchor when the user activates that anchor.');
clause('wml', 'anchor_placement', ['WML-C-20'], '9.8', 'error-condition', 'parser', 'Reject anchor placement inside option text or any anchor containing a task count other than one.');
clause('wml', 'anchor_accesskey', ['WML-C-20'], '9.8', 'explicit-should', 'runtime', 'When access keys are supported, assign usable requested keys where possible and focus or activate the corresponding anchor.');
clause('wml', 'a_go_equivalence', ['WML-C-19'], '9.9', 'implicit-must', 'runtime', 'Treat an a element as an anchor containing a go task without variable assignments.');
clause('wml', 'a_no_nesting', ['WML-C-19'], '9.9', 'error-condition', 'parser', 'Reject nested a elements.');
clause('wml', 'a_required_target', ['WML-C-19'], '9.9', 'grammar', 'parser', 'Require an HREF target on each a element and restrict its child content to the declared inline set.');

clause('wml', 'wml_root_structure', ['WML-C-53'], '11.2', 'grammar', 'parser', 'Require a wml root containing optional head, optional template, and one or more cards in that order.');
clause('wml', 'wml_root_deck_scope', ['WML-C-53'], '11.2', 'implicit-must', 'parser', 'Treat the wml element as the enclosing scope for every card and all deck-level information.');
clause('wml', 'wml_root_language', ['WML-C-53'], '11.2', 'implicit-must', 'runtime', 'Apply optional root language metadata as the deck language input to inherited language resolution.');
clause('wml', 'head_structure', ['WML-C-30'], '11.3', 'grammar', 'parser', 'When head is present, require one or more access or meta children.');
clause('wml', 'head_deck_scope', ['WML-C-30'], '11.3', 'implicit-must', 'parser', 'Treat head children as metadata and access-control information for the whole deck.');
clause('wml', 'template_structure', ['WML-C-47'], '11.4', 'grammar', 'parser', 'Parse template as zero or more do or onevent bindings plus card-event attributes.');
clause('wml', 'template_applies_all_cards', ['WML-C-47'], '11.4', 'implicit-must', 'runtime', 'Apply each template event binding as though it were declared in every card unless shadowed.');

clause('wml', 'card_collection', ['WML-C-25'], '11.5', 'implicit-must', 'parser', 'Represent a WML deck as a collection containing at least one card.');
clause('wml', 'card_structure', ['WML-C-25'], '11.5.2', 'grammar', 'parser', 'Enforce card child ordering: event handlers, optional timer, then declared action or flow content.');
clause('wml', 'card_content_order', ['WML-C-25'], '11.5.2', 'explicit-should', 'rendering', 'Preserve significant card element order during presentation.');
clause('wml', 'card_id_fragment', ['WML-C-25', 'WML-C-18'], '11.5.2', 'implicit-must', 'state-machine', 'Use a card id as its fragment-navigation anchor.');
clause('wml', 'card_context_attribute', ['WML-C-25', 'WML-C-11'], '11.5.2', 'implicit-must', 'state-machine', 'Apply the card newcontext flag when entering through the defined go process.');
clause('wml', 'card_table_boundaries', ['WML-C-25', 'WML-C-46'], '11.5.2', 'explicit-must', 'rendering', 'Insert table boundary line breaks unless the table is respectively the first or last significant card content.');

clause('wml', 'select_structure', ['WML-C-43'], '11.6.2.1', 'grammar', 'parser', 'Require one or more option or optgroup children in each select element.');
clause('wml', 'select_single_multi_mode', ['WML-C-43'], '11.6.2.1', 'implicit-must', 'runtime', 'Allow one selected option by default and multiple selections only when multiple is true.');
clause('wml', 'select_init_order', ['WML-C-43', 'WML-C-33'], '11.6.2.1', 'explicit-must', 'runtime', 'Initialize input and select controls in document order when entering the card.');
clause('wml', 'select_index_validation', ['WML-C-43'], '11.6.2.1', 'implicit-must', 'runtime', 'Validate selection indices by removing non-integers, out-of-range entries, and duplicates.');
clause('wml', 'select_default_precedence', ['WML-C-43'], '11.6.2.1', 'implicit-must', 'runtime', 'Choose initial selections in iname, ivalue, name, value, then single/multiple fallback order.');
clause('wml', 'select_variable_initialization', ['WML-C-43'], '11.6.2.1', 'implicit-must', 'runtime', 'Initialize name from selected option values and iname from the validated selected indices.');
clause('wml', 'select_preselection', ['WML-C-43'], '11.6.2.1', 'implicit-must', 'runtime', 'Deselect all options and then select every positive validated default index.');
clause('wml', 'select_user_update', ['WML-C-43'], '11.6.2.1', 'explicit-must', 'runtime', 'Update name and iname after user selection changes and again before every task invocation.');
clause('wml', 'select_no_implicit_refresh', ['WML-C-43'], '11.6.2.1', 'explicit-must', 'rendering', 'Do not create display side effects from select-variable updates without an explicit refresh task.');
clause('wml', 'select_multi_serialization', ['WML-C-43'], '11.6.2.1', 'explicit-must', 'runtime', 'Serialize multiple results as semicolon-delimited lists with unique indices, duplicate non-empty values preserved, and no empty value entries.');
clause('wml', 'option_value_evaluation', ['WML-C-41', 'WML-C-43'], '11.6.2.2', 'implicit-must', 'runtime', 'Evaluate option value variable references before assigning the containing select name variable.');
clause('wml', 'option_onpick_multi', ['WML-C-41', 'WML-C-09'], '11.6.2.2', 'implicit-must', 'runtime', 'For multiple selection, dispatch onpick whenever the option is selected or deselected.');
clause('wml', 'option_onpick_single', ['WML-C-41', 'WML-C-09'], '11.6.2.2', 'implicit-must', 'runtime', 'For single selection, dispatch onpick for the newly selected option but not for implicit deselection.');

clause('wml', 'input_structure', ['WML-C-33'], '11.6.3', 'grammar', 'parser', 'Require an input variable name and constrain input attributes to the declared text-entry grammar.');
clause('wml', 'input_mask_commit', ['WML-C-33'], '11.6.3', 'explicit-must', 'runtime', 'At commit, accept only values conforming to the effective input mask.');
clause('wml', 'input_rejection_atomicity', ['WML-C-33'], '11.6.3', 'explicit-must', 'runtime', 'On invalid input, notify the user, preserve the original variable value, and allow another entry attempt.');
clause('wml', 'input_initialization', ['WML-C-33'], '11.6.3', 'explicit-must', 'runtime', 'Initialize each input from a valid existing name variable or a valid default value, then preload the control.');
clause('wml', 'input_invalid_initial_value', ['WML-C-33'], '11.6.3', 'explicit-must', 'runtime', 'Unset an existing name value that violates the mask before attempting the declared default.');
clause('wml', 'input_empty_commit', ['WML-C-33'], '11.6.3', 'explicit-must', 'runtime', 'Accept an empty committed input only when the effective mask and emptyok rules allow it.');
clause('wml', 'input_password_display', ['WML-C-33'], '11.6.3', 'implicit-must', 'rendering', 'Conceal the entered value when input type is password while preserving the actual variable value.');
clause('wml', 'input_format_literals', ['WML-C-33'], '11.6.3', 'explicit-must', 'runtime', 'Preserve escaped literal characters that form part of an accepted formatted input value.');
clause('wml', 'input_maxlength', ['WML-C-33'], '11.6.3', 'implicit-must', 'runtime', 'Limit committed text to maxlength when that attribute is present.');

clause('wml', 'timer_single_per_card', ['WML-C-48'], '11.7', 'error-condition', 'parser', 'Reject a card containing more than one timer element.');
clause('wml', 'timer_start_stop', ['WML-C-48'], '11.7', 'implicit-must', 'state-machine', 'Initialize and start the timer on card entry and stop it on card exit.');
clause('wml', 'timer_event_transition', ['WML-C-48', 'WML-C-09'], '11.7', 'implicit-must', 'state-machine', 'Dispatch ontimer when a running timer transitions from one to zero while its card remains active.');
clause('wml', 'timer_units', ['WML-C-48'], '11.7', 'implicit-must', 'runtime', 'Interpret timer values in tenths of a second without requiring a particular scheduling resolution.');
clause('wml', 'timer_invalid_value', ['WML-C-48'], '11.7', 'explicit-must', 'runtime', 'Ignore a timer whose resolved timeout is not a non-negative integer, with zero disabling it.');
clause('wml', 'timer_refresh_resume', ['WML-C-48', 'WML-C-42'], '11.7', 'explicit-must', 'state-machine', 'Treat refresh as timer exit and re-entry: stop and persist the current value, update context, then resume.');
clause('wml', 'timer_name_persistence', ['WML-C-48'], '11.7', 'implicit-must', 'state-machine', 'Store the current timer value in its name variable on card exit or expiration.');
clause('wml', 'timer_initial_value_precedence', ['WML-C-48'], '11.7', 'implicit-must', 'state-machine', 'Initialize a named timer from its set variable, otherwise from value; always use value when no name is declared.');

clause('wml', 'paragraph_wrap_mode', ['WML-C-36'], '11.8.3', 'implicit-must', 'rendering', 'Apply wrap or nowrap behavior and provide a way to view complete non-wrapped lines.');
clause('wml', 'paragraph_nonbreaking_space', ['WML-C-36', 'WML-C-06'], '11.8.3', 'explicit-must', 'rendering', 'Do not treat non-breaking space as a legal inter-word line-break point.');
clause('wml', 'paragraph_soft_hyphen', ['WML-C-36', 'WML-C-06'], '11.8.3', 'explicit-must', 'rendering', 'When breaking at a soft hyphen, render a hyphen at line end; otherwise do not render that character as ordinary text.');
clause('wml', 'paragraph_mode_inheritance', ['WML-C-36'], '11.8.3', 'implicit-must', 'rendering', 'Inherit unspecified wrap mode from the previous significant paragraph and default the first paragraph to wrap.');
clause('wml', 'paragraph_alignment_default', ['WML-C-36'], '11.8.3', 'implicit-must', 'rendering', 'Default unspecified paragraph alignment to left.');
clause('wml', 'paragraph_significant_break', ['WML-C-36'], '11.8.3', 'explicit-must', 'rendering', 'Insert a line break between significant paragraph elements.');
clause('wml', 'paragraph_empty_ignored', ['WML-C-36'], '11.8.3', 'explicit-should', 'rendering', 'Ignore empty or whitespace-only paragraphs without allowing them to alter inherited wrap state.');
clause('wml', 'br_line_break', ['WML-C-24'], '11.8.4', 'explicit-must', 'rendering', 'End the current rendered line at br and continue on the following line.');
clause('wml', 'br_table_effort', ['WML-C-24'], '11.8.4', 'explicit-should', 'rendering', 'Make a best effort to preserve br behavior inside table cells.');

clause('wml', 'table_structure', ['WML-C-46'], '11.8.5', 'grammar', 'parser', 'Require one or more tr children and prohibit nested table elements.');
clause('wml', 'table_exact_columns', ['WML-C-46'], '11.8.5', 'explicit-must', 'rendering', 'Create exactly the positive number of columns declared by the required columns attribute.');
clause('wml', 'table_short_row_padding', ['WML-C-46', 'WML-C-50'], '11.8.5', 'explicit-must', 'rendering', 'Pad a row containing too few cells with significant empty cells.');
clause('wml', 'table_long_row_aggregation', ['WML-C-46', 'WML-C-50'], '11.8.5', 'explicit-must', 'rendering', 'Merge excess cells into the final declared column and place one inter-word space between merged cells.');
clause('wml', 'table_alignment_designators', ['WML-C-46'], '11.8.5', 'implicit-must', 'rendering', 'Apply column alignment designators in order, default missing or unknown designators, and ignore extras.');
clause('wml', 'table_nonzero_gutter', ['WML-C-46'], '11.8.5', 'explicit-must', 'rendering', 'When using traditional tabular layout, separate adjacent non-empty columns with a non-zero gutter.');
clause('wml', 'tr_structure', ['WML-C-50'], '11.8.6', 'grammar', 'parser', 'Require one or more td children in each table row.');
clause('wml', 'tr_empty_significant', ['WML-C-50'], '11.8.6', 'explicit-must', 'rendering', 'Preserve a row whose cells are all empty.');
clause('wml', 'td_structure', ['WML-C-49'], '11.8.7', 'grammar', 'parser', 'Restrict table-cell content to the declared text, layout, image, and anchor element set.');
clause('wml', 'td_empty_significant', ['WML-C-49'], '11.8.7', 'explicit-must', 'rendering', 'Preserve empty table cells during layout.');

clause('wml', 'image_structure', ['WML-C-32'], '11.9', 'grammar', 'parser', 'Require alt and src on an empty img element and accept the declared optional image hints.');
clause('wml', 'image_text_flow', ['WML-C-32'], '11.9', 'implicit-must', 'rendering', 'Lay out an image within the surrounding text flow.');
clause('wml', 'image_local_precedence', ['WML-C-32'], '11.9', 'implicit-must', 'rendering', 'Use an available localsrc representation before fetching the src resource.');
clause('wml', 'image_remote_fetch', ['WML-C-32'], '11.9', 'implicit-must', 'transport-boundary', 'When images are supported and no usable local representation exists, fetch the src URI for rendering.');
clause('wml', 'image_alt_fallback', ['WML-C-32', 'WML-C-54'], '11.9', 'implicit-must', 'rendering', 'Render alt text when the image cannot be displayed because support, local data, or fetched content is unavailable.');

// WAE selected Class C integration clauses. Imported RFC behavior is anchored
// to the authority-locked external text while language behavior delegates to
// the WML and WMLScript family ledgers.
clause('wae', 'basic_auth_required', ['WAESpec-C-002'], '3.3', 'explicit-must', 'transport-boundary', 'Implement the HTTP Basic authentication scheme using the RFC 2616 authority selected by the effective WAE SIN chain.', 'wae-sin-103');
clause('wae', 'auth_challenge_parsing', ['WAESpec-C-002'], '1.2', 'explicit-must', 'parser', 'Parse one or more case-insensitive authentication schemes and their challenge parameters from WWW-Authenticate and Proxy-Authenticate fields.', 'rfc-2617');
clause('wae', 'auth_realm_required', ['WAESpec-C-002'], '1.2', 'explicit-must', 'parser', 'Require every accepted Basic challenge to contain a quoted realm parameter while treating the parameter name case-insensitively.', 'rfc-2617');
clause('wae', 'auth_protection_space', ['WAESpec-C-002'], '1.2', 'implicit-must', 'security-policy', 'Identify an authentication protection space by the case-sensitive realm value together with the canonical root URL of its server.', 'rfc-2617');
clause('wae', 'auth_challenge_selection', ['WAESpec-C-002'], '1.2', 'explicit-must', 'security-policy', 'When several challenges are offered, select the strongest authentication scheme the user agent understands and request credentials for that challenge.', 'rfc-2617');
clause('wae', 'auth_origin_credentials', ['WAESpec-C-002'], '1.2', 'implicit-must', 'transport-boundary', 'Send origin-server Basic credentials in Authorization and associate them only with the realm and protection space of the requested resource.', 'rfc-2617');
clause('wae', 'auth_proxy_credentials', ['WAESpec-C-002'], '1.2', 'implicit-must', 'transport-boundary', 'Handle a 407 proxy challenge with Proxy-Authorization while keeping proxy credentials distinct from end-to-end origin credentials.', 'rfc-2617');
clause('wae', 'auth_basic_encoding', ['WAESpec-C-002'], '2', 'implicit-must', 'transport-boundary', 'Encode Basic credentials as Base64 over the user identifier, one colon separator, and the password, without MIME line-length wrapping.', 'rfc-2617');
clause('wae', 'auth_userid_grammar', ['WAESpec-C-002'], '2', 'grammar', 'parser', 'Reject a Basic user identifier containing a colon while allowing the password field to contain text, including additional colons.', 'rfc-2617');
clause('wae', 'auth_realm_opacity', ['WAESpec-C-002'], '2', 'implicit-must', 'security-policy', 'Treat a Basic realm value as an opaque, case-sensitive string that is comparable only with realms on the same server.', 'rfc-2617');
clause('wae', 'auth_path_reuse_scope', ['WAESpec-C-002'], '2', 'explicit-should', 'security-policy', 'Assume Basic credentials apply at or below the challenged Request-URI path depth, but never extend automatic reuse beyond the protection space.', 'rfc-2617');
clause('wae', 'auth_preemptive_reuse', ['WAESpec-C-002'], '2', 'explicit-may', 'transport-boundary', 'Permit preemptive Authorization only for a request already known to fall within the matching Basic protection space.', 'rfc-2617');
clause('wae', 'auth_rechallenge', ['WAESpec-C-002'], '1.2', 'implicit-must', 'runtime', 'When credentials are rejected with a new 401 or 407 challenge, do not silently treat the response as authenticated; expose a retry decision.', 'rfc-2617');
clause('wae', 'auth_secure_channel_warning', ['WAESpec-C-002'], '4.1', 'explicit-should', 'security-policy', 'Treat Basic credentials as cleartext-equivalent and use the scheme only with an external secure channel or an explicit unsafe-compatibility decision.', 'rfc-2617');

clause('wae', 'http_scheme_support', ['WAESpec-C-003'], '5.1.3', 'implicit-must', 'transport-boundary', 'Recognize the http URL scheme for resources named on HTTP origin servers.');
clause('wae', 'http_transport_independence', ['WAESpec-C-003'], '5.1.3', 'implicit-must', 'transport-boundary', 'Do not infer the client-to-gateway protocol from an http URL; preserve the same resource identity across direct and gateway-backed transport.');
clause('wae', 'uri_hierarchical_components', ['WAESpec-C-003'], '3', 'grammar', 'parser', 'Parse hierarchical URI references into scheme, authority, path, and optional query components without treating the path as a filesystem path.', 'rfc-2396');
clause('wae', 'http_url_grammar', ['WAESpec-C-003'], '3.2.2', 'grammar', 'parser', 'Parse an http URL as a required host plus optional port, absolute path, and query following the http scheme authority delimiter.', 'rfc-2616');
clause('wae', 'http_url_defaults', ['WAESpec-C-003'], '3.2.2', 'explicit-must', 'transport-boundary', 'Use port 80 when the http URL omits a port and supply slash as the request path when its absolute path is empty.', 'rfc-2616');
clause('wae', 'http_url_comparison', ['WAESpec-C-003'], '3.2.3', 'explicit-must', 'runtime', 'Compare HTTP URIs octet-for-octet except for case-insensitive scheme and host, default-port equivalence, and empty-path equivalence to slash.', 'rfc-2616');
clause('wae', 'http_gateway_or_direct', ['WAESpec-C-003'], '5.1.3', 'implicit-must', 'transport-boundary', 'Allow the named origin resource to be reached through a WSP-to-HTTP gateway or directly from a server combining gateway and origin roles.');

clause('wae', 'accept_capability_headers', ['WAESpec-C-005', 'WAESpec-C-006', 'WAESpec-C-007'], '3.3', 'implicit-must', 'transport-boundary', 'Convey supported media types, character sets, and languages through Accept, Accept-Charset, and Accept-Language request headers respectively.', 'wae-sin-101');
clause('wae', 'accept_independent_of_uaprof', ['WAESpec-C-005', 'WAESpec-C-006', 'WAESpec-C-007'], '3.3', 'implicit-must', 'transport-boundary', 'Support the three Accept capability headers regardless of whether the client also supports or sends a UAProf profile.', 'wae-sin-101');
clause('wae', 'accept_media_ranges', ['WAESpec-C-007'], '14.1', 'grammar', 'transport-boundary', 'Serialize supported response media types as exact type/subtype values or valid type and global wildcards with applicable media parameters.', 'rfc-2616');
clause('wae', 'accept_media_preferences', ['WAESpec-C-007'], '14.1', 'implicit-must', 'transport-boundary', 'Encode media preferences with quality values from zero through one, default omitted quality to one, and preserve specificity precedence.', 'rfc-2616');
clause('wae', 'accept_charset_ranges', ['WAESpec-C-005'], '14.2', 'grammar', 'transport-boundary', 'Serialize supported response character sets as registered charset names or wildcard, each optionally carrying a quality value.', 'rfc-2616');
clause('wae', 'accept_charset_defaults', ['WAESpec-C-005'], '14.2', 'implicit-must', 'transport-boundary', 'Preserve the historical ISO-8859-1 implicit quality rule when Accept-Charset is present without either that charset or a wildcard.', 'rfc-2616');
clause('wae', 'accept_language_ranges', ['WAESpec-C-006'], '14.4', 'grammar', 'transport-boundary', 'Serialize preferred natural languages as valid language ranges or wildcard, each optionally carrying a quality value.', 'rfc-2616');
clause('wae', 'accept_language_matching', ['WAESpec-C-006'], '14.4', 'implicit-must', 'runtime', 'Apply exact-or-hyphen-prefix language matching and use the quality of the longest matching language range.', 'rfc-2616');
clause('wae', 'accept_values_match_capability', ['WAESpec-C-005', 'WAESpec-C-006', 'WAESpec-C-007'], '5.1.4', 'implicit-must', 'transport-boundary', 'Generate capability headers from the user agent configuration and supported decoders rather than advertising formats it cannot process.');

clause('wae', 'wml_language_delegate', ['WAESpec-C-015', 'WAESpec-C-017'], '5.1.5', 'implicit-must', 'runtime', 'Process Wireless Markup Language using the effective selected WML 1.3 family ledger and its Class C user-agent requirements.');
clause('wae', 'wmlscript_language_delegate', ['WAESpec-C-016', 'WAESpec-C-017'], '5.1.6', 'implicit-must', 'runtime', 'Process WMLScript using the effective selected WMLScript family ledger and its Class C interpreter requirements.');
clause('wae', 'wml_user_agent_composition', ['WAESpec-C-017'], '5.1.7.2', 'implicit-must', 'runtime', 'Compose the WML and WMLScript requirements and guidelines into one WML user agent without moving network fetch behavior into the language runtime.');

clause('wae', 'media_type_dispatch', ['WAESpec-C-019', 'WAESpec-C-020', 'WAESpec-C-021'], '5.1.8', 'implicit-must', 'transport-boundary', 'Dispatch WAE content according to its media type so the responsible decoder or interpreter applies that format structure and semantics.');
clause('wae', 'media_push_fallback', ['WAESpec-C-019', 'WAESpec-C-020', 'WAESpec-C-021'], '5.1.8', 'explicit-should', 'security-policy', 'When pushed content has no defined push behavior, take no action beyond discarding it or placing it in cache.');
clause('wae', 'wbxml_media_type', ['WAESpec-C-019'], '5.1.8.1', 'implicit-must', 'transport-boundary', 'Recognize application/vnd.wap.wbxml as generic WBXML content and route it to the WBXML decoder.');
clause('wae', 'wbxml_document_typing', ['WAESpec-C-019'], '5.1.8.1', 'implicit-must', 'binary-decoder', 'Use decoded WBXML document typing rather than assuming generic WBXML is always WML.');
clause('wae', 'wmlc_media_type', ['WAESpec-C-020'], '5.1.8.1', 'implicit-must', 'transport-boundary', 'Recognize application/vnd.wap.wmlc as encoded WML, decode it as WBXML, and pass the resulting WML deck to the engine.');
clause('wae', 'wmlscriptc_media_type', ['WAESpec-C-021'], '5.1.8.2', 'implicit-must', 'transport-boundary', 'Recognize application/vnd.wap.wmlscriptc as encoded WMLScript and route its bytecode to the WMLScript interpreter.');

// WAP-120 selected user-agent caching clauses plus its imported RFC 2616
// client-cache model.
clause('caching', 'wap_model_required', ['UACache-C-001'], '4.1', 'explicit-must', 'transport-boundary', 'Faithfully implement the HTTP/1.1 resource caching model imported by WAP-120.');
clause('caching', 'zero_byte_profile', ['UACache-C-001'], '4', 'implicit-must', 'runtime', 'Apply WAP caching semantics even when configured with zero bytes of persistent cache capacity.');
clause('caching', 'expiration_and_validation', ['UACache-C-001'], '13', 'implicit-must', 'state-machine', 'Use expiration to avoid unnecessary requests and validation to avoid retransmitting an unchanged full response.', 'rfc-2616');
clause('caching', 'semantic_relaxation_explicit', ['UACache-C-001'], '13', 'explicit-must', 'runtime', 'Relax semantic transparency only through an explicit protocol or user choice and expose required warnings for non-transparent cached responses.', 'rfc-2616');
clause('caching', 'newest_applicable_response', ['UACache-C-001'], '13.1.1', 'explicit-must', 'state-machine', 'Select the most up-to-date cached response applicable to the request before evaluating whether it can be reused.', 'rfc-2616');
clause('caching', 'cache_reuse_conditions', ['UACache-C-001'], '13.1.1', 'explicit-must', 'state-machine', 'Reuse a cached response only when it is fresh enough, successfully revalidated, or an explicitly permitted status or stale response.', 'rfc-2616');
clause('caching', 'origin_unavailable_result', ['UACache-C-001'], '13.1.1', 'explicit-must', 'error-policy', 'When the origin is unreachable, serve only a response valid under cache rules; otherwise return an error or warning describing the communication failure.', 'rfc-2616');
clause('caching', 'stale_response_warning', ['UACache-C-001'], '13.1.2', 'explicit-must', 'runtime', 'Attach and process a Warning whenever a cached response is neither first-hand nor fresh enough.', 'rfc-2616');
clause('caching', 'warning_revalidation_lifecycle', ['UACache-C-001'], '13.1.2', 'explicit-must', 'state-machine', 'Delete 1xx freshness warnings after successful revalidation while retaining 2xx warnings about entity or header characteristics.', 'rfc-2616');
clause('caching', 'directive_conflict_policy', ['UACache-C-001'], '13.1.3', 'implicit-must', 'state-machine', 'Resolve apparently conflicting cache-control values using the most restrictive interpretation unless a directive explicitly relaxes transparency.', 'rfc-2616');
clause('caching', 'user_override_explicit', ['UACache-C-001'], '13.1.4', 'explicit-should', 'runtime', 'Do not default to stale or abnormally ineffective caching; enable such behavior only through an explicit user configuration.', 'rfc-2616');
clause('caching', 'user_override_warning', ['UACache-C-001'], '13.1.4', 'explicit-should', 'rendering', 'Indicate when a user cache override displays known-stale content or persistently reduces normal cache effectiveness.', 'rfc-2616');
clause('caching', 'client_freshness_directives', ['UACache-C-001'], '13.1.6', 'explicit-may', 'transport-boundary', 'Allow requests to constrain maximum response age and minimum remaining freshness or explicitly accept bounded stale responses.', 'rfc-2616');
clause('caching', 'explicit_expiration', ['UACache-C-001'], '13.2.1', 'implicit-must', 'state-machine', 'Treat response Expires and Cache-Control max-age values as server-specified freshness limits for subsequent requests.', 'rfc-2616');
clause('caching', 'always_stale_validation', ['UACache-C-001'], '13.2.1', 'explicit-should', 'state-machine', 'Validate an entry before reuse when its explicit expiration time is already in the past.', 'rfc-2616');
clause('caching', 'heuristic_expiration', ['UACache-C-001'], '13.2.2', 'explicit-may', 'state-machine', 'Permit cautious heuristic freshness when explicit expiration is absent while respecting the RFC worst-case constraints.', 'rfc-2616');
clause('caching', 'age_initial_calculation', ['UACache-C-001'], '13.2.3', 'explicit-must', 'state-machine', 'Calculate corrected initial age conservatively from Date, Age, request time, response time, and apparent network delay.', 'rfc-2616');
clause('caching', 'age_resident_calculation', ['UACache-C-001'], '13.2.3', 'implicit-must', 'state-machine', 'Calculate current age as corrected initial age plus the time the response has resided in the local cache.', 'rfc-2616');
clause('caching', 'freshness_lifetime_priority', ['UACache-C-001'], '13.2.4', 'implicit-must', 'state-machine', 'Derive freshness lifetime from max-age before Expires and otherwise from a permitted heuristic.', 'rfc-2616');
clause('caching', 'heuristic_warning_113', ['UACache-C-001'], '13.2.4', 'explicit-must', 'runtime', 'Attach Warning 113 when serving a heuristically fresh response more than 24 hours old and that warning is not already present.', 'rfc-2616');
clause('caching', 'freshness_comparison', ['UACache-C-001'], '13.2.4', 'implicit-must', 'state-machine', 'Treat a response as fresh only while its freshness lifetime is greater than its current age.', 'rfc-2616');
clause('caching', 'fresh_variant_recency', ['UACache-C-001'], '13.2.5', 'explicit-must', 'state-machine', 'When fresh responses for one representation have different validators, select the entry with the most recent Date value.', 'rfc-2616');
clause('caching', 'older_revalidation_retry', ['UACache-C-001'], '13.2.6', 'explicit-should', 'transport-boundary', 'If revalidation returns an apparently older Date, retry unconditionally with max-age zero or no-cache.', 'rfc-2616');
clause('caching', 'conditional_validation', ['UACache-C-001'], '13.3', 'implicit-must', 'transport-boundary', 'Validate stale entries with a conditional request carrying the stored validator and interpret a match as a bodyless 304 response.', 'rfc-2616');
clause('caching', 'unrefreshable_without_validator', ['UACache-C-001'], '13.3', 'implicit-must', 'state-machine', 'Allow a response without a validator to be cached until expiration, but do not attempt conditional refresh after it becomes stale.', 'rfc-2616');
clause('caching', 'last_modified_validator', ['UACache-C-001'], '13.3.1', 'implicit-must', 'transport-boundary', 'Use Last-Modified as a date validator when it is the available validator for a cached representation.', 'rfc-2616');
clause('caching', 'entity_tag_validator', ['UACache-C-001'], '13.3.2', 'implicit-must', 'transport-boundary', 'Store ETag values with cached representations and send them in cache-conditional requests.', 'rfc-2616');
clause('caching', 'validator_strength', ['UACache-C-001'], '13.3.3', 'implicit-must', 'state-machine', 'Use strong comparison where byte identity is required and weak comparison only where semantic equivalence is sufficient.', 'rfc-2616');
clause('caching', 'validator_request_selection', ['UACache-C-001'], '13.3.4', 'explicit-must', 'transport-boundary', 'Send an available entity tag in cache conditionals, use Last-Modified when it is the only validator, and send both when both exist.', 'rfc-2616');
clause('caching', 'nonvalidator_headers', ['UACache-C-001'], '13.3.5', 'implicit-must', 'state-machine', 'Do not use arbitrary response-header equality as cache validation beyond entity tags and the defined Last-Modified compatibility mechanism.', 'rfc-2616');
clause('caching', 'default_cacheable_statuses', ['UACache-C-001'], '13.4', 'implicit-must', 'state-machine', 'Permit storage of status 200, 203, 206, 300, 301, and 410 responses unless another cache rule prohibits it.', 'rfc-2616');
clause('caching', 'other_status_cacheability', ['UACache-C-001'], '13.4', 'explicit-must', 'state-machine', 'Do not reuse other response statuses unless an explicit expiration value or cache-control directive makes them cacheable.', 'rfc-2616');
clause('caching', 'end_to_end_header_storage', ['UACache-C-001'], '13.5.1', 'explicit-must', 'state-machine', 'Store and replay end-to-end response headers with cache entries while excluding hop-by-hop connection headers.', 'rfc-2616');
clause('caching', 'nonmodifiable_headers', ['UACache-C-001'], '13.5.2', 'explicit-must', 'transport-boundary', 'Preserve Content-Location, Content-MD5, ETag, Last-Modified, and Expires according to the non-modifiable header rules.', 'rfc-2616');
clause('caching', 'validated_header_merge', ['UACache-C-001'], '13.5.3', 'explicit-must', 'state-machine', 'On 304 or compatible 206 validation, reuse the stored entity and replace cached end-to-end headers with corresponding new values.', 'rfc-2616');
clause('caching', 'partial_range_merge', ['UACache-C-001'], '13.5.4', 'explicit-may', 'state-machine', 'Combine partial ranges only when both pieces have strongly matching validators; otherwise retain only the most recent partial response.', 'rfc-2616');
clause('caching', 'vary_selection_match', ['UACache-C-001'], '13.6', 'explicit-must', 'state-machine', 'Reuse a Vary-governed response only when every selecting request header matches the stored request after allowed whitespace normalization.', 'rfc-2616');
clause('caching', 'vary_star_miss', ['UACache-C-001'], '13.6', 'explicit-must', 'state-machine', 'Treat Vary asterisk as an unconditional cache-selection miss that requires origin-server interpretation.', 'rfc-2616');
clause('caching', 'private_cache_isolation', ['UACache-C-001', 'UACache-C-006'], '13.7', 'explicit-should', 'security-policy', 'Enforce that a non-shared user-agent cache is accessible only to its single user through appropriate security mechanisms.', 'rfc-2616');
clause('caching', 'partial_response_marking', ['UACache-C-001'], '13.8', 'explicit-must', 'state-machine', 'Treat an incomplete stored response as partial and never return it as 200 OK instead of explicitly marked 206 Partial Content.', 'rfc-2616');
clause('caching', 'revalidation_5xx_policy', ['UACache-C-001'], '13.8', 'explicit-may', 'error-policy', 'On a 5xx validation response, forward the error or use a prior response only when must-revalidate does not forbid stale reuse.', 'rfc-2616');
clause('caching', 'query_response_freshness', ['UACache-C-001'], '13.9', 'explicit-must', 'state-machine', 'Do not treat a GET or HEAD query-URI response as fresh unless the server supplies an explicit expiration time.', 'rfc-2616');
clause('caching', 'unsafe_method_invalidation', ['UACache-C-001'], '13.10', 'explicit-must', 'state-machine', 'Invalidate cached entities affected by successful PUT, DELETE, or POST requests, including same-host Location and Content-Location targets.', 'rfc-2616');
clause('caching', 'unknown_method_invalidation', ['UACache-C-001'], '13.10', 'explicit-should', 'state-machine', 'Invalidate the Request-URI cache entry when passing through an unsafe method whose semantics are not understood.', 'rfc-2616');
clause('caching', 'write_through_unsafe_methods', ['UACache-C-001'], '13.11', 'explicit-must', 'transport-boundary', 'Write every potentially modifying method through to the origin and wait for its response instead of answering from cache.', 'rfc-2616');
clause('caching', 'new_response_replacement', ['UACache-C-001'], '13.12', 'explicit-should', 'state-machine', 'Use a newly received cacheable response for the current request and do not replace an entry with a response carrying an older Date.', 'rfc-2616');
clause('caching', 'history_cache_distinction', ['UACache-C-001', 'UACache-C-002', 'UACache-C-003'], '13.13', 'explicit-should', 'state-machine', 'Keep history distinct from ordinary cache reuse so back navigation normally restores what the user previously saw.', 'rfc-2616');
clause('caching', 'cache_control_passthrough', ['UACache-C-001'], '14.9', 'explicit-must', 'transport-boundary', 'Parse and pass Cache-Control directives through the request and response chain even when a local component does not use them.', 'rfc-2616');
clause('caching', 'cache_control_no_cache', ['UACache-C-001'], '14.9', 'explicit-must', 'state-machine', 'Do not reuse a no-cache response without successful origin revalidation, including any field-name-limited restrictions.', 'rfc-2616');
clause('caching', 'cache_control_no_store', ['UACache-C-001', 'UACache-C-006'], '14.9', 'explicit-must', 'security-policy', 'For no-store, retain no message data in non-volatile cache and make a best effort to purge it promptly from volatile cache.', 'rfc-2616');
clause('caching', 'cache_control_private', ['UACache-C-001', 'UACache-C-006'], '14.9', 'explicit-must', 'security-policy', 'Never store a private response in a shared cache while permitting storage in the selected single-user cache.', 'rfc-2616');
clause('caching', 'cache_control_max_age', ['UACache-C-001'], '14.9', 'implicit-must', 'state-machine', 'Give response max-age precedence over Expires and use the lesser value when both request and response specify max-age.', 'rfc-2616');
clause('caching', 'cache_control_reload', ['UACache-C-001'], '14.9', 'explicit-must', 'transport-boundary', 'Map request no-cache to end-to-end reload and max-age zero to end-to-end revalidation, carrying a local validator when available.', 'rfc-2616');
clause('caching', 'cache_control_only_if_cached', ['UACache-C-001'], '14.9', 'explicit-should', 'error-policy', 'For only-if-cached, return a compliant stored response or a 504 result without contacting the origin.', 'rfc-2616');
clause('caching', 'cache_control_must_revalidate', ['UACache-C-001', 'UACache-C-002'], '14.9', 'explicit-must', 'state-machine', 'Never reuse a stale must-revalidate entry without successful end-to-end validation; return an error when the origin cannot be reached.', 'rfc-2616');
clause('caching', 'cache_control_no_transform', ['UACache-C-001'], '14.9', 'explicit-must', 'transport-boundary', 'Do not transform an entity body or its governed representation headers when no-transform is present.', 'rfc-2616');
clause('caching', 'cache_control_extensions', ['UACache-C-001'], '14.9', 'explicit-must', 'parser', 'Ignore unrecognized cache directives while continuing to obey accompanying standard directives that provide safe fallback behavior.', 'rfc-2616');

clause('caching', 'history_cached_attempt', ['UACache-C-002', 'UACache-C-003'], '4.1.1', 'explicit-should', 'state-machine', 'On WML back navigation, first attempt to restore the resource associated with the history entry from cache.');
clause('caching', 'history_must_revalidate', ['UACache-C-002'], '4.1.1', 'explicit-must', 'state-machine', 'Revalidate a stale history resource before back navigation when its cached response carries must-revalidate.');
clause('caching', 'history_request_replay', ['UACache-C-002'], '4.1.1', 'explicit-must', 'transport-boundary', 'Revalidate history with precisely the original method, request entity, and other request semantics, including POST data.');
clause('caching', 'history_revalidation_no_prompt', ['UACache-C-002'], '4.1.1', 'explicit-must', 'runtime', 'Perform required history revalidation without asking the user to resubmit or confirm the original request.');
clause('caching', 'history_no_revalidate_without_directive', ['UACache-C-003'], '4.1.1', 'explicit-must', 'state-machine', 'Do not revalidate a stale history resource during back navigation when must-revalidate is absent.');
clause('caching', 'history_snapshot_or_current', ['UACache-C-002', 'UACache-C-003'], '4.1.1', 'implicit-must', 'state-machine', 'Show the historical cached representation by default and the up-to-date representation only when must-revalidate requires it.');
clause('caching', 'intra_resource_no_revalidate', ['UACache-C-004'], '4.1.2', 'implicit-must', 'state-machine', 'Do not revalidate while navigating or processing within one cached resource unless that content type defines another validation model.');
clause('caching', 'wmlscript_intra_unit', ['UACache-C-004'], '4.1.2', 'implicit-must', 'runtime', 'Allow calls within one WMLScript compilation unit without revalidation after the initial validity check and fetch.');
clause('caching', 'wml_intra_deck', ['UACache-C-004'], '4.1.2', 'implicit-must', 'runtime', 'Allow navigation among cards in one WML deck without revalidation after the initial deck validity check and fetch.');
clause('caching', 'cache_private_content', ['UACache-C-006'], '6', 'explicit-must', 'security-policy', 'Protect private information stored in the user-agent cache from unintended or malicious access.');
clause('caching', 'cache_nonvolatile_boundary', ['UACache-C-006'], '6', 'implicit-must', 'security-policy', 'Apply access protection to sensitive cache data that survives in non-volatile storage, including data retained across browser restarts.');

// WCMP general-encoding branch selected by the Class C connectionless path.
clause('wcmp', 'client_general_profile', ['WCMP-C-001', 'WCMP-SP-C-002'], '5.4', 'implicit-must', 'transport-boundary', 'Implement the general WCMP message branch used to report WDP processing errors on the selected non-ICMP profile.');
clause('wcmp', 'error_and_diagnostic_roles', ['WCMP-C-001', 'WCMP-SP-C-002'], '5.1', 'implicit-must', 'transport-boundary', 'Accept WCMP as WDP error reporting and as an informational or diagnostic control-message protocol.');
clause('wcmp', 'no_error_to_error', ['WCMP-C-001', 'WCMP-SP-C-002'], '5.1', 'explicit-must', 'error-policy', 'Never generate a WCMP error message in response to another WCMP error message.');
clause('wcmp', 'one_fragment_error', ['WCMP-C-001', 'WCMP-SP-C-002'], '5.1', 'explicit-must', 'error-policy', 'Generate no more than one WCMP error for a fragmented datagram.');
clause('wcmp', 'single_bearer_fragment', ['WCMP-C-001', 'WCMP-SP-C-002'], '5.1', 'explicit-must', 'transport-boundary', 'Encode each WCMP message so it fits in one bearer-level fragment.');
clause('wcmp', 'forged_message_caution', ['WCMP-C-001', 'WCMP-SP-C-002'], '5.1', 'explicit-should', 'security-policy', 'Treat received WCMP messages as potentially forged and avoid immediate broad transaction aborts based only on one error message.');
clause('wcmp', 'general_network_order', ['WCMP-SP-C-002'], '5.5.1', 'implicit-must', 'binary-decoder', 'Encode bit fields most-significant-bit first and two-byte fields with the high-order byte first.');
clause('wcmp', 'general_header_order', ['WCMP-SP-C-002'], '5.5.1', 'grammar', 'binary-decoder', 'Decode every general WCMP message as one Type octet, one Code octet, followed by zero or more type-specific data octets.');
clause('wcmp', 'general_type_dispatch', ['WCMP-SP-C-002', 'WCMP-GEN-C-001', 'WCMP-GEN-C-003', 'WCMP-GEN-C-006'], '5.5.1', 'implicit-must', 'binary-decoder', 'Use Type to select the message data format and Code to select the subtype-specific interpretation.');
clause('wcmp', 'general_type_classes', ['WCMP-SP-C-002'], '5.5.1', 'implicit-must', 'binary-decoder', 'Classify types 0 through 127 as errors, 128 through 191 as informational, and 192 through 255 as reserved.');
clause('wcmp', 'selected_type_code_values', ['WCMP-GEN-C-001', 'WCMP-GEN-C-003', 'WCMP-GEN-C-006'], '5.5.1', 'table', 'binary-decoder', 'Recognize Destination Unreachable type 51, Message Too Big type 60 code 0, and Echo Reply type 179 code 0.');

clause('wcmp', 'destination_unreachable_layout', ['WCMP-GEN-C-001'], '5.5.3.1', 'grammar', 'binary-decoder', 'Decode Destination Unreachable as Type, Code, original destination port, original originator port, and destination address information.');
clause('wcmp', 'destination_unreachable_general_generation', ['WCMP-GEN-C-001'], '5.5.3.1', 'explicit-should', 'error-policy', 'Generate Destination Unreachable when a received WDP datagram cannot be delivered for a reason other than congestion.');
clause('wcmp', 'destination_unreachable_port_required', ['WCMP-GEN-C-001'], '5.5.3.1', 'explicit-must', 'error-policy', 'Generate Destination Unreachable code 4 when no transport listener exists for the datagram destination port.');
clause('wcmp', 'destination_unreachable_no_congestion', ['WCMP-GEN-C-001'], '5.5.3.1', 'explicit-must', 'error-policy', 'Do not generate a Destination Unreachable message for a packet dropped because of congestion.');
clause('wcmp', 'destination_unreachable_codes', ['WCMP-GEN-C-001'], '5.5.3.1', 'table', 'binary-decoder', 'Interpret codes 0, 1, 3, and 4 as no route, administratively prohibited, address unreachable, and port unreachable respectively.');
clause('wcmp', 'destination_unreachable_address', ['WCMP-GEN-C-001'], '5.5.3.1', 'implicit-must', 'binary-decoder', 'Interpret the embedded address information as the destination address of the original datagram.');

clause('wcmp', 'message_too_big_layout', ['WCMP-GEN-C-003'], '5.5.3.3', 'grammar', 'binary-decoder', 'Decode Message Too Big as Type 60, Code 0, original ports, destination address information, and a two-octet maximum message size.');
clause('wcmp', 'message_too_big_buffer_notice', ['WCMP-GEN-C-003'], '5.5.3.3', 'explicit-must', 'error-policy', 'Use Message Too Big to inform a sender of the receiving node buffer-size limit.');
clause('wcmp', 'message_too_big_first_segment', ['WCMP-GEN-C-003'], '5.5.3.3', 'explicit-must', 'error-policy', 'Generate Message Too Big when the first segment arrives and the complete segmented message cannot fit in the available reassembly buffer.');
clause('wcmp', 'message_too_big_address', ['WCMP-GEN-C-003'], '5.5.3.3', 'implicit-must', 'binary-decoder', 'Interpret Message Too Big address information as the destination address of the original datagram.');

clause('wcmp', 'echo_reply_function', ['WCMP-GEN-C-006'], '5.5.3.5', 'explicit-must', 'runtime', 'Receive WCMP Echo Requests and send corresponding Echo Replies.');
clause('wcmp', 'echo_message_layout', ['WCMP-GEN-C-006'], '5.5.3.5', 'grammar', 'binary-decoder', 'Decode echo messages as Type, Code 0, two-octet identifier, two-octet sequence number, and zero or more data octets.');
clause('wcmp', 'echo_reply_type', ['WCMP-GEN-C-006'], '5.5.3.5', 'table', 'binary-decoder', 'Use type 178 for Echo Request and type 179 for Echo Reply.');
clause('wcmp', 'echo_data_identity', ['WCMP-GEN-C-006'], '5.5.3.5', 'explicit-must', 'transport-boundary', 'Return Echo Request data entirely and unmodified in the reply unless the reply would exceed the return-path MTU.');
clause('wcmp', 'echo_mtu_truncation', ['WCMP-GEN-C-006'], '5.5.3.5', 'implicit-must', 'transport-boundary', 'When an Echo Reply would exceed the return-path MTU, truncate only the echoed data enough to fit.');
clause('wcmp', 'echo_correlation_fields', ['WCMP-GEN-C-006'], '5.5.3.5', 'implicit-must', 'state-machine', 'Preserve the request identifier and sequence number so an Echo Reply can be correlated with its Echo Request.');
clause('wcmp', 'echo_reply_rate_limit', ['WCMP-GEN-C-006'], '5.2', 'explicit-may', 'security-policy', 'Permit limits on generated Echo Replies to protect the node and bearer from overload or denial-of-service traffic.');

// Connectionless WSP branch selected for the Class C browser profile.
clause('wsp', 'device_connectionless_mode', ['WSP-C-001', 'WSP-CL-C-001'], '6.4.1', 'implicit-must', 'transport-boundary', 'Provide the selected connectionless WSP device mode without requiring connection-oriented WSP or WTP.');
clause('wsp', 'connectionless_nonconfirmed', ['WSP-C-001', 'WSP-CL-C-001'], '6.4.1', 'implicit-must', 'transport-boundary', 'Exchange method content through non-confirmed facilities and tolerate unreliable peer communication.');
clause('wsp', 'connectionless_method_facility', ['WSP-CL-C-001', 'WSP-CL-C-004', 'WSP-CL-C-005', 'WSP-CL-C-006', 'WSP-CL-C-007'], '6.4.1', 'implicit-must', 'transport-boundary', 'Implement the connectionless method-invocation facility for selected GET and POST requests and replies.');
clause('wsp', 'method_invoke_parameters', ['WSP-CL-C-004', 'WSP-CL-C-006'], '6.4.2.1', 'table', 'transport-boundary', 'Carry server address, client address, transaction identifier, method, request URI, optional headers, and method-permitted request body.');
clause('wsp', 'method_invoke_transparency', ['WSP-CL-C-004', 'WSP-CL-C-006'], '6.4.2.1', 'implicit-must', 'transport-boundary', 'Preserve the addresses, transaction identifier, method, URI, headers, and body from request to peer indication.');
clause('wsp', 'method_http_semantics', ['WSP-CL-C-004', 'WSP-CL-C-006'], '6.4.2.1', 'implicit-must', 'transport-boundary', 'Represent the method, request headers, and request body with semantics equivalent to their HTTP/1.1 counterparts.');
clause('wsp', 'method_body_constraint', ['WSP-CL-C-004', 'WSP-CL-C-006'], '6.4.2.1', 'explicit-must', 'error-policy', 'Do not provide a request body when the invoked HTTP method does not permit an entity body.');
clause('wsp', 'method_result_parameters', ['WSP-CL-C-005', 'WSP-CL-C-007'], '6.4.2.2', 'table', 'transport-boundary', 'Carry client address, server address, transaction identifier, status, optional response headers, and conditional response body in a method result.');
clause('wsp', 'method_result_http_semantics', ['WSP-CL-C-005', 'WSP-CL-C-007'], '6.4.2.2', 'implicit-must', 'transport-boundary', 'Represent result status, response headers, and response body with semantics equivalent to HTTP/1.1.');
clause('wsp', 'method_error_body', ['WSP-CL-C-005', 'WSP-CL-C-007'], '6.4.2.2', 'explicit-should', 'rendering', 'When a result status is an error, preserve any response body that supplies human-displayable error information.');
clause('wsp', 'primitive_role_restrictions', ['WSP-CL-C-001', 'WSP-CL-C-004', 'WSP-CL-C-005', 'WSP-CL-C-006', 'WSP-CL-C-007'], '6.4.3', 'grammar', 'transport-boundary', 'Allow clients to request method invocation and receive results while allowing servers to receive invocations and request results.');
clause('wsp', 'peer_indication_delivery', ['WSP-CL-C-001'], '6.4.3', 'explicit-should', 'transport-boundary', 'Deliver an indication primitive when the corresponding peer request primitive is received.');
clause('wsp', 'communication_failure_local', ['WSP-CL-C-001'], '6.4.4', 'implicit-must', 'error-policy', 'Generate no peer indication when a request cannot be communicated and handle exceptional conditions as a local implementation matter.');
clause('wsp', 'unitdata_direct_mapping', ['WSP-C-001', 'WSP-CL-C-001'], '7.2', 'implicit-must', 'transport-boundary', 'Map each connectionless service request directly to one WSP PDU sent by an underlying Unitdata request, without a WSP state machine.');
clause('wsp', 'unitdata_security_equivalence', ['WSP-CL-C-001'], '7.2', 'implicit-must', 'transport-boundary', 'Preserve one-to-one primitive behavior whether Unitdata is supplied directly by WDP or by an optional security SAP.');
clause('wsp', 'unitdata_receive_dispatch', ['WSP-CL-C-001', 'WSP-CL-C-005', 'WSP-CL-C-007'], '7.2', 'table', 'transport-boundary', 'Dispatch received method and reply PDUs to their corresponding method-invoke and method-result indication primitives.');
clause('wsp', 'transport_error_ignored', ['WSP-CL-C-001'], '7.2', 'table', 'error-policy', 'Ignore underlying transport error indications at the connectionless WSP protocol layer.');
clause('wsp', 'out_of_band_parameters', ['WSP-CL-C-001'], '7.2', 'explicit-may', 'transport-boundary', 'Permit MRU and persistent-header settings to be agreed out of band, including by implication from a well-known server port.');

clause('wsp', 'integer_network_order', ['WSP-CL-C-001', 'WSP-CL-C-003'], '8.1.1', 'implicit-must', 'binary-decoder', 'Encode multi-octet integer values in big-endian network octet order.');
clause('wsp', 'connectionless_tid_required', ['WSP-CL-C-004', 'WSP-CL-C-005', 'WSP-CL-C-006', 'WSP-CL-C-007'], '8.2.1', 'explicit-must', 'binary-decoder', 'Include the one-octet transaction identifier before the PDU type in every selected connectionless method or reply PDU.');
clause('wsp', 'tid_peer_correlation', ['WSP-CL-C-004', 'WSP-CL-C-005', 'WSP-CL-C-006', 'WSP-CL-C-007'], '8.2.1', 'implicit-must', 'state-machine', 'Pass the TID transparently through service primitives and use it to associate a reply with its connectionless request.');
clause('wsp', 'pdu_type_dispatch', ['WSP-CL-C-004', 'WSP-CL-C-005', 'WSP-CL-C-006', 'WSP-CL-C-007'], '8.2.1', 'implicit-must', 'binary-decoder', 'Use the PDU type octet to select the function and type-specific remainder of the WSP PDU.');
clause('wsp', 'selected_pdu_assignments', ['WSP-CL-C-004', 'WSP-CL-C-005', 'WSP-CL-C-006', 'WSP-CL-C-007'], 'appendix-a', 'table', 'binary-decoder', 'Use assigned PDU type 0x40 for GET, 0x60 for POST, and 0x04 for Reply.');

clause('wsp', 'get_pdu_method', ['WSP-CL-C-004'], '8.2.3.1', 'implicit-must', 'binary-decoder', 'Encode the selected HTTP GET method using the Get PDU format.');
clause('wsp', 'get_pdu_layout', ['WSP-CL-C-004'], '8.2.3.1', 'grammar', 'binary-decoder', 'Encode Get contents as a uintvar URI length, exactly that many URI octets, then request headers through the end of the SDU.');
clause('wsp', 'get_uri_no_nul', ['WSP-CL-C-004'], '8.2.3.1', 'explicit-must', 'binary-decoder', 'Exclude a storage string terminator from the length-delimited Get URI field.');
clause('wsp', 'post_pdu_method', ['WSP-CL-C-006'], '8.2.3.2', 'implicit-must', 'binary-decoder', 'Encode the selected HTTP POST method using the Post PDU format.');
clause('wsp', 'post_pdu_layout', ['WSP-CL-C-006'], '8.2.3.2', 'grammar', 'binary-decoder', 'Encode Post contents as URI length, combined Content-Type-plus-headers length, URI, Content-Type, headers, then body data.');
clause('wsp', 'post_uri_no_nul', ['WSP-CL-C-006'], '8.2.3.2', 'explicit-must', 'binary-decoder', 'Exclude a storage string terminator from the length-delimited Post URI field.');
clause('wsp', 'post_content_type', ['WSP-CL-C-006', 'WSP-CL-C-003'], '8.2.3.2', 'implicit-must', 'binary-decoder', 'Encode the Post body media type using the WSP Content-Type field-value grammar before the remaining headers.');
clause('wsp', 'post_body_to_sdu_end', ['WSP-CL-C-006'], '8.2.3.2', 'implicit-must', 'binary-decoder', 'Treat every octet after the declared headers as request body data through the end of the transport SDU.');
clause('wsp', 'reply_pdu_layout', ['WSP-CL-C-005', 'WSP-CL-C-007'], '8.2.3.3', 'grammar', 'binary-decoder', 'Encode Reply contents as status, combined Content-Type-plus-headers length, Content-Type, headers, then response data.');
clause('wsp', 'reply_status_assignment', ['WSP-CL-C-005', 'WSP-CL-C-007'], 'appendix-a', 'table', 'binary-decoder', 'Map HTTP/1.1 response statuses to and from every assigned single-octet WSP status in Table 36.');
clause('wsp', 'reply_content_type', ['WSP-CL-C-005', 'WSP-CL-C-007', 'WSP-CL-C-003'], '8.2.3.3', 'implicit-must', 'binary-decoder', 'Decode the Reply body media type before the remaining response headers.');
clause('wsp', 'reply_body_to_sdu_end', ['WSP-CL-C-005', 'WSP-CL-C-007'], '8.2.3.3', 'implicit-must', 'binary-decoder', 'Treat every octet after the declared Reply headers as response body data through the end of the transport SDU.');

clause('wsp', 'header_http_compatibility', ['WSP-CL-C-003'], '8.4.1', 'implicit-must', 'binary-decoder', 'Encode WSP header fields as compact field-name/value pairs whose semantics remain compatible with HTTP/1.1.');
clause('wsp', 'header_compaction_forms', ['WSP-CL-C-003'], '8.4.1', 'table', 'binary-decoder', 'Support well-known binary tokens, binary numeric/date/quality values, and mixed binary or text strings without losing header semantics.');
clause('wsp', 'header_name_version_choice', ['WSP-CL-C-003', 'WSP-CL-C-020'], '8.4.1.1', 'explicit-must', 'binary-decoder', 'Use a well-known field-name token only when its encoding version is supported; otherwise encode the field name as text.');
clause('wsp', 'header_default_page', ['WSP-CL-C-003'], '8.4.1.1', 'implicit-must', 'binary-decoder', 'Start every header set on default code page 1 and keep a shifted page active only through that header set.');
clause('wsp', 'header_code_page_ranges', ['WSP-CL-C-003'], '8.4.1.1', 'table', 'binary-decoder', 'Reserve code page 1 for defaults, 2 through 15 for WAP, 16 through 127 for applications, and 128 through 255 for future use.');
clause('wsp', 'header_extension_page_agreement', ['WSP-CL-C-003'], '8.4.1.1', 'explicit-must', 'binary-decoder', 'Use application-page single-octet field names only after agreement; otherwise use Token-text field names.');
clause('wsp', 'header_value_encoding_choice', ['WSP-CL-C-003'], '8.4.1.2', 'explicit-must', 'binary-decoder', 'Use compact syntax for well-known binary field values and textual values whenever the field name is encoded as text.');
clause('wsp', 'header_value_length_prefix', ['WSP-CL-C-003'], '8.4.1.2', 'table', 'binary-decoder', 'Interpret first-octet ranges as short length, uintvar-following length, NUL-terminated text, or terminal seven-bit encoded value.');
clause('wsp', 'header_unknown_value_skip', ['WSP-CL-C-003'], '8.4.1.2', 'implicit-must', 'binary-decoder', 'Determine and skip an unrecognized field value from its generic length form without interpreting its detailed syntax.');
clause('wsp', 'header_list_expansion', ['WSP-CL-C-003'], '8.4.1.3', 'explicit-must', 'binary-decoder', 'Expand an HTTP comma-list header into ordered repeated WSP fields before applying the well-known field encoding rule.');
clause('wsp', 'header_syntax_registry', ['WSP-CL-C-003'], '8.4.2', 'table', 'binary-decoder', 'Implement the complete effective WSP 8.4.2 header grammar registry, including the SIN-corrected Expect field encoding.');
clause('wsp', 'header_field_assignments', ['WSP-CL-C-003', 'WSP-CL-C-020'], 'appendix-a', 'table', 'binary-decoder', 'Implement every default-page header name token and minimum encoding version in effective Table 39 without reusing deprecated assignments.');
clause('wsp', 'expect_sin_encoding', ['WSP-CL-C-003'], '3.3', 'implicit-must', 'binary-decoder', 'Apply the effective SIN 001 replacement grammar for the Expect header rather than the superseded base encoding.', 'wsp-sin-001');

clause('wsp', 'encoding_version_required', ['WSP-CL-C-020'], '8.4.2.70', 'explicit-must', 'transport-boundary', 'Include the hop-by-hop Encoding-Version header in every connectionless request and reply.');
clause('wsp', 'encoding_version_absent_default', ['WSP-CL-C-020'], '8.4.2.70', 'explicit-must', 'binary-decoder', 'When Encoding-Version is absent, assume only version 1.2-or-lower encodings for the default page and the lowest version for an extension page.');
clause('wsp', 'encoding_version_client_selection', ['WSP-CL-C-020'], '8.4.2.70', 'explicit-must', 'transport-boundary', 'Send the highest encoding version the client implements that does not exceed the known server maximum.');
clause('wsp', 'encoding_version_no_overclaim', ['WSP-CL-C-020'], '8.4.2.70', 'explicit-must', 'transport-boundary', 'Never advertise or emit a binary encoding version for which the sending peer is not compliant.');
clause('wsp', 'encoding_version_extension_pages', ['WSP-CL-C-020'], '8.4.2.70', 'explicit-should', 'transport-boundary', 'Send a dedicated Encoding-Version value for each used extended header code page.');
clause('wsp', 'encoding_version_peer_cache', ['WSP-CL-C-020'], '8.4.2.70', 'explicit-may', 'state-machine', 'Cache the server-supported encoding version and use it to choose compatible encodings on later requests.');
clause('wsp', 'unsupported_encoding_retry', ['WSP-CL-C-003', 'WSP-CL-C-020'], '8.4.2.70', 'implicit-must', 'error-policy', 'On a peer rejection of unsupported binary encoding, retry with textual encoding compatible with the returned supported-version information.');
clause('wsp', 'encoding_version_text_form', ['WSP-CL-C-020'], '8.4.3.1', 'grammar', 'binary-decoder', 'Encode textual Encoding-Version as an optional code-page identity plus major-dot-minor version using the defined text-value rules.');
clause('wsp', 'encoding_version_hop_by_hop', ['WSP-CL-C-020'], '8.4.4', 'implicit-must', 'transport-boundary', 'Treat Encoding-Version as hop-by-hop rather than forwarding it as an end-to-end application header.');

// WDP selected CDPD/UDP/IPv4 Class C transport clauses.
clause('wdp', 'consistent_transport_service', ['WDP-C-001', 'WDP-CORE-C-001'], '5.1', 'implicit-must', 'transport-boundary', 'Expose the same WDP transport service and primitive contract to upper WAP layers across supported bearer adaptations.');
clause('wdp', 'application_port_addressing', ['WDP-CORE-C-001', 'WDP-NA-C-006', 'WDP-NA-C-007'], '5.1', 'implicit-must', 'transport-boundary', 'Provide source and destination port addressing for the higher-layer protocol or application above WDP.');
clause('wdp', 'bearer_transparency', ['WDP-C-001', 'WDP-CORE-C-001'], '5.1', 'implicit-must', 'transport-boundary', 'Keep bearer-specific mechanics below the transport service access point so upper layers can operate transparently.');
clause('wdp', 'simultaneous_instances', ['WDP-C-001', 'WDP-CORE-C-001', 'WDP-NA-C-006', 'WDP-NA-C-007'], '5.2', 'implicit-must', 'transport-boundary', 'Use port numbers to multiplex multiple simultaneous higher-layer communication instances over one WDP bearer service.');
clause('wdp', 'adaptation_layer_boundary', ['WDP-C-001', 'WDP-CT-C-002'], '5.2', 'implicit-must', 'transport-boundary', 'Terminate bearer-specific adaptation at the WDP boundary without changing the service presented to WSP or other upper layers.');
clause('wdp', 'ip_bearer_requires_udp', ['WDP-C-001', 'WDP-CT-C-002', 'WDP-NA-C-003'], '5.3', 'explicit-must', 'transport-boundary', 'Use UDP as the WDP protocol whenever the selected bearer provides IP.');
clause('wdp', 'cdpd_udp_ip_profile', ['WDP-CT-C-002', 'WDP-NA-C-003'], '5.4.3', 'implicit-must', 'transport-boundary', 'Declare the selected CDPD bearer as an IP-capable profile whose WDP datagram service is UDP over IPv4.');
clause('wdp', 'unitdata_request_anytime', ['WDP-PF-C-001'], '6.3.1.1', 'implicit-must', 'transport-boundary', 'Allow T-DUnitdata.request without establishing a prior transport connection.');
clause('wdp', 'unitdata_request_parameters', ['WDP-CORE-C-001', 'WDP-PF-C-001', 'WDP-NA-C-000', 'WDP-NA-C-003', 'WDP-NA-C-006', 'WDP-NA-C-007'], '6.3.1.1', 'table', 'transport-boundary', 'Require source address, source port, destination address, destination port, and user data on every T-DUnitdata request.');
clause('wdp', 'unitdata_indication_parameters', ['WDP-CORE-C-001', 'WDP-PF-C-002', 'WDP-NA-C-000', 'WDP-NA-C-003', 'WDP-NA-C-006', 'WDP-NA-C-007'], '6.3.1.1', 'table', 'transport-boundary', 'Deliver source address, source port, and user data on T-DUnitdata indication, with destination address and port when available.');
clause('wdp', 'destination_address_semantics', ['WDP-PF-C-001', 'WDP-PF-C-002', 'WDP-NA-C-000', 'WDP-NA-C-003'], '6.3.1.1', 'implicit-must', 'transport-boundary', 'Treat the destination address as the network identity of the receiving device for the submitted user data.');
clause('wdp', 'source_address_semantics', ['WDP-PF-C-001', 'WDP-PF-C-002', 'WDP-NA-C-000', 'WDP-NA-C-003'], '6.3.1.1', 'implicit-must', 'transport-boundary', 'Treat the source address as the unique network identity of the device issuing the transport request.');
clause('wdp', 'destination_port_semantics', ['WDP-PF-C-001', 'WDP-PF-C-002', 'WDP-NA-C-006'], '6.3.1.1', 'implicit-must', 'transport-boundary', 'Bind the destination port to the destination application or upper-layer protocol for that communication instance.');
clause('wdp', 'source_port_semantics', ['WDP-PF-C-001', 'WDP-PF-C-002', 'WDP-NA-C-007'], '6.3.1.1', 'implicit-must', 'transport-boundary', 'Bind the source port to the requesting application or upper-layer protocol for that communication instance.');
clause('wdp', 'unitdata_content_transparency', ['WDP-CORE-C-001', 'WDP-PF-C-001', 'WDP-PF-C-002'], '6.3.1.1', 'implicit-must', 'transport-boundary', 'Transmit and deliver the complete service data unit without manipulating its content.');
clause('wdp', 'protocol_required_port_fields', ['WDP-CORE-C-001', 'WDP-NA-C-006', 'WDP-NA-C-007'], '7.1', 'implicit-must', 'binary-decoder', 'Carry both destination and source port fields in the selected WDP protocol mapping.');
clause('wdp', 'ip_mapping_is_udp', ['WDP-C-001', 'WDP-CT-C-002', 'WDP-NA-C-003'], '7.2', 'implicit-must', 'transport-boundary', 'Map WDP directly to UDP for every selected bearer on which IP routing is available.');
clause('wdp', 'ip_mapping_fragmentation', ['WDP-C-001', 'WDP-CT-C-002', 'WDP-NA-C-003'], '7.2', 'implicit-must', 'transport-boundary', 'Rely on IPv4 fragmentation and reassembly below UDP rather than adding a second WDP segmentation header on the CDPD/IP path.');
clause('wdp', 'wap_port_registry', ['WDP-NA-C-006', 'WDP-NA-C-007'], 'appendix-b', 'table', 'transport-boundary', 'Recognize the complete WAP port assignment table, including connectionless, session, secure, push, vCard, and vCalendar services.');
clause('wdp', 'selected_wsp_port', ['WDP-C-001', 'WDP-NA-C-006'], 'appendix-b', 'table', 'transport-boundary', 'Use registered UDP/WDP port 9200 for the selected non-secure connectionless WSP session service.');
clause('wdp', 'selected_bearer_assignment', ['WDP-CT-C-002', 'WDP-NA-C-003'], 'appendix-c', 'table', 'transport-boundary', 'Represent the AMPS/CDPD/IPv4 network-bearer-address combination with assigned bearer value 0x0D when that registry is carried.');

clause('wdp', 'udp_unreliable_datagrams', ['WDP-C-001', 'WDP-CORE-C-001'], 'introduction', 'implicit-must', 'transport-boundary', 'Expose UDP as a connectionless datagram service that does not guarantee delivery, ordering, or duplicate suppression.', 'rfc-768');
clause('wdp', 'udp_header_layout', ['WDP-CORE-C-001', 'WDP-NA-C-006', 'WDP-NA-C-007'], 'format', 'grammar', 'binary-decoder', 'Encode and decode the UDP header as 16-bit source port, destination port, length, and checksum fields followed by data.', 'rfc-768');
clause('wdp', 'udp_source_port_zero', ['WDP-NA-C-007'], 'fields', 'table', 'binary-decoder', 'Use source port zero when the sender does not supply a meaningful reply port, and otherwise preserve the selected source port.', 'rfc-768');
clause('wdp', 'udp_destination_port_context', ['WDP-NA-C-006', 'WDP-NA-C-003'], 'fields', 'implicit-must', 'transport-boundary', 'Interpret a UDP destination port within the context of its destination IPv4 address.', 'rfc-768');
clause('wdp', 'udp_length_bounds', ['WDP-CORE-C-001'], 'fields', 'implicit-must', 'binary-decoder', 'Interpret UDP length as header plus data octets and reject values smaller than the eight-octet header.', 'rfc-768');
clause('wdp', 'udp_checksum_coverage', ['WDP-CORE-C-001', 'WDP-NA-C-003'], 'fields', 'implicit-must', 'binary-decoder', 'Compute the UDP checksum over the IPv4 pseudo-header, UDP header, and data using 16-bit ones-complement arithmetic.', 'rfc-768');
clause('wdp', 'udp_checksum_padding', ['WDP-CORE-C-001'], 'fields', 'implicit-must', 'binary-decoder', 'Zero-pad an odd checksum input to a two-octet boundary without transmitting the padding octet.', 'rfc-768');
clause('wdp', 'udp_checksum_zero_encoding', ['WDP-CORE-C-001'], 'fields', 'implicit-must', 'binary-decoder', 'Transmit an arithmetically computed zero UDP checksum as all one bits.', 'rfc-768');
clause('wdp', 'udp_checksum_omission', ['WDP-CORE-C-001'], 'fields', 'explicit-may', 'binary-decoder', 'Accept an all-zero UDP checksum field as the IPv4 sender choosing not to generate a UDP checksum.', 'rfc-768');
clause('wdp', 'udp_receive_interface', ['WDP-PF-C-002', 'WDP-NA-C-003', 'WDP-NA-C-007'], 'interface', 'explicit-should', 'transport-boundary', 'Provide receive-port creation and return received data with its source IPv4 address and source port.', 'rfc-768');
clause('wdp', 'udp_send_interface', ['WDP-PF-C-001', 'WDP-NA-C-003', 'WDP-NA-C-006', 'WDP-NA-C-007'], 'interface', 'explicit-should', 'transport-boundary', 'Provide datagram send using explicit data, source and destination ports, and source and destination IPv4 addresses.', 'rfc-768');
clause('wdp', 'udp_ip_interface_metadata', ['WDP-CORE-C-001', 'WDP-NA-C-003'], 'ip-interface', 'explicit-must', 'transport-boundary', 'Make source address, destination address, and IP protocol metadata available at the UDP/IP boundary.', 'rfc-768');
clause('wdp', 'udp_ip_protocol_number', ['WDP-CT-C-002', 'WDP-NA-C-003'], 'protocol-number', 'table', 'binary-decoder', 'Identify UDP with IPv4 protocol number 17.', 'rfc-768');

clause('wdp', 'ipv4_independent_datagrams', ['WDP-C-001', 'WDP-CORE-C-001', 'WDP-NA-C-003'], '1.4', 'implicit-must', 'transport-boundary', 'Treat each IPv4 datagram independently without a transport connection or logical circuit.', 'rfc-791');
clause('wdp', 'ipv4_fixed_address_size', ['WDP-NA-C-000', 'WDP-NA-C-003'], '2.3', 'implicit-must', 'binary-decoder', 'Represent each selected IPv4 source or destination address as four octets.', 'rfc-791');
clause('wdp', 'ipv4_header_layout', ['WDP-NA-C-003'], '3.1', 'grammar', 'binary-decoder', 'Decode the complete IPv4 header field order and widths before passing its UDP payload to WDP.', 'rfc-791');
clause('wdp', 'ipv4_version_and_ihl', ['WDP-NA-C-003'], '3.1', 'table', 'binary-decoder', 'Require IPv4 version value 4 and use IHL in 32-bit words with a minimum valid value of five.', 'rfc-791');
clause('wdp', 'ipv4_total_length', ['WDP-CORE-C-001', 'WDP-NA-C-003'], '3.1', 'implicit-must', 'binary-decoder', 'Interpret IPv4 total length as header plus payload octets with a maximum representable value of 65,535.', 'rfc-791');
clause('wdp', 'ipv4_baseline_receive_size', ['WDP-CORE-C-001', 'WDP-NA-C-003'], '3.1', 'explicit-must', 'transport-boundary', 'Accept IPv4 datagrams up to 576 octets whether received whole or reassembled from fragments.', 'rfc-791');
clause('wdp', 'ipv4_large_send_guard', ['WDP-CORE-C-001', 'WDP-NA-C-003'], '3.1', 'explicit-should', 'transport-boundary', 'Send an IPv4 datagram larger than 576 octets only with assurance that the destination can accept it.', 'rfc-791');
clause('wdp', 'ipv4_fragmentation_location', ['WDP-CORE-C-001', 'WDP-NA-C-003'], '3.2', 'implicit-must', 'transport-boundary', 'Allow IPv4 fragmentation at gateways and reassemble fragments at the destination IP module below WDP.', 'rfc-791');
clause('wdp', 'ipv4_fragment_reassembly_key', ['WDP-CORE-C-001', 'WDP-NA-C-003'], '3.2', 'implicit-must', 'binary-decoder', 'Group IPv4 fragments by identification, source, destination, and protocol, then place data using fragment offsets and the final-fragment marker.', 'rfc-791');
clause('wdp', 'ipv4_dont_fragment', ['WDP-CORE-C-001', 'WDP-NA-C-003'], '3.2', 'explicit-must', 'error-policy', 'Do not fragment a datagram whose DF bit is set; discard it when the route cannot carry it intact.', 'rfc-791');
clause('wdp', 'ipv4_ttl_zero', ['WDP-NA-C-003'], '3.1', 'explicit-must', 'error-policy', 'Destroy an IPv4 datagram when its time-to-live value reaches zero.', 'rfc-791');
clause('wdp', 'ipv4_header_checksum', ['WDP-NA-C-003'], '3.1', 'explicit-must', 'binary-decoder', 'Verify the ones-complement IPv4 header checksum and discard a datagram immediately when verification fails.', 'rfc-791');
clause('wdp', 'ipv4_source_destination_fields', ['WDP-PF-C-001', 'WDP-PF-C-002', 'WDP-NA-C-003'], '3.1', 'table', 'binary-decoder', 'Preserve the 32-bit IPv4 source and destination header fields across the WDP request and indication boundary.', 'rfc-791');
clause('wdp', 'ipv4_robust_interoperation', ['WDP-NA-C-003'], '3.2', 'explicit-must', 'binary-decoder', 'Send well-formed IPv4 datagrams and accept every received datagram whose meaning can be interpreted safely.', 'rfc-791');
clause('wdp', 'ipv4_no_reliability', ['WDP-C-001', 'WDP-CORE-C-001'], '1.4', 'implicit-must', 'transport-boundary', 'Do not imply acknowledgments, retransmission, data error control, or flow control at the IPv4 layer.', 'rfc-791');

// WMLScript selected Class C interpreter clauses.
clause('wmlscript', 'bytecode_compilation_unit', ['WMLS-C-069'], '8', 'explicit-must', 'binary-decoder', 'Accept compiled WMLScript compilation units in the effective chapter 9 binary format rather than treating source text or project bytecode as WAP bytecode.');
clause('wmlscript', 'interpreter_execution_state', ['WMLS-C-069'], '8.1', 'implicit-must', 'runtime', 'Maintain an instruction pointer, function variables, operand stack, and function-call stack while executing a WMLScript function.');
clause('wmlscript', 'interpreter_call_result', ['WMLS-C-069'], '8.1', 'implicit-must', 'runtime', 'Return control and the function return value to the caller after normal WMLScript function completion.');
clause('wmlscript', 'standard_library_boundary', ['WMLS-C-070'], '6.6.1', 'explicit-must', 'runtime', 'Expose every required WMLScript standard library through the interpreter call boundary defined by the separate selected library ledger.');

clause('wmlscript', 'conversion_string_matrix', ['WMLS-C-072'], '6.8.2', 'table', 'runtime', 'Convert integers, floating-point values, and booleans to their specified string forms, while rejecting conversion from invalid.');
clause('wmlscript', 'conversion_string_numeric_grammar', ['WMLS-C-072'], '6.8.2', 'explicit-must', 'runtime', 'Produce numeric strings that satisfy the decimal numeric-string grammar and preserve the represented numeric value.');
clause('wmlscript', 'conversion_integer_matrix', ['WMLS-C-073'], '6.8.3', 'table', 'runtime', 'Convert decimal-integer strings and booleans to integers, while rejecting floating-point and invalid inputs.');
clause('wmlscript', 'conversion_integer_string_grammar', ['WMLS-C-073'], '6.8.3', 'explicit-must', 'runtime', 'Convert a string to integer only when the entire string is a valid decimal integer representation.');
clause('wmlscript', 'conversion_boolean_matrix', ['WMLS-C-075'], '6.8.5', 'table', 'runtime', 'Convert empty string, integer zero, and floating zero to false; convert other string and numeric values to true; reject invalid.');
clause('wmlscript', 'conversion_invalid_prohibited', ['WMLS-C-076'], '6.8.6', 'explicit-must', 'runtime', 'Do not convert another data type into invalid; create invalid only as a literal or operation-error result.');
clause('wmlscript', 'conversion_invalid_propagation', ['WMLS-C-076', 'WMLS-C-077'], '6.8.6', 'implicit-must', 'runtime', 'Propagate invalid through operators except where the operator definition explicitly provides different invalid behavior.');
clause('wmlscript', 'conversion_summary_matrix', ['WMLS-C-072', 'WMLS-C-073', 'WMLS-C-075', 'WMLS-C-076'], '6.8.7', 'table', 'runtime', 'Implement the complete effective automatic-conversion matrix for Boolean, Integer, Floating-point, String, and Invalid source values.');
clause('wmlscript', 'operator_conversion_order', ['WMLS-C-077'], '6.9', 'explicit-must', 'runtime', 'Apply each operator conversion step in specification order until an operation and operand types are selected or invalid is returned.');
clause('wmlscript', 'operator_conversion_atomicity', ['WMLS-C-077'], '6.9', 'implicit-must', 'runtime', 'Perform an operation only when every required operand conversion is legal; otherwise continue its ordered rules or return invalid.');
clause('wmlscript', 'operator_numeric_precedence', ['WMLS-C-077'], '6.9', 'table', 'runtime', 'Apply string, floating-point, and integer operation precedence exactly for multi-typed arithmetic, addition, and comparison operands.');
clause('wmlscript', 'operator_conversion_result_invalid', ['WMLS-C-077'], '6.9', 'implicit-must', 'runtime', 'Return invalid when a selected legal conversion itself produces invalid.');

clause('wmlscript', 'url_named_compilation_units', ['WMLS-C-078'], '8.3', 'implicit-must', 'transport-boundary', 'Name and fetch WMLScript compilation units by URL using a protocol with HTTP semantics.');
clause('wmlscript', 'url_scheme_support', ['WMLS-C-078'], '8.3.1', 'explicit-must', 'transport-boundary', 'Support the URL schemes required by the selected WAE profile.');
clause('wmlscript', 'fragment_function_identity', ['WMLS-C-079'], '8.3.2', 'implicit-must', 'runtime', 'Resolve a URL fragment identifier as the external function name within the referenced WMLScript compilation unit.');
clause('wmlscript', 'fragment_document_form', ['WMLS-C-079'], '8.3.2', 'grammar', 'parser', 'Parse a function fragment after a hash mark appended to the compilation-unit URL.');
clause('wmlscript', 'url_call_grammar', ['WMLS-C-080'], '8.3.3', 'grammar', 'parser', 'Parse URL-call fragments as a function name followed by parentheses containing zero or more comma-separated literal arguments.');
clause('wmlscript', 'url_call_literal_only', ['WMLS-C-080'], '8.3.3', 'error-condition', 'parser', 'Reject expressions and nested function calls in URL-call argument lists; accept only the defined invalid, boolean, numeric, and string literals.');
clause('wmlscript', 'url_call_unescape_before_parse', ['WMLS-C-080'], '8.3.5', 'explicit-must', 'parser', 'Apply URL and containing-content unescaping before parsing the URL-call fragment grammar.');
clause('wmlscript', 'url_call_access_first', ['WMLS-C-081', 'WMLS-C-087'], '8.3.4', 'implicit-must', 'security-policy', 'Perform compilation-unit access control before matching or invoking the requested external function.');
clause('wmlscript', 'url_call_external_match', ['WMLS-C-079', 'WMLS-C-081', 'WMLS-C-087'], '8.3.4', 'implicit-must', 'runtime', 'Match the fragment function name only against externally callable functions and fail when no match exists.');
clause('wmlscript', 'url_call_typed_arguments', ['WMLS-C-081'], '8.3.4', 'implicit-must', 'runtime', 'Parse each fragment literal into its corresponding WMLScript data type and pass arguments in source order.');
clause('wmlscript', 'url_call_invalid_parameters', ['WMLS-C-080', 'WMLS-C-081'], '8.3.4', 'error-condition', 'error-policy', 'Fail a URL call when its parameter list has invalid syntax or does not match the target function arity.');
clause('wmlscript', 'relative_url_resolution', ['WMLS-C-082'], '8.3.6', 'explicit-must', 'transport-boundary', 'Resolve relative compilation-unit URLs using RFC 2396 rules and the current compilation-unit URL as base.');
clause('wmlscript', 'argument_stack_order', ['WMLS-C-083'], '8.4.1', 'explicit-must', 'runtime', 'Push function arguments onto the operand stack in declaration order, beginning with the first argument.');
clause('wmlscript', 'argument_call_initialization', ['WMLS-C-083'], '8.4.1', 'explicit-must', 'runtime', 'Pop call arguments and use them to initialize the matching callee argument variables without reordering.');
clause('wmlscript', 'argument_variable_indexes', ['WMLS-C-084'], '8.4.2', 'explicit-must', 'runtime', 'Allocate argument variable indexes consecutively from zero in operand-stack order and match the function argument count.');
clause('wmlscript', 'local_variable_indexes', ['WMLS-C-084'], '8.4.2', 'explicit-must', 'runtime', 'Allocate local-variable indexes consecutively after the final argument index and match the declared local count.');
clause('wmlscript', 'automatic_empty_return', ['WMLS-C-085'], '8.4.3', 'explicit-must', 'runtime', 'Return an empty string when execution reaches a function end without a return instruction.');
clause('wmlscript', 'local_empty_initialization', ['WMLS-C-086'], '8.4.4', 'explicit-should', 'runtime', 'Initialize every function local variable to an empty string before executing the function body.');
clause('wmlscript', 'external_keyword_gate', ['WMLS-C-087'], '8.5', 'explicit-must', 'security-policy', 'Permit calls from another compilation unit only to functions marked external.');
clause('wmlscript', 'access_domain_path_gate', ['WMLS-C-087'], '8.5', 'explicit-must', 'security-policy', 'Permit an external call only when its caller matches the compilation unit access-domain and access-path restrictions.');
clause('wmlscript', 'access_denial_error', ['WMLS-C-087'], '8.5', 'error-condition', 'error-policy', 'Reject a protected compilation-unit call as an access violation without executing the target function.');

clause('wmlscript', 'binary_data_type_registry', ['WMLS-C-088'], '9.1.1', 'table', 'binary-decoder', 'Decode every defined bit, byte, signed, unsigned, multi-byte integer, and float32 field type with its specified width and representation.');
clause('wmlscript', 'binary_network_order', ['WMLS-C-088'], '9.1.1', 'explicit-must', 'binary-decoder', 'Decode multi-byte integers and bit fields in most-significant-first network order.');
clause('wmlscript', 'multibyte_integer_continuation', ['WMLS-C-089'], '9.1.2', 'grammar', 'binary-decoder', 'Decode multi-byte integers from seven-bit groups whose high bit is set on every non-final octet and clear on the final octet.');
clause('wmlscript', 'multibyte_integer_order', ['WMLS-C-089'], '9.1.2', 'implicit-must', 'binary-decoder', 'Combine multi-byte integer octets and value bits in most-significant-group-first order.');
clause('wmlscript', 'multibyte_integer_unused_zero', ['WMLS-C-089'], '9.1.2', 'explicit-must', 'binary-decoder', 'Require unused value bits in the initial multi-byte integer octet to be zero.');
clause('wmlscript', 'character_set_mibenum', ['WMLS-C-090'], '9.1.3', 'implicit-must', 'binary-decoder', 'Interpret encoded character-set identities as IANA MIBenum values.');
clause('wmlscript', 'character_set_native_execution', ['WMLS-C-069', 'WMLS-C-090'], '8.2', 'explicit-must', 'runtime', 'Perform all WMLScript string operations in one native interpreter character set, transcoding only at input or output boundaries.');
clause('wmlscript', 'character_string_byte_lengths', ['WMLS-C-090'], '9.1.3', 'implicit-must', 'binary-decoder', 'Interpret encoded string lengths as byte counts in the declared transfer encoding rather than character counts.');
clause('wmlscript', 'bytecode_section_order', ['WMLS-C-069', 'WMLS-C-091', 'WMLS-C-092', 'WMLS-C-093', 'WMLS-C-094'], '9.2', 'table', 'binary-decoder', 'Decode each compilation unit in header, constant pool, pragma pool, then function pool order.');
clause('wmlscript', 'bytecode_header_version', ['WMLS-C-091'], '9.3', 'table', 'binary-decoder', 'Decode the version byte as major-minus-one and minor nibbles, with effective version 1.1 encoded as 0x01.');
clause('wmlscript', 'bytecode_header_code_size', ['WMLS-C-091'], '9.3', 'implicit-must', 'binary-decoder', 'Interpret CodeSize as the exact byte count following the version and encoded size field.');
clause('wmlscript', 'constant_pool_count', ['WMLS-C-092'], '9.4', 'implicit-must', 'binary-decoder', 'Decode exactly NumberOfConstants sequential entries and assign zero-based indexes by pool order.');
clause('wmlscript', 'constant_pool_charset', ['WMLS-C-090', 'WMLS-C-092'], '9.4', 'implicit-must', 'binary-decoder', 'Use the constant-pool character-set MIBenum for string constants encoded with the external character definition.');
clause('wmlscript', 'constant_type_registry', ['WMLS-C-092'], '9.4', 'table', 'binary-decoder', 'Decode constant types 0 through 6 as signed integers, float32, UTF-8 string, empty string, or externally encoded string, and reject reserved types.');
clause('wmlscript', 'constant_integer_widths', ['WMLS-C-092'], '9.4', 'table', 'binary-decoder', 'Decode signed integer constants in the selected 8-bit, 16-bit, or 32-bit two-complement representation.');
clause('wmlscript', 'constant_string_lengths', ['WMLS-C-090', 'WMLS-C-092'], '9.4', 'grammar', 'binary-decoder', 'Decode length-prefixed UTF-8 and externally encoded string constants without requiring a terminating null octet.');
clause('wmlscript', 'constant_embedded_null', ['WMLS-C-092'], '9.4', 'explicit-must', 'binary-decoder', 'Preserve embedded null characters inside length-delimited WMLScript string constants.');
clause('wmlscript', 'pragma_pool_count', ['WMLS-C-093'], '9.5', 'implicit-must', 'binary-decoder', 'Decode exactly NumberOfPragmas sequential pragma records.');
clause('wmlscript', 'pragma_type_registry', ['WMLS-C-093'], '9.5', 'table', 'binary-decoder', 'Decode pragma types 0 through 3 as access domain, access path, user-agent property, or user-agent property with scheme, and reject reserved types.');
clause('wmlscript', 'pragma_access_uniqueness', ['WMLS-C-087', 'WMLS-C-093'], '9.5', 'explicit-must', 'binary-decoder', 'Allow at most one access-domain and one access-path pragma in a compilation unit.');
clause('wmlscript', 'pragma_string_indexes', ['WMLS-C-093'], '9.5', 'explicit-must', 'binary-decoder', 'Require access and meta pragma indexes to reference string constants of the permitted constant types.');
clause('wmlscript', 'function_pool_count', ['WMLS-C-094'], '9.6', 'implicit-must', 'binary-decoder', 'Decode the declared function count, external function-name table, and exactly that many function records.');
clause('wmlscript', 'function_pool_indexes', ['WMLS-C-094'], '9.6', 'implicit-must', 'binary-decoder', 'Assign zero-based function indexes by function-pool order for local call instructions.');
clause('wmlscript', 'function_name_table', ['WMLS-C-079', 'WMLS-C-087', 'WMLS-C-094'], '9.6', 'explicit-must', 'binary-decoder', 'Store only external function names in the name table and preserve their function-pool order.');
clause('wmlscript', 'function_record_boundaries', ['WMLS-C-094', 'WMLS-C-107'], '9.6', 'implicit-must', 'binary-decoder', 'Decode each function argument count, local count, code size, and instruction bytes without crossing its declared boundary.');

clause('wmlscript', 'control_flow_instruction_matrix', ['WMLS-C-069', 'WMLS-C-095'], '10.5.1', 'table', 'binary-decoder', 'Implement every effective control-flow opcode, parameter width, stack effect, conversion rule, and declared error.');
clause('wmlscript', 'control_flow_targets', ['WMLS-C-095', 'WMLS-C-108'], '10.5.1', 'explicit-must', 'runtime', 'Resolve forward and backward jump offsets from the current instruction and execute only verified in-function instruction targets.');
clause('wmlscript', 'function_call_instruction_matrix', ['WMLS-C-069', 'WMLS-C-096'], '10.5.2', 'table', 'binary-decoder', 'Implement every local, library, and URL call opcode variant with its index widths, argument count, stack effect, result, and errors.');
clause('wmlscript', 'function_call_index_types', ['WMLS-C-096', 'WMLS-C-108'], '10.5.2', 'explicit-must', 'binary-decoder', 'Validate local, library, URL, and function-name indexes against the required pool and constant type before invoking a call.');
clause('wmlscript', 'variable_instruction_matrix', ['WMLS-C-069', 'WMLS-C-097'], '10.5.3', 'table', 'binary-decoder', 'Implement every load, store, increment, and decrement variable opcode variant with its declared index width, conversion, and stack effect.');
clause('wmlscript', 'variable_instruction_bounds', ['WMLS-C-097', 'WMLS-C-108'], '10.5.3', 'explicit-must', 'error-policy', 'Reject a variable instruction whose index is outside the current function argument-and-local variable range.');
clause('wmlscript', 'constant_instruction_matrix', ['WMLS-C-069', 'WMLS-C-098'], '10.5.4', 'table', 'binary-decoder', 'Implement indexed constant loads and immediate zero, one, minus-one, empty-string, invalid, true, and false instructions with exact stack effects.');
clause('wmlscript', 'constant_instruction_bounds', ['WMLS-C-098', 'WMLS-C-108'], '10.5.4', 'explicit-must', 'error-policy', 'Reject an indexed constant load that references outside the constant pool or an unsupported constant type.');
clause('wmlscript', 'arithmetic_instruction_matrix', ['WMLS-C-069', 'WMLS-C-099'], '10.5.5', 'table', 'binary-decoder', 'Implement the complete arithmetic opcode table with exact operand order, conversion category, result type, stack effect, and declared errors.');
clause('wmlscript', 'arithmetic_invalid_results', ['WMLS-C-077', 'WMLS-C-099', 'WMLS-C-111'], '10.5.5', 'implicit-must', 'runtime', 'Return invalid for arithmetic conversion failure, division by zero, remainder by zero, or integer overflow without aborting the invocation.');
clause('wmlscript', 'bitwise_instruction_matrix', ['WMLS-C-069', 'WMLS-C-100'], '10.5.6', 'table', 'binary-decoder', 'Implement the complete bitwise and shift opcode table using integer conversion and the specified stack effects.');
clause('wmlscript', 'bitwise_integer_results', ['WMLS-C-077', 'WMLS-C-100'], '10.5.6', 'implicit-must', 'runtime', 'Convert bitwise operands to integers and return invalid when an integer conversion is illegal.');
clause('wmlscript', 'comparison_instruction_matrix', ['WMLS-C-069', 'WMLS-C-101'], '10.5.7', 'table', 'binary-decoder', 'Implement every equality and ordering opcode with its multi-type conversion rules, boolean result, and stack effect.');
clause('wmlscript', 'comparison_invalid_result', ['WMLS-C-077', 'WMLS-C-101'], '10.5.7', 'implicit-must', 'runtime', 'Return invalid rather than true or false when a comparison operand conversion or value is invalid.');
clause('wmlscript', 'logical_instruction_matrix', ['WMLS-C-069', 'WMLS-C-102'], '10.5.8', 'table', 'binary-decoder', 'Implement logical not and short-circuit-related opcode semantics with boolean conversion, specified stack effects, and invalid propagation.');
clause('wmlscript', 'logical_boolean_conversion', ['WMLS-C-077', 'WMLS-C-102'], '10.5.8', 'implicit-must', 'runtime', 'Apply the Boolean conversion category to logical instruction operands and return invalid when conversion is illegal.');
clause('wmlscript', 'stack_instruction_matrix', ['WMLS-C-069', 'WMLS-C-103'], '10.5.9', 'table', 'binary-decoder', 'Implement the effective pop opcode with its exact operand-stack effect and stack-underflow error.');
clause('wmlscript', 'stack_underflow_fatal', ['WMLS-C-103', 'WMLS-C-110'], '10.5.9', 'error-condition', 'error-policy', 'Treat an instruction that pops an empty operand stack as the specified fatal bytecode error.');
clause('wmlscript', 'operand_type_instruction_matrix', ['WMLS-C-069', 'WMLS-C-104'], '10.5.10', 'table', 'binary-decoder', 'Implement typeof and validity-test instructions with their exact type-code or boolean results and stack effects.');
clause('wmlscript', 'operand_type_no_conversion', ['WMLS-C-104'], '10.5.10', 'explicit-must', 'runtime', 'Inspect the evaluated operand type without performing an automatic data conversion.');
clause('wmlscript', 'return_instruction_matrix', ['WMLS-C-069', 'WMLS-C-105'], '10.5.11', 'table', 'binary-decoder', 'Implement value-return and empty-string-return instructions with exact caller stack and instruction-pointer restoration.');
clause('wmlscript', 'return_top_level_boundary', ['WMLS-C-085', 'WMLS-C-105'], '10.5.11', 'implicit-must', 'runtime', 'Return the selected value to the host caller when leaving the top-level invoked WMLScript function.');
clause('wmlscript', 'debug_instruction_matrix', ['WMLS-C-069', 'WMLS-C-106'], '10.5.12', 'table', 'binary-decoder', 'Recognize the effective debug opcode and perform its specified no-semantic-operation behavior without corrupting interpreter state.');

clause('wmlscript', 'integrity_before_execution', ['WMLS-C-107'], '11.1', 'explicit-must', 'error-policy', 'Complete bytecode integrity verification before executing the compilation unit.');
clause('wmlscript', 'integrity_version_check', ['WMLS-C-091', 'WMLS-C-107'], '11.1', 'explicit-must', 'binary-decoder', 'Require matching major bytecode versions and a bytecode minor version no greater than the interpreter-supported minor version.');
clause('wmlscript', 'integrity_code_size_check', ['WMLS-C-091', 'WMLS-C-107'], '11.1', 'explicit-must', 'binary-decoder', 'Require the declared bytecode size to match the available compilation-unit bytes.');
clause('wmlscript', 'integrity_pool_counts', ['WMLS-C-092', 'WMLS-C-093', 'WMLS-C-094', 'WMLS-C-107'], '11.1', 'explicit-must', 'binary-decoder', 'Require constant, pragma, function-name, and function counts to match the records encoded in their pools.');
clause('wmlscript', 'integrity_function_sizes', ['WMLS-C-094', 'WMLS-C-107'], '11.1', 'explicit-must', 'binary-decoder', 'Require every declared function code size to fit wholly inside the compilation unit.');
clause('wmlscript', 'integrity_instruction_stream', ['WMLS-C-095', 'WMLS-C-096', 'WMLS-C-097', 'WMLS-C-098', 'WMLS-C-099', 'WMLS-C-100', 'WMLS-C-101', 'WMLS-C-102', 'WMLS-C-103', 'WMLS-C-104', 'WMLS-C-105', 'WMLS-C-106', 'WMLS-C-107'], '11.1', 'explicit-must', 'binary-decoder', 'Reject unknown, truncated, reserved, or structurally invalid instruction encodings before execution.');
clause('wmlscript', 'integrity_failure_quarantine', ['WMLS-C-107', 'WMLS-C-110'], '11.1', 'explicit-must', 'error-policy', 'Do not execute failed bytecode; abort any started execution and signal verification failure to the interpreter caller.');
clause('wmlscript', 'runtime_jump_validity', ['WMLS-C-095', 'WMLS-C-108'], '11.2', 'explicit-must', 'error-policy', 'Require every taken jump target to fall on an instruction boundary within the current function.');
clause('wmlscript', 'runtime_function_validity', ['WMLS-C-096', 'WMLS-C-108'], '11.2', 'explicit-must', 'error-policy', 'Validate called function, library, URL, and argument-count references before transferring control.');
clause('wmlscript', 'runtime_variable_validity', ['WMLS-C-097', 'WMLS-C-108'], '11.2', 'explicit-must', 'error-policy', 'Validate every variable index against the current function frame before reading or writing it.');
clause('wmlscript', 'runtime_constant_validity', ['WMLS-C-098', 'WMLS-C-108'], '11.2', 'explicit-must', 'error-policy', 'Validate every constant index and required constant type before loading or using it.');
clause('wmlscript', 'runtime_stack_validity', ['WMLS-C-095', 'WMLS-C-096', 'WMLS-C-097', 'WMLS-C-099', 'WMLS-C-100', 'WMLS-C-101', 'WMLS-C-102', 'WMLS-C-103', 'WMLS-C-104', 'WMLS-C-105', 'WMLS-C-108'], '11.2', 'explicit-must', 'error-policy', 'Check operand availability for each instruction before applying its stack effect.');

clause('wmlscript', 'error_detection_tools', ['WMLS-C-109'], '12.1', 'implicit-must', 'runtime', 'Expose value/type validation through standard library predicates plus typeof and isvalid so scripts can avoid predictable errors.');
clause('wmlscript', 'error_classification', ['WMLS-C-109'], '12.2', 'table', 'error-policy', 'Classify each specified runtime error as fatal or non-fatal and apply its defined caller-visible outcome.');
clause('wmlscript', 'error_abort_last_resort', ['WMLS-C-109'], '12.2', 'explicit-should', 'error-policy', 'Use invocation abort only when the error cannot be represented by a specified non-fatal result.');
clause('wmlscript', 'fatal_abort_and_signal', ['WMLS-C-110'], '12.3', 'explicit-must', 'error-policy', 'Abort the current WMLScript program on a fatal error and signal failure to the calling user agent.');
clause('wmlscript', 'fatal_bytecode_error_matrix', ['WMLS-C-107', 'WMLS-C-108', 'WMLS-C-110'], '12.3', 'table', 'error-policy', 'Handle verification failure, fatal library error, wrong external arity, missing external function or unit, access violation, and stack underflow as fatal.');
clause('wmlscript', 'fatal_resource_error_matrix', ['WMLS-C-110'], '12.3', 'table', 'error-policy', 'Handle programmed abort, stack overflow, out-of-memory, and user- or system-initiated termination as fatal invocation errors.');
clause('wmlscript', 'nonfatal_continue_with_result', ['WMLS-C-111'], '12.4', 'explicit-must', 'error-policy', 'Represent each non-fatal error by its specified invalid or zero result and allow the program to continue.');
clause('wmlscript', 'nonfatal_computation_matrix', ['WMLS-C-099', 'WMLS-C-111'], '12.4', 'table', 'runtime', 'Return invalid for divide-by-zero and integer or floating overflow, and return floating zero for floating underflow.');
clause('wmlscript', 'nonfatal_constant_matrix', ['WMLS-C-098', 'WMLS-C-111'], '12.4', 'table', 'runtime', 'Return invalid for NaN, infinity, or a floating constant referenced by an integer-only interpreter.');
clause('wmlscript', 'nonfatal_conversion_matrix', ['WMLS-C-073', 'WMLS-C-077', 'WMLS-C-111'], '12.4', 'table', 'runtime', 'Return invalid when conversion exceeds integer or floating range, and floating zero when conversion underflows.');

// WMLScript Standard Libraries selected Class C interpreter clauses.
function libraryParentId(ordinal) {
  return ordinal === 48
    ? 'WMLSSL048'
    : `WMLSSL-${String(ordinal).padStart(3, '0')}`;
}

const selectedLibraryFunctionParents = Array.from(
  { length: 64 },
  (_, index) => index + 31
)
  .filter((ordinal) => ordinal !== 46)
  .map(libraryParentId);

clause('wmlscript-libraries', 'supported_value_types', ['WMLSSL-014', ...selectedLibraryFunctionParents], '6.1', 'implicit-must', 'runtime', 'Accept Boolean, Integer, Float, String, and Invalid values wherever a standard-library signature names those WMLScript types.');
clause('wmlscript-libraries', 'number_parameter_union', ['WMLSSL-014', ...selectedLibraryFunctionParents], '6.1', 'implicit-must', 'runtime', 'Interpret a Number parameter as accepting either an Integer or Float value.');
clause('wmlscript-libraries', 'any_parameter_union', ['WMLSSL-014', ...selectedLibraryFunctionParents], '6.1', 'implicit-must', 'runtime', 'Interpret an Any parameter as accepting every supported WMLScript value type.');
clause('wmlscript-libraries', 'automatic_argument_conversion', ['WMLSSL-015', ...selectedLibraryFunctionParents], '6.2', 'implicit-must', 'runtime', 'Apply WMLScript automatic data conversions when an argument does not already have the required parameter type.');
clause('wmlscript-libraries', 'operator_conversion_default', ['WMLSSL-015', ...selectedLibraryFunctionParents], '6.2', 'implicit-must', 'runtime', 'Use WMLScript operator conversion rules unless an individual library function explicitly defines another conversion.');
clause('wmlscript-libraries', 'invalid_argument_result', ['WMLSSL-016', ...selectedLibraryFunctionParents], '6.3', 'implicit-must', 'error-policy', 'Return invalid without other side effects when a function receives an invalid argument, except where its definition explicitly specifies another outcome.');
clause('wmlscript-libraries', 'unconvertible_argument_result', ['WMLSSL-015', 'WMLSSL-016', ...selectedLibraryFunctionParents], '6.3', 'implicit-must', 'error-policy', 'Return invalid without side effects when an argument cannot be converted to its required parameter type.');
clause('wmlscript-libraries', 'function_specific_error_result', ['WMLSSL-016', ...selectedLibraryFunctionParents], '6.3', 'implicit-must', 'error-policy', 'Represent each function-specific exception using the return value or error code declared by that function definition.');
clause('wmlscript-libraries', 'integer_only_argument_types', ['WMLSSL-014', 'WMLSSL-015'], '6.4', 'table', 'runtime', 'On an integer-only device, accept only Boolean, Integer, String, and Invalid library arguments and ignore floating-point conversion rules.');

const standardLibraryDefinitions = [
  {
    key: 'lang',
    supportParent: 'WMLSSL-018',
    identifierParent: 'WMLSSL-025',
    section: '7',
    libraryId: 0,
    functions: 'abs=0, min=1, max=2, parseInt=3, parseFloat=4, isInt=5, isFloat=6, maxInt=7, minInt=8, float=9, exit=10, abort=11, random=12, seed=13, characterSet=14'
  },
  {
    key: 'float',
    supportParent: 'WMLSSL-019',
    identifierParent: 'WMLSSL-026',
    section: '8',
    libraryId: 1,
    functions: 'int=0, floor=1, ceil=2, pow=3, round=4, sqrt=5, maxFloat=6, minFloat=7'
  },
  {
    key: 'string',
    supportParent: 'WMLSSL-020',
    identifierParent: 'WMLSSL-027',
    section: '9',
    libraryId: 2,
    functions: 'length=0, isEmpty=1, charAt=2, subString=3, find=4, replace=5, elements=6, elementAt=7, removeAt=8, replaceAt=9, insertAt=10, squeeze=11, trim=12, compare=13, toString=14, format=15'
  },
  {
    key: 'url',
    supportParent: 'WMLSSL-021',
    identifierParent: 'WMLSSL-028',
    section: '10',
    libraryId: 3,
    functions: 'isValid=0, getScheme=1, getHost=2, getPort=3, getPath=4, getParameters=5, getQuery=6, getFragment=7, getBase=8, getReferer=9, resolve=10, escapeString=11, unescapeString=12, loadString=13'
  },
  {
    key: 'wmlbrowser',
    supportParent: 'WMLSSL-022',
    identifierParent: 'WMLSSL-029',
    section: '11',
    libraryId: 4,
    functions: 'getVar=0, setVar=1, go=2, prev=3, newContext=4, getCurrentCard=5, refresh=6'
  },
  {
    key: 'dialogs',
    supportParent: 'WMLSSL-023',
    identifierParent: 'WMLSSL-030',
    section: '12',
    libraryId: 5,
    functions: 'prompt=0, confirm=1, alert=2'
  }
];

for (const library of standardLibraryDefinitions) {
  clause('wmlscript-libraries', `${library.key}_library_surface`, [library.supportParent], library.section, 'implicit-must', 'runtime', `Expose the complete ${library.key} standard-library namespace and its selected functions through the WMLScript library-call boundary.`);
  clause('wmlscript-libraries', `${library.key}_library_identifier`, [library.supportParent, 'WMLSSL-024'], 'appendix-a', 'table', 'binary-decoder', `Map the ${library.key} standard library to encoded library identifier ${library.libraryId}.`);
  clause('wmlscript-libraries', `${library.key}_function_identifiers`, [library.supportParent, library.identifierParent], 'appendix-a', 'table', 'binary-decoder', `Map ${library.key} function identifiers exactly as follows: ${library.functions}.`);
}

function standardLibraryFunction({
  key,
  parent,
  section,
  signature,
  behavior,
  details = []
}) {
  clause('wmlscript-libraries', `${key}_signature`, [parent], section, 'table', 'runtime', signature);
  clause('wmlscript-libraries', `${key}_behavior`, [parent], section, 'implicit-must', 'runtime', behavior);
  for (const detail of details) {
    clause(
      'wmlscript-libraries',
      `${key}_${detail.key}`,
      [parent],
      detail.section ?? section,
      detail.force ?? 'implicit-must',
      detail.kind ?? 'runtime',
      detail.synopsis,
      detail.anchorFamily ?? 'wmlscript-libraries'
    );
  }
}

const langFunctions = [
  {
    key: 'lang_abs',
    parent: 'WMLSSL-031',
    section: '7.1',
    signature: 'Implement Lang.abs(value) for a Number argument, returning Number or invalid.',
    behavior: 'Return the absolute magnitude while preserving whether the input was Integer or Float.'
  },
  {
    key: 'lang_min',
    parent: 'WMLSSL-032',
    section: '7.2',
    signature: 'Implement Lang.min(value1, value2) for two Number arguments, returning Number or invalid.',
    behavior: 'Apply numeric conversion rules, return the smaller original value with its original type, and select the first argument when values compare equal.'
  },
  {
    key: 'lang_max',
    parent: 'WMLSSL-033',
    section: '7.3',
    signature: 'Implement Lang.max(value1, value2) for two Number arguments, returning Number or invalid.',
    behavior: 'Apply numeric conversion rules, return the larger original value with its original type, and select the first argument when values compare equal.'
  },
  {
    key: 'lang_parse_int',
    parent: 'WMLSSL-034',
    section: '7.4',
    signature: 'Implement Lang.parseInt(value) for a String argument, returning Integer or invalid.',
    behavior: 'Parse a leading signed decimal integer and stop before the first character that is neither the leading sign nor a decimal digit.',
    details: [
      { key: 'error', kind: 'error-policy', synopsis: 'Return invalid when the input has no legal leading decimal-integer representation.' }
    ]
  },
  {
    key: 'lang_parse_float',
    parent: 'WMLSSL-035',
    section: '7.5',
    signature: 'Implement Lang.parseFloat(value) for a String argument, returning Float or invalid.',
    behavior: 'Parse a legal leading decimal floating-point representation and stop at the first character that cannot continue it.',
    details: [
      { key: 'error', kind: 'error-policy', synopsis: 'Return invalid for malformed floating-point syntax or when floating-point operations are unavailable.' }
    ]
  },
  {
    key: 'lang_is_int',
    parent: 'WMLSSL-036',
    section: '7.6',
    signature: 'Implement Lang.isInt(value) for an Any argument, returning Boolean or invalid.',
    behavior: 'Return true exactly when Lang.parseInt can convert the value, false for a non-convertible non-invalid value, and invalid for invalid input.'
  },
  {
    key: 'lang_is_float',
    parent: 'WMLSSL-037',
    section: '7.7',
    signature: 'Implement Lang.isFloat(value) for an Any argument, returning Boolean or invalid.',
    behavior: 'Return true exactly when Lang.parseFloat can convert the value, false for a non-convertible non-invalid value, and invalid for invalid input.',
    details: [
      { key: 'unsupported', kind: 'error-policy', synopsis: 'Return invalid when floating-point operations are unavailable.' }
    ]
  },
  {
    key: 'lang_max_int',
    parent: 'WMLSSL-038',
    section: '7.8',
    signature: 'Implement zero-argument Lang.maxInt(), returning an Integer.',
    behavior: 'Return the maximum WMLScript Integer value 2147483647.'
  },
  {
    key: 'lang_min_int',
    parent: 'WMLSSL-039',
    section: '7.9',
    signature: 'Implement zero-argument Lang.minInt(), returning an Integer.',
    behavior: 'Return the minimum WMLScript Integer value -2147483648.'
  },
  {
    key: 'lang_float',
    parent: 'WMLSSL-040',
    section: '7.10',
    signature: 'Implement zero-argument Lang.float(), returning a Boolean.',
    behavior: 'Return true when floating-point operations are supported and false on an integer-only device.'
  },
  {
    key: 'lang_exit',
    parent: 'WMLSSL-041',
    section: '7.11',
    signature: 'Implement Lang.exit(value) for an Any argument with no local return.',
    behavior: 'End normal bytecode interpretation immediately and return the supplied value and control to the interpreter caller.'
  },
  {
    key: 'lang_abort',
    parent: 'WMLSSL-042',
    section: '7.12',
    signature: 'Implement Lang.abort(errorDescription) for a String argument with no local return.',
    behavior: 'Abort bytecode interpretation as an abnormal exit and return the error description to the interpreter caller.',
    details: [
      { key: 'invalid_description', synopsis: 'Use the literal string invalid as the error description when the supplied description value is invalid.' }
    ]
  },
  {
    key: 'lang_random',
    parent: 'WMLSSL-043',
    section: '7.13',
    signature: 'Implement Lang.random(value) for a Number argument, returning Integer or invalid.',
    behavior: 'Return an approximately uniformly selected integer between zero and the nonnegative bound, inclusive, using an implementation-dependent random strategy.',
    details: [
      { key: 'float_bound', synopsis: 'Convert a Float bound through Float.int before selecting the random value.' },
      { key: 'bounds', kind: 'error-policy', synopsis: 'Return zero for a zero bound and invalid for a negative bound.' }
    ]
  },
  {
    key: 'lang_seed',
    parent: 'WMLSSL-044',
    section: '7.14',
    signature: 'Implement Lang.seed(value) for a Number argument, returning empty String or invalid.',
    behavior: 'Use a nonnegative integer seed to create a repeatable pseudo-random sequence and a negative seed to request system-dependent non-repeatable initialization.',
    details: [
      { key: 'float_seed', synopsis: 'Convert a Float seed through Float.int before initializing the sequence.' },
      { key: 'invalid_seed', kind: 'error-policy', synopsis: 'Return invalid and preserve the current seed when the argument is nonnumeric.' }
    ]
  },
  {
    key: 'lang_character_set',
    parent: 'WMLSSL-045',
    section: '7.15',
    signature: 'Implement zero-argument Lang.characterSet(), returning an Integer.',
    behavior: 'Return the IANA MIBenum identifier for the character set used by the WMLScript interpreter.'
  }
];

for (const definition of langFunctions) standardLibraryFunction(definition);

clause('wmlscript-libraries', 'float_library_integer_only_result', ['WMLSSL-046', 'WMLSSL-047', 'WMLSSL048', 'WMLSSL-049', 'WMLSSL-050', 'WMLSSL-051', 'WMLSSL-052', 'WMLSSL-053', 'WMLSSL-054'], '8', 'explicit-must', 'error-policy', 'Return invalid from every Float library function when floating-point operations are unavailable.');

const floatFunctions = [
  {
    key: 'float_int',
    parent: 'WMLSSL-047',
    section: '8.1',
    signature: 'Implement Float.int(value) for a Number argument, returning Integer or invalid.',
    behavior: 'Return the integer part by truncating a Float toward zero, or return an Integer argument unchanged.'
  },
  {
    key: 'float_floor',
    parent: 'WMLSSL048',
    section: '8.2',
    signature: 'Implement Float.floor(value) for a Number argument, returning Integer or invalid.',
    behavior: 'Return the greatest integer not greater than the argument, or return an Integer argument unchanged.'
  },
  {
    key: 'float_ceil',
    parent: 'WMLSSL-049',
    section: '8.3',
    signature: 'Implement Float.ceil(value) for a Number argument, returning Integer or invalid.',
    behavior: 'Return the smallest integer not less than the argument, or return an Integer argument unchanged.'
  },
  {
    key: 'float_pow',
    parent: 'WMLSSL-050',
    section: '8.4',
    signature: 'Implement Float.pow(value1, value2) for two Number arguments, returning Float or invalid.',
    behavior: 'Return an implementation-dependent approximation of the first argument raised to the power of the second.',
    details: [
      { key: 'domain', kind: 'error-policy', synopsis: 'Return invalid for zero raised to a negative power or a negative base raised to a non-integer power.' }
    ]
  },
  {
    key: 'float_round',
    parent: 'WMLSSL-051',
    section: '8.5',
    signature: 'Implement Float.round(value) for a Number argument, returning Integer or invalid.',
    behavior: 'Return the closest mathematical integer, choosing the larger integer on an exact tie, or return an Integer argument unchanged.'
  },
  {
    key: 'float_sqrt',
    parent: 'WMLSSL-052',
    section: '8.6',
    signature: 'Implement Float.sqrt(value) for a Float argument, returning Float or invalid.',
    behavior: 'Return an implementation-dependent approximation of the square root.',
    details: [
      { key: 'negative', kind: 'error-policy', synopsis: 'Return invalid for a negative argument.' }
    ]
  },
  {
    key: 'float_max',
    parent: 'WMLSSL-053',
    section: '8.7',
    signature: 'Implement zero-argument Float.maxFloat(), returning a Float.',
    behavior: 'Return the IEEE 754 single-precision maximum value 3.40282347E+38.'
  },
  {
    key: 'float_min',
    parent: 'WMLSSL-054',
    section: '8.8',
    signature: 'Implement zero-argument Float.minFloat(), returning a Float.',
    behavior: 'Return the smallest supported nonzero single-precision value, no greater than 1.17549435E-38.'
  }
];

for (const definition of floatFunctions) standardLibraryFunction(definition);

const stringFunctions = [
  {
    key: 'string_length',
    parent: 'WMLSSL-055',
    section: '9.1',
    signature: 'Implement String.length(string) for a String argument, returning Integer or invalid.',
    behavior: 'Return the number of characters in the converted string, with an empty string having length zero.'
  },
  {
    key: 'string_is_empty',
    parent: 'WMLSSL-056',
    section: '9.2',
    signature: 'Implement String.isEmpty(string) for a String argument, returning Boolean or invalid.',
    behavior: 'Return true exactly when the converted string contains zero characters.'
  },
  {
    key: 'string_char_at',
    parent: 'WMLSSL-057',
    section: '9.3',
    signature: 'Implement String.charAt(string, index) for String and Number arguments, returning String or invalid.',
    behavior: 'Convert a Float index through Float.int and return the one-character string at the resulting zero-based index.',
    details: [
      { key: 'out_of_range', synopsis: 'Return an empty string when the index is outside the string.' }
    ]
  },
  {
    key: 'string_sub_string',
    parent: 'WMLSSL-058',
    section: '9.4',
    signature: 'Implement String.subString(string, startIndex, length) for String and Number arguments, returning String or invalid.',
    behavior: 'Convert Float indexes through Float.int, clamp a negative start to zero, and clamp length to the available suffix.',
    details: [
      { key: 'empty_result', synopsis: 'Return an empty string when start is beyond the final character or requested length is nonpositive.' }
    ]
  },
  {
    key: 'string_find',
    parent: 'WMLSSL-059',
    section: '9.5',
    signature: 'Implement String.find(string, subString) for two String arguments, returning Integer or invalid.',
    behavior: 'Return the first exact representation-sensitive, case-sensitive match index, or -1 when no match exists.',
    details: [
      { key: 'empty_needle', kind: 'error-policy', synopsis: 'Return invalid when the requested substring is empty.' }
    ]
  },
  {
    key: 'string_replace',
    parent: 'WMLSSL-060',
    section: '9.6',
    signature: 'Implement String.replace(string, oldSubString, newSubString) for three String arguments, returning String or invalid.',
    behavior: 'Replace every exact representation-sensitive, case-sensitive occurrence of the old substring with the new substring.',
    details: [
      { key: 'empty_needle', kind: 'error-policy', synopsis: 'Return invalid when the old substring is empty.' }
    ]
  },
  {
    key: 'string_elements',
    parent: 'WMLSSL-061',
    section: '9.7',
    signature: 'Implement String.elements(string, separator) for two String arguments, returning Integer or invalid.',
    behavior: 'Use the separator first character and count every separated element, including empty elements, so the result is always positive.',
    details: [
      { key: 'empty_separator', kind: 'error-policy', synopsis: 'Return invalid when the separator string is empty.' }
    ]
  },
  {
    key: 'string_element_at',
    parent: 'WMLSSL-062',
    section: '9.8',
    signature: 'Implement String.elementAt(string, index, separator) for String, Number, and String arguments, returning String or invalid.',
    behavior: 'Use the separator first character, convert Float index through Float.int, and clamp indexes below or above range to the first or last element.',
    details: [
      { key: 'empty_inputs', kind: 'error-policy', synopsis: 'Return an empty string for empty input text and invalid for an empty separator.' }
    ]
  },
  {
    key: 'string_remove_at',
    parent: 'WMLSSL-063',
    section: '9.9',
    signature: 'Implement String.removeAt(string, index, separator) for String, Number, and String arguments, returning String or invalid.',
    behavior: 'Remove the selected element and its corresponding separator, converting Float index and clamping indexes to the first or last element.',
    details: [
      { key: 'empty_inputs', kind: 'error-policy', synopsis: 'Return an empty string for empty input text and invalid for an empty separator.' }
    ]
  },
  {
    key: 'string_replace_at',
    parent: 'WMLSSL-064',
    section: '9.10',
    signature: 'Implement String.replaceAt(string, element, index, separator) for String, String, Number, and String arguments, returning String or invalid.',
    behavior: 'Replace the selected element, converting Float index and clamping indexes outside range to the first or last element.',
    details: [
      { key: 'empty_inputs', kind: 'error-policy', synopsis: 'Return the replacement element for empty input text and invalid for an empty separator.' }
    ]
  },
  {
    key: 'string_insert_at',
    parent: 'WMLSSL-065',
    section: '9.11',
    signature: 'Implement String.insertAt(string, element, index, separator) for String, String, Number, and String arguments, returning String or invalid.',
    behavior: 'Insert the element and needed separator at the converted index, clamping negative index to zero and appending beyond the final element.',
    details: [
      { key: 'empty_inputs', kind: 'error-policy', synopsis: 'Return the inserted element for empty input text and invalid for an empty separator.' }
    ]
  },
  {
    key: 'string_squeeze',
    parent: 'WMLSSL-066',
    section: '9.12',
    signature: 'Implement String.squeeze(string) for a String argument, returning String or invalid.',
    behavior: 'Replace each consecutive run of TAB, VT, FF, space, LF, or CR characters with one space without trimming the string ends.'
  },
  {
    key: 'string_trim',
    parent: 'WMLSSL-067',
    section: '9.13',
    signature: 'Implement String.trim(string) for a String argument, returning String or invalid.',
    behavior: 'Remove every leading and trailing TAB, VT, FF, space, LF, and CR while preserving internal whitespace.'
  },
  {
    key: 'string_compare',
    parent: 'WMLSSL-068',
    section: '9.14',
    signature: 'Implement String.compare(string1, string2) for two String arguments, returning Integer or invalid.',
    behavior: 'Compare native character codes lexicographically and return -1, 0, or 1 for less-than, identical, or greater-than.'
  },
  {
    key: 'string_to_string',
    parent: 'WMLSSL-069',
    section: '9.15',
    signature: 'Implement String.toString(value) for an Any argument, always returning a String.',
    behavior: 'Apply WMLScript Boolean, Integer, Float, and String conversions, but convert Invalid to the literal string invalid.'
  },
  {
    key: 'string_format',
    parent: 'WMLSSL-070',
    section: '9.16',
    signature: 'Implement String.format(format, value) for String and Any arguments, returning String or invalid.',
    behavior: 'Parse percent, optional nonnegative width, optional precision, and required d, f, or s type fields, plus doubled-percent literals.',
    details: [
      { key: 'specifier_selection', synopsis: 'Use only the leftmost format specifier and replace every later specifier with an empty string.' },
      { key: 'width', synopsis: 'Left-pad to minimum width without truncating; ignore string width when it exceeds string precision.' },
      { key: 'integer_precision', synopsis: 'For d, zero-pad to precision, default precision to one, and produce empty output for zero with zero precision.' },
      { key: 'float_precision', synopsis: 'For f, round to the requested fractional digits, default to six, and omit the decimal point at zero precision.' },
      { key: 'string_precision', synopsis: 'For s, truncate to the maximum character count when precision is specified.' },
      { key: 'conversion', synopsis: 'Convert the value to the selected type using WMLScript rules, with Float.int used for Float-to-d conversion.' },
      { key: 'errors', kind: 'error-policy', synopsis: 'Return invalid for an illegal format or an f conversion when floating-point operations are unavailable.' }
    ]
  }
];

for (const definition of stringFunctions) standardLibraryFunction(definition);

const urlFunctions = [
  {
    key: 'url_is_valid',
    parent: 'WMLSSL-071',
    section: '10.1',
    signature: 'Implement URL.isValid(url) for a String argument, returning Boolean or invalid.',
    behavior: 'Validate absolute or relative RFC 2396 syntax without resolving a relative reference, returning true only for valid syntax.'
  },
  {
    key: 'url_get_scheme',
    parent: 'WMLSSL-072',
    section: '10.2',
    signature: 'Implement URL.getScheme(url) for a String argument, returning String or invalid.',
    behavior: 'Return the scheme from an absolute reference or empty string from a relative reference without resolving it.',
    details: [
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Return invalid when scheme extraction encounters invalid URL syntax.' }
    ]
  },
  {
    key: 'url_get_host',
    parent: 'WMLSSL-073',
    section: '10.3',
    signature: 'Implement URL.getHost(url) for a String argument, returning String or invalid.',
    behavior: 'Return the host without resolving a relative reference, or empty string when no host is present.',
    details: [
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Return invalid when host extraction encounters invalid URL syntax.' }
    ]
  },
  {
    key: 'url_get_port',
    parent: 'WMLSSL-074',
    section: '10.4',
    signature: 'Implement URL.getPort(url) for a String argument, returning String or invalid.',
    behavior: 'Return the explicit port text without applying a scheme default, or empty string when no port is present.',
    details: [
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Return invalid when port extraction encounters invalid URL syntax.' }
    ]
  },
  {
    key: 'url_get_path',
    parent: 'WMLSSL-075',
    section: '10.5',
    signature: 'Implement URL.getPath(url) for a String argument, returning String or invalid.',
    behavior: 'Return the absolute or unresolved-relative path while omitting parameters attached to its path segments.',
    details: [
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Return invalid when path extraction encounters invalid URL syntax.' }
    ]
  },
  {
    key: 'url_get_parameters',
    parent: 'WMLSSL-076',
    section: '10.6',
    signature: 'Implement URL.getParameters(url) for a String argument, returning String or invalid.',
    behavior: 'Return only the parameters attached to the final path segment, or empty string when none are present, without resolving relatives.',
    details: [
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Return invalid when parameter extraction encounters invalid URL syntax.' }
    ]
  },
  {
    key: 'url_get_query',
    parent: 'WMLSSL-077',
    section: '10.7',
    signature: 'Implement URL.getQuery(url) for a String argument, returning String or invalid.',
    behavior: 'Return the query text or empty string when absent, without resolving relative references.',
    details: [
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Return invalid when query extraction encounters invalid URL syntax.' }
    ]
  },
  {
    key: 'url_get_fragment',
    parent: 'WMLSSL-078',
    section: '10.8',
    signature: 'Implement URL.getFragment(url) for a String argument, returning String or invalid.',
    behavior: 'Return the fragment text or empty string when absent, without resolving relative references.',
    details: [
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Return invalid when fragment extraction encounters invalid URL syntax.' }
    ]
  },
  {
    key: 'url_get_base',
    parent: 'WMLSSL-079',
    section: '10.9',
    signature: 'Implement zero-argument URL.getBase(), returning a String.',
    behavior: 'Return the absolute URL of the current compilation unit with its fragment removed.'
  },
  {
    key: 'url_get_referer',
    parent: 'WMLSSL-080',
    section: '10.10',
    signature: 'Implement zero-argument URL.getReferer(), returning a String.',
    behavior: 'Return the shortest URL relative to the compilation-unit base for the resource that invoked the unit, or empty string when absent.',
    details: [
      { key: 'local_call', synopsis: 'Do not change the referer when execution crosses a local function call.' }
    ]
  },
  {
    key: 'url_resolve',
    parent: 'WMLSSL-081',
    section: '10.11',
    signature: 'Implement URL.resolve(baseUrl, embeddedUrl) for two String arguments, returning String or invalid.',
    behavior: 'Resolve a relative embedded URL against the base using RFC 2396, treating an empty base path as one slash and returning an absolute embedded URL unchanged.',
    details: [
      { key: 'rfc_algorithm', section: '5.2', anchorFamily: 'rfc-2396', synopsis: 'Apply the RFC 2396 section 5.2 component-inheritance, path merge, dot-segment, query, and fragment resolution algorithm.' },
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Return invalid when resolution encounters invalid URL syntax.' }
    ]
  },
  {
    key: 'url_escape_string',
    parent: 'WMLSSL-082',
    section: '10.12',
    signature: 'Implement URL.escapeString(string) for a String argument, returning String or invalid.',
    behavior: 'Percent-encode control, space, reserved, unwise, delimiter, and non-US-ASCII native-byte characters using two hexadecimal digits without parsing as a URL.',
    details: [
      { key: 'native_codes', synopsis: 'Use native character-set codes when escaping non-US-ASCII characters.' },
      { key: 'range_error', kind: 'error-policy', synopsis: 'Return invalid when a character code exceeds hexadecimal FF.' }
    ]
  },
  {
    key: 'url_unescape_string',
    parent: 'WMLSSL-083',
    section: '10.13',
    signature: 'Implement URL.unescapeString(string) for a String argument, returning String or invalid.',
    behavior: 'Replace percent escape sequences with represented characters without parsing the value as a URL.',
    details: [
      { key: 'ascii_error', kind: 'error-policy', synopsis: 'Return invalid when the input contains a non-US-ASCII character.' }
    ]
  },
  {
    key: 'url_load_string',
    parent: 'WMLSSL-084',
    section: '10.14',
    signature: 'Implement URL.loadString(url, contentType) for two String arguments, returning String, Integer, or invalid.',
    behavior: 'Load the absolute URL with user-agent defaults and return decoded text only when the response content type matches the requested content type.',
    details: [
      { key: 'accept_header', force: 'explicit-must', kind: 'transport-boundary', synopsis: 'Send an Accept header containing only the supplied content type and expect text content regardless of other user-agent capabilities.' },
      { key: 'content_type_grammar', kind: 'parser', synopsis: 'Require exactly one complete content type beginning with text/ and reject leading, trailing, or additional content-type text.' },
      { key: 'load_error', kind: 'error-policy', synopsis: 'Return a scheme-specific integer error code for load failure or response-type mismatch, using HTTP status codes for HTTP or WSP.' },
      { key: 'type_error', kind: 'error-policy', synopsis: 'Return invalid for an erroneous requested content type.' }
    ]
  }
];

for (const definition of urlFunctions) standardLibraryFunction(definition);

const wmlBrowserParents = [
  'WMLSSL-085',
  'WMLSSL-086',
  'WMLSSL-087',
  'WMLSSL-088',
  'WMLSSL-089',
  'WMLSSL-090',
  'WMLSSL-091'
];
clause('wmlscript-libraries', 'wmlbrowser_unavailable', wmlBrowserParents, '11', 'explicit-must', 'error-policy', 'When no WML browser is available or it did not invoke the interpreter, return invalid from every WMLBrowser function without WML-context side effects.');

const wmlBrowserFunctions = [
  {
    key: 'wmlbrowser_get_var',
    parent: 'WMLSSL-085',
    section: '11.1',
    signature: 'Implement WMLBrowser.getVar(name) for a String argument, returning String or invalid.',
    behavior: 'Return the named current-context variable value, or empty string when the variable does not exist.',
    details: [
      { key: 'name_error', kind: 'error-policy', synopsis: 'Validate the WML variable-name grammar and return invalid for an illegal name.' }
    ]
  },
  {
    key: 'wmlbrowser_set_var',
    parent: 'WMLSSL-086',
    section: '11.2',
    signature: 'Implement WMLBrowser.setVar(name, value) for two String arguments, returning Boolean or invalid.',
    behavior: 'Set the current-context variable and return true on success or false when the legal assignment cannot be completed.',
    details: [
      { key: 'syntax_error', kind: 'error-policy', synopsis: 'Require a legal WML variable name and XML CDATA value, returning invalid when either syntax is illegal.' }
    ]
  },
  {
    key: 'wmlbrowser_go',
    parent: 'WMLSSL-087',
    section: '11.3',
    signature: 'Implement WMLBrowser.go(url) for a String argument, returning empty String or invalid.',
    behavior: 'Queue WML GO-equivalent navigation until script control returns, using the current card as referrer and as base for a relative URL.',
    details: [
      { key: 'last_request_wins', synopsis: 'Let the final go or prev call replace every earlier pending navigation request.' },
      { key: 'empty_cancels', synopsis: 'Treat a final go with empty URL as canceling every pending go or prev request.' },
      { key: 'fatal_cancels', kind: 'error-policy', synopsis: 'Cancel pending go navigation when Lang.abort or another fatal WMLScript error terminates the invocation.' }
    ]
  },
  {
    key: 'wmlbrowser_prev',
    parent: 'WMLSSL-088',
    section: '11.4',
    signature: 'Implement zero-argument WMLBrowser.prev(), returning empty String or invalid.',
    behavior: 'Queue WML PREV-equivalent navigation until script control returns to the WML browser.',
    details: [
      { key: 'last_request_wins', synopsis: 'Let the final prev or go call replace every earlier pending navigation request.' },
      { key: 'fatal_cancels', kind: 'error-policy', synopsis: 'Cancel pending prev navigation when Lang.abort or another fatal WMLScript error terminates the invocation.' }
    ]
  },
  {
    key: 'wmlbrowser_new_context',
    parent: 'WMLSSL-089',
    section: '11.5',
    signature: 'Implement zero-argument WMLBrowser.newContext(), returning empty String or invalid.',
    behavior: 'Clear all WML context variables and history entries except the current card before returning to the caller.',
    details: [
      { key: 'navigation_interaction', synopsis: 'Preserve a pending go request while ensuring any previous or subsequent prev request has no effect.' }
    ]
  },
  {
    key: 'wmlbrowser_current_card',
    parent: 'WMLSSL-090',
    section: '11.6',
    signature: 'Implement zero-argument WMLBrowser.getCurrentCard(), returning String or invalid.',
    behavior: 'Return the shortest current-card URL relative to the compilation-unit base, using absolute form when the deck base differs.',
    details: [
      { key: 'missing_card', kind: 'error-policy', synopsis: 'Return invalid when there is no current WML card.' }
    ]
  },
  {
    key: 'wmlbrowser_refresh',
    parent: 'WMLSSL-091',
    section: '11.7',
    signature: 'Implement zero-argument WMLBrowser.refresh(), returning String or invalid.',
    behavior: 'For supported immediate refresh, synchronously apply WML refresh steps to the current card without restarting a suspended timer.',
    details: [
      { key: 'initial_render', force: 'explicit-must', kind: 'rendering', synopsis: 'Render the current card when it had not been rendered before refresh was invoked.' },
      { key: 'result', synopsis: 'Return empty string on success, a non-empty implementation-dependent diagnostic on failure, or invalid when immediate refresh is unsupported.' },
      { key: 'deferred_fallback', force: 'explicit-must', kind: 'rendering', synopsis: 'When immediate refresh is unsupported, still refresh the card after control returns to the WML user agent.' }
    ]
  }
];

for (const definition of wmlBrowserFunctions) {
  standardLibraryFunction(definition);
}

const dialogFunctions = [
  {
    key: 'dialogs_prompt',
    parent: 'WMLSSL-092',
    section: '12.1',
    signature: 'Implement Dialogs.prompt(message, defaultInput) for two String arguments, returning String or invalid.',
    behavior: 'Display the message with the supplied initial input, wait for user input, and return the entered string.'
  },
  {
    key: 'dialogs_confirm',
    parent: 'WMLSSL-093',
    section: '12.2',
    signature: 'Implement Dialogs.confirm(message, ok, cancel) for three String arguments, returning Boolean or invalid.',
    behavior: 'Display two alternatives, wait for selection, and return true for ok or false for cancel.',
    details: [
      { key: 'default_labels', synopsis: 'Use implementation-dependent default label text when either supplied alternative label is empty.' }
    ]
  },
  {
    key: 'dialogs_alert',
    parent: 'WMLSSL-094',
    section: '12.3',
    signature: 'Implement Dialogs.alert(message) for a String argument, returning String or invalid.',
    behavior: 'Display the message, block until user confirmation, and then return an empty string.'
  }
];

for (const definition of dialogFunctions) standardLibraryFunction(definition);

// WBXML 1.3 selected Class C decoder clauses.
clause('wbxml', 'network_byte_order', ['WBXML-C-001'], '5', 'implicit-must', 'binary-decoder', 'Decode multi-byte fields and bit fields using the specified most-significant-first network ordering.');
clause('wbxml', 'multibyte_continuation', ['WBXML-C-001'], '5.1', 'implicit-must', 'binary-decoder', 'Decode a multi-byte integer from seven-bit groups whose high bit marks every non-final octet.');
clause('wbxml', 'multibyte_group_order', ['WBXML-C-001'], '5.1', 'implicit-must', 'binary-decoder', 'Combine multi-byte integer groups in most-significant-group-first order.');
clause('wbxml', 'multibyte_unused_zero', ['WBXML-C-001'], '5.1', 'explicit-must', 'binary-decoder', 'Require unused value bits in the initial multi-byte integer octet to be zero.');
clause('wbxml', 'charset_internal_default', ['WBXML-C-001'], '5.2', 'explicit-must', 'binary-decoder', 'Without external charset metadata, present strings using the encoding named by the WBXML charset field.');
clause('wbxml', 'charset_external_precedence', ['WBXML-C-001'], '5.2', 'explicit-should', 'transport-boundary', 'When external and internal charset metadata coexist, apply the precedence and conflict policy of the carrying protocol.');
clause('wbxml', 'charset_string_termination', ['WBXML-C-001'], '5.2', 'explicit-must', 'binary-decoder', 'Detect string termination according to the selected character encoding rather than assuming a one-byte terminator.');
clause('wbxml', 'charset_unrepresentable_name', ['WBXML-C-001'], '5.2', 'error-condition', 'binary-decoder', 'Treat a tag or attribute name that cannot be represented in the target character set as a tokenization error.');
clause('wbxml', 'document_header_order', ['WBXML-C-001'], '5.3', 'grammar', 'binary-decoder', 'Decode each document in version, public identifier, charset, string-table, then body order.');
clause('wbxml', 'document_body_grammar', ['WBXML-C-001'], '5.3', 'grammar', 'binary-decoder', 'Enforce the WBXML element, attribute, content, string, entity, processing-instruction, extension, and opaque-data grammar.');
clause('wbxml', 'version_byte', ['WBXML-C-001'], '5.4', 'implicit-must', 'binary-decoder', 'Decode the initial version byte as major-minus-one in the high nibble and minor version in the low nibble.');
clause('wbxml', 'public_id_numeric', ['WBXML-C-001'], '5.5', 'implicit-must', 'binary-decoder', 'Accept a positive multi-byte numeric public identifier for a known document type.');
clause('wbxml', 'public_id_string_table', ['WBXML-C-001'], '5.5', 'implicit-must', 'binary-decoder', 'When public identifier is zero, resolve its following index through the string table.');
clause('wbxml', 'charset_mibenum', ['WBXML-C-001'], '5.6', 'implicit-must', 'binary-decoder', 'Interpret the charset field as an IANA MIBenum value, with zero meaning unknown.');
clause('wbxml', 'string_table_required', ['WBXML-C-001'], '5.7', 'explicit-must', 'binary-decoder', 'Read a string-table length immediately after charset even when the table is empty.');
clause('wbxml', 'string_table_length', ['WBXML-C-001'], '5.7', 'implicit-must', 'binary-decoder', 'Treat string-table length as its byte count excluding the encoded length field.');
clause('wbxml', 'string_table_offsets', ['WBXML-C-001'], '5.7', 'implicit-must', 'binary-decoder', 'Resolve string-table references as byte offsets from the first table byte.');
clause('wbxml', 'token_global_application_spaces', ['WBXML-C-001'], '5.8', 'implicit-must', 'binary-decoder', 'Distinguish fixed global tokens from context-dependent application tokens.');
clause('wbxml', 'token_tag_attribute_spaces', ['WBXML-C-001'], '5.8', 'implicit-must', 'binary-decoder', 'Interpret application token values in separate tag and attribute code spaces.');
clause('wbxml', 'token_code_pages', ['WBXML-C-001'], '5.8', 'implicit-must', 'binary-decoder', 'Support 256 code pages per code space and reserve page 255 for implementation-specific use.');
clause('wbxml', 'parser_state_pages', ['WBXML-C-001'], '5.8.1', 'implicit-must', 'binary-decoder', 'Maintain separate current code pages for tag and attribute parser states, each initialized to page zero.');
clause('wbxml', 'parser_switch_persistence', ['WBXML-C-001'], '5.8.1', 'implicit-must', 'binary-decoder', 'Keep a selected code page active for its parser state until another switch in that state or document end.');
clause('wbxml', 'tag_attribute_bit', ['WBXML-C-001'], '5.8.2', 'table', 'binary-decoder', 'Use tag bit seven to determine whether an END-terminated attribute list follows.');
clause('wbxml', 'tag_content_bit', ['WBXML-C-001'], '5.8.2', 'table', 'binary-decoder', 'Use tag bit six to determine whether content and its terminating END follow.');
clause('wbxml', 'tag_identity_bits', ['WBXML-C-001'], '5.8.2', 'table', 'binary-decoder', 'Use tag bits zero through five as the application tag identity.');
clause('wbxml', 'tag_attributes_before_content', ['WBXML-C-001'], '5.8.2', 'implicit-must', 'binary-decoder', 'When a tag has attributes and content, decode the complete attribute list before content.');
clause('wbxml', 'attribute_start_range', ['WBXML-C-001'], '5.8.3', 'implicit-must', 'binary-decoder', 'Interpret non-global attribute tokens below 128 as attribute starts that may include a value prefix.');
clause('wbxml', 'attribute_value_range', ['WBXML-C-001'], '5.8.3', 'implicit-must', 'binary-decoder', 'Interpret non-global attribute tokens at or above 128 only as known attribute-value fragments.');
clause('wbxml', 'attribute_sequence', ['WBXML-C-001'], '5.8.3', 'explicit-must', 'binary-decoder', 'Start every encoded attribute with one attribute-start token and terminate its value at the next start, literal, or END token.');
clause('wbxml', 'attribute_literal_value_prohibition', ['WBXML-C-001'], '5.8.3', 'explicit-must', 'binary-decoder', 'Do not interpret LITERAL as encoding any portion of an attribute value.');
clause('wbxml', 'global_token_invariance', ['WBXML-C-001'], '5.8.4', 'implicit-must', 'binary-decoder', 'Give each global token the same structure and meaning in every code space and page.');
clause('wbxml', 'inline_string', ['WBXML-C-001'], '5.8.4.1', 'grammar', 'binary-decoder', 'Decode STR_I as encoding-dependent terminated inline character data.');
clause('wbxml', 'table_string', ['WBXML-C-001'], '5.8.4.1', 'grammar', 'binary-decoder', 'Decode STR_T as a multi-byte byte offset into the string table.');
clause('wbxml', 'empty_attribute_string', ['WBXML-C-001'], '5.8.4.1', 'explicit-must', 'binary-decoder', 'Recognize an explicitly encoded empty string in attribute-value contexts where the application defines no other encoding.');
clause('wbxml', 'extension_token_forms', ['WBXML-C-001'], '5.8.4.2', 'grammar', 'binary-decoder', 'Decode single-byte, inline-string, and inline-integer extension token forms.');
clause('wbxml', 'extension_switch_context', ['WBXML-C-001'], '5.8.4.2', 'implicit-must', 'binary-decoder', 'Apply a switch preceding an extension to the tag page in content and the attribute page in an attribute list.');
clause('wbxml', 'entity_ucs4', ['WBXML-C-001'], '5.8.4.3', 'implicit-must', 'binary-decoder', 'Decode ENTITY followed by a multi-byte UCS-4 character value with XML numeric-entity semantics.');
clause('wbxml', 'processing_instruction', ['WBXML-C-001'], '5.8.4.4', 'implicit-must', 'binary-decoder', 'Decode PI target and optional value using attribute-start/value syntax terminated by END.');
clause('wbxml', 'literal_name_state', ['WBXML-C-001', 'WBXML-C-011'], '5.8.4.5', 'implicit-must', 'binary-decoder', 'Interpret a LITERAL name as a tag or attribute according to parser state and resolve its name through the string table.');
clause('wbxml', 'literal_tag_flags', ['WBXML-C-001', 'WBXML-C-011'], '5.8.4.5', 'implicit-must', 'binary-decoder', 'Honor the attribute and content flags encoded by LITERAL_A, LITERAL_C, and LITERAL_AC.');
clause('wbxml', 'opaque_length', ['WBXML-C-001'], '5.8.4.6', 'implicit-must', 'binary-decoder', 'Decode OPAQUE as a multi-byte length followed by exactly that many application-specific bytes.');
clause('wbxml', 'end_token', ['WBXML-C-001'], '5.8.4.7.1', 'implicit-must', 'binary-decoder', 'Use END to terminate the current attribute list or element as determined by parser state.');
clause('wbxml', 'switch_page_token', ['WBXML-C-001'], '5.8.4.7.2', 'implicit-must', 'binary-decoder', 'Decode SWITCH_PAGE and its following page byte for the current parser state.');

clause('wbxml', 'default_attributes_omitted', ['WBXML-C-010'], '6.3', 'explicit-may', 'binary-decoder', 'Accept tokenized elements that omit attributes equal to declared default, fixed, or applicable implied values.');
clause('wbxml', 'default_attributes_reconstructed', ['WBXML-C-010'], '6.3', 'explicit-must', 'binary-decoder', 'Reconstruct omitted attribute values from the version-appropriate document-type defaults before presenting the decoded XML model.');
clause('wbxml', 'external_token_typing', ['WBXML-C-011'], '6.4', 'explicit-must', 'transport-boundary', 'Use an external typing system to associate an XML document family with its WBXML token values.');
clause('wbxml', 'mime_token_typing', ['WBXML-C-011'], '6.4', 'explicit-must', 'transport-boundary', 'For WSP, HTTP, or SMTP transport, use the MIME media type as the token-value association key.');
clause('wbxml', 'binary_literal_equivalence', ['WBXML-C-011'], '6.4', 'explicit-must', 'binary-decoder', 'Decode both assigned binary tokens and literal encodings for every tag name, attribute name, and attribute value.');

const familyDefinitions = [
  {
    family: 'wml',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wml-scr.json`,
    selectedDisposition: 'required-by-class-c-client-mcf',
    clauseSources: ['WAP-191_104-WML']
  },
  {
    family: 'wae',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wae-scr.json`,
    selectedDisposition: 'required-by-class-c-client-mcf',
    clauseSources: [
      'WAP-190-WAESpec',
      'WAP-190_101-WAESpec',
      'WAP-190_103-WAESpec',
      'rfc-2396',
      'rfc-2616',
      'rfc-2617'
    ]
  },
  {
    family: 'wbxml',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wbxml-scr.json`,
    selectedDisposition: 'required-by-class-c-client-mcf',
    clauseSources: ['WAP-192-WBXML', 'WAP-192_105-WBXML']
  },
  {
    family: 'caching',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-caching-scr.json`,
    selectedDisposition: 'required-by-class-c-client-mcf',
    clauseSources: ['WAP-120-WAPCachingMod', 'rfc-2616']
  },
  {
    family: 'wcmp',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wcmp-scr.json`,
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    clauseSources: ['WAP-202-WCMP']
  },
  {
    family: 'wsp',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wsp-scr.json`,
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    clauseSources: ['WAP-203-WSP', 'WAP-203_001-WSP']
  },
  {
    family: 'wdp',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wdp-scr.json`,
    selectedDisposition: 'required-by-selected-class-c-transport-path',
    clauseSources: ['WAP-200-WDP', 'rfc-768', 'rfc-791']
  },
  {
    family: 'wmlscript',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wmlscript-scr.json`,
    selectedDisposition: 'required-by-class-c-client-mcf',
    clauseSources: ['WAP-193_101-WMLScript']
  },
  {
    family: 'wmlscript-libraries',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wmlscript-libraries-scr.json`,
    selectedDisposition: 'required-by-class-c-client-mcf',
    clauseSources: ['WAP-194-WMLScriptLibraries', 'rfc-2396']
  }
];

const families = familyDefinitions.map((definition) => {
  const parentLedger = readJson(definition.ledgerPath);
  const selectedParents = parentLedger.obligations.filter(
    (obligation) =>
      obligation.disposition?.classCProfile ===
      definition.selectedDisposition
  );
  const parentById = new Map(
    selectedParents.map((obligation) => [obligation.id, obligation])
  );
  const familyClauses = clauseRows.filter(
    (candidate) => candidate.family === definition.family
  );

  for (const candidate of familyClauses) {
    for (const parentId of candidate.parentRows) {
      if (!parentById.has(parentId)) {
        throw new Error(
          `${candidate.id}: parent ${parentId} is not selected by ${definition.family}`
        );
      }
    }
    const parents = candidate.parentRows.map((parentId) =>
      parentById.get(parentId)
    );
    candidate.mapping = {
      ownerLayers: [
        ...new Set(parents.flatMap((parent) => parent.mapping.ownerLayers))
      ].sort(),
      workItems: [
        ...new Set(parents.flatMap((parent) => parent.mapping.workItems))
      ].sort(),
      requirementIds: [
        ...new Set(parents.flatMap((parent) => parent.mapping.requirementIds))
      ].sort(),
      parentImplementationSnapshot: Object.fromEntries(
        parents.map((parent) => [
          parent.id,
          parent.mapping.implementationStatus
        ])
      ),
      clauseImplementationStatus: 'not-assessed',
      evidenceGate:
        'A source-derived direct fixture and reviewed code/test evidence are required before this clause may be marked implemented.'
    };
  }

  const parents = selectedParents.map((parent) => {
    const clauseIds = familyClauses
      .filter((candidate) => candidate.parentRows.includes(parent.id))
      .map((candidate) => candidate.id)
      .sort();
    if (clauseIds.length === 0) {
      throw new Error(`${definition.family}/${parent.id}: no nested clauses`);
    }
    return {
      id: parent.id,
      feature: parent.feature,
      referencedSection: parent.referencedSection,
      sourceAnchor: parent.sourceAnchor,
      implementationStatus: parent.mapping.implementationStatus,
      ownerLayers: parent.mapping.ownerLayers,
      workItems: parent.mapping.workItems,
      clauseIds
    };
  });

  const effectiveFamily = effectiveSpec.families.find(
    (candidate) => candidate.family === definition.family
  );
  return {
    family: definition.family,
    status: 'nested-clauses-anchored-fixtures-planned',
    parentLedger: definition.ledgerPath,
    parentLedgerSha256: sha256(
      fs.readFileSync(definition.ledgerPath, 'utf8')
    ),
    effectiveSequence: effectiveFamily.effectiveSequence,
    selectedDisposition: definition.selectedDisposition,
    clauseSources: definition.clauseSources.map((documentId) => {
      const ingestionMember = ingestionById.get(documentId);
      const releaseMember = releaseById.get(documentId);
      if (!releaseMember || !ingestionMember) {
        const externalDependency = externalIngestionById.get(documentId);
        const artifact = sourceInputs.get(documentId)?.externalArtifact;
        if (!externalDependency || !artifact) {
          throw new Error(`${documentId}: missing clause source lock`);
        }
        return {
          documentId,
          sourceKind: 'external-dependency',
          authority: externalDependency.authority,
          authorityRecordUrl: externalDependency.authorityRecordUrl,
          artifactId: artifact.id,
          artifactSha256: artifact.sha256,
          artifactBytes: artifact.bytes
        };
      }
      return {
        documentId,
        sourceKind: 'release-member',
        filename: releaseMember.filename,
        pdfSha256: releaseMember.sha256,
        textExtractionSha256: ingestionMember.parsedText.sha256
      };
    }),
    selectedParentCount: parents.length,
    clauseCount: familyClauses.length,
    parents,
    clauses: familyClauses
  };
});

const selectedParentCount = families.reduce(
  (total, family) => total + family.selectedParentCount,
  0
);
const clauseCount = families.reduce(
  (total, family) => total + family.clauseCount,
  0
);
const requiredClauseCount = clauseRows.filter(
  (candidate) => candidate.obligationLevel === 'required'
).length;
const recommendedClauseCount = clauseRows.filter(
  (candidate) => candidate.obligationLevel === 'recommended'
).length;
const permittedClauseCount = clauseRows.filter(
  (candidate) => candidate.obligationLevel === 'permitted'
).length;

const ledger = {
  schemaVersion: 1,
  releaseId: release.release.id,
  generatedFrom: {
    programWorkItem: 'CONF-003',
    recordedOn,
    generator:
      'spec-processing/scripts/generate-wap-selected-normative-clauses.mjs',
    redistributionPolicy:
      'Only project-authored synopses, public section locators, and cryptographic hashes are committed. Recovered PDFs and full text extractions remain outside Git.'
  },
  target: {
    stack: 'WAP 1.2.1',
    markup: 'WML 1.3',
    classProfile: 'WAP-215 Class C client (CCR-CLASSC-C-001)'
  },
  scope: {
    status: 'complete',
    selectedProfileParentCount: 201,
    coveredFamilies: [
      'wml',
      'wae',
      'wbxml',
      'caching',
      'wcmp',
      'wsp',
      'wdp',
      'wmlscript',
      'wmlscript-libraries'
    ],
    remainingFamilies: [],
    coveredSelectedParentCount: selectedParentCount,
    remainingSelectedParentCount: 201 - selectedParentCount,
    completionRule:
      'CONF-003 is complete because every selected row in all nine mandatory Class C families has one or more anchored, deduplicated nested clauses.'
  },
  interpretation: {
    normativeForce:
      'Explicit RFC-style terms, formal grammar/tables, declared error conditions, and the WML specification implicit-MUST convention are classified separately.',
    deduplication:
      'One clause may map to multiple selected SCR parents when a single normative behavior is cross-referenced by those features.',
    implementationAssessment:
      'Parent implementation statuses are snapshots from the family SCR ledgers. Clause status remains not-assessed until direct source-derived fixture evidence is reviewed.'
  },
  summary: {
    selectedParentCount,
    clauseCount,
    requiredClauseCount,
    recommendedClauseCount,
    permittedClauseCount,
    plannedFixtureCount: clauseCount,
    assessedClauseCount: 0
  },
  families
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`);

console.log(
  `Wrote ${outputPath}: ${selectedParentCount} selected parents / ${clauseCount} deduplicated clauses`
);
