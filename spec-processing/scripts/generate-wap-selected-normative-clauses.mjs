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
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-selected-normative-clauses.json';

if (!wmlTextPath || !wbxmlTextPath || !wbxmlSinTextPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-selected-normative-clauses.mjs ' +
      '--wml-text /absolute/path/WAP-191_104-WML-20010718-a.txt ' +
      '--wbxml-text /absolute/path/WAP-192-WBXML-20010725-a.txt ' +
      '--wbxml-sin-text /absolute/path/WAP-192_105-WBXML-20011015-a.txt ' +
      '--recorded-on YYYY-MM-DD [--output path]'
  );
  process.exit(2);
}

const manifestDirectory = 'spec-processing/source-manifests';
const release = readJson(`${manifestDirectory}/wap-1.2.1-release.json`);
const ingestion = readJson(
  `${manifestDirectory}/wap-1.2.1-ingestion-status.json`
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
  ]
]);
const ingestionById = new Map(
  ingestion.members.map((member) => [member.documentId, member])
);
const releaseById = new Map(
  release.members.map((member) => [member.documentId, member])
);

for (const [documentId, source] of sourceInputs) {
  const expectedTextHash = ingestionById.get(documentId)?.parsedText?.sha256;
  const actualTextHash = sha256(source.text);
  if (!expectedTextHash || actualTextHash !== expectedTextHash) {
    throw new Error(
      `${documentId}: text extraction SHA-256 ${actualTextHash} does not match ingestion lock ${expectedTextHash}`
    );
  }
  source.textSha256 = actualTextHash;
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
  }
};

function extractSection(family, section) {
  const definition = sectionDefinitions[family];
  const [startHeading, endHeading] = definition?.ranges?.[section] ?? [];
  if (!definition || !startHeading || !endHeading) {
    throw new Error(`${family}/${section}: missing section range`);
  }
  const source = sourceInputs.get(definition.sourceDocumentId);
  const start = source.text.indexOf(`\n${startHeading}\n`);
  const end = source.text.indexOf(`\n${endHeading}\n`, start + 1);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `${family}/${section}: cannot resolve ${startHeading} -> ${endHeading}`
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
for (const [family, definition] of Object.entries(sectionDefinitions)) {
  for (const section of Object.keys(definition.ranges)) {
    sectionAnchors.set(`${family}:${section}`, extractSection(family, section));
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
  obligationSynopsis
) {
  clauseRows.push({
    id: `${family.toUpperCase()}-CL-${key.toUpperCase().replaceAll('_', '-')}`,
    family,
    parentRows,
    sourceAnchor: sectionAnchors.get(`${family}:${section}`),
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
    family: 'wbxml',
    ledgerPath: `${manifestDirectory}/wap-1.2.1-wbxml-scr.json`,
    selectedDisposition: 'required-by-class-c-client-mcf',
    clauseSources: ['WAP-192-WBXML', 'WAP-192_105-WBXML']
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
      return {
        documentId,
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
    status: 'in-progress',
    selectedProfileParentCount: 201,
    coveredFamilies: ['wml', 'wbxml'],
    remainingFamilies: [
      'wae',
      'wmlscript',
      'wmlscript-libraries',
      'caching',
      'wdp',
      'wcmp',
      'wsp'
    ],
    coveredSelectedParentCount: selectedParentCount,
    remainingSelectedParentCount: 201 - selectedParentCount,
    completionRule:
      'CONF-003 remains open until every selected row in all nine mandatory Class C families has one or more anchored, deduplicated nested clauses.'
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
