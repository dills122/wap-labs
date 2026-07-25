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
  'externalNavigationIntent',
  'nextCardVar'
]);
const ACTION_TYPES = new Set(['key', 'back', 'tick', 'clear-intent']);
const KEY_NAMES = new Set(['up', 'down', 'enter']);

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
    if (expected !== null && typeof expected !== 'string') {
      throw new Error(`${filename}: ${location}.${key} must be a string or null`);
    }
  }
  return state;
}

function parseExpectation(value, filename, location) {
  const expectation = requireRecord(value, filename, location);
  validateKeys(expectation, new Set(['state', 'traceKinds']), filename, location);
  const state = parseExpectedState(expectation.state, filename, `${location}.state`);
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
  }
  return traceKinds ? { state, traceKinds } : { state };
}

function parseAction(value, filename, location) {
  const action = requireRecord(value, filename, location);
  validateKeys(action, new Set(['type', 'key', 'ms']), filename, location);
  if (!ACTION_TYPES.has(action.type)) {
    throw new Error(`${filename}: ${location}.type has unknown action "${String(action.type)}"`);
  }

  if (action.type === 'key') {
    if (!KEY_NAMES.has(action.key)) {
      throw new Error(`${filename}: ${location}.key must be up, down, or enter`);
    }
    if (action.ms !== undefined) {
      throw new Error(`${filename}: ${location}.ms is only valid for tick actions`);
    }
    return { type: action.type, key: action.key };
  }

  if (action.key !== undefined) {
    throw new Error(`${filename}: ${location}.key is only valid for key actions`);
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
      new Set(['id', 'title', 'workItems', 'specItems', 'initial', 'steps']),
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
    return { id, title, workItems, specItems, initial, steps };
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
  externalNavigationIntent?: string | null;
  nextCardVar?: string | null;
}

export interface StoryExpectation {
  state: StoryStateExpectation;
  traceKinds?: string[];
}

export type StoryAction =
  | { type: 'key'; key: 'up' | 'down' | 'enter' }
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
