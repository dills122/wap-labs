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
const statementStart = wmlText.indexOf('15. Static Conformance Statement');
if (statementStart === -1) {
  throw new Error('WAP-191_104 text does not contain section 15');
}

const rowPattern =
  /^\s*(WML-[CS]-\d{2})\s+(.+?)\s+(\d+(?:\.\d+)*)\s+([MO])(?:\s+(WML-[CS]-\d{2}))?\s*$/gm;

function extractRows(text) {
  return [...text.matchAll(rowPattern)].map((match) => ({
    id: match[1],
    feature: match[2].replace(/\s+/g, ' ').trim(),
    referencedSection: match[3],
    status: match[4],
    dependency: match[5] ?? null
  }));
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
      status: 'missing',
      note:
        'The parser does not retain template-level event bindings or perform card/deck task shadowing.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-09': {
      status: 'partial',
      note:
        'onenterforward, onenterbackward, and ontimer execute, but the full intrinsic-event model and binding rules are incomplete.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'parse_onevent_action_xml'
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
        'Runtime variables and input/select commits exist, but general PCDATA, vdata, HREF, conversion, escaping, and undefined-value substitution are incomplete.',
      implementationEvidence: [
        codeEvidence('engine-wasm/engine/src/engine_public_api.rs', 'set_var')
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'focused_input_edit_commit_updates_render_and_runtime_var'
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
      status: 'partial',
      note:
        'Parsing and task failures are surfaced deterministically with rollback in covered paths, but all WML-defined error conditions are not enforced.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'navigate_to_card_internal'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'fixture_accept_failure_rolls_back_and_trace_order_is_deterministic'
        )
      ]
    },
    'WML-C-17': {
      status: 'partial',
      note:
        'Unknown wrappers are ignored while inline child content is retained, but alternate-DTD policy and all card-level fallback cases are not fully asserted.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'map_inline_nodes_recursive'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'helper_parse_inline_nodes_parses_text_links_break_and_unknown_wrappers'
        )
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
      status: 'missing',
      note:
        'The access element is not retained and no deck access-control policy is enforced.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-24': {
      status: 'partial',
      note:
        'Card-level br emits a break, while inline br currently collapses to a space and therefore does not yet satisfy all hard-line-break behavior.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'map_card_level_nodes'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'helper_parse_card_nodes_parses_mixed_content_paths'
        )
      ]
    },
    'WML-C-25': {
      status: 'partial',
      note:
        'Card identity, ordering, and content are parsed; mandatory card attributes and lifecycle semantics are only partially retained.',
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
        'accept do tasks execute, but the full do type/name/label/optional/template precedence model is not implemented.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'parse_do_accept_action_xml'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'enter_triggers_accept_do_action_when_no_links_exist'
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
      status: 'missing',
      note:
        'The head element and its metadata/access contents are not retained in the runtime deck.',
      implementationEvidence: [],
      testEvidence: []
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
        'Text/password input, value commit, and maxlength exist; format, emptyok, size, tabindex, and full initialization/validation semantics remain incomplete.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'parse_input_inline_node'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'focused_input_edit_commit_updates_render_and_runtime_var'
        )
      ]
    },
    'WML-C-35': {
      status: 'implemented',
      note:
        'Noop is parsed as a task action and performs no navigation or state mutation beyond deterministic tracing.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/navigation.rs',
          'CardTaskAction::Noop'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'enter_accept_noop_action_keeps_current_card_and_history'
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
        'Three card intrinsic onevent bindings parse and execute; conflict, template, shadowing, and complete event rules are absent.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/actions.rs',
          'parse_onevent_action_xml'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'navigate_runs_onenterforward_action'
        )
      ]
    },
    'WML-C-41': {
      status: 'partial',
      note:
        'Option label/value/selected state is represented, while onpick, title, xml:lang, and full selection initialization rules are incomplete.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'parse_select_inline_node'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'select_control_renders_default_selected_option'
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
        'Single-choice selection and variable commit exist; multiple, iname/ivalue, tabindex, and complete initialization semantics are absent.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/nodes.rs',
          'parse_select_inline_node'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/navigation_metadata.rs',
          'focused_select_edit_cycle_commit_updates_render_and_runtime_var'
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
      status: 'missing',
      note:
        'Template content, event inheritance, and card-level shadowing are not represented.',
      implementationEvidence: [],
      testEvidence: []
    },
    'WML-C-48': {
      status: 'partial',
      note:
        'Card timer parsing, lifecycle, expiry, refresh, and rollback paths exist; variable-bound timer value and all specification edge behavior are not closed.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/engine_runtime_internal/timers.rs',
          'advance_time_ms_internal'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/engine_tests/actions_timers.rs',
          'timer_non_zero_expires_after_deterministic_advance'
        )
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
        'The parser requires a wml root and constructs the ordered deck from its card children.',
      implementationEvidence: [
        codeEvidence(
          'engine-wasm/engine/src/parser/wml_parser/mod.rs',
          'parse_wml'
        )
      ],
      testEvidence: [
        engineTest(
          'engine-wasm/engine/src/parser/wml_parser/tests.rs',
          'rejects_document_without_wml_root'
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
      referencedSection: row.referencedSection,
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
