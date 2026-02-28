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

function extractLabel(source, fallback) {
  const match = source.match(/<!--\s*label:\s*(.+?)\s*-->/i);
  return match ? match[1].trim() : fallback;
}

function stripLabelComment(source) {
  return source.replace(/^\s*<!--\s*label:\s*.+?\s*-->\s*/i, '');
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
    const label = extractLabel(source, toTitleCase(base));
    records.push({ key, label, wml: stripLabelComment(source) });
  }

  const content = `/* eslint-disable */
// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: host-sample/examples/*.wml

export interface HostExample {
  key: string;
  label: string;
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
