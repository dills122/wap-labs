#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

const wmlTextPath = option('--wml-text');
const sin105TextPath = option('--sin-105-text');
const recordedOn = option('--recorded-on');
const outputPath =
  option('--output') ??
  'spec-processing/source-manifests/wap-1.2.1-wml-scr.json';

if (!wmlTextPath || !sin105TextPath || !recordedOn) {
  console.error(
    'Usage: node spec-processing/scripts/generate-wap-wml-scr-ledger.mjs ' +
      '--wml-text /absolute/path/WAP-191_104.txt ' +
      '--sin-105-text /absolute/path/WAP-191_105.txt ' +
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
  !classConformance.selectedTarget?.requirementExpressions?.includes('WML:MCF')
) {
  throw new Error(
    'WAP-215 class ledger must select CCR-CLASSC-C-001 with WML:MCF'
  );
}

const wmlFamily = effectiveSpec.families.find(
  (family) => family.family === 'wml'
);
if (!wmlFamily) {
  throw new Error('Effective-spec graph does not contain the WML family');
}

const sourceById = new Map(
  wmlFamily.documents.map((document) => [document.documentId, document])
);
const requiredSourceIds = ['WAP-191_104-WML', 'WAP-191_105-WML'];
for (const sourceId of requiredSourceIds) {
  if (!sourceById.has(sourceId)) {
    throw new Error(`Effective WML source is missing: ${sourceId}`);
  }
}

const wmlText = fs.readFileSync(wmlTextPath, 'utf8');
const sin105Text = fs.readFileSync(sin105TextPath, 'utf8');
const statementMatch = /15\.\s+Static Conformance Statement/.exec(wmlText);
const statementStart = statementMatch?.index ?? -1;
if (statementStart === -1) {
  throw new Error('WAP-191_104 text does not contain section 15');
}

const rowPattern =
  /^\s*(WML-[CS]-\d{2})\s+(.+?)\s+(\d+(?:\.\d+)*)\s+([MO])(?:\s+(WML-[CS]-\d{2}))?\s*$/gm;
function extractRows(text) {
  const plainRows = [...text.matchAll(rowPattern)].map((match) => ({
      id: match[1],
      feature: match[2].replace(/\s+/g, ' ').trim(),
      referencedSection: match[3],
      status: match[4],
      dependency: match[5] ?? null
    }));
  const markdownRows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\|\s*WML-[CS]-\d{2}\s*\|/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((value) => value.trim()))
    .map(([id, feature, referencedSection, status, dependency]) => {
      const combined = /^(\d+(?:\.\d+)*)\s+([MO])$/.exec(referencedSection);
      return combined && !status
        ? [id, feature, combined[1], combined[2], dependency]
        : [id, feature, referencedSection, status, dependency];
    })
    .filter(
      ([id, , referencedSection, status]) =>
        /^WML-[CS]-\d{2}$/.test(id) &&
        /^\d+(?:\.\d+)*$/.test(referencedSection) &&
        /^[MO]$/.test(status)
    )
    .map(([id, feature, referencedSection, status, dependency]) => ({
      id,
      feature: feature.replace(/\s+/g, ' ').trim(),
      referencedSection,
      status,
      dependency: /^WML-[CS]-\d{2}$/.test(dependency) ? dependency : null
    }));
  const rows = [...plainRows, ...markdownRows]
    .sort((left, right) => numberOf(left) - numberOf(right));
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

const extracted104Rows = extractRows(wmlText.slice(statementStart));
const sin105Start = sin105Text.indexOf('3. Addition of SCR for tabindex');
if (sin105Start === -1) {
  throw new Error('WAP-191_105 text does not contain the tabindex SCR change');
}
const extracted105Rows = extractRows(sin105Text.slice(sin105Start)).filter(
  (row) => row.id === 'WML-C-76'
);

if (extracted104Rows.length !== 75) {
  throw new Error(
    `Expected 75 section 15 rows from WAP-191_104, found ${extracted104Rows.length}`
  );
}
if (extracted105Rows.length !== 1) {
  throw new Error(
    `Expected one WML-C-76 row from WAP-191_105, found ${extracted105Rows.length}`
  );
}

const featureOverrides = new Map(
  Object.entries({
    'WML-C-04': 'Other character encoding',
    'WML-C-08': 'Card/Deck task shadowing',
    'WML-C-11': 'Initialisation (newcontext)',
    'WML-C-54': 'Display of alt attribute of <img>',
    'WML-C-58': 'Support for <img> height',
    'WML-S-63': 'WML Validation',
    'WML-S-64': 'Variable references may only occur in vdata attribute values',
    'WML-S-65': 'Variable references must match the production rule var',
    'WML-S-66':
      'Two or more do elements with the same name must not be present in a single card or in the template element',
    'WML-S-67':
      'A meta element must not contain more than one attribute of name and http-equiv',
    'WML-S-68': 'The number of columns in a table must not be set to zero',
    'WML-S-69': 'Event bindings must not conflict',
    'WML-C-70': 'Variable references must match the production rule var',
    'WML-C-71':
      'Two or more do elements with the same name must not be present in a single card or in the template element',
    'WML-C-72':
      'A meta element must not contain more than one attribute of name and http-equiv',
    'WML-C-73': 'The number of columns in a table must not be set to zero',
    'WML-C-74': 'Event bindings must not conflict'
  })
);

// Docling drops the trailing zero from this SCR table cell even though the
// effective WML source heading and normative clauses identify section 9.10.
const referencedSectionOverrides = new Map([['WML-C-09', '9.10']]);

function numberOf(row) {
  return Number(row.id.slice(-2));
}

function sourceSubsection(number) {
  if (number <= 6) return '15.1.1';
  if (number <= 9) return '15.1.2';
  if (number <= 13) return '15.1.3';
  if (number <= 18) return '15.1.4';
  if (number <= 53 || number === 75 || number === 76) return '15.1.5';
  if (number <= 59) return '15.1.6';
  if (number === 60) return '15.2.1';
  if (number <= 63) return '15.2.2';
  if (number <= 69) return '15.3';
  return '15.4';
}

function actorFor(number) {
  if (number <= 59 || number === 75 || number === 76) {
    return 'wml-user-agent';
  }
  if (number <= 63) return 'wml-encoder';
  if (number <= 69) return 'wml-document-server';
  return 'wml-document-client';
}

function classCDisposition(actor, specificationStatus) {
  if (actor === 'wml-user-agent') {
    return specificationStatus === 'mandatory'
      ? 'required-by-class-c-client-mcf'
      : 'optional-not-required-by-class-c-client';
  }
  if (actor === 'wml-document-client') {
    return 'optional-not-required-by-class-c-client';
  }
  return 'not-applicable-to-class-c-client';
}

const renderIds = new Set([
  22, 23, 24, 27, 31, 32, 36, 44, 45, 46, 49, 50, 51, 54, 55, 56, 57,
  58, 59, 75
]);
const navigationIds = new Set([7, 8, 9, 18, 19, 20, 26, 29, 35, 37, 38, 39, 42, 52]);
const parserIds = new Set([21, 25, 28, 30, 33, 34, 40, 41, 43, 47, 48, 53, 76]);

function codeEvidence(pathname, symbol) {
  return { path: pathname, symbol };
}

function engineTest(pathname, test) {
  return {
    path: pathname,
    test,
    command: `cd engine-wasm/engine && cargo test ${test}`
  };
}

function transportTest(pathname, test) {
  return {
    path: pathname,
    test,
    command: `cd transport-rust && cargo test --lib ${test}`
  };
}

const mandatoryImplementationAudit = new Map(
  Object.entries({
    'WML-C-05': {
      status: 'partial',
      note:
        'The transport maps UTF-8-compatible input and BOM-marked UTF-16, but the full recognized-charset and external-metadata precedence model is not implemented.',
      implementationEvidence: [
        codeEvidence('transport-rust/src/responses.rs', 'decode_textual_wml_payload')
      ],
      testEvidence: [
        transportTest(
          'transport-rust/src/tests/fetch_mapping.rs',
          'transport_map_success_payload_utf16le_textual_wml_maps_ok'
        )
      ]
    },
    'WML-C-06': {
      status: 'partial',
      note:
        'Named-entity processing is exercised, but the complete decimal/hexadecimal, nbsp, shy, and Unicode entity behavior is not covered.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/xml.rs',
          'decode_general_entity'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'decodes_entities_and_uses_href_as_fallback_link_text'
        )
      ]
    },
    'WML-C-07': {
      status: 'partial',
      note:
        'Card history push/pop and deterministic empty-history behavior exist; full WML request identity and context semantics remain broader than the engine stack.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'navigate_back_internal'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'navigate_back_restores_previous_card'
        )
      ]
    },
    'WML-C-08': {
      status: 'implemented',
      note:
        'The shared deck runtime resolves ordered card and template do/onevent bindings by effective identity, applies card precedence, and removes noop bindings without task side effects.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/runtime/deck.rs',
          'active_event_bindings'
        ),
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'active_onevent_action_internal'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'wml_202_template_do_shadowing_and_noop_masking_cover_all_active_set_cases'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'wml_202_card_intrinsic_binding_masks_or_overrides_template_binding'
        )
      ]
    },
    'WML-C-09': {
      status: 'partial',
      note:
        'Card/template onenterforward, onenterbackward, and ontimer bindings execute with cross-syntax precedence, but the broader intrinsic-event model remains incomplete.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'push_onevent_binding'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'navigate_runs_onenterforward_action'
        )
      ]
    },
    'WML-C-10': {
      status: 'partial',
      note:
        'The engine holds variables, navigation history, and runtime state together, but the complete browser-context lifecycle is not modeled.',
      implementationEvidence: [
        codeEvidence('engine-wasm/engine/src/lib.rs', 'WmlEngine')
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/traces_public_api.rs',
          'm1_02_load_deck_context_public_api_sets_metadata_and_state'
        )
      ]
    },
    'WML-C-11': {
      status: 'missing',
      note:
        'The WML card newcontext attribute is not parsed or applied during go traversal; WMLScript newContext support is not a substitute.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-12': {
      status: 'partial',
      note:
        'Runtime variables exist, and active input/select edits commit before card task execution. General PCDATA, vdata, HREF, conversion, escaping, and undefined-value substitution remain incomplete.',
      implementationEvidence: [
        codeEvidence('engine-wasm/engine/src/engine_public_api.rs', 'set_var'),
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'execute_card_task_action'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'focused_input_edit_commit_updates_render_and_runtime_var'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'wml_fx_variable_commit_before_task_commits_active_input_before_accept'
        )
      ]
    },
    'WML-C-13': {
      status: 'missing',
      note:
        'Independent user navigation does not establish a separately modeled WML browser context.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-14': {
      status: 'missing',
      note:
        'Deck access, domain, path, and sendreferer enforcement is not implemented.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-16': {
      status: 'implemented',
      note:
        'Strict WML 1.3 loads preserve XML case sensitivity, reject an invalid form of every declared element, enforce the specification-defined literal, length, table, task, event, variable, prologue, and structural error conditions, and publish deterministic diagnostics without replacing the active deck. Host fetch and destination access failures notify the user while preserving the invoking engine state, pending external intent, committed deck session, and history.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/validation.rs',
          'validate_wml13_document'
        ),
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/xml.rs',
          'start_to_element'
        ),
        codeEvidence(
          'browser/frontend/src/app/navigation-state.ts',
          'loadTransportUrl'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/wml_load_errors.rs',
          'wml_205_rejects_an_invalid_form_of_every_declared_wml_element_atomically'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/wml_load_errors.rs',
          'wml_205_enforces_case_literal_length_and_cross_attribute_error_conditions'
        )
      ]
    },
    'WML-C-17': {
      status: 'partial',
      note:
        'Canonical WML 1.3 and alternate external DTD identities are classified without fetching a DTD; alternate-DTD unknown wrappers and attributes are ignored while recognized child content is retained. Strict prologue-presence enforcement, internal subsets, and full DTD validation remain open.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'map_inline_nodes_recursive'
        ),
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/xml.rs',
          'classify_wml_doctype'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'parses_mixed_inline_text_links_break_and_unknown_wrappers'
        ),
        {
          path: 'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          test: 'wml_203_alternate_doctype_ignores_unknown_markup_and_preserves_known_content',
          command:
            'cargo test --manifest-path engine-wasm/engine/Cargo.toml wml_203_alternate_doctype_ignores_unknown_markup_and_preserves_known_content'
        }
      ]
    },
    'WML-C-18': {
      status: 'partial',
      note:
        'Covered go/prev/noop/refresh and rollback paths are ordered deterministically, but setvar, access, newcontext, fetched-deck, and complete fragment-fallback steps remain open.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'execute_card_task_action'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'fixture_accept_go_trace_order_is_deterministic'
        )
      ]
    },
    'WML-C-19': {
      status: 'partial',
      note:
        'The a element parses and activates internal/external navigation, but full HREF variable substitution and equivalent-go behavior are incomplete.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'map_inline_nodes_recursive'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'enter_navigates_to_fragment_card'
        )
      ]
    },
    'WML-C-20': {
      status: 'missing',
      note:
        'The anchor element and its nested task/setvar model are not represented.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-21': {
      status: 'partial',
      note:
        'The access element is parsed and retained, its grammar and uniqueness are enforced, and the engine applies defaults, component-aware domain/path matching, relative-path resolution, and URL case rules against the host-supplied referring URI before committing a deck transition. The parent stays partial only because the broader DECK-ACCESS-REQUIRED clause, including sendreferer behavior assigned to WML-304, remains not assessed.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/head.rs',
          'parse_access'
        ),
        codeEvidence(
          'engine-wasm/engine/src/runtime/deck.rs',
          'DeckAccessControl'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_202_retains_access_and_ordered_meta_for_the_whole_deck'
        ),
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_202_rejects_invalid_head_access_and_meta_structure_deterministically'
        )
      ]
    },
    'WML-C-24': {
      status: 'implemented',
      note:
        'Card-level br emits a break (Node::Break), and inline br (nested with text/links/inputs/selects in the same paragraph) now emits a dedicated InlineNode::Break honored by the layout engine as a direct line advance, rather than collapsing to an ordinary whitespace text segment. The prior inline path was a silent no-op, not merely a downgraded break: `wrap_text` returns zero chunks for an all-whitespace segment, so the break neither rendered nor advanced the line.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'map_card_level_nodes'
        ),
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'map_inline_nodes_recursive'
        ),
        codeEvidence(
          'engine-wasm/engine/src/layout/flow_layout.rs',
          'layout_card'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'parses_mixed_card_level_content_paths'
        ),
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'parses_mixed_inline_text_links_break_and_unknown_wrappers'
        ),
        engineTest(
          'engine-wasm/engine/src/layout/flow_layout.rs',
          'inline_break_forces_a_hard_line_break_between_segments'
        )
      ]
    },
    'WML-C-25': {
      status: 'partial',
      note:
        'Card collection, event/timer/content ordering, source presentation order, language, newcontext, and ordered attributes are parsed and applied with deterministic defaults. The parent stays partial because card-fragment and table-boundary clauses remain assigned to additive WML-301 outside WML-202.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/mod.rs',
          'parse_wml'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'parses_cards_and_links'
        )
      ]
    },
    'WML-C-26': {
      status: 'partial',
      note:
        'Named do bindings retain type/name/label/optional/language metadata and execute with deterministic card/template precedence; dynamic visibility, labelling, and unique user-interface presentation remain incomplete under WBP-06.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'push_do_binding'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/wml_303_actions.rs',
          'wml_303_retains_do_identity_metadata_and_orders_active_actions'
        )
      ]
    },
    'WML-C-29': {
      status: 'partial',
      note:
        'Fragment, external, GET/POST, and script href paths exist, but the complete section 12.5 go process is not implemented.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'execute_action_href'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'fixture_accept_go_trace_order_is_deterministic'
        )
      ]
    },
    'WML-C-30': {
      status: 'implemented',
      note:
        'The parser enforces a single ordered deck-level head with one or more recognized access/meta children and retains both child models as deck-wide state. Unknown markup remains forward-compatible under WML-C-17 and does not satisfy the recognized head content model.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/head.rs',
          'parse_deck_head'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_202_retains_access_and_ordered_meta_for_the_whole_deck'
        ),
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_202_rejects_invalid_head_access_and_meta_structure_deterministically'
        )
      ]
    },
    'WML-C-32': {
      status: 'missing',
      note:
        'The img element has no parser/runtime/render representation.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-33': {
      status: 'partial',
      note:
        'Input now has deterministic DTD-derived syntax validation, Basic Latin format-mask and emptyok enforcement at commit, maxlength enforcement, and name/value initialization interleaved with select controls in document order. Control-scoped vdata references validate and evaluate with exact CDATA, literal-dollar, undefined-variable, case-sensitive-name, and conversion semantics; invalid masks fall back to *M; invalid existing/default values follow unset/fallback rules; rejected commits preserve the prior variable and active draft for retry. The selected WML-204 tranche is complete; language-aware non-Basic-Latin mask repertoires and broader title/accesskey presentation semantics remain assigned to additive WML-308 and keep this parent row partial.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'parse_input_inline_node'
        ),
        codeEvidence(
          'engine-wasm/engine/src/runtime/input_mask.rs',
          'InputMask'
        ),
        codeEvidence(
          'engine-wasm/engine/src/runtime/variable.rs',
          'SubstitutionContext'
        ),
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal.rs',
          'commit_focused_input_edit_internal'
        ),
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal.rs',
          'initialize_controls_on_active_card'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'focused_input_edit_commit_updates_render_and_runtime_var'
        ),
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_fx_input_structure_rejects_invalid_syntax_deterministically'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'wml_fx_input_mask_commit_preserves_literals_and_rejection_is_atomic'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'wml_fx_input_empty_commit_applies_format_and_emptyok_precedence'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'invalid_input_format_is_ignored_in_favor_of_default_mask'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'wml_fx_input_initialization_prefers_existing_valid_name_value'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'wml_fx_input_invalid_initial_value_unsets_name_and_uses_valid_default'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'wml_fx_input_initialization_evaluates_vdata_default_in_document_order'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'wml_fx_input_maxlength_limits_draft_and_committed_value'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'wml_fx_input_password_display_conceals_entry_and_preserves_variable'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'invalid_masked_input_blocks_task_without_navigation_side_effects'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_fx_select_init_order_precedence_validation_and_serialization'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'wml_204_input_vdata_conversions_preserve_source_variable'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/wml_load_errors.rs',
          'wml_204_invalid_control_variable_references_reject_load_atomically'
        )
      ]
    },
    'WML-C-35': {
      status: 'implemented',
      note:
        'Noop is parsed as an inactive task binding and produces no navigation, state mutation, task activation, or task trace.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'CardTaskAction::Noop'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'enter_accept_noop_binding_is_inactive_and_keeps_current_card_and_history'
        )
      ]
    },
    'WML-C-36': {
      status: 'partial',
      note:
        'Paragraph grouping and baseline wrapping exist, but align, wrap/nowrap inheritance, nbsp, shy, and horizontal-view behavior are incomplete.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'map_card_level_nodes'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'preserves_inline_text_and_link_order_in_paragraph'
        )
      ]
    },
    'WML-C-37': {
      status: 'partial',
      note:
        'Postfield name/value collection and URL-form payload generation exist, but complete variable-conversion, ordering, and task-failure semantics are not closed.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'collect_post_fields_xml'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'enter_accept_post_action_sets_external_navigation_post_context'
        )
      ]
    },
    'WML-C-38': {
      status: 'partial',
      note:
        'Prev pops card history and executes backward-entry behavior; originating setvar and full fetched-resource identity semantics are absent.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'CardTaskAction::Prev'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'enter_accept_prev_action_navigates_back_when_history_exists'
        )
      ]
    },
    'WML-C-39': {
      status: 'partial',
      note:
        'Card/template intrinsic and option onpick onevent bindings parse, reject same-scope conflicts, and execute with immediate-parent scope and shadowing; timer lifecycle completion remains assigned to WML-305.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'push_onevent_binding'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/wml_303_actions.rs',
          'wml_303_option_onevent_onpick_executes_in_immediate_option_scope'
        )
      ]
    },
    'WML-C-41': {
      status: 'partial',
      note:
        'Option content and allowed attributes receive deterministic DTD-derived syntax validation; exact text labels, absent and explicit empty values, evaluated vdata value references, onpick HREF conversion/dispatch, and immediately scoped onevent task forms are represented. The selected WML-204 and WML-303 tranches are complete; option title/xml:lang presentation remains assigned to additive WML-308 and keeps this parent row partial.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'parse_select_inline_node'
        ),
        codeEvidence(
          'engine-wasm/engine/src/runtime/variable.rs',
          'SubstitutionContext'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'select_control_renders_first_option_by_default'
        ),
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_fx_select_structure_rejects_invalid_syntax_deterministically'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_fx_select_value_and_ivalue_references_are_evaluated_before_assignment'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_fx_option_onpick_single_updates_state_before_only_selected_task'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_fx_option_onpick_multi_fires_for_deselection_after_state_update'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_204_option_vdata_defaults_to_noesc_and_href_defaults_to_escape'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_204_absent_option_value_is_empty_while_label_remains_visible'
        )
      ]
    },
    'WML-C-42': {
      status: 'partial',
      note:
        'Refresh retains the current card/history and resumes timers, but setvar/substitution and full redisplay semantics remain incomplete.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'CardTaskAction::Refresh'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'enter_accept_refresh_action_keeps_current_card_and_history'
        )
      ]
    },
    'WML-C-43': {
      status: 'partial',
      note:
        'Select has deterministic DTD-derived syntax and control-reference validation, nested optgroup option ordering, source-order input/select initialization, complete iname/ivalue/name/value/fallback precedence, validated and deduplicated indices, single/multiple user selection, name/iname serialization, exact vdata option values, task-time variable synchronization, HREF-converted onpick dispatch, and direct proof that variable updates do not implicitly refresh other controls. The selected WML-204 tranche is complete; optional tabindex behavior and optgroup capability declaration remain assigned to additive WML-308 and keep this parent row partial.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'parse_select_inline_node'
        ),
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'execute_card_task_action'
        ),
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal.rs',
          'initial_select_indices'
        ),
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal.rs',
          'sync_select_variables'
        ),
        codeEvidence(
          'engine-wasm/engine/src/runtime/variable.rs',
          'SubstitutionContext'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'focused_select_edit_cycle_commit_updates_render_and_runtime_var'
        ),
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_fx_select_structure_accepts_declared_control_grammar'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'wml_fx_variable_commit_before_task_commits_active_select_before_accept'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_fx_select_default_precedence_covers_every_source_and_fallback'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_fx_select_init_order_precedence_validation_and_serialization'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_fx_select_variables_are_resynchronized_before_link_task_execution'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_fx_select_variable_updates_do_not_implicitly_refresh_other_controls'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_204_control_initialization_interleaves_selects_and_inputs_in_document_order'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/select_semantics.rs',
          'wml_204_option_vdata_defaults_to_noesc_and_href_defaults_to_escape'
        )
      ]
    },
    'WML-C-46': {
      status: 'missing',
      note:
        'Table structure, column normalization, alignment, and layout are not represented.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-47': {
      status: 'implemented',
      note:
        'The parser retains one deck-level template with ordered do/onevent bindings and card-event attributes; the shared runtime applies those bindings to every card unless shadowed.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'parse_template_bindings'
        ),
        codeEvidence(
          'engine-wasm/engine/src/runtime/deck.rs',
          'active_event_bindings'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_202_rejects_invalid_template_structure_deterministically'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'wml_202_template_bindings_persist_across_navigation_and_back'
        )
      ]
    },
    'WML-C-48': {
      status: 'implemented',
      note:
        'WML-305 closes the native timer lifecycle: one timer per card, variable-precedence initialization, tenths units, invalid and zero disabling, entry start, exit persistence and stop, refresh stop-update-resume, start-before-display ordering, one-to-zero ontimer dispatch, rollback, and exact target-neutral host wakeups.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'parse_timer_xml'
        ),
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/timers.rs',
          'advance_time_ms_internal'
        ),
        codeEvidence(
          'engine-wasm/engine/src/engine_public_api.rs',
          'next_timer_wakeup_ms'
        ),
        codeEvidence(
          'browser/frontend/src/app/engine-timer-runtime.ts',
          'scheduleNextWakeup'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/wml_305_timers.rs',
          'wml_305_dispatches_only_when_positive_timer_transitions_to_zero'
        ),
        engineTest(
          'engine-wasm/engine/src/engine_wasm_bindings_tests.rs',
          'wasm_wml_305_named_timer_lifecycle_matches_native_boundary'
        ),
        {
          path: 'engine-wasm/examples/source/wml-305-timer-lifecycle.flow.json',
          test: 'WML-305 executable stories',
          command: 'pnpm test:story WML-305'
        },
        {
          path: 'browser/frontend/src/app/engine-timer-runtime.test.ts',
          test: 'schedules only the exact native timer wakeup and stops it cleanly',
          command: 'pnpm --dir browser/frontend test -- engine-timer-runtime.test.ts'
        }
      ]
    },
    'WML-C-49': {
      status: 'missing',
      note:
        'Table cell structure and significant empty-cell behavior are not represented.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-50': {
      status: 'missing',
      note:
        'Table row structure and significant empty-row behavior are not represented.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-52': {
      status: 'missing',
      note:
        'Markup setvar children of go/prev/refresh are not parsed or applied; WMLScript setVar is a separate feature.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-53': {
      status: 'implemented',
      note:
        'The parser requires a wml root, enforces one ordered head, one ordered template, and one or more cards, and retains all recognized deck-level information. Unknown markup remains forward-compatible under WML-C-17 and does not alter recognized ordering.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/mod.rs',
          'parse_wml'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'wml_202_rejects_invalid_wml_root_structure_deterministically'
        )
      ]
    },
    'WML-C-54': {
      status: 'missing',
      note:
        'Image alt content has no parser or renderer path because img is not represented.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-S-60': {
      status: 'missing',
      note:
        'The project invokes an external WBXML decoder but does not implement the WML encoder/token table required by this actor.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-S-61': {
      status: 'missing',
      note:
        'No WML encoder/tokenizer path performs the actor-specific XML well-formedness gate.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-S-64': {
      status: 'missing',
      note:
        'No server-document authoring validator restricts variable references to vdata attribute values.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-S-65': {
      status: 'missing',
      note:
        'No server-document validator enforces the complete var production.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-S-66': {
      status: 'missing',
      note:
        'No server-document validator rejects duplicate effective do names in a card or template.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-S-67': {
      status: 'missing',
      note:
        'No server-document validator enforces mutual exclusion of meta name and http-equiv.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-S-68': {
      status: 'missing',
      note:
        'No server-document validator rejects table columns equal to zero.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-S-69': {
      status: 'missing',
      note:
        'No server-document validator rejects conflicting event bindings.',
      implementationEvidence: [],
      testEvidence: []
    }
  })
);

function unique(values) {
  return [...new Set(values)];
}

function implementationAuditFor(row) {
  if (row.status === 'O') {
    return {
      implementationStatus: 'not-assessed',
      assessmentNote:
        'Optional capability implementation is deferred to the capability-declaration pass.',
      implementationEvidence: [],
      testEvidence: [],
      evidenceState: 'optional-not-assessed'
    };
  }

  const audit = mandatoryImplementationAudit.get(row.id);
  if (!audit) {
    throw new Error(`Mandatory implementation audit is missing for ${row.id}`);
  }
  return {
    implementationStatus: audit.status,
    assessmentNote: audit.note,
    implementationEvidence: audit.implementationEvidence,
    testEvidence: audit.testEvidence,
    evidenceState:
      audit.testEvidence.length > 0
        ? 'direct-test-linked'
        : 'gap-work-item-mapped'
  };
}

function mappingFor(row) {
  const number = numberOf(row);
  const workItems = ['R0-01'];
  const requirementIds = [];
  let implementationDomain;
  let ownerLayers;

  if (number <= 6) {
    implementationDomain = 'parsing-and-character-processing';
    ownerLayers = ['engine-wasm', 'transport-rust'];
    workItems.push('R0-08');
    if ([5, 6].includes(number)) workItems.push('C5-06');
    requirementIds.push('RQ-RMK-001', 'RQ-WAE-012');
  } else if (number <= 13) {
    implementationDomain =
      number <= 9
        ? 'navigation-and-event-runtime'
        : 'context-and-variable-runtime';
    ownerLayers = ['engine-wasm', 'browser'];
    workItems.push(number === 7 || number >= 10 ? 'R0-03' : 'R0-02');
    if (number === 7) requirementIds.push('RQ-RMK-003', 'RQ-WAE-016');
    if (number === 8) requirementIds.push('RQ-RMK-002');
    if (number === 9) requirementIds.push('RQ-RMK-004');
    if (number >= 10) requirementIds.push('RQ-RMK-003');
    if (number === 12) requirementIds.push('RQ-RMK-005');
  } else if (number <= 18) {
    implementationDomain = 'user-agent-policy-and-navigation';
    ownerLayers = ['engine-wasm', 'browser'];
    workItems.push(number === 18 ? 'R0-02' : 'R0-07');
    if (number === 14) requirementIds.push('RQ-RMK-011');
    if (number === 16) requirementIds.push('RQ-RMK-012');
    if (number === 17) requirementIds.push('RQ-RMK-009');
    if (number === 18) requirementIds.push('RQ-RMK-003');
  } else if (renderIds.has(number) || (number >= 54 && number <= 59)) {
    implementationDomain = 'rendering-and-media';
    ownerLayers = ['engine-wasm', 'browser'];
    workItems.push('R0-05');
    requirementIds.push('RQ-RMK-001');
    if (number === 32 || (number >= 54 && number <= 59)) {
      requirementIds.push('RQ-WAE-006', 'RQ-WAE-018');
    }
  } else if (navigationIds.has(number)) {
    implementationDomain = 'navigation-and-event-runtime';
    ownerLayers = ['engine-wasm', 'browser'];
    workItems.push('R0-02');
    if ([29, 37, 52].includes(number)) workItems.push('R0-06');
    requirementIds.push(
      [19, 20].includes(number) ? 'RQ-RMK-006' : 'RQ-RMK-002'
    );
    if ([9, 39].includes(number)) requirementIds.push('RQ-RMK-004');
  } else if (parserIds.has(number)) {
    implementationDomain = 'deck-parser-and-form-runtime';
    ownerLayers = ['engine-wasm'];
    workItems.push('R0-04');
    requirementIds.push('RQ-RMK-001');
    if (number === 48) requirementIds.push('RQ-RMK-004');
  } else if (number <= 59) {
    throw new Error(`No implementation mapping rule for SCR item ${number}`);
  } else if (number <= 63) {
    implementationDomain = 'wbxml-encoding-and-validation';
    ownerLayers = ['transport-rust'];
    workItems.push('R0-08');
    requirementIds.push('RQ-RMK-007');
  } else if (number <= 74) {
    implementationDomain = 'wml-document-validation';
    ownerLayers = ['transport-rust', 'engine-wasm'];
    workItems.push('R0-08');
    if ([66, 67, 68, 69, 71, 72, 73, 74].includes(number)) {
      workItems.push('R0-04');
    }
    if ([64, 65, 70].includes(number)) requirementIds.push('RQ-RMK-005');
    else if ([69, 74].includes(number)) requirementIds.push('RQ-RMK-004');
    else requirementIds.push('RQ-RMK-001');
  } else {
    throw new Error(`No implementation mapping rule for SCR item ${number}`);
  }

  if ([8, 47].includes(number)) {
    workItems.push('R0-12');
  }
  if (number === 17) {
    workItems.push('WML-203');
  }
  if (number === 21) {
    workItems.push('WML-304');
  }
  if (number === 25) {
    workItems.push('WML-301');
  }
  if ([33, 41, 43].includes(number)) {
    workItems.push('WML-204', 'WML-308');
  }
  if (number === 48) {
    workItems.push('WML-305');
  }

  return {
    implementationDomain,
    ownerLayers,
    requirementIds: unique(requirementIds),
    workItems: unique(workItems),
    ...implementationAuditFor(row)
  };
}

const rows = [...extracted104Rows, ...extracted105Rows]
  .map((row) => {
    const number = numberOf(row);
    const isSin105 = number === 76;
    const actor = actorFor(number);
    const specificationStatus = row.status === 'M' ? 'mandatory' : 'optional';
    return {
      id: row.id,
      ordinal: number,
      actor,
      feature: featureOverrides.get(row.id) ?? row.feature,
      referencedSection:
        referencedSectionOverrides.get(row.id) ?? row.referencedSection,
      specificationStatus,
      dependencyExpression: row.dependency
        ? { type: 'all-of', scrIds: [row.dependency] }
        : { type: 'none', scrIds: [] },
      sourceAnchor: {
        documentId: isSin105 ? 'WAP-191_105-WML' : 'WAP-191_104-WML',
        staticConformanceSection: sourceSubsection(number),
        changeSection: isSin105 ? '3.3' : null
      },
      disposition: {
        strict:
          row.status === 'M'
            ? 'required-for-claimed-actor'
            : 'declare-implemented-or-deferred',
        classCProfile: classCDisposition(actor, specificationStatus),
        enhancementMayReplaceStrictBehavior: false
      },
      reviewState: 'source-extracted-class-c-applied-mapping-provisional',
      mapping: mappingFor(row)
    };
  })
  .sort((left, right) => left.ordinal - right.ordinal);

const expectedIds = Array.from({ length: 76 }, (_, index) => {
  const number = index + 1;
  const actorPrefix = number >= 60 && number <= 69 ? 'S' : 'C';
  return `WML-${actorPrefix}-${String(number).padStart(2, '0')}`;
});
const actualIds = rows.map((row) => row.id);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  throw new Error(
    `SCR identifier sequence mismatch:\nexpected ${expectedIds.join(', ')}\nactual ${actualIds.join(', ')}`
  );
}

function countsBy(key) {
  const counts = {};
  for (const row of rows) {
    const value = row[key];
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort());
}

const sourceDocuments = requiredSourceIds.map((documentId) => {
  const source = sourceById.get(documentId);
  return {
    documentId,
    filename: source.filename,
    sha256: source.sha256,
    role:
      documentId === 'WAP-191_104-WML'
        ? 'effective-wml-1.3-section-15'
        : 'adds-wml-c-76-and-amends-wml-1.3'
  };
});

const ledger = {
  schemaVersion: 1,
  releaseId: release.release.id,
  family: 'wml',
  target: {
    stack: 'WAP 1.2.1',
    markup: 'WML 1.3',
    classProfile: 'WAP-215 Class C client (CCR-CLASSC-C-001)'
  },
  recordedOn,
  authority: {
    effectiveSequence: wmlFamily.effectiveSequence,
    extractionSources: sourceDocuments,
    classProfileSource: {
      documentId: classConformance.authority.documentId,
      sha256: classConformance.authority.sha256,
      selectedIdentifier: classConformance.selectedTarget.identifier,
      selectedRequirement: 'WML:MCF',
      ledger:
        'spec-processing/source-manifests/wap-1.2.1-class-conformance.json'
    },
    interpretation:
      'WAP-191_104 supplies the effective 75-row WML 1.3 SCR; WAP-191_105 section 3.3 adds WML-C-76. WAP-215 CCR-CLASSC-C-001 selects WML:MCF for the client, making the 39 mandatory WML user-agent rows required. Optional client rows remain declared capabilities, and encoder/server rows are outside this client profile.'
  },
  summary: {
    itemCount: rows.length,
    mandatoryCount: rows.filter(
      (row) => row.specificationStatus === 'mandatory'
    ).length,
    optionalCount: rows.filter(
      (row) => row.specificationStatus === 'optional'
    ).length,
    selectedClassCRequiredCount: rows.filter(
      (row) =>
        row.disposition.classCProfile === 'required-by-class-c-client-mcf'
    ).length,
    selectedClassCOptionalCount: rows.filter(
      (row) =>
        row.disposition.classCProfile ===
        'optional-not-required-by-class-c-client'
    ).length,
    selectedClassCNotApplicableCount: rows.filter(
      (row) =>
        row.disposition.classCProfile ===
        'not-applicable-to-class-c-client'
    ).length,
    byActor: countsBy('actor'),
    byImplementationDomain: Object.fromEntries(
      Object.entries(
        rows.reduce((counts, row) => {
          const domain = row.mapping.implementationDomain;
          counts[domain] = (counts[domain] ?? 0) + 1;
          return counts;
        }, {})
      ).sort()
    ),
    testEvidenceLinkedCount: rows.filter(
      (row) => row.mapping.testEvidence.length > 0
    ).length,
    mandatoryImplementationStatus: Object.fromEntries(
      Object.entries(
        rows
          .filter((row) => row.specificationStatus === 'mandatory')
          .reduce((counts, row) => {
            const status = row.mapping.implementationStatus;
            counts[status] = (counts[status] ?? 0) + 1;
            return counts;
          }, {})
      ).sort()
    )
  },
  obligations: rows
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`);

console.log('==> WAP 1.2.1 / WML 1.3 SCR ledger');
console.log(
  `Wrote ${rows.length} obligations (${ledger.summary.mandatoryCount} M / ${ledger.summary.optionalCount} O) to ${outputPath}`
);
console.log(
  `Applied CCR-CLASSC-C-001: ${ledger.summary.selectedClassCRequiredCount} required / ` +
    `${ledger.summary.selectedClassCOptionalCount} optional / ` +
    `${ledger.summary.selectedClassCNotApplicableCount} not applicable`
);
