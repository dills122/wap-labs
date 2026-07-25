import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const HOST_SAMPLE_DIR = path.resolve(SCRIPT_DIR, '..');
const ENGINE_WASM_DIR = path.resolve(HOST_SAMPLE_DIR, '..');
const ROOT = HOST_SAMPLE_DIR;
const DEFAULT_EXAMPLES_DIR = path.join(ENGINE_WASM_DIR, 'examples', 'source');
const DEFAULT_OUTPUT_FILE = path.join(ENGINE_WASM_DIR, 'examples', 'generated', 'examples.ts');
const FLOW_SUFFIX = '.flow.json';
const ID_PATTERN = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;
const STATE_KEYS = new Set([
  'activeCardId',
  'focusedLinkIndex',
  'focusedInputEditName',
  'focusedInputEditValue',
  'focusedSelectEditName',
  'focusedSelectEditValue',
  'externalNavigationIntent',
  'externalNavigationRequestPolicy',
  'lastScriptDialogRequests',
  'lastScriptExecutionOk',
  'lastScriptExecutionTrap',
  'lastScriptRequiresRefresh',
  'nextCardVar'
]);
const SESSION_KEYS = new Set([
  'runMode',
  'navigationStatus',
  'requestedUrl',
  'finalUrl',
  'activeCardId',
  'focusedLinkIndex',
  'externalNavigationIntent',
  'lastError'
]);
const ACTION_TYPES = new Set(['key', 'keyboard', 'type-text', 'back', 'tick', 'clear-intent']);
const KEY_NAMES = new Set(['up', 'down', 'enter']);
const KEYBOARD_NAMES = new Set(['ArrowUp', 'ArrowDown', 'Enter', 'Backspace', 'Escape']);
const STORY_TARGETS = new Set(['host-sample', 'waves-browser']);
const WAVES_RUN_MODES = new Set(['local', 'network']);

function toCamelCase(value) {
  return value.replace(/[-_]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}

function parseIdList(value, filename, field) {
  const ids = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  validateIdList(ids, filename, field, { allowEmpty: true });
  return ids;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireRecord(value, filename, location) {
  if (!isRecord(value)) {
    throw new Error(`${filename}: ${location} must be an object`);
  }
  return value;
}

function validateKeys(record, allowedKeys, filename, location) {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`${filename}: unknown ${location} key "${key}"`);
    }
  }
}

function requireString(value, filename, location) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${filename}: ${location} must be a non-empty string`);
  }
  return value.trim();
}

function validateIdList(ids, filename, field, { allowEmpty = false } = {}) {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
    throw new Error(`${filename}: ${field} must be an array of ids`);
  }
  if (!allowEmpty && ids.length === 0) {
    throw new Error(`${filename}: ${field} needs at least one id`);
  }
  const normalized = ids.map((id) => id.trim());
  for (const id of normalized) {
    if (!ID_PATTERN.test(id)) {
      throw new Error(`${filename}: ${field} contains invalid id "${id}"`);
    }
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${filename}: ${field} contains duplicate ids`);
  }
  return normalized;
}

export function parseExampleMetadata(source, filename) {
  const blockMatch = source.match(/^\s*<!--([\s\S]*?)-->/);
  if (!blockMatch) {
    throw new Error(`${filename}: missing metadata comment block at top of file`);
  }

  const lines = blockMatch[1].split(/\r?\n/).map((line) => line.trim());
  const values = new Map();
  const testingAc = [];
  let currentKey = null;

  for (const line of lines) {
    if (!line) {
      continue;
    }
    if (line.startsWith('- ')) {
      if (currentKey !== 'testing-ac') {
        throw new Error(`${filename}: checklist item provided before testing-ac key`);
      }
      const item = line.slice(2).trim();
      if (item) {
        testingAc.push(item);
      }
      continue;
    }

    const [keyRaw, ...valueParts] = line.split(':');
    if (!keyRaw || valueParts.length === 0) {
      throw new Error(`${filename}: invalid metadata line "${line}"`);
    }

    const key = keyRaw.trim().toLowerCase();
    const value = valueParts.join(':').trim();
    currentKey = key;
    if (!['label', 'description', 'goal', 'work-items', 'spec-items', 'testing-ac'].includes(key)) {
      throw new Error(`${filename}: unknown metadata key "${key}"`);
    }
    if (values.has(key)) {
      throw new Error(`${filename}: duplicate metadata key "${key}"`);
    }
    values.set(key, value);
    if (key === 'testing-ac' && value) {
      testingAc.push(value);
    }
  }

  const label = values.get('label') ?? '';
  const description = values.get('description') ?? '';
  const goal = values.get('goal') ?? '';
  const workItems = parseIdList(values.get('work-items') ?? '', filename, 'work-items');
  const specItems = parseIdList(values.get('spec-items') ?? '', filename, 'spec-items');

  if (!label) {
    throw new Error(`${filename}: metadata field "label" is required`);
  }
  if (!description) {
    throw new Error(`${filename}: metadata field "description" is required`);
  }
  if (!goal) {
    throw new Error(`${filename}: metadata field "goal" is required`);
  }
  if (workItems.length === 0 && specItems.length === 0) {
    throw new Error(`${filename}: provide at least one work-items or spec-items id`);
  }
  if (testingAc.length === 0) {
    throw new Error(`${filename}: metadata field "testing-ac" needs at least one checklist item`);
  }

  const wml = source.slice(blockMatch[0].length).trimStart();
  return { label, description, goal, workItems, specItems, testingAc, wml };
}

function parseExpectedState(value, filename, location) {
  const state = requireRecord(value, filename, location);
  validateKeys(state, STATE_KEYS, filename, location);
  if (Object.keys(state).length === 0) {
    throw new Error(`${filename}: ${location} needs at least one state assertion`);
  }
  for (const [key, expected] of Object.entries(state)) {
    if (key === 'focusedLinkIndex') {
      if (!Number.isInteger(expected) || expected < 0) {
        throw new Error(`${filename}: ${location}.${key} must be a non-negative integer`);
      }
      continue;
    }
    if (key === 'activeCardId') {
      if (typeof expected !== 'string' || !expected) {
        throw new Error(`${filename}: ${location}.${key} must be a non-empty string`);
      }
      continue;
    }
    if (key === 'lastScriptDialogRequests') {
      if (
        !Array.isArray(expected) ||
        expected.some(
          (request) =>
            !request ||
            typeof request !== 'object' ||
            !['alert', 'confirm', 'prompt'].includes(request.type) ||
            typeof request.message !== 'string' ||
            (request.defaultValue !== undefined && typeof request.defaultValue !== 'string')
        )
      ) {
        throw new Error(
          `${filename}: ${location}.${key} must contain valid dialog request objects`
        );
      }
      continue;
    }
    if (key === 'externalNavigationRequestPolicy') {
      if (expected === null) {
        continue;
      }
      const policy = requireRecord(expected, filename, `${location}.${key}`);
      validateKeys(
        policy,
        new Set(['cacheControl', 'refererUrl', 'postContext']),
        filename,
        `${location}.${key}`
      );
      if (
        policy.cacheControl !== undefined &&
        policy.cacheControl !== 'default' &&
        policy.cacheControl !== 'no-cache'
      ) {
        throw new Error(`${filename}: ${location}.${key}.cacheControl must be default or no-cache`);
      }
      if (policy.refererUrl !== undefined && typeof policy.refererUrl !== 'string') {
        throw new Error(`${filename}: ${location}.${key}.refererUrl must be a string`);
      }
      if (policy.postContext !== undefined) {
        const postContext = requireRecord(
          policy.postContext,
          filename,
          `${location}.${key}.postContext`
        );
        validateKeys(
          postContext,
          new Set(['sameDeck', 'contentType', 'payload']),
          filename,
          `${location}.${key}.postContext`
        );
        if (postContext.sameDeck !== undefined && typeof postContext.sameDeck !== 'boolean') {
          throw new Error(`${filename}: ${location}.${key}.postContext.sameDeck must be boolean`);
        }
        for (const field of ['contentType', 'payload']) {
          if (postContext[field] !== undefined && typeof postContext[field] !== 'string') {
            throw new Error(
              `${filename}: ${location}.${key}.postContext.${field} must be a string`
            );
          }
        }
      }
      continue;
    }
    if (key === 'lastScriptExecutionOk' || key === 'lastScriptRequiresRefresh') {
      if (expected !== null && typeof expected !== 'boolean') {
        throw new Error(`${filename}: ${location}.${key} must be a boolean or null`);
      }
      continue;
    }
    if (expected !== null && typeof expected !== 'string') {
      throw new Error(`${filename}: ${location}.${key} must be a string or null`);
    }
  }
  return state;
}

function parseExpectedSession(value, filename, location) {
  const session = requireRecord(value, filename, location);
  validateKeys(session, SESSION_KEYS, filename, location);
  if (Object.keys(session).length === 0) {
    throw new Error(`${filename}: ${location} needs at least one session assertion`);
  }
  for (const [key, expected] of Object.entries(session)) {
    if (key === 'focusedLinkIndex') {
      if (!Number.isInteger(expected) || expected < 0) {
        throw new Error(`${filename}: ${location}.${key} must be a non-negative integer`);
      }
      continue;
    }
    if (expected !== null && typeof expected !== 'string') {
      throw new Error(`${filename}: ${location}.${key} must be a string or null`);
    }
  }
  return session;
}

function parseRenderExpectation(value, filename, location) {
  const render = requireRecord(value, filename, location);
  validateKeys(render, new Set(['textIncludes']), filename, location);
  if (
    !Array.isArray(render.textIncludes) ||
    render.textIncludes.length === 0 ||
    render.textIncludes.some((text) => typeof text !== 'string' || !text)
  ) {
    throw new Error(`${filename}: ${location}.textIncludes must be non-empty strings`);
  }
  return { textIncludes: render.textIncludes };
}

function parseExpectation(value, filename, location) {
  const expectation = requireRecord(value, filename, location);
  validateKeys(
    expectation,
    new Set(['state', 'traceKinds', 'session', 'statusIncludes', 'render']),
    filename,
    location
  );
  const state = parseExpectedState(expectation.state, filename, `${location}.state`);
  const parsed = { state };
  let traceKinds;
  if (expectation.traceKinds !== undefined) {
    if (
      !Array.isArray(expectation.traceKinds) ||
      expectation.traceKinds.length === 0 ||
      expectation.traceKinds.some((kind) => typeof kind !== 'string' || !kind.trim())
    ) {
      throw new Error(`${filename}: ${location}.traceKinds must be non-empty trace kind strings`);
    }
    traceKinds = expectation.traceKinds.map((kind) => kind.trim());
    parsed.traceKinds = traceKinds;
  }
  if (expectation.session !== undefined) {
    parsed.session = parseExpectedSession(expectation.session, filename, `${location}.session`);
  }
  if (expectation.statusIncludes !== undefined) {
    parsed.statusIncludes = requireString(
      expectation.statusIncludes,
      filename,
      `${location}.statusIncludes`
    );
  }
  if (expectation.render !== undefined) {
    parsed.render = parseRenderExpectation(expectation.render, filename, `${location}.render`);
  }
  return parsed;
}

function parseAction(value, filename, location) {
  const action = requireRecord(value, filename, location);
  validateKeys(action, new Set(['type', 'key', 'ms', 'text']), filename, location);
  if (!ACTION_TYPES.has(action.type)) {
    throw new Error(`${filename}: ${location}.type has unknown action "${String(action.type)}"`);
  }

  if (action.type === 'key') {
    if (!KEY_NAMES.has(action.key)) {
      throw new Error(`${filename}: ${location}.key must be up, down, or enter`);
    }
    if (action.ms !== undefined || action.text !== undefined) {
      throw new Error(`${filename}: ${location} key actions only accept type and key`);
    }
    return { type: action.type, key: action.key };
  }

  if (action.type === 'keyboard') {
    if (!KEYBOARD_NAMES.has(action.key)) {
      throw new Error(
        `${filename}: ${location}.key must be ArrowUp, ArrowDown, Enter, Backspace, or Escape`
      );
    }
    if (action.ms !== undefined || action.text !== undefined) {
      throw new Error(`${filename}: ${location} keyboard actions only accept type and key`);
    }
    return { type: action.type, key: action.key };
  }

  if (action.type === 'type-text') {
    const text = requireString(action.text, filename, `${location}.text`);
    if (action.key !== undefined || action.ms !== undefined) {
      throw new Error(`${filename}: ${location} type-text actions only accept type and text`);
    }
    return { type: action.type, text };
  }

  if (action.key !== undefined || action.text !== undefined) {
    throw new Error(`${filename}: ${location} only key/keyboard/type-text actions accept input`);
  }
  if (action.type === 'tick') {
    if (action.ms !== 100 && action.ms !== 1000) {
      throw new Error(`${filename}: ${location}.ms must match a host tick control (100 or 1000)`);
    }
    return { type: action.type, ms: action.ms };
  }
  if (action.ms !== undefined) {
    throw new Error(`${filename}: ${location}.ms is only valid for tick actions`);
  }
  return { type: action.type };
}

function parseStorySetup(value, target, filename, location) {
  if (value === undefined) {
    return undefined;
  }
  const setup = requireRecord(value, filename, location);
  validateKeys(setup, new Set(['runMode']), filename, location);
  if (target !== 'waves-browser') {
    throw new Error(`${filename}: ${location} is only valid for waves-browser flows`);
  }
  if (!WAVES_RUN_MODES.has(setup.runMode)) {
    throw new Error(`${filename}: ${location}.runMode must be local or network`);
  }
  return { runMode: setup.runMode };
}

export function parseExecutableFlow(source, filename, expectedExampleKey) {
  let raw;
  try {
    raw = JSON.parse(source);
  } catch (error) {
    throw new Error(`${filename}: invalid JSON (${error.message})`);
  }
  const document = requireRecord(raw, filename, 'flow document');
  validateKeys(document, new Set(['version', 'example', 'flows']), filename, 'flow document');
  if (document.version !== 1) {
    throw new Error(`${filename}: version must be 1`);
  }
  const example = requireString(document.example, filename, 'example');
  if (example !== expectedExampleKey) {
    throw new Error(
      `${filename}: example "${example}" does not match companion example "${expectedExampleKey}"`
    );
  }
  if (!Array.isArray(document.flows) || document.flows.length === 0) {
    throw new Error(`${filename}: flows needs at least one executable flow`);
  }

  const seenFlowIds = new Set();
  const flows = document.flows.map((rawFlow, flowIndex) => {
    const location = `flows[${flowIndex}]`;
    const flow = requireRecord(rawFlow, filename, location);
    validateKeys(
      flow,
      new Set(['id', 'title', 'target', 'setup', 'workItems', 'specItems', 'initial', 'steps']),
      filename,
      location
    );
    const id = requireString(flow.id, filename, `${location}.id`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`${filename}: ${location}.id must be lower-kebab-case`);
    }
    if (seenFlowIds.has(id)) {
      throw new Error(`${filename}: duplicate flow id "${id}"`);
    }
    seenFlowIds.add(id);
    const title = requireString(flow.title, filename, `${location}.title`);
    const target = flow.target ?? 'host-sample';
    if (!STORY_TARGETS.has(target)) {
      throw new Error(`${filename}: ${location}.target must be host-sample or waves-browser`);
    }
    const setup = parseStorySetup(flow.setup, target, filename, `${location}.setup`);
    const workItems = validateIdList(flow.workItems, filename, `${location}.workItems`);
    const specItems = validateIdList(flow.specItems, filename, `${location}.specItems`);
    const initial = parseExpectation(flow.initial, filename, `${location}.initial`);
    if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
      throw new Error(`${filename}: ${location}.steps needs at least one step`);
    }
    const steps = flow.steps.map((rawStep, stepIndex) => {
      const stepLocation = `${location}.steps[${stepIndex}]`;
      const step = requireRecord(rawStep, filename, stepLocation);
      validateKeys(step, new Set(['action', 'expect']), filename, stepLocation);
      return {
        action: parseAction(step.action, filename, `${stepLocation}.action`),
        expect: parseExpectation(step.expect, filename, `${stepLocation}.expect`)
      };
    });
    return { id, title, target, ...(setup ? { setup } : {}), workItems, specItems, initial, steps };
  });

  return { version: 1, example, flows };
}

function assertExactCoverage(flowDocument, metadata, filename) {
  const mappedWorkItems = new Set(flowDocument.flows.flatMap((flow) => flow.workItems));
  const mappedSpecItems = new Set(flowDocument.flows.flatMap((flow) => flow.specItems));
  const checks = [
    ['work item', metadata.workItems, mappedWorkItems],
    ['spec item', metadata.specItems, mappedSpecItems]
  ];

  for (const [label, metadataIds, mappedIds] of checks) {
    const unknown = [...mappedIds].filter((id) => !metadataIds.includes(id));
    if (unknown.length > 0) {
      throw new Error(`${filename}: flow maps unknown ${label}(s): ${unknown.join(', ')}`);
    }
    const missing = metadataIds.filter((id) => !mappedIds.has(id));
    if (missing.length > 0) {
      throw new Error(`${filename}: flow is missing ${label} mapping(s): ${missing.join(', ')}`);
    }
  }
}

export async function loadExampleRecords({ examplesDir = DEFAULT_EXAMPLES_DIR } = {}) {
  const entries = await fs.readdir(examplesDir, { withFileTypes: true });
  const wmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.wml'))
    .map((entry) => entry.name)
    .sort();
  const flowFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(FLOW_SUFFIX))
    .map((entry) => entry.name)
    .sort();
  const wmlBases = new Set(wmlFiles.map((filename) => filename.replace(/\.wml$/i, '')));

  for (const flowFilename of flowFiles) {
    const base = flowFilename.slice(0, -FLOW_SUFFIX.length);
    if (!wmlBases.has(base)) {
      throw new Error(`${flowFilename}: executable flow references unknown example "${base}"`);
    }
  }

  const records = [];
  for (const filename of wmlFiles) {
    const filepath = path.join(examplesDir, filename);
    const source = await fs.readFile(filepath, 'utf8');
    const base = filename.replace(/\.wml$/i, '');
    const key = toCamelCase(base);
    const metadata = parseExampleMetadata(source, filename);
    const flowFilename = `${base}${FLOW_SUFFIX}`;
    let flows;
    try {
      const flowSource = await fs.readFile(path.join(examplesDir, flowFilename), 'utf8');
      const flowDocument = parseExecutableFlow(flowSource, flowFilename, key);
      assertExactCoverage(flowDocument, metadata, flowFilename);
      flows = flowDocument.flows;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    records.push({
      key,
      label: metadata.label,
      description: metadata.description,
      goal: metadata.goal,
      workItems: metadata.workItems,
      specItems: metadata.specItems,
      testingAc: metadata.testingAc,
      ...(flows ? { flows } : {}),
      wml: metadata.wml
    });
  }
  return records;
}

export function renderManifest(records) {
  return `/* eslint-disable */
// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Sources: engine-wasm/examples/source/*.wml and optional *.flow.json companions

export interface StoryStateExpectation {
  activeCardId?: string;
  focusedLinkIndex?: number;
  focusedInputEditName?: string | null;
  focusedInputEditValue?: string | null;
  focusedSelectEditName?: string | null;
  focusedSelectEditValue?: string | null;
  externalNavigationIntent?: string | null;
  externalNavigationRequestPolicy?: {
    cacheControl?: 'default' | 'no-cache';
    refererUrl?: string;
    postContext?: { sameDeck?: boolean; contentType?: string; payload?: string };
  } | null;
  lastScriptDialogRequests?: Array<
    | { type: 'alert'; message: string }
    | { type: 'confirm'; message: string }
    | { type: 'prompt'; message: string; defaultValue?: string }
  >;
  lastScriptExecutionOk?: boolean | null;
  lastScriptExecutionTrap?: string | null;
  lastScriptRequiresRefresh?: boolean | null;
  nextCardVar?: string | null;
}

export interface StorySessionExpectation {
  runMode?: 'local' | 'network';
  navigationStatus?: string;
  requestedUrl?: string | null;
  finalUrl?: string | null;
  activeCardId?: string | null;
  focusedLinkIndex?: number;
  externalNavigationIntent?: string | null;
  lastError?: string | null;
}

export interface StoryExpectation {
  state: StoryStateExpectation;
  traceKinds?: string[];
  session?: StorySessionExpectation;
  statusIncludes?: string;
  render?: { textIncludes: string[] };
}

export type StoryAction =
  | { type: 'key'; key: 'up' | 'down' | 'enter' }
  | { type: 'keyboard'; key: 'ArrowUp' | 'ArrowDown' | 'Enter' | 'Backspace' | 'Escape' }
  | { type: 'type-text'; text: string }
  | { type: 'back' }
  | { type: 'tick'; ms: 100 | 1000 }
  | { type: 'clear-intent' };

export interface StoryStep {
  action: StoryAction;
  expect: StoryExpectation;
}

export interface ExecutableStoryFlow {
  id: string;
  title: string;
  target: 'host-sample' | 'waves-browser';
  setup?: { runMode: 'local' | 'network' };
  workItems: string[];
  specItems: string[];
  initial: StoryExpectation;
  steps: StoryStep[];
}

export interface HostExample {
  key: string;
  label: string;
  description: string;
  goal: string;
  workItems: string[];
  specItems: string[];
  testingAc: string[];
  flows?: ExecutableStoryFlow[];
  wml: string;
}

export const EXAMPLES: HostExample[] = ${JSON.stringify(records, null, 2)};
`;
}

export async function generateExamples({
  examplesDir = DEFAULT_EXAMPLES_DIR,
  outputFile = DEFAULT_OUTPUT_FILE,
  check = false
} = {}) {
  const records = await loadExampleRecords({ examplesDir });
  const content = renderManifest(records);
  if (check) {
    let current;
    try {
      current = await fs.readFile(outputFile, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`${path.relative(ROOT, outputFile)} is missing; run examples:generate`);
      }
      throw error;
    }
    if (current !== content) {
      throw new Error(
        `${path.relative(ROOT, outputFile)} is stale; run pnpm --dir engine-wasm/host-sample run examples:generate`
      );
    }
    console.log(`validated ${path.relative(ROOT, outputFile)} (${records.length} examples)`);
    return records;
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, content, 'utf8');
  console.log(`generated ${path.relative(ROOT, outputFile)} (${records.length} examples)`);
  return records;
}

async function main() {
  const unknownArgs = process.argv.slice(2).filter((arg) => arg !== '--check');
  if (unknownArgs.length > 0) {
    throw new Error(`unknown argument(s): ${unknownArgs.join(', ')}`);
  }
  await generateExamples({ check: process.argv.includes('--check') });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
