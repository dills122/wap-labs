import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXAMPLES_DIR = path.join(ROOT, 'examples');
const OUTPUT_DIR = path.join(ROOT, '.generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'examples.ts');

function toTitleCase(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function toCamelCase(value) {
  return value.replace(/[-_]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}

function parseIdList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseExampleMetadata(source, filename) {
  const blockMatch = source.match(/^\s*<!--([\s\S]*?)-->/);
  if (!blockMatch) {
    throw new Error(`${filename}: missing metadata comment block at top of file`);
  }

  const lines = blockMatch[1].split(/\r?\n/).map((line) => line.trim());
  let label = '';
  let description = '';
  let goal = '';
  let rawWorkItems = '';
  let rawSpecItems = '';
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

    if (key === 'label') {
      label = value;
      continue;
    }
    if (key === 'description') {
      description = value;
      continue;
    }
    if (key === 'goal') {
      goal = value;
      continue;
    }
    if (key === 'work-items') {
      rawWorkItems = value;
      continue;
    }
    if (key === 'spec-items') {
      rawSpecItems = value;
      continue;
    }
    if (key === 'testing-ac') {
      if (value) {
        testingAc.push(value);
      }
      continue;
    }

    throw new Error(`${filename}: unknown metadata key "${key}"`);
  }

  const workItems = parseIdList(rawWorkItems);
  const specItems = parseIdList(rawSpecItems);
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

async function main() {
  const entries = await fs.readdir(EXAMPLES_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.wml'))
    .map((entry) => entry.name)
    .sort();

  const records = [];
  for (const filename of files) {
    const filepath = path.join(EXAMPLES_DIR, filename);
    const source = await fs.readFile(filepath, 'utf8');
    const base = filename.replace(/\.wml$/i, '');
    const key = toCamelCase(base);
    const fallbackLabel = toTitleCase(base);
    const metadata = parseExampleMetadata(source, filename);
    records.push({
      key,
      label: metadata.label || fallbackLabel,
      description: metadata.description,
      goal: metadata.goal,
      workItems: metadata.workItems,
      specItems: metadata.specItems,
      testingAc: metadata.testingAc,
      wml: metadata.wml
    });
  }

  const content = `/* eslint-disable */
// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: host-sample/examples/*.wml

export interface HostExample {
  key: string;
  label: string;
  description: string;
  goal: string;
  workItems: string[];
  specItems: string[];
  testingAc: string[];
  wml: string;
}

export const EXAMPLES: HostExample[] = ${JSON.stringify(records, null, 2)};
`;

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, content, 'utf8');
  console.log(`generated ${path.relative(ROOT, OUTPUT_FILE)} (${records.length} examples)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
